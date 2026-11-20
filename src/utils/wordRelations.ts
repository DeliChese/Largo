import type { LexicalRelations, VocabWord } from '../types/vocab';

export function combineTerms(...lists: (readonly string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  return lists.flatMap((list) => (list ?? []).filter((term) => {
    const key = term.normalize('NFC').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}

export function getWordRelations(word: Pick<VocabWord, 'synonyms' | 'antonyms' | 'personalRelations'>): LexicalRelations {
  return {
    synonyms: combineTerms(word.synonyms, word.personalRelations?.synonyms),
    antonyms: combineTerms(word.antonyms, word.personalRelations?.antonyms),
  };
}
