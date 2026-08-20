export type Vec3 = [number, number, number];

interface NumberKeyframe {
  t: number;
  value: number;
}

interface Vec3Keyframe {
  t: number;
  value: Vec3;
}

export const PHASES = {
  chaos: [0, 0.14],
  coreReveal: [0.14, 0.28],
  assembly: [0.28, 0.42],
  newLead: [0.42, 0.56],
  processing: [0.56, 0.68],
  actions: [0.68, 0.84],
  complete: [0.84, 0.92],

  enterCore: [0.92, 1],
} as const;


function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function sampleNumberTrack(track: NumberKeyframe[], progress: number): number {
  if (progress <= track[0].t) return track[0].value;
  const last = track[track.length - 1];
  if (progress >= last.t) return last.value;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const local = b.t === a.t ? 1 : (progress - a.t) / (b.t - a.t);
      return lerp(a.value, b.value, smoothstep(local));
    }
  }
  return last.value;
}

export function sampleVec3Track(track: Vec3Keyframe[], progress: number): Vec3 {
  if (progress <= track[0].t) return track[0].value;
  const last = track[track.length - 1];
  if (progress >= last.t) return last.value;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const local = b.t === a.t ? 1 : (progress - a.t) / (b.t - a.t);
      return lerpVec3(a.value, b.value, smoothstep(local));
    }
  }
  return last.value;
}

const INTRO_FADE_END = 0.1;

export function sampleIntroRevealT(progress: number): number {
  return sampleNumberTrack(
    [
      { t: 0, value: 0 },
      { t: INTRO_FADE_END, value: 1 },
    ],
    progress,
  );
}

export function staggeredLocalT(
  progress: number,
  phaseStart: number,
  phaseEnd: number,
  index: number,
  count: number,
  spread = 0.6,
): number {
  const phaseLocal = clamp01((progress - phaseStart) / (phaseEnd - phaseStart));
  const startFrac = count > 1 ? (index / (count - 1)) * (1 - spread) : 0;
  const segLocal = clamp01((phaseLocal - startFrac) / spread);
  return smoothstep(segLocal);
}


export const NODE_COUNT = 5;

export const CHAOS_POSITIONS: Vec3[] = [
  [-3.0, 1.3, -2.6],
  [2.6, -0.6, 2.1],
  [-1.4, -0.7, 3.3],
  [3.1, 1.6, -1.6],
  [-0.3, 2.2, -3.0],
];

export const ASSEMBLED_RADIUS = 2.3;
export const ASSEMBLED_Y_SQUASH = 0.55;

export const ASSEMBLED_THETA_OFFSET = 1.483;

function fibonacciSpherePoint(index: number, count: number): Vec3 {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = count > 1 ? 1 - (index / (count - 1)) * 2 : 0;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index + ASSEMBLED_THETA_OFFSET;
  return [
    Math.cos(theta) * radiusAtY * ASSEMBLED_RADIUS,
    y * ASSEMBLED_RADIUS * ASSEMBLED_Y_SQUASH,
    Math.sin(theta) * radiusAtY * ASSEMBLED_RADIUS,
  ];
}

export const ASSEMBLED_POSITIONS: Vec3[] = Array.from({ length: NODE_COUNT }, (_, i) =>
  fibonacciSpherePoint(i, NODE_COUNT),
);

export function sampleNodeLayoutT(progress: number): number {
  return sampleNumberTrack(
    [
      { t: PHASES.assembly[0], value: 0 },
      { t: PHASES.assembly[1], value: 1 },
    ],
    progress,
  );
}


export const CORE_VISIBILITY_TRACK: NumberKeyframe[] = [
  { t: 0, value: 0.05 },
  { t: PHASES.coreReveal[0], value: 0.05 },
  { t: PHASES.coreReveal[1], value: 1 },
  { t: 1, value: 1 },
];

export const CORE_FLYIN_MAX_SCALE = 6.5;

export const CORE_SCALE_TRACK: NumberKeyframe[] = [
  { t: 0, value: 0.5 },
  { t: PHASES.coreReveal[0], value: 0.5 },
  { t: PHASES.coreReveal[1], value: 1 },
  { t: PHASES.complete[1], value: 1 },
  { t: 1, value: CORE_FLYIN_MAX_SCALE },
];

export const CORE_GLOW_TRACK: NumberKeyframe[] = [
  { t: 0, value: 0.04 },
  { t: PHASES.coreReveal[0], value: 0.04 },
  { t: PHASES.coreReveal[1] - 0.03, value: 0.55 },
  { t: PHASES.coreReveal[1], value: 0.85 },
  { t: 1, value: 0.85 },
];

export function sampleConnectionDraw(progress: number): number {
  return progress >= PHASES.assembly[0] ? 1 : 0;
}


export function sampleLabelOpacity(progress: number): number {
  return sampleNumberTrack(
    [
      { t: PHASES.coreReveal[0], value: 0 },
      { t: PHASES.assembly[0] + 0.05, value: 1 },
      { t: 1, value: 1 },
    ],
    progress,
  );
}

export const CAMERA_POSITION_TRACK: Vec3Keyframe[] = [
  { t: 0, value: [0.4, 0.6, 9.4] },
  { t: PHASES.chaos[1], value: [0.2, 0.4, 8.6] },
  { t: PHASES.coreReveal[1], value: [0.1, 0.15, 7.2] },
  { t: PHASES.assembly[1], value: [0, 0.05, 4.4] },
  { t: PHASES.actions[1], value: [0, 0.05, 4.4] },
  { t: PHASES.complete[1], value: [0, 0.12, 5.6] },
  { t: 1, value: [0, 0.08, 1.5] },
];

export const CAMERA_LOOKAT_TRACK: Vec3Keyframe[] = [
  { t: 0, value: [0, 0.3, 0] },
  { t: PHASES.coreReveal[1], value: [0, 0.05, 0] },
  { t: PHASES.assembly[1], value: [0, -0.05, 0] },
  { t: PHASES.actions[1], value: [0, -0.05, 0] },
  { t: PHASES.complete[1], value: [0, 0, 0] },
  { t: 1, value: [0, 0, 0] },
];

export const LEAD_SOURCE_NODE_ID = "telegram";

export function sampleLeadPacketT(progress: number): number {
  return sampleNumberTrack(
    [
      { t: PHASES.newLead[0], value: 0 },
      { t: PHASES.newLead[1], value: 1 },
    ],
    progress,
  );
}

export const TELEGRAM_SEND_REACTION_TRACK: NumberKeyframe[] = [
  { t: PHASES.newLead[0] - 0.02, value: 0 },
  { t: PHASES.newLead[0] + 0.015, value: 1 },
  { t: PHASES.newLead[0] + 0.05, value: 0 },
];

export const CORE_PROCESSING_BOOST_TRACK: NumberKeyframe[] = [
  { t: PHASES.newLead[1], value: 0 },
  { t: PHASES.processing[0] + 0.02, value: 1 },
  { t: PHASES.processing[1], value: 1 },
  { t: PHASES.actions[1] - 0.04, value: 0.3 },
  { t: PHASES.complete[0] + 0.04, value: 0 },
  { t: 1, value: 0 },
];

export const PROCESSING_STATUS_COUNT = 3;

export function sampleProcessingStatusOpacity(progress: number, index: number): number {
  const span = (PHASES.processing[1] - PHASES.processing[0]) / PROCESSING_STATUS_COUNT;
  const segStart = PHASES.processing[0] + index * span;
  const segEnd = segStart + span;
  const fade = Math.min(span * 0.35, 0.015);
  return sampleNumberTrack(
    [
      { t: segStart - fade, value: 0 },
      { t: segStart, value: 1 },
      { t: segEnd - fade, value: 1 },
      { t: segEnd, value: 0 },
    ],
    progress,
  );
}

export const ACTION_NODE_IDS = ["crm", "calendar", "email", "docs"];

const PRIMARY_ACTION_COUNT = 3;

export const ACTIONS_CASCADE_SPREAD = 0.6;

export const DOCS_ACTION_START = PHASES.actions[0] + 0.09;

function sampleDocsActionArrival(progress: number): number {
  return sampleNumberTrack(
    [
      { t: DOCS_ACTION_START, value: 0 },
      { t: PHASES.actions[1], value: 1 },
    ],
    progress,
  );
}

export function sampleActionArrival(progress: number, index: number): number {
  if (index >= PRIMARY_ACTION_COUNT) {
    return sampleDocsActionArrival(progress);
  }
  return staggeredLocalT(
    progress,
    PHASES.actions[0],
    PHASES.actions[1],
    index,
    PRIMARY_ACTION_COUNT,
    ACTIONS_CASCADE_SPREAD,
  );
}

export function sampleActionStatusOpacity(progress: number, index: number): number {
  const arrival = sampleActionArrival(progress, index);
  return smoothstep((arrival - 0.8) / 0.2);
}

export function sampleCompleteMessageOpacity(progress: number): number {
  return sampleNumberTrack(
    [
      { t: PHASES.complete[0], value: 0 },
      { t: PHASES.complete[0] + 0.04, value: 1 },
      { t: 1, value: 1 },
    ],
    progress,
  );
}

export function sampleEnterCoreT(progress: number): number {
  return sampleNumberTrack(
    [
      { t: PHASES.enterCore[0], value: 0 },
      { t: 1, value: 1 },
    ],
    progress,
  );
}


const CANVAS_DISSOLVE_START = PHASES.enterCore[0] + (PHASES.enterCore[1] - PHASES.enterCore[0]) * 0.75;

export function sampleCanvasDissolveT(progress: number): number {
  return sampleNumberTrack(
    [
      { t: CANVAS_DISSOLVE_START, value: 0 },
      { t: 1, value: 1 },
    ],
    progress,
  );
}

// A lead-in before CANVAS_DISSOLVE_START, scaled off the dissolve window's
// own span (not a fixed wall-clock guess) — see isHeroPrepared. 30% of that
// span is comfortably inside the stretch where the AutomationNetwork
// backdrop is still fully opaque (canvasDissolveT is exactly 0 for any
// progress below CANVAS_DISSOLVE_START), while still being close enough to
// the real reveal that "prepared" reads as "about to be revealed," not an
// early, independent phase of its own.
const HERO_PREPARE_LEAD = (1 - CANVAS_DISSOLVE_START) * 0.3;

/**
 * True once Hero should start preparing its compositor layers (see the
 * `prepared` prop on Hero) — strictly before CANVAS_DISSOLVE_START, so the
 * opaque backdrop still fully covers it. Never gates the visible entrance
 * animation itself; that stays on sampleCanvasDissolveT(progress) > 0 via
 * `revealed`, unchanged.
 */
export function isHeroPrepared(progress: number): boolean {
  return progress >= CANVAS_DISSOLVE_START - HERO_PREPARE_LEAD;
}

export function isHoverPhaseActive(progress: number): boolean {
  return progress >= PHASES.complete[0] && progress < PHASES.enterCore[0];
}
