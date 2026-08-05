import { cn } from "@/lib/utils";
import { LOCALES, LOCALE_LABEL, LOCALE_NAME, localeHref, type Locale } from "@/lib/lang";

// Locale switcher — a row of mono pills in the header (one per locale), styled
// like the nav chips. Plain <a> links, not next/link: switching language swaps
// <html lang> and the whole document, so a full navigation is both correct and
// cheap. The hrefs come from lib/lang (default locale at "/", the rest under
// "/<locale>/"). With a single locale in LOCALES there is nothing to switch
// between, so the component renders nothing.

export function LangSwitcher({
  locale,
  label,
  className,
  onNavigate,
}: {
  locale: Locale;
  /** aria-label for the group. */
  label: string;
  className?: string;
  /** Lets the mobile menu close itself on tap. */
  onNavigate?: () => void;
}) {
  if (LOCALES.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border p-0.5",
        className,
      )}
    >
      {LOCALES.map((item) => {
        const active = item === locale;
        return (
          <a
            key={item}
            href={localeHref(item)}
            hrefLang={item}
            lang={item}
            title={LOCALE_NAME[item]}
            aria-current={active ? "true" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase transition-colors",
              active
                ? "bg-accent text-accent-fg"
                : "text-fg-muted hover:bg-fg/5 hover:text-fg",
            )}
          >
            {LOCALE_LABEL[item]}
          </a>
        );
      })}
    </div>
  );
}
