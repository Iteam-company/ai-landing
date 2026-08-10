"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { CalEmbed } from "@/components/cal-embed";
import type { Site } from "@/content/types";

export function CallModal({
  label,
  calendar,
  closeLabel,
  variant = "primary",
  size = "lg",
  className,
}: {
  label: string;
  calendar: Site["contact"]["calendar"];
  closeLabel: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-bg/85 p-4 backdrop-blur-md sm:p-8"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={calendar.title}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-3xl rounded-(--radius-card) bg-bg-card shadow-node"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
              <span className="font-mono text-[10px] uppercase text-fg-muted">
                {calendar.caption}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="grid h-8 w-8 place-items-center rounded-input border border-border text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {calendar.title}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
                {calendar.description}
              </p>
              <CalEmbed
                title={calendar.title}
                placeholder={calendar.placeholder}
                className="mt-5"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <CalendarDays size={17} />
        {label}
      </Button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
