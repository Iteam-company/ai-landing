"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Site } from "@/content/site";

interface HeaderProps {
  nav: Site["nav"];
  brand: Site["brand"];
}

export function Header({ nav, brand }: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  // The hairline under the bar doubles as a read-progress meter — the console
  // always shows how far the signal has travelled.
  React.useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 12);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-bg/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <a href="#top" className="group flex items-center gap-3" aria-label={brand.name}>
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-input)] bg-accent font-display text-[13px] font-bold text-accent-fg transition-transform group-hover:-rotate-6">
            {brand.monogram}
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {brand.name.toLowerCase()}
            <span className="text-accent">.</span>
            <span className="text-fg-muted">{brand.suffix}</span>
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
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href={nav.cta.href}>{nav.cta.label}</a>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-input)] border border-border text-fg md:hidden"
            aria-label="Открыть меню"
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* progress rail */}
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
              <div className="mt-2 border-t border-border px-1 pt-2">
                <Button asChild className="w-full">
                  <a href={nav.cta.href} onClick={() => setOpen(false)}>
                    {nav.cta.label}
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
