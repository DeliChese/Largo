import type { EnglishLocale, LanguageCode, SpeechVoices } from '../types/vocab';
import { getEnglishLocale, getSpeechVoice } from './englishStudy';
import { loadSpeechClip } from './speechClipCache';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public volume = 0.45;

  getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
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
    if (!this.enabled) return;
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

function offlineVoice(voices: readonly SpeechSynthesisVoice[], language: LanguageCode | EnglishLocale) {
  const locale = language === 'en-GB' || language === 'en-US' ? language : LANG_LOCALE_MAP[language];
  return voices.find((voice) => voice.localService && voice.lang.toLowerCase() === locale.toLowerCase());
}

export function hasOfflinePronunciation(voices: readonly SpeechSynthesisVoice[], language: LanguageCode | EnglishLocale): boolean {
  return Boolean(offlineVoice(voices, language));
}

function deviceUtterance(text: string, locale: string, rate: number, voice: SpeechSynthesisVoice | null) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = rate;
  utterance.voice = voice;
  return utterance;
}

let selectedVoices: SpeechVoices = {};
let selectedEnglishLocale: EnglishLocale | undefined;
let currentPlayback: {
  controller: AbortController;
  source?: AudioBufferSourceNode;
  onEnd?: () => void;
} | null = null;

export function setPronunciationVoices(voices: SpeechVoices = {}, englishLocale?: EnglishLocale) {
  selectedVoices = voices;
  selectedEnglishLocale = englishLocale;
}

export function stopPronunciation() {
  const playback = currentPlayback;
  currentPlayback = null;
  playback?.controller.abort();
  playback?.source?.stop();
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  playback?.onEnd?.();
}

export function speakLocalPronunciation(text: string, language: LanguageCode | EnglishLocale, rate: number): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return false;
  const voice = offlineVoice(window.speechSynthesis.getVoices(), language);
  if (!voice) return false;
  try {
    stopPronunciation();
    window.speechSynthesis.speak(deviceUtterance(text, voice.lang, rate, voice));
    return true;
  } catch {
    return false;
  }
}

export function speakPronunciation(
  text: string,
  voiceLanguage: LanguageCode | EnglishLocale = 'en',
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onFallback?: () => void,
): boolean {
  if (typeof window === 'undefined' || !text.trim()) return false;
  const explicitLocale = voiceLanguage === 'en-GB' || voiceLanguage === 'en-US' ? voiceLanguage : undefined;
  const language = voiceLanguage === 'en-GB' || voiceLanguage === 'en-US' ? 'en' : voiceLanguage;
  const englishLocale = explicitLocale ?? selectedEnglishLocale;
  const targetLocale = language === 'en'
    ? getEnglishLocale({ englishLocale, speechVoices: selectedVoices })
    : LANG_LOCALE_MAP[language];
  stopPronunciation();
  const playback: NonNullable<typeof currentPlayback> = { controller: new AbortController(), onEnd };
  currentPlayback = playback;

  const finish = () => {
    if (currentPlayback !== playback) return;
    currentPlayback = null;
    onEnd?.();
  };

  function speakOnDevice() {
    if (!window.speechSynthesis) {
      finish();
      return false;
    }
    try {
      const voices = window.speechSynthesis.getVoices();
      const exactVoice = voices.find((voice) => voice.lang.toLowerCase() === targetLocale.toLowerCase());
      const relatedVoice = language === 'en' ? undefined : voices.find((voice) => voice.lang.toLowerCase().startsWith(language + '-'));
      const utterance = deviceUtterance(text, targetLocale, rate, exactVoice ?? relatedVoice ?? null);
      utterance.onstart = () => { if (currentPlayback === playback) onStart?.(); };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      finish();
      return false;
    }
  }

  const voiceId = getSpeechVoice(selectedVoices, language, englishLocale);
  if (!voiceId) return speakOnDevice();

  void (async () => {
    const timeout = window.setTimeout(() => playback.controller.abort(), 15_000);
    try {
      const context = soundEngine.getContext();
      if (!context) throw new Error('Audio playback unavailable');
      const buffer = await loadSpeechClip(context, { text, language, rate, voiceId }, playback.controller.signal);
      if (currentPlayback !== playback) return;
      if (context.state !== 'running') throw new Error('Audio playback blocked');
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.onended = finish;
      source.connect(context.destination);
      source.start();
      playback.source = source;
      onStart?.();
    } catch {
      if (currentPlayback !== playback) return;
      onFallback?.();
      speakOnDevice();
    } finally {
      window.clearTimeout(timeout);
    }
  })();
  return true;
}
