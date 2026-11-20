import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createSpeechRouter } from './speech.mjs';

test('Azure synthesizes once for simultaneous requests for an identical clip', { timeout: 5000 }, async (t) => {
  const httpFetch = globalThis.fetch;
  const requests = [];
  let markSynthesisStarted;
  const synthesisStarted = new Promise((resolve) => { markSynthesisStarted = resolve; });
  let finishFirstSynthesis;
  const firstAudioReady = new Promise((resolve) => { finishFirstSynthesis = resolve; });
  let markSecondBodyRead;
  const secondBodyRead = new Promise((resolve) => { markSecondBodyRead = resolve; });
  const audio = Uint8Array.of(1, 2, 3, 4);
  const voiceId = 'en-US-JennyNeural';
  const alternateVoice = 'en-US-GuyNeural';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.endsWith('/voices/list')) {
      return Response.json([voiceId, alternateVoice].map((ShortName) => ({
        ShortName, Locale: 'en-US', LocalName: ShortName, VoiceType: 'Neural',
      })));
    }
    assert.equal(options.headers['X-Microsoft-OutputFormat'], 'audio-24khz-48kbitrate-mono-mp3');
    requests.push(options.body);
    if (requests.length === 1) {
      markSynthesisStarted();
      await firstAudioReady;
    }
    return new Response(audio);
  });

  const app = express();
  const router = createSpeechRouter({ AZURE_SPEECH_KEY: 'test-key', AZURE_SPEECH_REGION: 'southeastasia' });
  let incoming = 0;
  app.use('/speech', (req, _res, next) => {
    incoming += 1;
    next();
    if (incoming === 2) req.once('end', markSecondBodyRead);
  });
  app.use('/speech', router);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => {
    finishFirstSynthesis();
    server.close();
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/speech/synthesize';
  const speak = (overrides = {}) => httpFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello & welcome', voiceId, language: 'en', rate: 1, ...overrides }),
  });
  const first = speak();
  await synthesisStarted;
  const simultaneous = speak({ text: '  Hello & welcome  ' });
  await secondBodyRead;
  finishFirstSynthesis();
  const responses = await Promise.all([first, simultaneous, speak()]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), audio);
  }
  assert.equal(requests.length, 1);
  assert.match(requests[0], /Hello &amp; welcome/);
  assert.doesNotMatch(requests[0], /<prosody/);

  const slower = await speak({ rate: 0.85 });
  assert.equal(slower.status, 200);
  await slower.arrayBuffer();
  const otherVoice = await speak({ voiceId: alternateVoice });
  assert.equal(otherVoice.status, 200);
  await otherVoice.arrayBuffer();
  assert.equal(requests.length, 3);
  assert.match(requests[1], /rate="-15%"/);
  assert.ok(requests[2].includes(alternateVoice));
});
