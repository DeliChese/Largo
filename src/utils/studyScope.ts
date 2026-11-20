import type { HskEdition, LanguageCode, VocabDeck, VocabWord } from '../types/vocab';

interface StudyLevel {
  id: string;
  label: string;
}

const ALL_LEVELS: StudyLevel = { id: 'all', label: 'Tất cả cấp độ' };
const CUSTOM_LEVEL: StudyLevel = { id: 'custom', label: 'Bộ cá nhân' };
const BUILTIN_LEVELS: Partial<Record<LanguageCode, StudyLevel[]>> = {
  en: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }, { id: 'b1', label: 'B1' }],
};

export function getStudyLanguages(decks: readonly VocabDeck[]): LanguageCode[] {
  return [...new Set<LanguageCode>(['zh', 'en', ...decks.map((deck) => deck.language)])];
}

export function getDeckStudyLevel(deck: VocabDeck): string {
  const declaredLevel = deck.level?.trim();
  if (declaredLevel) return declaredLevel.toLowerCase().replace(/^hsk\s+/, 'hsk');

  // Older decks store their level in the category, such as "HSK 1 · Chủ đề 1".
  const category = deck.category.trim();
  const prefix = category.match(/^(hsk\s*\d+|[abc][12]|n[1-5])\b/i)?.[0];
  return prefix ? prefix.toLowerCase().replace(/\s+/g, '') : CUSTOM_LEVEL.id;
}

function levelLabel(id: string): string {
  if (id === 'legacy') return 'Bộ từ trước đây';
  if (/^hsk\d+$/.test(id)) return 'HSK ' + id.slice(3);
  if (/^(?:[abc][12]|n[1-5])$/.test(id)) return id.toUpperCase();
  return id === CUSTOM_LEVEL.id ? CUSTOM_LEVEL.label : id;
}

export function getStudyLevels(language: LanguageCode, decks: readonly VocabDeck[] = []): StudyLevel[] {
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

export function getEditionDecks(decks: readonly VocabDeck[], language: LanguageCode, edition: HskEdition): VocabDeck[] {
  return decks.filter((deck) => deck.language === language && (language !== 'zh' || deck.isCustom || deck.hskEdition === edition));
}

export function getScopedWords(words: readonly VocabWord[], scopedDecks: readonly VocabDeck[], language: LanguageCode): VocabWord[] {
  const deckIds = new Set(scopedDecks.map((deck) => deck.id));
  const directWords = words.filter((word) => word.language === language && deckIds.has(word.deckId));
  if (!scopedDecks.some((deck) => deck.wordIds)) return directWords;

  // Lesson membership is a view of the same cards. Reviews are saved against the shared word ID.
  const byId = new Map(words.filter((word) => word.language === language).map((word) => [word.id, word]));
  const assigned = new Set<string>();
  const lessons = scopedDecks.flatMap((deck) => (deck.wordIds ?? []).flatMap((id) => {
    const word = byId.get(id);
    if (!word || assigned.has(id)) return [];
    assigned.add(id);
    return [{ ...word, deckId: deck.id }];
  }));
  return [...lessons, ...directWords.filter((word) => !assigned.has(word.id))];
}
