# Character sprite sheets (final art)

Drop finalized PNGs here. The game loads them automatically; on failure, procedural placeholders are used (no crash).

## Files

| File | Min size (px) | Re-exported from code |
|------|-----------------|------------------------|
| `player.png` | **192 × 432** | `PLAYER_SHEET_PIXEL_SIZE` in `src/render/spriteConfig.js` |
| `slime.png`  | **128 × 144** | `SLIME_SHEET_PIXEL_SIZE` in `src/render/spriteConfig.js` |
| `archer.png` | from `ARCHER_SHEET_PIXEL_SIZE` | `ARCHER_SHEET_PIXEL_SIZE` in `src/render/spriteConfig.js` |
| `brute.png`  | from `BRUTE_SHEET_PIXEL_SIZE` | `BRUTE_SHEET_PIXEL_SIZE` in `src/render/spriteConfig.js` |

Sheets may be **larger** than the minimum if extra padding is only on the **right** or **bottom**; layout below must still align from the **top-left** (0,0).

## Grid contract

- **Player** cell: **32×48** (`PLAYER_SHEET_PX` in `Constants.js`).  
- **Slime** cell: **32×24** (`SLIME_SHEET_PX`).

For row index `r` and frame index `f` (0-based within that row):

- `sx = f * frameW`
- `sy = r * frameH`
- `sw, sh` = one cell

Row indices and frame counts are **authoritative** in `Constants.js`: `PLAYER_ANIM` and `SLIME_ANIM` (not re-listed here so a single source stays in code).

## Facing (horizontal flip)

Source art is **facing right**. The renderer flips with `drawImageFrame(..., flipX = !facingRight)`; **do not** author separate left-facing cells unless you change the pipeline.

## Timing

Clip **duration** in gameplay comes from **sim** (e.g. attack timers), not from frame count. Per-row `fps` in `PLAYER_ANIM` / `SLIME_ANIM` only **distributes** frames across that wall. Do not change `Constants` combat timings when swapping art.

## Validation

If a loaded image is **smaller** than the minimum width/height above, the console shows a **warning**; the game still registers the image (you may see wrong sampling). Fix the sheet or update the contract in a **coordinated** change to `Constants` + `spriteConfig` exports.
