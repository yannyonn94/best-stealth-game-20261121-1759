// BATIK HEIST — the museum floor. buildLevel lays out one fixed midnight
// museum: walls and display plinths to hide behind, six glass cases holding
// batik scrolls, twelve indigo dye vats to hide in, three alarm totems, the
// skylight exit, and the patrol routes the guards walk. The layout is fixed
// (seed only jitters the batik floor motifs) so a route can be learned.
import { FIELD, GAME, mulberry32 } from './config.js';

const CASE_POSITIONS = [
  { x: 190, y: 220 },
  { x: 430, y: 180 },
  { x: 700, y: 210 },
  { x: 960, y: 190 },
  { x: 1120, y: 420 },
  { x: 330, y: 480 },
];

const VAT_POSITIONS = [
  { x: 150, y: 620 }, { x: 300, y: 300 }, { x: 520, y: 620 },
  { x: 560, y: 330 }, { x: 760, y: 600 }, { x: 830, y: 320 },
  { x: 1010, y: 560 }, { x: 1150, y: 250 }, { x: 210, y: 430 },
  { x: 660, y: 470 }, { x: 940, y: 380 }, { x: 420, y: 600 },
];

const TOTEM_POSITIONS = [
  { x: 620, y: 240 },
  { x: 880, y: 500 },
  { x: 260, y: 540 },
];

const WALLS = [
  // Long display plinths (cover) running across the hall.
  { x: 300, y: 250, w: 150, h: 26 },
  { x: 700, y: 260, w: 150, h: 26 },
  { x: 980, y: 300, w: 26, h: 150 },
  { x: 480, y: 430, w: 26, h: 150 },
  { x: 850, y: 430, w: 150, h: 26 },
  { x: 180, y: 520, w: 26, h: 120 },
  { x: 1080, y: 520, w: 150, h: 26 },
  // Side alcoves near the entrance and the exit.
  { x: 120, y: 300, w: 26, h: 110 },
  { x: 1150, y: 120, w: 26, h: 110 },
];

const PATROLS = [
  [{ x: 180, y: 160 }, { x: 620, y: 160 }, { x: 620, y: 300 }, { x: 180, y: 300 }],
  [{ x: 760, y: 160 }, { x: 1180, y: 160 }, { x: 1180, y: 340 }, { x: 760, y: 340 }],
  [{ x: 160, y: 380 }, { x: 560, y: 380 }, { x: 560, y: 640 }, { x: 160, y: 640 }],
  [{ x: 700, y: 400 }, { x: 1180, y: 400 }, { x: 1180, y: 620 }, { x: 700, y: 620 }],
  [{ x: 420, y: 200 }, { x: 920, y: 200 }, { x: 920, y: 560 }, { x: 420, y: 560 }],
];

const LIGHT_POOLS = [
  { x: 430, y: 200, r: 130 },
  { x: 960, y: 200, r: 130 },
  { x: 700, y: 480, r: 140 },
  { x: 1180, y: 160, r: 110 },
  { x: 160, y: 620, r: 110 },
];

export function buildLevel(seed = 1) {
  const rng = mulberry32(seed);
  // Batik floor motifs: a fixed grid of diamonds, each jittered by the seed.
  const motifs = [];
  for (let gx = 0; gx < 15; gx += 1) {
    for (let gy = 0; gy < 8; gy += 1) {
      motifs.push({
        x: FIELD.x + 40 + gx * 80 + (rng() - 0.5) * 14,
        y: FIELD.y + 42 + gy * 82 + (rng() - 0.5) * 14,
        r: 9 + rng() * 5,
        petals: 4 + Math.floor(rng() * 3),
      });
    }
  }
  return {
    field: FIELD,
    walls: WALLS.map((w) => ({ ...w })),
    cases: CASE_POSITIONS.map((p, i) => ({
      id: i, x: p.x, y: p.y, scrollTaken: false, stealProgress: 0,
    })),
    vats: VAT_POSITIONS.slice(0, GAME.vatCount).map((p, i) => ({ id: i, x: p.x, y: p.y, r: 30 })),
    totems: TOTEM_POSITIONS.slice(0, GAME.totemCount).map((p, i) => ({
      id: i, x: p.x, y: p.y, r: 34, triggered: false, cooldown: 0,
    })),
    patrols: PATROLS.map((route) => route.map((p) => ({ ...p }))),
    lightPools: LIGHT_POOLS.map((p) => ({ ...p })),
    motifs,
    // The sleeping guard captain naps by the east wall; his pocket holds scroll 7.
    captain: { x: 1150, y: 560, radius: 16, pocketTaken: false, pickProgress: 0 },
    // The skylight exit, top-right, opens only once all 7 scrolls are stolen.
    exit: { x: 1150, y: 122, w: 72, h: 52 },
    spawn: { x: 90, y: 700 - 40 },
  };
}

/** True when the circle at (x, y, r) overlaps any wall or the field edge. */
export function hitsWall(level, x, y, r) {
  const f = level.field;
  if (x - r < f.x || x + r > f.x + f.width || y - r < f.y || y + r > f.y + f.height) return true;
  for (const w of level.walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/** True when the segment (x1,y1)-(x2,y2) is blocked by a wall (line of sight). */
export function sightBlocked(level, x1, y1, x2, y2) {
  for (const w of level.walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const axes = [
    { p: x1, d: dx, min: rect.x, max: rect.x + rect.w },
    { p: y1, d: dy, min: rect.y, max: rect.y + rect.h },
  ];
  for (const a of axes) {
    if (Math.abs(a.d) < 1e-9) {
      if (a.p < a.min || a.p > a.max) return false;
    } else {
      let t1 = (a.min - a.p) / a.d;
      let t2 = (a.max - a.p) / a.d;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/** True when (x, y) sits inside a lit floor pool (guards see further here). */
export function inLight(level, x, y) {
  for (const pool of level.lightPools) {
    const dx = x - pool.x;
    const dy = y - pool.y;
    if (dx * dx + dy * dy < pool.r * pool.r) return true;
  }
  return false;
}

/** The vat at (x, y), if any, whose rim the point is inside. */
export function vatAt(level, x, y) {
  for (const vat of level.vats) {
    const dx = x - vat.x;
    const dy = y - vat.y;
    if (dx * dx + dy * dy < vat.r * vat.r) return vat;
  }
  return null;
}
