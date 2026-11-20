import type { CollocationItem, EnglishWordForms, ExampleSentence } from '../types/vocab';
import { ENGLISH_LOCALES } from './englishStudy';

export const trimImportText = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function importCollocations(items: CollocationItem[] | undefined): CollocationItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.flatMap((entry) => {
    const phrase = trimImportText(entry?.phrase);
    return phrase ? [{ phrase, meaning: trimImportText(entry?.meaning) }] : [];
  });
}

export function importExamples(items: ExampleSentence[] | undefined): ExampleSentence[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.flatMap((entry) => {
    const sentence = trimImportText(entry?.sentence);
    const phonetic = trimImportText(entry?.phonetic);
    return sentence ? [{ sentence, translation: trimImportText(entry?.translation), ...(phonetic && { phonetic }) }] : [];
  });
}

export function importEnglishForms(input: EnglishWordForms | undefined): EnglishWordForms | undefined {
  const forms: EnglishWordForms = {};
  for (const locale of ENGLISH_LOCALES) {
    const form = input?.[locale];
    if (!form || typeof form !== 'object') continue;
    const term = trimImportText(form.term);
    const phonetic = trimImportText(form.phonetic);
    const collocations = importCollocations(form.collocations);
    const examples = importExamples(form.examples);
    if (term || phonetic || examples || collocations) {
      forms[locale] = {
        ...(term && { term }),
        ...(phonetic && { phonetic }),
        ...(collocations && { collocations }),
        ...(examples && { examples }),
      };
    }
  }
  return Object.keys(forms).length ? forms : undefined;
}
