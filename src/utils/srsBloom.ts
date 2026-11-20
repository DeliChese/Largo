import type {
  BloomLevel,
  ReviewQuality,
  SmartReminder,
  SRSMode,
  SRSState,
  StudyModeId,
  StudySessionLog,
  UserProfile,
  VocabWord,
} from '../types/vocab';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

export function createInitialSRS(now: number): SRSState {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: now,
    lastReviewedAt: null,
  };
}

export function localStudyDate(now: number = Date.now()): string {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function reviewXp(quality: ReviewQuality): number {
  return quality * 4;
}

export const BLOOM_META: Record<
  BloomLevel,
  { nameVi: string; nameEn: string; focus: string; recommendedMode: StudyModeId }
> = {
  1: {
    nameVi: 'Ghi nhớ',
    nameEn: 'Remember',
    focus: 'Nhận diện mặt chữ, phát âm và nghĩa cốt lõi',
    recommendedMode: 'flashcard',
  },
  2: {
    nameVi: 'Thông hiểu',
    nameEn: 'Understand',
    focus: 'Phân biệt ngữ nghĩa và nghe hiểu âm thanh',
    recommendedMode: 'quiz',
  },
  3: {
    nameVi: 'Vận dụng',
    nameEn: 'Apply',
    focus: 'Điền từ đúng dạng trong ngữ cảnh câu thực tế',
    recommendedMode: 'cloze',
  },
  4: {
    nameVi: 'Phân tích',
    nameEn: 'Analyze',
    focus: 'Kết hợp cụm từ tự nhiên (collocation) và đồng nghĩa',
    recommendedMode: 'collocation',
  },
  5: {
    nameVi: 'Đánh giá',
    nameEn: 'Evaluate',
    focus: 'Đánh giá sắc thái sử dụng và sửa lỗi ngữ cảnh',
    recommendedMode: 'dictation',
  },
  6: {
    nameVi: 'Sáng tạo',
    nameEn: 'Create',
    focus: 'Tự đặt câu hoàn chỉnh và biểu đạt ý tưởng mới',
    recommendedMode: 'synthesis',
  },
};

export const SRS_MODE_META: Record<
  SRSMode,
  { label: string; description: string; intervalMultiplier: number; minEase: number }
> = {
  standard: {
    label: 'Cân bằng',
    description: 'Giãn cách lần ôn dựa trên độ khó của từng từ.',
    intervalMultiplier: 1.0,
    minEase: 1.3,
  },
  cram: {
    label: 'Tăng tốc thi cử',
    description: 'Rút ngắn khoảng cách lặp lại (0.65x) để ghi nhớ nhanh trước kỳ thi.',
    intervalMultiplier: 0.65,
    minEase: 1.3,
  },
  relaxed: {
    label: 'Duy trì nhẹ nhàng',
    description: 'Giãn nhịp ôn tập (1.35x) phù hợp duy trì vốn từ khi bận rộn.',
    intervalMultiplier: 1.35,
    minEase: 1.4,
  },
  bloom_mastery: {
    label: 'Ôn chuyên sâu',
    description: 'Áp dụng khoảng ôn của chế độ chuyên sâu.',
    intervalMultiplier: 0.9,
    minEase: 1.35,
  },
};

/**
 * Computes the next review schedule using the selected SM-2 settings.
 */
export function calculateNextSRS(
  word: VocabWord,
  quality: ReviewQuality,
  srsMode: SRSMode,
  now: number = Date.now(),
): SRSState {
  const modeConfig = SRS_MODE_META[srsMode];
  const prev = word.srs;

  // Map 1..4 button quality to SM-2 0..5 scale (1->1, 2->3, 3->4, 4->5)
  const sm2Quality = quality === 1 ? 1 : quality === 2 ? 3 : quality === 3 ? 4 : 5;

  let easeFactor =
    prev.easeFactor + (0.1 - (5 - sm2Quality) * (0.08 + (5 - sm2Quality) * 0.02));
  if (easeFactor < modeConfig.minEase) {
    easeFactor = modeConfig.minEase;
  }
  easeFactor = Math.round(easeFactor * 100) / 100;

  let repetitions = prev.repetitions;
  let lapses = prev.lapses;
  let intervalDays = prev.intervalDays;

  if (quality === 1) {
    // Forgotten
    repetitions = 0;
    if (prev.lastReviewedAt !== null) lapses += 1;
    intervalDays = (srsMode === 'cram' ? 5 : 10) / MINUTES_PER_DAY;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = quality === 4 ? 3 : quality === 3 ? 1 : 0.75;
    } else if (repetitions === 2) {
      intervalDays = quality === 4 ? 7 : quality === 3 ? 4 : 2;
    } else {
      const baseNext = Math.max(1, prev.intervalDays) * easeFactor;
      const qualityMod = quality === 2 ? 0.8 : quality === 4 ? 1.25 : 1.0;
      intervalDays = baseNext * qualityMod;
    }
    intervalDays = Math.min(365, Math.max(0.25, Math.round(intervalDays * modeConfig.intervalMultiplier * 10) / 10));
  }

  const nextReviewAt = now + Math.round(intervalDays * DAY_MS);
  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses,
    nextReviewAt,
    lastReviewedAt: now,
    firstReviewedAt: prev.firstReviewedAt ?? (prev.lastReviewedAt === null ? now : undefined),
  };
}

/**
 * Estimates current memory retention probability R = e^(-t / S) in [0, 1].
 */
export function calculateRetentionProbability(word: VocabWord, now: number = Date.now()): number {
  const last = word.srs.lastReviewedAt;
  if (last === null) {
    return 0.5; // Unseen / baseline
  }
  const elapsedDays = Math.max(0, (now - last) / DAY_MS);
  const stability = Math.max(0.8, word.srs.intervalDays * (word.srs.easeFactor / 2.2));
  const retention = Math.exp(-elapsedDays / (stability * 1.45));
  return Math.max(0.05, Math.min(0.99, Math.round(retention * 100) / 100));
}

export function isWordDue(word: VocabWord, now: number = Date.now()): boolean {
  return word.srs.lastReviewedAt !== null && word.srs.nextReviewAt <= now;
}

export function recommendStudyModeForWord(word: VocabWord): StudyModeId {
  return BLOOM_META[word.bloomLevel].recommendedMode;
}

export function formatIntervalVi(days: number): string {
  if (days < 1 / 24) {
    return `${Math.max(1, Math.round(days * MINUTES_PER_DAY))} phút`;
  }
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return `${hours} giờ`;
  }
  if (days < 30) {
    const rounded = Math.round(days);
    return `${rounded} ngày`;
  }
  const months = Math.round((days / 30) * 10) / 10;
  return `${months} tháng`;
}

export function generateSmartReminders(
  words: VocabWord[],
  profile: UserProfile,
  logs: StudySessionLog[],
  retentionThreshold: number = 0.75,
  now: number = Date.now(),
): SmartReminder[] {
  const reminders: SmartReminder[] = [];
  const dueWords = words.filter((word) => isWordDue(word, now))
    .sort((a, b) => a.srs.nextReviewAt - b.srs.nextReviewAt);

  // 1. Urgent forgetting words (retention below threshold and already reviewed at least once)
  const forgettingWords = dueWords
    .filter((w) => calculateRetentionProbability(w, now) < retentionThreshold)
    .sort((a, b) => calculateRetentionProbability(a, now) - calculateRetentionProbability(b, now));

  if (forgettingWords.length > 0) {
    reminders.push({
      id: 'rem-forgetting',
      type: 'urgent_forgetting',
      priority: 'high',
      title: `${forgettingWords.length} từ cần ưu tiên ôn`,
      description: `Mức ghi nhớ ước tính dưới ${Math.round(retentionThreshold * 100)}%.`,
      actionLabel: 'Ôn từ khó',
      targetMode: 'flashcard',
      wordIds: forgettingWords.slice(0, 10).map((w) => w.id),
    });
  }

  // 2. Due SRS queue
  if (dueWords.length > 0) {
    reminders.push({
      id: 'rem-due',
      type: 'due_queue',
      priority: dueWords.length >= 8 ? 'high' : 'medium',
      title: `${dueWords.length} từ đã đến hạn ôn`,
      description: 'Các từ đến hạn sớm hơn được xếp trước.',
      actionLabel: 'Bắt đầu ôn',
      targetMode: 'flashcard',
      wordIds: dueWords.slice(0, 12).map((w) => w.id),
    });
  }

  // 3. Suggest contextual practice for familiar words with collocations.
  const readyForBloomUpgrade = words.filter(
    (w) => w.bloomLevel <= 2 && w.srs.repetitions >= 2 && w.collocations.length > 0,
  );
  if (readyForBloomUpgrade.length >= 2) {
    reminders.push({
      id: 'rem-bloom',
      type: 'bloom_advancement',
      priority: 'medium',
      title: `${readyForBloomUpgrade.length} từ có cụm từ để luyện`,
      description: 'Ôn những từ thường đi cùng nhau trong câu.',
      actionLabel: 'Luyện cụm từ',
      targetMode: 'collocation',
      wordIds: readyForBloomUpgrade.slice(0, 8).map((w) => w.id),
    });
  }

  const today = localStudyDate(now);
  const hasStudiedToday = profile.lastStudyDate === today || logs.some((log) => localStudyDate(log.timestamp) === today);
  const studiedToday = profile.lastStudyDate === today ? profile.todayWordsCount : 0;
  const remainingDaily = Math.max(0, profile.dailyGoalWords - studiedToday);
  const goalWords = dueWords.length > 0 ? dueWords : words.filter((word) => word.srs.lastReviewedAt === null);
  if (remainingDaily > 0 && goalWords.length > 0) {
    reminders.push({
      id: 'rem-streak',
      type: 'streak_protection',
      priority: hasStudiedToday ? 'low' : 'high',
      title: hasStudiedToday
        ? `Còn ${remainingDaily} từ để hoàn thành mục tiêu hôm nay`
        : 'Kế hoạch học hôm nay đã sẵn sàng',
      description: hasStudiedToday
        ? 'Tiếp tục với một phiên học ngắn.'
        : 'Dành vài phút cho những từ được đề xuất.',
      actionLabel: 'Mở kế hoạch học',
      targetMode: 'flashcard',
      wordIds: goalWords.slice(0, 10).map((w) => w.id),
    });
  }

  return reminders;
}

export function computeBloomDistribution(
  words: VocabWord[],
): Array<{ level: BloomLevel; label: string; count: number; percentage: number }> {
  const total = Math.max(1, words.length);
  const counts: Record<BloomLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const w of words) {
    counts[w.bloomLevel] += 1;
  }
  return ([1, 2, 3, 4, 5, 6] as BloomLevel[]).map((level) => ({
    level,
    label: BLOOM_META[level].nameVi,
    count: counts[level],
    percentage: Math.round((counts[level] / total) * 100),
  }));
}

export function computeForecastDays(
  words: VocabWord[],
  days: number = 10,
  now: number = Date.now(),
): Array<{ dayLabel: string; count: number; isToday: boolean }> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const result: Array<{ dayLabel: string; count: number; isToday: boolean }> = [];
  const scheduled = words.filter((word) => word.srs.lastReviewedAt !== null);

  for (let i = 0; i < days; i++) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + i);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    const count = scheduled.filter(({ srs }) =>
      srs.nextReviewAt < end.getTime() && (i === 0 || srs.nextReviewAt >= d.getTime()),
    ).length;
    const dayLabel = i === 0 ? 'Hôm nay' : `${d.getDate()}/${d.getMonth() + 1}`;
    result.push({ dayLabel, count, isToday: i === 0 });
  }
  return result;
}

export function normalizeText(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]，。！？、；：“”‘’（）]/g, '')
    .replace(/\s+/g, ' ');
}

export function evaluateAnswerMatch(userInput: string, expectedTerm: string): boolean {
  const a = normalizeText(userInput);
  const b = normalizeText(expectedTerm);
  return a.length > 0 && a === b;
}

export function evaluateSynthesisSentence(
  sentence: string,
  targetWord: VocabWord,
): {
  passed: boolean;
  hasTargetWord: boolean;
  hasCollocation: boolean;
  wordCount: number;
  feedback: string;
} {
  const cleaned = sentence.trim();
  const normalized = normalizeText(cleaned);
  const isCJK =
    targetWord.language === 'zh' ||
    targetWord.language === 'ja' ||
    /[\u4e00-\u9fff]/.test(cleaned);

  const cjkChars = cleaned.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || [];
  const spaceWords = normalized.split(/\s+/).filter(Boolean);
  const wordCount = isCJK ? cjkChars.length : spaceWords.length;
  const termBase = normalizeText(targetWord.term);

  // Match exact word (CJK or Latin) or simple Latin inflections
  const hasTargetWord = isCJK
    ? normalized.includes(termBase)
    : normalized.includes(termBase) ||
      (termBase.length > 3 && normalized.includes(termBase.slice(0, termBase.length - 1)));

  const hasCollocation = targetWord.collocations.some((c) => {
    const normCol = normalizeText(c.phrase);
    if (isCJK) {
      const cleanCol = normCol.replace(/[….\s]+/g, '');
      return cleanCol.length >= 2 && normalized.replace(/\s+/g, '').includes(cleanCol);
    }
    const tokens = normCol.split(' ').filter((t) => t.length > 2);
    return tokens.length >= 2 && tokens.every((tok) => normalized.includes(tok));
  });

  if (wordCount < 5) {
    return {
      passed: false,
      hasTargetWord,
      hasCollocation,
      wordCount,
      feedback: isCJK
        ? 'Hãy thử viết câu có ít nhất 5 ký tự để tạo ngữ cảnh.'
        : 'Câu còn quá ngắn (cần tối thiểu 5 từ để thể hiện ngữ cảnh rõ ràng).',
    };
  }
  if (!hasTargetWord) {
    return {
      passed: false,
      hasTargetWord,
      hasCollocation,
      wordCount,
      feedback: `Câu chưa chứa từ khóa "${targetWord.term}". Hãy lồng ghép từ này vào ngữ cảnh tự nhiên.`,
    };
  }

  return {
    passed: true,
    hasTargetWord,
    hasCollocation,
    wordCount,
    feedback: hasCollocation
      ? 'Đã tìm thấy từ khóa và cụm từ gợi ý. Hãy đối chiếu cách dùng với câu mẫu.'
      : 'Đã tìm thấy từ khóa. Hãy đối chiếu ngữ pháp và cách dùng với câu mẫu.',
  };
}
