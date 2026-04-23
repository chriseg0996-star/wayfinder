# Phase 1 — movement tuning notes (Wayfinder / Wardenfall)

## What changed (summary)

- **Ground:** Ramped to max speed with acceleration + faster turnaround; stop uses decel (not instant `vx = 0`).
- **Air:** Ramped toward max air speed; with no input, **air drag** decays `vx` (momentum) instead of instant stop.
- **Jump arc:** Rise/fall use **separate gravity multipliers** on the player only (see `Physics.js` + `JUMP_RISE/FALL_GRAVITY_MULT`). Variable hop applies **once per jump** on key release (fixes the old per-frame multiplicative cut).
- **Buffering:** Dodge uses `DODGE_BUFFER_TIME` like jump; a press while on cooldown or in attack can still fire when valid.
- **Tuning surface:** New values live in `Constants.js` under player movement, jump, and dodge.

## Key constants (where to turn dials)

| Group | Knobs | Effect |
|--------|--------|--------|
| Ground | `PLAYER_SPEED`, `PLAYER_GROUND_ACCEL`, `PLAYER_GROUND_TURN_MULT`, `PLAYER_GROUND_DECEL` | Top speed, how fast you hit it, how snappy direction changes are, how fast you stop |
| Air | `AIR_CONTROL`, `PLAYER_AIR_ACCEL`, `PLAYER_AIR_TURN_MULT`, `PLAYER_AIR_DRAG` | Max air speed, strafe responsiveness, reverse in air, coast when releasing keys |
| Jump | `JUMP_FORCE`, `JUMP_CUT_MULTIPLIER`, `JUMP_RISE_GRAVITY_MULT`, `JUMP_FALL_GRAVITY_MULT` | Height, short-hop strength, float vs snappy fall |
| Assist | `COYOTE_TIME`, `JUMP_BUFFER_TIME` | Ledge forgiveness, input buffer |
| Dodge | `DODGE_BUFFER_TIME`, `DODGE_SPEED`, `DODGE_DURATION`, `DODGE_COOLDOWN` | Input forgiveness, travel, commitment, pacing |

## Playtest checklist

- [ ] **Ground:** Tap left/right — no overshoot; feels controllable.
- [ ] **Ground:** Reverse direction — snappy, not slidy.
- [ ] **Release keys on ground** — comes to a stop without ice-skating.
- [ ] **Air strafe** — can correct line without “brick” or infinite slide.
- [ ] **Release in air** — some horizontal carry, not dead stop.
- [ ] **Full jump hold** — reaches expected height; **release early** — short hop, one clear cut.
- [ ] **Run off ledge** + jump within coyote — consistent.
- [ ] **Jump buffer** before land — chain feels fair (buffer time not too long).
- [ ] **Dodge** on press — immediate; **dodge after attack** with buffered input — fires when attack ends.
- [ ] **Dodge** during cooldown — no accidental double; buffer doesn’t break cadence.
- [ ] **Hitstop** — still readable (unchanged, quick regression).

## What we did not change

- Combat numbers (damage, hitstop, combo windows), `Enemy.js`, `UI.js`, `Render.js` (except physics gravity path), `Game.js` loop, `Input.js` bindings, level data.
