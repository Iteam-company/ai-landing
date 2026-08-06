"use client";

import * as React from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { Panel, Brackets } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { useSpotlight, SpotlightLayer } from "@/components/effects/spotlight-card";
import { cn } from "@/lib/utils";
import type { PainCard, Site, Ui } from "@/content/types";

// Block 2 — business pains. At rest each card is just the scannable signal
// (category, metric, question, one line of context); the automated outcome
// lives in the same slot as the description and only surfaces on interaction,
// so the grid reads lighter without losing the payoff line.

export function Pains({ content, ui }: { content: Site["pains"]; ui: Ui["pains"] }) {
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
              <PainCardItem card={card} index={i} ui={ui} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function PainCardItem({ card, index, ui }: { card: PainCard; index: number; ui: Ui["pains"] }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const spotlight = useSpotlight(cardRef);
  const [open, setOpen] = React.useState(false);
  const outcomeId = React.useId();

  return (
    <Panel
      ref={cardRef}
      {...spotlight.handlers}
      className={cn(
        "group relative h-full overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-node-hover focus-within:shadow-node-hover",
        "motion-safe:hover:-translate-y-0.75 motion-safe:focus-within:-translate-y-0.75",
      )}
    >
      <SpotlightLayer style={spotlight.style} />
      <Brackets className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />

      {/* rail that grows along the leading edge on hover/focus */}
      <span
        aria-hidden
        className="absolute left-0 top-6 h-8 w-0.5 rounded-full bg-accent transition-all duration-500 ease-out group-hover:h-[calc(100%-3rem)] group-focus-within:h-[calc(100%-3rem)]"
      />

      <div className="relative z-10 p-7 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase text-fg-muted transition-colors group-hover:text-accent group-focus-within:text-accent">
            {card.tag}
          </span>
          <span className="font-mono text-[10px] text-fg-muted/50 transition-colors group-hover:text-accent group-focus-within:text-accent">
            {String(index + 1).padStart(2, "0")}
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

        {/* Crossfade slot: both the problem line and the automated outcome
            occupy the same grid cell, so the cell is sized to the taller of
            the two and toggling between them never resizes the card. */}
        <div className="relative mt-3 grid">
          <p
            className={cn(
              "col-start-1 row-start-1 text-[15px] leading-relaxed text-fg-muted text-pretty transition-opacity duration-300",
              "group-hover:opacity-0 group-focus-within:opacity-0",
              open && "opacity-0",
            )}
          >
            {card.description}
          </p>
          <div
            id={outcomeId}
            className={cn(
              "pointer-events-none col-start-1 row-start-1 flex items-start gap-2.5 self-start rounded-input border border-accent/20 p-3.5 opacity-0 transition-all duration-300 ease-out motion-safe:translate-y-1",
              "bg-[color-mix(in_oklab,var(--color-accent)_9%,var(--color-bg-card))]",
              "group-hover:opacity-100 group-hover:translate-y-0",
              "group-focus-within:opacity-100 group-focus-within:translate-y-0",
              open && "opacity-100 translate-y-0",
            )}
          >
            <ArrowUpRight aria-hidden size={14} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-fg/90 text-pretty">{card.outcome}</p>
          </div>
        </div>

        {/* The only way touch visitors (no hover) reach the outcome — also
            gives keyboard/mouse users a way to pin it open. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={outcomeId}
          className="relative z-10 mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase text-fg-muted/70 transition-colors hover:text-accent focus-visible:text-accent"
        >
          {open ? ui.hideResult : ui.seeResult}
          <ChevronDown
            aria-hidden
            size={12}
            className={cn("transition-transform duration-300", open && "rotate-180")}
          />
        </button>
      </div>
    </Panel>
  );
}
