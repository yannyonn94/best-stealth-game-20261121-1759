// BATIK HEIST — Riko, the cat-burglar. Movement (walk / sneak), hiding in a
// dye vat, stealing scrolls from glass cases, and pickpocketing the sleeping
// guard captain. Stealing is a channel: Riko must stay close and still for
// the steal to finish, so every scroll is a small risk.
import { PLAYER, GAME, distance, clamp } from './config.js';
import { hitsWall, vatAt } from './level.js';

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: PLAYER.radius,
    sneaking: false,
    hidden: false,
    hiddenVat: null,
    stealing: null, // { kind: 'case' | 'captain', target } while a steal channels
    stealProgress: 0,
    facing: -Math.PI / 2,
    moving: false,
  };
}

/** Move Riko one step from the input vector; returns nothing, mutates player. */
export function updatePlayer(player, level, input, dt) {
  player.sneaking = input.sneak;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const stealing = player.stealing !== null;
  const mx = stealing ? 0 : input.moveX;
  const my = stealing ? 0 : input.moveY;
  const len = Math.hypot(mx, my);
  player.moving = len > 0.01;
  if (player.moving) {
    player.facing = Math.atan2(my, mx);
    const nx = player.x + (mx / len) * speed * dt;
    const ny = player.y + (my / len) * speed * dt;
    if (!hitsWall(level, nx, player.y, player.radius)) player.x = nx;
    if (!hitsWall(level, player.x, ny, player.radius)) player.y = ny;
  }

  // Hiding: standing in a vat and pressing hide (H or Space) ducks Riko under
  // the indigo dye. Moving out of the vat, or being seen while entering, ends it.
  const vat = vatAt(level, player.x, player.y);
  if (input.hidePressed && vat && !player.hidden) {
    player.hidden = true;
    player.hiddenVat = vat;
  }
  if (player.hidden) {
    if (!vat || vat.id !== player.hiddenVat.id) {
      player.hidden = false;
      player.hiddenVat = null;
    }
  }
  return player;
}

/**
 * Try to start (or keep) a steal. Returns 'case' | 'captain' | null for the
 * steal that finished this step, so the game loop can count the scroll.
 */
export function updateSteal(player, level, input, dt) {
  // A click (or E) near a case starts the steal; holding still finishes it.
  let target = null;
  let kind = null;
  if (!level.captain.pocketTaken
    && distance(player.x, player.y, level.captain.x, level.captain.y) < PLAYER.interactRange + 10) {
    target = level.captain;
    kind = 'captain';
  } else {
    for (const c of level.cases) {
      if (!c.scrollTaken && distance(player.x, player.y, c.x, c.y) < PLAYER.interactRange + 14) {
        target = c;
        kind = 'case';
        break;
      }
    }
  }

  const wantsSteal = input.interactHeld;
  if (player.stealing && (!wantsSteal || !target || target !== player.stealing.target || player.moving)) {
    // Let go, moved away, or the target changed: the channel breaks.
    if (player.stealing.target) player.stealing.target.stealProgress = 0;
    player.stealing = null;
    player.stealProgress = 0;
  }
  if (!player.stealing && target && wantsSteal) {
    player.stealing = { kind, target };
    player.stealProgress = 0;
  }
  if (player.stealing) {
    const need = player.stealing.kind === 'captain' ? PLAYER.pickpocketSeconds : PLAYER.stealSeconds;
    player.stealProgress = clamp(player.stealProgress + dt / need, 0, 1);
    player.stealing.target.stealProgress = player.stealProgress;
    if (player.stealProgress >= 1) {
      const done = player.stealing;
      player.stealing = null;
      player.stealProgress = 0;
      if (done.kind === 'case') done.target.scrollTaken = true;
      else level.captain.pocketTaken = true;
      return done.kind;
    }
  }
  return null;
}

/** Send Riko back to the entrance after being caught, keeping stolen scrolls. */
export function respawnPlayer(player, spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
  player.hidden = false;
  player.hiddenVat = null;
  player.stealing = null;
  player.stealProgress = 0;
  player.sneaking = false;
}
