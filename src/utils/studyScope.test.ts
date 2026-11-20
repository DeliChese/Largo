import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_DECKS, ENGLISH_WORDS } from '../data/englishDecks';
import { CHINESE_DECKS, CHINESE_WORDS } from '../../Chinese/chineseDecks';
import { LEGACY_DECK_ID_MAP, LEGACY_WORD_ID_MAP } from '../data/seedMigration';
import catalogue from '../../Chinese/chineseVocabulary.json' with { type: 'json' };
import { CURRENT_DATA_VERSION, INITIAL_DECKS, INITIAL_PROFILE, INITIAL_WORDS, withCurrentSeed } from '../data/seedVocab';
import type { StudySessionLog, VocabDeck, VocabWord } from '../types/vocab';
import { searchChineseDictionary } from './chineseDict';
import { getClozeExample } from './studyPlan';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './studyScope';

function makeWord(id: string, deckId: string, term: string, language: 'zh' | 'en' = 'zh'): VocabWord {
  return {
    id,
    deckId,
    language,
    term,
    phonetic: 'test',
    partOfSpeech: 'Danh từ',
    meaning: 'nghĩa mẫu',
    collocations: [{ phrase: term + ' 1', meaning: 'cụm mẫu' }],
    examples: [{ sentence: term + ' 句子。', phonetic: 'jùzi', translation: 'câu mẫu' }],
    synonyms: [],
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

test('language and level selections keep the review library scoped without legacy decks', () => {
  assert.deepEqual(getStudyLanguages(INITIAL_DECKS), ['zh', 'en']);
  assert.deepEqual(getStudyLevels('zh', INITIAL_DECKS).map(({ id }) => id), ['all', 'hsk1', 'hsk2', 'hsk3', 'everyday']);
  assert.deepEqual(getStudyLevels('en', INITIAL_DECKS).map(({ id }) => id), ['all', 'a1', 'a2', 'b1']);

  const a2Decks = getScopedDecks(INITIAL_DECKS, 'en', 'a2');
  const a2 = getScopedWords(INITIAL_WORDS, a2Decks, 'en');
  assert.equal(a2Decks.length, 2);
  assert.equal(a2.length, 24);
  assert.ok(a2.every((word) => word.language === 'en' && a2Decks.some((deck) => word.deckId === deck.id)));

  const b1Decks = getScopedDecks(INITIAL_DECKS, 'en', 'b1');
  const b1 = getScopedWords(INITIAL_WORDS, b1Decks, 'en');
  assert.equal(b1Decks.length, 2);
  assert.equal(b1.length, 24);
  assert.equal(getScopedDecks(INITIAL_DECKS, 'zh', 'b1').length, 0);
});

test('custom languages and explicit levels are included alongside starter languages', () => {
  const deck = { ...ENGLISH_DECKS[0], language: 'ja' as const, level: 'N4', isCustom: true };
  const unclassified = { ...deck, id: 'user-words', level: undefined, category: 'Cá nhân' };
  assert.deepEqual(getStudyLanguages([...INITIAL_DECKS, deck]), ['zh', 'en', 'ja']);
  assert.equal(getDeckStudyLevel(CHINESE_DECKS.find((d) => d.level === 'hsk2')!), 'hsk2');
  assert.deepEqual(getStudyLevels('ja', [deck, unclassified]).map(({ id }) => id), ['all', 'n4', 'custom']);
  assert.deepEqual(getScopedDecks([deck, unclassified], 'ja', 'custom'), [unclassified]);
});

test('English seed data has 6 balanced decks of 12 cards with complete context fields', () => {
  assert.equal(ENGLISH_DECKS.length, 6);
  assert.equal(ENGLISH_WORDS.length, 72);
  assert.equal(new Set(ENGLISH_WORDS.map((word) => word.id)).size, ENGLISH_WORDS.length);
  for (const deck of ENGLISH_DECKS) {
    assert.equal(ENGLISH_WORDS.filter((w) => w.deckId === deck.id).length, 12, deck.id);
  }
  for (const word of ENGLISH_WORDS) {
    assert.ok(word.phonetic && word.partOfSpeech && word.meaning && word.collocations[0]?.meaning && word.examples[0]?.translation, word.term);
    assert.ok(getClozeExample(word), word.term);
  }
});

test('unified Chinese library has 56 balanced decks and 1382 uniformly complete cards', async () => {
  assert.equal(CHINESE_DECKS.length, 56);
  assert.equal(CHINESE_WORDS.length, 1382);
  assert.equal(new Set(CHINESE_WORDS.map(({ id }) => id)).size, CHINESE_WORDS.length);
  assert.ok(CHINESE_DECKS.every((deck) => deck.level !== 'legacy' && deck.category !== 'Bộ từ trước đây'));

  const cards = catalogue.flatMap<{ hskId?: number; a1000Id?: number }>((topic) => topic.cards);
  const sourceIds = (ids: Array<number | undefined>) => [...new Set(ids.filter((id) => id !== undefined))].sort((a, b) => a - b);
  assert.deepEqual(sourceIds(cards.map((card) => card.hskId)), Array.from({ length: 1000 }, (_, i) => i + 1));
  assert.deepEqual(sourceIds(cards.map((card) => card.a1000Id)), Array.from({ length: 1000 }, (_, i) => i + 1));

  for (const [level, expectedDecks, expectedWords] of [
    ['hsk1', 12, 300],
    ['hsk2', 9, 200],
    ['hsk3', 19, 500],
    ['everyday', 16, 382],
  ] as const) {
    const decks = getScopedDecks(INITIAL_DECKS, 'zh', level);
    assert.equal(decks.length, expectedDecks, `deck count for ${level}`);
    assert.equal(getScopedWords(INITIAL_WORDS, decks, 'zh').length, expectedWords, `word count for ${level}`);
    for (const deck of decks) {
      const count = CHINESE_WORDS.filter((w) => w.deckId === deck.id).length;
      assert.ok(count >= 16 && count <= 34, `deck ${deck.id} has out-of-range size ${count}`);
    }
  }

  for (const word of CHINESE_WORDS) {
    assert.ok(word.phonetic, `missing phonetic on ${word.id}`);
    assert.ok(word.partOfSpeech, `missing partOfSpeech on ${word.id}`);
    assert.ok(word.meaning, `missing meaning on ${word.id}`);
    assert.ok(word.sinoVietnamese, `missing sinoVietnamese on ${word.id}`);
    assert.ok(word.radical, `missing radical on ${word.id}`);
    assert.ok(word.collocations.length > 0 && word.collocations[0].meaning, `missing collocation on ${word.id}`);
    assert.ok(word.examples.length > 0 && word.examples[0].sentence && word.examples[0].phonetic && word.examples[0].translation, `missing example fields on ${word.id}`);
    assert.ok(!/\([^)]*\)\s*$/.test(word.examples[0].sentence), `trailing parenthetical pinyin left in sentence on ${word.id}`);
    assert.ok(word.notes, `missing notes on ${word.id}`);
    assert.ok(
      !/(?:khác thanh hoặc biến thể|cần kiểm tra từ loại hoặc cách diễn đạt|trùng chữ trong đề cương|nhiều mục từ điển|dòng này ưu tiên|a1000 ưu tiên)/i.test(word.notes),
      `editorial triage artifact left in notes on ${word.id}: ${word.notes}`,
    );
  }

  assert.deepEqual(INITIAL_WORDS.filter(({ term }) => term === '过').map(({ phonetic }) => phonetic), ['guo', 'guò']);
  assert.deepEqual(INITIAL_WORDS.filter(({ term }) => term === '只').map(({ phonetic }) => phonetic), ['zhī', 'zhǐ']);
  assert.equal(INITIAL_WORDS.filter(({ term }) => term === '点').length, 2);

  const [entry] = await searchChineseDictionary('saoma');
  assert.equal(entry?.term, '扫码');
  assert.deepEqual(entry.collocations, [{ phrase: '扫码支付', meaning: 'quét mã thanh toán' }]);
  assert.ok(entry.examples[0]?.phonetic);
});

test('migrating v1 and v4 states preserves SRS progress, custom decks, deletions, and adds new v5 cards', () => {
  const oldDeckId = 'deck-hsk1-core';
  const oldDeck: VocabDeck = {
    id: oldDeckId, name: 'HSK 1 · Nền tảng', description: 'old', language: 'zh',
    category: 'HSK 1', level: 'hsk1', isCustom: false, createdAt: 1000,
  };
  const customDeck: VocabDeck = { ...oldDeck, id: 'custom-deck', isCustom: true };
  const reviewedId = 'hsk1-core-1';
  const deletedId = 'hsk1-core-4';
  const mappedReviewedId = LEGACY_WORD_ID_MAP[reviewedId];
  const mappedDeletedId = LEGACY_WORD_ID_MAP[deletedId];

  const reviewedSrs = {
    easeFactor: 2.6, intervalDays: 6, repetitions: 4, lapses: 0, nextReviewAt: 25_000, lastReviewedAt: 12_000,
  };
  const reviewedOldWord: VocabWord = {
    ...makeWord(reviewedId, oldDeckId, '我'),
    bloomLevel: 3,
    lastSynthesisAt: 12_000,
    srs: reviewedSrs,
  };
  const customWord = makeWord('custom-word', customDeck.id, '笔记本');
  const wordInOldDeck = makeWord('word-in-old-deck', oldDeckId, '笔记本电脑');

  const log: StudySessionLog = {
    id: 'past-session', timestamp: 12_000, mode: 'flashcard', deckId: oldDeckId,
    wordsReviewed: 1, correctCount: 1, xpEarned: 4, durationSeconds: 20,
  };

  // v1 upgrade
  const v1Old = {
    version: 1,
    decks: [customDeck, oldDeck],
    words: [customWord, wordInOldDeck, reviewedOldWord],
    profile: { ...INITIAL_PROFILE, xp: 4, todayWordIds: [reviewedId] },
    logs: [log],
  };
  const migratedV1 = withCurrentSeed(v1Old);
  assert.equal(migratedV1.version, CURRENT_DATA_VERSION);
  const updatedWord = migratedV1.words.find(({ id }) => id === mappedReviewedId);
  assert.equal(updatedWord?.srs, reviewedSrs);
  assert.equal(updatedWord?.bloomLevel, 3);
  assert.equal(updatedWord?.lastSynthesisAt, 12_000);
  assert.ok(updatedWord?.examples[0]?.phonetic);
  assert.ok(updatedWord?.sinoVietnamese);
  assert.deepEqual(migratedV1.profile.todayWordIds, [mappedReviewedId]);
  assert.deepEqual(migratedV1.logs, [{ ...log, deckId: LEGACY_DECK_ID_MAP[oldDeckId], level: 'hsk1' }]);
  assert.ok(migratedV1.words.some(({ id }) => id === customWord.id));
  const migratedOldDeckWord = migratedV1.words.find(({ id }) => id === wordInOldDeck.id);
  assert.equal(migratedOldDeckWord?.deckId, LEGACY_DECK_ID_MAP[oldDeckId]);
  assert.ok(migratedV1.decks.some(({ id }) => id === migratedOldDeckWord?.deckId));
  assert.ok(migratedV1.decks.some(({ id }) => id === customDeck.id));
  assert.equal(migratedV1.decks.some(({ level }) => level === 'legacy'), false);
  assert.ok(migratedV1.words.some(({ term }) => term === '感兴趣'));
  assert.equal(migratedV1.words.some(({ id }) => id === mappedDeletedId), false);
  assert.equal(migratedV1.words.filter(({ language }) => language === 'en').length, ENGLISH_WORDS.length);

  // v4 upgrade: keeps v4 deletions (zh-a1000-4 and 1 old English card), keeps SRS on zh-a1000-*, adds new HSK 3 + B1-2 cards
  const v4WordId = 'zh-a1000-158';
  const mappedV4Id = LEGACY_WORD_ID_MAP[v4WordId];
  const deletedV4Id = 'zh-a1000-4';
  const mappedDeletedV4Id = LEGACY_WORD_ID_MAP[deletedV4Id];
  const v4Srs = { ...reviewedSrs, repetitions: 2, nextReviewAt: 40_000 };
  const v4Reviewed: VocabWord = {
    ...makeWord(v4WordId, 'deck-zh-everyday-work', '经验'),
    bloomLevel: 2,
    srs: v4Srs,
  };
  const preV5EnglishWithoutFirst = ENGLISH_WORDS.filter((w) => w.deckId !== 'deck-en-b1-communication').slice(1);
  const v4Log: StudySessionLog = {
    id: 'v4-legacy-log', timestamp: 20_000, mode: 'quiz', deckId: 'deck-hsk2-work', level: 'legacy',
    wordsReviewed: 5, correctCount: 4, xpEarned: 20, durationSeconds: 45,
  };
  const v4State = {
    version: 4,
    decks: [...ENGLISH_DECKS.filter((d) => d.id !== 'deck-en-b1-communication')],
    words: [v4Reviewed, ...preV5EnglishWithoutFirst],
    profile: { ...INITIAL_PROFILE, todayWordIds: [v4WordId] },
    logs: [v4Log],
  };
  const migratedV4 = withCurrentSeed(v4State);
  assert.equal(migratedV4.version, CURRENT_DATA_VERSION);
  assert.equal(migratedV4.words.find(({ id }) => id === mappedV4Id)?.srs, v4Srs);
  assert.equal(migratedV4.words.some(({ id }) => id === mappedDeletedV4Id), false);
  assert.equal(migratedV4.words.filter((w) => w.language === 'en').length, ENGLISH_WORDS.length - 1);
  assert.equal(migratedV4.words.filter((w) => w.deckId === 'deck-en-b1-communication').length, 12);
  assert.ok(migratedV4.words.some((w) => w.term === '感兴趣'));
  assert.deepEqual(migratedV4.logs, [{ ...v4Log, deckId: 'deck-zh-hsk2-people', level: 'hsk2' }]);
  assert.equal(withCurrentSeed(migratedV4), migratedV4);
});
