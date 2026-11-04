import { haptic } from './telegram';

// Короткие звуки через Web Audio — без файлов.
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (!ctx) ctx = new AudioContext();
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sounds = {
  correct() {
    tone(660, 0, 0.12, 'triangle');
    tone(990, 0.1, 0.22, 'triangle');
  },
  wrong() {
    tone(220, 0, 0.18, 'sawtooth', 0.08);
    tone(180, 0.15, 0.25, 'sawtooth', 0.08);
  },
  tap() {
    tone(520, 0, 0.05, 'square', 0.04);
  },
  finish() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle'));
  },
  honk() {
    tone(330, 0, 0.18, 'square', 0.06);
    tone(392, 0, 0.18, 'square', 0.05);
  },
};

export function play(name: keyof typeof sounds, enabled: boolean) {
  haptic(name === 'correct' || name === 'wrong' ? name : 'tap');
  if (!enabled) return;
  try {
    sounds[name]();
  } catch {
    /* звук недоступен — не страшно */
  }
}

/** Озвучка реплик инструктора. */
export function speak(text: string, enabled: boolean) {
  if (!enabled || typeof speechSynthesis === 'undefined') return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 1.02;
    const ru = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ru'));
    if (ru) u.voice = ru;
    speechSynthesis.speak(u);
  } catch {
    /* нет синтеза речи */
  }
}
