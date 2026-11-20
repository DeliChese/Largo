import type { CollocationItem, ExampleSentence, VocabDeck, VocabWord } from '../src/types/vocab';
import {
  LEGACY_DECK_ID_MAP,
  LEGACY_WORD_ID_MAP,
  V1_CHINESE_WORD_IDS,
  V4_CHINESE_WORD_IDS,
} from '../src/data/seedMigration';
import catalogue from './chineseVocabulary.json' with { type: 'json' };

interface CatalogueCard {
  id: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  sinoVietnamese?: string;
  radical?: string;
  collocations?: CollocationItem[];
  examples?: ExampleSentence[];
  synonyms?: string[];
  notes?: string;
  hskLevel?: number;
  hskId?: number;
  a1000Id?: number;
}

interface CatalogueDeck {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  cards: CatalogueCard[];
}

const NOW = Date.now();
const DECKS_DATA = catalogue as CatalogueDeck[];

export const CHINESE_DECKS: VocabDeck[] = DECKS_DATA.map((topic) => ({
  id: topic.id,
  name: topic.name,
  description: topic.description,
  category: topic.category,
  language: 'zh',
  level: topic.level,
  isCustom: false,
  createdAt: NOW,
}));

export const CHINESE_WORDS: VocabWord[] = DECKS_DATA.flatMap((topic) =>
  topic.cards.map((card): VocabWord => ({
    id: card.id,
    deckId: topic.id,
    language: 'zh',
    term: card.term,
    phonetic: card.phonetic,
    partOfSpeech: card.partOfSpeech,
    meaning: card.meaning,
    sinoVietnamese: card.sinoVietnamese,
    radical: card.radical,
    collocations: card.collocations ?? [],
    examples: card.examples ?? [],
    synonyms: card.synonyms ?? [],
    notes: card.notes,
    bloomLevel: 1,
    srs: {
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: NOW,
      lastReviewedAt: null,
    },
    createdAt: NOW,
  })),
);

const BUILTIN_DECK_IDS = new Set(CHINESE_DECKS.map(({ id }) => id));
const BUILTIN_WORD_IDS = new Set(CHINESE_WORDS.map(({ id }) => id));

function pickBetterWordProgress(current: VocabWord | undefined, candidate: VocabWord): VocabWord {
  if (!current) return candidate;
  const currentReviewed = current.srs.lastReviewedAt !== null;
  const candidateReviewed = candidate.srs.lastReviewedAt !== null;
  if (candidateReviewed !== currentReviewed) return candidateReviewed ? candidate : current;
  if (candidate.srs.repetitions !== current.srs.repetitions) {
    return candidate.srs.repetitions > current.srs.repetitions ? candidate : current;
  }
  return candidate.bloomLevel > current.bloomLevel ? candidate : current;
}

export function migrateChineseDeckId(deckId: string): string {
  return LEGACY_DECK_ID_MAP[deckId] ?? deckId;
}

export function migrateChineseWordId(wordId: string): string {
  return LEGACY_WORD_ID_MAP[wordId] ?? wordId;
}

export function resolveMigratedChineseDeckLevel(deckId: string): string | undefined {
  const mapped = migrateChineseDeckId(deckId);
  const match = mapped.match(/^deck-zh-(hsk\d+|everyday)-/);
  return match?.[1];
}

export function mergeChineseSeed(decks: VocabDeck[], words: VocabWord[], version: number) {
  const savedBuiltinWords = new Map<string, VocabWord>();
  const customOrOtherWords: VocabWord[] = [];

  for (const word of words) {
    if (word.language !== 'zh') {
      customOrOtherWords.push(word);
      continue;
    }
    const mappedId = migrateChineseWordId(word.id);
    if (BUILTIN_WORD_IDS.has(mappedId)) {
      savedBuiltinWords.set(mappedId, pickBetterWordProgress(savedBuiltinWords.get(mappedId), word));
    } else {
      const mappedDeckId = migrateChineseDeckId(word.deckId);
      customOrOtherWords.push(
        mappedDeckId === word.deckId ? word : { ...word, deckId: mappedDeckId },
      );
    }
  }

  const remainingDecks = decks.filter((deck) => {
    if (deck.language !== 'zh') return true;
    if (BUILTIN_DECK_IDS.has(deck.id)) return false;
    if (deck.id in LEGACY_DECK_ID_MAP) return false;
    return deck.isCustom;
  });

  const priorBuiltinIds = version < 3 ? V1_CHINESE_WORD_IDS : V4_CHINESE_WORD_IDS;

  const updatedChineseWords = CHINESE_WORDS.flatMap((word) => {
    const saved = savedBuiltinWords.get(word.id);
    if (!saved) {
      // Respect deletions of words that existed in the user's prior version, while introducing newly added cards.
      return priorBuiltinIds.has(word.id) ? [] : [word];
    }
    return [{
      ...word,
      createdAt: saved.createdAt,
      srs: saved.srs,
      bloomLevel: saved.bloomLevel,
      lastSynthesisAt: saved.lastSynthesisAt,
    }];
  });

  return {
    decks: [
      ...remainingDecks.filter((deck) => deck.isCustom),
      ...CHINESE_DECKS,
      ...remainingDecks.filter((deck) => !deck.isCustom),
    ],
    words: [
      ...customOrOtherWords,
      ...updatedChineseWords,
    ],
  };
}
