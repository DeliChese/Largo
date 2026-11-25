import { compactSnapshot, expandSnapshot } from './compactSnapshot';
import { ENGLISH_SEED_VERSION, withCurrentSeed } from '../data/seedVocab';
import type {
  AppSettings,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import type { ProfileImageKind, ProfileImages } from './profileImages';
import { decodeLearningAttempt, type LearningAttemptEvent } from './learningAttempt';

// Hydrated view used by React and the learning engine. Storage serializes it with compactSnapshot.
export interface PersistedAppState {
  decks: VocabDeck[];
  words: VocabWord[];
  logs: StudySessionLog[];
  profile: UserProfile;
  settings: AppSettings;
  version: number;
  savedAt?: number;
}

const DB_NAME = 'lexisbloom_offline_db';
export const DB_VERSION = 4;
const STORE_NAME = 'app_state';
const ATTEMPTS_STORE = 'learning_attempts';
const STATE_KEY = 'primary_state_v3';
const LS_FALLBACK_KEY = 'lexisbloom_state_v3';
const GZIP_PREFIX = 'gzip:';
const PROFILE_IMAGE_KEYS = { avatar: 'profile_avatar', cover: 'profile_cover' };
let lastSaveTime = 0;
let pendingWrite: Promise<unknown> = Promise.resolve();
const fallbackAttempts = new Set<string>();
const fallbackPositions = new Set<string>();

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => {});
  return result;
}

function nextSnapshot(state: PersistedAppState, previous?: PersistedAppState | null) {
  return { ...state, savedAt: Math.max(Date.now(), lastSaveTime + 1, (previous?.savedAt ?? 0) + 1) };
}

function assertCurrent(state: PersistedAppState, previous?: PersistedAppState | null) {
  if (previous && 'seedVersion' in previous && Number(previous.seedVersion) > ENGLISH_SEED_VERSION) {
    throw new Error('Bản lưu cần phiên bản học liệu mới hơn.');
  }
  if ((previous?.version ?? 0) > state.version || (previous?.savedAt ?? 0) > lastSaveTime) {
    throw new Error('Dữ liệu đã được cập nhật ở tab khác. Hãy tải lại Largo để tiếp tục lưu.');
  }
}

async function withDatabase<T>(db: IDBDatabase, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } finally {
    db.close();
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let blocked = false;
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Hãy đóng các tab Largo đang dùng phiên bản cũ rồi tải lại.'));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(ATTEMPTS_STORE)) {
        const attempts = db.createObjectStore(ATTEMPTS_STORE, { keyPath: 'eventId' });
        for (const key of ['wordId', 'startedAt', 'sessionId']) attempts.createIndex(key, key);
        attempts.createIndex('position', ['sessionId', 'attemptIndex'], { unique: true });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) db.close();
      else resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalFallback(snapshot: PersistedAppState & { savedAt: number }): Promise<boolean> {
  let raw = '';
  try {
    raw = JSON.stringify(compactSnapshot(snapshot));
    localStorage.setItem(LS_FALLBACK_KEY, raw);
    return true;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'QuotaExceededError' || typeof CompressionStream === 'undefined') return false;
  }

  try {
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    const chunks: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 0x4000) {
      chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x4000)));
    }
    if (snapshot.savedAt === lastSaveTime) {
      localStorage.setItem(LS_FALLBACK_KEY, GZIP_PREFIX + btoa(chunks.join('')));
      return true;
    }
  } catch {
    // IndexedDB keeps the full snapshot when localStorage is unavailable.
  }
  return false;
}

async function openForWrite(): Promise<IDBDatabase | undefined> {
  try {
    return await openDB();
  } catch (error) {
    if (error instanceof Error && (error.name === 'VersionError' || error.message.startsWith('Hãy đóng'))) throw error;
    // A browser with IndexedDB disabled can still keep ordinary study progress locally.
  }
}

type StateMutation<T> = (
  store: IDBObjectStore, tx: IDBTransaction, current: PersistedAppState | undefined, abort: (error: unknown) => void,
) => T;

function mutateState<T>(db: IDBDatabase, stores: string[], mutate: StateMutation<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, ...stores], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);
    let result: T;
    let failure: unknown;
    const abort = (error: unknown) => {
      failure = error;
      tx.abort();
    };
    request.onsuccess = () => {
      try {
        result = mutate(store, tx, request.result, abort);
      } catch (error) {
        abort(error);
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('Không thể lưu dữ liệu học.'));
  });
}

async function mirrorSnapshot(snapshot: PersistedAppState & { savedAt: number }, required: boolean) {
  const before = lastSaveTime;
  lastSaveTime = snapshot.savedAt;
  if (!await saveLocalFallback(snapshot) && required) {
    lastSaveTime = before;
    throw new Error('Trình duyệt chưa lưu được tiến độ học.');
  }
}

export function saveOfflineState(state: PersistedAppState): Promise<void> {
  return enqueueWrite(async () => {
    const fallback = await loadLocalFallback();
    assertCurrent(state, fallback);
    const db = await openForWrite();
    const snapshot = db ? await withDatabase(db, () => mutateState(db, [], (store, _tx, previous) => {
      assertCurrent(state, previous);
      const next = nextSnapshot(state, previous);
      store.put(compactSnapshot(next), STATE_KEY);
      return next;
    })) : nextSnapshot(state, fallback);
    await mirrorSnapshot(snapshot, !db);
  });
}

export function loadSyncFallbackState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw || raw.startsWith(GZIP_PREFIX)) return null;
    const state = expandSnapshot(JSON.parse(raw));
    lastSaveTime = Math.max(lastSaveTime, state?.savedAt ?? 0);
    return state;
  } catch {
    return null;
  }
}

async function loadLocalFallback(): Promise<PersistedAppState | null> {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw?.startsWith(GZIP_PREFIX)) return raw ? JSON.parse(raw) : null;
    const bytes = Uint8Array.from(atob(raw.slice(GZIP_PREFIX.length)), (char) => char.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  } catch {
    return null;
  }
}

export async function loadOfflineState(): Promise<PersistedAppState | null> {
  let result: PersistedAppState | null = null;
  try {
    const db = await openDB();
    result = await new Promise<PersistedAppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PersistedAppState) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    // Fall back to localStorage
  }
  const fallback = await loadLocalFallback();
  const latest = result && (result.savedAt ?? 0) >= (fallback?.savedAt ?? 0) ? result : fallback;
  lastSaveTime = Math.max(lastSaveTime, latest?.savedAt ?? 0);
  return latest && expandSnapshot(latest);
}

export async function loadProfileImages(): Promise<ProfileImages> {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const avatar = store.get(PROFILE_IMAGE_KEYS.avatar);
      const cover = store.get(PROFILE_IMAGE_KEYS.cover);
      tx.oncomplete = () => resolve({
        avatar: avatar.result instanceof Blob ? avatar.result : undefined,
        cover: cover.result instanceof Blob ? cover.result : undefined,
      });
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export interface StoredStudyData {
  state?: PersistedAppState;
  images: ProfileImages;
  attempts: LearningAttemptEvent[];
  hasFutureAttempts: boolean;
}

function isFutureAttempt(raw: unknown): boolean {
  return typeof raw === 'object' && raw !== null && 'schemaVersion' in raw &&
    typeof raw.schemaVersion === 'number' && raw.schemaVersion > 1;
}

export async function loadStoredStudyData(): Promise<StoredStudyData | undefined> {
  await pendingWrite;
  const db = await openForWrite();
  if (!db) return;
  const fallback = await loadLocalFallback();
  const data = await withDatabase(db, () => new Promise<StoredStudyData>((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, ATTEMPTS_STORE], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const state = store.get(STATE_KEY);
    const avatar = store.get(PROFILE_IMAGE_KEYS.avatar);
    const cover = store.get(PROFILE_IMAGE_KEYS.cover);
    const attempts = tx.objectStore(ATTEMPTS_STORE).getAll();
    tx.oncomplete = () => resolve({
      state: (fallback?.savedAt ?? 0) > (state.result?.savedAt ?? 0) ? fallback : state.result,
      images: {
        avatar: avatar.result instanceof Blob ? avatar.result : undefined,
        cover: cover.result instanceof Blob ? cover.result : undefined,
      },
      attempts: attempts.result.flatMap((raw) => decodeLearningAttempt(raw) ?? [])
        .sort((a, b) => a.startedAt - b.startedAt || a.eventId.localeCompare(b.eventId)),
      hasFutureAttempts: attempts.result.some(isFutureAttempt),
    });
    tx.onabort = () => reject(tx.error ?? new Error('Không thể đọc dữ liệu học.'));
  }));
  return { ...data, state: data.state && expandSnapshot(data.state) };
}

export function restoreOfflineState(
  state: PersistedAppState, images: ProfileImages, attempts: readonly LearningAttemptEvent[] = [],
): Promise<void> {
  return enqueueWrite(async () => {
    const fallback = await loadLocalFallback();
    assertCurrent(state, fallback);
    const db = await openDB();
    const snapshot = await withDatabase(db, () => mutateState(db, [ATTEMPTS_STORE], (store, tx, previous, abort) => {
      assertCurrent(state, previous);
      const restored = nextSnapshot(state, previous);
      const ledger = tx.objectStore(ATTEMPTS_STORE);
      const existing = ledger.getAll();
      existing.onsuccess = () => {
        try {
          if (existing.result.some(isFutureAttempt)) throw new Error('Bản lưu chứa lượt trả lời của phiên bản mới hơn.');
          store.put(compactSnapshot(restored), STATE_KEY);
          for (const kind of ['avatar', 'cover'] as const) {
            if (images[kind]) store.put(images[kind], PROFILE_IMAGE_KEYS[kind]);
            else store.delete(PROFILE_IMAGE_KEYS[kind]);
          }
          ledger.clear();
          for (const attempt of attempts) ledger.add(attempt);
        } catch (error) {
          abort(error);
        }
      };
      return restored;
    }));
    fallbackAttempts.clear();
    fallbackPositions.clear();
    await mirrorSnapshot(snapshot, false);
  });
}

export interface AttemptCommit {
  state: PersistedAppState;
  inserted: boolean;
  retained: boolean;
}

export function commitLearningAttempt(
  event: LearningAttemptEvent, initial: PersistedAppState,
  project: (state: PersistedAppState, event: LearningAttemptEvent) => PersistedAppState,
): Promise<AttemptCommit> {
  return enqueueWrite(async () => {
    const decoded = decodeLearningAttempt(event);
    if (!decoded) throw new Error('Lượt trả lời không hợp lệ.');
    const fallback = await loadLocalFallback();
    const db = await openForWrite();
    if (!db) {
      const state = fallback ? withCurrentSeed(expandSnapshot(fallback)) : initial;
      assertCurrent(initial, fallback);
      const position = JSON.stringify([event.sessionId, event.attemptIndex]);
      if (fallbackAttempts.has(event.eventId) || fallbackPositions.has(position)) return { state, inserted: false, retained: false };
      const snapshot = nextSnapshot(project(state, decoded), fallback);
      await mirrorSnapshot(snapshot, true);
      fallbackAttempts.add(event.eventId);
      fallbackPositions.add(position);
      return { state: snapshot, inserted: true, retained: false };
    }
    const result = await withDatabase(db, () => mutateState(db, [ATTEMPTS_STORE], (store, tx, previous, abort) => {
      const ledger = tx.objectStore(ATTEMPTS_STORE);
      const byId = ledger.getKey(event.eventId);
      const byPosition = ledger.index('position').getKey([event.sessionId, event.attemptIndex]);
      const newest = (previous?.savedAt ?? 0) >= (fallback?.savedAt ?? 0) ? previous : fallback;
      const outcome: AttemptCommit = { state: newest ? withCurrentSeed(expandSnapshot(newest)) : initial, inserted: false, retained: true };
      byPosition.onsuccess = () => {
        if (byId.result !== undefined || byPosition.result !== undefined) return;
        try {
          assertCurrent(initial, newest);
          const next = project(outcome.state, decoded);
          if (next !== outcome.state || newest !== previous) {
            outcome.state = nextSnapshot(next, newest);
            store.put(compactSnapshot(outcome.state), STATE_KEY);
          }
          ledger.add(decoded);
          outcome.inserted = true;
        } catch (error) {
          abort(error);
        }
      };
      return outcome;
    }));
    const { savedAt } = result.state;
    if (result.inserted && savedAt !== undefined && savedAt > lastSaveTime) {
      await mirrorSnapshot({ ...result.state, savedAt }, false);
    }
    return result;
  });
}

export async function saveProfileImage(kind: ProfileImageKind, image?: Blob): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const key = PROFILE_IMAGE_KEYS[kind];
      if (image) store.put(image, key);
      else store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function resetOfflineState(state: PersistedAppState): Promise<void> {
  const db = await openForWrite();
  if (db) {
    db.close();
    return restoreOfflineState(state, {});
  }
  await saveOfflineState(state);
  fallbackAttempts.clear();
  fallbackPositions.clear();
}
