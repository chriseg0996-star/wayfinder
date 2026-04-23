// ============================================================
// WAYFINDER — AudioHooks.js
// Minimal SFX hooks. Consumes queued cues from state._audioQueue.
// Safe no-op when WebAudio is unavailable / blocked.
// ============================================================

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctx) return null;
  _ctx = new Ctx();
  return _ctx;
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

/**
 * Consume and play queued audio cues once.
 * @param {object} state
 */
export function flushAudioHooks(state) {
  if (!state._audioQueue || state._audioQueue.length === 0) return;
  for (const ev of state._audioQueue) {
    if (!ev || !ev.cue) continue;
    if (ev.cue === 'attack') {
      playTone(380, 0.05, 0.018, 'square');
      continue;
    }
    if (ev.cue === 'enemy_attack') {
      playTone(220, 0.06, 0.017, 'sawtooth');
      continue;
    }
    if (ev.cue === 'hit') {
      playTone(110, 0.04, 0.028, 'triangle');
      playTone(165, 0.06, 0.02, 'square');
      continue;
    }
    if (ev.cue === 'enemy_hurt') {
      playTone(145, 0.07, 0.02, 'triangle');
    }
  }
  state._audioQueue.length = 0;
}

