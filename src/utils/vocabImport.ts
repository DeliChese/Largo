import type { CollocationItem, DeckWordImport, EnglishWordForms, ExampleSentence, VocabWord } from '../types/vocab';
import { ENGLISH_LOCALES } from './englishStudy';
import { combineTerms, getWordRelations } from './wordRelations';

export const trimImportText = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function importTerms(value: unknown): string[] {
  const terms = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,;，、\n]/u) : [];
  return combineTerms(terms.map(trimImportText).filter(Boolean));
}

export function importCollocations(items: CollocationItem[] | undefined): CollocationItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.flatMap((entry) => {
    const phrase = trimImportText(entry?.phrase);
    return phrase ? [{ phrase, meaning: trimImportText(entry?.meaning) }] : [];
  });
}

export function importExamples(items: readonly ExampleSentence[] | undefined): ExampleSentence[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.flatMap((entry) => {
    const sentence = trimImportText(entry?.sentence);
    const phonetic = trimImportText(entry?.phonetic);
    const sourceUrl = trimImportText(entry?.sourceUrl);
    return sentence ? [{
      sentence,
      translation: trimImportText(entry?.translation),
      ...(phonetic && { phonetic }),
      ...(sourceUrl.startsWith('https://') && { sourceUrl }),
    }] : [];
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

export function exportDeckWord(word: VocabWord): DeckWordImport {
  return {
    term: word.term,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    meaning: word.meaning,
    notes: word.notes,
    collocation: word.collocations[0]?.phrase,
    collocationMeaning: word.collocations[0]?.meaning,
    example: word.examples[0]?.sentence,
    examplePhonetic: word.examples[0]?.phonetic,
    translation: word.examples[0]?.translation,
    collocations: word.collocations,
    examples: word.examples,
    englishForms: word.englishForms,
    ...getWordRelations(word),
  };
}
