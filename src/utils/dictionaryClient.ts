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
import { searchable } from './vocabSearch';
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
  isIdiom?: boolean;
  phonetic: string;
  englishForms?: EnglishWordForms;
  senses: DictionarySense[];
  examples: DictionaryExample[];
  collocations: CollocationItem[];
  synonyms: string[];
  antonyms: string[];
  wordFamily?: WordFamilyItem[];
  relatedIdioms?: string[];
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
  isIdiom?: boolean;
}

export interface DictionaryIdiomMatch {
  term: string;
  snippet?: string;
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
  isIdiom?: boolean;
  links: DictionaryExternalLinks;
  sourceSummary: string;
}

export const LOOKUP_DECK_ID = 'deck-custom-lookup';
export const LOOKUP_DECK_NAME = 'Từ đã tra cứu';
export const IDIOM_DECK_ID = 'deck-custom-idioms';
export const IDIOM_DECK_NAME = 'Thành ngữ của tôi';
export const ENGLISH_IDIOM_POS = 'Thành ngữ';

export const POPULAR_IDIOM_PICKS: readonly string[] = [
  'break the ice',
  'piece of cake',
  'under the weather',
  'bite the bullet',
  'once in a blue moon',
  'hit the sack',
  'burn the midnight oil',
  'cost an arm and a leg',
  'on the same page',
  'get out of hand',
];

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

  // Keep examples scoped to the selected sense on multi-POS entries when the sense already has bilingual examples;
  // only fall back to global entry examples if the sense lacks bilingual pairs or the entry has a single sense.
  const seenSentences = new Set<string>();
  const senseBilingual: DictionaryExample[] = [];
  const senseEnglishOnly: DictionaryExample[] = [];
  for (const ex of primarySense?.examples ?? []) {
    const key = ex.sentence.trim().toLowerCase();
    if (!key || seenSentences.has(key)) continue;
    seenSentences.add(key);
    if (ex.translation.trim()) senseBilingual.push(ex);
    else senseEnglishOnly.push(ex);
  }

  const fallbackBilingual: DictionaryExample[] = [];
  const fallbackEnglishOnly: DictionaryExample[] = [];
  const shouldFallbackToGlobal = entry.senses.length <= 1 || senseBilingual.length === 0;
  if (shouldFallbackToGlobal) {
    for (const ex of entry.examples) {
      const key = ex.sentence.trim().toLowerCase();
      if (!key || seenSentences.has(key)) continue;
      seenSentences.add(key);
      if (ex.translation.trim()) fallbackBilingual.push(ex);
      else fallbackEnglishOnly.push(ex);
    }
  }
  const pickedExamples = [
    ...senseBilingual,
    ...fallbackBilingual,
    ...senseEnglishOnly,
    ...fallbackEnglishOnly,
  ].slice(0, 2);

  const examples: [ExampleSentence, ExampleSentence] = [
    toExampleSentence(pickedExamples[0]),
    toExampleSentence(pickedExamples[1]),
  ];

  // Keep collocations scoped to the selected sense on multi-POS entries when present
  const mergedCollocations: CollocationItem[] = [];
  const seenColloc = new Set<string>();
  const collocSource = entry.senses.length > 1 && (primarySense?.collocations?.length ?? 0) > 0
    ? (primarySense?.collocations ?? [])
    : [...(primarySense?.collocations ?? []), ...(entry.senses.length <= 1 ? entry.collocations : [])];
  for (const item of collocSource) {
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

  const isIdiom = Boolean(entry.isIdiom || partOfSpeech.toLowerCase() === ENGLISH_IDIOM_POS.toLowerCase());

  return {
    term: entry.term,
    phonetic: usPhonetic || ukPhonetic,
    ukPhonetic,
    partOfSpeech: isIdiom ? ENGLISH_IDIOM_POS : partOfSpeech,
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
    ...(isIdiom ? { isIdiom: true } : {}),
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

  const isIdiom = isIdiomWord(storedWord);
  const lowerTerm = word.term.trim().toLowerCase();
  const localRelatedIdioms = allWords
    .filter((candidate) =>
      candidate.id !== storedWord.id &&
      isIdiomWord(candidate) &&
      lowerTerm.length >= 3 &&
      !lowerTerm.includes(' ') &&
      candidate.term.toLowerCase().split(/[^a-z']+/).includes(lowerTerm),
    )
    .map((candidate) => candidate.term)
    .slice(0, 6);

  return {
    status: 'ok',
    term: word.term,
    queriedTerm: word.term,
    ...(isIdiom ? { isIdiom: true } : {}),
    phonetic: word.phonetic,
    ...(storedWord.englishForms ? { englishForms: storedWord.englishForms } : {}),
    senses,
    examples: allExamples.slice(0, 4),
    collocations: word.collocations,
    synonyms: relations.synonyms,
    antonyms: relations.antonyms,
    wordFamily: family,
    ...(localRelatedIdioms.length ? { relatedIdioms: localRelatedIdioms } : {}),
    providers: [{ id: 'largo-library', name: 'Kho từ vựng Largo', license: 'Offline' }],
    links: {
      cambridgeEn: cambridgeLookupUrl(word.term),
      cambridgeEnVi: cambridgeEnViLookupUrl(word.term),
      wiktionaryVi: 'https://vi.wiktionary.org/wiki/' + encodeURIComponent(word.term.replace(/\s+/g, '_')),
    },
    fetchedAt: Date.now(),
  };
}

const VI_MEANING_STOPWORDS = new Set([
  'cua', 'mot', 'cac', 'va', 'hoac', 'hay', 'de', 'khi', 'su', 'viec', 'lam',
  'la', 'co', 'cho', 'voi', 'trong', 'ra', 'vao', 'len', 'xuong', 'di', 'den',
  'o', 'tu', 'bang', 'theo', 've', 'nhu', 'rat', 'nay', 'do', 'nguoi', 'vat',
  'cai', 'minh', 'khac', 'nhieu', 'it', 'tren', 'duoi', 'tai', 'nhung', 'ma',
  'bi', 'duoc', 'se', 'da', 'dang', 'khong', 'chua', 'phai', 'can', 'nen',
]);

function normalizeExampleKey(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\bwhat's\b/g, 'what is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bthat's\b/g, 'that is')
    .replace(/\bthere's\b/g, 'there is')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeaningTokens(meaning: string): string[] {
  return searchable(meaning)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !VI_MEANING_STOPWORDS.has(token));
}

export function meaningsAlign(localMeaning: string, onlineMeaning: string): boolean {
  const localNorm = searchable(localMeaning);
  const onlineNorm = searchable(onlineMeaning);
  if (!localNorm || !onlineNorm) return false;
  if (onlineNorm.includes(localNorm) || localNorm.includes(onlineNorm)) return true;

  const localClauses = localMeaning
    .split(/[;,/]/)
    .map((c) => searchable(c).trim())
    .filter((c) => c.length >= 3);
  if (localClauses.some((clause) => onlineNorm.includes(clause))) return true;

  const localTokens = extractMeaningTokens(localMeaning);
  const onlineTokens = new Set(extractMeaningTokens(onlineMeaning));
  if (!localTokens.length || !onlineTokens.size) return false;
  const overlap = localTokens.filter((t) => onlineTokens.has(t)).length;
  return overlap >= (localTokens.length <= 2 ? 1 : 2);
}

function mergeDistinctExamples(
  primary: readonly DictionaryExample[],
  secondary: readonly DictionaryExample[],
  maxCount = 3,
): DictionaryExample[] {
  const seen = new Set<string>();
  const out: DictionaryExample[] = [];
  for (const ex of [...primary, ...secondary]) {
    const sentence = ex.sentence.trim();
    if (!sentence) continue;
    const key = normalizeExampleKey(sentence) || searchable(sentence);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(ex);
    if (out.length >= maxCount) break;
  }
  return out;
}

function mergeDistinctCollocations(
  primary: readonly CollocationItem[],
  secondary: readonly CollocationItem[],
  maxCount = 4,
): CollocationItem[] {
  const seen = new Set<string>();
  const out: CollocationItem[] = [];
  for (const item of [...primary, ...secondary]) {
    const phrase = item.phrase.trim();
    if (!phrase) continue;
    const key = searchable(phrase);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= maxCount) break;
  }
  return out;
}

export function mergeLocalWithOnlineLookup(
  storedWord: VocabWord,
  onlineResult: DictionaryLookupResult,
  allWords: readonly VocabWord[],
): DictionaryLookupResult {
  const onlineKey = searchable(onlineResult.term);
  const matchesStored =
    searchable(storedWord.term) === onlineKey ||
    (storedWord.englishForms?.['en-GB']?.term && searchable(storedWord.englishForms['en-GB'].term) === onlineKey) ||
    (storedWord.englishForms?.['en-US']?.term && searchable(storedWord.englishForms['en-US'].term) === onlineKey);
  if (!matchesStored) return onlineResult;

  const localEntry = buildLocalLookupResult(storedWord, allWords);
  const onlineByPos = new Map<string, DictionarySense>();
  for (const sense of onlineResult.senses) {
    const posKey = searchable(sense.partOfSpeech);
    if (posKey && !onlineByPos.has(posKey)) {
      onlineByPos.set(posKey, sense);
    }
  }

  const usedOnlinePos = new Set<string>();
  const extraDistinctOnlineSenses: DictionarySense[] = [];

  const mergedSenses: DictionarySense[] = localEntry.senses.map((localSense) => {
    const posKey = searchable(localSense.partOfSpeech);
    const match = onlineByPos.get(posKey);
    if (!match) return localSense;
    usedOnlinePos.add(posKey);

    const aligned = !localSense.meaning || !match.meaning || meaningsAlign(localSense.meaning, match.meaning);
    if (!aligned) {
      // Online primary meaning for this POS covers a different sense (e.g. "take off" = cất cánh vs local = cởi; tháo ra).
      // Keep the curated local sense pure and expose the online meaning cleanly in its own tab.
      extraDistinctOnlineSenses.push({
        ...match,
        partOfSpeech: `${match.partOfSpeech} (nghĩa khác)`,
      });
      return localSense;
    }

    const bilingualOnlineExamples = match.examples.filter((ex) => Boolean(ex.translation.trim()));
    const supplementExamples = localSense.examples.length > 0 ? bilingualOnlineExamples : match.examples;

    return {
      partOfSpeech: localSense.partOfSpeech,
      meaning: localSense.meaning || match.meaning,
      ...(match.englishDefinition ? { englishDefinition: match.englishDefinition } : {}),
      collocations: mergeDistinctCollocations(localSense.collocations, match.collocations, 4),
      examples: mergeDistinctExamples(localSense.examples, supplementExamples, 3),
      synonyms: Array.from(new Set([...localSense.synonyms, ...match.synonyms])).slice(0, 6),
      antonyms: Array.from(new Set([...localSense.antonyms, ...match.antonyms])).slice(0, 6),
    };
  });

  for (const extraSense of extraDistinctOnlineSenses) {
    mergedSenses.push(extraSense);
  }

  for (const onlineSense of onlineResult.senses) {
    const posKey = searchable(onlineSense.partOfSpeech);
    if (posKey && !usedOnlinePos.has(posKey)) {
      usedOnlinePos.add(posKey);
      mergedSenses.push(onlineSense);
    }
  }

  const ukPhonetic = localEntry.englishForms?.['en-GB']?.phonetic || onlineResult.englishForms?.['en-GB']?.phonetic || '';
  const usPhonetic = localEntry.englishForms?.['en-US']?.phonetic || onlineResult.englishForms?.['en-US']?.phonetic || '';
  const mergedEnglishForms: EnglishWordForms | undefined = (ukPhonetic || usPhonetic)
    ? {
        ...(ukPhonetic ? { 'en-GB': { ...(localEntry.englishForms?.['en-GB'] ?? {}), phonetic: ukPhonetic } } : {}),
        ...(usPhonetic ? { 'en-US': { ...(localEntry.englishForms?.['en-US'] ?? {}), phonetic: usPhonetic } } : {}),
      }
    : (localEntry.englishForms ?? onlineResult.englishForms);

  const wordFamily = getMergedWordFamily(
    { term: onlineResult.term, wordFamily: [...(localEntry.wordFamily ?? []), ...(onlineResult.wordFamily ?? [])] },
    allWords,
  );
  const relatedIdioms = Array.from(new Set([...(onlineResult.relatedIdioms ?? []), ...(localEntry.relatedIdioms ?? [])])).slice(0, 6);

  const seenProviders = new Set<string>();
  const providers: DictionaryProviderInfo[] = [];
  for (const provider of [
    { id: 'largo-library', name: 'Kho từ vựng Largo (đã biên tập)', license: 'Offline' },
    ...onlineResult.providers,
  ]) {
    if (seenProviders.has(provider.id)) continue;
    seenProviders.add(provider.id);
    providers.push(provider);
  }

  const primaryExamples = mergedSenses[0]?.examples ?? localEntry.examples;

  return {
    ...onlineResult,
    term: localEntry.term,
    ...(localEntry.isIdiom || onlineResult.isIdiom ? { isIdiom: true } : {}),
    phonetic: usPhonetic || localEntry.phonetic || onlineResult.phonetic || ukPhonetic,
    ...(mergedEnglishForms ? { englishForms: mergedEnglishForms } : {}),
    senses: mergedSenses,
    examples: primaryExamples.slice(0, 3),
    collocations: mergeDistinctCollocations(localEntry.collocations, onlineResult.collocations, 6),
    synonyms: Array.from(new Set([...localEntry.synonyms, ...onlineResult.synonyms])).slice(0, 8),
    antonyms: Array.from(new Set([...localEntry.antonyms, ...onlineResult.antonyms])).slice(0, 8),
    wordFamily,
    ...(relatedIdioms.length ? { relatedIdioms } : {}),
    providers,
  };
}

export function isIdiomWord(word: Pick<VocabWord, 'partOfSpeech'>): boolean {
  const pos = word.partOfSpeech.trim().toLowerCase();
  return pos === 'thành ngữ' || pos.includes('thành ngữ') || pos === 'idiom' || pos.includes('idiom');
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

export function createIdiomDeck(timestamp: number): VocabDeck {
  return {
    id: IDIOM_DECK_ID,
    name: IDIOM_DECK_NAME,
    description: 'Các thành ngữ tiếng Anh bạn sưu tầm và luyện tập theo ngữ cảnh.',
    language: 'en',
    category: 'Thành ngữ',
    collection: 'idioms',
    isCustom: true,
    createdAt: timestamp,
  };
}

export async function fetchDictionarySuggestions(
  query: string,
  signal?: AbortSignal,
  mode: 'all' | 'idiom' = 'all',
): Promise<DictionarySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const modeParam = mode === 'idiom' ? '&mode=idiom' : '';
  const res = await fetch('/api/dictionary/suggest?q=' + encodeURIComponent(trimmed) + '&limit=8' + modeParam, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

export async function fetchDictionaryIdioms(
  query: string,
  signal?: AbortSignal,
  limit = 10,
): Promise<DictionaryIdiomMatch[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const res = await fetch('/api/dictionary/idioms?q=' + encodeURIComponent(trimmed) + '&limit=' + limit, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.idioms) ? data.idioms : [];
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
