import express from 'express';
import { parseChainSuggestion } from '../src/utils/wordChainRules.mjs';
import { deepSeekConnection } from './deepseek.mjs';
import { isLocalRequest } from './localRequest.mjs';

const MINUTE = 60_000;
const DAY = 1_440 * MINUTE;
const SYSTEM = 'Give one real common vocabulary item matching the language, starting character and allowed kind. No names. Return only JSON like {"term":"yellow","meaning":"màu vàng"}.';

function readInput(body) {
  if (!body || Object.keys(body).length !== 4 || body.consent !== true ||
      (body.mode !== 'word' && body.mode !== 'mixed') || typeof body.first !== 'string') return null;
  const valid = body.language === 'en' && /^[a-z]$/.test(body.first);
  return valid ? { language: 'en', mode: body.mode, first: body.first } : null;
}

export function createWordChainRouter(env, { request = fetch, now = Date.now } = {}) {
  const router = express();
  router.disable('x-powered-by');
  const connection = deepSeekConnection(env);
  const calls = [];
  const cache = new Map();
  let pending;
  let retryAt = 0;

  async function suggest({ language, mode, first }) {
    const { endpoint, communityLocal, key, model } = connection;
    const prompt = 'English, starts with ' + first +
      (mode === 'word' ? ', one word.' : ', word or short phrase.');
    const response = await request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(communityLocal ? {} : { Authorization: 'Bearer ' + key }) },
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({
        model, max_tokens: 64,
        ...(communityLocal ? { thinking: false, search: false }
          : { thinking: { type: 'disabled' }, response_format: { type: 'json_object' } }),
        messages: communityLocal ? [{ role: 'user', content: SYSTEM + '\n' + prompt }]
          : [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    const raw = await response.text();
    if (raw.length > 16_384) return null;
    const choice = JSON.parse(raw)?.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string' ||
        choice.message.content.length > 400) return null;
    return parseChainSuggestion(JSON.parse(choice.message.content), language, mode, first);
  }

  router.post('/', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!isLocalRequest(req)) return res.sendStatus(403);
    if (!connection) return res.sendStatus(503);
    next();
  }, express.json({ limit: '256b' }), async (req, res) => {
    const input = readInput(req.body);
    if (!input) return res.sendStatus(400);
    const timestamp = now();
    const key = [input.language, input.mode, input.first].join(':');
    const cached = cache.get(key);
    if (cached?.expires > timestamp) return res.json(cached.entry);
    if (pending?.key === key) {
      const entry = await pending.result;
      return entry ? res.json(entry) : res.sendStatus(503);
    }

    if (pending || retryAt > timestamp) return res.sendStatus(503);
    while (calls.length && calls[0] <= timestamp - 30 * DAY) calls.shift();
    if (calls.length >= 120 || calls.filter((call) => call > timestamp - DAY).length >= 16 ||
        calls.filter((call) => call > timestamp - MINUTE).length >= 4) return res.sendStatus(429);

    calls.push(timestamp);
    const result = suggest(input).catch(() => null);
    pending = { key, result };
    const entry = await result;
    pending = undefined;
    if (!entry) {
      retryAt = now() + 10_000;
      return res.sendStatus(503);
    }
    cache.delete(key);
    if (cache.size >= 128) cache.delete(cache.keys().next().value);
    cache.set(key, { entry, expires: now() + DAY });
    return res.json(entry);
  });
  router.use((error, _req, res, _next) => res.sendStatus(error.status === 413 ? 413 : 400));
  return router;
}
