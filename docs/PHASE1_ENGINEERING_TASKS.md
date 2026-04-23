# Wardenfall — Phase 1 engineering tasks

Actionable work derived from `PHASE1_EXECUTION.md`. **Phase 1 only** — no progression systems, no MMO/networking, no new content types, no visual systems before core feel is signed off.

**Task tags:** **MUST** = blocks Phase 1 exit · **SHOULD** = do if time; improves quality · **CUT FOR NOW** = explicitly out of scope

---

## 1. Milestones (strict order)

Complete **M1 → M2 → M3** in sequence. **M4–M5** run only after M3 unless a **MUST** bug blocks playtesting (then do the smallest fix, still in milestone order for everything else).

| Order | ID | Name |
|------|-----|------|
| 1 | **M1** | Baseline playtest + feel issue list |
| 2 | **M2** | Constants-only tuning (first feel pass) |
| 3 | **M3** | Playable loop closure (fail / success / restart) |
| 4 | **M4** | Hardening: repro’d edge cases only |
| 5 | **M5** | Debug + optional serialize guard |
| 6 | **M6** | Phase 1 exit: checklist + tag |

---

## 2. Milestone details

### M1 — Baseline playtest + feel issue list

**Goal:** Prove the current vertical slice is testable and capture a **short, ordered** list of feel problems (no code changes required except running the game).

**Files to touch:** None required. **Optional:** add bullet list to this doc or a scratch `docs/playtest-notes.md` (1 page max).

**What success looks like**
- Game runs static-server + `index.html` without console errors.
- 10–20 minute session: move, jump, air control, dodge, 3-hit combo, take slime hits, reach `hp <= 0` at least once.
- **Written** list of **3–7** issues, each tagged: **tune (Constants)** vs **code bug** vs **loop/design** (for M3).

**What not to touch:** `src/` code, new assets, refactors, new features.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M1-1 | Run one structured playtest session; document issues | **MUST** |
| M1-2 | Categorize each issue (constants vs code vs loop) | **MUST** |
| M1-3 | Record browser + OS for the session | **SHOULD** |
| M1-4 | Set up screen recording of repro steps | **CUT FOR NOW** |

---

### M2 — Constants-only tuning (first feel pass)

**Goal:** Address **tuning** items from M1 using **numbers only** in `Constants.js` (and nowhere else, unless a single obvious one-line read of existing code is required to understand a constant).

**Files to touch:** `src/config/Constants.js` (primary). **Exception (rare):** if M1 identified a value **hardcoded** in `Player.js` / `Enemy.js` that should be a constant, **one** line move into `Constants.js` + one import — no behavior refactor.

**What success looks like**
- Top **3–5** feel issues from M1 that are **tune-shaped** are improved or marked “WNF” (won’t fix) with one-line reason.
- No new states, no new input bindings, no physics algorithm changes.

**What not to touch:** `Physics.js` resolution algorithm, new enemy/player states, `Render.js` (except re-exporting colors if you centralize a magic number—prefer **not** in Phase 1), networking comments beyond typos.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M2-1 | Map M1 “tune” items to `Constants.js` fields | **MUST** |
| M2-2 | Adjust gravity, move speed, jump, dodge, combo windows, slime telegraph, hitstop, damage — **only** via constants / moved constants | **MUST** |
| M2-3 | Re-playtest 5 minutes; confirm no regression on previously “ok” areas | **MUST** |
| M2-4 | A/B two extreme presets and pick middle ground | **SHOULD** |
| M2-5 | New “difficulty” presets or profiles | **CUT FOR NOW** |
| M2-6 | Particle or screen-shake for hits | **CUT FOR NOW** |

---

### M3 — Playable loop closure

**Goal:** Add the **smallest** end-to-end experience: from start → play → **clear outcome** and ability to play again without full page reload. Minimum acceptable patterns (pick **at least one**; two is **SHOULD** if small):

- Player **dead** → on-screen text + **R** to reset run **or** auto-reset after short delay; **or**
- **All slimes dead** → simple “Cleared” / “Phase 1 demo complete” + **R** to reset **or** same as above.

**Files to touch (typical, adjust as needed):**  
`src/state/GameState.js` (e.g. `roundState: 'playing' | 'win' | 'lose' | 'demo'`, reset helper), `src/core/Game.js` (read reset edge, call reset), `src/core/Input.js` (`restartPressed` edge for **R**), `src/systems/UI.js` (overlay text), optionally `src/entities/Player.js` / `Enemy.js` if reset must re-init HP/positions. Prefer at most ~80 lines total new logic.

**What success looks like**
- A new player can be told: “Defeat the slimes” / “Don’t die” and understands when the run **ended** and how to **try again** without F5.
- No new level geometry required for this milestone.
- `Constants.js` may gain UI text strings or timing for overlay only; keep them as plain data, not new systems.

**What not to touch:** new levels, new enemies, XP/gold, save data, main menu art, cutscenes, story.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M3-1 | Define `roundState` (or equivalent) in `GameState` | **MUST** |
| M3-2 | Detect **lose** (player `dead` or `hp <= 0` per your existing FSM) | **MUST** |
| M3-3 | Detect **win** (e.g. no living slimes) OR document why only **lose+restart** ships in Phase 1 | **MUST** (one path minimum; “win” is **SHOULD** if time) |
| M3-4 | `resetRun()` (or similar) reuses `createGameState()` or resets fields in one place | **MUST** |
| M3-5 | `R` edge in input snapshot + wire in `Game` | **MUST** (unless you only do auto-restart) |
| M3-6 | Minimal overlay in `UI.js` | **MUST** |
| M3-7 | Full pause menu | **CUT FOR NOW** |
| M3-8 | High scores / timer leaderboards | **CUT FOR NOW** |
| M3-9 | Animated end screens | **CUT FOR NOW** |

---

### M4 — Hardening: repro’d edge cases only

**Goal:** Fix **only** bugs you can **reproduce** from a written step list (e.g. stuck in hurt, double contact damage, input ignored after hitstop). **Surgical** edits; no rewrites.

**Files to touch:** Whichever file owns the bug — likely `src/entities/Player.js`, `src/entities/Enemy.js`, `src/core/Game.js`, `src/systems/Physics.js`. Prefer under 20 lines per fix.

**What success looks like**
- Each fix references a **test case** in the milestone checklist.
- If **no** repro bugs after M3, M4 = **no-op** (mark complete in notes).

**What not to touch:** “While we’re here” refactors, new combat mechanics, new enemy behavior.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M4-1 | List repro steps for each bug | **MUST** (if any bugs) |
| M4-2 | One bug per commit / clear diff | **SHOULD** |
| M4-3 | Add automated unit tests | **CUT FOR NOW** |
| M4-4 | Refactor FSMs for “cleaner architecture” | **CUT FOR NOW** |

---

### M5 — Debug + optional serialize guard

**Goal:** Reliable **debug** toggle; optional **dev-only** check that `GameState` remains JSON-safe (strip or document transient fields).

**Files to touch:** `src/core/Input.js` (second key for debug if F3 is unreliable), `src/core/Game.js` (if hooking a dev check once per N ticks), `src/state/GameState.js` (document `_hitThisSwing` etc. as transient), small `src/dev/assertSerializable.js` **only if** you do the check.

**What success looks like**
- You can open debug in your target browser in at most two attempts.
- If serialize check exists: it fails loudly in dev when someone adds a `Map` or function into `state`.

**What not to touch:** import maps, bundlers, schema validators, Protobuf, worker threads.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M5-1 | Confirm F3; if flaky, add a second key (e.g. `KeyP` or `Backquote`) for debug (edge in snapshot) | **SHOULD** |
| M5-2 | Document transient fields in `GameState.js` header comment | **MUST** |
| M5-3 | `assertSerializable` or `JSON` round-trip in **dev** only, gated | **SHOULD** |
| M5-4 | Log full state to console on every frame | **CUT FOR NOW** |

---

### M6 — Phase 1 exit

**Goal:** Mark the slice **complete** per `PHASE1_EXECUTION.md` Definition of done; **freeze** the branch.

**Files to touch:** `docs/PHASE1_EXECUTION.md` (date + “closed” one-liner) or this file’s status section; `git` tag in repo (no new game code required).

**What success looks like**
- All **MUST** items through M3 (and M5-2) done.
- Git tag e.g. `phase-1-complete` on `main` (or release branch you use).

**What not to touch:** New gameplay code after tag until Phase 2 is planned.

**Tasks**
| ID | Task | Tag |
|----|------|-----|
| M6-1 | Walk `PHASE1_EXECUTION.md` §6 checklist; mark pass/fail | **MUST** |
| M6-2 | Tag repository | **MUST** |
| M6-3 | Short internal “what we learned / constants range” blurb in docs | **SHOULD** |
| M6-4 | GitHub release with changelog | **CUT FOR NOW** |

---

## 3. Seven-day implementation plan

| Day | Focus | Deliverable |
|-----|--------|-------------|
| **1** | M1 | Playtest notes: 3–7 issues, categorized |
| **2** | M2 (part 1) | Half of constant tweaks + quick smoke test |
| **3** | M2 (part 2) | Remaining tweaks + 5 min re-playtest |
| **4** | M3 (part 1) | State + win/lose detection + `resetRun` skeleton |
| **5** | M3 (part 2) | R key, UI overlay, wire `Game` loop; full flow works |
| **6** | M4 + M5 | Fixes only for repro bugs; debug + doc transients; optional assert |
| **7** | M6 + buffer | Checklist, tag, half-day buffer for last bugs or rest |

**Buffer rule:** If M3 slips, **cut M5-3** (serialize) and keep M5-1/M5-2. If M2 slips, **shrink** to 3 numbers changed + re-test, defer the rest to post–Phase 1 tech debt (document only).

---

## 4. Testing checklists (per milestone)

### M1 — Baseline

- [ ] Static server: no load errors, no module 404s  
- [ ] Player can traverse full test platforms left/right  
- [ ] At least 3 full combos on a slime, slime HP decreases  
- [ ] Player takes damage from slime, HP decreases  
- [ ] Player can reach 0 HP / dead state at least once  
- [ ] F3 (or planned debug) opens/closes debug overlay if applicable  
- [ ] Issues list completed (3–7 items)

### M2 — Constants tuning

- [ ] Every changed value traced to a M1 “tune” line item  
- [ ] No new `.js` files; no algorithm changes in `Physics.js`  
- [ ] Quick regression: still can jump, attack, and clear at least one slime (if M3 not merged yet, **kill** one enemy still works as before)  
- [ ] Optional A/B: note which preset is shipping

### M3 — Playable loop

- [ ] From cold load, a tester reaches **end state** in one sitting  
- [ ] **Lose** path: clear message + way to play again (R and/or auto)  
- [ ] **Win** path: if implemented, “all slimes dead” (or doc’d alternative) is obvious  
- [ ] `resetRun` returns player + enemies + round flags to a known initial state (no double-count bugs)  
- [ ] **R** does not fire accidental actions in gameplay (or R only on game-over screen — document which)

### M4 — Hardening

- [ ] For each fix: **before** steps, **expected after**, pass/fail  
- [ ] No new behaviors beyond bug fixes (spot-check in diff stat)

### M5 — Debug / serialize

- [ ] Debug toggle works in your primary browser (document key in `UI` hint line)  
- [ ] `GameState.js` header lists transient properties  
- [ ] If assert exists: flip a test (temporarily add a function into state) and confirm assert trips

### M6 — Exit

- [ ] `PHASE1_EXECUTION.md` §6 all **true** (or **explicit waiver** in writing with reason)  
- [ ] `phase-1-complete` (or agreed tag) exists on the commit you sign off

---

## 5. Quick reference: MUST / SHOULD / CUT (global)

| Area | MUST | SHOULD | CUT FOR NOW |
|------|------|--------|-------------|
| Feel | M1, M2, M3-1..M3-6 | A/B tuning, M3 win screen polish | New weapons, skills, stats |
| Loop | Lose + restart; win **or** documented single-path | Both win+lose in one build | Metroidvania map, save slots |
| Code | Surgical bugfixes with repro | Second debug key, serialize assert | New modules “for future” |
| Visual | None beyond minimal overlay (M3) | — | Shaders, particles, sprite sheets, lighting |
| World | — | — | MMO, multiplayer, chat, instancing |
| Meta | — | — | Progression, XP, loot tables, drop rates |

---

*Complements: `PHASE1_EXECUTION.md` (definition of done, risk table). Keep both in sync at Phase 1 close.*
