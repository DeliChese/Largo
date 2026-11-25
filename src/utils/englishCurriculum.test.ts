import test from 'node:test';
import type { VocabWord } from '../types/vocab';
import assert from 'node:assert/strict';
import englishEditorial from '../../English/englishEditorial.json' with { type: 'json' };
import englishAdditionalSenses from '../../English/englishAdditionalSenses.json' with { type: 'json' };
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
  assert.equal(editorialIds.size, 2653);
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


test('additional senses have existing IDs and distinct examples without changing the primary review answer', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(byId.size, 7000);
  assert.equal(Object.keys(englishAdditionalSenses).length, 88);
  assert.equal(Object.values(englishAdditionalSenses).flat().length, 99);
  for (const [id, senses] of Object.entries(englishAdditionalSenses)) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.deepEqual(word.additionalSenses, senses, id);
    assert.ok(senses.every(sense => sense.partOfSpeech.trim() && sense.meaning.trim() &&
      sense.examples.length === 2 && sense.examples.every(example => example.sentence.trim() && example.translation.trim())), id);
    assert.equal(word.meaning, englishEditorial[id as keyof typeof englishEditorial].meaning, id);
  }
  const book = byId.get('en-vocab-book')!;
  assert.equal(book.partOfSpeech, 'Danh từ');
  assert.equal(book.meaning, 'sách; cuốn sách');
  assert.equal(book.additionalSenses?.[0]?.partOfSpeech, 'Động từ');
  assert.equal(book.additionalSenses?.[0]?.meaning, 'đặt trước');
  assert.equal(byId.get('en-vocab-live')?.additionalSenses?.[0]?.phonetic, '/laɪv/');
  assert.equal(byId.get('en-vocab-use')?.additionalSenses?.[0]?.phonetic, '/juːs/');
  assert.equal(getEnglishStudyWord(book, 'en-GB').additionalSenses, book.additionalSenses);
  assert.equal(getEnglishStudyWord({ ...book, englishForms: { 'en-GB': { term: 'different term' } } }, 'en-GB').additionalSenses, undefined);
});

test('v20 migration adds secondary senses without creating review IDs or resetting progress', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-book')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 5, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = {
    version: 20, decks: INITIAL_DECKS,
    words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[],
    logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] },
  };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.equal(updated?.meaning, word.meaning);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-watch'));
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2h.1 reviews 150 A2 supplementary, collocation and regional cards', () => {
  const ids = ["en-phrase-book-a-flight","en-phrase-book-a-room","en-phrase-make-a-reservation","en-phrase-miss-the-bus","en-phrase-catch-a-train","en-phrase-pack-a-bag","en-phrase-heavy-luggage","en-phrase-show-your-passport","en-phrase-boarding-pass","en-phrase-window-seat","en-phrase-a-direct-flight","en-phrase-go-on-a-trip","en-phrase-lose-your-way","en-phrase-ask-for-directions","en-phrase-follow-the-map","en-phrase-main-road","en-phrase-arrive-on-time","en-phrase-go-on-holiday","en-phrase-have-a-cold","en-phrase-get-a-headache","en-phrase-take-your-temperature","en-phrase-see-a-doctor","en-phrase-take-medicine","en-phrase-back-pain","en-phrase-feel-better","en-phrase-take-a-deep-breath","en-phrase-get-enough-sleep","en-phrase-a-healthy-diet","en-phrase-do-some-exercise","en-phrase-get-some-rest","en-phrase-stay-in-shape","en-phrase-lose-weight","en-phrase-break-a-habit","en-phrase-go-for-a-walk","en-phrase-fall-ill","en-phrase-make-an-appointment","en-phrase-keep-a-diary","en-phrase-take-an-exam","en-phrase-pass-an-exam","en-phrase-skip-class","en-phrase-apply-for-a-job","en-phrase-look-for-work","en-phrase-have-a-meeting","en-phrase-take-a-break","en-phrase-save-time","en-phrase-work-on-a-project","en-phrase-write-a-report","en-phrase-save-a-file","en-phrase-send-a-message","en-phrase-make-a-phone-call","en-phrase-fill-in-a-form","en-phrase-make-a-plan","en-phrase-follow-the-instructions","en-phrase-learn-english","en-phrase-make-friends","en-phrase-have-a-party","en-phrase-wish-someone-a-happy-birthday","en-phrase-have-fun","en-phrase-spend-time-together","en-phrase-keep-in-touch","en-phrase-make-a-mistake","en-phrase-make-a-promise","en-phrase-keep-a-secret","en-phrase-give-a-gift","en-phrase-save-money","en-phrase-borrow-money","en-phrase-pay-a-bill","en-phrase-pay-rent","en-phrase-heavy-rain","en-phrase-strong-wind","en-phrase-the-weather-forecast","en-phrase-fresh-air","en-regional-sneakers","en-regional-elevator","en-regional-subway","en-regional-line","en-regional-truck","en-regional-sidewalk","en-regional-trash","en-regional-faucet","en-regional-parking-lot","en-regional-gas","en-regional-takeout","en-regional-on-the-weekend","en-extra-photography-25f3aeb51f","en-extra-disco-3bea44f95b","en-extra-violin-00e3e584e2","en-extra-amusement-8705e69d8c","en-extra-pc-d8463bd3ba","en-extra-ski-cf659bd3fb","en-extra-exhibition-83a2bff84b","en-extra-spaceship-c2c002ca28","en-extra-superstar-403a6c556b","en-extra-surfing-6bbed1b598","en-extra-skate-0b22fca0ad","en-extra-skating-b8aa64f3cc","en-extra-skiing-a986248f82","en-extra-printer-ba70e1dacc","en-extra-leisure-00ed6c583d","en-extra-rugby-3e9df2cb28","en-extra-cycling-d14787ecd4","en-extra-sightseeing-8ae0c105f0","en-extra-toothache-7153a86186","en-extra-thunderstorm-e3dd6fdb8a","en-extra-stomachache-f1962693b6","en-extra-badminton-99e1ff4002","en-extra-skateboarding-15af8950c8","en-extra-video-game-1f905c9558","en-extra-stove-5dc60efa39","en-extra-cafeteria-41d6f409e1","en-extra-toothbrush-8d8d7dbe65","en-extra-pea-6d906f667d","en-extra-cola-42be22c266","en-extra-scarf-b4a8d31d8a","en-extra-stadium-dafc4889ee","en-extra-wheelchair-ce5793ab2a","en-extra-pasta-a4c18ee0ad","en-extra-sock-06efe37f5e","en-extra-garlic-41024084d2","en-extra-refrigerator-0cf35ab8cf","en-extra-barber-b67b8e2e84","en-extra-container-a42d519714","en-extra-onion-2889716716","en-extra-lemonade-13cc358c60","en-extra-cereal-38c09b5448","en-extra-playground-f3cc87f78b","en-extra-heating-f79e5dd024","en-extra-architecture-4ca303a3bf","en-extra-carrot-b96482290a","en-extra-mosque-253221cbda","en-extra-sunglasses-754ee0c9fc","en-extra-shampoo-021624ecb7","en-extra-lunchtime-873de12508","en-extra-melon-a73860a05e","en-extra-handbag-d531950f97","en-extra-earring-53368bd169","en-extra-seafood-65cd9e48ef","en-extra-advertisement-aacfba7d19","en-extra-drugstore-ed015c0da9","en-extra-pear-97cfbe8753","en-extra-cassette-5eb37b9673","en-extra-tights-d436f5f726","en-extra-swimsuit-d6c0822cf8","en-extra-raincoat-b6958aab12","en-extra-pence-c74276c1d6","en-extra-cooker-0eed4ace4f","en-extra-armchair-5a948ffe5f","en-extra-bookshop-0299706ac9","en-extra-bookcase-a2d683d6d2","en-extra-bookshelf-c636e2ea2f"];
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(new Set(ids).size, 150);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(example => example.sentence.trim() && example.translation.trim()), id);
  }
  assert.equal(byId.get("en-extra-pear-97cfbe8753")?.meaning, 'quả lê');
  assert.equal(byId.get("en-extra-ski-cf659bd3fb")?.additionalSenses?.[0]?.partOfSpeech, 'Động từ');
  const gas = byId.get('en-regional-gas')!;
  assert.equal(getEnglishStudyWord(gas, 'en-GB').term, 'petrol');
  assert.ok(getEnglishStudyWord(gas, 'en-GB').examples.some(example => /petrol/.test(example.sentence)));
});

test('v21 migration updates A2 supplementary content without resetting saved progress', () => {
  const word = INITIAL_WORDS.find(word => word.id === "en-extra-pear-97cfbe8753")!;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const state = { version: 21, decks: INITIAL_DECKS, words: [{ ...word, meaning: 'cây lê', srs, bloomLevel: 3 as const }], logs: [], profile: INITIAL_PROFILE };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(updated?.meaning, 'quả lê');
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2h.2 completes the remaining 139 A2 extra vocabulary cards', () => {
  const ids = ["en-extra-jelly-22d8ec27fc","en-extra-predict-8e9afe9d1d","en-extra-aged-5e05171a0e","en-extra-regularly-e7b6fe4a77","en-extra-successfully-b728667e3b","en-extra-boiled-2d2c23d3ee","en-extra-clone-b5d61dc89a","en-extra-grilled-ba7651a413","en-extra-kilo-54c5ccf0f3","en-extra-euro-b54124f069","en-extra-hiking-fc31ac9277","en-extra-amused-8648a03e60","en-extra-automatic-53e0ff348c","en-extra-unnecessary-22d64f6877","en-extra-underwater-8732d6327e","en-extra-make-up-7dbbcc687e","en-extra-shade-e02d7fca85","en-extra-globe-d2a1fc0432","en-extra-additional-7b476727fa","en-extra-frightening-467d18ee9c","en-extra-adjust-2549c096fc","en-extra-refer-a4b64ad329","en-extra-artificial-4d2971726b","en-extra-bake-3c8c082e47","en-extra-meter-5eff322a1b","en-extra-satisfy-7688bd7c42","en-extra-frighten-52d8a8577f","en-extra-feather-b52115ea55","en-extra-sunlight-921a95e8b6","en-extra-publish-a5d47a4311","en-extra-boil-9a692cc5ec","en-extra-lively-36b481152b","en-extra-tidy-118a1de593","en-extra-reflect-909ca0096d","en-extra-acceptable-129b70f867","en-extra-pronounce-e718dfa134","en-extra-dinosaur-300908b9d3","en-extra-elderly-457020499e","en-extra-invent-1e2f4f54c7","en-extra-weekly-8850eced98","en-extra-roughly-0debf3ab76","en-extra-automatically-83ccca18fb","en-extra-sew-298e56c1cf","en-extra-impatient-f137861447","en-extra-disappointing-9b179132ab","en-extra-insect-db7304319e","en-extra-partly-13bfaf8f3c","en-extra-well-known-d91ec1b42e","en-extra-smoothly-ce4f792e16","en-extra-scenery-6e8a32c0ab","en-extra-bulb-b4942fb4e8","en-extra-invade-59ab84ee2e","en-extra-consequence-84bb160039","en-extra-oppose-26a0ee5c65","en-extra-annoy-799524ffd2","en-extra-educational-cbedbde861","en-extra-napkin-9db44611cf","en-extra-uncertain-96642b36a8","en-extra-flea-e1b6072c02","en-extra-silently-6ab6c1f9af","en-extra-windy-87480c5a48","en-extra-creativity-5a59225b5a","en-extra-dishonest-3734f204b6","en-extra-criticize-3bd933a323","en-extra-rating-112895d7af","en-extra-folder-034a006248","en-extra-playful-e600bda8b7","en-extra-right-hand-ea88e488f1","en-extra-energetic-fa3531b78a","en-extra-pilgrim-1dd31cd072","en-extra-harmful-58904effcb","en-extra-pleasing-6e2befec87","en-extra-midday-13d8e677e4","en-extra-unforgettable-305b00e96c","en-extra-prediction-70ad7b8f9a","en-extra-sleepless-d8ad80d6ea","en-extra-unimportant-34a7850efc","en-extra-indoor-0fabe40e86","en-extra-overweight-09dbdd823d","en-extra-timetable-f09390ae1c","en-extra-lyric-acf660ae9a","en-extra-recycle-ef5988103d","en-extra-chirp-94b4a9f92e","en-extra-sunflower-8f398886c3","en-extra-injure-df73cf99ee","en-extra-left-hand-e4d4df3df7","en-extra-terrify-d70f695f02","en-extra-laziness-08a1d81509","en-extra-pollute-f16075a9eb","en-extra-comparative-382439e6f1","en-extra-weekday-82d048d26e","en-extra-kilogram-16db10b284","en-extra-half-price-aede390390","en-extra-washing-up-564edb6705","en-extra-grocery-store-dede36f13c","en-extra-granddad-cd9090e765","en-extra-granddaughter-285a615116","en-extra-lifestyle-61a78304b3","en-extra-runner-527aa9f431","en-extra-dislike-e4d14bef7a","en-extra-surname-655c32fb84","en-extra-receptionist-c3bca14c65","en-extra-grandchild-713b4f18f0","en-extra-beginner-d0c2ebfa34","en-extra-policewoman-f9852209bc","en-extra-footballer-75ee477d47","en-extra-quiz-9d98ce221d","en-extra-maker-878c240fd7","en-extra-chart-cc57fc1903","en-extra-continent-cbb2210166","en-extra-astronaut-df0c29d396","en-extra-semester-b4e58cd7cb","en-extra-context-ea7792a26f","en-extra-athlete-23a1f74bc5","en-extra-psychologist-dc5945e7f9","en-extra-fisherman-da8cc79090","en-extra-gender-de9feaea8b","en-extra-atom-1bf521836d","en-extra-ancestor-d490151378","en-extra-composer-42cc848a9f","en-extra-textbook-16a9b27cd7","en-extra-summary-761b7ad8ad","en-extra-learner-1210f10c34","en-extra-verb-6806f86a17","en-extra-blackboard-00c764f20f","en-extra-pronunciation-ce978dc782","en-extra-adjective-2f2473fd83","en-extra-punctuation-03ebc3b2e4","en-extra-custom-6cdfd271da","en-extra-tourist-b58951d8a9","en-extra-fare-eaa8b6e89f","en-extra-countryside-8f2f4a9cec","en-extra-cheque-c752ae6dd4","en-extra-hike-c02d7803a9","en-extra-banking-68ba9b33ad","en-extra-traveler-cd50fc998e","en-extra-tram-c2a6bc4a1d","en-extra-motorway-29bd95d193","en-extra-traffic-light-34d7399635"];
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(new Set(ids).size, 139);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(example => example.sentence.trim() && example.translation.trim()), id);
  }
  assert.equal(byId.get("en-extra-footballer-75ee477d47")?.meaning, 'cầu thủ bóng đá');
  assert.equal(byId.get("en-extra-dislike-e4d14bef7a")?.additionalSenses?.[0]?.partOfSpeech, 'Động từ');
});

test('v22 seed migration preserves saved progress on A2 extra vocabulary', () => {
  const word = INITIAL_WORDS.find(word => word.id === "en-extra-dislike-e4d14bef7a")!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const state = { version: 22, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const }] as VocabWord[], logs: [], profile: INITIAL_PROFILE };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2h.3 completes editorial coverage of all 1297 A2 seed IDs', () => {
  const a2Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'a2').map(deck => deck.id));
  const a2 = ENGLISH_WORDS.filter(word => a2Decks.has(word.deckId));
  assert.equal(a2.length, 1297);
  assert.ok(a2.every(word => Object.prototype.hasOwnProperty.call(englishEditorial, word.id)));
  const byId = new Map(a2.map(word => [word.id, word]));
  const ids = ["deck-en-a2-work-study-deadline","deck-en-a2-work-study-meeting","deck-en-a2-work-study-update","deck-en-a2-work-study-available","deck-en-a2-work-study-schedule","deck-en-a2-work-study-follow-up","deck-en-a2-work-study-take-notes","deck-en-a2-work-study-keep-track-of","deck-en-a2-work-study-make-progress","deck-en-a2-work-study-run-into","deck-en-a2-work-study-could-you-send-me","deck-en-a2-work-study-i-ll-get-back-to-you","deck-en-a2-travel-reservation","deck-en-a2-travel-refund","deck-en-a2-travel-delay","deck-en-a2-travel-crowded","deck-en-a2-travel-recommend","deck-en-a2-travel-turn-left","deck-en-a2-travel-on-time","deck-en-a2-travel-is-there-another-option","en-extra-wrench-702b023f61","en-extra-screwdriver-2f2d4a8891","en-extra-mattress-098223b63e","en-extra-broom-100a07d1e4","en-extra-sponge-46248ac689","en-extra-bucket-c5879b8d25","en-extra-detergent-958d4f64ab","en-extra-hanger-d248cfe618","en-extra-socket-47dd56c2c7","en-extra-cupboard-928ae8cdaf","en-extra-cushion-d0eae8d194","en-extra-pillowcase-a060347ece","en-extra-mop-40685fd53d","en-extra-kettle-20cd4732ae","en-extra-thermos-302949d0b8","en-extra-hinge-7706c3c94d","en-extra-latch-83b6a889a0","en-extra-doormat-fac5eb8942","en-extra-pliers-68f56ba9b3","en-extra-sandpaper-6f26a9e4e7","en-extra-stapler-6247f77181","en-extra-duct-tape-4f11dad67b","en-extra-velvet-f4c44266a2","en-extra-linen-07ad2ef160","en-extra-denim-99b94ab3f7","en-extra-corduroy-ede3ae7d2b","en-extra-suede-66dd06d9ff","en-extra-porcelain-aa150d3005","en-extra-wicker-d127b25568","en-extra-padlock-f7f1daa58e","en-extra-flashlight-b982eabb16","en-extra-broomstick-7178a92896","en-extra-etiquette-b39e075b46","en-extra-blunt-bb79caae5f","en-extra-cordial-8d5352e3e1","en-extra-flatter-d92d2c2d4b","en-extra-eavesdrop-28897ea1b7","en-extra-hesitate-ce8a390a4a","en-extra-acquaintance-195fc281cb","en-extra-confide-f6b004418a","en-extra-reassure-81c0d8e4cd","en-extra-welcoming-908c8cca2e","en-extra-grocery-7aa5eb472a","en-extra-warranty-9ba5d957f2","en-extra-errand-6522cf7814","en-extra-clothespin-10e271b8be","en-extra-pantry-c244bfeada","en-extra-leftovers-85b0a22b31","en-extra-expiry-c955506fc1","en-extra-coupon-72309c04a6","en-extra-trolley-ed42fdbd04","en-extra-cashier-6a79b51fec","en-extra-apron-e79e8a37b0","en-extra-three-course-meal-cf461e634a","en-extra-local-specialty-ad8ba33b11","en-extra-vegetarian-option-6cd348744d","en-extra-book-a-table-6b5c064a42","en-extra-split-the-bill-3c76625529","en-extra-carry-on-bag-dc30de5992","en-extra-travel-insurance-9d46935707","en-extra-day-pass-66d7553f32","en-extra-exchange-rate-0fca39a9b3","en-extra-sea-view-53355e58d0","en-extra-room-service-fe37a04231","en-extra-peak-season-a3884cad6a","en-extra-guided-tour-dce65e2c0a","en-extra-weather-forecast-92729e626f","en-extra-scenic-spot-ebcc0539f3","en-extra-throw-away-b9eeea2854","en-extra-give-away-6549f71c49","en-extra-put-together-3a3c808639","en-extra-take-apart-e7e64a7a13","en-extra-hang-up-19052990ed","en-extra-hang-out-ee6ee4a837","en-extra-eat-out-a758644d47","en-extra-fill-up-7a54515a63","en-extra-tidy-up-ac589c1e9b","en-extra-lock-up-b2e9e62704","en-extra-mix-in-9a590f0ece","en-extra-turn-around-9740d2a84f","en-extra-run-across-7fe8810e37","en-extra-dress-up-662d0f591a","en-extra-try-out-834dcaea48","en-extra-check-over-a51c94270b"];
  assert.equal(new Set(ids).size, 104);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(example => example.sentence.trim() && example.translation.trim()), id);
  }
  assert.match(byId.get("en-extra-throw-away-b9eeea2854")?.notes ?? '', /throw it away/);
  assert.match(byId.get("en-extra-eavesdrop-28897ea1b7")?.notes ?? '', /Eavesdrop on/);
  assert.equal(byId.get("deck-en-a2-travel-refund")?.additionalSenses?.[0]?.phonetic, '/rɪˈfʌnd/');
});

test('v23 seed migration preserves saved review state and adds A2 senses', () => {
  const word = INITIAL_WORDS.find(word => word.id === "deck-en-a2-travel-refund")!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 23, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === "deck-en-a2-travel-delay"));
  assert.equal(withCurrentSeed(migrated), migrated);
});
