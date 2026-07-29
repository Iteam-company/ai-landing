import { site } from "@/content/site";
import { resolvePalette, type Palette } from "@/lib/palettes";

// Brand name + active accent hex for theme-matched emails. Per-template (this
// template is Russian-only with a single typed content/site.ts and the
// voltage/ember/plasma palettes).
const ACCENTS: Record<Palette, string> = {
  voltage: "#c8f042",
  ember: "#ff7a45",
  plasma: "#ff4d8d",
};

export function siteMeta(): { brand: string; accent: string } {
  return {
    brand: site.brand.name,
    accent: ACCENTS[resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE)],
  };
}
