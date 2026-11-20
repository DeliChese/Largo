export type LanguageCode = 'en' | 'zh' | 'ja' | 'fr' | 'ko' | 'es';
export type HskEdition = 'hsk20' | 'hsk30';

export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SRSMode = 'standard' | 'cram' | 'relaxed' | 'bloom_mastery';

export type StudyModeId =
  | 'flashcard'
  | 'quiz'
  | 'dictation'
  | 'cloze'
  | 'collocation'
  | 'synthesis'
  | 'speed';

export type StudySessionMode = StudyModeId | 'guided' | 'intensive';

export type ReviewQuality = 1 | 2 | 3 | 4; // 1: Again (Quên), 2: Hard (Khó), 3: Good (Tốt), 4: Easy (Dễ)

export type ThemeId = 'indigo' | 'botanical' | 'amber' | 'midnight';

export type ColorSchemeMode = 'light' | 'dark' | 'system';

export type UIDensity = 'airy' | 'compact' | 'zen';

export type AppRoute =
  | 'dashboard'
  | 'study'
  | 'games'
  | 'decks'
  | 'analytics'
  | 'profile'
  | 'achievements'
  | 'settings';

export type AnalyticsSubRoute = 'overview' | 'bloom' | 'retention' | 'history';

export interface CollocationItem {
  phrase: string;
  meaning: string;
}

export interface ExampleSentence {
  sentence: string;
  phonetic?: string;
  translation: string;
}

export interface SRSState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReviewAt: number; // epoch ms
  lastReviewedAt: number | null; // epoch ms
  firstReviewedAt?: number;
  lastIntensiveAt?: number;
}

export interface VocabWord {
  id: string;
  deckId: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  language: LanguageCode;
  sinoVietnamese?: string; // Âm Hán-Việt cho tiếng Trung
  radical?: string; // Bộ thủ / cấu tạo chữ Hán
  collocations: CollocationItem[];
  examples: ExampleSentence[];
  synonyms: string[];
  notes?: string;
  bloomLevel: BloomLevel;
  lastSynthesisAt?: number;
  srs: SRSState;
  createdAt: number;
}

export interface VocabDeck {
  id: string;
  name: string;
  description: string;
  language: LanguageCode;
  category: string;
  level?: string;
  hskEdition?: HskEdition;
  wordIds?: readonly string[];
  isCustom: boolean;
  createdAt: number;
}

export interface StudySessionLog {
  id: string;
  timestamp: number;
  mode:
    | StudySessionMode
    | 'game_match'
    | 'game_wordfall'
    | 'game_scramble'
    | 'game_audioblitz';
  deckId: string | 'all';
  language?: LanguageCode;
  level?: string;
  hskEdition?: HskEdition;
  wordsReviewed: number;
  correctCount: number;
  xpEarned: number;
  durationSeconds: number;
}

export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  nativeLanguage: string;
  targetLanguage: LanguageCode;
  xp: number;
  streakDays: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD or ''
  dailyGoalWords: number;
  todayWordsCount: number;
  todayWordIds?: string[];
  bestMatchScore: number;
  bestWordFallScore: number;
  bestScrambleScore: number;
  bestAudioBlitzScore: number;
}

export interface AppSettings {
  theme: ThemeId;
  colorScheme: ColorSchemeMode;
  uiDensity: UIDensity;
  zenFocusMode: boolean;
  srsMode: SRSMode;
  dailyNewWordLimit: number;
  studyLevels?: Partial<Record<LanguageCode, string>>;
  hskEdition?: HskEdition;
  speechRate: number; // 0.7 | 0.85 | 1.0 | 1.15
  speechVoices?: Partial<Record<LanguageCode, string>>;
  autoPlayAudio: boolean;
  showExamplePhonetic?: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  reminderEnabled: boolean;
  reminderHour: string; // HH:mm
  retentionThreshold: number; // 0.65 - 0.85
}

export interface SmartReminder {
  id: string;
  type: 'urgent_forgetting' | 'due_queue' | 'bloom_advancement' | 'streak_protection';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  targetMode: StudyModeId;
  wordIds: string[];
}
