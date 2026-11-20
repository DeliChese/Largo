import type { LanguageCode } from '../types/vocab';

const CACHE_NAME = 'largo-azure-audio-v1';
const MAX_CACHED_CLIPS = 512;
const MAX_CLIP_BYTES = 128 * 1024;

interface SpeechClipRequest {
  text: string;
  language: LanguageCode;
  voiceId: string;
  rate: number;
}

async function getCacheEntry({ voiceId, language, text, rate }: SpeechClipRequest) {
  if (!globalThis.caches || !globalThis.crypto?.subtle) return undefined;
  try {
    const identity = JSON.stringify([voiceId, language, text, Math.round((rate - 1) * 100)]);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
    const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const url = new URL('/__largo/speech/' + id, window.location.origin).href;
    return { cache: await caches.open(CACHE_NAME), url };
  } catch {
    return undefined;
  }
}

export async function loadSpeechClip(
  context: AudioContext, request: SpeechClipRequest, signal: AbortSignal,
): Promise<AudioBuffer> {
  const speech = { ...request, text: request.text.trim() };
  const entry = await getCacheEntry(speech);
  if (entry) {
    try {
      const cached = await entry.cache.match(entry.url);
      if (cached) return await context.decodeAudioData(await cached.arrayBuffer());
    } catch {
      await entry.cache.delete(entry.url).catch(() => {});
    }
  }

  if (signal.aborted || !navigator.onLine) throw new Error('Speech synthesis unavailable');
  const response = await fetch('/api/speech/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(speech),
    signal,
  });
  const mimeType = response.headers.get('content-type');
  if (!response.ok || !mimeType?.startsWith('audio/')) throw new Error('Speech synthesis unavailable');
  const bytes = await response.arrayBuffer();
  const storedBytes = entry && bytes.byteLength <= MAX_CLIP_BYTES ? bytes.slice(0) : undefined;
  const decoded = await context.decodeAudioData(bytes);

  if (entry && storedBytes) {
    try {
      await entry.cache.put(entry.url, new Response(storedBytes, { headers: { 'Content-Type': mimeType } }));
      const keys = await entry.cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_CACHED_CLIPS)).map((key) => entry.cache.delete(key)));
    } catch {
      // The decoded clip is still usable when browser storage is full or disabled.
    }
  }
  return decoded;
}

export async function clearSpeechClipCache() {
  await globalThis.caches?.delete(CACHE_NAME).catch(() => {});
}
