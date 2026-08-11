"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { HeroScenario } from "@/content/types";

const HEADLINE_CLASS =
  "font-display text-[clamp(2.3rem,5.6vw,4.1rem)] font-semibold leading-[1.02] tracking-tight text-balance";
const SUBTITLE_CLASS = "mt-6 max-w-xl text-lg leading-relaxed text-fg-muted text-pretty";

const COPY_TRANSITION = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

function ScenarioCopy({
  scenario,
  reduce,
}: {
  scenario: HeroScenario;
  reduce: boolean | null;
}) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      className="absolute inset-0"
      aria-hidden={!isPresent}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={COPY_TRANSITION}
    >
      <h1 className={HEADLINE_CLASS}>{scenario.title}</h1>
      <p className={SUBTITLE_CLASS}>{scenario.subtitle}</p>
    </motion.div>
  );
}

export function HeroCopy({
  scenario,
  scenarios,
  className,
}: {
  scenario: HeroScenario;
  scenarios: HeroScenario[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="invisible grid">
        {scenarios.map((s) => (
          <div key={s.id} className="col-start-1 row-start-1">
            <h1 className={HEADLINE_CLASS}>{s.title}</h1>
            <p className={SUBTITLE_CLASS}>{s.subtitle}</p>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        <ScenarioCopy key={scenario.id} scenario={scenario} reduce={reduce} />
      </AnimatePresence>
    </div>
  );
}
