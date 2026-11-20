import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Bell, ChevronDown, Languages, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import type {
  AnalyticsSubRoute,
  AppRoute,
  AppSettings,
  BloomLevel,
  DeckWordImport,
  EnglishLocale,
  ExampleSentence,
  HskEdition,
  LanguageCode,
  LexicalRelations,
  StudyModeId,
  StudySessionMode,
  StudySessionLog,
  SmartReminder,
  UserProfile,
  VocabDeck,
  VocabWord,
} from './types/vocab';
import { DEFAULT_HSK_EDITION, HSK_EDITIONS } from '../Chinese/hsk1Courses';
import {
  INITIAL_DECKS,
  INITIAL_LOGS,
  INITIAL_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_WORDS,
  LANGUAGE_LABELS,
  CURRENT_DATA_VERSION,
  hasCurrentSeedDecks,
  isBuiltinWord,
  withCurrentSeed,
} from './data/seedVocab';
import { createInitialSRS, generateSmartReminders, isWordDue, localStudyDate } from './utils/srsBloom';
import {
  getDailyStudyPlan, getIntensiveStudyPlan, getPracticeWords, PRACTICE_SESSION_SIZE, recordStudyActivity,
  type StudyFilter,
} from './utils/studyPlan';
import { getDeckStudyLevel, getEditionDecks, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './utils/studyScope';
import { ENGLISH_LOCALES, ENGLISH_LOCALE_LABEL, getEnglishLocale, getEnglishStudyWord } from './utils/englishStudy';
import { importCollocations, importEnglishForms, importExamples, importTerms, trimImportText } from './utils/vocabImport';
import {
  commitLearningAttempt,
  loadOfflineState,
  loadSyncFallbackState,
  loadStoredStudyData,
  resetOfflineState,
  restoreOfflineState,
  saveOfflineState,
  saveProfileImage,
  type PersistedAppState,
} from './utils/offlineStorage';
import { prepareProfileImage, readImageForBackup, type ProfileImageKind, type ProfileImages } from './utils/profileImages';
import { createBackup, type BackupPreview } from './utils/backup';
import { setPronunciationVoices, soundEngine, stopPronunciation } from './utils/soundEngine';
import { clearSpeechClipCache } from './utils/speechClipCache';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { NAV_LABELS, Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudyHubView } from './components/StudyHubView';
import { StudySession } from './components/StudySession';
import type { LearningAttemptEvent } from './utils/learningAttempt';
import { EMPTY_PROGRESS, projectStudyAttempt, type StudySessionIdentity } from './utils/studyAttempt';
import { buildMasteryProjection } from './utils/mastery';
import { WordLookup } from './components/WordLookup';
import { EMPTY_EXAMPLES, EMPTY_RELATIONS, ExampleFields, RelationFields } from './components/WordFormFields';

const GamesView = lazy(() => import('./components/GamesView').then(({ GamesView }) => ({ default: GamesView })));
const DecksView = lazy(() => import('./components/DecksView').then(({ DecksView }) => ({ default: DecksView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(({ AnalyticsView }) => ({ default: AnalyticsView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(({ ProfileView }) => ({ default: ProfileView })));
const AchievementsView = lazy(() => import('./components/AchievementsView').then(({ AchievementsView }) => ({ default: AchievementsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(({ SettingsView }) => ({ default: SettingsView })));

const NOTIFICATION_DAY_KEY = 'lexisbloom_reminder_date';

interface ActiveSession extends StudySessionIdentity {
  words: VocabWord[];
}

function parseRouteFromHash(): { route: AppRoute; analyticsSub: AnalyticsSubRoute } {
  if (typeof window === 'undefined') return { route: 'dashboard', analyticsSub: 'overview' };
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  const first = parts[0] as AppRoute | undefined;
  const validRoutes: AppRoute[] = [
    'dashboard',
    'study',
    'games',
    'decks',
    'analytics',
    'profile',
    'achievements',
    'settings',
  ];
  const route = first && validRoutes.includes(first) ? first : 'dashboard';
  const second = parts[1] as AnalyticsSubRoute | undefined;
  const validSubs: AnalyticsSubRoute[] = ['overview', 'bloom', 'retention', 'history'];
  const analyticsSub = second && validSubs.includes(second) ? second : 'overview';
  return { route, analyticsSub };
}

function useImageUrl(image?: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const imageUrl = image && URL.createObjectURL(image);
    setUrl(imageUrl);
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [image]);
  return url;
}

export default function App() {
  const initialFallback = useMemo(() => {
    const saved = loadSyncFallbackState();
    return saved && withCurrentSeed(saved);
  }, []);
  const [decks, setDecks] = useState<VocabDeck[]>(() => initialFallback?.decks || INITIAL_DECKS);
  const [words, setWords] = useState<VocabWord[]>(() => initialFallback?.words || INITIAL_WORDS);
  const [logs, setLogs] = useState<StudySessionLog[]>(() => initialFallback?.logs || INITIAL_LOGS);
  const [profile, setProfile] = useState<UserProfile>(() => initialFallback?.profile || INITIAL_PROFILE);
  const [profileImages, setProfileImages] = useState<ProfileImages>({});
  const imageWrites = useRef(Promise.resolve());
  const avatarUrl = useImageUrl(profileImages.avatar);
  const coverUrl = useImageUrl(profileImages.cover);
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...INITIAL_SETTINGS, ...initialFallback?.settings }));
  const [hydrated, setHydrated] = useState(false);
  const [attempts, setAttempts] = useState<LearningAttemptEvent[]>([]);
  const masteryByWord = useMemo(() => buildMasteryProjection(attempts), [attempts]);
  const [writingState, setWritingState] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [futureState, setFutureState] = useState(() => (initialFallback?.version ?? 0) > CURRENT_DATA_VERSION);
  const restoring = useRef(false);
  const recordedState = useRef<PersistedAppState | undefined>(undefined);
  const [now, setNow] = useState(Date.now);

  // Router State
  const initialHash = useMemo(() => parseRouteFromHash(), []);
  const [route, setRoute] = useState<AppRoute>(initialHash.route);
  const [analyticsSub, setAnalyticsSub] = useState<AnalyticsSubRoute>(initialHash.analyticsSub);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Study Session State
  const [selectedMode, setSelectedMode] = useState<StudyModeId>('flashcard');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Quick Add Word Modal & Smart Reminder Drawer
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaTerm, setQaTerm] = useState('');
  const [qaPhonetic, setQaPhonetic] = useState('');
  const [qaMeaning, setQaMeaning] = useState('');
  const [qaCollocation, setQaCollocation] = useState('');
  const [qaCollocationMeaning, setQaCollocationMeaning] = useState('');
  const [qaExamples, setQaExamples] = useState<readonly ExampleSentence[]>(EMPTY_EXAMPLES);
  const [qaRelations, setQaRelations] = useState(EMPTY_RELATIONS);
  const [qaDeckId, setQaDeckId] = useState('');
  const [qaError, setQaError] = useState<string | null>(null);
  const [showReminderPopover, setShowReminderPopover] = useState(false);
  const reminderContainer = useRef<HTMLDivElement>(null);
  const reminderButton = useRef<HTMLButtonElement>(null);
  const quickAddDialog = useRef<HTMLDialogElement>(null);
  const lastReminderDate = useRef('');

  const isOnline = useOnlineStatus();

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    Promise.all([loadOfflineState(), loadStoredStudyData().catch(() => undefined)])
      .then(([stored, data]) => {
        setProfileImages(data?.images ?? {});
        setAttempts(data?.attempts ?? []);
        const saved = stored && withCurrentSeed(stored);
        setFutureState((saved?.version ?? 0) > CURRENT_DATA_VERSION || !!data?.hasFutureAttempts);
        if (saved) {
          const restoredSettings = { ...INITIAL_SETTINGS, ...saved.settings };
          if (saved === stored) recordedState.current = { ...saved, settings: restoredSettings };
          setDecks(saved.decks);
          setWords(saved.words);
          setLogs(saved.logs);
          setProfile(saved.profile);
          setSettings(restoredSettings);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const refreshClock = () => setNow(Date.now());
    const timer = window.setInterval(refreshClock, 30_000);
    window.addEventListener('focus', refreshClock);
    document.addEventListener('visibilitychange', refreshClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshClock);
      document.removeEventListener('visibilitychange', refreshClock);
    };
  }, []);

  useEffect(() => {
    if (!showReminderPopover) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!reminderContainer.current?.contains(event.target as Node)) setShowReminderPopover(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowReminderPopover(false);
      reminderButton.current?.focus();
    };
    window.addEventListener('pointerdown', closeOnOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showReminderPopover]);

  useEffect(() => {
    const dialog = quickAddDialog.current;
    if (showQuickAdd && !dialog?.open) dialog?.showModal();
    else if (!showQuickAdd && dialog?.open) dialog.close();
  }, [showQuickAdd]);

  // Persist to IndexedDB + localStorage whenever state changes
  useEffect(() => {
    if (!hydrated || futureState || restoring.current || !hasCurrentSeedDecks(decks)) return;
    const recorded = recordedState.current;
    if (recorded?.decks === decks && recorded.words === words && recorded.logs === logs &&
      recorded.profile === profile && recorded.settings === settings) return;
    saveOfflineState({
      decks,
      words,
      logs,
      profile,
      settings,
      version: CURRENT_DATA_VERSION,
    }).then(() => setStorageError(''), (error: unknown) =>
      setStorageError(error instanceof Error ? error.message : 'Largo chưa lưu được dữ liệu.'));
  }, [decks, words, logs, profile, settings, hydrated, futureState]);

  // Sync theme, dark mode, and sound engine
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDarkActive =
    settings.colorScheme === 'dark' || (settings.colorScheme === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkActive);
    root.setAttribute('data-theme', settings.theme);
    const themeColor = getComputedStyle(root).getPropertyValue('--bg-canvas').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [isDarkActive, settings.theme]);

  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
    soundEngine.volume = settings.soundVolume;
  }, [settings.soundEnabled, settings.soundVolume]);

  useEffect(() => {
    setPronunciationVoices(settings.speechVoices, settings.englishLocale);
  }, [settings.speechVoices, settings.englishLocale]);

  // Hash URL sync
  const navigate = useCallback((nextRoute: AppRoute, sub?: AnalyticsSubRoute) => {
    setActiveSession(null);
    setShowReminderPopover(false);
    setRoute(nextRoute);
    if (sub) setAnalyticsSub(sub);
    const nextHash =
      nextRoute === 'analytics'
        ? `#/analytics/${sub || analyticsSub}`
        : `#/${nextRoute}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [analyticsSub]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseRouteFromHash();
      setRoute(parsed.route);
      setAnalyticsSub(parsed.analyticsSub);
      setShowReminderPopover(false);
      if (parsed.route !== 'study') setActiveSession(null);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const language = profile.targetLanguage;
  const englishLocale = getEnglishLocale(settings);
  const hskEdition = settings.hskEdition === 'hsk20' ? 'hsk20' : DEFAULT_HSK_EDITION;
  const languages = useMemo(() => [...new Set([...getStudyLanguages(decks), language])], [decks, language]);
  const editionDecks = useMemo(() => getEditionDecks(decks, language, hskEdition), [decks, language, hskEdition]);
  const levels = useMemo(() => getStudyLevels(language, editionDecks), [language, editionDecks]);
  const level = levels.find((entry) => entry.id === settings.studyLevels?.[language]) ?? levels[0];
  const scopedDecks = useMemo(() => getScopedDecks(editionDecks, language, level.id), [editionDecks, language, level.id]);
  const libraryWords = useMemo(() => getScopedWords(words, scopedDecks, language), [words, scopedDecks, language]);
  const scopedWords = useMemo(() => language === 'en'
    ? libraryWords.map((word) => getEnglishStudyWord(word, englishLocale))
    : libraryWords, [libraryWords, language, englishLocale]);
  const profileWords = useMemo(() => {
    const deckIds = new Set(decks.map(({ id }) => id));
    const lessonWordIds = new Set(decks.flatMap(({ wordIds }) => wordIds ?? []));
    return words.filter((word) => word.srs.lastReviewedAt !== null || deckIds.has(word.deckId) || lessonWordIds.has(word.id));
  }, [decks, words]);
  const scopedLogs = useMemo(() => {
    const decksById = new Map(decks.map((deck) => [deck.id, deck]));
    return logs.filter((log) => {
      const deck = decksById.get(log.deckId);
      const logLanguage = log.language ?? deck?.language ?? 'zh';
      if (logLanguage !== language) return false;
      if (language === 'zh' && log.hskEdition && log.hskEdition !== hskEdition) return false;
      const logLevel = log.level && log.level !== 'all' ? log.level : deck ? getDeckStudyLevel(deck) : log.level;
      return level.id === 'all' || level.id === logLevel;
    });
  }, [logs, decks, language, level.id, hskEdition]);
  const plan = useMemo(() => getDailyStudyPlan(scopedWords, profile, settings.dailyNewWordLimit, now, words),
    [scopedWords, profile, settings.dailyNewWordLimit, now, words]);
  const intensive = useMemo(() => getIntensiveStudyPlan(scopedWords, now), [scopedWords, now]);
  const reminders = useMemo(
    () => generateSmartReminders(scopedWords, profile, scopedLogs, settings.retentionThreshold, now)
      .filter((reminder) => reminder.type !== 'streak_protection' || plan.words.length > 0),
    [scopedWords, profile, scopedLogs, settings.retentionThreshold, now, plan.words.length],
  );

  useEffect(() => {
    if (!hydrated || !settings.reminderEnabled || !plan.words.length ||
      typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const localTime = new Date(now).toTimeString().slice(0, 5);
    const date = localStudyDate(now);
    if (localTime < settings.reminderHour || lastReminderDate.current === date) return;
    lastReminderDate.current = date;
    try {
      if (localStorage.getItem(NOTIFICATION_DAY_KEY) === date) return;
      localStorage.setItem(NOTIFICATION_DAY_KEY, date);
    } catch {
      // The timestamp in memory still prevents repeated notices during this visit.
    }
    const options = { body: 'Kế hoạch ôn từ vựng hôm nay đã sẵn sàng.', tag: NOTIFICATION_DAY_KEY, icon: '/pwa-192x192.png' };
    void (async () => {
      try {
        const worker = await navigator.serviceWorker?.getRegistration();
        if (worker?.active) await worker.showNotification('Largo', options);
        else new Notification('Largo', options);
      } catch {
        // The reminders remain accessible from the toolbar.
      }
    })();
  }, [hydrated, now, settings.reminderHour, settings.reminderEnabled, plan.words.length]);

  const beginSession = (mode: StudySessionMode, deckId: string, pool: VocabWord[]) => {
    if (!hydrated || restoring.current || pool.length === 0) return;
    navigate('study');
    const id = globalThis.crypto?.randomUUID?.() ?? 'study-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    setActiveSession({
      id, mode, deckId, language, level: level.id, hskEdition: language === 'zh' ? hskEdition : undefined,
      startedAt: Date.now(), words: pool,
    });
  };

  const startDailySession = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    beginSession('guided', 'all', getDailyStudyPlan(scopedWords, profile, settings.dailyNewWordLimit, timestamp, words).words);
  };

  const startIntensiveSession = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    beginSession('intensive', 'all', getIntensiveStudyPlan(scopedWords, timestamp).words);
  };

  const resetScopeSelection = () => {
    setActiveSession(null);
    setSelectedDeckId('all');
    setShowReminderPopover(false);
  };

  const changeLanguage = (targetLanguage: LanguageCode) => {
    resetScopeSelection();
    setProfile((current) => ({ ...current, targetLanguage }));
  };

  const changeLevel = (nextLevel: string) => {
    resetScopeSelection();
    setSettings((current) => ({ ...current, studyLevels: { ...current.studyLevels, [language]: nextLevel } }));
  };

  const changeHskEdition = (edition: HskEdition) => {
    resetScopeSelection();
    setSettings((current) => ({ ...current, hskEdition: edition }));
  };

  const practiceWords = (deckId: string) => {
    const deck = scopedDecks.find(({ id }) => id === deckId);
    if (!deck?.wordIds) return scopedWords;
    const deckWords = getScopedWords(words, [deck], language);
    return language === 'en' ? deckWords.map((word) => getEnglishStudyWord(word, englishLocale)) : deckWords;
  };

  const changeEnglishLocale = (locale: EnglishLocale) => {
    setActiveSession(null);
    setShowReminderPopover(false);
    stopPronunciation();
    setSettings((current) => ({ ...current, englishLocale: locale }));
  };

  const handleBeginHubSession = (
    mode: StudyModeId,
    deckId: string,
    filterType: StudyFilter = 'all',
    bloomTarget: BloomLevel = 1,
  ) => {
    const timestamp = Date.now();
    setNow(timestamp);
    const pool = getPracticeWords(practiceWords(deckId), deckId, filterType, bloomTarget, mode, timestamp);
    beginSession(mode, deckId, pool.slice(0, PRACTICE_SESSION_SIZE));
  };

  const handleReviewMistake = (wordId: string, mode: StudyModeId) => {
    const word = scopedWords.find(({ id }) => id === wordId);
    if (!word) return;
    const supported = mode !== 'dictation' || typeof window.speechSynthesis !== 'undefined';
    const eligible = supported && getPracticeWords(scopedWords, 'all', 'all', 1, mode, Date.now())
      .some(({ id }) => id === wordId);
    beginSession(eligible ? mode : 'flashcard', word.deckId, [word]);
  };

  const handleReminder = (reminder: SmartReminder) => {
    setShowReminderPopover(false);
    if (reminder.type === 'streak_protection' || reminder.type === 'due_queue') {
      startDailySession();
      return;
    }
    const timestamp = Date.now();
    const matching = new Map(scopedWords.map((word) => [word.id, word]));
    const pool = reminder.wordIds.flatMap((id) => {
      const word = matching.get(id);
      return word ? [word] : [];
    });
    if (reminder.type === 'urgent_forgetting') {
      beginSession('guided', 'all', pool.filter((word) => isWordDue(word, timestamp)));
    } else {
      const eligible = new Set(getPracticeWords(scopedWords, 'all', 'all', 1, reminder.targetMode, timestamp).map((word) => word.id));
      beginSession(reminder.targetMode, 'all', pool.filter((word) => eligible.has(word.id)));
    }
  };

  const handleRecordReview = async (attempt: LearningAttemptEvent) => {
    if (!activeSession || restoring.current) throw new Error('Phiên học chưa sẵn sàng để lưu.');
    restoring.current = true;
    setWritingState(true);
    try {
      const { state, inserted, retained } = await commitLearningAttempt(
        attempt, { decks, words, logs, profile, settings, version: CURRENT_DATA_VERSION },
        (previous, event) => projectStudyAttempt(previous, event, activeSession),
      );
      recordedState.current = state;
      setDecks(state.decks);
      setWords(state.words);
      setLogs(state.logs);
      setProfile(state.profile);
      setSettings(state.settings);
      if (inserted && retained) setAttempts((events) => [...events, attempt]);
      setNow(attempt.answeredAt);
      setStorageError('');
      return { progress: state.logs.find(({ id }) => id === attempt.sessionId) ?? EMPTY_PROGRESS, retained };
    } finally {
      restoring.current = false;
      setWritingState(false);
    }
  };

  const restartPractice = () => {
    if (!activeSession || activeSession.mode === 'guided' || activeSession.mode === 'intensive') return;
    const ids = new Set(activeSession.words.map((word) => word.id));
    const eligible = getPracticeWords(practiceWords(activeSession.deckId), activeSession.deckId, 'all', 1, activeSession.mode, Date.now());
    beginSession(activeSession.mode, activeSession.deckId, eligible.filter((word) => ids.has(word.id)));
  };

  const handleSaveGameResult = useCallback((
    game: 'match' | 'wordfall' | 'scramble' | 'audioblitz',
    score: number,
    xpEarned: number,
  ) => {
    const timestamp = Date.now();
    setNow(timestamp);
    setProfile((prev) => {
      return {
        ...recordStudyActivity(prev, timestamp, xpEarned),
        bestMatchScore: game === 'match' ? Math.max(prev.bestMatchScore, score) : prev.bestMatchScore,
        bestWordFallScore:
          game === 'wordfall' ? Math.max(prev.bestWordFallScore, score) : prev.bestWordFallScore,
        bestScrambleScore:
          game === 'scramble' ? Math.max(prev.bestScrambleScore, score) : prev.bestScrambleScore,
        bestAudioBlitzScore:
          game === 'audioblitz' ? Math.max(prev.bestAudioBlitzScore, score) : prev.bestAudioBlitzScore,
      };
    });
    const modeMap = {
      match: 'game_match',
      wordfall: 'game_wordfall',
      scramble: 'game_scramble',
      audioblitz: 'game_audioblitz',
    } as const;
    setLogs((prev) => [
      ...prev,
      {
        id: `log-game-${Date.now()}`,
        timestamp,
        mode: modeMap[game],
        deckId: 'all',
        language,
        level: level.id,
        hskEdition: language === 'zh' ? hskEdition : undefined,
        wordsReviewed: 0,
        correctCount: 0,
        xpEarned,
        durationSeconds: 0,
      },
    ]);
  }, [language, level.id, hskEdition]);

  const handleCreateDeck = (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => {
    const id = `deck-custom-${Date.now()}`;
    const created = { ...deck, id, isCustom: true, createdAt: Date.now() };
    setDecks((prev) => [created, ...prev]);
    const createdLevel = getDeckStudyLevel(created);
    if (deck.language !== language) changeLanguage(deck.language);
    if (deck.language !== language || (level.id !== 'all' && createdLevel !== level.id)) {
      setSettings((current) => ({ ...current, studyLevels: { ...current.studyLevels, [deck.language]: createdLevel } }));
    }
    return id;
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setWords((prev) => prev.filter((w) => w.deckId !== deckId));
    setSelectedDeckId((id) => id === deckId ? 'all' : id);
  };

  const handleAddWord = (word: Omit<VocabWord, 'id' | 'createdAt' | 'srs'>) => {
    const now = Date.now();
    const newWord: VocabWord = {
      ...word,
      id: `w-custom-${now}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      srs: createInitialSRS(now),
    };
    setWords((prev) => [newWord, ...prev]);
  };

  const handleDeleteWord = (wordId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const handleUpdateWordRelations = (wordId: string, relations: LexicalRelations) => {
    setWords((prev) => prev.map((word) => {
      if (word.id !== wordId) return word;
      return isBuiltinWord(wordId) ? { ...word, personalRelations: relations } : { ...word, ...relations };
    }));
  };

  const handleImportWordsJson = (
    deckId: string,
    items: DeckWordImport[],
  ) => {
    const targetDeck = decks.find((d) => d.id === deckId);
    if (!targetDeck) return 0;
    const lang = targetDeck.language;
    const now = Date.now();
    const trimText = trimImportText;
    const valid = items
      .filter((i) => i && typeof i.term === 'string' && i.term.trim() && typeof i.meaning === 'string' && i.meaning.trim())
      .map((item, idx) => ({
        id: `w-imp-${now}-${idx}`,
        deckId,
        language: lang,
        term: item.term.trim(),
        phonetic: trimText(item.phonetic),
        partOfSpeech: trimText(item.partOfSpeech) || 'Từ / cụm từ',
        meaning: item.meaning.trim(),
        notes: trimText(item.notes) || undefined,
        ...(lang === 'zh' && {
          sinoVietnamese: trimText(item.sinoVietnamese) || undefined,
          radical: trimText(item.radical) || undefined,
        }),
        collocations: importCollocations(item.collocations) ?? (trimText(item.collocation)
          ? [{ phrase: trimText(item.collocation), meaning: trimText(item.collocationMeaning) }]
          : []),
        examples: importExamples(item.examples) ?? (trimText(item.example)
          ? [{ sentence: trimText(item.example), phonetic: trimText(item.examplePhonetic) || undefined, translation: trimText(item.translation) }]
          : []),
        ...(lang === 'en' && { englishForms: importEnglishForms(item.englishForms) }),
        synonyms: importTerms(item.synonyms),
        antonyms: importTerms(item.antonyms),
        bloomLevel: 1 as BloomLevel,
        srs: createInitialSRS(now),
        createdAt: now,
      }));
    if (valid.length > 0) {
      setWords((prev) => [...valid, ...prev]);
    }
    return valid.length;
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaTerm.trim() || !qaMeaning.trim()) {
      setQaError('Vui lòng nhập đầy đủ từ vựng và nghĩa tiếng Việt.');
      return;
    }
    const targetDeck = scopedDecks.find((d) => d.id === qaDeckId) || scopedDecks[0];
    if (!targetDeck) {
      setQaError('Hãy tạo một bộ từ trước khi thêm từ mới.');
      return;
    }
    const cleanTerm = qaTerm.trim();
    handleAddWord({
      deckId: targetDeck.id,
      language: targetDeck.language,
      term: cleanTerm,
      phonetic: qaPhonetic.trim(),
      partOfSpeech: 'Từ / cụm từ',
      meaning: qaMeaning.trim(),
      collocations: qaCollocation.trim()
        ? [{ phrase: qaCollocation.trim(), meaning: qaCollocationMeaning.trim() }]
        : [],
      examples: importExamples(qaExamples) ?? [],
      synonyms: importTerms(qaRelations.synonyms),
      antonyms: importTerms(qaRelations.antonyms),
      bloomLevel: 1,
    });
    setQaTerm('');
    setQaPhonetic('');
    setQaMeaning('');
    setQaCollocation('');
    setQaCollocationMeaning('');
    setQaExamples(EMPTY_EXAMPLES);
    setQaRelations(EMPTY_RELATIONS);
    setQaError(null);
    setShowQuickAdd(false);
  };

  const handleUpdateProfileImage = (kind: ProfileImageKind, file?: File) => {
    const update = imageWrites.current.then(async () => {
      const image = file ? await prepareProfileImage(file, kind) : undefined;
      try {
        await saveProfileImage(kind, image);
      } catch {
        throw new Error('Largo chưa lưu được ảnh trên thiết bị này.');
      }
      setProfileImages((current) => ({ ...current, [kind]: image }));
    });
    imageWrites.current = update.catch(() => {});
    return update;
  };

  const handleExportFullBackup = async () => {
    await imageWrites.current;
    const stored = await loadStoredStudyData();
    if (stored?.hasFutureAttempts) throw new Error('Bản lưu chứa lượt trả lời của phiên bản mới hơn.');
    const images = stored?.images ?? profileImages;
    const [avatar, cover] = await Promise.all([readImageForBackup(images.avatar), readImageForBackup(images.cover)]);
    const state = stored?.state ?? { decks, words, logs, profile, settings, version: CURRENT_DATA_VERSION };
    const payload = createBackup(state, { avatar, cover }, new Date(), stored?.attempts);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'largo-backup-' + localStudyDate() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFullBackup = async ({ state, images, attempts }: BackupPreview) => {
    if (!hydrated || futureState || restoring.current) throw new Error('Dữ liệu chưa sẵn sàng để khôi phục.');
    restoring.current = true;
    setWritingState(true);
    try {
      await imageWrites.current;
      await restoreOfflineState(state, images, attempts);
      recordedState.current = state;
      setActiveSession(null);
      setSelectedDeckId('all');
      setDecks(state.decks);
      setWords(state.words);
      setLogs(state.logs);
      setProfile(state.profile);
      setSettings(state.settings);
      setProfileImages(images);
      setAttempts(attempts);
      setStorageError('');
    } finally {
      restoring.current = false;
      setWritingState(false);
    }
  };

  const handleResetAllData = async () => {
    if (!hydrated || futureState || restoring.current) throw new Error('Dữ liệu chưa sẵn sàng.');
    restoring.current = true;
    setWritingState(true);
    const fresh = { decks: INITIAL_DECKS, words: INITIAL_WORDS, logs: INITIAL_LOGS,
      profile: INITIAL_PROFILE, settings: INITIAL_SETTINGS, version: CURRENT_DATA_VERSION };
    try {
      await imageWrites.current;
      await resetOfflineState(fresh);
      await clearSpeechClipCache().catch(() => {});
      recordedState.current = fresh;
      setDecks(fresh.decks);
      setWords(fresh.words);
      setLogs(fresh.logs);
      setProfile(fresh.profile);
      setProfileImages({});
      setAttempts([]);
      setSettings(fresh.settings);
      setSelectedDeckId('all');
      setActiveSession(null);
      setStorageError('');
    } finally {
      restoring.current = false;
      setWritingState(false);
    }
  };

  const isZenStudyActive = route === 'study' && !!activeSession && settings.zenFocusMode;
  const activeViewKey = route === 'study' ? activeSession?.id ?? 'study-hub' : route;
  const activeDeckId = scopedDecks.some((deck) => deck.id === selectedDeckId) ? selectedDeckId : 'all';
  const editionKey = language === 'zh' ? `${language}-${hskEdition}` : language;
  const scopeKey = language === 'en' ? `${editionKey}-${level.id}-${englishLocale}` : `${editionKey}-${level.id}`;

  useEffect(() => {
    window.scrollTo(0, 0);
    return stopPronunciation;
  }, [activeViewKey, scopeKey]);

  const openQuickAdd = () => {
    if (!scopedDecks.length) {
      navigate('decks');
      return;
    }
    if (!scopedDecks.some((deck) => deck.id === qaDeckId)) setQaDeckId(scopedDecks[0].id);
    setQaError(null);
    setShowQuickAdd(true);
  };

  if (futureState) {
    return <main className="p-6" role="status">Dữ liệu học thuộc phiên bản Largo mới hơn. Hãy mở lại phiên bản đã lưu dữ liệu.</main>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" data-route={route} data-zen={isZenStudyActive} data-density={settings.uiDensity}>
        {!isZenStudyActive && (
          <Sidebar
            activeRoute={route}
            onNavigate={(next) => { if (!restoring.current) navigate(next); }}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            dueCount={plan.dueCount}
            profile={profile}
            avatarUrl={avatarUrl}
            isOnline={isOnline}
          />
        )}

        <div className="app-column" inert={mobileMenuOpen}>
          {!isZenStudyActive && (
            <header className="app-header" inert={writingState}>
              <div className="header-inner">
                <div className="header-location">
                  <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu điều hướng"
                    aria-expanded={mobileMenuOpen} className="icon-button mobile-menu-trigger">
                    <Menu size={20} aria-hidden="true" />
                  </button>
                  <span className="header-current">{NAV_LABELS[route]}</span>
                </div>
                <div className="study-scope" role="group" aria-label="Phạm vi học">
                  {languages.length === 2 ? (
                    <div className="scope-language-switch" role="group" aria-label="Ngôn ngữ đang học">
                      {languages.map((code) => (
                        <button key={code} type="button" aria-pressed={language === code}
                          onClick={() => { if (language !== code) changeLanguage(code); }}>
                          {LANGUAGE_LABELS[code].name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <label className="scope-field">
                      <Languages size={16} aria-hidden="true" />
                      <select aria-label="Ngôn ngữ đang học" value={language} onChange={(event) => changeLanguage(event.target.value as LanguageCode)}>
                        {languages.map((code) => <option key={code} value={code}>{LANGUAGE_LABELS[code].name}</option>)}
                      </select>
                      <ChevronDown size={14} aria-hidden="true" />
                    </label>
                  )}
                  {language === 'zh' && (
                    <label className="scope-field">
                      <select aria-label="Phiên bản HSK" value={hskEdition} onChange={(event) => changeHskEdition(event.target.value as HskEdition)}>
                        {HSK_EDITIONS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                      </select>
                      <ChevronDown size={14} aria-hidden="true" />
                    </label>
                  )}
                  {language === 'en' && (
                    <label className="scope-field">
                      <select aria-label="Biến thể tiếng Anh" value={englishLocale} onChange={(event) => changeEnglishLocale(event.target.value as EnglishLocale)}>
                        {ENGLISH_LOCALES.map((locale) => <option key={locale} value={locale}>{ENGLISH_LOCALE_LABEL[locale]}</option>)}
                      </select>
                      <ChevronDown size={14} aria-hidden="true" />
                    </label>
                  )}
                  {route !== 'decks' && <label className="scope-field">
                    <select aria-label="Cấp độ đang học" value={level.id} onChange={(event) => changeLevel(event.target.value)}>
                      {levels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                  </label>}
                </div>
                <div className="header-actions">
                  <WordLookup key={scopeKey} words={libraryWords} englishLocale={englishLocale} speechRate={settings.speechRate} />
                  <button type="button" className="icon-button" title={isDarkActive ? 'Giao diện sáng' : 'Giao diện tối'}
                    aria-label={isDarkActive ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                    onClick={() => setSettings((value) => ({ ...value, colorScheme: isDarkActive ? 'light' : 'dark' }))}>
                    {isDarkActive ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                  </button>
                  <div className="reminder-wrap" ref={reminderContainer}>
                    <button type="button" ref={reminderButton} className="icon-button reminder-trigger"
                      onClick={() => setShowReminderPopover((value) => !value)}
                      aria-label={'Nhắc nhở (' + reminders.length + ')'} aria-expanded={showReminderPopover} title="Nhắc nhở">
                      <Bell size={18} aria-hidden="true" />
                      {reminders.length > 0 && <span className="notification-dot" aria-hidden="true" />}
                    </button>
                    <AnimatePresence>
                      {showReminderPopover && (
                        <motion.div className="header-popover glass-panel reminder-panel" role="dialog" aria-label="Nhắc nhở"
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
                          <div className="popover-heading">
                            <h2>Nhắc nhở</h2>
                            <button type="button" className="icon-button" aria-label="Đóng nhắc nhở" onClick={() => {
                              setShowReminderPopover(false);
                              reminderButton.current?.focus();
                            }}><X size={17} aria-hidden="true" /></button>
                          </div>
                          {reminders.length ? (
                            <ul className="reminder-list">
                              {reminders.map((reminder) => (
                                <li key={reminder.id}>
                                  <strong>{reminder.title}</strong>
                                  <p>{reminder.description}</p>
                                  <button type="button" className="text-button" onClick={() => handleReminder(reminder)}>{reminder.actionLabel}</button>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="panel-empty">Bạn đã bắt kịp lịch học.</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {route !== 'decks' && <button type="button" className="button-primary header-add" onClick={openQuickAdd}
                    aria-label={scopedDecks.length ? 'Thêm từ' : 'Tạo bộ từ'}>
                    <Plus size={17} aria-hidden="true" /><span>{scopedDecks.length ? 'Thêm từ' : 'Tạo bộ từ'}</span>
                  </button>}
                </div>
              </div>
            </header>
          )}

          <main className="app-content" data-route={route} aria-busy={!hydrated}>
            {storageError && <p className="form-error" role="alert">{storageError}</p>}
            <Suspense fallback={<p className="panel-empty" role="status">Đang tải…</p>}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeViewKey}
                  className="app-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  {route === 'dashboard' && (
                    <DashboardView profile={profile} decks={scopedDecks} words={scopedWords} level={level.id === 'all' ? undefined : level.label}
                      speechRate={settings.speechRate} plan={plan} now={now} onStartDaily={startDailySession} onNavigate={navigate}
                      onOpenPhrases={() => { setSelectedMode('collocation'); setSelectedDeckId('all'); navigate('study'); }} />
                  )}

                  {route === 'study' && (activeSession ? (
                    <StudySession
                      mode={activeSession.mode}
                      session={activeSession}
                      sessionWords={activeSession.words}
                      allWords={scopedWords}
                      masteryByWord={masteryByWord}
                      settings={settings}
                      zenMode={settings.zenFocusMode}
                      onToggleZenMode={() => setSettings((value) => ({ ...value, zenFocusMode: !value.zenFocusMode }))}
                      onToggleExamplePhonetic={() => setSettings((value) => ({ ...value, showExamplePhonetic: !(value.showExamplePhonetic ?? true) }))}
                      onRecordReview={handleRecordReview}
                      onExit={() => setActiveSession(null)}
                      onContinue={activeSession.mode === 'guided' ? (plan.words.length ? startDailySession : undefined)
                        : activeSession.mode === 'intensive' ? (intensive.words.length ? startIntensiveSession : undefined)
                        : restartPractice}
                    />
                  ) : (
                    <StudyHubView
                      key={scopeKey}
                      decks={scopedDecks}
                      words={scopedWords}
                      selectedMode={selectedMode}
                      selectedDeckId={activeDeckId}
                      now={now}
                      dailyCount={plan.words.length}
                      intensive={intensive}
                      onSelectMode={setSelectedMode}
                      onSelectDeck={setSelectedDeckId}
                      onStartDaily={startDailySession}
                      onStartIntensive={startIntensiveSession}
                      onBeginSession={handleBeginHubSession}
                    />
                  ))}

                  {route === 'games' && (
                    <GamesView key={scopeKey} words={scopedWords} profile={profile} speechRate={settings.speechRate} onSaveGameResult={handleSaveGameResult} />
                  )}

                  {route === 'decks' && (
                    <DecksView
                      key={editionKey}
                      decks={editionDecks}
                      words={words}
                      masteryByWord={masteryByWord}
                      language={language}
                      englishLocale={englishLocale}
                      hskEdition={hskEdition}
                      levels={levels}
                      activeLevel={level.id}
                      onChangeLevel={changeLevel}
                      speechRate={settings.speechRate}
                      showExamplePhonetic={settings.showExamplePhonetic ?? true}
                      onToggleExamplePhonetic={() => setSettings((value) => ({ ...value, showExamplePhonetic: !(value.showExamplePhonetic ?? true) }))}
                      onCreateDeck={handleCreateDeck}
                      onDeleteDeck={handleDeleteDeck}
                      onAddWord={handleAddWord}
                      onDeleteWord={handleDeleteWord}
                      onUpdateWordRelations={handleUpdateWordRelations}
                      onStartDeckStudy={(deckId, mode) => {
                        setSelectedMode(mode);
                        setSelectedDeckId(deckId);
                        handleBeginHubSession(mode, deckId);
                      }}
                      onImportWordsJson={handleImportWordsJson}
                    />
                  )}

                  {route === 'analytics' && (
                    <AnalyticsView subRoute={analyticsSub} onChangeSubRoute={(sub) => navigate('analytics', sub)}
                      words={scopedWords} logs={scopedLogs} now={now} masteryByWord={masteryByWord} onReviewMistake={handleReviewMistake} />
                  )}

                  {route === 'profile' && (
                    <ProfileView profile={profile} words={profileWords} logs={logs}
                      avatarUrl={avatarUrl} coverUrl={coverUrl} imagesReady={hydrated}
                      onUpdateImage={handleUpdateProfileImage}
                      onOpenAchievements={() => navigate('achievements')}
                      onUpdateProfile={(patch) => {
                        if (patch.targetLanguage && patch.targetLanguage !== language) resetScopeSelection();
                        setProfile((value) => ({ ...value, ...patch }));
                      }} />
                  )}

                  {route === 'achievements' && <AchievementsView profile={profile} words={words} />}

                  {route === 'settings' && (
                    <SettingsView settings={settings} isOnline={isOnline} activeLanguage={language}
                      onUpdateSettings={(patch) => setSettings((value) => ({ ...value, ...patch }))}
                      backupReady={hydrated} onExportFullBackup={handleExportFullBackup}
                      onRestoreFullBackup={handleRestoreFullBackup} onResetAllData={handleResetAllData} />
                  )}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
        </div>

        <dialog ref={quickAddDialog} className="quick-add-dialog" aria-modal="true" aria-labelledby="quick-add-title"
          onClose={() => setShowQuickAdd(false)}
          onClick={(event) => { if (event.target === event.currentTarget) setShowQuickAdd(false); }}>
          <div className="quick-add-card glass-panel">
            <div className="popover-heading">
              <h2 id="quick-add-title">Thêm từ vựng</h2>
              <button type="button" className="icon-button" onClick={() => setShowQuickAdd(false)} aria-label="Đóng">
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <form className="quick-add-form" onSubmit={handleQuickAddSubmit}>
              <div className="control-field">
                <label htmlFor="qa-deck">Bộ từ vựng</label>
                <select id="qa-deck" value={qaDeckId} onChange={(event) => setQaDeckId(event.target.value)}>
                  {scopedDecks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                </select>
              </div>
              <div className="quick-add-row">
                <div className="control-field">
                  <label htmlFor="qa-term">Từ vựng</label>
                  <input id="qa-term" required value={qaTerm} onChange={(event) => setQaTerm(event.target.value)} />
                </div>
                <div className="control-field">
                  <label htmlFor="qa-ipa">Phiên âm</label>
                  <input id="qa-ipa" value={qaPhonetic} onChange={(event) => setQaPhonetic(event.target.value)} />
                </div>
              </div>
              <div className="control-field">
                <label htmlFor="qa-meaning">Nghĩa tiếng Việt</label>
                <input id="qa-meaning" required value={qaMeaning} onChange={(event) => setQaMeaning(event.target.value)} />
              </div>
              <div className="control-field">
                <label htmlFor="qa-col">Cụm từ đi kèm</label>
                <input id="qa-col" value={qaCollocation} onChange={(event) => setQaCollocation(event.target.value)} />
              </div>
              {qaCollocation.trim() && (
                <div className="control-field">
                  <label htmlFor="qa-col-meaning">Nghĩa của cụm từ</label>
                  <input id="qa-col-meaning" required value={qaCollocationMeaning} onChange={(event) => setQaCollocationMeaning(event.target.value)} />
                </div>
              )}
              <ExampleFields values={qaExamples} onChange={setQaExamples} language={language} />
              <RelationFields value={qaRelations} onChange={setQaRelations} />
              {qaError && <p className="form-error" role="alert">{qaError}</p>}
              <div className="session-actions">
                <button type="button" className="button-secondary" onClick={() => setShowQuickAdd(false)}>Hủy</button>
                <button type="submit" className="button-primary">Lưu từ</button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </MotionConfig>
  );
}
