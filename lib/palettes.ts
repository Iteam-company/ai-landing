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

export const DEFAULT_PALETTE: Palette = "monochrome";

export function isPalette(value: string | null | undefined): value is Palette {
  return value != null && (PALETTES as readonly string[]).includes(value);
}

export function resolvePalette(value: string | null | undefined): Palette {
  return isPalette(value) ? value : DEFAULT_PALETTE;
}
