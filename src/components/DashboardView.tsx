import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Brain,
  CheckCircle2,
  EyeOff,
  Flame,
  Gamepad2,
  Headphones,
  Layers,
  PenTool,
  Plus,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';
import type {
  AppRoute,
  AppSettings,
  SmartReminder,
  StudyModeId,
  UserProfile,
  VocabDeck,
  VocabWord,
} from '../types/vocab';
import {
  BLOOM_META,
  SRS_MODE_META,
  computeBloomDistribution,
  isWordDue,
} from '../utils/srsBloom';
import { LANGUAGE_LABELS } from '../data/seedVocab';

interface DashboardViewProps {
  profile: UserProfile;
  settings: AppSettings;
  decks: VocabDeck[];
  words: VocabWord[];
  reminders: SmartReminder[];
  onStartMode: (mode: StudyModeId, deckId?: string, wordIds?: string[], forceZen?: boolean) => void;
  onToggleZenMode: () => void;
  onNavigate: (route: AppRoute) => void;
  onOpenQuickAdd: () => void;
}

export const STUDY_MODE_CARDS: Array<{
  id: StudyModeId;
  title: string;
  subtitle: string;
  bloomRange: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'flashcard',
    title: 'Thẻ ghi nhớ SRS',
    subtitle: 'Lật thẻ, phát âm chuẩn, cách dùng & SM-2',
    bloomRange: 'Bloom 1 · Ghi nhớ',
    icon: Layers,
  },
  {
    id: 'quiz',
    title: 'Trắc nghiệm đa chiều',
    subtitle: 'Ngữ nghĩa HSK, Hán-Việt & phím tắt nhanh',
    bloomRange: 'Bloom 2 · Thông hiểu',
    icon: CheckCircle2,
  },
  {
    id: 'dictation',
    title: 'Nghe & Chính tả',
    subtitle: 'Luyện nghe 0.65x/1.0x và gõ chính xác Hán tự',
    bloomRange: 'Bloom 2-5 · Nghe viết',
    icon: Headphones,
  },
  {
    id: 'cloze',
    title: 'Điền từ ngữ cảnh',
    subtitle: 'Hoàn thiện câu ví dụ thực tế theo gợi ý Pinyin',
    bloomRange: 'Bloom 3 · Vận dụng',
    icon: BookOpen,
  },
  {
    id: 'collocation',
    title: 'Học theo cụm từ',
    subtitle: 'Ghép cặp Collocation tự nhiên chuẩn HSK',
    bloomRange: 'Bloom 4 · Phân tích',
    icon: Brain,
  },
  {
    id: 'synthesis',
    title: 'Sáng tạo & Đặt câu',
    subtitle: 'Viết câu tiếng Trung hoàn chỉnh với từ và cụm từ',
    bloomRange: 'Bloom 5-6 · Sáng tạo',
    icon: PenTool,
  },
  {
    id: 'speed',
    title: 'Ôn tập siêu tốc 60s',
    subtitle: 'Phản xạ nhanh dưới áp lực đồng hồ & combo',
    bloomRange: 'Phản xạ · Tốc độ',
    icon: Timer,
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  settings,
  decks,
  words,
  reminders,
  onStartMode,
  onToggleZenMode,
  onNavigate,
  onOpenQuickAdd,
}) => {
  const dueWords = words.filter((w) => isWordDue(w));
  const masteredCount = words.filter((w) => w.bloomLevel >= 4).length;
  const dailyProgress = Math.min(
    100,
    Math.round((profile.todayWordsCount / Math.max(1, profile.dailyGoalWords)) * 100),
  );
  const bloomDist = computeBloomDistribution(words);
  const srsMeta = SRS_MODE_META[settings.srsMode];

  return (
    <div className="space-y-8">
      {/* Compact Hero Summary Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-8 rounded-2xl border p-6 flex flex-col justify-between gap-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Giáo trình HSK 1 &amp; 2 Khoa học · {srsMeta.label} · {words.length} thẻ từ vựng
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Xin chào, {profile.name}
              </h1>
              <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                Bạn đang có{' '}
                <strong className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {dueWords.length} thẻ
                </strong>{' '}
                tiếng Trung kèm giải thích cách dùng &amp; ví dụ đa dạng sẵn sàng để học.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-canvas)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm từ mới</span>
              </button>

              <button
                type="button"
                onClick={onToggleZenMode}
                aria-pressed={settings.zenFocusMode}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                style={{
                  borderColor: settings.zenFocusMode ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  backgroundColor: settings.zenFocusMode ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                  color: settings.zenFocusMode ? 'var(--accent-text)' : 'var(--text-primary)',
                }}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{settings.zenFocusMode ? 'Chế độ tập trung: Bật' : 'Chế độ tập trung (Zen)'}</span>
              </button>

              <button
                type="button"
                onClick={() => onStartMode('flashcard', 'all', dueWords.map((w) => w.id), settings.zenFocusMode)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Ôn ngay ({dueWords.length})</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>
                Tiến độ mục tiêu ngày ({profile.todayWordsCount}/{profile.dailyGoalWords} từ)
              </span>
              <span className="font-mono tabular-nums font-semibold" style={{ color: 'var(--accent-text)' }}>
                {dailyProgress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${dailyProgress}%`, backgroundColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>

          {/* 4-column Clean Metrics Strip */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-5"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Chuỗi ngày học
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <Flame className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="font-display text-2xl font-bold tabular-nums">{profile.streakDays}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ngày
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Mục tiêu hôm nay
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums">
                  {profile.todayWordsCount}/{profile.dailyGoalWords}
                </span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  ({dailyProgress}%)
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Thành thạo Bloom 4+
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums">{masteredCount}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  / {words.length} từ
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tổng điểm tích lũy
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums">{profile.xp}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  XP
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Smart Reminders + Zen Quick Launch Panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.04 }}
          className="lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between gap-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="font-display text-base font-semibold">Nhắc nhở &amp; Tập trung</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium hover:underline cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--accent-text)' }}
            >
              Xem biểu đồ
            </button>
          </div>

          <div
            className="rounded-xl p-3.5 space-y-2 border"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                Phiên học Tập trung (Zen Mode)
              </span>
              <EyeOff className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-text)' }} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Ẩn toàn bộ menu, sidebar và biểu đồ để chỉ giữ lại duy nhất thẻ từ vựng hiện tại.
            </p>
            <button
              type="button"
              onClick={() => onStartMode('flashcard', 'all', dueWords.map((w) => w.id), true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: 'var(--accent-text)' }}
            >
              <span>Vào học Zen ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {reminders.length === 0 ? (
              <div
                className="rounded-xl p-3.5 text-xs leading-relaxed"
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
              >
                Chưa có từ nào rơi vào ngưỡng quên. Hãy hoàn thành phiên đầu tiên để bắt đầu theo dõi!
              </div>
            ) : (
              reminders.slice(0, 1).map((rem) => (
                <div
                  key={rem.id}
                  className="rounded-xl p-3.5 space-y-2"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                >
                  <div className="text-xs font-semibold leading-snug">{rem.title}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {rem.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => onStartMode(rem.targetMode, 'all', rem.wordIds)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline cursor-pointer"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    <span>{rem.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* 7 Study Modes Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">7 Chế độ học chuyên sâu</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Mỗi chế độ kích hoạt một tầng nhận thức khác nhau theo thang đo Bloom
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('games')}
            className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            style={{
              borderColor: 'var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Gamepad2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Khu vực Trò chơi</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {STUDY_MODE_CARDS.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.16 }}
                onClick={() => onStartMode(mode.id)}
                className="group text-left rounded-2xl border p-4 cursor-pointer flex flex-col justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {mode.bloomRange}
                  </span>
                </div>
                <div>
                  <div className="font-display text-sm font-semibold group-hover:underline">
                    {mode.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {mode.subtitle}
                  </p>
                </div>
              </motion.button>
            );
          })}

          {/* 8th slot: Mini Arcade Game CTA */}
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.16 }}
            onClick={() => onNavigate('games')}
            className="text-left rounded-2xl border p-4 cursor-pointer flex flex-col justify-between gap-3"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                4 Mini-Game
              </span>
            </div>
            <div>
              <div className="font-display text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                Game Ghép Cặp, Thợ Săn &amp; Xếp Chữ
              </div>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                4 trò chơi luyện phản xạ nghĩa, Hán tự, chính tả và nghe hiểu.
              </p>
            </div>
          </motion.button>
        </div>
      </section>

      {/* Bottom Split: Active HSK Decks & Compact Bloom Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className="lg:col-span-7 rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Lộ trình HSK 1 &amp; 2 ({decks.length} chuyên đề)</h2>
            <button
              type="button"
              onClick={() => onNavigate('decks')}
              className="text-xs font-medium hover:underline cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--accent-text)' }}
            >
              Xem tất cả ({decks.length})
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {decks.slice(0, 6).map((deck) => {
              const deckWords = words.filter((w) => w.deckId === deck.id);
              const deckDue = deckWords.filter((w) => isWordDue(w)).length;
              const lang = LANGUAGE_LABELS[deck.language];
              return (
                <div
                  key={deck.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{lang.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{deck.category}</span>
                      {deck.isCustom && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Cá nhân</span>
                        </>
                      )}
                    </div>
                    <div className="font-medium text-sm truncate mt-0.5">{deck.name}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {deckDue} cần ôn / {deckWords.length} từ
                    </span>
                    <button
                      type="button"
                      onClick={() => onStartMode('flashcard', deck.id)}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        backgroundColor: 'var(--bg-canvas)',
                      }}
                    >
                      Học bộ này
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="lg:col-span-5 rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Phân bổ nhận thức Bloom</h2>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium hover:underline cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--accent-text)' }}
            >
              Chi tiết
            </button>
          </div>

          <div className="space-y-2.5">
            {bloomDist.map((item) => (
              <div key={item.level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {item.level}. {item.label} ({BLOOM_META[item.level].nameEn})
                  </span>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {item.count} từ · {item.percentage}%
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(item.count > 0 ? 4 : 0, item.percentage)}%`,
                      backgroundColor: 'var(--accent-primary)',
                      opacity: 0.45 + item.level * 0.09,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
