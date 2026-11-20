import React, { useState } from 'react';
import { Play } from 'lucide-react';
import type { BloomLevel, StudyModeId, VocabDeck, VocabWord } from '../types/vocab';
import { BLOOM_META, isWordDue } from '../utils/srsBloom';
import { STUDY_MODE_CARDS } from './DashboardView';

interface StudyHubViewProps {
  decks: VocabDeck[];
  words: VocabWord[];
  selectedMode: StudyModeId;
  selectedDeckId: string;
  onSelectMode: (mode: StudyModeId) => void;
  onSelectDeck: (deckId: string) => void;
  onBeginSession: (mode: StudyModeId, deckId: string, filterType: 'due' | 'all' | 'bloom', bloomTarget?: BloomLevel) => void;
}

export const StudyHubView: React.FC<StudyHubViewProps> = ({
  decks,
  words,
  selectedMode,
  selectedDeckId,
  onSelectMode,
  onSelectDeck,
  onBeginSession,
}) => {
  const [queueFilter, setQueueFilter] = useState<'due' | 'all' | 'bloom'>('all');
  const [bloomTarget, setBloomTarget] = useState<BloomLevel>(1);

  const deckWords =
    selectedDeckId === 'all' ? words : words.filter((w) => w.deckId === selectedDeckId);
  const dueCount = deckWords.filter((w) => isWordDue(w)).length;
  const filteredWords =
    queueFilter === 'due'
      ? deckWords.filter((w) => isWordDue(w))
      : queueFilter === 'bloom'
        ? deckWords.filter((w) => w.bloomLevel === bloomTarget)
        : deckWords;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Trung tâm Luyện tập</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Chọn bộ từ vựng, lọc theo tiến độ SRS/Bloom và bắt đầu với 1 trong 7 phương pháp học.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onBeginSession(selectedMode, selectedDeckId, queueFilter, bloomTarget)}
          disabled={deckWords.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Play className="w-4 h-4" />
          <span>
            Bắt đầu ngay ({filteredWords.length > 0 ? filteredWords.length : deckWords.length} từ)
          </span>
        </button>
      </div>

      {/* Filters Row */}
      <div
        className="rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div>
          <label htmlFor="hub-deck-select" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Bộ từ vựng mục tiêu
          </label>
          <select
            id="hub-deck-select"
            value={selectedDeckId}
            onChange={(e) => onSelectDeck(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">Tất cả bộ từ ({words.length} từ)</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({words.filter((w) => w.deckId === d.id).length} từ)
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Bộ lọc hàng đợi SRS
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: queueFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: queueFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              Tất cả ({deckWords.length})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('due')}
              className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: queueFilter === 'due' ? 'var(--bg-surface)' : 'transparent',
                color: queueFilter === 'due' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              Đến hạn ({dueCount})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('bloom')}
              className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: queueFilter === 'bloom' ? 'var(--bg-surface)' : 'transparent',
                color: queueFilter === 'bloom' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              Theo Bloom
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="hub-bloom-select" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Tầng nhận thức Bloom (nếu lọc theo Bloom)
          </label>
          <select
            id="hub-bloom-select"
            value={bloomTarget}
            disabled={queueFilter !== 'bloom'}
            onChange={(e) => setBloomTarget(Number(e.target.value) as BloomLevel)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
          >
            {([1, 2, 3, 4, 5, 6] as BloomLevel[]).map((lvl) => (
              <option key={lvl} value={lvl}>
                Tầng {lvl}: {BLOOM_META[lvl].nameVi} ({BLOOM_META[lvl].nameEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STUDY_MODE_CARDS.map((mode) => {
          const Icon = mode.icon;
          const active = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              onDoubleClick={() => onBeginSession(mode.id, selectedDeckId, queueFilter, bloomTarget)}
              className="text-left rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between gap-4"
              style={{
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    color: active ? '#ffffff' : 'var(--accent-text)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium" style={{ color: active ? 'var(--accent-text)' : 'var(--text-muted)' }}>
                  {mode.bloomRange}
                </span>
              </div>

              <div>
                <h2 className="font-display text-base font-semibold">{mode.title}</h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {mode.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
