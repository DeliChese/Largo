import test from 'node:test';
import assert from 'node:assert/strict';
import englishEditorial from '../../English/englishEditorial.json' with { type: 'json' };
import { ENGLISH_DECKS, ENGLISH_WORDS } from '../data/englishDecks';
import { getEnglishStudyWord } from './englishStudy';
import { englishLearningCategory, englishLearningOrder } from '../data/englishCurriculum';
import { CURRENT_DATA_VERSION, INITIAL_DECKS, INITIAL_WORDS, INITIAL_PROFILE, withCurrentSeed } from '../data/seedVocab';

test('editorial entries are attached to existing IDs and keep meaning distinct from notes', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(ENGLISH_WORDS.length, 7000);
  assert.equal(byId.size, 7000);
  for (const [id, entry] of Object.entries(englishEditorial)) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.meaning, entry.meaning, id);
    if ('notes' in entry) assert.equal(word.notes, entry.notes, id);
    if ('examples' in entry) assert.deepEqual(word.examples, entry.examples, id);
  }
  const infer = ENGLISH_WORDS.find(word => word.term === 'infer' && word.id.startsWith('en-extra-'));
  assert.ok(infer);
  assert.equal(infer.meaning, 'suy ra; suy luận');
  assert.match(infer.notes ?? '', /Imply là ngụ ý/);
  assert.equal(byId.get('en-vocab-age')?.examples[0]?.translation, 'Bạn bao nhiêu tuổi?');
});

test('related themes use canonical names and collections progress within each level', () => {
  assert.equal(englishLearningCategory('Nhà cửa và đời sống', 'vocabulary'), 'Nhà cửa và sinh hoạt');
  assert.equal(englishLearningCategory('Trường học và công việc', 'vocabulary'), 'Học tập và công việc');
  assert.equal(englishLearningCategory('Cụm tính từ · Học tập', 'phrases'), 'Học tập và công việc');
  assert.equal(englishLearningCategory('Nhà cửa, ăn uống và mua sắm', 'vocabulary'), 'Tổng hợp nhiều chủ đề');
  for (const level of ['a1', 'a2', 'b1', 'b2', 'c1']) {
    const order = ENGLISH_DECKS.filter(deck => deck.level === level).map(deck => englishLearningOrder(deck.collection));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
  }
});

test('v12 seed upgrade applies editorial changes without reviving deletions or losing reviews', () => {
  const reviewed = INITIAL_WORDS.find(word => word.id === 'en-vocab-age')!;
  const deleted = INITIAL_WORDS.find(word => word.id === 'en-vocab-number')!;
  const srs = { ...reviewed.srs, repetitions: 5, lastReviewedAt: 100 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const old = { ...reviewed, meaning: 'tuổi tác cũ', srs, bloomLevel: 3 as const, personalRelations };
  const customDeck = { ...INITIAL_DECKS[0], id: 'personal-test', isCustom: true, category: 'Cá nhân' };
  const customWord = { ...reviewed, id: 'personal-word', deckId: customDeck.id };
  const saved = {
    version: 12,
    decks: [...INITIAL_DECKS, customDeck],
    words: [...INITIAL_WORDS.filter(word => word.id !== deleted.id).map(word => word.id === old.id ? old : word), customWord],
    logs: [],
    profile: { ...INITIAL_PROFILE, todayWordIds: [old.id] },
  };
  const current = withCurrentSeed(saved);
  const upgraded = current.words.find(word => word.id === old.id);
  assert.equal(current.version, CURRENT_DATA_VERSION);
  assert.equal(upgraded?.meaning, reviewed.meaning);
  assert.equal(upgraded?.srs, srs);
  assert.equal(upgraded?.bloomLevel, 3);
  assert.equal(upgraded?.personalRelations, personalRelations);
  assert.ok(!current.words.some(word => word.id === deleted.id));
  assert.ok(current.words.includes(customWord));
  assert.ok(current.decks.includes(customDeck));
  assert.deepEqual(current.profile.todayWordIds, [old.id]);
  assert.equal(withCurrentSeed(current), current);
});


test('C1 editorial coverage and bilingual example overrides in both English locales', () => {
  const editorialIds = new Set(Object.keys(englishEditorial));
  const c1DeckIds = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'c1').map(deck => deck.id));
  const c1 = ENGLISH_WORDS.filter(word => c1DeckIds.has(word.deckId));
  assert.equal(c1.length, 268);
  assert.ok(c1.every(word => editorialIds.has(word.id)));
  assert.equal(editorialIds.size, 449);
  for (const word of ENGLISH_WORDS) {
    const entry = englishEditorial[word.id as keyof typeof englishEditorial];
    if (!entry || !('examples' in entry)) continue;
    for (const locale of ['en-GB', 'en-US'] as const) {
      const localized = getEnglishStudyWord(word, locale);
      if (localized.term === word.term) assert.deepEqual(localized.examples, entry.examples, word.id);
    }
    assert.ok(entry.examples.every(example => example.sentence.trim() && example.translation.trim()), word.id);
  }
});

test('v13 upgrades corrected beginner content without resetting review state', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-mum')!;
  const srs = { ...word.srs, repetitions: 3, lastReviewedAt: 123 };
  const state = {
    version: 13, decks: INITIAL_DECKS,
    words: [{ ...word, meaning: 'nghĩa cũ', srs }],
    logs: [], profile: INITIAL_PROFILE,
  };
  const migrated = withCurrentSeed(state);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(migrated.words.find(item => item.id === word.id)?.meaning, 'mẹ');
  assert.equal(migrated.words.find(item => item.id === word.id)?.srs, srs);
  assert.equal(withCurrentSeed(migrated), migrated);
});
