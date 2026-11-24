import type { LanguageCode, VocabDeck, VocabWord } from '../types/vocab';

interface StudyLevel {
  id: string;
  label: string;
}

const ALL_LEVELS: StudyLevel = { id: 'all', label: 'Tất cả cấp độ' };
const CUSTOM_LEVEL: StudyLevel = { id: 'custom', label: 'Bộ cá nhân' };
const BUILTIN_LEVELS: Partial<Record<LanguageCode, StudyLevel[]>> = {
  en: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }, { id: 'b1', label: 'B1' }, { id: 'b2', label: 'B2' }],
};

export function getStudyLanguages(decks: readonly VocabDeck[]): LanguageCode[] {
  return [...new Set<LanguageCode>(['en', ...decks.map((deck) => deck.language)])];
}

export function getDeckStudyLevel(deck: VocabDeck): string {
  const declaredLevel = deck.level?.trim();
  if (declaredLevel) return declaredLevel.toLowerCase();

  const category = deck.category.trim();
  const prefix = category.match(/^([abc][12])\b/i)?.[0];
  return prefix ? prefix.toLowerCase() : CUSTOM_LEVEL.id;
}

function levelLabel(id: string): string {
  if (id === 'legacy') return 'Bộ từ trước đây';
  if (id === 'phrasal') return 'Chuyên đề';
  if (/^[abc][12]$/.test(id)) return id.toUpperCase();
  return id === CUSTOM_LEVEL.id ? CUSTOM_LEVEL.label : id;
}

export function getStudyLevels(language: LanguageCode = 'en', decks: readonly VocabDeck[] = []): StudyLevel[] {
  const levels = new Map((BUILTIN_LEVELS[language] ?? []).map((level) => [level.id, level]));
  for (const deck of decks) {
    if (deck.language !== language) continue;
    const id = getDeckStudyLevel(deck);
    if (id !== ALL_LEVELS.id && !levels.has(id)) levels.set(id, { id, label: levelLabel(id) });
  }
  return [ALL_LEVELS, ...levels.values()];
}

export function getScopedDecks(decks: readonly VocabDeck[], language: LanguageCode, level: string): VocabDeck[] {
  return decks.filter((deck) =>
    deck.language === language && (level === ALL_LEVELS.id || getDeckStudyLevel(deck) === level),
  );
}

export function getScopedWords(words: readonly VocabWord[], scopedDecks: readonly VocabDeck[], language: LanguageCode = 'en'): VocabWord[] {
  const deckIds = new Set(scopedDecks.map((deck) => deck.id));
  const directWords = words.filter((word) => word.language === language && deckIds.has(word.deckId));
  if (!scopedDecks.some((deck) => deck.wordIds)) return directWords;

  // Lesson membership is a view of the same cards. Reviews are saved against the shared word ID.
  const byId = new Map(words.filter((word) => word.language === language).map((word) => [word.id, word]));
  const directIds = new Set(directWords.map((word) => word.id));
  const assigned = new Set<string>();
  const lessons = scopedDecks.flatMap((deck) => (deck.wordIds ?? []).flatMap((id) => {
    const word = byId.get(id);
    if (!word || assigned.has(id) || (deck.isCustom && word.deckId !== deck.id && directIds.has(id))) return [];
    assigned.add(id);
    return [{ ...word, deckId: deck.id }];
  }));
  return [...lessons, ...directWords.filter((word) => !assigned.has(word.id))];
}
