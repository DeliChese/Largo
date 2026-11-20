import type {
  AppSettings,
  LanguageCode,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import { HSK1_DECKS, HSK1_WORDS } from './hsk1Deck';
import { HSK2_DECKS, HSK2_WORDS } from './hsk2Deck';
import { ENGLISH_DECKS, ENGLISH_WORDS } from './englishDecks';

export const LANGUAGE_LABELS: Record<LanguageCode, { name: string; native: string; short: string }> = {
  zh: { name: 'Tiếng Trung', native: '中文', short: 'ZH' },
  en: { name: 'Tiếng Anh', native: 'English', short: 'EN' },
  ja: { name: 'Tiếng Nhật', native: '日本語', short: 'JA' },
  fr: { name: 'Tiếng Pháp', native: 'Français', short: 'FR' },
  ko: { name: 'Tiếng Hàn', native: '한국어', short: 'KO' },
  es: { name: 'Tiếng Tây Ban Nha', native: 'Español', short: 'ES' },
};

export const CURRENT_DATA_VERSION = 2;

export const INITIAL_DECKS: VocabDeck[] = [...HSK1_DECKS, ...HSK2_DECKS, ...ENGLISH_DECKS];

export const INITIAL_WORDS: VocabWord[] = [...HSK1_WORDS, ...HSK2_WORDS, ...ENGLISH_WORDS];

export function withEnglishSeed<T extends { decks: VocabDeck[]; words: VocabWord[]; version: number }>(state: T): T {
  if (state.version >= CURRENT_DATA_VERSION) return state;

  const deckIds = new Set(state.decks.map((deck) => deck.id));
  const wordIds = new Set(state.words.map((word) => word.id));
  return {
    ...state,
    version: CURRENT_DATA_VERSION,
    decks: [...state.decks, ...ENGLISH_DECKS.filter((deck) => !deckIds.has(deck.id))],
    words: [...state.words, ...ENGLISH_WORDS.filter((word) => !wordIds.has(word.id))],
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
