import { ADAPTIVE_PLANNER_VERSION, type AdaptiveStudyPlan } from './adaptivePlanner';
import type { LearningAttemptEvent } from './learningAttempt';
import type { getDailyStudyPlan } from './studyPlan';

export function compareAdaptivePlans(adaptive: AdaptiveStudyPlan, legacy: ReturnType<typeof getDailyStudyPlan>) {
  const legacyReviewIds = new Set(legacy.words.slice(0, legacy.reviewCount).map(({ id }) => id));
  const selectedIds = new Set(adaptive.items.slice(0, adaptive.reviewCount).map(({ wordId }) => wordId));
  const oldestDueAt = legacy.words[0]?.srs.nextReviewAt;
  return {
    adaptiveReviews: adaptive.reviewCount,
    legacyReviews: legacy.reviewCount,
    adaptiveNew: adaptive.newCount,
    legacyNew: legacy.newCount,
    commonReviews: [...selectedIds].filter((id) => legacyReviewIds.has(id)).length,
    includesOldest: !legacy.reviewCount || adaptive.words.slice(0, adaptive.reviewCount)
      .some(({ srs }) => srs.nextReviewAt === oldestDueAt),
    weakSkillExercises: adaptive.items.filter(({ reasonCode }) => reasonCode.startsWith('weak_')).length,
  };
}

export function summarizeAdaptiveStudy(events: readonly LearningAttemptEvent[]) {
  const counters = {
    sessionsWithAnswers: 0, sessionsCompleted: 0, answers: 0, weakSkillAnswers: 0,
    hintedAnswers: 0, incorrectAnswers: 0, retryAnswers: 0, followUpCorrect: 0, followUpObserved: 0,
  };
  const sessions = new Map<string, { plannedItems: number; answered: Set<string> }>();
  const pendingFollowUp = new Map<string, LearningAttemptEvent>();
  const seen = new Set<string>();
  const ordered = [...events].sort((a, b) => a.answeredAt - b.answeredAt || a.attemptIndex - b.attemptIndex);

  for (const event of ordered) {
    if (seen.has(event.eventId)) continue;
    seen.add(event.eventId);
    const { adaptivePlan } = event;
    if (event.isRetry) {
      if (adaptivePlan?.version === ADAPTIVE_PLANNER_VERSION) counters.retryAnswers += 1;
      continue;
    }
    const previous = pendingFollowUp.get(event.wordId);
    const objective = event.source !== 'game' && event.assessmentSource === 'local' &&
      (event.outcome === 'correct' || event.outcome === 'incorrect');
    if (previous && previous.sessionId !== event.sessionId && event.startedAt >= previous.answeredAt &&
      event.scheduledAtStart && objective && !event.hintCount && !event.revealedAnswer) {
      counters.followUpObserved += 1;
      counters.followUpCorrect += Number(event.outcome === 'correct');
      pendingFollowUp.delete(event.wordId);
    }

    if (adaptivePlan?.version !== ADAPTIVE_PLANNER_VERSION) continue;
    const session = sessions.get(event.sessionId) ?? { plannedItems: adaptivePlan.plannedItems, answered: new Set<string>() };
    if (session.answered.has(event.wordId)) continue;
    session.answered.add(event.wordId);
    sessions.set(event.sessionId, session);
    counters.answers += 1;
    counters.weakSkillAnswers += Number(adaptivePlan.weakSkill);
    counters.hintedAnswers += Number(event.hintCount > 0);
    counters.incorrectAnswers += Number(event.outcome === 'incorrect');
    pendingFollowUp.set(event.wordId, event);
  }
  counters.sessionsWithAnswers = sessions.size;
  counters.sessionsCompleted = [...sessions.values()].filter(({ answered, plannedItems }) => answered.size >= plannedItems).length;
  return counters;
}
