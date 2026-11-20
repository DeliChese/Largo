import type { CollocationItem, ExampleSentence, VocabDeck, VocabWord } from '../src/types/vocab';
import {
  LEGACY_DECK_ID_MAP,
  LEGACY_WORD_ID_MAP,
  V1_CHINESE_WORD_IDS,
  V4_CHINESE_WORD_IDS,
} from '../src/data/seedMigration';
import catalogue from './chineseVocabulary.json' with { type: 'json' };
import { HSK_EDITIONS, HSK1_COURSES } from './hsk1Courses';

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
const SUPPLEMENT_SOURCE = 'deck-zh-textbook-supplements';
const priorDecks = new Map(DECKS_DATA.map((deck) => [deck.id, deck]));
const v5WordIds = new Set(DECKS_DATA.filter((deck) => deck.id !== SUPPLEMENT_SOURCE)
  .flatMap((deck) => deck.cards.map(({ id }) => id)));

const cardsByTerm = new Map<string, CatalogueCard[]>();
for (const deck of DECKS_DATA) {
  for (const card of deck.cards) {
    const matches = cardsByTerm.get(card.term);
    if (matches) matches.push(card);
    else cardsByTerm.set(card.term, [card]);
  }
}

function resolveLessonWordId(selector: string): string {
  const [term, hskId] = selector.split('@');
  const matches = (cardsByTerm.get(term) ?? []).filter((card) => !hskId || card.hskId === Number(hskId));
  if (matches.length !== 1) throw new Error(`Expected one Chinese card for ${selector}, got ${matches.length}`);
  return matches[0].id;
}

export const CHINESE_DECKS: VocabDeck[] = HSK_EDITIONS.flatMap(({ id: edition }) =>
  HSK1_COURSES[edition].lessons.map((lesson, index): VocabDeck => ({
    id: `deck-zh-${edition}-hsk1-l${String(index + 1).padStart(2, '0')}`,
    name: `Bài ${index + 1} · ${lesson.title}`,
    description: lesson.description,
    category: lesson.topic,
    language: 'zh',
    level: 'hsk1',
    hskEdition: edition,
    wordIds: lesson.terms.map(resolveLessonWordId),
    isCustom: false,
    createdAt: NOW,
  })),
);

const courseDeckByWordId = new Map(CHINESE_DECKS.flatMap((deck) =>
  (deck.wordIds ?? []).map((id) => [id, deck.id] as const),
));

export const CHINESE_WORDS: VocabWord[] = DECKS_DATA.flatMap((topic) =>
  topic.cards.map((card): VocabWord => ({
    id: card.id,
    deckId: courseDeckByWordId.get(card.id) ?? topic.id,
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
export const CHINESE_COURSE_WORDS = CHINESE_WORDS.filter(({ id }) => courseDeckByWordId.has(id));

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

  const remainingDecks = decks.filter((deck) => deck.language !== 'zh' || deck.isCustom);
  const availableDeckIds = new Set([...BUILTIN_DECK_IDS, ...remainingDecks.map(({ id }) => id)]);
  const previousDecks = new Map(decks.map((deck) => [migrateChineseDeckId(deck.id), deck]));
  for (const word of customOrOtherWords) {
    if (word.language !== 'zh' || availableDeckIds.has(word.deckId)) continue;
    const previous = previousDecks.get(word.deckId);
    const source = previous ?? priorDecks.get(word.deckId);
    remainingDecks.push({
      id: word.deckId,
      name: source?.name ?? 'Từ đã thêm',
      description: source?.description ?? '',
      language: 'zh',
      category: 'Cá nhân',
      level: 'custom',
      isCustom: true,
      createdAt: previous?.createdAt ?? word.createdAt,
    });
    availableDeckIds.add(word.deckId);
  }

  const priorBuiltinIds = version < 3 ? V1_CHINESE_WORD_IDS : version < 5 ? V4_CHINESE_WORD_IDS : v5WordIds;

  const updatedChineseWords = CHINESE_WORDS.flatMap((word) => {
    const saved = savedBuiltinWords.get(word.id);
    if (!saved) {
      // Add the course's new cards and respect deliberate deletions of existing cards.
      return priorBuiltinIds.has(word.id) || !courseDeckByWordId.has(word.id) ? [] : [word];
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
    decks: [...CHINESE_DECKS, ...remainingDecks],
    words: [
      ...customOrOtherWords,
      ...updatedChineseWords,
    ],
  };
}
