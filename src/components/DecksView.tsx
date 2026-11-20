import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { HskEdition, LanguageCode, VocabDeck, VocabWord } from '../types/vocab';
import { HSK1_COURSES } from '../../Chinese/hsk1Courses';
import { LANGUAGE_LABELS } from '../data/seedVocab';
import { BLOOM_META, calculateRetentionProbability, formatIntervalVi } from '../utils/srsBloom';
import { stripTrailingPinyin } from '../utils/studyPlan';
import { getDeckStudyLevel, getStudyLevels } from '../utils/studyScope';
import { speakPronunciation } from '../utils/soundEngine';
import { type ChineseDictEntry, searchChineseDictionary } from '../utils/chineseDict';
import { compactPhonetic, searchable } from '../utils/vocabSearch';

interface ImportedWord {
  term: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  collocation?: string;
  collocationMeaning?: string;
  example?: string;
  translation?: string;
}

const WORDS_PER_PAGE = 40;

const WORD_FORM_EXAMPLES: Partial<Record<LanguageCode, {
  term: string;
  phonetic: string;
  meaning: string;
  notes: string;
  phrase: string;
  phraseMeaning: string;
  sentence: string;
  translation: string;
}>> = {
  zh: {
    term: '坚持', phonetic: 'jiānchí', meaning: 'kiên trì', notes: 'Đặt trước động từ.',
    phrase: '坚持学习', phraseMeaning: 'kiên trì học tập', sentence: '她每天坚持练习写汉字。',
    translation: 'Cô ấy kiên trì luyện viết chữ Hán mỗi ngày.',
  },
  en: {
    term: 'progress', phonetic: '/ˈprɑːɡres/', meaning: 'sự tiến bộ', notes: 'Danh từ này thường được dùng với make.',
    phrase: 'make progress', phraseMeaning: 'có tiến bộ', sentence: 'We make progress when we practice every day.',
    translation: 'Chúng ta tiến bộ khi luyện tập mỗi ngày.',
  },
};

interface DecksViewProps {
  decks: VocabDeck[];
  words: VocabWord[];
  language: LanguageCode;
  hskEdition: HskEdition;
  levels: ReturnType<typeof getStudyLevels>;
  activeLevel: string;
  onChangeLevel: (level: string) => void;
  speechRate: number;
  showExamplePhonetic?: boolean;
  onToggleExamplePhonetic?: () => void;
  onCreateDeck: (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => string;
  onDeleteDeck: (deckId: string) => void;
  onAddWord: (word: Omit<VocabWord, 'id' | 'createdAt' | 'srs'>) => void;
  onDeleteWord: (wordId: string) => void;
  onStartDeckStudy: (deckId: string) => void;
  onImportWordsJson: (deckId: string, items: ImportedWord[]) => number;
}

export const DecksView: React.FC<DecksViewProps> = ({
  decks,
  words,
  language,
  hskEdition,
  levels,
  activeLevel,
  onChangeLevel,
  speechRate,
  showExamplePhonetic = true,
  onToggleExamplePhonetic,
  onCreateDeck,
  onDeleteDeck,
  onAddWord,
  onDeleteWord,
  onStartDeckStudy,
  onImportWordsJson,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState(() => decks.find((deck) => deck.hskEdition)?.id ?? decks[0]?.id ?? 'all');
  const [deckQuery, setDeckQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const wordScroll = useRef<HTMLDivElement>(null);
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
  const [deckLang, setDeckLang] = useState(language);
  const [deckLevel, setDeckLevel] = useState(activeLevel === 'all' ? 'custom' : activeLevel);
  const [deckCategory, setDeckCategory] = useState('Cá nhân');

  // New Word Form State
  const [wordTerm, setWordTerm] = useState('');
  const [wordPhonetic, setWordPhonetic] = useState('');
  const [wordSinoVi, setWordSinoVi] = useState('');
  const [wordPos, setWordPos] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordNotes, setWordNotes] = useState('');
  const [wordCollocation, setWordCollocation] = useState('');
  const [wordCollocationMeaning, setWordCollocationMeaning] = useState('');
  const [wordExample, setWordExample] = useState('');
  const [wordTranslation, setWordTranslation] = useState('');
  const [wordSynonyms, setWordSynonyms] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const topics = useMemo(() => [...new Set(decks.map(({ category }) => category))]
    .filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')), [decks]);
  const topic = topics.includes(topicFilter) ? topicFilter : '';
  const filteredDecks = useMemo(() => {
    const q = searchable(deckQuery);
    return decks.filter((deck) => {
      const level = levels.find(({ id }) => id === getDeckStudyLevel(deck))?.label ?? '';
      return (!topic || deck.category === topic) && (!q || searchable(`${deck.name} ${deck.category} ${deck.description} ${level}`).includes(q));
    });
  }, [decks, deckQuery, topic, levels]);
  const filteredWords = useMemo(() => {
    const ids = new Set(filteredDecks.map(({ id }) => id));
    return words.filter(({ deckId }) => ids.has(deckId));
  }, [words, filteredDecks]);
  const activeDeck = filteredDecks.find((d) => d.id === selectedDeckId) ?? null;
  const targetDeck = activeDeck ?? filteredDecks[0] ?? decks[0];
  const inputExamples = WORD_FORM_EXAMPLES[targetDeck?.language ?? language];
  const zhDeck = targetDeck?.language === 'zh' ? targetDeck : undefined;
  const creationLevels = (deckLang === language ? levels : getStudyLevels(deckLang, decks))
    .filter(({ id }) => id !== 'all' && id !== 'custom');
  const textbook = language === 'zh' ? HSK1_COURSES[hskEdition] : undefined;

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { deckId } of words) counts.set(deckId, (counts.get(deckId) ?? 0) + 1);
    return counts;
  }, [words]);

  const visibleWords = useMemo(() => {
    const base = activeDeck ? filteredWords.filter((word) => word.deckId === activeDeck.id) : filteredWords;
    const q = searchable(searchQuery);
    if (!q) return base;
    const phoneticQuery = compactPhonetic(q);
    return base.filter(
      (w) =>
        searchable(w.term).includes(q) ||
        (phoneticQuery && compactPhonetic(w.phonetic).includes(phoneticQuery)) ||
        searchable(w.meaning).includes(q) ||
        (w.sinoVietnamese && searchable(w.sinoVietnamese).includes(q)) ||
        w.collocations.some((c) => searchable(c.phrase).includes(q) || searchable(c.meaning).includes(q)),
    ).sort((a, b) => Number(searchable(b.term) === q) - Number(searchable(a.term) === q));
  }, [filteredWords, activeDeck, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(visibleWords.length / WORDS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * WORDS_PER_PAGE;
  const pageWords = visibleWords.slice(pageStart, pageStart + WORDS_PER_PAGE);

  useEffect(() => {
    if (wordScroll.current) wordScroll.current.scrollTop = 0;
  }, [activeDeck?.id, activeLevel, currentPage, deckQuery, searchQuery, topic]);

  const selectDeck = (id: string) => {
    setSelectedDeckId(id);
    setPage(1);
  };

  const openCreateDeck = () => {
    setFormError(null);
    setDeckLang(language);
    setDeckLevel(activeLevel === 'all' ? 'custom' : activeLevel);
    setShowNewDeckModal(true);
  };

  const openAddWord = () => {
    setFormError(null);
    setShowAddWordModal(true);
  };

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
      description: deckDesc.trim(),
      language: deckLang,
      level: deckLevel === 'custom' ? undefined : deckLevel,
      category: deckCategory.trim() || 'Cá nhân',
    });
    setDeckQuery('');
    setTopicFilter('');
    setSearchQuery('');
    selectDeck(newId);
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
    if (!targetDeck) {
      setFormError('Hãy tạo một bộ từ vựng trước khi thêm từ.');
      return;
    }

    onAddWord({
      deckId: targetDeck.id,
      language: targetDeck.language,
      term: wordTerm.trim(),
      phonetic: wordPhonetic.trim(),
      sinoVietnamese: targetDeck.language === 'zh' ? wordSinoVi.trim() || undefined : undefined,
      partOfSpeech: wordPos.trim() || 'Từ / cụm từ',
      meaning: wordMeaning.trim(),
      notes: wordNotes.trim() || undefined,
      collocations: wordCollocation.trim()
        ? [{ phrase: wordCollocation.trim(), meaning: wordCollocationMeaning.trim() }]
        : [],
      examples: wordExample.trim()
        ? [{ sentence: wordExample.trim(), translation: wordTranslation.trim() }]
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
    setWordPos('');
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
      collocationMeaning: w.collocations[0]?.meaning || '',
      example: w.examples[0]?.sentence || '',
      examplePhonetic: w.examples[0]?.phonetic || '',
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
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !activeDeck) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setImportFeedback('File JSON cần là một mảng các đối tượng từ vựng.');
        return;
      }
      const count = onImportWordsJson(activeDeck.id, parsed);
      setImportFeedback(`Đã nhập ${count} từ vựng vào bộ ${activeDeck.name}.`);
    } catch {
      setImportFeedback('Không thể đọc file JSON. Vui lòng kiểm tra định dạng.');
    } finally {
      input.value = '';
    }
  };

  return (
    <div className="deck-library">
      <div className="deck-library-heading">
        <div className="page-intro min-w-0">
          <h1>Bộ từ vựng</h1>
          <p>{textbook ? (
            <a className="text-button" href={textbook.source} target="_blank" rel="noreferrer">{textbook.book}</a>
          ) : LANGUAGE_LABELS[language].name}</p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
          {language === 'zh' && (
            <button type="button" onClick={handleOpenZhDict} className="button-secondary">
              <BookOpenCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Từ điển Trung–Việt</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateDeck}
            className="button-secondary"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Tạo bộ từ</span>
          </button>

          <button
            type="button"
            onClick={openAddWord}
            className="button-primary"
            disabled={!targetDeck}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ vào bộ</span>
          </button>
        </div>
      </div>

      {importFeedback && (
        <div
          role="status"
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

      <div className="deck-workspace">
        <aside className="glass-panel deck-directory" aria-label="Danh mục bộ thẻ">
          <div className="deck-directory-controls">
            <button type="button" className="deck-picker deck-picker-all" onClick={() => selectDeck('all')} aria-pressed={!activeDeck}>
              <span>Tất cả thẻ trong phạm vi</span>
              <span className="deck-card-count">{filteredWords.length}</span>
            </button>
            <label className="deck-search">
              <Search size={16} aria-hidden="true" />
              <input type="search" aria-label="Tìm bộ từ" placeholder="Tìm bài học hoặc bộ từ…" value={deckQuery}
                onChange={(event) => { setDeckQuery(event.target.value); setPage(1); }} />
            </label>
            <div className="deck-filters">
              <label>
                <span>Cấp độ</span>
                <select value={activeLevel} onChange={(event) => { onChangeLevel(event.target.value); selectDeck('all'); }}>
                  {levels.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Chủ đề</span>
                <select value={topic} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }}>
                  <option value="">Tất cả chủ đề</option>
                  {topics.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="deck-directory-list" tabIndex={0} role="region" aria-label="Danh sách bài học và bộ từ">
            {filteredDecks.map((deck) => (
              <div className="deck-list-item" key={deck.id}>
                <button type="button" className="deck-picker" onClick={() => selectDeck(deck.id)} aria-pressed={activeDeck?.id === deck.id}>
                  <span>{deck.name}</span>
                  <span className="deck-card-count">{deckCounts.get(deck.id) ?? 0} thẻ</span>
                </button>
                {deck.isCustom && (
                  <button type="button" onClick={() => {
                    onDeleteDeck(deck.id);
                    if (selectedDeckId === deck.id) selectDeck('all');
                  }} aria-label={`Xóa bộ từ ${deck.name}`} className="deck-delete">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {!filteredDecks.length && <p className="panel-empty">Không có bộ từ phù hợp.</p>}
          </div>
        </aside>

        <section className="glass-panel deck-content" aria-labelledby="deck-content-title">
          <div className="deck-content-controls">
            <div className="deck-content-heading">
              <div>
                <h2 id="deck-content-title">{activeDeck?.name ?? 'Thẻ trong phạm vi'}</h2>
                {activeDeck?.description && <p>{activeDeck.description}</p>}
              </div>
              {activeDeck && (
                <button type="button" onClick={() => onStartDeckStudy(activeDeck.id)} className="button-primary"
                  disabled={!deckCounts.get(activeDeck.id)}>
                  {activeDeck.hskEdition ? 'Học bài này' : 'Học bộ này'}
                </button>
              )}
            </div>
            <div className="deck-content-tools">
              <label className="deck-search">
                <Search size={16} aria-hidden="true" />
                <input type="search" aria-label="Tìm trong bộ từ vựng" value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                  placeholder={language === 'zh' ? 'Từ, pinyin hoặc nghĩa…' : 'Từ, cụm từ hoặc nghĩa…'} />
              </label>
              {language === 'zh' && onToggleExamplePhonetic && (
                <button type="button" className="button-secondary" aria-pressed={showExamplePhonetic} onClick={onToggleExamplePhonetic}>
                  {showExamplePhonetic ? 'Ẩn pinyin ví dụ' : 'Hiện pinyin ví dụ'}
                </button>
              )}
              <label className={`button-secondary deck-import${activeDeck ? '' : ' opacity-50'}`}
                title={activeDeck ? 'Nhập vào bộ ' + activeDeck.name : 'Chọn một bộ từ để nhập'}>
                <Upload size={14} aria-hidden="true" /> Nhập JSON
                <input type="file" accept=".json" disabled={!activeDeck} onChange={handleImportFile} className="sr-only" />
              </label>
              <button type="button" className="button-secondary" onClick={handleExportDeck} disabled={!visibleWords.length}>
                <Download size={14} aria-hidden="true" /> Xuất JSON
              </button>
            </div>

            {pageCount > 1 && (
              <nav aria-label="Phân trang bộ từ" className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }} role="status">
                  {pageStart + 1}–{pageStart + pageWords.length} / {visibleWords.length} thẻ
                </p>
                <div className="flex gap-2">
                  <button type="button" className="button-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                    Trang trước
                  </button>
                  <button type="button" className="button-secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                    Trang sau
                  </button>
                </div>
              </nav>
            )}
          </div>

          <div ref={wordScroll} className="deck-word-list" tabIndex={0} role="region" aria-label="Danh sách thẻ từ vựng">
          {visibleWords.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {!decks.length ? 'Tạo bộ từ để lưu từ và cụm từ bạn muốn học.'
                  : searchQuery.trim() || !filteredDecks.length ? 'Không có kết quả phù hợp.' : 'Bộ từ này đang trống.'}
              </p>
              <button
                type="button"
                onClick={targetDeck ? openAddWord : openCreateDeck}
                className="button-primary"
              >
                {targetDeck ? 'Thêm từ' : 'Tạo bộ từ đầu tiên'}
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {pageWords.map((w) => {
                const retention = w.srs.lastReviewedAt === null ? null : Math.round(calculateRetentionProbability(w) * 100);
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
                          <span lang={w.language}>{w.term}</span>
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
                        {w.partOfSpeech && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            · {w.partOfSpeech}
                          </span>
                        )}
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
                              <strong lang={w.language}>{c.phrase}</strong>{c.meaning && ' (' + c.meaning + ')'}
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
                                  speakPronunciation(w.language === 'zh' ? stripTrailingPinyin(ex.sentence) : ex.sentence, w.language, speechRate)
                                }
                                aria-label={`Phát âm ví dụ ${idx + 1} của ${w.term}`}
                                className="mt-0.5 shrink-0 cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="min-w-0">
                                <div className="font-medium" lang={w.language} style={{ color: 'var(--text-primary)' }}>
                                  {w.language === 'zh' ? stripTrailingPinyin(ex.sentence) : ex.sentence}
                                </div>
                                {showExamplePhonetic && ex.phonetic && (
                                  <div className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                    {ex.phonetic}
                                  </div>
                                )}
                                <div style={{ color: 'var(--text-muted)' }}>{ex.translation}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {retention === null ? 'Chưa học' : 'Bloom ' + w.bloomLevel + ' (' + BLOOM_META[w.bloomLevel].nameVi + ') · Nhớ ' + retention + '%'}
                      </div>
                      <div className="flex items-center gap-2">
                        {w.srs.intervalDays > 0 && (
                          <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            Chu kỳ {formatIntervalVi(w.srs.intervalDays)}
                          </span>
                        )}
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
        </section>
      </div>

      {/* Modal: Chinese-Vietnamese Hanzii-format Dictionary Lookup */}
      <AnimatePresence>
        {language === 'zh' && showZhDictModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-label="Tra cứu từ điển Trung-Việt"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-2xl rounded-2xl border p-6 space-y-4 shadow-2xl my-auto"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Từ điển Trung–Việt</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {zhDeck ? 'Lưu từ vào bộ ' + zhDeck.name : 'Tạo một bộ từ tiếng Trung để lưu kết quả tra cứu.'}
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
                        {entry.sinoVietnamese && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                            · {entry.sinoVietnamese}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{entry.meaning}</div>
                      {entry.radical && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Bộ thủ: {entry.radical}
                        </div>
                      )}
                      {entry.examples[0] && (
                        <div className="space-y-0.5 text-xs">
                          <div className="italic" style={{ color: 'var(--text-secondary)' }}>
                            {entry.examples[0].sentence}
                          </div>
                          {showExamplePhonetic && entry.examples[0].phonetic && (
                            <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {entry.examples[0].phonetic}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromZhDict(entry)}
                      disabled={!zhDeck}
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
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-label="Tạo bộ từ vựng mới"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl my-auto"
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
                  placeholder="Giao tiếp hằng ngày"
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
                    onChange={(e) => {
                      const selectedLanguage = e.target.value as LanguageCode;
                      setDeckLang(selectedLanguage);
                      setDeckLevel(selectedLanguage === language && activeLevel !== 'all' ? activeLevel : 'custom');
                    }}
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
                  <label htmlFor="new-deck-level" className="block text-xs font-medium mb-1">
                    Cấp độ
                  </label>
                  <select
                    id="new-deck-level"
                    value={deckLevel}
                    onChange={(e) => setDeckLevel(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  >
                    <option value="custom">Chưa phân cấp</option>
                    {creationLevels.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="new-deck-category" className="block text-xs font-medium mb-1">
                  Nhóm chủ đề
                </label>
                <input
                  id="new-deck-category"
                  type="text"
                  value={deckCategory}
                  onChange={(event) => setDeckCategory(event.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
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
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-label="Thêm từ vựng mới"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl my-auto"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                Thêm từ vào {targetDeck?.name}
              </h2>
              <button type="button" onClick={() => setShowAddWordModal(false)} aria-label="Đóng" className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWordSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-term" className="block text-xs font-medium mb-1">
                    Từ hoặc cụm từ *
                  </label>
                  <input
                    id="add-term"
                    type="text"
                    value={wordTerm}
                    onChange={(e) => setWordTerm(e.target.value)}
                    placeholder={inputExamples?.term}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
                <div>
                  <label htmlFor="add-phonetic" className="block text-xs font-medium mb-1">
                    {targetDeck?.language === 'zh' ? 'Pinyin' : 'Phiên âm'}
                  </label>
                  <input
                    id="add-phonetic"
                    type="text"
                    value={wordPhonetic}
                    onChange={(e) => setWordPhonetic(e.target.value)}
                    placeholder={inputExamples?.phonetic}
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
                    placeholder={inputExamples?.meaning}
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

              {targetDeck?.language === 'zh' && <div>
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
              </div>}

              <div>
                <label htmlFor="add-notes" className="block text-xs font-medium mb-1">
                  Cách dùng &amp; Ngữ pháp
                </label>
                <input
                  id="add-notes"
                  type="text"
                  value={wordNotes}
                  onChange={(e) => setWordNotes(e.target.value)}
                  placeholder={inputExamples?.notes}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="add-col" className="block text-xs font-medium mb-1">
                    Cụm từ đi kèm
                  </label>
                  <input
                    id="add-col"
                    type="text"
                    value={wordCollocation}
                    onChange={(e) => setWordCollocation(e.target.value)}
                    placeholder={inputExamples?.phrase}
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
                    placeholder={inputExamples?.phraseMeaning}
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
                  placeholder={inputExamples?.sentence}
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
                  placeholder={inputExamples?.translation}
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
