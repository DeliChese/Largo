import { Volume2 } from 'lucide-react';
import type { VocabWord } from '../types/vocab';
import { ENGLISH_LOCALES, ENGLISH_LOCALE_LABEL } from '../utils/englishStudy';
import { speakPronunciation } from '../utils/soundEngine';

export function EnglishVariantDetails({ word, speechRate }: { word: VocabWord; speechRate: number }) {
  if (word.language !== 'en' || !word.englishForms) return null;
  const forms = word.englishForms;
  if (!ENGLISH_LOCALES.every((locale) => forms[locale]?.term || forms[locale]?.phonetic)) return null;
  return (
    <div className="english-variants" aria-label="So sánh Anh-Anh và Anh-Mỹ">
      {ENGLISH_LOCALES.map((locale) => {
        const form = forms[locale]!;
        const term = form.term ?? word.term;
        const label = ENGLISH_LOCALE_LABEL[locale];
        return (
          <button key={locale} type="button" className="english-variant"
            onClick={() => speakPronunciation(term, locale, speechRate)} aria-label={`Nghe ${term} (${label})`}>
            <span>{label}</span>
            {form.term && <strong lang={locale}>{term}</strong>}
            {form.phonetic && <span className="font-mono">{form.phonetic}</span>}
            <Volume2 size={13} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
