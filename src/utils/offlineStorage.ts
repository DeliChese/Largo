import type {
  AppSettings,
  StudySessionLog,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';

export interface PersistedAppState {
  decks: VocabDeck[];
  words: VocabWord[];
  logs: StudySessionLog[];
  profile: UserProfile;
  settings: AppSettings;
  version: number;
}

const DB_NAME = 'lexisbloom_offline_db';
const DB_VERSION = 3;
const STORE_NAME = 'app_state';
const STATE_KEY = 'primary_state_v3';
const LS_FALLBACK_KEY = 'lexisbloom_state_v3';

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

export async function saveOfflineState(state: PersistedAppState): Promise<void> {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors on localStorage
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // localStorage already saved above
  }
}

export function loadSyncFallbackState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAppState;
  } catch {
    return null;
  }
}

export async function loadOfflineState(): Promise<PersistedAppState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<PersistedAppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PersistedAppState) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result) return result;
  } catch {
    // Fall back to localStorage
  }
  return loadSyncFallbackState();
}

export async function clearOfflineState(): Promise<void> {
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // noop
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // noop
  }
}
