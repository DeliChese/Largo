import type { HskEdition, LanguageCode, ReviewQuality, StudyModeId } from '../types/vocab';

export const PROMPT_VERSION = 1;
export const RUBRIC_VERSION = 1;
const MAX_RESPONSE_MS = 30 * 60_000;

export type EvidenceSkill = 'recognition' | 'listening' | 'context' | 'collocation' | 'production';
type Criterion = 'pass' | 'fail' | 'uncertain' | 'not_applicable';
export type AssessmentCriteria = Partial<Record<'meaning' | 'grammar' | 'targetUsage' | 'naturalness' | 'reasoning', Criterion>>;

export interface AdaptivePlanTrace {
  version: number;
  plannedItems: number;
  weakSkill: boolean;
}

export interface AttemptInput {
  eventId: string;
  sessionId: string;
  attemptIndex: number;
  wordId: string;
  language: LanguageCode;
  hskEdition?: HskEdition;
  taskType: StudyModeId;
  source: 'guided' | 'manual' | 'intensive' | 'game';
  startedAt: number;
  answeredAt: number;
  isRetry: boolean;
  scheduledAtStart: boolean;
  hintCount: number;
  revealedAnswer: boolean;
  outcome: 'correct' | 'incorrect' | 'partial' | 'uncertain' | 'unavailable';
  assessmentSource: 'local' | 'ai' | 'human' | 'self';
  quality?: ReviewQuality;
  skill: EvidenceSkill;
  contextId: string;
  criteria?: AssessmentCriteria;
  adaptivePlan?: AdaptivePlanTrace;
}

export interface LearningAttemptEvent extends AttemptInput {
  schemaVersion: 1;
  createdAt: number;
  responseMs: number;
  promptVersion: number;
  rubricVersion: number;
}

export function createLearningAttempt(input: AttemptInput): LearningAttemptEvent {
  return {
    ...input,
    schemaVersion: 1,
    createdAt: input.answeredAt,
    promptVersion: PROMPT_VERSION,
    rubricVersion: RUBRIC_VERSION,
    responseMs: Math.min(MAX_RESPONSE_MS, input.answeredAt - input.startedAt),
  };
}

const tasks = ['flashcard', 'quiz', 'dictation', 'cloze', 'collocation', 'synthesis', 'speed'] as const;
const skills = ['recognition', 'listening', 'context', 'collocation', 'production'] as const;
const criteriaKeys = ['meaning', 'grammar', 'targetUsage', 'naturalness', 'reasoning'] as const;
const criteriaValues = ['pass', 'fail', 'uncertain', 'not_applicable'] as const;
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function includes<T>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}

function decodeAdaptivePlan(value: unknown): AdaptivePlanTrace | null {
  if (!isObject(value)) return null;
  const { version, plannedItems, weakSkill } = value;
  if (!count(version) || version < 1 || !count(plannedItems) || plannedItems < 1 || plannedItems > 100 ||
    typeof weakSkill !== 'boolean') return null;
  return { version, plannedItems, weakSkill };
}

export function decodeLearningAttempt(raw: unknown): LearningAttemptEvent | null {
  if (!isObject(raw)) return null;
  const {
    eventId, sessionId, attemptIndex, wordId, language, hskEdition, taskType, source, startedAt, answeredAt,
    isRetry, scheduledAtStart, hintCount, revealedAnswer, outcome, assessmentSource, quality, skill, contextId,
    schemaVersion, createdAt, responseMs, promptVersion, rubricVersion,
  } = raw;
  if (schemaVersion !== 1 || !id(eventId) || !id(sessionId) || !id(wordId) || !id(contextId) ||
      !count(attemptIndex) || !count(startedAt) || !count(answeredAt) || answeredAt < startedAt ||
      !count(createdAt) || createdAt < answeredAt || responseMs !== Math.min(MAX_RESPONSE_MS, answeredAt - startedAt) ||
      !count(promptVersion) || !promptVersion || !count(rubricVersion) || !rubricVersion ||
      !count(hintCount) || typeof isRetry !== 'boolean' || typeof scheduledAtStart !== 'boolean' ||
      typeof revealedAnswer !== 'boolean' || !includes(tasks, taskType) || !includes(skills, skill) ||
      !includes(['zh', 'en', 'ja', 'fr', 'ko', 'es'] as const, language) ||
      (hskEdition !== undefined && !includes(['hsk20', 'hsk30'] as const, hskEdition)) ||
      !includes(['guided', 'manual', 'intensive', 'game'] as const, source) ||
      !includes(['correct', 'incorrect', 'partial', 'uncertain', 'unavailable'] as const, outcome) ||
      !includes(['local', 'ai', 'human', 'self'] as const, assessmentSource) ||
      (quality !== undefined && !includes([1, 2, 3, 4] as const, quality))) return null;
  let criteria: AssessmentCriteria | undefined;
  if (raw.criteria !== undefined) {
    if (!isObject(raw.criteria)) return null;
    criteria = {};
    for (const key of criteriaKeys) {
      const value = raw.criteria[key];
      if (value === undefined) continue;
      if (!includes(criteriaValues, value)) return null;
      criteria[key] = value;
    }
  }
  const adaptivePlan = decodeAdaptivePlan(raw.adaptivePlan);
  if (raw.adaptivePlan !== undefined && (!adaptivePlan || source !== 'guided')) return null;
  return {
    eventId, sessionId, attemptIndex, wordId, language, ...(hskEdition ? { hskEdition } : {}), taskType, source,
    startedAt, answeredAt, isRetry, scheduledAtStart, hintCount, revealedAnswer, outcome, assessmentSource,
    ...(quality ? { quality } : {}), skill, contextId, ...(criteria ? { criteria } : {}),
    ...(adaptivePlan ? { adaptivePlan } : {}),
    schemaVersion, createdAt, responseMs: Number(responseMs), promptVersion, rubricVersion,
  };
}
