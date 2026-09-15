"use client";

// One keystroke sound, synthesized - the short bright click that typing sites
// (Monkeytype et al) default to. No variants, no assets: just on or off.

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function getNoise(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = audio.sampleRate;
    noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

interface Layer {
  freq: number;
  q: number;
  decay: number;
  gain: number;
  type?: BiquadFilterType;
  delay?: number;
}

function burst(audio: AudioContext, t: number, l: Layer) {
  const start = t + (l.delay ?? 0);
  const src = audio.createBufferSource();
  src.buffer = getNoise(audio);

  const filter = audio.createBiquadFilter();
  filter.type = l.type ?? "bandpass";
  filter.frequency.value = l.freq;
  filter.Q.value = l.q;

  const g = audio.createGain();
  // Instant attack + exponential decay is what reads as an impact rather than a tone.
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(l.gain, start + 0.0006);
  g.gain.exponentialRampToValueAtTime(0.0001, start + l.decay);

  src.connect(filter).connect(g).connect(audio.destination);
  src.start(start, Math.random() * 0.5, l.decay + 0.02);
  src.stop(start + l.decay + 0.02);
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on) getCtx(); // unlock audio on the click that turned it on
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playKeySound() {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  // Slight pitch jitter so a fast run of keys doesn't sound mechanical-repetitive.
  const p = 0.94 + Math.random() * 0.13;
  burst(audio, t, { freq: 3200 * p, q: 1.0, decay: 0.011, gain: 0.34 });
  burst(audio, t, { freq: 1200 * p, q: 1.8, decay: 0.018, gain: 0.2 });
  burst(audio, t, { freq: 420 * p, q: 1.4, decay: 0.024, gain: 0.1 });
}

export function playErrorSound() {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  burst(audio, t, { freq: 190, q: 1.1, decay: 0.045, gain: 0.3, type: "lowpass" });
  burst(audio, t, { freq: 330, q: 2.0, decay: 0.03, gain: 0.14 });
}

export function playFinishSound() {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  [900, 1350, 1800].forEach((f, i) => {
    burst(audio, t, { freq: f, q: 7, decay: 0.15, gain: 0.15, delay: i * 0.07 });
  });
}
