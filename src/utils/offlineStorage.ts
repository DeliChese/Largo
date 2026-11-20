import type {
  AppSettings,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import type { ProfileImageKind, ProfileImages } from './profileImages';

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
const DB_VERSION = 3;
const STORE_NAME = 'app_state';
const STATE_KEY = 'primary_state_v3';
const LS_FALLBACK_KEY = 'lexisbloom_state_v3';
const GZIP_PREFIX = 'gzip:';
const PROFILE_IMAGE_KEYS = { avatar: 'profile_avatar', cover: 'profile_cover' };
let lastSaveTime = 0;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalFallback(snapshot: PersistedAppState & { savedAt: number }): Promise<void> {
  let raw = '';
  try {
    raw = JSON.stringify(snapshot);
    localStorage.setItem(LS_FALLBACK_KEY, raw);
    return;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'QuotaExceededError' || typeof CompressionStream === 'undefined') return;
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
    }
  } catch {
    // IndexedDB keeps the full snapshot when localStorage is unavailable.
  }
}

export async function saveOfflineState(state: PersistedAppState): Promise<void> {
  lastSaveTime = Math.max(Date.now(), lastSaveTime + 1);
  const snapshot = { ...state, savedAt: lastSaveTime };
  const fallbackWrite = saveLocalFallback(snapshot);

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const stored = store.get(STATE_KEY);
      stored.onsuccess = () => {
        if (snapshot.savedAt === lastSaveTime && (stored.result?.savedAt ?? 0) <= snapshot.savedAt) store.put(snapshot, STATE_KEY);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // The localStorage fallback can still save the snapshot.
  }
  await fallbackWrite;
}

export function loadSyncFallbackState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw || raw.startsWith(GZIP_PREFIX)) return null;
    const state: PersistedAppState = JSON.parse(raw);
    lastSaveTime = Math.max(lastSaveTime, state?.savedAt ?? 0);
    return state;
  } catch {
    return null;
  }
}

async function loadLocalFallback(): Promise<PersistedAppState | null> {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw?.startsWith(GZIP_PREFIX)) return loadSyncFallbackState();
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
  return latest;
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

export async function clearOfflineState(): Promise<void> {
  lastSaveTime = Math.max(Date.now(), lastSaveTime + 1);
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // noop
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(STATE_KEY);
      store.delete(PROFILE_IMAGE_KEYS.avatar);
      store.delete(PROFILE_IMAGE_KEYS.cover);
      tx.oncomplete = () => resolve();
      tx.onabort = () => resolve();
    });
    db.close();
  } catch {
    // noop
  }
}
