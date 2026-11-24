import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORDS } from '../data/seedVocab';
import { createBackup, previewBackup } from './backup';
import { CORE_ENGLISH_CARD, reviewedStudySnapshot } from './fixtures/studySnapshots';
import { getScopedWords } from './studyScope';
import { addChainDeckEntry, buildChainLexicon, checkChainMove, chooseChainMove, hasChainReply, nextChainTurn } from './wordChain';
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

test('only mixed mode accepts an English phrase and rejects invalid suggestions', () => {
  const single = buildChainLexicon(INITIAL_WORDS, 'en', 'word');
  const mixed = buildChainLexicon(INITIAL_WORDS, 'en', 'mixed');
  assert.equal(checkChainMove('take off', 'en', 't', new Set(), single).error, 'unknown');
  assert.equal(checkChainMove('take   off', 'en', 't', new Set(), mixed).entry?.last, 'f');
  assert.equal(parseChainSuggestion({ term: 'take off', meaning: 'cất cánh' }, 'en', 'mixed', 't')?.term, 'take off');
  assert.equal(parseChainSuggestion({ term: 'wrong word', meaning: 'nghĩa mẫu' }, 'en', 'word', 'w'), null);
});

test('relay keeps one global clock and pass-and-play swaps active players with a fresh clock', () => {
  assert.deepEqual(nextChainTurn('relay', 'player', 60_000, 30_000, 15), { turn: 'player', deadline: 60_000 });
  assert.deepEqual(nextChainTurn('pass', 'player', 60_000, 30_000, 15), { turn: 'partner', deadline: 45_000 });
  assert.deepEqual(nextChainTurn('pass', 'partner', 60_000, 32_000, 8), { turn: 'player', deadline: 40_000 });
  assert.deepEqual(nextChainTurn('duel', 'player', 60_000, 32_000, 8), { turn: 'player', deadline: 40_000 });
});

test('a chain is blocked when every candidate for its closing letter has already been used', () => {
  const base = INITIAL_WORDS[0];
  const lexicon = buildChainLexicon(['ear', 'red', 'door'].map((term) => ({ ...base, term })), 'en', 'word');
  assert.equal(hasChainReply(lexicon, 'r', new Set(['ear'])), true);
  assert.equal(hasChainReply(lexicon, 'r', new Set(['ear', 'red'])), false);
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
  const state = reviewedStudySnapshot('en-GB');
  const original = state.words.find(({ id }) => id === CORE_ENGLISH_CARD)!;
  const decks = addChainDeckEntry(state.decks, 'en', original.id, 123);
  const arena = decks.at(-1)!;
  assert.equal(addChainDeckEntry(decks, 'en', original.id, 456), decks);
  assert.deepEqual(getScopedWords(state.words, decks, 'en'), getScopedWords(state.words, state.decks, 'en'));

  const backup = createBackup({ ...state, decks }, {});
  const restored = (await previewBackup(new Blob([JSON.stringify(backup)]))).state;
  const saved = getScopedWords(restored.words, [restored.decks.find(({ id }) => id === arena.id)!], 'en');
  assert.deepEqual(saved, [JSON.parse(JSON.stringify({ ...original, deckId: arena.id }))]);
});
