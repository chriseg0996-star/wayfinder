# Wardenfall Asset Attribution Register

This register tracks third-party asset sources bundled in the repository.

## Imported Source Licenses Present

| Source Folder | Terms File |
|---|---|
| `assets/Imports/Legacy Fantasy - Castle Prison` | `Terms.txt` |
| `assets/Imports/Legacy Fantasy - Debug Map` | `Terms.txt` |
| `assets/Imports/Legacy Fantasy - Sewer Canals` | `Terms.txt` |
| `assets/Imports/Legacy Fantasy - Kingdom Fortress - Update/Legacy Fantasy - Kingdom Fortress - Update` | `Terms.txt` |
| `assets/Imports/Legacy-Fantasy-VL.1 - Strange Temple 0.2` | `Terms.txt` |
| `assets/Imports/Legacy Enemy - Boar Warrior` | `Terms.txt` |
| `assets/Imports/Knight_player_1.4/Knight_player` | `Read_me.txt` |
| `assets/spritelib_gpl/spritelib_gpl` | `license.rtf` |

## Release Packaging Policy

- Keep source `Terms.txt` / `Read_me.txt` / license files in repository.
- Record each runtime-shipped file with its originating source pack before release cut.
- If a source requires explicit credit text, mirror that wording in release notes and about/legal section.
- Do not ship assets with unclear or missing redistribution terms.

## Signoff Checks

- [ ] Every file in `assets/sprites`, `assets/parallax`, `assets/tiles`, and `assets/audio` has a known origin.
- [ ] Every origin has a discoverable terms/license file in repo.
- [ ] Team verified no restricted/non-commercial-only assets are included in release build.
