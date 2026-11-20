import type { LanguageCode } from '../types/vocab';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public volume = 0.45;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', delay = 0, gainPeak = 0.25) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, gainPeak * this.volume), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCorrect() {
    this.playTone(523.25, 0.12, 'triangle', 0, 0.35);
    this.playTone(659.25, 0.16, 'triangle', 0.07, 0.35);
  }

  playCombo(combo: number) {
    const base = 523.25 * Math.pow(1.06, Math.min(combo, 10));
    this.playTone(base, 0.1, 'sine', 0, 0.3);
    this.playTone(base * 1.25, 0.15, 'triangle', 0.06, 0.35);
  }

  playIncorrect() {
    this.playTone(210, 0.14, 'sawtooth', 0, 0.16);
    this.playTone(175, 0.18, 'sawtooth', 0.08, 0.14);
  }

  playFlip() {
    this.playTone(340, 0.07, 'sine', 0, 0.14);
  }

  playLevelUp() {
    this.playTone(523.25, 0.12, 'triangle', 0, 0.3);
    this.playTone(659.25, 0.12, 'triangle', 0.09, 0.3);
    this.playTone(783.99, 0.16, 'triangle', 0.18, 0.35);
    this.playTone(1046.5, 0.28, 'triangle', 0.27, 0.4);
  }

  playTick() {
    this.playTone(880, 0.04, 'sine', 0, 0.1);
  }
}

export const soundEngine = new SoundEngine();

const LANG_LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  fr: 'fr-FR',
  ko: 'ko-KR',
  es: 'es-ES',
};

export function speakPronunciation(
  text: string,
  language: LanguageCode = 'en',
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onStart?.();
    setTimeout(() => onEnd?.(), 600);
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = LANG_LOCALE_MAP[language] || 'en-US';
    utterance.lang = targetLocale;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const exactVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(language.toLowerCase()));
    if (exactVoice) {
      utterance.voice = exactVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    onStart?.();
    window.speechSynthesis.speak(utterance);

    // Fallback timeout in case headless browser doesn't fire onend
    setTimeout(() => onEnd?.(), Math.max(900, text.length * 90));
    return true;
  } catch {
    onEnd?.();
    return false;
  }
}
