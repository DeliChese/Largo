import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Loader2, Search, Sparkles, X } from 'lucide-react';
import type { EnglishLocale, VocabWord } from '../types/vocab';
import { compactPhonetic, searchable } from '../utils/vocabSearch';
import {
  cambridgeEnViLookupUrl,
  cambridgeLookupUrl,
  DEFAULT_ENGLISH_LOCALE,
  ENGLISH_LOCALE_LABEL,
  getEnglishStudyWord,
} from '../utils/englishStudy';
import {
  buildLocalLookupResult,
  fetchDictionaryEntry,
  fetchDictionarySuggestions,
  safeExternalUrl,
  type DictionaryLookupResult,
  type DictionaryNotFoundResult,
  type DictionarySuggestion,
  type DictionaryWordDraft,
} from '../utils/dictionaryClient';
import { EnglishPronunciation, EnglishVariantDetails } from './EnglishVariantDetails';
import { DictionaryEntryCard } from './DictionaryEntryCard';

interface WordLookupProps {
  words: VocabWord[];
  allWords: VocabWord[];
  speechRate: number;
  isOnline: boolean;
  onSaveDraft: (draft: DictionaryWordDraft) => void;
}

interface LookupMatch {
  id: string;
  language: VocabWord['language'];
  term: string;
  phonetic: string;
  meaning: string;
  partOfSpeech?: string;
  topCollocation?: VocabWord['collocations'][number];
  englishLocale?: EnglishLocale;
  sourceWord?: VocabWord;
  rank: number;
}

const ENGLISH_QUERY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s'’.-]{0,79}$/;

export function WordLookup({ words, allWords, speechRate, isOnline, onSaveDraft }: WordLookupProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DictionarySuggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [lookupResult, setLookupResult] = useState<DictionaryLookupResult | DictionaryNotFoundResult | null>(null);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [selectedSenseIndex, setSelectedSenseIndex] = useState(0);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lookupAbort = useRef<AbortController | null>(null);
  const q = searchable(query);
  const trimmedQuery = query.trim();
  const canLookupOnline = isOnline && trimmedQuery.length >= 1 && ENGLISH_QUERY_PATTERN.test(trimmedQuery) && /[A-Za-z]/.test(trimmedQuery);

  const matches = useMemo(() => {
    if (!q) return [];
    const includesQuery = (text: string) => searchable(text).includes(q);
    const phoneticQuery = compactPhonetic(q);
    const alternateLocale = 'en-GB';
    return words.flatMap<LookupMatch>((storedWord) => {
      const word = getEnglishStudyWord(storedWord, DEFAULT_ENGLISH_LOCALE);
      const { id, language, term, phonetic, meaning, partOfSpeech, collocations } = word;
      const topCollocation = collocations[0];
      const match = { id, language, term, phonetic, meaning, partOfSpeech, topCollocation, sourceWord: storedWord };
      if (searchable(term) === q) return [{ ...match, rank: 0 }];

      const alternate = storedWord.englishForms && getEnglishStudyWord(storedWord, alternateLocale);
      if (alternate && searchable(alternate.term) === q) {
        return [{ ...alternate, englishLocale: alternateLocale, topCollocation: alternate.collocations[0], sourceWord: storedWord, rank: 0 }];
      }
      const exactPhrase = collocations.find((item) => searchable(item.phrase) === q);
      const alternatePhrase = alternate?.collocations.find((item) => searchable(item.phrase) === q);
      if (exactPhrase || alternatePhrase) {
        const phrase = exactPhrase ?? alternatePhrase!;
        return [{
          id, language, term: phrase.phrase, phonetic: '', meaning: phrase.meaning, partOfSpeech: 'Cụm từ',
          englishLocale: exactPhrase ? undefined : alternateLocale, rank: 1,
        }];
      }

      const phoneticMatch = phoneticQuery && compactPhonetic(phonetic).includes(phoneticQuery);
      if (phoneticMatch || [term, meaning].some(includesQuery)) {
        return [{ ...match, rank: 2 }];
      }
      if (alternate && (includesQuery(alternate.term) ||
        (phoneticQuery && compactPhonetic(alternate.phonetic).includes(phoneticQuery)))) {
        return [{ ...alternate, englishLocale: alternateLocale, topCollocation: alternate.collocations[0], sourceWord: storedWord, rank: 2 }];
      }
      const phrase = collocations.find((item) => includesQuery(item.phrase) || includesQuery(item.meaning));
      return phrase ? [{ id, language, term: phrase.phrase, phonetic: '', meaning: phrase.meaning, partOfSpeech: 'Cụm từ', rank: 3 }] : [];
    }).sort((a, b) => a.rank - b.rank).slice(0, 6);
  }, [words, q]);

  useEffect(() => {
    if (!open || !canLookupOnline || trimmedQuery.length < 2) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingSuggest(true);
      fetchDictionarySuggestions(trimmedQuery, controller.signal)
        .then((items) => setSuggestions(items))
        .catch(() => {})
        .finally(() => setLoadingSuggest(false));
    }, 240);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, canLookupOnline, trimmedQuery]);

  useEffect(() => {
    if (open) input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' &&
        !document.querySelector('dialog[open], [aria-modal="true"]:not(dialog)')) {
        event.preventDefault();
        if (open) trigger.current?.focus();
        setOpen(!open);
      } else if (event.key === 'Escape' && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    if (open) window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  useEffect(() => () => lookupAbort.current?.abort(), []);

  const findLocalWord = (term: string) => {
    const key = searchable(term);
    return allWords.find((w) =>
      searchable(w.term) === key ||
      (w.englishForms?.['en-GB']?.term && searchable(w.englishForms['en-GB'].term) === key) ||
      (w.englishForms?.['en-US']?.term && searchable(w.englishForms['en-US'].term) === key),
    );
  };

  const runOnlineLookup = async (rawTerm: string, { pushCurrentToHistory = false }: { pushCurrentToHistory?: boolean } = {}) => {
    const clean = rawTerm.trim();
    if (!clean || !ENGLISH_QUERY_PATTERN.test(clean) || !/[A-Za-z]/.test(clean)) {
      setLookupError('Nhập từ hoặc cụm từ tiếng Anh để tra từ điển trực tuyến.');
      return;
    }

    if (pushCurrentToHistory && lookupResult?.status === 'ok' && lookupResult.term.toLowerCase() !== clean.toLowerCase()) {
      setHistoryStack((prev) => [...prev.slice(-6), lookupResult.term]);
    } else if (!pushCurrentToHistory) {
      setHistoryStack([]);
    }

    const localFallback = findLocalWord(clean);
    if (!isOnline) {
      if (localFallback) {
        setLookupError('');
        setSelectedSenseIndex(0);
        setLookupResult(buildLocalLookupResult(localFallback, allWords));
      } else {
        setLookupError('Đang ngoại tuyến — chỉ tra được kho từ đã lưu trên máy.');
      }
      return;
    }

    lookupAbort.current?.abort();
    const controller = new AbortController();
    lookupAbort.current = controller;
    setLookupLoading(true);
    setLookupError('');
    setSelectedSenseIndex(0);
    try {
      const entry = await fetchDictionaryEntry(clean, controller.signal);
      if (entry.status === 'not_found' && localFallback) {
        setLookupResult(buildLocalLookupResult(localFallback, allWords));
      } else {
        setLookupResult(entry);
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (localFallback) {
        setLookupResult(buildLocalLookupResult(localFallback, allWords));
      } else {
        setLookupResult(null);
        setLookupError(error instanceof Error ? error.message : 'Chưa thể tra từ điển trực tuyến lúc này.');
      }
    } finally {
      if (!controller.signal.aborted) setLookupLoading(false);
    }
  };

  const handleInspectFamilyTerm = (term: string) => {
    setQuery(term);
    void runOnlineLookup(term, { pushCurrentToHistory: true });
  };

  const handleBackHistory = () => {
    const previous = historyStack[historyStack.length - 1];
    if (!previous) return;
    setHistoryStack((prev) => prev.slice(0, -1));
    setQuery(previous);
    void runOnlineLookup(previous, { pushCurrentToHistory: false });
  };

  const handleSaveDraft = (draft: DictionaryWordDraft) => {
    setOpen(false);
    onSaveDraft(draft);
  };

  const activeEntry = lookupResult?.status === 'ok' ? lookupResult : null;
  const previousTerm = historyStack[historyStack.length - 1];

  return (
    <div className="lookup-wrap" ref={container}>
      <button type="button" ref={trigger} className="lookup-trigger icon-button" aria-label="Tra từ"
        title="Tra từ và cụm từ (Ctrl + K)" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Search size={18} aria-hidden="true" />
        <span>Tra từ</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={'header-popover glass-panel lookup-panel' + (activeEntry ? ' is-expanded' : '')}
            role="dialog"
            aria-label="Tra từ vựng"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.16 }}
          >
            <div className="popover-heading">
              <h2>Tra từ & từ điển</h2>
              <button type="button" className="icon-button" aria-label="Đóng tra từ"
                onClick={() => { setOpen(false); trigger.current?.focus(); }}>
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <form
              className="lookup-search-row"
              onSubmit={(event) => {
                event.preventDefault();
                void runOnlineLookup(query);
              }}
            >
              <label htmlFor="lookup-search" className="sr-only">Tìm từ, cụm từ, phiên âm hoặc nghĩa</label>
              <input
                id="lookup-search"
                type="search"
                ref={input}
                value={query}
                placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt…"
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  setLookupError('');
                  if (!next.trim()) {
                    setLookupResult(null);
                    setHistoryStack([]);
                  }
                }}
              />
              <button
                type="submit"
                className="button-primary lookup-submit"
                disabled={!canLookupOnline || lookupLoading}
                title={isOnline ? 'Tra trực tuyến (Wiktionary · Free Dictionary · Tatoeba / FluentDict)' : 'Cần kết nối mạng'}
              >
                {lookupLoading
                  ? <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                  : <Sparkles size={15} aria-hidden="true" />}
                <span>Tra online</span>
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="lookup-suggestions" aria-label="Gợi ý từ điển trực tuyến">
                <span className="lookup-section-label">
                  {loadingSuggest ? 'Đang gợi ý…' : 'Gợi ý từ điển'}
                </span>
                <div className="lookup-suggestion-chips">
                  {suggestions.slice(0, 6).map((item) => (
                    <button
                      key={item.term}
                      type="button"
                      className="lookup-chip"
                      onClick={() => {
                        setQuery(item.term);
                        void runOnlineLookup(item.term);
                      }}
                    >
                      <span lang="en">{item.term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lookupError && <p className="form-error lookup-status" role="alert">{lookupError}</p>}

            {activeEntry && (
              <DictionaryEntryCard
                entry={activeEntry}
                allWords={allWords}
                selectedSenseIndex={selectedSenseIndex}
                onSelectSense={setSelectedSenseIndex}
                speechRate={speechRate}
                onSaveDraft={handleSaveDraft}
                onInspectTerm={handleInspectFamilyTerm}
                previousTerm={previousTerm}
                onBack={handleBackHistory}
              />
            )}

            {lookupResult?.status === 'not_found' && (
              <div className="lookup-not-found" role="status">
                <p>{lookupResult.message}</p>
                <div className="lookup-ext-links">
                  {safeExternalUrl(lookupResult.links.cambridgeEnVi) && (
                    <a href={lookupResult.links.cambridgeEnVi} target="_blank" rel="noopener noreferrer" className="text-button">
                      Tra Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                  {safeExternalUrl(lookupResult.links.cambridgeEn) && (
                    <a href={lookupResult.links.cambridgeEn} target="_blank" rel="noopener noreferrer" className="text-button">
                      Tra Cambridge EN <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {matches.length > 0 && (
              <div className="lookup-local-block">
                <span className="lookup-section-label">Trong kho Largo ({matches.length})</span>
                <ul className="lookup-results">
                  {matches.map((word) => (
                    <li key={word.id + ':' + word.term}>
                      <div>
                        <div className="lookup-term-line">
                          <strong lang={word.englishLocale ?? word.language}>{word.term}</strong>
                          {word.phonetic && <span className="lookup-phonetic">{word.phonetic}</span>}
                          {word.englishLocale && <span className="lookup-pos">{ENGLISH_LOCALE_LABEL[word.englishLocale]}</span>}
                        </div>
                        {word.partOfSpeech && <span className="lookup-pos">{word.partOfSpeech}</span>}
                        <p>{word.meaning}</p>
                        {word.topCollocation && (
                          <p className="lookup-collocation">
                            {'Cụm · '}
                            <span lang={word.language}>{word.topCollocation.phrase}</span>
                            {word.topCollocation.meaning ? ` (${word.topCollocation.meaning})` : ''}
                          </p>
                        )}
                      </div>
                      {word.sourceWord
                        ? <EnglishVariantDetails word={word.sourceWord} speechRate={speechRate} />
                        : <EnglishPronunciation text={word.term} speechRate={speechRate} />}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {q && matches.length === 0 && !activeEntry && !lookupLoading && lookupResult?.status !== 'not_found' && (
              <div className="lookup-empty-hint" role="status">
                <p className="panel-empty">Chưa có trong cấp độ hiện tại.</p>
                {canLookupOnline && (
                  <div className="lookup-ext-links">
                    <button type="button" className="text-button" onClick={() => void runOnlineLookup(query)}>
                      Tra từ điển trực tuyến cho “{trimmedQuery}”
                    </button>
                    <a href={cambridgeEnViLookupUrl(trimmedQuery)} target="_blank" rel="noopener noreferrer" className="text-button">
                      Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    <a href={cambridgeLookupUrl(trimmedQuery)} target="_blank" rel="noopener noreferrer" className="text-button">
                      Cambridge EN <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
