import type { LanguageCode, ReviewQuality, StudySessionMode, VocabWord } from '../types/vocab';
import type { AttemptInput, LearningAttemptEvent } from './learningAttempt';
import type { PersistedAppState } from './offlineStorage';
import { evaluateAnswerMatch, evaluateSynthesisSentence, normalizeText, reviewXp } from './srsBloom';
import { applyStudyReview, isScheduledReview, recordStudyActivity } from './studyPlan';

export interface StudySessionIdentity {
  id: string;
  mode: StudySessionMode;
  deckId: string;
  language: LanguageCode;
  level: string;
  startedAt: number;
}

export interface SessionProgress {
  wordsReviewed: number;
  correctCount: number;
  xpEarned: number;
  durationSeconds: number;
}

export interface LocalGrade extends Pick<AttemptInput, 'outcome' | 'quality' | 'assessmentSource' | 'criteria'> {
  message: string;
}

export const EMPTY_PROGRESS: SessionProgress = { wordsReviewed: 0, correctCount: 0, xpEarned: 0, durationSeconds: 0 };

function closedGrade(correct: boolean, expected: string, hinted = false): LocalGrade {
  return {
    assessmentSource: 'local', outcome: correct ? 'correct' : 'incorrect', quality: correct ? hinted ? 2 : 3 : 1,
    message: correct ? 'Chính xác' : 'Đáp án đúng là ' + expected,
  };
}

export function gradeChoice(selectedId: string, expectedId: string, expected: string) {
  return closedGrade(selectedId === expectedId, expected);
}

export function gradeText(answer: string, expected: string, hinted: boolean) {
  return closedGrade(evaluateAnswerMatch(answer, expected), expected, hinted);
}

export function gradeSelfRating(quality: ReviewQuality): LocalGrade {
  return { outcome: quality >= 2 ? 'correct' : 'incorrect', quality, assessmentSource: 'self', message: '' };
}

export function gradeSentence(answer: string, word: VocabWord): LocalGrade {
  const check = evaluateSynthesisSentence(answer, word);
  return {
    outcome: 'uncertain', assessmentSource: 'local',
    criteria: { targetUsage: check.hasTargetWord ? 'uncertain' : 'fail', grammar: 'uncertain', meaning: 'uncertain', naturalness: 'uncertain' },
    message: check.feedback + ' Câu này chưa được xác minh.',
  };
}

// Record a stable fingerprint of the prompted context, never the answer the learner entered.
export function studyContextId(text: string): string {
  let hash = 2166136261;
  for (const character of normalizeText(text)) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function projectStudyAttempt(
  state: PersistedAppState, attempt: LearningAttemptEvent, session: StudySessionIdentity,
): PersistedAppState {
  if (session.id !== attempt.sessionId) throw new Error('Lượt trả lời không thuộc phiên học này.');
  const word = state.words.find(({ id }) => id === attempt.wordId);
  if (!word || word.language !== attempt.language) throw new Error('Thẻ đã thay đổi. Hãy mở lại phiên học.');
  if (attempt.taskType === 'synthesis' || attempt.isRetry || !attempt.quality ||
    (attempt.outcome !== 'correct' && attempt.outcome !== 'incorrect')) return state;

  const time = attempt.answeredAt;
  const xp = reviewXp(attempt.quality);
  const scheduled = attempt.scheduledAtStart && isScheduledReview(word, attempt.startedAt);
  const revised = applyStudyReview(word, attempt.quality, state.settings.srsMode, time, attempt.taskType, session.mode, scheduled);
  const previous = state.logs.find(({ id }) => id === session.id) ?? EMPTY_PROGRESS;
  const log = {
    id: session.id, timestamp: time, mode: session.mode, deckId: session.deckId,
    language: session.language, level: session.level,
    wordsReviewed: previous.wordsReviewed + 1, correctCount: previous.correctCount + Number(attempt.outcome === 'correct'),
    xpEarned: previous.xpEarned + xp, durationSeconds: Math.max(1, Math.round((time - session.startedAt) / 1000)),
  };
  return {
    ...state,
    words: revised === word ? state.words : state.words.map((entry) => entry.id === word.id ? revised : entry),
    profile: recordStudyActivity(state.profile, time, xp, word.id),
    logs: previous === EMPTY_PROGRESS ? [...state.logs, log] : state.logs.map((entry) => entry.id === session.id ? log : entry),
  };
}
