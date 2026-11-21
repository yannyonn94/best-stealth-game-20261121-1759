// BATIK HEIST — the four screenshot scenes behind ?shot=cover|patrol|hide|escape.
// Each scene sets the real game state to a fixed, hand-placed moment (no
// randomness, no simulation drift), then the game draws it with its normal
// renderer, so every screenshot is a real render of the game's own code and
// the same URL always gives the same frame.
import { SCREEN_PLAY } from './render.js';

/**
 * Stage the named scene on `state` (cover, patrol, hide or escape; anything
 * else is cover) and return the screen to draw.
 */
export function stageShot(name, state) {
  const level = state.level;
  // Reset the world to a clean heist, then place the scene.
  for (const c of level.cases) {
    c.scrollTaken = false;
    c.stealProgress = 0;
  }
  level.captain.pocketTaken = false;
  level.captain.stealProgress = 0;
  for (const t of level.totems) {
    t.triggered = false;
    t.cooldown = 0;
  }
  for (const guard of state.guards) {
    guard.suspicion = 0;
    guard.state = 'patrol';
    guard.alerted = false;
    guard.chaseTimer = 0;
  }
  state.strikes = 0;
  state.toast = '';
  state.toastTimer = 0;
  state.player.hidden = false;
  state.player.hiddenVat = null;
  state.player.stealing = null;
  state.player.stealProgress = 0;
  state.player.sneaking = false;

  if (name === 'patrol') {
    // Riko hugging the south wall, watching two guards cross their routes.
    state.scrolls = 1;
    level.cases[0].scrollTaken = true;
    state.timeLeft = 150;
    state.player.x = 250;
    state.player.y = 620;
    state.player.facing = Math.PI / 4;
    placeGuard(state.guards[0], 420, 300, Math.PI / 2, 18);
    placeGuard(state.guards[1], 900, 300, -Math.PI / 2, 0);
    placeGuard(state.guards[2], 300, 500, 0, 0);
    placeGuard(state.guards[3], 950, 500, Math.PI, 0);
    placeGuard(state.guards[4], 640, 200, Math.PI / 2, 0);
    state.toast = 'Scroll 1 of 7 — stay out of the cones';
    state.toastTimer = 99;
  } else if (name === 'hide') {
    // Riko ducked inside a dye vat while a guard's cone sweeps past the rim.
    state.scrolls = 3;
    level.cases[0].scrollTaken = true;
    level.cases[1].scrollTaken = true;
    level.cases[2].scrollTaken = true;
    state.timeLeft = 110;
    const vat = level.vats[3];
    state.player.x = vat.x;
    state.player.y = vat.y;
    state.player.hidden = true;
    state.player.hiddenVat = vat;
    placeGuard(state.guards[0], vat.x + 150, vat.y - 60, Math.PI, 42);
    placeGuard(state.guards[1], 900, 320, Math.PI / 2, 12);
    placeGuard(state.guards[2], 300, 520, 0, 0);
    placeGuard(state.guards[3], 980, 540, -Math.PI / 2, 0);
    placeGuard(state.guards[4], 640, 180, 0, 0);
    state.toast = 'Hidden in the dye vat — suspicion cooling down';
    state.toastTimer = 99;
  } else if (name === 'escape') {
    // All 7 scrolls stolen, the skylight open, Riko sprinting for the exit
    // with the dawn bell almost rung and a guard closing in.
    state.scrolls = 7;
    for (const c of level.cases) c.scrollTaken = true;
    level.captain.pocketTaken = true;
    state.timeLeft = 12;
    state.player.x = 1030;
    state.player.y = 220;
    state.player.facing = Math.PI / 4;
    placeGuard(state.guards[0], 950, 320, -Math.PI / 4, 88, 'chase');
    placeGuard(state.guards[1], 1130, 400, -Math.PI / 2, 55);
    placeGuard(state.guards[2], 760, 200, 0, 0);
    placeGuard(state.guards[3], 900, 500, Math.PI / 2, 0);
    placeGuard(state.guards[4], 420, 420, Math.PI, 0);
    state.toast = 'All 7 scrolls — run for the skylight!';
    state.toastTimer = 99;
  } else {
    // Cover: the most dynamic mid-heist frame — Riko slipping between two
    // guard vision cones with three scrolls stolen and the exit in sight.
    state.scrolls = 3;
    level.cases[0].scrollTaken = true;
    level.cases[1].scrollTaken = true;
    level.cases[4].scrollTaken = true;
    state.timeLeft = 96;
    state.player.x = 640;
    state.player.y = 380;
    state.player.facing = -Math.PI / 2;
    state.player.sneaking = true;
    placeGuard(state.guards[0], 520, 300, Math.PI / 2, 55);
    placeGuard(state.guards[1], 800, 320, Math.PI / 2, 38);
    placeGuard(state.guards[2], 300, 520, 0, 0);
    placeGuard(state.guards[3], 980, 520, Math.PI, 0);
    placeGuard(state.guards[4], 640, 180, Math.PI, 12);
    state.toast = '3 of 7 scrolls — thread the cones';
    state.toastTimer = 99;
  }
  return { screen: SCREEN_PLAY };
}

function placeGuard(guard, x, y, angle, suspicion, stateName = 'patrol') {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.suspicion = suspicion;
  guard.state = stateName;
  guard.alerted = stateName === 'chase';
  guard.chaseTimer = stateName === 'chase' ? 5 : 0;
}
