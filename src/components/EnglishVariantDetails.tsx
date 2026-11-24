import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { EnglishLocale, VocabWord } from '../types/vocab';
import { ENGLISH_LOCALES, ENGLISH_LOCALE_LABEL, getEnglishStudyWord } from '../utils/englishStudy';
import { speakLocalPronunciation, speakPronunciation } from '../utils/soundEngine';

interface EnglishPronunciationProps {
  text: string;
  speechRate: number;
  forms?: Partial<Record<EnglishLocale, { term?: string; phonetic?: string }>>;
  label?: string;
  offlineOnly?: boolean;
}

export function EnglishPronunciation({ text, speechRate, forms, label, offlineOnly }: EnglishPronunciationProps) {
  const [unavailable, setUnavailable] = useState<EnglishLocale>();
  const status = unavailable && (offlineOnly
    ? `Thiết bị chưa có giọng ${ENGLISH_LOCALE_LABEL[unavailable]}.`
    : `Chưa phát được giọng ${ENGLISH_LOCALE_LABEL[unavailable]}. Kiểm tra giọng trên thiết bị hoặc Azure Speech trong Cài đặt.`);
  return (
    <div className="english-variants" role="group" aria-label={label ?? 'Giọng đọc tiếng Anh'}>
      {ENGLISH_LOCALES.map((locale) => {
        const form = forms?.[locale];
        const spokenText = form?.term ?? text;
        const accent = ENGLISH_LOCALE_LABEL[locale];
        return (
          <button key={locale} type="button" className="english-variant"
            onClick={() => {
              setUnavailable(undefined);
              if (offlineOnly) {
                if (!speakLocalPronunciation(spokenText, locale, speechRate)) setUnavailable(locale);
              } else {
                speakPronunciation(spokenText, locale, speechRate, undefined, undefined, undefined, () => setUnavailable(locale));
              }
            }} aria-label={`Nghe ${label ?? spokenText} (${accent})`}>
            <span>{accent}</span>
            {form?.term && form.term !== text && <strong lang={locale}>{spokenText}</strong>}
            {form?.phonetic && <span className="font-mono">{form.phonetic}</span>}
            <Volume2 size={13} aria-hidden="true" />
          </button>
        );
      })}
      {status && <p className="english-audio-status" role="status">{status}</p>}
    </div>
  );
}

export function EnglishVariantDetails({ word, speechRate }: { word: VocabWord; speechRate: number }) {
  if (word.language !== 'en') return null;
  const british = getEnglishStudyWord(word, 'en-GB');
  const american = getEnglishStudyWord(word, 'en-US');
  return <EnglishPronunciation text={word.term} speechRate={speechRate} forms={{
    'en-GB': { term: british.term, phonetic: word.englishForms?.['en-GB']?.phonetic },
    'en-US': { term: american.term, phonetic: word.englishForms?.['en-US']?.phonetic },
  }} />;
}
