"use client";

// Utilities shared by both Core concept prototypes (glass-reactor-core.tsx,
// data-construct-core.tsx) — kept framework-light (no React) so either
// concept, or a future production port, can reuse them independently.

import * as THREE from "three";

/** Deterministic (not Math.random) pseudo-random unit value — same scene every load. */
export function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function resolveCssColor(varName: string, fallback: string): THREE.Color {
  const raw =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      : "";
  const color = new THREE.Color();
  try {
    color.setStyle(raw || fallback);
  } catch {
    color.set(fallback);
  }
  return color;
}

export function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Unit-sphere Fibonacci point — same distribution as production's ASSEMBLED_POSITIONS. */
export function fibonacciSpherePoint(index: number, count: number, thetaOffset = 0): [number, number, number] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = count > 1 ? 1 - (index / (count - 1)) * 2 : 0;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index + thetaOffset;
  return [Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY];
}

/** Lerps a group's rotation toward the pointer position — the idle "parallax" both concepts share. */
export function applyPointerParallax(group: THREE.Object3D, pointer: THREE.Vector2, strength = 0.04) {
  group.rotation.y += (pointer.x * 0.25 - group.rotation.y) * strength;
  group.rotation.x += (-pointer.y * 0.18 - group.rotation.x) * strength;
}
