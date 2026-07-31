import { Radar, Bot, Library, Workflow } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, Brackets, Chip } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Site } from "@/content/types";

// Block 3 — what we actually sell. The result leads each card; a compact,
// code-native process preview demonstrates the product without video or a modal.

const ICONS = [Radar, Bot, Library, Workflow];

export function Solutions({ content }: { content: Site["solutions"] }) {
  return (
    <Section id="solutions" className="border-t border-border bg-bg-soft/40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {content.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={item.index} delay={i * 0.06}>
                <Panel interactive className="group flex h-full flex-col">
                  <Brackets className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span
                    aria-hidden
                    className="absolute left-0 top-9 h-10 w-0.5 rounded-full bg-accent transition-all duration-500 ease-out group-hover:h-[calc(100%-3rem)]"
                  />

                  <div className="flex flex-1 flex-col p-7 sm:p-8">
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-input border border-border text-accent transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
                          <Icon size={20} strokeWidth={1.75} />
                        </span>
                        <span className="font-mono text-[10px] uppercase leading-relaxed text-fg-muted group-hover:text-accent">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-fg-muted/50 group-hover:text-accent">
                        {item.index}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-fg-muted text-pretty">
                      {item.description}
                    </p>

                    <div
                      className="mt-7 overflow-hidden rounded-input border border-border bg-bg/55"
                      role="group"
                      aria-label={item.demo.ariaLabel}
                    >
                      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-accent"
                          aria-hidden
                        />
                        <span className="font-mono text-[9px] uppercase text-fg-muted">
                          {item.demo.caption}
                        </span>
                      </div>
                      <ol className="divide-y divide-border/70">
                        {item.demo.steps.map((step) => (
                          <li
                            key={`${step.label}-${step.text}`}
                            className={cn(
                              "grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3 text-xs sm:grid-cols-[7.5rem_1fr]",
                              step.tone === "result" && "bg-accent/5",
                            )}
                          >
                            <span
                              className={cn(
                                "font-mono text-[9px] uppercase leading-relaxed text-accent/80",
                                step.tone === "agent" && "text-accent/80",
                                step.tone === "result" && "text-accent",
                              )}
                            >
                              {step.label}
                            </span>
                            <span
                              className={cn(
                                "leading-relaxed text-fg-muted",
                                step.tone === "result" && "text-fg",
                              )}
                            >
                              {step.text}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border px-7 py-5 sm:px-8">
                    {item.tags.map((tag) => (
                      <Chip
                        key={tag}
                        className="transition-colors group-hover:border-accent/40"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
