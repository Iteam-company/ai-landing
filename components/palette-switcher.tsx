"use client";

import * as React from "react";
import { Palette as PaletteIcon, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  SWITCHER_PALETTES,
  PALETTE_STORAGE_KEY,
  PALETTE_CHANGE_EVENT,
  PALETTE_SWATCHES,
  resolvePalette,
  isPalette,
  isSwitcherPalette,
  type Palette,
  type SwitcherPalette,
} from "@/lib/palettes";

export type PaletteSwitcherNames = Record<SwitcherPalette, string>;

function useActivePalette() {
  const [active, setActive] = React.useState<Palette>(() =>
    resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE),
  );

  React.useEffect(() => {
    const current = document.documentElement.dataset.palette;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isPalette(current) && current !== active) setActive(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = React.useCallback((id: SwitcherPalette) => {
    document.documentElement.dataset.palette = id;
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, id);
    } catch {
    }
    window.dispatchEvent(new CustomEvent(PALETTE_CHANGE_EVENT, { detail: id }));
    setActive(id);
  }, []);

  return { active, select };
}

function Swatch({ id, className }: { id: SwitcherPalette; className?: string }) {
  const { bg, accent } = PALETTE_SWATCHES[id];
  return (
    <span
      aria-hidden
      className={cn("shrink-0 rounded-full border border-border/60", className)}
      style={{ background: `linear-gradient(135deg, ${accent} 50%, ${bg} 50%)` }}
    />
  );
}

export function PaletteSwitcher({
  label,
  names,
  className,
}: {
  label: string;
  names: PaletteSwitcherNames;
  className?: string;
}) {
  const { active, select } = useActivePalette();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-accent/45 hover:text-fg"
      >
        {isSwitcherPalette(active) ? <Swatch id={active} className="h-4 w-4" /> : <PaletteIcon size={16} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-44 rounded-[var(--radius-card)] border border-border bg-bg-soft/95 p-1.5 shadow-node backdrop-blur-xl"
          >
            {SWITCHER_PALETTES.map((id) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    select(id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-input)] px-2.5 py-2 font-mono text-[11px] uppercase transition-colors",
                    isActive ? "bg-accent/10 text-fg" : "text-fg-muted hover:bg-fg/5 hover:text-fg",
                  )}
                >
                  <Swatch id={id} className="h-4 w-4" />
                  <span className="flex-1 text-left">{names[id]}</span>
                  {isActive ? <Check aria-hidden size={13} className="text-accent" /> : null}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PaletteSwitcherMobile({
  label,
  names,
  className,
}: {
  label: string;
  names: PaletteSwitcherNames;
  className?: string;
}) {
  const { active, select } = useActivePalette();

  return (
    <div className={className}>
      <span className="block px-1 pb-2 font-mono text-[9px] uppercase tracking-wide text-fg-muted">{label}</span>
      <div role="group" aria-label={label} className="grid grid-cols-3 gap-1.5">
        {SWITCHER_PALETTES.map((id) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[var(--radius-input)] border px-2 py-2.5 font-mono text-[9px] uppercase transition-colors",
                isActive
                  ? "border-accent/60 bg-accent/10 text-fg"
                  : "border-border text-fg-muted hover:bg-fg/5 hover:text-fg",
              )}
            >
              <Swatch id={id} className="h-5 w-5" />
              {names[id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
