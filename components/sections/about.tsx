import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Brackets, Chip, Panel } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { Founder } from "@/components/sections/founder";
import type { Site } from "@/content/types";

// Operator credibility between the product demo and the commercial comparison,
// closed by a compact founder profile rather than a separate oversized section.

export function About({ content }: { content: Site["about"] }) {
  return (
    <Section id="about" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.06} className="mt-14">
          <Founder content={content.founder} />
        </Reveal>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {content.items.map((item, i) => (
            <Reveal key={item.title} delay={0.12 + i * 0.06} className="h-full">
              <Panel interactive className="group flex h-full flex-col overflow-hidden">
                <Brackets className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <span
                  aria-hidden
                  className="absolute left-0 top-6 h-8 w-0.5 rounded-full bg-accent transition-all duration-500 ease-out group-hover:h-[calc(100%-3rem)]"
                />

                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase text-fg-muted transition-colors group-hover:text-accent">
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-fg-muted/50 transition-colors group-hover:text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <strong className="mt-8 font-display text-4xl font-semibold leading-none tracking-tight text-accent">
                    {item.metric}
                  </strong>
                  <span className="mt-6 h-px w-full bg-border transition-colors group-hover:bg-accent/35" />

                  <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted text-pretty">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border px-7 py-5 sm:px-8">
                  {item.tags.map((tag) => (
                    <Chip key={tag} className="transition-colors group-hover:border-accent/40">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
