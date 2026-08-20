"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import {
  AutomationNetworkSceneController,
  type AutomationNetworkFrameState,
} from "@/components/automation-network/scene-controller";
import { markPhaseTransition } from "@/components/automation-network/dev-perf-marks";
import {
  isHoverPhaseActive,
  sampleIntroRevealT,
  sampleCanvasDissolveT,
  sampleEnterCoreT,
} from "@/components/automation-network/timeline";
import { Lightfall } from "@/components/effects/lightfall";
import { cn } from "@/lib/utils";

const HEADER_ELEMENT_ID = "site-header";

const WORKFLOW_STEP_INTERVAL_MS = 1100;
const DETAIL_CARD_OFFSET_Y = 54;

const DOM_SYNC_OPACITY_EPSILON = 0.004;
const DOM_SYNC_POSITION_EPSILON_PX = 0.4;

// Mirrors the Three.js renderer's own late-ENTER-CORE DPR tiers (see
// scene-controller.ts) — the dim Lightfall is a second fullscreen WebGL
// canvas rendering in parallel behind the Core the whole time, so cutting
// its resolution in the same window cuts real parallel GPU work instead of
// leaving it running at full cost while the Core close-up dominates the
// screen. Discrete tiers (not a continuous curve) so the drawing buffer is
// only reallocated on an actual quality change, never per frame.
const LIGHTFALL_DPR_TIER1_THRESHOLD = 0.72;
const LIGHTFALL_DPR_TIER1_SCALE = 0.92;
const LIGHTFALL_DPR_TIER2_THRESHOLD = 0.82;
const LIGHTFALL_DPR_TIER2_SCALE = 0.85;

interface DomSyncCache {
  labelX: Record<string, number>;
  labelY: Record<string, number>;
  labelOpacity: Record<string, number>;
  actionOpacity: Record<string, number>;
  processingOpacity: number[];
  completeOpacity: number | null;
  canvasOpacity: number | null;
  cardX: number | null;
  cardY: number | null;
  cardOpacity: number | null;
}

function createDomSyncCache(): DomSyncCache {
  return {
    labelX: {},
    labelY: {},
    labelOpacity: {},
    actionOpacity: {},
    processingOpacity: [],
    completeOpacity: null,
    canvasOpacity: null,
    cardX: null,
    cardY: null,
    cardOpacity: null,
  };
}

function changed(previous: number | null | undefined, next: number, epsilon: number): boolean {
  return previous == null || Math.abs(previous - next) > epsilon;
}

export interface AutomationNetworkNodeContent {
  id: string;
  label: string;
  actionStatus?: string;
  workflowSteps: string[];
}

export interface AutomationNetworkSceneProps {
  progress: MotionValue<number>;
  nodes: AutomationNetworkNodeContent[];
  processingStatuses: string[];
  completeMessage: string;
  exploreHint: { title: string; subtitle: string; mobileSubtitle: string };
  intro: { headline: string; subline: string; hint: string };
  isMobile?: boolean;
  className?: string;
  onRevealChange?: (revealed: boolean) => void;
  onPreparedChange?: (prepared: boolean) => void;
}

function WorkflowStepsLoop({ steps, reduceMotion }: { steps: string[]; reduceMotion: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || steps.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % steps.length);
    }, WORKFLOW_STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reduceMotion, steps.length]);

  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const active = i === activeIndex;
        const passed = i < activeIndex;
        const lit = active || passed;
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex flex-col">
            <div className="flex items-center gap-2 transition-opacity duration-300" style={{ opacity: active ? 1 : lit ? 0.7 : 0.4 }}>
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300"
                style={{ backgroundColor: lit ? "var(--color-accent)" : "var(--color-fg-muted)" }}
              />
              <span className={active ? "text-fg" : "text-fg-muted"}>{step}</span>
            </div>
            {!isLast ? (
              <span
                aria-hidden
                className="ml-[2.5px] h-2 w-px transition-colors duration-300"
                style={{ backgroundColor: passed ? "var(--color-accent)" : "var(--color-border)" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AutomationNetworkScene({
  progress,
  nodes,
  processingStatuses,
  completeMessage,
  exploreHint,
  intro,
  isMobile = false,
  className,
  onRevealChange,
  onPreparedChange,
}: AutomationNetworkSceneProps) {
  const reduce = useReducedMotion();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const actionStatusRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const processingStatusRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const completeRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AutomationNetworkSceneController | null>(null);
  const domSyncCacheRef = useRef<DomSyncCache>(createDomSyncCache());

  const dimLightfallWrapRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const revealedRef = useRef(false);
  const preparedRef = useRef(false);

  // The dim Lightfall's own IntersectionObserver only tracks geometric
  // visibility — this sticky panel stays "intersecting" long after the
  // canvas has faded to opacity 0, so without an explicit gate it would
  // keep paying for its full shader every frame on Hero. Driven from
  // onFrame's canvasDissolveT (the controller's damped progress), not raw
  // scroll, so it never cuts the fade-out short.
  const [lightfallActive, setLightfallActive] = useState(true);
  const lightfallActiveRef = useRef(true);

  const [lightfallDprScale, setLightfallDprScale] = useState(1);
  const lightfallDprScaleRef = useRef(1);

  const hoveredNodeIdRef = useRef<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverEligible, setHoverEligible] = useState(false);
  const hoverEligibleRef = useRef(false);

  const introContentRef = useRef<HTMLDivElement | null>(null);
  const introHintRef = useRef<HTMLDivElement | null>(null);
  const headerElRef = useRef<HTMLElement | null>(null);

  const introRevealCacheRef = useRef<number | null>(null);

  function applyIntroStyles(v: number) {
    const revealT = sampleIntroRevealT(v);
    if (!changed(introRevealCacheRef.current, revealT, DOM_SYNC_OPACITY_EPSILON)) return;
    introRevealCacheRef.current = revealT;
    const introOpacity = 1 - revealT;
    if (introContentRef.current) {
      introContentRef.current.style.opacity = String(introOpacity);
      introContentRef.current.style.filter = reduce ? "none" : `blur(${revealT * 10}px)`;
      introContentRef.current.style.transform = reduce ? "none" : `translate3d(0, ${-revealT * 24}px, 0)`;
    }
    if (introHintRef.current) {
      introHintRef.current.style.opacity = String(introOpacity);
      introHintRef.current.style.transform = reduce ? "none" : `translate3d(0, ${revealT * 12}px, 0)`;
    }
    if (headerElRef.current) {
      headerElRef.current.style.opacity = String(revealT);
      headerElRef.current.style.pointerEvents = revealT > 0.5 ? "auto" : "none";
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    domSyncCacheRef.current = createDomSyncCache();
    const controller = new AutomationNetworkSceneController(container, {
      nodes,
      reduceMotion: !!reduce,
      onFrame: (state: AutomationNetworkFrameState) => {
        const cache = domSyncCacheRef.current;
        const activeId = hoveredNodeIdRef.current;
        const dimOthers = isMobile && activeId != null;
        state.labels.forEach((p) => {
          const el = labelRefs.current[p.id];
          if (!el) return;
          const dim = dimOthers && activeId !== p.id ? 0.35 : 1;
          const opacity = p.opacity * dim;
          if (changed(cache.labelX[p.id], p.x, DOM_SYNC_POSITION_EPSILON_PX) || changed(cache.labelY[p.id], p.y, DOM_SYNC_POSITION_EPSILON_PX)) {
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
            cache.labelX[p.id] = p.x;
            cache.labelY[p.id] = p.y;
          }
          if (changed(cache.labelOpacity[p.id], opacity, DOM_SYNC_OPACITY_EPSILON)) {
            el.style.opacity = String(opacity);
            cache.labelOpacity[p.id] = opacity;
          }
        });
        Object.entries(state.actionStatusOpacities).forEach(([nodeId, opacity]) => {
          const el = actionStatusRefs.current[nodeId];
          if (!el || !changed(cache.actionOpacity[nodeId], opacity, DOM_SYNC_OPACITY_EPSILON)) return;
          el.style.opacity = String(opacity);
          cache.actionOpacity[nodeId] = opacity;
        });
        state.processingStatusOpacities.forEach((opacity, i) => {
          const el = processingStatusRefs.current[i];
          if (!el || !changed(cache.processingOpacity[i], opacity, DOM_SYNC_OPACITY_EPSILON)) return;
          el.style.opacity = String(opacity);
          cache.processingOpacity[i] = opacity;
        });
        if (completeRef.current && changed(cache.completeOpacity, state.completeOpacity, DOM_SYNC_OPACITY_EPSILON)) {
          completeRef.current.style.opacity = String(state.completeOpacity);
          cache.completeOpacity = state.completeOpacity;
        }

        const canvasOpacity = 1 - state.canvasDissolveT;
        if (changed(cache.canvasOpacity, canvasOpacity, DOM_SYNC_OPACITY_EPSILON)) {
          const canvasOpacityStr = String(canvasOpacity);
          if (containerRef.current) containerRef.current.style.opacity = canvasOpacityStr;
          if (dimLightfallWrapRef.current) dimLightfallWrapRef.current.style.opacity = canvasOpacityStr;
          if (backdropRef.current) backdropRef.current.style.opacity = canvasOpacityStr;
          cache.canvasOpacity = canvasOpacity;
        }

        const shouldLightfallBeActive = state.canvasDissolveT < 1;
        if (shouldLightfallBeActive !== lightfallActiveRef.current) {
          lightfallActiveRef.current = shouldLightfallBeActive;
          setLightfallActive(shouldLightfallBeActive);
        }

        // Hero's own entrance animation + interactivity must start exactly
        // when the 3D scene actually starts becoming transparent — not on
        // raw scroll, which (via PROGRESS_SMOOTHING_TIME_CONSTANT damping in
        // the controller) reaches this threshold measurably earlier than the
        // rendered canvasDissolveT does. Reusing that same signal here (as
        // shouldLightfallBeActive does above) keeps every reveal-adjacent
        // effect on one consistent, already-rendered progress value.
        const revealed = state.canvasDissolveT > 0;
        markPhaseTransition("hero-reveal", revealed);
        if (revealed !== revealedRef.current) {
          revealedRef.current = revealed;
          onRevealChange?.(revealed);
        }

        // Fires a bit before `revealed` (see isHeroPrepared in timeline.ts),
        // while canvasDissolveT is still exactly 0 and the opaque backdrop
        // still fully covers Hero — lets Hero prepare its compositor layers
        // ahead of the visible entrance without playing any of it early.
        const prepared = state.heroPrepared;
        markPhaseTransition("hero-prepared", prepared);
        if (prepared !== preparedRef.current) {
          preparedRef.current = prepared;
          onPreparedChange?.(prepared);
        }

        const hoveredId = hoveredNodeIdRef.current;
        if (hoveredId && cardRef.current) {
          const hoveredLabel = state.labels.find((p) => p.id === hoveredId);
          if (hoveredLabel) {
            const cardY = hoveredLabel.y + DETAIL_CARD_OFFSET_Y;
            if (changed(cache.cardX, hoveredLabel.x, DOM_SYNC_POSITION_EPSILON_PX) || changed(cache.cardY, cardY, DOM_SYNC_POSITION_EPSILON_PX)) {
              cardRef.current.style.transform = `translate3d(${hoveredLabel.x}px, ${cardY}px, 0)`;
              cache.cardX = hoveredLabel.x;
              cache.cardY = cardY;
            }
            if (changed(cache.cardOpacity, hoveredLabel.opacity, DOM_SYNC_OPACITY_EPSILON)) {
              cardRef.current.style.opacity = String(hoveredLabel.opacity);
              cache.cardOpacity = hoveredLabel.opacity;
            }
          }
        }
      },
    });
    controllerRef.current = controller;

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? controller.start() : controller.stop()),
        { threshold: 0 },
      );
      observer.observe(container);
    } else {
      controller.start();
    }

    return () => {
      observer?.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, isMobile]);

  useMotionValueEvent(progress, "change", (v) => {
    // Eager, cheap (start() no-ops if already running) wake-up: reverse
    // scroll off Hero must resume the scene immediately, not wait for the
    // damped canvasDissolveT to confirm it — that confirmation is only safe
    // to gate the *stop* decision (see renderFrame's self-stop), not resume.
    if (sampleCanvasDissolveT(v) < 1) controllerRef.current?.start();
    controllerRef.current?.setProgress(v);
    applyIntroStyles(v);
    const enterCoreT = sampleEnterCoreT(v);
    const dprScale =
      enterCoreT >= LIGHTFALL_DPR_TIER2_THRESHOLD
        ? LIGHTFALL_DPR_TIER2_SCALE
        : enterCoreT >= LIGHTFALL_DPR_TIER1_THRESHOLD
          ? LIGHTFALL_DPR_TIER1_SCALE
          : 1;
    if (dprScale !== lightfallDprScaleRef.current) {
      lightfallDprScaleRef.current = dprScale;
      setLightfallDprScale(dprScale);
    }
    const eligible = isHoverPhaseActive(v);
    if (eligible !== hoverEligibleRef.current) {
      hoverEligibleRef.current = eligible;
      setHoverEligible(eligible);
    }
  });

  useEffect(() => {
    headerElRef.current = document.getElementById(HEADER_ELEMENT_ID) as HTMLElement | null;
    applyIntroStyles(progress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useEffect(() => {
    if (hoverEligible || !hoveredNodeIdRef.current) return;
    hoveredNodeIdRef.current = null;
    setHoveredNodeId(null);
    controllerRef.current?.setHoveredNode(null);
  }, [hoverEligible]);

  function handleHoverEnter(id: string) {
    hoveredNodeIdRef.current = id;
    setHoveredNodeId(id);
    controllerRef.current?.setHoveredNode(id);
  }

  function handleHoverLeave(id: string) {
    if (hoveredNodeIdRef.current !== id) return;
    hoveredNodeIdRef.current = null;
    setHoveredNodeId(null);
    controllerRef.current?.setHoveredNode(null);
  }

  function setActiveNode(id: string | null) {
    hoveredNodeIdRef.current = id;
    setHoveredNodeId(id);
    controllerRef.current?.setHoveredNode(id);
  }

  function handleTap(id: string) {
    setActiveNode(hoveredNodeIdRef.current === id ? null : id);
  }

  useEffect(() => {
    if (!isMobile || !hoveredNodeId) return;
    function handlePointerDownOutside(event: PointerEvent) {
      const target = event.target as Node | null;
      const insideLabel = Object.values(labelRefs.current).some((el) => el?.contains(target));
      if (!insideLabel) setActiveNode(null);
    }
    window.addEventListener("pointerdown", handlePointerDownOutside);
    return () => window.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isMobile, hoveredNodeId]);

  const hoveredNode = hoveredNodeId ? nodes.find((n) => n.id === hoveredNodeId) : undefined;

  return (
    <div className={cn("pointer-events-none", className)}>
      <div ref={backdropRef} className="pointer-events-none absolute inset-0 bg-bg" />

      <div ref={dimLightfallWrapRef} className="pointer-events-none absolute inset-0">
        <Lightfall
          className="absolute inset-0"
          opacity={isMobile ? 0.2 : 0.32}
          glow={isMobile ? 0.16 : 0.26}
          backgroundGlow={isMobile ? 0.03 : 0.05}
          active={lightfallActive}
          dprScale={lightfallDprScale}
        />
      </div>

      <div ref={containerRef} className="pointer-events-none absolute inset-0" />

      {nodes.map((node) => (
        <span
          key={node.id}
          ref={(el) => {
            labelRefs.current[node.id] = el;
          }}
          onPointerEnter={isMobile ? undefined : () => handleHoverEnter(node.id)}
          onPointerLeave={isMobile ? undefined : () => handleHoverLeave(node.id)}
          onClick={isMobile ? () => handleTap(node.id) : undefined}
          className={cn(
            "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 will-change-transform",
            hoverEligible ? "pointer-events-auto cursor-default" : "pointer-events-none",
          )}
        >
          <span className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border",
                "bg-bg/60 px-2.5 py-1 font-mono text-[10px] uppercase text-fg-muted backdrop-blur-sm",
              )}
            >
              <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
              {node.label}
            </span>
            {node.actionStatus ? (
              <span
                ref={(el) => {
                  actionStatusRefs.current[node.id] = el;
                }}
                className="rounded-full border border-border/70 bg-bg/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent opacity-0 backdrop-blur-sm"
              >
                {node.actionStatus}
              </span>
            ) : null}
          </span>
        </span>
      ))}

      <div ref={cardRef} className="pointer-events-none absolute left-0 top-0 w-52 -translate-x-1/2 opacity-0 will-change-transform">
        {hoveredNode ? (
          <div className="rounded-(--radius-card) border border-border bg-bg-card/90 p-3 shadow-(--shadow-node-hover) backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-fg-muted">
              <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
              {hoveredNode.label} workflow
            </div>
            <div className="font-mono text-[10px]">
              <WorkflowStepsLoop key={hoveredNode.id} steps={hoveredNode.workflowSteps} reduceMotion={!!reduce} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2">
        <div className="relative">
          {processingStatuses.map((status, i) => (
            <span
              key={status}
              ref={(el) => {
                processingStatusRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap opacity-0"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent backdrop-blur-sm">
                <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
                {status}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div ref={completeRef} className="pointer-events-none absolute inset-0 opacity-0">
        <div className="absolute left-4 top-20 flex flex-col gap-1.5 sm:left-6 sm:top-24">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-bg/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-fg backdrop-blur-sm">
            <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
            {completeMessage}
          </span>
          <div className="flex flex-col gap-0.5 pl-1">
            <span className="font-mono text-[9px] uppercase tracking-wide text-fg-muted">{exploreHint.title}</span>
            <span className="font-mono text-[9px] uppercase tracking-wide text-fg-muted/55">
              {isMobile ? exploreHint.mobileSubtitle : exploreHint.subtitle}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={introContentRef}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-[opacity,filter,transform]"
      >
        <h2 className="max-w-2xl text-balance font-display text-[clamp(1.7rem,4.2vw,3rem)] font-semibold leading-[1.08] tracking-tight text-fg">
          {intro.headline}
        </h2>
        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-fg-muted sm:text-base">
          {intro.subline}
        </p>
      </div>

      <div
        ref={introHintRef}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 sm:bottom-10"
      >
        <span className="font-mono text-[10px] uppercase tracking-wide text-fg-muted">{intro.hint}</span>
        <ChevronDown aria-hidden size={16} className={cn("text-accent", !reduce && "animate-bounce")} />
      </div>
    </div>
  );
}
