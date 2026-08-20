
import * as THREE from "three";
import { markPhaseTransition } from "./dev-perf-marks";
import {
  CHAOS_POSITIONS,
  ASSEMBLED_POSITIONS,
  ASSEMBLED_RADIUS,
  ASSEMBLED_Y_SQUASH,
  NODE_COUNT,
  PHASES,
  CORE_VISIBILITY_TRACK,
  CORE_SCALE_TRACK,
  CORE_GLOW_TRACK,
  CORE_PROCESSING_BOOST_TRACK,
  CAMERA_POSITION_TRACK,
  CAMERA_LOOKAT_TRACK,
  LEAD_SOURCE_NODE_ID,
  TELEGRAM_SEND_REACTION_TRACK,
  ACTION_NODE_IDS,
  PROCESSING_STATUS_COUNT,
  sampleNumberTrack,
  sampleVec3Track,
  sampleNodeLayoutT,
  sampleConnectionDraw,
  sampleLabelOpacity,
  sampleLeadPacketT,
  sampleActionArrival,
  sampleProcessingStatusOpacity,
  sampleActionStatusOpacity,
  sampleCompleteMessageOpacity,
  sampleEnterCoreT,
  sampleCanvasDissolveT,
  isHoverPhaseActive,
  isHeroPrepared,
} from "./timeline";

export interface AutomationNetworkNodeInput {
  id: string;
}

export interface LabelScreenPosition {
  id: string;
  x: number;
  y: number;
  opacity: number;
}

export interface AutomationNetworkFrameState {
  labels: LabelScreenPosition[];
  processingStatusOpacities: number[];
  actionStatusOpacities: Record<string, number>;
  completeOpacity: number;
  canvasDissolveT: number;
  heroPrepared: boolean;
}

interface SceneControllerOptions {
  nodes: AutomationNetworkNodeInput[];
  reduceMotion: boolean;
  dpr?: number;
  onFrame?: (state: AutomationNetworkFrameState) => void;
}

interface NodeRig {
  id: string;
  group: THREE.Group;
  orbitInner: THREE.Mesh;
  orbitInnerMaterial: THREE.ShaderMaterial;
  orbitMid: THREE.Mesh;
  orbitMidMaterial: THREE.ShaderMaterial;
  orbitOuter: THREE.Mesh;
  orbitOuterMaterial: THREE.ShaderMaterial;
  colorVariation: number;
  stemMaterial: THREE.ShaderMaterial;
  hotPointMaterial: THREE.ShaderMaterial;
  glowMaterial: THREE.SpriteMaterial;
  orbitSpinVariation: number;
  hoverBoostAmount: number;
  hoverDimAmount: number;
}

interface ConnectionRig {
  nodeId: string;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  turns: number;
  phaseOffset: number;
  radiusScale: number;
  curvatureScale: number;
  hoverBoostAmount: number;
  hoverDimAmount: number;
  curve: THREE.CatmullRomCurve3;
  curveMid: THREE.Vector3;
  curveTarget: THREE.Vector3;
  lastTubeTarget: THREE.Vector3;
}

const FOG_NEAR = 6;
const FOG_FAR = 15;

const TUBE_RING_COUNT = 24;
const TUBE_RADIAL_SEGMENTS = 8;
const COMPACT_TUBE_RING_COUNT = 18;
const COMPACT_TUBE_RADIAL_SEGMENTS = 6;

const DESKTOP_DPR_CAP = 1.5;
const COMPACT_DPR_CAP = 1.2;

const TUBE_RADIUS = 0.02;
const HELIX_RADIUS = 0.006;
const HELIX_BASE_TURNS = 5;
const HELIX_TURNS_VARIATION = 1;
const HELIX_BAND_WIDTH = 0.12;

const RADIUS_VARIATION = 0.12;
const CURVATURE_VARIATION = 0.25;

const FLOW_SPEED = 0.3;
const ACTIVE_SPEED_BOOST = 2.2;

const CONDUIT_OPACITY = 0.12;
const FILAMENT_OPACITY = 0.56;
const SPECULAR_OPACITY = 0.28;
const IDLE_HELIX_OPACITY = 0.045;
const ACTIVE_HELIX_OPACITY = 0.36;
const GLOW_INTENSITY = 0.85;
const TRAIL_DECAY = 10.0;
const REVEAL_EDGE_WIDTH = 0.035;

const CONNECTION_HOVER_IN_TIME_CONSTANT = 0.16;
const CONNECTION_HOVER_OUT_TIME_CONSTANT = 0.24;

const CONNECTION_REBUILD_EPSILON = 0.0025;
const CONNECTION_REBUILD_EPSILON_SQ = CONNECTION_REBUILD_EPSILON * CONNECTION_REBUILD_EPSILON;

// During ASSEMBLY all 5 nodes move every frame, so all 5 connections cross
// the rebuild epsilon in the same frame — a real per-frame spike (the
// tube's ring/radial loop + curve sampling, ~200 iterations each). Capping
// how many rebuild per frame and round-robining the rest spreads that cost
// over 2-3 frames instead of paying for it all at once; a connection left
// over this frame just stays "dirty" and gets it on the next one, so
// nothing is ever silently skipped, only delayed by a frame or two — far
// below what's visible on a thin trailing tube. Node transforms themselves
// are never touched by this, so they stay perfectly smooth regardless.
const CONNECTION_REBUILD_MAX_PER_FRAME = 2;

// Stable (non-Frenet) tube frame: a fixed reference axis crossed with the
// local tangent, chosen once per connection so the basis never flips mid-tube.
// Cheap (no parallel-transport state, no per-ring allocation) and visually
// equivalent here because each connection is a single mild bow, never a
// looping curve where Frenet's twist-minimization would matter.
const TUBE_FRAME_REFERENCE_UP = new THREE.Vector3(0, 1, 0);
const TUBE_FRAME_REFERENCE_RIGHT = new THREE.Vector3(1, 0, 0);
const TUBE_TANGENT_SAMPLE_EPS = 0.0008;

// Scroll-progress smoothing: raw scroll input is the target, the value the
// timeline actually samples chases it with frame-rate independent damping.
// ~90ms time constant reads as "caught up" within ~150-250ms without adding
// perceptible inertia.
const PROGRESS_SMOOTHING_TIME_CONSTANT = 0.09;

// Below this, node meshes are already scaled to a sliver (see
// sceneContentOpacity below) and connections/particles are practically
// invisible — stop updating/rendering them rather than paying for motion
// nobody can see during the ENTER CORE close-up.
const SCENE_CONTENT_HIDE_THRESHOLD = 0.02;

const CORE_HOT_RADIUS = 0.22;
const DESKTOP_CORE_HOT_DETAIL = 4;
const COMPACT_CORE_HOT_DETAIL = 3;
const CORE_HOT_INTENSITY = 0.8;
const CORE_GLOW_SPRITE_BRIGHTNESS = 0.8;

const CORE_SHELL_RADIUS = 0.32;
const CORE_SHELL_DETAIL = 3;

interface CoreOrbitRingConfig {
  radiusX: number;
  radiusY: number;
  tubeRadius: number;
  tilt: [number, number, number];
  spinAxis: "x" | "y" | "z";
  spinRateBase: number;
  spinDirection: 1 | -1;
  intensity: number;
  pulseSpeed: number;
}

const CORE_ORBIT_RINGS: CoreOrbitRingConfig[] = [
  {
    radiusX: 0.44,
    radiusY: 0.38,
    tubeRadius: 0.013,
    tilt: [0.32, 0.1, 0.12],
    spinAxis: "z",
    spinRateBase: 0.001,
    spinDirection: 1,
    intensity: 1,
    pulseSpeed: 0.15,
  },
  {
    radiusX: 0.52,
    radiusY: 0.58,
    tubeRadius: 0.008,
    tilt: [1.15, 0.42, 0.25],
    spinAxis: "x",
    spinRateBase: 0.0007,
    spinDirection: -1,
    intensity: 0.72,
    pulseSpeed: 0.11,
  },
  {
    radiusX: 0.62,
    radiusY: 0.54,
    tubeRadius: 0.007,
    tilt: [0.65, 1.2, 0.5],
    spinAxis: "y",
    spinRateBase: 0.0005,
    spinDirection: 1,
    intensity: 0.6,
    pulseSpeed: 0.09,
  },
];

const CORE_ORBIT_TUBULAR_SEGMENTS = 128;
const CORE_ORBIT_RADIAL_SEGMENTS = 10;
const COMPACT_CORE_ORBIT_TUBULAR_SEGMENTS = 88;
const COMPACT_CORE_ORBIT_RADIAL_SEGMENTS = 7;

const CORE_ORBIT_EMISSIVE_RANGE = 0.9;

const CORE_SHELL_ROTATION_BASE = 0.0009;
const CORE_PROCESSING_ROTATION_BOOST = 1.6;

const CORE_FILAMENT_COUNT = 4;
const CORE_FILAMENT_RADIUS = 0.4;
const CORE_FILAMENT_RADIUS_VARIATION = 0.12;
const CORE_FILAMENT_SPAN = Math.PI * 1.35;
const CORE_FILAMENT_SEGMENTS = 24;
const CORE_FILAMENT_IDLE_SPIN = 0.09;
const CORE_FILAMENT_PROCESSING_SPIN_BOOST = 2.2;
const CORE_FILAMENT_IDLE_OPACITY = 0.16;
const CORE_FILAMENT_PROCESSING_OPACITY = 0.6;
const CORE_FILAMENT_PULSE_SPEED = 0.11;
const CORE_FILAMENT_ORGANIZED_TILT: [number, number] = [0.35, 0];

const CORE_FILAMENT_INNER_COUNT = 3;
const CORE_FILAMENT_INNER_RADIUS = 0.18;
const CORE_FILAMENT_INNER_SPAN = Math.PI * 0.55;
const CORE_FILAMENT_INNER_SEGMENTS = 14;
const CORE_FILAMENT_INNER_PULSE_SPEED = 0.16;

const CORE_SHOCKWAVE_PERIOD = 1.35;
const CORE_SHOCKWAVE_MIN_SCALE = 0.55;
const CORE_SHOCKWAVE_MAX_SCALE = 1.65;
const CORE_SHOCKWAVE_MAX_OPACITY = 0.3;

// Past this point in ENTER CORE the camera is inside coreShell — only there
// does it need DoubleSide. Numerically sampled the real camera-distance and
// shell-radius curves (CAMERA_POSITION_TRACK / CORE_SCALE_TRACK, both
// smoothstep-eased) against each other: they cross at enterCoreT ≈ 0.81,
// so this is already essentially the earliest-safe value, not one with
// margin to spare — don't push it later without re-checking that crossover.
const CORE_SHELL_DOUBLE_SIDE_THRESHOLD = 0.82;

// Screen-space coverage (not triangle count) is what makes the last stretch
// of ENTER CORE expensive — the plasma shell alone is DoubleSide (2x
// fragment cost) and close to filling the viewport by this point. A small
// DPR drop directly cuts fragment-shader invocations across the whole
// canvas for exactly this window; it's soft, blurry, glow-heavy content
// with no fine edges, so the resolution drop reads as essentially nothing.
// Two discrete tiers (never a continuous curve, so setPixelRatio only ever
// runs on the two frames where a tier boundary is actually crossed): a
// mild early softening while the Core is still growing into frame, then a
// stronger drop for the final stretch. Tier 2 reuses the DoubleSide
// threshold so "expensive rendering window" and "reduced-resolution
// window" stay the same window instead of two independently-tuned ones.
const CORE_DPR_TIER1_THRESHOLD = 0.72;
const CORE_DPR_TIER1_SCALE = 0.92;
const LATE_CORE_QUALITY_THRESHOLD = CORE_SHELL_DOUBLE_SIDE_THRESHOLD;
const LATE_CORE_DPR_SCALE = 0.85;

// Secondary Core layers (orbit rings, filaments) stop adding anything
// visible once the hot sphere/plasma shell dominate the whole viewport —
// fade them out (and stop drawing them entirely once invisible) over the
// last stretch of ENTER CORE instead of paying full overdraw for them
// right up to the end.
const CORE_SECONDARY_FADE_START = 0.72;
const CORE_SECONDARY_FADE_END = 0.94;

// Glow sprite keeps growing on screen purely from camera proximity — cap
// how far its size keeps scaling up so it doesn't balloon into a full-screen
// additive layer at the very end, when it's barely contributing next to the
// hot sphere/shell.
const CORE_GLOW_SCALE_ENTER_CAP = 0.7;

const HEARTBEAT_PERIOD = 6.5;
const HEARTBEAT_ACTIVE_FRACTION = 0.22;
const HEARTBEAT_CORE_BOOST = 0.16;
const HEARTBEAT_CONNECTION_ACTIVITY = 0.55;

const RELAY_SCALE = 0.7;
const NODE_BODY_RADIUS = 0.19 * RELAY_SCALE;

const NODE_STEM_RADIUS = 0.012 * RELAY_SCALE;
const NODE_STEM_LENGTH = NODE_BODY_RADIUS * 0.85;
const NODE_STEM_CENTER_Y = NODE_BODY_RADIUS * 0.925;
const NODE_HOT_POINT_RADIUS = 0.03 * RELAY_SCALE;
const NODE_HOT_POINT_OFFSET_Y = NODE_BODY_RADIUS * 1.35;

const DESKTOP_NODE_ORBIT_RADIAL_SEGMENTS = 16;
const DESKTOP_NODE_ORBIT_TUBULAR_SEGMENTS = 64;
const COMPACT_NODE_ORBIT_RADIAL_SEGMENTS = 10;
const COMPACT_NODE_ORBIT_TUBULAR_SEGMENTS = 40;

const NODE_ORBIT_INNER_RADIUS = 0.25 * RELAY_SCALE;
const NODE_ORBIT_INNER_TUBE = 0.011 * RELAY_SCALE;
const NODE_ORBIT_INNER_TILT: [number, number, number] = [0.35, 0.15, 0.05];

const NODE_ORBIT_MID_RADIUS = 0.32 * RELAY_SCALE;
const NODE_ORBIT_MID_TUBE = 0.009 * RELAY_SCALE;
const NODE_ORBIT_MID_TILT: [number, number, number] = [1.1, 0.5, 0.28];

const NODE_ORBIT_OUTER_RADIUS = 0.4 * RELAY_SCALE;
const NODE_ORBIT_OUTER_TUBE = 0.007 * RELAY_SCALE;
const NODE_ORBIT_OUTER_TILT: [number, number, number] = [0.65, 1.25, 0.6];

const NODE_GLOW_SCALE = 0.65;

const NODE_ENERGY_IDLE = 0.05;
const NODE_ENERGY_RANGE = 0.8;
const NODE_ENERGY_ARRIVAL_BOOST = 0.25;
const NODE_GLOW_IDLE_OPACITY = 0.06;
const NODE_GLOW_ACTIVE_OPACITY = 0.42;

const NODE_HOVER_BOOST_ADD = 0.35;
const NODE_HOVER_DIM_FACTOR = 0.4;

const HOVER_IN_TIME_CONSTANT = 0.1;
const HOVER_OUT_TIME_CONSTANT = 0.14;

const NODE_ORBIT_SPIN_BASE = 0.2;
const NODE_ORBIT_SPIN_PULSE_BOOST = 0.65;
const NODE_ORBIT_SPIN_ENERGY_BOOST = 0.15;
const NODE_ORBIT_INNER_SPIN_AXIS_RATE = 0.45;
const NODE_ORBIT_MID_SPIN_AXIS_RATE = 0.32;
const NODE_ORBIT_OUTER_SPIN_AXIS_RATE = 0.22;
const NODE_ORBIT_SPIN_VARIATION = 0.15;
const NODE_COLOR_VARIATION = 0.1;
const NODE_HOT_POINT_IDLE_FLOOR = 0.16;

const NODE_HOT_INTENSITY = 0.5;
const NODE_HOT_NOISE_AMP = 0.22;
const NODE_HOT_NOISE_SPEED = 0.1;

const PARTICLE_COUNT = 120;
const PARTICLE_SPREAD_MIN = 1.8;
const PARTICLE_SPREAD_MAX = 7.4;
const PARTICLE_SIZE_MIN = 0.9;
const PARTICLE_SIZE_MAX = 2.0;
const PARTICLE_SIZE_SCALE = 11.0;
const PARTICLE_OPACITY = 0.13;
const PARTICLE_DRIFT_SPEED = 0.05;
const PARTICLE_CHAOS_SPREAD = 1.06;
const PARTICLE_SETTLED_SPREAD = 0.94;

const ATMOSPHERE_INNER_SCALE = 1.05;
const ATMOSPHERE_INNER_OPACITY = 0.013;
const ATMOSPHERE_PROCESSING_BOOST = 0.003;

interface ResponsiveAnchor {
  width: number;
  fovDeg: number;
  layoutRadiusMultiplier: number;
  meshScaleMultiplier: number;
  coreScaleMultiplier: number;
  marginFraction: number;
  secondaryMotionScale: number;
}

const RESPONSIVE_ANCHORS: ResponsiveAnchor[] = [
  { width: 320, fovDeg: 50, layoutRadiusMultiplier: 0.6, meshScaleMultiplier: 1.0, coreScaleMultiplier: 0.78, marginFraction: 0.24, secondaryMotionScale: 0.55 },
  { width: 639, fovDeg: 50, layoutRadiusMultiplier: 0.66, meshScaleMultiplier: 1.08, coreScaleMultiplier: 0.85, marginFraction: 0.2, secondaryMotionScale: 0.6 },
  { width: 640, fovDeg: 49, layoutRadiusMultiplier: 0.6, meshScaleMultiplier: 1.16, coreScaleMultiplier: 0.88, marginFraction: 0.16, secondaryMotionScale: 0.75 },
  { width: 1023, fovDeg: 47, layoutRadiusMultiplier: 0.85, meshScaleMultiplier: 1.05, coreScaleMultiplier: 0.95, marginFraction: 0.11, secondaryMotionScale: 0.9 },
  { width: 1024, fovDeg: 46, layoutRadiusMultiplier: 1, meshScaleMultiplier: 1, coreScaleMultiplier: 1, marginFraction: 0.08, secondaryMotionScale: 1 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function resolveResponsiveAnchor(width: number): ResponsiveAnchor {
  const anchors = RESPONSIVE_ANCHORS;
  if (width <= anchors[0].width) return anchors[0];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (width >= a.width && width <= b.width) {
      const t = (width - a.width) / (b.width - a.width);
      return {
        width,
        fovDeg: lerp(a.fovDeg, b.fovDeg, t),
        layoutRadiusMultiplier: lerp(a.layoutRadiusMultiplier, b.layoutRadiusMultiplier, t),
        meshScaleMultiplier: lerp(a.meshScaleMultiplier, b.meshScaleMultiplier, t),
        coreScaleMultiplier: lerp(a.coreScaleMultiplier, b.coreScaleMultiplier, t),
        marginFraction: lerp(a.marginFraction, b.marginFraction, t),
        secondaryMotionScale: lerp(a.secondaryMotionScale, b.secondaryMotionScale, t),
      };
    }
  }
  return anchors[anchors.length - 1];
}

const HELD_CAMERA_Z = 4.4;
const MOBILE_PARTICLE_WIDTH_THRESHOLD = 640;
const MOBILE_PARTICLE_COUNT = 50;

function computeCameraDistanceMultiplier(
  anchor: ResponsiveAnchor,
  viewportWidthPx: number,
  viewportHeightPx: number,
): number {
  const aspect = viewportWidthPx / viewportHeightPx;
  const verticalHalf = (anchor.fovDeg / 2) * (Math.PI / 180);
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
  const marginFactor = 1 / (1 - anchor.marginFraction);

  const worstX = ASSEMBLED_RADIUS * anchor.layoutRadiusMultiplier * marginFactor;
  const worstY = ASSEMBLED_RADIUS * ASSEMBLED_Y_SQUASH * anchor.layoutRadiusMultiplier * marginFactor;

  const requiredDistanceH = worstX / Math.tan(horizontalHalf);
  const requiredDistanceV = worstY / Math.tan(verticalHalf);

  return Math.max(1, requiredDistanceH / HELD_CAMERA_Z, requiredDistanceV / HELD_CAMERA_Z);
}

function resolveCssColor(varName: string, fallback: string): THREE.Color {
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

function relativeLuminance(c: THREE.Color): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRingTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.58, "rgba(255,255,255,0)");
  gradient.addColorStop(0.7, "rgba(255,255,255,1)");
  gradient.addColorStop(0.82, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function buildFilamentArcGeometry(segments: number, spanRadians: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const t: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * spanRadians - spanRadians / 2;
    points.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
    t.push(i / segments);
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(t), 1));
  return geometry;
}

const FILAMENT_VERTEX_SHADER = `
attribute float aT;
varying float vT;

void main() {
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FILAMENT_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uPhase;
uniform float uPulseSpeed;

varying float vT;

void main() {
  float edgeFade = sin(clamp(vT, 0.0, 1.0) * 3.14159265);
  float pulsePos = fract(uTime * uPulseSpeed + uPhase);
  float dist = vT - pulsePos;
  dist -= floor(dist + 0.5);
  // Wider, gentler falloff (was 9.0) and a much smaller peak (was +1.5) —
  // a soft brightening ripple riding a steady glow, not a bright dot
  // sweeping the strand — "очень subtle" traveling motion.
  float pulse = exp(-abs(dist) * 5.0);
  float brightness = edgeFade * (0.58 + pulse * 0.55);
  gl_FragColor = vec4(uColor * brightness, uOpacity * edgeFade);
}
`;

function buildFilamentMaterial(color: THREE.Color, phase: number, pulseSpeed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: FILAMENT_VERTEX_SHADER,
    fragmentShader: FILAMENT_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uPhase: { value: phase },
      uPulseSpeed: { value: pulseSpeed },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstepJs(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const DAMP_SNAP_EPSILON = 1e-4;

function dampTowards(current: number, target: number, deltaSeconds: number, timeConstantSeconds: number): number {
  if (timeConstantSeconds <= 0 || deltaSeconds <= 0) return target;
  const amount = 1 - Math.exp(-deltaSeconds / timeConstantSeconds);
  const next = current + (target - current) * amount;
  // Exponential decay only ever asymptotically approaches the target, so
  // without this a value like canvas-dissolve progress can sit at
  // 0.99999...-something forever instead of ever reading as exactly done —
  // which left renderFrame's `>= 1` full-stop waiting several extra seconds
  // to trigger after the scene was already visually finished.
  return Math.abs(target - next) < DAMP_SNAP_EPSILON ? target : next;
}

const CONNECTION_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function buildConnectionFragmentShader(turns: number, phaseOffset: number): string {
  return `
precision highp float;

uniform vec3 uColor;
uniform float uTime;
uniform float uDrawProgress;
uniform float uSignalHead;
uniform float uSignalDir;
uniform float uSignalActivity;
uniform float uHoverBoost;
uniform float uHoverDim;
uniform float uOpaqueBoost;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPosition;

const float TURNS = ${turns.toFixed(4)};
const float PHASE_OFFSET = ${phaseOffset.toFixed(4)};
const float BAND_WIDTH = ${HELIX_BAND_WIDTH.toFixed(4)};
const float FLOW_SPEED = ${FLOW_SPEED.toFixed(4)};
const float ACTIVE_SPEED_BOOST = ${ACTIVE_SPEED_BOOST.toFixed(4)};
const float CONDUIT_OPACITY = ${CONDUIT_OPACITY.toFixed(4)};
const float FILAMENT_OPACITY = ${FILAMENT_OPACITY.toFixed(4)};
const float SPECULAR_OPACITY = ${SPECULAR_OPACITY.toFixed(4)};
const float IDLE_HELIX_OPACITY = ${IDLE_HELIX_OPACITY.toFixed(4)};
const float ACTIVE_HELIX_OPACITY = ${ACTIVE_HELIX_OPACITY.toFixed(4)};
const float TRAIL_DECAY = ${TRAIL_DECAY.toFixed(4)};
const float REVEAL_EDGE = ${REVEAL_EDGE_WIDTH.toFixed(4)};
const float GLOW_INTENSITY = ${GLOW_INTENSITY.toFixed(4)};

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float facing = clamp(dot(normalize(vNormalW), viewDir), 0.0, 1.0);

  float reveal = 1.0 - smoothstep(uDrawProgress, uDrawProgress + REVEAL_EDGE, vUv.y);
  float tip = 1.0 - smoothstep(0.0, REVEAL_EDGE * 1.5, abs(vUv.y - uDrawProgress));

  float body = mix(0.4, 1.0, pow(facing, 1.3));
  float filament = pow(facing, 11.0);
  float specular = pow(facing, 46.0);

  float speed = FLOW_SPEED * (1.0 + uSignalActivity * ACTIVE_SPEED_BOOST);
  float spiral = (vUv.y * TURNS - vUv.x) * 6.28318530718 + PHASE_OFFSET - uTime * speed;
  float band = smoothstep(1.0 - BAND_WIDTH, 1.0, cos(spiral) * 0.5 + 0.5);
  float helixOpacity = mix(IDLE_HELIX_OPACITY, ACTIVE_HELIX_OPACITY, uSignalActivity);
  float helix = band * mix(0.1, 1.0, pow(facing, 3.0));

  float dist = (vUv.y - uSignalHead) * uSignalDir;
  float signalFacing = mix(0.4, 1.0, pow(facing, 3.0));
  float trail = uSignalActivity * exp(min(dist, 0.0) * TRAIL_DECAY) * step(dist, 0.0) * signalFacing;
  float head = uSignalActivity * exp(-abs(dist) * 40.0) * signalFacing;

  float brightness =
    body * CONDUIT_OPACITY +
    filament * FILAMENT_OPACITY +
    specular * SPECULAR_OPACITY +
    helix * helixOpacity +
    trail * 0.5 +
    head +
    tip * 0.25;

  brightness = min(brightness * GLOW_INTENSITY, 1.1);
  brightness = brightness * uHoverDim + uHoverBoost;
  float alpha = clamp(brightness, 0.0, 1.0) * reveal;
  alpha = mix(alpha, clamp(alpha * 1.6 + 0.1, 0.0, 1.0), uOpaqueBoost);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor * brightness, alpha);
}
`;
}

function buildConnectionMaterial(
  accent: THREE.Color,
  turns: number,
  phaseOffset: number,
  opaqueBoost: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: CONNECTION_VERTEX_SHADER,
    fragmentShader: buildConnectionFragmentShader(turns, phaseOffset),
    uniforms: {
      uColor: { value: accent.clone() },
      uTime: { value: 0 },
      uDrawProgress: { value: 0 },
      uSignalHead: { value: 0 },
      uSignalDir: { value: 1 },
      uSignalActivity: { value: 0 },
      uHoverBoost: { value: 0 },
      uHoverDim: { value: 1 },
      uOpaqueBoost: { value: opaqueBoost },
    },
    transparent: true,
    depthWrite: false,
    blending: opaqueBoost > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function buildTubeIndices(ringCount: number, radial: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < ringCount - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      indices.push(a, c, b, b, c, d);
    }
  }
  return indices;
}

function buildParticleAttributes(count: number): {
  positions: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u1 = seededUnit(i * 3.71 + 900);
    const u2 = seededUnit(i * 3.71 + 901);
    const u3 = seededUnit(i * 3.71 + 902);
    const radius = PARTICLE_SPREAD_MIN + (PARTICLE_SPREAD_MAX - PARTICLE_SPREAD_MIN) * Math.pow(u1, 0.7);
    const theta = u2 * Math.PI * 2;
    const phi = Math.acos(2 * u3 - 1);
    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    sizes[i] = PARTICLE_SIZE_MIN + seededUnit(i * 3.71 + 903) * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN);
    phases[i] = seededUnit(i * 3.71 + 904) * Math.PI * 2;
  }
  return { positions, sizes, phases };
}

const PARTICLE_VERTEX_SHADER = `
attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uSpread;
uniform float uPixelRatio;

void main() {
  vec3 pos = position * uSpread;
  pos.x += sin(uTime * ${PARTICLE_DRIFT_SPEED.toFixed(4)} + aPhase) * 0.14;
  pos.y += cos(uTime * ${(PARTICLE_DRIFT_SPEED * 0.8).toFixed(4)} + aPhase * 1.3) * 0.11;
  pos.z += sin(uTime * ${(PARTICLE_DRIFT_SPEED * 0.6).toFixed(4)} + aPhase * 0.7) * 0.1;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPixelRatio * (${PARTICLE_SIZE_SCALE.toFixed(4)} / -mvPosition.z), 9.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PARTICLE_FRAGMENT_SHADER = `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.0, d) * uOpacity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function buildParticlesMaterial(accent: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERTEX_SHADER,
    fragmentShader: PARTICLE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: accent.clone() },
      uOpacity: { value: PARTICLE_OPACITY },
      uTime: { value: 0 },
      uSpread: { value: 1 },
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

const RELAY_STEM_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RELAY_STEM_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColor;
uniform vec3 uColorEnergy;
uniform vec3 uColorHot;
uniform float uTime;
uniform float uBaseBrightness;
uniform float uColorMix;
uniform float uPulseActivity;
uniform float uPulseSpeed;
uniform float uPulseAxis;
uniform float uPulseDir;

varying vec2 vUv;

void main() {
  float coord = mix(vUv.x, vUv.y, uPulseAxis);
  float pulsePos = fract(uTime * uPulseSpeed * uPulseDir);
  float dist = coord - pulsePos;
  dist -= floor(dist + 0.5); // shortest signed distance around the 0..1 loop
  float pulse = uPulseActivity * exp(-abs(dist) * 12.0);
  float brightness = uBaseBrightness + pulse;
  vec3 steadyColor = mix(uColor, uColorEnergy, uColorMix);
  vec3 color = mix(steadyColor, uColorHot, clamp(pulse * 1.6, 0.0, 1.0));
  gl_FragColor = vec4(color * brightness, 1.0);
}
`;

function buildRelayStemMaterial(color: THREE.Color, colorEnergy: THREE.Color, colorHot: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: RELAY_STEM_VERTEX_SHADER,
    fragmentShader: RELAY_STEM_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: color.clone() },
      uColorEnergy: { value: colorEnergy.clone() },
      uColorHot: { value: colorHot.clone() },
      uTime: { value: 0 },
      uBaseBrightness: { value: 0.05 },
      uColorMix: { value: 0 },
      uPulseActivity: { value: 0 },
      uPulseSpeed: { value: 0.5 },
      uPulseAxis: { value: 1 },
      uPulseDir: { value: -1 },
    },
  });
}

const PLASMA_VERTEX_SHADER = `
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PLASMA_ORB_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uOpacity;
uniform float uIntensity;
uniform float uTime;
uniform float uNoiseSpeed;
uniform float uNoiseAmp;

varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 n = normalize(vNormalW);
  float facing = clamp(dot(n, viewDir), 0.0, 1.0);

  // Organic, low-frequency turbulence — a sum of off-axis sine waves over
  // the normal itself (not lat/long), so it reads as living plasma rather
  // than a grid/checkerboard or faceted pattern.
  float noise =
    sin(n.x * 5.0 + n.y * 3.2 + uTime * uNoiseSpeed) +
    sin(n.y * 4.3 - n.z * 6.1 - uTime * uNoiseSpeed * 0.8) +
    sin(n.z * 4.7 + n.x * 3.6 + uTime * uNoiseSpeed * 0.6);
  noise = noise / 3.0 * 0.5 + 0.5;

  // Limb color shift — bright/near-white dead-center-facing, warming toward
  // the edge color at the grazing silhouette. This (not a rim light) is
  // what actually reads as plasma/star, not a flat lit ball.
  float centerness = pow(facing, 1.3);
  vec3 color = mix(uColorEdge, uColorCore, centerness);
  float brightness =
    mix(0.7, 1.35, centerness) * mix(1.0 - uNoiseAmp * 0.5, 1.0 + uNoiseAmp * 0.5, noise) * uIntensity;

  gl_FragColor = vec4(color * brightness, uOpacity);
}
`;

function derivePlasmaCoreColor(accent: THREE.Color): THREE.Color {
  return accent.clone().lerp(new THREE.Color("#fff6e8"), 0.86);
}

function deriveNodeHotColors(accent: THREE.Color): { core: THREE.Color; edge: THREE.Color } {
  return {
    core: new THREE.Color("#f7ddc8").lerp(accent, 0.12),
    edge: new THREE.Color("#b8683f").lerp(accent, 0.18),
  };
}

function buildPlasmaOrbMaterial(
  colorCore: THREE.Color,
  colorEdge: THREE.Color,
  intensity: number,
  noiseAmp: number,
  noiseSpeed: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PLASMA_VERTEX_SHADER,
    fragmentShader: PLASMA_ORB_FRAGMENT_SHADER,
    uniforms: {
      uColorCore: { value: colorCore.clone() },
      uColorEdge: { value: colorEdge.clone() },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
      uNoiseSpeed: { value: noiseSpeed },
      uNoiseAmp: { value: noiseAmp },
    },
    transparent: true,
    // Transparent material with Three.js's default depth-sort-by-object
    // (not per-fragment) — leaving depthWrite:true here blocks the other
    // transparent layers drawn after it (coreShell, coreGlow, orbit rings,
    // atmosphereInner, node glow sprites) from correctly blending behind
    // it. depthWrite:false is the conventional choice for transparent
    // materials for exactly this reason; depth *testing* against opaque
    // geometry (node bodies) is untouched.
    depthWrite: false,
  });
}

const CORE_PLASMA_SHELL_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uOpacity;
uniform float uTime;
uniform float uNoiseSpeed;
uniform float uNoiseAmp;

varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 n = normalize(vNormalW);
  float facing = clamp(dot(n, viewDir), 0.0, 1.0);

  float noise =
    sin(n.x * 4.0 + n.y * 2.6 + uTime * uNoiseSpeed) +
    sin(n.y * 3.4 - n.z * 5.0 - uTime * uNoiseSpeed * 0.7) +
    sin(n.z * 3.8 + n.x * 2.9 + uTime * uNoiseSpeed * 0.55);
  noise = noise / 3.0 * 0.5 + 0.5;

  float body = pow(facing, 1.15);
  vec3 color = mix(uColorEdge, uColorCore, body);
  float brightness = mix(0.75, 1.15, body) * mix(1.0 - uNoiseAmp * 0.4, 1.0 + uNoiseAmp * 0.4, noise);

  // Hard-capped well under 1 — see the comment above: additive DoubleSide
  // stacking plus the huge ENTER CORE swell must never approach a flat,
  // uniformly-filled orange screen.
  float alpha = clamp(body * mix(0.7, 1.0, noise) * uOpacity, 0.0, 0.6);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(color * brightness, alpha);
}
`;

function buildPlasmaShellMaterial(colorCore: THREE.Color, colorEdge: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PLASMA_VERTEX_SHADER,
    fragmentShader: CORE_PLASMA_SHELL_FRAGMENT_SHADER,
    uniforms: {
      uColorCore: { value: colorCore.clone() },
      uColorEdge: { value: colorEdge.clone() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uNoiseSpeed: { value: 0.12 },
      uNoiseAmp: { value: 0.4 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    // FrontSide until renderFrame switches this to DoubleSide right at the
    // tail of ENTER CORE, when the camera is actually about to end up
    // inside the shell — for the rest of the site (including most of ENTER
    // CORE, while the camera is still outside it) DoubleSide would shade
    // both the near and far faces of every covered pixel for no visible
    // difference, doubling fill-rate on what's already the biggest
    // translucent layer on screen.
    side: THREE.FrontSide,
  });
}

const VOLUMETRIC_RING_VERTEX_SHADER = `
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const VOLUMETRIC_RING_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vNormalW;
varying vec3 vWorldPos;

const vec3 LIGHT_DIR = vec3(0.5006, 0.7509, 0.5006);

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 n = normalize(vNormalW);
  float facing = clamp(dot(n, viewDir), 0.0, 1.0);
  // Gentle curve + a high floor: the ring stays bright/emissive all the way
  // around, with only a soft lift toward the silhouette edge — never the
  // near-black a lower floor produces on a swept-tube surface.
  float rim = pow(1.0 - facing, 1.5);
  float body = mix(0.86, 1.18, rim);

  vec3 halfVec = normalize(LIGHT_DIR + viewDir);
  float spec = pow(max(dot(n, halfVec), 0.0), 24.0) * 0.22;

  gl_FragColor = vec4(uColor * body + vec3(spec), uOpacity);
}
`;

function buildVolumetricRingMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VOLUMETRIC_RING_VERTEX_SHADER,
    fragmentShader: VOLUMETRIC_RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: 1 },
    },
    transparent: true,
  });
}

const CORE_ORBIT_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CORE_ORBIT_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uPulseSpeed;
uniform float uPhase;
uniform float uIntensity;

varying vec2 vUv;

void main() {
  // vUv.y (0..1 around the tube's cross-section) is fixed geometry, never
  // view-dependent — so every term below reads identically all the way
  // around the ring, at any camera angle or spin. No near-black anywhere.
  float d = vUv.y - 0.5;
  float d2 = d * d;

  float conduit = exp(-d2 * 16.0) * 0.5; // soft translucent outer body
  float filament = exp(-d2 * 70.0) * 0.7; // thin bright inner core

  // Small traveling energy highlight riding the filament.
  float travel = fract(vUv.x - uTime * uPulseSpeed + uPhase);
  float highlight = exp(-abs(travel - 0.5) * 30.0) * exp(-d2 * 40.0) * 0.85;

  float brightness = (conduit + filament + highlight) * uIntensity;
  float alpha = clamp(brightness, 0.0, 1.0) * uOpacity;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor * brightness, alpha);
}
`;

function buildCoreOrbitMaterial(color: THREE.Color, pulseSpeed: number, phase: number, intensity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: CORE_ORBIT_VERTEX_SHADER,
    fragmentShader: CORE_ORBIT_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uPulseSpeed: { value: pulseSpeed },
      uPhase: { value: phase },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

class CoreOrbitEllipseCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radiusX: number,
    private radiusY: number,
  ) {
    super();
  }

  getPoint(t: number, target: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    return target.set(Math.cos(angle) * this.radiusX, Math.sin(angle) * this.radiusY, 0);
  }
}

export class AutomationNetworkSceneController {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private nodes: NodeRig[] = [];
  private nodesById: Map<string, NodeRig>;
  private connections: ConnectionRig[] = [];

  private coreHot: THREE.Mesh;
  private coreHotMaterial: THREE.ShaderMaterial;
  private coreShell: THREE.Mesh;
  private coreShellMaterial: THREE.ShaderMaterial;
  private coreOrbits: {
    mesh: THREE.Mesh;
    geometry: THREE.TubeGeometry;
    material: THREE.ShaderMaterial;
    config: CoreOrbitRingConfig;
  }[] = [];
  private readonly coreShellAsymmetry = new THREE.Vector3(1, 1, 1);
  private coreGlow: THREE.Sprite;
  private coreGlowMaterial: THREE.SpriteMaterial;
  private glowTexture: THREE.CanvasTexture;
  private readonly coreOrigin = new THREE.Vector3(0, 0, 0);

  private coreFilamentGeometry: THREE.BufferGeometry;
  private coreFilamentInnerGeometry: THREE.BufferGeometry;
  private coreFilaments: {
    group: THREE.Group;
    material: THREE.ShaderMaterial;
    idleRadius: number;
    idleTiltX: number;
    idleTiltY: number;
    spinVariation: number;
  }[] = [];
  private coreShockwave: THREE.Sprite;
  private coreShockwaveMaterial: THREE.SpriteMaterial;
  private ringTexture: THREE.CanvasTexture;

  private nodeBodyGeometry: THREE.IcosahedronGeometry;
  private nodeBodyMaterial: THREE.MeshStandardMaterial;
  private nodeOrbitInnerGeometry: THREE.TorusGeometry;
  private nodeOrbitMidGeometry: THREE.TorusGeometry;
  private nodeOrbitOuterGeometry: THREE.TorusGeometry;
  private nodeStemGeometry: THREE.CylinderGeometry;
  private nodeHotPointGeometry: THREE.IcosahedronGeometry;

  private atmosphereInner: THREE.Sprite;
  private atmosphereInnerMaterial: THREE.SpriteMaterial;
  private particles: THREE.Points;
  private particlesGeometry: THREE.BufferGeometry;
  private particlesMaterial: THREE.ShaderMaterial;

  private accentColor: THREE.Color;
  private fgMutedColor: THREE.Color;
  private hotColor: THREE.Color;
  private statusDarkColor: THREE.Color;

  private readonly scratchColor = new THREE.Color();
  private readonly scratchVec3 = new THREE.Vector3();

  // Scratch for the allocation-free tube frame computation (see
  // updateConnectionTube) — reused across rings and connections since each
  // call fully consumes them before returning.
  private readonly tubeScratchPoint = new THREE.Vector3();
  private readonly tubeScratchTangentA = new THREE.Vector3();
  private readonly tubeScratchTangentB = new THREE.Vector3();
  private readonly tubeScratchNormal = new THREE.Vector3();
  private readonly tubeScratchBinormal = new THREE.Vector3();

  private hoveredNodeId: string | null = null;

  private progress = 0;
  private targetProgress = 0;
  private sceneContentVisible = true;
  private coreShellDoubleSide = false;
  private coreDprTier = 0;
  private baseDpr = 1;
  private coreShockwaveVisible = true;
  private coreSecondaryVisible = true;
  private atmosphereInnerVisible = true;
  private connectionRebuildCursor = 0;

  // Reused every frame instead of allocating a fresh array/object each
  // time — onFrame's consumer only ever reads these synchronously within
  // the callback, never retains them across frames.
  private readonly processingStatusOpacitiesBuf: number[] = new Array(PROCESSING_STATUS_COUNT).fill(0);
  private readonly actionStatusOpacitiesBuf: Record<string, number> = Object.fromEntries(
    ACTION_NODE_IDS.map((id) => [id, 0]),
  );
  private reduceMotion: boolean;
  private flowTime = 0;
  // Advances by real elapsed time exactly like flowTime, except it stops
  // accumulating for the whole ENTER CORE fly-in (see secondaryIdleFrozen in
  // renderFrame) — node idle sway/orbit-spin read off this instead of the
  // live clock so they hold their exact last phase (no snap either way)
  // instead of continuing to animate through a stretch of scroll where the
  // camera is moving too fast for that idle motion to register anyway.
  private secondaryIdleClock = 0;
  private running = false;
  private rafId: number | null = null;
  private lastFrameTime: number | null = null;
  private resizeObserver: ResizeObserver;
  private onFrame?: (state: AutomationNetworkFrameState) => void;

  // Cached in resize() (which already reads the rect) instead of calling
  // getBoundingClientRect() every frame — that read forces a synchronous
  // layout whenever the previous frame's label DOM writes (onFrame) are
  // still pending, a per-frame layout-thrash that showed up as a real cost
  // under profiling.
  private containerWidth = 1;
  private containerHeight = 1;

  private cameraDistanceMultiplier = 1;
  private coreSizeMultiplier = 1;
  private nodeLayoutRadiusMultiplier = 1;
  private nodeMeshScaleMultiplier = 1;
  private secondaryMotionScale = 1;

  private readonly tubeRingCount: number;
  private readonly tubeRadialSegments: number;

  constructor(container: HTMLElement, options: SceneControllerOptions) {
    this.container = container;
    this.reduceMotion = options.reduceMotion;
    this.onFrame = options.onFrame;

    const initialWidth = Math.max(1, container.getBoundingClientRect().width);
    const isInitiallyMobile = initialWidth < MOBILE_PARTICLE_WIDTH_THRESHOLD;
    const isCompactTier = initialWidth < 1024;
    this.tubeRingCount = isCompactTier ? COMPACT_TUBE_RING_COUNT : TUBE_RING_COUNT;
    this.tubeRadialSegments = isCompactTier ? COMPACT_TUBE_RADIAL_SEGMENTS : TUBE_RADIAL_SEGMENTS;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    const dprCap = isCompactTier ? COMPACT_DPR_CAP : DESKTOP_DPR_CAP;
    const dpr = options.dpr ?? Math.min(window.devicePixelRatio || 1, dprCap);
    this.baseDpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    this.scene = new THREE.Scene();
    const bg = resolveCssColor("--color-bg", "#0a0b0f");
    this.scene.fog = new THREE.Fog(bg.getHex(), FOG_NEAR, FOG_FAR);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 50);

    const accent = resolveCssColor("--color-accent", "#c8f042");
    const fgMuted = resolveCssColor("--color-fg-muted", "#8b9088");
    this.accentColor = accent;
    this.fgMutedColor = fgMuted;
    this.hotColor = accent.clone().lerp(new THREE.Color("#ffffff"), 0.6);
    this.statusDarkColor = new THREE.Color(0x050506);

    this.scene.add(new THREE.HemisphereLight(fgMuted.clone().lerp(new THREE.Color("#ffffff"), 0.35), bg, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.65);
    key.position.set(2, 3, 2);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-2.5, -1.2, -2);
    this.scene.add(rim);

    const structuralBodyColor = bg.clone().lerp(fgMuted, 0.22);
    const plasmaCoreColor = derivePlasmaCoreColor(accent);

    this.coreHotMaterial = buildPlasmaOrbMaterial(plasmaCoreColor, accent, CORE_HOT_INTENSITY, 0.5, 0.16);
    const coreHotDetail = isCompactTier ? COMPACT_CORE_HOT_DETAIL : DESKTOP_CORE_HOT_DETAIL;
    this.coreHot = new THREE.Mesh(new THREE.IcosahedronGeometry(CORE_HOT_RADIUS, coreHotDetail), this.coreHotMaterial);
    this.scene.add(this.coreHot);

    this.coreShellMaterial = buildPlasmaShellMaterial(plasmaCoreColor, accent);
    this.coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(CORE_SHELL_RADIUS, CORE_SHELL_DETAIL),
      this.coreShellMaterial,
    );
    this.scene.add(this.coreShell);
    this.coreShellAsymmetry.set(
      1 + (seededUnit(511) - 0.5) * 0.08,
      1 + (seededUnit(512) - 0.5) * 0.08,
      1 + (seededUnit(513) - 0.5) * 0.08,
    );

    const coreOrbitTubularSegments = isCompactTier ? COMPACT_CORE_ORBIT_TUBULAR_SEGMENTS : CORE_ORBIT_TUBULAR_SEGMENTS;
    const coreOrbitRadialSegments = isCompactTier ? COMPACT_CORE_ORBIT_RADIAL_SEGMENTS : CORE_ORBIT_RADIAL_SEGMENTS;
    CORE_ORBIT_RINGS.forEach((config, i) => {
      const curve = new CoreOrbitEllipseCurve(config.radiusX, config.radiusY);
      const geometry = new THREE.TubeGeometry(
        curve,
        coreOrbitTubularSegments,
        config.tubeRadius,
        coreOrbitRadialSegments,
        true,
      );
      const phase = seededUnit(i * 6.47 + 810) * Math.PI * 2;
      const material = buildCoreOrbitMaterial(this.statusDarkColor, config.pulseSpeed, phase, config.intensity);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(config.tilt[0], config.tilt[1], config.tilt[2]);
      this.scene.add(mesh);
      this.coreOrbits.push({ mesh, geometry, material, config });
    });

    this.glowTexture = createGlowTexture();
    this.coreGlowMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: accent,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.coreGlow = new THREE.Sprite(this.coreGlowMaterial);
    this.coreGlow.scale.setScalar(2.6);
    this.scene.add(this.coreGlow);

    this.coreFilamentGeometry = buildFilamentArcGeometry(CORE_FILAMENT_SEGMENTS, CORE_FILAMENT_SPAN);
    for (let i = 0; i < CORE_FILAMENT_COUNT; i++) {
      const group = new THREE.Group();
      const material = buildFilamentMaterial(
        this.statusDarkColor,
        seededUnit(i * 4.77 + 64),
        CORE_FILAMENT_PULSE_SPEED,
      );
      group.add(new THREE.Line(this.coreFilamentGeometry, material));
      group.rotation.z = (i / CORE_FILAMENT_COUNT) * Math.PI * 2;
      this.scene.add(group);
      this.coreFilaments.push({
        group,
        material,
        idleRadius: CORE_FILAMENT_RADIUS * (1 + (seededUnit(i * 4.77 + 60) - 0.5) * 2 * CORE_FILAMENT_RADIUS_VARIATION),
        idleTiltX: (seededUnit(i * 4.77 + 61) - 0.5) * Math.PI * 1.4,
        idleTiltY: (seededUnit(i * 4.77 + 62) - 0.5) * Math.PI * 1.4,
        spinVariation: (seededUnit(i * 4.77 + 63) - 0.5) * 2 * 0.3,
      });
    }

    this.coreFilamentInnerGeometry = buildFilamentArcGeometry(CORE_FILAMENT_INNER_SEGMENTS, CORE_FILAMENT_INNER_SPAN);
    for (let i = 0; i < CORE_FILAMENT_INNER_COUNT; i++) {
      const group = new THREE.Group();
      const material = buildFilamentMaterial(
        this.hotColor,
        seededUnit(i * 5.87 + 700),
        CORE_FILAMENT_INNER_PULSE_SPEED,
      );
      group.add(new THREE.Line(this.coreFilamentInnerGeometry, material));
      group.rotation.z = (i / CORE_FILAMENT_INNER_COUNT) * Math.PI * 2 + Math.PI / CORE_FILAMENT_INNER_COUNT;
      this.scene.add(group);
      this.coreFilaments.push({
        group,
        material,
        idleRadius: CORE_FILAMENT_INNER_RADIUS * (1 + (seededUnit(i * 5.87 + 701) - 0.5) * 0.3),
        idleTiltX: (seededUnit(i * 5.87 + 702) - 0.5) * Math.PI * 1.4,
        idleTiltY: (seededUnit(i * 5.87 + 703) - 0.5) * Math.PI * 1.4,
        spinVariation: (seededUnit(i * 5.87 + 704) - 0.5) * 2 * 0.3,
      });
    }

    this.ringTexture = createRingTexture();
    this.coreShockwaveMaterial = new THREE.SpriteMaterial({
      map: this.ringTexture,
      color: accent,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.coreShockwave = new THREE.Sprite(this.coreShockwaveMaterial);
    this.coreShockwave.scale.setScalar(CORE_SHOCKWAVE_MIN_SCALE);
    this.scene.add(this.coreShockwave);

    this.nodeBodyGeometry = new THREE.IcosahedronGeometry(NODE_BODY_RADIUS, 3);
    this.nodeBodyMaterial = new THREE.MeshStandardMaterial({
      color: structuralBodyColor,
      roughness: 0.18,
      metalness: 0.58,
    });
    const nodeOrbitRadial = isCompactTier ? COMPACT_NODE_ORBIT_RADIAL_SEGMENTS : DESKTOP_NODE_ORBIT_RADIAL_SEGMENTS;
    const nodeOrbitTubular = isCompactTier ? COMPACT_NODE_ORBIT_TUBULAR_SEGMENTS : DESKTOP_NODE_ORBIT_TUBULAR_SEGMENTS;
    this.nodeOrbitInnerGeometry = new THREE.TorusGeometry(NODE_ORBIT_INNER_RADIUS, NODE_ORBIT_INNER_TUBE, nodeOrbitRadial, nodeOrbitTubular);
    this.nodeOrbitMidGeometry = new THREE.TorusGeometry(NODE_ORBIT_MID_RADIUS, NODE_ORBIT_MID_TUBE, nodeOrbitRadial, nodeOrbitTubular);
    this.nodeOrbitOuterGeometry = new THREE.TorusGeometry(NODE_ORBIT_OUTER_RADIUS, NODE_ORBIT_OUTER_TUBE, nodeOrbitRadial, nodeOrbitTubular);
    this.nodeStemGeometry = new THREE.CylinderGeometry(NODE_STEM_RADIUS, NODE_STEM_RADIUS, NODE_STEM_LENGTH, 10, 1, false);
    this.nodeHotPointGeometry = new THREE.IcosahedronGeometry(NODE_HOT_POINT_RADIUS, 2);

    const { core: nodeHotCoreColor, edge: nodeHotEdgeColor } = deriveNodeHotColors(accent);

    options.nodes.slice(0, NODE_COUNT).forEach((node, i) => {
      const group = new THREE.Group();

      const body = new THREE.Mesh(this.nodeBodyGeometry, this.nodeBodyMaterial);
      group.add(body);

      const hotPointMaterial = buildPlasmaOrbMaterial(
        nodeHotCoreColor,
        nodeHotEdgeColor,
        NODE_HOT_INTENSITY,
        NODE_HOT_NOISE_AMP,
        NODE_HOT_NOISE_SPEED,
      );
      const hotPoint = new THREE.Mesh(this.nodeHotPointGeometry, hotPointMaterial);
      hotPoint.position.set(0, NODE_HOT_POINT_OFFSET_Y, 0);
      group.add(hotPoint);

      const stemMaterial = buildRelayStemMaterial(this.statusDarkColor, accent, this.hotColor);
      const stem = new THREE.Mesh(this.nodeStemGeometry, stemMaterial);
      stem.position.set(0, NODE_STEM_CENTER_Y, 0);
      group.add(stem);

      const orbitInnerMaterial = buildVolumetricRingMaterial(this.statusDarkColor);
      const orbitInner = new THREE.Mesh(this.nodeOrbitInnerGeometry, orbitInnerMaterial);
      orbitInner.rotation.set(
        NODE_ORBIT_INNER_TILT[0] + (seededUnit(i * 5.31 + 20) - 0.5) * 0.3,
        NODE_ORBIT_INNER_TILT[1] + (seededUnit(i * 5.31 + 21) - 0.5) * 0.3,
        NODE_ORBIT_INNER_TILT[2] + (seededUnit(i * 5.31 + 22) - 0.5) * 0.3,
      );
      group.add(orbitInner);

      const orbitMidMaterial = buildVolumetricRingMaterial(this.statusDarkColor);
      const orbitMid = new THREE.Mesh(this.nodeOrbitMidGeometry, orbitMidMaterial);
      orbitMid.rotation.set(
        NODE_ORBIT_MID_TILT[0] + (seededUnit(i * 5.31 + 23) - 0.5) * 0.3,
        NODE_ORBIT_MID_TILT[1] + (seededUnit(i * 5.31 + 24) - 0.5) * 0.3,
        NODE_ORBIT_MID_TILT[2] + (seededUnit(i * 5.31 + 25) - 0.5) * 0.3,
      );
      group.add(orbitMid);

      const orbitOuterMaterial = buildVolumetricRingMaterial(this.statusDarkColor);
      const orbitOuter = new THREE.Mesh(this.nodeOrbitOuterGeometry, orbitOuterMaterial);
      orbitOuter.rotation.set(
        NODE_ORBIT_OUTER_TILT[0] + (seededUnit(i * 5.31 + 27) - 0.5) * 0.3,
        NODE_ORBIT_OUTER_TILT[1] + (seededUnit(i * 5.31 + 28) - 0.5) * 0.3,
        NODE_ORBIT_OUTER_TILT[2] + (seededUnit(i * 5.31 + 29) - 0.5) * 0.3,
      );
      group.add(orbitOuter);

      const glowMaterial = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: nodeHotEdgeColor,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: NODE_GLOW_IDLE_OPACITY,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.setScalar(NODE_GLOW_SCALE);
      group.add(glow);

      const chaos = CHAOS_POSITIONS[i] ?? [0, 0, 0];
      group.position.set(chaos[0], chaos[1], chaos[2]);
      this.scene.add(group);

      this.nodes.push({
        id: node.id,
        group,
        orbitInner,
        orbitInnerMaterial,
        orbitMid,
        orbitMidMaterial,
        orbitOuter,
        orbitOuterMaterial,
        stemMaterial,
        hotPointMaterial,
        glowMaterial,
        orbitSpinVariation: (seededUnit(i * 5.31 + 30) - 0.5) * 2 * NODE_ORBIT_SPIN_VARIATION,
        colorVariation: 1 + (seededUnit(i * 5.31 + 31) - 0.5) * 2 * NODE_COLOR_VARIATION,
        hoverBoostAmount: 0,
        hoverDimAmount: 0,
      });
    });
    this.nodesById = new Map(this.nodes.map((n) => [n.id, n]));

    const tubeIndices = buildTubeIndices(this.tubeRingCount, this.tubeRadialSegments);
    const connectionOpaqueBoost = relativeLuminance(bg) > 0.5 ? 1 : 0;
    this.nodes.forEach((node, i) => {
      const geometry = new THREE.BufferGeometry();
      const positionAttr = new THREE.BufferAttribute(
        new Float32Array(this.tubeRingCount * this.tubeRadialSegments * 3),
        3,
      );
      const normalAttr = new THREE.BufferAttribute(
        new Float32Array(this.tubeRingCount * this.tubeRadialSegments * 3),
        3,
      );
      positionAttr.setUsage(THREE.DynamicDrawUsage);
      normalAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("position", positionAttr);
      geometry.setAttribute("normal", normalAttr);

      const uvAttr = new THREE.BufferAttribute(
        new Float32Array(this.tubeRingCount * this.tubeRadialSegments * 2),
        2,
      );
      for (let ring = 0; ring < this.tubeRingCount; ring++) {
        for (let j = 0; j < this.tubeRadialSegments; j++) {
          const idx = ring * this.tubeRadialSegments + j;
          uvAttr.setXY(idx, j / this.tubeRadialSegments, ring / (this.tubeRingCount - 1));
        }
      }
      geometry.setAttribute("uv", uvAttr);
      geometry.setIndex(tubeIndices);

      const turns = HELIX_BASE_TURNS + (seededUnit(i * 7.13 + 1) - 0.5) * 2 * HELIX_TURNS_VARIATION;
      const phaseOffset = seededUnit(i * 7.13 + 2) * Math.PI * 2;
      const radiusScale = 1 + (seededUnit(i * 7.13 + 3) - 0.5) * 2 * RADIUS_VARIATION;
      const curvatureScale = 1 + (seededUnit(i * 7.13 + 4) - 0.5) * 2 * CURVATURE_VARIATION;

      const material = buildConnectionMaterial(accent, turns, phaseOffset, connectionOpaqueBoost);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      this.scene.add(mesh);

      const curveMid = new THREE.Vector3();
      const curveTarget = new THREE.Vector3();
      const curve = new THREE.CatmullRomCurve3([this.coreOrigin, curveMid, curveTarget]);

      this.connections.push({
        nodeId: node.id,
        mesh,
        geometry,
        material,
        turns,
        phaseOffset,
        radiusScale,
        curvatureScale,
        hoverBoostAmount: 0,
        hoverDimAmount: 0,
        curve,
        curveMid,
        curveTarget,
        // Infinity guarantees the first frame always builds the tube.
        lastTubeTarget: new THREE.Vector3(Infinity, Infinity, Infinity),
      });
    });

    this.atmosphereInnerMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: accent,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.atmosphereInner = new THREE.Sprite(this.atmosphereInnerMaterial);
    this.atmosphereInner.scale.setScalar(ATMOSPHERE_INNER_SCALE);
    this.scene.add(this.atmosphereInner);

    const particleAttrs = buildParticleAttributes(isInitiallyMobile ? MOBILE_PARTICLE_COUNT : PARTICLE_COUNT);
    this.particlesGeometry = new THREE.BufferGeometry();
    this.particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particleAttrs.positions, 3));
    this.particlesGeometry.setAttribute("aSize", new THREE.BufferAttribute(particleAttrs.sizes, 1));
    this.particlesGeometry.setAttribute("aPhase", new THREE.BufferAttribute(particleAttrs.phases, 1));
    this.particlesMaterial = buildParticlesMaterial(accent);
    this.particlesMaterial.uniforms.uPixelRatio.value = dpr;
    this.particles = new THREE.Points(this.particlesGeometry, this.particlesMaterial);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderFrame(0);
    this.warmUpCoreShellDoubleSide();
  }

  // coreShellMaterial starts (and spends nearly the whole site) on
  // FrontSide, only switching to DoubleSide for the last stretch of ENTER
  // CORE (see renderFrame). Three.js keys its shader program cache on
  // material.side (DoubleSide injects `#define DOUBLE_SIDED`), so that
  // switch would otherwise compile a brand-new program the first time it
  // happens — right in the middle of the close-up. Compiling it now, at
  // scene setup, moves that cost to a moment nobody is looking at the
  // result, so the later switch just selects an already-linked program.
  //
  // Deliberately the synchronous renderer.compile(), not compileAsync():
  // the async version only exists to let a caller await program *linking*
  // via the KHR_parallel_shader_compile extension, but we never read its
  // result (fire-and-forget) and Three.js already treats every program as
  // immediately "ready" when that extension is absent — so compileAsync
  // buys nothing here beyond an extra Promise and a background setTimeout
  // poll loop. That poll loop closes over this constructor call's materials
  // and keeps running after this method returns; if dispose() (e.g. React
  // Strict Mode's mount/unmount/remount in dev) tears down coreShellMaterial
  // before the poll's next tick, Three.js's internal properties map for it
  // is gone and the loop throws a raw, uncaught "Cannot read properties of
  // undefined (reading 'isReady')" from inside its own setTimeout — a
  // startup race, not anything about our scene being broken. compile() does
  // the same getProgram()/glCompileShader work synchronously and returns,
  // so there's no pending async work left to race a fast unmount.
  private warmUpCoreShellDoubleSide() {
    const material = this.coreShellMaterial;
    const originalSide = material.side;
    material.side = THREE.DoubleSide;
    this.renderer.compile(this.scene, this.camera);
    material.side = originalSide;
  }

  setProgress(value: number) {
    this.targetProgress = value;
    if (!this.running) {
      // No RAF driving the damping loop (paused/off-screen) — snap so the
      // scene stays correct while stopped instead of freezing mid-catch-up.
      this.progress = value;
      this.renderFrame(0);
    }
  }

  setHoveredNode(id: string | null) {
    this.hoveredNodeId = id;
    if (!this.running) this.renderFrame(0);
  }

  refreshTheme() {
    const accent = resolveCssColor("--color-accent", "#c8f042");
    const fgMuted = resolveCssColor("--color-fg-muted", "#8b9088");
    const bg = resolveCssColor("--color-bg", "#0a0b0f");

    this.accentColor.copy(accent);
    this.fgMutedColor.copy(fgMuted);
    this.hotColor.copy(accent).lerp(new THREE.Color("#ffffff"), 0.6);
    this.scene.fog?.color.copy(bg);

    const plasmaCoreColor = derivePlasmaCoreColor(accent);
    this.coreHotMaterial.uniforms.uColorCore.value.copy(plasmaCoreColor);
    this.coreHotMaterial.uniforms.uColorEdge.value.copy(accent);
    this.coreShellMaterial.uniforms.uColorCore.value.copy(plasmaCoreColor);
    this.coreShellMaterial.uniforms.uColorEdge.value.copy(accent);
    this.coreGlowMaterial.color.copy(accent);
    this.atmosphereInnerMaterial.color.copy(accent);
    this.particlesMaterial.uniforms.uColor.value.copy(accent);

    const connectionOpaqueBoost = relativeLuminance(bg) > 0.5 ? 1 : 0;
    this.connections.forEach((connection) => {
      connection.material.uniforms.uColor.value.copy(accent);
      connection.material.uniforms.uOpaqueBoost.value = connectionOpaqueBoost;
      connection.material.blending = connectionOpaqueBoost > 0.5 ? THREE.NormalBlending : THREE.AdditiveBlending;
    });

    const { core: nodeHotCoreColor, edge: nodeHotEdgeColor } = deriveNodeHotColors(accent);
    this.nodes.forEach((node) => {
      node.hotPointMaterial.uniforms.uColorCore.value.copy(nodeHotCoreColor);
      node.hotPointMaterial.uniforms.uColorEdge.value.copy(nodeHotEdgeColor);
      node.glowMaterial.color.copy(nodeHotEdgeColor);
      node.stemMaterial.uniforms.uColorEnergy.value.copy(accent);
      node.stemMaterial.uniforms.uColorHot.value.copy(this.hotColor);
    });

    if (!this.running) this.renderFrame(0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (time: number) => {
      this.rafId = requestAnimationFrame(loop);
      this.renderFrame(time);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastFrameTime = null;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.containerWidth = width;
    this.containerHeight = height;
    this.renderer.setSize(width, height, false);

    const anchor = resolveResponsiveAnchor(width);
    this.coreSizeMultiplier = anchor.coreScaleMultiplier;
    this.nodeLayoutRadiusMultiplier = anchor.layoutRadiusMultiplier;
    this.nodeMeshScaleMultiplier = anchor.meshScaleMultiplier;
    this.secondaryMotionScale = anchor.secondaryMotionScale;
    this.cameraDistanceMultiplier = computeCameraDistanceMultiplier(anchor, width, height);
    this.camera.fov = anchor.fovDeg;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.stop();
    this.resizeObserver.disconnect();
    this.nodes.forEach((n) => {
      n.orbitInnerMaterial.dispose();
      n.orbitMidMaterial.dispose();
      n.orbitOuterMaterial.dispose();
      n.stemMaterial.dispose();
      n.hotPointMaterial.dispose();
      n.glowMaterial.dispose();
    });
    this.nodeBodyGeometry.dispose();
    this.nodeBodyMaterial.dispose();
    this.nodeOrbitInnerGeometry.dispose();
    this.nodeOrbitMidGeometry.dispose();
    this.nodeOrbitOuterGeometry.dispose();
    this.nodeStemGeometry.dispose();
    this.nodeHotPointGeometry.dispose();
    this.connections.forEach((c) => {
      c.geometry.dispose();
      c.material.dispose();
    });
    this.particlesGeometry.dispose();
    this.particlesMaterial.dispose();
    this.atmosphereInnerMaterial.dispose();
    this.coreHot.geometry.dispose();
    this.coreHotMaterial.dispose();
    this.coreShell.geometry.dispose();
    this.coreShellMaterial.dispose();
    this.coreOrbits.forEach((orbit) => {
      orbit.geometry.dispose();
      orbit.material.dispose();
    });
    this.coreGlowMaterial.dispose();
    this.glowTexture.dispose();
    this.coreFilamentGeometry.dispose();
    this.coreFilamentInnerGeometry.dispose();
    this.coreFilaments.forEach((filament) => filament.material.dispose());
    this.coreShockwaveMaterial.dispose();
    this.ringTexture.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private updateConnectionTube(connection: ConnectionRig, targetPosition: THREE.Vector3) {
    const to = targetPosition;
    const curvatureScale = connection.curvatureScale;
    connection.curveTarget.copy(to);
    connection.curveMid.set(
      (this.coreOrigin.x + to.x) / 2 + (to.z - this.coreOrigin.z) * 0.24 * curvatureScale,
      (this.coreOrigin.y + to.y) / 2 + 0.75 * curvatureScale,
      (this.coreOrigin.z + to.z) / 2 - (to.x - this.coreOrigin.x) * 0.24 * curvatureScale,
    );
    // curve.points reference curveMid/curveTarget directly (set at
    // construction), so mutating them above already updates the curve —
    // no new curve/point objects are allocated on this hot path.
    const curve = connection.curve;
    const ringCount = this.tubeRingCount;
    const radialSegments = this.tubeRadialSegments;
    const lastRing = ringCount - 1;

    const positionAttr = connection.geometry.getAttribute("position") as THREE.BufferAttribute;
    const normalAttr = connection.geometry.getAttribute("normal") as THREE.BufferAttribute;
    const twoPi = Math.PI * 2;

    // A fixed reference axis crossed with the local tangent, picked once for
    // the whole connection (never mid-loop) so the frame can't flip partway
    // along the tube: swap to the X axis only when the connection runs
    // close enough to vertical that Y would nearly cancel out.
    const toLength = to.length() || 1;
    const reference = Math.abs(to.y) / toLength > 0.9 ? TUBE_FRAME_REFERENCE_RIGHT : TUBE_FRAME_REFERENCE_UP;

    const point = this.tubeScratchPoint;
    const pA = this.tubeScratchTangentA;
    const tangent = this.tubeScratchTangentB;
    const normal = this.tubeScratchNormal;
    const binormal = this.tubeScratchBinormal;

    for (let ring = 0; ring < ringCount; ring++) {
      const alongT = ring / lastRing;
      curve.getPoint(alongT, point);

      const t1 = Math.max(0, alongT - TUBE_TANGENT_SAMPLE_EPS);
      const t2 = Math.min(1, alongT + TUBE_TANGENT_SAMPLE_EPS);
      curve.getPoint(t1, pA);
      curve.getPoint(t2, tangent);
      tangent.sub(pA).normalize();

      normal.crossVectors(reference, tangent).normalize();
      binormal.crossVectors(tangent, normal);

      for (let j = 0; j < radialSegments; j++) {
        const theta = (j / radialSegments) * twoPi;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const nx = normal.x * cosT + binormal.x * sinT;
        const ny = normal.y * cosT + binormal.y * sinT;
        const nz = normal.z * cosT + binormal.z * sinT;

        const spiral = (alongT * connection.turns - j / radialSegments) * twoPi + connection.phaseOffset;
        const bulge = smoothstepJs(1 - HELIX_BAND_WIDTH, 1, Math.cos(spiral) * 0.5 + 0.5);
        const radius = TUBE_RADIUS * connection.radiusScale + HELIX_RADIUS * bulge;

        const idx = ring * radialSegments + j;
        positionAttr.setXYZ(idx, point.x + nx * radius, point.y + ny * radius, point.z + nz * radius);
        normalAttr.setXYZ(idx, nx, ny, nz);
      }
    }
    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;
  }

  private renderFrame(time: number) {
    const t = time * 0.001;
    if (!this.reduceMotion) this.flowTime = t;

    let hoverDt = 0;
    if (this.running) {
      if (this.lastFrameTime != null) {
        hoverDt = Math.min(0.1, Math.max(0, (time - this.lastFrameTime) / 1000));
      }
      this.lastFrameTime = time;
    }

    // targetProgress -> damped this.progress: raw scroll stays the target,
    // the timeline samples a value that chases it, so a single large wheel
    // delta doesn't jump the scene straight to a new phase. dt<=0 (paused,
    // or the very first frame) snaps instead of damping toward a stale
    // starting value; reduced-motion always uses raw progress.
    if (this.reduceMotion || hoverDt <= 0) {
      this.progress = this.targetProgress;
    } else {
      this.progress = dampTowards(this.progress, this.targetProgress, hoverDt, PROGRESS_SMOOTHING_TIME_CONSTANT);
    }
    const progress = this.progress;

    const canvasDissolveT = sampleCanvasDissolveT(progress);
    markPhaseTransition("canvas-dissolve", canvasDissolveT > 0 && canvasDissolveT < 1);
    // Same damped `progress` canvasDissolveT itself uses — see isHeroPrepared's
    // doc comment for why this is deliberately a separate, earlier signal
    // from `revealed` (canvasDissolveT > 0) rather than reusing it.
    const heroPrepared = isHeroPrepared(progress);
    markPhaseTransition("hero-prepared", heroPrepared);
    if (canvasDissolveT >= 1) {
      if (this.onFrame) {
        // Explicit zero for every known label, not an empty array — the
        // caller's sync only writes opacity for ids it's told about, so an
        // empty list leaves whatever opacity each label last had frozen in
        // its inline style (invisible in the normal slow fade-out, but a
        // stale fully-visible label can get stuck on top of Hero after a
        // big/instant progress jump, e.g. with reduced motion).
        const labels: LabelScreenPosition[] = this.nodes.map((node) => ({
          id: node.id,
          x: 0,
          y: 0,
          opacity: 0,
        }));
        this.onFrame({
          labels,
          processingStatusOpacities: new Array(PROCESSING_STATUS_COUNT).fill(0),
          actionStatusOpacities: Object.fromEntries(ACTION_NODE_IDS.map((id) => [id, 0])),
          completeOpacity: 0,
          canvasDissolveT,
          heroPrepared,
        });
      }
      // Fully dissolved and Hero has taken over — nothing here is visible,
      // so stop scheduling frames entirely instead of leaving a RAF loop
      // ticking a no-op forever. setProgress() restarts it the instant
      // scroll moves back into visible territory.
      if (this.running) this.stop();
      return;
    }

    const enterCoreT = sampleEnterCoreT(progress);
    markPhaseTransition("enter-core", enterCoreT > 0);
    const sceneContentOpacity = 1 - enterCoreT;

    // Node idle sway + orbit-ring spin are flavor motion nobody can actually
    // track once the camera starts flying toward the Core — but every frame
    // they still perturbed node.group.position by a fraction of a unit,
    // which kept tripping the connection-tube rebuild epsilon (see
    // CONNECTION_REBUILD_EPSILON below) even though nodes had long since
    // finished their real (layoutT-driven) fly-in motion. Freezing just
    // this secondary layer for the ENTER CORE window removes that
    // per-frame ~200-iteration rebuild cost entirely without touching
    // position/scale/opacity (the actual visible fly-in/fade) or the
    // connection shader's own flow animation (still driven by flowTime).
    const secondaryIdleFrozen = enterCoreT > 0;
    if (!secondaryIdleFrozen) this.secondaryIdleClock += hoverDt;
    const motionProgress = this.reduceMotion ? Math.min(progress, PHASES.complete[1]) : progress;
    const detailReveal = Math.min(1, enterCoreT * 1.6);

    const camPos = sampleVec3Track(CAMERA_POSITION_TRACK, motionProgress);
    const camLookAt = sampleVec3Track(CAMERA_LOOKAT_TRACK, motionProgress);
    if (this.cameraDistanceMultiplier !== 1) {
      this.camera.position.set(
        camLookAt[0] + (camPos[0] - camLookAt[0]) * this.cameraDistanceMultiplier,
        camLookAt[1] + (camPos[1] - camLookAt[1]) * this.cameraDistanceMultiplier,
        camLookAt[2] + (camPos[2] - camLookAt[2]) * this.cameraDistanceMultiplier,
      );
    } else {
      this.camera.position.set(camPos[0], camPos[1], camPos[2]);
    }
    this.camera.lookAt(camLookAt[0], camLookAt[1], camLookAt[2]);

    const coreVisibility = sampleNumberTrack(CORE_VISIBILITY_TRACK, progress);
    const coreScale = sampleNumberTrack(CORE_SCALE_TRACK, motionProgress) * this.coreSizeMultiplier;
    const coreGlow = sampleNumberTrack(CORE_GLOW_TRACK, progress);
    const processingBoost = sampleNumberTrack(CORE_PROCESSING_BOOST_TRACK, progress);
    const corePulse = this.reduceMotion ? 0 : Math.sin(t * 4.2) * processingBoost * 0.05 * this.secondaryMotionScale;
    const hotBreath = this.reduceMotion ? 0 : Math.sin(t * 0.35) * 0.045 * this.secondaryMotionScale;

    const restingComplete = isHoverPhaseActive(progress);
    let heartbeatActivity = 0;
    let heartbeatHead = 0;
    if (restingComplete && !this.reduceMotion) {
      const cyclePos = (this.flowTime % HEARTBEAT_PERIOD) / HEARTBEAT_PERIOD;
      if (cyclePos < HEARTBEAT_ACTIVE_FRACTION) {
        const beatT = cyclePos / HEARTBEAT_ACTIVE_FRACTION;
        heartbeatActivity = 4 * beatT * (1 - beatT);
        heartbeatHead = beatT;
      }
    }

    const hotEnterShrink = 1 - smoothstepJs(0, 0.5, enterCoreT) * 0.5;
    this.coreHot.scale.setScalar(
      coreScale *
        hotEnterShrink *
        (1 + hotBreath + processingBoost * 0.16 + corePulse + heartbeatActivity * HEARTBEAT_CORE_BOOST),
    );
    this.coreHotMaterial.uniforms.uOpacity.value = coreVisibility;
    this.coreHotMaterial.uniforms.uTime.value = this.flowTime;
    this.coreHotMaterial.uniforms.uNoiseSpeed.value = 0.16 + processingBoost * 0.35;
    this.coreHotMaterial.uniforms.uNoiseAmp.value = 0.45 + processingBoost * 0.45 + detailReveal * 0.25;

    const coreShellScale = coreScale * (1 + hotBreath * 0.7 + processingBoost * 0.05);
    this.coreShell.scale.set(
      coreShellScale * this.coreShellAsymmetry.x,
      coreShellScale * this.coreShellAsymmetry.y,
      coreShellScale * this.coreShellAsymmetry.z,
    );
    this.coreShellMaterial.uniforms.uOpacity.value =
      coreVisibility * (0.42 + processingBoost * 0.22 + heartbeatActivity * 0.12);
    this.coreShellMaterial.uniforms.uTime.value = this.flowTime;
    this.coreShellMaterial.uniforms.uNoiseSpeed.value = 0.12 + processingBoost * 0.3;
    this.coreShellMaterial.uniforms.uNoiseAmp.value = 0.35 + processingBoost * 0.4 + detailReveal * 0.25;

    // Only the very tail of ENTER CORE puts the camera inside the shell
    // (verified against the camera/scale tracks) — DoubleSide is wasted
    // fill-rate on the biggest translucent layer on screen everywhere else.
    const wantsShellDoubleSide = enterCoreT >= CORE_SHELL_DOUBLE_SIDE_THRESHOLD;
    markPhaseTransition("core-shell-doubleside", wantsShellDoubleSide);
    if (wantsShellDoubleSide !== this.coreShellDoubleSide) {
      this.coreShellDoubleSide = wantsShellDoubleSide;
      this.coreShellMaterial.side = wantsShellDoubleSide ? THREE.DoubleSide : THREE.FrontSide;
    }

    // Discrete DPR tier for exactly the expensive window above — never
    // touched per frame, and setPixelRatio itself only reallocates the
    // drawing buffer on the frames where the tier actually changes.
    const wantsDprTier =
      enterCoreT >= LATE_CORE_QUALITY_THRESHOLD ? 2 : enterCoreT >= CORE_DPR_TIER1_THRESHOLD ? 1 : 0;
    markPhaseTransition("dpr-tier-0.72", wantsDprTier >= 1);
    markPhaseTransition("dpr-tier-0.82", wantsDprTier >= 2);
    if (wantsDprTier !== this.coreDprTier) {
      this.coreDprTier = wantsDprTier;
      const scale = wantsDprTier === 2 ? LATE_CORE_DPR_SCALE : wantsDprTier === 1 ? CORE_DPR_TIER1_SCALE : 1;
      this.renderer.setPixelRatio(this.baseDpr * scale);
    }

    // Orbit rings and filaments read as fine surface detail — once the hot
    // sphere/shell already fill most of the viewport near the end of ENTER
    // CORE they're not visually contributing, so fade them out and stop
    // drawing them entirely instead of paying full overdraw for them too.
    const coreSecondaryFade = 1 - smoothstepJs(CORE_SECONDARY_FADE_START, CORE_SECONDARY_FADE_END, enterCoreT);
    markPhaseTransition(
      "core-secondary-fade",
      enterCoreT >= CORE_SECONDARY_FADE_START && enterCoreT < CORE_SECONDARY_FADE_END,
    );
    const coreSecondaryVisible = coreSecondaryFade > 0.01;
    if (coreSecondaryVisible !== this.coreSecondaryVisible) {
      this.coreSecondaryVisible = coreSecondaryVisible;
      this.coreOrbits.forEach((orbit) => {
        orbit.mesh.visible = coreSecondaryVisible;
      });
      this.coreFilaments.forEach((filament) => {
        filament.group.visible = coreSecondaryVisible;
      });
    }

    if (coreSecondaryVisible) {
      const coreOrbitEnergy = Math.min(1, coreGlow + processingBoost * 0.6);

      const coreOrbitEmissive = this.scratchColor
        .copy(this.fgMutedColor)
        .lerp(this.accentColor, coreOrbitEnergy * CORE_ORBIT_EMISSIVE_RANGE);
      const coreOrbitScale = coreScale * (1 + processingBoost * 0.06);
      this.coreOrbits.forEach((orbit) => {
        orbit.mesh.scale.setScalar(coreOrbitScale);
        const u = orbit.material.uniforms;
        u.uColor.value.copy(coreOrbitEmissive);
        u.uOpacity.value = coreVisibility * coreSecondaryFade;
        u.uTime.value = this.flowTime;
        u.uPulseSpeed.value = orbit.config.pulseSpeed * (1 + processingBoost * 1.4);
        if (!this.reduceMotion) {
          const rate =
            orbit.config.spinRateBase * (1 + processingBoost * CORE_PROCESSING_ROTATION_BOOST) * orbit.config.spinDirection;
          orbit.mesh.rotation[orbit.config.spinAxis] += rate;
        }
      });

      const filamentGlow = 0.4 + processingBoost * 0.6;
      const coreFilamentColor = this.scratchColor.copy(this.statusDarkColor).lerp(this.hotColor, filamentGlow);
      const coreFilamentOpacity =
        (CORE_FILAMENT_IDLE_OPACITY + (CORE_FILAMENT_PROCESSING_OPACITY - CORE_FILAMENT_IDLE_OPACITY) * processingBoost) *
        coreVisibility *
        coreSecondaryFade;
      this.coreFilaments.forEach((filament) => {
        const radius = filament.idleRadius + (CORE_FILAMENT_RADIUS - filament.idleRadius) * processingBoost;
        filament.group.scale.setScalar(radius * coreScale);
        filament.group.rotation.x = filament.idleTiltX + (CORE_FILAMENT_ORGANIZED_TILT[0] - filament.idleTiltX) * processingBoost;
        filament.group.rotation.y = filament.idleTiltY + (CORE_FILAMENT_ORGANIZED_TILT[1] - filament.idleTiltY) * processingBoost;
        filament.material.uniforms.uColor.value.copy(coreFilamentColor);
        filament.material.uniforms.uOpacity.value = coreFilamentOpacity;
        filament.material.uniforms.uTime.value = this.flowTime;
        if (!this.reduceMotion) {
          const spin = CORE_FILAMENT_IDLE_SPIN * (1 + filament.spinVariation) * (1 + processingBoost * CORE_FILAMENT_PROCESSING_SPIN_BOOST);
          filament.group.rotation.z += spin / 60;
        }
      });
    }

    const glowEnterCurve = 1 + Math.sin(Math.min(enterCoreT, 1) * Math.PI) * 0.85;
    this.coreGlowMaterial.opacity = Math.min(
      0.9,
      (coreGlow + processingBoost * 0.45 + heartbeatActivity * 0.25) *
        coreVisibility *
        glowEnterCurve *
        CORE_GLOW_SPRITE_BRIGHTNESS,
    );
    this.coreGlow.scale.setScalar(
      (2.0 + coreGlow * 1.0 + processingBoost * 0.8 + heartbeatActivity * 0.35) *
        (1 + Math.min(enterCoreT, CORE_GLOW_SCALE_ENTER_CAP) * 0.5),
    );

    if (!this.reduceMotion) {
      this.coreShell.rotation.y += CORE_SHELL_ROTATION_BASE * (1 + processingBoost * CORE_PROCESSING_ROTATION_BOOST * 0.5);
      this.coreShell.rotation.x -= CORE_SHELL_ROTATION_BASE * 0.6;
    }

    // processingBoost is exactly 0 outside PROCESSING/ACTIONS (see
    // CORE_PROCESSING_BOOST_TRACK) — including all of COMPLETE and ENTER
    // CORE — which already made this opacity 0 there. But the sprite kept
    // scaling up to ~10 world units with coreScale regardless, so late in
    // ENTER CORE it was a fully invisible, near-fullscreen additive sprite
    // still costing a full fragment pass every frame. Hide it outright
    // whenever it can't be contributing instead of just zeroing opacity.
    const shockwaveActive = !this.reduceMotion && processingBoost > 0.001;
    if (shockwaveActive !== this.coreShockwaveVisible) {
      this.coreShockwaveVisible = shockwaveActive;
      this.coreShockwave.visible = shockwaveActive;
    }
    if (shockwaveActive) {
      const shockwavePhase = (this.flowTime % CORE_SHOCKWAVE_PERIOD) / CORE_SHOCKWAVE_PERIOD;
      const shockwaveScale = CORE_SHOCKWAVE_MIN_SCALE + (CORE_SHOCKWAVE_MAX_SCALE - CORE_SHOCKWAVE_MIN_SCALE) * shockwavePhase;
      this.coreShockwave.scale.setScalar(shockwaveScale * coreScale);
      this.coreShockwaveMaterial.opacity =
        (1 - shockwavePhase) * CORE_SHOCKWAVE_MAX_OPACITY * processingBoost * processingBoost * coreVisibility;
    } else {
      this.coreShockwaveMaterial.opacity = 0;
    }

    const layoutT = sampleNodeLayoutT(progress);
    const labelPositions: LabelScreenPosition[] = [];

    // Deep into ENTER CORE, nodes are already scaled to a sliver and
    // connections/particles are practically invisible — stop paying for
    // their per-frame updates (tube rebuild, rotations, DOM projection)
    // instead of animating motion nobody can see behind the glowing Core.
    const sceneContentVisible = sceneContentOpacity > SCENE_CONTENT_HIDE_THRESHOLD;
    if (sceneContentVisible !== this.sceneContentVisible) {
      this.sceneContentVisible = sceneContentVisible;
      this.nodes.forEach((node) => {
        node.group.visible = sceneContentVisible;
      });
      this.connections.forEach((connection) => {
        connection.mesh.visible = sceneContentVisible;
      });
      this.particles.visible = sceneContentVisible;
    }

    if (!sceneContentVisible && this.onFrame) {
      // Same reasoning as the canvasDissolveT>=1 zeroing below: report
      // explicit zeros instead of leaving labelPositions empty, so a label
      // that was still visible the instant this flipped off doesn't keep
      // showing at its last real opacity.
      this.nodes.forEach((node) => {
        labelPositions.push({ id: node.id, x: 0, y: 0, opacity: 0 });
      });
    }

    if (sceneContentVisible) {
      const leadPacketT = sampleLeadPacketT(progress);
      const actionArrivals = ACTION_NODE_IDS.map((_, i) => sampleActionArrival(progress, i));

      const labelOpacity = sampleLabelOpacity(progress);
      const hoverActive = this.hoveredNodeId != null && restingComplete;

      this.nodes.forEach((node, i) => {
        const chaos = CHAOS_POSITIONS[i] ?? [0, 0, 0];
        const assembled = ASSEMBLED_POSITIONS[i] ?? [0, 0, 0];
        const x = (chaos[0] + (assembled[0] - chaos[0]) * layoutT) * this.nodeLayoutRadiusMultiplier;
        const y = (chaos[1] + (assembled[1] - chaos[1]) * layoutT) * this.nodeLayoutRadiusMultiplier;
        const z = (chaos[2] + (assembled[2] - chaos[2]) * layoutT) * this.nodeLayoutRadiusMultiplier;
        const idleY = this.reduceMotion
          ? 0
          : Math.sin(this.secondaryIdleClock * 0.6 + i * 1.7) * 0.05 * this.secondaryMotionScale;
        node.group.position.set(x, y + idleY, z);
        node.group.scale.setScalar(this.nodeMeshScaleMultiplier * Math.max(0.0001, sceneContentOpacity));

        let signal = 0;
        if (node.id === LEAD_SOURCE_NODE_ID) {
          signal = Math.max(signal, sampleNumberTrack(TELEGRAM_SEND_REACTION_TRACK, progress));
        }
        const actionIndex = ACTION_NODE_IDS.indexOf(node.id);
        if (actionIndex !== -1) {
          signal = Math.max(signal, actionArrivals[actionIndex]);
        }

        const arrivalPulse = Math.max(0, 1 - Math.abs(signal - 0.92) / 0.08);

        const energyBase = NODE_ENERGY_IDLE + NODE_ENERGY_RANGE * signal;
        const energy = Math.min(1, energyBase + arrivalPulse * NODE_ENERGY_ARRIVAL_BOOST);
        const pulse = 4 * signal * (1 - signal);

        const isHovered = hoverActive && node.id === this.hoveredNodeId;
        const boostTarget = isHovered ? 1 : 0;
        const dimTarget = hoverActive && !isHovered ? 1 : 0;
        node.hoverBoostAmount = dampTowards(
          node.hoverBoostAmount,
          boostTarget,
          hoverDt,
          boostTarget > node.hoverBoostAmount ? HOVER_IN_TIME_CONSTANT : HOVER_OUT_TIME_CONSTANT,
        );
        node.hoverDimAmount = dampTowards(
          node.hoverDimAmount,
          dimTarget,
          hoverDt,
          dimTarget > node.hoverDimAmount ? HOVER_IN_TIME_CONSTANT : HOVER_OUT_TIME_CONSTANT,
        );
        const dimMultiplier = 1 - node.hoverDimAmount * (1 - NODE_HOVER_DIM_FACTOR);
        const displayEnergy = Math.min(1, energy * dimMultiplier + node.hoverBoostAmount * NODE_HOVER_BOOST_ADD);

        node.stemMaterial.uniforms.uTime.value = this.flowTime;
        node.stemMaterial.uniforms.uBaseBrightness.value = 0.04 + displayEnergy * 0.5;
        node.stemMaterial.uniforms.uColorMix.value = displayEnergy;
        node.stemMaterial.uniforms.uPulseActivity.value = pulse;

        const orbitEmissive = this.scratchColor
          .copy(this.fgMutedColor)
          .lerp(this.accentColor, displayEnergy)
          .multiplyScalar(node.colorVariation);
        node.orbitInnerMaterial.uniforms.uColor.value.copy(orbitEmissive);
        node.orbitMidMaterial.uniforms.uColor.value.copy(orbitEmissive);
        node.orbitOuterMaterial.uniforms.uColor.value.copy(orbitEmissive);

        node.hotPointMaterial.uniforms.uIntensity.value =
          NODE_HOT_INTENSITY * Math.max(displayEnergy, NODE_HOT_POINT_IDLE_FLOOR) * node.colorVariation;
        node.hotPointMaterial.uniforms.uTime.value = this.flowTime;

        if (!this.reduceMotion && !secondaryIdleFrozen) {
          const spin =
            (NODE_ORBIT_SPIN_BASE + NODE_ORBIT_SPIN_PULSE_BOOST * pulse + NODE_ORBIT_SPIN_ENERGY_BOOST * signal) *
            (1 + node.orbitSpinVariation);
          node.orbitInner.rotation.z += (spin * NODE_ORBIT_INNER_SPIN_AXIS_RATE) / 60;
          node.orbitMid.rotation.x -= (spin * NODE_ORBIT_MID_SPIN_AXIS_RATE) / 60;
          node.orbitOuter.rotation.y += (spin * NODE_ORBIT_OUTER_SPIN_AXIS_RATE) / 60;
        }

        node.glowMaterial.opacity =
          NODE_GLOW_IDLE_OPACITY + (NODE_GLOW_ACTIVE_OPACITY - NODE_GLOW_IDLE_OPACITY) * displayEnergy;

        if (this.onFrame) {
          const projected = this.scratchVec3.copy(node.group.position).project(this.camera);
          const behindCamera = projected.z > 1;
          labelPositions.push({
            id: node.id,
            x: (projected.x * 0.5 + 0.5) * this.containerWidth,
            y: (-projected.y * 0.5 + 0.5) * this.containerHeight,
            opacity: behindCamera ? 0 : labelOpacity * sceneContentOpacity,
          });
        }
      });

      const connectionCount = this.connections.length;
      let connectionRebuildsThisFrame = 0;
      for (let k = 0; k < connectionCount; k++) {
        const connection = this.connections[(this.connectionRebuildCursor + k) % connectionCount];
        const node = this.nodesById.get(connection.nodeId);
        if (!node) continue;
        if (connection.lastTubeTarget.distanceToSquared(node.group.position) > CONNECTION_REBUILD_EPSILON_SQ) {
          if (connectionRebuildsThisFrame < CONNECTION_REBUILD_MAX_PER_FRAME) {
            this.updateConnectionTube(connection, node.group.position);
            connection.lastTubeTarget.copy(node.group.position);
            connectionRebuildsThisFrame++;
          }
          // else: still dirty, picked up on a following frame — never
          // skipped outright, just spread out.
        }

        const draw = sampleConnectionDraw(progress) * sceneContentOpacity;

        let signalHead = 0;
        let signalDir = 1;
        let signalActivity = 0;
        if (connection.nodeId === LEAD_SOURCE_NODE_ID) {
          signalHead = 1 - leadPacketT;
          signalDir = -1;
          signalActivity = 4 * leadPacketT * (1 - leadPacketT);
        }
        const actionIndex = ACTION_NODE_IDS.indexOf(connection.nodeId);
        if (actionIndex !== -1) {
          const arrival = actionArrivals[actionIndex];
          signalHead = arrival;
          signalDir = 1;
          signalActivity = 4 * arrival * (1 - arrival);
        }

        if (heartbeatActivity > 0) {
          signalHead = heartbeatHead;
          signalDir = 1;
          signalActivity = heartbeatActivity * HEARTBEAT_CONNECTION_ACTIVITY;
        }

        const u = connection.material.uniforms;
        u.uTime.value = this.flowTime;
        u.uDrawProgress.value = draw;
        u.uSignalHead.value = signalHead;
        u.uSignalDir.value = signalDir;
        u.uSignalActivity.value = signalActivity;

        const connectionHovered = hoverActive && connection.nodeId === this.hoveredNodeId;
        const connectionBoostTarget = connectionHovered ? 1 : 0;
        const connectionDimTarget = hoverActive && !connectionHovered ? 1 : 0;
        connection.hoverBoostAmount = dampTowards(
          connection.hoverBoostAmount,
          connectionBoostTarget,
          hoverDt,
          connectionBoostTarget > connection.hoverBoostAmount
            ? CONNECTION_HOVER_IN_TIME_CONSTANT
            : CONNECTION_HOVER_OUT_TIME_CONSTANT,
        );
        connection.hoverDimAmount = dampTowards(
          connection.hoverDimAmount,
          connectionDimTarget,
          hoverDt,
          connectionDimTarget > connection.hoverDimAmount
            ? CONNECTION_HOVER_IN_TIME_CONSTANT
            : CONNECTION_HOVER_OUT_TIME_CONSTANT,
        );
        const connectionBoostEase = smoothstepJs(0, 1, connection.hoverBoostAmount);
        const connectionDimEase = smoothstepJs(0, 1, connection.hoverDimAmount);
        u.uHoverBoost.value = connectionBoostEase * NODE_HOVER_BOOST_ADD;
        u.uHoverDim.value = 1 - connectionDimEase * (1 - NODE_HOVER_DIM_FACTOR);
      }
      this.connectionRebuildCursor = (this.connectionRebuildCursor + CONNECTION_REBUILD_MAX_PER_FRAME) % connectionCount;

      const particleSpread = PARTICLE_CHAOS_SPREAD + (PARTICLE_SETTLED_SPREAD - PARTICLE_CHAOS_SPREAD) * layoutT;
      this.particlesMaterial.uniforms.uSpread.value = particleSpread;
      this.particlesMaterial.uniforms.uTime.value = this.flowTime;
    }

    // atmosphereInner is a fixed-world-scale sprite, so as the camera dollies
    // in through ENTER CORE its on-screen size keeps growing from proximity
    // alone even though its opacity is tiny — by the late window it's an
    // almost-fullscreen additive sprite contributing nothing next to the hot
    // sphere/shell. Reuse the same fade window and stop-drawing-when-invisible
    // pattern already applied to the orbit rings/filaments just above.
    const atmosphereInnerVisible = coreSecondaryFade > 0.01;
    if (atmosphereInnerVisible !== this.atmosphereInnerVisible) {
      this.atmosphereInnerVisible = atmosphereInnerVisible;
      this.atmosphereInner.visible = atmosphereInnerVisible;
    }
    if (atmosphereInnerVisible) {
      this.atmosphereInnerMaterial.opacity =
        (ATMOSPHERE_INNER_OPACITY + processingBoost * ATMOSPHERE_PROCESSING_BOOST) * coreVisibility * coreSecondaryFade;
    }

    if (this.onFrame) {
      for (let i = 0; i < PROCESSING_STATUS_COUNT; i++) {
        this.processingStatusOpacitiesBuf[i] = sampleProcessingStatusOpacity(progress, i) * sceneContentOpacity;
      }
      for (let i = 0; i < ACTION_NODE_IDS.length; i++) {
        this.actionStatusOpacitiesBuf[ACTION_NODE_IDS[i]] = sampleActionStatusOpacity(progress, i) * sceneContentOpacity;
      }
      this.onFrame({
        labels: labelPositions,
        processingStatusOpacities: this.processingStatusOpacitiesBuf,
        actionStatusOpacities: this.actionStatusOpacitiesBuf,
        completeOpacity: sampleCompleteMessageOpacity(progress) * sceneContentOpacity,
        canvasDissolveT,
        heroPrepared,
      });
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch {
    }
  }
}
