import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_DECKS, ENGLISH_WORDS } from '../data/englishDecks';
import { HSK1_DECKS, HSK1_WORDS } from '../../Chinese/hsk1Deck';
import { HSK2_DECKS, HSK2_WORDS } from '../../Chinese/hsk2Deck';
import catalogue from '../../Chinese/chineseVocabulary.json' with { type: 'json' };
import { CURRENT_DATA_VERSION, INITIAL_DECKS, INITIAL_PROFILE, INITIAL_WORDS, withCurrentSeed } from '../data/seedVocab';
import type { StudySessionLog, VocabDeck } from '../types/vocab';
import { searchChineseDictionary } from './chineseDict';
import { getClozeExample } from './studyPlan';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './studyScope';

test('language and level selections keep the review library scoped', () => {
  assert.deepEqual(getStudyLanguages(INITIAL_DECKS), ['zh', 'en']);
  assert.deepEqual(getStudyLevels('zh', INITIAL_DECKS).map(({ id }) => id), ['all', 'hsk1', 'hsk2', 'hsk3', 'everyday', 'legacy']);
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

test('the merged Chinese library accounts for every selected row and keeps distinct readings and senses', async () => {
  const cards = catalogue.flatMap<{ hskId?: number; a1000Id?: number }>((topic) => topic.cards);
  const sourceIds = (ids: Array<number | undefined>) => [...new Set(ids.filter((id) => id !== undefined))].sort((a, b) => a - b);
  assert.deepEqual(sourceIds(cards.map((card) => card.hskId)), Array.from({ length: 500 }, (_, i) => i + 1));
  assert.deepEqual(sourceIds(cards.map((card) => card.a1000Id)), Array.from({ length: 1000 }, (_, i) => i + 1));
  for (const [level, expected] of [['hsk1', 300], ['hsk2', 200], ['everyday', 621]] as const) {
    const decks = getScopedDecks(INITIAL_DECKS, 'zh', level);
    assert.equal(getScopedWords(INITIAL_WORDS, decks, 'zh').length, expected);
  }
  assert.equal(new Set(INITIAL_WORDS.map(({ id }) => id)).size, INITIAL_WORDS.length);
  assert.deepEqual(INITIAL_WORDS.filter(({ term }) => term === '过').map(({ phonetic }) => phonetic), ['guo', 'guò']);
  assert.deepEqual(INITIAL_WORDS.filter(({ term }) => term === '只').map(({ phonetic }) => phonetic), ['zhī', 'zhǐ']);
  assert.equal(INITIAL_WORDS.filter(({ term }) => term === '点').length, 2);
  const [entry] = await searchChineseDictionary('saoma');
  assert.equal(entry?.term, '扫码');
  assert.deepEqual(entry.collocations, [{ phrase: '扫码支付', meaning: 'quét mã thanh toán' }]);
});

test('upgrading legacy cards keeps review records, custom words, and intentional deletions', () => {
  const reviewed = {
    ...HSK1_WORDS[0],
    bloomLevel: 3 as const,
    lastSynthesisAt: 12_000,
    srs: { ...HSK1_WORDS[0].srs, repetitions: 4, lastReviewedAt: 12_000, nextReviewAt: 25_000 },
  };
  const oldDeck = HSK1_DECKS[0];
  const customDeck: VocabDeck = { ...oldDeck, id: 'custom-deck', isCustom: true };
  const customWord = { ...HSK1_WORDS[1], id: 'custom-word', deckId: customDeck.id };
  const wordInOldDeck = { ...customWord, deckId: oldDeck.id, id: 'word-in-old-deck' };
  const deleted = HSK1_WORDS[1];
  const log: StudySessionLog = {
    id: 'past-session', timestamp: 12_000, mode: 'flashcard', deckId: oldDeck.id,
    wordsReviewed: 1, correctCount: 1, xpEarned: 4, durationSeconds: 20,
  };
  const old = {
    version: 1,
    decks: [customDeck, ...HSK1_DECKS, ...HSK2_DECKS],
    words: [customWord, wordInOldDeck, reviewed, ...HSK1_WORDS.slice(2), ...HSK2_WORDS],
    profile: { ...INITIAL_PROFILE, xp: 4, todayWordIds: [reviewed.id] },
    logs: [log],
  };
  const migrated = withCurrentSeed(old);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  const updatedWord = migrated.words.find(({ id }) => id === reviewed.id);
  assert.equal(updatedWord?.srs, reviewed.srs);
  assert.equal(updatedWord?.bloomLevel, reviewed.bloomLevel);
  assert.equal(updatedWord?.lastSynthesisAt, reviewed.lastSynthesisAt);
  assert.equal(updatedWord?.deckId, 'deck-zh-hsk1-grammar');
  assert.deepEqual(updatedWord?.examples, reviewed.examples);
  assert.equal(migrated.profile, old.profile);
  assert.deepEqual(migrated.logs, [{ ...log, level: 'hsk1' }]);
  assert.equal(migrated.words.includes(customWord), true);
  assert.equal(migrated.words.includes(wordInOldDeck), true);
  assert.equal(migrated.decks.includes(customDeck), true);
  assert.ok(migrated.decks.some(({ id }) => id === wordInOldDeck.deckId));
  assert.ok(migrated.words.some(({ term }) => term === '住院'));
  assert.equal(migrated.words.some(({ id }) => id === deleted.id), false);
  assert.equal(migrated.words.filter(({ language }) => language === 'en').length, ENGLISH_WORDS.length);
  const withoutEnglishCard = ENGLISH_WORDS.slice(1);
  const versionTwo = withCurrentSeed({ ...old, version: 2, decks: [...old.decks, ...ENGLISH_DECKS], words: [...old.words, ...withoutEnglishCard] });
  assert.deepEqual(versionTwo.words.filter(({ language }) => language === 'en'), withoutEnglishCard);
  assert.equal(withCurrentSeed(migrated), migrated);
});
