"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { WorkflowCardSwap } from "@/components/workflow-card-swap";
import { HeroCopy } from "@/components/hero-copy";
import { CallModal } from "@/components/call-modal";
import { Lightfall } from "@/components/effects/lightfall";
import { cn } from "@/lib/utils";
import type { HeroScenario, Site, Ui } from "@/content/types";

interface HeroProps {
  content: Site["hero"];
  calendar: Site["contact"]["calendar"];
  a11y: Ui["a11y"];
  /**
   * Gates the entrance animation + interactivity to the exact moment
   * AutomationNetwork's ENTER CORE fly-in dissolves into this section (see
   * onRevealChange in automation-network-scene.tsx / the AutomationNetworkHero
   * bridge component) — not geometric viewport intersection, which happens
   * much earlier since Hero overlaps the tail of that section's sticky pin.
   * Defaults to true (always shown) so Hero still works if ever rendered
   * standalone, outside that bridge.
   */
  revealed?: boolean;
}

export function Hero({ content, calendar, a11y, revealed = true }: HeroProps) {
  const reduce = useReducedMotion();

  const [activeScenario, setActiveScenario] = React.useState(content.scenarios[0]);
  const handleActiveChange = React.useCallback((scenario: HeroScenario) => {
    setActiveScenario(scenario);
  }, []);

  const container: Variants = {
    hidden: {},
    show: { transition: { delayChildren: 0.08, staggerChildren: 0.07 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="top"
      // -mt-[100dvh]: pulls Hero's document position up by exactly one
      // sticky-pin-release's worth of scroll (AutomationNetwork's sticky
      // panel is always h-dvh regardless of the section's own vh height —
      // see automation-network.tsx) so Hero already fills the viewport the
      // instant that panel unsticks, instead of needing another full
      // viewport-height of scroll to catch up (which previously showed a
      // blank Lightfall-only gap — the panel had already dissolved
      // transparent by then, but nothing was positioned underneath it yet).
      // AutomationNetwork's z-10 (see automation-network.tsx) keeps it
      // painted above this overlap until its own canvas/Lightfall actually
      // dissolve, so Hero is invisible — not prematurely showing through —
      // for the entire pinned scroll before ENTER CORE's tail.
      className="relative mt-[-100dvh] overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-40"
    >
      <div aria-hidden className="lightfall-fade pointer-events-none absolute inset-0 -z-10">
        <Lightfall className="h-full w-full" />
      </div>

      <Container>
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className={cn(
            "grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16",
            // Belt-and-suspenders: the opaque backdrop in
            // automation-network-scene.tsx is what actually keeps this
            // hidden/unclickable during FLY-IN — this just makes sure
            // nothing here can intercept a click even at the very edge of
            // that panel before REVEAL flips it on.
            revealed ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div>
            <motion.p
              variants={item}
              className="inline-flex items-center gap-2.5 rounded-full border border-border px-3.5 py-1.5 font-mono text-[10px] uppercase text-accent"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent animate-node" />
              {content.eyebrow}
            </motion.p>

            <motion.div variants={item} className="mt-7">
              <HeroCopy scenario={activeScenario} scenarios={content.scenarios} />
            </motion.div>

            <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CallModal
                label={content.primaryCta.label}
                calendar={calendar}
                closeLabel={a11y.close}
              />
              <Button asChild size="lg" variant="secondary">
                <a href={content.secondaryCta.href}>
                  {content.secondaryCta.label}
                  <ArrowDown size={16} />
                </a>
              </Button>
            </motion.div>

            <motion.dl
              variants={item}
              className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-7"
            >
              {content.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl font-semibold tracking-tight text-accent">
                    {s.value}
                  </dt>
                  <dd className="mt-1.5 font-mono text-[10px] uppercase leading-snug text-fg-muted">
                    {s.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div variants={item}>
            <WorkflowCardSwap scenarios={content.scenarios} onActiveChange={handleActiveChange} />
          </motion.div>
        </motion.div>
      </Container>

      <div className="mask-fade-x relative mt-20 flex overflow-hidden border-y border-border py-4">
        <div className="animate-marquee flex">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-10 pr-10"
            >
              {content.marquee.map((word) => (
                <span
                  key={word}
                  className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase text-fg-muted"
                >
                  <span aria-hidden className="h-1 w-1 rotate-45 bg-accent/70" />
                  {word}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
