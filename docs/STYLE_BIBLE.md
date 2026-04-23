# Wardenfall / Wayfinder — Style bible (Phase 2 art baseline)

**Purpose:** One coherent visual language for backgrounds, characters, and platforms so assets can be batched in Aseprite/LibreSprite/AI and dropped into `assets/` without renegotiating look every week.

**Not in scope here:** exact narrative, final zone count, or UI art (Phase 2 UI pass is separate).

---

## 1. Pillar: readable silhouette over detail

- **2D action RPG on a 960×540 canvas** (design at 1920×1080 safe area, scale 0.5× to canvas or export 2× and downscale).
- **Readability at a glance** beats texture density. If a pose or platform reads at 12 ft on a TV, it passes; if it needs a zoom, cut detail.
- **Chromatic restraint:** 3–4 major hues per zone + neutrals, one accent (telegraph, hit flash, player trim).

---

## 2. Palette direction

| Role | Rule |
|------|------|
| **Backgrounds** | Lower contrast and saturation than gameplay layer; no pure white; sky/void tends cool/dark. |
| **Playfield** | Platforms: mid-value neutrals (blue-grey, desaturated green-grey) with **tangible top read** (1–2 px bright rim or bevel in art, not in code). |
| **Player** | Cool highlight (e.g. cyan/blue) + one warm accent (trim/glove) for identity; avoid full-saturation fills. |
| **Enemy (slime)** | Green is canonical; **telegraph** = warm yellow/amber; **hurt** = pink-red shift, not rainbow. |
| **FX / hit** | Gold/yellow for player attacks; keep alpha discipline (current hitbox draw is **debug/placeholder**; replace with sprite + shader-free tricks later). |

**Per-zone paint-over:** `GameState.zoneBg` + `data/zones.js` stay the **mood** anchor. Future art maps one palette table per `currentZoneId`.

---

## 3. Lighting direction

- **Side/top hybrid:** Key light from **upper left**; platforms read as “lit from above” with a **stronger read on the top edge** (in sprite, not a global light engine).
- **No dynamic lights in code for this phase** — “lighting” is **painted** into the sprite sheets and BG art.
- **Vignette/depth:** Distant parallax = cooler/darker; near gameplay = same palette but ≥10% lighter value than farthest layer.

---

## 4. Silhouette rules

- **Player:** Taller than wide; **head+torso+weapon read** in ≤24 px height at native export (before scale). Facing = flip X; no asymmetric costume that breaks mirroring until we have turn frames.
- **Slime:** Blob + two eyes; **one solid mass**; telegraph state must **pump silhouette** (bigger, glow) before damage frames.
- **Platforms:** **Horizontal beats vertical**; avoid 3 px-wide pillars at gameplay resolution; min walkable read ≈ 2× character foot width in art.

---

## 5. Parallax & layer rules

| Layer | Parallax (vs camera) | Content |
|-------|----------------------|--------|
| **Back (sky/void/distant trees)** | ~0.12–0.2 X, light Y | *Implemented as `PARALLAX_LAYERS[0].far` in* `artConfig.js` |
| **Mid** | ~0.4–0.5 X | `PARALLAX_LAYERS[1]` — gradient, no collision |
| **Near (haze, ground read)** | ~0.7–0.9 X | `PARALLAX_LAYERS[2]` — last before gameplay |
| **Game world** | 1.0 | Platforms, entities, physics (after parallax in `Render.js`) |
| **FX (optional later)** | 1.0, drawn after actor | Hit sparks |

**Rules:** parallax layers **never** carry hitboxes. Tuning per zone: `data/zones.js` — `parallaxTuning: { desatAdd, darkenAdd }` (length-3 arrays for far/mid/near). `constants`: `COLOR_PLATFORM` stays **brighter** than the near layer so walkable read pops.

---

## 6. Asset resolution & grid

- **Base tile / character grid: 16×16** native pixel art, **integer scale** to canvas (e.g. 2× or 3×) — avoid odd fractional scale for primary characters.
- **Player / slime hitboxes in code** stay authoritative; **art can extend 1–2 px** into “empty” space with **transparent** pixels (trim in sheet), not by changing `PLAYER_W` until a deliberate pass.
- **Spritesheet:** one row per **logical `state`** (see `Player` FSM) or one sheet per character with consistent frame order; document in `docs/PHASE2_ART_INTEGRATION.md` when the first real sheet lands.
- **Backgrounds:** export **2× level width** minimum for the farthest parallax to avoid hard edges during pan (or **seamless** horizontal tile).

---

## 7. Animation pipeline (logic → art)

- **Source of truth for which clip to play:** `player.state` and `e.state` (and `player.comboIndex` for attack 1/2/3) — do **not** add a second parallel FSM for anims until a shot needs blending.
- **Time:** `state.tick` and `FIXED_DT` give deterministic time; for frame index use `Math.floor(accumulatedAnimTime * FPS_row)` in **Render** only (client-only field allowed later, or drive from `tick` modulo).
- **Hurt / hit flash:** 1–2 frame color swap in art; code may keep a simple tint **placeholder** until sheets ship.

---

## 8. What stays ugly on purpose (until the next sub-phase)

- Rect **hitbox debug** for attacks (or replace with a single “slash” sprite first).
- **Enemy HP micro-bars** — can stay minimal or move to a single world-space shaderless bar sprite later.
- **No audio** in this art-tech block (see roadmap Phase 2 audio as a separate track).

This document is the **baseline**. Deviations require a one-line addendum (e.g. “Desert act: shift accent from cyan to terracotta”).
