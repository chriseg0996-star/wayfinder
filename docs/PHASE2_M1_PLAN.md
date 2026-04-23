# Phase 2 — Milestone 1 (this build)

**Scope:** [PHASE2_PLAN.md](PHASE2_PLAN.md) sections 2a + part of 2f (not skills, not archer/brute, not full art/audio).

1. **Data layer:** `src/data/zones.js` with three zone presets (`forest`, `ruins`, `cave`): platforms, spawns, slime positions, `displayName`, background color key, `levelW` / `levelH`.
2. **State:** `currentZoneId` on state; `player.xp`, `player.level`, `player.stats: { str, vit, agi }`; `loadZone(state, id)` applies layout, preserves meta progression, full heal on zone load; `createGameState` / `resetRun` use zone order.
3. **Progression:** `src/systems/Progression.js` — XP to next level, gain XP on enemy kill, level-up all-stats bump, `recomputePlayerDerived` (vit → `maxHp`), str → melee damage mult, agi → move speed mult.
4. **Integration:** [Combat.js](c:\Users\chris\Downloads\wardenfall\wardenfall\src\systems\Combat.js) awards XP and fixes `_slime` / `slime` typo; [Player.js](c:\Users\chris\Downloads\wardenfall\wardenfall\src\entities\Player.js) uses move mult; [Game.js](c:\Users\chris\Downloads\wardenfall\wardenfall\src\core\Game.js) on win: **N** next zone, **R** `resetRun`; on lose: **R** `resetRun`.
5. **UI + constants:** zone title, XP / level readout, win/lose copy for multi-zone; [Input.js](c:\Users\chris\Downloads\wardenfall\wardenfall\src\core\Input.js) `KeyN` + `nextZonePressed` edge. [Render.js](c:\Users\chris\Downloads\wardenfall\wardenfall\src\systems\Render.js) zone background color.

**Out of this build:** archer, brute, skills, sprites, audio, minimap.

**Done when:** all three zones reachable via win → N; stats visibly affect play; XP/level on kills; R resets run; dev serialize still passes for template.

**Status: implemented** — `src/data/zones.js`, `src/systems/Progression.js`, `loadZone` / `loadNextZoneIfAny`, `zoneBg` per `Render`, XP on kill, STR/VIT/AGI scaling, `KeyN` after win.
