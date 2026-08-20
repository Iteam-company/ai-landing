"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { CallModal } from "@/components/call-modal";
import { LangSwitcher } from "@/components/lang-switcher";
import type { Site, Ui } from "@/content/types";
import type { Locale } from "@/lib/lang";

interface HeaderProps {
  nav: Site["nav"];
  brand: Site["brand"];
  locale: Locale;
  a11y: Ui["a11y"];
  calendar: Site["contact"]["calendar"];
}

export function Header({ nav, brand, locale, a11y, calendar }: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let maxScroll = document.body.scrollHeight - window.innerHeight;
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      setScrolled(window.scrollY > 12);
      setProgress(maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0);
    };
    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(update);
    };
    const onResize = () => {
      maxScroll = document.body.scrollHeight - window.innerHeight;
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <header
      id="site-header"
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-bg/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <a
          href="#top"
          className="group flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-80"
          aria-label={`${brand.name}${brand.suffix}`}
        >
          <BrandMark className="h-7 w-auto text-fg" />
          <span className="font-display text-[15px] uppercase tracking-wide">
            <span className="font-bold text-fg">{brand.name}</span>
            <span className="font-medium text-fg-muted">{brand.suffix}</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 font-mono text-[11px] uppercase text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher locale={locale} label={a11y.language} className="hidden sm:flex" />
          <CallModal
            label={nav.cta.label}
            calendar={calendar}
            closeLabel={a11y.close}
            size="sm"
            className="hidden sm:inline-flex"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-input)] border border-border text-fg md:hidden"
            aria-label={a11y.menu}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      <div className={cn("h-px w-full transition-colors", scrolled ? "bg-border" : "bg-transparent")}>
        <div
          className="h-px bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden"
          >
            <div className="mx-5 mt-3 rounded-[var(--radius-card)] border border-border bg-bg-soft/95 p-2 backdrop-blur-xl">
              <ul className="flex flex-col">
                {nav.items.map((item, i) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-[var(--radius-input)] px-3 py-3 font-mono text-xs uppercase text-fg hover:bg-fg/5"
                    >
                      <span className="text-accent/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-2 space-y-3 border-t border-border px-1 pt-2">
                <div onClick={() => setOpen(false)}>
                  <CallModal
                    label={nav.cta.label}
                    calendar={calendar}
                    closeLabel={a11y.close}
                    className="w-full"
                  />
                </div>
                <LangSwitcher
                  locale={locale}
                  label={a11y.language}
                  className="justify-center sm:hidden"
                  onNavigate={() => setOpen(false)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
