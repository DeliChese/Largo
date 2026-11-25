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
  assert.equal(editorialIds.size, 2260);
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


test('A1 editorial coverage and corrected core senses', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  const a1DeckIds = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a1').map(deck => deck.id));
  const editedA1 = ENGLISH_WORDS.filter(word => a1DeckIds.has(word.deckId) && word.id.startsWith('en-vocab-') &&
    Object.prototype.hasOwnProperty.call(englishEditorial, word.id));
  assert.equal(editedA1.length, 800);
  assert.equal(byId.get('en-vocab-sentence')?.meaning, 'câu (ngữ pháp)');
  assert.equal(byId.get('en-vocab-plane')?.meaning, 'máy bay');
  assert.match(byId.get('en-vocab-listen')?.notes ?? '', /Listen to/);
  assert.match(byId.get('en-vocab-does')?.notes ?? '', /động từ nguyên mẫu/);
});

test('v14 seed migration preserves progress and personal relations on corrected A1 cards', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-sentence')!;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = {
    version: 14, decks: INITIAL_DECKS,
    words: [{ ...word, meaning: 'bản án', srs, bloomLevel: 3 as const, personalRelations }],
    logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] },
  };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(updated?.meaning, 'câu (ngữ pháp)');
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('A1 editorial repairs word class and common senses', () => {
  const words = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(words.get('en-vocab-am')?.partOfSpeech, 'Động từ');
  assert.equal(words.get('en-vocab-bye')?.partOfSpeech, 'Thán từ');
  assert.equal(words.get('en-vocab-dirty')?.meaning, 'bẩn');
  assert.equal(words.get('en-vocab-afraid')?.meaning, 'sợ; lo sợ');
  const word = words.get('en-vocab-am')!;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const state = { version: 15, decks: INITIAL_DECKS, words: [{ ...word, partOfSpeech: 'Trạng từ', srs }], logs: [], profile: INITIAL_PROFILE };
  const migrated = withCurrentSeed(state);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(migrated.words.find(item => item.id === word.id)?.partOfSpeech, 'Động từ');
  assert.equal(migrated.words.find(item => item.id === word.id)?.srs, srs);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2d covers supplementary A1, collocations and shared phrasal IDs', () => {
  const edited = new Set(Object.keys(englishEditorial));
  const a1Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a1').map(deck => deck.id));
  const a1 = ENGLISH_WORDS.filter(word => a1Decks.has(word.deckId));
  const extra = a1.filter(word => word.id.startsWith('en-extra-'));
  const phrases = a1.filter(word => word.id.startsWith('en-phrase-'));
  assert.equal(extra.length, 94);
  assert.equal(phrases.length, 72);
  assert.ok([...extra, ...phrases].every(word => edited.has(word.id) && word.examples.length === 2));
  const words = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(words.get('en-vocab-ms')?.meaning, 'cô; bà (danh xưng)');
  assert.match(words.get('deck-en-a2-travel-pick-up')?.notes ?? '', /pick her up/);
  const word = words.get('en-phrase-do-homework')!;
  assert.match(word.notes ?? '', /không đếm được/);
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const state = { version: 16, decks: INITIAL_DECKS, words: [{ ...word, notes: 'ghi chú cũ', srs }], logs: [], profile: INITIAL_PROFILE };
  const migrated = withCurrentSeed(state);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(migrated.words.find(item => item.id === word.id)?.notes, word.notes);
  assert.equal(migrated.words.find(item => item.id === word.id)?.srs, srs);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2e covers every A1 seed card and next seven A2 vocabulary lessons', () => {
  const edited = new Set(Object.keys(englishEditorial));
  const a1Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a1').map(deck => deck.id));
  const a1 = ENGLISH_WORDS.filter(word => a1Decks.has(word.deckId));
  assert.equal(a1.length, 1002);
  assert.ok(a1.every(word => edited.has(word.id)));
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.match(byId.get('deck-en-a1-everyday-try-on')?.notes ?? '', /try it on/);
  const regional = byId.get('en-regional-fries')!;
  assert.equal(getEnglishStudyWord(regional, 'en-GB').term, 'chips');
  assert.equal(getEnglishStudyWord(regional, 'en-US').term, 'fries');
  assert.ok(getEnglishStudyWord(regional, 'en-GB').examples.every(example => example.translation.trim()));
  assert.equal(getEnglishStudyWord(regional, 'en-US').examples.length, 2);
  assert.equal(byId.get('en-vocab-lemon')?.meaning, 'quả chanh vàng');
  assert.equal(byId.get('en-vocab-mall')?.meaning, 'trung tâm mua sắm');
  assert.match(byId.get('en-vocab-furniture')?.notes ?? '', /không đếm được/i);
  assert.match(byId.get('en-vocab-appointment')?.meaning ?? '', /cuộc hẹn/);
  assert.match(byId.get('en-vocab-cricket')?.meaning ?? '', /môn cricket/);
});

test('v17 seed migration updates 2e vocabulary without losing review state or restoring deletions', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-mall')!;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = {
    version: 17, decks: INITIAL_DECKS,
    words: [{ ...word, meaning: 'phố đi bộ', srs, bloomLevel: 3 as const, personalRelations }],
    logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] },
  };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(updated?.meaning, 'trung tâm mua sắm');
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-lemon'));
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2f corrects A2 core grammar and frequent meanings', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(byId.get('en-vocab-max')?.meaning, 'mức tối đa (dạng rút gọn của maximum)');
  assert.match(byId.get('en-vocab-might')?.notes ?? '', /động từ nguyên mẫu/);
  assert.match(byId.get('en-vocab-been')?.meaning ?? '', /quá khứ phân từ/);
  assert.match(byId.get('en-vocab-done')?.notes ?? '', /Do – did – done/);
  assert.match(byId.get('en-vocab-used')?.notes ?? '', /Be used to/);
  assert.match(byId.get('en-vocab-lie')?.notes ?? '', /lay – lain/);
  assert.match(byId.get('en-vocab-advice')?.notes ?? '', /Không đếm được/);
  assert.match(byId.get('en-vocab-suggest')?.notes ?? '', /Suggest \+ V-ing/);
  assert.equal(byId.get('en-vocab-yeah')?.partOfSpeech, 'Thán từ');
  const a2Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a2').map(deck => deck.id));
  const covered = ENGLISH_WORDS.filter(word => a2Decks.has(word.deckId) && word.id.startsWith('en-vocab-') &&
    Object.prototype.hasOwnProperty.call(englishEditorial, word.id));
  assert.ok(covered.length >= 551);
});

test('v18 seed migration preserves saved progress for phase 2f content', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-max')!;
  const srs = { ...word.srs, repetitions: 5, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = {
    version: 18, decks: INITIAL_DECKS,
    words: [{ ...word, meaning: 'nghĩa cũ', srs, bloomLevel: 3 as const, personalRelations }],
    logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] },
  };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(updated?.meaning, word.meaning);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-advice'));
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2g covers all 900 A2 core vocabulary cards and corrects common senses', () => {
  const a2Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a2').map(deck => deck.id));
  const core = ENGLISH_WORDS.filter(word => a2Decks.has(word.deckId) && word.id.startsWith('en-vocab-'));
  assert.equal(core.length, 900);
  assert.ok(core.every(word => Object.prototype.hasOwnProperty.call(englishEditorial, word.id)));
  const byId = new Map(core.map(word => [word.id, word]));
  assert.match(byId.get('en-vocab-id')?.meaning ?? '', /giấy tờ tùy thân/);
  assert.match(byId.get('en-vocab-cent')?.notes ?? '', /percent/);
  assert.match(byId.get('en-vocab-solution')?.meaning ?? '', /giải pháp/);
  assert.match(byId.get('en-vocab-concentrate')?.notes ?? '', /Concentrate on/);
  assert.match(byId.get('en-vocab-prevent')?.notes ?? '', /from doing/);
  assert.match(byId.get('en-vocab-lend')?.notes ?? '', /borrow/);
  assert.match(byId.get('en-vocab-good-looking')?.notes ?? '', /mọi giới/);
  assert.match(byId.get('en-vocab-fry')?.meaning ?? '', /cá con/);
});

test('v19 seed migration preserves saved progress for phase 2g content', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-id')!;
  const srs = { ...word.srs, repetitions: 5, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = {
    version: 19, decks: INITIAL_DECKS,
    words: [{ ...word, meaning: 'Idaho', srs, bloomLevel: 3 as const, personalRelations }],
    logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] },
  };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(updated?.meaning, word.meaning);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-cent'));
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.equal(withCurrentSeed(migrated), migrated);
});
