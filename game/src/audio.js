// BATIK HEIST — sound, synthesised live with WebAudio oscillators. No audio
// files, no network: footsteps thump from the nearest guard, a chime marks a
// stolen scroll, a low alarm drones while a guard chases, and a short
// pentatonic run plays on the win. Created lazily on the first user gesture,
// so browsers allow it.
let ctx = null;
let alarmNodes = null;

function audioContext() {
  if (ctx) return ctx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  ctx = new AudioContextClass();
  return ctx;
}

/** Call from any keydown / click so the context is allowed to start. */
export function unlockAudio() {
  const ac = audioContext();
  if (ac && ac.state === 'suspended') ac.resume();
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ac = audioContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

/** A guard footstep: a low thump, quieter the further the guard is. */
export function playFootstep(distance) {
  const volume = Math.max(0.02, 0.22 - distance / 1400);
  tone(72, 0.09, 'sine', volume);
  tone(48, 0.12, 'triangle', volume * 0.7);
}

/** Hiding in a vat: a soft splash as Riko ducks under the indigo dye. */
export function playHide() {
  tone(320, 0.18, 'sine', 0.1);
  tone(210, 0.22, 'sine', 0.08, 0.06);
}

/** A stolen scroll: a bright two-note chime. */
export function playPickup() {
  tone(660, 0.16, 'sine', 0.16);
  tone(990, 0.24, 'sine', 0.14, 0.09);
}

/** A near miss: a short warning tick. */
export function playNearMiss() {
  tone(220, 0.08, 'square', 0.06);
}

/** A totem trip: a harsh buzz. */
export function playTotem() {
  tone(180, 0.22, 'sawtooth', 0.12);
  tone(135, 0.26, 'sawtooth', 0.1, 0.05);
}

/** Start the low alarm drone while any guard is chasing. */
export function startAlarm() {
  const ac = audioContext();
  if (!ac || alarmNodes) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 110;
  lfo.type = 'sine';
  lfo.frequency.value = 2.2;
  lfoGain.gain.value = 40;
  gain.gain.value = 0.045;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  lfo.start();
  alarmNodes = { osc, gain, lfo };
}

/** Stop the alarm drone. */
export function stopAlarm() {
  if (!alarmNodes) return;
  try {
    alarmNodes.osc.stop();
    alarmNodes.lfo.stop();
  } catch (err) { /* already stopped */ }
  alarmNodes = null;
}

/** Caught: a descending sting. */
export function playCaught() {
  stopAlarm();
  tone(330, 0.2, 'sawtooth', 0.14);
  tone(220, 0.3, 'sawtooth', 0.14, 0.16);
  tone(147, 0.4, 'sawtooth', 0.14, 0.32);
}

/** Win: a short pentatonic climb on the gamelan scale. */
export function playWin() {
  const notes = [523, 587, 659, 784, 880, 1047];
  notes.forEach((freq, i) => tone(freq, 0.3, 'triangle', 0.14, i * 0.11));
}

/** Lose: the dawn bell, low and slow. */
export function playLose() {
  tone(196, 0.9, 'sine', 0.18);
  tone(98, 1.2, 'sine', 0.14, 0.15);
}
