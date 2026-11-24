import { ENGLISH_V7_WORD_DECK_IDS } from '../../data/englishDecks';
import { CURRENT_DATA_VERSION, INITIAL_DECKS, INITIAL_PROFILE, INITIAL_SETTINGS, INITIAL_WORDS } from '../../data/seedVocab';
import type { EnglishLocale, StudySessionLog, VocabDeck, VocabWord } from '../../types/vocab';
import type { PersistedAppState } from '../offlineStorage';
import { createInitialSRS } from '../srsBloom';

const DAY = 86_400_000;
export const SNAPSHOT_TIME = Date.UTC(2026, 0, 10, 10);
const CREATED_AT = SNAPSHOT_TIME - 30 * DAY;
const REVIEWED_AT = SNAPSHOT_TIME - 3 * DAY;

export const CORE_ENGLISH_CARD = 'en-vocab-did';
export const DELETED_ENGLISH_CARD = 'deck-en-a1-everyday-menu';
export const REGIONAL_CARD = 'en-regional-color';
export const MISSING_LESSON = 'deck-en-a1-regional';

export const PERSONAL_DECK: VocabDeck = {
  id: 'fixture-deck',
  name: 'Từ của mình',
  description: '',
  language: 'en',
  category: 'Cá nhân',
  level: 'custom',
  isCustom: true,
  createdAt: CREATED_AT,
};

export const PERSONAL_CARD: VocabWord = {
  id: 'fixture-card',
  deckId: PERSONAL_DECK.id,
  term: 'observatory',
  phonetic: '/əbˈzɜːvətri/',
  partOfSpeech: 'noun',
  meaning: 'đài thiên văn',
  language: 'en',
  collocations: [],
  synonyms: [],
  antonyms: [],
  examples: [{ sentence: 'We visited the observatory.', translation: 'Chúng tôi đã đến thăm đài thiên văn.' }],
  notes: 'Ghi chú mẫu',
  bloomLevel: 1,
  srs: createInitialSRS(CREATED_AT),
  createdAt: CREATED_AT,
};

export const FIXTURE_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const REVIEWED_SRS: VocabWord['srs'] = {
  easeFactor: 2.3,
  intervalDays: 3,
  repetitions: 4,
  lapses: 1,
  nextReviewAt: SNAPSHOT_TIME,
  lastReviewedAt: REVIEWED_AT,
  firstReviewedAt: SNAPSHOT_TIME - 20 * DAY,
  lastIntensiveAt: SNAPSHOT_TIME - DAY,
};

export function newStudySnapshot(): PersistedAppState {
  // Keep fixture clocks fixed even when the catalogue is created at module load.
  return {
    version: CURRENT_DATA_VERSION,
    savedAt: SNAPSHOT_TIME,
    decks: INITIAL_DECKS.map((deck) => ({ ...deck, createdAt: CREATED_AT })),
    words: INITIAL_WORDS.map((word) => ({ ...word, createdAt: CREATED_AT, srs: createInitialSRS(CREATED_AT) })),
    logs: [],
    profile: { ...INITIAL_PROFILE },
    settings: { ...INITIAL_SETTINGS },
  };
}

export function reviewedStudySnapshot(englishLocale: EnglishLocale = 'en-GB'): PersistedAppState {
  const fresh = newStudySnapshot();
  const logs = Array.from({ length: 128 }, (_, index): StudySessionLog => ({
    id: `fixture-session-${index}`,
    timestamp: REVIEWED_AT - index * 300_000,
    mode: 'guided',
    deckId: index % 2 === 0 ? 'deck-en-a1-everyday' : MISSING_LESSON,
    language: 'en',
    level: 'a1',
    wordsReviewed: 4,
    correctCount: 3,
    xpEarned: 12,
    durationSeconds: 60,
  }));
  return {
    ...fresh,
    decks: [...fresh.decks, PERSONAL_DECK],
    words: [
      ...fresh.words.filter(({ id }) => id !== DELETED_ENGLISH_CARD).map((word): VocabWord => {
        if (word.id !== CORE_ENGLISH_CARD && word.id !== REGIONAL_CARD) return word;
        return {
          ...word,
          srs: { ...REVIEWED_SRS },
          bloomLevel: 4,
          lastSynthesisAt: REVIEWED_AT,
          personalRelations: { synonyms: ['liên hệ mẫu'], antonyms: [] },
        };
      }),
      PERSONAL_CARD,
    ],
    logs,
    profile: {
      ...fresh.profile,
      name: 'Học viên mẫu',
      xp: 1_536,
      streakDays: 3,
      longestStreak: 5,
      lastStudyDate: '2026-01-10',
      todayWordsCount: 2,
      todayWordIds: [CORE_ENGLISH_CARD, REGIONAL_CARD],
    },
    settings: {
      ...fresh.settings,
      englishLocale,
      studyLevels: { en: 'a1' },
      dailyNewWordLimit: 6,
      theme: 'botanical',
    },
  };
}

export function studySnapshotMissingLesson(): PersistedAppState {
  const saved = reviewedStudySnapshot();
  return { ...saved, decks: saved.decks.filter(({ id }) => id !== MISSING_LESSON) };
}

export function legacyStudyBackup() {
  const { savedAt: _savedAt, ...saved } = reviewedStudySnapshot();
  const legacyEnglishDecks = new Set(ENGLISH_V7_WORD_DECK_IDS.values());
  return {
    ...saved,
    version: 7,
    decks: saved.decks.filter(({ isCustom, id }) => isCustom || legacyEnglishDecks.has(id)),
    words: saved.words.flatMap((word) => {
      if (word.id === PERSONAL_CARD.id) return [word];
      const oldDeckId = ENGLISH_V7_WORD_DECK_IDS.get(word.id);
      return oldDeckId ? [{ ...word, deckId: oldDeckId }] : [];
    }),
    exportedAt: new Date(SNAPSHOT_TIME).toISOString(),
    profileImages: { avatar: FIXTURE_AVATAR },
  };
}
