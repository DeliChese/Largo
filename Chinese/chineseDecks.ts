import type { CollocationItem, ExampleSentence, VocabDeck, VocabWord } from '../src/types/vocab';
import catalogue from './chineseVocabulary.json' with { type: 'json' };
import { HSK1_DECKS, HSK1_WORDS } from './hsk1Deck';
import { HSK2_DECKS, HSK2_WORDS } from './hsk2Deck';

interface CatalogueCard {
  id: string;
  term: string;
  phonetic: string;
  meaning: string;
  partOfSpeech?: string;
  notes?: string;
  collocations?: CollocationItem[];
  examples?: ExampleSentence[];
  hskLevel?: number;
  a1000Id?: number;
}

const NOW = Date.now();
const LEVELS = [
  { id: 'hsk1', hskLevel: 1, label: 'HSK 1', category: 'HSK 3.0' },
  { id: 'hsk2', hskLevel: 2, label: 'HSK 2', category: 'HSK 3.0' },
  { id: 'hsk3', hskLevel: 3, label: 'HSK 3', category: 'HSK 3.0' },
  { id: 'everyday', hskLevel: undefined, label: 'Giao tiếp', category: 'A1000' },
];

const oldDecks = [...HSK1_DECKS, ...HSK2_DECKS];
const oldWords = [...HSK1_WORDS, ...HSK2_WORDS];
const oldWordsById = new Map(oldWords.map((word) => [word.id, word]));

export const LEGACY_CHINESE_LEVELS = new Map([
  ...HSK1_DECKS.map((deck) => [deck.id, 'hsk1'] as const),
  ...HSK2_DECKS.map((deck) => [deck.id, 'hsk2'] as const),
]);

function legacyDeck(deck: VocabDeck): VocabDeck {
  return {
    ...deck,
    name: deck.name.replace(/^HSK [12] · /u, ''),
    category: 'Bộ từ trước đây',
    level: 'legacy',
  };
}

const topicDecks = LEVELS.flatMap((level) =>
  catalogue.flatMap((topic) => {
    const cards = topic.cards.filter((card: CatalogueCard) => card.hskLevel === level.hskLevel);
    if (!cards.length) return [];

    const deck: VocabDeck = {
      id: `deck-zh-${level.id}-${topic.id}`,
      name: `${level.label} · ${topic.name}`,
      description: topic.description,
      category: level.category,
      language: 'zh',
      level: level.id,
      isCustom: false,
      createdAt: NOW,
    };
    const words = cards.map((card: CatalogueCard): VocabWord => {
      const oldWord = oldWordsById.get(card.id);
      const collocations = [...(oldWord?.collocations ?? [])];
      for (const item of card.collocations ?? []) {
        if (!collocations.some(({ phrase }) => phrase === item.phrase)) collocations.push(item);
      }

      return {
        ...oldWord,
        id: card.id,
        deckId: deck.id,
        language: 'zh',
        term: card.term,
        phonetic: card.phonetic,
        meaning: card.meaning,
        partOfSpeech: card.partOfSpeech ?? oldWord?.partOfSpeech ?? '',
        notes: card.notes ?? oldWord?.notes,
        collocations,
        examples: card.examples ?? oldWord?.examples ?? [],
        synonyms: oldWord?.synonyms ?? [],
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
      };
    });
    return [{ deck, words }];
  }),
);

const importedDecks = topicDecks.map(({ deck }) => deck);
const importedWords = topicDecks.flatMap(({ words }) => words);
const importedDeckIds = new Set(importedDecks.map(({ id }) => id));
const importedWordIds = new Set(importedWords.map(({ id }) => id));
const versionThreeWordIds = new Set(catalogue.flatMap<string>((topic) =>
  topic.cards.filter((card: CatalogueCard) => card.hskLevel !== 3 || card.a1000Id !== undefined)
    .map(({ id }) => id),
));
const legacyOnlyWords = oldWords.filter(({ id }) => !importedWordIds.has(id));
const legacyOnlyDeckIds = new Set(legacyOnlyWords.map(({ deckId }) => deckId));

export const CHINESE_DECKS = [
  ...importedDecks,
  ...oldDecks.filter(({ id }) => legacyOnlyDeckIds.has(id)).map(legacyDeck),
];
export const CHINESE_WORDS = [...importedWords, ...legacyOnlyWords];

export function mergeChineseSeed(decks: VocabDeck[], words: VocabWord[], version: number) {
  const savedWords = new Map(words.map((word) => [word.id, word]));
  const remainingWords = words.filter(({ id }) => !importedWordIds.has(id));
  const remainingDeckIds = new Set(remainingWords.map(({ deckId }) => deckId));
  const remainingDecks = decks.flatMap((deck) => {
    if (importedDeckIds.has(deck.id)) return [];
    if (!LEGACY_CHINESE_LEVELS.has(deck.id)) return [deck];
    return remainingDeckIds.has(deck.id) ? [legacyDeck(deck)] : [];
  });

  const updatedWords = importedWords.flatMap((word) => {
    const saved = savedWords.get(word.id);
    if (!saved) {
      // Respect deletions from earlier libraries, including cards moved from A1000 to HSK 3.
      const existed = oldWordsById.has(word.id) || (version >= 3 && versionThreeWordIds.has(word.id));
      return existed ? [] : [word];
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
    decks: [...remainingDecks.filter((deck) => deck.isCustom), ...importedDecks, ...remainingDecks.filter((deck) => !deck.isCustom)],
    words: [...remainingWords.filter((word) => !LEGACY_CHINESE_LEVELS.has(word.deckId)),
      ...updatedWords, ...remainingWords.filter((word) => LEGACY_CHINESE_LEVELS.has(word.deckId))],
  };
}
