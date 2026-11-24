export const SENTENCE_TASK = 'sentence_usage';
export const SENTENCE_RUBRIC_VERSION = 1;
export const MAX_SENTENCE_LENGTH = 320;
export const SENTENCE_CRITERIA = ['targetUsage', 'meaning', 'grammar', 'naturalness'];

const encoder = new TextEncoder();
const votes = new Set(['pass', 'fail', 'uncertain']);

export function isSentenceAssessmentLanguage(language) {
  return language === 'en';
}

function comparisonText(text) {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
}

export function sentencePrecheck(language, term, answer, examples = []) {
  if (!isSentenceAssessmentLanguage(language)) return 'unsupported_language';
  if (answer.trim().length > MAX_SENTENCE_LENGTH) return 'too_long';
  const content = comparisonText(answer);
  const target = comparisonText(term);
  const units = answer.match(/\p{Script=Latin}+(?:['’\-]\p{Script=Latin}+)*/gu);
  if (!units || units.length < 2 || (target && content.split(target).every((part) => !part.trim()))) {
    return 'too_short';
  }
  if (examples.some((example) => comparisonText(example) === content)) return 'copied_example';
  return null;
}

export function sentenceAssessmentInput(language, term, targetMeaning, answer) {
  if (!isSentenceAssessmentLanguage(language) ||
      typeof term !== 'string' || typeof targetMeaning !== 'string' || typeof answer !== 'string') return null;
  const input = { language, term: term.trim(), targetMeaning: targetMeaning.trim(), answer: answer.trim() };
  if (!input.term || input.term.length > 96 || !input.targetMeaning || input.targetMeaning.length > 240 ||
      sentencePrecheck(language, input.term, input.answer) ||
      encoder.encode(JSON.stringify(input)).byteLength > 1_200) return null;
  return input;
}

export function parseSentenceFeedback(value) {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 2) return null;
  const { criteria, feedbackVi } = value;
  if (!criteria || typeof criteria !== 'object' || Object.keys(criteria).length !== SENTENCE_CRITERIA.length ||
      !SENTENCE_CRITERIA.every((criterion) => votes.has(criteria[criterion])) ||
      typeof feedbackVi !== 'string' || !feedbackVi.trim() || feedbackVi.length > 200 ||
      /[\u0000-\u001f\u007f]/u.test(feedbackVi)) return null;
  const decisions = Object.values(criteria);
  /** @type {'failed' | 'uncertain' | 'passed'} */
  const status = decisions.includes('fail') ? 'failed' : decisions.includes('uncertain') ? 'uncertain' : 'passed';
  return { status, criteria, feedbackVi: feedbackVi.trim() };
}
