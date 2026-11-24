import type { EnglishLocale, LanguageCode, SpeechVoices, VocabWord } from '../types/vocab';

export const ENGLISH_LOCALES = ['en-GB', 'en-US'] as const;
export const DEFAULT_ENGLISH_LOCALE: EnglishLocale = 'en-US';
export const ENGLISH_COLLOCATION_POS = 'Collocation';
export const ENGLISH_LOCALE_LABEL: Record<EnglishLocale, string> = {
  'en-GB': 'Anh–Anh',
  'en-US': 'Anh–Mỹ',
};

export function getSpeechVoice(voices: SpeechVoices | undefined, language: LanguageCode, locale = DEFAULT_ENGLISH_LOCALE) {
  if (language !== 'en') return voices?.[language];
  const voice = voices?.[locale];
  if (voice?.startsWith(locale + '-')) return voice;
  const legacy = voices?.en;
  return legacy?.startsWith(locale + '-') ? legacy : undefined;
}

export function getEnglishStudyWord(word: VocabWord, locale: EnglishLocale): VocabWord {
  const forms = word.englishForms;
  if (word.language !== 'en' || !forms) return word;
  const form = forms[locale];
  const term = form?.term ?? word.term;
  const termChanged = term !== word.term;
  const hasRegionalPhonetic = ENGLISH_LOCALES.some((region) => forms[region]?.phonetic);
  return {
    ...word,
    term,
    phonetic: form?.phonetic ?? (hasRegionalPhonetic || termChanged ? '' : word.phonetic),
    collocations: form?.collocations ?? (termChanged ? [] : word.collocations),
    examples: form?.examples ?? (termChanged ? [] : word.examples),
  };
}

export function cambridgeLookupUrl(term: string) {
  return 'https://dictionary.cambridge.org/search/english/direct/?q=' + encodeURIComponent(term);
}
