"use client";

// ─── Realistic mechanical keyboard sounds via Web Audio API ───────────────────
// Simulates a physical key press using layered noise bursts + filtered transients.
// No audio assets needed — fully synthesized.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

/** White noise burst filtered to a specific frequency band — core of the click */
function noiseClick(
  audio: AudioContext,
  startTime: number,
  durationMs: number,
  lowHz: number,
  highHz: number,
  gain: number
) {
  const bufLen = Math.ceil((audio.sampleRate * durationMs) / 1000);
  const buffer = audio.createBuffer(1, bufLen, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const source = audio.createBufferSource();
  source.buffer = buffer;

  const bandpass = audio.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = (lowHz + highHz) / 2;
  bandpass.Q.value = (lowHz + highHz) / 2 / (highHz - lowHz);

  const gainNode = audio.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);

  source.connect(bandpass).connect(gainNode).connect(audio.destination);
  source.start(startTime);
  source.stop(startTime + durationMs / 1000 + 0.01);
}

/** A short tonal transient — adds the "clicky" pitched component */
function toneTransient(
  audio: AudioContext,
  startTime: number,
  freq: number,
  durationMs: number,
  gain: number,
  type: OscillatorType = "sine"
) {
  const osc = audio.createOscillator();
  const gainNode = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + durationMs / 1000);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);
  osc.connect(gainNode).connect(audio.destination);
  osc.start(startTime);
  osc.stop(startTime + durationMs / 1000 + 0.01);
}

// ─── Sound types ──────────────────────────────────────────────────────────────

/** Mechanical clicky key sound — Cherry MX Blue style */
function mechanicalClick(audio: AudioContext, t: number, pitch = 1.0) {
  // Initial click transient (high-freq noise burst)
  noiseClick(audio, t, 8, 3000 * pitch, 8000 * pitch, 0.35);
  // Body thud (mid-freq)
  noiseClick(audio, t, 25, 500 * pitch, 1800 * pitch, 0.18);
  // Pitched click component
  toneTransient(audio, t, 1100 * pitch, 20, 0.04, "square");
  // Release thud (slightly delayed)
  noiseClick(audio, t + 0.045, 12, 300 * pitch, 900 * pitch, 0.08);
}

/** Soft quiet key — Mac Magic Keyboard / laptop style */
function softClick(audio: AudioContext, t: number, pitch = 1.0) {
  // Gentle thud
  noiseClick(audio, t, 18, 200 * pitch, 1200 * pitch, 0.12);
  // Very soft high transient
  noiseClick(audio, t, 6, 2000 * pitch, 5000 * pitch, 0.06);
  // Subtle tone
  toneTransient(audio, t, 600 * pitch, 15, 0.018, "sine");
}

/** Error sound — low dull thud */
function errorThud(audio: AudioContext, t: number) {
  noiseClick(audio, t, 40, 80, 400, 0.2);
  toneTransient(audio, t, 180, 60, 0.05, "sawtooth");
}

// ─── Current sound type ───────────────────────────────────────────────────────

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
  // Slight random pitch variation so no two keystrokes sound identical
  const pitch = 0.9 + Math.random() * 0.22;
  if (currentSoundType === "mechanical") {
    mechanicalClick(audio, t, pitch);
  } else {
    softClick(audio, t, pitch);
  }
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
  // Pleasant ascending chord
  [523, 659, 784, 1047].forEach((f, i) => {
    const at = t + i * 0.08;
    toneTransient(audio, at, f, 300, 0.06, "sine");
    noiseClick(audio, at, 15, f * 0.8, f * 1.5, 0.03);
  });
}
