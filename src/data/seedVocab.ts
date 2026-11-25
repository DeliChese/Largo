import type {
  AppSettings,
  LanguageCode,
  SpeechVoices,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import {
  ENGLISH_DECKS, ENGLISH_LEGACY_PHRASAL_DUPLICATES, ENGLISH_PHRASAL_PREVIOUS_DECK_IDS,
  ENGLISH_V7_WORD_DECK_IDS, ENGLISH_WORDS, PRE_V5_ENGLISH_WORD_IDS, STARTER_ENGLISH_WORDS,
} from './englishDecks';

export const LANGUAGE_LABELS: Record<LanguageCode, { name: string; native: string; short: string }> = {
  en: { name: 'Tiếng Anh', native: 'English', short: 'EN' },
};

const ENGLISH_DATA_VERSION = 2;
const ENGLISH_CURRICULUM_VERSION = 7;
const ENGLISH_PHRASES_VERSION = 8;
export const CURRENT_DATA_VERSION = 32;

export const INITIAL_DECKS: VocabDeck[] = [...ENGLISH_DECKS];

export const INITIAL_WORDS: VocabWord[] = [...ENGLISH_WORDS];

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
const STARTER_ENGLISH_WORD_IDS = new Set(STARTER_ENGLISH_WORDS.map(({ id }) => id));
const legacyPhrasalDeckId = /^deck-en-phrasal-[a-z]+-\d{2}$/;
const legacyPhrasalWordId = /^en-phrasal-[a-z0-9-]+-[a-f0-9]{10}$/;

export function isBuiltinWord(wordId: string): boolean {
  return ENGLISH_WORDS_BY_ID.has(wordId) || legacyPhrasalWordId.test(wordId);
}

function hasCurrentEnglishDecks(decks: readonly VocabDeck[]): boolean {
  if (decks.some(({ id, language, isCustom }) => language === 'en' && !isCustom && legacyPhrasalDeckId.test(id))) return false;
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  return ENGLISH_DECKS.every((deck) => {
    const saved = byId.get(deck.id);
    return saved?.language === 'en' && !saved.isCustom && saved.level === deck.level &&
      saved.collection === deck.collection && saved.category === deck.category && saved.name === deck.name;
  });
}

export function hasCurrentSeedDecks(decks: readonly VocabDeck[]): boolean {
  return !decks.some(({ language }) => language !== 'en') && hasCurrentEnglishDecks(decks);
}

function cleanEnglishWord(word: VocabWord): VocabWord {
  const legacy = word as VocabWord & { sinoVietnamese?: unknown; radical?: unknown };
  if (!('sinoVietnamese' in legacy) && !('radical' in legacy) && Array.isArray(legacy.antonyms)) {
    return word;
  }
  const { sinoVietnamese: _sv, radical: _rad, ...rest } = legacy;
  return Array.isArray(rest.antonyms) ? rest : { ...rest, antonyms: [] };
}

function cleanEnglishDeck(deck: VocabDeck): VocabDeck {
  if (!('hskEdition' in deck)) return deck;
  const { hskEdition: _edition, ...rest } = deck as VocabDeck & { hskEdition?: unknown };
  return rest;
}

function cleanSpeechVoices(voices?: Record<string, string | undefined>): SpeechVoices | undefined {
  if (!voices) return undefined;
  const cleaned: SpeechVoices = {};
  for (const key of ['en', 'en-GB', 'en-US'] as const) {
    if (voices[key]) cleaned[key] = voices[key];
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function mergeEnglishSeed(decks: VocabDeck[], words: VocabWord[], version: number) {
  const englishDecks = decks.filter((deck) => deck.language === 'en').map(cleanEnglishDeck);
  const englishWords = words.filter((word) => word.language === 'en').map(cleanEnglishWord);
  const savedDecksById = new Map(englishDecks.map((deck) => [deck.id, deck]));
  const retiredDecks = englishDecks.filter(({ id, isCustom }) => !isCustom && legacyPhrasalDeckId.test(id));
  const retiredDeckIds = new Set(retiredDecks.map(({ id }) => id));
  const savedEnglishWords = new Map(englishWords.map((word) => [word.id, word]));
  const personalWords = englishWords.filter(({ id, deckId }) => retiredDeckIds.has(deckId) && !isBuiltinWord(id));
  const personalDeckIds = new Set(personalWords.map(({ deckId }) => deckId));
  const customWords = englishWords.filter((word) => !ENGLISH_WORDS_BY_ID.has(word.id)).map((word) => {
    const legacyDuplicate = ENGLISH_LEGACY_PHRASAL_DUPLICATES.get(word.id);
    if (legacyDuplicate) return { ...word, deckId: legacyDuplicate.deckId };
    return legacyPhrasalWordId.test(word.id) && personalDeckIds.has(word.deckId)
      ? { ...word, deckId: 'archive-' + word.deckId } : word;
  });
  const previousIds = version >= 5 ? STARTER_ENGLISH_WORD_IDS : PRE_V5_ENGLISH_WORD_IDS;

  const mergedEnglishWords = ENGLISH_WORDS.flatMap((word) => {
    const saved = savedEnglishWords.get(word.id);
    if (!saved) {
      const oldDeckId = ENGLISH_V7_WORD_DECK_IDS.get(word.id);
      const installedCurrentDeck = version >= ENGLISH_PHRASES_VERSION && savedDecksById.has(word.deckId);
      const previousPhrasalDeckId = ENGLISH_PHRASAL_PREVIOUS_DECK_IDS.get(word.id);
      const installedPreviousPhrasalDeck = previousPhrasalDeckId && retiredDeckIds.has(previousPhrasalDeckId);
      const installedOldDeck = oldDeckId && savedDecksById.has(oldDeckId) &&
        (version >= ENGLISH_CURRICULUM_VERSION || (version >= ENGLISH_DATA_VERSION && previousIds.has(word.id)));
      const existed = installedCurrentDeck || installedOldDeck || installedPreviousPhrasalDeck;
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
    decks: [
      ...englishDecks.filter(({ id }) => !ENGLISH_DECK_IDS.has(id) && !retiredDeckIds.has(id)),
      ...retiredDecks.filter(({ id }) => personalDeckIds.has(id)).map((deck): VocabDeck => ({
        ...deck,
        name: 'Từ tự thêm · ' + deck.name,
        description: '',
        level: 'custom',
        collection: undefined,
        category: 'Cá nhân',
        wordIds: undefined,
        isCustom: true,
      })),
      ...ENGLISH_DECKS.map((deck) => {
        const saved = savedDecksById.get(deck.id);
        if (deck.collection !== 'phrasal' || !deck.wordIds) {
          return { ...deck, createdAt: saved?.createdAt ?? deck.createdAt };
        }
        // Installed lessons keep their own cards, including their saved progress and deletions.
        const wordIds = saved ? saved.wordIds : deck.wordIds.filter((id) =>
          ![...ENGLISH_LEGACY_PHRASAL_DUPLICATES].some(([legacyId, { canonicalId }]) => id === canonicalId &&
            (savedEnglishWords.has(legacyId) || retiredDeckIds.has(ENGLISH_PHRASAL_PREVIOUS_DECK_IDS.get(legacyId) ?? ''))));
        return { ...deck, wordIds, createdAt: saved?.createdAt ?? deck.createdAt };
      }),
    ],
    words: [...customWords, ...mergedEnglishWords],
  };
}

export function withCurrentSeed<T extends SeedState>(state: T): T {
  if (state.version > CURRENT_DATA_VERSION) return state;
  const needsEnglish = state.version < CURRENT_DATA_VERSION || !hasCurrentSeedDecks(state.decks) ||
    state.words.some((word) => word.language !== 'en') || state.profile.targetLanguage !== 'en';
  if (!needsEnglish) return state;

  const library = mergeEnglishSeed(state.decks, state.words, state.version);
  const keptWordIds = new Set(library.words.map(({ id }) => id));
  const keptDeckIds = new Set(library.decks.map(({ id }) => id));

  let { profile } = state;
  if (state.version < ENGLISH_DATA_VERSION &&
    profile.name === 'Học viên HSK' &&
    profile.title === 'Lộ trình Tiếng Trung Khoa học') {
    profile = { ...profile, name: INITIAL_PROFILE.name, title: INITIAL_PROFILE.title };
  }
  profile = {
    ...profile,
    targetLanguage: 'en',
    ...(profile.todayWordIds !== undefined && {
      todayWordIds: profile.todayWordIds.filter((id) => keptWordIds.has(id)),
    }),
  };

  const logs = state.logs.flatMap((log) => {
    const rawLang = log.language as string | undefined;
    if (rawLang && rawLang !== 'en') return [];
    if (!rawLang && log.deckId !== 'all' && !keptDeckIds.has(log.deckId)) return [];
    const { hskEdition: _edition, ...rest } = log as StudySessionLog & { hskEdition?: unknown };
    return [{ ...rest, language: 'en' as const }];
  });

  let nextSettings: Partial<AppSettings> | undefined;
  if (state.settings) {
    const {
      hskEdition: _edition,
      showExamplePhonetic: _phonetic,
      studyLevels,
      speechVoices,
      ...restSettings
    } = state.settings as Partial<AppSettings> & { hskEdition?: unknown; showExamplePhonetic?: unknown };
    const cleanedVoices = cleanSpeechVoices(speechVoices as Record<string, string | undefined> | undefined);
    nextSettings = {
      ...INITIAL_SETTINGS,
      ...restSettings,
      ...(studyLevels?.en ? { studyLevels: { en: studyLevels.en } } : {}),
      ...(cleanedVoices ? { speechVoices: cleanedVoices } : {}),
    };
  }

  return {
    ...state,
    decks: library.decks,
    words: library.words,
    profile,
    logs,
    ...(nextSettings ? { settings: nextSettings } : {}),
    version: CURRENT_DATA_VERSION,
  };
}

export const INITIAL_PROFILE: UserProfile = {
  name: 'Học viên Largo',
  title: 'Học từ vựng mỗi ngày',
  bio: '',
  nativeLanguage: 'vi',
  targetLanguage: 'en',
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
  adaptivePlanner: false,
  speechRate: 1.0,
  autoPlayAudio: false,
  soundEnabled: true,
  soundVolume: 0.45,
  reminderEnabled: true,
  reminderHour: '20:00',
  retentionThreshold: 0.75,
};

export const INITIAL_LOGS: StudySessionLog[] = [];
