# Wardenfall Asset Intake Matrix

This is the release intake checklist for runtime assets. Paths match the contract in `src/assets/assetContract.js`.

## Canonical Runtime Paths

| Category | ID | Path | Required | Contract |
|---|---|---|---|---|
| Sprite | playerSheet | `assets/sprites/player.png` | yes | Matches `PLAYER_SHEET_PX` and `PLAYER_ANIM` rows |
| Sprite | slimeSheet | `assets/sprites/slime.png` | yes | Matches `SLIME_SHEET_PX` and `SLIME_ANIM` rows |
| Sprite | archerSheet | `assets/sprites/archer.png` | yes | Matches `ARCHER_SHEET_PX` and `ARCHER_ANIM` rows |
| Sprite | bruteSheet | `assets/sprites/brute.png` | yes | Matches `BRUTE_SHEET_PX` and `BRUTE_ANIM` rows |
| Background | parallaxFar | `assets/parallax/far.png` | yes | Far parallax layer, horizontally tilable |
| Background | parallaxMid | `assets/parallax/mid.png` | yes | Mid parallax layer, horizontally tilable |
| Background | parallaxNear | `assets/parallax/near.png` | yes | Near parallax layer, horizontally tilable |
| Tile | groundTile | `assets/tiles/ground.png` | yes | Seamless enough for repeated platform fill |
| Audio | sfxAttack | `assets/audio/sfx_attack.wav` | yes | Triggered by `attack` cue |
| Audio | sfxEnemyAttack | `assets/audio/sfx_enemy_attack.wav` | yes | Triggered by `enemy_attack` cue |
| Audio | sfxHit | `assets/audio/sfx_hit.wav` | yes | Triggered by `hit` cue |
| Audio | sfxEnemyHurt | `assets/audio/sfx_enemy_hurt.wav` | yes | Triggered by `enemy_hurt` cue |
| Audio | bgmMain | `assets/audio/bgm_main.ogg` | no | Optional BGM loop |

## Gameplay Mapping Checklist

- Player states covered in sprite rows: `idle`, `run`, `jump`, `fall`, `attack_1`, `attack_2`, `attack_3`, `dodge`, `hurt`
- Enemy states covered:
  - Slime: `idle`, `move`, `telegraph`, `attack`, `hurt`, `death`
  - Archer: `idle`, `move`, `aim`, `shoot`, `hurt`, `death`
  - Brute: `idle`, `move`, `attack`, `hurt`, `death`
- Zones expected to render readable backgrounds: `forest`, `ruins`, `cave`
- Audio cues expected in combat loop: `attack`, `enemy_attack`, `hit`, `enemy_hurt`

## Intake Rules

- Keep one canonical file per runtime path; archive alternates outside runtime directories.
- Do not rename runtime files without updating `src/assets/assetContract.js`.
- For sprite sheets, treat `spriteConfig.js` + constants as authoritative for frame size and row indices.
- For imported packs, preserve original license/terms files under `assets/Imports/`.
