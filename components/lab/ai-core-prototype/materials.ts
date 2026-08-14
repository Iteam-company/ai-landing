"use client";

// Shader materials shared/reused across both Core concept prototypes.
// Isolated visual experiment — NOT wired into the production scroll-scene.
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

// ---------------------------------------------------------------------------
// CoreGlowMaterial — a small billboard "supporting glow" behind the core.
// Built via drei's `shaderMaterial` for convenient property-style uniform
// access (`material.uOpacity = x`). Attached via `<primitive>` rather than
// registered through `extend()` — simpler for a single instance and sidesteps
// a dev-mode catalog-registration flake seen with `extend()` + Turbopack Fast
// Refresh.
// ---------------------------------------------------------------------------

const GLOW_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float d = length(uv) * 2.0;
  float alpha = smoothstep(1.0, 0.0, d) * uOpacity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export const CoreGlowMaterial = shaderMaterial(
  { uColor: new THREE.Color("#c8f042"), uOpacity: 0.4 },
  GLOW_VERTEX_SHADER,
  GLOW_FRAGMENT_SHADER,
);

// ---------------------------------------------------------------------------
// EnergyNoiseMaterial (Concept A: Glass Reactor) — the "living" volumetric
// energy layer visible through the transmissive shell. A classic simplex-3D
// noise (Ashima Arts algorithm, public domain — inlined, no dependency),
// sampled in object space so the turbulence reads as attached to the core
// rather than free-floating, fed through a small fbm for richer detail, and
// combined with a facing-based fresnel term so it reads as a volumetric glow
// rather than a flat-shaded sphere.
// ---------------------------------------------------------------------------

const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += snoise(p) * amp;
    p *= 2.02;
    amp *= 0.5;
  }
  return sum;
}
`;

const ENERGY_NOISE_VERTEX_SHADER = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vObjectPos;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vObjectPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ENERGY_NOISE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uActivity;
uniform vec3 uColorCold;
uniform vec3 uColorHot;
uniform float uOpacity;

varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vObjectPos;

${NOISE_GLSL}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float facing = clamp(dot(normalize(vNormalW), viewDir), 0.0, 1.0);

  float speed = 0.12 + uActivity * 0.5;
  float n = fbm(vObjectPos * 2.6 + vec3(0.0, 0.0, uTime * speed));
  n = n * 0.5 + 0.5;

  // Always carries a warm baseline (even at rest) so the layer visibly reads
  // as "energy" through the glass rather than blending into a neutral shell.
  vec3 color = mix(uColorCold, uColorHot, clamp(0.4 + n * 0.5 + uActivity * 0.35, 0.0, 1.0));
  float rim = pow(1.0 - facing, 1.6);
  float core = pow(facing, 2.5) * 0.4;
  float alpha = clamp((rim * 0.9 + core + n * 0.2) * uOpacity * (0.65 + uActivity * 0.6), 0.0, 1.0);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

export const EnergyNoiseMaterial = shaderMaterial(
  {
    uTime: 0,
    uActivity: 0,
    uColorCold: new THREE.Color("#8b9088"),
    uColorHot: new THREE.Color("#ffffff"),
    uOpacity: 1,
  },
  ENERGY_NOISE_VERTEX_SHADER,
  ENERGY_NOISE_FRAGMENT_SHADER,
);

// ---------------------------------------------------------------------------
// Filament material (Concept B: Data Construct) — a short curved tube's
// "data conduit" look, adapted from the same conduit+filament+helix idea the
// production connections use (components/automation-network/scene-controller.ts),
// but rewritten as ONE shared shader with per-instance uniforms (turns/phase/
// isThrough baked as uniforms, not GLSL consts) so all ~26 filaments share a
// single compiled WebGL program instead of one program per branch. Adds a
// self-looping travelling pulse (idle/activity driven, not scroll-driven) and
// a vertex-shader "settle" jitter that relaxes toward zero as uActivity → 1 —
// the construct visually organizes itself without any per-frame CPU geometry
// rebuild.
// ---------------------------------------------------------------------------

const FILAMENT_VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uActivity;
uniform float uPhase;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  float jitterAmp = (1.0 - uActivity) * 0.035;
  float jitter = sin(uv.y * 30.0 + uPhase + uTime * 2.0) * jitterAmp;
  vec3 displaced = position + normal * jitter;

  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const FILAMENT_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform vec3 uColorHot;
uniform float uTime;
uniform float uActivity;
uniform float uIsThrough;
uniform float uPhase;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float facing = clamp(dot(normalize(vNormalW), viewDir), 0.0, 1.0);

  float conduit = mix(0.05, 1.0, pow(facing, 1.8));
  float filament = mix(0.0, 1.0, pow(facing, 10.0));

  float speed = 0.25 + uActivity * 1.6;
  float spiral = (vUv.y * 6.0 - vUv.x) * 6.28318530718 + uPhase - uTime * speed;
  float band = smoothstep(0.82, 1.0, cos(spiral) * 0.5 + 0.5);
  float helix = band * mix(0.2, 1.0, pow(facing, 2.0));

  float pulseSpeed = 0.15 + uActivity * 0.9;
  float pulsePos = fract(uTime * pulseSpeed + uPhase * 0.15);
  float dist = vUv.y - pulsePos;
  float pulse = exp(-abs(dist) * 26.0) * (0.22 + uActivity * 0.7) * (0.4 + uIsThrough * 0.7);

  float idleOpacity = mix(0.06, 0.26, uIsThrough);
  float activeOpacity = mix(0.22, 0.6, uIsThrough);
  float helixOpacity = mix(idleOpacity, activeOpacity, uActivity);

  float brightness = conduit * 0.07 + filament * 0.2 + helix * helixOpacity + pulse;
  vec3 color = mix(uColor, uColorHot, clamp(uActivity * 0.6 + pulse, 0.0, 1.0));

  float alpha = clamp(brightness, 0.0, 1.0);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(color * brightness, alpha);
}
`;

export function buildFilamentMaterial(
  colorCool: THREE.Color,
  colorHot: THREE.Color,
  phase: number,
  isThrough: boolean,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: FILAMENT_VERTEX_SHADER,
    fragmentShader: FILAMENT_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: colorCool.clone() },
      uColorHot: { value: colorHot.clone() },
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uIsThrough: { value: isThrough ? 1 : 0 },
      uPhase: { value: phase },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
