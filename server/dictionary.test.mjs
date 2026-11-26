import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  areExamplesTooSimilar,
  buildExternalLinks,
  createDictionaryRouter,
  deduplicateExamples,
  extractWordFamilyStems,
  filterCleanIdioms,
  hasEnglishIdiomCategory,
  isJunkEnglishDefinition,
  isLikelyLiteralTatoebaForIdiom,
  isNaturalExampleSentence,
  mapPartOfSpeechVi,
  matchesSensePartOfSpeech,
  normalizeLookupQuery,
  parseDatamuseEntry,
  parseEnWiktionaryDefinition,
  parseFluentDictPayload,
  parseFreeDictionaryPayload,
  parseTatoebaPairs,
  parseViWiktionaryEntry,
  parseWordFamilyFromDatamuse,
  pickIdiomAnchorWord,
  prepareDefinitionForTranslation,
  sanitizeTranslatedText,
  selectBestEnglishDefinition,
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

test('parseViWiktionaryEntry parses modern langname/ĐM idiom pages and strips usage labels cleanly', () => {
  const wikitext = `=={{langname|en}}==
==={{ĐM|intj}}===
# {{lb|en|idiomatic}} [[chúc may mắn|Chúc may mắn]]!`;

  const parsed = parseViWiktionaryEntry(wikitext, 'break a leg');
  assert.ok(parsed);
  assert.equal(parsed.isIdiom, true);
  assert.equal(parsed.senses.length, 1);
  assert.equal(parsed.senses[0].partOfSpeech, 'Thán từ');
  assert.equal(parsed.senses[0].meaning, 'Chúc may mắn!');
  assert.ok(!parsed.senses[0].meaning.includes('idiomatic'));
});

test('pickIdiomAnchorWord, filterCleanIdioms, and hasEnglishIdiomCategory work cleanly', () => {
  assert.equal(pickIdiomAnchorWord('break the ice'), 'break');
  assert.equal(pickIdiomAnchorWord('on the other hand'), 'other');
  assert.equal(pickIdiomAnchorWord('a piece of cake'), 'piece');

  const cleaned = filterCleanIdioms(
    [
      'break the ice',
      'break up',
      'break a leg',
      'shit hits the fan',
      'break the bank',
      'Appendix:English idioms',
      'break the ice',
    ],
    'break the ice',
    4,
  );
  assert.deepEqual(cleaned.map((item) => item.term), ['break a leg', 'break the bank', 'break up']);

  assert.equal(
    hasEnglishIdiomCategory({
      query: { pages: [{ title: 'piece of cake', categories: [{ title: 'Category:English idioms' }] }] },
    }),
    true,
  );
  assert.equal(
    hasEnglishIdiomCategory({
      query: { pages: [{ title: 'table', categories: [{ title: 'Category:English nouns' }] }] },
    }),
    false,
  );
});

test('dictionary router supports /idioms, /suggest?mode=idiom, and idiom detection + relatedIdioms on /lookup', async () => {
  const mockRequest = async (url) => {
    if (url.startsWith('https://en.wiktionary.org/w/api.php') && url.includes('list=search')) {
      return mockJsonResponse({
        query: {
          search: [
            { title: 'break the ice', snippet: 'To start a conversation in a social setting.' },
            { title: 'on thin ice', snippet: 'In a risky or precarious situation.' },
            { title: 'tip of the iceberg', snippet: 'Small visible part of a larger problem.' },
            { title: 'fuck the ice', snippet: 'profane entry should be filtered out' },
          ],
        },
      });
    }
    if (url.startsWith('https://en.wiktionary.org/w/api.php') && url.includes('prop=categories')) {
      return mockJsonResponse({
        query: {
          pages: [{ title: 'break the ice', categories: [{ title: 'Category:English idioms' }] }],
        },
      });
    }
    if (url.startsWith('https://vi.wiktionary.org/w/api.php?action=parse&page=break%20the%20ice')) {
      return mockJsonResponse({
        parse: {
          wikitext: {
            '*': `=={{langname|en}}==\n==={{ĐM|verb}}===\n# {{lb|en|idiomatic}} Phá vỡ sự ngại ngùng ban đầu.`,
          },
        },
      });
    }
    if (url.startsWith('https://tatoeba.org/en/api_v0/search')) {
      return mockJsonResponse({
        results: [{
          id: 501,
          text: 'He told a joke to break the ice.',
          translations: [[{ lang: 'vie', text: 'Anh ấy kể một câu chuyện cười để phá vỡ sự ngại ngùng.' }]],
        }],
      });
    }
    return mockJsonResponse({}, 404);
  };

  const server = await startTestServer(createDictionaryRouter({}, { request: mockRequest }));
  try {
    const idiomsRes = await fetch(server.url + '/idioms?q=ice&limit=5');
    assert.equal(idiomsRes.status, 200);
    const idiomsBody = await idiomsRes.json();
    const idiomTerms = idiomsBody.idioms.map((item) => item.term);
    assert.deepEqual(idiomTerms, ['break the ice', 'on thin ice', 'tip of the iceberg']);

    const suggestRes = await fetch(server.url + '/suggest?q=ice&mode=idiom');
    assert.equal(suggestRes.status, 200);
    const suggestBody = await suggestRes.json();
    assert.equal(suggestBody.suggestions[0].term, 'break the ice');
    assert.equal(suggestBody.suggestions[0].isIdiom, true);

    const lookupRes = await fetch(server.url + '/lookup?q=break%20the%20ice');
    assert.equal(lookupRes.status, 200);
    const lookupBody = await lookupRes.json();
    assert.equal(lookupBody.status, 'ok');
    assert.equal(lookupBody.isIdiom, true);
    assert.equal(lookupBody.senses[0].partOfSpeech, 'Thành ngữ');
    assert.match(lookupBody.senses[0].meaning, /Phá vỡ sự ngại ngùng/);
    assert.ok(lookupBody.relatedIdioms.includes('on thin ice'));
    assert.ok(!lookupBody.relatedIdioms.includes('break the ice'));
  } finally {
    await server.close();
  }
});

test('selectBestEnglishDefinition and isJunkEnglishDefinition reject archaic, tautological, surname, and meta glosses', () => {
  assert.equal(isJunkEnglishDefinition('Senses relating to brittleness.', 'crisp'), true);
  assert.equal(isJunkEnglishDefinition('To run.', 'run'), true);
  assert.equal(isJunkEnglishDefinition('To conclude or resolve (something):', 'settle'), true);
  assert.equal(isJunkEnglishDefinition('Nonstandard spelling of takeoff.', 'take off'), true);
  assert.equal(isJunkEnglishDefinition('A habitational surname from Old English.', 'settle'), true);
  assert.equal(isJunkEnglishDefinition('A town and civil parish in North Yorkshire, England.', 'settle'), true);

  const bestAddressNoun = selectBestEnglishDefinition(
    [
      { text: 'Direction.', sourcePriority: 8, index: 0 },
      { text: 'Preparation.', sourcePriority: 8, index: 1 },
      { text: '(computer science) The code that identifies where a piece of information is stored.', sourcePriority: 14, index: 0 },
      { text: 'An act of addressing oneself to a person or group; a discourse or speech, or a record of this.', sourcePriority: 8, index: 2 },
      { text: '(obsolete) Readiness or skill.', sourcePriority: 6, index: 3 },
      { text: 'The location of a building or place where mail or messages can be delivered.', sourcePriority: 6, index: 4 },
    ],
    'address',
  );
  assert.match(bestAddressNoun, /location of a building/i);

  const bestScale = selectBestEnglishDefinition(
    [
      { text: 'A ladder; a series of steps; a means of ascending.', sourcePriority: 8, index: 0 },
      { text: 'An ordered, usually numerical sequence used for measurement.', sourcePriority: 14, index: 0 },
    ],
    'scale',
  );
  assert.match(bestScale, /ordered, usually numerical sequence/i);

  const bestCostIdiom = selectBestEnglishDefinition(
    ['Usually used after the verb cost, but also often charge: a very high price for an item'],
    'cost an arm and a leg',
    { isIdiom: true },
  );
  assert.equal(bestCostIdiom, 'A very high price for an item');
});

test('sanitizeTranslatedText rejects UI hotkey artifacts and prepareDefinitionForTranslation trims rambling labels', () => {
  assert.equal(sanitizeTranslatedText('& Bỏ', 'To remove.', { isMeaning: true }), '');
  assert.equal(sanitizeTranslatedText('MYMEMORY WARNING: limit exceeded', 'test', { isMeaning: true }), '');
  assert.equal(
    sanitizeTranslatedText('Một công việc , dễ dàng hoặc đơn giản .', 'A job, easy or simple.', { isMeaning: true }),
    'Một công việc, dễ dàng hoặc đơn giản',
  );

  assert.equal(
    prepareDefinitionForTranslation('(intransitive, of a machine) To stop functioning; to cease operating due to a fault.'),
    'To stop functioning; to cease operating due to a fault.',
  );
});

test('example quality filters reject fragments, collapse near-duplicates, and block literal Tatoeba idioms', () => {
  assert.equal(isNaturalExampleSentence('kale crisps', 'crisp'), false);
  assert.equal(isNaturalExampleSentence('to run through life; to run in a circle', 'run'), false);
  assert.equal(isNaturalExampleSentence('a man of pleasing address', 'address'), false);
  assert.equal(isNaturalExampleSentence('He took off his shoes before entering the room.', 'take off'), true);
  assert.equal(isNaturalExampleSentence("Sure, no problem. It'll be a piece of cake.", 'piece of cake'), true);

  assert.equal(
    areExamplesTooSimilar(
      { sentence: 'Take off your caps.', translation: 'Hãy cởi mũ ra.' },
      { sentence: 'Take off your hat.', translation: 'Hãy cởi mũ ra.' },
    ),
    true,
  );
  assert.equal(
    isLikelyLiteralTatoebaForIdiom('How about another piece of cake?', 'Anh có muốn miếng bánh ngọt khác không?', 'piece of cake'),
    true,
  );
  assert.equal(
    isLikelyLiteralTatoebaForIdiom('That exam was a piece of cake.', 'Bài kiểm tra đó dễ như trở bàn tay.', 'piece of cake'),
    false,
  );
  assert.equal(matchesSensePartOfSpeech('Take off your hat.', 'take off', 'Danh từ'), false);
  assert.equal(matchesSensePartOfSpeech('I suddenly got a craving to eat some crisp roast chicken skin.', 'crisp', 'Danh từ'), false);
  assert.equal(matchesSensePartOfSpeech('What is your address?', 'address', 'Danh từ'), true);

  const dedupedIdiom = deduplicateExamples(
    [
      { sentence: 'That test was a piece of cake for her.', translation: 'Bài kiểm tra đó quá dễ với cô ấy.', source: 'Tatoeba' },
      { sentence: "Sure, no problem. It'll be a piece of cake.", translation: 'Dĩ nhiên, việc đó dễ như trở bàn tay.', source: 'English Wiktionary' },
    ],
    'piece of cake',
    { preferDictionaryFirst: true },
  );
  assert.equal(dedupedIdiom[0].source, 'English Wiktionary');
});

test('parseViWiktionaryEntry cleans FVDP labels, skips archaic collocations, and covers multiple etymologies', () => {
  const scaleWikitext = `{{-eng-}}
{{-pron-}}
* {{IPA4|en|/skeɪl/|a=RP}}
* {{IPA4|en|/skeɪl/|a=GenAm}}
{{-noun-}}
# [[vảy|Vảy]] (cá, rắn).
# {{term|Thực vật học}} [[vảy|Vảy]] [[bắc]].
{{-noun-}}
# [[cái|Cái]] đĩa [[cân]].
# {{term|Từ cổ, nghĩa cổ}} Đĩa cổ.
#: ''an archaic scale phrase'' — cụm từ cổ không nên lấy
{{-noun-}}
# [[tỷ lệ|Tỷ lệ]], [[quy mô]].`;

  const parsed = parseViWiktionaryEntry(scaleWikitext, 'scale');
  assert.ok(parsed);
  assert.equal(parsed.ukPhonetic, '/skeɪl/');
  assert.equal(parsed.usPhonetic, '/skeɪl/');
  assert.match(parsed.senses[0].meaning, /Vảy/);
  assert.match(parsed.senses[0].meaning, /Cái đĩa cân/);
  assert.match(parsed.senses[0].meaning, /Tỷ lệ, quy mô/);
  assert.ok(!parsed.senses[0].meaning.includes('Thực vật học'));
  assert.equal(parsed.senses[0].collocations.length, 0);
});

test('parseDatamuseEntry orders primary POS by frequency and lookup prioritizes Datamuse POS + idiomatic examples', async () => {
  const dm = parseDatamuseEntry(
    [{
      word: 'crisp',
      tags: ['query', 'adj', 'n', 'v', 'f:2.97'],
      defs: ['adj\tFirm and pleasantly crunchy.', 'n\tA thin slice of fried potato.'],
    }],
    'crisp',
  );
  assert.deepEqual(dm?.posOrder, ['Tính từ', 'Danh từ', 'Động từ']);

  const mockRequest = async (url) => {
    if (url.startsWith('https://api.datamuse.com/words?sp=piece%20of%20cake&qe=sp')) {
      return mockJsonResponse([{
        word: 'piece of cake',
        tags: ['query', 'n', 'f:0.0'],
        defs: ['n\t(idiomatic) A task that is easy or simple.'],
      }]);
    }
    if (url.startsWith('https://en.wiktionary.org/api/rest_v1/page/definition/piece%20of%20cake')) {
      return mockJsonResponse({
        en: [{
          partOfSpeech: 'Noun',
          definitions: [{
            definition: 'A <a href="/wiki/job">job</a> , <a href="/wiki/task">task</a> that is easy or simple .',
            parsedExamples: [{ example: "Sure, no problem. It'll be a <b>piece of cake</b> ." }],
          }],
        }],
      });
    }
    if (url.startsWith('https://tatoeba.org/en/api_v0/search')) {
      return mockJsonResponse({
        results: [
          { id: 1, text: 'How about another piece of cake?', translations: [[{ lang: 'vie', text: 'Anh có muốn miếng bánh ngọt khác không?' }]] },
        ],
      });
    }
    if (url.startsWith('https://api.mymemory.translated.net/get')) {
      if (url.includes('easy')) {
        return mockJsonResponse({ responseData: { translatedText: 'Một việc rất dễ dàng và đơn giản.' } });
      }
      return mockJsonResponse({ responseData: { translatedText: 'Chắc chắn rồi, việc đó dễ như trở bàn tay.' } });
    }
    return mockJsonResponse({}, 404);
  };

  const server = await startTestServer(createDictionaryRouter({}, { request: mockRequest }));
  try {
    const res = await fetch(server.url + '/lookup?q=piece%20of%20cake');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.isIdiom, true);
    assert.equal(body.senses[0].partOfSpeech, 'Thành ngữ');
    assert.equal(body.senses[0].meaning, 'Một việc rất dễ dàng và đơn giản');
    assert.equal(body.senses[0].examples.length, 1);
    assert.equal(body.senses[0].examples[0].sentence, "Sure, no problem. It'll be a piece of cake.");
    assert.match(body.senses[0].examples[0].translation, /dễ như trở bàn tay/i);
    assert.ok(!body.examples.some((e) => /another piece of cake/i.test(e.sentence)));
  } finally {
    await server.close();
  }
});
