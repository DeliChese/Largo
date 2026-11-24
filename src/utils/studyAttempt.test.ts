import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningAttempt, type AttemptInput } from './learningAttempt';
import { commitLearningAttempt, loadOfflineState } from './offlineStorage';
import { CORE_ENGLISH_CARD, SNAPSHOT_TIME, reviewedStudySnapshot } from './fixtures/studySnapshots';
import { gradeChoice, gradeSentence, gradeText, projectStudyAttempt, type StudySessionIdentity } from './studyAttempt';

const session: StudySessionIdentity = {
  id: 'session-fixture',
  mode: 'guided',
  deckId: 'all',
  language: 'en',
  level: 'a1',
  startedAt: SNAPSHOT_TIME,
};
const input: AttemptInput = {
  eventId: 'attempt-fixture',
  sessionId: session.id,
  attemptIndex: 0,
  wordId: CORE_ENGLISH_CARD,
  language: 'en',
  taskType: 'quiz',
  source: 'guided',
  startedAt: SNAPSHOT_TIME,
  answeredAt: SNAPSHOT_TIME + 3_000,
  isRetry: false,
  scheduledAtStart: true,
  hintCount: 0,
  revealedAnswer: false,
  outcome: 'correct',
  assessmentSource: 'local',
  quality: 3,
  skill: 'recognition',
  contextId: 'quiz',
};

test('one scheduled answer links the canonical SRS, XP and session summary; retry leaves all three intact', () => {
  const saved = reviewedStudySnapshot();
  const event = createLearningAttempt(input);
  const next = projectStudyAttempt(saved, event, session);
  const reviewed = next.words.find(({ id }) => id === input.wordId)!;
  assert.equal(reviewed.bloomLevel, 4);
  assert.equal(reviewed.srs.repetitions, 5);
  assert.equal(reviewed.srs.lastReviewedAt, event.answeredAt);
  assert.equal(next.profile.xp - saved.profile.xp, 12);
  assert.deepEqual(next.logs.at(-1), {
    id: session.id,
    timestamp: event.answeredAt,
    mode: 'guided',
    deckId: 'all',
    language: 'en',
    level: 'a1',
    wordsReviewed: 1,
    correctCount: 1,
    xpEarned: 12,
    durationSeconds: 3,
  });
  const retry = createLearningAttempt({ ...input, eventId: 'retry-fixture', attemptIndex: 1, isRetry: true });
  assert.equal(projectStudyAttempt(next, retry, session), next);
});

test('a prompt opened before the due time leaves SRS intact even when answered after the due time', () => {
  const saved = reviewedStudySnapshot();
  const word = saved.words.find(({ id }) => id === input.wordId)!;
  const early = createLearningAttempt({ ...input, startedAt: SNAPSHOT_TIME - 1, scheduledAtStart: false });
  const next = projectStudyAttempt(saved, early, session);
  assert.equal(next.words.find(({ id }) => id === word.id)?.srs, word.srs);
  assert.equal(next.logs.at(-1)?.correctCount, 1);
});

test('offline feedback grades objective answers and leaves open production uncertain', () => {
  assert.equal(gradeChoice('a', 'b', 'b').outcome, 'incorrect');
  assert.equal(gradeText('hello', 'hello', true).quality, 2);
  const state = reviewedStudySnapshot();
  const word = state.words.find(({ id }) => id === 'en-regional-color')!;
  const grade = gradeSentence('color color color color color', word);
  assert.equal(grade.outcome, 'uncertain');
  const event = createLearningAttempt({ ...input, ...grade, wordId: word.id, language: 'en', taskType: 'synthesis' });
  assert.equal(projectStudyAttempt(state, event, session), state);
});

test('localStorage-only study retains one schedule and summary but reports the missing ledger', async (t) => {
  const storage = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  const saved = reviewedStudySnapshot();
  const event = createLearningAttempt({ ...input, eventId: 'fallback-fixture' });
  const project = (state: typeof saved, attempt: typeof event) => projectStudyAttempt(state, attempt, session);
  const results = await Promise.all([
    commitLearningAttempt(event, saved, project),
    commitLearningAttempt({ ...event, eventId: 'same-position' }, saved, project),
  ]);
  assert.equal(results.filter(({ inserted }) => inserted).length, 1);
  assert.ok(results.every(({ retained }) => !retained));
  const restored = await loadOfflineState();
  assert.equal(restored?.profile.xp, saved.profile.xp + 12);
  assert.equal(restored?.logs.at(-1)?.wordsReviewed, 1);
  assert.equal(restored?.words.find(({ id }) => id === event.wordId)?.srs.repetitions, 5);
});
