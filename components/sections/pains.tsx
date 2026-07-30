import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, Brackets } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import type { Site } from "@/content/types";

// Block 2 — business pains. A 2x2 grid where each cell reacts on hover: the
// registration brackets fade in, the accent rail extends and the index flips to
// the accent colour.

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

                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted text-pretty">
                    {card.description}
                  </p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
