import assert from 'node:assert/strict';
import test from 'node:test';
import { createLearningAttempt, type AttemptInput } from './learningAttempt';
import { buildMasteryProjection, describeMastery, getMistakeReview } from './mastery';
import { PERSONAL_CARD } from './fixtures/studySnapshots';

const DAY = 86_400_000;
function event(index: number, patch: Partial<AttemptInput> = {}) {
  return createLearningAttempt({
    eventId: 'event-' + index, sessionId: 'session-' + index, attemptIndex: 0, wordId: 'target',
    language: 'zh', hskEdition: index % 2 ? 'hsk20' : 'hsk30', taskType: 'cloze', source: 'manual',
    startedAt: index * DAY, answeredAt: index * DAY + 100, isRetry: false, scheduledAtStart: false,
    hintCount: 0, revealedAnswer: false, outcome: 'correct', assessmentSource: 'local',
    quality: 3, skill: 'context', contextId: 'context-' + index, ...patch,
  });
}

test('verified Bloom is sequential, uses spaced evidence and shares evidence across editions', () => {
  const first = event(1);
  assert.equal(buildMasteryProjection([first]).get('target')?.verifiedBloomLevel, null);
  assert.equal(buildMasteryProjection([first, first]).get('target')?.verifiedBloomLevel, null);
  const sameContext = event(2, { contextId: first.contextId });
  assert.equal(buildMasteryProjection([first, sameContext]).get('target')?.verifiedBloomLevel, 2);
  assert.equal(buildMasteryProjection([event(2), first]).get('target')?.verifiedBloomLevel, 3);
});

test('self-ratings, seen answers, hints, retries, shortcuts and AI provide no proof', () => {
  const invalid = [
    event(1, { taskType: 'flashcard', assessmentSource: 'self', skill: 'recognition' }),
    event(2, { revealedAnswer: true }), event(3, { hintCount: 1 }), event(4, { isRetry: true }),
    event(5, { taskType: 'synthesis', skill: 'production' }), event(6, { assessmentSource: 'ai' }),
    event(7, { source: 'game' }), { ...event(8), rubricVersion: 99 }, event(9, { outcome: 'uncertain' }),
  ];
  assert.equal(buildMasteryProjection(invalid).get('target')?.verifiedBloomLevel ?? null, null);
  const quiz = { taskType: 'quiz', skill: 'recognition' } as const;
  assert.equal(buildMasteryProjection([event(10, quiz), event(11, quiz)]).get('target')?.verifiedBloomLevel, 1);
});

test('repeated independent errors mark a skill for recheck without removing earned Bloom', () => {
  const result = buildMasteryProjection([
    event(1), event(2), event(3, { outcome: 'incorrect', quality: 1 }),
    event(4, { outcome: 'incorrect', quality: 1 }),
    event(5, { isRetry: true }),
  ]).get('target');
  assert.equal(result?.verifiedBloomLevel, 3);
  assert.equal(result?.skills.context?.recentFailures, 2);
  assert.equal(result?.skills.context?.lastAttempt.answeredAt, 4 * DAY + 100);
});

test('mistake review shows current cards only and clears a skill after independent success', () => {
  const word = { ...PERSONAL_CARD, id: 'target' };
  const wrong = event(1, { outcome: 'incorrect', quality: 1 });
  const projection = buildMasteryProjection([wrong, event(2, { isRetry: true })]);
  assert.equal(describeMastery(projection.get(word.id)), 'Chưa xác minh');
  assert.equal(getMistakeReview([], projection).length, 0);
  assert.equal(getMistakeReview([word], projection)[0].taskType, 'cloze');
  assert.equal(getMistakeReview([word], buildMasteryProjection([wrong, event(3)])).length, 0);
});
