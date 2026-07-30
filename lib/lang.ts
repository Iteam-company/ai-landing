// Locale registry for the template. CLIENT-SAFE (no server imports) so both the
// layout and the client components can import it.
//
// Routing shape (static-export friendly — no proxy, no redirects):
//   • the DEFAULT locale is served at the root      → "/"
//   • every other locale gets a path prefix         → "/en/"
// `app/[[...lang]]` is an optional catch-all, so both are prerendered by
// generateStaticParams and there is no redirect hop on the canonical URL.
//
// The default locale is a build-time choice, like the palette:
// NEXT_PUBLIC_SITE_LOCALE=en makes English the root and moves Russian to "/ru/".

export const LOCALES = ["ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

const FALLBACK_LOCALE: Locale = "ru";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Narrows an env value / route segment to a supported locale. */
export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value?.trim()) ? (value!.trim() as Locale) : FALLBACK_LOCALE;
}

/** The locale served at "/" — set per client via NEXT_PUBLIC_SITE_LOCALE. */
export const DEFAULT_LOCALE: Locale = resolveLocale(process.env.NEXT_PUBLIC_SITE_LOCALE);

/**
 * Narrows an untrusted value (a `locale` field in a request body) to a supported
 * locale, falling back to the build's default rather than to a fixed language.
 */
export function requestLocale(value: unknown): Locale {
  const raw = typeof value === "string" ? value.trim() : undefined;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** Locales that live behind a path prefix, i.e. everything but the default. */
export const PREFIXED_LOCALES: Locale[] = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

/**
 * The locale for an `app/[[...lang]]` param: `undefined` → the root (default
 * locale), `["en"]` → that locale.
 */
export function localeFromSegments(segments: string[] | undefined): Locale | null {
  if (!segments || segments.length === 0) return DEFAULT_LOCALE;
  if (segments.length === 1 && isLocale(segments[0]) && segments[0] !== DEFAULT_LOCALE) {
    return segments[0];
  }
  return null;
}

/**
 * Home URL of a locale. Matches the build's `trailingSlash` (static builds keep
 * it on, backend builds turn it off — see next.config.ts) so switching language
 * never takes a 308 detour.
 */
export function localeHref(locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return "/";
  return process.env.NEXT_PUBLIC_TRAILING_SLASH === "1" ? `/${locale}/` : `/${locale}`;
}

/** `<html lang>` value. */
export const HTML_LANG: Record<Locale, string> = {
  ru: "ru",
  en: "en",
};

/** `og:locale` value. */
export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
};

/** BCP-47 tag for Intl / toLocaleDateString formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
};

/** Switcher labels — deliberately language-neutral (shown in every locale). */
export const LOCALE_LABEL: Record<Locale, string> = {
  ru: "ru",
  en: "en",
};

/** Full name of each language, in that language (for the switcher's title). */
export const LOCALE_NAME: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
};
