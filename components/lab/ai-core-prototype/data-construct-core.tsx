"use client";

// Concept B — "Data Construct Core": the Core built from the same "data
// language" as the production connections (components/automation-network/
// scene-controller.ts) — conduit/filament/helix tube shaders — but reused as
// an idea, not imported code (production stays untouched).
//
// Two filament populations:
//   - INNER: short curved filaments radiating from near-center out to a
//     Fibonacci-sphere shell — collectively read as a dense, organic sphere,
//     not a tangle of wires (the curve's mid-point twist keeps each one
//     genuinely curved rather than a straight spike);
//   - THROUGH: longer chords between points on an outer shell, routed close
//     to the origin — "a few streams passing through the core," brighter and
//     thicker than the inner population, giving explicit depth hierarchy.
// A small bright icosahedron + local billboard glow stays the focal point.
//
// Both `activity` reactions are cheap/GPU-side, not a per-frame CPU rebuild:
// higher activity speeds up the helix/pulse (materials.ts) and shrinks the
// vertex-shader "settle" jitter, so the construct visibly organizes itself
// without ever touching geometry after construction.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { CoreGlowMaterial, buildFilamentMaterial } from "./materials";
import { applyPointerParallax, fibonacciSpherePoint, resolveCssColor, seededUnit } from "./shared";
import type { CoreVariantProps } from "./types";

const INNER_COUNT = 30;
const INNER_RADIUS = 0.56;
// Kept close to INNER_RADIUS (not a long "sun ray" reaching past it) so the
// through-streams stay part of the same compact silhouette, distinguished by
// brightness/thickness rather than by reaching further out.
const THROUGH_COUNT = 9;
const THROUGH_RADIUS = 0.62;
const TUBULAR_SEGMENTS = 20;
const RADIAL_SEGMENTS = 6;
const TUBE_RADIUS_INNER = 0.005;
const TUBE_RADIUS_THROUGH = 0.0085;
// Filaments start outside this radius, leaving the hot inner core + its glow
// a visible gap instead of every strand converging into one blown-out point.
const CENTER_GAP = 0.16;

interface Filament {
  geometry: THREE.TubeGeometry;
  isThrough: boolean;
  phase: number;
}

/**
 * Two vectors orthogonal to `dir` (and to each other), chosen to never
 * degenerate — picking the reference axis by which world axis `dir` is
 * LEAST aligned with. A single fixed-formula perpendicular (e.g. crossing
 * with a constant axis) collapses near the poles of a Fibonacci sphere
 * (dir ≈ ±Y here), which — for a camera looking straight down -Z — bows the
 * curve entirely along the view axis: invisible in screen space, so the
 * filament renders as a perfectly straight spike. Bowing along two
 * independent axes guarantees at least one is visible from any angle.
 */
function perpendicularBasis(dir: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const ref = Math.abs(dir.y) < 0.85 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const perpA = new THREE.Vector3().crossVectors(dir, ref).normalize();
  const perpB = new THREE.Vector3().crossVectors(dir, perpA).normalize();
  return [perpA, perpB];
}

function buildInnerFilament(index: number): THREE.TubeGeometry {
  const dirArr = fibonacciSpherePoint(index, INNER_COUNT, 0.9);
  const dir = new THREE.Vector3(dirArr[0], dirArr[1], dirArr[2]);
  const end = dir.clone().multiplyScalar(INNER_RADIUS);
  const start = dir.clone().multiplyScalar(CENTER_GAP + seededUnit(index * 3.7) * 0.08);

  const [perpA, perpB] = perpendicularBasis(dir);
  const twistA = (seededUnit(index * 3.7 + 1) - 0.5) * 2;
  const twistB = (seededUnit(index * 3.7 + 2) - 0.5) * 2;
  // A pronounced, two-axis mid-curve bow so each filament reads as genuinely
  // curved/braided from any camera angle, not a straight spike — the "woven
  // sphere" look rather than a starburst.
  const mid = start
    .clone()
    .lerp(end, 0.5)
    .addScaledVector(perpA, twistA * INNER_RADIUS * 0.55)
    .addScaledVector(perpB, twistB * INNER_RADIUS * 0.4);
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, TUBE_RADIUS_INNER, RADIAL_SEGMENTS, false);
}

function buildThroughFilament(index: number): THREE.TubeGeometry {
  const aArr = fibonacciSpherePoint(index, THROUGH_COUNT, 2.4);
  const bArr = fibonacciSpherePoint(THROUGH_COUNT - 1 - index, THROUGH_COUNT, 2.4 + Math.PI * 0.65);
  const a = new THREE.Vector3(aArr[0], aArr[1], aArr[2]);
  const b = new THREE.Vector3(bArr[0], bArr[1], bArr[2]);
  const start = a.clone().multiplyScalar(THROUGH_RADIUS);
  const end = b.clone().multiplyScalar(THROUGH_RADIUS);

  // Bow the chord's midpoint off-axis (two independent axes, never
  // degenerate — see perpendicularBasis) so it arcs past the core instead of
  // drawing a straight diameter through it. Magnitude kept away from 0 on
  // both axes so no through-filament ever lands near-straight.
  const [bowA, bowB] = perpendicularBasis(a);
  const signA = seededUnit(index * 5.1 + 3) > 0.5 ? 1 : -1;
  const signB = seededUnit(index * 5.1 + 5) > 0.5 ? 1 : -1;
  const magA = signA * (0.3 + seededUnit(index * 5.1 + 4) * 0.6);
  const magB = signB * (0.3 + seededUnit(index * 5.1 + 6) * 0.6);
  const mid = start
    .clone()
    .add(end)
    .multiplyScalar(0.5)
    .addScaledVector(bowA, magA * THROUGH_RADIUS * 0.4)
    .addScaledVector(bowB, magB * THROUGH_RADIUS * 0.3);
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, TUBE_RADIUS_THROUGH, RADIAL_SEGMENTS, false);
}

export function DataConstructCore({ activity, paused = false }: CoreVariantProps) {
  const accent = useMemo(() => resolveCssColor("--color-accent", "#c8f042"), []);
  const fgMuted = useMemo(() => resolveCssColor("--color-fg-muted", "#8b9088"), []);
  const hot = useMemo(() => accent.clone().lerp(new THREE.Color("#ffffff"), 0.6), [accent]);

  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const pointer = useRef(new THREE.Vector2());
  const timeRef = useRef(0);

  const filaments = useMemo<Filament[]>(() => {
    const inner = Array.from({ length: INNER_COUNT }, (_, i) => ({
      geometry: buildInnerFilament(i),
      isThrough: false,
      phase: seededUnit(i * 3.7 + 9) * Math.PI * 2,
    }));
    const through = Array.from({ length: THROUGH_COUNT }, (_, i) => ({
      geometry: buildThroughFilament(i),
      isThrough: true,
      phase: seededUnit(i * 5.1 + 9) * Math.PI * 2,
    }));
    return [...inner, ...through];
  }, []);

  const filamentMaterials = useMemo(
    () => filaments.map((f) => buildFilamentMaterial(fgMuted, hot, f.phase, f.isThrough)),
    // filaments is a stable useMemo(() => ..., []) result — only fgMuted/hot (CSS-derived colors) should rebuild materials.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fgMuted, hot],
  );

  useEffect(
    () => () => {
      filaments.forEach((f) => f.geometry.dispose());
    },
    [filaments],
  );
  useEffect(
    () => () => {
      filamentMaterials.forEach((m) => m.dispose());
    },
    [filamentMaterials],
  );

  const glowMaterial = useMemo(() => {
    const material = new CoreGlowMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    return material;
  }, []);
  const glowMaterialRef = useRef<InstanceType<typeof CoreGlowMaterial>>(null);
  useEffect(() => {
    if (glowMaterialRef.current) glowMaterialRef.current.uColor = hot;
  }, [hot]);
  useEffect(() => () => glowMaterial.dispose(), [glowMaterial]);

  useFrame((state, delta) => {
    const dt = paused ? 0 : delta;
    timeRef.current += dt;
    const t = timeRef.current;

    filamentMaterials.forEach((material) => {
      material.uniforms.uTime.value = t;
      material.uniforms.uActivity.value = activity;
    });

    if (innerRef.current) {
      const breathe = 1 + Math.sin(t * 1.7) * (0.04 + activity * 0.09);
      innerRef.current.scale.setScalar(breathe);
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.uOpacity = 0.1 + activity * 0.22 + Math.sin(t * 1.7) * 0.015;
    }

    // The whole construct spins slowly on its own besides pointer parallax —
    // idle motion for a structure with no per-shell rotation of its own.
    if (groupRef.current) {
      if (!paused) groupRef.current.rotation.y += dt * (0.03 + activity * 0.05);
      pointer.current.set(state.pointer.x, state.pointer.y);
      applyPointerParallax(groupRef.current, pointer.current);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.15} />

      {/* small bright focal point */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.09, 2]} />
        <meshBasicMaterial color={hot} />
      </mesh>

      <Billboard>
        <mesh scale={0.38}>
          <planeGeometry args={[1, 1]} />
          <primitive ref={glowMaterialRef} object={glowMaterial} attach="material" />
        </mesh>
      </Billboard>

      {filaments.map((filament, i) => (
        <mesh key={i} geometry={filament.geometry}>
          <primitive object={filamentMaterials[i]} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
