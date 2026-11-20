import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_PROFILE } from '../data/seedVocab';
import type { VocabWord } from '../types/vocab';
import { planAdaptiveSession, explainPlanItem, type AdaptivePlannerInput } from './adaptivePlanner';
import { PERSONAL_CARD, SHARED_HSK_CARD, DELETED_HSK_CARD, SNAPSHOT_TIME, reviewedStudySnapshot } from './fixtures/studySnapshots';
import { createLearningAttempt, type AttemptInput } from './learningAttempt';
import { buildMasteryProjection } from './mastery';
import { applyStudyReview, getDailyStudyPlan, getStudyExercise } from './studyPlan';
import { getEditionDecks, getScopedDecks, getScopedWords } from './studyScope';
import { compareAdaptivePlans, summarizeAdaptiveStudy } from './plannerMetrics';
import { hasOfflinePronunciation } from './soundEngine';

const DAY = 86_400_000;

function card(id: string, due = SNAPSHOT_TIME - DAY, reviewed = true): VocabWord {
  return {
    ...PERSONAL_CARD, id, term: '词' + id, meaning: 'từ ' + id, examples: [],
    srs: { ...PERSONAL_CARD.srs, lastReviewedAt: reviewed ? SNAPSHOT_TIME - 5 * DAY : null,
      nextReviewAt: due, repetitions: reviewed ? 4 : 0 },
  };
}

function sampleEvent(wordId: string, patch: Partial<AttemptInput> = {}) {
  return createLearningAttempt({
    eventId: 'event-' + wordId, sessionId: 'session-' + wordId, attemptIndex: 0,
    wordId, language: 'zh', hskEdition: 'hsk20', taskType: 'dictation', source: 'manual',
    startedAt: SNAPSHOT_TIME - DAY, answeredAt: SNAPSHOT_TIME - DAY + 1_000, isRetry: false,
    scheduledAtStart: false, hintCount: 0, revealedAnswer: false, outcome: 'incorrect',
    assessmentSource: 'local', quality: 1, skill: 'listening', contextId: 'listen', ...patch,
  });
}

function input(words: VocabWord[], recentEvents = [] as ReturnType<typeof sampleEvent>[]): AdaptivePlannerInput {
  return {
    words, profile: INITIAL_PROFILE, newWordLimit: 8, now: SNAPSHOT_TIME,
    masteryById: buildMasteryProjection(recentEvents), recentEvents, audioLanguages: new Set(['zh']),
  };
}

test('without usable evidence, daily selection and prompt order match the established planner', () => {
  const words = [card('b'), card('a'), card('c', SNAPSHOT_TIME, false)];
  const baseline = getDailyStudyPlan(words, INITIAL_PROFILE, 8, SNAPSHOT_TIME);
  const history = Array.from({ length: 100 }, (_, i) => sampleEvent('a', {
    eventId: 'hint-' + i, attemptIndex: i, hintCount: 1, outcome: 'correct', quality: 2,
  }));
  const plan = planAdaptiveSession(input(words, history));
  assert.equal(plan.strategy, 'legacy');
  assert.deepEqual(plan.words, baseline.words);
  assert.deepEqual(plan.items.map(({ taskType, reverse }) => ({ mode: taskType, reverse })),
    baseline.words.map((word) => getStudyExercise(word, 'guided', false)));
});

test('large backlog excludes new words and reserves a slot for the oldest due card', () => {
  const overdue = Array.from({ length: 50 }, (_, i) => card('due-' + i, SNAPSHOT_TIME - DAY - (50 - i) * 20_000));
  const fresh = Array.from({ length: 10 }, (_, i) => card('new-' + i, SNAPSHOT_TIME, false));
  const data = input([...overdue, ...fresh], [...overdue.slice(1).map(({ id }) => sampleEvent(id)), sampleEvent(fresh[0].id)]);
  const before = structuredClone(data.words);
  const plan = planAdaptiveSession(data);
  assert.equal(plan.dueCount, 50);
  assert.equal(plan.reviewCount, 12);
  assert.equal(plan.newCount, 0);
  assert.equal(plan.items[0].wordId, overdue[0].id);
  assert.ok(plan.items.every(({ dueKind }) => dueKind === 'overdue'));
  assert.deepEqual(data.words, before);
});

test('the weak listening skill selects dictation only with a matching offline voice', () => {
  const word = card('listen');
  const data = input([word], [sampleEvent(word.id)]);
  const plan = planAdaptiveSession(data);
  assert.deepEqual(plan.items, [{
    wordId: word.id, taskType: 'dictation', reverse: false, reasonCode: 'weak_listening',
    dueKind: 'overdue', evidenceTarget: 'listening',
  }]);
  assert.equal(explainPlanItem(plan.items[0]), 'Củng cố kỹ năng nghe theo kết quả luyện gần đây.');
  assert.equal(planAdaptiveSession({ ...data, audioLanguages: new Set() }).items[0].taskType, 'flashcard');
  assert.deepEqual(planAdaptiveSession(data), plan);
});

test('voice availability requires an on-device voice for the selected locale', () => {
  const voices = [
    { lang: 'en-US', voiceURI: 'one', name: 'US offline', localService: true, default: false },
    { lang: 'en-GB', voiceURI: 'two', name: 'UK network', localService: false, default: false },
    { lang: 'zh-CN', voiceURI: 'three', name: 'Mandarin offline', localService: true, default: false },
  ];
  assert.equal(hasOfflinePronunciation(voices, 'en-US'), true);
  assert.equal(hasOfflinePronunciation(voices, 'en-GB'), false);
  assert.equal(hasOfflinePronunciation(voices, 'zh'), true);
});

test('missing prompt keys, uncertain AI and unsuitable distractors fall back to exercises available offline', () => {
  const word = card('solo');
  const events = [
    sampleEvent(word.id, { taskType: 'cloze', skill: 'context' }),
    sampleEvent(word.id, { eventId: 'ai-result', attemptIndex: 1, taskType: 'synthesis', skill: 'production',
      assessmentSource: 'ai', outcome: 'unavailable', quality: undefined }),
  ];
  const plan = planAdaptiveSession(input([word], events));
  assert.equal(plan.items[0].taskType, 'flashcard');
  assert.equal(plan.items.length, 1);
});

test('shared HSK IDs remain canonical and deleted or out-of-scope cards are excluded', () => {
  const saved = reviewedStudySnapshot();
  const events = [sampleEvent(SHARED_HSK_CARD), sampleEvent(DELETED_HSK_CARD), sampleEvent('outside')];
  for (const edition of ['hsk20', 'hsk30'] as const) {
    const deckList = getScopedDecks(getEditionDecks(saved.decks, 'zh', edition), 'zh', 'hsk1');
    const words = getScopedWords(saved.words, deckList, 'zh');
    const shared = words.find(({ id }) => id === SHARED_HSK_CARD)!;
    const plan = planAdaptiveSession(input([...words, shared], events));
    assert.equal(plan.items.filter(({ wordId }) => wordId === shared.id).length, 1);
    assert.ok(plan.items.every(({ wordId }) => words.some(({ id }) => wordId === id)));
    assert.ok(!plan.items.some(({ wordId }) => wordId === DELETED_HSK_CARD));
  }
});

for (let scenario = 0; scenario < 20; scenario += 1) {
  test(`shadow comparison ${scenario + 1}/20 preserves the daily constraints`, () => {
    const due = Array.from({ length: scenario }, (_, i) => card('due-' + i, SNAPSHOT_TIME - i * 6 * 3_600_000));
    const newCards = Array.from({ length: 4 }, (_, i) => card('new-' + i, SNAPSHOT_TIME, false));
    const priorReviews = Array.from({ length: scenario % 4 }, (_, i): VocabWord => {
      const word = card('outside-' + i, SNAPSHOT_TIME + DAY);
      return { ...word, language: 'en', srs: { ...word.srs, firstReviewedAt: SNAPSHOT_TIME } };
    });
    const words = [...newCards, ...due];
    const data: AdaptivePlannerInput = {
      ...input(words, due.filter((_, i) => i % 2 === 0).map(({ id }) => sampleEvent(id))),
      newWordLimit: scenario % 5,
      quotaWords: [...words, ...priorReviews],
      audioLanguages: new Set(scenario % 2 ? ['zh'] : []),
    };
    const original = structuredClone(words);
    const planned = planAdaptiveSession(data);
    const legacy = getDailyStudyPlan(words, data.profile, data.newWordLimit, data.now, data.quotaWords);
    const audit = compareAdaptivePlans(planned, legacy);
    assert.equal(audit.adaptiveReviews, audit.legacyReviews);
    assert.equal(audit.adaptiveNew, audit.legacyNew);
    assert.equal(audit.includesOldest, true);
    assert.ok(audit.commonReviews <= audit.legacyReviews);
    assert.ok(planned.items.length <= 12);
    assert.equal(new Set(planned.items.map(({ wordId }) => wordId)).size, planned.items.length);
    assert.deepEqual(planned.items.slice(planned.reviewCount).map(({ wordId }) => wordId),
      legacy.words.slice(legacy.reviewCount).map(({ id }) => id));
    assert.ok(planned.items.slice(0, planned.reviewCount).every(({ dueKind }) => dueKind !== 'new'));
    assert.deepEqual(planAdaptiveSession(data), planned);
    assert.deepEqual(words, original);
  });
}

test('after five completed sessions every card from an original backlog of 50 has been served', () => {
  let words = Array.from({ length: 50 }, (_, i) => card('due-' + i, SNAPSHOT_TIME - 3 * DAY + i));
  const history = words.filter((_, i) => i % 3 !== 0).map(({ id }) => sampleEvent(id));
  const seen = new Set<string>();
  for (let session = 0; session < 5; session += 1) {
    const now = SNAPSHOT_TIME + session * 1_000;
    const plan = planAdaptiveSession({ ...input(words, history), now });
    const planned = new Set(plan.items.map(({ wordId }) => wordId));
    for (const id of planned) {
      assert.ok(!seen.has(id));
      seen.add(id);
    }
    words = words.map((word) => planned.has(word.id) ? applyStudyReview(word, 3, 'standard', now, 'flashcard', 'guided') : word);
  }
  assert.equal(seen.size, 50);
});

test('available exercise types break repeated runs within a personalized plan', () => {
  const words = Array.from({ length: 6 }, (_, i) => card('listen-' + i));
  const plan = planAdaptiveSession(input(words, words.map(({ id }) => sampleEvent(id))));
  assert.deepEqual(plan.items.map(({ taskType }) => taskType), ['dictation', 'dictation', 'flashcard', 'dictation', 'dictation', 'flashcard']);
});

test('rollout metrics use only observed attempts, exclude retries, and count independent recall on the next due review', () => {
  const first = sampleEvent('a', { source: 'guided', adaptivePlan: { version: 1, plannedItems: 2, weakSkill: true } });
  const second = sampleEvent('b', { source: 'guided', sessionId: first.sessionId, attemptIndex: 1, hintCount: 1,
    adaptivePlan: { version: 1, plannedItems: 2, weakSkill: false } });
  const retry = sampleEvent('a', { eventId: 'retry-a', isRetry: true, attemptIndex: 2, adaptivePlan: first.adaptivePlan });
  const later = sampleEvent('a', { eventId: 'next-a', sessionId: 'next-session', startedAt: SNAPSHOT_TIME, answeredAt: SNAPSHOT_TIME + 1,
    scheduledAtStart: true, outcome: 'correct', quality: 3 });
  const metrics = summarizeAdaptiveStudy([later, first, second, retry, later]);
  assert.deepEqual(metrics, { sessionsWithAnswers: 1, sessionsCompleted: 1, answers: 2, weakSkillAnswers: 1,
    hintedAnswers: 1, incorrectAnswers: 2, retryAnswers: 1, followUpCorrect: 1, followUpObserved: 1 });
});
