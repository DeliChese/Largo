import { PROMPT_VERSION, RUBRIC_VERSION, type EvidenceSkill, type LearningAttemptEvent } from './learningAttempt';
import type { VocabWord } from '../types/vocab';
import { BLOOM_META } from './srsBloom';

type VerifiedLevel = 1 | 2 | 3;
type SkillEvidence = {
  correct: number;
  incorrect: number;
  recentFailures: number;
  lastAttempt: LearningAttemptEvent;
};

export interface WordMastery {
  verifiedBloomLevel: VerifiedLevel | null;
  rubricVersion: number;
  skills: Partial<Record<EvidenceSkill, SkillEvidence>>;
}

const DAY_MS = 86_400_000;

function eligible(event: LearningAttemptEvent): boolean {
  if (event.schemaVersion !== 1 || event.rubricVersion !== RUBRIC_VERSION || event.promptVersion !== PROMPT_VERSION ||
      event.assessmentSource !== 'local' || event.source === 'game' || event.isRetry || event.hintCount !== 0 ||
      event.revealedAnswer || (event.outcome !== 'correct' && event.outcome !== 'incorrect')) return false;
  switch (event.taskType) {
    case 'quiz':
    case 'speed':
      return event.skill === 'recognition';
    case 'dictation':
      return event.skill === 'listening';
    case 'collocation':
      return event.skill === 'collocation';
    case 'cloze':
      return event.skill === 'context' || event.skill === 'collocation';
    default:
      return false;
  }
}

function separatedByDay(events: readonly LearningAttemptEvent[]): boolean {
  return events.length >= 2 && events.at(-1)!.answeredAt - events[0].answeredAt >= DAY_MS;
}

function hasContextPair(events: readonly LearningAttemptEvent[]): boolean {
  const first = events[0];
  if (!first) return false;
  let differentContext = false;
  let differentSession = false;
  for (const other of events.slice(1)) {
    differentContext ||= other.contextId !== first.contextId;
    differentSession ||= other.sessionId !== first.sessionId;
    if (differentContext && differentSession) return true;
  }
  return false;
}

export function buildMasteryProjection(events: readonly LearningAttemptEvent[]): Map<string, WordMastery> {
  const seen = new Set<string>();
  const positions = new Set<string>();
  const byWord = new Map<string, LearningAttemptEvent[]>();
  const ordered = events.filter(eligible).sort((a, b) => a.answeredAt - b.answeredAt || a.eventId.localeCompare(b.eventId));
  for (const event of ordered) {
    const position = JSON.stringify([event.sessionId, event.attemptIndex]);
    if (seen.has(event.eventId) || positions.has(position)) continue;
    seen.add(event.eventId);
    positions.add(position);
    const word = byWord.get(event.wordId);
    if (word) word.push(event);
    else byWord.set(event.wordId, [event]);
  }

  const projection = new Map<string, WordMastery>();
  for (const [wordId, history] of byWord) {
    const skills: WordMastery['skills'] = {};
    for (const event of history) {
      const old = skills[event.skill];
      const passed = event.outcome === 'correct';
      skills[event.skill] = {
        correct: (old?.correct ?? 0) + Number(passed),
        incorrect: (old?.incorrect ?? 0) + Number(!passed),
        recentFailures: passed ? 0 : (old?.recentFailures ?? 0) + 1,
        lastAttempt: event,
      };
    }
    const correct = history.filter(({ outcome }) => outcome === 'correct');
    // Contextual recall also demonstrates the lower-level recognition and understanding of that use.
    const inContext = correct.filter(({ taskType }) => taskType === 'cloze' || taskType === 'collocation');
    let verifiedBloomLevel: VerifiedLevel | null = null;
    if (separatedByDay(correct)) verifiedBloomLevel = 1;
    if (verifiedBloomLevel && separatedByDay(inContext)) verifiedBloomLevel = 2;
    if (verifiedBloomLevel === 2 && hasContextPair(inContext.filter(({ taskType, quality }) => taskType === 'cloze' && quality === 3))) {
      verifiedBloomLevel = 3;
    }
    projection.set(wordId, { verifiedBloomLevel, rubricVersion: RUBRIC_VERSION, skills });
  }
  return projection;
}

export function describeMastery(mastery?: WordMastery): string {
  const level = mastery?.verifiedBloomLevel;
  return level ? `Đã xác minh tầng ${level} · ${BLOOM_META[level].nameVi}` : 'Chưa xác minh';
}

export function getMistakeReview(words: readonly VocabWord[], projection: ReadonlyMap<string, WordMastery>) {
  return words.flatMap((word) => {
    const mistakes = Object.values(projection.get(word.id)?.skills ?? {}).filter(({ recentFailures }) => recentFailures > 0)
      .sort((a, b) => b.lastAttempt.answeredAt - a.lastAttempt.answeredAt);
    const latest = mistakes[0];
    return latest ? [{ word, taskType: latest.lastAttempt.taskType, recentFailures: latest.recentFailures, at: latest.lastAttempt.answeredAt }] : [];
  }).sort((a, b) => b.at - a.at || a.word.id.localeCompare(b.word.id));
}
