import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Loader2, Quote, Search, Sparkles, X } from 'lucide-react';
import type { CollocationItem, ExampleSentence, VocabDeck, VocabWord } from '../types/vocab';
import {
  buildWordDraftFromDictionary,
  ENGLISH_IDIOM_POS,
  fetchDictionaryEntry,
  fetchDictionaryIdioms,
  IDIOM_DECK_ID,
  IDIOM_DECK_NAME,
  POPULAR_IDIOM_PICKS,
  type DictionaryIdiomMatch,
} from '../utils/dictionaryClient';
import { cambridgeEnViLookupUrl } from '../utils/englishStudy';
import { importExamples, importTerms } from '../utils/vocabImport';
import { EMPTY_EXAMPLES, EMPTY_RELATIONS, ExampleFields, RelationFields } from './WordFormFields';

interface AddIdiomModalProps {
  open: boolean;
  decks: readonly VocabDeck[];
  defaultDeckId?: string;
  onClose: () => void;
  onSaveIdiom: (
    word: Omit<VocabWord, 'id' | 'createdAt' | 'srs'>,
    ensureIdiomDeck: boolean,
  ) => void;
}

const IDIOM_SAMPLE = {
  term: 'break the ice',
  phonetic: '/breɪk ði aɪs/',
  meaning: 'phá vỡ sự ngại ngùng ban đầu, khơi mào cuộc trò chuyện',
  notes: 'Thường dùng khi mới gặp gỡ hoặc mở đầu cuộc họp.',
  phrase: 'help break the ice',
  phraseMeaning: 'giúp làm dịu bầu không khí ban đầu',
  sentence: 'She told a quick joke to break the ice before the meeting.',
  translation: 'Cô ấy kể một câu chuyện vui ngắn để phá vỡ sự ngại ngùng trước cuộc họp.',
};

export const AddIdiomModal: React.FC<AddIdiomModalProps> = ({
  open,
  decks,
  defaultDeckId,
  onClose,
  onSaveIdiom,
}) => {
  const hasIdiomDeck = decks.some((d) => d.id === IDIOM_DECK_ID);
  const idiomDecks = decks.filter((d) => d.collection === 'idioms' || d.isCustom);
  const [targetDeckId, setTargetDeckId] = useState(defaultDeckId || IDIOM_DECK_ID);

  // Engine idiom discovery state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverBusy, setDiscoverBusy] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<DictionaryIdiomMatch[]>([]);
  const [discoverSearched, setDiscoverSearched] = useState(false);

  // Idiom form state
  const [term, setTerm] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [notes, setNotes] = useState('');
  const [collocation, setCollocation] = useState('');
  const [collocationMeaning, setCollocationMeaning] = useState('');
  const [extraCollocations, setExtraCollocations] = useState<CollocationItem[]>([]);
  const [examples, setExamples] = useState<readonly ExampleSentence[]>(EMPTY_EXAMPLES);
  const [relations, setRelations] = useState(EMPTY_RELATIONS);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupStatus, setLookupStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTargetDeckId(defaultDeckId || IDIOM_DECK_ID);
    setError(null);
  }, [open, defaultDeckId]);

  useEffect(() => {
    if (!open) return;
    const clean = discoverQuery.trim();
    if (clean.length < 2) {
      setDiscoverResults([]);
      setDiscoverSearched(false);
      setDiscoverBusy(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDiscoverBusy(true);
      fetchDictionaryIdioms(clean, controller.signal, 10)
        .then((items) => {
          setDiscoverResults(items);
          setDiscoverSearched(true);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setDiscoverBusy(false);
        });
    }, 260);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, discoverQuery]);

  const resetForm = () => {
    setDiscoverQuery('');
    setDiscoverResults([]);
    setDiscoverSearched(false);
    setTerm('');
    setPhonetic('');
    setMeaning('');
    setNotes('');
    setCollocation('');
    setCollocationMeaning('');
    setExtraCollocations([]);
    setExamples(EMPTY_EXAMPLES);
    setRelations(EMPTY_RELATIONS);
    setLookupStatus('');
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleAutofill = async (overrideTerm?: string) => {
    const clean = (overrideTerm ?? term).trim();
    if (!clean) {
      setError('Hãy nhập thành ngữ tiếng Anh trước khi tra tự động.');
      return;
    }
    setTerm(clean);
    setLookupBusy(true);
    setLookupStatus('');
    setError(null);
    try {
      const result = await fetchDictionaryEntry(clean);
      if (result.status === 'not_found') {
        setError(result.message);
        return;
      }
      const draft = buildWordDraftFromDictionary(result, 0);
      setTerm(draft.term);
      setPhonetic(draft.phonetic);
      setMeaning(draft.meaning);
      setNotes(draft.notes);
      setCollocation(draft.collocation);
      setCollocationMeaning(draft.collocationMeaning);
      setExtraCollocations(draft.extraCollocations);
      setExamples(draft.examples);
      setRelations({ synonyms: draft.synonyms, antonyms: draft.antonyms });
      setLookupStatus(`Đã điền tự động cho thành ngữ “${draft.term}”`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chưa thể tra thành ngữ trực tuyến lúc này.');
    } finally {
      setLookupBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) {
      setError('Vui lòng nhập đầy đủ Thành ngữ và Nghĩa tiếng Việt.');
      return;
    }

    const collocations: CollocationItem[] = [
      ...(collocation.trim()
        ? [{ phrase: collocation.trim(), meaning: collocationMeaning.trim() }]
        : []),
      ...extraCollocations.filter(
        (item) =>
          item.phrase.trim() &&
          item.phrase.trim().toLowerCase() !== collocation.trim().toLowerCase(),
      ),
    ];

    const ensureIdiomDeck = targetDeckId === IDIOM_DECK_ID && !hasIdiomDeck;
    onSaveIdiom(
      {
        deckId: targetDeckId || IDIOM_DECK_ID,
        language: 'en',
        term: term.trim(),
        phonetic: phonetic.trim(),
        partOfSpeech: ENGLISH_IDIOM_POS,
        meaning: meaning.trim(),
        notes: notes.trim() || undefined,
        collocations,
        examples: importExamples(examples) ?? [],
        synonyms: importTerms(relations.synonyms),
        antonyms: importTerms(relations.antonyms),
        bloomLevel: 1,
      },
      ensureIdiomDeck,
    );

    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-idiom-title"
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Quote size={18} aria-hidden="true" style={{ color: 'var(--accent-primary)' }} />
                <h2 id="add-idiom-title" className="font-display text-lg font-bold">
                  Thêm thành ngữ (Idiom)
                </h2>
              </div>
              <button type="button" onClick={handleClose} aria-label="Đóng" className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="idiom-discover-box">
              <label htmlFor="idiom-discover-input" className="block text-xs font-medium mb-1.5">
                Tìm thành ngữ theo từ khóa bằng từ điển
              </label>
              <div className="idiom-discover-input-wrap">
                <Search size={15} aria-hidden="true" />
                <input
                  id="idiom-discover-input"
                  type="search"
                  lang="en"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="Nhập từ khóa (vd: ice, time, hand, rain, heart)…"
                  className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
                {discoverBusy && <Loader2 size={14} className="spin-icon idiom-discover-spinner" aria-hidden="true" />}
              </div>

              {discoverResults.length > 0 ? (
                <div className="idiom-chip-list" role="list" aria-label="Kết quả tìm thành ngữ">
                  {discoverResults.map((item) => (
                    <button
                      key={item.term}
                      type="button"
                      role="listitem"
                      className="lookup-chip idiom-chip"
                      disabled={lookupBusy}
                      onClick={() => void handleAutofill(item.term)}
                      title={`Tra và điền tự động cho “${item.term}”`}
                    >
                      <span lang="en">{item.term}</span>
                    </button>
                  ))}
                </div>
              ) : discoverSearched && !discoverBusy ? (
                <p className="text-xs opacity-75 mt-2">
                  Chưa thấy thành ngữ khớp từ khóa này — bạn vẫn có thể nhập trực tiếp bên dưới.
                </p>
              ) : (
                <div className="idiom-popular-wrap">
                  <span className="lookup-section-label">Thành ngữ phổ biến · bấm để tra &amp; điền</span>
                  <div className="idiom-chip-list">
                    {POPULAR_IDIOM_PICKS.slice(0, 6).map((pick) => (
                      <button
                        key={pick}
                        type="button"
                        className="lookup-chip idiom-chip"
                        disabled={lookupBusy}
                        onClick={() => void handleAutofill(pick)}
                      >
                        <span lang="en">{pick}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="idiom-deck" className="block text-xs font-medium mb-1">
                  Lưu vào bộ từ
                </label>
                <select
                  id="idiom-deck"
                  value={targetDeckId}
                  onChange={(e) => setTargetDeckId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                >
                  {!hasIdiomDeck && (
                    <option value={IDIOM_DECK_ID}>{IDIOM_DECK_NAME} (Tạo mới)</option>
                  )}
                  {idiomDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="idiom-term" className="block text-xs font-medium mb-1">
                  Thành ngữ (tiếng Anh) *
                </label>
                <div className="quick-add-term-row">
                  <input
                    id="idiom-term"
                    type="text"
                    lang="en"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={IDIOM_SAMPLE.term}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                  <button
                    type="button"
                    className="button-secondary quick-add-autofill"
                    onClick={() => void handleAutofill()}
                    disabled={!term.trim() || lookupBusy}
                    title="Tra nghĩa và ví dụ tự động cho thành ngữ"
                  >
                    {lookupBusy
                      ? <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                      : <Sparkles size={15} aria-hidden="true" />}
                    <span>Tra &amp; điền</span>
                  </button>
                </div>
              </div>

              {lookupStatus && (
                <div className="quick-add-lookup-banner" role="status">
                  <span>{lookupStatus}</span>
                  <a
                    href={cambridgeEnViLookupUrl(term.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-button"
                  >
                    Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              )}

              <div>
                <label htmlFor="idiom-meaning" className="block text-xs font-medium mb-1">
                  Nghĩa tiếng Việt (nghĩa bóng / sắc thái) *
                </label>
                <input
                  id="idiom-meaning"
                  type="text"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder={IDIOM_SAMPLE.meaning}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="idiom-phonetic" className="block text-xs font-medium mb-1">
                    Phiên âm (không bắt buộc)
                  </label>
                  <input
                    id="idiom-phonetic"
                    type="text"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder={IDIOM_SAMPLE.phonetic}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
                <div>
                  <label htmlFor="idiom-notes" className="block text-xs font-medium mb-1">
                    Ngữ cảnh &amp; sắc thái dùng
                  </label>
                  <input
                    id="idiom-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={IDIOM_SAMPLE.notes}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <ExampleFields
                values={examples}
                onChange={setExamples}
                language="en"
                sample={IDIOM_SAMPLE}
              />
              <RelationFields value={relations} onChange={setRelations} />

              {error && <p className="text-xs text-rose-500" role="alert">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
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
                  Lưu thành ngữ
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
