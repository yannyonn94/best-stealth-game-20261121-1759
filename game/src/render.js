// BATIK HEIST — everything the player sees. Top-down canvas in indigo and
// gold: a batik-patterned floor, glass cases, indigo dye vats, alarm totems,
// the skylight exit, guards with yellow vision cones, and a darkness overlay
// that shows which floor is lit (dangerous) and which is dark (safe). The HUD
// and the title / win / lose screens are drawn here too, so a screenshot
// always shows the whole game state at a glance.
import { CANVAS, FIELD, PALETTE, GUARD, GAME } from './config.js';
import { GUARD_STATE } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** Draw the whole frame for the current screen and game state. */
export function render(ctx, state) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = '#070a1c';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state);
    return;
  }
  drawMuseum(ctx, state);
  drawExit(ctx, state);
  drawCases(ctx, state);
  drawVats(ctx, state);
  drawTotems(ctx, state);
  drawCaptain(ctx, state);
  drawLighting(ctx, state);
  // Guards and Riko are drawn after the darkness, so their vision cones stay
  // bright yellow and both are readable against the dark floor.
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  drawHud(ctx, state);
  if (state.screen === SCREEN_WIN) drawWin(ctx, state);
  if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  drawToast(ctx, state);
}

function drawMuseum(ctx, state) {
  const level = state.level;
  // Floor: alternating indigo tiles.
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 15; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      ctx.fillRect(FIELD.x + tx * 80, FIELD.y + ty * 83, 80, 83);
    }
  }
  // Batik motifs: small gold flowers stamped across the floor.
  ctx.strokeStyle = 'rgba(232, 185, 60, 0.28)';
  ctx.lineWidth = 1.5;
  for (const m of level.motifs) {
    drawMotif(ctx, m.x, m.y, m.r, m.petals);
  }
  // Lit pools: warm lamplight on the floor (guards see further here).
  for (const pool of level.lightPools) {
    const g = ctx.createRadialGradient(pool.x, pool.y, 10, pool.x, pool.y, pool.r);
    g.addColorStop(0, 'rgba(255, 220, 130, 0.20)');
    g.addColorStop(1, 'rgba(255, 220, 130, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Field border.
  ctx.strokeStyle = PALETTE.wallTop;
  ctx.lineWidth = 4;
  ctx.strokeRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);
  // Walls / display plinths (cover).
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 5);
  }
}

function drawMotif(ctx, x, y, r, petals) {
  ctx.beginPath();
  for (let i = 0; i < petals; i += 1) {
    const a = (i / petals) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    ctx.moveTo(x, y);
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();
}

function drawExit(ctx, state) {
  const e = state.level.exit;
  const open = state.scrolls >= GAME.totalScrolls;
  ctx.save();
  ctx.fillStyle = open ? PALETTE.exit : '#5a5326';
  ctx.globalAlpha = open ? 0.95 : 0.7;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? '#3a2f00' : '#d8c98a';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT OPEN' : 'SKYLIGHT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (open) {
    // Sunbeams through the open skylight.
    ctx.strokeStyle = 'rgba(255, 233, 163, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x + 8, e.y + e.h);
    ctx.lineTo(e.x - 30, e.y + e.h + 90);
    ctx.moveTo(e.x + e.w - 8, e.y + e.h);
    ctx.lineTo(e.x + e.w + 30, e.y + e.h + 90);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCases(ctx, state) {
  for (const c of state.level.cases) {
    ctx.save();
    // Glass case: a plinth with a glowing scroll inside.
    ctx.fillStyle = '#2c3a6e';
    ctx.fillRect(c.x - 26, c.y - 18, 52, 36);
    ctx.strokeStyle = PALETTE.glass;
    ctx.lineWidth = 2;
    ctx.globalAlpha = c.scrollTaken ? 0.25 : 0.85;
    ctx.strokeRect(c.x - 26, c.y - 18, 52, 36);
    ctx.globalAlpha = 1;
    if (!c.scrollTaken) {
      ctx.fillStyle = PALETTE.scroll;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 13, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6d2f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y - 2);
      ctx.lineTo(c.x + 8, c.y - 2);
      ctx.moveTo(c.x - 8, c.y + 2);
      ctx.lineTo(c.x + 8, c.y + 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('empty', c.x, c.y + 4);
    }
    // Steal progress ring while Riko works the case.
    if (c.stealProgress > 0 && c.stealProgress < 1) {
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 30, -Math.PI / 2, -Math.PI / 2 + c.stealProgress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawVats(ctx, state) {
  for (const vat of state.level.vats) {
    ctx.save();
    ctx.fillStyle = '#0f1c44';
    ctx.beginPath();
    ctx.arc(vat.x, vat.y, vat.r + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.vat;
    ctx.beginPath();
    ctx.arc(vat.x, vat.y, vat.r, 0, Math.PI * 2);
    ctx.fill();
    // Dye ripples.
    ctx.strokeStyle = 'rgba(127, 179, 232, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(vat.x, vat.y, vat.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.vatRim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vat.x, vat.y, vat.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#cfe4ff';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE', vat.x, vat.y + vat.r + 14);
    ctx.restore();
  }
}

function drawTotems(ctx, state) {
  for (const t of state.level.totems) {
    ctx.save();
    ctx.globalAlpha = t.triggered ? 1 : 0.85;
    ctx.fillStyle = PALETTE.totem;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff8a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe9e6';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', t.x, t.y + 4);
    ctx.restore();
  }
}

function drawCaptain(ctx, state) {
  const c = state.level.captain;
  ctx.save();
  // Sleeping captain: slumped figure with "Zzz" and a gold pocket scroll.
  ctx.fillStyle = '#3a4a9a';
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e3b3';
  ctx.beginPath();
  ctx.arc(c.x - 5, c.y - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a86c9';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('Z', c.x + 16, c.y - 16);
  ctx.fillText('z', c.x + 26, c.y - 26);
  ctx.fillText('z', c.x + 34, c.y - 34);
  if (!c.pocketTaken) {
    ctx.fillStyle = PALETTE.goldBright;
    ctx.beginPath();
    ctx.arc(c.x + 8, c.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2f00';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('7', c.x + 8, c.y + 11);
  }
  if (c.stealProgress > 0 && c.stealProgress < 1) {
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius + 10, -Math.PI / 2, -Math.PI / 2 + c.stealProgress * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    const alert = guard.state === GUARD_STATE.CHASE || guard.suspicion > 60;
    // Vision cone.
    const range = guard.state === GUARD_STATE.CHASE ? GUARD.visionRange + 40 : GUARD.visionRange;
    ctx.save();
    ctx.fillStyle = alert ? PALETTE.coneAlert : PALETTE.cone;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.angle - GUARD.visionHalfAngle, guard.angle + GUARD.visionHalfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Body: a night-blue guard with a gold sash and a facing tick.
    ctx.save();
    ctx.fillStyle = alert ? PALETTE.guardAlert : PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#e8eefc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 6), guard.y + Math.sin(guard.angle) * (GUARD.radius + 6));
    ctx.stroke();
    // Suspicion meter above the head.
    if (guard.suspicion > 2) {
      const w = 34;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(guard.x - w / 2, guard.y - GUARD.radius - 14, w, 6);
      ctx.fillStyle = guard.suspicion > 60 ? '#ff523c' : PALETTE.goldBright;
      ctx.fillRect(guard.x - w / 2, guard.y - GUARD.radius - 14, (w * guard.suspicion) / 100, 6);
      if (guard.suspicion > 60) {
        ctx.fillStyle = '#ff523c';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - GUARD.radius - 18);
      }
    }
    ctx.restore();
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  if (p.hidden) {
    // Hidden in a vat: only a ripple and a small "hidden" tag show.
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 185, 60, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - p.radius - 12);
    ctx.restore();
    return;
  }
  ctx.save();
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x + 3, p.y + 5, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Riko: a gold cat-burglar with a dark hood.
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2a5e';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 2, p.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Eyes and facing tick.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 5 - Math.sin(p.facing) * 3, p.y + Math.sin(p.facing) * 5 + Math.cos(p.facing) * 3, 2, 0, Math.PI * 2);
  ctx.arc(p.x + Math.cos(p.facing) * 5 + Math.sin(p.facing) * 3, p.y + Math.sin(p.facing) * 5 - Math.cos(p.facing) * 3, 2, 0, Math.PI * 2);
  ctx.fill();
  // Sneak: a crouch ring.
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(232, 185, 60, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

let lightCanvas = null;
let lightCtx = null;

function drawLighting(ctx, state) {
  // Darkness over the whole hall, punched out around Riko, the exit and the
  // lit pools — the dark floor is where a thief is safe. The dark layer is
  // painted on an offscreen canvas first: punching holes with
  // destination-out on the main canvas would erase the museum underneath.
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.width = CANVAS.width;
    lightCanvas.height = CANVAS.height;
    lightCtx = lightCanvas.getContext('2d');
  }
  lightCtx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  lightCtx.fillStyle = PALETTE.dark;
  lightCtx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);
  lightCtx.globalCompositeOperation = 'destination-out';
  const p = state.player;
  punchHole(lightCtx, p.x, p.y, 130);
  punchHole(lightCtx, state.level.exit.x + 33, state.level.exit.y + 26, 90);
  for (const pool of state.level.lightPools) punchHole(lightCtx, pool.x, pool.y, pool.r);
  lightCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);
}

function punchHole(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, r * 0.25, x, y, r);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, state) {
  ctx.save();
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, CANVAS.width, 84);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('BATIK HEIST', 40, 36);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Midnight at the Batik Museum — steal 7 scrolls, reach the skylight unseen.', 40, 60);

  // Scrolls.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Scrolls  ${state.scrolls} / ${GAME.totalScrolls}`, 700, 38);
  // Timer.
  const t = Math.max(0, Math.ceil(state.timeLeft));
  const mm = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, '0');
  ctx.fillStyle = t <= 30 ? '#ff6b5a' : PALETTE.text;
  ctx.fillText(`Dawn bell  ${mm}:${ss}`, 700, 64);
  // Suspicion: the highest guard suspicion.
  const susp = Math.max(0, ...state.guards.map((g) => g.suspicion));
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Suspicion', 760, 30);
  ctx.fillStyle = '#1c2a5e';
  ctx.fillRect(760, 38, 180, 12);
  ctx.fillStyle = susp > 60 ? '#ff523c' : PALETTE.goldBright;
  ctx.fillRect(760, 38, (180 * susp) / 100, 12);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1;
  ctx.strokeRect(760, 38, 180, 12);
  // Strikes: three lanterns, lit ones lost.
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Strikes', 980, 30);
  for (let i = 0; i < GAME.strikesToLose; i += 1) {
    ctx.fillStyle = i < state.strikes ? '#3a2f00' : '#ff9d3c';
    ctx.beginPath();
    ctx.arc(995 + i * 30, 44, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move · Shift sneak · E / click steal · H hide in a vat · R restart', 40, 78);
  ctx.restore();
}

function drawToast(ctx, state) {
  if (!state.toast || state.toastTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.toastTimer);
  ctx.font = 'bold 18px Georgia, serif';
  const w = ctx.measureText(state.toast).width + 40;
  ctx.fillStyle = 'rgba(13, 19, 48, 0.92)';
  ctx.fillRect((CANVAS.width - w) / 2, 100, w, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect((CANVAS.width - w) / 2, 100, w, 40);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.textAlign = 'center';
  ctx.fillText(state.toast, CANVAS.width / 2, 126);
  ctx.restore();
}

function drawTitle(ctx, state) {
  // The museum at night behind the title, guards mid-patrol.
  drawMuseum(ctx, state);
  drawExit(ctx, state);
  drawCases(ctx, state);
  drawVats(ctx, state);
  drawTotems(ctx, state);
  drawCaptain(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 28, 0.72)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('BATIK HEIST', CANVAS.width / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px Georgia, serif';
  ctx.fillText('You are Riko, cat-burglar of the midnight Batik Museum.', CANVAS.width / 2, 300);
  ctx.fillText('Steal 7 batik scrolls — 6 in glass cases, the 7th in the sleeping', CANVAS.width / 2, 336);
  ctx.fillText('guard captain’s pocket — then slip out through the skylight before the dawn bell.', CANVAS.width / 2, 370);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Dodge 5 patrolling guards · hide in 12 indigo dye vats · avoid 3 alarm totems', CANVAS.width / 2, 430);
  ctx.fillText('Every scroll makes the guards faster. 3 strikes and you are caught.', CANVAS.width / 2, 462);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin the heist', CANVAS.width / 2, 540);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '17px Georgia, serif';
  ctx.fillText('WASD / arrows move · Shift sneak · E or click steal · H hide · R restart', CANVAS.width / 2, 580);
  ctx.restore();
}

function drawWin(ctx, state) {
  overlay(ctx, 'THE HEIST IS DONE', `All 7 scrolls stolen in ${Math.round(GAME.dawnSeconds - state.timeLeft)} seconds — Riko vanishes through the skylight as the dawn bell rings.`, 'Press R to steal again');
}

function drawOver(ctx, state) {
  overlay(ctx, 'CAUGHT!', 'Three strikes — the guards drag Riko out as the museum wakes.', 'Press R to try again');
}

function overlay(ctx, title, line, hint) {
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 28, 0.78)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(title, CANVAS.width / 2, 340);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px Georgia, serif';
  ctx.fillText(line, CANVAS.width / 2, 400);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '20px Georgia, serif';
  ctx.fillText(hint, CANVAS.width / 2, 460);
  ctx.restore();
}
