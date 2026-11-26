import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Bell, ChevronDown, ExternalLink, Loader2, Menu, Moon, Plus, Sparkles, Sun, X } from 'lucide-react';
import type {
  AnalyticsSubRoute,
  AppRoute,
  AppSettings,
  BloomLevel,
  CollocationItem,
  DeckWordImport,
  EnglishAdditionalSense,
  ExampleSentence,
  LanguageCode,
  LexicalRelations,
  StudyModeId,
  StudySessionMode,
  StudySessionLog,
  SmartReminder,
  UserProfile,
  VocabDeck,
  VocabWord,
  WordFamilyItem,
} from './types/vocab';
import {
  INITIAL_DECKS,
  INITIAL_LOGS,
  INITIAL_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_WORDS,
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
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLevels } from './utils/studyScope';
import { DEFAULT_ENGLISH_LOCALE, getEnglishStudyWord } from './utils/englishStudy';
import { importCollocations, importEnglishForms, importExamples, importTerms, importWordFamily, trimImportText } from './utils/vocabImport';
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
import { hasOfflinePronunciation, setPronunciationVoices, soundEngine, stopPronunciation } from './utils/soundEngine';
import { clearSpeechClipCache } from './utils/speechClipCache';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { NAV_LABELS, Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudyHubView } from './components/StudyHubView';
import { StudySession } from './components/StudySession';
import type { LearningAttemptEvent } from './utils/learningAttempt';
import { EMPTY_PROGRESS, projectStudyAttempt, type StudySessionIdentity } from './utils/studyAttempt';
import { buildMasteryProjection } from './utils/mastery';
import { planAdaptiveSession, type AdaptiveStudyPlan } from './utils/adaptivePlanner';
import { compareAdaptivePlans } from './utils/plannerMetrics';
import { WordLookup } from './components/WordLookup';
import { DictionaryInspectDialog } from './components/DictionaryInspectDialog';
import { EMPTY_EXAMPLES, EMPTY_RELATIONS, ExampleFields, RelationFields } from './components/WordFormFields';
import { addChainDeckEntry, wordChainDeckId, type ChainEntry, type ChainLanguage } from './utils/wordChain';
import { normalizeChainTerm } from './utils/wordChainRules.mjs';
import {
  buildWordDraftFromDictionary,
  createLookupDeck,
  fetchDictionaryEntry,
  LOOKUP_DECK_ID,
  LOOKUP_DECK_NAME,
  safeExternalUrl,
  STANDARD_POS_OPTIONS,
  type DictionaryExternalLinks,
  type DictionaryWordDraft,
} from './utils/dictionaryClient';

const GamesView = lazy(() => import('./components/GamesView').then(({ GamesView }) => ({ default: GamesView })));
const DecksView = lazy(() => import('./components/DecksView').then(({ DecksView }) => ({ default: DecksView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(({ AnalyticsView }) => ({ default: AnalyticsView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(({ ProfileView }) => ({ default: ProfileView })));
const AchievementsView = lazy(() => import('./components/AchievementsView').then(({ AchievementsView }) => ({ default: AchievementsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(({ SettingsView }) => ({ default: SettingsView })));

const NOTIFICATION_DAY_KEY = 'lexisbloom_reminder_date';

interface ActiveSession extends StudySessionIdentity {
  words: VocabWord[];
  adaptivePlan?: Pick<AdaptiveStudyPlan, 'plannerVersion' | 'items'>;
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
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
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
  const [qaUkPhonetic, setQaUkPhonetic] = useState('');
  const [qaPartOfSpeech, setQaPartOfSpeech] = useState<string>('Danh từ');
  const [qaMeaning, setQaMeaning] = useState('');
  const [qaNotes, setQaNotes] = useState('');
  const [qaCollocation, setQaCollocation] = useState('');
  const [qaCollocationMeaning, setQaCollocationMeaning] = useState('');
  const [qaExtraCollocations, setQaExtraCollocations] = useState<CollocationItem[]>([]);
  const [qaExamples, setQaExamples] = useState<readonly ExampleSentence[]>(EMPTY_EXAMPLES);
  const [qaRelations, setQaRelations] = useState(EMPTY_RELATIONS);
  const [qaAdditionalSenses, setQaAdditionalSenses] = useState<EnglishAdditionalSense[]>([]);
  const [qaIncludeExtraSenses, setQaIncludeExtraSenses] = useState(true);
  const [qaWordFamily, setQaWordFamily] = useState<WordFamilyItem[]>([]);
  const [qaIncludeWordFamily, setQaIncludeWordFamily] = useState(true);
  const [qaLookupLinks, setQaLookupLinks] = useState<DictionaryExternalLinks | null>(null);
  const [qaLookupBusy, setQaLookupBusy] = useState(false);
  const [qaLookupStatus, setQaLookupStatus] = useState('');
  const [qaDeckId, setQaDeckId] = useState('');
  const [qaError, setQaError] = useState<string | null>(null);
  const [inspectTerm, setInspectTerm] = useState<string | null>(null);
  const [showReminderPopover, setShowReminderPopover] = useState(false);
  const reminderContainer = useRef<HTMLDivElement>(null);
  const reminderButton = useRef<HTMLButtonElement>(null);
  const quickAddDialog = useRef<HTMLDialogElement>(null);
  const lastReminderDate = useRef('');

  const isOnline = useOnlineStatus();

  useEffect(() => {
    const engine = window.speechSynthesis;
    if (!engine) return;
    const updateVoices = () => setBrowserVoices(engine.getVoices());
    engine.addEventListener('voiceschanged', updateVoices);
    updateVoices();
    return () => engine.removeEventListener('voiceschanged', updateVoices);
  }, []);

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
      .catch((error: unknown) => {
        setFutureState(true);
        setStorageError(error instanceof Error ? error.message : 'Không thể đọc bản lưu.');
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
    setPronunciationVoices(settings.speechVoices);
  }, [settings.speechVoices]);

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

  const language: LanguageCode = 'en';
  const audioLanguages = useMemo(() => hasOfflinePronunciation(browserVoices, 'en')
    ? new Set<LanguageCode>(['en']) : new Set<LanguageCode>(), [browserVoices]);
  const levels = useMemo(() => getStudyLevels('en', decks), [decks]);
  const level = levels.find((entry) => entry.id === settings.studyLevels?.en) ?? levels[0];
  const scopedDecks = useMemo(() => getScopedDecks(decks, 'en', level.id), [decks, level.id]);
  const libraryWords = useMemo(() => getScopedWords(words, scopedDecks, 'en'), [words, scopedDecks]);
  const scopedWords = useMemo(() => libraryWords.map((word) => getEnglishStudyWord(word, DEFAULT_ENGLISH_LOCALE)), [libraryWords]);
  const arenaData = useMemo(() => {
    if (route !== 'games') return undefined;
    const deckId = wordChainDeckId('en');
    const savedIds = new Set(decks.find((deck) => deck.id === deckId)?.wordIds);
    return {
      language: 'en' as const,
      words: getScopedWords(words, decks, 'en'),
      savedTerms: new Set(words.filter((word) => word.deckId === deckId || savedIds.has(word.id))
        .map((word) => normalizeChainTerm(word.term, 'en'))),
    };
  }, [route, decks, words]);
  const profileWords = useMemo(() => {
    const deckIds = new Set(decks.map(({ id }) => id));
    const lessonWordIds = new Set(decks.flatMap(({ wordIds }) => wordIds ?? []));
    return words.filter((word) => word.language === 'en' && (word.srs.lastReviewedAt !== null || deckIds.has(word.deckId) || lessonWordIds.has(word.id)));
  }, [decks, words]);
  const scopedLogs = useMemo(() => {
    const decksById = new Map(decks.map((deck) => [deck.id, deck]));
    return logs.filter((log) => {
      const deck = decksById.get(log.deckId);
      const logLanguage = log.language ?? deck?.language ?? 'en';
      if (logLanguage !== 'en') return false;
      const logLevel = log.level && log.level !== 'all' ? log.level : deck ? getDeckStudyLevel(deck) : log.level;
      return level.id === 'all' || level.id === logLevel;
    });
  }, [logs, decks, level.id]);
  const legacyPlan = useMemo(() => getDailyStudyPlan(scopedWords, profile, settings.dailyNewWordLimit, now, words),
    [scopedWords, profile, settings.dailyNewWordLimit, now, words]);
  const adaptivePlanAt = useCallback((timestamp: number) => planAdaptiveSession({
    words: scopedWords, quotaWords: words, profile, newWordLimit: settings.dailyNewWordLimit, now: timestamp,
    masteryById: masteryByWord, recentEvents: attempts, audioLanguages,
  }), [scopedWords, words, profile, settings.dailyNewWordLimit, masteryByWord, attempts, audioLanguages]);
  const showPlannerComparison = route === 'settings';
  const plannerPreview = useMemo(() => {
    if (!hydrated || (!showPlannerComparison && !settings.adaptivePlanner)) return;
    const start = performance.now();
    const candidate = adaptivePlanAt(now);
    return { candidate, durationMs: performance.now() - start };
  }, [hydrated, showPlannerComparison, settings.adaptivePlanner, adaptivePlanAt, now]);
  const personalized = settings.adaptivePlanner && plannerPreview?.candidate.strategy === 'adaptive'
    ? plannerPreview.candidate : undefined;
  const plan = personalized ?? legacyPlan;
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

  const beginSession = (
    mode: StudySessionMode, deckId: string, pool: VocabWord[], adaptivePlan?: ActiveSession['adaptivePlan'],
  ) => {
    if (!hydrated || restoring.current || pool.length === 0) return;
    navigate('study');
    const id = globalThis.crypto?.randomUUID?.() ?? 'study-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    setActiveSession({
      id, mode, deckId, language, level: level.id,
      startedAt: Date.now(), words: pool, adaptivePlan,
    });
  };

  const startDailySession = () => {
    const timestamp = Date.now();
    setNow(timestamp);
    if (settings.adaptivePlanner) {
      const candidate = adaptivePlanAt(timestamp);
      if (candidate.strategy === 'adaptive') {
        beginSession('guided', 'all', candidate.words, { plannerVersion: candidate.plannerVersion, items: candidate.items });
        return;
      }
      beginSession('guided', 'all', candidate.words);
      return;
    }
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

  const changeLevel = (nextLevel: string) => {
    resetScopeSelection();
    setSettings((current) => ({ ...current, studyLevels: { ...current.studyLevels, en: nextLevel } }));
  };

  const practiceWords = (deckId: string) => {
    const deck = scopedDecks.find(({ id }) => id === deckId);
    if (!deck) return scopedWords;
    return getScopedWords(words, [deck], 'en').map((word) => getEnglishStudyWord(word, DEFAULT_ENGLISH_LOCALE));
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
        wordsReviewed: 0,
        correctCount: 0,
        xpEarned,
        durationSeconds: 0,
      },
    ]);
  }, [language, level.id]);

  const handleCreateDeck = (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => {
    const id = `deck-custom-${Date.now()}`;
    const created = { ...deck, id, isCustom: true, createdAt: Date.now() };
    setDecks((prev) => [created, ...prev]);
    const createdLevel = getDeckStudyLevel(created);
    if (level.id !== 'all' && createdLevel !== level.id) {
      setSettings((current) => ({ ...current, studyLevels: { ...current.studyLevels, en: createdLevel } }));
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

  const handleSaveChainWord = (entry: ChainEntry, chainLanguage: ChainLanguage) => {
    const timestamp = Date.now();
    setDecks((previous) => addChainDeckEntry(previous, chainLanguage, entry.wordId, timestamp));
    if (entry.wordId) return;

    const deckId = wordChainDeckId(chainLanguage);
    const key = normalizeChainTerm(entry.term, chainLanguage);
    const word: VocabWord = {
      id: `w-custom-${timestamp}-${Math.random().toString(36).slice(2, 6)}`, deckId, language: chainLanguage,
      term: entry.term, meaning: entry.meaning, phonetic: '', partOfSpeech: 'Từ / cụm từ',
      notes: entry.generated ? 'Từ và nghĩa do DeepSeek gợi ý trong Đấu trường nối từ.' : undefined,
      examples: [], collocations: [], synonyms: [], antonyms: [],
      bloomLevel: 1, srs: createInitialSRS(timestamp), createdAt: timestamp,
    };
    setWords((previous) => previous.some((saved) => saved.deckId === deckId &&
      normalizeChainTerm(saved.term, chainLanguage) === key) ? previous : [word, ...previous]);
  };

  const handleDeleteWord = (wordId: string, deckId?: string) => {
    const deck = decks.find((candidate) => candidate.id === deckId);
    if (deck?.wordIds?.includes(wordId) &&
        words.some((word) => word.id === wordId && word.deckId !== deckId)) {
      setDecks((previous) => previous.map((candidate) => candidate.id === deckId
        ? { ...candidate, wordIds: candidate.wordIds?.filter((id) => id !== wordId) } : candidate));
      return;
    }
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
        collocations: importCollocations(item.collocations) ?? (trimText(item.collocation)
          ? [{ phrase: trimText(item.collocation), meaning: trimText(item.collocationMeaning) }]
          : []),
        examples: importExamples(item.examples) ?? (trimText(item.example)
          ? [{ sentence: trimText(item.example), phonetic: trimText(item.examplePhonetic) || undefined, translation: trimText(item.translation) }]
          : []),
        englishForms: importEnglishForms(item.englishForms),
        wordFamily: importWordFamily(item.wordFamily),
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

  const quickAddDecks = useMemo(() => {
    const customDecks = decks.filter((d) => d.language === 'en' && d.isCustom);
    const seen = new Set(customDecks.map((d) => d.id));
    const merged = [...customDecks];
    for (const d of scopedDecks) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        merged.push(d);
      }
    }
    return merged;
  }, [decks, scopedDecks]);

  const applyDictionaryDraft = (draft: DictionaryWordDraft) => {
    setQaTerm(draft.term);
    setQaPhonetic(draft.phonetic);
    setQaUkPhonetic(draft.ukPhonetic);
    setQaPartOfSpeech(draft.partOfSpeech || 'Từ / cụm từ');
    setQaMeaning(draft.meaning);
    setQaNotes(draft.notes);
    setQaCollocation(draft.collocation);
    setQaCollocationMeaning(draft.collocationMeaning);
    setQaExtraCollocations(draft.extraCollocations);
    setQaExamples(draft.examples);
    setQaRelations({ synonyms: draft.synonyms, antonyms: draft.antonyms });
    setQaAdditionalSenses(draft.additionalSenses ?? []);
    setQaIncludeExtraSenses(true);
    setQaWordFamily(draft.wordFamily ?? []);
    setQaIncludeWordFamily(true);
    setQaLookupLinks(draft.links);
    setQaLookupStatus(`Đã điền tự động cho “${draft.term}”`);
    setQaError(null);
  };

  const openQuickAddWithDraft = (draft: DictionaryWordDraft) => {
    const hasLookupDeck = decks.some((d) => d.id === LOOKUP_DECK_ID);
    const firstCustom = decks.find((d) => d.language === 'en' && d.isCustom);
    setQaDeckId(hasLookupDeck ? LOOKUP_DECK_ID : firstCustom?.id ?? LOOKUP_DECK_ID);
    applyDictionaryDraft(draft);
    setShowQuickAdd(true);
  };

  const handleQuickAddAutofill = async () => {
    const clean = qaTerm.trim();
    if (!clean) {
      setQaError('Hãy nhập từ tiếng Anh trước khi tra tự động.');
      return;
    }
    if (!isOnline) {
      setQaError('Đang ngoại tuyến — không thể tra từ điển trực tuyến.');
      return;
    }
    setQaLookupBusy(true);
    setQaLookupStatus('');
    setQaError(null);
    try {
      const result = await fetchDictionaryEntry(clean);
      if (result.status === 'not_found') {
        setQaLookupLinks(result.links);
        setQaError(result.message);
        return;
      }
      applyDictionaryDraft(buildWordDraftFromDictionary(result, 0));
    } catch (error: unknown) {
      setQaError(error instanceof Error ? error.message : 'Chưa thể tra từ điển trực tuyến.');
    } finally {
      setQaLookupBusy(false);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaTerm.trim() || !qaMeaning.trim()) {
      setQaError('Vui lòng nhập đầy đủ từ vựng và nghĩa tiếng Việt.');
      return;
    }
    const nowTs = Date.now();
    let targetDeck = decks.find((d) => d.id === qaDeckId) || quickAddDecks[0];
    if (qaDeckId === LOOKUP_DECK_ID && !decks.some((d) => d.id === LOOKUP_DECK_ID)) {
      const lookupDeck = createLookupDeck(nowTs);
      setDecks((prev) => prev.some((d) => d.id === LOOKUP_DECK_ID) ? prev : [lookupDeck, ...prev]);
      targetDeck = lookupDeck;
    }
    if (!targetDeck) {
      setQaError('Hãy tạo một bộ từ trước khi thêm từ mới.');
      return;
    }
    const cleanTerm = qaTerm.trim();
    const cleanUsIpa = qaPhonetic.trim();
    const cleanUkIpa = qaUkPhonetic.trim();
    const englishForms = cleanUkIpa && cleanUkIpa !== cleanUsIpa
      ? {
          'en-GB': { phonetic: cleanUkIpa },
          ...(cleanUsIpa ? { 'en-US': { phonetic: cleanUsIpa } } : {}),
        }
      : undefined;
    const collocations: CollocationItem[] = [
      ...(qaCollocation.trim()
        ? [{ phrase: qaCollocation.trim(), meaning: qaCollocationMeaning.trim() }]
        : []),
      ...qaExtraCollocations.filter((item) => item.phrase.trim() &&
        item.phrase.trim().toLowerCase() !== qaCollocation.trim().toLowerCase()),
    ];
    const cleanAdditionalSenses = qaIncludeExtraSenses && qaAdditionalSenses.length > 0
      ? qaAdditionalSenses
      : undefined;
    const cleanWordFamily = qaIncludeWordFamily && qaWordFamily.length > 0
      ? qaWordFamily
      : undefined;

    handleAddWord({
      deckId: targetDeck.id,
      language: targetDeck.language,
      term: cleanTerm,
      phonetic: cleanUsIpa || cleanUkIpa,
      partOfSpeech: qaPartOfSpeech.trim() || 'Từ / cụm từ',
      meaning: qaMeaning.trim(),
      ...(qaNotes.trim() ? { notes: qaNotes.trim() } : {}),
      ...(englishForms ? { englishForms } : {}),
      ...(cleanAdditionalSenses ? { additionalSenses: cleanAdditionalSenses } : {}),
      ...(cleanWordFamily ? { wordFamily: cleanWordFamily } : {}),
      collocations,
      examples: importExamples(qaExamples) ?? [],
      synonyms: importTerms(qaRelations.synonyms),
      antonyms: importTerms(qaRelations.antonyms),
      bloomLevel: 1,
    });
    setQaTerm('');
    setQaPhonetic('');
    setQaUkPhonetic('');
    setQaPartOfSpeech('Danh từ');
    setQaMeaning('');
    setQaNotes('');
    setQaCollocation('');
    setQaCollocationMeaning('');
    setQaExtraCollocations([]);
    setQaExamples(EMPTY_EXAMPLES);
    setQaRelations(EMPTY_RELATIONS);
    setQaAdditionalSenses([]);
    setQaIncludeExtraSenses(true);
    setQaWordFamily([]);
    setQaIncludeWordFamily(true);
    setQaLookupLinks(null);
    setQaLookupStatus('');
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

  const handleExportFullBackup = async (portable: boolean) => {
    await imageWrites.current;
    const stored = await loadStoredStudyData();
    if (stored?.hasFutureAttempts) throw new Error('Bản lưu chứa lượt trả lời của phiên bản mới hơn.');
    const images = stored?.images ?? profileImages;
    const [avatar, cover] = await Promise.all([readImageForBackup(images.avatar), readImageForBackup(images.cover)]);
    const state = stored?.state ?? { decks, words, logs, profile, settings, version: CURRENT_DATA_VERSION };
    const payload = createBackup(state, { avatar, cover }, new Date(), stored?.attempts, portable);
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
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
  const scopeKey = `${language}-${level.id}`;

  useEffect(() => {
    window.scrollTo(0, 0);
    return stopPronunciation;
  }, [activeViewKey, scopeKey]);

  const openQuickAdd = () => {
    if (!quickAddDecks.length) {
      setQaDeckId(LOOKUP_DECK_ID);
    } else if (qaDeckId !== LOOKUP_DECK_ID && !quickAddDecks.some((deck) => deck.id === qaDeckId)) {
      setQaDeckId(quickAddDecks[0].id);
    }
    setQaLookupStatus('');
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
                  {route !== 'decks' && <label className="scope-field">
                    <select aria-label="Cấp độ đang học" value={level.id} onChange={(event) => changeLevel(event.target.value)}>
                      {levels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                  </label>}
                </div>
                <div className="header-actions">
                  <WordLookup
                    key={scopeKey}
                    words={libraryWords}
                    allWords={words}
                    speechRate={settings.speechRate}
                    isOnline={isOnline}
                    onSaveDraft={openQuickAddWithDraft}
                  />
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
                      speechRate={settings.speechRate} plan={plan} personalized={!!personalized} now={now}
                      onStartDaily={startDailySession} onNavigate={navigate}
                      onOpenPhrases={() => { setSelectedMode('collocation'); setSelectedDeckId('all'); navigate('study'); }} />
                  )}

                  {route === 'study' && (activeSession ? (
                    <StudySession
                      mode={activeSession.mode}
                      session={activeSession}
                      sessionWords={activeSession.words}
                      adaptivePlan={activeSession.adaptivePlan}
                      allWords={scopedWords}
                      masteryByWord={masteryByWord}
                      settings={settings}
                      zenMode={settings.zenFocusMode}
                      onToggleZenMode={() => setSettings((value) => ({ ...value, zenFocusMode: !value.zenFocusMode }))}
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
                      words={practiceWords(activeDeckId)}
                      selectedMode={selectedMode}
                      selectedDeckId={activeDeckId}
                      now={now}
                      dailyCount={plan.words.length}
                      personalized={personalized}
                      adaptivePlannerEnabled={!!settings.adaptivePlanner}
                      intensive={intensive}
                      onSelectMode={setSelectedMode}
                      onSelectDeck={setSelectedDeckId}
                      onStartDaily={startDailySession}
                      onStartIntensive={startIntensiveSession}
                      onBeginSession={handleBeginHubSession}
                    />
                  ))}

                  {route === 'games' && (
                    <GamesView key={scopeKey} words={scopedWords} profile={profile} speechRate={settings.speechRate}
                      onSaveGameResult={handleSaveGameResult} arena={arenaData && {
                        ...arenaData, onSaveWord: (entry) => handleSaveChainWord(entry, arenaData.language),
                      }} />
                  )}

                  {route === 'decks' && (
                    <DecksView
                      decks={decks}
                      words={words}
                      masteryByWord={masteryByWord}
                      levels={levels}
                      activeLevel={level.id}
                      onChangeLevel={changeLevel}
                      speechRate={settings.speechRate}
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
                      onInspectTerm={setInspectTerm}
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
                      onUpdateProfile={(patch) => setProfile((value) => ({ ...value, ...patch }))} />
                  )}

                  {route === 'achievements' && <AchievementsView profile={profile} words={words} />}

                  {route === 'settings' && (
                    <SettingsView settings={settings} isOnline={isOnline}
                      plannerPreview={plannerPreview && {
                        comparison: compareAdaptivePlans(plannerPreview.candidate, legacyPlan),
                        strategy: plannerPreview.candidate.strategy,
                        durationMs: plannerPreview.durationMs,
                      }}
                      attempts={attempts}
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
                  {!decks.some((d) => d.id === LOOKUP_DECK_ID) && (
                    <option value={LOOKUP_DECK_ID}>{LOOKUP_DECK_NAME} (Tạo mới)</option>
                  )}
                  {quickAddDecks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                </select>
              </div>
              <div className="control-field">
                <label htmlFor="qa-term">Từ vựng / Cụm từ</label>
                <div className="quick-add-term-row">
                  <input id="qa-term" lang="en" required value={qaTerm}
                    placeholder="Ví dụ: resilient, negotiate, break down…"
                    onChange={(event) => setQaTerm(event.target.value)} />
                  <button
                    type="button"
                    className="button-secondary quick-add-autofill"
                    onClick={() => void handleQuickAddAutofill()}
                    disabled={!qaTerm.trim() || qaLookupBusy || !isOnline}
                    title="Tra từ điển trực tuyến và điền đúng form tự động"
                  >
                    {qaLookupBusy
                      ? <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                      : <Sparkles size={15} aria-hidden="true" />}
                    <span>Tra & điền</span>
                  </button>
                </div>
              </div>
              {qaLookupStatus && (
                <div className="quick-add-lookup-banner" role="status">
                  <span>{qaLookupStatus}</span>
                  {safeExternalUrl(qaLookupLinks?.cambridgeEnVi) && (
                    <a href={qaLookupLinks!.cambridgeEnVi} target="_blank" rel="noopener noreferrer" className="text-button">
                      Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
              <div className="quick-add-row">
                <div className="control-field">
                  <label htmlFor="qa-pos">Từ loại</label>
                  <select id="qa-pos" value={qaPartOfSpeech} onChange={(event) => setQaPartOfSpeech(event.target.value)}>
                    {STANDARD_POS_OPTIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                    {!STANDARD_POS_OPTIONS.includes(qaPartOfSpeech as typeof STANDARD_POS_OPTIONS[number]) && qaPartOfSpeech && (
                      <option value={qaPartOfSpeech}>{qaPartOfSpeech}</option>
                    )}
                  </select>
                </div>
                <div className="control-field">
                  <label htmlFor="qa-ipa">Phiên âm (US / chung)</label>
                  <input id="qa-ipa" value={qaPhonetic} placeholder="/rɪˈzɪl.jənt/"
                    onChange={(event) => setQaPhonetic(event.target.value)} />
                </div>
              </div>
              {qaUkPhonetic && qaUkPhonetic !== qaPhonetic && (
                <div className="control-field">
                  <label htmlFor="qa-ipa-uk">Phiên âm Anh–Anh (UK)</label>
                  <input id="qa-ipa-uk" value={qaUkPhonetic} onChange={(event) => setQaUkPhonetic(event.target.value)} />
                </div>
              )}
              <div className="control-field">
                <label htmlFor="qa-meaning">Nghĩa tiếng Việt</label>
                <input id="qa-meaning" required value={qaMeaning} onChange={(event) => setQaMeaning(event.target.value)} />
              </div>
              <div className="control-field">
                <label htmlFor="qa-notes">Ghi chú & cách dùng</label>
                <input id="qa-notes" value={qaNotes} placeholder="Ngữ cảnh dùng, ghi chú biến thể hoặc nguồn tham khảo…"
                  onChange={(event) => setQaNotes(event.target.value)} />
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
              {qaAdditionalSenses.length > 0 && (
                <label className="quick-add-extra-senses">
                  <input
                    type="checkbox"
                    checked={qaIncludeExtraSenses}
                    onChange={(event) => setQaIncludeExtraSenses(event.target.checked)}
                  />
                  <span>
                    Lưu kèm {qaAdditionalSenses.length} từ loại phụ ({qaAdditionalSenses.map((s) => s.partOfSpeech).join(', ')})
                  </span>
                </label>
              )}
              {qaWordFamily.length > 0 && (
                <label className="quick-add-extra-senses">
                  <input
                    type="checkbox"
                    checked={qaIncludeWordFamily}
                    onChange={(event) => setQaIncludeWordFamily(event.target.checked)}
                  />
                  <span>
                    Lưu kèm gia đình từ ({qaWordFamily.slice(0, 4).map((w) => w.term).join(', ')}{qaWordFamily.length > 4 ? '…' : ''})
                  </span>
                </label>
              )}
              {qaError && <p className="form-error" role="alert">{qaError}</p>}
              <div className="session-actions">
                <button type="button" className="button-secondary" onClick={() => setShowQuickAdd(false)}>Hủy</button>
                <button type="submit" className="button-primary">Lưu từ</button>
              </div>
            </form>
          </div>
        </dialog>

        <DictionaryInspectDialog
          term={inspectTerm}
          allWords={words}
          speechRate={settings.speechRate}
          isOnline={isOnline}
          onClose={() => setInspectTerm(null)}
          onSaveDraft={openQuickAddWithDraft}
        />
      </div>
    </MotionConfig>
  );
}
