import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/ui/container";
import type { Site } from "@/content/types";

interface FooterProps {
  content: Site["footer"];
  brand: Site["brand"];
}

export function Footer({ content, brand }: FooterProps) {
  const copyright = content.copyright.replace(
    "{year}",
    new Date().getFullYear().toString(),
  );

  return (
    <footer className="relative border-t border-border bg-bg-soft/50 py-12">
      <Container>
        <div className="flex flex-col gap-9 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a
              href="#top"
              className="group inline-flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
              aria-label={`${brand.name}${brand.suffix}`}
            >
              <BrandMark className="h-7 w-auto text-fg" />
              <span className="font-display text-[15px] uppercase tracking-wide">
                <span className="font-bold text-fg">{brand.name}</span>
                <span className="font-medium text-fg-muted">{brand.suffix}</span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-fg-muted text-pretty">
              {content.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {content.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] uppercase text-fg-muted transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-11 flex flex-col gap-2 border-t border-border pt-6 font-mono text-[10px] uppercase text-fg-muted/70 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <p className="flex items-center gap-2">
            <span aria-hidden className="h-1 w-1 rotate-45 bg-accent/70" />
            {content.note}
          </p>
        </div>
      </Container>
    </footer>
  );
}
