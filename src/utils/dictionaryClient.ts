import type {
  CollocationItem,
  EnglishAdditionalSense,
  EnglishWordForms,
  ExampleSentence,
  VocabDeck,
  VocabWord,
  WordFamilyItem,
} from '../types/vocab';
import { cambridgeEnViLookupUrl, cambridgeLookupUrl, DEFAULT_ENGLISH_LOCALE, getEnglishStudyWord } from './englishStudy';
import { getWordRelations } from './wordRelations';

export interface DictionaryExample {
  sentence: string;
  translation: string;
  source?: string;
  sourceUrl?: string;
}

export interface DictionarySense {
  partOfSpeech: string;
  meaning: string;
  englishDefinition?: string;
  collocations: CollocationItem[];
  examples: DictionaryExample[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryProviderInfo {
  id: string;
  name: string;
  license: string;
  url?: string;
}

export interface DictionaryExternalLinks {
  cambridgeEn: string;
  cambridgeEnVi: string;
  wiktionaryVi: string;
}

export interface DictionaryLookupResult {
  status: 'ok';
  term: string;
  queriedTerm: string;
  inflectionNote?: string;
  phonetic: string;
  englishForms?: EnglishWordForms;
  senses: DictionarySense[];
  examples: DictionaryExample[];
  collocations: CollocationItem[];
  synonyms: string[];
  antonyms: string[];
  wordFamily?: WordFamilyItem[];
  providers: DictionaryProviderInfo[];
  links: DictionaryExternalLinks;
  fetchedAt: number;
}

export interface DictionaryNotFoundResult {
  status: 'not_found';
  term: string;
  links: DictionaryExternalLinks;
  message: string;
}

export interface DictionarySuggestion {
  term: string;
  source: string;
}

export interface DictionaryWordDraft {
  term: string;
  phonetic: string;
  ukPhonetic: string;
  partOfSpeech: string;
  meaning: string;
  notes: string;
  collocation: string;
  collocationMeaning: string;
  extraCollocations: CollocationItem[];
  examples: [ExampleSentence, ExampleSentence];
  synonyms: string;
  antonyms: string;
  englishForms?: EnglishWordForms;
  additionalSenses?: EnglishAdditionalSense[];
  wordFamily?: WordFamilyItem[];
  links: DictionaryExternalLinks;
  sourceSummary: string;
}

export const LOOKUP_DECK_ID = 'deck-custom-lookup';
export const LOOKUP_DECK_NAME = 'Từ đã tra cứu';

export const STANDARD_POS_OPTIONS = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Trạng từ',
  'Cụm động từ',
  'Cụm từ',
  'Collocation',
  'Thành ngữ',
  'Giới từ',
  'Liên từ',
  'Thán từ',
  'Đại từ',
  'Từ / cụm từ',
] as const;

const LOCAL_STRIP_SUFFIXES = [
  'ification', 'ization', 'isation', 'ability', 'ibility', 'fulness', 'lessness',
  'ational', 'itional', 'atively', 'itively', 'iveness', 'ousness',
  'ation', 'ition', 'ative', 'itive', 'atory', 'itory', 'ingly', 'fully', 'lessly', 'ously', 'ically', 'ally',
  'ment', 'ness', 'ance', 'ence', 'ancy', 'ency', 'able', 'ible', 'ably', 'ibly', 'less', 'ship', 'hood',
  'tion', 'sion', 'ivity', 'ical', 'ious', 'eous', 'edly',
  'ity', 'ety', 'acy', 'ive', 'ful', 'ous', 'ant', 'ent', 'ary', 'ory', 'ery', 'ize', 'ise', 'ify', 'ate', 'ist', 'ism', 'age', 'ure', 'ing', 'ial',
  'al', 'ic', 'ly', 'er', 'or', 'ar', 'ed', 'ee', 'ty', 'en',
];

const LOCAL_VALID_SUFFIXES = new Set([
  '', 'e', 'y', 'a', 'i',
  'al', 'ial', 'ical', 'ic', 'ally', 'ically', 'ly', 'ily',
  'ational', 'ationally', 'itional', 'ionally', 'ality', 'alism', 'alist',
  'ion', 'tion', 'ation', 'ition', 'sion', 'ssion',
  'ive', 'ative', 'itive', 'ively', 'atively', 'ivity', 'iveness',
  'ity', 'ety', 'ty', 'ness', 'ment', 'mental', 'mentally',
  'ance', 'ence', 'ancy', 'ency', 'acy', 'ant', 'ent', 'antly', 'ently',
  'able', 'ible', 'ably', 'ibly', 'ability', 'ibility',
  'ful', 'fully', 'fulness', 'less', 'lessly', 'lessness',
  'ous', 'ious', 'eous', 'ously', 'iously', 'ousness',
  'er', 'or', 'ar', 'ist', 'ism', 'istic', 'istically', 'ize', 'ise', 'ization', 'isation', 'ify', 'ification',
  'ate', 'ated', 'ating', 'ator', 'atory', 'ary', 'ory', 'ery', 'age', 'ship', 'hood',
  'ed', 'edly', 'ing', 'ingly', 'en', 'ee', 'ure',
]);

const LOCAL_ALTERNATIONS: ReadonlyArray<[RegExp, string]> = [
  [/([a-z]{3,})d$/i, '$1s'],
  [/([a-z]{3,})s$/i, '$1d'],
  [/([a-z]{2,})duc$/i, '$1duct'],
  [/([a-z]{2,})duct$/i, '$1duc'],
  [/([a-z]{2,})scrib$/i, '$1script'],
  [/([a-z]{2,})script$/i, '$1scrib'],
  [/([a-z]{2,})ceiv$/i, '$1cept'],
  [/([a-z]{2,})cept$/i, '$1ceiv'],
  [/([a-z]{2,})solv$/i, '$1solut'],
  [/([a-z]{2,})solut$/i, '$1solv'],
  [/([a-z]{2,})volv$/i, '$1volut'],
  [/([a-z]{2,})volut$/i, '$1volv'],
  [/([a-z]{2,})mit$/i, '$1miss'],
  [/([a-z]{2,})miss$/i, '$1mit'],
  [/([a-z]{2,})ceed$/i, '$1cess'],
  [/([a-z]{2,})cess$/i, '$1ceed'],
  [/([a-z]{2,})plain$/i, '$1plan'],
  [/([a-z]{2,})plan$/i, '$1plain'],
  [/([a-z]{2,})stroy$/i, '$1struct'],
  [/([a-z]{2,})struct$/i, '$1stroy'],
  [/([a-z]{2,})ply$/i, '$1plic'],
  [/([a-z]{2,})plic$/i, '$1ply'],
];

const LOCAL_PREFIXES = ['un', 'in', 'im', 'il', 'ir', 'dis', 're', 'non', 'mis', 'over', 'under'];

function extractLocalStems(rawTerm: string): string[] {
  const clean = rawTerm.trim().toLowerCase();
  if (!/^[a-z]{3,28}$/.test(clean)) return [];

  let base = clean;
  for (const prefix of LOCAL_PREFIXES) {
    if (base.startsWith(prefix) && base.length - prefix.length >= 4) {
      const stripped = base.slice(prefix.length);
      if (LOCAL_STRIP_SUFFIXES.some((sfx) => stripped.endsWith(sfx) && stripped.length - sfx.length >= 4)) {
        base = stripped;
        break;
      }
    }
  }

  let stem = base;
  for (let pass = 0; pass < 2; pass += 1) {
    if ((stem.endsWith('ation') || stem.endsWith('ition')) && stem.length - 5 < 4 && stem.length - 3 >= 4) {
      stem = stem.slice(0, -3);
      continue;
    }
    let changed = false;
    for (const sfx of LOCAL_STRIP_SUFFIXES) {
      if (stem.endsWith(sfx) && stem.length - sfx.length >= 4) {
        stem = stem.slice(0, -sfx.length);
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }

  if (stem.length >= 4 && (stem.endsWith('e') || stem.endsWith('y'))) {
    stem = stem.slice(0, -1);
  }
  if (stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2] && !/[aeioulsz]$/.test(stem)) {
    stem = stem.slice(0, -1);
  }

  const stems: string[] = [];
  if (stem.length >= 3) stems.push(stem);
  for (const [pattern, replacement] of LOCAL_ALTERNATIONS) {
    if (pattern.test(stem)) {
      const alt = stem.replace(pattern, replacement);
      if (alt.length >= 4 && !stems.includes(alt)) stems.push(alt);
      break;
    }
  }
  return stems;
}

export function safeExternalUrl(url: string | undefined): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  return trimmed.startsWith('https://') ? trimmed : undefined;
}

function toExampleSentence(ex: DictionaryExample | undefined): ExampleSentence {
  if (!ex || !ex.sentence.trim()) return { sentence: '', translation: '' };
  const sourceUrl = safeExternalUrl(ex.sourceUrl);
  return {
    sentence: ex.sentence.trim(),
    translation: ex.translation.trim(),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

export function buildWordDraftFromDictionary(
  entry: DictionaryLookupResult,
  selectedSenseIndex = 0,
): DictionaryWordDraft {
  const safeIndex = selectedSenseIndex >= 0 && selectedSenseIndex < entry.senses.length ? selectedSenseIndex : 0;
  const primarySense = entry.senses[safeIndex] ?? entry.senses[0];
  const partOfSpeech = primarySense?.partOfSpeech || (entry.term.includes(' ') ? 'Cụm từ' : 'Từ / cụm từ');
  const meaning = primarySense?.meaning || primarySense?.englishDefinition || '';

  // Prioritize bilingual examples (with Vietnamese translation) from the chosen sense first, then global entry examples, then English-only fallbacks
  const seenSentences = new Set<string>();
  const bilingualExamples: DictionaryExample[] = [];
  const englishOnlyExamples: DictionaryExample[] = [];
  for (const ex of [...(primarySense?.examples ?? []), ...entry.examples]) {
    const key = ex.sentence.trim().toLowerCase();
    if (!key || seenSentences.has(key)) continue;
    seenSentences.add(key);
    if (ex.translation.trim()) bilingualExamples.push(ex);
    else englishOnlyExamples.push(ex);
  }
  const pickedExamples = [...bilingualExamples, ...englishOnlyExamples].slice(0, 2);

  const examples: [ExampleSentence, ExampleSentence] = [
    toExampleSentence(pickedExamples[0]),
    toExampleSentence(pickedExamples[1]),
  ];

  // Prioritize collocations from the chosen sense, fallback to global collocations
  const mergedCollocations: CollocationItem[] = [];
  const seenColloc = new Set<string>();
  for (const item of [...(primarySense?.collocations ?? []), ...entry.collocations]) {
    const phrase = item.phrase.trim();
    if (!phrase) continue;
    const key = phrase.toLowerCase();
    if (seenColloc.has(key)) continue;
    seenColloc.add(key);
    mergedCollocations.push({ phrase, meaning: item.meaning.trim() });
    if (mergedCollocations.length >= 4) break;
  }

  // Remaining distinct POS senses -> Largo's additionalSenses
  const additionalSenses: EnglishAdditionalSense[] = entry.senses
    .filter((_, idx) => idx !== safeIndex)
    .filter((sense) => sense.partOfSpeech !== partOfSpeech && Boolean(sense.meaning))
    .slice(0, 3)
    .map((sense) => ({
      partOfSpeech: sense.partOfSpeech,
      meaning: sense.meaning,
      examples: sense.examples
        .filter((ex) => ex.sentence.trim())
        .slice(0, 2)
        .map((ex) => toExampleSentence(ex)),
    }));

  const usPhonetic = entry.englishForms?.['en-US']?.phonetic ?? entry.phonetic ?? '';
  const ukPhonetic = entry.englishForms?.['en-GB']?.phonetic ?? '';
  const englishForms: EnglishWordForms | undefined = (ukPhonetic || usPhonetic) && ukPhonetic !== usPhonetic
    ? {
        ...(ukPhonetic ? { 'en-GB': { phonetic: ukPhonetic } } : {}),
        ...(usPhonetic ? { 'en-US': { phonetic: usPhonetic } } : {}),
      }
    : undefined;

  const sourceNames = entry.providers.map((p) => p.name).filter(Boolean);
  const sourceSummary = sourceNames.length ? sourceNames.join(' · ') : 'Từ điển trực tuyến';
  const notes = entry.inflectionNote?.trim() ?? '';

  const synonyms = Array.from(new Set([...(primarySense?.synonyms ?? []), ...entry.synonyms])).slice(0, 6);
  const antonyms = Array.from(new Set([...(primarySense?.antonyms ?? []), ...entry.antonyms])).slice(0, 6);
  const wordFamily = (entry.wordFamily ?? []).filter((item) => item.term.trim() && item.partOfSpeech.trim()).slice(0, 8);

  return {
    term: entry.term,
    phonetic: usPhonetic || ukPhonetic,
    ukPhonetic,
    partOfSpeech,
    meaning,
    notes,
    collocation: mergedCollocations[0]?.phrase ?? '',
    collocationMeaning: mergedCollocations[0]?.meaning ?? '',
    extraCollocations: mergedCollocations.slice(1),
    examples,
    synonyms: synonyms.join(', '),
    antonyms: antonyms.join(', '),
    ...(englishForms ? { englishForms } : {}),
    ...(additionalSenses.length ? { additionalSenses } : {}),
    ...(wordFamily.length ? { wordFamily } : {}),
    links: entry.links,
    sourceSummary,
  };
}

export function getMergedWordFamily(
  word: Pick<VocabWord, 'term' | 'wordFamily'>,
  allWords: readonly VocabWord[],
): WordFamilyItem[] {
  const lowerHead = word.term.trim().toLowerCase();
  const byTerm = new Map<string, WordFamilyItem>();
  const catalogByLower = new Map<string, VocabWord>();
  for (const item of allWords) {
    const key = item.term.trim().toLowerCase();
    if (!catalogByLower.has(key)) catalogByLower.set(key, item);
  }

  for (const saved of word.wordFamily ?? []) {
    const cleanTerm = saved.term.trim();
    const key = cleanTerm.toLowerCase();
    if (!cleanTerm || key === lowerHead || byTerm.has(key)) continue;
    const localMatch = catalogByLower.get(key);
    byTerm.set(key, {
      term: cleanTerm,
      partOfSpeech: saved.partOfSpeech.trim() || localMatch?.partOfSpeech || 'Từ / cụm từ',
      meaning: saved.meaning?.trim() || localMatch?.meaning,
    });
  }

  const stems = extractLocalStems(word.term);
  if (stems.length > 0 && byTerm.size < 8) {
    for (const candidate of allWords) {
      const cTerm = candidate.term.trim();
      const lower = cTerm.toLowerCase();
      if (!/^[a-z]{3,28}$/.test(lower) || lower === lowerHead || byTerm.has(lower)) continue;

      let matched = false;
      for (const stem of stems) {
        const checkBody = (body: string) => {
          if (!body.startsWith(stem)) return false;
          const rem = body.slice(stem.length);
          const normRem = rem.length >= 2 && rem[0] === stem[stem.length - 1] ? rem.slice(1) : rem;
          return LOCAL_VALID_SUFFIXES.has(rem) || LOCAL_VALID_SUFFIXES.has(normRem);
        };
        if (checkBody(lower)) {
          matched = true;
          break;
        }
        // Also recognize prefixed family members already in Largo's catalog (e.g. indecisive, recreate)
        for (const prefix of LOCAL_PREFIXES) {
          if (lower.startsWith(prefix) && lower.length - prefix.length >= 4 && checkBody(lower.slice(prefix.length))) {
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      if (matched) {
        byTerm.set(lower, {
          term: cTerm,
          partOfSpeech: candidate.partOfSpeech || 'Từ / cụm từ',
          meaning: candidate.meaning,
        });
        if (byTerm.size >= 8) break;
      }
    }
  }

  return Array.from(byTerm.values()).slice(0, 8);
}

export function buildLocalLookupResult(
  storedWord: VocabWord,
  allWords: readonly VocabWord[],
): DictionaryLookupResult {
  const word = getEnglishStudyWord(storedWord, DEFAULT_ENGLISH_LOCALE);
  const relations = getWordRelations(storedWord);
  const primarySense: DictionarySense = {
    partOfSpeech: word.partOfSpeech || 'Từ / cụm từ',
    meaning: word.meaning,
    collocations: word.collocations,
    examples: word.examples.map((ex) => ({
      sentence: ex.sentence,
      translation: ex.translation,
      ...(ex.sourceUrl ? { sourceUrl: ex.sourceUrl } : {}),
    })),
    synonyms: relations.synonyms,
    antonyms: relations.antonyms,
  };

  const extraSenses: DictionarySense[] = (storedWord.additionalSenses ?? []).map((sense) => ({
    partOfSpeech: sense.partOfSpeech,
    meaning: sense.meaning,
    collocations: [],
    examples: sense.examples.map((ex) => ({
      sentence: ex.sentence,
      translation: ex.translation,
      ...(ex.sourceUrl ? { sourceUrl: ex.sourceUrl } : {}),
    })),
    synonyms: [],
    antonyms: [],
  }));

  const senses = [primarySense, ...extraSenses];
  const allExamples = senses.flatMap((s) => s.examples);
  const family = getMergedWordFamily(storedWord, allWords);

  return {
    status: 'ok',
    term: word.term,
    queriedTerm: word.term,
    phonetic: word.phonetic,
    ...(storedWord.englishForms ? { englishForms: storedWord.englishForms } : {}),
    senses,
    examples: allExamples.slice(0, 4),
    collocations: word.collocations,
    synonyms: relations.synonyms,
    antonyms: relations.antonyms,
    wordFamily: family,
    providers: [{ id: 'largo-library', name: 'Kho từ vựng Largo', license: 'Offline' }],
    links: {
      cambridgeEn: cambridgeLookupUrl(word.term),
      cambridgeEnVi: cambridgeEnViLookupUrl(word.term),
      wiktionaryVi: 'https://vi.wiktionary.org/wiki/' + encodeURIComponent(word.term.replace(/\s+/g, '_')),
    },
    fetchedAt: Date.now(),
  };
}

export function createLookupDeck(timestamp: number): VocabDeck {
  return {
    id: LOOKUP_DECK_ID,
    name: LOOKUP_DECK_NAME,
    description: 'Các từ và cụm từ bạn lưu từ công cụ tra từ điển trực tuyến.',
    language: 'en',
    category: 'Cá nhân',
    isCustom: true,
    createdAt: timestamp,
  };
}

export async function fetchDictionarySuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<DictionarySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const res = await fetch('/api/dictionary/suggest?q=' + encodeURIComponent(trimmed) + '&limit=8', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

export async function fetchDictionaryEntry(
  term: string,
  signal?: AbortSignal,
): Promise<DictionaryLookupResult | DictionaryNotFoundResult> {
  const trimmed = term.trim();
  const res = await fetch('/api/dictionary/lookup?q=' + encodeURIComponent(trimmed), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 404 && data?.status === 'not_found') {
    return data as DictionaryNotFoundResult;
  }
  if (!res.ok || data?.status !== 'ok') {
    throw new Error(data?.message || 'Chưa thể tra từ điển trực tuyến lúc này.');
  }
  return data as DictionaryLookupResult;
}
