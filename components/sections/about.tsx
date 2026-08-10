import { Container, Section, SectionHeading } from "@/components/ui/container";
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

        <Reveal delay={0.1}>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 font-mono text-[10px] uppercase tracking-wide text-fg-muted">
            {content.trust.map((item, i) => (
              <li key={item} className="flex items-center gap-5">
                <span>{item}</span>
                {i < content.trust.length - 1 ? (
                  <span aria-hidden className="h-3 w-px bg-border" />
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
