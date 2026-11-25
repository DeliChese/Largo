import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_DECKS, ENGLISH_LEVELS, ENGLISH_PHRASAL_LEVEL, ENGLISH_V7_WORD_DECK_IDS, ENGLISH_WORDS, STARTER_ENGLISH_DECKS, STARTER_ENGLISH_WORDS } from '../data/englishDecks';
import { CURRENT_DATA_VERSION, hasCurrentSeedDecks, INITIAL_DECKS, INITIAL_PROFILE, INITIAL_SETTINGS, INITIAL_WORDS, withCurrentSeed } from '../data/seedVocab';
import type { VocabWord } from '../types/vocab';
import { applyStudyReview, getClozeExample, getCollocationPrompt, getPracticeWords, getStudyChoices } from './studyPlan';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './studyScope';
import { getEnglishStudyWord, getSpeechVoice } from './englishStudy';
import { exportDeckWord, importEnglishForms, importExamples, importTerms } from './vocabImport';

function makeWord(id: string, deckId: string, term: string): VocabWord {
  return {
    id,
    deckId,
    language: 'en',
    term,
    phonetic: '/test/',
    partOfSpeech: 'Danh từ',
    meaning: 'nghĩa mẫu',
    collocations: [{ phrase: term + ' 1', meaning: 'cụm mẫu' }],
    examples: [{ sentence: `We use ${term} today.`, translation: 'câu mẫu' }],
    synonyms: [],
    antonyms: [],
    bloomLevel: 1,
    srs: {
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: 1000,
      lastReviewedAt: null,
    },
    createdAt: 1000,
  };
}

test('language and level selections keep the English review library scoped', () => {
  assert.deepEqual(getStudyLanguages(INITIAL_DECKS), ['en']);
  assert.deepEqual(getStudyLevels('en', INITIAL_DECKS).map(({ id }) => id), ['all', ...ENGLISH_LEVELS, ENGLISH_PHRASAL_LEVEL]);

  const a2Decks = getScopedDecks(INITIAL_DECKS, 'en', 'a2');
  const a2 = getScopedWords(INITIAL_WORDS, a2Decks, 'en');
  assert.equal(a2.filter(({ id }) => !id.startsWith('en-extra-')).length, 1008);
  assert.ok(a2.every((word) => word.language === 'en' && a2Decks.some((deck) => word.deckId === deck.id)));

  const b1Decks = getScopedDecks(INITIAL_DECKS, 'en', 'b1');
  const b1 = getScopedWords(INITIAL_WORDS, b1Decks, 'en');
  assert.equal(b1.filter(({ id }) => !id.startsWith('en-extra-')).length, 1058);
  assert.equal(getScopedWords(INITIAL_WORDS, getScopedDecks(INITIAL_DECKS, 'en', 'b2'), 'en')
    .filter(({ id }) => !id.startsWith('en-extra-')).length, 1034);
  assert.ok(getScopedWords(INITIAL_WORDS, getScopedDecks(INITIAL_DECKS, 'en', 'c1'), 'en').length >= 250);
});

test('custom decks with explicit or missing levels are included in English study levels', () => {
  const customC1 = { ...ENGLISH_DECKS[0], id: 'custom-c1', level: 'C1', isCustom: true };
  const unclassified = { ...ENGLISH_DECKS[0], id: 'user-words', level: undefined, category: 'Cá nhân', isCustom: true };
  assert.deepEqual(getStudyLanguages([...INITIAL_DECKS, customC1]), ['en']);
  assert.equal(getDeckStudyLevel(ENGLISH_DECKS[0]), 'a1');
  assert.deepEqual(getStudyLevels('en', [customC1, unclassified]).map(({ id }) => id), ['all', 'a1', 'a2', 'b1', 'b2', 'c1', 'custom']);
  assert.deepEqual(getScopedDecks([customC1, unclassified], 'en', 'custom'), [unclassified]);
});

test('English source data contains the A1–B2 word lists, collocation decks, and regional pairs', () => {
  const original = ENGLISH_WORDS.filter(({ id }) => !id.startsWith('en-extra-'));
  const baseWords = original.filter(({ id }) => !id.startsWith('en-phrasal-'));
  assert.equal(baseWords.length, 4008);
  assert.equal(new Set(ENGLISH_WORDS.map((word) => word.id)).size, ENGLISH_WORDS.length);
  assert.equal(new Set(baseWords.map((word) => word.term.toLowerCase())).size, baseWords.length);
  for (const deck of ENGLISH_DECKS) {
    const cards = getScopedWords(ENGLISH_WORDS, [deck], 'en');
    assert.ok(cards.length && cards.length <= 40, deck.id);
    assert.ok(cards.every((word) => word.term && word.meaning && word.partOfSpeech), deck.id);
  }
  for (const word of STARTER_ENGLISH_WORDS) {
    assert.ok(word.phonetic && word.partOfSpeech && word.meaning && word.collocations[0]?.meaning && word.examples[0]?.translation, word.term);
    assert.ok(getClozeExample(word), word.term);
  }
  for (const level of ['a1', 'a2', 'b1', 'b2']) {
    const decks = getScopedDecks(ENGLISH_DECKS, 'en', level);
    const words = getScopedWords(original, decks, 'en');
    const phraseDecks = decks.filter(({ collection, id }) => collection === 'collocations' && words.some((word) => word.deckId === id));
    const phrases = getScopedWords(words, phraseDecks, 'en');
    assert.equal(phrases.length, 72);
    const regional = words.filter(({ id }) => id.startsWith('en-regional-'));
    assert.equal(regional.length, 12);
    for (const locale of ['en-GB', 'en-US'] as const) {
      const localized = words.map((word) => getEnglishStudyWord(word, locale));
      assert.ok(localized.every((word) => word.examples.length >= 2));
      for (const deck of phraseDecks) {
        const exercises = getPracticeWords(localized, deck.id, 'all', 1, 'collocation', Date.now());
        assert.equal(exercises.length, 18);
        for (const word of exercises) {
          assert.equal(getCollocationPrompt(word), word.meaning);
          assert.ok(word.examples[0]?.translation && getClozeExample(word), word.term);
        }
        assert.ok(getStudyChoices(exercises[0], localized, true).some(({ label }) => label === exercises[0].term));
      }
      assert.ok(regional.every((word) => getClozeExample(getEnglishStudyWord(word, locale))));
    }
  }
});

test('the phrasal collection has two distinct bilingual contexts for each meaning', () => {
  const decks = ENGLISH_DECKS.filter((deck) => deck.collection === 'phrasal' && getDeckStudyLevel(deck) === ENGLISH_PHRASAL_LEVEL);
  assert.ok(decks.every((deck) => deck.category));
  assert.ok(new Set(decks.map(({ category }) => category)).size > 1);
  assert.ok(ENGLISH_DECKS.every(({ category }) => category !== 'Từ thường dùng'));
  const words = getScopedWords(ENGLISH_WORDS, decks, 'en');
  assert.equal(words.length, 33);
  for (const { term, examples, notes } of words) {
    assert.equal(examples.length, 2, term);
    const sentences = examples.map(({ sentence }) => sentence.toLowerCase().replace(/[.!?]$/, ''));
    assert.ok(sentences.every((sentence, index) => sentence.includes(term) && !sentence.includes(sentences[1 - index])), term);
    assert.ok(examples.every(({ translation, sourceUrl }) => translation && !sourceUrl), term);
    assert.doesNotMatch(notes ?? '', /PDF|trang \d/);
  }
});

test('the expanded catalog has 7,000 unique entries and covers all curriculum types', () => {
  const keys = ENGLISH_WORDS.map(({ term }) => term.normalize('NFKC').trim().toLowerCase()
    .replace(/[‘’]/g, "'").replace(/[‐‑–—]/g, '-').replace(/\s+/g, ' ').replace(/[.!?]+$/u, ''));
  assert.equal(keys.length, 7_000);
  assert.equal(new Set(keys).size, 7_000);
  assert.equal(new Set(ENGLISH_DECKS.map(({ id }) => id)).size, ENGLISH_DECKS.length);
  assert.equal(getScopedWords(ENGLISH_WORDS, ENGLISH_DECKS, 'en').length, 7_000);
  assert.ok(ENGLISH_WORDS.every(({ examples }) => examples.some(({ sentence }) => sentence.trim())));
  assert.ok(ENGLISH_WORDS.filter(({ examples }) => examples.some(({ translation }) => translation.trim())).length > 6_100);
  // Editorial review intentionally removes unverified relations; quantity is not a quality gate.
  for (const word of ENGLISH_WORDS) {
    for (const relations of [word.synonyms, word.antonyms]) {
      assert.ok(Array.isArray(relations), word.id);
      assert.ok(relations.every(relation => typeof relation === 'string' && relation.trim()), word.id);
    }
  }
  assert.deepEqual(ENGLISH_WORDS.find(word => word.id === 'en-vocab-marriage')?.synonyms, []);
  assert.ok(ENGLISH_WORDS.some(word => word.synonyms.length > 0));
  assert.ok(ENGLISH_WORDS.some(word => word.antonyms.length > 0));
  const phrases = getScopedWords(ENGLISH_WORDS, ENGLISH_DECKS.filter(({ collection }) => collection === 'phrases'), 'en');
  assert.deepEqual(new Set(phrases.map(({ partOfSpeech }) => partOfSpeech)), new Set(['Cụm danh từ', 'Cụm tính từ']));
  assert.ok(phrases.every(({ examples }) => examples[0]?.translation));
  assert.equal(getScopedWords(ENGLISH_WORDS, ENGLISH_DECKS.filter(({ collection }) => collection === 'phrasal'), 'en').length, 230);
});

test('English regional forms share a card ID and SRS, with matching examples and accent-specific voices', () => {
  const word = ENGLISH_WORDS.find(({ id }) => id === 'en-regional-color')!;
  const british = getEnglishStudyWord(word, 'en-GB');
  const american = getEnglishStudyWord(word, 'en-US');
  assert.equal(british.term, 'colour');
  assert.equal(american.term, 'color');
  assert.equal(british.id, american.id);
  assert.notEqual(british.phonetic, american.phonetic);
  assert.equal(getClozeExample(british)?.answer, 'colour');
  assert.equal(getClozeExample(american)?.answer, 'color');
  const reviewed = applyStudyReview(word, 3, 'standard', Date.now(), 'flashcard');
  assert.equal(getEnglishStudyWord(reviewed, 'en-GB').srs.repetitions, 1);
  assert.equal(getEnglishStudyWord(reviewed, 'en-US').srs, reviewed.srs);
  assert.deepEqual(importEnglishForms(word.englishForms), word.englishForms);
  const legacyVoices = { en: 'en-GB-SoniaNeural' };
  assert.equal(getSpeechVoice(legacyVoices), undefined);
  assert.equal(getSpeechVoice(legacyVoices, 'en-US'), undefined);
  assert.equal(getSpeechVoice(legacyVoices, 'en-GB'), legacyVoices.en);
  assert.equal(getSpeechVoice({ ...legacyVoices, 'en-US': 'en-US-JennyNeural' }, 'en-US'), 'en-US-JennyNeural');
  assert.equal(getSpeechVoice({ 'en-US': legacyVoices.en }, 'en-US'), undefined);
});

test('deck export retains bilingual examples and both types of word relations', () => {
  const word: VocabWord = {
    ...makeWord('custom-english', 'deck-english-custom', 'carry on'),
    examples: [
      { sentence: 'We decided to carry on.', translation: 'Chúng tôi quyết định tiếp tục.' },
      { sentence: 'She will carry on studying next year.', translation: 'Cô ấy sẽ tiếp tục học vào năm sau.' },
    ],
    synonyms: ['continue'],
    antonyms: ['quit'],
    personalRelations: { synonyms: ['continue', 'keep going'], antonyms: ['give up'] },
  };
  const exported = exportDeckWord(word);
  assert.deepEqual(importExamples(exported.examples), word.examples);
  assert.deepEqual(importTerms(exported.synonyms), ['continue', 'keep going']);
  assert.deepEqual(importTerms(exported.antonyms), ['quit', 'give up']);
  assert.deepEqual(importTerms('quit; give up, quit'), ['quit', 'give up']);
});

test('v6 English saves gain the curriculum without reviving deletions or replacing progress and personal cards', () => {
  const [reviewed, deleted] = STARTER_ENGLISH_WORDS;
  const customDeck = { ...STARTER_ENGLISH_DECKS[0], id: 'en-personal', isCustom: true };
  const custom = makeWord('en-personal-word', customDeck.id, 'text a friend');
  const srs = { ...reviewed.srs, repetitions: 3, lastReviewedAt: 12000, nextReviewAt: 25000 };
  const old = {
    version: 6,
    decks: [
      { ...STARTER_ENGLISH_DECKS[0], id: 'deck-zh-hsk30-hsk1-l01', language: 'zh' as const, level: 'hsk1' },
      ...STARTER_ENGLISH_DECKS,
      customDeck,
    ],
    words: [
      { ...makeWord('zh-0001', 'deck-zh-hsk30-hsk1-l01', '你好'), language: 'zh' as const },
      ...STARTER_ENGLISH_WORDS.filter(({ id }) => id !== reviewed.id && id !== deleted.id),
      { ...reviewed, srs, bloomLevel: 3 as const, lastSynthesisAt: 11000 },
      custom,
    ],
    profile: { ...INITIAL_PROFILE, todayWordIds: ['zh-0001', reviewed.id] },
    settings: { ...INITIAL_SETTINGS, studyLevels: { en: 'a2' } },
    logs: [],
  } as unknown as Parameters<typeof withCurrentSeed>[0];
  const current = withCurrentSeed(old);
  assert.equal(current.version, CURRENT_DATA_VERSION);
  assert.ok(hasCurrentSeedDecks(current.decks));
  assert.ok(current.decks.every((deck) => deck.language === 'en'));
  assert.ok(current.words.every((word) => word.language === 'en'));
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.srs, srs);
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.bloomLevel, 3);
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.lastSynthesisAt, 11000);
  assert.ok(!current.words.some(({ id }) => id === deleted.id));
  assert.ok(current.words.includes(custom) && current.decks.includes(customDeck));
  assert.deepEqual(current.profile.todayWordIds, [reviewed.id]);
  assert.equal(current.settings?.studyLevels?.en, 'a2');
  assert.ok(getScopedWords(current.words, getScopedDecks(current.decks, 'en', 'b2'), 'en').length);
  assert.equal(withCurrentSeed(current), current);
});

test('v7 curriculum upgrades preserve moved card progress, missing cards and personal lexical relations', () => {
  const moved = ENGLISH_WORDS.filter(({ id, deckId }) =>
    id.startsWith('en-vocab-') && ENGLISH_V7_WORD_DECK_IDS.get(id) !== deckId);
  const [reviewed, deleted] = moved;
  assert.ok(reviewed && deleted);
  const oldDecks = new Set(ENGLISH_V7_WORD_DECK_IDS.values());
  const original = INITIAL_DECKS.filter(({ id }) => oldDecks.has(id));
  assert.equal(original.length, oldDecks.size);
  const srs = { ...reviewed.srs, repetitions: 4, lastReviewedAt: 12500, nextReviewAt: 88000 };
  const personalRelations = { synonyms: ['personal example'], antonyms: ['personal contrast'] };
  const legacyWord = { ...reviewed, deckId: ENGLISH_V7_WORD_DECK_IDS.get(reviewed.id)!, srs, personalRelations, bloomLevel: 4 as const };
  const old = {
    version: 7,
    decks: original,
    words: [...INITIAL_WORDS.filter((word) => word.id !== reviewed.id && word.id !== deleted.id && !word.id.startsWith('en-phrasal-')), legacyWord],
    profile: { ...INITIAL_PROFILE, todayWordIds: [reviewed.id] },
    logs: [],
  };
  const state = withCurrentSeed(old);
  const migrated = state.words.find(({ id }) => id === reviewed.id)!;
  assert.equal(migrated.deckId, reviewed.deckId);
  assert.equal(migrated.srs, srs);
  assert.equal(migrated.bloomLevel, 4);
  assert.equal(migrated.personalRelations, personalRelations);
  assert.ok(!state.words.some(({ id }) => id === deleted.id));
  assert.ok(state.words.some(({ term }) => term === 'wake up'));
  assert.deepEqual(state.profile.todayWordIds, [reviewed.id]);
  assert.equal(withCurrentSeed(state), state);
});
