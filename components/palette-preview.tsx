"use client";

import { useEffect } from "react";
import { isPalette } from "@/lib/palettes";

/**
 * Preview-only palette override. Reads `?color=<palette>` from the URL (used by
 * the EasyLand CLI's local preview) and applies it to <html data-palette>.
 *
 * Deliberately reads window.location directly instead of `useSearchParams()`,
 * so it needs no Suspense boundary and stays compatible with `output: "export"`.
 * In production there is no `?color=`, so this is inert and the build-time
 * palette (NEXT_PUBLIC_SITE_PALETTE) set on <html> stands.
 */
export function PalettePreview() {
  useEffect(() => {
    const color = new URLSearchParams(window.location.search).get("color");
    if (isPalette(color)) {
      document.documentElement.dataset.palette = color;
    }
  }, []);

  return null;
}
