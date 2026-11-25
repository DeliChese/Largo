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
  assert.equal(editorialIds.size, 3913);
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
  assert.equal(Object.keys(englishAdditionalSenses).length, 339);
  assert.equal(Object.values(englishAdditionalSenses).flat().length, 363);
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


test('phase 2i.1 covers 96 B1 core nouns in people and daily life', () => {
  const ids = ["en-vocab-marriage","en-vocab-respect","en-vocab-relationship","en-vocab-enemy","en-vocab-property","en-vocab-gentleman","en-vocab-liar","en-vocab-victory","en-vocab-neighborhood","en-vocab-punishment","en-vocab-champion","en-vocab-nephew","en-vocab-prayer","en-vocab-invitation","en-vocab-proposal","en-vocab-niece","en-vocab-misunderstanding","en-vocab-groom","en-vocab-excitement","en-vocab-mankind","en-vocab-protest","en-vocab-twin","en-vocab-household","en-vocab-haven","en-vocab-charge","en-vocab-jail","en-vocab-taste","en-vocab-lab","en-vocab-funeral","en-vocab-ocean","en-vocab-grave","en-vocab-studio","en-vocab-iron","en-vocab-governor","en-vocab-edge","en-vocab-pie","en-vocab-pot","en-vocab-ambulance","en-vocab-dump","en-vocab-device","en-vocab-alcohol","en-vocab-wire","en-vocab-dirt","en-vocab-basement","en-vocab-package","en-vocab-ceremony","en-vocab-gym","en-vocab-cave","en-vocab-tax","en-vocab-purse","en-vocab-exit","en-vocab-clinic","en-vocab-port","en-vocab-cage","en-vocab-wrap","en-vocab-goods","en-vocab-shelter","en-vocab-circus","en-vocab-hammer","en-vocab-necklace","en-vocab-powder","en-vocab-pork","en-vocab-brick","en-vocab-pub","en-vocab-needle","en-vocab-bacon","en-vocab-sheet","en-vocab-avenue","en-vocab-bureau","en-vocab-pillow","en-vocab-lighter","en-vocab-tissue","en-vocab-vessel","en-vocab-hut","en-vocab-cotton","en-vocab-carpet","en-vocab-silk","en-vocab-bin","en-vocab-feast","en-vocab-helmet","en-vocab-collar","en-vocab-folk","en-vocab-ginger","en-vocab-filling","en-vocab-appetite","en-vocab-candle","en-vocab-curtain","en-vocab-platform","en-vocab-harbor","en-vocab-fur","en-vocab-journal","en-vocab-ink","en-vocab-pond","en-vocab-peanut","en-vocab-bracelet","en-vocab-jar"];
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  assert.equal(new Set(ids).size, 96);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.partOfSpeech, 'Danh từ', id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.equal(byId.get('en-vocab-nephew')?.meaning, 'cháu trai (con của anh/chị/em)');
  assert.equal(byId.get('en-vocab-grave')?.additionalSenses?.[0]?.partOfSpeech, 'Tính từ');
});

test('v24 migration adds B1 senses while preserving review state', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-charge')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const state = { version: 24, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const }] as VocabWord[], logs: [], profile: INITIAL_PROFILE };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2i.2 covers 205 B1 core nouns in work, travel and life', () => {
  const deckIds = new Set(["deck-en-b1-words-work-01","deck-en-b1-words-work-02","deck-en-b1-words-travel-01","deck-en-b1-words-travel-02","deck-en-b1-words-life-01","deck-en-b1-words-life-02","deck-en-b1-words-life-03"]);
  const words = ENGLISH_WORDS.filter(word => deckIds.has(word.deckId) && word.id.startsWith('en-vocab-'));
  assert.equal(words.length, 205);
  for (const word of words) {
    assert.equal(word.partOfSpeech, 'Danh từ', word.id);
    assert.ok(Object.prototype.hasOwnProperty.call(englishEditorial, word.id), word.id);
    assert.equal(word.examples.length, 2, word.id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), word.id);
  }
  const byId = new Map(words.map(word => [word.id, word]));
  assert.match(byId.get('en-vocab-crash')?.meaning ?? '', /va chạm/);
  assert.match(byId.get('en-vocab-customs')?.meaning ?? '', /hải quan/);
  assert.equal(byId.get('en-vocab-suspect')?.additionalSenses?.[0]?.phonetic, '/səˈspekt/');
  assert.equal(byId.get('en-vocab-bow')?.additionalSenses?.length, 2);
});

test('v25 migration adds B1 secondary senses while preserving saved review data', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-suspect')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 25, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-crash'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2i.3 completes all 551 B1 core nouns', () => {
  const b1Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'b1').map(deck => deck.id));
  const nouns = ENGLISH_WORDS.filter(word => b1Decks.has(word.deckId) && word.id.startsWith('en-vocab-') && word.partOfSpeech === 'Danh từ');
  assert.equal(nouns.length, 551);
  assert.ok(nouns.every(word => Object.prototype.hasOwnProperty.call(englishEditorial, word.id)));
  const byId = new Map(nouns.map(word => [word.id, word]));
  const ids = ["en-vocab-sort","en-vocab-sex","en-vocab-dude","en-vocab-buddy","en-vocab-soul","en-vocab-mess","en-vocab-decision","en-vocab-laughter","en-vocab-press","en-vocab-mission","en-vocab-heaven","en-vocab-risk","en-vocab-duty","en-vocab-bunch","en-vocab-applause","en-vocab-treat","en-vocab-spirit","en-vocab-shame","en-vocab-justice","en-vocab-fellow","en-vocab-hearing","en-vocab-operation","en-vocab-monster","en-vocab-investigation","en-vocab-nonsense","en-vocab-turning","en-vocab-finding","en-vocab-universe","en-vocab-command","en-vocab-proof","en-vocab-opening","en-vocab-season","en-vocab-responsibility","en-vocab-process","en-vocab-sword","en-vocab-signal","en-vocab-amount","en-vocab-safety","en-vocab-reality","en-vocab-dating","en-vocab-loss","en-vocab-connection","en-vocab-warning","en-vocab-horn","en-vocab-rise","en-vocab-location","en-vocab-grant","en-vocab-switch","en-vocab-chase","en-vocab-bang","en-vocab-courage","en-vocab-council","en-vocab-union","en-vocab-desire","en-vocab-miracle","en-vocab-protection","en-vocab-treatment","en-vocab-boom","en-vocab-penny","en-vocab-refuse","en-vocab-surface","en-vocab-presence","en-vocab-beast","en-vocab-series","en-vocab-darkness","en-vocab-progress","en-vocab-vision","en-vocab-equipment","en-vocab-trace","en-vocab-incident","en-vocab-anger","en-vocab-bull","en-vocab-passion","en-vocab-movement","en-vocab-object","en-vocab-approach","en-vocab-percent","en-vocab-tank","en-vocab-authority","en-vocab-failure","en-vocab-glory","en-vocab-border","en-vocab-reputation","en-vocab-confidence","en-vocab-sand","en-vocab-setting","en-vocab-slip","en-vocab-guarantee","en-vocab-identity","en-vocab-potential","en-vocab-dozen","en-vocab-whistle","en-vocab-struggle","en-vocab-demand","en-vocab-possibility","en-vocab-trail","en-vocab-option","en-vocab-charity","en-vocab-balance","en-vocab-impression","en-vocab-fifth","en-vocab-term","en-vocab-comfort","en-vocab-wing","en-vocab-experiment","en-vocab-steel","en-vocab-bond","en-vocab-robot","en-vocab-mile","en-vocab-scratch","en-vocab-standard","en-vocab-construction","en-vocab-trigger","en-vocab-jungle","en-vocab-link","en-vocab-routine","en-vocab-pattern","en-vocab-aim","en-vocab-cliff","en-vocab-warrior","en-vocab-behalf","en-vocab-motive","en-vocab-apology","en-vocab-pipe","en-vocab-atmosphere","en-vocab-pit","en-vocab-paradise","en-vocab-comment","en-vocab-flow","en-vocab-strip","en-vocab-existence","en-vocab-limit","en-vocab-patrol","en-vocab-mud","en-vocab-occasion","en-vocab-signature","en-vocab-monitor","en-vocab-yell","en-vocab-charm","en-vocab-farewell","en-vocab-humanity","en-vocab-angle","en-vocab-session","en-vocab-hop","en-vocab-destruction","en-vocab-lightning","en-vocab-loyalty","en-vocab-liver","en-vocab-pole","en-vocab-intention","en-vocab-aid","en-vocab-objection","en-vocab-survival","en-vocab-possession","en-vocab-appeal","en-vocab-praise","en-vocab-facility","en-vocab-entry","en-vocab-burden","en-vocab-mount","en-vocab-pound","en-vocab-reception","en-vocab-concept","en-vocab-measure","en-vocab-foundation","en-vocab-log","en-vocab-privacy","en-vocab-lamb","en-vocab-blessing","en-vocab-rage","en-vocab-twist","en-vocab-humor","en-vocab-dive","en-vocab-pump","en-vocab-height","en-vocab-temper","en-vocab-weakness","en-vocab-spider","en-vocab-packing","en-vocab-conduct","en-vocab-terror","en-vocab-steam","en-vocab-cattle","en-vocab-register","en-vocab-turtle","en-vocab-combination","en-vocab-nap","en-vocab-scan","en-vocab-coffin","en-vocab-puppy","en-vocab-deposit","en-vocab-rubber","en-vocab-misery","en-vocab-emotion","en-vocab-content","en-vocab-sorrow","en-vocab-fuss","en-vocab-tin","en-vocab-belief","en-vocab-storage","en-vocab-ladder","en-vocab-barrel","en-vocab-kindness","en-vocab-tension","en-vocab-whale","en-vocab-dial","en-vocab-coal","en-vocab-recovery","en-vocab-conclusion","en-vocab-hatred","en-vocab-slight","en-vocab-principle","en-vocab-compliment","en-vocab-idol","en-vocab-rank","en-vocab-arrangement","en-vocab-stream","en-vocab-luxury","en-vocab-element","en-vocab-eternity","en-vocab-pace","en-vocab-plug","en-vocab-affection","en-vocab-absence","en-vocab-bubble","en-vocab-honesty","en-vocab-deed","en-vocab-length","en-vocab-tournament","en-vocab-depression","en-vocab-password","en-vocab-approval","en-vocab-chuckle","en-vocab-orbit","en-vocab-sympathy","en-vocab-growth","en-vocab-encounter","en-vocab-sigh","en-vocab-confusion","en-vocab-brass","en-vocab-companion","en-vocab-phoenix","en-vocab-lottery","en-vocab-presentation","en-vocab-gratitude","en-vocab-majority","en-vocab-capacity","en-vocab-shrimp","en-vocab-forehead","en-vocab-gesture"];
  assert.equal(new Set(ids).size, 250);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-vocab-passion')?.meaning ?? '', /đam mê/);
  assert.equal(byId.get('en-vocab-refuse')?.additionalSenses?.[0]?.phonetic, '/rɪˈfjuːz/');
});

test('v26 migration preserves review state and adds B1 refuse verb sense', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-refuse')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 26, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-passion'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2J covers all 104 B1 core verbs', () => {
  const b1Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'b1').map(deck => deck.id));
  const verbs = ENGLISH_WORDS.filter(word => b1Decks.has(word.deckId) && word.id.startsWith('en-vocab-') && word.partOfSpeech === 'Động từ');
  assert.equal(verbs.length, 104);
  const byId = new Map(verbs.map(word => [word.id, word]));
  for (const id of ["en-vocab-hang","en-vocab-bet","en-vocab-beat","en-vocab-suppose","en-vocab-forgive","en-vocab-protect","en-vocab-swear","en-vocab-stick","en-vocab-dare","en-vocab-prove","en-vocab-grab","en-vocab-support","en-vocab-rid","en-vocab-owe","en-vocab-witness","en-vocab-deserve","en-vocab-lay","en-vocab-afford","en-vocab-settle","en-vocab-bless","en-vocab-scare","en-vocab-assume","en-vocab-deliver","en-vocab-suffer","en-vocab-remove","en-vocab-warn","en-vocab-convince","en-vocab-drag","en-vocab-shift","en-vocab-defend","en-vocab-hire","en-vocab-commit","en-vocab-intend","en-vocab-ignore","en-vocab-advance","en-vocab-deny","en-vocab-behave","en-vocab-transfer","en-vocab-recall","en-vocab-defeat","en-vocab-bust","en-vocab-arrange","en-vocab-launch","en-vocab-insist","en-vocab-attend","en-vocab-confirm","en-vocab-inform","en-vocab-cancel","en-vocab-gain","en-vocab-proceed","en-vocab-interrupt","en-vocab-fetch","en-vocab-resist","en-vocab-respond","en-vocab-stretch","en-vocab-pin","en-vocab-punish","en-vocab-tend","en-vocab-propose","en-vocab-connect","en-vocab-maintain","en-vocab-heal","en-vocab-abandon","en-vocab-soil","en-vocab-recover","en-vocab-affect","en-vocab-counter","en-vocab-require","en-vocab-permit","en-vocab-burst","en-vocab-spoil","en-vocab-announce","en-vocab-drown","en-vocab-approve","en-vocab-bump","en-vocab-stare","en-vocab-determine","en-vocab-rely","en-vocab-shave","en-vocab-toss","en-vocab-react","en-vocab-swell","en-vocab-volunteer","en-vocab-bleed","en-vocab-observe","en-vocab-compete","en-vocab-overcome","en-vocab-locate","en-vocab-examine","en-vocab-declare","en-vocab-ensure","en-vocab-associate","en-vocab-negotiate","en-vocab-bore","en-vocab-disappoint","en-vocab-expose","en-vocab-accompany","en-vocab-repay","en-vocab-cough","en-vocab-assist","en-vocab-contain","en-vocab-leap","en-vocab-bounce","en-vocab-engage"]) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.ok(Object.prototype.hasOwnProperty.call(englishEditorial, id), id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-vocab-lay')?.notes ?? '', /laid/);
  assert.match(byId.get('en-vocab-fetch')?.meaning ?? '', /mang về/);
  assert.match(byId.get('en-vocab-approve')?.notes ?? '', /approve of/);
  assert.equal(byId.get('en-vocab-permit')?.additionalSenses?.[0]?.partOfSpeech, 'Danh từ');
});

test('v27 migration preserves review state and adds B1 permit noun sense', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-permit')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 27, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-lay'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2K.1 covers 147 B1 core adjectives, adverbs and conjunctions', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  const ids = ["en-vocab-more","en-vocab-last","en-vocab-through","en-vocab-since","en-vocab-until","en-vocab-working","en-vocab-least","en-vocab-able","en-vocab-stupid","en-vocab-sometimes","en-vocab-serious","en-vocab-scared","en-vocab-till","en-vocab-calm","en-vocab-absolutely","en-vocab-worth","en-vocab-amazing","en-vocab-weird","en-vocab-chief","en-vocab-general","en-vocab-completely","en-vocab-totally","en-vocab-definitely","en-vocab-unless","en-vocab-near","en-vocab-entire","en-vocab-paid","en-vocab-whether","en-vocab-proud","en-vocab-drunk","en-vocab-honest","en-vocab-involved","en-vocab-obviously","en-vocab-huge","en-vocab-holy","en-vocab-stuck","en-vocab-immediately","en-vocab-suddenly","en-vocab-otherwise","en-vocab-awesome","en-vocab-innocent","en-vocab-gay","en-vocab-guilty","en-vocab-pregnant","en-vocab-waste","en-vocab-written","en-vocab-ridiculous","en-vocab-responsible","en-vocab-main","en-vocab-blind","en-vocab-hanging","en-vocab-somehow","en-vocab-loud","en-vocab-horrible","en-vocab-prepared","en-vocab-incredible","en-vocab-honestly","en-vocab-fake","en-vocab-concerned","en-vocab-nowhere","en-vocab-jealous","en-vocab-aware","en-vocab-surely","en-vocab-total","en-vocab-lately","en-vocab-whenever","en-vocab-tiny","en-vocab-insane","en-vocab-naked","en-vocab-hidden","en-vocab-personally","en-vocab-barely","en-vocab-legal","en-vocab-rough","en-vocab-obvious","en-vocab-complicated","en-vocab-burning","en-vocab-giant","en-vocab-eventually","en-vocab-ashamed","en-vocab-positive","en-vocab-useless","en-vocab-scary","en-vocab-disgusting","en-vocab-pure","en-vocab-aside","en-vocab-firm","en-vocab-central","en-vocab-christian","en-vocab-capable","en-vocab-unbelievable","en-vocab-curious","en-vocab-former","en-vocab-desperate","en-vocab-dramatic","en-vocab-properly","en-vocab-directly","en-vocab-silent","en-vocab-fallen","en-vocab-precious","en-vocab-ordinary","en-vocab-exact","en-vocab-rare","en-vocab-mass","en-vocab-nasty","en-vocab-leading","en-vocab-engaged","en-vocab-sharp","en-vocab-sometime","en-vocab-gorgeous","en-vocab-normally","en-vocab-current","en-vocab-beloved","en-vocab-mental","en-vocab-secure","en-vocab-highly","en-vocab-emotional","en-vocab-entirely","en-vocab-extraordinary","en-vocab-solid","en-vocab-naturally","en-vocab-terrific","en-vocab-impressive","en-vocab-urgent","en-vocab-unique","en-vocab-cruel","en-vocab-massive","en-vocab-bound","en-vocab-flash","en-vocab-hopefully","en-vocab-rolling","en-vocab-steady","en-vocab-particularly","en-vocab-joint","en-vocab-civil","en-vocab-miserable","en-vocab-embarrassed","en-vocab-terribly","en-vocab-nuclear","en-vocab-aboard","en-vocab-selfish","en-vocab-financial","en-vocab-painful","en-vocab-plain","en-vocab-sacred","en-vocab-valuable","en-vocab-distant"];
  assert.equal(new Set(ids).size, 147);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.ok(Object.prototype.hasOwnProperty.call(englishEditorial, id), id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-vocab-gay')?.meaning ?? '', /đồng tính/);
  assert.match(byId.get('en-vocab-sometime')?.notes ?? '', /sometimes/);
  assert.match(byId.get('en-vocab-worth')?.notes ?? '', /V-ing/);
  assert.equal(byId.get('en-vocab-since')?.additionalSenses?.length, 2);
});

test('v28 migration preserves review state and adds B1 since senses', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-since')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 28, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-worth'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2K.2 completes editorial coverage of all 950 B1 core vocabulary IDs', () => {
  const b1Decks = new Set(ENGLISH_DECKS.filter(deck => deck.level === 'b1').map(deck => deck.id));
  const core = ENGLISH_WORDS.filter(word => b1Decks.has(word.deckId) && word.id.startsWith('en-vocab-'));
  assert.equal(core.length, 950);
  assert.ok(core.every(word => Object.prototype.hasOwnProperty.call(englishEditorial, word.id)));
  const byId = new Map(core.map(word => [word.id, word]));
  const ids = ["en-vocab-generous","en-vocab-religious","en-vocab-equal","en-vocab-incredibly","en-vocab-divorced","en-vocab-foolish","en-vocab-awkward","en-vocab-someplace","en-vocab-satisfied","en-vocab-forth","en-vocab-complex","en-vocab-frozen","en-vocab-officially","en-vocab-reasonable","en-vocab-thus","en-vocab-loyal","en-vocab-rotten","en-vocab-slightly","en-vocab-individual","en-vocab-merely","en-vocab-previous","en-vocab-deaf","en-vocab-extreme","en-vocab-minor","en-vocab-stubborn","en-vocab-intense","en-vocab-absolute","en-vocab-stable","en-vocab-unable","en-vocab-meanwhile","en-vocab-shocked","en-vocab-commercial","en-vocab-worthy","en-vocab-threatening","en-vocab-exhausted","en-vocab-experienced","en-vocab-southern","en-vocab-typical","en-vocab-active","en-vocab-safely","en-vocab-internal","en-vocab-talented","en-vocab-divine","en-vocab-brief","en-vocab-eternal","en-vocab-global","en-vocab-bitter","en-vocab-constantly","en-vocab-upper","en-vocab-critical","en-vocab-tense","en-vocab-remarkable","en-vocab-magnificent","en-vocab-superior","en-vocab-currently","en-vocab-deadly","en-vocab-depressed","en-vocab-shortly","en-vocab-magical","en-vocab-freezing","en-vocab-fond","en-vocab-homeless","en-vocab-unfortunate","en-vocab-temporary","en-vocab-effective","en-vocab-forbidden","en-vocab-provided","en-vocab-various","en-vocab-delighted","en-vocab-vast","en-vocab-marine","en-vocab-damaged","en-vocab-terrified","en-vocab-contrary","en-vocab-tragic","en-vocab-limited","en-vocab-delicate","en-vocab-independent","en-vocab-northern","en-vocab-permanent","en-vocab-worn","en-vocab-closely","en-vocab-sore","en-vocab-immediate","en-vocab-severe","en-vocab-alike","en-vocab-relative","en-vocab-spiritual","en-vocab-unexpected","en-vocab-electronic","en-vocab-overnight","en-vocab-lean","en-vocab-broad","en-vocab-practical","en-vocab-marked","en-vocab-adorable","en-vocab-eastern","en-vocab-faithful","en-vocab-hopeless","en-vocab-liquid","en-vocab-aggressive","en-vocab-pale","en-vocab-visual","en-vocab-mere","en-vocab-alternative","en-vocab-dull","en-vocab-stuffed","en-vocab-bold","en-vocab-faint","en-vocab-narrow","en-vocab-accidentally","en-vocab-glorious","en-vocab-electrical","en-vocab-helpless","en-vocab-formal","en-vocab-vain","en-vocab-bare","en-vocab-outer","en-vocab-handy","en-vocab-genetic","en-vocab-old-fashioned","en-vocab-endless","en-vocab-anyhow","en-vocab-wizard","en-vocab-accurate","en-vocab-bald","en-vocab-confusing","en-vocab-generally","en-vocab-secretly","en-vocab-maximum","en-vocab-minimum","en-vocab-legally","en-vocab-fortunate","en-vocab-economic","en-vocab-exclusive","en-vocab-tasty","en-vocab-rarely","en-vocab-tremendous","en-vocab-eager","en-vocab-atlantic","en-vocab-allergic","en-vocab-bent","en-vocab-essential","en-vocab-healing","en-vocab-shocking","en-vocab-approximately","en-vocab-unlikely","en-vocab-mutual"];
  assert.equal(new Set(ids).size, 148);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-vocab-economic')?.notes ?? '', /economical/);
  assert.match(byId.get('en-vocab-superior')?.notes ?? '', /Superior to/);
  assert.match(byId.get('en-vocab-accidentally')?.meaning ?? '', /vô tình/);
  assert.equal(byId.get('en-vocab-wizard')?.additionalSenses?.[0]?.partOfSpeech, 'Danh từ');
});

test('v29 migration preserves review state and adds B1 tense secondary senses', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-vocab-tense')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 29, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-vocab-wizard'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2L.1 covers 155 B1 extra vocabulary IDs', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  const ids = ["en-extra-magician-8bc345e4ff","en-extra-creator-bc6bfd848e","en-extra-scholarship-f552935eea","en-extra-specialist-ace72b3572","en-extra-salesman-3dcedf9001","en-extra-accountant-29d8c99ec2","en-extra-vet-5f9276129b","en-extra-guidance-f8aac527f9","en-extra-architect-f2e40fc1ed","en-extra-mechanic-6c8a739536","en-extra-definition-4c4ed1afbf","en-extra-instructor-cf2eb894cc","en-extra-employment-0b22f40bb7","en-extra-ape-eb3cad5b7b","en-extra-transportation-0b349c79e4","en-extra-biology-af8f827a0c","en-extra-achievement-a38bcf73d3","en-extra-breeding-7bd09a6286","en-extra-scholar-e3f48726b8","en-extra-admission-6a6ba70249","en-extra-publisher-4f03a060b7","en-extra-beaver-71da248c60","en-extra-bronze-fcbbcd5a59","en-extra-mathematics-c90e097e46","en-extra-teller-4fd76659c9","en-extra-pupil-074f370625","en-extra-philosopher-542bce4a78","en-extra-publicly-8c987381c0","en-extra-afterward-d1e9283f4b","en-extra-dialog-6940189433","en-extra-offensive-952be7cef8","en-extra-qualified-40caeb2d30","en-extra-leadership-9e720e5388","en-extra-melt-af45b9700b","en-extra-reserve-6df24c372c","en-extra-eliminate-0a60353a3f","en-extra-medium-c082456a77","en-extra-involve-873f8161e2","en-extra-spectacular-52f7e22d23","en-extra-depth-ded32129b0","en-extra-occur-def696de03","en-extra-annual-ee5e2878c4","en-extra-sequence-bf37c7c208","en-extra-anxiety-ab0231f72d","en-extra-congratulate-c7985d6d17","en-extra-choir-1be0686a78","en-extra-equally-e2f172a800","en-extra-industrial-8ff09c475d","en-extra-cultural-7e2215a75a","en-extra-despair-e7684586cd","en-extra-shiny-619fd9c3e9","en-extra-representative-482a37dd98","en-extra-conquer-2ba89aa561","en-extra-conscious-db6e2c6375","en-extra-psychological-163d817fe8","en-extra-straw-e9fa045386","en-extra-accuse-603ec1f360","en-extra-wax-57abfafa35","en-extra-herd-5527e537a2","en-extra-beautifully-f6d1c9dfa0","en-extra-altogether-87e56ce642","en-extra-attract-8bec0a29bc","en-extra-restore-f329e3a317","en-extra-embarrass-8d97def128","en-extra-classical-25d9548a80","en-extra-clip-67905ad3cc","en-extra-organic-69f81619d0","en-extra-crow-851d49d308","en-extra-observation-772c695384","en-extra-endure-93a8039471","en-extra-gap-54d5dbf012","en-extra-delightful-ee5dce7139","en-extra-reduce-4c7e98bfa0","en-extra-amusing-b7cd3e9ec4","en-extra-visible-d42ef14979","en-extra-maintenance-8589c63b09","en-extra-tobacco-da43f06caa","en-extra-divide-895479bfaa","en-extra-variety-b530f329d6","en-extra-ambitious-e428ee1e7d","en-extra-tick-55a4bc5be6","en-extra-craft-355543f790","en-extra-satisfaction-bce2966c0b","en-extra-historical-f5dbf9fe93","en-extra-freely-52ebe25eea","en-extra-invest-5c417c6c81","en-extra-protective-4b373da8b1","en-extra-frustrated-6afb642998","en-extra-stunning-d4017430f1","en-extra-essence-092bd8646c","en-extra-thankful-74a1e04493","en-extra-heavenly-7265a0b018","en-extra-casual-c633eb52f6","en-extra-respectable-b0e63ca057","en-extra-demonstration-69f02b772a","en-extra-popcorn-0a4ef253e3","en-extra-rapidly-3b4ef8c683","en-extra-resolve-fdf09cdfc2","en-extra-mechanical-96ae0f875b","en-extra-accomplish-40df7df8c9","en-extra-adopt-b0ad248584","en-extra-consideration-6195048f9c","en-extra-registration-29c9c30e06","en-extra-constitution-eb9a7650cd","en-extra-supposedly-371756e504","en-extra-entertain-fbfc486980","en-extra-notion-31f61ed3e6","en-extra-extent-2b4a5bdd6f","en-extra-shallow-91d80a4942","en-extra-horizon-4726a1bce9","en-extra-reflection-f30409c51a","en-extra-disappointment-4171913bb2","en-extra-grill-2d6c1f3fa3","en-extra-define-ecd38f2608","en-extra-farther-7d757055d1","en-extra-acknowledge-085afa73a8","en-extra-opposition-9f17469d17","en-extra-rapid-7ee6118994","en-extra-unlucky-e0dd5b5c9b","en-extra-challenging-3208c4b145","en-extra-attraction-21c0fbc5d0","en-extra-selection-6504513406","en-extra-democratic-f9070e8db0","en-extra-translate-7fd690e20d","en-extra-sticky-964a9431ff","en-extra-primitive-db1946d32a","en-extra-peculiar-9f7439aa4e","en-extra-atomic-fd43322a4d","en-extra-sensation-595f053100","en-extra-caution-3cf083c282","en-extra-thorough-a06d7b2b04","en-extra-cheerful-a9e20626ae","en-extra-depressing-8f0ccfdbf7","en-extra-demonstrate-a65dd3628d","en-extra-spicy-2efa64f917","en-extra-sheer-a505589b53","en-extra-unite-0ec19cbd2d","en-extra-phenomenon-3754c68d4b","en-extra-annoyed-72e850d110","en-extra-camel-4812585e94","en-extra-enthusiasm-87a738aed2","en-extra-parrot-4488b8b86b","en-extra-pause-6210c0bf05","en-extra-separation-66af36d5b0","en-extra-caller-61de55ba33","en-extra-competitive-020dae3832","en-extra-elbow-6e85ebe745","en-extra-mustard-352b5b6699","en-extra-definite-4b63ac4733","en-extra-aspect-bd8bf4f1e8","en-extra-relate-e78618f499","en-extra-dusty-9985c202d7","en-extra-gifted-dbdc7bf49b","en-extra-obtain-cf3c3437a8","en-extra-mild-8290c58373"];
  assert.equal(new Set(ids).size, 155);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.ok(Object.prototype.hasOwnProperty.call(englishEditorial, id), id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-extra-scholar-e3f48726b8')?.meaning ?? '', /học giả/);
  assert.match(byId.get('en-extra-breeding-7bd09a6286')?.meaning ?? '', /nhân giống/);
  assert.match(byId.get('en-extra-caller-61de55ba33')?.meaning ?? '', /gọi điện/);
  assert.equal(byId.get('en-extra-reserve-6df24c372c')?.additionalSenses?.[0]?.partOfSpeech, 'Động từ');
});

test('v30 migration preserves review state and adds B1 extra reserve verb sense', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-extra-reserve-6df24c372c')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 30, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-extra-scholar-e3f48726b8'));
  assert.equal(withCurrentSeed(migrated), migrated);
});


test('phase 2L.2 completes editorial coverage of all 310 B1 extra vocabulary IDs', () => {
  const byId = new Map(ENGLISH_WORDS.map(word => [word.id, word]));
  const ids = ["en-extra-magician-8bc345e4ff","en-extra-creator-bc6bfd848e","en-extra-scholarship-f552935eea","en-extra-specialist-ace72b3572","en-extra-salesman-3dcedf9001","en-extra-accountant-29d8c99ec2","en-extra-vet-5f9276129b","en-extra-guidance-f8aac527f9","en-extra-architect-f2e40fc1ed","en-extra-mechanic-6c8a739536","en-extra-definition-4c4ed1afbf","en-extra-instructor-cf2eb894cc","en-extra-employment-0b22f40bb7","en-extra-ape-eb3cad5b7b","en-extra-transportation-0b349c79e4","en-extra-biology-af8f827a0c","en-extra-achievement-a38bcf73d3","en-extra-breeding-7bd09a6286","en-extra-scholar-e3f48726b8","en-extra-admission-6a6ba70249","en-extra-publisher-4f03a060b7","en-extra-beaver-71da248c60","en-extra-bronze-fcbbcd5a59","en-extra-mathematics-c90e097e46","en-extra-teller-4fd76659c9","en-extra-pupil-074f370625","en-extra-philosopher-542bce4a78","en-extra-publicly-8c987381c0","en-extra-afterward-d1e9283f4b","en-extra-dialog-6940189433","en-extra-offensive-952be7cef8","en-extra-qualified-40caeb2d30","en-extra-leadership-9e720e5388","en-extra-melt-af45b9700b","en-extra-reserve-6df24c372c","en-extra-eliminate-0a60353a3f","en-extra-medium-c082456a77","en-extra-involve-873f8161e2","en-extra-spectacular-52f7e22d23","en-extra-depth-ded32129b0","en-extra-occur-def696de03","en-extra-annual-ee5e2878c4","en-extra-sequence-bf37c7c208","en-extra-anxiety-ab0231f72d","en-extra-congratulate-c7985d6d17","en-extra-choir-1be0686a78","en-extra-equally-e2f172a800","en-extra-industrial-8ff09c475d","en-extra-cultural-7e2215a75a","en-extra-despair-e7684586cd","en-extra-shiny-619fd9c3e9","en-extra-representative-482a37dd98","en-extra-conquer-2ba89aa561","en-extra-conscious-db6e2c6375","en-extra-psychological-163d817fe8","en-extra-straw-e9fa045386","en-extra-accuse-603ec1f360","en-extra-wax-57abfafa35","en-extra-herd-5527e537a2","en-extra-beautifully-f6d1c9dfa0","en-extra-altogether-87e56ce642","en-extra-attract-8bec0a29bc","en-extra-restore-f329e3a317","en-extra-embarrass-8d97def128","en-extra-classical-25d9548a80","en-extra-clip-67905ad3cc","en-extra-organic-69f81619d0","en-extra-crow-851d49d308","en-extra-observation-772c695384","en-extra-endure-93a8039471","en-extra-gap-54d5dbf012","en-extra-delightful-ee5dce7139","en-extra-reduce-4c7e98bfa0","en-extra-amusing-b7cd3e9ec4","en-extra-visible-d42ef14979","en-extra-maintenance-8589c63b09","en-extra-tobacco-da43f06caa","en-extra-divide-895479bfaa","en-extra-variety-b530f329d6","en-extra-ambitious-e428ee1e7d","en-extra-tick-55a4bc5be6","en-extra-craft-355543f790","en-extra-satisfaction-bce2966c0b","en-extra-historical-f5dbf9fe93","en-extra-freely-52ebe25eea","en-extra-invest-5c417c6c81","en-extra-protective-4b373da8b1","en-extra-frustrated-6afb642998","en-extra-stunning-d4017430f1","en-extra-essence-092bd8646c","en-extra-thankful-74a1e04493","en-extra-heavenly-7265a0b018","en-extra-casual-c633eb52f6","en-extra-respectable-b0e63ca057","en-extra-demonstration-69f02b772a","en-extra-popcorn-0a4ef253e3","en-extra-rapidly-3b4ef8c683","en-extra-resolve-fdf09cdfc2","en-extra-mechanical-96ae0f875b","en-extra-accomplish-40df7df8c9","en-extra-adopt-b0ad248584","en-extra-consideration-6195048f9c","en-extra-registration-29c9c30e06","en-extra-constitution-eb9a7650cd","en-extra-supposedly-371756e504","en-extra-entertain-fbfc486980","en-extra-notion-31f61ed3e6","en-extra-extent-2b4a5bdd6f","en-extra-shallow-91d80a4942","en-extra-horizon-4726a1bce9","en-extra-reflection-f30409c51a","en-extra-disappointment-4171913bb2","en-extra-grill-2d6c1f3fa3","en-extra-define-ecd38f2608","en-extra-farther-7d757055d1","en-extra-acknowledge-085afa73a8","en-extra-opposition-9f17469d17","en-extra-rapid-7ee6118994","en-extra-unlucky-e0dd5b5c9b","en-extra-challenging-3208c4b145","en-extra-attraction-21c0fbc5d0","en-extra-selection-6504513406","en-extra-democratic-f9070e8db0","en-extra-translate-7fd690e20d","en-extra-sticky-964a9431ff","en-extra-primitive-db1946d32a","en-extra-peculiar-9f7439aa4e","en-extra-atomic-fd43322a4d","en-extra-sensation-595f053100","en-extra-caution-3cf083c282","en-extra-thorough-a06d7b2b04","en-extra-cheerful-a9e20626ae","en-extra-depressing-8f0ccfdbf7","en-extra-demonstrate-a65dd3628d","en-extra-spicy-2efa64f917","en-extra-sheer-a505589b53","en-extra-unite-0ec19cbd2d","en-extra-phenomenon-3754c68d4b","en-extra-annoyed-72e850d110","en-extra-camel-4812585e94","en-extra-enthusiasm-87a738aed2","en-extra-parrot-4488b8b86b","en-extra-pause-6210c0bf05","en-extra-separation-66af36d5b0","en-extra-caller-61de55ba33","en-extra-competitive-020dae3832","en-extra-elbow-6e85ebe745","en-extra-mustard-352b5b6699","en-extra-definite-4b63ac4733","en-extra-aspect-bd8bf4f1e8","en-extra-relate-e78618f499","en-extra-dusty-9985c202d7","en-extra-gifted-dbdc7bf49b","en-extra-obtain-cf3c3437a8","en-extra-mild-8290c58373","en-extra-gorilla-541f42d754","en-extra-countless-96b26f76f6","en-extra-establishment-a33ba161ed","en-extra-environmental-4cb948126b","en-extra-fax-4af4e217c0","en-extra-partial-9834a14ab9","en-extra-vegetarian-28af4d7711","en-extra-conservative-c152d5bbb3","en-extra-specially-56c884a0a9","en-extra-rebuild-cf44886e54","en-extra-trumpet-b7dfa266ad","en-extra-debris-27f7340b5b","en-extra-imaginary-d0c4a7ff52","en-extra-delete-6197595503","en-extra-marble-a9dd98f82c","en-extra-curly-6307fe494e","en-extra-relatively-e2b3211f28","en-extra-numerous-ecc62dd3e8","en-extra-flock-8a1eb3d0b3","en-extra-newly-9a290a8827","en-extra-distribution-9335484503","en-extra-juicy-5c17109d20","en-extra-apparent-0794afd1bc","en-extra-preparation-1d6f04754f","en-extra-flute-c52c4fb889","en-extra-kitten-5897265940","en-extra-contribution-a7b4dc56da","en-extra-devotion-67acf560e2","en-extra-curve-80c1018a4c","en-extra-glance-e776a07090","en-extra-server-b3eacd3343","en-extra-appreciation-be49f6d6b2","en-extra-historic-c4824ae8bb","en-extra-promote-363256bd15","en-extra-embarrassment-85770399ed","en-extra-academic-b8a98203ec","en-extra-unpredictable-294df46048","en-extra-category-edb2cd3b74","en-extra-cautious-7f0c68cb87","en-extra-comparison-c271f2bb93","en-extra-improvement-62a4a0e9fb","en-extra-ecstasy-323e37c90b","en-extra-tropical-16483ee69d","en-extra-full-time-612546d7f1","en-extra-breakthrough-2142487324","en-extra-considerable-18b263dcde","en-extra-inspire-1cb6508098","en-extra-positively-9be87f32ea","en-extra-insight-e43ba08557","en-extra-ripe-fe41cc968e","en-extra-moss-9e135ab954","en-extra-notorious-fa7859fadb","en-extra-greeting-18f6b0200b","en-extra-briefly-45dc6ee672","en-extra-cherish-70f31781c0","en-extra-scope-5f161c9149","en-extra-gravy-7d880bd653","en-extra-severely-42b1b3aafb","en-extra-devastating-d61f6ed135","en-extra-adapt-f1f61cc721","en-extra-isolation-3624d3181d","en-extra-courageous-22eafa27fd","en-extra-determination-95f1a23373","en-extra-moreover-215695de89","en-extra-surround-ee48ee67db","en-extra-fright-4c3cc494be","en-extra-contribute-8aa73cb605","en-extra-obstacle-b42a5cb0b0","en-extra-arise-877d41bc54","en-extra-regain-73f1fc2040","en-extra-capsule-881df12b68","en-extra-encouraging-f629814f08","en-extra-firmly-82d88cebea","en-extra-shameful-86a8d1d3e1","en-extra-strategic-850be92fa1","en-extra-regional-e3a5741a84","en-extra-disturbance-cbc373091f","en-extra-stressful-81afd0d1b2","en-extra-bathe-2520ca0043","en-extra-stem-919a11f948","en-extra-filter-dfc3376b82","en-extra-diaper-c8cf49ca3d","en-extra-increasingly-d759e5ec6e","en-extra-initially-3ff99b1dfb","en-extra-frequently-a167ddeb1c","en-extra-dolphin-532f011ec8","en-extra-undress-2c84e0563b","en-extra-transformation-4b7e172afd","en-extra-limp-e21b6c4d86","en-extra-parachute-a438450d6b","en-extra-wildlife-33445260df","en-extra-hazard-652607e181","en-extra-frustration-1748ba31e2","en-extra-significance-8698fb89e1","en-extra-poverty-d84afde29c","en-extra-literature-ac9fa2503f","en-extra-telegram-3f40462915","en-extra-orchestra-613ad991bf","en-extra-documentary-3708de487b","en-extra-frost-d7bf0c9ea6","en-extra-submarine-3a48c2443b","en-extra-sunrise-e9f2a01862","en-extra-warmth-ecc745a0d5","en-extra-edition-6a3be76103","en-extra-immigration-9ecfc652f6","en-extra-skeleton-2ac11a9210","en-extra-terrorism-36f4662dda","en-extra-blog-def53e95f1","en-extra-burglar-afd5d0b3c1","en-extra-runaway-7c0bb2ad8c","en-extra-disk-1044dec720","en-extra-postcard-22f0b24b52","en-extra-liberation-a4075864ad","en-extra-stall-e5b6a7364e","en-extra-laboratory-512738161b","en-extra-lodge-cb610bc104","en-extra-salmon-aeaa2cec33","en-extra-expense-23b18e504d","en-extra-fountain-f0be1f3062","en-extra-jade-5db6810e7c","en-extra-discount-221617318b","en-extra-flavor-b5d2f4515b","en-extra-canal-1501284e7c","en-extra-wardrobe-7d4b47cf84","en-extra-razor-9b4f1d0e11","en-extra-tuna-32d6e4a20c","en-extra-gown-2b447a850b","en-extra-volcano-06612c2832","en-extra-heel-aee12eebca","en-extra-freezer-de0660ea5a","en-extra-jewel-ddc6af1a32","en-extra-sleeve-18159f6fa7","en-extra-spice-58e989955f","en-extra-strawberry-5e737f891d","en-extra-handkerchief-5a32410850","en-extra-bakery-144ac86d05","en-extra-pharmacy-20b04a4f01","en-extra-cabbage-0a7a27bedd","en-extra-keyboard-91f060a9ad","en-extra-settlement-a75c433ab2","en-extra-railroad-541c053166","en-extra-railway-e34d1c9011","en-extra-departure-a70712f49d","en-extra-ferry-e9087d0b20","en-extra-confirmation-93cdccc66f","en-extra-rail-fdf0d7533a","en-extra-visa-e759968ca9","en-extra-baggage-1d6f21ea90","en-extra-airline-1b288c5c6d","en-extra-nickname-a0fb3f1159","en-extra-relation-fc8fbb48a3","en-extra-buyer-6dbd0f28d0","en-extra-comedian-ff83e66c1a","en-extra-brotherhood-b49c7fc0ee","en-extra-membership-bf5cf59e35"];
  assert.equal(new Set(ids).size, 310);
  for (const id of ids) {
    const word = byId.get(id);
    assert.ok(word, id);
    assert.ok(Object.prototype.hasOwnProperty.call(englishEditorial, id), id);
    assert.equal(word.examples.length, 2, id);
    assert.ok(word.examples.every(e => e.sentence.trim() && e.translation.trim()), id);
  }
  assert.match(byId.get('en-extra-freezer-de0660ea5a')?.meaning ?? '', /tủ đông/);
  assert.match(byId.get('en-extra-determination-95f1a23373')?.meaning ?? '', /quyết tâm/);
  assert.match(byId.get('en-extra-membership-bf5cf59e35')?.meaning ?? '', /tư cách thành viên/);
  assert.equal(byId.get('en-extra-limp-e21b6c4d86')?.additionalSenses?.length, 2);
});

test('v31 migration preserves review state and adds B1 extra filter verb sense', () => {
  const word = INITIAL_WORDS.find(word => word.id === 'en-extra-filter-dfc3376b82')!;
  const { additionalSenses, ...old } = word;
  const srs = { ...word.srs, repetitions: 4, lastReviewedAt: 123 };
  const personalRelations = { synonyms: ['personal'], antonyms: [] };
  const state = { version: 31, decks: INITIAL_DECKS, words: [{ ...old, srs, bloomLevel: 3 as const, personalRelations }] as VocabWord[], logs: [], profile: { ...INITIAL_PROFILE, todayWordIds: [word.id] } };
  const migrated = withCurrentSeed(state);
  const updated = migrated.words.find(item => item.id === word.id);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.deepEqual(updated?.additionalSenses, additionalSenses);
  assert.equal(updated?.srs, srs);
  assert.equal(updated?.bloomLevel, 3);
  assert.equal(updated?.personalRelations, personalRelations);
  assert.deepEqual(migrated.profile.todayWordIds, [word.id]);
  assert.ok(!migrated.words.some(item => item.id === 'en-extra-freezer-de0660ea5a'));
  assert.equal(withCurrentSeed(migrated), migrated);
});
