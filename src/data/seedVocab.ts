import type {
  AppSettings,
  LanguageCode,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import {
  CHINESE_COURSE_WORDS,
  CHINESE_DECKS,
  CHINESE_WORDS,
  hasCurrentChineseDecks,
  mergeChineseSeed,
  migrateChineseDeckId,
  migrateChineseWordId,
  resolveMigratedChineseDeckLevel,
} from '../../Chinese/chineseDecks';
import { DEFAULT_HSK_EDITION } from '../../Chinese/hsk1Courses';
import { ENGLISH_DECKS, ENGLISH_V7_WORD_DECK_IDS, ENGLISH_WORDS, PRE_V5_ENGLISH_WORD_IDS, STARTER_ENGLISH_WORDS } from './englishDecks';

export const LANGUAGE_LABELS: Record<LanguageCode, { name: string; native: string; short: string }> = {
  zh: { name: 'Tiếng Trung', native: '中文', short: 'ZH' },
  en: { name: 'Tiếng Anh', native: 'English', short: 'EN' },
  ja: { name: 'Tiếng Nhật', native: '日本語', short: 'JA' },
  fr: { name: 'Tiếng Pháp', native: 'Français', short: 'FR' },
  ko: { name: 'Tiếng Hàn', native: '한국어', short: 'KO' },
  es: { name: 'Tiếng Tây Ban Nha', native: 'Español', short: 'ES' },
};

const ENGLISH_DATA_VERSION = 2;
const ENGLISH_CURRICULUM_VERSION = 7;
export const CURRENT_DATA_VERSION = 8;

export const INITIAL_DECKS: VocabDeck[] = [...CHINESE_DECKS, ...ENGLISH_DECKS];

export const INITIAL_WORDS: VocabWord[] = [...CHINESE_COURSE_WORDS, ...ENGLISH_WORDS];

interface SeedState {
  decks: VocabDeck[];
  words: VocabWord[];
  logs: StudySessionLog[];
  profile: UserProfile;
  settings?: Partial<AppSettings>;
  version: number;
}

const ENGLISH_DECK_IDS = new Set(ENGLISH_DECKS.map(({ id }) => id));
const ENGLISH_WORDS_BY_ID = new Map(ENGLISH_WORDS.map((word) => [word.id, word]));
const CHINESE_WORD_IDS = new Set(CHINESE_WORDS.map(({ id }) => id));
const STARTER_ENGLISH_WORD_IDS = new Set(STARTER_ENGLISH_WORDS.map(({ id }) => id));

export function isBuiltinWord(wordId: string): boolean {
  return ENGLISH_WORDS_BY_ID.has(wordId) || CHINESE_WORD_IDS.has(wordId);
}

function hasCurrentEnglishDecks(decks: readonly VocabDeck[]): boolean {
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  return ENGLISH_DECKS.every((deck) => {
    const saved = byId.get(deck.id);
    return saved?.language === 'en' && !saved.isCustom && saved.level === deck.level &&
      saved.collection === deck.collection && saved.category === deck.category && saved.name === deck.name;
  });
}

export function hasCurrentSeedDecks(decks: readonly VocabDeck[]): boolean {
  return hasCurrentChineseDecks(decks) && hasCurrentEnglishDecks(decks);
}

function mergeEnglishSeed(decks: VocabDeck[], words: VocabWord[], version: number) {
  const existingDeckIds = new Set(decks.map(({ id }) => id));
  const savedEnglishWords = new Map(words.filter((word) => word.language === 'en').map((word) => [word.id, word]));
  const otherWords = words.filter((word) => word.language !== 'en' || !ENGLISH_WORDS_BY_ID.has(word.id));
  const previousIds = version >= 5 ? STARTER_ENGLISH_WORD_IDS : PRE_V5_ENGLISH_WORD_IDS;

  const mergedEnglishWords = ENGLISH_WORDS.flatMap((word) => {
    const saved = savedEnglishWords.get(word.id);
    if (!saved) {
      const oldDeckId = ENGLISH_V7_WORD_DECK_IDS.get(word.id);
      const installedCurrentDeck = version >= CURRENT_DATA_VERSION && existingDeckIds.has(word.deckId);
      const installedOldDeck = oldDeckId && existingDeckIds.has(oldDeckId) &&
        (version >= ENGLISH_CURRICULUM_VERSION || (version >= ENGLISH_DATA_VERSION && previousIds.has(word.id)));
      const existed = installedCurrentDeck || installedOldDeck;
      return existed ? [] : [word];
    }
    return [{
      ...word,
      createdAt: saved.createdAt,
      srs: saved.srs,
      bloomLevel: saved.bloomLevel,
      lastSynthesisAt: saved.lastSynthesisAt,
      personalRelations: saved.personalRelations,
    }];
  });

  return {
    decks: [...decks.filter((deck) => !ENGLISH_DECK_IDS.has(deck.id)), ...ENGLISH_DECKS],
    words: [...otherWords, ...mergedEnglishWords],
  };
}

export function withCurrentSeed<T extends SeedState>(state: T): T {
  if (state.version > CURRENT_DATA_VERSION) return state;
  const needsChinese = state.version < CURRENT_DATA_VERSION || !hasCurrentChineseDecks(state.decks);
  const needsEnglish = state.version < CURRENT_DATA_VERSION || !hasCurrentEnglishDecks(state.decks);
  if (!needsChinese && !needsEnglish) return state;

  const chinese = needsChinese ? mergeChineseSeed(state.decks, state.words, state.version) : state;
  const library = needsEnglish ? mergeEnglishSeed(chinese.decks, chinese.words, state.version) : chinese;

  let { profile } = state;
  if (state.version < ENGLISH_DATA_VERSION &&
    profile.name === 'Học viên HSK' &&
    profile.title === 'Lộ trình Tiếng Trung Khoa học') {
    profile = { ...profile, name: INITIAL_PROFILE.name, title: INITIAL_PROFILE.title };
  }
  if (profile.todayWordIds?.length) {
    const mappedToday = [...new Set(profile.todayWordIds.map(migrateChineseWordId))];
    const changed = mappedToday.length !== profile.todayWordIds.length ||
      mappedToday.some((id, index) => id !== profile.todayWordIds![index]);
    if (changed) {
      profile = { ...profile, todayWordIds: mappedToday };
    }
  }

  const logs = state.logs.map((log) => {
    const nextDeckId = log.deckId === 'all' ? 'all' : migrateChineseDeckId(log.deckId);
    const resolvedLevel = nextDeckId !== 'all' ? resolveMigratedChineseDeckLevel(log.deckId) : undefined;
    const nextLevel = log.level === 'legacy' || !log.level || log.level === 'all'
      ? resolvedLevel ?? log.level
      : log.level;
    if (nextDeckId === log.deckId && nextLevel === log.level) return log;
    return { ...log, deckId: nextDeckId, ...(nextLevel ? { level: nextLevel } : {}) };
  });

  return {
    ...state,
    decks: library.decks,
    words: library.words.map((word) => Array.isArray(word.antonyms) ? word : { ...word, antonyms: [] }),
    profile,
    logs,
    ...(state.settings ? { settings: { ...INITIAL_SETTINGS, ...state.settings } } : {}),
    version: CURRENT_DATA_VERSION,
  };
}

export const INITIAL_PROFILE: UserProfile = {
  name: 'Học viên Largo',
  title: 'Học từ vựng mỗi ngày',
  bio: '',
  nativeLanguage: 'vi',
  targetLanguage: 'zh',
  xp: 0,
  streakDays: 0,
  longestStreak: 0,
  lastStudyDate: '',
  dailyGoalWords: 15,
  todayWordsCount: 0,
  bestMatchScore: 0,
  bestWordFallScore: 0,
  bestScrambleScore: 0,
  bestAudioBlitzScore: 0,
};

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'indigo',
  colorScheme: 'light',
  uiDensity: 'airy',
  zenFocusMode: false,
  srsMode: 'standard',
  dailyNewWordLimit: 8,
  hskEdition: DEFAULT_HSK_EDITION,
  speechRate: 1.0,
  autoPlayAudio: false,
  showExamplePhonetic: true,
  soundEnabled: true,
  soundVolume: 0.45,
  reminderEnabled: true,
  reminderHour: '20:00',
  retentionThreshold: 0.75,
};

export const INITIAL_LOGS: StudySessionLog[] = [];
