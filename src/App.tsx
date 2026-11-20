import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Bell, Menu, Plus, X } from 'lucide-react';
import type {
  AnalyticsSubRoute,
  AppRoute,
  AppSettings,
  BloomLevel,
  LanguageCode,
  ReviewQuality,
  StudyModeId,
  StudySessionLog,
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
} from './data/seedVocab';
import {
  calculateNextSRS,
  generateSmartReminders,
  isWordDue,
} from './utils/srsBloom';
import {
  clearOfflineState,
  loadOfflineState,
  loadSyncFallbackState,
  saveOfflineState,
} from './utils/offlineStorage';
import { soundEngine } from './utils/soundEngine';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudyHubView } from './components/StudyHubView';
import { StudySession } from './components/StudySession';
import { GamesView } from './components/GamesView';
import { DecksView } from './components/DecksView';
import { AnalyticsView } from './components/AnalyticsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { FloatingQuickMenu } from './components/FloatingQuickMenu';

const ROUTE_TITLES: Record<AppRoute, string> = {
  dashboard: 'Tổng quan Tiếng Trung HSK',
  study: 'Luyện tập 7 chế độ',
  games: 'Trò chơi từ vựng',
  decks: 'Bộ từ HSK 1-2 & Cá nhân',
  analytics: 'Biểu đồ & Bloom',
  profile: 'Hồ sơ cá nhân',
  settings: 'Cài đặt & Theme',
};

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
    'settings',
  ];
  const route = first && validRoutes.includes(first) ? first : 'dashboard';
  const second = parts[1] as AnalyticsSubRoute | undefined;
  const validSubs: AnalyticsSubRoute[] = ['overview', 'bloom', 'retention', 'history'];
  const analyticsSub = second && validSubs.includes(second) ? second : 'overview';
  return { route, analyticsSub };
}

export default function App() {
  const initialFallback = useMemo(() => loadSyncFallbackState(), []);
  const [decks, setDecks] = useState<VocabDeck[]>(() => initialFallback?.decks || INITIAL_DECKS);
  const [words, setWords] = useState<VocabWord[]>(() => initialFallback?.words || INITIAL_WORDS);
  const [logs, setLogs] = useState<StudySessionLog[]>(() => initialFallback?.logs || INITIAL_LOGS);
  const [profile, setProfile] = useState<UserProfile>(() => initialFallback?.profile || INITIAL_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(() => initialFallback?.settings || INITIAL_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Router State
  const initialHash = useMemo(() => parseRouteFromHash(), []);
  const [route, setRoute] = useState<AppRoute>(initialHash.route);
  const [analyticsSub, setAnalyticsSub] = useState<AnalyticsSubRoute>(initialHash.analyticsSub);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Study Session State
  const [selectedMode, setSelectedMode] = useState<StudyModeId>('flashcard');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [activeSessionWords, setActiveSessionWords] = useState<VocabWord[] | null>(null);

  // Quick Add Word Modal & Smart Reminder Drawer
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaTerm, setQaTerm] = useState('');
  const [qaPhonetic, setQaPhonetic] = useState('');
  const [qaMeaning, setQaMeaning] = useState('');
  const [qaCollocation, setQaCollocation] = useState('');
  const [qaExample, setQaExample] = useState('');
  const [qaDeckId, setQaDeckId] = useState(decks[0]?.id || 'deck-hsk1-core');
  const [qaError, setQaError] = useState<string | null>(null);
  const [showReminderPopover, setShowReminderPopover] = useState(false);

  const isOnline = useOnlineStatus();

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    loadOfflineState()
      .then((saved) => {
        if (saved) {
          setDecks(saved.decks);
          setWords(saved.words);
          setLogs(saved.logs);
          setProfile(saved.profile);
          setSettings(saved.settings);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Persist to IndexedDB + localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    saveOfflineState({
      decks,
      words,
      logs,
      profile,
      settings,
      version: 1,
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
    if (isDarkActive) root.classList.add('dark');
    else root.classList.remove('dark');
    root.setAttribute('data-theme', settings.theme);
  }, [isDarkActive, settings.theme]);

  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
    soundEngine.volume = settings.soundVolume;
  }, [settings.soundEnabled, settings.soundVolume]);

  // Hash URL sync
  const navigate = useCallback((nextRoute: AppRoute, sub?: AnalyticsSubRoute) => {
    setActiveSessionWords(null);
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
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Derived analytics & reminders
  const dueCount = useMemo(() => words.filter((w) => isWordDue(w)).length, [words]);
  const reminders = useMemo(
    () => generateSmartReminders(words, profile, logs, settings.retentionThreshold),
    [words, profile, logs, settings.retentionThreshold],
  );

  const handleStartStudyMode = (
    mode: StudyModeId,
    deckId: string = 'all',
    specificWordIds?: string[],
    forceZen?: boolean,
  ) => {
    setSelectedMode(mode);
    setSelectedDeckId(deckId);
    if (typeof forceZen === 'boolean') {
      setSettings((s) => ({ ...s, zenFocusMode: forceZen }));
    }
    let pool = deckId === 'all' ? words : words.filter((w) => w.deckId === deckId);
    if (specificWordIds && specificWordIds.length > 0) {
      const targeted = pool.filter((w) => specificWordIds.includes(w.id));
      if (targeted.length > 0) pool = targeted;
    }
    setActiveSessionWords(pool.length > 0 ? pool : words.slice(0, 8));
    setRoute('study');
  };

  const handleBeginHubSession = (
    mode: StudyModeId,
    deckId: string,
    filterType: 'due' | 'all' | 'bloom',
    bloomTarget?: BloomLevel,
  ) => {
    let pool = deckId === 'all' ? words : words.filter((w) => w.deckId === deckId);
    if (filterType === 'due') {
      const due = pool.filter((w) => isWordDue(w));
      if (due.length > 0) pool = due;
    } else if (filterType === 'bloom' && bloomTarget) {
      const byBloom = pool.filter((w) => w.bloomLevel === bloomTarget);
      if (byBloom.length > 0) pool = byBloom;
    }
    setSelectedMode(mode);
    setActiveSessionWords(pool.slice(0, 15));
  };

  const handleRecordReview = (wordId: string, quality: ReviewQuality) => {
    setWords((prev) =>
      prev.map((w) => {
        if (w.id !== wordId) return w;
        const next = calculateNextSRS(w, quality, settings.srsMode);
        return {
          ...w,
          srs: next.srs,
          bloomLevel: next.bloomLevel,
        };
      }),
    );

    const today = new Date().toISOString().slice(0, 10);
    setProfile((prev) => {
      const isNewDay = prev.lastStudyDate !== today;
      const nextStreak = isNewDay ? prev.streakDays + 1 : Math.max(1, prev.streakDays);
      return {
        ...prev,
        xp: prev.xp + (quality >= 3 ? 12 : 5),
        todayWordsCount: isNewDay ? 1 : prev.todayWordsCount + 1,
        lastStudyDate: today,
        streakDays: nextStreak,
        longestStreak: Math.max(prev.longestStreak, nextStreak),
      };
    });
  };

  const handleCompleteSession = (summary: {
    mode: StudyModeId;
    wordsReviewed: number;
    correctCount: number;
    xpEarned: number;
    durationSeconds: number;
  }) => {
    const newLog: StudySessionLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      mode: summary.mode,
      deckId: selectedDeckId,
      wordsReviewed: summary.wordsReviewed,
      correctCount: summary.correctCount,
      xpEarned: summary.xpEarned,
      durationSeconds: summary.durationSeconds,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleSaveGameResult = (
    game: 'match' | 'wordfall' | 'scramble' | 'audioblitz',
    score: number,
    xpEarned: number,
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setProfile((prev) => {
      const isNewDay = prev.lastStudyDate !== today;
      const nextStreak = isNewDay ? prev.streakDays + 1 : Math.max(1, prev.streakDays);
      return {
        ...prev,
        xp: prev.xp + xpEarned,
        lastStudyDate: today,
        streakDays: nextStreak,
        longestStreak: Math.max(prev.longestStreak, nextStreak),
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
        timestamp: Date.now(),
        mode: modeMap[game],
        deckId: 'all',
        wordsReviewed: 6,
        correctCount: 5,
        xpEarned,
        durationSeconds: 45,
      },
    ]);
  };

  const handleCreateDeck = (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => {
    const id = `deck-custom-${Date.now()}`;
    setDecks((prev) => [
      { ...deck, id, isCustom: true, createdAt: Date.now() },
      ...prev,
    ]);
    return id;
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setWords((prev) => prev.filter((w) => w.deckId !== deckId));
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
      example?: string;
      translation?: string;
    }>,
  ) => {
    const targetDeck = decks.find((d) => d.id === deckId);
    const lang: LanguageCode = targetDeck?.language || 'zh';
    const now = Date.now();
    const valid = items
      .filter((i) => i && typeof i.term === 'string' && typeof i.meaning === 'string')
      .map((item, idx) => ({
        id: `w-imp-${now}-${idx}`,
        deckId,
        language: lang,
        term: item.term.trim(),
        phonetic: item.phonetic?.trim() || (/[\u4e00-\u9fff]/.test(item.term) ? '' : `/${item.term.trim()}/`),
        partOfSpeech: item.partOfSpeech?.trim() || 'n',
        meaning: item.meaning.trim(),
        collocations: item.collocation ? [{ phrase: item.collocation, meaning: item.meaning }] : [],
        examples: item.example
          ? [{ sentence: item.example, translation: item.translation || item.meaning }]
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
    const targetDeck = decks.find((d) => d.id === qaDeckId) || decks[0];
    const cleanTerm = qaTerm.trim();
    const fallbackPhonetic = /[\u4e00-\u9fff]/.test(cleanTerm) ? '' : `/${cleanTerm}/`;
    handleAddWord({
      deckId: targetDeck.id,
      language: targetDeck.language,
      term: cleanTerm,
      phonetic: qaPhonetic.trim() || fallbackPhonetic,
      partOfSpeech: 'n / v',
      meaning: qaMeaning.trim(),
      collocations: qaCollocation.trim()
        ? [{ phrase: qaCollocation.trim(), meaning: qaMeaning.trim() }]
        : [],
      examples: qaExample.trim()
        ? [{ sentence: qaExample.trim(), translation: qaMeaning.trim() }]
        : [],
      synonyms: [],
      bloomLevel: 1,
    });
    setQaTerm('');
    setQaPhonetic('');
    setQaMeaning('');
    setQaCollocation('');
    setQaExample('');
    setQaError(null);
    setShowQuickAdd(false);
  };

  const handleExportFullBackup = () => {
    const payload = { decks, words, logs, profile, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexisbloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAllData = async () => {
    await clearOfflineState();
    setDecks(INITIAL_DECKS);
    setWords(INITIAL_WORDS);
    setLogs(INITIAL_LOGS);
    setProfile(INITIAL_PROFILE);
    setSettings(INITIAL_SETTINGS);
  };

  const isZenStudyActive = route === 'study' && !!activeSessionWords && settings.zenFocusMode;

  const densityPadding = isZenStudyActive
    ? 'p-6 sm:p-10 max-w-4xl mx-auto flex flex-col justify-center min-h-screen'
    : settings.uiDensity === 'compact'
      ? 'p-4 sm:p-5'
      : settings.uiDensity === 'zen'
        ? 'p-6 sm:p-10 max-w-5xl mx-auto'
        : 'p-5 sm:p-8';

  const activeViewKey =
    route === 'study' ? `${route}-${activeSessionWords ? 'session' : 'hub'}` : route;

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-zen={isZenStudyActive ? 'true' : 'false'}
        className="min-h-screen flex transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
        }}
      >
        {!isZenStudyActive && (
          <Sidebar
            activeRoute={route}
            onNavigate={(r) => navigate(r)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            dueCount={dueCount}
            profile={profile}
            colorScheme={settings.colorScheme}
            isDarkActive={isDarkActive}
            onToggleDark={() =>
              setSettings((s) => ({
                ...s,
                colorScheme: isDarkActive ? 'light' : 'dark',
              }))
            }
            isOnline={isOnline}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* macOS-Style Floating Frosted Header (hidden in Zen Focus Mode) */}
          {!isZenStudyActive && (
            <header
              className="sticky top-3.5 z-30 mx-3 sm:mx-6 mt-3.5 h-14 rounded-2xl border px-4 sm:px-5 flex items-center justify-between gap-4 backdrop-blur-xl transition-colors"
              style={{
                backgroundColor: 'var(--glass-bg)',
                borderColor: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Mở menu điều hướng"
                  className="lg:hidden rounded-xl border p-2 cursor-pointer transition-transform active:scale-95"
                  style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                  LexisBloom <span aria-hidden="true">/</span>{' '}
                  <span style={{ color: 'var(--text-primary)' }}>{ROUTE_TITLES[route]}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 relative">
                <button
                  type="button"
                  onClick={() => setShowReminderPopover((v) => !v)}
                  aria-label={`Nhắc nhở thông minh (${reminders.length})`}
                  className="relative flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95"
                  style={{
                    borderColor: 'var(--border-hairline)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nhắc nhở</span>
                  {reminders.length > 0 && (
                    <span className="font-mono tabular-nums font-semibold" style={{ color: 'var(--accent-text)' }}>
                      ({reminders.length})
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm từ</span>
                </button>

                <AnimatePresence>
                  {showReminderPopover && (
                    <motion.div
                      role="dialog"
                      aria-label="Danh sách nhắc nhở thông minh"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border p-4 shadow-xl space-y-3 z-50 backdrop-blur-xl"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-hairline)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-bold">Nhắc nhở thông minh</span>
                        <button
                          type="button"
                          onClick={() => setShowReminderPopover(false)}
                          aria-label="Đóng nhắc nhở"
                          className="cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {reminders.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Không có từ nào sắp quên.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {reminders.map((r) => (
                            <div key={r.id} className="rounded-xl p-2.5 text-xs space-y-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                              <div className="font-semibold">{r.title}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowReminderPopover(false);
                                  handleStartStudyMode(r.targetMode, 'all', r.wordIds);
                                }}
                                className="font-semibold hover:underline cursor-pointer"
                                style={{ color: 'var(--accent-text)' }}
                              >
                                {r.actionLabel} →
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </header>
          )}

          {/* Main Viewport with Smooth Animated View Transitions */}
          <main className={`flex-1 w-full max-w-[1360px] mx-auto ${densityPadding} ${isZenStudyActive ? '' : 'pb-24'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeViewKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                {route === 'dashboard' && (
                  <DashboardView
                    profile={profile}
                    settings={settings}
                    decks={decks}
                    words={words}
                    reminders={reminders}
                    onStartMode={handleStartStudyMode}
                    onToggleZenMode={() => setSettings((s) => ({ ...s, zenFocusMode: !s.zenFocusMode }))}
                    onNavigate={(r) => navigate(r)}
                    onOpenQuickAdd={() => setShowQuickAdd(true)}
                  />
                )}

                {route === 'study' && activeSessionWords && (
                  <StudySession
                    mode={selectedMode}
                    sessionWords={activeSessionWords}
                    allWords={words}
                    settings={settings}
                    zenMode={settings.zenFocusMode}
                    onToggleZenMode={() => setSettings((s) => ({ ...s, zenFocusMode: !s.zenFocusMode }))}
                    onRecordReview={handleRecordReview}
                    onCompleteSession={handleCompleteSession}
                    onExit={() => setActiveSessionWords(null)}
                  />
                )}

                {route === 'study' && !activeSessionWords && (
                  <StudyHubView
                    decks={decks}
                    words={words}
                    selectedMode={selectedMode}
                    selectedDeckId={selectedDeckId}
                    onSelectMode={setSelectedMode}
                    onSelectDeck={setSelectedDeckId}
                    onBeginSession={handleBeginHubSession}
                  />
                )}

                {route === 'games' && (
                  <GamesView
                    words={words}
                    profile={profile}
                    speechRate={settings.speechRate}
                    onSaveGameResult={handleSaveGameResult}
                  />
                )}

                {route === 'decks' && (
                  <DecksView
                    decks={decks}
                    words={words}
                    speechRate={settings.speechRate}
                    onCreateDeck={handleCreateDeck}
                    onDeleteDeck={handleDeleteDeck}
                    onAddWord={handleAddWord}
                    onDeleteWord={handleDeleteWord}
                    onStartDeckStudy={(deckId) => handleStartStudyMode('flashcard', deckId)}
                    onImportWordsJson={handleImportWordsJson}
                  />
                )}

                {route === 'analytics' && (
                  <AnalyticsView
                    subRoute={analyticsSub}
                    onChangeSubRoute={(sub) => navigate('analytics', sub)}
                    words={words}
                    logs={logs}
                  />
                )}

                {route === 'profile' && (
                  <ProfileView
                    profile={profile}
                    words={words}
                    logs={logs}
                    onUpdateProfile={(patch) => setProfile((p) => ({ ...p, ...patch }))}
                  />
                )}

                {route === 'settings' && (
                  <SettingsView
                    settings={settings}
                    isOnline={isOnline}
                    onUpdateSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                    onExportFullBackup={handleExportFullBackup}
                    onResetAllData={handleResetAllData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Floating Quick Popup Menu (hidden in Zen Focus Mode) */}
        {!isZenStudyActive && (
          <FloatingQuickMenu
            words={words}
            isDarkActive={isDarkActive}
            activeTheme={settings.theme}
            speechRate={settings.speechRate}
            onToggleDark={() =>
              setSettings((s) => ({ ...s, colorScheme: isDarkActive ? 'light' : 'dark' }))
            }
            onChangeTheme={(theme) => setSettings((s) => ({ ...s, theme }))}
            onNavigate={(r) => navigate(r)}
            onLaunchStudyMode={(mode) => handleStartStudyMode(mode)}
            onOpenQuickAdd={() => setShowQuickAdd(true)}
          />
        )}

        {/* Global Quick Add Word Modal */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <motion.div
                role="dialog"
                aria-label="Thêm nhanh từ vựng mới"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Thêm nhanh từ vựng</h2>
                  <button type="button" onClick={() => setShowQuickAdd(false)} aria-label="Đóng" className="cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleQuickAddSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="qa-deck" className="block text-xs font-medium mb-1">
                      Bộ từ vựng
                    </label>
                    <select
                      id="qa-deck"
                      value={qaDeckId}
                      onChange={(e) => setQaDeckId(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                    >
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({LANGUAGE_LABELS[d.language].short})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="qa-term" className="block text-xs font-medium mb-1">
                        Từ vựng (Chữ Hán) *
                      </label>
                      <input
                        id="qa-term"
                        type="text"
                        value={qaTerm}
                        onChange={(e) => setQaTerm(e.target.value)}
                        placeholder="努力"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="qa-ipa" className="block text-xs font-medium mb-1">
                        Phiên âm (Pinyin)
                      </label>
                      <input
                        id="qa-ipa"
                        type="text"
                        value={qaPhonetic}
                        onChange={(e) => setQaPhonetic(e.target.value)}
                        placeholder="nǔlì"
                        className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                        style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="qa-meaning" className="block text-xs font-medium mb-1">
                      Nghĩa tiếng Việt *
                    </label>
                    <input
                      id="qa-meaning"
                      type="text"
                      value={qaMeaning}
                      onChange={(e) => setQaMeaning(e.target.value)}
                      placeholder="nỗ lực, cố gắng"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="qa-col" className="block text-xs font-medium mb-1">
                      Cụm từ đi kèm
                    </label>
                    <input
                      id="qa-col"
                      type="text"
                      value={qaCollocation}
                      onChange={(e) => setQaCollocation(e.target.value)}
                      placeholder="努力学习"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="qa-ex" className="block text-xs font-medium mb-1">
                      Câu ví dụ
                    </label>
                    <input
                      id="qa-ex"
                      type="text"
                      value={qaExample}
                      onChange={(e) => setQaExample(e.target.value)}
                      placeholder="我每天都努力提高汉语水平。"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                    />
                  </div>

                  {qaError && <p className="text-xs text-rose-500">{qaError}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(false)}
                      className="rounded-lg border px-4 py-2 text-xs font-medium cursor-pointer"
                      style={{ borderColor: 'var(--border-hairline)' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Lưu từ mới
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
