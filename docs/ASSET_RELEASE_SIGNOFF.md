# Wardenfall Asset Release Signoff

Use this checklist before tagging an asset-complete release candidate.

## Visual Signoff

- [ ] Player renders correctly for all locomotion, attack combo, dodge, and hurt states.
- [ ] Slime renders correctly for idle, move, telegraph, attack, hurt, and death.
- [ ] Archer and brute render correctly for their configured state sets.
- [ ] No sprite frame bleed, incorrect row sampling, or major scaling artifacts.
- [ ] Each zone (`forest`, `ruins`, `cave`) has intended parallax/background treatment.
- [ ] Platforms remain readable in combat scenes over final backgrounds.

## Audio Signoff

- [ ] `attack` cue plays expected SFX.
- [ ] `enemy_attack` cue plays expected SFX.
- [ ] `hit` cue plays expected SFX.
- [ ] `enemy_hurt` cue plays expected SFX.
- [ ] Optional BGM loop plays when present; build remains stable if missing.
- [ ] No runtime crashes or blockers when audio decoding fails.

## Runtime Hardening Signoff

- [ ] Startup logs asset readiness summary with required/optional status.
- [ ] Missing optional assets degrade gracefully.
- [ ] `?assetStrict=1` fails loudly when required assets are missing/invalid.
- [ ] Asset contract and file paths are synchronized with runtime loaders.

## Compliance Signoff

- [ ] Attribution register updated in `docs/ASSET_ATTRIBUTION.md`.
- [ ] Required third-party terms/license files are present in repository.
- [ ] Final release asset set reviewed for redistribution compliance.
