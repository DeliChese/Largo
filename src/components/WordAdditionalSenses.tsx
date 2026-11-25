import type { VocabWord } from '../types/vocab';
import { WordExamples } from './WordExamples';

/** Additional senses are displayed for reference, never mixed into the primary recall examples. */
export function WordAdditionalSenses({ word, speechRate = 1 }: { word: VocabWord; speechRate?: number }) {
  if (!word.additionalSenses?.length) return null;

  return (
    <section className="deck-usage" aria-label="Nghĩa bổ sung theo từ loại">
      <h4>Nghĩa và từ loại khác</h4>
      <p>Tham khảo thêm · đáp án ôn tập vẫn là nghĩa chính.</p>
      {word.additionalSenses.map((sense, index) => (
        <div className="deck-usage" key={index}>
          <p><strong>{sense.partOfSpeech}</strong>{sense.phonetic && ` · ${sense.phonetic}`}</p>
          <p><strong>{sense.meaning}</strong></p>
          {sense.notes && <p>{sense.notes}</p>}
          <WordExamples examples={sense.examples} speechRate={speechRate} />
        </div>
      ))}
    </section>
  );
}
