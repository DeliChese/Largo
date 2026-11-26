import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  buildExternalLinks,
  createDictionaryRouter,
  extractWordFamilyStems,
  mapPartOfSpeechVi,
  normalizeLookupQuery,
  parseEnWiktionaryDefinition,
  parseFluentDictPayload,
  parseFreeDictionaryPayload,
  parseTatoebaPairs,
  parseViWiktionaryEntry,
  parseWordFamilyFromDatamuse,
} from './dictionary.mjs';

function startTestServer(router) {
  const server = http.createServer(router);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        url: 'http://127.0.0.1:' + address.port,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

function mockJsonResponse(body, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    body: { cancel: async () => {} },
  };
}

test('normalizeLookupQuery accepts clean English words/phrases and rejects unsafe input', () => {
  assert.equal(normalizeLookupQuery('  resilient  '), 'resilient');
  assert.equal(normalizeLookupQuery('break   down'), 'break down');
  assert.equal(normalizeLookupQuery("don't"), "don't");
  assert.equal(normalizeLookupQuery('self-control'), 'self-control');
  assert.equal(normalizeLookupQuery(''), '');
  assert.equal(normalizeLookupQuery('../etc/passwd'), '');
  assert.equal(normalizeLookupQuery('<script>alert(1)</script>'), '');
  assert.equal(normalizeLookupQuery('word/path'), '');
  assert.equal(normalizeLookupQuery('12345'), '');
  assert.equal(normalizeLookupQuery('a'.repeat(81)), '');
});

test('mapPartOfSpeechVi maps English, Wiktionary, and Vietnamese POS tags to Largo labels', () => {
  assert.equal(mapPartOfSpeechVi('noun'), 'Danh từ');
  assert.equal(mapPartOfSpeechVi('tr-verb'), 'Động từ');
  assert.equal(mapPartOfSpeechVi('verb', 'break down'), 'Cụm động từ');
  assert.equal(mapPartOfSpeechVi('adjective'), 'Tính từ');
  assert.equal(mapPartOfSpeechVi('adverb'), 'Trạng từ');
  assert.equal(mapPartOfSpeechVi('Ngoại động từ'), 'Động từ');
  assert.equal(mapPartOfSpeechVi('', 'in charge of'), 'Cụm từ');
});

test('parseViWiktionaryEntry extracts multi-POS Vietnamese meanings, collocations, sentences, and IPA', () => {
  const wikitext = `{{-eng-}}
{{-pron-}}
* [[Wiktionary:IPA|IPA]]: {{IPA-old|/ˈæd.və.kət/}}
{{-noun-}}
'''advocate'''
# [[người|Người]] [[chủ trương]]; [[người]] ủng [[hộ]].
#: ''an '''advocate''' of peace'' — người chủ trương hòa bình
#: ''She has been a vocal advocate for public libraries for ten years.'' — Cô ấy đã là người ủng hộ mạnh mẽ các thư viện công cộng suốt mười năm.
{{-tr-verb-}}
'''advocate'''
# [[chủ trương|Chủ trương]]; [[tán thành]], ủng [[hộ]].
{{-ref-}}
{{R:FVDP}}`;

  const parsed = parseViWiktionaryEntry(wikitext, 'advocate');
  assert.ok(parsed);
  assert.equal(parsed.phonetic, '/ˈæd.və.kət/');
  assert.equal(parsed.senses.length, 2);
  assert.equal(parsed.senses[0].partOfSpeech, 'Danh từ');
  assert.match(parsed.senses[0].meaning, /chủ trương/i);
  assert.equal(parsed.senses[0].collocations[0].phrase, 'an advocate of peace');
  assert.equal(parsed.senses[0].collocations[0].meaning, 'người chủ trương hòa bình');
  assert.equal(parsed.senses[0].examples.length, 1);
  assert.match(parsed.senses[0].examples[0].sentence, /vocal advocate/);
  assert.equal(parsed.senses[1].partOfSpeech, 'Động từ');
});

test('parseFreeDictionaryPayload extracts separate UK/US IPA, examples, and relations', () => {
  const payload = [{
    word: 'negotiate',
    phonetics: [
      { text: '/nəˈɡəʊ.ʃi.eɪt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/negotiate-uk.mp3' },
      { text: '/nəˈɡoʊ.ʃi.eɪt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/negotiate-us.mp3' },
    ],
    meanings: [{
      partOfSpeech: 'verb',
      definitions: [{
        definition: 'To arrange or settle something by mutual agreement.',
        example: 'They negotiated a fair contract with the supplier.',
      }],
      synonyms: ['bargain', 'mediate'],
      antonyms: [],
    }],
    sourceUrls: ['https://en.wiktionary.org/wiki/negotiate'],
  }];

  const parsed = parseFreeDictionaryPayload(payload);
  assert.ok(parsed);
  assert.equal(parsed.ukPhonetic, '/nəˈɡəʊ.ʃi.eɪt/');
  assert.equal(parsed.usPhonetic, '/nəˈɡoʊ.ʃi.eɪt/');
  assert.equal(parsed.senses[0].partOfSpeech, 'Động từ');
  assert.equal(parsed.senses[0].examples[0].sentence, 'They negotiated a fair contract with the supplier.');
  assert.deepEqual(parsed.synonyms, ['bargain', 'mediate']);
});

test('parseEnWiktionaryDefinition detects inflection lemma and parseTatoebaPairs extracts bilingual pairs', () => {
  const enWiki = parseEnWiktionaryDefinition({
    en: [{
      partOfSpeech: 'Verb',
      definitions: [{
        definition: '<span class="form-of-definition">simple past and past participle of <a href="/wiki/negotiate">negotiate</a></span>',
      }],
    }],
  }, 'negotiated');
  assert.equal(enWiki?.lemma, 'negotiate');

  const pairs = parseTatoebaPairs({
    results: [
      { id: 42, text: 'We negotiated a new schedule with the manager.', translations: [[{ lang: 'vie', text: 'Chúng tôi đã đàm phán lịch trình mới với quản lý.' }]] },
      { id: 43, text: 'Unrelated sentence.', translations: [[{ lang: 'vie', text: 'Câu không liên quan.' }]] },
    ],
  }, 'negotiate');
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].sourceUrl, 'https://tatoeba.org/en/sentences/show/42');
});

test('parseFluentDictPayload adapts TFlat/FluentDict JSON shape into Largo senses', () => {
  const parsed = parseFluentDictPayload({
    word: 'resilient',
    entry: {
      pronunciation: '/rɪˈzɪl.jənt/',
      _note: '"resiliently" là dạng biến thể của "resilient"',
      parts: {
        'Tính từ': {
          meanings: [{
            meaning: 'kiên cường; có khả năng phục hồi nhanh',
            examples: [
              { en: 'She stayed resilient through a difficult year.', vi: 'Cô ấy vẫn kiên cường vượt qua một năm khó khăn.' },
            ],
          }],
          idioms: [{ phrase: 'resilient economy', meaning: 'nền kinh tế có sức chống chịu tốt' }],
        },
      },
    },
  }, 'resilient');

  assert.ok(parsed);
  assert.equal(parsed.term, 'resilient');
  assert.equal(parsed.phonetic, '/rɪˈzɪl.jənt/');
  assert.equal(parsed.senses[0].partOfSpeech, 'Tính từ');
  assert.equal(parsed.senses[0].examples[0].translation, 'Cô ấy vẫn kiên cường vượt qua một năm khó khăn.');
  assert.equal(parsed.senses[0].collocations[0].phrase, 'resilient economy');
});

test('buildExternalLinks encodes URLs safely with https://', () => {
  const links = buildExternalLinks('break down');
  assert.equal(links.cambridgeEn, 'https://dictionary.cambridge.org/search/english/direct/?q=break%20down');
  assert.equal(links.cambridgeEnVi, 'https://dictionary.cambridge.org/search/english-vietnamese/direct/?q=break%20down');
  assert.equal(links.wiktionaryVi, 'https://vi.wiktionary.org/wiki/break_down');
});

test('extractWordFamilyStems and parseWordFamilyFromDatamuse extract clean multi-POS families and reject noise', () => {
  const decideStems = extractWordFamilyStems('decide');
  assert.deepEqual(decideStems, ['decid', 'decis']);

  const createStems = extractWordFamilyStems('create');
  assert.deepEqual(createStems, ['creat']);
  assert.deepEqual(extractWordFamilyStems('creation'), ['creat']);
  assert.deepEqual(extractWordFamilyStems('relation'), ['relat']);

  const decideFamily = parseWordFamilyFromDatamuse([
    { word: 'decide', tags: ['v', 'f:28.9'] },
    { word: 'decision', tags: ['n', 'f:95.6'] },
    { word: 'decisions', tags: ['n', 'f:51.7'] },
    { word: 'decisive', tags: ['adj', 'f:10.3'] },
    { word: 'decisively', tags: ['adv', 'f:2.05'] },
    { word: 'deciduous', tags: ['adj', 'f:1.77'] },
    { word: 'decidement', tags: ['n', 'f:0.004'] },
    { word: 'deciding', tags: ['v', 'f:7.9'] },
  ], 'decide', decideStems);

  const terms = decideFamily.map((item) => item.term);
  assert.ok(terms.includes('decision'));
  assert.ok(terms.includes('decisive'));
  assert.ok(terms.includes('decisively'));
  assert.ok(!terms.includes('decisions'));
  assert.ok(!terms.includes('deciduous'));
  assert.ok(!terms.includes('decidement'));
  assert.ok(!terms.includes('deciding'));
  assert.equal(decideFamily.find((i) => i.term === 'decision')?.partOfSpeech, 'Danh từ');
  assert.equal(decideFamily.find((i) => i.term === 'decisive')?.partOfSpeech, 'Tính từ');
  assert.equal(decideFamily.find((i) => i.term === 'decisively')?.partOfSpeech, 'Trạng từ');
});

test('dictionary router serves merged lookup, inflection redirect, and caches repeated queries', async () => {
  let fetchCount = 0;
  const mockRequest = async (url) => {
    fetchCount += 1;
    if (url.startsWith('https://vi.wiktionary.org/w/api.php?action=parse&page=negotiated')) {
      return mockJsonResponse({ error: { code: 'missingtitle' } });
    }
    if (url.startsWith('https://vi.wiktionary.org/w/api.php?action=parse&page=negotiate')) {
      return mockJsonResponse({
        parse: {
          wikitext: {
            '*': `{{-eng-}}\n{{-verb-}}\n# [[đàm phán|Đàm phán]], [[thương lượng]].\n#: ''to '''negotiate''' a deal'' — đàm phán một thỏa thuận`,
          },
        },
      });
    }
    if (url.startsWith('https://en.wiktionary.org/api/rest_v1/page/definition/negotiated')) {
      return mockJsonResponse({
        en: [{
          partOfSpeech: 'Verb',
          definitions: [{
            definition: '<span class="form-of-definition">past tense of <a href="/wiki/negotiate">negotiate</a></span>',
          }],
        }],
      });
    }
    if (url.startsWith('https://api.dictionaryapi.dev/api/v2/entries/en/negotiate')) {
      return mockJsonResponse([{
        word: 'negotiate',
        phonetics: [
          { text: '/nəˈɡəʊ.ʃi.eɪt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/negotiate-uk.mp3' },
          { text: '/nəˈɡoʊ.ʃi.eɪt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/negotiate-us.mp3' },
        ],
        meanings: [{
          partOfSpeech: 'verb',
          definitions: [{ definition: 'To reach an agreement through discussion.' }],
          synonyms: ['bargain'],
          antonyms: [],
        }],
      }]);
    }
    if (url.startsWith('https://tatoeba.org/en/api_v0/search')) {
      return mockJsonResponse({
        results: [{
          id: 99,
          text: 'We need to negotiate better terms before signing.',
          translations: [[{ lang: 'vie', text: 'Chúng ta cần đàm phán điều khoản tốt hơn trước khi ký.' }]],
        }],
      });
    }
    return mockJsonResponse({}, 404);
  };

  const server = await startTestServer(createDictionaryRouter({}, { request: mockRequest }));
  try {
    const first = await fetch(server.url + '/lookup?q=negotiated');
    assert.equal(first.status, 200);
    const body = await first.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.term, 'negotiate');
    assert.match(body.inflectionNote, /negotiated.*negotiate/);
    assert.equal(body.englishForms['en-GB'].phonetic, '/nəˈɡəʊ.ʃi.eɪt/');
    assert.equal(body.englishForms['en-US'].phonetic, '/nəˈɡoʊ.ʃi.eɪt/');
    assert.equal(body.senses[0].partOfSpeech, 'Động từ');
    assert.match(body.senses[0].meaning, /Đàm phán/);
    assert.equal(body.examples[0].translation, 'Chúng ta cần đàm phán điều khoản tốt hơn trước khi ký.');
    assert.equal(body.collocations[0].phrase, 'to negotiate a deal');

    const countAfterFirst = fetchCount;
    const second = await fetch(server.url + '/lookup?q=negotiated');
    assert.equal(second.status, 200);
    assert.equal(fetchCount, countAfterFirst);

    const invalid = await fetch(server.url + '/lookup?q=..%2Fsecret');
    assert.equal(invalid.status, 400);
  } finally {
    await server.close();
  }
});
