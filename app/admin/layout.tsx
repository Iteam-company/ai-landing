import "../globals.css";
import { resolvePalette } from "@/lib/palettes";
import { fontVariables } from "@/app/fonts";
import { DEFAULT_LOCALE, HTML_LANG } from "@/lib/lang";

// The admin dashboard is not part of the localized site (it is the agency's own
// internal panel), so it carries its own root layout and always renders in the
// build's default locale. Pruned together with app/api for static clients.

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const palette = resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE);

  return (
    <html
      lang={HTML_LANG[DEFAULT_LOCALE]}
      data-palette={palette}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
