import assert from 'node:assert/strict';
import test from 'node:test';
import { createBackup, previewBackup } from './backup';
import { newStudySnapshot, SHARED_HSK_CARD, SNAPSHOT_TIME } from './fixtures/studySnapshots';
import { createLearningAttempt, decodeLearningAttempt, type AttemptInput } from './learningAttempt';

const attemptInput: AttemptInput = {
  eventId: 'b3211f66-a111-4dfb-a91e-cbd821d65792',
  sessionId: '5c60feea-ab82-41e5-990a-a4d06463eeeb',
  attemptIndex: 0,
  wordId: SHARED_HSK_CARD,
  language: 'zh',
  hskEdition: 'hsk30',
  taskType: 'quiz',
  source: 'guided',
  startedAt: SNAPSHOT_TIME,
  answeredAt: SNAPSHOT_TIME + 250,
  isRetry: false,
  scheduledAtStart: true,
  hintCount: 0,
  revealedAnswer: false,
  outcome: 'correct',
  assessmentSource: 'local',
  quality: 3,
  skill: 'recognition',
  contextId: 'recognition',
};

test('attempt records use a stable ID and discard unknown fields including raw answers', () => {
  const event = createLearningAttempt(attemptInput);
  assert.equal(event.responseMs, 250);
  assert.equal(event.eventId, attemptInput.eventId);
  assert.deepEqual(decodeLearningAttempt({ ...event, rawAnswer: 'discard this' }), event);
  assert.equal(decodeLearningAttempt({ ...event, schemaVersion: 99 }), null);
  assert.equal(decodeLearningAttempt({ ...event, responseMs: -1 }), null);
  assert.equal(decodeLearningAttempt({ ...event, startedAt: event.answeredAt + 1 }), null);
});

test('v2 backup includes attempts, preserves archived attempts for removed words and rejects duplicate or future events', async () => {
  const event = createLearningAttempt(attemptInput);
  const state = newStudySnapshot();
  state.words = state.words.filter(({ id }) => id !== event.wordId);
  const backup = createBackup(state, {}, new Date(0), [event]);
  const parse = (value: unknown) => previewBackup(new Blob([JSON.stringify(value)]));
  assert.deepEqual((await parse(backup)).attempts, [event]);
  await assert.rejects(parse({ ...backup, attempts: [event, event] }));
  await assert.rejects(parse({ ...backup, attempts: [{ ...event, schemaVersion: 2 }] }));
});
