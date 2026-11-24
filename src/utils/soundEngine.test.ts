import assert from 'node:assert/strict';
import test from 'node:test';
import type { EnglishLocale } from '../types/vocab';
import { setPronunciationVoices, speakPronunciation, stopPronunciation } from './soundEngine';

test('English playback chooses an independent voice for each accent and falls back without switching accents', { timeout: 5000 }, async (t) => {
  const devicePlays: string[][] = [];
  const azureRequests: string[][] = [];
  const azurePlays: number[] = [];
  const british = { lang: 'en-GB', localService: true };
  const american = { lang: 'en-US', localService: true };
  let deviceVoices = [american];
  let azureAvailable = true;

  class Utterance {
    lang = '';
    voice?: { lang: string };
    onstart?: () => void;
    text: string;
    constructor(text: string) { this.text = text; }
  }
  class AudioContext {
    state = 'running';
    async decodeAudioData(bytes: ArrayBuffer) { return new Uint8Array(bytes)[0]; }
    createBufferSource() {
      return {
        buffer: 0,
        connect() {},
        start() { azurePlays.push(this.buffer); },
        stop() {},
      };
    }
  }
  const browserGlobals = {
    window: {
      AudioContext, setTimeout, clearTimeout,
      speechSynthesis: {
        getVoices: () => deviceVoices,
        cancel() {},
        speak(utterance: Utterance) {
          devicePlays.push([utterance.text, utterance.lang, utterance.voice!.lang]);
          utterance.onstart?.();
        },
      },
    },
    SpeechSynthesisUtterance: Utterance,
    navigator: { onLine: true },
  };
  const previous = Object.getOwnPropertyDescriptors(globalThis);
  for (const [key, value] of Object.entries(browserGlobals)) Object.defineProperty(globalThis, key, { value, configurable: true });
  t.after(() => {
    stopPronunciation();
    setPronunciationVoices();
    for (const key of Object.keys(browserGlobals)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const { text, language, voiceId } = JSON.parse(String(init.body));
    assert.equal(language, 'en');
    azureRequests.push([text, voiceId]);
    return azureAvailable
      ? new Response(Uint8Array.of(voiceId.startsWith('en-GB') ? 1 : 2), { headers: { 'Content-Type': 'audio/mpeg' } })
      : new Response(null, { status: 503 });
  });
  const play = (text: string, locale: EnglishLocale) => new Promise<'playing' | 'unavailable'>((resolve) => {
    speakPronunciation(text, locale, 1, () => resolve('playing'), undefined, undefined, () => resolve('unavailable'));
  });

  assert.equal(await play('colour', 'en-GB'), 'playing');
  assert.equal(await play('color', 'en-US'), 'playing');
  assert.deepEqual(azureRequests, [['colour', 'en-GB-SoniaNeural']]);
  assert.deepEqual(devicePlays, [['color', 'en-US', 'en-US']]);

  setPronunciationVoices({ en: 'en-GB-RyanNeural', 'en-US': 'en-US-JennyNeural' });
  assert.equal(await play('colour', 'en-GB'), 'playing');
  assert.equal(await play('color', 'en-US'), 'playing');
  assert.deepEqual(azureRequests.slice(1), [['colour', 'en-GB-RyanNeural'], ['color', 'en-US-JennyNeural']]);
  assert.deepEqual(azurePlays, [1, 1, 2]);

  azureAvailable = false;
  assert.equal(await play('colour', 'en-GB'), 'unavailable');
  assert.deepEqual(devicePlays, [['color', 'en-US', 'en-US']]);
  deviceVoices = [american, british];
  assert.equal(await play('colour', 'en-GB'), 'playing');
  assert.deepEqual(devicePlays[1], ['colour', 'en-GB', 'en-GB']);
});
