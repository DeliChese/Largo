export type LanguageCode = 'en';
export type EnglishLocale = 'en-GB' | 'en-US';

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
  sourceUrl?: string;
}

export interface LexicalRelations {
  synonyms: string[];
  antonyms: string[];
}

export interface EnglishWordForm {
  term?: string;
  phonetic?: string;
  collocations?: CollocationItem[];
  examples?: ExampleSentence[];
}

export type EnglishWordForms = Partial<Record<EnglishLocale, EnglishWordForm>>;
export type SpeechVoices = Partial<Record<LanguageCode | EnglishLocale, string>>;

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

/** An additional lexical sense; never a separate review item or accepted answer by default. */
export interface EnglishAdditionalSense {
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  notes?: string;
  examples: ExampleSentence[];
}

export interface WordFamilyItem {
  term: string;
  partOfSpeech: string;
  meaning?: string;
}

export interface VocabWord extends LexicalRelations {
  id: string;
  deckId: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  language: LanguageCode;
  englishForms?: EnglishWordForms;
  additionalSenses?: EnglishAdditionalSense[];
  wordFamily?: WordFamilyItem[];
  collocations: CollocationItem[];
  examples: ExampleSentence[];
  personalRelations?: LexicalRelations;
  notes?: string;
  bloomLevel: BloomLevel;
  lastSynthesisAt?: number;
  srs: SRSState;
  createdAt: number;
}

export type DeckCollection = 'textbook' | 'vocabulary' | 'situations' | 'collocations' | 'regional' | 'phrasal' | 'phrases' | 'idioms';

export interface VocabDeck {
  id: string;
  name: string;
  nativeName?: string;
  description: string;
  language: LanguageCode;
  category: string;
  collection?: DeckCollection;
  level?: string;
  wordIds?: readonly string[];
  isCustom: boolean;
  createdAt: number;
}

export interface DeckWordImport {
  term: string;
  meaning: string;
  phonetic?: string;
  partOfSpeech?: string;
  notes?: string;
  collocation?: string;
  collocationMeaning?: string;
  example?: string;
  examplePhonetic?: string;
  translation?: string;
  collocations?: CollocationItem[];
  examples?: ExampleSentence[];
  synonyms?: string[] | string;
  antonyms?: string[] | string;
  englishForms?: EnglishWordForms;
  wordFamily?: WordFamilyItem[];
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
  adaptivePlanner?: boolean;
  studyLevels?: Partial<Record<LanguageCode, string>>;
  englishLocale?: EnglishLocale;
  speechRate: number; // 0.7 | 0.85 | 1.0 | 1.15
  speechVoices?: SpeechVoices;
  autoPlayAudio: boolean;
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
