import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createWordChainRouter } from './wordChain.mjs';

const env = {
  DEEPSEEK_AI_ENABLED: 'true',
  DEEPSEEK_API_KEY: 'mock-server-secret',
};

const completion = (term, meaning = 'nghĩa mẫu') => Response.json({
  choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ term, meaning }) } }],
});

async function startApi(t, options, config = env) {
  const app = express();
  app.use('/api/ai/word-chain', createWordChainRouter(config, options));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => server.close());
  const origin = 'http://127.0.0.1:' + server.address().port;
  return (body = {}, headers = {}) => fetch(origin + '/api/ai/word-chain', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ language: 'en', mode: 'word', first: 'y', consent: true, ...body }),
  });
}

test('blocks foreign and invalid requests and reuses a bounded, non-thinking completion', async (t) => {
  let calls = 0;
  const post = await startApi(t, { request: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer mock-server-secret');
    const payload = JSON.parse(options.body);
    assert.equal(payload.max_tokens, 64);
    assert.deepEqual(payload.thinking, { type: 'disabled' });
    assert.deepEqual(payload.messages.at(-1), { role: 'user', content: 'English, starts with y, one word.' });
    return completion('yellow', 'màu vàng');
  } });
  assert.equal((await post({}, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await post({}, { 'X-Forwarded-For': '127.0.0.1' })).status, 403);
  assert.equal((await post({ consent: false })).status, 400);
  assert.equal((await post({ moves: ['exchange', 'entry'] })).status, 400);
  assert.equal((await post({ first: 'yy' })).status, 400);
  assert.equal((await post({ first: 'y'.repeat(300) })).status, 413);
  assert.equal(calls, 0);

  const results = await Promise.all([post(), post(), post()]);
  for (const result of results) assert.deepEqual(await result.json(), { term: 'yellow', meaning: 'màu vàng' });
  assert.equal(calls, 1);
  const disabled = await startApi(t, { request: () => assert.fail('provider called') }, {});
  assert.equal((await disabled()).status, 503);
});

test('rejects unusable moves, cools down after failure and limits paid calls per minute', async (t) => {
  let time = 0;
  let calls = 0;
  const post = await startApi(t, {
    now: () => time,
    request: async () => completion(['apple', 'yellow', 'apple', 'banana'][calls++]),
  });
  assert.equal((await post()).status, 503);
  assert.equal((await post()).status, 503);
  assert.equal(calls, 1);
  time = 10_001;
  assert.equal((await post()).status, 200);
  assert.equal((await post({ first: 'a' })).status, 200);
  assert.equal((await post({ first: 'b' })).status, 200);
  assert.equal((await post({ first: 'c' })).status, 429);
  assert.equal((await post()).status, 200);
  assert.equal(calls, 4);
});
