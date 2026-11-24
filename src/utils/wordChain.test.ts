import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORDS } from '../data/seedVocab';
import { createBackup, previewBackup } from './backup';
import { reviewedStudySnapshot, SHARED_HSK_CARD } from './fixtures/studySnapshots';
import { getScopedWords } from './studyScope';
import { addChainDeckEntry, buildChainLexicon, checkChainMove, chooseChainMove } from './wordChain';
import { chainEnds, parseChainSuggestion } from './wordChainRules.mjs';

test('plays exchange → entry → yellow and rejects incorrect initials, repeats and unknown words', () => {
  const lexicon = buildChainLexicon(INITIAL_WORDS, 'en', 'word');
  const keys = new Set(['exchange']);
  assert.equal(chainEnds('exchange').last, 'e');
  assert.equal(checkChainMove(' ENTRY! ', 'en', 'e', keys, lexicon).entry?.key, 'entry');
  assert.equal(checkChainMove('exchange', 'en', 'e', keys, lexicon).error, 'repeat');
  assert.equal(checkChainMove('yellow', 'en', 'e', keys, lexicon).error, 'first');
  assert.equal(checkChainMove('enotsarealword', 'en', 'e', keys, lexicon).error, 'unknown');
  keys.add('entry');
  const used = new Set([...keys, ...lexicon.byFirst.get('y')!.map(({ key }) => key).filter((key) => key !== 'yellow')]);
  assert.equal(chooseChainMove(lexicon, 'y', used, 'normal')?.key, 'yellow');
  used.add('yellow');
  assert.equal(chooseChainMove(lexicon, 'y', used, 'expert'), undefined);
});

test('only mixed mode accepts an English phrase and Chinese uses whole Han characters', () => {
  const single = buildChainLexicon(INITIAL_WORDS, 'en', 'word');
  const mixed = buildChainLexicon(INITIAL_WORDS, 'en', 'mixed');
  assert.equal(checkChainMove('take off', 'en', 't', new Set(), single).error, 'unknown');
  assert.equal(checkChainMove('take   off', 'en', 't', new Set(), mixed).entry?.last, 'f');
  const chinese = buildChainLexicon(INITIAL_WORDS, 'zh', 'word');
  assert.equal(checkChainMove('习惯。', 'zh', '习', new Set(), chinese).entry?.last, '惯');
  assert.equal(parseChainSuggestion({ term: '𠀀你', meaning: 'nghĩa mẫu' }, 'zh', 'mixed', '𠀀')?.term, '𠀀你');
  assert.equal(parseChainSuggestion({ term: 'wrong word', meaning: 'nghĩa mẫu' }, 'en', 'word', 'w'), null);
});

test('easy keeps answers open, expert takes a dead end, and the opening remains playable', () => {
  const base = INITIAL_WORDS.find(({ language }) => language === 'en')!;
  const lexicon = buildChainLexicon(['ear', 'egg', 'reach', 'rest', 'house']
    .map((term) => ({ ...base, term })), 'en', 'word');
  assert.equal(chooseChainMove(lexicon, 'e', new Set(), 'easy', () => 0)?.key, 'ear');
  assert.equal(chooseChainMove(lexicon, 'e', new Set(), 'expert', () => 0)?.key, 'egg');
  const opening = chooseChainMove(lexicon, '', new Set(), 'expert', () => 0.99)!;
  assert.ok(lexicon.byFirst.get(opening.last)?.some(({ key }) => key !== opening.key));
  assert.equal(chooseChainMove(buildChainLexicon([base], 'en', 'word'), '', new Set(), 'easy'), undefined);
});

test('saved cards retain the same ID and reviews after backup restore, without changing curriculum membership', async () => {
  const state = reviewedStudySnapshot('hsk30', 'en-GB');
  const original = state.words.find(({ id }) => id === SHARED_HSK_CARD)!;
  const decks = addChainDeckEntry(state.decks, 'zh', original.id, 123);
  const arena = decks.at(-1)!;
  assert.equal(addChainDeckEntry(decks, 'zh', original.id, 456), decks);
  assert.deepEqual(getScopedWords(state.words, decks, 'zh'), getScopedWords(state.words, state.decks, 'zh'));
  const english = state.words.find(({ language }) => language === 'en')!;
  const englishDecks = addChainDeckEntry(decks, 'en', english.id, 123);
  assert.deepEqual(getScopedWords(state.words, englishDecks, 'en'), getScopedWords(state.words, decks, 'en'));

  const backup = createBackup({ ...state, decks }, {});
  const restored = (await previewBackup(new Blob([JSON.stringify(backup)]))).state;
  const saved = getScopedWords(restored.words, [restored.decks.find(({ id }) => id === arena.id)!], 'zh');
  assert.deepEqual(saved, [{ ...original, deckId: arena.id }]);
});
