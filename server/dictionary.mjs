import express from 'express';
import { isLocalRequest } from './localRequest.mjs';

const MINUTE = 60_000;
const CACHE_TTL_MS = 15 * 60_000;
const MAX_CACHE_ENTRIES = 250;
const LIMITS = { suggestPerMinute: 60, lookupPerMinute: 30, concurrent: 6 };
const MAX_RESPONSE_BYTES = 512_000;
const VALID_QUERY = /^[A-Za-z0-9][A-Za-z0-9\s'’.-]{0,79}$/;
const CONTROL_OR_HTML = /[<>`\\/\p{Cc}\p{Cf}]/u;
const VIETNAMESE_MARKS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/iu;
const USER_AGENT = 'LargoDictionary/1.0 (+https://largo.local; English-Vietnamese learner lookup)';

const PRIVATE_HOST_PATTERNS = [
  /^169\.254\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
];

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const POS_MAP = new Map([
  ['noun', 'Danh từ'],
  ['n', 'Danh từ'],
  ['danh từ', 'Danh từ'],
  ['danh tu', 'Danh từ'],
  ['verb', 'Động từ'],
  ['v', 'Động từ'],
  ['tr-verb', 'Động từ'],
  ['intr-verb', 'Động từ'],
  ['transitive verb', 'Động từ'],
  ['intransitive verb', 'Động từ'],
  ['động từ', 'Động từ'],
  ['ngoại động từ', 'Động từ'],
  ['nội động từ', 'Động từ'],
  ['adjective', 'Tính từ'],
  ['adj', 'Tính từ'],
  ['tính từ', 'Tính từ'],
  ['adverb', 'Trạng từ'],
  ['adv', 'Trạng từ'],
  ['trạng từ', 'Trạng từ'],
  ['phó từ', 'Trạng từ'],
  ['preposition', 'Giới từ'],
  ['prep', 'Giới từ'],
  ['giới từ', 'Giới từ'],
  ['conjunction', 'Liên từ'],
  ['conj', 'Liên từ'],
  ['liên từ', 'Liên từ'],
  ['interjection', 'Thán từ'],
  ['interj', 'Thán từ'],
  ['thán từ', 'Thán từ'],
  ['pronoun', 'Đại từ'],
  ['pron', 'Đại từ'],
  ['đại từ', 'Đại từ'],
  ['determiner', 'Từ hạn định'],
  ['det', 'Từ hạn định'],
  ['article', 'Mạo từ'],
  ['phrasal verb', 'Cụm động từ'],
  ['cụm động từ', 'Cụm động từ'],
  ['idiom', 'Thành ngữ'],
  ['thành ngữ', 'Thành ngữ'],
  ['phrase', 'Cụm từ'],
  ['cụm từ', 'Cụm từ'],
]);

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

export function normalizeLookupQuery(raw) {
  if (typeof raw !== 'string') return '';
  const cleaned = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length > 80) return '';
  if (CONTROL_OR_HTML.test(cleaned) || cleaned.includes('..') || !VALID_QUERY.test(cleaned)) return '';
  if (!/[A-Za-z]/.test(cleaned)) return '';
  return cleaned;
}

export function mapPartOfSpeechVi(rawPos, term = '') {
  const normalized = typeof rawPos === 'string'
    ? rawPos.normalize('NFKC').toLowerCase().replace(/^[-_]+|[-_]+$/g, '').replace(/\s+/g, ' ').trim()
    : '';
  const exact = POS_MAP.get(normalized);
  if (exact) {
    if (exact === 'Động từ' && term.trim().includes(' ')) return 'Cụm động từ';
    return exact;
  }
  for (const [key, label] of POS_MAP.entries()) {
    if (key.length > 2 && normalized.includes(key)) {
      if (label === 'Động từ' && term.trim().includes(' ')) return 'Cụm động từ';
      return label;
    }
  }
  return term.trim().includes(' ') ? 'Cụm từ' : 'Từ / cụm từ';
}

function decodeHtmlEntities(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|#39);/gi, (match) => HTML_ENTITIES[match.toLowerCase()] ?? match)
    .replace(/&#(\d+);/g, (_match, code) => {
      const num = Number(code);
      return Number.isFinite(num) && num >= 32 && num <= 0x10ffff ? String.fromCodePoint(num) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
      const num = Number.parseInt(hex, 16);
      return Number.isFinite(num) && num >= 32 && num <= 0x10ffff ? String.fromCodePoint(num) : '';
    });
}

function stripHtml(html) {
  if (typeof html !== 'string') return '';
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPlainText(value, maxLength = 260) {
  if (typeof value !== 'string') return '';
  const text = stripHtml(value).replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + '…' : text;
}

function normalizePhonetic(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed.length > 80) return '';
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) return trimmed;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return '/' + trimmed.slice(1, -1).trim() + '/';
  return '/' + trimmed.replace(/^\/+|\/+$/g, '') + '/';
}

function cleanWikitext(line) {
  if (typeof line !== 'string') return '';
  let text = line
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, ' ');

  // Replace common templates cleanly
  text = text.replace(/\{\{(?:term|context|lb|label|l|m|mention|ux|quote)\s*\|([^}]*)\}\}/gi, (_m, inner) => {
    const parts = inner.split('|').map((p) => p.trim()).filter((p) => p && !p.includes('='));
    if (!parts.length) return '';
    if (parts.length >= 2 && /^(en|vi|eng|vie)$/i.test(parts[0])) return parts[1];
    return parts[0];
  });
  text = text.replace(/\{\{[^}]*\}\}/g, '');

  // Convert [[target|label]] -> label, [[word]] -> word
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Remove bold/italic wiki quotes
  text = text.replace(/'{2,5}/g, '');
  text = text
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/^\s*[,;:\-–—]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

function isSentenceLike(english) {
  const trimmed = english.trim();
  if (!trimmed || trimmed.length < 12) return false;
  if (/[.!?]$/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  return words.length >= 6 && !/^to\s+[a-z]/i.test(trimmed);
}

function normalizeSentenceKey(text) {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function containsTermLoose(sentence, term) {
  const haystack = ' ' + normalizeSentenceKey(sentence) + ' ';
  const needle = normalizeSentenceKey(term);
  if (!needle) return false;
  if (haystack.includes(' ' + needle + ' ')) return true;
  if (!needle.includes(' ') && needle.length >= 4) {
    const stem = needle.replace(/(?:ing|ed|es|s|y)$/i, '');
    if (stem.length >= 4 && haystack.includes(' ' + stem)) return true;
  }
  return false;
}

export function buildExternalLinks(term) {
  const clean = normalizeLookupQuery(term);
  const encoded = encodeURIComponent(clean);
  const wikiTitle = encodeURIComponent(clean.replace(/\s+/g, '_'));
  return {
    cambridgeEn: 'https://dictionary.cambridge.org/search/english/direct/?q=' + encoded,
    cambridgeEnVi: 'https://dictionary.cambridge.org/search/english-vietnamese/direct/?q=' + encoded,
    wiktionaryVi: 'https://vi.wiktionary.org/wiki/' + wikiTitle,
  };
}

export function parseViWiktionaryEntry(wikitext, term) {
  if (typeof wikitext !== 'string' || !wikitext.trim()) return null;

  // Isolate the English section ({{-eng-}} or == Tiếng Anh ==)
  const engMarker = wikitext.match(/\{\{-eng-\}\}|==\s*Tiếng Anh\s*==/i);
  if (!engMarker || engMarker.index === undefined) return null;

  const afterEng = wikitext.slice(engMarker.index + engMarker[0].length);
  const nextLang = afterEng.search(/\n(?:\{\{-(?!pron|noun|verb|tr-verb|intr-verb|adj|adv|prep|conj|interj|phrase|idiom|forms|ref|syn|ant|rel|etym|drv|art|det|num|part|pref|suff)[a-z]{2,4}-\}\}|==\s*[^=]+\s*==\s*(?:\n|$))/i);
  const section = nextLang > -1 ? afterEng.slice(0, nextLang) : afterEng;

  // Extract IPA
  let phonetic = '';
  const ipaMatch = section.match(/\{\{IPA(?:-old)?\s*\|(?:en\|)?([^|}]+)\}\}/i);
  if (ipaMatch?.[1]) {
    phonetic = normalizePhonetic(ipaMatch[1]);
  }

  const posHeaderRegex = /^\{\{-(noun|verb|tr-verb|intr-verb|adj|adv|prep|conj|interj|pron|phrase|idiom|art|det)-\}\}|^===\s*(Danh từ|Động từ|Ngoại động từ|Nội động từ|Tính từ|Trạng từ|Phó từ|Giới từ|Liên từ|Thán từ|Đại từ|Cụm động từ|Thành ngữ|Cụm từ)\s*===/i;
  const derivedHeaderRegex = /^\{\{-(drv|rel)-\}\}|^===\s*(Từ dẫn xuất|Từ liên quan)\s*===/i;
  const stopHeaderRegex = /^\{\{-(forms|ref|syn|ant|etym|see)-\}\}|^===\s*(Tham khảo|Từ nguyên|Đồng nghĩa|Trái nghĩa|Chia động từ|Xem thêm)\s*===/i;

  const sensesByPos = new Map();
  const derivedTerms = new Set();
  let currentSense = null;
  let inPosSection = false;
  let inDerivedSection = false;

  for (const rawLine of section.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (derivedHeaderRegex.test(line)) {
      inPosSection = false;
      currentSense = null;
      inDerivedSection = true;
      continue;
    }

    if (stopHeaderRegex.test(line)) {
      inPosSection = false;
      inDerivedSection = false;
      currentSense = null;
      continue;
    }

    const posMatch = line.match(posHeaderRegex);
    if (posMatch) {
      inDerivedSection = false;
      const rawPos = posMatch[1] || posMatch[2];
      const posLabel = mapPartOfSpeechVi(rawPos, term);
      if (!sensesByPos.has(posLabel)) {
        sensesByPos.set(posLabel, {
          partOfSpeech: posLabel,
          meanings: [],
          examples: [],
          collocations: [],
        });
      }
      currentSense = sensesByPos.get(posLabel);
      inPosSection = true;
      continue;
    }

    if (inDerivedSection) {
      for (const match of line.matchAll(/\[\[([A-Za-z][A-Za-z-]{2,26})(?:\|[^\]]+)?\]\]/g)) {
        const candidate = match[1].toLowerCase();
        if (candidate !== term.toLowerCase()) derivedTerms.add(candidate);
      }
      continue;
    }

    if (!inPosSection || !currentSense) continue;

    if (line.startsWith('#:')) {
      const content = cleanWikitext(line.slice(2));
      const splitMatch = content.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      if (splitMatch) {
        const left = cleanPlainText(splitMatch[1], 220);
        const right = cleanPlainText(splitMatch[2], 240);
        if (left && right && /[A-Za-z]/.test(left)) {
          if (isSentenceLike(left)) {
            currentSense.examples.push({ sentence: left, translation: right, source: 'Wiktionary Anh–Việt' });
          } else {
            currentSense.collocations.push({ phrase: left, meaning: right });
          }
        }
      }
      continue;
    }

    if (line.startsWith('#') && !line.startsWith('#*') && !line.startsWith('##')) {
      const def = cleanWikitext(line.slice(1)).replace(/\.$/, '').trim();
      if (def && def.length >= 2 && VIETNAMESE_MARKS.test(def.normalize('NFC'))) {
        if (currentSense.meanings.length < 4 && !currentSense.meanings.includes(def)) {
          currentSense.meanings.push(def);
        }
      }
    }
  }

  const senses = Array.from(sensesByPos.values())
    .filter((entry) => entry.meanings.length > 0)
    .map((entry) => ({
      partOfSpeech: entry.partOfSpeech,
      meaning: entry.meanings.slice(0, 2).join('; '),
      meanings: entry.meanings,
      examples: entry.examples.slice(0, 4),
      collocations: entry.collocations.slice(0, 5),
    }));

  if (!senses.length) return null;
  return { phonetic, senses, derivedTerms: Array.from(derivedTerms).slice(0, 12) };
}

export function parseFreeDictionaryPayload(payload) {
  if (!Array.isArray(payload) || !payload.length) return null;
  const headword = cleanPlainText(payload[0]?.word ?? '', 80);
  if (!headword) return null;

  let ukPhonetic = '';
  let usPhonetic = '';
  let fallbackPhonetic = '';

  const allPhonetics = payload.flatMap((entry) => Array.isArray(entry?.phonetics) ? entry.phonetics : []);
  for (const item of allPhonetics) {
    const ipa = normalizePhonetic(item?.text ?? '');
    const audio = typeof item?.audio === 'string' ? item.audio.toLowerCase() : '';
    if (!ipa) continue;
    if (!fallbackPhonetic) fallbackPhonetic = ipa;
    if ((audio.includes('-uk') || audio.includes('-gb')) && !ukPhonetic) ukPhonetic = ipa;
    else if (audio.includes('-us') && !usPhonetic) usPhonetic = ipa;
    else if (/[əɜ]ʊ|ɒ/.test(ipa) && !ukPhonetic) ukPhonetic = ipa;
    else if (/oʊ|ɑː?r|ər/.test(ipa) && !usPhonetic) usPhonetic = ipa;
  }
  for (const entry of payload) {
    const ipa = normalizePhonetic(entry?.phonetic ?? '');
    if (ipa && !fallbackPhonetic) fallbackPhonetic = ipa;
  }

  const sensesByPos = new Map();
  const allSynonyms = new Set();
  const allAntonyms = new Set();

  for (const entry of payload) {
    if (!Array.isArray(entry?.meanings)) continue;
    for (const meaning of entry.meanings) {
      const posLabel = mapPartOfSpeechVi(meaning?.partOfSpeech ?? '', headword);
      if (!sensesByPos.has(posLabel)) {
        sensesByPos.set(posLabel, {
          partOfSpeech: posLabel,
          englishDefinitions: [],
          examples: [],
          synonyms: new Set(),
          antonyms: new Set(),
        });
      }
      const bucket = sensesByPos.get(posLabel);

      if (Array.isArray(meaning.synonyms)) {
        for (const s of meaning.synonyms) {
          const clean = cleanPlainText(s, 60);
          if (clean && clean.toLowerCase() !== headword.toLowerCase()) {
            bucket.synonyms.add(clean);
            allSynonyms.add(clean);
          }
        }
      }
      if (Array.isArray(meaning.antonyms)) {
        for (const a of meaning.antonyms) {
          const clean = cleanPlainText(a, 60);
          if (clean && clean.toLowerCase() !== headword.toLowerCase()) {
            bucket.antonyms.add(clean);
            allAntonyms.add(clean);
          }
        }
      }

      if (Array.isArray(meaning.definitions)) {
        for (const def of meaning.definitions) {
          const defText = cleanPlainText(def?.definition ?? '', 220);
          if (defText && bucket.englishDefinitions.length < 3 && !bucket.englishDefinitions.includes(defText)) {
            bucket.englishDefinitions.push(defText);
          }
          const exText = cleanPlainText(def?.example ?? '', 220);
          if (exText && exText.length >= 10 && bucket.examples.length < 4) {
            bucket.examples.push({ sentence: exText, translation: '', source: 'Free Dictionary API' });
          }
          if (Array.isArray(def?.synonyms)) {
            for (const s of def.synonyms) {
              const clean = cleanPlainText(s, 60);
              if (clean && clean.toLowerCase() !== headword.toLowerCase()) {
                bucket.synonyms.add(clean);
                allSynonyms.add(clean);
              }
            }
          }
          if (Array.isArray(def?.antonyms)) {
            for (const a of def.antonyms) {
              const clean = cleanPlainText(a, 60);
              if (clean && clean.toLowerCase() !== headword.toLowerCase()) {
                bucket.antonyms.add(clean);
                allAntonyms.add(clean);
              }
            }
          }
        }
      }
    }
  }

  const rawSourceUrl = Array.isArray(payload[0]?.sourceUrls) ? payload[0].sourceUrls[0] : '';
  const sourceUrl = typeof rawSourceUrl === 'string' && rawSourceUrl.startsWith('https://') ? rawSourceUrl : undefined;

  return {
    term: headword,
    ukPhonetic,
    usPhonetic,
    phonetic: usPhonetic || ukPhonetic || fallbackPhonetic,
    senses: Array.from(sensesByPos.values()).map((bucket) => ({
      partOfSpeech: bucket.partOfSpeech,
      englishDefinitions: bucket.englishDefinitions,
      examples: bucket.examples,
      synonyms: Array.from(bucket.synonyms).slice(0, 6),
      antonyms: Array.from(bucket.antonyms).slice(0, 6),
    })),
    synonyms: Array.from(allSynonyms).slice(0, 8),
    antonyms: Array.from(allAntonyms).slice(0, 8),
    sourceUrl,
  };
}

export function parseEnWiktionaryDefinition(payload, queriedTerm) {
  const entries = payload?.en;
  if (!Array.isArray(entries) || !entries.length) return null;

  let lemma = '';
  const senses = [];

  for (const item of entries) {
    const posLabel = mapPartOfSpeechVi(item?.partOfSpeech ?? '', queriedTerm);
    const englishDefinitions = [];
    const examples = [];

    if (Array.isArray(item?.definitions)) {
      for (const def of item.definitions) {
        const rawHtml = typeof def?.definition === 'string' ? def.definition : '';
        if (!lemma && /form-of-definition/i.test(rawHtml)) {
          const linkMatch = rawHtml.match(/<a[^>]+href="\/wiki\/([^"#?]+)"[^>]*>([^<]+)<\/a>/i);
          const candidate = cleanPlainText(linkMatch?.[2] ?? '', 60);
          if (candidate && candidate.toLowerCase() !== queriedTerm.toLowerCase() && /^[A-Za-z][A-Za-z\s'-]{1,40}$/.test(candidate)) {
            lemma = candidate;
          }
        }
        const cleanDef = cleanPlainText(rawHtml, 220);
        if (cleanDef && !/^Alternative form of\b/i.test(cleanDef) && englishDefinitions.length < 3) {
          englishDefinitions.push(cleanDef);
        }
        const parsedExamples = Array.isArray(def?.parsedExamples) ? def.parsedExamples : [];
        for (const ex of parsedExamples) {
          const sentence = cleanPlainText(ex?.example ?? '', 220);
          if (sentence && sentence.length >= 12 && examples.length < 3) {
            examples.push({ sentence, translation: '', source: 'English Wiktionary' });
          }
        }
        const plainExamples = Array.isArray(def?.examples) ? def.examples : [];
        for (const ex of plainExamples) {
          const sentence = cleanPlainText(typeof ex === 'string' ? ex : '', 220);
          if (sentence && sentence.length >= 12 && examples.length < 3) {
            examples.push({ sentence, translation: '', source: 'English Wiktionary' });
          }
        }
      }
    }

    if (englishDefinitions.length > 0) {
      senses.push({ partOfSpeech: posLabel, englishDefinitions, examples });
    }
  }

  return { lemma: lemma || undefined, senses };
}

export function parseTatoebaPairs(payload, term) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  if (!results.length) return [];

  const seen = new Set();
  const pairs = [];
  for (const item of results) {
    const sentence = cleanPlainText(item?.text ?? '', 200);
    if (!sentence || sentence.length < 10 || sentence.length > 160) continue;
    const key = normalizeSentenceKey(sentence);
    if (seen.has(key) || !containsTermLoose(sentence, term)) continue;

    const translations = Array.isArray(item?.translations) ? item.translations.flat() : [];
    const vi = translations.find((entry) => entry?.lang === 'vie' && typeof entry?.text === 'string' && entry.text.trim());
    if (!vi) continue;
    const translation = cleanPlainText(vi.text, 220);
    if (!translation || !VIETNAMESE_MARKS.test(translation.normalize('NFC'))) continue;

    seen.add(key);
    const id = Number(item?.id);
    pairs.push({
      sentence,
      translation,
      source: 'Tatoeba',
      ...(Number.isInteger(id) && id > 0 ? { sourceUrl: 'https://tatoeba.org/en/sentences/show/' + id } : {}),
    });
    if (pairs.length >= 6) break;
  }
  return pairs;
}

const FAMILY_PREFIXES = ['un', 'in', 'im', 'il', 'ir', 'dis', 're', 'non', 'mis', 'over', 'under'];

const FAMILY_STRIP_SUFFIXES = [
  'ification', 'ization', 'isation', 'ability', 'ibility', 'fulness', 'lessness',
  'ational', 'itional', 'atively', 'itively', 'iveness', 'ousness', 'ishment',
  'ation', 'ition', 'ative', 'itive', 'atory', 'itory', 'ingly', 'fully', 'lessly', 'ously', 'ically', 'ally',
  'ment', 'ness', 'ance', 'ence', 'ancy', 'ency', 'able', 'ible', 'ably', 'ibly', 'less', 'ship', 'hood',
  'tion', 'sion', 'ivity', 'ical', 'ious', 'eous', 'edly',
  'ity', 'ety', 'acy', 'ive', 'ful', 'ous', 'ant', 'ent', 'ary', 'ory', 'ery', 'ize', 'ise', 'ify', 'ate', 'ist', 'ism', 'age', 'ure', 'ing', 'ial',
  'al', 'ic', 'ly', 'er', 'or', 'ar', 'ed', 'ee', 'ty', 'en',
];

const VALID_DERIVATIONAL_SUFFIXES = new Set([
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

const STEM_ALTERNATIONS = [
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
  [/([a-z]{2,})sum$/i, '$1sumpt'],
  [/([a-z]{2,})sumpt$/i, '$1sum'],
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
  [/([a-z]{2,})satisf$/i, '$1satisfact'],
  [/([a-z]{2,})satisfact$/i, '$1satisf'],
];

export function extractWordFamilyStems(rawTerm) {
  const clean = typeof rawTerm === 'string' ? rawTerm.trim().toLowerCase() : '';
  if (!/^[a-z]{3,28}$/.test(clean)) return [];

  const stems = [];
  const pushStem = (value) => {
    const trimmed = value.replace(/[^a-z]/g, '');
    if (trimmed.length >= 4 && !stems.includes(trimmed)) stems.push(trimmed);
  };

  let base = clean;
  // Strip one productive prefix only when remaining base is long enough
  for (const prefix of FAMILY_PREFIXES) {
    if (base.startsWith(prefix) && base.length - prefix.length >= 4) {
      const stripped = base.slice(prefix.length);
      if (FAMILY_STRIP_SUFFIXES.some((sfx) => stripped.endsWith(sfx) && stripped.length - sfx.length >= 4)) {
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
    for (const sfx of FAMILY_STRIP_SUFFIXES) {
      if (stem.endsWith(sfx) && stem.length - sfx.length >= 4) {
        stem = stem.slice(0, -sfx.length);
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }

  // Handle silent -e / -y on base stems (e.g. create -> creat, decide -> decid, happy -> happ)
  if (stem.length >= 4 && (stem.endsWith('e') || stem.endsWith('y'))) {
    stem = stem.slice(0, -1);
  }
  // Collapse doubled final consonant (e.g. permitting -> permitt -> permit)
  if (stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2] && !/[aeioulsz]$/.test(stem)) {
    stem = stem.slice(0, -1);
  }

  if (stem.length >= 3 && !stems.includes(stem)) stems.push(stem);

  // Add Latinate stem alternation (e.g. decid <-> decis, produc <-> product)
  for (const [pattern, replacement] of STEM_ALTERNATIONS) {
    if (pattern.test(stem)) {
      pushStem(stem.replace(pattern, replacement));
      break;
    }
  }

  return stems.slice(0, 2);
}

function isSimpleInflectionOf(candidate, baseWord) {
  const c = candidate.toLowerCase();
  const b = baseWord.toLowerCase();
  if (c === b) return true;
  if (c === b + 's' || c === b + 'es' || c === b + 'ed' || c === b + 'd' || c === b + 'ing') return true;
  if (b.endsWith('e') && (c === b.slice(0, -1) + 'ing' || c === b.slice(0, -1) + 'ed')) return true;
  if (b.endsWith('y') && (c === b.slice(0, -1) + 'ies' || c === b.slice(0, -1) + 'ied')) return true;
  return false;
}

function mapDatamusePosTag(tags) {
  if (!Array.isArray(tags)) return '';
  for (const tag of tags) {
    if (tag === 'n') return 'Danh từ';
    if (tag === 'v') return 'Động từ';
    if (tag === 'adj') return 'Tính từ';
    if (tag === 'adv') return 'Trạng từ';
  }
  return '';
}

function extractDatamuseFreq(tags) {
  if (!Array.isArray(tags)) return 0;
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.startsWith('f:')) {
      const num = Number(tag.slice(2));
      return Number.isFinite(num) ? num : 0;
    }
  }
  return 0;
}

export function parseWordFamilyFromDatamuse(rawItems, headword, stems, bonusTerms = []) {
  const lowerHead = typeof headword === 'string' ? headword.trim().toLowerCase() : '';
  if (!/^[a-z]{3,28}$/.test(lowerHead) || !Array.isArray(rawItems) || !stems.length) return [];

  const bonusSet = new Set(bonusTerms.map((t) => t.toLowerCase()));
  const byTerm = new Map();

  for (const item of rawItems) {
    const word = typeof item?.word === 'string' ? item.word.trim().toLowerCase() : '';
    if (!/^[a-z]{3,28}$/.test(word) || word === lowerHead) continue;
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    if (tags[0] === 'prop') continue;

    const pos = mapDatamusePosTag(tags);
    if (!pos) continue;
    const freq = extractDatamuseFreq(tags);
    const isAdverb = pos === 'Trạng từ' && word.endsWith('ly');
    const minFreq = bonusSet.has(word) ? 0.01 : isAdverb ? 0.01 : 0.12;
    if (freq < minFreq) continue;

    // Validate genuine derivational relationship to one of our stems
    const matchedStem = stems.find((stem) => word.startsWith(stem));
    if (!matchedStem) continue;
    const remainder = word.slice(matchedStem.length);
    if (remainder === '' && freq < 1.5) continue;
    const normalizedRemainder = remainder.length >= 2 && remainder[0] === matchedStem[matchedStem.length - 1]
      ? remainder.slice(1)
      : remainder;
    if (!VALID_DERIVATIONAL_SUFFIXES.has(remainder) && !VALID_DERIVATIONAL_SUFFIXES.has(normalizedRemainder)) {
      continue;
    }

    // Skip plain verb/plural inflections of headword, except strong adjectival participles (e.g. educated, decided)
    if (isSimpleInflectionOf(word, lowerHead)) {
      const primaryTag = tags.find((t) => t === 'n' || t === 'v' || t === 'adj' || t === 'adv');
      if (!(primaryTag === 'adj' && freq >= 1.5 && (word.endsWith('ed') || word.endsWith('ing')))) {
        continue;
      }
    }

    // Skip plain verb participles (-ing/-ed) whose primary tag is verb or noun-gerund
    if ((word.endsWith('ing') || word.endsWith('ed')) && !word.endsWith('eed')) {
      const primaryTag = tags.find((t) => t === 'n' || t === 'v' || t === 'adj' || t === 'adv');
      if (primaryTag !== 'adj' || freq < 1.5) continue;
    }

    const existing = byTerm.get(word);
    if (!existing || freq > existing.freq) {
      byTerm.set(word, { term: word, partOfSpeech: pos, freq, bonus: bonusSet.has(word) });
    }
  }

  // Drop simple plurals when their singular form is already in the family (e.g. educators vs educator)
  const candidates = Array.from(byTerm.values()).filter((item) => {
    if (item.term.endsWith('ies') && byTerm.has(item.term.slice(0, -3) + 'y')) return false;
    if (item.term.endsWith('es') && byTerm.has(item.term.slice(0, -2))) return false;
    if (item.term.endsWith('s') && !item.term.endsWith('ss') && !item.term.endsWith('us') && !item.term.endsWith('is') &&
        byTerm.has(item.term.slice(0, -1))) return false;
    return true;
  });

  candidates.sort((a, b) => (Number(b.bonus) - Number(a.bonus)) || (b.freq - a.freq));

  // Pick one strongest member per distinct POS first for balanced learner variety, then fill by frequency
  const selected = [];
  const usedTerms = new Set();
  const posPriority = ['Danh từ', 'Động từ', 'Tính từ', 'Trạng từ'];
  for (const pos of posPriority) {
    const best = candidates.find((c) => c.partOfSpeech === pos && !usedTerms.has(c.term));
    if (best) {
      usedTerms.add(best.term);
      selected.push(best);
    }
  }
  for (const item of candidates) {
    if (selected.length >= 8) break;
    if (!usedTerms.has(item.term)) {
      usedTerms.add(item.term);
      selected.push(item);
    }
  }

  return selected.map(({ term, partOfSpeech }) => ({ term, partOfSpeech }));
}

export function parseFluentDictPayload(payload, queriedTerm) {
  if (!payload || typeof payload !== 'object') return null;
  const term = cleanPlainText(payload.word ?? payload.term ?? queriedTerm, 80);
  const entry = payload.entry && typeof payload.entry === 'object' ? payload.entry : payload;
  if (!term || !entry || typeof entry !== 'object') return null;

  const phonetic = normalizePhonetic(entry.pronunciation ?? entry.phonetic ?? '');
  const inflectionNote = cleanPlainText(entry._note ?? entry.note ?? '', 180) || undefined;
  const parts = entry.parts && typeof entry.parts === 'object' ? entry.parts : {};
  const senses = [];

  for (const [rawPos, block] of Object.entries(parts)) {
    if (!block || typeof block !== 'object') continue;
    const posLabel = mapPartOfSpeechVi(rawPos === '_' ? '' : rawPos, term);
    const meanings = [];
    const examples = [];
    const collocations = [];

    const rawMeanings = Array.isArray(block.meanings) ? block.meanings
      : Array.isArray(block.definitions) ? block.definitions
        : typeof block.meaning === 'string' ? [block.meaning] : [];

    for (const item of rawMeanings) {
      if (typeof item === 'string') {
        const text = cleanPlainText(item, 220);
        if (text && !meanings.includes(text)) meanings.push(text);
        continue;
      }
      if (item && typeof item === 'object') {
        const text = cleanPlainText(item.meaning ?? item.definition ?? item.text ?? '', 220);
        if (text && !meanings.includes(text)) meanings.push(text);
        const itemExamples = Array.isArray(item.examples) ? item.examples : [];
        for (const ex of itemExamples) {
          const sentence = cleanPlainText(ex?.en ?? ex?.sentence ?? ex?.example ?? '', 220);
          const translation = cleanPlainText(ex?.vi ?? ex?.translation ?? ex?.meaning ?? '', 240);
          if (sentence && translation) {
            if (isSentenceLike(sentence)) examples.push({ sentence, translation, source: 'FluentDict (TFlat)' });
            else collocations.push({ phrase: sentence, meaning: translation });
          }
        }
      }
    }

    const blockIdioms = Array.isArray(block.idioms) ? block.idioms : Array.isArray(block.collocations) ? block.collocations : [];
    for (const idiom of blockIdioms) {
      const phrase = cleanPlainText(idiom?.phrase ?? idiom?.en ?? idiom?.text ?? '', 120);
      const meaning = cleanPlainText(idiom?.meaning ?? idiom?.vi ?? '', 180);
      if (phrase) collocations.push({ phrase, meaning });
    }

    if (meanings.length > 0) {
      senses.push({
        partOfSpeech: posLabel,
        meaning: meanings.slice(0, 2).join('; '),
        englishDefinition: '',
        examples: examples.slice(0, 4),
        collocations: collocations.slice(0, 5),
        synonyms: [],
        antonyms: [],
      });
    }
  }

  if (!senses.length) return null;
  return { term, phonetic, inflectionNote, senses };
}

function validateFluentDictBaseUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const parsed = new URL(raw.trim());
    const host = parsed.hostname.toLowerCase();
    const isLocal = LOCAL_HOSTNAMES.has(host);
    if (parsed.protocol === 'http:' && !isLocal) return '';
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (!isLocal && PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) return '';
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

async function fetchJsonSafe(request, url, { timeoutMs = 6_500, redirect = 'follow' } = {}) {
  const response = await request(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    redirect,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  const text = await response.text();
  if (!text || text.length > MAX_RESPONSE_BYTES) return null;
  return JSON.parse(text);
}

async function translateToVietnamese(request, text) {
  const clean = cleanPlainText(text, 220);
  if (!clean) return '';
  try {
    const data = await fetchJsonSafe(
      request,
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(clean) + '&langpair=en|vi',
      { timeoutMs: 4_500 },
    );
    const translated = cleanPlainText(data?.responseData?.translatedText ?? '', 260);
    if (!translated || translated.toUpperCase().includes('MYMEMORY WARNING') || !VIETNAMESE_MARKS.test(translated.normalize('NFC'))) {
      return '';
    }
    return translated;
  } catch {
    return '';
  }
}

function deduplicateExamples(examples, term) {
  const seen = new Set();
  const withTerm = [];
  const withoutTerm = [];
  for (const ex of examples) {
    const sentence = cleanPlainText(ex?.sentence ?? '', 220);
    const translation = cleanPlainText(ex?.translation ?? '', 260);
    if (!sentence || sentence.length < 8) continue;
    const key = normalizeSentenceKey(sentence);
    if (seen.has(key)) continue;
    seen.add(key);
    const cleanEx = {
      sentence,
      translation,
      ...(ex?.source ? { source: ex.source } : {}),
      ...(typeof ex?.sourceUrl === 'string' && ex.sourceUrl.startsWith('https://') ? { sourceUrl: ex.sourceUrl } : {}),
    };
    if (containsTermLoose(sentence, term)) withTerm.push(cleanEx);
    else withoutTerm.push(cleanEx);
  }
  // Prefer bilingual examples containing the term first
  const score = (item) => (item.translation ? 0 : 1);
  withTerm.sort((a, b) => score(a) - score(b));
  withoutTerm.sort((a, b) => score(a) - score(b));
  return [...withTerm, ...withoutTerm];
}

function deduplicateCollocations(items) {
  const seen = new Set();
  const list = [];
  for (const item of items) {
    const phrase = cleanPlainText(item?.phrase ?? '', 120);
    const meaning = cleanPlainText(item?.meaning ?? '', 180);
    if (!phrase) continue;
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ phrase, meaning });
    if (list.length >= 6) break;
  }
  return list;
}

function createTtlCache() {
  const store = new Map();
  return {
    get(key, now) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (now - hit.createdAt > CACHE_TTL_MS) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value, now) {
      if (store.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) store.delete(oldestKey);
      }
      store.set(key, { value, createdAt: now });
    },
  };
}

export function createDictionaryRouter(env = {}, { request = fetch, now = Date.now } = {}) {
  const router = express();
  router.disable('x-powered-by');

  const fluentDictBaseUrl = validateFluentDictBaseUrl(env.FLUENTDICT_API_URL);
  const suggestCache = createTtlCache();
  const lookupCache = createTtlCache();
  let recentSuggestCalls = [];
  let recentLookupCalls = [];
  let inFlight = 0;

  function errorResponse(res, status, reason, message) {
    res.status(status).json({ status: 'error', reason, message });
  }

  function allowRate(bucket, maxPerMinute, time) {
    const recent = bucket.filter((ts) => time - ts < MINUTE);
    if (recent.length >= maxPerMinute) return { ok: false, recent };
    recent.push(time);
    return { ok: true, recent };
  }

  async function lookupFluentDict(term) {
    if (!fluentDictBaseUrl) return null;
    const encoded = encodeURIComponent(term);
    const endpoints = [
      fluentDictBaseUrl + '/api/v1/dict/word/' + encoded,
      fluentDictBaseUrl + '/api/word/' + encoded,
    ];
    for (const url of endpoints) {
      try {
        const payload = await fetchJsonSafe(request, url, { timeoutMs: 4_000, redirect: 'error' });
        const parsed = parseFluentDictPayload(payload, term);
        if (parsed) return { ...parsed, sourceUrl: fluentDictBaseUrl };
      } catch {
        // Try next path or fall back to open providers.
      }
    }
    return null;
  }

  async function suggestFluentDict(query, limit) {
    if (!fluentDictBaseUrl) return [];
    const qs = '?q=' + encodeURIComponent(query) + '&limit=' + limit;
    for (const path of ['/api/v1/dict/search', '/api/search']) {
      try {
        const payload = await fetchJsonSafe(request, fluentDictBaseUrl + path + qs, { timeoutMs: 3_000, redirect: 'error' });
        const list = Array.isArray(payload?.words) ? payload.words
          : Array.isArray(payload?.data) ? payload.data
            : Array.isArray(payload?.results) ? payload.results : [];
        const terms = list
          .map((item) => typeof item === 'string' ? item : item?.word ?? item?.term ?? '')
          .map((item) => normalizeLookupQuery(item))
          .filter(Boolean);
        if (terms.length) return terms.slice(0, limit);
      } catch {
        // Fall through
      }
    }
    return [];
  }

  async function fetchOpenProviders(term) {
    const encoded = encodeURIComponent(term);
    const stems = extractWordFamilyStems(term);
    const [viWikiRaw, freeDictRaw, enWikiRaw, tatoebaRaw, ...datamuseFamilyRaws] = await Promise.all([
      fetchJsonSafe(
        request,
        'https://vi.wiktionary.org/w/api.php?action=parse&page=' + encoded + '&prop=wikitext&format=json',
      ).catch(() => null),
      fetchJsonSafe(
        request,
        'https://api.dictionaryapi.dev/api/v2/entries/en/' + encoded,
      ).catch(() => null),
      fetchJsonSafe(
        request,
        'https://en.wiktionary.org/api/rest_v1/page/definition/' + encoded,
      ).catch(() => null),
      fetchJsonSafe(
        request,
        'https://tatoeba.org/en/api_v0/search?from=eng&to=vie&query=' + encoded + '&sort=relevance',
      ).catch(() => null),
      ...stems.map((stem) =>
        fetchJsonSafe(
          request,
          'https://api.datamuse.com/words?sp=' + encodeURIComponent(stem + '*') + '&md=pf&max=30',
          { timeoutMs: 4_500 },
        ).catch(() => null),
      ),
    ]);

    const viWiki = parseViWiktionaryEntry(viWikiRaw?.parse?.wikitext?.['*'], term);
    const freeDict = parseFreeDictionaryPayload(freeDictRaw);
    const enWiki = parseEnWiktionaryDefinition(enWikiRaw, term);
    const tatoeba = parseTatoebaPairs(tatoebaRaw, term);
    const datamuseFlat = datamuseFamilyRaws.flatMap((batch) => Array.isArray(batch) ? batch : []);
    const wordFamily = parseWordFamilyFromDatamuse(
      datamuseFlat,
      freeDict?.term || term,
      stems,
      viWiki?.derivedTerms ?? [],
    );

    return { viWiki, freeDict, enWiki, tatoeba, wordFamily };
  }

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/suggest', async (req, res) => {
    if (!isLocalRequest(req, { allowMissingOrigin: true })) {
      return errorResponse(res, 403, 'forbidden', 'Yêu cầu không hợp lệ.');
    }
    const query = normalizeLookupQuery(typeof req.query.q === 'string' ? req.query.q : '');
    if (!query || query.length < 2) {
      return res.json({ status: 'ok', query, suggestions: [] });
    }
    const rawLimit = Number(req.query.limit ?? 8);
    const limit = Number.isFinite(rawLimit) ? Math.min(12, Math.max(1, Math.trunc(rawLimit))) : 8;

    const time = now();
    const cacheKey = query.toLowerCase() + ':' + limit;
    const cached = suggestCache.get(cacheKey, time);
    if (cached) return res.json(cached);

    const rate = allowRate(recentSuggestCalls, LIMITS.suggestPerMinute, time);
    recentSuggestCalls = rate.recent;
    if (!rate.ok) return errorResponse(res, 429, 'rate_limit', 'Bạn đang tra quá nhanh, hãy thử lại sau ít giây.');

    try {
      const fluentMatches = await suggestFluentDict(query, limit);
      const [datamuseRaw, viOpenSearchRaw] = fluentMatches.length >= limit
        ? [null, null]
        : await Promise.all([
          fetchJsonSafe(request, 'https://api.datamuse.com/sug?s=' + encodeURIComponent(query) + '&max=' + limit, { timeoutMs: 4_000 }).catch(() => null),
          fetchJsonSafe(request, 'https://vi.wiktionary.org/w/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=' + limit + '&format=json', { timeoutMs: 4_000 }).catch(() => null),
        ]);

      const seen = new Set();
      const suggestions = [];
      const addCandidate = (word, source) => {
        const clean = normalizeLookupQuery(word);
        if (!clean) return;
        const key = clean.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        suggestions.push({ term: clean, source });
      };

      for (const word of fluentMatches) addCandidate(word, 'FluentDict');
      if (Array.isArray(datamuseRaw)) {
        for (const item of datamuseRaw) addCandidate(item?.word, 'Datamuse');
      }
      if (Array.isArray(viOpenSearchRaw) && Array.isArray(viOpenSearchRaw[1])) {
        for (const title of viOpenSearchRaw[1]) {
          if (typeof title === 'string' && /^[A-Za-z][A-Za-z\s'-]{0,40}$/.test(title)) {
            addCandidate(title, 'Wiktionary');
          }
        }
      }

      const payload = { status: 'ok', query, suggestions: suggestions.slice(0, limit) };
      suggestCache.set(cacheKey, payload, time);
      return res.json(payload);
    } catch {
      return errorResponse(res, 502, 'provider', 'Chưa lấy được gợi ý từ điển trực tuyến.');
    }
  });

  router.get('/lookup', async (req, res) => {
    if (!isLocalRequest(req, { allowMissingOrigin: true })) {
      return errorResponse(res, 403, 'forbidden', 'Yêu cầu không hợp lệ.');
    }
    const queriedTerm = normalizeLookupQuery(typeof req.query.q === 'string' ? req.query.q : '');
    if (!queriedTerm) {
      return errorResponse(res, 400, 'invalid_query', 'Hãy nhập một từ hoặc cụm từ tiếng Anh hợp lệ.');
    }

    const time = now();
    const cacheKey = queriedTerm.toLowerCase();
    const cached = lookupCache.get(cacheKey, time);
    if (cached) return res.json(cached);

    if (inFlight >= LIMITS.concurrent) {
      return errorResponse(res, 503, 'busy', 'Hệ thống đang bận, thử lại sau giây lát.');
    }
    const rate = allowRate(recentLookupCalls, LIMITS.lookupPerMinute, time);
    recentLookupCalls = rate.recent;
    if (!rate.ok) {
      return errorResponse(res, 429, 'rate_limit', 'Bạn đang tra quá nhanh, hãy chờ một chút.');
    }

    inFlight += 1;
    try {
      const [fluentResult, initialOpen] = await Promise.all([
        lookupFluentDict(queriedTerm),
        fetchOpenProviders(queriedTerm),
      ]);

      let activeTerm = fluentResult?.term || initialOpen.freeDict?.term || queriedTerm;
      let inflectionNote = fluentResult?.inflectionNote;
      let openData = initialOpen;

      // If queried word is an inflection with no Vietnamese entry, follow the lemma automatically
      const detectedLemma = initialOpen.enWiki?.lemma;
      if (!fluentResult && !initialOpen.viWiki && detectedLemma && detectedLemma.toLowerCase() !== queriedTerm.toLowerCase()) {
        const lemmaOpen = await fetchOpenProviders(detectedLemma);
        if (lemmaOpen.viWiki || lemmaOpen.freeDict || lemmaOpen.enWiki) {
          activeTerm = lemmaOpen.freeDict?.term || detectedLemma;
          inflectionNote = `"${queriedTerm}" là dạng biến thể của "${activeTerm}".`;
          openData = {
            viWiki: lemmaOpen.viWiki,
            freeDict: lemmaOpen.freeDict ?? initialOpen.freeDict,
            enWiki: lemmaOpen.enWiki ?? initialOpen.enWiki,
            tatoeba: lemmaOpen.tatoeba.length ? lemmaOpen.tatoeba : initialOpen.tatoeba,
            wordFamily: lemmaOpen.wordFamily.length ? lemmaOpen.wordFamily : initialOpen.wordFamily,
          };
        }
      }

      const { viWiki, freeDict, enWiki, tatoeba, wordFamily } = openData;
      const hasAnyData = Boolean(fluentResult || viWiki || freeDict || enWiki);
      if (!hasAnyData) {
        return res.status(404).json({
          status: 'not_found',
          term: queriedTerm,
          links: buildExternalLinks(queriedTerm),
          message: 'Không tìm thấy mục từ khớp trên các nguồn mở. Bạn vẫn có thể mở trực tiếp Cambridge Dictionary.',
        });
      }

      // Build unified senses keyed by canonical Vietnamese partOfSpeech
      const senseMap = new Map();
      const ensureSense = (pos) => {
        if (!senseMap.has(pos)) {
          senseMap.set(pos, {
            partOfSpeech: pos,
            meaning: '',
            englishDefinition: '',
            collocations: [],
            examples: [],
            synonyms: [],
            antonyms: [],
          });
        }
        return senseMap.get(pos);
      };

      if (fluentResult) {
        for (const s of fluentResult.senses) {
          const target = ensureSense(s.partOfSpeech);
          if (!target.meaning && s.meaning) target.meaning = s.meaning;
          target.collocations.push(...s.collocations);
          target.examples.push(...s.examples);
        }
      }

      if (viWiki) {
        for (const s of viWiki.senses) {
          const target = ensureSense(s.partOfSpeech);
          if (!target.meaning && s.meaning) target.meaning = s.meaning;
          target.collocations.push(...s.collocations);
          target.examples.push(...s.examples);
        }
      }

      if (freeDict) {
        for (const s of freeDict.senses) {
          const target = ensureSense(s.partOfSpeech);
          if (!target.englishDefinition && s.englishDefinitions[0]) target.englishDefinition = s.englishDefinitions[0];
          target.examples.push(...s.examples);
          target.synonyms.push(...s.synonyms);
          target.antonyms.push(...s.antonyms);
        }
      }

      if (enWiki) {
        for (const s of enWiki.senses) {
          const target = ensureSense(s.partOfSpeech);
          if (!target.englishDefinition && s.englishDefinitions[0]) target.englishDefinition = s.englishDefinitions[0];
          target.examples.push(...s.examples);
        }
      }

      let senses = Array.from(senseMap.values());

      // Translate missing Vietnamese meaning for primary sense (e.g. phrasal verbs like "break down")
      let usedMachineTranslation = false;
      for (const sense of senses.slice(0, 2)) {
        if (!sense.meaning && sense.englishDefinition) {
          const translated = await translateToVietnamese(request, sense.englishDefinition);
          if (translated) {
            sense.meaning = translated;
            usedMachineTranslation = true;
          }
        }
      }

      // Collect global bilingual examples, prioritizing Tatoeba + Wiktionary bilingual pairs
      const senseExamples = senses.flatMap((s) => s.examples);
      const mergedExamples = deduplicateExamples([...tatoeba, ...senseExamples], activeTerm);

      // Ensure up to 4 top examples have Vietnamese translations
      const translatedExamples = [];
      for (const ex of mergedExamples.slice(0, 5)) {
        if (ex.translation) {
          translatedExamples.push(ex);
        } else if (translatedExamples.length < 4) {
          const vi = await translateToVietnamese(request, ex.sentence);
          if (vi) usedMachineTranslation = true;
          translatedExamples.push({ ...ex, translation: vi });
        }
      }

      // Attach cleaned examples & collocations per sense
      senses = senses
        .filter((s) => s.meaning || s.englishDefinition)
        .map((s) => {
          const cleanedExamples = deduplicateExamples(s.examples, activeTerm).map((ex) => {
            if (ex.translation) return ex;
            const match = translatedExamples.find((t) => normalizeSentenceKey(t.sentence) === normalizeSentenceKey(ex.sentence));
            return match ?? ex;
          });
          return {
            partOfSpeech: s.partOfSpeech,
            meaning: s.meaning || s.englishDefinition,
            ...(s.englishDefinition ? { englishDefinition: s.englishDefinition } : {}),
            collocations: deduplicateCollocations(s.collocations),
            examples: cleanedExamples.slice(0, 4),
            synonyms: Array.from(new Set(s.synonyms)).slice(0, 6),
            antonyms: Array.from(new Set(s.antonyms)).slice(0, 6),
          };
        });

      const ukPhonetic = freeDict?.ukPhonetic || '';
      const usPhonetic = freeDict?.usPhonetic || '';
      const primaryPhonetic = usPhonetic || fluentResult?.phonetic || freeDict?.phonetic || viWiki?.phonetic || ukPhonetic || '';
      const englishForms = (ukPhonetic || usPhonetic)
        ? {
            ...(ukPhonetic ? { 'en-GB': { phonetic: ukPhonetic } } : {}),
            ...(usPhonetic ? { 'en-US': { phonetic: usPhonetic } } : {}),
          }
        : undefined;

      const providers = [];
      if (fluentResult) {
        providers.push({ id: 'fluentdict', name: 'FluentDict (TFlat)', license: 'Local / Self-hosted', url: fluentResult.sourceUrl });
      }
      if (viWiki) {
        providers.push({
          id: 'vi-wiktionary',
          name: 'Wiktionary Anh–Việt (FVDP)',
          license: 'CC BY-SA 4.0',
          url: 'https://vi.wiktionary.org/wiki/' + encodeURIComponent(activeTerm.replace(/\s+/g, '_')),
        });
      }
      if (freeDict) {
        providers.push({
          id: 'free-dictionary',
          name: 'Free Dictionary API',
          license: 'CC BY-SA 3.0',
          url: freeDict.sourceUrl ?? ('https://en.wiktionary.org/wiki/' + encodeURIComponent(activeTerm.replace(/\s+/g, '_'))),
        });
      } else if (enWiki) {
        providers.push({
          id: 'en-wiktionary',
          name: 'English Wiktionary',
          license: 'CC BY-SA 4.0',
          url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(activeTerm.replace(/\s+/g, '_')),
        });
      }
      if (tatoeba.length) {
        providers.push({
          id: 'tatoeba',
          name: 'Tatoeba',
          license: 'CC BY 2.0',
          url: 'https://tatoeba.org/en/sentences/search?from=eng&to=vie&query=' + encodeURIComponent(activeTerm),
        });
      }
      if (usedMachineTranslation) {
        providers.push({
          id: 'mymemory',
          name: 'MyMemory (hỗ trợ dịch câu ví dụ)',
          license: 'Public Translation API',
        });
      }

      const result = {
        status: 'ok',
        term: activeTerm,
        queriedTerm,
        ...(inflectionNote ? { inflectionNote } : {}),
        phonetic: primaryPhonetic,
        ...(englishForms ? { englishForms } : {}),
        senses,
        examples: translatedExamples.slice(0, 4),
        collocations: deduplicateCollocations(senses.flatMap((s) => s.collocations)),
        synonyms: Array.from(new Set(freeDict?.synonyms ?? [])).slice(0, 8),
        antonyms: Array.from(new Set(freeDict?.antonyms ?? [])).slice(0, 8),
        wordFamily,
        providers,
        links: buildExternalLinks(activeTerm),
        fetchedAt: time,
      };

      lookupCache.set(cacheKey, result, time);
      return res.json(result);
    } catch {
      return errorResponse(res, 502, 'provider', 'Không thể kết nối nguồn từ điển lúc này.');
    } finally {
      inFlight -= 1;
    }
  });

  return router;
}
