import { CURRENT_DATA_VERSION, ENGLISH_SEED_VERSION, INITIAL_DECKS, INITIAL_WORDS } from '../data/seedVocab';
import type { VocabWord } from '../types/vocab';
import type { PersistedAppState } from './offlineStorage';
import { createInitialSRS } from './srsBloom';

const catalogue = new Map(INITIAL_WORDS.map(word => [word.id, word]));
type WordPatch = Partial<{ [K in keyof VocabWord]: VocabWord[K] | null }>;
type CompactSnapshot = PersistedAppState & {
  seedVersion: number;
  installedAt: number;
  wordOrder: string[];
  wordState: Record<string, WordPatch>;
  deletedWordIds: string[];
};

// Only personal cards need a full record. An empty patch inherits the current edition.
const patchKeys = [
  'createdAt', 'srs', 'bloomLevel', 'lastSynthesisAt', 'personalRelations', 'deckId',
  'term', 'meaning', 'partOfSpeech', 'phonetic', 'examples', 'collocations', 'notes',
  'synonyms', 'antonyms', 'englishForms', 'additionalSenses',
] as const;

function equal(a: unknown, b: unknown): boolean {
  return a === b || (!!a && !!b && typeof a === 'object' && typeof b === 'object' &&
    JSON.stringify(a) === JSON.stringify(b));
}

export function compactSnapshot(state: PersistedAppState): CompactSnapshot {
  if (state.version !== CURRENT_DATA_VERSION) throw new Error('Cần nâng cấp dữ liệu trước khi lưu.');
  const installedAt = state.words.find(word => catalogue.has(word.id))?.createdAt ?? 0;
  const words: VocabWord[] = [];
  const wordState: Record<string, WordPatch> = Object.create(null);
  const wordOrder = state.words.map(word => word.id);
  const present = new Set(wordOrder);
  if (present.size !== wordOrder.length) throw new Error('Bản lưu chứa ID thẻ trùng.');
  for (const word of state.words) {
    const seed = catalogue.get(word.id);
    if (!seed) {
      words.push(word);
      continue;
    }
    const patch: WordPatch = {};
    for (const key of patchKeys) {
      const baseline = key === 'createdAt' ? installedAt
        : key === 'srs' ? createInitialSRS(word.createdAt) : seed[key];
      if (!equal(word[key], baseline)) Object.assign(patch, { [key]: word[key] ?? null });
    }
    if (Object.keys(patch).length) wordState[word.id] = patch;
  }
  const deletedWordIds = INITIAL_WORDS.filter(word => !present.has(word.id)).map(word => word.id);
  return { ...state, seedVersion: ENGLISH_SEED_VERSION, installedAt, words, wordState, wordOrder, deletedWordIds };
}

const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 200;
const object = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
const ids = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 200_000 && value.every(validId);

export function expandSnapshot(raw: PersistedAppState): PersistedAppState {
  if (!raw || !('seedVersion' in raw)) return raw;
  const { seedVersion, installedAt, wordState, wordOrder, deletedWordIds, words, ...state } = raw as CompactSnapshot;
  const invalid = () => new Error('Bản lưu học liệu không hợp lệ hoặc cần phiên bản Largo mới hơn.');
  if (!Number.isSafeInteger(seedVersion) || seedVersion < 1 || seedVersion > ENGLISH_SEED_VERSION ||
      !Number.isSafeInteger(installedAt) || installedAt < 0 || !ids(wordOrder) || !ids(deletedWordIds) ||
      !object(wordState) || !Array.isArray(words) || words.length > 200_000 ||
      !Array.isArray(state.decks) || state.decks.length > 30_000) throw invalid();
  const present = new Set(wordOrder);
  const deleted = new Set(deletedWordIds);
  const custom = new Map(words.map(word => [word.id, word]));
  if (present.size !== wordOrder.length || deleted.size !== deletedWordIds.length || custom.size !== words.length ||
      words.some(word => !present.has(word.id) || catalogue.has(word.id)) ||
      deletedWordIds.some(id => present.has(id)) ||
      Object.entries(wordState).some(([id, patch]) => !present.has(id) || !catalogue.has(id) ||
        !object(patch) || Object.keys(patch).some(key => !patchKeys.some(allowed => allowed === key)))) throw invalid();

  const expanded = wordOrder.map(id => {
    const personal = custom.get(id);
    if (personal) return personal;
    const seed = catalogue.get(id);
    if (!seed) throw invalid();
    const patch = wordState[id] ?? {};
    const createdAt = patch.createdAt ?? installedAt;
    const word = { ...seed, createdAt, srs: createInitialSRS(createdAt), ...patch };
    for (const key of patchKeys) {
      if (word[key] === null || word[key] === undefined) delete word[key];
    }
    return word as VocabWord;
  });
  for (const seed of INITIAL_WORDS) {
    if (!present.has(seed.id) && !deleted.has(seed.id)) {
      if (seedVersion === ENGLISH_SEED_VERSION) throw invalid();
      expanded.push(seed);
    }
  }
  if (seedVersion < ENGLISH_SEED_VERSION) {
    // Refresh lesson metadata without running a legacy word migration over decoded overrides.
    const currentDecks = new Map(INITIAL_DECKS.map(deck => [deck.id, deck]));
    const existingDeckIds = new Set(state.decks.map(deck => deck.id));
    state.decks = state.decks.map(saved => {
      const seed = currentDecks.get(saved.id);
      if (!seed) return saved;
      return { ...seed, createdAt: saved.createdAt, ...(saved.wordIds && { wordIds: saved.wordIds }) };
    }).concat(INITIAL_DECKS.filter(deck => !existingDeckIds.has(deck.id)));
  }
  return { ...state, words: expanded };
}
