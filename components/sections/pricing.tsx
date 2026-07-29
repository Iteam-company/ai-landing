import { Check, Clock } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Site } from "@/content/site";

// Block 5 — three engagement formats. The middle tier is the recommended one:
// it lifts off the row, carries the accent ring and gets the primary CTA.

export function Pricing({ content }: { content: Site["pricing"] }) {
  return (
    <Section id="pricing" className="border-t border-border bg-bg-soft/40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {content.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.07} className="h-full">
              <Panel
                interactive={!tier.recommended}
                className={cn(
                  "flex h-full flex-col",
                  tier.recommended && "shadow-node-hover lg:-translate-y-4",
                )}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-7 py-4">
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase text-fg-muted">
                    <Clock size={12} className="text-accent" />
                    {tier.term}
                  </span>
                  {tier.recommended ? (
                    <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] uppercase text-accent-fg">
                      рекомендуем
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted text-pretty">
                    {tier.summary}
                  </p>

                  <div className="mt-7">
                    <p
                      className={cn(
                        "font-display text-3xl font-semibold tracking-tight",
                        tier.recommended ? "text-accent" : "text-fg",
                      )}
                    >
                      {tier.price}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] uppercase text-fg-muted">
                      {tier.priceNote}
                    </p>
                  </div>

                  <ul className="mt-7 flex-1 space-y-3.5 border-t border-border pt-7">
                    {tier.items.map((line) => (
                      <li key={line} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-accent/40 text-accent">
                          <Check size={10} strokeWidth={3} />
                        </span>
                        <span className="text-[15px] leading-relaxed text-fg-muted text-pretty">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="lg"
                    variant={tier.recommended ? "primary" : "secondary"}
                    className="mt-8 w-full"
                  >
                    <a href={tier.cta.href}>{tier.cta.label}</a>
                  </Button>
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-10 text-center font-mono text-[10px] uppercase text-fg-muted/70">
            {content.note}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
