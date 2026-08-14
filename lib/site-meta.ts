import { site } from "@/content";
import { resolvePalette, type Palette } from "@/lib/palettes";

const ACCENTS: Record<Palette, string> = {
  voltage: "#c8f042",
  ember: "#ff7a45",
  plasma: "#ff4d8d",
  paper: "#201d17",
  cobalt: "#2f7dff",
  crimson: "#e2222f",
  solar: "#ff8a00",
  monochrome: "#f5f5f5",
};

export function siteMeta(): { brand: string; accent: string } {
  return {
    brand: site.brand.name,
    accent: ACCENTS[resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE)],
  };
}
