import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, Brackets } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { ArrowUpRight } from "lucide-react";
import type { Site } from "@/content/types";

// Block 2 — business pains. Each card leads with a measurable process signal,
// explains the cost behind it and closes with the operational result.

export function Pains({ content }: { content: Site["pains"] }) {
  return (
    <Section id="pains" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {content.cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.06}>
              <Panel interactive className="group h-full overflow-hidden">
                <Brackets className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* rail that grows along the leading edge on hover */}
                <span
                  aria-hidden
                  className="absolute left-0 top-6 h-8 w-0.5 rounded-full bg-accent transition-all duration-500 ease-out group-hover:h-[calc(100%-3rem)]"
                />

                <div className="p-7 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase text-fg-muted transition-colors group-hover:text-accent">
                      {card.tag}
                    </span>
                    <span className="font-mono text-[10px] text-fg-muted/50 transition-colors group-hover:text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-7 flex items-end gap-3 border-b border-border pb-6">
                    <strong className="font-display text-4xl font-semibold leading-none tracking-tight text-accent sm:text-5xl">
                      {card.metric}
                    </strong>
                    <span className="max-w-52 pb-0.5 font-mono text-[12px] uppercase leading-relaxed text-fg-muted">
                      {card.metricLabel}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted text-pretty">
                    {card.description}
                  </p>

                  <div className="mt-6 flex items-start gap-3 rounded-input border border-accent/15 bg-accent/[0.04] p-4 transition-colors group-hover:border-accent/30">
                    <ArrowUpRight
                      aria-hidden
                      size={15}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    <p className="text-sm leading-relaxed text-fg/90 text-pretty">
                      {card.outcome}
                    </p>
                  </div>
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
