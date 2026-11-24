import type { ExampleSentence } from '../types/vocab';
import { EnglishPronunciation } from './EnglishVariantDetails';

interface WordExamplesProps {
  examples: readonly ExampleSentence[];
  speechRate?: number;
  startAt?: number;
}

export function WordExamples({ examples, speechRate = 1, startAt = 1 }: WordExamplesProps) {
  if (!examples.length) return null;

  return (
    <ol className="word-examples" start={startAt}>
      {examples.map(({ sentence, translation, sourceUrl }, index) => (
        <li className="word-example" key={index}>
          <div>
            <p lang="en">{sentence}</p>
            {translation && <p className="word-example-translation">{translation}</p>}
            {sourceUrl && <a className="word-example-source" href={sourceUrl} target="_blank" rel="noreferrer">Nguồn câu</a>}
          </div>
          <EnglishPronunciation text={sentence} speechRate={speechRate} label={`ví dụ ${startAt + index}`} />
        </li>
      ))}
    </ol>
  );
}
