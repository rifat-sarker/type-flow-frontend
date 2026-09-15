"use client";

// ─── Keyboard click sounds, synthesized via Web Audio (no audio assets) ───────
// A real key click is almost entirely broadband noise with a very fast decay -
// it has no sustained pitch. Earlier versions layered square-wave oscillators on
// top, which is what made them sound like electronic beeps instead of plastic.
// So: noise through a resonant filter, steep envelope, two short events
// (the press "tick" and the quieter bottom-out "thock").

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

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

/** One second of white noise, generated once and reused for every click. */
function getNoise(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = audio.sampleRate;
    noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

interface ClickOpts {
  /** Filter centre in Hz - high = sharp tick, low = dull thock. */
  freq: number;
  /** Resonance. Higher makes it more "plasticky". */
  q: number;
  /** Seconds. Real clicks are 8-40ms. */
  decay: number;
  gain: number;
  /** Offset from `t` in seconds. */
  delay?: number;
  type?: BiquadFilterType;
}

function click(audio: AudioContext, t: number, o: ClickOpts) {
  const start = t + (o.delay ?? 0);
  const src = audio.createBufferSource();
  src.buffer = getNoise(audio);
  // Random offset into the noise so repeated presses aren't identical.
  const offset = Math.random() * 0.5;

  const filter = audio.createBiquadFilter();
  filter.type = o.type ?? "bandpass";
  filter.frequency.value = o.freq;
  filter.Q.value = o.q;

  const g = audio.createGain();
  // Near-instant attack, exponential decay - this envelope is what reads as a
  // physical impact rather than a tone.
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(o.gain, start + 0.0008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + o.decay);

  src.connect(filter).connect(g).connect(audio.destination);
  src.start(start, offset, o.decay + 0.02);
  src.stop(start + o.decay + 0.02);
}

// ─── Voices ───────────────────────────────────────────────────────────────────

/** Clicky mechanical switch: bright tick, plastic body, quick bottom-out. */
function mechanicalClick(audio: AudioContext, t: number, p: number) {
  click(audio, t, { freq: 4200 * p, q: 1.1, decay: 0.012, gain: 0.5 });   // tick
  click(audio, t, { freq: 1500 * p, q: 2.2, decay: 0.022, gain: 0.32 });  // body
  click(audio, t, { freq: 420 * p, q: 1.6, decay: 0.03, gain: 0.16 });    // thock
  click(audio, t, { freq: 900 * p, q: 1.4, decay: 0.016, gain: 0.12, delay: 0.028 }); // bottom-out
}

/** Laptop / Magic Keyboard: softer, duller, shorter travel. */
function softClick(audio: AudioContext, t: number, p: number) {
  click(audio, t, { freq: 2600 * p, q: 0.9, decay: 0.008, gain: 0.2 });
  click(audio, t, { freq: 700 * p, q: 1.5, decay: 0.018, gain: 0.18 });
  click(audio, t, { freq: 300 * p, q: 1.2, decay: 0.022, gain: 0.1 });
}

/** Wrong key: dull low thud, clearly different from a normal press. */
function errorThud(audio: AudioContext, t: number) {
  click(audio, t, { freq: 180, q: 1.1, decay: 0.05, gain: 0.34, type: "lowpass" });
  click(audio, t, { freq: 320, q: 2.0, decay: 0.035, gain: 0.16 });
}

// ─── State ────────────────────────────────────────────────────────────────────

export type SoundType = "mechanical" | "soft" | "off";
let currentSoundType: SoundType = "mechanical";

export function setSoundType(type: SoundType) {
  currentSoundType = type;
}

export function getSoundType(): SoundType {
  return currentSoundType;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function playKeySound() {
  if (currentSoundType === "off") return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  // Small pitch jitter so a fast run of keys doesn't sound like a machine gun.
  const p = 0.93 + Math.random() * 0.16;
  if (currentSoundType === "mechanical") mechanicalClick(audio, t, p);
  else softClick(audio, t, p);
}

export function playErrorSound() {
  if (currentSoundType === "off") return;
  const audio = getCtx();
  if (!audio) return;
  errorThud(audio, audio.currentTime);
}

export function playFinishSound() {
  if (currentSoundType === "off") return;
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  // Short rising run of filtered clicks - a chime, but in the same "physical" voice.
  [900, 1350, 1800].forEach((f, i) => {
    click(audio, t, { freq: f, q: 7, decay: 0.16, gain: 0.16, delay: i * 0.075 });
  });
}
