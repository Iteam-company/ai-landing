import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Brackets, Panel, PanelBar } from "@/components/ui/card";
import type { FounderProfile } from "@/content/types";

// Compact operator profile that closes the About story. The optional image
// field keeps the final portrait a content-only change when it is ready.

export function Founder({ content }: { content: FounderProfile }) {
  return (
    <Panel className="group overflow-hidden">
      <Brackets className="opacity-40 transition-opacity duration-300 group-hover:opacity-100" />

      <PanelBar label={content.caption}>
        <a
          href={content.linkedin.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase text-fg-muted transition-colors hover:text-accent"
        >
          {content.linkedin.label}
          <ArrowUpRight
            size={12}
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </PanelBar>

      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="rails-grid relative min-h-64 overflow-hidden border-b border-border bg-bg-soft/55 md:min-h-full md:border-b-0 md:border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
          {content.image ? (
            <Image
              src={content.image}
              alt={content.imageAlt}
              fill
              sizes="(min-width: 1024px) 272px, (min-width: 768px) 224px, 100vw"
              className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
            />
          ) : (
            <div
              aria-hidden
              className="relative flex min-h-64 h-full items-center justify-center"
            >
              <span className="font-display text-7xl font-semibold tracking-[-0.08em] text-accent/85 transition-all duration-500 group-hover:text-accent group-hover:drop-shadow-[0_0_18px_color-mix(in_oklab,var(--color-accent)_24%,transparent)]">
                {content.monogram}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {content.name}
              </h3>
              <p className="mt-1 font-mono text-[10px] uppercase text-accent">
                {content.role}
              </p>
            </div>
          </div>

          <blockquote className="mt-7 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
            “{content.quote}”
          </blockquote>

          <div className="mt-6 grid gap-3 text-[15px] leading-relaxed text-fg-muted lg:grid-cols-2 lg:gap-8">
            <p className="text-pretty">{content.description}</p>
            <p className="text-pretty">{content.delivery}</p>
          </div>

          <dl className="mt-7 grid grid-cols-3 border-y border-border">
            {content.stats.map((stat, index) => (
              <div
                key={stat.label}
                className={
                  index > 0
                    ? "border-l border-border px-3 py-4 sm:px-5"
                    : "py-4 pr-3 sm:pr-5"
                }
              >
                <dt className="font-display text-lg font-semibold text-accent sm:text-xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 font-mono text-[9px] uppercase leading-snug text-fg-muted sm:text-[10px]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase">
            <span className="text-accent">{content.proof.label}</span>
            <span className="text-fg">{content.proof.project}</span>
            <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
            {content.proof.results.map((result) => (
              <span key={result} className="text-fg-muted">
                {result}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
