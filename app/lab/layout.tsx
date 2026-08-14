import "../globals.css";
import { resolvePalette } from "@/lib/palettes";
import { fontVariables } from "@/app/fonts";
import { DEFAULT_LOCALE, HTML_LANG } from "@/lib/lang";

// /lab is an internal visual-experiments area (not part of the localized
// marketing site), so — like /admin — it carries its own root layout rather
// than living under app/[[...lang]].

export default function LabLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE);

  return (
    <html
      lang={HTML_LANG[DEFAULT_LOCALE]}
      data-palette={palette}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
