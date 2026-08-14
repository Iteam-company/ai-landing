"use client";

// Concept A — "Glass Reactor Core": a premium abstract energy reactor, not a
// glass ball with an orange bulb inside. Layered outside-in:
//   1. transmissive glass shell (MeshTransmissionMaterial) — kept NEUTRAL
//      (near-bg tint), so the shell itself reads as structure, not color;
//   2. a living procedural energy/noise layer visible through the glass
//      (EnergyNoiseMaterial — simplex-noise turbulence, see materials.ts);
//   3. a small, almost-white hot inner core (the only "light source" color);
//   4. three independent structural shells — an icosahedron cage, an
//      octahedron cage (asymmetric scale/tilt) and a thin containment ring —
//      each on its own axis/speed, all in dark/muted structural color;
//   5. a handful of asymmetric floating shards (mixed tetra/box "sensor
//      module" silhouettes), mostly muted, one or two lit as energy debris;
//   6. a small, LOCAL billboard glow — a supporting effect, not an atmosphere.
// Everything reactive to `activity` is either instant (opacity/color/distortion)
// or riding a local, pausable time accumulator (`timeRef`) — never React state,
// so this stays cheap to drive from a future scroll signal.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Edges, Environment, Float, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { CoreGlowMaterial, EnergyNoiseMaterial } from "./materials";
import { applyPointerParallax, resolveCssColor, seededUnit } from "./shared";
import type { CoreVariantProps } from "./types";

interface TransmissionMaterialInstance {
  distortion: number;
  temporalDistortion: number;
}

function buildRingLine(radius: number, color: THREE.Color, segments = 96): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 });
  return new THREE.Line(geometry, material);
}

const SHARD_COUNT = 7;

export function GlassReactorCore({ activity, paused = false }: CoreVariantProps) {
  const accent = useMemo(() => resolveCssColor("--color-accent", "#c8f042"), []);
  const fgMuted = useMemo(() => resolveCssColor("--color-fg-muted", "#8b9088"), []);
  const bg = useMemo(() => resolveCssColor("--color-bg", "#0a0b0f"), []);
  const hot = useMemo(() => accent.clone().lerp(new THREE.Color("#ffffff"), 0.62), [accent]);
  // The shell itself stays a neutral, near-background tint — energy color
  // lives in the noise layer + inner core, not in the glass.
  const glassTint = useMemo(() => bg.clone().lerp(fgMuted, 0.3), [bg, fgMuted]);

  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const cageARef = useRef<THREE.Mesh>(null);
  const cageBRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const ringLineRef = useRef<THREE.Line>(null);
  const transmissionRef = useRef<TransmissionMaterialInstance>(null);
  const pointer = useRef(new THREE.Vector2());
  const timeRef = useRef(0);

  const noiseMaterial = useMemo(() => {
    const material = new EnergyNoiseMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.side = THREE.DoubleSide;
    return material;
  }, []);
  const noiseMaterialRef = useRef<InstanceType<typeof EnergyNoiseMaterial>>(null);
  useEffect(() => {
    if (noiseMaterialRef.current) {
      noiseMaterialRef.current.uColorCold = fgMuted;
      noiseMaterialRef.current.uColorHot = hot;
    }
  }, [fgMuted, hot]);
  useEffect(() => () => noiseMaterial.dispose(), [noiseMaterial]);

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

  const ringLine = useMemo(() => buildRingLine(0.5, accent), [accent]);
  useEffect(
    () => () => {
      ringLine.geometry.dispose();
      (ringLine.material as THREE.LineBasicMaterial).dispose();
    },
    [ringLine],
  );

  const shardConfigs = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }, (_, i) => {
        const clusterBias = i < 5 ? 0.6 : 1;
        const theta = seededUnit(i * 3.1 + 1) * Math.PI * 2 * clusterBias + i * 0.7;
        const phi = (seededUnit(i * 3.1 + 2) - 0.5) * Math.PI * 0.75;
        const radius = 0.72 + seededUnit(i * 3.1 + 3) * 0.4;
        const isBox = seededUnit(i * 3.1 + 4) > 0.5;
        const scale = isBox
          ? [0.05 + seededUnit(i * 3.1 + 5) * 0.03, 0.02, 0.02]
          : [0.045 + seededUnit(i * 3.1 + 5) * 0.04, 0.045 + seededUnit(i * 3.1 + 5) * 0.04, 0.045 + seededUnit(i * 3.1 + 5) * 0.04];
        return {
          position: [
            Math.cos(theta) * Math.cos(phi) * radius,
            Math.sin(phi) * radius,
            Math.sin(theta) * Math.cos(phi) * radius,
          ] as [number, number, number],
          rotation: [seededUnit(i * 3.1 + 6) * Math.PI, seededUnit(i * 3.1 + 7) * Math.PI, 0] as [number, number, number],
          isBox,
          scale: scale as [number, number, number],
          speed: 0.5 + seededUnit(i * 3.1 + 8) * 0.7,
          floatIntensity: 0.35 + seededUnit(i * 3.1 + 9) * 0.5,
          // Only ~1 in 4 shards carries energy color — the rest are dark structural debris.
          lit: seededUnit(i * 3.1 + 10) > 0.72,
        };
      }),
    [],
  );

  useFrame((state, delta) => {
    const dt = paused ? 0 : delta;
    timeRef.current += dt;
    const t = timeRef.current;
    const speed = 1 + activity * 1.6;

    if (cageARef.current) cageARef.current.rotation.y += dt * 0.1 * speed;
    if (cageBRef.current) {
      cageBRef.current.rotation.x += dt * 0.08 * speed;
      cageBRef.current.rotation.z += dt * 0.045 * speed;
    }
    if (ringGroupRef.current) ringGroupRef.current.rotation.z -= dt * 0.14 * speed;

    if (innerRef.current) {
      const breathe = 1 + Math.sin(t * 1.5) * (0.05 + activity * 0.07);
      innerRef.current.scale.setScalar(breathe);
    }

    if (noiseMaterialRef.current) {
      noiseMaterialRef.current.uTime = t;
      noiseMaterialRef.current.uActivity = activity;
      noiseMaterialRef.current.uOpacity = 0.55 + activity * 0.35;
    }

    if (transmissionRef.current) {
      transmissionRef.current.distortion = 0.12 + activity * 0.4;
      transmissionRef.current.temporalDistortion = 0.02 + activity * 0.16;
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.uOpacity = 0.16 + activity * 0.26 + Math.sin(t * 1.5) * 0.02;
    }

    if (ringLineRef.current) {
      (ringLineRef.current.material as THREE.LineBasicMaterial).opacity = 0.14 + activity * 0.4;
    }

    pointer.current.set(state.pointer.x, state.pointer.y);
    if (groupRef.current) applyPointerParallax(groupRef.current, pointer.current);
  });

  return (
    <group ref={groupRef}>
      <Environment resolution={32}>
        <Lightformer intensity={0.8} color={accent.getStyle()} position={[2, 1, 1]} scale={3} />
        <Lightformer intensity={0.9} color="#ffffff" position={[-2, -1.5, -2]} scale={4} />
        <Lightformer intensity={0.35} color={fgMuted.getStyle()} position={[0, -2, 1]} scale={5} />
      </Environment>
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 3, 2]} intensity={0.4} />

      {/* 3. hot inner core — the one "almost white" light source */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.15, 2]} />
        <meshBasicMaterial color={hot} />
      </mesh>

      {/* 2. living energy/noise layer, visible through the glass shell */}
      <mesh>
        <icosahedronGeometry args={[0.27, 3]} />
        <primitive ref={noiseMaterialRef} object={noiseMaterial} attach="material" />
      </mesh>

      {/* 1. transmissive glass shell — neutral tint, structure not color */}
      <mesh>
        <icosahedronGeometry args={[0.44, 2]} />
        <MeshTransmissionMaterial
          ref={transmissionRef}
          samples={6}
          resolution={128}
          transmission={1}
          thickness={0.28}
          roughness={0.06}
          chromaticAberration={0.03}
          anisotropy={0.15}
          distortionScale={0.4}
          ior={1.15}
          color={glassTint}
          envMapIntensity={0.4}
          clearcoat={0.1}
        />
      </mesh>

      {/* 4a. structural shell — icosahedron cage, Y axis */}
      <mesh ref={cageARef}>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshBasicMaterial visible={false} />
        <Edges color={fgMuted} lineWidth={1} />
      </mesh>

      {/* 4b. structural shell — octahedron cage, asymmetric scale/tilt, X+Z axes */}
      <mesh ref={cageBRef} scale={[1, 1.16, 0.9]} rotation={[0.35, 0.2, 0.1]}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial visible={false} />
        <Edges color={fgMuted} lineWidth={1} />
      </mesh>

      {/* 4c. structural shell — thin containment ring, Z axis */}
      <group ref={ringGroupRef} rotation={[1.05, 0.35, 0]}>
        <primitive ref={ringLineRef} object={ringLine} />
      </group>

      {/* 6. local supporting glow — small, not an atmosphere */}
      <Billboard>
        <mesh scale={1.15}>
          <planeGeometry args={[1, 1]} />
          <primitive ref={glowMaterialRef} object={glowMaterial} attach="material" />
        </mesh>
      </Billboard>

      {/* 5. asymmetric floating shards — mostly dark structural debris */}
      {shardConfigs.map((shard, i) => (
        <Float key={i} speed={shard.speed} floatIntensity={shard.floatIntensity} rotationIntensity={0.5}>
          <mesh position={shard.position} rotation={shard.rotation} scale={shard.scale}>
            {shard.isBox ? <boxGeometry args={[1, 1, 1]} /> : <tetrahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial
              color={shard.lit ? accent : fgMuted}
              emissive={shard.lit ? accent : new THREE.Color(0, 0, 0)}
              emissiveIntensity={shard.lit ? 0.4 : 0}
              roughness={0.45}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}
