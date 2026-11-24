import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createExampleGeneratorRouter, parseExampleGeneratorInput, parseGeneratedExamples } from './exampleGenerator.mjs';

async function withServer(router, fn) {
  const server = router.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    return await fn('http://127.0.0.1:' + port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('parses valid example generator input and rejects unsafe or missing fields', () => {
  assert.equal(parseExampleGeneratorInput(null), null);
  assert.equal(parseExampleGeneratorInput({ term: 'focus', meaning: 'tập trung', consent: false }), null);
  assert.equal(parseExampleGeneratorInput({ term: '<script>', meaning: 'mã độc', consent: true }), null);
  const parsed = parseExampleGeneratorInput({
    term: '  carry out  ',
    meaning: 'thực hiện',
    partOfSpeech: 'Cụm động từ',
    locale: 'en-GB',
    avoidSentences: ['We will carry out the plan.', '  '],
    consent: true,
  });
  assert.deepEqual(parsed, {
    term: 'carry out',
    meaning: 'thực hiện',
    partOfSpeech: 'Cụm động từ',
    level: '',
    locale: 'en-GB',
    avoidSentences: ['We will carry out the plan.'],
  });
});

test('parses valid generated examples and filters invalid outputs', () => {
  const input = { term: 'carry out', avoidSentences: [] };
  assert.equal(parseGeneratedExamples({ examples: [{ sentence: 'hi', translation: 'x' }] }, input), null);
  const examples = parseGeneratedExamples({
    examples: [
      { sentence: 'The team will carry out the safety audit tomorrow.', translation: 'Nhóm sẽ thực hiện kiểm tra an toàn vào ngày mai.' },
      { sentence: 'The team will carry out the safety audit tomorrow.', translation: 'Bản trùng lặp.' },
      { sentence: 'Researchers plan to carry out a two-year study.', translation: 'Các nhà nghiên cứu dự định tiến hành một nghiên cứu kéo dài hai năm.' },
    ],
  }, input);
  assert.equal(examples?.length, 2);
});

test('requires two new Vietnamese translations and the selected term in each example', () => {
  const first = { sentence: 'We can carry out the audit in June.', translation: 'Chúng ta có thể tiến hành kiểm toán vào tháng Sáu.' };
  const second = { sentence: 'They plan to carry out repairs overnight.', translation: 'Họ dự định sửa chữa trong đêm.' };
  const input = { term: 'carry out', avoidSentences: [first.sentence.toUpperCase()] };
  assert.equal(parseGeneratedExamples([first, second], input), null);
  assert.equal(parseGeneratedExamples([second, {
    sentence: 'You can carry out the work today.', translation: 'You can do the work today.',
  }], input), null);
  assert.equal(parseGeneratedExamples([second, {
    sentence: 'The sky looks clear today.', translation: 'Hôm nay trời quang đãng.',
  }], input), null);
  assert.deepEqual(parseGeneratedExamples([first, second], { term: 'carry out', avoidSentences: [] }), [first, second]);
});

test('returns 503 disabled when neither Gemini nor DeepSeek key is configured', async () => {
  await withServer(createExampleGeneratorRouter({}), async (base) => {
    const response = await fetch(base + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ term: 'resilient', meaning: 'kiên cường', consent: true }),
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).reason, 'disabled');
  });
});

test('generates bilingual examples through server-side Gemini caller and rejects non-local hosts', async () => {
  const router = createExampleGeneratorRouter(
    { GEMINI_API_KEY: 'test-gemini-key' },
    {
      generateWithGemini: async (input) => [
        { sentence: `Good communication helps teams build ${input.term} quickly.`, translation: 'Giao tiếp tốt giúp các nhóm xây dựng sự tin cậy nhanh chóng.' },
        { sentence: `Customers value ${input.term} more than flashy ads.`, translation: 'Khách hàng coi trọng sự tin cậy hơn quảng cáo hào nhoáng.' },
      ],
    },
  );
  await withServer(router, async (base) => {
    const ok = await fetch(base + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ term: 'trust', meaning: 'sự tin cậy', consent: true }),
    });
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.provider, 'gemini');
    assert.equal(body.examples.length, 2);

    const rejected = await fetch(base + '/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base, 'Sec-Fetch-Site': 'cross-site' },
      body: JSON.stringify({ term: 'trust', meaning: 'sự tin cậy', consent: true }),
    });
    assert.equal(rejected.status, 403);
  });
});

test('invalid requests spend no quota and dispatches stop at the per-minute limit', async () => {
  let calls = 0;
  const router = createExampleGeneratorRouter({ GEMINI_API_KEY: 'test-key' }, {
    now: () => 120_000,
    generateWithGemini: async () => {
      calls += 1;
      return [
        { sentence: 'Trust can take years to build.', translation: 'Có thể mất nhiều năm để xây dựng lòng tin.' },
        { sentence: 'Their trust in the plan grew over time.', translation: 'Niềm tin của họ vào kế hoạch dần tăng lên.' },
      ];
    },
  });
  await withServer(router, async (base) => {
    const post = (consent) => fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ term: 'trust', meaning: 'lòng tin', consent }),
    });
    assert.equal((await post(false)).status, 400);
    assert.equal(calls, 0);
    for (let i = 0; i < 12; i += 1) {
      const response = await post(true);
      assert.equal(response.status, 200);
      await response.json();
    }
    const limited = await post(true);
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).reason, 'quota');
    assert.equal(calls, 12);
  });
});
