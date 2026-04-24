// ============================================================
// WAYFINDER — AudioHooks.js
// File-backed SFX/BGM with graceful tone fallback.
// ============================================================

import { markAssetLoaded, markAssetMissing } from '../assets/assetContract.js';

let _ctx = null;
let _audioInitStarted = false;
let _audioInitDone = false;
let _bgmSource = null;
let _bgmStarted = false;

const SFX_PATH_BY_CUE = {
  attack: 'assets/audio/sfx_attack.wav',
  enemy_attack: 'assets/audio/sfx_enemy_attack.wav',
  hit: 'assets/audio/sfx_hit.wav',
  enemy_hurt: 'assets/audio/sfx_enemy_hurt.wav',
};

const BGM_MAIN_PATH = 'assets/audio/bgm_main.ogg';

/** @type {Map<string, AudioBuffer>} */
const _audioBuffers = new Map();

function getCtx() {
  if (_ctx) return _ctx;
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctx) return null;
  _ctx = new Ctx();
  return _ctx;
}

async function tryResumeCtx() {
  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Keep trying on later input-driven frames.
    }
  }
  return ctx;
}

async function loadAudioBuffer(path) {
  const ctx = getCtx();
  if (!ctx) {
    markAssetMissing(path, 'WebAudio unavailable');
    return;
  }
  try {
    const res = await fetch(path);
    if (!res.ok) {
      markAssetMissing(path, `HTTP ${res.status}`);
      return;
    }
    const data = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(data.slice(0));
    _audioBuffers.set(path, buf);
    markAssetLoaded(path, `decoded ${buf.duration.toFixed(2)}s`);
  } catch (err) {
    markAssetMissing(path, `decode failed: ${String(err)}`);
  }
}

function startAudioInit() {
  if (_audioInitStarted) return;
  _audioInitStarted = true;
  const ctx = getCtx();
  if (!ctx) {
    for (const path of Object.values(SFX_PATH_BY_CUE)) {
      markAssetMissing(path, 'WebAudio unavailable');
    }
    markAssetMissing(BGM_MAIN_PATH, 'WebAudio unavailable');
    _audioInitDone = true;
    return;
  }
  const loads = [
    ...Object.values(SFX_PATH_BY_CUE).map(loadAudioBuffer),
    loadAudioBuffer(BGM_MAIN_PATH),
  ];
  Promise.allSettled(loads).finally(() => { _audioInitDone = true; });
}

function playTone(freq, duration, gain = 0.025, type = 'square') {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

function playBuffer(path, gain = 0.35) {
  const ctx = getCtx();
  if (!ctx) return false;
  const buf = _audioBuffers.get(path);
  if (!buf) return false;
  const src = ctx.createBufferSource();
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.buffer = buf;
  src.connect(amp);
  amp.connect(ctx.destination);
  src.start();
  return true;
}

function ensureBgm() {
  if (_bgmStarted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const buf = _audioBuffers.get(BGM_MAIN_PATH);
  if (!buf) return;
  const src = ctx.createBufferSource();
  const amp = ctx.createGain();
  amp.gain.value = 0.18;
  src.buffer = buf;
  src.loop = true;
  src.connect(amp);
  amp.connect(ctx.destination);
  src.start();
  _bgmSource = src;
  _bgmStarted = true;
}

/**
 * Consume and play queued audio cues once.
 * @param {object} state
 */
export function flushAudioHooks(state) {
  // Initialize decode pipeline lazily; first interactive input frame can resume the context.
  startAudioInit();
  void tryResumeCtx().then(() => {
    if (_audioInitDone) ensureBgm();
  });
  if (!state._audioQueue || state._audioQueue.length === 0) return;
  for (const ev of state._audioQueue) {
    if (!ev || !ev.cue) continue;
    if (ev.cue === 'attack') {
      if (!playBuffer(SFX_PATH_BY_CUE.attack, 0.34)) {
        playTone(380, 0.05, 0.018, 'square');
      }
      continue;
    }
    if (ev.cue === 'enemy_attack') {
      if (!playBuffer(SFX_PATH_BY_CUE.enemy_attack, 0.36)) {
        playTone(220, 0.06, 0.017, 'sawtooth');
      }
      continue;
    }
    if (ev.cue === 'hit') {
      if (!playBuffer(SFX_PATH_BY_CUE.hit, 0.4)) {
        playTone(110, 0.04, 0.028, 'triangle');
        playTone(165, 0.06, 0.02, 'square');
      }
      continue;
    }
    if (ev.cue === 'enemy_hurt') {
      if (!playBuffer(SFX_PATH_BY_CUE.enemy_hurt, 0.32)) {
        playTone(145, 0.07, 0.02, 'triangle');
      }
    }
  }
  state._audioQueue.length = 0;
}

export function stopAudioHooks() {
  if (_bgmSource) {
    try {
      _bgmSource.stop();
    } catch {
      // no-op
    }
  }
  _bgmSource = null;
  _bgmStarted = false;
}

