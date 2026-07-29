import type { Metadata } from "next";
import { Geologica, Martian_Mono, Golos_Text } from "next/font/google";
import "./globals.css";
import { resolvePalette } from "@/lib/palettes";
import { PalettePreview } from "@/components/palette-preview";
import { site } from "@/content/site";

// All three carry Cyrillic — this template's content is Russian.

// Display headlines: technical, slightly condensed grotesque.
const display = Geologica({
  variable: "--font-display-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Mono: eyebrows, labels, metadata, node captions. Deliberately wide and blocky.
const mono = Martian_Mono({
  variable: "--font-mono-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Body copy.
const sans = Golos_Text({
  variable: "--font-sans-src",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.meta.url),
  title: {
    default: site.meta.title,
    template: `%s · ${site.brand.name}`,
  },
  description: site.meta.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Build-time palette (per-client via NEXT_PUBLIC_SITE_PALETTE; defaults to voltage).
  // PalettePreview overrides this from ?color= during local CLI preview only.
  const palette = resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE);

  return (
    <html
      lang="ru"
      data-palette={palette}
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <PalettePreview />
        {children}
      </body>
    </html>
  );
}
