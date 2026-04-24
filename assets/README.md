# Art assets (Phase 2+)

**Parallax (no PNG yet):** Three world-space layers are drawn in [`src/render/backgroundLayers.js`](../src/render/backgroundLayers.js) from `state.zoneBg` and optional **`parallaxTuning`** in [`data/zones.js`](../src/data/zones.js) (`desatAdd` / `darkenAdd` per far-mid-near). Tuning keeps actors readable without changing `Player` / `Enemy`.

**Release runtime layout (canonical):**

```
assets/
  sprites/         # player.png, slime.png, archer.png, brute.png
  parallax/        # far.png, mid.png, near.png
  tiles/           # ground.png
  audio/           # sfx_*.wav, optional bgm_main.ogg
```

**Per zone:** In `ZONES[zoneId]`, set:
- `bg: '#rrggbb'` (mood for all parallax tints)
- `parallaxTuning` (optional) — add desat/darken on layers that need more mood; **forest** can omit (defaults only).

Parallax loader automatically uses `drawImage` when layer PNGs exist and falls back to gradients when they do not.

**Conventions:** See [docs/STYLE_BIBLE.md](../docs/STYLE_BIBLE.md) and [docs/ASSET_INTAKE_MATRIX.md](../docs/ASSET_INTAKE_MATRIX.md).

**Sprite PNGs:** [`sprites/README.md`](sprites/README.md) — file names, grid, min size, flip.

**Readiness checks:** startup summary is emitted from `src/assets/assetContract.js`; add `?assetStrict=1` to fail loudly when required assets are missing/invalid.
