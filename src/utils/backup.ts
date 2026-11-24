import { CURRENT_DATA_VERSION, INITIAL_SETTINGS, isBuiltinWord, withCurrentSeed } from '../data/seedVocab';
import { DB_VERSION, type PersistedAppState } from './offlineStorage';
import { PROFILE_IMAGE_ACCEPT, type ProfileImageKind, type ProfileImages } from './profileImages';
import { decodeLearningAttempt, type LearningAttemptEvent } from './learningAttempt';

const MAX_BACKUP_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
type Check = (value: unknown) => boolean;
type JsonObject = Record<string, unknown>;
type ExportImages = Partial<Record<ProfileImageKind, string>>;

export interface BackupPreview {
  state: PersistedAppState;
  images: ProfileImages;
  attempts: LearningAttemptEvent[];
  summary: { decks: number; words: number; logs: number; images: number; attempts: number };
}

const object = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value);
const string: Check = (value) => typeof value === 'string' && value.length <= 20_000;
const id: Check = (value) => typeof value === 'string' && value.length > 0 && value.length <= 200;
const bool: Check = (value) => typeof value === 'boolean';
const number: Check = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const count: Check = (value) => Number.isSafeInteger(value) && number(value);
const oneOf = (...values: unknown[]): Check => (value) => values.includes(value);
const optional = (check: Check): Check => (value) => value === undefined || check(value);
const list = (check: Check, limit = 10_000): Check => (value) =>
  Array.isArray(value) && value.length <= limit && value.every(check);
const shape = (fields: Record<string, Check>): Check => (value) =>
  object(value) && Object.entries(fields).every(([key, check]) => check(value[key]));

const legacyLanguages = new Set(['zh', 'ja', 'fr', 'ko', 'es']);
const language = oneOf('en', 'zh', 'ja', 'fr', 'ko', 'es');
const edition = oneOf('hsk20', 'hsk30');
const relations = shape({ synonyms: list(string), antonyms: list(string) });
const examples = list(shape({ sentence: string, translation: string, phonetic: optional(string), sourceUrl: optional(string) }));
const collocations = list(shape({ phrase: string, meaning: string }));
const englishForm = shape({ term: optional(string), phonetic: optional(string), examples: optional(examples), collocations: optional(collocations) });
const word = shape({
  id, deckId: id, language, term: string, meaning: string, phonetic: string, partOfSpeech: string,
  synonyms: list(string), antonyms: optional(list(string)), examples, collocations,
  personalRelations: optional(relations), notes: optional(string), radical: optional(string), sinoVietnamese: optional(string),
  englishForms: optional(shape({ 'en-GB': optional(englishForm), 'en-US': optional(englishForm) })),
  bloomLevel: oneOf(1, 2, 3, 4, 5, 6), lastSynthesisAt: optional(count), createdAt: count,
  srs: shape({
    easeFactor: number, intervalDays: number, repetitions: count, lapses: count, nextReviewAt: count,
    lastReviewedAt: (value) => value === null || count(value), firstReviewedAt: optional(count), lastIntensiveAt: optional(count),
  }),
});
const deck = shape({
  id, name: string, nativeName: optional(string), description: string, language, category: string, isCustom: bool, createdAt: count,
  level: optional(string), hskEdition: optional(edition), wordIds: optional(list(id, 200_000)),
  collection: optional(oneOf('textbook', 'vocabulary', 'situations', 'collocations', 'regional', 'phrasal')),
});
const log = shape({
  id, deckId: id, timestamp: count, level: optional(string), language: optional(language), hskEdition: optional(edition),
  mode: oneOf('guided', 'intensive', 'flashcard', 'quiz', 'dictation', 'cloze', 'collocation', 'synthesis', 'speed',
    'game_match', 'game_wordfall', 'game_scramble', 'game_audioblitz'),
  wordsReviewed: count, correctCount: count, xpEarned: count, durationSeconds: count,
});
const profile = shape({
  name: string, title: string, bio: string, nativeLanguage: string, targetLanguage: language,
  xp: count, streakDays: count, longestStreak: count, lastStudyDate: string, dailyGoalWords: count,
  todayWordsCount: count, todayWordIds: optional(list(id, 200_000)),
  bestMatchScore: count, bestWordFallScore: count, bestScrambleScore: count, bestAudioBlitzScore: count,
});
const optionalStrings = (...keys: string[]) => shape(Object.fromEntries(keys.map((key) => [key, optional(string)])));
const settings = shape({
  theme: optional(oneOf('indigo', 'botanical', 'amber', 'midnight')),
  colorScheme: optional(oneOf('light', 'dark', 'system')), uiDensity: optional(oneOf('airy', 'compact', 'zen')),
  srsMode: optional(oneOf('standard', 'cram', 'relaxed', 'bloom_mastery')), zenFocusMode: optional(bool),
  dailyNewWordLimit: optional(count), adaptivePlanner: optional(bool), hskEdition: optional(edition),
  englishLocale: optional(oneOf('en-GB', 'en-US')),
  speechRate: optional(number), autoPlayAudio: optional(bool), showExamplePhonetic: optional(bool),
  soundEnabled: optional(bool), soundVolume: optional(number), reminderEnabled: optional(bool),
  reminderHour: optional(string), retentionThreshold: optional(number),
  studyLevels: optional(optionalStrings('en', 'zh', 'ja', 'fr', 'ko', 'es')),
  speechVoices: optional(optionalStrings('en', 'zh', 'ja', 'fr', 'ko', 'es', 'en-GB', 'en-US')),
});

export function createBackup(state: PersistedAppState, images: ExportImages, now = new Date(), attempts: LearningAttemptEvent[] = []) {
  const { decks, words, logs, profile, settings, version } = state;
  return {
    format: 'largo-backup', formatVersion: 2, exportedAt: now.toISOString(),
    appDataVersion: version, idbSchemaVersion: DB_VERSION,
    snapshot: { decks, words, logs, profile, settings, images },
    attempts,
  };
}

async function decodeImage(value: unknown): Promise<Blob | undefined> {
  if (value === undefined) return;
  const invalid = () => new Error('Ảnh hồ sơ trong bản sao lưu bị hỏng hoặc có định dạng không hỗ trợ.');
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64) throw invalid();
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || !PROFILE_IMAGE_ACCEPT.split(',').includes(match[1])) throw invalid();
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  } catch {
    throw invalid();
  }
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw invalid();
  const image = new Blob([bytes], { type: match[1] });
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(image).catch(() => { throw invalid(); });
    bitmap.close();
  }
  return image;
}

function uniqueIds(items: readonly { id: string }[]) {
  return new Set(items.map(({ id }) => id)).size === items.length;
}

export async function previewBackup(file: Blob): Promise<BackupPreview> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error('Bản sao lưu phải nhỏ hơn 100 MB.');
  const invalid = () => new Error('Tệp không chứa bản sao lưu Largo hợp lệ.');
  let root: unknown;
  try {
    root = JSON.parse(await file.text(), (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw invalid();
      return value;
    });
  } catch {
    throw invalid();
  }
  if (!object(root)) throw invalid();
  const legacy = root.format === undefined;
  const version = legacy ? root.version : root.appDataVersion;
  const snapshot = legacy ? root : root.snapshot;
  if (!legacy && (root.format !== 'largo-backup' || root.formatVersion !== 2 ||
    !count(root.idbSchemaVersion) || Number(root.idbSchemaVersion) > DB_VERSION)) {
    throw new Error('Phiên bản bản sao lưu này chưa được hỗ trợ.');
  }
  if (!count(version) || Number(version) < 1 || Number(version) > CURRENT_DATA_VERSION) {
    throw new Error('Phiên bản dữ liệu trong bản sao lưu chưa được hỗ trợ.');
  }
  if (!object(snapshot) || !list(deck, 30_000)(snapshot.decks) || !list(word, 200_000)(snapshot.words) ||
    !list(log, 300_000)(snapshot.logs) || !profile(snapshot.profile) || !optional(settings)(snapshot.settings)) {
    throw invalid();
  }
  const saved = snapshot as unknown as PersistedAppState;
  if (![saved.decks, saved.words, saved.logs].every(uniqueIds)) throw invalid();
  const attempts: LearningAttemptEvent[] = [];
  const attemptIds = new Set<string>();
  const positions = new Set<string>();
  if (!legacy) {
    if (!Array.isArray(root.attempts) || root.attempts.length > 300_000) throw invalid();
    for (const record of root.attempts) {
      if (Number(version) < CURRENT_DATA_VERSION && object(record) && legacyLanguages.has(String(record.language))) {
        continue;
      }
      const attempt = decodeLearningAttempt(record);
      if (!attempt) throw new Error('Bản sao lưu chứa lượt trả lời không hợp lệ hoặc dùng phiên bản mới hơn.');
      const position = JSON.stringify([attempt.sessionId, attempt.attemptIndex]);
      if (attemptIds.has(attempt.eventId) || positions.has(position)) throw invalid();
      attemptIds.add(attempt.eventId);
      positions.add(position);
      attempts.push(attempt);
    }
  }
  const state = withCurrentSeed({
    decks: saved.decks, words: saved.words.map((entry) => Array.isArray(entry.antonyms) ? entry : { ...entry, antonyms: [] }),
    logs: saved.logs, profile: saved.profile, settings: { ...INITIAL_SETTINGS, ...saved.settings }, version: Number(version),
  });
  const deckIds = new Set(state.decks.map(({ id }) => id));
  if (state.words.some(({ deckId, id }) => !deckIds.has(deckId) && !isBuiltinWord(id))) throw invalid();
  const source = legacy ? snapshot.profileImages : snapshot.images;
  if (source !== undefined && !object(source)) throw invalid();
  const [avatar, cover] = await Promise.all([decodeImage(source?.avatar), decodeImage(source?.cover)]);
  return {
    state,
    images: { avatar, cover },
    attempts,
    summary: { decks: state.decks.length, words: state.words.length, logs: state.logs.length, images: Number(!!avatar) + Number(!!cover), attempts: attempts.length },
  };
}
