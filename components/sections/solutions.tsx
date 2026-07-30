import { Radar, Bot, Library, Workflow } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, Chip } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import type { Site } from "@/content/types";

// Block 3 — what we actually sell. Four agent "modules", each a panel with an
// icon tile that fills with the accent on hover and a tag rail along the bottom.

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
                  <div className="flex flex-1 flex-col p-7 sm:p-8">
                    <div className="flex items-start justify-between gap-5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-input)] border border-border text-accent transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
                        <Icon size={20} strokeWidth={1.75} />
                      </span>
                      <span className="font-mono text-[10px] text-fg-muted/50">
                        {item.index}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]">
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
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
