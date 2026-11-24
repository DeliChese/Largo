import type { ExampleSentence, LanguageCode } from '../types/vocab';

export const EMPTY_EXAMPLES: readonly [ExampleSentence, ExampleSentence] = [
  { sentence: '', translation: '' },
  { sentence: '', translation: '' },
];

interface ExampleFieldsProps {
  values: readonly ExampleSentence[];
  onChange: (examples: ExampleSentence[]) => void;
  language: LanguageCode;
  sample?: ExampleSentence;
}

export function ExampleFields({ values, onChange, language, sample }: ExampleFieldsProps) {
  return (
    <fieldset className="word-form-examples">
      {values.map((example, index) => {
        const update = (patch: Partial<ExampleSentence>) => onChange(
          values.map((value, position) => position === index ? { ...value, ...patch } : value),
        );
        return (
          <div className="word-form-example" key={index}>
            <label className="control-field">
              <span>Câu ví dụ {index + 1}</span>
              <input lang={language} value={example.sentence} placeholder={index === 0 ? sample?.sentence : undefined}
                onChange={(event) => update({ sentence: event.target.value })} />
            </label>
            <label className="control-field">
              <span>Dịch câu {index + 1}</span>
              <input value={example.translation} placeholder={index === 0 ? sample?.translation : undefined}
                onChange={(event) => update({ translation: event.target.value })} />
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}

export interface RelationDraft {
  synonyms: string;
  antonyms: string;
}

export const EMPTY_RELATIONS: RelationDraft = { synonyms: '', antonyms: '' };

export function RelationFields({ value, onChange }: { value: RelationDraft; onChange: (value: RelationDraft) => void }) {
  return (
    <fieldset className="word-form-relations">
      <label className="control-field">
        <span>Đồng nghĩa</span>
        <input value={value.synonyms} onChange={(event) => onChange({ ...value, synonyms: event.target.value })}
          placeholder="Phân cách bằng dấu phẩy" />
      </label>
      <label className="control-field">
        <span>Trái nghĩa</span>
        <input value={value.antonyms} onChange={(event) => onChange({ ...value, antonyms: event.target.value })}
          placeholder="Phân cách bằng dấu phẩy" />
      </label>
    </fieldset>
  );
}
