import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_DECKS, ENGLISH_PHRASAL_LEVEL, ENGLISH_V7_WORD_DECK_IDS, ENGLISH_WORDS, STARTER_ENGLISH_DECKS, STARTER_ENGLISH_WORDS } from '../data/englishDecks';
import { CHINESE_DECKS, CHINESE_WORDS } from '../../Chinese/chineseDecks';
import { LEGACY_DECK_ID_MAP, LEGACY_WORD_ID_MAP } from '../data/seedMigration';
import catalogue from '../../Chinese/chineseVocabulary.json' with { type: 'json' };
import { CURRENT_DATA_VERSION, hasCurrentSeedDecks, INITIAL_DECKS, INITIAL_PROFILE, INITIAL_SETTINGS, INITIAL_WORDS, withCurrentSeed } from '../data/seedVocab';
import type { StudySessionLog, VocabDeck, VocabWord } from '../types/vocab';
import { searchChineseDictionary } from './chineseDict';
import { applyStudyReview, getClozeExample, getCollocationPrompt, getDailyStudyPlan, getPracticeWords, getStudyChoices } from './studyPlan';
import { getDeckStudyLevel, getEditionDecks, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './studyScope';
import { getEnglishLocale, getEnglishStudyWord, getSpeechVoice } from './englishStudy';
import { exportDeckWord, importEnglishForms, importExamples, importTerms } from './vocabImport';

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

test('language and level selections keep the review library scoped without legacy decks', () => {
  assert.deepEqual(getStudyLanguages(INITIAL_DECKS), ['zh', 'en']);
  assert.deepEqual(getStudyLevels('zh', INITIAL_DECKS).map(({ id }) => id), ['all', 'hsk1']);
  assert.deepEqual(getStudyLevels('en', INITIAL_DECKS).map(({ id }) => id), ['all', 'a1', 'a2', 'b1', 'b2', ENGLISH_PHRASAL_LEVEL]);

  const a2Decks = getScopedDecks(INITIAL_DECKS, 'en', 'a2');
  const a2 = getScopedWords(INITIAL_WORDS, a2Decks, 'en');
  assert.equal(a2.length, 1008);
  assert.ok(a2.every((word) => word.language === 'en' && a2Decks.some((deck) => word.deckId === deck.id)));

  const b1Decks = getScopedDecks(INITIAL_DECKS, 'en', 'b1');
  const b1 = getScopedWords(INITIAL_WORDS, b1Decks, 'en');
  assert.equal(b1.length, 1058);
  assert.equal(getScopedWords(INITIAL_WORDS, getScopedDecks(INITIAL_DECKS, 'en', 'b2'), 'en').length, 1034);
  assert.equal(getScopedDecks(INITIAL_DECKS, 'zh', 'b1').length, 0);
});

test('custom languages and explicit levels are included alongside starter languages', () => {
  const deck = { ...ENGLISH_DECKS[0], language: 'ja' as const, level: 'N4', isCustom: true };
  const unclassified = { ...deck, id: 'user-words', level: undefined, category: 'Cá nhân' };
  assert.deepEqual(getStudyLanguages([...INITIAL_DECKS, deck]), ['zh', 'en', 'ja']);
  assert.equal(getDeckStudyLevel(CHINESE_DECKS[0]), 'hsk1');
  assert.deepEqual(getStudyLevels('ja', [deck, unclassified]).map(({ id }) => id), ['all', 'n4', 'custom']);
  assert.deepEqual(getScopedDecks([deck, unclassified], 'ja', 'custom'), [unclassified]);
});

test('English source data contains the A1–B2 word lists, collocation decks, and regional pairs', () => {
  const baseWords = ENGLISH_WORDS.filter(({ id }) => !id.startsWith('en-phrasal-'));
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
    const words = getScopedWords(ENGLISH_WORDS, decks, 'en');
    const phraseDecks = decks.filter(({ collection }) => collection === 'collocations');
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

test('the phrasal collection retains separate PDF meanings and has two bilingual examples per card', () => {
  const decks = ENGLISH_DECKS.filter(({ collection }) => collection === 'phrasal');
  assert.ok(decks.every((deck) => getDeckStudyLevel(deck) === ENGLISH_PHRASAL_LEVEL && deck.category));
  assert.ok(new Set(decks.map(({ category }) => category)).size > 1);
  assert.ok(ENGLISH_DECKS.every(({ category }) => category !== 'Từ thường dùng'));
  const words = getScopedWords(ENGLISH_WORDS, decks, 'en');
  assert.equal(words.length, 3210);
  assert.equal(words.filter(({ term }) => term === 'act on').length, 2);
  assert.ok(words.every(({ examples }) => examples.length === 2 && examples[0].sentence !== examples[1].sentence &&
    examples.every(({ sentence, translation }) => sentence && translation)));
  const abide = words.find(({ term }) => term === 'abide by')!;
  assert.ok(abide.synonyms.includes('comply with'));
  assert.ok(abide.antonyms.includes('violate'));
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
  assert.equal(getEnglishLocale({ speechVoices: legacyVoices }), 'en-GB');
  assert.equal(getSpeechVoice(legacyVoices, 'en', 'en-US'), undefined);
  assert.equal(getSpeechVoice(legacyVoices, 'en', 'en-GB'), legacyVoices.en);
  assert.equal(getSpeechVoice({ ...legacyVoices, 'en-US': 'en-US-JennyNeural' }, 'en', 'en-US'), 'en-US-JennyNeural');
});

test('the Chinese vocabulary source retains coverage and context for the courses and dictionary lookup', async () => {
  assert.equal(CHINESE_WORDS.length, 1388);
  assert.equal(new Set(CHINESE_WORDS.map(({ id }) => id)).size, CHINESE_WORDS.length);
  assert.ok(CHINESE_WORDS.every(({ examples }) => examples.length >= 2 && examples.slice(0, 2).every(({ translation }) => translation)));
  assert.ok(CHINESE_DECKS.every((deck) => deck.level !== 'legacy' && deck.category !== 'Bộ từ trước đây'));

  const cards = catalogue.flatMap<{ hskId?: number; a1000Id?: number }>((topic) => topic.cards);
  const sourceIds = (ids: Array<number | undefined>) => [...new Set(ids.filter((id) => id !== undefined))].sort((a, b) => a - b);
  assert.deepEqual(sourceIds(cards.map((card) => card.hskId)), Array.from({ length: 1000 }, (_, i) => i + 1));
  assert.deepEqual(sourceIds(cards.map((card) => card.a1000Id)), Array.from({ length: 1000 }, (_, i) => i + 1));

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

  assert.deepEqual(CHINESE_WORDS.filter(({ term }) => term === '过').map(({ phonetic }) => phonetic), ['guo', 'guò']);
  assert.deepEqual(CHINESE_WORDS.filter(({ term }) => term === '只').map(({ phonetic }) => phonetic), ['zhī', 'zhǐ']);
  assert.equal(CHINESE_WORDS.filter(({ term }) => term === '点').length, 2);

  const [entry] = await searchChineseDictionary('saoma');
  assert.equal(entry?.term, '扫码');
  assert.deepEqual(entry.collocations, [{ phrase: '扫码支付', meaning: 'quét mã thanh toán' }]);
  assert.ok(entry.examples[0]?.phonetic);
});

test('deck export retains bilingual examples and both types of word relations for custom languages', () => {
  const word = {
    ...makeWord('custom-japanese', 'deck-japanese', '続ける'),
    language: 'ja' as const,
    examples: [
      { sentence: '勉強を続ける。', translation: 'Tiếp tục học.' },
      { sentence: '来週も練習を続ける。', translation: 'Tuần sau vẫn tập tiếp.' },
    ],
    synonyms: ['継続する'],
    antonyms: ['やめる'],
    personalRelations: { synonyms: ['継続する', '続行する'], antonyms: ['中止する'] },
  };
  const exported = exportDeckWord(word);
  assert.deepEqual(importExamples(exported.examples), word.examples);
  assert.deepEqual(importTerms(exported.synonyms), ['継続する', '続行する']);
  assert.deepEqual(importTerms(exported.antonyms), ['やめる', '中止する']);
  assert.deepEqual(importTerms('やめる、 中止する, やめる'), ['やめる', '中止する']);
});

test('both Chinese textbooks scope and order their HSK 1 lessons', () => {
  const hsk30CoreIds = new Set(catalogue.flatMap((deck) => deck.cards)
    .filter((card) => 'hskLevel' in card && card.hskLevel === 1).map(({ id }) => id));
  for (const [edition, count, first] of [['hsk20', 182, '你'], ['hsk30', 305, '你好']] as const) {
    const decks = getEditionDecks(INITIAL_DECKS, 'zh', edition);
    const words = getScopedWords(INITIAL_WORDS, decks, 'zh');
    assert.equal(decks.length, 15);
    assert.ok(decks.every((deck) => deck.hskEdition === edition && deck.level === 'hsk1'));
    assert.equal(words.length, count);
    assert.equal(words[0].term, first);
    assert.equal(new Set(words.map(({ id }) => id)).size, words.length);
    for (const deck of decks) {
      assert.deepEqual(words.filter(({ deckId }) => deckId === deck.id).map(({ id }) => id), deck.wordIds);
    }
    assert.deepEqual(getDailyStudyPlan(words, INITIAL_PROFILE, 4, Date.now()).words, words.slice(0, 4));
    const firstLesson = getScopedWords(words, [decks[0]], 'zh').map((word, index) => ({
      ...word, srs: { ...word.srs, nextReviewAt: 1000 - index },
    }));
    assert.deepEqual(getPracticeWords(firstLesson, decks[0].id, 'all', 1, 'flashcard', Date.now()), firstLesson);
    if (edition === 'hsk30') {
      assert.equal(hsk30CoreIds.size, 300);
      assert.deepEqual(new Set(words.map(({ id }) => id).filter((id) => hsk30CoreIds.has(id))), hsk30CoreIds);
      assert.equal(words.find(({ term }) => term === '手机号')?.deckId, 'deck-zh-hsk30-hsk1-l06');
      assert.equal(words.find(({ term }) => term === '下雪')?.deckId, 'deck-zh-hsk30-hsk1-l12');
    }
  }
});

test('migrating v1 and v4 states preserves SRS progress, custom decks, deletions, and adds textbook cards', () => {
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
  assert.ok(migratedV1.words.some(({ term }) => term === '手机号'));
  assert.equal(migratedV1.words.some(({ id }) => id === mappedDeletedId), false);
  assert.equal(migratedV1.words.filter(({ language }) => language === 'en').length, ENGLISH_WORDS.length);

  // v4 upgrade: keeps deletions and Chinese progress, then adds the new textbook and English cards.
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
  const preV5EnglishWithoutFirst = STARTER_ENGLISH_WORDS.filter((w) => w.deckId !== 'deck-en-b1-communication').slice(1);
  const v4Log: StudySessionLog = {
    id: 'v4-legacy-log', timestamp: 20_000, mode: 'quiz', deckId: 'deck-hsk2-work', level: 'legacy',
    wordsReviewed: 5, correctCount: 4, xpEarned: 20, durationSeconds: 45,
  };
  const v4State = {
    version: 4,
    decks: STARTER_ENGLISH_DECKS.filter((d) => d.id !== 'deck-en-b1-communication'),
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
  assert.ok(migratedV4.words.some((w) => w.term === '手机号'));
  assert.deepEqual(migratedV4.logs, [{ ...v4Log, deckId: 'deck-zh-hsk2-people', level: 'hsk2' }]);
  assert.equal(withCurrentSeed(migratedV4), migratedV4);
});

test('v5 progress is shared by both editions and out-of-course reviews stay in storage', () => {
  const shared = CHINESE_WORDS.find(({ term }) => term === '你')!;
  const outOfCourse = CHINESE_WORDS.find(({ term }) => term === '扫码')!;
  const oldDeck: VocabDeck = {
    id: 'deck-zh-hsk1-core', name: 'Bộ của phiên bản trước', description: '', language: 'zh',
    category: 'HSK 1', level: 'hsk1', isCustom: false, createdAt: 1000,
  };
  const personal = makeWord('my-card', oldDeck.id, '筆記本');
  const srs = { ...shared.srs, repetitions: 4, lastReviewedAt: 12_000, nextReviewAt: 25_000 };
  const state = withCurrentSeed({
    version: 5,
    decks: [oldDeck, ...STARTER_ENGLISH_DECKS],
    words: [
      { ...shared, deckId: oldDeck.id, bloomLevel: 3, srs },
      { ...outOfCourse, srs }, personal, ...STARTER_ENGLISH_WORDS.slice(0, -1),
    ],
    profile: { ...INITIAL_PROFILE, todayWordIds: [shared.id, outOfCourse.id] },
    settings: { ...INITIAL_SETTINGS, studyLevels: { zh: 'hsk3' } },
    logs: [],
  });
  const hsk20 = getScopedWords(state.words, getEditionDecks(state.decks, 'zh', 'hsk20'), 'zh');
  const hsk30 = getScopedWords(state.words, getEditionDecks(state.decks, 'zh', 'hsk30'), 'zh');
  assert.equal(state.settings.hskEdition, 'hsk30');
  assert.equal(hsk20.find(({ id }) => id === shared.id)?.deckId, 'deck-zh-hsk20-hsk1-l01');
  assert.equal(hsk30.find(({ id }) => id === shared.id)?.deckId, 'deck-zh-hsk30-hsk1-l02');
  for (const course of [hsk20, hsk30]) {
    assert.equal(course.find(({ id }) => id === shared.id)?.srs, srs);
    assert.equal(course.find(({ id }) => id === shared.id)?.bloomLevel, 3);
    assert.ok(!course.some(({ term }) => term === '好' || term === outOfCourse.term));
    assert.ok(course.includes(personal));
  }
  assert.ok(state.decks.find(({ id }) => id === oldDeck.id)?.isCustom);
  assert.equal(state.words.find(({ id }) => id === outOfCourse.id)?.srs, srs);
  assert.deepEqual(state.profile.todayWordIds, [shared.id, outOfCourse.id]);
  assert.equal(state.words.filter(({ language }) => language === 'en').length, ENGLISH_WORDS.length - 1);
});

test('v6 English saves gain the curriculum without reviving deletions or replacing progress and personal cards', () => {
  const [reviewed, deleted] = STARTER_ENGLISH_WORDS;
  const customDeck = { ...STARTER_ENGLISH_DECKS[0], id: 'en-personal', isCustom: true };
  const custom = makeWord('en-personal-word', customDeck.id, 'text a friend', 'en');
  const srs = { ...reviewed.srs, repetitions: 3, lastReviewedAt: 12000, nextReviewAt: 25000 };
  const old = {
    version: 6,
    decks: [...CHINESE_DECKS, ...STARTER_ENGLISH_DECKS, customDeck],
    words: [
      ...INITIAL_WORDS.filter(({ language }) => language === 'zh'),
      ...STARTER_ENGLISH_WORDS.filter(({ id }) => id !== reviewed.id && id !== deleted.id),
      { ...reviewed, srs, bloomLevel: 3 as const, lastSynthesisAt: 11000 }, custom,
    ],
    profile: { ...INITIAL_PROFILE, todayWordIds: [reviewed.id] },
    settings: { ...INITIAL_SETTINGS, studyLevels: { en: 'a2' } },
    logs: [],
  };
  const current = withCurrentSeed(old);
  assert.ok(hasCurrentSeedDecks(current.decks));
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.srs, srs);
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.bloomLevel, 3);
  assert.equal(current.words.find(({ id }) => id === reviewed.id)?.lastSynthesisAt, 11000);
  assert.ok(!current.words.some(({ id }) => id === deleted.id));
  assert.ok(current.words.includes(custom) && current.decks.includes(customDeck));
  assert.deepEqual(current.profile.todayWordIds, [reviewed.id]);
  assert.equal(current.settings.studyLevels.en, 'a2');
  assert.ok(getScopedWords(current.words, getScopedDecks(current.decks, 'en', 'b2'), 'en').length);
  assert.equal(withCurrentSeed(current), current);
  const stamped = withCurrentSeed({ ...old, version: CURRENT_DATA_VERSION });
  assert.equal(stamped.words.length, current.words.length);
  assert.ok(!stamped.words.some(({ id }) => id === deleted.id));
});

test('v7 curriculum upgrades preserve moved card progress, missing cards and personal lexical relations', () => {
  const moved = ENGLISH_WORDS.filter(({ id, deckId }) =>
    id.startsWith('en-vocab-') && ENGLISH_V7_WORD_DECK_IDS.get(id) !== deckId);
  const [reviewed, deleted] = moved;
  assert.ok(reviewed && deleted);
  const oldDecks = new Set(ENGLISH_V7_WORD_DECK_IDS.values());
  const original = INITIAL_DECKS.filter(({ id, language }) => language === 'zh' || oldDecks.has(id));
  assert.equal(original.filter(({ language }) => language === 'en').length, oldDecks.size);
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
  assert.ok(state.words.some(({ term }) => term === 'abide by'));
  assert.deepEqual(state.profile.todayWordIds, [reviewed.id]);
  assert.equal(withCurrentSeed(state), state);
});

test('a snapshot stamped with the current version before the lessons were installed still loads both courses', () => {
  const oldDecks = catalogue.filter(({ id }) => id !== 'deck-zh-textbook-supplements');
  const oldDeckByWordId = new Map(oldDecks.flatMap((deck) => deck.cards.map(({ id }) => [id, deck.id] as const)));
  const shared = CHINESE_WORDS.find(({ term }) => term === '你')!;
  const deleted = CHINESE_WORDS.find(({ term }) => term === '好')!;
  const srs = { ...shared.srs, repetitions: 4, lastReviewedAt: 12_000, nextReviewAt: 25_000 };
  const words = CHINESE_WORDS.flatMap((word) => {
    const deckId = oldDeckByWordId.get(word.id);
    if (!deckId || word.id === deleted.id) return [];
    return [{ ...word, deckId, srs: word.id === shared.id ? srs : word.srs }];
  });
  const repaired = withCurrentSeed({
    version: CURRENT_DATA_VERSION,
    decks: oldDecks.map(({ id, name, description, category, level }): VocabDeck => ({
      id, name, description, category, level, language: 'zh', isCustom: false, createdAt: 1000,
    })),
    words,
    profile: INITIAL_PROFILE,
    logs: [],
  });

  for (const [edition, count] of [['hsk20', 181], ['hsk30', 304]] as const) {
    const decks = getEditionDecks(repaired.decks, 'zh', edition);
    const scoped = getScopedWords(repaired.words, decks, 'zh');
    assert.equal(decks.length, 15);
    assert.equal(scoped.length, count);
    assert.equal(scoped.find(({ id }) => id === shared.id)?.srs, srs);
    assert.ok(!scoped.some(({ id }) => id === deleted.id));
  }
  assert.equal(withCurrentSeed(repaired), repaired);
});

test('repairing a saved textbook deck restores its membership and respects deleted supplements', () => {
  const deleted = CHINESE_WORDS.find(({ term }) => term === '手机号')!;
  const broken = {
    version: CURRENT_DATA_VERSION,
    decks: INITIAL_DECKS.map((deck, index) => index === 0 ? { ...deck, wordIds: undefined } : deck),
    words: INITIAL_WORDS.filter(({ id }) => id !== deleted.id),
    profile: INITIAL_PROFILE,
    logs: [],
  };
  const repaired = withCurrentSeed(broken);
  assert.deepEqual(repaired.decks[0].wordIds, INITIAL_DECKS[0].wordIds);
  assert.ok(!repaired.words.some(({ id }) => id === deleted.id));
  assert.equal(withCurrentSeed(repaired), repaired);
});
