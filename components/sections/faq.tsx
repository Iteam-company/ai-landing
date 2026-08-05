"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import type { Site } from "@/content/types";

// A compact animated accordion. Motion handles height:auto without measuring
// content manually; the controls retain native button keyboard behaviour and
// expose their state through aria-expanded / aria-controls.

export function Faq({
  content,
}: {
  content: Site["faq"];
  transitionHref: string;
}) {
  const reduce = useReducedMotion();
  const [openItem, setOpenItem] = React.useState<number | null>(0);
  const id = React.useId();
  const duration = reduce ? 0.01 : 0.32;

  return (
    <Section id="faq" className="border-t border-border">
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
            <PanelBar label={content.caption} />
            <div className="divide-y divide-border">
              {content.items.map((item, i) => {
                const open = openItem === i;
                const triggerId = `${id}-faq-trigger-${i}`;
                const panelId = `${id}-faq-panel-${i}`;

                return (
                  <div key={item.question}>
                    <button
                      id={triggerId}
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenItem(open ? null : i)}
                      className="flex cursor-pointer w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-fg/[0.025] focus-visible:bg-fg/[0.035] focus-visible:outline-none sm:px-8 sm:py-6"
                    >
                      <span className="shrink-0 font-mono text-[10px] text-accent/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-display text-base font-semibold leading-snug tracking-tight text-fg sm:text-lg">
                        {item.question}
                      </span>
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{
                          duration: reduce ? 0.01 : 0.24,
                          ease: "easeOut",
                        }}
                        className={
                          open
                            ? "shrink-0 text-accent"
                            : "shrink-0 text-fg-muted"
                        }
                        aria-hidden
                      >
                        <Plus size={17} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={triggerId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pl-[4.25rem] sm:px-8 sm:pb-7 sm:pl-[5.25rem]">
                            <p className="max-w-3xl text-[15px] leading-relaxed text-fg-muted text-pretty">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Reveal>
      </Container>
    </Section>
  );
}
