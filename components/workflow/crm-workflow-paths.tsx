"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EDGE_INSET = 3;
const BEND_R = 6;

function bentPath(x1: number, y1: number, x2: number, y2: number): string {
  if (x1 === x2) return `M${x1} ${y1} V${y2}`;
  const dir = x2 > x1 ? 1 : -1;
  const midY = (y1 + y2) / 2;
  const r = Math.min(BEND_R, Math.abs(x2 - x1) / 2, Math.max(0, midY - y1), Math.max(0, y2 - midY));
  if (r <= 0) return `M${x1} ${y1} V${midY} H${x2} V${y2}`;
  return [
    `M${x1} ${y1}`,
    `V${midY - r}`,
    `Q${x1} ${midY} ${x1 + r * dir} ${midY}`,
    `H${x2 - r * dir}`,
    `Q${x2} ${midY} ${x2} ${midY + r}`,
    `V${y2}`,
  ].join(" ");
}

interface StageRect {
  top: number;
  bottom: number;
  left: number;
}

interface PathMetrics {
  width: number;
  height: number;
  stages: StageRect[];
}

function useCrmPathMetrics() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stage1Ref = React.useRef<HTMLDivElement>(null);
  const stage2Ref = React.useRef<HTMLDivElement>(null);
  const stage3Ref = React.useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = React.useState<PathMetrics | null>(null);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const stageEls = [stage1Ref.current, stage2Ref.current, stage3Ref.current];

    function measure() {
      const containerRect = container!.getBoundingClientRect();
      const stages = stageEls.map((el) => {
        if (!el) return { top: 0, bottom: 0, left: 0 };
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
          left: rect.left - containerRect.left,
        };
      });
      setMetrics({ width: containerRect.width, height: containerRect.height, stages });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    stageEls.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  return { containerRef, stage1Ref, stage2Ref, stage3Ref, metrics };
}

export interface CrmConnectorPhase {
  signal: boolean;
  fired: boolean;
}

export function CrmWorkflowPaths({
  metrics,
  connectors,
  reduce,
}: {
  metrics: PathMetrics | null;
  connectors: [CrmConnectorPhase, CrmConnectorPhase];
  reduce: boolean | null;
}) {
  if (!metrics) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
    >
      {connectors.map((phase, i) => {
        const from = metrics.stages[i];
        const to = metrics.stages[i + 1];
        if (!from || !to) return null;
        const x1 = from.left + EDGE_INSET;
        const x2 = to.left + EDGE_INSET;
        const d = bentPath(x1, from.bottom, x2, to.top);
        const drawn = phase.fired || phase.signal;

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeDasharray="3 4"
              className="stroke-accent/30"
            />
            <path
              d={d}
              fill="none"
              strokeWidth={1.75}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={drawn ? 0 : 1}
              className={cn(
                !reduce && "transition-all duration-420 ease-out",
                phase.signal ? "stroke-accent" : "stroke-accent/70",
              )}
            />
            <circle cx={x1} cy={from.bottom} r={3} className={cn("fill-accent", !drawn && "opacity-40")} />
            <circle
              cx={x2}
              cy={to.top}
              r={3}
              strokeWidth={1.5}
              className={cn(
                "fill-bg stroke-accent",
                !drawn && "opacity-40",
                !reduce && phase.signal && "animate-lead-endpoint-pulse",
              )}
            />
            {!reduce && phase.signal ? (
              <circle r={3} className="fill-accent">
                <animateMotion dur="0.42s" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" fill="freeze" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" dur="0.42s" fill="freeze" />
              </circle>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export { useCrmPathMetrics };
