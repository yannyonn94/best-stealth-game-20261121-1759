# BATIK HEIST

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/yannyonn94/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/yannyonn94/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are **Riko**, a cat-burglar in the midnight Batik Museum. Steal **7 batik scrolls** — 6 in glass cases, the 7th in the sleeping guard captain's pocket — then slip out through the skylight before the **180-second dawn bell**.

## The heist

- **5 patrolling guards** with vision cones and patrol routes you can learn. Their suspicion meter rises when they see you and cools down when you break line of sight — duck behind a plinth or hide and you get a second chance.
- **12 indigo dye vats** to hide in (press `H` while standing in one). While hidden, guards cannot see you and suspicion drains fast.
- **3 alarm totems** — cross their rings while walking upright and suspicion spikes across every guard.
- **Near misses**: a cone sweeping just past you raises the alarm a little, so close calls feel close.
- **Light and shadow**: lit floor is dangerous (guards see far), dark floor is safe (their vision halves). Sneaking is slower but shrinks their vision further.
- **Escalation**: every scroll stolen makes the guards 8% faster. Get caught 3 times and the heist is over.
- **Sound, synthesised live** (WebAudio oscillators, no audio files): guard footsteps that tell you how close they are, a chime for each stolen scroll, an alarm drone while chased, and a gamelan-scale win run.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slower, harder to see) |
| E or click | Steal / pickpocket (hold still near a case or the captain) |
| H or Space | Hide in a dye vat |
| R | Restart |
| Enter | Start |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files and plays offline in desktop Chrome.

## Screenshots

Deterministic staged scenes, rendered by the game's own code (same URL, same frame every time):

- `?shot=cover&seed=1` — Riko threading two vision cones mid-heist
- `?shot=patrol&seed=1` — guards crossing their patrol routes
- `?shot=hide&seed=1` — hidden in a dye vat as a cone sweeps past
- `?shot=escape&seed=1` — all 7 scrolls, sprinting for the open skylight

## Layout

- `game/index.html` — the page, canvas only
- `game/src/config.js` — tuning, palette, helpers
- `game/src/level.js` — the museum: walls, cases, vats, totems, exit, patrols
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/player.js` — Riko: move, sneak, hide, steal, pickpocket
- `game/src/render.js` — canvas drawing: floor, cones, lighting, HUD, screens
- `game/src/audio.js` — WebAudio synth: footsteps, chimes, alarm, win
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — the four deterministic screenshot scenes
- `game/src/main.js` — the game loop and state machine
- `main.ts` — the make.fun entry program (Node 22, stdlib only)

MIT licensed. Built for the make.fun best stealth game bounty.
