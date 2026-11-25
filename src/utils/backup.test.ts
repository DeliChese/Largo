import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_DATA_VERSION, ENGLISH_SEED_VERSION, LAST_FULL_SNAPSHOT_VERSION, INITIAL_DECKS, INITIAL_WORDS, withCurrentSeed } from '../data/seedVocab';
import { createBackup, previewBackup } from './backup';
import { getScopedDecks, getScopedWords } from './studyScope';
import {
  CORE_ENGLISH_CARD, DELETED_ENGLISH_CARD, FIXTURE_AVATAR, legacyStudyBackup,
  reviewedStudySnapshot, studySnapshotMissingLesson,
} from './fixtures/studySnapshots';

test('compact backups omit unchanged seed content and preserve per-word edits', async () => {
  const state = reviewedStudySnapshot();
  const edited = state.words.find(word => word.id === CORE_ENGLISH_CARD)!;
  edited.meaning = 'Nghĩa riêng của tôi';
  const backup = createBackup(state, {});
  assert.equal(backup.formatVersion, 3);
  assert.ok(JSON.stringify(backup).length < JSON.stringify(state).length / 5);
  const restored = await previewBackup(new Blob([JSON.stringify(backup)]));
  assert.equal(restored.state.words.find(word => word.id === edited.id)?.meaning, edited.meaning);
  assert.deepEqual(restored.state.words.map(word => word.id), state.words.map(word => word.id));
});

test('an older compact edition inherits new catalogue entries and keeps edits and deletions', async () => {
  const state = reviewedStudySnapshot();
  const edited = state.words.find(word => word.id === CORE_ENGLISH_CARD)!;
  edited.meaning = 'Nghĩa do người dùng sửa';
  const backup = createBackup(state, {});
  const snapshot = backup.snapshot;
  assert.ok('wordOrder' in snapshot);
  const newCard = INITIAL_WORDS.find(word => word.id !== edited.id && word.id !== DELETED_ENGLISH_CARD)!;
  const previousEdition = {
    ...snapshot, seedVersion: ENGLISH_SEED_VERSION - 1,
    wordOrder: (snapshot.wordOrder as string[]).filter(id => id !== newCard.id),
    decks: snapshot.decks.filter(deck => deck.id !== newCard.deckId),
  };
  const parse = (snapshot: unknown) => previewBackup(new Blob([JSON.stringify({ ...backup, snapshot })]));
  const restored = (await parse(previousEdition)).state;
  assert.ok(restored.decks.some(deck => deck.id === newCard.deckId));
  assert.deepEqual(restored.words.find(word => word.id === newCard.id), newCard);
  assert.equal(restored.words.find(word => word.id === edited.id)?.meaning, edited.meaning);
  assert.ok(!restored.words.some(word => word.id === DELETED_ENGLISH_CARD));
  await assert.rejects(parse({ ...previousEdition, seedVersion: ENGLISH_SEED_VERSION }));
  await assert.rejects(parse({ ...snapshot, seedVersion: ENGLISH_SEED_VERSION + 1 }));
});

test('portable v2 export restores progress, personal cards and overrides from the last full snapshot schema', async () => {
  const state = reviewedStudySnapshot();
  const card = state.words.find(word => word.id === CORE_ENGLISH_CARD)!;
  card.notes = 'Ghi chú riêng';
  const portable = createBackup(state, { avatar: FIXTURE_AVATAR }, new Date(0), [], true);
  assert.equal(portable.formatVersion, 2);
  assert.equal(portable.appDataVersion, LAST_FULL_SNAPSHOT_VERSION);
  const restored = await previewBackup(new Blob([JSON.stringify(portable)]));
  assert.deepEqual(restored.state.words, JSON.parse(JSON.stringify(state.words)));
  assert.deepEqual(restored.state.profile, state.profile);
  assert.ok(restored.images.avatar);
});

test('compact JSON round-trip keeps the snapshot and avatar bytes', async () => {
  const state = reviewedStudySnapshot('en-GB');
  const backup = createBackup(state, { avatar: FIXTURE_AVATAR }, new Date(0));
  const preview = await previewBackup(new Blob([JSON.stringify(backup)]));
  const { savedAt, ...expected } = state;
  assert.deepEqual(JSON.parse(JSON.stringify(preview.state)), JSON.parse(JSON.stringify(expected)));
  assert.equal(preview.summary.logs, 128);
  assert.equal(preview.summary.images, 1);
  assert.equal(preview.images.avatar?.type, 'image/png');
  assert.equal(btoa(String.fromCharCode(...new Uint8Array(await preview.images.avatar!.arrayBuffer()))), FIXTURE_AVATAR.split(',')[1]);
});

test('legacy preview migrates old seed data and repairs a missing current lesson without reviving deleted cards', async () => {
  for (const backup of [legacyStudyBackup(), studySnapshotMissingLesson()]) {
    const saved = backup.words.find(({ id }) => id === CORE_ENGLISH_CARD)!;
    const { state } = await previewBackup(new Blob([JSON.stringify(backup)]));
    assert.equal(state.version, CURRENT_DATA_VERSION);
    assert.deepEqual(state.words.find(({ id }) => id === saved.id)?.srs, saved.srs);
    assert.ok(!state.words.some(({ id }) => id === DELETED_ENGLISH_CARD));
    assert.deepEqual(state.profile.todayWordIds, backup.profile.todayWordIds);
  }
});

test('v9 backup refreshes English curriculum, drops legacy Chinese records, and preserves phrasal progress', async () => {
  const fixture = reviewedStudySnapshot('en-GB');
  const newPhrasalDecks = INITIAL_DECKS.filter(({ collection }) => collection === 'phrasal');
  const template = { ...newPhrasalDecks[0], name: 'Bộ cũ', category: 'Chủ đề cũ' };
  const originalDeck = { ...template, id: 'deck-en-phrasal-travel-14' };
  const deletedDeck = { ...template, id: 'deck-en-phrasal-home-02' };
  const replacement = INITIAL_WORDS.find(({ id }) => id === 'en-phrasal-wake-up-d3d9d4b1bc')!;
  const srs = { ...replacement.srs, repetitions: 4, lastReviewedAt: 1000, nextReviewAt: 3000 };
  const reviewed = {
    ...replacement,
    deckId: originalDeck.id,
    meaning: 'Nghĩa ví dụ cũ',
    srs,
    bloomLevel: 3 as const,
    personalRelations: { synonyms: ['personal note'], antonyms: [] },
  };
  const retired = { ...reviewed, id: 'en-phrasal-retired-0000000000' };
  const personal = { ...reviewed, id: 'w-custom-fixture', term: 'personal card' };
  const deleted = 'en-phrasal-get-up-d3ec210702';
  const english = INITIAL_WORDS.find(({ id }) => id === 'en-vocab-did')!;
  const legacyChineseDeck = {
    ...originalDeck,
    id: 'deck-zh-hsk30-hsk1-l01',
    language: 'zh',
    level: 'hsk1',
    hskEdition: 'hsk30',
  };
  const legacyChineseWord = {
    ...english,
    id: 'zh-0001',
    deckId: legacyChineseDeck.id,
    term: '你好',
    language: 'zh',
    sinoVietnamese: 'nhĩ hảo',
    radical: '亻',
  };
  const old = {
    ...fixture,
    version: 9,
    decks: [...fixture.decks.filter(({ collection }) => collection !== 'phrasal'), originalDeck, deletedDeck, legacyChineseDeck],
    words: [
      ...fixture.words.filter(({ id, deckId }) => id !== english.id && !newPhrasalDecks.some((deck) => deck.id === deckId)),
      reviewed,
      retired,
      personal,
      legacyChineseWord,
      { ...english, meaning: 'Nghĩa cũ' },
    ],
    profile: { ...fixture.profile, targetLanguage: 'zh', todayWordIds: [legacyChineseWord.id, retired.id, reviewed.id] },
    settings: { ...fixture.settings, hskEdition: 'hsk30', speechVoices: { zh: 'zh-CN-XiaoxiaoNeural', 'en-GB': 'en-GB-SoniaNeural' } },
  };
  const legacyAttempt = {
    eventId: 'legacy-zh-attempt',
    sessionId: 'legacy-zh-session',
    attemptIndex: 0,
    wordId: 'zh-0001',
    language: 'zh',
    hskEdition: 'hsk30',
    taskType: 'quiz',
    source: 'guided',
    startedAt: 1000,
    answeredAt: 2000,
    isRetry: false,
    scheduledAtStart: true,
    hintCount: 0,
    revealedAnswer: false,
    outcome: 'correct',
    assessmentSource: 'local',
    quality: 3,
    skill: 'recognition',
    contextId: 'quiz',
    schemaVersion: 1,
    createdAt: 2000,
    responseMs: 1000,
    promptVersion: 1,
    rubricVersion: 1,
  };
  const backup = createBackup(
    old as unknown as Parameters<typeof createBackup>[0],
    { avatar: FIXTURE_AVATAR },
    new Date(0),
    [legacyAttempt as unknown as Parameters<typeof createBackup>[3] extends Array<infer U> ? U : never],
  );
  const { state, images, attempts } = await previewBackup(new Blob([JSON.stringify(backup)]));
  const current = state.words.find(({ id }) => id === reviewed.id)!;
  assert.equal(state.version, CURRENT_DATA_VERSION);
  assert.equal(current.deckId, replacement.deckId);
  assert.equal(current.meaning, replacement.meaning);
  assert.deepEqual(current.srs, srs);
  assert.equal(current.bloomLevel, reviewed.bloomLevel);
  assert.deepEqual(current.personalRelations, reviewed.personalRelations);
  assert.deepEqual(state.words.find(({ id }) => id === retired.id)?.srs, srs);
  assert.ok(!state.words.some(({ id }) => id === deleted));
  assert.ok(state.words.every(({ language }) => language === 'en'));
  assert.ok(state.decks.every(({ language }) => language === 'en'));
  assert.equal(state.profile.targetLanguage, 'en');
  assert.deepEqual(state.profile.todayWordIds, [retired.id, reviewed.id]);
  assert.deepEqual(state.logs, old.logs);
  assert.equal(state.words.find(({ id }) => id === english.id)?.meaning, english.meaning);
  assert.deepEqual(attempts, []);
  assert.ok(images.avatar);
  assert.equal(withCurrentSeed(state), state);

  const scoped = getScopedWords(state.words, getScopedDecks(state.decks, 'en', 'all'), 'en');
  assert.ok(!scoped.some(({ id }) => id === retired.id));
  assert.deepEqual(scoped.find(({ id }) => id === personal.id), JSON.parse(JSON.stringify(personal)));
  const nextBackup = createBackup(state, {}, new Date(0));
  const roundTrip = await previewBackup(new Blob([JSON.stringify(nextBackup)]));
  assert.deepEqual(roundTrip.state, JSON.parse(JSON.stringify(state)));
});

test('preview rejects corrupted, ambiguous and future backup data', async () => {
  const state = reviewedStudySnapshot();
  const backup = createBackup(state, {}, new Date(0));
  const reject = (value: unknown) => assert.rejects(previewBackup(new Blob([JSON.stringify(value)])));
  await assert.rejects(previewBackup(new Blob(['{'])));
  await assert.rejects(previewBackup(new Blob(['{"constructor":{"prototype":{}}}'])));
  await reject({ ...backup, formatVersion: 99 });
  await reject({ ...backup, appDataVersion: 99 });
  await reject({ ...backup, idbSchemaVersion: 99 });
  await reject({ ...backup, snapshot: { ...backup.snapshot, profile: { xp: '1' } } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, images: { avatar: 'data:image/svg+xml;base64,PHN2Zz4=' } } });
  const [word, ...words] = state.words;
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [word, word, ...words] } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [{ ...word, srs: { ...word.srs, nextReviewAt: 'tomorrow' } }, ...words] } });
  await reject({ ...backup, snapshot: { ...backup.snapshot, words: [{ ...word, deckId: 'missing-deck', id: 'custom-orphan' }, ...words] } });
  const [deck, ...decks] = state.decks;
  await reject({ ...backup, snapshot: { ...backup.snapshot, decks: [{ ...deck, nativeName: 12 }, ...decks] } });
});


test('backup round-trip retains optional additional lexical senses', async () => {
  const fixture = reviewedStudySnapshot('en-US');
  const book = INITIAL_WORDS.find(word => word.id === 'en-vocab-book')!;
  const state = {
    ...fixture, version: CURRENT_DATA_VERSION, decks: INITIAL_DECKS,
    words: [book],
  };
  const backup = createBackup(state, {}, new Date(0));
  const preview = await previewBackup(new Blob([JSON.stringify(backup)]));
  assert.deepEqual(preview.state.words.find(word => word.id === book.id)?.additionalSenses, book.additionalSenses);
});
