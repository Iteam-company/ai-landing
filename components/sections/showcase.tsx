"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Site } from "@/content/site";

// Block 4 — architecture demo. Instead of a canned GIF this is a live pipeline:
// the signal walks Входящий лид ➔ AI-анализ ➔ Карточка в CRM ➔ Уведомление в
// Telegram on a loop, lighting each stage as it arrives. Clicking a stage takes
// manual control; reduced-motion visitors get the whole thing static.

const STEP_MS = 2800;

export function Showcase({ content }: { content: Site["showcase"] }) {
  const reduce = useReducedMotion();
  const count = content.steps.length;
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), STEP_MS);
    return () => window.clearInterval(id);
  }, [reduce, count]);

  // Rail progress: the dots sit at the centre of each equal column.
  const progress = ((active + 0.5) / count) * 100;

  return (
    <Section id="showcase" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <Panel className="overflow-hidden">
            <PanelBar label={content.caption} live>
              <span className="ml-auto font-mono text-[10px] uppercase text-fg-muted/70">
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </PanelBar>

            <div className="rails p-6 sm:p-8 lg:p-10">
              {/* Desktop rail with the travelling signal. */}
              <div className="relative mb-9 hidden h-3 lg:block">
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                <span
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-accent transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="relative grid"
                  style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
                >
                  {content.steps.map((step, i) => (
                    <span key={step.index} className="flex justify-center">
                      <span
                        className={cn(
                          "h-3 w-3 rounded-full border transition-all duration-500",
                          i <= active
                            ? "border-accent bg-accent"
                            : "border-border bg-bg-card",
                          i === active && "scale-125",
                        )}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4 lg:gap-5">
                {content.steps.map((step, i) => {
                  const on = i === active;
                  return (
                    <button
                      key={step.index}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={on}
                      className={cn(
                        "rounded-[var(--radius-input)] border p-5 text-left transition-all duration-300",
                        on
                          ? "border-accent/60 bg-bg-card shadow-node-hover"
                          : "border-border bg-bg-card/50 hover:border-accent/30",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "font-mono text-[10px] transition-colors",
                            on ? "text-accent" : "text-fg-muted/60",
                          )}
                        >
                          {step.index}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase transition-colors",
                            on ? "text-accent" : "text-fg-muted/60",
                          )}
                        >
                          {step.meta}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
                        {step.title}
                      </h3>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-relaxed text-pretty transition-colors",
                          on ? "text-fg-muted" : "text-fg-muted/70",
                        )}
                      >
                        {step.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-border px-6 py-5 sm:px-8">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-fg-muted text-pretty">
                {content.note}
              </p>
            </div>
          </Panel>
        </Reveal>
      </Container>
    </Section>
  );
}
