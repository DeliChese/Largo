import type { VocabDeck, VocabWord } from '../types/vocab';
import { chainEnds, normalizeChainTerm } from './wordChainRules.mjs';

export type ChainLanguage = 'en' | 'zh';
export type ChainMode = 'word' | 'mixed';
export type ChainDifficulty = keyof typeof CHAIN_DIFFICULTIES;

export const CHAIN_DIFFICULTIES = {
  easy: { label: 'Dễ', seconds: 35, botDelay: 1_600 },
  normal: { label: 'Vừa', seconds: 25, botDelay: 1_100 },
  hard: { label: 'Khó', seconds: 15, botDelay: 650 },
  expert: { label: 'Cao thủ', seconds: 8, botDelay: 350 },
} as const;

export const CHAIN_AI_ATTEMPTS = 2;

export interface ChainEntry {
  term: string;
  meaning: string;
  wordId?: string;
  generated?: boolean;
}

interface IndexedEntry extends ChainEntry {
  key: string;
  first: string;
  last: string;
}

export function buildChainLexicon(words: readonly VocabWord[], language: ChainLanguage, mode: ChainMode) {
  const entries = new Map<string, IndexedEntry>();
  const byFirst = new Map<string, IndexedEntry[]>();

  const add = (term: string, meaning: string, wordId?: string) => {
    const key = normalizeChainTerm(term, language);
    if (!key || !meaning.trim() || entries.has(key) || (mode === 'word' && language === 'en' && key.includes(' '))) return;
    const entry = { term, meaning, wordId, key, ...chainEnds(key) };
    entries.set(key, entry);
    const group = byFirst.get(entry.first) ?? [];
    group.push(entry);
    byFirst.set(entry.first, group);
  };

  const sameLanguage = words.filter((word) => word.language === language);
  for (const word of sameLanguage) add(word.term, word.meaning, word.id);
  if (mode === 'mixed') {
    for (const word of sameLanguage) {
      for (const { phrase, meaning } of word.collocations) add(phrase, meaning);
    }
  }
  const canStart = [...entries.values()].some(({ first, last }) =>
    (byFirst.get(last)?.length ?? 0) > Number(first === last));
  return { entries, byFirst, canStart };
}

export function checkChainMove(
  input: string, language: ChainLanguage, first: string, used: ReadonlySet<string>,
  lexicon: ReturnType<typeof buildChainLexicon>,
) {
  const key = normalizeChainTerm(input, language);
  if (chainEnds(key).first !== first) return { error: 'first' } as const;
  if (used.has(key)) return { error: 'repeat' } as const;
  const entry = lexicon.entries.get(key);
  return entry ? { entry } : { error: 'unknown' } as const;
}

export function chooseChainMove(
  lexicon: ReturnType<typeof buildChainLexicon>, first: string, used: ReadonlySet<string>,
  difficulty: ChainDifficulty, random = Math.random,
) {
  if (!first && !lexicon.canStart) return undefined;
  const options = first ? lexicon.byFirst.get(first) ?? [] : [...lexicon.entries.values()];
  const available = new Map<string, number>();
  for (const [letter, entries] of lexicon.byFirst) {
    available.set(letter, entries.filter(({ key }) => !used.has(key)).length);
  }
  const candidates = options.filter(({ key }) => !used.has(key)).map((entry) => ({
    entry,
    replies: (available.get(entry.last) ?? 0) - Number(entry.first === entry.last),
  }));
  const playable = candidates.filter(({ replies }) => replies > 0);
  const pool = (first && difficulty === 'expert') || !playable.length ? candidates : playable;
  const length = (entry: IndexedEntry) => Array.from(entry.key).length;
  if (!first || difficulty === 'easy') {
    pool.sort((a, b) => b.replies - a.replies || length(a.entry) - length(b.entry));
  } else if (difficulty !== 'normal') {
    pool.sort((a, b) => a.replies - b.replies || length(b.entry) - length(a.entry));
  }
  const choiceCount = difficulty === 'normal' && first ? pool.length
    : difficulty === 'expert' && first ? 1 : Math.min(pool.length, 6);
  return pool[Math.floor(random() * choiceCount)]?.entry;
}

export const wordChainDeckId = (language: ChainLanguage) => `deck-custom-word-chain-${language}`;

export function addChainDeckEntry(
  decks: VocabDeck[], language: ChainLanguage, wordId: string | undefined, timestamp: number,
): VocabDeck[] {
  const id = wordChainDeckId(language);
  const existing = decks.find((deck) => deck.id === id);
  if (existing) {
    if (!wordId || existing.wordIds?.includes(wordId)) return decks;
    return decks.map((deck) => deck.id === id ? { ...deck, wordIds: [...deck.wordIds ?? [], wordId] } : deck);
  }
  return [...decks, {
    id, name: 'Đấu trường nối từ', description: 'Từ và cụm từ đã lưu khi đấu với bot.',
    language, category: 'Bộ cá nhân', isCustom: true, createdAt: timestamp,
    wordIds: wordId ? [wordId] : undefined,
  }];
}
