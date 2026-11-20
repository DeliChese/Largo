import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpenCheck,
  Download,
  FolderPlus,
  Plus,
  Search,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import type { LanguageCode, VocabDeck, VocabWord } from '../types/vocab';
import { LANGUAGE_LABELS } from '../data/seedVocab';
import { BLOOM_META, calculateRetentionProbability, formatIntervalVi } from '../utils/srsBloom';
import { speakPronunciation } from '../utils/soundEngine';
import { type ChineseDictEntry, searchChineseDictionary } from '../utils/chineseDict';

function stripTrailingPinyin(sentence: string): string {
  return sentence.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

interface DecksViewProps {
  decks: VocabDeck[];
  words: VocabWord[];
  speechRate: number;
  onCreateDeck: (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => string;
  onDeleteDeck: (deckId: string) => void;
  onAddWord: (word: Omit<VocabWord, 'id' | 'createdAt' | 'srs'>) => void;
  onDeleteWord: (wordId: string) => void;
  onStartDeckStudy: (deckId: string) => void;
  onImportWordsJson: (deckId: string, items: Array<{ term: string; phonetic?: string; partOfSpeech?: string; meaning: string; collocation?: string; example?: string; translation?: string }>) => number;
}

export const DecksView: React.FC<DecksViewProps> = ({
  decks,
  words,
  speechRate,
  onCreateDeck,
  onDeleteDeck,
  onAddWord,
  onDeleteWord,
  onStartDeckStudy,
  onImportWordsJson,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'all');
  const [deckLevelFilter, setDeckLevelFilter] = useState<'all' | 'hsk1' | 'hsk2' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [showZhDictModal, setShowZhDictModal] = useState(false);
  const [zhQuery, setZhQuery] = useState('');
  const [zhResults, setZhResults] = useState<ChineseDictEntry[]>([]);
  const [zhSearching, setZhSearching] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // New Deck Form State
  const [deckName, setDeckName] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckLang, setDeckLang] = useState<LanguageCode>('zh');
  const [deckCategory, setDeckCategory] = useState('Cá nhân');

  // New Word Form State
  const [wordTerm, setWordTerm] = useState('');
  const [wordPhonetic, setWordPhonetic] = useState('');
  const [wordSinoVi, setWordSinoVi] = useState('');
  const [wordPos, setWordPos] = useState('n / v');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordNotes, setWordNotes] = useState('');
  const [wordCollocation, setWordCollocation] = useState('');
  const [wordCollocationMeaning, setWordCollocationMeaning] = useState('');
  const [wordExample, setWordExample] = useState('');
  const [wordTranslation, setWordTranslation] = useState('');
  const [wordSynonyms, setWordSynonyms] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredDecks = useMemo(() => {
    if (deckLevelFilter === 'all') return decks;
    if (deckLevelFilter === 'hsk1') return decks.filter((d) => d.category.startsWith('HSK 1'));
    if (deckLevelFilter === 'hsk2') return decks.filter((d) => d.category.startsWith('HSK 2'));
    return decks.filter((d) => d.isCustom);
  }, [decks, deckLevelFilter]);

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || null;

  const visibleWords = useMemo(() => {
    const allowedDeckIds = new Set(filteredDecks.map((d) => d.id));
    const base =
      selectedDeckId === 'all'
        ? words.filter((w) => allowedDeckIds.has(w.deckId))
        : words.filter((w) => w.deckId === selectedDeckId);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (w) =>
        w.term.toLowerCase().includes(q) ||
        w.phonetic.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        (w.sinoVietnamese && w.sinoVietnamese.toLowerCase().includes(q)) ||
        w.collocations.some((c) => c.phrase.toLowerCase().includes(q)),
    );
  }, [words, filteredDecks, selectedDeckId, searchQuery]);

  const handleOpenZhDict = async () => {
    setShowZhDictModal(true);
    setZhSearching(true);
    const initial = await searchChineseDictionary('');
    setZhResults(initial);
    setZhSearching(false);
  };

  const handleSearchZhDict = async (e: React.FormEvent) => {
    e.preventDefault();
    setZhSearching(true);
    const res = await searchChineseDictionary(zhQuery);
    setZhResults(res);
    setZhSearching(false);
  };

  const handleAddFromZhDict = (entry: ChineseDictEntry) => {
    const zhDeck =
      (activeDeck?.language === 'zh' ? activeDeck : undefined) ||
      decks.find((d) => d.language === 'zh') ||
      decks[0];
    if (!zhDeck) return;
    onAddWord({
      deckId: zhDeck.id,
      language: 'zh',
      term: entry.term,
      phonetic: entry.phonetic,
      sinoVietnamese: entry.sinoVietnamese,
      radical: entry.radical,
      partOfSpeech: entry.partOfSpeech,
      meaning: entry.meaning,
      notes: entry.notes,
      collocations: entry.collocations,
      examples: entry.examples,
      synonyms: entry.synonyms,
      bloomLevel: 1,
    });
    setImportFeedback(`Đã thêm từ tiếng Trung "${entry.term}" (${entry.phonetic}) vào bộ ${zhDeck.name}.`);
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) {
      setFormError('Vui lòng nhập tên bộ từ vựng.');
      return;
    }
    const newId = onCreateDeck({
      name: deckName.trim(),
      description: deckDesc.trim() || 'Danh sách từ vựng cá nhân tùy chỉnh.',
      language: deckLang,
      category: deckCategory.trim() || 'Cá nhân',
    });
    setSelectedDeckId(newId);
    setDeckName('');
    setDeckDesc('');
    setFormError(null);
    setShowNewDeckModal(false);
  };

  const handleAddWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordTerm.trim() || !wordMeaning.trim()) {
      setFormError('Vui lòng nhập đầy đủ Từ vựng và Nghĩa tiếng Việt.');
      return;
    }
    const targetDeckId = activeDeck ? activeDeck.id : decks[0]?.id;
    const targetLang = activeDeck ? activeDeck.language : 'zh';
    if (!targetDeckId) {
      setFormError('Hãy tạo một bộ từ vựng trước khi thêm từ.');
      return;
    }

    const cleanTerm = wordTerm.trim();
    const fallbackPhonetic = /[\u4e00-\u9fff]/.test(cleanTerm) ? '' : `/${cleanTerm}/`;

    onAddWord({
      deckId: targetDeckId,
      language: targetLang,
      term: cleanTerm,
      phonetic: wordPhonetic.trim() || fallbackPhonetic,
      sinoVietnamese: wordSinoVi.trim() || undefined,
      partOfSpeech: wordPos.trim() || 'n',
      meaning: wordMeaning.trim(),
      notes: wordNotes.trim() || undefined,
      collocations: wordCollocation.trim()
        ? [{ phrase: wordCollocation.trim(), meaning: wordCollocationMeaning.trim() || wordMeaning.trim() }]
        : [],
      examples: wordExample.trim()
        ? [{ sentence: wordExample.trim(), translation: wordTranslation.trim() || wordMeaning.trim() }]
        : [],
      synonyms: wordSynonyms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      bloomLevel: 1,
    });

    setWordTerm('');
    setWordPhonetic('');
    setWordSinoVi('');
    setWordMeaning('');
    setWordNotes('');
    setWordCollocation('');
    setWordCollocationMeaning('');
    setWordExample('');
    setWordTranslation('');
    setWordSynonyms('');
    setFormError(null);
    setShowAddWordModal(false);
  };

  const handleExportDeck = () => {
    const payload = visibleWords.map((w) => ({
      term: w.term,
      phonetic: w.phonetic,
      sinoVietnamese: w.sinoVietnamese || '',
      partOfSpeech: w.partOfSpeech,
      meaning: w.meaning,
      collocation: w.collocations[0]?.phrase || '',
      example: w.examples[0]?.sentence || '',
      translation: w.examples[0]?.translation || '',
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDeck ? activeDeck.id : 'all-vocab'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setImportFeedback('File JSON cần là một mảng các đối tượng từ vựng.');
        return;
      }
      const targetDeckId = activeDeck ? activeDeck.id : decks[0]?.id;
      if (!targetDeckId) return;
      const count = onImportWordsJson(targetDeckId, parsed);
      setImportFeedback(`Đã nhập thành công ${count} từ vựng vào bộ hiện tại.`);
    } catch {
      setImportFeedback('Không thể đọc file JSON. Vui lòng kiểm tra định dạng.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Bộ Từ Vựng HSK 1-2 &amp; Từ Điển Trung-Việt</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Lộ trình 8 chuyên đề HSK 1–2 khoa học kèm cách dùng chi tiết, bộ thủ, Pinyin, Hán-Việt và ví dụ đa ngữ cảnh.
          </p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenZhDict}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            style={{
              borderColor: 'var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <BookOpenCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Tra từ điển Trung-Việt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowNewDeckModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            style={{
              borderColor: 'var(--border-hairline)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Tạo bộ từ mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowAddWordModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {importFeedback && (
        <div
          className="rounded-xl border px-4 py-2.5 text-xs flex items-center justify-between"
          style={{
            backgroundColor: 'var(--accent-soft)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--accent-text)',
          }}
        >
          <span>{importFeedback}</span>
          <button type="button" onClick={() => setImportFeedback(null)} aria-label="Đóng thông báo" className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split: Decks Sidebar + Words List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Decks Column */}
        <div
          className="lg:col-span-4 rounded-2xl border p-4 space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          {/* Level Filter Segmented Strip */}
          <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'hsk1', label: 'HSK 1' },
                { id: 'hsk2', label: 'HSK 2' },
                { id: 'custom', label: 'Cá nhân' },
              ] as const
            ).map((tab) => {
              const active = deckLevelFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setDeckLevelFilter(tab.id);
                    if (tab.id === 'all') return;
                    const firstMatch =
                      tab.id === 'hsk1'
                        ? decks.find((d) => d.category.startsWith('HSK 1'))
                        : tab.id === 'hsk2'
                          ? decks.find((d) => d.category.startsWith('HSK 2'))
                          : decks.find((d) => d.isCustom);
                    setSelectedDeckId(firstMatch ? firstMatch.id : 'all');
                  }}
                  className="rounded-lg py-1.5 text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedDeckId('all')}
            className="w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between"
            style={{
              backgroundColor: selectedDeckId === 'all' ? 'var(--accent-soft)' : 'transparent',
              color: selectedDeckId === 'all' ? 'var(--accent-text)' : 'var(--text-primary)',
            }}
          >
            <span>Tất cả thẻ trong nhóm</span>
            <span className="font-mono tabular-nums">
              {words.filter((w) => filteredDecks.some((d) => d.id === w.deckId)).length}
            </span>
          </button>

          {filteredDecks.length === 0 ? (
            <p className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Chưa có bộ từ cá nhân nào. Hãy bấm “Tạo bộ từ mới”.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {filteredDecks.map((deck) => {
                const count = words.filter((w) => w.deckId === deck.id).length;
                const active = selectedDeckId === deck.id;
                return (
                  <div
                    key={deck.id}
                    className="py-1.5 flex items-center justify-between gap-2"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDeckId(deck.id)}
                      className="flex-1 text-left rounded-xl px-3 py-2 transition-colors cursor-pointer min-w-0"
                      style={{
                        backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                        color: active ? 'var(--accent-text)' : 'var(--text-primary)',
                      }}
                    >
                      <div className="text-xs font-semibold truncate">{deck.name}</div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {deck.category} · {LANGUAGE_LABELS[deck.language].name} · {count} thẻ
                      </div>
                    </button>
                    {deck.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteDeck(deck.id);
                          if (selectedDeckId === deck.id) setSelectedDeckId('all');
                        }}
                        aria-label={`Xóa bộ từ ${deck.name}`}
                        className="p-2 rounded-lg hover:text-rose-500 cursor-pointer shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Words Table / List */}
        <div
          className="lg:col-span-8 rounded-2xl border p-5 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              className="flex-1 flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ vựng, Pinyin, âm Hán-Việt hoặc nghĩa..."
                className="w-full bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleExportDeck}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất JSON</span>
              </button>

              {activeDeck && (
                <button
                  type="button"
                  onClick={() => onStartDeckStudy(activeDeck.id)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Học bộ này
                </button>
              )}
            </div>
          </div>

          {visibleWords.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Chưa có từ vựng nào khớp với bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => setShowAddWordModal(true)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Thêm từ đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {visibleWords.map((w) => {
                const retention = Math.round(calculateRetentionProbability(w) * 100);
                return (
                  <div
                    key={w.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <button
                          type="button"
                          onClick={() => speakPronunciation(w.term, w.language, speechRate)}
                          aria-label={`Phát âm ${w.term}`}
                          className="inline-flex items-center gap-1.5 font-display text-base font-bold hover:underline cursor-pointer"
                        >
                          <span>{w.term}</span>
                          <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        </button>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {w.phonetic}
                        </span>
                        {w.sinoVietnamese && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                            · {w.sinoVietnamese}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          · {w.partOfSpeech}
                        </span>
                      </div>

                      <div className="text-sm font-medium">{w.meaning}</div>

                      {w.radical && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Bộ thủ: {w.radical}
                        </div>
                      )}

                      {w.notes && (
                        <div
                          className="mt-1 rounded-lg px-2.5 py-1.5 text-xs leading-relaxed"
                          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                        >
                          <strong style={{ color: 'var(--text-primary)' }}>Cách dùng:</strong> {w.notes}
                        </div>
                      )}

                      {w.collocations.length > 0 && (
                        <div className="text-xs pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Cụm từ:{' '}
                          {w.collocations.map((c, idx) => (
                            <span key={idx}>
                              {idx > 0 ? ' · ' : ''}
                              <strong>{c.phrase}</strong> ({c.meaning})
                            </span>
                          ))}
                        </div>
                      )}

                      {w.examples.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          {w.examples.map((ex, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  speakPronunciation(stripTrailingPinyin(ex.sentence), w.language, speechRate)
                                }
                                aria-label={`Phát âm ví dụ ${idx + 1} của ${w.term}`}
                                className="mt-0.5 shrink-0 cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="min-w-0">
                                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {ex.sentence}
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>{ex.translation}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        Bloom {w.bloomLevel} ({BLOOM_META[w.bloomLevel].nameVi}) · Nhớ {retention}%
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Chu kỳ {w.srs.intervalDays > 0 ? formatIntervalVi(w.srs.intervalDays) : 'Chưa học'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteWord(w.id)}
                          aria-label={`Xóa từ ${w.term}`}
                          className="p-1.5 rounded-md hover:text-rose-500 cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Chinese-Vietnamese Hanzii-format Dictionary Lookup */}
      <AnimatePresence>
        {showZhDictModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-label="Tra cứu từ điển Trung-Việt"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-2xl rounded-2xl border p-6 space-y-4 shadow-2xl my-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Tra cứu Từ điển Trung - Việt (Hanzii Format)</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Tra theo Hán tự, Pinyin, Âm Hán-Việt hoặc tiếng Việt rồi thêm trực tiếp vào bộ Tiếng Trung.
                </p>
              </div>
              <button type="button" onClick={() => setShowZhDictModal(false)} aria-label="Đóng" className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchZhDict} className="flex gap-2">
              <input
                type="text"
                value={zhQuery}
                onChange={(e) => setZhQuery(e.target.value)}
                placeholder="Nhập chữ Hán (学习), Pinyin (xuexi) hoặc nghĩa Việt (thành công)..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
              />
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {zhSearching ? 'Đang tra...' : 'Tra cứu'}
              </button>
            </form>

            <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {zhResults.length === 0 ? (
                <p className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Không tìm thấy kết quả phù hợp.
                </p>
              ) : (
                zhResults.map((entry, idx) => (
                  <div
                    key={`${entry.term}-${idx}`}
                    className="py-3 flex items-start justify-between gap-4"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <button
                          type="button"
                          onClick={() => speakPronunciation(entry.term, 'zh', speechRate)}
                          className="inline-flex items-center gap-1 font-display text-lg font-bold cursor-pointer hover:underline"
                        >
                          <span>{entry.term}</span>
                          <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        </button>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {entry.phonetic}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                          · {entry.sinoVietnamese}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{entry.meaning}</div>
                      {entry.radical && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Bộ thủ: {entry.radical}
                        </div>
                      )}
                      {entry.examples[0] && (
                        <div className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                          {entry.examples[0].sentence}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromZhDict(entry)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer shrink-0"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        backgroundColor: 'var(--bg-canvas)',
                      }}
                    >
                      + Thêm vào bộ
                    </button>
                  </div>
                ))
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create Custom Deck */}
      <AnimatePresence>
        {showNewDeckModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              role="dialog"
              aria-label="Tạo bộ từ vựng mới"
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
              <h2 className="font-display text-lg font-bold">Tạo bộ từ vựng cá nhân</h2>
              <button type="button" onClick={() => setShowNewDeckModal(false)} aria-label="Đóng" className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDeckSubmit} className="space-y-3">
              <div>
                <label htmlFor="new-deck-name" className="block text-xs font-medium mb-1">
                  Tên bộ từ *
                </label>
                <input
                  id="new-deck-name"
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Ví dụ: IELTS Speaking hoặc HSK 4 Giao tiếp"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-deck-lang" className="block text-xs font-medium mb-1">
                    Ngôn ngữ
                  </label>
                  <select
                    id="new-deck-lang"
                    value={deckLang}
                    onChange={(e) => setDeckLang(e.target.value as LanguageCode)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-deck-cat" className="block text-xs font-medium mb-1">
                    Phân loại
                  </label>
                  <input
                    id="new-deck-cat"
                    type="text"
                    value={deckCategory}
                    onChange={(e) => setDeckCategory(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-deck-desc" className="block text-xs font-medium mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  id="new-deck-desc"
                  rows={2}
                  value={deckDesc}
                  onChange={(e) => setDeckDesc(e.target.value)}
                  placeholder="Mục tiêu sử dụng của bộ từ này..."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDeckModal(false)}
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
                  Tạo bộ từ
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add Word */}
      <AnimatePresence>
        {showAddWordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-label="Thêm từ vựng mới"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl my-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                Thêm từ vào: {activeDeck ? activeDeck.name : decks[0]?.name}
              </h2>
              <button type="button" onClick={() => setShowAddWordModal(false)} aria-label="Đóng" className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWordSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-term" className="block text-xs font-medium mb-1">
                    Từ vựng (Chữ Hán) *
                  </label>
                  <input
                    id="add-term"
                    type="text"
                    value={wordTerm}
                    onChange={(e) => setWordTerm(e.target.value)}
                    placeholder="Ví dụ: 坚持"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
                <div>
                  <label htmlFor="add-phonetic" className="block text-xs font-medium mb-1">
                    Phiên âm (Pinyin)
                  </label>
                  <input
                    id="add-phonetic"
                    type="text"
                    value={wordPhonetic}
                    onChange={(e) => setWordPhonetic(e.target.value)}
                    placeholder="jiānchí"
                    className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="add-meaning" className="block text-xs font-medium mb-1">
                    Nghĩa tiếng Việt *
                  </label>
                  <input
                    id="add-meaning"
                    type="text"
                    value={wordMeaning}
                    onChange={(e) => setWordMeaning(e.target.value)}
                    placeholder="kiên trì, giữ vững"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
                <div>
                  <label htmlFor="add-pos" className="block text-xs font-medium mb-1">
                    Từ loại
                  </label>
                  <input
                    id="add-pos"
                    type="text"
                    value={wordPos}
                    onChange={(e) => setWordPos(e.target.value)}
                    placeholder="Động từ"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="add-sinovi" className="block text-xs font-medium mb-1">
                  Âm Hán-Việt
                </label>
                <input
                  id="add-sinovi"
                  type="text"
                  value={wordSinoVi}
                  onChange={(e) => setWordSinoVi(e.target.value)}
                  placeholder="Ví dụ: KIÊN TRÌ"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div>
                <label htmlFor="add-notes" className="block text-xs font-medium mb-1">
                  Cách dùng &amp; Ngữ pháp
                </label>
                <input
                  id="add-notes"
                  type="text"
                  value={wordNotes}
                  onChange={(e) => setWordNotes(e.target.value)}
                  placeholder="Thường đứng trước động từ: 坚持 + V (kiên trì làm gì)."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-col" className="block text-xs font-medium mb-1">
                    Cụm từ đi kèm (Collocation)
                  </label>
                  <input
                    id="add-col"
                    type="text"
                    value={wordCollocation}
                    onChange={(e) => setWordCollocation(e.target.value)}
                    placeholder="坚持学习"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
                <div>
                  <label htmlFor="add-col-vi" className="block text-xs font-medium mb-1">
                    Nghĩa cụm từ
                  </label>
                  <input
                    id="add-col-vi"
                    type="text"
                    value={wordCollocationMeaning}
                    onChange={(e) => setWordCollocationMeaning(e.target.value)}
                    placeholder="kiên trì học tập"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="add-example" className="block text-xs font-medium mb-1">
                  Câu ví dụ
                </label>
                <input
                  id="add-example"
                  type="text"
                  value={wordExample}
                  onChange={(e) => setWordExample(e.target.value)}
                  placeholder="她每天坚持练习写汉字。"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div>
                <label htmlFor="add-trans" className="block text-xs font-medium mb-1">
                  Dịch nghĩa câu ví dụ
                </label>
                <input
                  id="add-trans"
                  type="text"
                  value={wordTranslation}
                  onChange={(e) => setWordTranslation(e.target.value)}
                  placeholder="Cô ấy mỗi ngày đều kiên trì luyện viết chữ Hán."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div>
                <label htmlFor="add-syn" className="block text-xs font-medium mb-1">
                  Từ đồng nghĩa (phân tách bằng dấu phẩy)
                </label>
                <input
                  id="add-syn"
                  type="text"
                  value={wordSynonyms}
                  onChange={(e) => setWordSynonyms(e.target.value)}
                  placeholder="保持, 持续"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(false)}
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
                  Lưu từ vựng
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
