import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The console panel — the surface every block is built from. Softly rounded,
 * hairline ring, deep shadow; `interactive` adds the accent hover ring that runs
 * through the whole template.
 */
interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-[var(--radius-card)] bg-bg-card shadow-node transition-all duration-300 ease-out",
        interactive && "hover:-translate-y-1 hover:shadow-node-hover",
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = "Panel";

/**
 * Corner brackets — four hairline L-marks pinned to a Panel's corners, like
 * registration marks on a schematic. Purely decorative.
 */
export function Brackets({ className }: { className?: string }) {
  const base = "pointer-events-none absolute h-3 w-3 border-accent/45 transition-colors";
  return (
    <span aria-hidden className={cn("absolute inset-0", className)}>
      <span className={cn(base, "left-2 top-2 border-l border-t")} />
      <span className={cn(base, "right-2 top-2 border-r border-t")} />
      <span className={cn(base, "bottom-2 left-2 border-b border-l")} />
      <span className={cn(base, "bottom-2 right-2 border-b border-r")} />
    </span>
  );
}

/**
 * A mono strip across the top of a Panel: a live dot, a label, and optional
 * trailing content. The console's title bar.
 */
interface PanelBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  live?: boolean;
}
const PanelBar = React.forwardRef<HTMLDivElement, PanelBarProps>(
  ({ className, label, live, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2.5 border-b border-border px-4 py-2.5",
        className,
      )}
      {...props}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        {live ? (
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-node" />
        ) : null}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      {label ? (
        <span className="truncate font-mono text-[10px] uppercase text-fg-muted">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  ),
);
PanelBar.displayName = "PanelBar";

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 sm:p-7", className)} {...props} />
  ),
);
PanelContent.displayName = "PanelContent";

/** A small mono chip used for tags, categories and integration names. */
export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Panel, PanelBar, PanelContent };
