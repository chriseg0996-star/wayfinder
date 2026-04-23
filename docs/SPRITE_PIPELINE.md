# Sprite & animation pipeline (Phase 2)

## Approach (summary)

1. **Data** — `spriteConfig.js` holds each sheet: `frameW` / `frameH`, and per-anim `rows[ key ] = { row, frames, fps }` (one horizontal strip per row in the PNG).
2. **FSM → clip key** — `animKeys.js` maps the player and slime to a **small string** (`getPlayerAnimKey`, `getSlimeAnimKey`) with no side effects.
3. **Time → frame index** — `animClips.js`:
   - **Loop:** `animFrameIndex(state.tick, spec)` (sim time, deterministic).
   - **One-shot:** `t` in 0..1 from existing gameplay timers (attack, dodge, hurt) or, for **slime death**, `(state.tick - e.deathStartTick) * FIXED_DT` with duration `frames / fps` (set in `Combat.js` when the slime is killed).
4. **Blit** — `spriteDraw.js` / `entityRender.js` place the sprite; **facing** uses `flipX` (horizontal scale).
5. **Assets** — `spriteRegistry.js` registers a **synthetic canvas strip** immediately so the game always has a valid `CanvasImageSource`; if `assets/sprites/*.png` load, they **replace** the placeholder.

This is not a graph or blend tree: a single active anim per entity, one row per key, and explicit if/switch in `animClips.js`.

**Background vs gameplay (readability):** The screen base + parallax stack (`backgroundLayers.js`, `artConfig.js` `PARALLAX_LAYERS`) is tuned **darker and lower-opacity** than the 1:1 world pass. Platforms use `Constants` `COLOR_PLATFORM` + rim + bottom shade (`Render.js`) so walkable space reads **in front** of the gradient backdrops. No new scene system.

## Updated / relevant files

| File | Role |
|------|------|
| `src/render/spriteConfig.js` | Row layout, `dest` size, `animFrameIndex` for loops |
| `src/render/animKeys.js` | FSM → `PlayerAnimKey` / `SlimeAnimKey` |
| `src/render/animClips.js` | `resolvePlayerTextureRect`, `resolveSlimeTextureRect`, `shouldDrawSlime` |
| `src/render/spriteRegistry.js` | Placeholder canvases + optional PNG |
| `src/render/entityRender.js` | World draw, telegraph/attack gizmos, HP (alive only) |
| `src/render/spriteDraw.js` | `drawImage` + flip; supports `Image` and `canvas` |
| `src/systems/Combat.js` | `e.deathStartTick = state.tick` on kill |
| `src/state/GameState.js` | `enemies[].deathStartTick` |

## Supported animation states

### Player

| Key | When |
|-----|------|
| `idle` | Default; **dead** (`state === 'dead'` or `hp <= 0`) — same row as static idle. |
| `run` | `state === 'run'` |
| `jump` | `state === 'jump'` (rising) |
| `fall` | `state === 'fall'` |
| `attack_1` / `attack_2` / `attack_3` | `state === 'attack'`, from `comboIndex` 1–3 |
| `dodge` | `state === 'dodge'` |
| `hurt` | `state === 'hurt'` |

### Slime

| Key | When |
|-----|------|
| `idle` | `patrol` |
| `move` | `chase` |
| `telegraph` | `telegraph` |
| `attack` | `attack` |
| `hurt` | `hurt` |
| `death` | `!alive` and `deathStartTick` set, until the death clip’s duration is reached |

## Asset format assumptions

- **PNG** with a **fixed cell size** (`frameW` × `frameH`) for that sheet; each anim is one **row**; frames are **columns** left to right.
- The sheet’s pixel width for each row must be at least `frameW * (frames in that row)`; unused columns can be left blank in art.
- **Optional** files: `assets/sprites/player.png`, `assets/sprites/slime.png` — if missing or 404, **placeholder canvases** are used and the same math applies.

**Row order (default):**

- **Player** — rows 0..8: `idle`, `run`, `jump`, `fall`, `attack_1`, `attack_2`, `attack_3`, `dodge`, `hurt` (32×48 cells: tune in `PLAYER_SHEET` + `Constants` dest / hitbox).
- **Slime** — rows 0..5: `idle`, `move`, `telegraph`, `attack`, `hurt`, `death` (32×24 default).

Tweak per-row `frames` and `fps` in `spriteConfig.js` when the real art lands.

## What art is still needed (next)

Replace placeholders with hand-authored PNGs (or the same layout from a DCC tool):

1. `assets/sprites/player.png` — full 9 rows as above, matching `frameW`/`frameH` and row indices.
2. `assets/sprites/slime.png` — 6 rows including a short **telegraph** row and **death** one-shot.

No engine change is required for drop-in if layout matches; if frame counts or row order differ, only `spriteConfig.js` (and possibly `frameW`/`frameH`) need updating.
