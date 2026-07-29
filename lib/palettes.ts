// Palette registry for this template. Keep in sync with the [data-palette]
// blocks in app/globals.css and the "palettes" array in easyland.template.json.
export const PALETTES = ["voltage", "ember", "plasma"] as const;
export type Palette = (typeof PALETTES)[number];

export const DEFAULT_PALETTE: Palette = "voltage";

export function isPalette(value: string | null | undefined): value is Palette {
  return value != null && (PALETTES as readonly string[]).includes(value);
}

/** Falls back to the default palette for unknown/empty values. */
export function resolvePalette(value: string | null | undefined): Palette {
  return isPalette(value) ? value : DEFAULT_PALETTE;
}
