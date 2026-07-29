import { ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { CalEmbed } from "@/components/cal-embed";
import { LeadForm } from "@/components/lead-form";
import type { Site } from "@/content/site";

// Block 6 — the conversion zone. Two columns: book a slot straight in the
// embedded calendar, or describe the task in the form. Whichever the visitor
// prefers, the lead lands in the same automation.

export function Contact({ content }: { content: Site["contact"] }) {
  return (
    <Section id="contact" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {/* Left — direct booking. */}
          <Reveal className="h-full">
            <Panel className="flex h-full flex-col overflow-hidden">
              <PanelBar label={content.calendar.caption} live />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {content.calendar.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted text-pretty">
                  {content.calendar.description}
                </p>
                <CalEmbed
                  title={content.calendar.title}
                  placeholder={content.calendar.placeholder}
                  className="mt-6 flex-1"
                />
              </div>
            </Panel>
          </Reveal>

          {/* Right — the text form. */}
          <Reveal delay={0.08} className="h-full">
            <Panel id="lead-form" className="flex h-full scroll-mt-28 flex-col overflow-hidden">
              <PanelBar label="lead-form" />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {content.form.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted text-pretty">
                  {content.form.description}
                </p>

                <div className="mt-6 flex-1">
                  <LeadForm content={content.form} />
                </div>

                <ul className="mt-7 divide-y divide-border border-t border-border">
                  {content.channels.map((channel) => (
                    <li key={channel.href}>
                      <a
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-accent"
                      >
                        <span className="font-mono text-[10px] uppercase text-fg-muted">
                          {channel.label}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-fg group-hover:text-accent">
                          {channel.value}
                          <ArrowUpRight
                            size={13}
                            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
