import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextSRS,
  calculateRetentionProbability,
  computeBloomDistribution,
  computeForecastDays,
  evaluateAnswerMatch,
  evaluateSynthesisSentence,
  formatIntervalVi,
  generateSmartReminders,
  isWordDue,
  localStudyDate,
} from './srsBloom';
import {
  applyStudyReview, getClozeExample, getDailyProgress, getDailyStudyPlan, getIntensiveStudyPlan, getPhraseClozeExample,
  getPracticeWords, getStudyChoices, shuffle, getStudyExercise, recordStudyActivity,
} from './studyPlan';
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
    antonyms: [],
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

test('calculateNextSRS advances the interval on Good/Easy review', () => {
  const word = makeWord({ bloomLevel: 2 });
  const resStandard = calculateNextSRS(word, 4, 'standard', NOW);
  assert.equal(resStandard.repetitions, 2);
  assert.ok(resStandard.intervalDays >= 4);
  assert.ok(resStandard.nextReviewAt > NOW);
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
  assert.ok(cram.intervalDays < relaxed.intervalDays);
});

test('Fisher–Yates generates every permutation of three items and preserves the source', () => {
  const source = ['a', 'b', 'c'];
  const orders = new Set<string>();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const draws = [i / 3, j / 2];
      orders.add(shuffle(source, () => draws.shift()!).join(''));
    }
  }
  assert.equal(orders.size, 6);
  assert.deepEqual(source, ['a', 'b', 'c']);
});

test('late successful reviews credit elapsed time and disperse cards reproducibly', () => {
  const card = makeWord();
  for (const repetitions of [0, 1, 4]) {
    const onTime = { ...card, srs: { ...card.srs, repetitions, nextReviewAt: NOW } };
    const late = NOW + 20 * DAY_MS;
    for (const quality of [2, 3, 4] as const) {
      assert.ok(calculateNextSRS(onTime, quality, 'standard', late).intervalDays >
        calculateNextSRS(onTime, quality, 'standard', NOW).intervalDays);
    }
    const intervals = Array.from({ length: 64 }, (_, i) =>
      calculateNextSRS({ ...onTime, id: String(i) }, 3, 'standard', late).intervalDays);
    assert.ok(new Set(intervals.map(Math.floor)).size > 1);
    assert.equal(intervals[0], calculateNextSRS({ ...onTime, id: '0' }, 3, 'standard', late).intervalDays);
    assert.equal(calculateNextSRS(onTime, 1, 'standard', late).intervalDays,
      calculateNextSRS(onTime, 1, 'standard', NOW).intervalDays);
  }
});

test('synthesis matches whole words and inflected phrase heads', () => {
  const has = (term: string, sentence: string) =>
    evaluateSynthesisSentence(sentence, makeWord({ term, partOfSpeech: 'verb' })).hasTargetWord;
  assert.equal(has('go', 'It was good to see you.'), false);
  assert.equal(has('run out of', 'We ran out of milk yesterday.'), true);
  assert.equal(has('run out of', 'We ran out yesterday.'), false);
  assert.equal(has('try', 'She tried a new recipe yesterday.'), true);
  assert.equal(has('go', 'They went, then came back.'), true);
});

test('calculateNextSRS resets repetitions on lapse (quality=1)', () => {
  const word = makeWord({ bloomLevel: 4 });
  const res = calculateNextSRS(word, 1, 'standard', NOW);
  assert.equal(res.repetitions, 0);
  assert.equal(res.lapses, 1);
  assert.ok(res.intervalDays <= 1);
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

test('the daily plan serves overdue reviews before a capped set of new words', () => {
  const later = makeWord({ id: 'later' });
  const early = makeWord({ id: 'early', srs: { ...later.srs, nextReviewAt: NOW - DAY_MS } });
  const future = makeWord({ id: 'future', srs: { ...later.srs, nextReviewAt: NOW + DAY_MS, firstReviewedAt: NOW } });
  const newWord = makeWord({ id: 'new', srs: { ...later.srs, lastReviewedAt: null, repetitions: 0 } });
  const secondNew = makeWord({ ...newWord, id: 'new-2' });
  const words = [newWord, later, future, early, secondNew];

  const plan = getDailyStudyPlan(words, SAMPLE_PROFILE, 2, NOW);
  assert.equal(plan.dueCount, 2);
  assert.deepEqual(plan.words.map(({ id }) => id), ['early', 'later', 'new']);
  assert.equal(isWordDue(newWord, NOW), false);
  assert.equal(getDailyStudyPlan(words, SAMPLE_PROFILE, 0, NOW).newCount, 0);
  const backlog = Array.from({ length: 20 }, (_, index) => makeWord({ ...early, id: 'late-' + index }));
  assert.equal(getDailyStudyPlan([...backlog, newWord], SAMPLE_PROFILE, 8, NOW).newCount, 0);
  assert.equal(getDailyStudyPlan([...backlog, newWord], SAMPLE_PROFILE, 8, NOW).words.length, 12);
});

test('manual filters stay within their deck, due dates and requested Bloom level', () => {
  const word = makeWord();
  const future = makeWord({ id: 'future', deckId: 'd2', srs: { ...word.srs, nextReviewAt: NOW + DAY_MS } });
  assert.equal(getPracticeWords([word, future], 'd2', 'due', 1, 'flashcard', NOW).length, 0);
  assert.equal(getPracticeWords([word, future], 'd2', 'bloom', 6, 'flashcard', NOW).length, 0);
  assert.deepEqual(getPracticeWords([word, future], 'd2', 'all', 1, 'flashcard', NOW), [future]);
  assert.equal(getPracticeWords([word, future], 'missing', 'all', 1, 'flashcard', NOW).length, 0);
});

test('an early extra practice leaves existing schedules intact and lapses return in minutes', () => {
  const word = makeWord({ bloomLevel: 3 });
  const future = makeWord({ ...word, srs: { ...word.srs, nextReviewAt: NOW + DAY_MS } });
  assert.equal(applyStudyReview(future, 4, 'standard', NOW, 'flashcard'), future);
  const missed = applyStudyReview(word, 1, 'standard', NOW, 'flashcard');
  assert.equal(missed.srs.nextReviewAt - NOW, 10 * 60_000);
  assert.equal(formatIntervalVi(missed.srs.intervalDays), '10 phút');
  assert.equal(missed.srs.lapses, 1);
  const newWord = makeWord({ srs: { ...word.srs, lastReviewedAt: null, repetitions: 0 } });
  const introduced = applyStudyReview(newWord, 1, 'standard', NOW, 'flashcard');
  assert.equal(introduced.srs.firstReviewedAt, NOW);
  assert.equal(introduced.srs.lapses, 0);
  assert.equal(applyStudyReview(word, 4, 'standard', NOW, 'quiz').bloomLevel, 3);
  assert.equal(applyStudyReview(future, 3, 'standard', NOW, 'synthesis'), future);
});

test('a new local day resets progress, preserves a consecutive streak and counts words once', () => {
  const previous = new Date(2026, 10, 18, 23, 59).getTime();
  const midnight = new Date(2026, 10, 19, 0, 1).getTime();
  const profile = { ...SAMPLE_PROFILE, lastStudyDate: localStudyDate(previous) };

  assert.deepEqual(getDailyProgress(profile, midnight), { studied: 0, streak: 5 });
  const first = recordStudyActivity(profile, midnight, 12, 'alpha');
  const repeat = recordStudyActivity(first, midnight + 1000, 8, 'alpha');
  assert.equal(repeat.streakDays, 6);
  assert.equal(repeat.todayWordsCount, 1);
  const later = new Date(2026, 10, 22).getTime();
  assert.deepEqual(getDailyProgress(repeat, later), { studied: 0, streak: 0 });
  assert.equal(recordStudyActivity(repeat, later, 12, 'beta').streakDays, 1);
});

test('guided practice varies retrieval and only builds cloze prompts from matching examples', () => {
  const word = makeWord({ term: 'work', examples: [
    { sentence: 'Her coworker went home.', translation: 'Một đồng nghiệp đã về nhà.' },
    { sentence: 'We work in the morning.', translation: 'Chúng tôi làm việc vào buổi sáng.' },
  ] });
  assert.equal(getClozeExample(word)?.masked, 'We ＿＿＿ in the morning.');
  const progressed = makeWord({ ...word, srs: { ...word.srs, repetitions: 2 } });
  assert.deepEqual(getStudyExercise(progressed, 'guided', false), { mode: 'flashcard', reverse: true });
  const contextWord = makeWord({ ...word, srs: { ...word.srs, repetitions: 3 } });
  assert.equal(getStudyExercise(contextWord, 'guided', false).mode, 'cloze');
  assert.equal(getStudyExercise({ ...contextWord, examples: [] }, 'guided', false).mode, 'flashcard');
});

test('choices exclude duplicate meanings while keeping distinct options', () => {
  const word = makeWord();
  const options = getStudyChoices(word, [
    word,
    makeWord({ id: 'duplicate', term: 'strong', meaning: 'KIÊN CƯỜNG, NHANH PHỤC HỒI!' }),
    makeWord({ id: 'different', term: 'brittle', meaning: 'dễ gãy' }),
  ], false);
  assert.deepEqual(options.map(({ id }) => id).sort(), ['different', word.id]);
});

test('a scoped daily plan still applies the new-word limit across decks', () => {
  const unseen = makeWord({ srs: { ...makeWord().srs, lastReviewedAt: null } });
  const learnedElsewhere = makeWord({
    id: 'other-deck-word',
    deckId: 'd2',
    srs: { ...unseen.srs, lastReviewedAt: NOW, firstReviewedAt: NOW, nextReviewAt: NOW + DAY_MS },
  });
  const plan = getDailyStudyPlan([unseen], SAMPLE_PROFILE, 1, NOW, [unseen, learnedElsewhere]);
  assert.equal(plan.words.length, 0);
  assert.equal(plan.unseenCount, 1);
});

test('intensive review prioritizes due words and reinforces early cards only after a gap', () => {
  const hour = 60 * 60_000;
  const due = makeWord();
  const eligible = makeWord({
    id: 'eligible',
    srs: { ...due.srs, lastReviewedAt: NOW - 4 * hour, nextReviewAt: NOW + 20 * hour },
  });
  const waiting = makeWord({
    id: 'waiting',
    srs: { ...eligible.srs, lastReviewedAt: NOW - 2 * hour },
  });
  const unseen = makeWord({ id: 'unseen', srs: { ...due.srs, lastReviewedAt: null } });
  const older = makeWord({
    id: 'older',
    srs: { ...eligible.srs, lastReviewedAt: NOW - 3 * DAY_MS, repetitions: 2 },
  });
  const sturdy = makeWord({ id: 'sturdy', srs: { ...eligible.srs, repetitions: 3 } });
  const plan = getIntensiveStudyPlan([older, waiting, eligible, sturdy, unseen, due], NOW);

  assert.deepEqual(plan.words.map(({ id }) => id), [due.id, eligible.id]);
  assert.equal(plan.reviewCount, 1);
  assert.equal(plan.reinforcementCount, 1);
  assert.equal(plan.nextAvailableAt, NOW + 2 * hour);

  const backlog = Array.from({ length: 9 }, (_, index) => ({ ...due, id: 'due-' + index }));
  const backlogPlan = getIntensiveStudyPlan([eligible, ...backlog], NOW);
  assert.equal(backlogPlan.reviewCount, 8);
  assert.equal(backlogPlan.reinforcementCount, 0);
});

test('an intensive reinforcement preserves the regular schedule and counts once per review interval', () => {
  const word = makeWord();
  const eligible = { ...word, srs: { ...word.srs, nextReviewAt: NOW + DAY_MS } };
  const reinforced = applyStudyReview(eligible, 3, 'standard', NOW, 'flashcard', 'intensive');
  assert.deepEqual(reinforced.srs, { ...eligible.srs, lastIntensiveAt: NOW });
  assert.equal(reinforced.bloomLevel, eligible.bloomLevel);
  assert.equal(getIntensiveStudyPlan([reinforced], NOW).words.length, 0);
  assert.equal(applyStudyReview(reinforced, 1, 'standard', NOW + 60_000, 'flashcard', 'intensive'), reinforced);

  const regularReviewAt = eligible.srs.nextReviewAt;
  const onTime = applyStudyReview(reinforced, 3, 'standard', regularReviewAt, 'flashcard', 'intensive');
  assert.equal(onTime.srs.repetitions, 2);
  assert.equal(getIntensiveStudyPlan([onTime], regularReviewAt + 4 * 60 * 60_000).reinforcementCount, 1);
});

test('intensive phrase production accepts an attested collocation or a multiword entry', () => {
  const word = makeWord({ collocations: [
    { phrase: 'highly resilient', meaning: 'cực kỳ kiên cường' },
    { phrase: 'remarkably resilient', meaning: 'kiên cường đáng kinh ngạc' },
  ] });
  assert.deepEqual(getStudyExercise(word, 'intensive', false), { mode: 'cloze', reverse: false, phrase: true });
  assert.equal(getPhraseClozeExample(word)?.answer, 'remarkably resilient');
  assert.equal(getPhraseClozeExample(word)?.masked, 'Local communities proved ＿＿＿ after the storm.');

  const multiword = makeWord({
    term: 'book a room',
    meaning: 'đặt phòng',
    collocations: [{ phrase: 'rebook a room', meaning: 'đặt phòng lại' }],
    examples: [{ sentence: 'We can book a room online.', translation: 'Ta có thể đặt phòng trực tuyến.' }],
  });
  assert.equal(getPhraseClozeExample(multiword)?.masked, 'We can ＿＿＿ online.');
  assert.equal(getPhraseClozeExample(multiword)?.meaning, 'đặt phòng');
  assert.deepEqual(getStudyExercise({ ...multiword, examples: [] }, 'intensive', false), { mode: 'flashcard', reverse: true });
});
