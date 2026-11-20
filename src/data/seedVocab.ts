import type {
  AppSettings,
  LanguageCode,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import { CHINESE_DECKS, CHINESE_WORDS, LEGACY_CHINESE_LEVELS, mergeChineseSeed } from '../../Chinese/chineseDecks';
import { ENGLISH_DECKS, ENGLISH_WORDS } from './englishDecks';

export const LANGUAGE_LABELS: Record<LanguageCode, { name: string; native: string; short: string }> = {
  zh: { name: 'Tiếng Trung', native: '中文', short: 'ZH' },
  en: { name: 'Tiếng Anh', native: 'English', short: 'EN' },
  ja: { name: 'Tiếng Nhật', native: '日本語', short: 'JA' },
  fr: { name: 'Tiếng Pháp', native: 'Français', short: 'FR' },
  ko: { name: 'Tiếng Hàn', native: '한국어', short: 'KO' },
  es: { name: 'Tiếng Tây Ban Nha', native: 'Español', short: 'ES' },
};

const ENGLISH_DATA_VERSION = 2;
export const CURRENT_DATA_VERSION = 4;

export const INITIAL_DECKS: VocabDeck[] = [...CHINESE_DECKS, ...ENGLISH_DECKS];

export const INITIAL_WORDS: VocabWord[] = [...CHINESE_WORDS, ...ENGLISH_WORDS];

interface SeedState {
  decks: VocabDeck[];
  words: VocabWord[];
  logs: StudySessionLog[];
  profile: UserProfile;
  version: number;
}

export function withCurrentSeed<T extends SeedState>(state: T): T {
  if (state.version >= CURRENT_DATA_VERSION) return state;

  const chinese = mergeChineseSeed(state.decks, state.words, state.version);
  const decks = [...chinese.decks];
  const words = [...chinese.words];
  let { profile } = state;
  if (state.version < ENGLISH_DATA_VERSION) {
    const deckIds = new Set(decks.map(({ id }) => id));
    const wordIds = new Set(words.map(({ id }) => id));
    decks.push(...ENGLISH_DECKS.filter(({ id }) => !deckIds.has(id)));
    words.push(...ENGLISH_WORDS.filter(({ id }) => !wordIds.has(id)));
    if (profile.name === 'Học viên HSK' && profile.title === 'Lộ trình Tiếng Trung Khoa học') {
      profile = { ...profile, name: INITIAL_PROFILE.name, title: INITIAL_PROFILE.title };
    }
  }
  return {
    ...state,
    decks,
    words,
    profile,
    version: CURRENT_DATA_VERSION,
    logs: state.logs.map((log) => {
      const oldLevel = LEGACY_CHINESE_LEVELS.get(log.deckId);
      if (!oldLevel || (log.level && log.level !== 'all')) return log;
      return { ...log, level: state.version < 3 ? oldLevel : 'legacy' };
    }),
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
  speechRate: 1.0,
  autoPlayAudio: false,
  soundEnabled: true,
  soundVolume: 0.45,
  reminderEnabled: true,
  reminderHour: '20:00',
  retentionThreshold: 0.75,
};

export const INITIAL_LOGS: StudySessionLog[] = [];
