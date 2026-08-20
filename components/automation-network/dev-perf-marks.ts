// Development-only User Timing marks for manually profiling one ENTER CORE
// scroll in Chrome DevTools Performance: record a trace, scroll through the
// section once, stop, then read the "Timings" track for exactly where each
// phase below started/ended relative to the CPU/GPU activity around it.
//
// process.env.NODE_ENV is statically replaced at build time (Next.js'
// webpack/Turbopack define), so PERF_MARKS_ENABLED folds to the literal
// `false` in a production build and every markPhaseTransition() call below
// becomes a single-comparison no-op — no marks, no behavior change, nothing
// to ship. This must never be imported for anything other than diagnostics.
const PERF_MARKS_ENABLED =
  process.env.NODE_ENV !== "production" &&
  typeof performance !== "undefined" &&
  typeof performance.mark === "function";

const phaseActive = new Map<string, boolean>();

/**
 * Call unconditionally, every frame, with the phase's current boolean state
 * — it only actually touches `performance` on the frame `active` changes
 * (never per-frame), emitting a `${key}:start`/`${key}:end` mark and, once
 * both exist, a `${key}` measure spanning them. Safe as a no-op guard: a
 * missing start (e.g. dev reload landing mid-phase) just skips the measure.
 */
export function markPhaseTransition(key: string, active: boolean): void {
  if (!PERF_MARKS_ENABLED) return;
  const was = phaseActive.get(key) ?? false;
  if (active === was) return;
  phaseActive.set(key, active);

  const startLabel = `${key}:start`;
  const endLabel = `${key}:end`;
  performance.mark(active ? startLabel : endLabel);
  if (!active) {
    try {
      performance.measure(key, startLabel, endLabel);
    } catch {
      // no matching start mark (e.g. recording started mid-phase) — nothing to measure
    }
  }
}
