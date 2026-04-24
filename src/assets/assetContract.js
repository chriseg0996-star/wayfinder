// ============================================================
// WAYFINDER — Asset contract + runtime readiness tracking
// Single source of truth for expected release asset paths.
// ============================================================

const STATUS_PENDING = 'pending';
const STATUS_LOADED = 'loaded';
const STATUS_MISSING = 'missing';
const STATUS_INVALID = 'invalid';

/**
 * @typedef {'sprite'|'background'|'tile'|'audio'} AssetKind
 */

/**
 * @typedef {{
 *   id: string,
 *   path: string,
 *   kind: AssetKind,
 *   required: boolean,
 *   notes?: string,
 *   minPx?: { w: number, h: number }
 * }} AssetSpec
 */

/**
 * Release contract. Optional assets keep the build playable when absent.
 * Required assets can be enforced with ?assetStrict=1.
 * @type {AssetSpec[]}
 */
export const RELEASE_ASSET_CONTRACT = [
  { id: 'playerSheet', path: 'assets/sprites/player.png', kind: 'sprite', required: true, notes: 'Player animation sheet' },
  { id: 'slimeSheet', path: 'assets/sprites/slime.png', kind: 'sprite', required: true, notes: 'Slime animation sheet' },
  { id: 'archerSheet', path: 'assets/sprites/archer.png', kind: 'sprite', required: true, notes: 'Ranged enemy animation sheet' },
  { id: 'bruteSheet', path: 'assets/sprites/brute.png', kind: 'sprite', required: true, notes: 'Heavy enemy animation sheet' },
  { id: 'parallaxFar', path: 'assets/parallax/far.png', kind: 'background', required: true, notes: 'Far depth layer' },
  { id: 'parallaxMid', path: 'assets/parallax/mid.png', kind: 'background', required: true, notes: 'Mid depth layer' },
  { id: 'parallaxNear', path: 'assets/parallax/near.png', kind: 'background', required: true, notes: 'Near depth layer' },
  { id: 'groundTile', path: 'assets/tiles/ground.png', kind: 'tile', required: true, notes: 'Platform tile texture' },
  { id: 'sfxAttack', path: 'assets/audio/sfx_attack.wav', kind: 'audio', required: true, notes: 'Player attack SFX' },
  { id: 'sfxEnemyAttack', path: 'assets/audio/sfx_enemy_attack.wav', kind: 'audio', required: true, notes: 'Enemy attack SFX' },
  { id: 'sfxHit', path: 'assets/audio/sfx_hit.wav', kind: 'audio', required: true, notes: 'Damage impact SFX' },
  { id: 'sfxEnemyHurt', path: 'assets/audio/sfx_enemy_hurt.wav', kind: 'audio', required: true, notes: 'Enemy hurt SFX' },
  { id: 'bgmMain', path: 'assets/audio/bgm_main.ogg', kind: 'audio', required: false, notes: 'Primary BGM loop' },
];

/**
 * @type {Map<string, { spec: AssetSpec, status: string, detail: string }>}
 */
const _assetStatus = new Map();

/**
 * @param {AssetSpec[]} contract
 */
export function initAssetContract(contract = RELEASE_ASSET_CONTRACT) {
  _assetStatus.clear();
  for (const spec of contract) {
    _assetStatus.set(spec.path, {
      spec,
      status: STATUS_PENDING,
      detail: 'awaiting load',
    });
  }
}

/**
 * @param {string} path
 * @param {string} [detail]
 */
export function markAssetLoaded(path, detail = 'loaded') {
  const e = _assetStatus.get(path);
  if (!e) return;
  e.status = STATUS_LOADED;
  e.detail = detail;
}

/**
 * @param {string} path
 * @param {string} [detail]
 */
export function markAssetMissing(path, detail = 'missing or failed to load') {
  const e = _assetStatus.get(path);
  if (!e) return;
  e.status = STATUS_MISSING;
  e.detail = detail;
}

/**
 * @param {string} path
 * @param {string} detail
 */
export function markAssetInvalid(path, detail) {
  const e = _assetStatus.get(path);
  if (!e) return;
  e.status = STATUS_INVALID;
  e.detail = detail;
}

/**
 * @returns {{
 *  total: number,
 *  loaded: number,
 *  missing: number,
 *  invalid: number,
 *  requiredMissing: string[],
 *  requiredInvalid: string[],
 *  entries: Array<{ path: string, kind: AssetKind, required: boolean, status: string, detail: string }>
 * }}
 */
export function getAssetReadinessReport() {
  const entries = [..._assetStatus.values()].map((v) => ({
    path: v.spec.path,
    kind: v.spec.kind,
    required: v.spec.required,
    status: v.status,
    detail: v.detail,
  }));
  const requiredMissing = entries
    .filter((e) => e.required && e.status === STATUS_MISSING)
    .map((e) => e.path);
  const requiredInvalid = entries
    .filter((e) => e.required && e.status === STATUS_INVALID)
    .map((e) => e.path);
  return {
    total: entries.length,
    loaded: entries.filter((e) => e.status === STATUS_LOADED).length,
    missing: entries.filter((e) => e.status === STATUS_MISSING).length,
    invalid: entries.filter((e) => e.status === STATUS_INVALID).length,
    requiredMissing,
    requiredInvalid,
    entries,
  };
}

/**
 * Emit startup diagnostics and optionally fail strict runs.
 * @param {{ strict?: boolean }} [opts]
 */
export function reportAssetReadiness(opts = {}) {
  const strict = !!opts.strict;
  const report = getAssetReadinessReport();
  const missing = report.requiredMissing.length;
  const invalid = report.requiredInvalid.length;
  const summary = `[assets] readiness ${report.loaded}/${report.total} loaded`;
  if (missing === 0 && invalid === 0) {
    console.log(`${summary} (required assets OK)`);
    return;
  }
  console.warn(`${summary}; required missing=${missing}, required invalid=${invalid}`);
  for (const e of report.entries) {
    if (e.status === STATUS_LOADED) continue;
    const level = e.required ? 'required' : 'optional';
    console.warn(`[assets] ${level} ${e.kind} ${e.path} -> ${e.status}: ${e.detail}`);
  }
  if (strict && (missing > 0 || invalid > 0)) {
    throw new Error('[assets] strict mode failed: required assets are missing or invalid');
  }
}

initAssetContract();
