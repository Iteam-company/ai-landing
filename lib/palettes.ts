export const PALETTES = [
  "voltage",
  "ember",
  "plasma",
  "paper",
  "cobalt",
  "crimson",
  "solar",
  "monochrome",
] as const;
export type Palette = (typeof PALETTES)[number];

export const DEFAULT_PALETTE: Palette = "voltage";

export function isPalette(value: string | null | undefined): value is Palette {
  return value != null && (PALETTES as readonly string[]).includes(value);
}

export function resolvePalette(value: string | null | undefined): Palette {
  return isPalette(value) ? value : DEFAULT_PALETTE;
}

export const SWITCHER_PALETTES = ["ember", "paper", "cobalt", "crimson", "solar", "monochrome"] as const;
export type SwitcherPalette = (typeof SWITCHER_PALETTES)[number];

export function isSwitcherPalette(value: string | null | undefined): value is SwitcherPalette {
  return value != null && (SWITCHER_PALETTES as readonly string[]).includes(value);
}

export const PALETTE_STORAGE_KEY = "site-palette";

export const PALETTE_CHANGE_EVENT = "site:palette-change";

export const PALETTE_SWATCHES: Record<SwitcherPalette, { bg: string; accent: string }> = {
  ember: { bg: "#0f0a08", accent: "#ff7a45" },
  paper: { bg: "#f2efe7", accent: "#201d17" },
  cobalt: { bg: "#060a14", accent: "#2f7dff" },
  crimson: { bg: "#0b0605", accent: "#e2222f" },
  solar: { bg: "#100b06", accent: "#ff8a00" },
  monochrome: { bg: "#060606", accent: "#f5f5f5" },
};
