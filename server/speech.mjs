import express from 'express';

const VOICE_CACHE_MS = 6 * 60 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 1000;
const SYNTHESIS_LIMIT = 90;
const MAX_CACHED_CLIPS = 256;
const MAX_CLIP_BYTES = 128 * 1024;
const SUPPORTED_LANGUAGES = new Set(['en', 'zh', 'ja', 'fr', 'ko', 'es']);

const escapeXml = (text) => text.replace(/[<>&"']/g, (character) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);

export function createSpeechRouter(env) {
  const router = express();
  router.disable('x-powered-by');
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim().toLowerCase();
  let catalog;
  let loadingCatalog;
  let windowStartedAt = 0;
  let synthesisCount = 0;
  const audioCache = new Map();
  const pendingAudio = new Map();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!key || !region || !/^[a-z0-9]{2,32}$/.test(region)) {
      res.status(503).json({ error: 'not_configured' });
      return;
    }
    next();
  });

  async function azureRequest(path, options = {}) {
    const result = await fetch('https://' + region + '.tts.speech.microsoft.com/cognitiveservices' + path, {
      ...options,
      headers: { ...options.headers, 'Ocp-Apim-Subscription-Key': key },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!result.ok) throw new Error('Azure Speech request failed');
    return result;
  }

  function getVoices() {
    if (catalog && Date.now() < catalog.expiresAt) return Promise.resolve(catalog.voices);
    loadingCatalog ??= (async () => {
      const data = await (await azureRequest('/voices/list')).json();
      const voices = data.flatMap(({ ShortName, Locale, LocalName, DisplayName, VoiceType }) => {
        if (VoiceType !== 'Neural' || typeof ShortName !== 'string' || typeof Locale !== 'string' ||
          !SUPPORTED_LANGUAGES.has(Locale.split('-')[0].toLowerCase())) return [];
        return [{ id: ShortName, locale: Locale, name: LocalName || DisplayName || ShortName }];
      });
      catalog = { expiresAt: Date.now() + VOICE_CACHE_MS, voices };
      return voices;
    })().finally(() => { loadingCatalog = undefined; });
    return loadingCatalog;
  }

  router.get('/voices', async (_req, res) => {
    try {
      res.json({ voices: await getVoices() });
    } catch {
      res.status(502).json({ error: 'azure_unavailable' });
    }
  });

  async function synthesize({ voiceId, language, text, percent }, identity) {
    const voice = (await getVoices()).find(({ id, locale }) => id === voiceId && locale.split('-')[0].toLowerCase() === language);
    if (!voice) return { status: 400, error: 'unknown_voice' };

    const now = Date.now();
    if (now - windowStartedAt >= REQUEST_WINDOW_MS) {
      windowStartedAt = now;
      synthesisCount = 0;
    }
    if (synthesisCount >= SYNTHESIS_LIMIT) {
      const retryAfter = Math.ceil((windowStartedAt + REQUEST_WINDOW_MS - now) / 1000);
      return { status: 429, error: 'rate_limited', retryAfter };
    }
    synthesisCount += 1;

    const escaped = escapeXml(text);
    const body = percent === 0 ? escaped :
      '<prosody rate="' + (percent >= 0 ? '+' : '') + percent + '%">' + escaped + '</prosody>';
    const audio = await azureRequest('/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'Largo',
      },
      body: '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + escapeXml(voice.locale) +
        '"><voice name="' + escapeXml(voice.id) + '">' + body + '</voice></speak>',
    });
    const bytes = Buffer.from(await audio.arrayBuffer());
    if (bytes.length === 0) throw new Error('Azure returned an empty clip');
    if (bytes.length <= MAX_CLIP_BYTES) {
      audioCache.set(identity, bytes);
      if (audioCache.size > MAX_CACHED_CLIPS) audioCache.delete(audioCache.keys().next().value);
    }
    return { bytes };
  }

  router.post('/synthesize', express.json({ limit: '6kb' }), async (req, res) => {
    const { voiceId, language, text, rate } = req.body ?? {};
    if (!SUPPORTED_LANGUAGES.has(language) || typeof voiceId !== 'string' || voiceId.length > 120 ||
      typeof text !== 'string' || !text.trim() || text.length > 600 ||
      typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.5 || rate > 2) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    try {
      const percent = Math.round((rate - 1) * 100);
      const trimText = text.trim();
      const identity = JSON.stringify([voiceId, language, trimText, percent]);
      const cached = audioCache.get(identity);
      if (cached) {
        audioCache.delete(identity);
        audioCache.set(identity, cached);
        res.type('audio/mpeg').send(cached);
        return;
      }

      let pending = pendingAudio.get(identity);
      if (!pending) {
        pending = synthesize({ voiceId, language, text: trimText, percent }, identity)
          .finally(() => pendingAudio.delete(identity));
        pendingAudio.set(identity, pending);
      }
      const result = await pending;
      if (result.error) {
        if (result.retryAfter) res.set('Retry-After', String(result.retryAfter));
        res.status(result.status).json({ error: result.error });
      } else {
        res.type('audio/mpeg').send(result.bytes);
      }
    } catch {
      res.status(502).json({ error: 'azure_unavailable' });
    }
  });

  router.use((error, _req, res, _next) => {
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    res.status(status).json({ error: status === 500 ? 'server_error' : 'invalid_request' });
  });

  return router;
}
