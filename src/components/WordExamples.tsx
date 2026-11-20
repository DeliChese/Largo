import { Volume2 } from 'lucide-react';
import type { ExampleSentence } from '../types/vocab';
import { stripTrailingPinyin } from '../utils/studyPlan';

interface WordExamplesProps {
  examples: readonly ExampleSentence[];
  language: string;
  showPhonetic: boolean;
  onSpeak: (sentence: string) => void;
  startAt?: number;
}

export function WordExamples({ examples, language, showPhonetic, onSpeak, startAt = 1 }: WordExamplesProps) {
  if (!examples.length) return null;

  return (
    <ol className="word-examples" start={startAt}>
      {examples.map(({ sentence, phonetic, translation, sourceUrl }, index) => {
        const display = /^zh(?:-|$)/.test(language) ? stripTrailingPinyin(sentence) : sentence;
        return (
          <li className="word-example" key={index}>
            <div>
              <p lang={language}>{display}</p>
              {showPhonetic && phonetic && <p className="example-phonetic">{phonetic}</p>}
              {translation && <p className="word-example-translation">{translation}</p>}
              {sourceUrl && <a className="word-example-source" href={sourceUrl} target="_blank" rel="noreferrer">Nguồn câu</a>}
            </div>
            <button type="button" className="icon-button" onClick={() => onSpeak(display)} aria-label={`Nghe ví dụ ${startAt + index}`}>
              <Volume2 size={16} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
