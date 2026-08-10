"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { FlowNode } from "@/content/types";

const NODE_W = 210;
const NODE_H = 68;

const POSITIONS = [
  { x: 20, y: 18 },
  { x: 120, y: 152 },
  { x: 40, y: 286 },
] as const;

const WIRES = [
  {
    d: "M125 86 V107 Q125 119 137 119 H213 Q225 119 225 131 V152",
    from: { x: 125, y: 86 },
    to: { x: 225, y: 152 },
  },
  {
    d: "M225 220 V241 Q225 253 213 253 H157 Q145 253 145 265 V286",
    from: { x: 225, y: 220 },
    to: { x: 145, y: 286 },
  },
] as const;

export function FlowDiagram({
  nodes,
  label,
  className,
}: {
  nodes: FlowNode[];
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState<number | null>(null);

  return (
    <svg
      viewBox="0 0 380 372"
      role="img"
      aria-label={`${label}: ${nodes.map((n) => n.label).join(" → ")}`}
      className={cn("h-auto w-full select-none", className)}
    >
      {WIRES.map((wire, i) => (
        <g key={i}>
          <path
            d={wire.d}
            fill="none"
            className="stroke-fg-muted/25"
            strokeWidth={1.5}
          />
          <path
            d={wire.d}
            fill="none"
            className="stroke-accent animate-wire"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle cx={wire.from.x} cy={wire.from.y} r={3} className="fill-accent" />
          <circle
            cx={wire.to.x}
            cy={wire.to.y}
            r={3}
            className="fill-bg stroke-accent"
            strokeWidth={1.5}
          />
        </g>
      ))}

      {nodes.slice(0, POSITIONS.length).map((node, i) => {
        const { x, y } = POSITIONS[i];
        const on = active === i;
        return (
          <g
            key={node.id}
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="cursor-default outline-none"
          >
            <rect
              x={x}
              y={y}
              width={NODE_W}
              height={NODE_H}
              rx={12}
              className={cn(
                "fill-bg-card transition-all duration-300",
                on ? "stroke-accent" : "stroke-fg-muted/25",
              )}
              strokeWidth={on ? 1.6 : 1}
            />
            <rect
              x={x}
              y={y + 14}
              width={2.5}
              height={NODE_H - 28}
              rx={1.25}
              className={cn(
                "transition-opacity duration-300",
                on ? "fill-accent opacity-100" : "fill-accent opacity-45",
              )}
            />
            <text
              x={x + 20}
              y={y + 29}
              className="fill-fg font-display text-[15px] font-semibold"
            >
              {node.label}
            </text>
            <text
              x={x + 20}
              y={y + 49}
              className="fill-fg-muted font-mono text-[10px] uppercase"
            >
              {node.meta}
            </text>
            <text
              x={x + NODE_W - 16}
              y={y + 29}
              textAnchor="end"
              className={cn(
                "font-mono text-[10px] transition-colors",
                on ? "fill-accent" : "fill-fg-muted/60",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {reduce
        ? null
        : WIRES.map((wire, i) => (
            <circle key={`packet-${i}`} r={4} className="fill-accent">
              <animateMotion
                dur="2.6s"
                begin={`${i * 1.3}s`}
                repeatCount="indefinite"
                path={wire.d}
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="linear"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.85;1"
                dur="2.6s"
                begin={`${i * 1.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
    </svg>
  );
}
