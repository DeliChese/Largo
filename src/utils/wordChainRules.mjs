export function normalizeChainTerm(term, language) {
  if (typeof term !== 'string' || term.length > 120) return '';
  const clean = term.normalize('NFKC').trim().toLowerCase()
    .replace(/[‘’]/g, "'").replace(/[‐‑]/g, '-')
    .replace(/[.!?。！？]+$/u, '').replace(/\s+/g, ' ');
  if (language === 'en') {
    return clean.length <= 60 && /^[a-z]+(?:[ '-][a-z]+)*$/.test(clean) ? clean : '';
  }
  const hanzi = clean.replace(/\s+/g, '');
  return language === 'zh' && /^\p{Script=Han}{1,16}$/u.test(hanzi) ? hanzi : '';
}

export function chainEnds(key) {
  const letters = Array.from(key);
  return { first: letters[0] ?? '', last: letters.at(-1) ?? '' };
}

export function parseChainSuggestion(value, language, mode, first) {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 2 ||
      typeof value.term !== 'string' || typeof value.meaning !== 'string') return null;
  const key = normalizeChainTerm(value.term, language);
  const meaning = value.meaning.trim();
  if (!key || chainEnds(key).first !== first || !meaning || meaning.length > 100 ||
      !/\p{Script=Latin}/u.test(meaning) || /[<>\p{Cc}]/u.test(meaning) ||
      (language === 'en' && mode === 'word' && key.includes(' '))) return null;
  return { term: key, meaning };
}
