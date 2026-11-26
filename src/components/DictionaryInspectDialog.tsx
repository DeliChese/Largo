import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';
import type { VocabWord } from '../types/vocab';
import {
  buildLocalLookupResult,
  fetchDictionaryEntry,
  safeExternalUrl,
  type DictionaryLookupResult,
  type DictionaryNotFoundResult,
  type DictionaryWordDraft,
} from '../utils/dictionaryClient';
import { searchable } from '../utils/vocabSearch';
import { DictionaryEntryCard } from './DictionaryEntryCard';

interface DictionaryInspectDialogProps {
  term: string | null;
  allWords: readonly VocabWord[];
  speechRate: number;
  isOnline: boolean;
  onClose: () => void;
  onSaveDraft: (draft: DictionaryWordDraft) => void;
}

export function DictionaryInspectDialog({
  term,
  allWords,
  speechRate,
  isOnline,
  onClose,
  onSaveDraft,
}: DictionaryInspectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [activeTerm, setActiveTerm] = useState<string>('');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [result, setResult] = useState<DictionaryLookupResult | DictionaryNotFoundResult | null>(null);
  const [selectedSenseIndex, setSelectedSenseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const findLocalWord = (targetTerm: string) => {
    const key = searchable(targetTerm);
    return allWords.find((w) =>
      searchable(w.term) === key ||
      (w.englishForms?.['en-GB']?.term && searchable(w.englishForms['en-GB'].term) === key) ||
      (w.englishForms?.['en-US']?.term && searchable(w.englishForms['en-US'].term) === key),
    );
  };

  const loadTerm = async (targetTerm: string) => {
    const clean = targetTerm.trim();
    if (!clean) return;
    setActiveTerm(clean);
    setSelectedSenseIndex(0);
    setError('');

    const localMatch = findLocalWord(clean);
    if (localMatch) {
      // Show immediate local data while online lookup enriches examples & word family
      setResult(buildLocalLookupResult(localMatch, allWords));
    } else {
      setResult(null);
    }

    if (!isOnline) {
      if (!localMatch) {
        setError('Đang ngoại tuyến — chưa thể tra trực tuyến cho từ này.');
      }
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const entry = await fetchDictionaryEntry(clean, controller.signal);
      if (entry.status === 'not_found' && localMatch) {
        setResult(buildLocalLookupResult(localMatch, allWords));
      } else {
        setResult(entry);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (!localMatch) {
        setError(err instanceof Error ? err.message : 'Chưa thể tra từ điển trực tuyến lúc này.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (term) {
      if (!dialog?.open) dialog?.showModal();
      setHistoryStack([]);
      void loadTerm(term);
    } else {
      abortRef.current?.abort();
      if (dialog?.open) dialog.close();
      setResult(null);
      setError('');
      setHistoryStack([]);
    }
  }, [term]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleInspectChild = (nextTerm: string) => {
    if (activeTerm && activeTerm.toLowerCase() !== nextTerm.toLowerCase()) {
      setHistoryStack((prev) => [...prev.slice(-6), activeTerm]);
    }
    void loadTerm(nextTerm);
  };

  const handleBack = () => {
    const previous = historyStack[historyStack.length - 1];
    if (!previous) return;
    setHistoryStack((prev) => prev.slice(0, -1));
    void loadTerm(previous);
  };

  const handleSave = (draft: DictionaryWordDraft) => {
    onClose();
    onSaveDraft(draft);
  };

  const activeEntry = result?.status === 'ok' ? result : null;
  const previousTerm = historyStack[historyStack.length - 1];

  return (
    <dialog
      ref={dialogRef}
      className="quick-add-dialog dict-inspect-dialog"
      aria-modal="true"
      aria-labelledby="dict-inspect-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      {term && (
        <div className="quick-add-card glass-panel dict-inspect-card">
          <div className="popover-heading">
            <h2 id="dict-inspect-title">
              Tra chi tiết · <span lang="en">{activeTerm || term}</span>
            </h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng cửa sổ tra từ">
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          {loading && !activeEntry && (
            <div className="dict-inspect-loading" role="status">
              <Loader2 size={18} className="spin-icon" aria-hidden="true" />
              <span>Đang tải đầy đủ nghĩa, phát âm và ví dụ cho “{activeTerm}”…</span>
            </div>
          )}

          {loading && activeEntry && (
            <div className="dict-inspect-loading" role="status">
              <Loader2 size={15} className="spin-icon" aria-hidden="true" />
              <span>Đang đồng bộ thêm ví dụ và gia đình từ trực tuyến…</span>
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          {activeEntry && (
            <DictionaryEntryCard
              entry={activeEntry}
              allWords={allWords}
              selectedSenseIndex={selectedSenseIndex}
              onSelectSense={setSelectedSenseIndex}
              speechRate={speechRate}
              onSaveDraft={handleSave}
              onInspectTerm={handleInspectChild}
              previousTerm={previousTerm}
              onBack={handleBack}
            />
          )}

          {result?.status === 'not_found' && (
            <div className="lookup-not-found" role="status">
              <p>{result.message}</p>
              <div className="lookup-ext-links">
                {safeExternalUrl(result.links.cambridgeEnVi) && (
                  <a href={result.links.cambridgeEnVi} target="_blank" rel="noopener noreferrer" className="text-button">
                    Tra Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
                {safeExternalUrl(result.links.cambridgeEn) && (
                  <a href={result.links.cambridgeEn} target="_blank" rel="noopener noreferrer" className="text-button">
                    Tra Cambridge EN <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
