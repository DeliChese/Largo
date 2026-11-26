import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialSRS } from './srsBloom';
import {
  buildLocalLookupResult,
  buildWordDraftFromDictionary,
  createIdiomDeck,
  createLookupDeck,
  ENGLISH_IDIOM_POS,
  getMergedWordFamily,
  IDIOM_DECK_ID,
  isIdiomWord,
  LOOKUP_DECK_ID,
  mergeLocalWithOnlineLookup,
  safeExternalUrl,
  type DictionaryLookupResult,
} from './dictionaryClient';
import { createBackup, previewBackup } from './backup';
import { INITIAL_DECKS, INITIAL_LOGS, INITIAL_PROFILE, INITIAL_SETTINGS, INITIAL_WORDS, CURRENT_DATA_VERSION } from '../data/seedVocab';
import type { VocabWord } from '../types/vocab';

const SAMPLE_ENTRY: DictionaryLookupResult = {
  status: 'ok',
  term: 'advocate',
  queriedTerm: 'advocates',
  inflectionNote: '"advocates" là dạng biến thể của "advocate".',
  phonetic: '/ˈæd.və.kət/',
  englishForms: {
    'en-GB': { phonetic: '/ˈæd.və.kət/' },
    'en-US': { phonetic: '/ˈæd.və.keɪt/' },
  },
  senses: [
    {
      partOfSpeech: 'Danh từ',
      meaning: 'người ủng hộ; người biện hộ',
      englishDefinition: 'A person who publicly supports or recommends a particular cause.',
      collocations: [
        { phrase: 'an advocate of peace', meaning: 'người chủ trương hòa bình' },
        { phrase: 'vocal advocate', meaning: 'người ủng hộ mạnh mẽ' },
      ],
      examples: [
        {
          sentence: 'She has been a vocal advocate for public libraries.',
          translation: 'Cô ấy là người ủng hộ mạnh mẽ các thư viện công cộng.',
          source: 'Tatoeba',
          sourceUrl: 'https://tatoeba.org/en/sentences/show/123',
        },
      ],
      synonyms: ['supporter', 'champion'],
      antonyms: ['opponent'],
    },
    {
      partOfSpeech: 'Động từ',
      meaning: 'chủ trương, ủng hộ',
      englishDefinition: 'To publicly recommend or support.',
      collocations: [],
      examples: [
        {
          sentence: 'Doctors advocate regular exercise for heart health.',
          translation: 'Các bác sĩ khuyên nên tập thể dục đều đặn cho sức khỏe tim mạch.',
          source: 'Free Dictionary API',
        },
      ],
      synonyms: ['recommend'],
      antonyms: ['oppose'],
    },
  ],
  examples: [
    {
      sentence: 'She has been a vocal advocate for public libraries.',
      translation: 'Cô ấy là người ủng hộ mạnh mẽ các thư viện công cộng.',
      source: 'Tatoeba',
      sourceUrl: 'https://tatoeba.org/en/sentences/show/123',
    },
    {
      sentence: 'Doctors advocate regular exercise for heart health.',
      translation: 'Các bác sĩ khuyên nên tập thể dục đều đặn cho sức khỏe tim mạch.',
      source: 'Free Dictionary API',
    },
  ],
  collocations: [
    { phrase: 'an advocate of peace', meaning: 'người chủ trương hòa bình' },
    { phrase: 'vocal advocate', meaning: 'người ủng hộ mạnh mẽ' },
  ],
  synonyms: ['supporter', 'champion', 'recommend'],
  antonyms: ['opponent', 'oppose'],
  wordFamily: [
    { term: 'advocacy', partOfSpeech: 'Danh từ' },
  ],
  providers: [
    { id: 'vi-wiktionary', name: 'Wiktionary Anh–Việt (FVDP)', license: 'CC BY-SA 4.0', url: 'https://vi.wiktionary.org/wiki/advocate' },
    { id: 'tatoeba', name: 'Tatoeba', license: 'CC BY 2.0' },
  ],
  links: {
    cambridgeEn: 'https://dictionary.cambridge.org/search/english/direct/?q=advocate',
    cambridgeEnVi: 'https://dictionary.cambridge.org/search/english-vietnamese/direct/?q=advocate',
    wiktionaryVi: 'https://vi.wiktionary.org/wiki/advocate',
  },
  fetchedAt: 1_700_000_000_000,
};

test('buildWordDraftFromDictionary omits English definition & source attribution from notes and keeps wordFamily', () => {
  const draft = buildWordDraftFromDictionary(SAMPLE_ENTRY, 0);
  assert.equal(draft.term, 'advocate');
  assert.equal(draft.partOfSpeech, 'Danh từ');
  assert.equal(draft.meaning, 'người ủng hộ; người biện hộ');
  assert.equal(draft.phonetic, '/ˈæd.və.keɪt/');
  assert.equal(draft.ukPhonetic, '/ˈæd.və.kət/');
  assert.equal(draft.englishForms?.['en-GB']?.phonetic, '/ˈæd.və.kət/');
  assert.equal(draft.englishForms?.['en-US']?.phonetic, '/ˈæd.və.keɪt/');
  assert.equal(draft.collocation, 'an advocate of peace');
  assert.equal(draft.collocationMeaning, 'người chủ trương hòa bình');
  assert.equal(draft.extraCollocations.length, 1);
  assert.equal(draft.examples[0].sentence, 'She has been a vocal advocate for public libraries.');
  assert.equal(draft.examples[0].sourceUrl, 'https://tatoeba.org/en/sentences/show/123');
  assert.equal(draft.examples[1].sentence, '');
  assert.equal(draft.additionalSenses?.length, 1);
  assert.equal(draft.additionalSenses?.[0].partOfSpeech, 'Động từ');
  assert.deepEqual(draft.wordFamily, [{ term: 'advocacy', partOfSpeech: 'Danh từ' }]);
  assert.match(draft.synonyms, /supporter/);
  assert.equal(draft.notes, '"advocates" là dạng biến thể của "advocate".');
  assert.ok(!draft.notes.includes('Định nghĩa Anh–Anh'));
  assert.ok(!draft.notes.includes('Nguồn tra cứu'));

  const directDraft = buildWordDraftFromDictionary({ ...SAMPLE_ENTRY, inflectionNote: undefined }, 0);
  assert.equal(directDraft.notes, '');
});

test('buildWordDraftFromDictionary switches primary sense cleanly when secondary POS is chosen', () => {
  const draft = buildWordDraftFromDictionary(SAMPLE_ENTRY, 1);
  assert.equal(draft.partOfSpeech, 'Động từ');
  assert.equal(draft.meaning, 'chủ trương, ủng hộ');
  assert.equal(draft.examples[0].sentence, 'Doctors advocate regular exercise for heart health.');
  assert.equal(draft.additionalSenses?.length, 1);
  assert.equal(draft.additionalSenses?.[0].partOfSpeech, 'Danh từ');
});

test('getMergedWordFamily and buildLocalLookupResult find catalog word families offline', () => {
  const makeWord = (id: string, term: string, pos: string, meaning: string): VocabWord => ({
    id,
    deckId: 'deck-test',
    language: 'en',
    term,
    phonetic: '',
    partOfSpeech: pos,
    meaning,
    collocations: [],
    examples: [{ sentence: `We ${term} every day.`, translation: 'Chúng ta thực hành mỗi ngày.' }],
    synonyms: [],
    antonyms: [],
    bloomLevel: 1,
    srs: createInitialSRS(1000),
    createdAt: 1000,
  });

  const catalog = [
    makeWord('w1', 'create', 'Động từ', 'tạo ra'),
    makeWord('w2', 'creation', 'Danh từ', 'sự sáng tạo'),
    makeWord('w3', 'creative', 'Tính từ', 'sáng tạo'),
    makeWord('w4', 'creatively', 'Trạng từ', 'một cách sáng tạo'),
    makeWord('w5', 'cream', 'Danh từ', 'kem'),
  ];

  const family = getMergedWordFamily(catalog[0], catalog);
  const terms = family.map((f) => f.term);
  assert.deepEqual(terms, ['creation', 'creative', 'creatively']);
  assert.equal(family[1].partOfSpeech, 'Tính từ');
  assert.equal(family[1].meaning, 'sáng tạo');

  const localEntry = buildLocalLookupResult(catalog[0], catalog);
  assert.equal(localEntry.status, 'ok');
  assert.equal(localEntry.term, 'create');
  assert.equal(localEntry.wordFamily?.length, 3);
  assert.equal(localEntry.examples.length, 1);
});

test('buildWordDraftFromDictionary prioritizes bilingual examples ahead of untranslated sense examples', () => {
  const entryWithUntranslatedSense: DictionaryLookupResult = {
    ...SAMPLE_ENTRY,
    senses: [
      {
        ...SAMPLE_ENTRY.senses[0],
        examples: [
          { sentence: 'An untranslated Free Dictionary example one.', translation: '' },
          { sentence: 'An untranslated Free Dictionary example two.', translation: '' },
        ],
      },
    ],
    examples: [
      { sentence: 'Tom created Minecraft.', translation: 'Tom tạo ra Minecraft.' },
      { sentence: 'Leon created a new operating system.', translation: 'Leon đã tạo ra một hệ điều hành.' },
    ],
  };

  const draft = buildWordDraftFromDictionary(entryWithUntranslatedSense, 0);
  assert.equal(draft.examples[0].sentence, 'Tom created Minecraft.');
  assert.equal(draft.examples[0].translation, 'Tom tạo ra Minecraft.');
  assert.equal(draft.examples[1].sentence, 'Leon created a new operating system.');
  assert.equal(draft.examples[1].translation, 'Leon đã tạo ra một hệ điều hành.');
});

test('safeExternalUrl allows only https URLs and createLookupDeck builds valid custom deck', () => {
  assert.equal(safeExternalUrl('https://dictionary.cambridge.org/'), 'https://dictionary.cambridge.org/');
  assert.equal(safeExternalUrl('javascript:alert(1)'), undefined);
  assert.equal(safeExternalUrl('http://example.com'), undefined);

  const deck = createLookupDeck(123456);
  assert.equal(deck.id, LOOKUP_DECK_ID);
  assert.equal(deck.isCustom, true);
  assert.equal(deck.language, 'en');
});

test('createIdiomDeck, isIdiomWord, idiom draft, and backup round-trip preserve collection: idioms', async () => {
  const idiomDeck = createIdiomDeck(987654);
  assert.equal(idiomDeck.id, IDIOM_DECK_ID);
  assert.equal(idiomDeck.collection, 'idioms');
  assert.equal(idiomDeck.isCustom, true);

  const idiomEntry: DictionaryLookupResult = {
    ...SAMPLE_ENTRY,
    term: 'break the ice',
    queriedTerm: 'break the ice',
    inflectionNote: undefined,
    isIdiom: true,
    relatedIdioms: ['on thin ice', 'skate on thin ice'],
    senses: [
      {
        partOfSpeech: ENGLISH_IDIOM_POS,
        meaning: 'phá vỡ sự ngại ngùng ban đầu',
        collocations: [],
        examples: [
          { sentence: 'She told a joke to break the ice.', translation: 'Cô ấy kể chuyện vui để phá vỡ sự ngại ngùng.' },
        ],
        synonyms: [],
        antonyms: [],
      },
    ],
  };

  const draft = buildWordDraftFromDictionary(idiomEntry, 0);
  assert.equal(draft.isIdiom, true);
  assert.equal(draft.partOfSpeech, ENGLISH_IDIOM_POS);

  const savedIdiom: VocabWord = {
    id: 'w-custom-idiom-1',
    deckId: idiomDeck.id,
    language: 'en',
    term: draft.term,
    phonetic: '',
    partOfSpeech: draft.partOfSpeech,
    meaning: draft.meaning,
    collocations: [],
    examples: draft.examples,
    synonyms: [],
    antonyms: [],
    bloomLevel: 1,
    srs: createInitialSRS(987654),
    createdAt: 987654,
  };
  assert.equal(isIdiomWord(savedIdiom), true);

  const localResult = buildLocalLookupResult(savedIdiom, [savedIdiom]);
  assert.equal(localResult.isIdiom, true);

  const backup = createBackup(
    {
      decks: [idiomDeck, ...INITIAL_DECKS],
      words: [savedIdiom, ...INITIAL_WORDS],
      logs: INITIAL_LOGS,
      profile: INITIAL_PROFILE,
      settings: INITIAL_SETTINGS,
      version: CURRENT_DATA_VERSION,
    },
    {},
    new Date('2026-01-01T00:00:00Z'),
  );
  const restored = await previewBackup(new Blob([JSON.stringify(backup)]));
  const restoredDeck = restored.state.decks.find((d) => d.id === IDIOM_DECK_ID);
  assert.equal(restoredDeck?.collection, 'idioms');
  assert.ok(restored.state.words.some((w) => w.id === 'w-custom-idiom-1' && w.partOfSpeech === ENGLISH_IDIOM_POS));
});

test('mergeLocalWithOnlineLookup preserves curated Largo core meaning/examples while enriching with online senses and IPA', () => {
  const curatedAddress: VocabWord = {
    id: 'deck-en-a1-conversation-address',
    deckId: 'deck-en-a1-conversation',
    language: 'en',
    term: 'address',
    phonetic: '/əˈdres/',
    partOfSpeech: 'Danh từ',
    meaning: 'địa chỉ',
    collocations: [{ phrase: 'home address', meaning: 'địa chỉ nhà' }],
    examples: [
      { sentence: "What's your address?", translation: 'Địa chỉ của bạn là gì?' },
      { sentence: 'Write your address here.', translation: 'Hãy viết địa chỉ của bạn ở đây.' },
    ],
    synonyms: [],
    antonyms: [],
    bloomLevel: 1,
    srs: createInitialSRS(1000),
    createdAt: 1000,
  };

  const onlineEntry: DictionaryLookupResult = {
    ...SAMPLE_ENTRY,
    term: 'address',
    queriedTerm: 'address',
    inflectionNote: undefined,
    phonetic: '/əˈdrɛs/',
    englishForms: {
      'en-GB': { phonetic: '/əˈdres/' },
      'en-US': { phonetic: '/ˈæd.res/' },
    },
    senses: [
      {
        partOfSpeech: 'Danh từ',
        meaning: 'Địa chỉ; Bài diễn văn',
        englishDefinition: 'The location of a building or place where mail can be delivered.',
        collocations: [{ phrase: 'email address', meaning: 'địa chỉ thư điện tử' }],
        examples: [
          { sentence: 'What is your address?', translation: 'Địa chỉ của bạn là gì?' },
          { sentence: 'I went to his address yesterday.', translation: 'Tôi đã đến địa chỉ của anh ấy hôm qua.' },
          { sentence: 'The program crashed at that address.', translation: '' },
        ],
        synonyms: ['location'],
        antonyms: [],
      },
      {
        partOfSpeech: 'Động từ',
        meaning: 'giải quyết vấn đề; phát biểu trước',
        englishDefinition: 'To deal with or speak directly to someone.',
        collocations: [{ phrase: 'address a problem', meaning: 'giải quyết một vấn đề' }],
        examples: [{ sentence: 'We need to address this issue immediately.', translation: 'Chúng ta cần giải quyết vấn đề này ngay lập tức.' }],
        synonyms: ['tackle'],
        antonyms: [],
      },
    ],
    examples: [{ sentence: 'I went to his address yesterday.', translation: 'Tôi đã đến địa chỉ của anh ấy hôm qua.' }],
    collocations: [{ phrase: 'email address', meaning: 'địa chỉ thư điện tử' }],
    wordFamily: [{ term: 'addressee', partOfSpeech: 'Danh từ' }],
    relatedIdioms: ['public address'],
  };

  const merged = mergeLocalWithOnlineLookup(curatedAddress, onlineEntry, [curatedAddress]);
  assert.equal(merged.senses.length, 2);
  assert.equal(merged.senses[0].partOfSpeech, 'Danh từ');
  assert.equal(merged.senses[0].meaning, 'địa chỉ');
  assert.equal(merged.senses[0].englishDefinition, 'The location of a building or place where mail can be delivered.');
  assert.equal(merged.senses[0].examples[0].sentence, "What's your address?");
  assert.ok(!merged.senses[0].examples.some((e) => e.sentence === 'What is your address?'));
  assert.ok(!merged.senses[0].examples.some((e) => e.sentence.includes('program crashed')));
  assert.equal(merged.senses[0].collocations[0].phrase, 'home address');
  assert.equal(merged.senses[1].partOfSpeech, 'Động từ');
  assert.equal(merged.englishForms?.['en-US']?.phonetic, '/ˈæd.res/');
  assert.equal(merged.providers[0].id, 'largo-library');
  assert.deepEqual(merged.relatedIdioms, ['public address']);

  // Switching draft to the Verb tab must keep Verb examples isolated without leaking Noun examples
  const verbDraft = buildWordDraftFromDictionary(merged, 1);
  assert.equal(verbDraft.partOfSpeech, 'Động từ');
  assert.equal(verbDraft.examples[0].sentence, 'We need to address this issue immediately.');
  assert.equal(verbDraft.examples[1].sentence, '');
});

test('mergeLocalWithOnlineLookup isolates mismatched same-POS online sense instead of mixing definitions', () => {
  const curatedTakeOff: VocabWord = {
    id: 'deck-en-phrasal-take-off',
    deckId: 'deck-en-phrasal',
    language: 'en',
    term: 'take off',
    phonetic: '',
    partOfSpeech: 'Cụm động từ',
    meaning: 'cởi; tháo ra',
    collocations: [],
    examples: [{ sentence: 'Take off your shoes.', translation: 'Hãy cởi giày.' }],
    synonyms: [],
    antonyms: [],
    bloomLevel: 1,
    srs: createInitialSRS(1000),
    createdAt: 1000,
  };

  const onlineTakeOff: DictionaryLookupResult = {
    ...SAMPLE_ENTRY,
    term: 'take off',
    queriedTerm: 'take off',
    inflectionNote: undefined,
    senses: [
      {
        partOfSpeech: 'Cụm động từ',
        meaning: 'Rời khỏi mặt đất và bay lên không trung hoặc bay',
        englishDefinition: '(intransitive) To leave the ground and ascend into the air or into flight.',
        collocations: [],
        examples: [{ sentence: 'The plane has been cleared to take off from runway 3.', translation: 'Máy bay đã được phép cất cánh từ đường băng số 3.' }],
        synonyms: [],
        antonyms: [],
      },
      {
        partOfSpeech: 'Danh từ',
        meaning: 'Sự cất cánh của máy bay',
        englishDefinition: 'The rising of an aircraft into flight.',
        collocations: [],
        examples: [],
        synonyms: [],
        antonyms: [],
      },
    ],
    examples: [{ sentence: 'The plane has been cleared to take off from runway 3.', translation: 'Máy bay đã được phép cất cánh từ đường băng số 3.' }],
  };

  const merged = mergeLocalWithOnlineLookup(curatedTakeOff, onlineTakeOff, [curatedTakeOff]);
  assert.equal(merged.senses.length, 3);
  assert.equal(merged.senses[0].partOfSpeech, 'Cụm động từ');
  assert.equal(merged.senses[0].meaning, 'cởi; tháo ra');
  assert.equal(merged.senses[0].englishDefinition, undefined);
  assert.equal(merged.senses[0].examples.length, 1);
  assert.equal(merged.senses[0].examples[0].sentence, 'Take off your shoes.');
  assert.equal(merged.senses[1].partOfSpeech, 'Cụm động từ (nghĩa khác)');
  assert.match(merged.senses[1].englishDefinition ?? '', /ascend into the air/i);
  assert.equal(merged.senses[2].partOfSpeech, 'Danh từ');
});
