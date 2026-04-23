# Phase 2 — Art & render integration (Block 1)

**Scope:** style bible, background/pipeline, sprite/animation *preparation* — not new enemies, skills, progression, audio, or UI systems.

---

## 1) Current visual pipeline (diagnosis)

- **Entry:** `Game._render` → `render(ctx, state, alpha)` in [`src/systems/Render.js`](../src/systems/Render.js). **`alpha` is not used** for sprite interpolation.
- **Screen pass:** `clearRect` + **full-bleed** fill using `state.zoneBg` (from [`data/zones.js`](../src/data/zones.js)) or `COLOR_BG` fallback.
- **World pass:** one `ctx.translate(-cam.x, -cam.y)`; draw order: **platforms → enemies → player** (painter: back-to-front within world).
- **Vocabulary:** 100% Canvas2D `fillRect` / `arc` / `stroke`; no `Image`, no sprite atlas, no `requestVideoFrame` — **zero asset I/O** today.
- **Per-entity “style”:** ad hoc colors in `Render.js` and [`Constants.js`](../src/config/Constants.js) (`COLOR_*`); **telegraph** on slime uses `Date.now()` for a sine pulsing alpha — **non-deterministic**; should be replaced with `state.tick` when we care about net/replays.
- **Z-order:** no explicit “layer list”; order is call order. Fine until FX layer exists.

**Verdict:** Solid for greybox, **not** a production art pipeline. Missing: loaded `Image` registry, `drawImage` with source rects, parallax as separate draw passes, deterministic time for effects.

---

## 2) Files to adjust first (next PRs, in order)

| Order | File / folder | Why |
|------|----------------|-----|
| 1 | [`src/render/artConfig.js`](../src/render/artConfig.js) | Single source: grid, parallax, scale. |
| 2 | [`src/render/backgroundLayers.js`](../src/render/backgroundLayers.js) | Parallax **placeholder** + hook for real BG `Image` later. |
| 3 | [`src/systems/Render.js`](../src/systems/Render.js) | Call background stack, then world; add `// LAYER` comments. |
| 4 | `assets/*` + tiny loader in `main.js` (when first PNG exists) | `new Image()` + `decode()` Promise — **deferred** until an asset is committed. |
| 5 | `docs/STYLE_BIBLE.md` | Already the contract for artists. |

**Last** (not Block 1): per-entity `drawImage` in `Render.js` or a thin `src/render/drawSprite.js` helper.

---

## 3) Style bible (minimal pointer)

**Full spec:** [STYLE_BIBLE.md](STYLE_BIBLE.md) (palette, light, silhouette, parallax, resolution).

**One-line summary:** *Cool dark void + readable player cyan, slime green, warm telegraph; 16px grid, side-lit, parallax 0.32/1.0, no gameplay on back layers.*

---

## 4) Rendering / asset integration plan (Block 1 done in code + docs)

1. **Constants in code:** `artConfig.js` — `GRID_PX`, `PARALLAX.back`, optional `CANVAS_TO_ART` scale note.
2. **Background pipeline:** `backgroundLayers.js` — `drawBackPlaceholderStack(ctx, state, cam)` using parallax translate + two-tone world band (tinted from `zoneBg`). Replace inner fills with `drawImage` when `assets/backgrounds/<zone>_back.png` exist.
3. **Render order:** (screen clear + optional vignette) → back parallax placeholder → world (platforms, enemies, player).
4. **Sprites (next PR after first sheet):** `assets/manifest.js` or JSON listing `{ id, path, frameW, frameH, rows }`; `loadArtAssets(manifest)` resolves when all `HTMLImageElement.decode()` complete; `Render` receives `artRegistry` (could hang off `state` as **non-serialized** or `Game` instance — **prefer `Game` or a module** to keep `GameState` lean).
5. **Animation prep:** use existing **`player.state` / `enemy.state`** for row selection; per-frame = `state.tick` modulo (or `p.animT` in render only). No new progression fields.

---

## 5) What remains placeholder (intentionally)

- **All `fillRect` characters and platforms** until first sprite sheet is merged.
- **Attack / telegraph** VFX: rects and `Date.now()` wobble — replace with 2–4 frame strips later.
- **No minification / texture packing** in Block 1 — a single PNG per character is OK.
- **No spine/bones** — 2D grid flipbook only for this project phase.

---

## 6) Block 1 “done” criteria

- [x] `STYLE_BIBLE.md` and this integration doc in repo.  
- [x] `artConfig.js` + `backgroundLayers.js` + `Render` calls them.  
- [ ] First real `.png` in `assets/` + one `drawImage` (optional follow-up task).  
- [ ] Replace slime telegraph `Date.now()` with `state.tick` (small follow-up for determinism).  

**Do not** add skills, new enemies, XP UI, or audio in this block.
