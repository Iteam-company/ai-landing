import { ArrowDownRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, PanelBar } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Site } from "@/content/types";

// A transparent cost comparison between three ways of handling the same
// repetitive workload. Desktop gets a semantic table; mobile gets the same
// content as readable stacked cards instead of a horizontal scroll area.

export function Comparison({
  content,
  transitionHref,
}: {
  content: Site["comparison"];
  transitionHref: string;
}) {
  return (
    <Section id="comparison" className="border-t border-border bg-bg-soft/40">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-14 hidden lg:block">
          <Panel className="overflow-hidden">
            <PanelBar label={content.caption} />
            <table className="comparison-table w-full table-fixed border-collapse">
              <caption className="sr-only">{content.title}</caption>
              <thead className="rails">
                <tr>
                  <th
                    scope="col"
                    aria-label={content.criteriaLabel}
                    className="w-[22%] bg-bg-card/65 px-6 py-6 text-left"
                  />
                  {content.options.map((option) => (
                    <th
                      key={option.id}
                      scope="col"
                      data-featured={option.highlighted ? "" : undefined}
                      className={cn(
                        "relative px-6 py-6 text-left align-top",
                        option.highlighted
                          ? "border-x border-t border-accent/30 bg-accent/[0.05]"
                          : "bg-bg-card/65",
                      )}
                    >
                      {option.highlighted ? (
                        <>
                          <span
                            data-featured-bracket
                            aria-hidden
                            className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-accent/45"
                          />
                          <span
                            data-featured-bracket
                            aria-hidden
                            className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-accent/45"
                          />
                        </>
                      ) : null}
                      <span
                        data-featured-label={option.highlighted ? "" : undefined}
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase text-fg-muted font-medium"
                      >
                        {option.highlighted ? (
                          <span
                            data-featured-signal
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                          />
                        ) : null}
                        {option.name}
                      </span>
                      <strong
                        data-featured-price={option.highlighted ? "" : undefined}
                        className="mt-3 block font-display text-2xl font-semibold tracking-tight text-fg"
                      >
                        {option.price}
                      </strong>
                      <span className="mt-1.5 font-medium block font-mono text-[9px] uppercase leading-relaxed text-fg-muted">
                        {option.priceNote}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-bg-card">
                {content.rows.map((row, rowIndex) => (
                  <tr key={row.label} className="border-t border-border">
                    <th
                      scope="row"
                      className="bg-bg-card px-6 py-4 text-left font-mono text-[10px] font-normal uppercase leading-relaxed text-fg-muted"
                    >
                      {row.label}
                    </th>
                    {content.options.map((option) => (
                      <td
                        key={option.id}
                        data-featured={option.highlighted ? "" : undefined}
                        className={cn(
                          "relative px-6 py-4 text-sm leading-relaxed text-fg-muted",
                          option.highlighted
                            ? "border-x border-accent/30 bg-accent/[0.05] text-fg"
                            : "bg-bg-card",
                          option.highlighted &&
                            rowIndex === content.rows.length - 1 &&
                            "border-b",
                        )}
                      >
                        {row.values[option.id]}
                        {option.highlighted && rowIndex === content.rows.length - 1 ? (
                          <>
                            <span
                              data-featured-bracket
                              aria-hidden
                              className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-accent/45"
                            />
                            <span
                              data-featured-bracket
                              aria-hidden
                              className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-accent/45"
                            />
                          </>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:hidden">
          {content.options.map((option, i) => (
            <Reveal key={option.id} delay={i * 0.06}>
              <Panel
                className={cn(
                  "overflow-hidden",
                  option.highlighted && "ring-1 ring-inset ring-accent/45",
                )}
              >
                <div
                  className={cn(
                    "border-b border-border px-6 py-5",
                    option.highlighted && "bg-accent/[0.05]",
                  )}
                >
                  <span className="font-mono text-[10px] uppercase text-fg-muted">
                    {option.name}
                  </span>
                  <strong className="mt-3 block font-display text-2xl font-semibold tracking-tight">
                    {option.price}
                  </strong>
                  <span className="mt-1.5 block font-mono text-[9px] uppercase text-fg-muted/75">
                    {option.priceNote}
                  </span>
                </div>
                <dl className="divide-y divide-border">
                  {content.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-4 px-6 py-4">
                      <dt className="font-mono text-[9px] uppercase leading-relaxed text-fg-muted">
                        {row.label}
                      </dt>
                      <dd className="text-sm leading-relaxed text-fg">
                        {row.values[option.id]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.14} className="mt-7">
          <div className="flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-3xl font-mono text-[10px] uppercase leading-relaxed text-fg-muted/70">
              {content.note}
            </p>
            <a
              href={transitionHref}
              className="group flex shrink-0 items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
            >
              {content.transition}
              <ArrowDownRight
                size={15}
                className="text-accent transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
