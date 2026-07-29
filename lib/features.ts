// EasyLand feature flags — the single source of truth for which optional
// features this client has switched on. Set by the CLI at scaffold time via
// NEXT_PUBLIC_EASYLAND_FEATURES (a comma list, e.g. "calendar,customers").
//
// This module is CLIENT-SAFE (no server-only imports) so UI components can call
// hasFeature() to render a block only when its feature is enabled. When the list
// is empty the page renders exactly as a plain static landing page.

export type Feature = "calendar" | "customers";

export const FEATURES: Feature[] = (process.env.NEXT_PUBLIC_EASYLAND_FEATURES ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean) as Feature[];

export function hasFeature(feature: Feature): boolean {
  return FEATURES.includes(feature);
}

/**
 * True when any backend feature is on. Mirrors the server-only EASYLAND_BACKEND
 * flag that next.config.ts reads to switch from static export to a server build.
 */
export const HAS_BACKEND = FEATURES.length > 0;
