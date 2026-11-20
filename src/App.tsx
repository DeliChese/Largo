import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Bell, ChevronDown, Languages, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import type {
  AnalyticsSubRoute,
  AppRoute,
  AppSettings,
  BloomLevel,
  LanguageCode,
  ReviewQuality,
  StudyModeId,
  StudySessionMode,
  StudySessionLog,
  SmartReminder,
  UserProfile,
  VocabDeck,
  VocabWord,
} from './types/vocab';
import {
  INITIAL_DECKS,
  INITIAL_LOGS,
  INITIAL_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_WORDS,
  LANGUAGE_LABELS,
  CURRENT_DATA_VERSION,
  withEnglishSeed,
} from './data/seedVocab';
import { generateSmartReminders, isWordDue, localStudyDate, reviewXp } from './utils/srsBloom';
import {
  applyStudyReview, getDailyStudyPlan, getIntensiveStudyPlan, getPracticeWords, PRACTICE_SESSION_SIZE, recordStudyActivity,
  type StudyFilter,
} from './utils/studyPlan';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLanguages, getStudyLevels } from './utils/studyScope';
import {
  clearOfflineState,
  loadOfflineState,
  loadProfileImages,
  loadSyncFallbackState,
  saveOfflineState,
  saveProfileImage,
  type PersistedAppState,
} from './utils/offlineStorage';
import { prepareProfileImage, readImageForBackup, type ProfileImageKind, type ProfileImages } from './utils/profileImages';
import { setPronunciationVoices, soundEngine, stopPronunciation } from './utils/soundEngine';
import { clearSpeechClipCache } from './utils/speechClipCache';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { NAV_LABELS, Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudyHubView } from './components/StudyHubView';
import { StudySession, type SessionProgress } from './components/StudySession';
import { WordLookup } from './components/WordLookup';

const GamesView = lazy(() => import('./components/GamesView').then(({ GamesView }) => ({ default: GamesView })));
const DecksView = lazy(() => import('./components/DecksView').then(({ DecksView }) => ({ default: DecksView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(({ AnalyticsView }) => ({ default: AnalyticsView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(({ ProfileView }) => ({ default: ProfileView })));
const AchievementsView = lazy(() => import('./components/AchievementsView').then(({ AchievementsView }) => ({ default: AchievementsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(({ SettingsView }) => ({ default: SettingsView })));

const NOTIFICATION_DAY_KEY = 'lexisbloom_reminder_date';

interface ActiveSession {
  id: string;
  mode: StudySessionMode;
  deckId: string;
  language: LanguageCode;
  level: string;
  words: VocabWord[];
}

function upgradeSavedState(state: PersistedAppState | null): PersistedAppState | null {
  if (!state || state.version >= CURRENT_DATA_VERSION) return state;
  const upgraded = withEnglishSeed(state);
  const { profile } = upgraded;
  if (profile.name !== 'Học viên HSK' || profile.title !== 'Lộ trình Tiếng Trung Khoa học') return upgraded;
  return { ...upgraded, profile: { ...profile, name: INITIAL_PROFILE.name, title: INITIAL_PROFILE.title } };
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
  const initialFallback = useMemo(() => upgradeSavedState(loadSyncFallbackState()), []);
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
  const [qaExample, setQaExample] = useState('');
  const [qaExampleTranslation, setQaExampleTranslation] = useState('');
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
    Promise.all([loadOfflineState(), loadProfileImages().catch(() => ({}))])
      .then(([stored, images]) => {
        setProfileImages(images);
        const saved = upgradeSavedState(stored);
        if (saved) {
          setDecks(saved.decks);
          setWords(saved.words);
          setLogs(saved.logs);
          setProfile(saved.profile);
          setSettings({ ...INITIAL_SETTINGS, ...saved.settings });
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
    if (!hydrated) return;
    saveOfflineState({
      decks,
      words,
      logs,
      profile,
      settings,
      version: CURRENT_DATA_VERSION,
    });
  }, [decks, words, logs, profile, settings, hydrated]);

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

  const language = profile.targetLanguage;
  const languages = useMemo(() => [...new Set([...getStudyLanguages(decks), language])], [decks, language]);
  const levels = useMemo(() => getStudyLevels(language, decks), [language, decks]);
  const level = levels.find((entry) => entry.id === settings.studyLevels?.[language]) ?? levels[0];
  const scopedDecks = useMemo(() => getScopedDecks(decks, language, level.id), [decks, language, level.id]);
  const scopedWords = useMemo(() => getScopedWords(words, scopedDecks, language), [words, scopedDecks, language]);
  const scopedLogs = useMemo(() => {
    const decksById = new Map(decks.map((deck) => [deck.id, deck]));
    return logs.filter((log) => {
      const deck = decksById.get(log.deckId);
      const logLanguage = log.language ?? deck?.language ?? 'zh';
      if (logLanguage !== language) return false;
      const logLevel = deck ? getDeckStudyLevel(deck) : log.level;
      return level.id === 'all' || level.id === logLevel;
    });
  }, [logs, decks, language, level.id]);
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
    if (!hydrated || pool.length === 0) return;
    navigate('study');
    const id = globalThis.crypto?.randomUUID?.() ?? 'study-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    setActiveSession({ id, mode, deckId, language, level: level.id, words: pool });
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

  const handleBeginHubSession = (
    mode: StudyModeId,
    deckId: string,
    filterType: StudyFilter = 'all',
    bloomTarget: BloomLevel = 1,
  ) => {
    const timestamp = Date.now();
    setNow(timestamp);
    const pool = getPracticeWords(scopedWords, deckId, filterType, bloomTarget, mode, timestamp);
    beginSession(mode, deckId, pool.slice(0, PRACTICE_SESSION_SIZE));
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

  const handleRecordReview = (wordId: string, quality: ReviewQuality, exercise: StudyModeId, answeredAt: number) => {
    setNow(answeredAt);
    setWords((prev) => prev.map((word) => word.id === wordId
      ? applyStudyReview(word, quality, settings.srsMode, answeredAt, exercise, activeSession?.mode)
      : word));
    setProfile((prev) => recordStudyActivity(prev, answeredAt, reviewXp(quality), wordId));
  };

  const handleSessionProgress = (progress: SessionProgress) => {
    if (!activeSession) return;
    const entry: StudySessionLog = {
      id: activeSession.id, timestamp: Date.now(), mode: activeSession.mode, deckId: activeSession.deckId,
      language: activeSession.language, level: activeSession.level, ...progress,
    };
    setLogs((prev) => prev.some((log) => log.id === entry.id)
      ? prev.map((log) => log.id === entry.id ? entry : log)
      : [...prev, entry]);
  };

  const restartPractice = () => {
    if (!activeSession || activeSession.mode === 'guided' || activeSession.mode === 'intensive') return;
    const ids = new Set(activeSession.words.map((word) => word.id));
    const eligible = getPracticeWords(scopedWords, activeSession.deckId, 'all', 1, activeSession.mode, Date.now());
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
      srs: {
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: now,
        lastReviewedAt: null,
      },
    };
    setWords((prev) => [newWord, ...prev]);
  };

  const handleDeleteWord = (wordId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const handleImportWordsJson = (
    deckId: string,
    items: Array<{
      term: string;
      phonetic?: string;
      partOfSpeech?: string;
      meaning: string;
      collocation?: string;
      collocationMeaning?: string;
      example?: string;
      translation?: string;
    }>,
  ) => {
    const targetDeck = decks.find((d) => d.id === deckId);
    if (!targetDeck) return 0;
    const lang = targetDeck.language;
    const now = Date.now();
    const trimText = (value: unknown) => typeof value === 'string' ? value.trim() : '';
    const valid = items
      .filter((i) => i && typeof i.term === 'string' && i.term.trim() && typeof i.meaning === 'string' && i.meaning.trim())
      .map((item, idx) => ({
        id: `w-imp-${now}-${idx}`,
        deckId,
        language: lang,
        term: item.term.trim(),
        phonetic: trimText(item.phonetic),
        partOfSpeech: trimText(item.partOfSpeech) || 'n',
        meaning: item.meaning.trim(),
        collocations: trimText(item.collocation) ? [{ phrase: trimText(item.collocation), meaning: trimText(item.collocationMeaning) }] : [],
        examples: trimText(item.example)
          ? [{ sentence: trimText(item.example), translation: trimText(item.translation) }]
          : [],
        synonyms: [],
        bloomLevel: 1 as BloomLevel,
        srs: {
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: now,
          lastReviewedAt: null,
        },
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
      partOfSpeech: 'n / v',
      meaning: qaMeaning.trim(),
      collocations: qaCollocation.trim()
        ? [{ phrase: qaCollocation.trim(), meaning: qaCollocationMeaning.trim() }]
        : [],
      examples: qaExample.trim()
        ? [{ sentence: qaExample.trim(), translation: qaExampleTranslation.trim() }]
        : [],
      synonyms: [],
      bloomLevel: 1,
    });
    setQaTerm('');
    setQaPhonetic('');
    setQaMeaning('');
    setQaCollocation('');
    setQaCollocationMeaning('');
    setQaExample('');
    setQaExampleTranslation('');
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
    const images = await loadProfileImages().catch(() => profileImages);
    const [avatar, cover] = await Promise.all([readImageForBackup(images.avatar), readImageForBackup(images.cover)]);
    const payload = {
      decks, words, logs, profile, settings, version: CURRENT_DATA_VERSION, exportedAt: new Date().toISOString(),
      ...(avatar || cover ? { profileImages: { avatar, cover } } : {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'largo-backup-' + localStudyDate() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAllData = async () => {
    const reset = imageWrites.current.then(async () => {
      await Promise.all([clearOfflineState(), clearSpeechClipCache()]);
      setDecks(INITIAL_DECKS);
      setWords(INITIAL_WORDS);
      setLogs(INITIAL_LOGS);
      setProfile(INITIAL_PROFILE);
      setProfileImages({});
      setSettings(INITIAL_SETTINGS);
      setSelectedDeckId('all');
    });
    imageWrites.current = reset.catch(() => {});
    await reset;
  };

  const isZenStudyActive = route === 'study' && !!activeSession && settings.zenFocusMode;
  const activeViewKey = route === 'study' ? activeSession?.id ?? 'study-hub' : route;
  const activeDeckId = scopedDecks.some((deck) => deck.id === selectedDeckId) ? selectedDeckId : 'all';
  const scopeKey = language + '-' + level.id;

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

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" data-zen={isZenStudyActive} data-density={settings.uiDensity}>
        {!isZenStudyActive && (
          <Sidebar
            activeRoute={route}
            onNavigate={navigate}
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
            <header className="app-header">
              <div className="header-inner">
                <div className="header-location">
                  <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu điều hướng"
                    aria-expanded={mobileMenuOpen} className="icon-button mobile-menu-trigger">
                    <Menu size={20} aria-hidden="true" />
                  </button>
                  <span className="header-current">{NAV_LABELS[route]}</span>
                </div>
                <div className="study-scope" role="group" aria-label="Ngôn ngữ và cấp độ đang học">
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
                  <label className="scope-field">
                    <select aria-label="Cấp độ đang học" value={level.id} onChange={(event) => changeLevel(event.target.value)}>
                      {levels.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                  </label>
                </div>
                <div className="header-actions">
                  <WordLookup key={scopeKey} words={scopedWords} speechRate={settings.speechRate} />
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
                  <button type="button" className="button-primary header-add" onClick={openQuickAdd}
                    aria-label={scopedDecks.length ? 'Thêm từ' : 'Tạo bộ từ'}>
                    <Plus size={17} aria-hidden="true" /><span>{scopedDecks.length ? 'Thêm từ' : 'Tạo bộ từ'}</span>
                  </button>
                </div>
              </div>
            </header>
          )}

          <main className="app-content" data-route={route} aria-busy={!hydrated}>
            <Suspense fallback={<p className="panel-empty" role="status">Đang tải…</p>}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeViewKey}
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
                      sessionWords={activeSession.words}
                      allWords={scopedWords}
                      settings={settings}
                      zenMode={settings.zenFocusMode}
                      onToggleZenMode={() => setSettings((value) => ({ ...value, zenFocusMode: !value.zenFocusMode }))}
                      onRecordReview={handleRecordReview}
                      onProgress={handleSessionProgress}
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
                      key={scopeKey}
                      decks={scopedDecks}
                      words={scopedWords}
                      language={language}
                      activeLevel={level.id}
                      speechRate={settings.speechRate}
                      onCreateDeck={handleCreateDeck}
                      onDeleteDeck={handleDeleteDeck}
                      onAddWord={handleAddWord}
                      onDeleteWord={handleDeleteWord}
                      onStartDeckStudy={(deckId) => {
                        setSelectedMode('flashcard');
                        setSelectedDeckId(deckId);
                        handleBeginHubSession('flashcard', deckId);
                      }}
                      onImportWordsJson={handleImportWordsJson}
                    />
                  )}

                  {route === 'analytics' && (
                    <AnalyticsView subRoute={analyticsSub} onChangeSubRoute={(sub) => navigate('analytics', sub)} words={scopedWords} logs={scopedLogs} now={now} />
                  )}

                  {route === 'profile' && (
                    <ProfileView profile={profile} words={words} logs={logs}
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
                      onExportFullBackup={handleExportFullBackup} onResetAllData={handleResetAllData} />
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
              <div className="control-field">
                <label htmlFor="qa-ex">Câu ví dụ</label>
                <input id="qa-ex" value={qaExample} onChange={(event) => setQaExample(event.target.value)} />
              </div>
              {qaExample.trim() && (
                <div className="control-field">
                  <label htmlFor="qa-ex-translation">Nghĩa của câu ví dụ</label>
                  <input id="qa-ex-translation" value={qaExampleTranslation} onChange={(event) => setQaExampleTranslation(event.target.value)} />
                </div>
              )}
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
