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
  ['intj', 'Thán từ'],
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
  ['proverb', 'Thành ngữ'],
  ['thành ngữ', 'Thành ngữ'],
  ['tục ngữ', 'Thành ngữ'],
  ['phrase', 'Cụm từ'],
  ['prep_phrase', 'Cụm từ'],
  ['prepositional phrase', 'Cụm từ'],
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

function normalizePunctuationSpacing(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([{“‘])\s+/g, '$1')
    .replace(/\s+([)\]}”’])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(html) {
  if (typeof html !== 'string') return '';
  const withoutInline = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?(?:b|i|em|strong|a|span|small|sup|sub|abbr|u|s|mark|cite|q)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return normalizePunctuationSpacing(decodeHtmlEntities(withoutInline));
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

const VI_ARCHAIC_TAG_PATTERN = /(?:từ cổ|nghĩa cổ|cổ|từ hiếm|nghĩa hiếm|hiếm|cũ|ít dùng|từ địa phương|địa phương|phương ngữ|tục|thô tục|lóng)/i;
const VI_NICHE_DOMAIN_TAG_PATTERN = /(?:số nhiều|thương nghiệp|hàng hải|thực vật học|động vật học|giải phẫu|khoáng vật học|địa chất|hóa học|vật lý|toán học|quân sự|pháp lý|luật|y học|dược|tôn giáo|kiến trúc|âm nhạc|thể thao|thiên văn|điện học|cơ khí|nông nghiệp|in ấn|ngôn ngữ học|từ mỹ|nghĩa mỹ|từ anh|nghĩa anh|từ úc|từ scotland|từ ireland|sinh vật học|tâm lý học|triết học|kinh tế học|chính trị|ngoại giao|sử học|khảo cổ)/i;
const VI_FIGURATIVE_TAG_PATTERN = /(?:nghĩa bóng|bóng|ẩn dụ|idiom|idiomatic|thành ngữ)/i;

function extractWikitextUsageFlags(line) {
  const labels = [];
  for (const match of line.matchAll(/\{\{(?:lb|label|nhãn|context|tlb|term)\s*\|([^}]*)\}\}/gi)) {
    const parts = match[1]
      .split('|')
      .map((p) => p.trim())
      .filter((p) => p && !p.includes('=') && !/^(en|vi|eng|vie)$/i.test(p));
    labels.push(...parts);
  }
  const joined = labels.join(', ');
  return {
    isArchaic: VI_ARCHAIC_TAG_PATTERN.test(joined),
    isNiche: VI_NICHE_DOMAIN_TAG_PATTERN.test(joined),
    isFigurative: VI_FIGURATIVE_TAG_PATTERN.test(joined),
  };
}

function cleanWikitext(line) {
  if (typeof line !== 'string') return '';
  let text = line
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, ' ');

  // Strip usage/domain label templates (including FVDP's {{term|...}} labels) so they don't pollute meanings
  text = text.replace(/\{\{(?:lb|label|nhãn|context|tlb|term)\s*\|[^}]*\}\}/gi, '');
  // Replace remaining inline mention/link templates cleanly
  text = text.replace(/\{\{(?:l|m|mention|ux|quote)\s*\|([^}]*)\}\}/gi, (_m, inner) => {
    const parts = inner.split('|').map((p) => p.trim()).filter((p) => p && !p.includes('='));
    if (!parts.length) return '';
    if (parts.length >= 2 && /^(en|vi|eng|vie)$/i.test(parts[0])) return parts[1];
    return parts[0];
  });
  text = text.replace(/\{\{[^}]*\}\}/g, '');

  // Convert [[target|label]] -> label, [[word]] -> word
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Remove bold/italic wiki quotes and FVDP double-parenthetical noise like ((nghĩa đen) & (nghĩa bóng))
  text = text
    .replace(/'{2,5}/g, '')
    .replace(/\(\(\s*cũng\s*\)\s*[^)]*\)/gi, '')
    .replace(/\(\(\s*xem\s*\)\s*[^)]*\)/gi, '')
    .replace(/\(\(\s*nghĩa đen\s*\)\s*(?:&|và)\s*\(\s*nghĩa bóng\s*\)\)/gi, '')
    .replace(/\(\s*nghĩa đen\s*(?:&|và)\s*nghĩa bóng\s*\)/gi, '')
    .replace(/\(\s*\)/g, '');

  text = normalizePunctuationSpacing(text)
    .replace(/^\s*[,;:\-–—]+\s*/, '')
    .trim();

  return text;
}

function isSentenceLike(english) {
  const trimmed = english.trim();
  if (!trimmed || trimmed.length < 12) return false;
  if (/^to\s+[a-z]/i.test(trimmed)) return false;
  if (/[.!?]["”']?$/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  return words.length >= 6 && /\b(?:i|you|he|she|it|we|they|there|here|this|that|these|those|is|are|was|were|am|has|have|had|will|would|can|could|should|must|did|do|does)\b/i.test(trimmed);
}

const IRREGULAR_VERB_FORMS = new Map([
  ['be', ['am', 'is', 'are', 'was', 'were', 'been', 'being']],
  ['bear', ['bore', 'borne', 'bears', 'bearing']],
  ['beat', ['beaten', 'beats', 'beating']],
  ['become', ['became', 'becomes', 'becoming']],
  ['begin', ['began', 'begun', 'begins', 'beginning']],
  ['bite', ['bit', 'bitten', 'bites', 'biting']],
  ['blow', ['blew', 'blown', 'blows', 'blowing']],
  ['break', ['broke', 'broken', 'breaks', 'breaking']],
  ['bring', ['brought', 'brings', 'bringing']],
  ['burn', ['burned', 'burnt', 'burns', 'burning']],
  ['buy', ['bought', 'buys', 'buying']],
  ['catch', ['caught', 'catches', 'catching']],
  ['come', ['came', 'comes', 'coming']],
  ['cost', ['costs', 'costing']],
  ['cut', ['cuts', 'cutting']],
  ['do', ['did', 'done', 'does', 'doing']],
  ['draw', ['drew', 'drawn', 'draws', 'drawing']],
  ['drive', ['drove', 'driven', 'drives', 'driving']],
  ['eat', ['ate', 'eaten', 'eats', 'eating']],
  ['fall', ['fell', 'fallen', 'falls', 'falling']],
  ['feel', ['felt', 'feels', 'feeling']],
  ['find', ['found', 'finds', 'finding']],
  ['fly', ['flew', 'flown', 'flies', 'flying']],
  ['get', ['got', 'gotten', 'gets', 'getting']],
  ['give', ['gave', 'given', 'gives', 'giving']],
  ['go', ['went', 'gone', 'goes', 'going']],
  ['grow', ['grew', 'grown', 'grows', 'growing']],
  ['hang', ['hung', 'hanged', 'hangs', 'hanging']],
  ['have', ['had', 'has', 'having']],
  ['hear', ['heard', 'hears', 'hearing']],
  ['hit', ['hits', 'hitting']],
  ['hold', ['held', 'holds', 'holding']],
  ['keep', ['kept', 'keeps', 'keeping']],
  ['know', ['knew', 'known', 'knows', 'knowing']],
  ['lay', ['laid', 'lays', 'laying']],
  ['lead', ['led', 'leads', 'leading']],
  ['leave', ['left', 'leaves', 'leaving']],
  ['let', ['lets', 'letting']],
  ['lose', ['lost', 'loses', 'losing']],
  ['make', ['made', 'makes', 'making']],
  ['pay', ['paid', 'pays', 'paying']],
  ['put', ['puts', 'putting']],
  ['read', ['reads', 'reading']],
  ['run', ['ran', 'runs', 'running']],
  ['say', ['said', 'says', 'saying']],
  ['see', ['saw', 'seen', 'sees', 'seeing']],
  ['sell', ['sold', 'sells', 'selling']],
  ['send', ['sent', 'sends', 'sending']],
  ['set', ['sets', 'setting']],
  ['shake', ['shook', 'shaken', 'shakes', 'shaking']],
  ['show', ['showed', 'shown', 'shows', 'showing']],
  ['shut', ['shuts', 'shutting']],
  ['sit', ['sat', 'sits', 'sitting']],
  ['speak', ['spoke', 'spoken', 'speaks', 'speaking']],
  ['spend', ['spent', 'spends', 'spending']],
  ['stand', ['stood', 'stands', 'standing']],
  ['stick', ['stuck', 'sticks', 'sticking']],
  ['strike', ['struck', 'strikes', 'striking']],
  ['take', ['took', 'taken', 'takes', 'taking']],
  ['teach', ['taught', 'teaches', 'teaching']],
  ['tear', ['tore', 'torn', 'tears', 'tearing']],
  ['tell', ['told', 'tells', 'telling']],
  ['think', ['thought', 'thinks', 'thinking']],
  ['throw', ['threw', 'thrown', 'throws', 'throwing']],
  ['wear', ['wore', 'worn', 'wears', 'wearing']],
  ['win', ['won', 'wins', 'winning']],
  ['write', ['wrote', 'written', 'writes', 'writing']],
]);

function expandVerbInflections(word) {
  const forms = new Set([word]);
  const irregular = IRREGULAR_VERB_FORMS.get(word);
  if (irregular) {
    for (const f of irregular) forms.add(f);
  }
  forms.add(word + 's');
  forms.add(word + 'es');
  forms.add(word + 'ed');
  forms.add(word + 'ing');
  if (word.endsWith('e') && word.length >= 3) {
    forms.add(word + 'd');
    forms.add(word.slice(0, -1) + 'ing');
  }
  if (word.endsWith('y') && word.length >= 3) {
    forms.add(word.slice(0, -1) + 'ies');
    forms.add(word.slice(0, -1) + 'ied');
  }
  return Array.from(forms);
}

function normalizeSentenceKey(text) {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function containsTermLoose(sentence, term) {
  const haystack = ' ' + normalizeSentenceKey(sentence) + ' ';
  const needle = normalizeSentenceKey(term);
  if (!needle) return false;
  if (haystack.includes(' ' + needle + ' ')) return true;
  if (!needle.includes(' ')) {
    for (const form of expandVerbInflections(needle)) {
      if (haystack.includes(' ' + form + ' ')) return true;
    }
    if (needle.length >= 4) {
      const stem = needle.replace(/(?:ing|ed|es|s|y)$/i, '');
      if (stem.length >= 4 && haystack.includes(' ' + stem)) return true;
    }
    return false;
  }

  // Multi-word phrase / phrasal verb / idiom: allow inflections on the lead verb
  // and optional 1-2 word object between verb + particle (e.g. "took his shoes off")
  const parts = needle.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    const firstForms = expandVerbInflections(parts[0]);
    const rest = parts.slice(1).join(' ');
    for (const form of firstForms) {
      if (haystack.includes(' ' + form + ' ' + rest + ' ')) return true;
    }
    if (parts.length === 2) {
      const escapedRest = parts[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const verbGroup = firstForms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const splitPhrasal = new RegExp(`\\b(?:${verbGroup})\\s+(?:[a-z]+\\s+){1,3}${escapedRest}\\b`, 'i');
      if (splitPhrasal.test(haystack)) return true;
    }
  }
  return false;
}

const EXAMPLE_STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'to', 'at', 'for', 'by', 'with', 'from', 'as', 'is', 'are', 'was', 'were',
  'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may',
  'might', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my',
  'your', 'his', 'her', 'their', 'our', 'and', 'or', 'but', 'not', 'very', 'just', 'so',
]);

export function isNaturalExampleSentence(sentence, term = '') {
  const trimmed = cleanPlainText(sentence, 220);
  if (!trimmed || trimmed.length < 16 || trimmed.length > 175) return false;
  if (IDIOM_PROFANITY_PATTERN.test(trimmed)) return false;
  // Reject infinitive lists or bare dictionary gloss fragments (e.g. "to run through life; to run in a circle")
  if (/^to\s+[a-z]/i.test(trimmed)) return false;
  if (/;\s*to\s+[a-z]/i.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 4 || words.length > 28) return false;
  // Must look like a complete sentence (terminal punctuation or clear finite clause)
  const hasTerminalPunct = /[.!?]["”']?$/.test(trimmed);
  const hasFiniteSignal = /\b(?:i|you|he|she|it|we|they|there|here|this|that|these|those|is|are|was|were|am|has|have|had|will|would|can|could|should|must|did|do|does|don't|doesn't|didn't|won't|can't|isn't|aren't|wasn't|weren't|let's|please)\b/i.test(trimmed);
  if (!hasTerminalPunct && !hasFiniteSignal) return false;
  // Reject bare noun phrases that happen to end with a period or have no verb/subject clue (e.g. "a man of pleasing address")
  if (!hasFiniteSignal && words.length < 7 && /^(?:a|an|the)\s+[a-z]+\s+of\s+/i.test(trimmed)) return false;
  if (term && !containsTermLoose(trimmed, term)) return false;
  return true;
}

function normalizeExampleDisplay(sentence) {
  const trimmed = normalizePunctuationSpacing(sentence);
  if (!trimmed) return '';
  let out = trimmed;
  if (/^[a-z]/.test(out)) {
    out = out[0].toUpperCase() + out.slice(1);
  }
  if (!/[.!?]["”']?$/.test(out)) {
    out = out + '.';
  }
  return out;
}

export function areExamplesTooSimilar(exA, exB) {
  const keyA = normalizeSentenceKey(exA?.sentence ?? '');
  const keyB = normalizeSentenceKey(exB?.sentence ?? '');
  if (!keyA || !keyB) return false;
  if (keyA === keyB) return true;

  // Identical Vietnamese translations usually mean duplicate Tatoeba variations ("Take off your hat / cap / caps")
  const viA = normalizeSentenceKey(exA?.translation ?? '');
  const viB = normalizeSentenceKey(exB?.translation ?? '');
  if (viA && viB && viA.length >= 10 && viA === viB) return true;

  const tokensA = new Set(keyA.split(' ').filter((w) => w.length >= 2 && !EXAMPLE_STOP_WORDS.has(w)));
  const tokensB = new Set(keyB.split(' ').filter((w) => w.length >= 2 && !EXAMPLE_STOP_WORDS.has(w)));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let shared = 0;
  for (const t of tokensA) {
    if (tokensB.has(t) || tokensB.has(t + 's') || (t.endsWith('s') && tokensB.has(t.slice(0, -1)))) {
      shared += 1;
    }
  }
  const union = tokensA.size + tokensB.size - shared;
  return union > 0 && shared / union >= 0.65;
}

const LITERAL_IDIOM_TRAPS = [
  {
    termPattern: /\bpiece of cake\b/i,
    enLiteral: /\b(?:another|eat|ate|eating|want|slice|bake|baked|hungry|delicious|sweet|chocolate|birthday|plate|fork)\b/i,
    viLiteral: /(?:miếng bánh|bánh ngọt|ăn bánh|thêm bánh)/i,
  },
  {
    termPattern: /\bbreak the ice\b/i,
    enLiteral: /\b(?:hammer|pond|lake|river|frozen|freeze|melt|shovel|axe|boots|skating)\b/i,
    viLiteral: /(?:đập vỡ băng|phá băng trên hồ|mặt băng|tảng băng)/i,
  },
  {
    termPattern: /\bunder the weather\b/i,
    enLiteral: /\b(?:forecast|rain|storm|sunny|umbrella|temperature)\b/i,
    viLiteral: /(?:dưới thời tiết|trời mưa)/i,
  },
  {
    termPattern: /\bcost an arm and a leg\b/i,
    enLiteral: /\b(?:doctor|hospital|surgery|accident|amputat)\b/i,
    viLiteral: /(?:một cánh tay và một cái chân|cánh tay và chân)/i,
  },
  {
    termPattern: /\bbreak a leg\b/i,
    enLiteral: /\b(?:hospital|cast|doctor|bone|skiing|fell|fall|stairs|accident)\b/i,
    viLiteral: /(?:gãy chân|bị gãy chân)/i,
  },
  {
    termPattern: /\bspill the beans\b/i,
    enLiteral: /\b(?:kitchen|floor|bowl|pot|cook|soup|jar)\b/i,
    viLiteral: /(?:làm đổ đậu|đổ hạt đậu|hạt đậu)/i,
  },
  {
    termPattern: /\bhit the sack\b/i,
    enLiteral: /\b(?:punch|flour|potato|rice|bag)\b/i,
    viLiteral: /(?:đánh vào bao tải|bao tải)/i,
  },
  {
    termPattern: /\bbite the bullet\b/i,
    enLiteral: /\b(?:gun|rifle|shoot|shot|ammo|teeth|dentist)\b/i,
    viLiteral: /(?:cắn viên đạn|viên đạn)/i,
  },
];

export function isLikelyLiteralTatoebaForIdiom(sentence, translation, term) {
  for (const trap of LITERAL_IDIOM_TRAPS) {
    if (trap.termPattern.test(term)) {
      if (trap.enLiteral.test(sentence) || (translation && trap.viLiteral.test(translation))) {
        return true;
      }
    }
  }
  // Generic literal-food/object check for Tatoeba on multi-word idioms
  if (/\b(?:another|eat|ate|want|buy|bought|slice of)\b/i.test(sentence) && /\b(?:cake|pie|apple|egg|bean|beans|potato|bread|soup|cup of tea)\b/i.test(term)) {
    return true;
  }
  return false;
}

export function matchesSensePartOfSpeech(sentence, term, partOfSpeech) {
  const cleanTerm = normalizeSentenceKey(term);
  if (!cleanTerm) return true;
  const lower = ' ' + normalizeSentenceKey(sentence) + ' ';
  const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (cleanTerm.includes(' ')) {
    if (partOfSpeech === 'Danh từ') {
      // Avoid attaching imperative/verb phrasal examples ("Take off your hat") to a Noun sense
      if (new RegExp(`^(?:please\\s+)?${escaped}\\b`, 'i').test(lower.trim())) return false;
      if (new RegExp(`\\b(?:to|will|would|can|could|should|did|don t|let s)\\s+${escaped}\\b`, 'i').test(lower)) return false;
      return new RegExp(`\\b(?:a|an|the|my|your|our|their|smooth|rough|quick|good|bad)\\s+${escaped}\\b`, 'i').test(lower);
    }
    return true;
  }

  const verbForms = expandVerbInflections(cleanTerm)
    .filter((f) => f !== cleanTerm)
    .map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (partOfSpeech === 'Động từ') {
    if (new RegExp(`\\b(?:to|will|would|can|could|should|must|may|might|did|didn t|do|don t|does|doesn t|please|let s|i|you|we|they)\\s+${escaped}\\b`, 'i').test(lower)) {
      return true;
    }
    if (verbForms.length && new RegExp(`\\b(?:${verbForms.join('|')})\\b`, 'i').test(lower)) {
      return true;
    }
    return false;
  }
  if (partOfSpeech === 'Danh từ') {
    if (new RegExp(`\\b(?:a|an|the|my|your|his|her|our|their|this|that|new|full|home|email|house|mailing)\\s+${escaped}s?(?:\\s+(?:of|in|on|at|to|for|with|from|is|are|was|were|has|have|that|which|and|or)|\\s*$)`, 'i').test(lower)) {
      return true;
    }
    return false;
  }
  if (partOfSpeech === 'Tính từ') {
    if (new RegExp(`\\b(?:is|are|was|were|be|been|very|quite|so|too|more|most|a|an|the|some)\\s+${escaped}\\b`, 'i').test(lower)) {
      return true;
    }
    return false;
  }
  return true;
}

const JUNK_EN_DEFINITION_PATTERNS = [
  /^senses relating to\b/i,
  /^used other than figuratively\b/i,
  /^alternative (?:form|spelling|case form) of\b/i,
  /^(?:nonstandard|archaic|obsolete|dated|informal|rare) (?:form|spelling|variant) of\b/i,
  /^(?:simple past|past participle|present participle|plural|third-person singular|comparative|superlative|inflection|variant|misspelling|abbreviation|initialism|acronym|clipping|ellipsis|short) (?:and [a-z\s]+ )?of\b/i,
  /^(?:see also|see|compare|synonym of|antonym of)\b/i,
  /^(?:a\s+)?(?:habitational\s+|patronymic\s+|topographic\s+|occupational\s+)?surname\b/i,
  /^(?:a\s+)?(?:male|female|unisex)\s+given name\b/i,
  /^(?:[Aa]\s+)?(?:[Tt]own|[Vv]illage|[Cc]ity|[Bb]orough|[Hh]amlet|[Mm]unicipality|[Cc]ivil parish|[Mm]arket town|[Uu]nincorporated community)\b.*\b(?:in|of)\s+[A-Z]/,
];

const ARCHAIC_OR_NICHE_EN_LABEL = /\((?:[^)]*\b(?:obsolete|archaic|historical|dated|rare|dialect|chiefly|vulgar|slang|heraldry|nautical|mining|botany|zoology|anatomy|law|military|diplomacy|commonwealth|cricket|baseball|golf|surfing|printing|typography|materials science|philosophy|chess|cards|theater|theatre|heraldic|falconry|horology)\b[^)]*)\)/i;

const TECHNICAL_DOMAIN_EN_LABEL = /\((?:[^)]*\b(?:computer science|computing|mathematics|physics|chemistry|linguistics|grammar|medicine|biology|finance|accounting|economics|music|sports|architecture|programming)\b[^)]*)\)/i;

const ULTRA_VAGUE_GLOSSES = new Set([
  'direction',
  'preparation',
  'to prepare oneself',
  'to remove',
  'to depart',
  'a seat of any kind',
]);

export function normalizeEnglishDefinitionText(rawDef) {
  let text = cleanPlainText(rawDef, 240);
  if (!text) return '';
  // Unwrap meta-usage intros like "Usually used after the verb cost, ...: a very high price for an item"
  const usageColonMatch = text.match(/^(?:usually|often|chiefly|commonly)\s+used\s+[^:]{4,110}:\s*(.+)$/i);
  if (usageColonMatch?.[1] && usageColonMatch[1].length >= 10) {
    text = usageColonMatch[1].trim();
    text = text[0].toUpperCase() + text.slice(1);
  }
  return text;
}

export function stripLeadingUsageLabels(defText) {
  let text = typeof defText === 'string' ? defText.trim() : '';
  // Strip up to 2 leading parenthetical usage tags like "(intransitive, of a machine) "
  for (let i = 0; i < 2; i += 1) {
    const next = text.replace(/^\([^)]{1,70}\)\s*/, '').trim();
    if (next === text || next.length < 8) break;
    text = next;
  }
  // Also strip trailing parenthetical scope notes like " (of systems, organisms or people)"
  text = text.replace(/\s*\((?:of|especially|usually|chiefly)[^)]{1,60}\)\.?$/i, '.').trim();
  return normalizePunctuationSpacing(text);
}

export function isJunkEnglishDefinition(defText, headword = '') {
  const clean = normalizeEnglishDefinitionText(defText);
  if (!clean || clean.length < 6) return true;
  if (clean.endsWith(':')) return true;
  const core = stripLeadingUsageLabels(clean);
  if (!core || core.length < 5) return true;
  if (JUNK_EN_DEFINITION_PATTERNS.some((pattern) => pattern.test(clean) || pattern.test(core))) {
    return true;
  }
  const normalizedCore = normalizeSentenceKey(core);
  const normalizedHead = normalizeSentenceKey(headword);
  // Reject tautologies like "To run." for "run"
  if (normalizedHead && (normalizedCore === normalizedHead || normalizedCore === 'to ' + normalizedHead)) {
    return true;
  }
  return false;
}

export function scoreEnglishDefinition(defText, headword = '', { isIdiom = false, sourcePriority = 0, index = 0 } = {}) {
  const clean = normalizeEnglishDefinitionText(defText);
  if (isJunkEnglishDefinition(clean, headword)) return -1000;

  let score = 50 + sourcePriority - Math.min(index * 2, 16);
  const core = stripLeadingUsageLabels(clean);
  const coreKey = normalizeSentenceKey(core);
  const words = coreKey.split(' ').filter(Boolean);
  const headLower = headword.trim().toLowerCase();

  if (ARCHAIC_OR_NICHE_EN_LABEL.test(clean)) score -= 65;
  else if (TECHNICAL_DOMAIN_EN_LABEL.test(clean)) score -= 28;
  if (/\b(?:obsolete|archaic|historical|betake)\b/i.test(clean)) score -= 45;
  if (ULTRA_VAGUE_GLOSSES.has(coreKey) || /^to prepare oneself\b/i.test(core)) score -= 48;
  if (words.length <= 2) score -= 30;
  else if (words.length >= 4 && words.length <= 24) score += 18;
  if (clean.length > 175) score -= 18;
  if ((clean.match(/;/g) || []).length >= 3) score -= 12;

  // Penalize circular self-referential glosses like "An act of addressing oneself..." for "address"
  if (headLower.length >= 4 && !headLower.includes(' ')) {
    const escapedHead = headLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const circularPattern = new RegExp(`^an?\\s+(?:act|instance|process|state)\\s+of\\s+${escapedHead}`, 'i');
    if (circularPattern.test(core)) score -= 28;
  }

  // Penalize overly archaic ladder/bench senses when a clear modern sense exists
  if (/^a ladder\b/i.test(core) && headLower === 'scale') score -= 55;
  if (/^a (?:long )?(?:bench|seat)\b/i.test(core) && headLower === 'settle') score -= 45;
  if (headLower === 'address') {
    if (/\b(?:place where|location|building|postal|residence|communicated with|lives or works|property|street)\b/i.test(core)) {
      score += 26;
    } else if (/\b(?:deal with|direct speech|letter|message|speak to)\b/i.test(core)) {
      score += 14;
    }
  }

  if (isIdiom) {
    if (/\((?:[^)]*\b(?:idiomatic|figurative)\b[^)]*)\)/i.test(clean)) score += 38;
    if (/\b(?:easy|simple|awkward|ill|unwell|control|expensive|high price|studiously|late|secret|accept|proceed|sleep|rarely)\b/i.test(core)) {
      score += 12;
    }
  }
  return score;
}

export function selectBestEnglishDefinition(candidates, headword = '', { isIdiom = false } = {}) {
  const seen = new Set();
  const scored = [];
  for (const item of candidates) {
    const raw = typeof item === 'string' ? item : item?.text ?? '';
    const text = normalizeEnglishDefinitionText(raw);
    if (!text) continue;
    const key = normalizeSentenceKey(stripLeadingUsageLabels(text));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const score = scoreEnglishDefinition(text, headword, {
      isIdiom,
      sourcePriority: typeof item === 'object' ? (item.sourcePriority ?? 0) : 0,
      index: typeof item === 'object' ? (item.index ?? 0) : 0,
    });
    if (score > -500) {
      scored.push({ text, score });
    }
  }
  if (!scored.length) return '';
  scored.sort((a, b) => b.score - a.score);
  return scored[0].text;
}

export function prepareDefinitionForTranslation(englishDefinition) {
  let text = stripLeadingUsageLabels(normalizeEnglishDefinitionText(englishDefinition));
  if (!text) return '';
  // Trim trailing semicolon clauses when the primary clause is already clear & complete
  const parts = text.split(/\s*;\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    if (parts[0].length >= 24) {
      text = parts[0];
    } else if ((parts[0] + '; ' + parts[1]).length <= 105) {
      text = parts[0] + '; ' + parts[1];
    } else {
      text = parts[0];
    }
  }
  // Remove overly academic "or, by extension," padding that makes Vietnamese MT ramble
  text = text.replace(/,?\s*by extension,?\s*/gi, ', ').replace(/\s*,\s*,/g, ',');
  return normalizePunctuationSpacing(text);
}

export function sanitizeTranslatedText(rawText, sourceEnglish = '', { isMeaning = false } = {}) {
  const cleaned = normalizePunctuationSpacing(cleanPlainText(rawText, 240));
  if (!cleaned) return '';
  const upper = cleaned.toUpperCase();
  if (
    upper.includes('MYMEMORY WARNING') ||
    upper.includes('QUERY LENGTH LIMIT') ||
    upper.includes('PLEASE SELECT TWO DISTINCT')
  ) {
    return '';
  }
  // Reject UI software-localization hotkey strings like "& Bỏ", "&File", "_Remove"
  if (/^[&_]\s*\S/.test(cleaned) || /\s&\s*[A-ZÀ-Ỹ]/.test(cleaned)) {
    return '';
  }
  if (!VIETNAMESE_MARKS.test(cleaned.normalize('NFC'))) return '';

  // Reject failed translations that mostly echo untouched English words
  if (sourceEnglish) {
    const srcTokens = normalizeSentenceKey(sourceEnglish).split(' ').filter((w) => w.length >= 4);
    const outTokens = new Set(normalizeSentenceKey(cleaned).split(' ').filter((w) => w.length >= 4));
    if (srcTokens.length >= 3) {
      const echoed = srcTokens.filter((w) => outTokens.has(w)).length;
      if (echoed / srcTokens.length > 0.65) return '';
    }
  }

  if (isMeaning) {
    return cleaned.replace(/\.$/, '').trim();
  }
  return cleaned;
}

export function parseDatamuseEntry(payload, term) {
  if (!Array.isArray(payload) || !payload.length) return null;
  const target = term.trim().toLowerCase();
  const exact = payload.find((item) => typeof item?.word === 'string' && item.word.trim().toLowerCase() === target);
  if (!exact) return null;

  const tags = Array.isArray(exact.tags) ? exact.tags : [];
  const posOrder = [];
  for (const tag of tags) {
    if (tag === 'n' || tag === 'v' || tag === 'adj' || tag === 'adv') {
      const mapped = mapPartOfSpeechVi(tag, term);
      if (mapped && !posOrder.includes(mapped)) posOrder.push(mapped);
    }
  }

  const defsByPos = new Map();
  let isIdiom = false;
  const isMultiWord = term.trim().includes(' ');
  const defs = Array.isArray(exact.defs) ? exact.defs : [];
  for (const raw of defs) {
    if (typeof raw !== 'string') continue;
    const tabIdx = raw.indexOf('\t');
    if (tabIdx <= 0) continue;
    const rawPos = raw.slice(0, tabIdx).trim();
    const defText = normalizeEnglishDefinitionText(raw.slice(tabIdx + 1));
    if (!defText) continue;
    if (isMultiWord && /\((?:[^)]*\b(?:idiomatic|proverb)\b[^)]*)\)/i.test(defText)) {
      isIdiom = true;
    }
    const posLabel = mapPartOfSpeechVi(rawPos, term);
    if (!defsByPos.has(posLabel)) defsByPos.set(posLabel, []);
    const bucket = defsByPos.get(posLabel);
    if (bucket.length < 10 && !bucket.includes(defText)) {
      bucket.push(defText);
    }
  }

  if (!posOrder.length && !defsByPos.size) return null;
  return {
    posOrder,
    isIdiom,
    senses: Array.from(defsByPos.entries()).map(([partOfSpeech, englishDefinitions]) => ({
      partOfSpeech,
      englishDefinitions,
    })),
  };
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

  // Isolate the English section ({{-eng-}}, == Tiếng Anh ==, or =={{langname|en}}==)
  const engMarker = wikitext.match(/\{\{-eng-\}\}|==\s*(?:Tiếng Anh|\{\{langname\|en\}\})\s*==/i);
  if (!engMarker || engMarker.index === undefined) return null;

  const afterEng = wikitext.slice(engMarker.index + engMarker[0].length);
  const nextLang = afterEng.search(/\n(?:\{\{-(?!pron|noun|verb|tr-verb|intr-verb|adj|adv|prep|conj|interj|phrase|idiom|forms|ref|syn|ant|rel|etym|drv|art|det|num|part|pref|suff|expr)[a-z]{2,4}-\}\}|==\s*[^=]+\s*==\s*(?:\n|$))/i);
  const section = nextLang > -1 ? afterEng.slice(0, nextLang) : afterEng;

  // Extract IPA (supporting {{IPA}}, {{IPA-old}}, and modern {{IPA4|en|...|a=RP/GenAm}})
  let phonetic = '';
  let ukPhonetic = '';
  let usPhonetic = '';
  for (const match of section.matchAll(/\{\{IPA4\s*\|en\|([^|}]+)(?:\|([^}]*))?\}\}/gi)) {
    const ipa = normalizePhonetic(match[1]);
    const meta = (match[2] ?? '').toLowerCase();
    if (!ipa) continue;
    if (!phonetic) phonetic = ipa;
    if (/(?:rp|uk|gb)/.test(meta) && !ukPhonetic) ukPhonetic = ipa;
    else if (/(?:genam|us|ga)/.test(meta) && !usPhonetic) usPhonetic = ipa;
  }
  if (!phonetic) {
    const ipaMatch = section.match(/\{\{IPA(?:-old)?\s*\|(?:en\|)?([^|}]+)\}\}/i);
    if (ipaMatch?.[1]) {
      phonetic = normalizePhonetic(ipaMatch[1]);
    }
  }
  phonetic = usPhonetic || phonetic || ukPhonetic;

  const posHeaderRegex = /^\{\{-(noun|verb|tr-verb|intr-verb|adj|adv|prep|conj|interj|pron|phrase|idiom|art|det)-\}\}|^===\s*(?:\{\{ĐM\|(noun|verb|adj|adv|prep|conj|interj|intj|pron|phrase|idiom|proverb|prep_phrase|art|det)\}\}|(Danh từ|Động từ|Ngoại động từ|Nội động từ|Tính từ|Trạng từ|Phó từ|Giới từ|Liên từ|Thán từ|Đại từ|Cụm động từ|Thành ngữ|Tục ngữ|Cụm từ))\s*===/i;
  const derivedHeaderRegex = /^\{\{-(drv|rel)-\}\}|^===\s*(?:Từ dẫn xuất|Từ liên quan|\{\{ĐM\|(?:drv|rel)\}\})\s*===/i;
  const stopHeaderRegex = /^\{\{-(forms|ref|syn|ant|etym|see|expr)-\}\}|^===\s*(?:Tham khảo|Từ nguyên|Đồng nghĩa|Trái nghĩa|Chia động từ|Xem thêm|\{\{ĐM\|(?:pron|etym|syn|ant|ref)\}\})\s*===/i;

  const sensesByPos = new Map();
  const derivedTerms = new Set();
  const isMultiWord = term.trim().includes(' ');
  let isIdiom = /\b(?:idiom|idiomatic|thành ngữ|tục ngữ)\b/i.test(section) && isMultiWord;
  let currentSense = null;
  let currentEtymology = 0;
  let currentDefPenalty = false;
  let inPosSection = false;
  let inDerivedSection = false;
  let lineOrder = 0;

  for (const rawLine of section.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    lineOrder += 1;

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
      const rawPos = posMatch[1] || posMatch[2] || posMatch[3];
      const posLabel = mapPartOfSpeechVi(rawPos, term);
      if (posLabel === 'Thành ngữ') isIdiom = true;
      if (!sensesByPos.has(posLabel)) {
        sensesByPos.set(posLabel, {
          partOfSpeech: posLabel,
          etymologyCount: 0,
          meaningCandidates: [],
          examples: [],
          collocations: [],
        });
      }
      currentSense = sensesByPos.get(posLabel);
      currentSense.etymologyCount += 1;
      currentEtymology = currentSense.etymologyCount;
      currentDefPenalty = false;
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
      if (currentDefPenalty) continue; // Skip archaic/niche FVDP collocations & examples
      const content = cleanWikitext(line.slice(2));
      const splitMatch = content.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      if (splitMatch) {
        const left = cleanPlainText(splitMatch[1], 220);
        const right = cleanPlainText(splitMatch[2], 240);
        if (left && right && /[A-Za-z]/.test(left)) {
          if (isSentenceLike(left) && isNaturalExampleSentence(left, term)) {
            currentSense.examples.push({
              sentence: normalizeExampleDisplay(left),
              translation: right,
              source: 'Wiktionary Anh–Việt',
            });
          } else if (!isSentenceLike(left) && left.length <= 72 && !/\b(?:a lady|thy|thou|hath)\b/i.test(left)) {
            currentSense.collocations.push({ phrase: left, meaning: right });
          }
        }
      }
      continue;
    }

    if (line.startsWith('#') && !line.startsWith('#*') && !line.startsWith('##')) {
      const flags = extractWikitextUsageFlags(line);
      currentDefPenalty = flags.isArchaic || flags.isNiche;
      const def = cleanWikitext(line.slice(1)).replace(/\.$/, '').trim();
      if (def && def.length >= 2 && VIETNAMESE_MARKS.test(def.normalize('NFC'))) {
        currentSense.meaningCandidates.push({
          text: def,
          isArchaic: flags.isArchaic,
          isNiche: flags.isNiche,
          isFigurative: flags.isFigurative,
          etymology: currentEtymology,
          order: lineOrder,
        });
      }
    }
  }

  const pickCoreMeanings = (candidates, etymologyCount) => {
    const cleanPool = candidates.filter((c) => !c.isArchaic && !c.isNiche);
    const pool = cleanPool.length > 0 ? cleanPool : candidates.filter((c) => !c.isArchaic);
    const finalPool = pool.length > 0 ? pool : candidates;

    const chosen = [];
    const seenKeys = new Set();
    const pushIfDistinct = (item) => {
      const key = normalizeSentenceKey(item.text);
      if (!key || seenKeys.has(key)) return false;
      // Avoid near-duplicate glosses whose first 18 chars match
      if (chosen.some((prev) => {
        const prevKey = normalizeSentenceKey(prev);
        return prevKey.includes(key) || key.includes(prevKey);
      })) return false;
      seenKeys.add(key);
      const display = item.isFigurative && chosen.length > 0 && !/nghĩa bóng/i.test(item.text)
        ? `(nghĩa bóng) ${item.text}`
        : item.text;
      chosen.push(display);
      return true;
    };

    // For multi-etymology entries (e.g. "scale": vảy cá / cái cân / tỷ lệ, quy mô),
    // pick the lead meaning from each etymology first so modern homonyms aren't buried.
    if (etymologyCount > 1) {
      const seenEtym = new Set();
      for (const item of finalPool) {
        if (!seenEtym.has(item.etymology)) {
          seenEtym.add(item.etymology);
          pushIfDistinct(item);
        }
        if (chosen.length >= 3) break;
      }
    }

    for (const item of finalPool) {
      if (chosen.length >= 3) break;
      pushIfDistinct(item);
    }
    return chosen;
  };

  const composeConciseMeaning = (meanings) => {
    const selected = [];
    let totalLen = 0;
    for (const m of meanings) {
      if (selected.length >= 3) break;
      if (selected.length >= 2 && totalLen + m.length > 135) break;
      if (selected.length >= 1 && totalLen + m.length > 155) break;
      selected.push(m);
      totalLen += m.length + 2;
    }
    return selected.join('; ');
  };

  const senses = Array.from(sensesByPos.values())
    .map((entry) => {
      const meanings = pickCoreMeanings(entry.meaningCandidates, entry.etymologyCount);
      return {
        partOfSpeech: entry.partOfSpeech,
        meaning: composeConciseMeaning(meanings),
        meanings,
        examples: entry.examples.slice(0, 4),
        collocations: entry.collocations.slice(0, 5),
      };
    })
    .filter((entry) => entry.meanings.length > 0);

  if (!senses.length) return null;
  return {
    phonetic,
    ukPhonetic,
    usPhonetic,
    senses,
    derivedTerms: Array.from(derivedTerms).slice(0, 12),
    isIdiom,
  };
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
          const defText = normalizeEnglishDefinitionText(def?.definition ?? '');
          if (defText && bucket.englishDefinitions.length < 12 && !bucket.englishDefinitions.includes(defText)) {
            bucket.englishDefinitions.push(defText);
          }
          const exText = cleanPlainText(def?.example ?? '', 220);
          if (exText && isNaturalExampleSentence(exText, headword) && bucket.examples.length < 5) {
            bucket.examples.push({
              sentence: normalizeExampleDisplay(exText),
              translation: '',
              source: 'Free Dictionary API',
            });
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
  let isIdiom = false;
  const isMultiWord = queriedTerm.trim().includes(' ');
  const senses = [];

  const splitExampleLines = (rawEx) => {
    if (typeof rawEx !== 'string' || !rawEx.trim()) return [];
    return rawEx
      .split(/<br\s*\/?>|<\/(?:p|div|li|dd|dt)>/i)
      .map((chunk) => cleanPlainText(chunk, 220))
      .filter(Boolean);
  };

  for (const item of entries) {
    const posLabel = mapPartOfSpeechVi(item?.partOfSpeech ?? '', queriedTerm);
    if (posLabel === 'Thành ngữ') isIdiom = true;
    const englishDefinitions = [];
    const examples = [];

    if (Array.isArray(item?.definitions)) {
      for (const def of item.definitions) {
        const rawHtml = typeof def?.definition === 'string' ? def.definition : '';
        if (isMultiWord && /\bidiomatic\b|\bproverb\b/i.test(rawHtml)) {
          isIdiom = true;
        }
        if (!lemma && /form-of-definition/i.test(rawHtml)) {
          const linkMatch = rawHtml.match(/<a[^>]+href="\/wiki\/([^"#?]+)"[^>]*>([^<]+)<\/a>/i);
          const candidate = cleanPlainText(linkMatch?.[2] ?? '', 60);
          if (candidate && candidate.toLowerCase() !== queriedTerm.toLowerCase() && /^[A-Za-z][A-Za-z\s'-]{1,40}$/.test(candidate)) {
            lemma = candidate;
          }
        }
        // Strip nested <ol>/<ul>/<dl> sub-senses so parent glosses don't glue sub-senses together
        const primaryDefHtml = rawHtml
          .replace(/<ol[\s\S]*?<\/ol>/gi, '')
          .replace(/<ul[\s\S]*?<\/ul>/gi, '')
          .replace(/<dl[\s\S]*?<\/dl>/gi, '');
        const cleanDef = normalizeEnglishDefinitionText(primaryDefHtml);
        if (cleanDef && !isJunkEnglishDefinition(cleanDef, queriedTerm) && englishDefinitions.length < 12 && !englishDefinitions.includes(cleanDef)) {
          englishDefinitions.push(cleanDef);
        }
        const parsedExamples = Array.isArray(def?.parsedExamples) ? def.parsedExamples : [];
        for (const ex of parsedExamples) {
          for (const sentence of splitExampleLines(ex?.example ?? '')) {
            if (isNaturalExampleSentence(sentence, queriedTerm) && examples.length < 5) {
              examples.push({
                sentence: normalizeExampleDisplay(sentence),
                translation: '',
                source: 'English Wiktionary',
              });
            }
          }
        }
        const plainExamples = Array.isArray(def?.examples) ? def.examples : [];
        for (const ex of plainExamples) {
          for (const sentence of splitExampleLines(typeof ex === 'string' ? ex : '')) {
            if (isNaturalExampleSentence(sentence, queriedTerm) && examples.length < 5) {
              examples.push({
                sentence: normalizeExampleDisplay(sentence),
                translation: '',
                source: 'English Wiktionary',
              });
            }
          }
        }
      }
    }

    if (englishDefinitions.length > 0) {
      senses.push({ partOfSpeech: posLabel, englishDefinitions, examples });
    }
  }

  return { lemma: lemma || undefined, senses, isIdiom };
}

export function parseTatoebaPairs(payload, term) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  if (!results.length) return [];

  const pairs = [];
  for (const item of results) {
    const sentence = cleanPlainText(item?.text ?? '', 200);
    if (!sentence || !isNaturalExampleSentence(sentence, term)) continue;

    const translations = Array.isArray(item?.translations) ? item.translations.flat() : [];
    const vi = translations.find((entry) => entry?.lang === 'vie' && typeof entry?.text === 'string' && entry.text.trim());
    if (!vi) continue;
    const translation = cleanPlainText(vi.text, 220);
    if (!translation || !VIETNAMESE_MARKS.test(translation.normalize('NFC'))) continue;

    const candidate = {
      sentence: normalizeExampleDisplay(sentence),
      translation,
      source: 'Tatoeba',
      ...(Number.isInteger(Number(item?.id)) && Number(item?.id) > 0
        ? { sourceUrl: 'https://tatoeba.org/en/sentences/show/' + Number(item.id) }
        : {}),
    };
    if (pairs.some((existing) => areExamplesTooSimilar(existing, candidate))) continue;

    pairs.push(candidate);
    if (pairs.length >= 8) break;
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

const IDIOM_PROFANITY_PATTERN = /\b(shit|shitty|fuck|fucking|fucked|ass|asses|asshole|crap|bitch|dick|cock|pussy|cunt|bastard|whore|slut|piss|pissed|arse|bollocks|wank|turd|fart|bullshit|tit|tits|boob|prick|twat|hellfire|goddamn|damned|screwed|motherfucker)\b/i;

const IDIOM_STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'to', 'at', 'for', 'by', 'with', 'from', 'as', 'into', 'onto', 'over', 'under', 'out', 'up', 'down', 'off',
  'and', 'or', 'but', 'not', 'no', 'be', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'one', "one's", 'someone', "someone's", 'something', 'somebody', 'your', 'my', 'his', 'her', 'their', 'our', 'its', 'it', 'you', 'me', 'us', 'them',
  'get', 'make', 'take', 'give', 'put', 'keep', 'go', 'come', 'let', 'set', 'run',
]);

export function pickIdiomAnchorWord(term) {
  const clean = typeof term === 'string' ? term.trim().toLowerCase() : '';
  if (!clean) return '';
  const words = clean.split(/[^a-z']+/).filter((w) => w.length >= 3);
  if (!words.length) return '';
  if (words.length === 1) return words[0];
  const contentWords = words.filter((w) => !IDIOM_STOP_WORDS.has(w) && /^[a-z]{3,}$/.test(w));
  const pool = contentWords.length ? contentWords : words.filter((w) => /^[a-z]{3,}$/.test(w));
  if (!pool.length) return '';
  return pool.sort((a, b) => b.length - a.length)[0];
}

export function filterCleanIdioms(rawItems, excludeTerm = '', maxCount = 8) {
  if (!Array.isArray(rawItems)) return [];
  const excludeKey = typeof excludeTerm === 'string' ? excludeTerm.trim().toLowerCase() : '';
  const seen = new Set();
  const preferred = [];
  const secondary = [];

  for (const raw of rawItems) {
    const title = typeof raw === 'string' ? raw : raw?.title ?? raw?.term ?? '';
    const clean = cleanPlainText(title, 72);
    if (!clean || !clean.includes(' ')) continue;
    if (!/^[A-Za-z][A-Za-z\s'’-]{3,70}$/.test(clean)) continue;
    if (IDIOM_PROFANITY_PATTERN.test(clean)) continue;

    const wordCount = clean.split(/\s+/).length;
    if (wordCount < 2 || wordCount > 8) continue;

    const key = clean.toLowerCase();
    if (key === excludeKey || seen.has(key)) continue;
    seen.add(key);

    const snippet = typeof raw === 'object' && raw?.snippet
      ? cleanPlainText(raw.snippet, 140)
      : '';
    const entry = { term: clean, ...(snippet ? { snippet } : {}) };

    // Prefer genuine 3+ word idioms or non-phrasal multi-word expressions over bare 2-word verb+particle combos
    const isTwoWordPhrasal = wordCount === 2 && /\b(up|down|out|in|on|off|away|back|over|through|into|about|around)$/i.test(clean);
    if (!isTwoWordPhrasal) preferred.push(entry);
    else secondary.push(entry);
  }

  return [...preferred, ...secondary].slice(0, maxCount);
}

export function hasEnglishIdiomCategory(payload) {
  const pages = payload?.query?.pages;
  if (!pages || typeof pages !== 'object') return false;
  for (const page of Object.values(pages)) {
    const cats = Array.isArray(page?.categories) ? page.categories : [];
    for (const cat of cats) {
      const title = typeof cat?.title === 'string' ? cat.title.toLowerCase() : '';
      if (title.includes('english idioms') || title.includes('english proverbs')) {
        return true;
      }
    }
  }
  return false;
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

async function translateToVietnamese(request, text, { isMeaning = false } = {}) {
  const clean = isMeaning ? prepareDefinitionForTranslation(text) : cleanPlainText(text, 220);
  if (!clean) return '';
  try {
    const data = await fetchJsonSafe(
      request,
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(clean) + '&langpair=en|vi',
      { timeoutMs: 4_500 },
    );
    const primary = sanitizeTranslatedText(data?.responseData?.translatedText ?? '', clean, { isMeaning });
    if (primary) return primary;
    // If primary translation was corrupted (e.g. UI hotkey "& Bỏ"), inspect secondary matches
    const matches = Array.isArray(data?.matches) ? data.matches : [];
    for (const m of matches) {
      if (Number(m?.match ?? 0) < 0.5) continue;
      const alt = sanitizeTranslatedText(m?.translation ?? '', clean, { isMeaning });
      if (alt) return alt;
    }
    return '';
  } catch {
    return '';
  }
}

export function deduplicateExamples(examples, term, { preferDictionaryFirst = false } = {}) {
  const withTerm = [];
  const withoutTerm = [];
  const acceptCandidate = (bucket, candidate) => {
    if (bucket.some((existing) => areExamplesTooSimilar(existing, candidate))) return;
    bucket.push(candidate);
  };

  for (const ex of examples) {
    const rawSentence = cleanPlainText(ex?.sentence ?? '', 220);
    const translation = cleanPlainText(ex?.translation ?? '', 260);
    if (!rawSentence || !isNaturalExampleSentence(rawSentence)) continue;
    const sentence = normalizeExampleDisplay(rawSentence);
    const cleanEx = {
      sentence,
      translation,
      ...(ex?.source ? { source: ex.source } : {}),
      ...(typeof ex?.sourceUrl === 'string' && ex.sourceUrl.startsWith('https://') ? { sourceUrl: ex.sourceUrl } : {}),
    };
    if (containsTermLoose(sentence, term)) acceptCandidate(withTerm, cleanEx);
    else acceptCandidate(withoutTerm, cleanEx);
  }

  const score = (item) => {
    const isTatoeba = item.source === 'Tatoeba';
    const hasTranslation = Boolean(item.translation);
    // For idioms, keep idiomatic dictionary examples ahead of generic Tatoeba sentences
    if (preferDictionaryFirst) {
      if (!isTatoeba && hasTranslation) return 0;
      if (!isTatoeba) return 1;
      return hasTranslation ? 2 : 3;
    }
    return hasTranslation ? 0 : 1;
  };
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
  const idiomCache = createTtlCache();
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

  async function searchWiktionaryIdioms(query, limit = 12) {
    const safeQuery = query.replace(/"/g, '').trim();
    if (!safeQuery) return [];
    const titleSearch = fetchJsonSafe(
      request,
      'https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=' +
        encodeURIComponent(`intitle:"${safeQuery}" incategory:"English idioms"`) +
        '&srlimit=' + Math.min(20, Math.max(limit * 2, 12)) + '&format=json',
      { timeoutMs: 4_500 },
    ).catch(() => null);

    const firstRaw = await titleSearch;
    const firstItems = Array.isArray(firstRaw?.query?.search) ? firstRaw.query.search : [];
    const filteredFirst = filterCleanIdioms(firstItems, '', limit);
    if (filteredFirst.length >= Math.min(6, limit)) return filteredFirst;

    const broadRaw = await fetchJsonSafe(
      request,
      'https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=' +
        encodeURIComponent(`${safeQuery} incategory:"English idioms"`) +
        '&srlimit=' + Math.min(20, Math.max(limit * 2, 12)) + '&format=json',
      { timeoutMs: 4_500 },
    ).catch(() => null);
    const broadItems = Array.isArray(broadRaw?.query?.search) ? broadRaw.query.search : [];
    return filterCleanIdioms([...firstItems, ...broadItems], '', limit);
  }

  async function fetchOpenProviders(term) {
    const encoded = encodeURIComponent(term);
    const stems = extractWordFamilyStems(term);
    const idiomAnchor = pickIdiomAnchorWord(term);
    const isMultiWord = term.includes(' ');
    const [viWikiRaw, freeDictRaw, enWikiRaw, tatoebaRaw, datamuseExactRaw, idiomCategoryRaw, relatedIdiomsRaw, ...datamuseFamilyRaws] = await Promise.all([
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
      fetchJsonSafe(
        request,
        'https://api.datamuse.com/words?sp=' + encoded + '&qe=sp&md=dpf&max=3',
        { timeoutMs: 4_000 },
      ).catch(() => null),
      isMultiWord
        ? fetchJsonSafe(
            request,
            'https://en.wiktionary.org/w/api.php?action=query&redirects=1&prop=categories&titles=' +
              encodeURIComponent(term) +
              '&clcategories=' + encodeURIComponent('Category:English idioms|Category:English proverbs') +
              '&format=json',
            { timeoutMs: 4_000 },
          ).catch(() => null)
        : Promise.resolve(null),
      idiomAnchor
        ? fetchJsonSafe(
            request,
            'https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=' +
              encodeURIComponent(`intitle:${idiomAnchor} incategory:"English idioms"`) +
              '&srlimit=14&format=json',
            { timeoutMs: 4_500 },
          ).catch(() => null)
        : Promise.resolve(null),
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
    const datamuseExact = parseDatamuseEntry(datamuseExactRaw, term);
    const tatoeba = parseTatoebaPairs(tatoebaRaw, term);
    const datamuseFlat = datamuseFamilyRaws.flatMap((batch) => Array.isArray(batch) ? batch : []);
    const wordFamily = parseWordFamilyFromDatamuse(
      datamuseFlat,
      freeDict?.term || term,
      stems,
      viWiki?.derivedTerms ?? [],
    );
    const isIdiom = Boolean(
      isMultiWord && (viWiki?.isIdiom || enWiki?.isIdiom || datamuseExact?.isIdiom || hasEnglishIdiomCategory(idiomCategoryRaw)),
    );
    const relatedIdioms = filterCleanIdioms(
      Array.isArray(relatedIdiomsRaw?.query?.search) ? relatedIdiomsRaw.query.search : [],
      freeDict?.term || term,
      6,
    ).map((item) => item.term);

    return { viWiki, freeDict, enWiki, datamuseExact, tatoeba, wordFamily, isIdiom, relatedIdioms };
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
    const mode = req.query.mode === 'idiom' ? 'idiom' : 'all';

    const time = now();
    const cacheKey = mode + ':' + query.toLowerCase() + ':' + limit;
    const cached = suggestCache.get(cacheKey, time);
    if (cached) return res.json(cached);

    const rate = allowRate(recentSuggestCalls, LIMITS.suggestPerMinute, time);
    recentSuggestCalls = rate.recent;
    if (!rate.ok) return errorResponse(res, 429, 'rate_limit', 'Bạn đang tra quá nhanh, hãy thử lại sau ít giây.');

    try {
      const seen = new Set();
      const suggestions = [];
      const addCandidate = (word, source, isIdiom = false) => {
        const clean = normalizeLookupQuery(word);
        if (!clean) return;
        const key = clean.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        suggestions.push({ term: clean, source, ...(isIdiom ? { isIdiom: true } : {}) });
      };

      if (mode === 'idiom') {
        const idiomMatches = await searchWiktionaryIdioms(query, limit);
        for (const item of idiomMatches) addCandidate(item.term, 'Wiktionary Idioms', true);
      } else {
        const fluentMatches = await suggestFluentDict(query, limit);
        const includeIdioms = query.includes(' ') || query.length >= 3;
        const [datamuseRaw, viOpenSearchRaw, idiomMatches] = fluentMatches.length >= limit
          ? [null, null, []]
          : await Promise.all([
            fetchJsonSafe(request, 'https://api.datamuse.com/sug?s=' + encodeURIComponent(query) + '&max=' + limit, { timeoutMs: 4_000 }).catch(() => null),
            fetchJsonSafe(request, 'https://vi.wiktionary.org/w/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=' + limit + '&format=json', { timeoutMs: 4_000 }).catch(() => null),
            includeIdioms ? searchWiktionaryIdioms(query, query.includes(' ') ? 5 : 3) : Promise.resolve([]),
          ]);

        for (const word of fluentMatches) addCandidate(word, 'FluentDict');
        if (query.includes(' ')) {
          for (const item of idiomMatches) addCandidate(item.term, 'Wiktionary Idioms', true);
        }
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
        if (!query.includes(' ')) {
          for (const item of idiomMatches.slice(0, 2)) addCandidate(item.term, 'Wiktionary Idioms', true);
        }
      }

      const payload = { status: 'ok', query, suggestions: suggestions.slice(0, limit) };
      suggestCache.set(cacheKey, payload, time);
      return res.json(payload);
    } catch {
      return errorResponse(res, 502, 'provider', 'Chưa lấy được gợi ý từ điển trực tuyến.');
    }
  });

  router.get('/idioms', async (req, res) => {
    if (!isLocalRequest(req, { allowMissingOrigin: true })) {
      return errorResponse(res, 403, 'forbidden', 'Yêu cầu không hợp lệ.');
    }
    const query = normalizeLookupQuery(typeof req.query.q === 'string' ? req.query.q : '');
    if (!query || query.length < 2) {
      return res.json({ status: 'ok', query, idioms: [] });
    }
    const rawLimit = Number(req.query.limit ?? 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(16, Math.max(1, Math.trunc(rawLimit))) : 10;

    const time = now();
    const cacheKey = query.toLowerCase() + ':' + limit;
    const cached = idiomCache.get(cacheKey, time);
    if (cached) return res.json(cached);

    const rate = allowRate(recentSuggestCalls, LIMITS.suggestPerMinute, time);
    recentSuggestCalls = rate.recent;
    if (!rate.ok) return errorResponse(res, 429, 'rate_limit', 'Bạn đang tìm quá nhanh, hãy thử lại sau ít giây.');

    try {
      const idioms = await searchWiktionaryIdioms(query, limit);
      const payload = { status: 'ok', query, idioms };
      idiomCache.set(cacheKey, payload, time);
      return res.json(payload);
    } catch {
      return errorResponse(res, 502, 'provider', 'Chưa tìm được thành ngữ trực tuyến lúc này.');
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
        if (lemmaOpen.viWiki || lemmaOpen.freeDict || lemmaOpen.enWiki || lemmaOpen.datamuseExact) {
          activeTerm = lemmaOpen.freeDict?.term || detectedLemma;
          inflectionNote = `"${queriedTerm}" là dạng biến thể của "${activeTerm}".`;
          openData = {
            viWiki: lemmaOpen.viWiki,
            freeDict: lemmaOpen.freeDict ?? initialOpen.freeDict,
            enWiki: lemmaOpen.enWiki ?? initialOpen.enWiki,
            datamuseExact: lemmaOpen.datamuseExact ?? initialOpen.datamuseExact,
            tatoeba: lemmaOpen.tatoeba.length ? lemmaOpen.tatoeba : initialOpen.tatoeba,
            wordFamily: lemmaOpen.wordFamily.length ? lemmaOpen.wordFamily : initialOpen.wordFamily,
            isIdiom: lemmaOpen.isIdiom || initialOpen.isIdiom,
            relatedIdioms: lemmaOpen.relatedIdioms.length ? lemmaOpen.relatedIdioms : initialOpen.relatedIdioms,
          };
        }
      }

      const { viWiki, freeDict, enWiki, datamuseExact, tatoeba, wordFamily, isIdiom, relatedIdioms } = openData;
      const hasAnyData = Boolean(fluentResult || viWiki || freeDict || enWiki || datamuseExact?.senses?.length);
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
            englishDefinitionCandidates: [],
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

      if (datamuseExact?.senses) {
        for (const s of datamuseExact.senses) {
          const target = ensureSense(s.partOfSpeech);
          s.englishDefinitions.forEach((text, index) => {
            target.englishDefinitionCandidates.push({ text, sourcePriority: 14, index });
          });
        }
      }

      if (freeDict) {
        for (const s of freeDict.senses) {
          const target = ensureSense(s.partOfSpeech);
          s.englishDefinitions.forEach((text, index) => {
            target.englishDefinitionCandidates.push({ text, sourcePriority: 8, index });
          });
          target.examples.push(...s.examples);
          target.synonyms.push(...s.synonyms);
          target.antonyms.push(...s.antonyms);
        }
      }

      if (enWiki) {
        for (const s of enWiki.senses) {
          const target = ensureSense(s.partOfSpeech);
          s.englishDefinitions.forEach((text, index) => {
            target.englishDefinitionCandidates.push({ text, sourcePriority: 6, index });
          });
          target.examples.push(...s.examples);
        }
      }

      let senses = Array.from(senseMap.values()).map((sense) => ({
        ...sense,
        englishDefinition: selectBestEnglishDefinition(sense.englishDefinitionCandidates, activeTerm, { isIdiom }),
      }));

      // Order senses by corpus-backed primary POS frequency (Datamuse), while keeping Idiom first if applicable.
      // For multi-word queries (e.g. "get out of hand"), also prioritize senses whose examples actually use the queried phrase.
      const posOrder = datamuseExact?.posOrder ?? [];
      const isPredicativeIdiom = isIdiom && /^(?:get|go|be|keep|stay|become)\s+/i.test(activeTerm);
      const isMultiWordActive = activeTerm.includes(' ');
      const senseMatchesQueryExample = (sense) =>
        isMultiWordActive && sense.examples.some((ex) => containsTermLoose(ex.sentence, activeTerm));
      senses.sort((a, b) => {
        if (isIdiom) {
          if (a.partOfSpeech === 'Thành ngữ' && b.partOfSpeech !== 'Thành ngữ') return -1;
          if (b.partOfSpeech === 'Thành ngữ' && a.partOfSpeech !== 'Thành ngữ') return 1;
          if (isPredicativeIdiom) {
            const rankPred = (pos) => (pos === 'Tính từ' || pos === 'Cụm động từ' || pos === 'Động từ' ? 0 : pos === 'Trạng từ' ? 2 : 1);
            const diffPred = rankPred(a.partOfSpeech) - rankPred(b.partOfSpeech);
            if (diffPred !== 0) return diffPred;
          }
        }
        const idxA = posOrder.indexOf(a.partOfSpeech);
        const idxB = posOrder.indexOf(b.partOfSpeech);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
        if (idxA !== -1 && idxB === -1) return -1;
        if (idxB !== -1 && idxA === -1) return 1;
        if (isMultiWordActive) {
          const matchA = senseMatchesQueryExample(a) ? 0 : 1;
          const matchB = senseMatchesQueryExample(b) ? 0 : 1;
          if (matchA !== matchB) return matchA - matchB;
        }
        // Prefer senses that have a verified Vietnamese meaning over orphan rare senses
        const hasViA = a.meaning ? 0 : 1;
        const hasViB = b.meaning ? 0 : 1;
        return hasViA - hasViB;
      });

      // Drop ultra-obscure English-only senses (like "run" as Adjective "melted butter") when rich Vietnamese senses already exist
      const hasRichSense = senses.some((s) => Boolean(s.meaning));
      if (hasRichSense && senses.length > 2) {
        senses = senses.filter((s, idx) => idx < 2 || Boolean(s.meaning) || posOrder.includes(s.partOfSpeech));
      }

      // Translate missing Vietnamese meaning for primary senses cleanly
      let usedMachineTranslation = false;
      for (const sense of senses.slice(0, 2)) {
        if (!sense.meaning && sense.englishDefinition) {
          const translated = await translateToVietnamese(request, sense.englishDefinition, { isMeaning: true });
          if (translated) {
            sense.meaning = translated;
            usedMachineTranslation = true;
          }
        }
      }

      // Filter Tatoeba examples carefully: protect idioms from literal food/object traps
      const filteredTatoeba = isIdiom
        ? tatoeba.filter((ex) => !isLikelyLiteralTatoebaForIdiom(ex.sentence, ex.translation, activeTerm))
        : tatoeba;

      // Deduplicate per-sense examples first & keep sense-matched translations prioritized
      const translationCache = new Map();
      let translationCalls = 0;
      const translateSentenceOnce = async (sentence) => {
        const key = normalizeSentenceKey(sentence);
        if (translationCache.has(key)) return translationCache.get(key);
        if (translationCalls >= 5) return '';
        translationCalls += 1;
        const vi = await translateToVietnamese(request, sentence, { isMeaning: false });
        if (vi) usedMachineTranslation = true;
        translationCache.set(key, vi);
        return vi;
      };

      const cleanedSenses = [];
      let usedTatoeba = false;

      for (let i = 0; i < senses.length; i += 1) {
        const s = senses[i];
        if (!s.meaning && !s.englishDefinition) continue;

        let senseExamples = deduplicateExamples(s.examples, activeTerm, { preferDictionaryFirst: isIdiom });

        // Translate up to 2 examples for the primary sense and 1 for the secondary sense
        const translateLimit = i === 0 ? 2 : i === 1 ? 1 : 0;
        let translatedInSense = 0;
        const enrichedExamples = [];
        for (const ex of senseExamples.slice(0, 4)) {
          if (ex.translation) {
            enrichedExamples.push(ex);
          } else if (translatedInSense < translateLimit) {
            const vi = await translateSentenceOnce(ex.sentence);
            enrichedExamples.push({ ...ex, translation: vi });
            translatedInSense += 1;
          } else {
            enrichedExamples.push(ex);
          }
        }

        // Supplement with POS-appropriate Tatoeba sentences only when this sense lacks bilingual examples
        const bilingualCount = enrichedExamples.filter((ex) => Boolean(ex.translation)).length;
        if (bilingualCount < 2 && filteredTatoeba.length > 0) {
          const allowFallback = senses.length === 1 || i === 0;
          const matchingTatoeba = filteredTatoeba.filter((ex) => {
            if (isIdiom) return true;
            if (senses.length === 1) return true;
            return matchesSensePartOfSpeech(ex.sentence, activeTerm, s.partOfSpeech);
          });
          const pool = matchingTatoeba.length > 0 ? matchingTatoeba : (allowFallback ? filteredTatoeba : []);
          for (const ex of pool) {
            if (enrichedExamples.length >= 3 && enrichedExamples.filter((e) => e.translation).length >= 2) break;
            if (!enrichedExamples.some((existing) => areExamplesTooSimilar(existing, ex))) {
              enrichedExamples.push(ex);
              usedTatoeba = true;
            }
          }
        }

        const finalSenseExamples = deduplicateExamples(enrichedExamples, activeTerm, {
          preferDictionaryFirst: isIdiom,
        }).slice(0, 4);
        if (finalSenseExamples.some((ex) => ex.source === 'Tatoeba')) usedTatoeba = true;

        cleanedSenses.push({
          partOfSpeech: s.partOfSpeech,
          meaning: s.meaning || s.englishDefinition,
          ...(s.englishDefinition ? { englishDefinition: s.englishDefinition } : {}),
          collocations: deduplicateCollocations(s.collocations),
          examples: finalSenseExamples,
          synonyms: Array.from(new Set(s.synonyms)).slice(0, 6),
          antonyms: Array.from(new Set(s.antonyms)).slice(0, 6),
        });
      }

      senses = cleanedSenses;

      // When a multi-word expression is confirmed as an English idiom, label its primary sense as Thành ngữ
      if (isIdiom && senses.length > 0 && !senses.some((s) => s.partOfSpeech === 'Thành ngữ')) {
        senses = [
          { ...senses[0], partOfSpeech: 'Thành ngữ' },
          ...senses.slice(1),
        ];
      } else if (isIdiom && senses.length > 1) {
        const idiomIdx = senses.findIndex((s) => s.partOfSpeech === 'Thành ngữ');
        if (idiomIdx > 0) {
          senses = [senses[idiomIdx], ...senses.slice(0, idiomIdx), ...senses.slice(idiomIdx + 1)];
        }
      }

      // Build global examples list prioritizing primary sense examples first, then safe Tatoeba fallback
      const globalExamplesPool = [
        ...(senses[0]?.examples ?? []),
        ...senses.slice(1).flatMap((s) => s.examples.slice(0, 1)),
        ...(!isIdiom ? filteredTatoeba : []),
      ];
      const globalExamples = deduplicateExamples(globalExamplesPool, activeTerm, {
        preferDictionaryFirst: isIdiom,
      }).slice(0, 4);
      if (globalExamples.some((ex) => ex.source === 'Tatoeba')) usedTatoeba = true;

      const ukPhonetic = freeDict?.ukPhonetic || viWiki?.ukPhonetic || '';
      const usPhonetic = freeDict?.usPhonetic || viWiki?.usPhonetic || '';
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
      if (datamuseExact?.senses?.length) {
        providers.push({
          id: 'datamuse',
          name: 'Datamuse (WordNet)',
          license: 'WordNet / Open',
          url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(activeTerm.replace(/\s+/g, '_')),
        });
      }
      if (usedTatoeba) {
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
          name: 'MyMemory (hỗ trợ dịch)',
          license: 'Public Translation API',
        });
      }

      const result = {
        status: 'ok',
        term: activeTerm,
        queriedTerm,
        ...(inflectionNote ? { inflectionNote } : {}),
        ...(isIdiom ? { isIdiom: true } : {}),
        phonetic: primaryPhonetic,
        ...(englishForms ? { englishForms } : {}),
        senses,
        examples: globalExamples,
        collocations: deduplicateCollocations(senses.flatMap((s) => s.collocations)),
        synonyms: Array.from(new Set(freeDict?.synonyms ?? [])).slice(0, 8),
        antonyms: Array.from(new Set(freeDict?.antonyms ?? [])).slice(0, 8),
        wordFamily,
        relatedIdioms,
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
