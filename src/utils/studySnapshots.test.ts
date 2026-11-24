import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_DATA_VERSION, hasCurrentSeedDecks, withCurrentSeed } from '../data/seedVocab';
import type { HskEdition } from '../types/vocab';
import { getEnglishLocale, getEnglishStudyWord } from './englishStudy';
import {
  DELETED_HSK_CARD, FIXTURE_AVATAR, MISSING_LESSON, PERSONAL_CARD, PERSONAL_DECK, REGIONAL_CARD,
  SHARED_HSK_CARD, SNAPSHOT_TIME, legacyStudyBackup, newStudySnapshot, reviewedStudySnapshot,
  studySnapshotMissingLesson,
} from './fixtures/studySnapshots';
import { loadOfflineState, loadSyncFallbackState, saveOfflineState, type PersistedAppState } from './offlineStorage';
import { applyStudyReview, getDailyStudyPlan } from './studyPlan';
import { evaluateSynthesisSentence } from './srsBloom';
import { getEditionDecks, getScopedDecks, getScopedWords } from './studyScope';

function assertProgressPreserved(before: PersistedAppState, after: PersistedAppState) {
  assert.deepEqual(after.profile, before.profile); // Includes todayWordIds.
  assert.deepEqual(after.settings, before.settings);
  assert.deepEqual(after.logs, before.logs);
  assert.deepEqual(after.decks.find(({ id }) => id === PERSONAL_DECK.id), PERSONAL_DECK);
  assert.deepEqual(after.words.find(({ id }) => id === PERSONAL_CARD.id), PERSONAL_CARD);
  assert.ok(!after.words.some(({ id }) => id === DELETED_HSK_CARD));
  assert.equal(new Set(after.words.map(({ id }) => id)).size, after.words.length);

  for (const id of [SHARED_HSK_CARD, REGIONAL_CARD]) {
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

function scopeHsk(state: PersistedAppState, edition: HskEdition) {
  return getScopedWords(state.words, getScopedDecks(getEditionDecks(state.decks, 'zh', edition), 'zh', 'hsk1'), 'zh');
}

test('a new installation plans the first HSK cards at the configured daily limit', () => {
  const fresh = newStudySnapshot();
  assert.equal(fresh.version, CURRENT_DATA_VERSION);
  assert.equal(withCurrentSeed(fresh), fresh);
  assert.equal(fresh.profile.xp, 0);
  assert.deepEqual(fresh.logs, []);
  const scope = scopeHsk(fresh, 'hsk20');
  const limit = fresh.settings.dailyNewWordLimit;
  const plan = getDailyStudyPlan(scope, fresh.profile, limit, SNAPSHOT_TIME, fresh.words);
  assert.equal(plan.reviewCount, 0);
  assert.equal(plan.newCount, limit);
  assert.deepEqual(plan.words.map(({ id }) => id), scope.slice(0, limit).map(({ id }) => id));
  assert.ok(plan.words.every(({ srs }) => srs.lastReviewedAt === null));
});

test('both saved HSK editions resolve the same reviewed card and hide the deleted card', () => {
  const deckByEdition = { hsk20: MISSING_LESSON, hsk30: 'deck-zh-hsk30-hsk1-l02' } as const;
  for (const edition of ['hsk20', 'hsk30'] as const) {
    const saved = reviewedStudySnapshot(edition);
    const state = withCurrentSeed(saved);
    assert.equal(state, saved);
    assert.equal(state.settings.hskEdition, edition);
    const scope = scopeHsk(state, edition);
    const matches = scope.filter(({ id }) => id === SHARED_HSK_CARD);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].deckId, deckByEdition[edition]);
    assert.deepEqual(matches[0].srs, saved.words.find(({ id }) => id === SHARED_HSK_CARD)?.srs);
    assert.ok(!scope.some(({ id }) => id === DELETED_HSK_CARD));
    const plan = getDailyStudyPlan(scope, state.profile, state.settings.dailyNewWordLimit, SNAPSHOT_TIME, state.words);
    assert.equal(plan.reviewCount, 1);
    assert.equal(plan.words[0].id, SHARED_HSK_CARD);
  }
});

test('saved en-GB and en-US preferences use the same regional card and study progress', () => {
  const forms = { 'en-GB': 'colour', 'en-US': 'color' } as const;
  for (const locale of ['en-GB', 'en-US'] as const) {
    const saved = reviewedStudySnapshot('hsk20', locale);
    const state = withCurrentSeed(saved);
    const canonical = state.words.find(({ id }) => id === REGIONAL_CARD);
    assert.ok(canonical);
    assert.equal(getEnglishLocale(state.settings), locale);
    const rendered = getEnglishStudyWord(canonical, getEnglishLocale(state.settings));
    assert.equal(rendered.term, forms[locale]);
    assert.equal(rendered.id, canonical.id);
    assert.equal(rendered.srs, canonical.srs);
    assert.equal(rendered.bloomLevel, 4);
  }
});

test('repairing a current-version snapshot with a missing lesson is idempotent', () => {
  const saved = studySnapshotMissingLesson();
  assert.equal(saved.version, CURRENT_DATA_VERSION);
  assert.equal(hasCurrentSeedDecks(saved.decks), false);

  const repaired = withCurrentSeed(saved);
  assert.ok(hasCurrentSeedDecks(repaired.decks));
  assert.ok(scopeHsk(repaired, 'hsk20').some(({ id, deckId }) => id === SHARED_HSK_CARD && deckId === MISSING_LESSON));
  assertProgressPreserved(saved, repaired);
  assert.equal(withCurrentSeed(repaired), repaired);
});

test('installing HSK 3 on v8 adds both courses, reuses reviewed cards and respects deletions on repairs', () => {
  const saved = reviewedStudySnapshot();
  const hsk3Decks = saved.decks.filter(({ level, language }) => language === 'zh' && level === 'hsk3');
  const hsk3Ids = new Set(hsk3Decks.map(({ id }) => id));
  const source = saved.words.find(({ term, deckId }) => term === '迟到' && hsk3Ids.has(deckId))!;
  const sharedProgress = saved.words.find(({ id }) => id === SHARED_HSK_CARD)!;
  const legacyCard = { ...source, deckId: 'deck-zh-hsk2-time', srs: sharedProgress.srs, bloomLevel: sharedProgress.bloomLevel };
  const previous = {
    ...saved, version: 8,
    decks: saved.decks.filter(({ id }) => !hsk3Ids.has(id)),
    words: [...saved.words.filter(({ deckId }) => !hsk3Ids.has(deckId)), legacyCard],
  };
  const upgraded = withCurrentSeed(previous);
  assertProgressPreserved(previous, upgraded);
  assert.equal(upgraded.version, CURRENT_DATA_VERSION);
  assert.equal(upgraded.decks.filter(({ id }) => hsk3Ids.has(id)).length, 38);
  assert.ok(upgraded.words.some(({ term }) => term === '服务台'));
  for (const edition of ['hsk20', 'hsk30'] as const) {
    const decks = getScopedDecks(getEditionDecks(upgraded.decks, 'zh', edition), 'zh', 'hsk3');
    const card = getScopedWords(upgraded.words, decks, 'zh').find(({ id }) => id === legacyCard.id);
    assert.equal(card?.srs, legacyCard.srs);
    assert.equal(card?.bloomLevel, legacyCard.bloomLevel);
  }
  assert.equal(withCurrentSeed(upgraded), upgraded);
  const repaired = withCurrentSeed({
    ...upgraded, decks: previous.decks, words: upgraded.words.filter(({ id }) => id !== legacyCard.id),
  });
  assert.ok(hasCurrentSeedDecks(repaired.decks));
  assert.ok(!repaired.words.some(({ id }) => id === legacyCard.id));
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

test('a v9 snapshot refreshes lesson titles and topics without changing membership or progress', () => {
  const saved = reviewedStudySnapshot('hsk20');
  const refreshedDeck = saved.decks.find(({ id }) => id === 'deck-zh-hsk20-hsk3-l03')!;
  const removed = refreshedDeck.wordIds![0];
  const snapshot = {
    ...saved,
    decks: saved.decks.map((deck) => deck.id === refreshedDeck.id
      ? { ...deck, name: 'Bài 3 · 桌子上放着很多饮料。', category: 'Giáo trình chuẩn HSK 3 (bản HSK 2.0)', nativeName: undefined }
      : deck),
    words: saved.words.filter(({ id }) => id !== removed),
  };
  assert.equal(hasCurrentSeedDecks(snapshot.decks), false);
  const updated = withCurrentSeed(snapshot);
  assertProgressPreserved(snapshot, updated);
  assert.equal(updated.version, snapshot.version);
  assert.deepEqual(updated.decks.find(({ id }) => id === refreshedDeck.id), refreshedDeck);
  assert.ok(!updated.words.some(({ id }) => id === removed));
  assert.equal(withCurrentSeed(updated), updated);
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
