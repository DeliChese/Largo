import type { BloomLevel, ReviewQuality, SRSMode, StudyModeId, StudySessionMode, UserProfile, VocabWord } from '../types/vocab';
import { calculateNextSRS, isWordDue, localStudyDate, normalizeText } from './srsBloom';

export const DAILY_SESSION_SIZE = 12;
export const PRACTICE_SESSION_SIZE = 15;
const INTENSIVE_SESSION_SIZE = 8;
const REINFORCEMENT_GAP_MS = 4 * 60 * 60_000;
const REINFORCEMENT_WINDOW_MS = 3 * 24 * 60 * 60_000;
export type StudyFilter = 'due' | 'all' | 'bloom';

export const STUDY_MODE_LABELS: Record<StudySessionMode, string> = {
  guided: 'Kế hoạch hôm nay',
  intensive: 'Ôn tăng cường',
  flashcard: 'Thẻ ghi nhớ',
  quiz: 'Trắc nghiệm',
  dictation: 'Nghe & chép',
  cloze: 'Điền vào câu',
  collocation: 'Cụm từ',
  synthesis: 'Đặt câu',
  speed: 'Ôn nhanh',
};

function previousStudyDate(now: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  return localStudyDate(date.getTime());
}

export function getDailyProgress(profile: UserProfile, now: number) {
  const studiedToday = profile.lastStudyDate === localStudyDate(now);
  return {
    studied: studiedToday ? profile.todayWordsCount : 0,
    streak: studiedToday || profile.lastStudyDate === previousStudyDate(now) ? profile.streakDays : 0,
  };
}

export function recordStudyActivity(profile: UserProfile, now: number, xp: number, wordId?: string): UserProfile {
  const date = localStudyDate(now);
  const sameDay = profile.lastStudyDate === date;
  const wordIds = sameDay ? profile.todayWordIds ?? [] : [];
  const newWordToday = wordId !== undefined && !wordIds.includes(wordId);
  const streakDays = sameDay
    ? Math.max(1, profile.streakDays)
    : profile.lastStudyDate === previousStudyDate(now) ? profile.streakDays + 1 : 1;

  return {
    ...profile,
    xp: profile.xp + xp,
    lastStudyDate: date,
    todayWordsCount: (sameDay ? profile.todayWordsCount : 0) + Number(newWordToday),
    todayWordIds: newWordToday ? [...wordIds, wordId] : wordIds,
    streakDays,
    longestStreak: Math.max(profile.longestStreak, streakDays),
  };
}

function getDueWords(words: VocabWord[], now: number): VocabWord[] {
  return words.filter((word) => isWordDue(word, now))
    .sort((a, b) => a.srs.nextReviewAt - b.srs.nextReviewAt);
}

export function getDailyStudyPlan(words: VocabWord[], profile: UserProfile, newWordLimit: number, now: number, quotaWords = words) {
  const due = getDueWords(words, now);
  const reviews = due.slice(0, DAILY_SESSION_SIZE);
  const today = localStudyDate(now);
  const introducedToday = quotaWords.filter(({ srs }) =>
    srs.firstReviewedAt !== undefined && localStudyDate(srs.firstReviewedAt) === today,
  ).length;
  const unseen = words.filter(({ srs }) => srs.lastReviewedAt === null);
  const budget = Math.max(0, Math.min(
    newWordLimit - introducedToday,
    profile.dailyGoalWords - getDailyProgress(profile, now).studied - reviews.length,
    DAILY_SESSION_SIZE - reviews.length,
  ));
  const newWords = unseen
    .sort((a, b) => Number(b.language === profile.targetLanguage) - Number(a.language === profile.targetLanguage))
    .slice(0, budget);

  return {
    words: [...reviews, ...newWords],
    dueCount: due.length,
    reviewCount: reviews.length,
    newCount: newWords.length,
    unseenCount: unseen.length,
  };
}

function getReinforcementTime(word: VocabWord, now: number): number | null {
  const { lastReviewedAt, nextReviewAt, repetitions, lastIntensiveAt } = word.srs;
  if (lastReviewedAt === null || repetitions < 1 || repetitions > 2 ||
    (lastIntensiveAt !== undefined && lastIntensiveAt >= lastReviewedAt) ||
    now >= lastReviewedAt + REINFORCEMENT_WINDOW_MS) return null;
  const opensAt = lastReviewedAt + REINFORCEMENT_GAP_MS;
  return opensAt < nextReviewAt ? opensAt : null;
}

export function getIntensiveStudyPlan(words: VocabWord[], now: number) {
  const reviews = getDueWords(words, now).slice(0, INTENSIVE_SESSION_SIZE);
  const upcoming = words.filter(({ srs }) => srs.lastReviewedAt !== null && srs.nextReviewAt > now)
    .map((word) => ({ word, availableAt: getReinforcementTime(word, now) ?? word.srs.nextReviewAt }));
  const reinforcement = upcoming.filter(({ availableAt }) => availableAt <= now)
    .sort((a, b) => a.availableAt - b.availableAt)
    .slice(0, INTENSIVE_SESSION_SIZE - reviews.length)
    .map(({ word }) => word);
  const nextAvailableAt = upcoming.reduce<number | null>((next, { word, availableAt }) => {
    const candidate = availableAt > now ? availableAt : word.srs.nextReviewAt;
    return next === null ? candidate : Math.min(next, candidate);
  }, null);

  return {
    words: [...reviews, ...reinforcement],
    reviewCount: reviews.length,
    reinforcementCount: reinforcement.length,
    nextAvailableAt,
  };
}

export function isScheduledReview(word: VocabWord, now: number): boolean {
  return word.srs.lastReviewedAt === null || isWordDue(word, now);
}

export function applyStudyReview(
  word: VocabWord, quality: ReviewQuality, srsMode: SRSMode, now: number,
  exercise: StudyModeId, sessionMode?: StudySessionMode,
): VocabWord {
  if (exercise === 'synthesis') {
    if (quality < 3 || word.bloomLevel < 3 || word.bloomLevel === 6) return word;
    if (word.lastSynthesisAt !== undefined && localStudyDate(word.lastSynthesisAt) === localStudyDate(now)) return word;
    return { ...word, bloomLevel: (word.bloomLevel + 1) as BloomLevel, lastSynthesisAt: now };
  }
  if (!isScheduledReview(word, now)) {
    if (sessionMode !== 'intensive') return word;
    const opensAt = getReinforcementTime(word, now);
    return opensAt !== null && opensAt <= now
      ? { ...word, srs: { ...word.srs, lastIntensiveAt: now } }
      : word;
  }
  const { srs, bloomLevel } = calculateNextSRS(word, quality, srsMode, now, exercise);
  return { ...word, srs, bloomLevel };
}

export function stripTrailingPinyin(sentence: string): string {
  return sentence.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function matchExpression(expression: string, language: VocabWord['language']) {
  const term = expression.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  if (!term) return null;
  const pattern = language === 'zh' || language === 'ja'
    ? term
    : `(?<![\\p{L}\\p{N}])${term}(?![\\p{L}\\p{N}])`;
  return new RegExp(pattern, 'giu');
}

function findClozeExample(word: VocabWord, expression: string) {
  const matcher = matchExpression(expression, word.language);
  if (!matcher) return null;
  for (const example of word.examples) {
    const full = word.language === 'zh' ? stripTrailingPinyin(example.sentence) : example.sentence;
    const masked = full.replace(matcher, '＿＿＿');
    if (masked !== full) return { ...example, full, masked, answer: expression.trim() };
  }
  return null;
}

export function getClozeExample(word: VocabWord) {
  return findClozeExample(word, word.term);
}

export function getPhraseClozeExample(word: VocabWord) {
  const headword = matchExpression(word.term, word.language);
  if (!headword) return null;
  for (const { phrase, meaning } of word.collocations) {
    if (!meaning.trim() || normalizeText(phrase) === normalizeText(word.term) || !phrase.match(headword)) continue;
    const example = findClozeExample(word, phrase);
    if (example) return { ...example, meaning };
  }
  if (/\s/u.test(word.term.trim())) {
    const example = getClozeExample(word);
    if (example) return { ...example, meaning: word.meaning };
  }
  return null;
}

function getPrimaryPhrase(word: VocabWord) {
  return word.collocations.find(({ phrase, meaning }) => phrase.trim() && meaning.trim());
}

function getChoiceCandidates(word: VocabWord, library: VocabWord[], forPhrase: boolean) {
  const phrase = forPhrase ? getPrimaryPhrase(word) : undefined;
  const label = forPhrase ? phrase?.phrase : word.meaning;
  if (!label?.trim()) return [];

  const candidates = [{ id: word.id, label }];
  const labels = new Set([normalizeText(label)]);
  for (const other of library) {
    if (other.id === word.id || other.language !== word.language || other.term === word.term) continue;
    const otherPhrase = forPhrase ? getPrimaryPhrase(other) : undefined;
    if (phrase && otherPhrase && normalizeText(phrase.meaning) === normalizeText(otherPhrase.meaning)) continue;
    const otherLabel = forPhrase ? otherPhrase?.phrase : other.meaning;
    const normalized = normalizeText(otherLabel ?? '');
    if (!otherLabel || !normalized || labels.has(normalized)) continue;
    labels.add(normalized);
    candidates.push({ id: other.id, label: otherLabel });
  }
  return candidates;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function getStudyChoices(word: VocabWord, library: VocabWord[], forPhrase: boolean) {
  const [answer, ...distractors] = getChoiceCandidates(word, library, forPhrase);
  return answer ? shuffle([answer, ...shuffle(distractors).slice(0, 3)]) : [];
}

export function getCollocationPrompt(word: VocabWord): string | undefined {
  return getPrimaryPhrase(word)?.meaning;
}

export function getPracticeWords(library: VocabWord[], deckId: string, filter: StudyFilter, bloom: BloomLevel, mode: StudyModeId, now: number): VocabWord[] {
  const priority = (word: VocabWord) => isWordDue(word, now) ? 0 : word.srs.lastReviewedAt === null ? 1 : 2;
  return library.filter((word) => {
    if (deckId !== 'all' && word.deckId !== deckId) return false;
    if (filter === 'due' && !isWordDue(word, now)) return false;
    if (filter === 'bloom' && word.bloomLevel !== bloom) return false;
    if (mode === 'cloze') return getClozeExample(word) !== null;
    if (mode === 'quiz' || mode === 'speed' || mode === 'collocation') {
      return getChoiceCandidates(word, library, mode === 'collocation').length >= 2;
    }
    return true;
  }).sort((a, b) => priority(a) - priority(b) || a.srs.nextReviewAt - b.srs.nextReviewAt);
}

export function getStudyExercise(word: VocabWord, mode: StudySessionMode, retry: boolean): { mode: StudyModeId; reverse: boolean; phrase?: boolean } {
  if (retry) return { mode: 'flashcard', reverse: mode === 'cloze' || mode === 'dictation' };
  if (mode === 'intensive') {
    if (word.srs.repetitions > 0 && getPhraseClozeExample(word)) {
      return { mode: 'cloze', reverse: false, phrase: true };
    }
    return { mode: 'flashcard', reverse: word.srs.repetitions > 0 };
  }
  if (mode !== 'guided') return { mode, reverse: false };
  if (word.srs.repetitions < 2) return { mode: 'flashcard', reverse: false };
  const phase = (word.srs.repetitions - 2) % 3;
  if (phase === 1 && getClozeExample(word)) return { mode: 'cloze', reverse: false };
  return { mode: 'flashcard', reverse: phase !== 2 };
}
