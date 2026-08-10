"use client";

import { useCallback, useRef, useState, type RefObject } from "react";

// Cursor-following glow — locally adapted from React Bits' SpotlightCard
// (https://reactbits.dev/components/spotlight-card). The original is a
// self-contained wrapper `<div>`; here it's split into a hook + a thin overlay
// so it can layer onto this project's own `Panel` primitive (shared corner
// brackets, shadow tokens, "group" hover language) instead of duplicating
// that styling inside a second wrapper element.
//
// Tuned for "atmosphere, not spectacle": a small fixed-radius circle, low
// peak opacity, and color driven by the active palette's accent token
// (`--color-accent`) rather than a hardcoded hex — so it re-skins correctly
// across voltage/ember/plasma instead of only looking right on one of them.
// A per-element `mousemove` listener only (no `window` listener), matching
// the upstream component's approach.

interface UseSpotlightOptions {
  /** Any valid CSS color; defaults to the palette accent, dimmed. */
  color?: string;
  /** Spotlight circle radius, in px — deliberately small/contained. */
  radius?: number;
  /** Peak opacity while hovered/focused (0–1). Keep this low. */
  maxOpacity?: number;
}

// Takes the card's ref rather than creating its own: the owning component
// keeps the ref (a single `useRef()` call it passes straight to the DOM
// node), and this hook only ever reads from it inside handlers — never
// during render.
export function useSpotlight(
  ref: RefObject<HTMLDivElement | null>,
  {
    color = "color-mix(in oklab, var(--color-accent) 70%, transparent)",
    radius = 140,
    maxOpacity = 0.16,
  }: UseSpotlightOptions = {},
) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const focused = useRef(false);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (focused.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [ref]);

  const onMouseEnter = useCallback(() => setOpacity(maxOpacity), [maxOpacity]);
  const onMouseLeave = useCallback(() => setOpacity(0), []);

  // Keyboard focus can't supply a pointer position, so the glow centers on
  // the card instead of jumping to a stale (or default 0,0) coordinate.
  const onFocus = useCallback(() => {
    focused.current = true;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.width / 2, y: rect.height / 2 });
    }
    setOpacity(maxOpacity);
  }, [maxOpacity, ref]);

  const onBlur = useCallback(() => {
    focused.current = false;
    setOpacity(0);
  }, []);

  return {
    handlers: { onMouseMove, onMouseEnter, onMouseLeave, onFocus, onBlur },
    style: {
      opacity,
      background: `radial-gradient(circle ${radius}px at ${pos.x}px ${pos.y}px, ${color}, transparent)`,
    } satisfies React.CSSProperties,
  };
}

/** The glow layer itself — render as the first child of the hovered element. */
export function SpotlightLayer({ style }: { style: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-out"
      style={style}
    />
  );
}
