export interface CoreVariantProps {
  /** 0 (dormant) → 1 (fully active) — stand-in for the future scroll-driven signal. */
  activity: number;
  /** Freezes idle time-based motion (rotation/breathing/drift) while true; `activity`-driven scale/opacity/color still respond instantly. */
  paused?: boolean;
}
