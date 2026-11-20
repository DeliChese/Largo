import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_DECKS, ENGLISH_WORDS } from '../data/englishDecks';
import { HSK1_DECKS, HSK1_WORDS } from '../data/hsk1Deck';
import { HSK2_DECKS, HSK2_WORDS } from '../data/hsk2Deck';
import { CURRENT_DATA_VERSION, INITIAL_DECKS, INITIAL_WORDS, withEnglishSeed } from '../data/seedVocab';
import { getClozeExample } from './studyPlan';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './studyScope';

test('language and level selections keep the review library scoped', () => {
  assert.deepEqual(getStudyLanguages(INITIAL_DECKS), ['zh', 'en']);
  assert.deepEqual(getStudyLevels('zh', INITIAL_DECKS).map(({ id }) => id), ['all', 'hsk1', 'hsk2']);
  assert.deepEqual(getStudyLevels('en', INITIAL_DECKS).map(({ id }) => id), ['all', 'a1', 'a2', 'b1']);
  const a2Decks = getScopedDecks(INITIAL_DECKS, 'en', 'a2');
  const a2 = getScopedWords(INITIAL_WORDS, a2Decks, 'en');
  assert.equal(a2Decks.length, 2);
  assert.equal(a2.length, 24);
  assert.ok(a2.every((word) => word.language === 'en' && a2Decks.some((deck) => word.deckId === deck.id)));
  assert.equal(getScopedDecks(INITIAL_DECKS, 'zh', 'b1').length, 0);
});

test('custom languages and explicit levels are included alongside starter languages', () => {
  const deck = { ...ENGLISH_DECKS[0], language: 'ja' as const, level: 'N4', isCustom: true };
  const unclassified = { ...deck, id: 'user-words', level: undefined, category: 'Cá nhân' };
  assert.deepEqual(getStudyLanguages([...INITIAL_DECKS, deck]), ['zh', 'en', 'ja']);
  assert.equal(getDeckStudyLevel(HSK2_DECKS[0]), 'hsk2');
  assert.deepEqual(getStudyLevels('ja', [deck, unclassified]).map(({ id }) => id), ['all', 'n4', 'custom']);
  assert.deepEqual(getScopedDecks([deck, unclassified], 'ja', 'custom'), [unclassified]);
});

test('English seed data has unique IDs, translations, collocations and a usable example for each card', () => {
  assert.equal(ENGLISH_WORDS.length, 60);
  assert.equal(new Set(ENGLISH_WORDS.map((word) => word.id)).size, ENGLISH_WORDS.length);
  for (const word of ENGLISH_WORDS) {
    assert.ok(word.phonetic && word.meaning && word.collocations[0]?.meaning && word.examples[0]?.translation, word.term);
    assert.ok(getClozeExample(word), word.term);
  }
});

test('adding the English seed preserves existing review schedules and does not restore deleted English cards on later starts', () => {
  const reviewed = {
    ...HSK1_WORDS[0],
    srs: { ...HSK1_WORDS[0].srs, repetitions: 4, lastReviewedAt: 12_000, nextReviewAt: 25_000 },
  };
  const old = {
    version: 1,
    decks: [...HSK1_DECKS, ...HSK2_DECKS],
    words: [reviewed, ...HSK1_WORDS.slice(1), ...HSK2_WORDS],
    logs: ['existing'],
  };
  const migrated = withEnglishSeed(old);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(migrated.words[0], reviewed);
  assert.equal(migrated.logs, old.logs);
  assert.equal(migrated.words.length, old.words.length + ENGLISH_WORDS.length);
  const pruned = { ...migrated, words: migrated.words.filter((word) => word.id !== ENGLISH_WORDS[0].id) };
  assert.equal(withEnglishSeed(pruned), pruned);
});
