# Wardenfall — Phase 1 execution plan

**Product:** Wardenfall (browser 2D action RPG foundation)  
**Stack:** HTML5 Canvas, vanilla JavaScript, ES modules  
**Active scope:** Phase 1 only — **feel before breadth**  
**Out of scope for this document:** Phases 2–5, multiplayer, MMO-style systems  

**Purpose:** Align the repo with a single, testable vertical slice. This is a **planning and status** document, not a feature backlog for new systems.

---

## 1. Code review vs. Phase 1 roadmap

| Roadmap item | Current status | Files involved | Dependency order | Risk | Recommended action |
|--------------|----------------|----------------|------------------|------|----------------------|
| **Project structure** | **Done** — `src/` split: `config/`, `core/`, `entities/`, `state/`, `systems/`; single entry `main.js` | `index.html`, `src/main.js`, all modules | 1 (foundation) | Low | **Freeze** structure; only add files when a row below forces it. Avoid new top-level `systems` until Phase 1 exit criteria are met. |
| **Fixed timestep loop** | **Done** — accumulator, `FIXED_DT`, max frame cap, `alpha` for render | `src/core/Game.js`, `src/config/Constants.js` | 2 | Low | **Verify** frame cap and hitstop interaction in playtests. Optional later: use `alpha` in `Render.js` for entity interpolation (currently unused — see “Overbuilt / debt”). |
| **Input snapshot pattern** | **Done** — `snapshotWithEdge()` per tick, edges for actions | `src/core/Input.js`, consumed in `src/core/Game.js` | 3 | Low | **Document** in repo that raw `window` listeners stay outside `GameState` (not serializable); that is correct. |
| **Serializable `GameState`** | **Structurally done** — plain object, no methods, no canvas/DOM; **not** validated with round-trip | `src/state/GameState.js` | 4 | Med | **Optional Phase 1 proof:** dev-only `JSON.parse(JSON.stringify(state))` or small `assertSerializable(state)` (strip non-data if you add transient fields). **Do not** add networking. |
| **Player movement** | **Done** — run, air control, coyote, buffer, variable jump height | `src/entities/Player.js`, `src/config/Constants.js` | 5 | Low | **Tune** in `Constants.js` only; avoid new movement states until Phase 1 exit. |
| **Dodge + i-frames** | **Done** | `src/entities/Player.js` | 5b (after base move) | Low | **Playtest** dodge vs slime attack; adjust windows in `Constants.js` only. |
| **Combat: 3-hit combo** | **Done** — combo index, active frames, `clearHitFlags`, hitstop | `src/entities/Player.js`, `src/core/Game.js` | 6 | Low | **Watch** per-swing flags (`_hitThisSwing` on enemies); if bugs appear, **surgical** fix in `Player.js` / `Game.js` only. |
| **Slime enemy basic AI** | **Done** — patrol, chase, telegraph, attack, hurt | `src/entities/Enemy.js` | 7 | Med | **Tune** telegraph/attack numbers; avoid new enemy *types* in Phase 1. |
| **AABB physics + camera** | **Done** — AABB resolution + `integrateEntity`; camera lead, lerp, deadzone, clamp | `src/systems/Physics.js`, `src/core/Camera.js` | 8 | Med | If corner cases hurt feel, **surgical** changes in `Physics.js` (order of platform list, separation) — avoid generalized physics engine. |
| **Minimal UI + debug overlay** | **Mostly done** — HP, combo line, F3 panel (FPS, tick, state, timers) | `src/systems/UI.js` | 9 | Low | **Clarify** F3 can be browser/OS dependent; if needed, add a **second** debug key in `Input.js` (one small change). |
| **Playable test level** | **Partial** — platforms + 3 slimes + wide level; **weak closure** (no clear goal, restart, or end state) | `src/state/GameState.js` (data), `src/systems/Render.js` | 10 | Med | **Close the loop:** minimal “round” — e.g. restart on `R` when dead, or “all slimes cleared” + banner, or simple death overlay. **Small** changes only. |

**Dependency order** is the recommended sequence for *validating* or *finishing* work (1 = first), not a rewrite order — most of 1–9 are already implemented in parallel in code.

---

## 2. Summary: done / partial / missing / overbuilt

### Already done (Phase 1 engineering core)

- Module layout, constants centralization, game loop, input edges, state shape, player + slime vertical slice, combat, camera, AABB, HP UI, debug readout, placeholder art pass sufficient for playtests.

### Partially done

| Area | Why “partial” |
|------|----------------|
| **Serializable state** | Shape is right; no automated check that state stays JSON-safe as you iterate. |
| **Playable test level** | Geometry and enemies exist; **player experience** does not yet “start → play → clear outcome,” which is what “playable” means for a solo dev milestone. |
| **Render / timestep** | `Game._render(alpha)` passes `alpha` into `render()`; **sprite positions do not use interpolation** — acceptable for Phase 1; optional polish, not a missing system. |

### Missing (for Phase 1 *exit*, not for “code exists”)

- A **defined player loop** for the test build: e.g. restart, simple win condition, or explicit “prototype ends here” screen (pick **one** minimal path).
- Optional: **one** serialization smoke test or assertion so “serializable” does not regress silently.
- Production hygiene: **no** `README` requirement in this plan unless you add it for collaborators — not blocking Phase 1.

### Overbuilt or freeze for Phase 1

- **Do not** add abstractions for Phase 2+ (e.g. network transport, entity replication) — existing comments in `Input.js` / `GameState.js` are **documentation only**; keep them, do not build toward them yet.
- **Do not** add new enemy types, biomes, inventory, save slots, or procedural gen under Phase 1.
- **Freeze** scope creep in `Render.js` (e.g. avoid full animation system); cosmetic juice that does not change mechanics is fine if it stays **local** to draw helpers.

---

## 3. Practical implementation order (Phase 1 only)

Use this order to **finish and lock** the slice, not to rebuild from zero.

1. **Playtest the current build** and list **3–5 feel issues** (numbers only in `Constants.js` where possible).
2. **Close the playable loop** — smallest UI/state addition that gives: death or victory or restart (one path).
3. **Harden edge cases** that break feel: stuck in hurt, double-hit, input eat during hitstop (only if observed).
4. **Debug UX:** confirm F3 or add alternate toggle (tiny `Input` change).
5. **Optional:** `assertSerializable` or dev `JSON` round-trip on hot reload.
6. **Tag / branch** “phase-1-complete” when Definition of done is met; **stop** feature work until Phase 2 plan exists.

**Do not** parallelize new systems; finish the loop and tuning first.

---

## 4. Do next now

- **Run focused playtests** (10–15 min) on keyboard: movement, jump, dodge vs slime, full combo, death when HP = 0.
- **Decide the single “loop closer”** (restart key, or “enemies cleared” message, or both if ≤1h work).
- **Tune** `Constants.js` for the top feel complaints — **no** new files unless the loop closer requires a tiny `src/ui/` helper (prefer extending `UI.js` + `GameState`).

## 5. Freeze for later (not Phase 1)

- Phases 2–5, multiplayer, MMO, dedicated servers, or “engine” refactors.
- New enemy types, biomes, quests, narrative, meta-progression, audio pipeline (unless a single SFX hook is already trivial for you).
- General asset pipeline, build tooling (Vite, etc.) — only if current static ES modules block shipping a demo.
- **Interpolation** in render using `alpha` — nice polish, not a Phase 1 gate.
- **Extracting** level data to JSON files — do when you have two levels to share data; not required for one test room.

## 6. Definition of done for Phase 1

Phase 1 is **done** when all of the following are true:

1. A developer can open `index.html` via a static server, play without crashes, and **read** HP + debug info when needed.
2. **Player movement, dodge, i-frames, and 3-hit combo** behave predictably in the test level (no known soft-locks; document any accepted quirks in this file or a one-line `NOTE` in `main.js`).
3. **At least one slime** can be defeated with the combo; **slimes can damage** the player; **death or fail state** has a **clear, repeatable** response (e.g. restart, reload instruction, or simple “game over” + key to retry).
4. `GameState` remains a **data-oriented** object (no gameplay methods on the state object; logic stays in modules). Transient fields (`_hitThisSwing`, etc.) are **documented** as non-serialized or omitted in any future snapshot.
5. **No** multiplayer or sync code is added; **no** new systems are introduced beyond what is required for item 3.
6. Stakeholder sign-off: **“this is the reference build for feel”** before Phase 2 planning.

---

*Last updated: planning pass aligned to repo layout under `wardenfall/` (game source + `src/`).*

**Phase 1 closed (2026-04-22):** Playable loop implemented — `roundState` win/lose, full-screen outcome + **R** `resetRun`, `?dev=1` template serialize check, second debug key (Backquote). See `docs/playtest-notes.md` and `PHASE1_ENGINEERING_TASKS.md` M1–M6.
