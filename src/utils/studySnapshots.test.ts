import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_DATA_VERSION, hasCurrentSeedDecks, withCurrentSeed } from '../data/seedVocab';
import { ENGLISH_LEGACY_PHRASAL_DUPLICATES } from '../data/englishDecks';
import { ENGLISH_LOCALES, getEnglishStudyWord } from './englishStudy';
import {
  CORE_ENGLISH_CARD, DELETED_ENGLISH_CARD, FIXTURE_AVATAR, MISSING_LESSON, PERSONAL_CARD, PERSONAL_DECK,
  REGIONAL_CARD, SNAPSHOT_TIME, legacyStudyBackup, newStudySnapshot, reviewedStudySnapshot,
  studySnapshotMissingLesson,
} from './fixtures/studySnapshots';
import { loadOfflineState, loadSyncFallbackState, saveOfflineState, type PersistedAppState } from './offlineStorage';
import { applyStudyReview, getDailyStudyPlan } from './studyPlan';
import { evaluateSynthesisSentence } from './srsBloom';
import { getScopedDecks, getScopedWords } from './studyScope';

function assertProgressPreserved(before: PersistedAppState, after: PersistedAppState) {
  assert.deepEqual(after.profile, before.profile); // Includes todayWordIds.
  assert.deepEqual(after.settings, before.settings);
  assert.deepEqual(after.logs, before.logs);
  assert.deepEqual(after.decks.find(({ id }) => id === PERSONAL_DECK.id), PERSONAL_DECK);
  assert.deepEqual(after.words.find(({ id }) => id === PERSONAL_CARD.id), PERSONAL_CARD);
  assert.ok(!after.words.some(({ id }) => id === DELETED_ENGLISH_CARD));
  assert.equal(new Set(after.words.map(({ id }) => id)).size, after.words.length);

  for (const id of [CORE_ENGLISH_CARD, REGIONAL_CARD]) {
    const saved = before.words.find((word) => word.id === id);
    const restored = after.words.find((word) => word.id === id);
    assert.ok(saved && restored, id);
    assert.deepEqual(restored.srs, saved.srs);
    assert.equal(restored.createdAt, saved.createdAt);
    assert.equal(restored.bloomLevel, saved.bloomLevel);
    assert.equal(restored.lastSynthesisAt, saved.lastSynthesisAt);
    assert.deepEqual(restored.personalRelations, saved.personalRelations);
  }
}

function scopeEnglishA1(state: PersistedAppState) {
  return getScopedWords(state.words, getScopedDecks(state.decks, 'en', 'a1'), 'en');
}

test('a new installation plans the first English A1 cards at the configured daily limit', () => {
  const fresh = newStudySnapshot();
  assert.equal(fresh.version, CURRENT_DATA_VERSION);
  assert.equal(withCurrentSeed(fresh), fresh);
  assert.equal(fresh.profile.xp, 0);
  assert.deepEqual(fresh.logs, []);
  const scope = scopeEnglishA1(fresh);
  const limit = fresh.settings.dailyNewWordLimit;
  const plan = getDailyStudyPlan(scope, fresh.profile, limit, SNAPSHOT_TIME, fresh.words);
  assert.equal(plan.reviewCount, 0);
  assert.equal(plan.newCount, limit);
  assert.deepEqual(plan.words.map(({ id }) => id), scope.slice(0, limit).map(({ id }) => id));
  assert.ok(plan.words.every(({ srs }) => srs.lastReviewedAt === null));
});

test('reviewed English cards appear in daily reviews and deleted starter cards stay hidden', () => {
  const saved = reviewedStudySnapshot();
  const state = withCurrentSeed(saved);
  assert.equal(state, saved);
  const scope = scopeEnglishA1(state);
  assert.ok(!scope.some(({ id }) => id === DELETED_ENGLISH_CARD));
  const plan = getDailyStudyPlan(scope, state.profile, state.settings.dailyNewWordLimit, SNAPSHOT_TIME, state.words);
  assert.equal(plan.reviewCount, 2);
  // Both fixture cards have identical due times; the planner does not promise a tie-break order.
  assert.deepEqual(new Set(plan.words.slice(0, 2).map(({ id }) => id)), new Set([REGIONAL_CARD, CORE_ENGLISH_CARD]));
});

test('both regional forms share progress regardless of the accent preference', () => {
  const forms = { 'en-GB': 'colour', 'en-US': 'color' } as const;
  for (const locale of ['en-GB', 'en-US'] as const) {
    const saved = reviewedStudySnapshot(locale);
    const state = withCurrentSeed(saved);
    const canonical = state.words.find(({ id }) => id === REGIONAL_CARD);
    assert.ok(canonical);
    assert.equal(state.settings.englishLocale, locale);
    for (const accent of ENGLISH_LOCALES) {
      const rendered = getEnglishStudyWord(canonical, accent);
      assert.equal(rendered.term, forms[accent]);
      assert.equal(rendered.id, canonical.id);
      assert.equal(rendered.srs, canonical.srs);
      assert.equal(rendered.bloomLevel, 4);
    }
  }
});

test('repairing a current-version snapshot with a missing lesson is idempotent', () => {
  const saved = studySnapshotMissingLesson();
  assert.equal(saved.version, CURRENT_DATA_VERSION);
  assert.equal(hasCurrentSeedDecks(saved.decks), false);

  const repaired = withCurrentSeed(saved);
  assert.ok(hasCurrentSeedDecks(repaired.decks));
  assert.ok(scopeEnglishA1(repaired).some(({ id, deckId }) => id === REGIONAL_CARD && deckId === MISSING_LESSON));
  assertProgressPreserved(saved, repaired);
  assert.equal(withCurrentSeed(repaired), repaired);
});

test('a JSON backup in the legacy export format provides a repeatable seed-migration fixture', () => {
  const exported = legacyStudyBackup();
  const json = JSON.stringify(exported);
  assert.equal(JSON.stringify(legacyStudyBackup()), json);
  const parsed: typeof exported = JSON.parse(json);
  assert.ok(!('format' in parsed) && !('savedAt' in parsed));
  assert.equal(parsed.version, 7);
  assert.equal(parsed.profileImages.avatar, FIXTURE_AVATAR);
  assert.equal(hasCurrentSeedDecks(parsed.decks), false);

  const migrated = withCurrentSeed(parsed);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.ok(hasCurrentSeedDecks(migrated.decks));
  assertProgressPreserved(parsed, migrated);
  assert.deepEqual(migrated.profileImages, parsed.profileImages);
  assert.equal(withCurrentSeed(migrated), migrated);
});

test('upgrading a v10 snapshot removes legacy Chinese items while preserving English progress and personal cards', () => {
  const saved = reviewedStudySnapshot('en-GB');
  const legacyState = {
    ...saved,
    version: 10,
    decks: [
      ...saved.decks,
      {
        id: 'deck-zh-hsk30-hsk1-l01',
        name: 'Bài 1 · Xin chào',
        description: 'HSK 1',
        language: 'zh',
        category: 'HSK 1',
        level: 'hsk1',
        hskEdition: 'hsk30',
        isCustom: false,
        createdAt: SNAPSHOT_TIME,
      },
    ],
    words: [
      ...saved.words,
      {
        ...PERSONAL_CARD,
        id: 'zh-0001',
        deckId: 'deck-zh-hsk30-hsk1-l01',
        term: '你好',
        phonetic: 'nǐ hǎo',
        sinoVietnamese: 'nhĩ hảo',
        radical: '亻',
        meaning: 'xin chào',
        language: 'zh',
      },
    ],
    logs: [
      ...saved.logs,
      {
        id: 'legacy-zh-log',
        timestamp: SNAPSHOT_TIME,
        mode: 'guided',
        deckId: 'deck-zh-hsk30-hsk1-l01',
        language: 'zh',
        level: 'hsk1',
        hskEdition: 'hsk30',
        wordsReviewed: 3,
        correctCount: 3,
        xpEarned: 10,
        durationSeconds: 30,
      },
    ],
    profile: {
      ...saved.profile,
      targetLanguage: 'zh',
      todayWordIds: ['zh-0001', CORE_ENGLISH_CARD, REGIONAL_CARD],
    },
    settings: {
      ...saved.settings,
      hskEdition: 'hsk30',
      showExamplePhonetic: true,
      studyLevels: { zh: 'hsk1', en: 'a1' },
      speechVoices: { zh: 'zh-CN-XiaoxiaoNeural', 'en-GB': 'en-GB-SoniaNeural' },
    },
  } as unknown as PersistedAppState;

  const migrated = withCurrentSeed(legacyState);
  assert.equal(migrated.version, CURRENT_DATA_VERSION);
  assert.ok(migrated.decks.every((deck) => deck.language === 'en'));
  assert.ok(migrated.words.every((word) => word.language === 'en'));
  assert.ok(migrated.logs.every((log) => log.language === 'en'));
  assert.equal(migrated.profile.targetLanguage, 'en');
  assert.deepEqual(migrated.profile.todayWordIds, [CORE_ENGLISH_CARD, REGIONAL_CARD]);
  assert.deepEqual(migrated.settings?.studyLevels, { en: 'a1' });
  assert.deepEqual(migrated.settings?.speechVoices, { 'en-GB': 'en-GB-SoniaNeural' });
  assert.equal('hskEdition' in (migrated.settings ?? {}), false);
  assert.equal('showExamplePhonetic' in (migrated.settings ?? {}), false);
  assertProgressPreserved({ ...saved, settings: { ...saved.settings, speechVoices: { 'en-GB': 'en-GB-SoniaNeural' } } }, migrated);
  assert.equal(withCurrentSeed(migrated), migrated);
});

test('a v11 English backup gains the expansion without changing existing progress or resurfacing deleted aliases', () => {
  const fixture = reviewedStudySnapshot('en-GB');
  const [legacyId, link] = [...ENGLISH_LEGACY_PHRASAL_DUPLICATES][0];
  const [deletedAlias, deletedLink] = [...ENGLISH_LEGACY_PHRASAL_DUPLICATES][1];
  const original = fixture.words.find(({ id }) => id === link.canonicalId)!;
  const legacyCard = {
    ...original, id: legacyId, deckId: link.deckId,
    bloomLevel: 4 as const, srs: { ...original.srs, repetitions: 5, lastReviewedAt: SNAPSHOT_TIME },
  };
  const words = fixture.words.filter(({ id }) => !id.startsWith('en-extra-'));
  const oldDeckIds = new Set(words.map(({ deckId }) => deckId));
  const v11 = {
    ...fixture, version: 11,
    decks: fixture.decks.filter(({ id }) => oldDeckIds.has(id))
      .map((deck) => deck.collection === 'phrasal' ? { ...deck, wordIds: undefined } : deck),
    words: [...words, legacyCard],
    profile: { ...fixture.profile, todayWordIds: [...fixture.profile.todayWordIds ?? [], legacyId] },
  };
  const next = withCurrentSeed(v11);
  assertProgressPreserved(v11, next);
  assert.equal(next.words.filter(({ id }) => id.startsWith('en-extra-')).length, 2963);
  assert.deepEqual(next.words.find(({ id }) => id === legacyId), legacyCard);
  assert.ok(!next.words.some(({ id }) => id === deletedAlias));
  const lesson = next.decks.find(({ id }) => id === deletedLink.deckId)!;
  assert.ok(!getScopedWords(next.words, [lesson], 'en').some(({ id }) => id === deletedLink.canonicalId));
  assert.equal(withCurrentSeed(next), next);
});

test('the local fallback round-trips JSON and gzip snapshots and ignores damaged gzip data', async (t) => {
  const expected = reviewedStudySnapshot();
  const key = 'lexisbloom_state_v3';
  let quotaFull = false;
  const fallback = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (item: string) => fallback.get(item) ?? null,
      setItem: (item: string, value: string) => {
        if (quotaFull && !value.startsWith('gzip:')) throw new DOMException('Fixture quota', 'QuotaExceededError');
        fallback.set(item, value);
      },
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  await saveOfflineState(expected);
  const plain = loadSyncFallbackState();
  assert.ok(plain);
  assertProgressPreserved(expected, plain);

  quotaFull = true;
  await saveOfflineState(expected);
  assert.match(fallback.get(key) ?? '', /^gzip:/);
  assert.equal(loadSyncFallbackState(), null);
  const compressed = await loadOfflineState();
  assert.ok(compressed);
  assert.ok((compressed.savedAt ?? 0) > (plain.savedAt ?? 0));
  assert.deepEqual(compressed, { ...plain, savedAt: compressed.savedAt });

  fallback.set(key, 'gzip:invalid');
  assert.equal(await loadOfflineState(), null);
  assert.equal(fallback.get(key), 'gzip:invalid');
});

test('the legacy keyword check can match repeated words without raising Bloom or moving SRS', () => {
  const word = reviewedStudySnapshot().words.find(({ id }) => id === REGIONAL_CARD);
  assert.ok(word);
  const grade = evaluateSynthesisSentence('color color color color color', word);
  assert.equal(grade.passed, true);
  const reviewed = applyStudyReview(word, 3, 'standard', SNAPSHOT_TIME, 'synthesis');
  assert.equal(reviewed.bloomLevel, word.bloomLevel);
  assert.equal(reviewed.srs, word.srs);
});
