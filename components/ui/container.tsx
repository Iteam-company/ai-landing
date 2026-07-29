import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10", className)}
      {...props}
    />
  );
}

export function Section({
  id,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-20 sm:py-24 lg:py-32", className)}
      {...props}
    />
  );
}

/**
 * Mono section marker — an accent square followed by an uppercase label
 * ("01 · боли бизнеса"). The recurring wayfinding element of the template.
 */
export function Eyebrow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[11px] uppercase text-accent",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-accent" />
      {children}
    </div>
  );
}

/** Section header: marker + display title + optional subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.06] tracking-tight text-balance sm:text-4xl lg:text-[2.9rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted text-pretty sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
