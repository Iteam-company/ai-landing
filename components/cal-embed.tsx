import { cn } from "@/lib/utils";

// Embedded scheduling widget for the conversion zone. Uses a plain <iframe>
// rather than Cal.com's embed script so it works in a static export with no
// third-party JS on the page.
//
//   NEXT_PUBLIC_CAL_LINK        e.g. "neuroflow/30min"  → https://cal.com/…
//   NEXT_PUBLIC_CAL_EMBED_URL   any other provider (Calendly, Zcal, …); wins
//                               over CAL_LINK when both are set.
//
// With neither set the block renders a placeholder instead of a dead frame.

const EMBED_URL = process.env.NEXT_PUBLIC_CAL_EMBED_URL?.trim();
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK?.trim();

export function calEmbedUrl(): string | null {
  if (EMBED_URL) return EMBED_URL;
  if (CAL_LINK) {
    const link = CAL_LINK.replace(/^\/+|\/+$/g, "");
    return `https://cal.com/${link}?embed=true&theme=dark&layout=month_view`;
  }
  return null;
}

export function CalEmbed({
  title,
  placeholder,
  className,
}: {
  title: string;
  placeholder: string;
  className?: string;
}) {
  const src = calEmbedUrl();

  if (!src) {
    return (
      <div
        className={cn(
          "flex min-h-[26rem] items-center justify-center rounded-[var(--radius-input)] border border-dashed border-border p-8",
          className,
        )}
      >
        <p className="max-w-xs text-center font-mono text-[11px] leading-relaxed text-fg-muted">
          {placeholder}
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      className={cn(
        "min-h-[32rem] w-full rounded-[var(--radius-input)] border border-border bg-bg",
        className,
      )}
    />
  );
}
