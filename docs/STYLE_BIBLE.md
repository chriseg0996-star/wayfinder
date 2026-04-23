# Wayfinder Style Bible (Practical v1)

Use this as the default art direction for all new sprite and environment work.
Target: readable 2D side-scrolling action RPG on HTML5 canvas.

## Character proportions

- Player reads as a clear hero silhouette at gameplay scale: broad shoulders, tapered torso, sturdy boots.
- Keep head/torso/legs separation obvious in every frame.
- Secondary motion (scarf/hair/cloth) is subtle in idle, stronger in run/attack.
- Slime stays simple: rounded blob, clear eye placement, squash/stretch over detail.

## Line and outline rules

- Gameplay actors use a dark outer silhouette line (1-2 px at source scale).
- Inner detail lines are lighter/thinner than silhouette lines.
- Avoid noisy checkerboard outlines; use clean shape edges first.
- Keep outline contrast stronger on player than on background props.

## Palette rules

- World base: cool greens/blues, moderately desaturated.
- Gameplay accents: warm amber/yellow for telegraph and attack highlights.
- Player gets one identity accent color (scarf/trim) that remains consistent.
- Avoid full-saturation fills except brief FX accents.
- Background values stay below gameplay values.

## Material rules

- Cloth: softer value ramps, fewer sharp highlights.
- Leather: warmer mids + small spec accents.
- Metal: highest local contrast but tiny area usage.
- Slime: soft gradients, single bright highlight, readable face.
- Materials should be distinguishable by value/hue, not texture noise.

## Contrast and readability rules

- Highest contrast belongs to player, enemy, and active combat states.
- Platform tops must read immediately as walkable.
- Background layers remain lower contrast/saturation than gameplay.
- Telegraph states must outrank background in value and hue contrast.
- If readability fails, reduce background intensity first before adding more FX.

## Platform design rules

- Strong top edge read (rim/highlight) and grounded underside.
- Keep forms chunkier than character feet; avoid thin ledges that vanish.
- Use simple tile breakup; avoid high-frequency detail on walkable surfaces.
- Platform color should separate from both player and slime at a glance.

## Background and parallax rules

- 3 depth layers only: far, mid, near.
- Far: slowest, lowest contrast; near: fastest, still quieter than gameplay.
- Use atmospheric perspective (cooler/darker/fainter with distance).
- Do not place high-contrast motifs directly behind expected combat lanes.
- Zone mood changes come from palette and parallax tuning, not new rendering systems.

## FX style rules

- Slash arcs, hit sparks, dust are short-lived and shape-driven.
- Use 1 clear key color per FX type (slash=bright cool, hit=warm spark, telegraph=amber).
- Keep FX silhouettes readable in 1-2 frames.
- FX should emphasize timing, not obscure hit readability.

## UI visual rules

- UI framing is dark, low-noise, with thin bright accents.
- Use pixel-friendly, high-legibility text at all times.
- Combat-critical UI has highest priority; decorative flourishes stay subtle.
- Keep center play area clean; avoid persistent blocking overlays.

## Do / Don't examples

- Do: prioritize strong silhouettes and clear state poses.
- Do: keep palette controlled and role-based (player/enemy/bg/ui).
- Do: make telegraph visually obvious before attack.
- Don't: add detail that only reads when zoomed in.
- Don't: let near parallax compete with actor contrast.
- Don't: mix many unrelated accent colors in one scene.
