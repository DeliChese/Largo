import type { LanguageCode, StudyModeId, UserProfile, VocabWord } from '../types/vocab';
import type { EvidenceSkill, LearningAttemptEvent } from './learningAttempt';
import type { WordMastery } from './mastery';
import { isWordDue } from './srsBloom';
import { getClozeExample, getDailyStudyPlan, getPhraseClozeExample, getStudyExercise, hasStudyChoices } from './studyPlan';

export const ADAPTIVE_PLANNER_VERSION = 1;
const DAY_MS = 86_400_000;

type DueKind = 'overdue' | 'due' | 'new';
type ReasonCode = 'new_word' | 'scheduled_review' | 'weak_listening' | 'weak_context' | 'weak_collocation'
  | 'weak_recognition' | 'active_recall' | 'vary_practice';

type Exercise = {
  taskType: StudyModeId;
  reverse: boolean;
  phrase?: boolean;
  evidenceTarget: EvidenceSkill;
  reasonCode: ReasonCode;
};

export interface PlanItem extends Exercise {
  wordId: string;
  dueKind: DueKind;
}

export interface AdaptivePlannerInput {
  /** Canonical cards in the selected scope, in curriculum order and with the selected locale applied. */
  words: VocabWord[];
  quotaWords?: VocabWord[];
  profile: UserProfile;
  newWordLimit: number;
  now: number;
  masteryById: ReadonlyMap<string, WordMastery>;
  recentEvents: readonly LearningAttemptEvent[];
  audioLanguages: ReadonlySet<LanguageCode>;
}

export interface AdaptiveStudyPlan extends ReturnType<typeof getDailyStudyPlan> {
  plannerVersion: number;
  generatedAt: number;
  strategy: 'adaptive' | 'legacy';
  items: PlanItem[];
}

const skillOrder = ['listening', 'context', 'collocation', 'recognition'] as const;
type PlannedSkill = typeof skillOrder[number];

function weakSkills(mastery: WordMastery | undefined, now: number) {
  return skillOrder.flatMap((skill) => {
    const learner = mastery?.skills[skill];
    if (!learner?.recentFailures || learner.lastAttempt.answeredAt > now) return [];
    const score = 20 * (learner.incorrect + 1) / (learner.correct + learner.incorrect + 2);
    return [{ skill, score }];
  }).sort((a, b) => b.score - a.score);
}

function legacyExercise(word: VocabWord): Exercise {
  const { mode, reverse, phrase } = getStudyExercise(word, 'guided', false);
  const reasonCode = word.srs.lastReviewedAt === null ? 'new_word' : 'scheduled_review';
  const evidenceTarget = mode === 'cloze' ? 'context' : 'recognition';
  return { taskType: mode, reverse, ...(phrase ? { phrase } : {}), reasonCode, evidenceTarget };
}

function reviewExercises(
  word: VocabWord, library: VocabWord[], mastery: WordMastery | undefined,
  weaknesses: readonly { skill: PlannedSkill }[], audio: boolean,
): Exercise[] {
  const baseline = legacyExercise(word);
  const options: Exercise[] = [];
  const add = (taskType: StudyModeId, evidenceTarget: EvidenceSkill, reasonCode: ReasonCode, phrase = false) => {
    if (!options.some((option) => option.taskType === taskType && Boolean(option.phrase) === phrase)) {
      options.push({ taskType, evidenceTarget, reasonCode, reverse: false, ...(phrase ? { phrase } : {}) });
    }
  };
  const cloze = !!getClozeExample(word);
  const quiz = hasStudyChoices(word, library, false);
  if (word.srs.lastReviewedAt !== null) {
    for (const { skill } of weaknesses) {
      if (skill === 'listening' && audio) add('dictation', 'listening', 'weak_listening');
      if (skill === 'context' && cloze) add('cloze', 'context', 'weak_context');
      if (skill === 'collocation' && getPhraseClozeExample(word)) add('cloze', 'collocation', 'weak_collocation', true);
      if (skill === 'recognition' && quiz) add('quiz', 'recognition', 'weak_recognition');
    }
    if (mastery?.verifiedBloomLevel || mastery?.skills.recognition?.correct) {
      if (cloze && !mastery.skills.context?.correct) add('cloze', 'context', 'active_recall');
      if (audio && !mastery.skills.listening?.correct) add('dictation', 'listening', 'active_recall');
    }
  }
  if (!options.some(({ taskType, phrase }) => taskType === baseline.taskType && phrase === baseline.phrase)) {
    options.push(baseline);
  }
  if (quiz) add('quiz', 'recognition', 'vary_practice');
  if (word.srs.lastReviewedAt !== null && cloze) add('cloze', 'context', 'vary_practice');
  add('flashcard', 'recognition', 'vary_practice');
  return options;
}

function makePlanItem(word: VocabWord, exercise: Exercise, now: number): PlanItem {
  const dueKind = word.srs.lastReviewedAt === null ? 'new' : now - word.srs.nextReviewAt >= DAY_MS ? 'overdue' : 'due';
  return { ...exercise, wordId: word.id, dueKind };
}

function compareId(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function planAdaptiveSession(input: AdaptivePlannerInput): AdaptiveStudyPlan {
  const { now, profile, newWordLimit, masteryById, recentEvents, audioLanguages } = input;
  const byId = new Map<string, VocabWord>();
  for (const word of input.words) if (!byId.has(word.id)) byId.set(word.id, word);
  const words = [...byId.values()];
  const baseline = getDailyStudyPlan(words, profile, newWordLimit, now, input.quotaWords ?? words);
  const meta = { plannerVersion: ADAPTIVE_PLANNER_VERSION, generatedAt: now };
  const due = words.filter((word) => isWordDue(word, now));
  const hasEvidence = due.some(({ id }) =>
    Object.values(masteryById.get(id)?.skills ?? {}).some(({ lastAttempt }) => lastAttempt.answeredAt <= now));
  if (!hasEvidence) {
    return { ...baseline, ...meta, strategy: 'legacy',
      items: baseline.words.map((word) => makePlanItem(word, legacyExercise(word), now)) };
  }

  const recentByWord = new Map<string, number>();
  for (const event of recentEvents) {
    if (!byId.has(event.wordId) || event.isRetry || event.source === 'game' || event.answeredAt > now || event.answeredAt <= now - DAY_MS) continue;
    recentByWord.set(event.wordId, Math.max(recentByWord.get(event.wordId) ?? 0, event.answeredAt));
  }
  const weaknesses = new Map(due.map(({ id }) => [id, weakSkills(masteryById.get(id), now)]));
  const age = (word: VocabWord) => Math.floor((now - word.srs.nextReviewAt) / DAY_MS);
  const scored = due.map((word) => {
    const recent = recentByWord.get(word.id);
    const score = Math.min(15, word.srs.lapses * 3) + (weaknesses.get(word.id)?.[0]?.score ?? 0)
      - (recent === undefined ? 0 : 20 * (1 - (now - recent) / DAY_MS));
    return { word, day: age(word), score };
  });
  const oldestFirst = [...due].sort((a, b) => a.srs.nextReviewAt - b.srs.nextReviewAt || compareId(a.id, b.id));
  const ranked = scored.sort((a, b) => b.day - a.day || b.score - a.score || compareId(a.word.id, b.word.id));
  const priority = ranked.map(({ word }) => word);
  const reviews: VocabWord[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < baseline.reviewCount; index += 1) {
    // Reserve the oldest card at the start and every fourth slot to bound waiting time.
    const pool = index % 4 === 0 ? oldestFirst : priority;
    const word = pool.find(({ id }) => !seen.has(id))!;
    seen.add(word.id);
    reviews.push(word);
  }

  const plannedWords = [...reviews, ...baseline.words.slice(baseline.reviewCount)];
  const items: PlanItem[] = [];
  for (const word of plannedWords) {
    const options = reviewExercises(word, words, masteryById.get(word.id), weaknesses.get(word.id) ?? [],
      audioLanguages.has(word.language));
    const preferred = options[0];
    const last = items.at(-1)?.taskType;
    const sameRun = last !== undefined && items.at(-2)?.taskType === last;
    const different = sameRun ? options.find(({ taskType }) => taskType !== last) : undefined;
    items.push(makePlanItem(word, different ?? preferred, now));
  }
  return { ...baseline, ...meta, strategy: 'adaptive', words: plannedWords, items };
}

export function explainPlanItem({ reasonCode, dueKind }: PlanItem): string {
  switch (reasonCode) {
    case 'new_word': return 'Từ mới theo thứ tự học trong bộ.';
    case 'weak_listening': return 'Củng cố kỹ năng nghe theo kết quả luyện gần đây.';
    case 'weak_context': return 'Luyện dùng từ trong câu sau lần trả lời sai.';
    case 'weak_collocation': return 'Luyện lại cụm từ trong một câu có đáp án.';
    case 'weak_recognition': return 'Luyện nhận diện nghĩa sau lần trả lời sai.';
    case 'active_recall': return 'Luyện chủ động nhớ lại từ bạn đã nhận diện.';
    case 'vary_practice': return 'Đổi dạng bài để xen kẽ cách ôn.';
    case 'scheduled_review': return dueKind === 'overdue' ? 'Từ đã quá hạn ôn.' : 'Từ đã đến lịch ôn.';
  }
}
