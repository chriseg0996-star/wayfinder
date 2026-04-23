# Art assets (Phase 2+)

**Parallax (no PNG yet):** Three world-space layers are drawn in [`src/render/backgroundLayers.js`](../src/render/backgroundLayers.js) from `state.zoneBg` and optional **`parallaxTuning`** in [`data/zones.js`](../src/data/zones.js) (`desatAdd` / `darkenAdd` per far-mid-near). Tuning keeps actors readable without changing `Player` / `Enemy`.

**When images land:**

```
assets/
  backgrounds/     # far.png, mid.png, near.png (or one strip per layer)
  player/          # …
  enemies/         # …
```

**Per zone:** In `ZONES[zoneId]`, set:
- `bg: '#rrggbb'` (mood for all parallax tints)
- `parallaxTuning` (optional) — add desat/darken on layers that need more mood; **forest** can omit (defaults only).

Replace each gradient block in `drawParallaxStack` with `ctx.drawImage` using the same `multX` / `multY` transform.

**Conventions:** See [docs/STYLE_BIBLE.md](../docs/STYLE_BIBLE.md). `drawImage` wiring: small manifest, then `Render` / `backgroundLayers` only.
