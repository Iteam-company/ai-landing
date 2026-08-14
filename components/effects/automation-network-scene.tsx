"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import {
  AutomationNetworkSceneController,
  type AutomationNetworkFrameState,
} from "@/components/automation-network/scene-controller";
import { isHoverPhaseActive, isCoreRevealed, sampleIntroRevealT } from "@/components/automation-network/timeline";
import { Lightfall } from "@/components/effects/lightfall";
import { cn } from "@/lib/utils";

const HEADER_ELEMENT_ID = "site-header";

const WORKFLOW_STEP_INTERVAL_MS = 1100;
const DETAIL_CARD_OFFSET_Y = 54;

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
}: AutomationNetworkSceneProps) {
  const reduce = useReducedMotion();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const actionStatusRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const processingStatusRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const completeRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AutomationNetworkSceneController | null>(null);

  const dimLightfallWrapRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const revealedRef = useRef(false);

  const hoveredNodeIdRef = useRef<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverEligible, setHoverEligible] = useState(false);
  const hoverEligibleRef = useRef(false);

  const introContentRef = useRef<HTMLDivElement | null>(null);
  const introHintRef = useRef<HTMLDivElement | null>(null);
  const headerElRef = useRef<HTMLElement | null>(null);

  function applyIntroStyles(v: number) {
    const revealT = sampleIntroRevealT(v);
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

    const controller = new AutomationNetworkSceneController(container, {
      nodes,
      reduceMotion: !!reduce,
      onFrame: (state: AutomationNetworkFrameState) => {
        const activeId = hoveredNodeIdRef.current;
        const dimOthers = isMobile && activeId != null;
        state.labels.forEach((p) => {
          const el = labelRefs.current[p.id];
          if (!el) return;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
          const dim = dimOthers && activeId !== p.id ? 0.35 : 1;
          el.style.opacity = String(p.opacity * dim);
        });
        Object.entries(state.actionStatusOpacities).forEach(([nodeId, opacity]) => {
          const el = actionStatusRefs.current[nodeId];
          if (el) el.style.opacity = String(opacity);
        });
        state.processingStatusOpacities.forEach((opacity, i) => {
          const el = processingStatusRefs.current[i];
          if (el) el.style.opacity = String(opacity);
        });
        if (completeRef.current) completeRef.current.style.opacity = String(state.completeOpacity);

        const canvasOpacity = 1 - state.canvasDissolveT;
        if (containerRef.current) containerRef.current.style.opacity = String(canvasOpacity);
        if (dimLightfallWrapRef.current) dimLightfallWrapRef.current.style.opacity = String(canvasOpacity);
        if (backdropRef.current) backdropRef.current.style.opacity = String(canvasOpacity);

        const hoveredId = hoveredNodeIdRef.current;
        if (hoveredId && cardRef.current) {
          const hoveredLabel = state.labels.find((p) => p.id === hoveredId);
          if (hoveredLabel) {
            cardRef.current.style.transform = `translate3d(${hoveredLabel.x}px, ${hoveredLabel.y + DETAIL_CARD_OFFSET_Y}px, 0)`;
            cardRef.current.style.opacity = String(hoveredLabel.opacity);
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
    controllerRef.current?.setProgress(v);
    applyIntroStyles(v);
    const eligible = isHoverPhaseActive(v);
    if (eligible !== hoverEligibleRef.current) {
      hoverEligibleRef.current = eligible;
      setHoverEligible(eligible);
    }
    const revealed = isCoreRevealed(v);
    if (revealed !== revealedRef.current) {
      revealedRef.current = revealed;
      onRevealChange?.(revealed);
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
