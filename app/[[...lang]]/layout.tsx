import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { resolvePalette } from "@/lib/palettes";
import { PalettePreview } from "@/components/palette-preview";
import { getContent } from "@/content";
import { fontVariables } from "@/app/fonts";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  OG_LOCALE,
  PREFIXED_LOCALES,
  localeFromSegments,
  localeHref,
} from "@/lib/lang";

// Root layout of the localized site. It sits on the optional catch-all segment so
// it can read the locale and put it on <html lang>: the default locale renders at
// "/" and every other locale at "/<locale>/" — both prerendered, so a static
// export needs no proxy and the canonical URL takes no redirect hop.
//
// /admin has its own root layout (app/admin/layout.tsx); route handlers under
// app/api need none.

interface LangParams {
  params: Promise<{ lang?: string[] }>;
}

export function generateStaticParams(): { lang: string[] }[] {
  return [{ lang: [] }, ...PREFIXED_LOCALES.map((locale) => ({ lang: [locale] }))];
}

// Only the locales above exist; anything else is a 404 rather than a runtime render.
export const dynamicParams = false;

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const locale = localeFromSegments((await params).lang) ?? DEFAULT_LOCALE;
  const site = getContent(locale);

  return {
    metadataBase: new URL(site.meta.url),
    title: {
      default: site.meta.title,
      template: `%s · ${site.brand.name}`,
    },
    description: site.meta.description,
    alternates: {
      canonical: localeHref(locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localeHref(l)])),
        "x-default": localeHref(DEFAULT_LOCALE),
      },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      url: localeHref(locale),
      siteName: site.brand.name,
      title: site.meta.title,
      description: site.meta.description,
      images: [site.meta.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: site.meta.title,
      description: site.meta.description,
      images: [site.meta.ogImage],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode }> & LangParams) {
  const locale = localeFromSegments((await params).lang);
  if (!locale) notFound();

  // Build-time palette (per-client via NEXT_PUBLIC_SITE_PALETTE; defaults to voltage).
  // PalettePreview overrides this from ?color= during local CLI preview only.
  const palette = resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE);

  return (
    <html
      lang={HTML_LANG[locale]}
      data-palette={palette}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <PalettePreview />
        {children}
      </body>
    </html>
  );
}
