import type { VocabWord } from '../types/vocab';
import { getWordRelations } from '../utils/wordRelations';

export function WordRelations({ word }: { word: Pick<VocabWord, 'language' | 'synonyms' | 'antonyms' | 'personalRelations'> }) {
  const { synonyms, antonyms } = getWordRelations(word);
  if (!synonyms.length && !antonyms.length) return null;

  return (
    <dl className="word-relations">
      {synonyms.length > 0 && <div><dt>Đồng nghĩa</dt><dd lang={word.language}>{synonyms.join(' · ')}</dd></div>}
      {antonyms.length > 0 && <div><dt>Trái nghĩa</dt><dd lang={word.language}>{antonyms.join(' · ')}</dd></div>}
    </dl>
  );
}
