import assert from 'node:assert/strict';
import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import express from 'express';
import { createSpeechRouter, loadSpeechEnvironment } from './speech.mjs';

test('Speech configuration reads a UTF-8 BOM and honors mode files and process overrides', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'largo-speech-'));
  const files = ['.env', '.env.local', '.env.development'].map((name) => join(folder, name));
  t.after(async () => {
    await Promise.allSettled(files.map((file) => unlink(file)));
    await rmdir(folder);
  });
  await writeFile(files[0], '\ufeffAZURE_SPEECH_KEY=test-key\nAZURE_SPEECH_REGION=westus\n');
  await writeFile(files[2], 'AZURE_SPEECH_REGION=eastus\n');
  assert.deepEqual(loadSpeechEnvironment(files, {}), { AZURE_SPEECH_KEY: 'test-key', AZURE_SPEECH_REGION: 'eastus' });
  assert.deepEqual(loadSpeechEnvironment(files, { AZURE_SPEECH_KEY: '' }), { AZURE_SPEECH_KEY: '', AZURE_SPEECH_REGION: 'eastus' });
});

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
      return Response.json([
        ...[voiceId, alternateVoice].map((ShortName) => ({
          ShortName, Locale: 'en-US', LocalName: ShortName, VoiceType: 'Neural',
        })),
        { ShortName: 'zh-CN-XiaoxiaoNeural', Locale: 'zh-CN', LocalName: 'Xiaoxiao', VoiceType: 'Neural' },
      ]);
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
    headers: { 'Content-Type': 'application/json', Origin: new URL(url).origin },
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

test('Azure routes require a direct local request before contacting Azure', async (t) => {
  const httpFetch = globalThis.fetch;
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json([]));
  const app = express();
  app.use(createSpeechRouter({ AZURE_SPEECH_KEY: 'test-key', AZURE_SPEECH_REGION: 'southeastasia' }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => server.close());
  const origin = 'http://127.0.0.1:' + server.address().port;

  for (const [path, init] of [
    ['/voices', { headers: { Host: 'example.com' } }],
    ['/voices', { headers: { 'X-Forwarded-For': '127.0.0.1' } }],
    ['/voices', { headers: { 'Sec-Fetch-Site': 'same-site' } }],
    ['/voices', { headers: { Origin: 'https://example.com' } }],
    ['/synthesize', { method: 'POST' }],
    ['/synthesize', { method: 'POST', headers: { Origin: origin, Forwarded: 'for=127.0.0.1' } }],
  ]) {
    const response = await new Promise((resolve, reject) => {
      const incoming = request(origin + path, init, async (res) => {
        try {
          res.setEncoding('utf8');
          let body = '';
          for await (const chunk of res) body += chunk;
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (error) {
          reject(error);
        }
      });
      incoming.on('error', reject).end();
    });
    assert.equal(response.status, 403, JSON.stringify(init));
    assert.deepEqual(response.body, { error: 'forbidden' });
  }
  assert.equal(upstream.mock.callCount(), 0);
  const response = await httpFetch(origin + '/voices');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { voices: [] });
  assert.equal(upstream.mock.callCount(), 1);

  const hostedHost = 'ais-dev-sample.asia-east1.run.app';
  const previousService = process.env.K_SERVICE;
  process.env.K_SERVICE = 'true';
  t.after(() => {
    if (previousService === undefined) delete process.env.K_SERVICE;
    else process.env.K_SERVICE = previousService;
  });

  const hostedVoices = await httpFetch(origin + '/voices', {
    headers: {
      'X-Forwarded-Host': hostedHost,
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-For': '203.0.113.9',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  assert.equal(hostedVoices.status, 200);
  assert.deepEqual(await hostedVoices.json(), { voices: [] });

  const rejectedCrossSite = await httpFetch(origin + '/voices', {
    headers: {
      'X-Forwarded-Host': hostedHost,
      'Sec-Fetch-Site': 'cross-site',
    },
  });
  assert.equal(rejectedCrossSite.status, 403);

  const rejectedExternalHost = await httpFetch(origin + '/voices', {
    headers: {
      'X-Forwarded-Host': 'evil.example',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  assert.equal(rejectedExternalHost.status, 403);
});
