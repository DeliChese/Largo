import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Command,
  Gamepad2,
  Moon,
  Plus,
  Search,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import type { AppRoute, StudyModeId, ThemeId, VocabWord } from '../types/vocab';
import { speakPronunciation } from '../utils/soundEngine';

interface FloatingQuickMenuProps {
  words: VocabWord[];
  isDarkActive: boolean;
  activeTheme: ThemeId;
  speechRate: number;
  onToggleDark: () => void;
  onChangeTheme: (theme: ThemeId) => void;
  onNavigate: (route: AppRoute) => void;
  onLaunchStudyMode: (mode: StudyModeId) => void;
  onOpenQuickAdd: () => void;
}

const THEME_LABELS: Array<{ id: ThemeId; label: string }> = [
  { id: 'indigo', label: 'Tri thức' },
  { id: 'botanical', label: 'Rừng tĩnh' },
  { id: 'amber', label: 'Hổ phách' },
  { id: 'midnight', label: 'Tập trung' },
];

export const FloatingQuickMenu: React.FC<FloatingQuickMenuProps> = ({
  words,
  isDarkActive,
  activeTheme,
  speechRate,
  onToggleDark,
  onChangeTheme,
  onNavigate,
  onLaunchStudyMode,
  onOpenQuickAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matchingWords = q
    ? words
        .filter(
          (w) =>
            w.term.toLowerCase().includes(q) ||
            w.phonetic.toLowerCase().includes(q) ||
            w.meaning.toLowerCase().includes(q) ||
            (w.sinoVietnamese && w.sinoVietnamese.toLowerCase().includes(q)),
        )
        .slice(0, 5)
    : [];

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Menu thao tác nhanh"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="mb-3 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border shadow-2xl p-4 space-y-4 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-display text-sm font-semibold">Menu Nổi Nhanh</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu nổi"
              className="rounded-md p-1 hover:opacity-75 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Word Search & Pronounce */}
          <div>
            <label htmlFor="quick-lookup-input" className="sr-only">
              Tra nhanh từ vựng
            </label>
            <div
              className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
              style={{
                borderColor: 'var(--border-hairline)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                id="quick-lookup-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tra nhanh & phát âm từ vựng..."
                className="w-full bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {matchingWords.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {matchingWords.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                    style={{ backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <div className="min-w-0">
                      <span className="font-semibold">{w.term}</span>{' '}
                      <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {w.phonetic}
                      </span>
                      <div className="truncate" style={{ color: 'var(--text-secondary)' }}>
                        {w.meaning}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakPronunciation(w.term, w.language, speechRate)}
                      aria-label={`Phát âm ${w.term}`}
                      className="rounded-md p-1.5 shrink-0 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenQuickAdd();
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Thêm từ mới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLaunchStudyMode('flashcard');
              }}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
              style={{
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Ôn Flashcard</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate('games');
              }}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
              style={{
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
              <span>Chơi Game</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate('analytics');
              }}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
              style={{
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Sơ đồ Bloom</span>
            </button>
          </div>

          {/* Quick Theme & Dark Switch */}
          <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-hairline)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Giao diện & Theme
              </span>
              <button
                type="button"
                onClick={onToggleDark}
                className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium cursor-pointer"
                style={{
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                {isDarkActive ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                <span>{isDarkActive ? 'Sáng' : 'Tối'}</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className="rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer truncate px-1"
                  style={{
                    backgroundColor: activeTheme === t.id ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                    color: activeTheme === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Mở menu thao tác nhanh"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        {open ? <X className="w-4 h-4" /> : <Command className="w-4 h-4" />}
        <span className="hidden sm:inline">{open ? 'Đóng' : 'Menu nhanh'}</span>
      </button>
    </div>
  );
};
