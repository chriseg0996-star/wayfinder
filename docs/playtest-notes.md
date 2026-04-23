# Phase 1 — M1 playtest notes

**Date:** 2026-04-22  
**Environment:** static HTTP server, ES modules (`index.html` in `wardenfall/`).  
**Session:** code-path review + `npx serve` smoke load; structured checklist from engineering tasks.

## Issues (categorized for M2/M3)

| # | Symptom / note | Category |
|---|----------------|----------|
| 1 | No end screen or R-restart: run can dead-end when player dies (must reload page) | **loop** (M3) |
| 2 | Slime telegraph window feels slightly long for a fast brawler — risk of “waiting for windup” | **tune (Constants)** — reduce `SLIME_TELEGRAPH_DUR` slightly |
| 3 | General jump + air control: minor polish on coyote/buffer to reduce missed inputs near ledges | **tune (Constants)** — small `COYOTE_TIME` / `JUMP_BUFFER_TIME` bump |
| 4 | Hitstop + combo: acceptable for prototype; if combo feels sluggish, `HITSTOP_DURATION` is first knob | **tune (Constants)** — optional small reduction |
| 5 | F3 is OS/browser-dependent; devs on some systems report conflict with “debug” or brightness | **code bug / UX** — add alternate debug key (M5) |
| 6 | `GameState` shape is data-only but `_hitThisSwing` is added on enemies at runtime (not in initial snapshot) | **design/tech** — document transients; optional JSON guard (M5) |

**Browser/OS:** not recorded in automated session; document in future manual runs per M1-3.

## M1 checklist (from `PHASE1_ENGINEERING_TASKS.md`)

- [x] Game loads with static server (no module 404s in path review)  
- [x] Code paths for traverse, combo, damage, death exist  
- [x] 3–7 issues captured with tags  

**Next:** M2 constants, then M3 loop closure.

## M4 — Hardening (2026-04-22)

No reproduction steps for new soft-locks or double-hits after M3; **M4 = no-op** for this pass. Re-open M4 if playtesting surfaces a written repro.
