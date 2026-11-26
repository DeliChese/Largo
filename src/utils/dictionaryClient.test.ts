import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialSRS } from './srsBloom';
import {
  buildLocalLookupResult,
  buildWordDraftFromDictionary,
  createLookupDeck,
  getMergedWordFamily,
  LOOKUP_DECK_ID,
  safeExternalUrl,
  type DictionaryLookupResult,
} from './dictionaryClient';
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
  assert.equal(draft.examples[1].sentence, 'Doctors advocate regular exercise for heart health.');
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
