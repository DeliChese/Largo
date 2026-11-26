import type { WordFamilyItem } from '../types/vocab';

interface WordFamilyListProps {
  items: readonly WordFamilyItem[];
  headword: string;
  onInspectTerm: (term: string) => void;
}

export function WordFamilyList({ items, headword, onInspectTerm }: WordFamilyListProps) {
  if (!items.length) return null;

  return (
    <div className="deck-usage word-family-section">
      <h4>Gia đình từ</h4>
      <div className="word-family-chips" role="list" aria-label={`Gia đình từ của ${headword}`}>
        {items.map((member) => (
          <button
            key={member.term}
            type="button"
            role="listitem"
            className="word-family-chip"
            title={member.meaning
              ? `${member.term} (${member.partOfSpeech}): ${member.meaning} — Bấm để xem chi tiết & ví dụ`
              : `Bấm để xem chi tiết và ví dụ cho ${member.term} (${member.partOfSpeech})`}
            onClick={() => onInspectTerm(member.term)}
          >
            <span className="word-family-term" lang="en">{member.term}</span>
            <span className="word-family-pos">{member.partOfSpeech}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
