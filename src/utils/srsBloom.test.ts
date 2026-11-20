import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextSRS,
  calculateRetentionProbability,
  computeBloomDistribution,
  computeForecastDays,
  evaluateAnswerMatch,
  evaluateSynthesisSentence,
  generateSmartReminders,
} from './srsBloom';
import type { StudySessionLog, UserProfile, VocabWord } from '../types/vocab';

const NOW = 1_750_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

function makeWord(overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id: 'w1',
    deckId: 'd1',
    term: 'resilient',
    phonetic: '/rɪˈzɪl.i.ənt/',
    partOfSpeech: 'adj',
    meaning: 'kiên cường, nhanh phục hồi',
    language: 'en',
    collocations: [
      { phrase: 'highly resilient', meaning: 'cực kỳ kiên cường' },
      { phrase: 'resilient economy', meaning: 'nền kinh tế vững vàng' },
    ],
    examples: [
      {
        sentence: 'Local communities proved remarkably resilient after the storm.',
        translation: 'Cộng đồng địa phương cho thấy sự kiên cường đáng kinh ngạc sau cơn bão.',
      },
    ],
    synonyms: ['adaptable', 'tough'],
    bloomLevel: 2,
    srs: {
      easeFactor: 2.5,
      intervalDays: 2,
      repetitions: 1,
      lapses: 0,
      nextReviewAt: NOW - 1000,
      lastReviewedAt: NOW - 2 * DAY_MS,
    },
    createdAt: NOW - 10 * DAY_MS,
    ...overrides,
  };
}

const SAMPLE_PROFILE: UserProfile = {
  name: 'Minh Anh',
  title: 'Người học ngoại ngữ',
  bio: '',
  nativeLanguage: 'vi',
  targetLanguage: 'en',
  xp: 240,
  streakDays: 5,
  longestStreak: 12,
  lastStudyDate: '2026-11-18',
  dailyGoalWords: 20,
  todayWordsCount: 6,
  bestMatchScore: 0,
  bestWordFallScore: 0,
  bestScrambleScore: 0,
  bestAudioBlitzScore: 0,
};

test('calculateNextSRS advances interval and Bloom level on Good/Easy review', () => {
  const word = makeWord({ bloomLevel: 2 });
  const resStandard = calculateNextSRS(word, 4, 'standard', NOW);
  assert.equal(resStandard.srs.repetitions, 2);
  assert.ok(resStandard.srs.intervalDays >= 4);
  assert.equal(resStandard.bloomLevel, 3);
  assert.ok(resStandard.srs.nextReviewAt > NOW);
});

test('calculateNextSRS cram mode produces shorter intervals than relaxed mode', () => {
  const word = makeWord({
    srs: {
      easeFactor: 2.5,
      intervalDays: 4,
      repetitions: 3,
      lapses: 0,
      nextReviewAt: NOW,
      lastReviewedAt: NOW - 4 * DAY_MS,
    },
  });
  const cram = calculateNextSRS(word, 3, 'cram', NOW);
  const relaxed = calculateNextSRS(word, 3, 'relaxed', NOW);
  assert.ok(cram.srs.intervalDays < relaxed.srs.intervalDays);
});

test('calculateNextSRS resets repetitions and decrements Bloom on lapse (quality=1)', () => {
  const word = makeWord({ bloomLevel: 4 });
  const res = calculateNextSRS(word, 1, 'standard', NOW);
  assert.equal(res.srs.repetitions, 0);
  assert.equal(res.srs.lapses, 1);
  assert.equal(res.bloomLevel, 3);
  assert.ok(res.srs.intervalDays <= 1);
});

test('calculateRetentionProbability decays over time since last review', () => {
  const recent = makeWord({
    srs: {
      easeFactor: 2.5,
      intervalDays: 5,
      repetitions: 2,
      lapses: 0,
      nextReviewAt: NOW + 4 * DAY_MS,
      lastReviewedAt: NOW - 1 * DAY_MS,
    },
  });
  const stale = makeWord({
    srs: {
      easeFactor: 2.5,
      intervalDays: 5,
      repetitions: 2,
      lapses: 0,
      nextReviewAt: NOW - 5 * DAY_MS,
      lastReviewedAt: NOW - 10 * DAY_MS,
    },
  });
  assert.ok(calculateRetentionProbability(recent, NOW) > calculateRetentionProbability(stale, NOW));
});

test('generateSmartReminders prioritizes urgent forgetting and due queue', () => {
  const words = [
    makeWord({
      id: 'w-stale',
      srs: {
        easeFactor: 2.2,
        intervalDays: 2,
        repetitions: 2,
        lapses: 1,
        nextReviewAt: NOW - 3 * DAY_MS,
        lastReviewedAt: NOW - 8 * DAY_MS,
      },
    }),
    makeWord({ id: 'w-due', bloomLevel: 1 }),
  ];
  const logs: StudySessionLog[] = [];
  const reminders = generateSmartReminders(words, SAMPLE_PROFILE, logs, 0.75, NOW);
  assert.ok(reminders.some((r) => r.type === 'urgent_forgetting'));
  assert.ok(reminders.some((r) => r.type === 'due_queue'));
  assert.ok(reminders.some((r) => r.type === 'streak_protection'));
});

test('computeBloomDistribution and computeForecastDays aggregate counts accurately', () => {
  const words = [
    makeWord({ id: '1', bloomLevel: 1 }),
    makeWord({ id: '2', bloomLevel: 1 }),
    makeWord({ id: '3', bloomLevel: 5 }),
  ];
  const dist = computeBloomDistribution(words);
  assert.equal(dist[0].count, 2);
  assert.equal(dist[4].count, 1);

  const forecast = computeForecastDays(words, 5, NOW);
  assert.equal(forecast.length, 5);
  assert.equal(forecast[0].isToday, true);
  assert.equal(forecast[0].count, 3);
});

test('evaluateAnswerMatch and evaluateSynthesisSentence validate user input', () => {
  assert.equal(evaluateAnswerMatch('  Resilient! ', 'resilient'), true);
  assert.equal(evaluateAnswerMatch('resilience', 'resilient'), false);

  const word = makeWord();
  const shortRes = evaluateSynthesisSentence('Very resilient.', word);
  assert.equal(shortRes.passed, false);

  const goodRes = evaluateSynthesisSentence(
    'Building a resilient economy requires long term investment in education.',
    word,
  );
  assert.equal(goodRes.passed, true);
  assert.equal(goodRes.hasCollocation, true);
});

test('evaluateSynthesisSentence evaluates Chinese unspaced sentences and collocations', () => {
  const zhWord = makeWord({
    id: 'zh-1',
    language: 'zh',
    term: '提高',
    phonetic: 'tígāo',
    meaning: 'nâng cao',
    collocations: [{ phrase: '提高水平', meaning: 'nâng cao trình độ' }],
  });

  const tooShort = evaluateSynthesisSentence('提高。', zhWord);
  assert.equal(tooShort.passed, false);

  const missingTerm = evaluateSynthesisSentence('我每天努力学习汉语。', zhWord);
  assert.equal(missingTerm.passed, false);
  assert.equal(missingTerm.hasTargetWord, false);

  const passedWithCol = evaluateSynthesisSentence('我们要努力提高水平。', zhWord);
  assert.equal(passedWithCol.passed, true);
  assert.equal(passedWithCol.hasTargetWord, true);
  assert.equal(passedWithCol.hasCollocation, true);
});
