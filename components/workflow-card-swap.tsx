"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { WorkflowCard } from "@/components/workflow-card";
import { cn } from "@/lib/utils";
import type { HeroScenario } from "@/content/types";

const AUTO_CYCLE_MS = 5200;

const EASE = [0.22, 1, 0.36, 1] as const;

const SWAP_TRANSITION: Transition = { duration: 0.7, ease: EASE };

const DEPTH_STYLES = [
  { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 },
  { x: 14, y: -14, scale: 0.985, opacity: 0.88, rotate: -0.35 },
  { x: 27, y: -27, scale: 0.972, opacity: 0.7, rotate: -0.7 },
  { x: 40, y: -40, scale: 0.958, opacity: 0.5, rotate: -1.05 },
];

const EXIT_TIMES = [0, 0.25, 0.58, 1] as const;
const EXIT_DURATION_S = 2.05;
const EXIT_EASE = [0.65, 0, 0.35, 1] as const;
const EXIT_TRANSITION: Transition = {
  duration: EXIT_DURATION_S,
  times: [...EXIT_TIMES],
  ease: EXIT_EASE,
};

const EXIT_HANDOFF_MS = EXIT_TIMES[1] * EXIT_DURATION_S * 1000;

export function WorkflowCardSwap({
  scenarios,
  onActiveChange,
  className,
}: {
  scenarios: HeroScenario[];
  onActiveChange?: (scenario: HeroScenario) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const count = scenarios.length;

  const [{ order, prevOrder, exitingId }, setStack] = React.useState(() => {
    const initialOrder = scenarios.map((_, i) => i);
    return { order: initialOrder, prevOrder: initialOrder, exitingId: null as number | null };
  });
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setStack((s) => ({
        prevOrder: s.order,
        order: [...s.order.slice(1), s.order[0]],
        exitingId: s.order[0],
      }));
    }, AUTO_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  React.useEffect(() => {
    if (exitingId === null) return;
    const id = window.setTimeout(() => {
      setStack((s) => (s.exitingId === exitingId ? { ...s, exitingId: null } : s));
    }, EXIT_HANDOFF_MS);
    return () => window.clearTimeout(id);
  }, [exitingId]);

  const frontIndex = order[0];
  React.useEffect(() => {
    onActiveChange?.(scenarios[frontIndex]);
  }, [frontIndex, scenarios, onActiveChange]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div aria-hidden className="invisible grid">
        {scenarios.map((s) => (
          <div key={s.id} className="col-start-1 row-start-1">
            <WorkflowCard
              label={s.flow.label}
              status={s.flow.status}
              workflow={s.flow.workflow}
              active={false}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 [clip-path:inset(-3rem_-3rem_-3.5rem_-1.25rem)] lg:[clip-path:inset(-3rem_-3rem_-4.5rem_-1.25rem)]">
        {scenarios.map((scenario, cardIndex) => {
          const depth = order.indexOf(cardIndex);
          const isFront = depth === 0;
          const target = DEPTH_STYLES[depth] ?? DEPTH_STYLES[DEPTH_STYLES.length - 1];

          const wasFront = prevOrder.indexOf(cardIndex) === 0;
          const isOutgoing = wasFront && !isFront;
          const isExiting = exitingId === cardIndex;

          const zIndex = isExiting ? count + 1 : count - depth;

          return (
            <motion.div
              key={scenario.id}
              className="absolute inset-0"
              style={{ zIndex }}
              initial={false}
              animate={
                isOutgoing
                  ? {
                      x: [null, 18, 32, target.x],
                      y: [null, 650, 500, target.y],
                      scale: [null, 0.985, 0.968, target.scale],
                      opacity: [null, 0.62, 0.56, target.opacity],
                      rotate: [null, -0.4, -0.75, target.rotate],
                    }
                  : target
              }
              transition={isOutgoing ? EXIT_TRANSITION : SWAP_TRANSITION}
              aria-hidden={!isFront}
              inert={!isFront}
            >
              <WorkflowCard
                label={scenario.flow.label}
                status={scenario.flow.status}
                workflow={scenario.flow.workflow}
                active={isFront}
                className={cn(!isFront && "pointer-events-none")}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
