import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Brackets, Panel, PanelBar } from "@/components/ui/card";
import type { FounderProfile } from "@/content/types";

// Compact operator profile that closes the About story. The optional image
// field keeps the final portrait a content-only change when it is ready. The
// photo column keeps a fixed portrait aspect ratio so it never depends on
// how much text sits beside it.

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
          aria-label={`${content.linkedin.label} — ${content.name}`}
        >
          {content.linkedin.label}
          <ArrowUpRight
            size={12}
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </PanelBar>

      <div className="grid md:grid-cols-[2fr_3fr]">
        <div className="flex flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="rails-grid relative aspect-4/5 w-full shrink-0 overflow-hidden bg-bg-soft/55">
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-transparent"
            />
            {content.image ? (
              <Image
                src={content.image}
                alt={content.imageAlt}
                fill
                sizes="(min-width: 1024px) 430px, (min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="font-display text-6xl font-semibold tracking-[-0.08em] text-accent/85 transition-all duration-500 group-hover:text-accent group-hover:drop-shadow-[0_0_18px_color-mix(in_oklab,var(--color-accent)_24%,transparent)] sm:text-7xl">
                  {content.monogram}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {content.name}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase text-accent">
            {content.role}
          </p>

          <blockquote className="mt-6 max-w-lg text-pretty font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl lg:text-[1.7rem]">
            “{content.quote}”
          </blockquote>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-fg-muted">
            <p className="text-pretty">{content.description}</p>
            <p className="text-pretty">{content.delivery}</p>
          </div>

          <dl className="mt-7 grid grid-cols-3 border-y border-border/70">
            {content.stats.map((stat, index) => (
              <div
                key={stat.label}
                className={
                  index > 0
                    ? "border-l border-border/70 px-3 py-4 sm:px-5"
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
