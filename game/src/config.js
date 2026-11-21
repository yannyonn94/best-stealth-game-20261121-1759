// BATIK HEIST — tuning and palette. One place for every number the game
// balances on, so a tweak here retunes the whole heist without touching logic.
export const CANVAS = { width: 1280, height: 800 };

export const FIELD = { x: 40, y: 96, width: 1200, height: 664 };

export const PALETTE = {
  floor: '#1c2a5e',
  floorAlt: '#22336b',
  floorDark: '#16224e',
  wall: '#0d1330',
  wallTop: '#2a3a7d',
  gold: '#e8b93c',
  goldBright: '#ffd75e',
  indigo: '#27408f',
  vat: '#1f5fa8',
  vatRim: '#7fb3e8',
  glass: '#9fd8ff',
  scroll: '#f2e3b3',
  exit: '#ffe9a3',
  guard: '#31418f',
  guardAlert: '#c0392b',
  player: '#e8b93c',
  cone: 'rgba(255, 214, 94, 0.30)',
  coneAlert: 'rgba(255, 82, 60, 0.38)',
  totem: '#c0392b',
  dark: 'rgba(6, 8, 26, 0.55)',
  hud: '#0d1330',
  text: '#f5edd0',
  muted: '#aab4dd',
};

export const PLAYER = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 105,
  stealSeconds: 1.4,
  pickpocketSeconds: 2.0,
  interactRange: 46,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 150,
  visionRange: 185,
  visionHalfAngle: 0.61, // ~35 degrees each side
  darkVisionRange: 95, // how far a guard sees into a dark zone
  sneakVisionFactor: 0.62, // sneaking shrinks a guard's vision range by this much
  suspicionPerSecond: 55,
  suspicionDecay: 14,
  hideDecay: 42,
  alarmAt: 100,
  chaseSeconds: 6,
  catchRange: 26,
};

export const GAME = {
  totalScrolls: 7,
  dawnSeconds: 180,
  strikesToLose: 3,
  guardSpeedPerScroll: 0.08, // +8% patrol speed per stolen scroll
  totemRadius: 34,
  totemSpike: 26,
  nearMissRange: 52,
  nearMissSpike: 15,
  vatCount: 12,
  totemCount: 3,
  guardCount: 5,
};

export const STEP = 1 / 60;

/** Deterministic tiny RNG so a seed always builds the same museum. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clamp a value into [min, max]. */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Distance between two points. */
export function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle from (ax, ay) to (bx, by). */
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDifference(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
