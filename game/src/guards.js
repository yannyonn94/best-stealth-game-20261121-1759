// BATIK HEIST — the guards. Each guard walks a patrol loop, watches a
// vision cone, and builds suspicion when Riko is seen. Suspicion decays when
// the line of sight breaks, so a player who ducks behind cover or hides in a
// dye vat can cool a guard down. At full suspicion the guard gives chase;
// catching Riko costs a strike.
import {
  GUARD, GAME, clamp, distance, angleTo, angleDifference,
} from './config.js';
import { hitsWall, sightBlocked, inLight } from './level.js';

export const GUARD_STATE = { PATROL: 'patrol', SUSPICIOUS: 'suspicious', CHASE: 'chase' };

export function makeGuard(id, route) {
  return {
    id,
    route,
    waypoint: 0,
    x: route[0].x,
    y: route[0].y,
    angle: 0,
    speed: GUARD.patrolSpeed,
    state: GUARD_STATE.PATROL,
    suspicion: 0,
    chaseTimer: 0,
    pauseTimer: 0,
    footstepTimer: 0,
    alerted: false,
  };
}

/** Move one guard one step; returns events the game loop should act on. */
export function updateGuard(guard, level, player, dt, scrollsStolen) {
  const events = [];
  const speedBoost = 1 + scrollsStolen * GAME.guardSpeedPerScroll;
  const seen = canSeePlayer(guard, level, player);

  if (seen) {
    guard.suspicion = clamp(guard.suspicion + GUARD.suspicionPerSecond * dt, 0, 100);
  } else if (player.hidden) {
    guard.suspicion = clamp(guard.suspicion - GUARD.hideDecay * dt, 0, 100);
  } else {
    guard.suspicion = clamp(guard.suspicion - GUARD.suspicionDecay * dt, 0, 100);
  }

  if (guard.suspicion >= GUARD.alarmAt && guard.state !== GUARD_STATE.CHASE) {
    guard.state = GUARD_STATE.CHASE;
    guard.chaseTimer = GUARD.chaseSeconds;
    guard.alerted = true;
    events.push({ type: 'alarm', guard });
  }
  if (guard.state === GUARD_STATE.CHASE) {
    guard.chaseTimer -= dt;
    if (guard.chaseTimer <= 0 && !seen) {
      guard.state = GUARD_STATE.PATROL;
      guard.alerted = false;
    }
  }

  if (guard.state === GUARD_STATE.CHASE) {
    chasePlayer(guard, level, player, dt, speedBoost);
  } else {
    patrolStep(guard, level, dt, speedBoost);
  }

  // Footstep tick: the louder (closer) the guard, the more often it steps.
  guard.footstepTimer -= dt;
  const d = distance(guard.x, guard.y, player.x, player.y);
  const stepGap = 0.35 + d / 900;
  if (guard.footstepTimer <= 0) {
    guard.footstepTimer = stepGap;
    events.push({ type: 'footstep', distance: d });
  }

  // Caught: a chasing guard that touches Riko costs a strike.
  if (guard.state === GUARD_STATE.CHASE && d < GUARD.catchRange + 6) {
    events.push({ type: 'caught', guard });
  }
  return events;
}

/** Can this guard see the player right now (cone + line of sight + light)? */
export function canSeePlayer(guard, level, player) {
  if (player.hidden) return false;
  const d = distance(guard.x, guard.y, player.x, player.y);
  const range = inLight(level, player.x, player.y) ? GUARD.visionRange : GUARD.darkVisionRange;
  const sneakRange = player.sneaking ? range * GUARD.sneakVisionFactor : range;
  if (d > sneakRange) return false;
  const toPlayer = angleTo(guard.x, guard.y, player.x, player.y);
  const facing = guard.state === GUARD_STATE.CHASE ? toPlayer : guard.angle;
  if (Math.abs(angleDifference(facing, toPlayer)) > GUARD.visionHalfAngle) return false;
  if (sightBlocked(level, guard.x, guard.y, player.x, player.y)) return false;
  return true;
}

/** Near miss: a cone sweeps just past Riko without seeing him — a warning spike. */
export function nearMiss(guard, level, player) {
  if (player.hidden) return false;
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (d > GUARD.visionRange + GAME.nearMissRange || d < 10) return false;
  if (canSeePlayer(guard, level, player)) return false;
  const toPlayer = angleTo(guard.x, guard.y, player.x, player.y);
  const gap = Math.abs(angleDifference(guard.angle, toPlayer)) - GUARD.visionHalfAngle;
  return gap > 0 && gap < 0.35 && !sightBlocked(level, guard.x, guard.y, player.x, player.y);
}

function patrolStep(guard, level, dt, speedBoost) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.route[guard.waypoint];
  const d = distance(guard.x, guard.y, target.x, target.y);
  const speed = guard.speed * speedBoost;
  if (d < 6) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.pauseTimer = 0.9; // guards pause and look around at each corner
    return;
  }
  const step = Math.min(d, speed * dt);
  const nx = guard.x + ((target.x - guard.x) / d) * step;
  const ny = guard.y + ((target.y - guard.y) / d) * step;
  guard.angle = angleTo(guard.x, guard.y, target.x, target.y);
  if (!hitsWall(level, nx, ny, GUARD.radius)) {
    guard.x = nx;
    guard.y = ny;
  }
}

function chasePlayer(guard, level, player, dt, speedBoost) {
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (d < 1) return;
  const speed = GUARD.chaseSpeed * speedBoost;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + ((player.x - guard.x) / d) * step;
  const ny = guard.y + ((player.y - guard.y) / d) * step;
  guard.angle = angleTo(guard.x, guard.y, player.x, player.y);
  if (!hitsWall(level, nx, ny, GUARD.radius)) {
    guard.x = nx;
    guard.y = ny;
  } else if (!hitsWall(level, nx, guard.y, GUARD.radius)) {
    guard.x = nx;
  } else if (!hitsWall(level, guard.x, ny, GUARD.radius)) {
    guard.y = ny;
  }
}

/** Reset every guard to its patrol start after Riko is caught. */
export function resetGuards(guards) {
  for (const guard of guards) {
    guard.x = guard.route[0].x;
    guard.y = guard.route[0].y;
    guard.waypoint = 0;
    guard.angle = 0;
    guard.state = GUARD_STATE.PATROL;
    guard.suspicion = 0;
    guard.chaseTimer = 0;
    guard.alerted = false;
  }
}
