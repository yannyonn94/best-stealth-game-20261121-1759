// BATIK HEIST — the game loop. Owns the state machine (title / play / win /
// over), steps the world once per frame, and wires input, guards, player,
// audio and rendering together. The ?shot= parameter stages a deterministic
// screenshot scene instead of starting the title screen.
import { CANVAS, FIELD, GAME, STEP, distance } from './config.js';
import { buildLevel } from './level.js';
import { makeGuard, updateGuard, resetGuards, nearMiss } from './guards.js';
import { makePlayer, updatePlayer, updateSteal, respawnPlayer } from './player.js';
import { makeInput, clearEdges } from './input.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';
import {
  unlockAudio, playFootstep, playPickup, playNearMiss, playTotem, playHide,
  startAlarm, stopAlarm, playCaught, playWin, playLose,
} from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;
const ctx = canvas.getContext('2d');
const input = makeInput(canvas);
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;

function newState() {
  const level = buildLevel(seed);
  return {
    level,
    guards: level.patrols.map((route, i) => makeGuard(i, route)),
    player: makePlayer(level.spawn),
    screen: SCREEN_TITLE,
    scrolls: 0,
    timeLeft: GAME.dawnSeconds,
    strikes: 0,
    toast: '',
    toastTimer: 0,
    nearMissCooldown: 0,
    wasHidden: false,
    won: false,
  };
}

const state = newState();
let shotMode = false;
if (params.has('shot')) {
  shotMode = true;
  const staged = stageShot(params.get('shot'), state);
  state.screen = staged.screen;
  // Freeze the staged frame: screenshots render one fixed moment.
  render(ctx, state);
} else {
  requestAnimationFrame(frame);
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += dt;
  while (accumulator >= STEP) {
    step(STEP);
    accumulator -= STEP;
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}

function step(dt) {
  if (state.toastTimer > 0) state.toastTimer -= dt;
  if (state.nearMissCooldown > 0) state.nearMissCooldown -= dt;

  if (state.screen === SCREEN_TITLE) {
    // The museum idles behind the title: guards walk their routes.
    for (const guard of state.guards) {
      updateGuard(guard, state.level, state.player, dt, 0);
    }
    if (input.startPressed || input.interact) startGame();
    clearEdges(input);
    return;
  }

  if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) {
    if (input.restartPressed) restart();
    clearEdges(input);
    return;
  }

  // --- Playing ---
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    loseGame('The dawn bell rings — the museum wakes and Riko is caught in the light.');
    clearEdges(input);
    return;
  }

  updatePlayer(state.player, state.level, input, dt);
  if (state.player.hidden && !state.wasHidden) playHide();
  state.wasHidden = state.player.hidden;
  const stolen = updateSteal(state.player, state.level, input, dt);
  if (stolen === 'case') {
    state.scrolls += 1;
    playPickup();
    setToast(`Scroll ${state.scrolls} of ${GAME.totalScrolls} stolen — the guards quicken!`);
  } else if (stolen === 'captain') {
    state.scrolls += 1;
    playPickup();
    setToast('The captain’s pocket scroll! All 7 — run for the skylight!');
  }

  // Alarm totems: crossing a totem ring while not sneaking trips it.
  for (const totem of state.level.totems) {
    if (totem.cooldown > 0) totem.cooldown -= dt;
    const d = distance(state.player.x, state.player.y, totem.x, totem.y);
    if (d < totem.r && !state.player.sneaking && !state.player.hidden && totem.cooldown <= 0) {
      totem.triggered = true;
      totem.cooldown = 4;
      playTotem();
      raiseAllSuspicion(GAME.totemSpike);
      setToast('Alarm totem tripped! The guards are on edge.');
    }
    if (totem.cooldown <= 0) totem.triggered = false;
  }

  // Guards: patrol, suspicion, chase, footsteps, catches.
  let anyChasing = false;
  for (const guard of state.guards) {
    const events = updateGuard(guard, state.level, state.player, dt, state.scrolls);
    for (const event of events) {
      if (event.type === 'footstep') playFootstep(event.distance);
      if (event.type === 'alarm') {
        startAlarm();
        setToast('Spotted! Break line of sight and hide!');
      }
      if (event.type === 'caught') {
        onCaught();
        clearEdges(input);
        return;
      }
    }
    if (guard.state === 'chase') anyChasing = true;
  }
  if (!anyChasing) stopAlarm();

  // Near miss: a cone sweeps just past Riko — a warning spike, once a while.
  if (state.nearMissCooldown <= 0) {
    for (const guard of state.guards) {
      if (nearMiss(guard, state.level, state.player)) {
        playNearMiss();
        raiseAllSuspicion(GAME.nearMissSpike);
        setToast('So close — a guard nearly saw you!');
        state.nearMissCooldown = 3;
        break;
      }
    }
  }

  // Win: all 7 scrolls and Riko reaches the skylight.
  const exit = state.level.exit;
  const p = state.player;
  if (state.scrolls >= GAME.totalScrolls
    && p.x > exit.x - 10 && p.x < exit.x + exit.w + 10
    && p.y > exit.y - 10 && p.y < exit.y + exit.h + 10) {
    winGame();
  }

  if (input.restartPressed) restart();
  clearEdges(input);
}

function raiseAllSuspicion(amount) {
  for (const guard of state.guards) {
    guard.suspicion = Math.min(100, guard.suspicion + amount);
  }
}

function setToast(text) {
  state.toast = text;
  state.toastTimer = 3;
}

function startGame() {
  unlockAudio();
  state.screen = SCREEN_PLAY;
}

function restart() {
  const fresh = newState();
  Object.assign(state, fresh);
  state.screen = SCREEN_PLAY;
  unlockAudio();
}

function onCaught() {
  state.strikes += 1;
  playCaught();
  stopAlarm();
  if (state.strikes >= GAME.strikesToLose) {
    loseGame('Three strikes — the guards drag Riko out as the museum wakes.');
  } else {
    respawnPlayer(state.player, state.level.spawn);
    resetGuards(state.guards);
    setToast(`Caught! Strike ${state.strikes} of ${GAME.strikesToLose} — back to the entrance.`);
  }
}

function winGame() {
  state.screen = SCREEN_WIN;
  state.won = true;
  stopAlarm();
  playWin();
}

function loseGame(message) {
  state.screen = SCREEN_OVER;
  state.toast = message;
  stopAlarm();
  playLose();
}

// Clicking the title screen also starts the game (mouse players).
canvas.addEventListener('pointerdown', () => {
  unlockAudio();
  if (state.screen === SCREEN_TITLE && !shotMode) startGame();
});

// Expose the state for debugging and for the screenshot harness.
window.__batikHeist = { state, input };
