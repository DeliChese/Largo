import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Volume2, X } from 'lucide-react';
import type { VocabWord } from '../types/vocab';
import { speakPronunciation } from '../utils/soundEngine';

interface WordLookupProps {
  words: VocabWord[];
  speechRate: number;
}

function searchable(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

export function WordLookup({ words, speechRate }: WordLookupProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const q = searchable(query);

  const matches = useMemo(() => {
    if (!q) return [];
    const includesQuery = (text: string) => searchable(text).includes(q);
    return words.flatMap((word) => {
      const { id, language, term, phonetic, meaning } = word;
      const phraseMatch = word.collocations.find((item) => searchable(item.phrase) === q);
      if (!phraseMatch && [term, phonetic, meaning, word.sinoVietnamese ?? ''].some(includesQuery)) {
        return [{ id, language, term, phonetic, meaning }];
      }
      const phrase = phraseMatch ?? word.collocations.find((item) => includesQuery(item.phrase) || includesQuery(item.meaning));
      return phrase ? [{ id, language, term: phrase.phrase, phonetic: '', meaning: phrase.meaning }] : [];
    }).slice(0, 8);
  }, [words, q]);

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

  return (
    <div className="lookup-wrap" ref={container}>
      <button type="button" ref={trigger} className="lookup-trigger icon-button" aria-label="Tra từ"
        title="Tra từ và cụm từ (Ctrl + K)" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Search size={18} aria-hidden="true" />
        <span>Tra từ</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="header-popover glass-panel lookup-panel" role="dialog" aria-label="Tra từ vựng"
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
            <div className="popover-heading">
              <h2>Tra từ và cụm từ</h2>
              <button type="button" className="icon-button" aria-label="Đóng tra từ" onClick={() => { setOpen(false); trigger.current?.focus(); }}>
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="lookup-search" className="sr-only">Tìm từ, cụm từ, phiên âm hoặc nghĩa</label>
            <input id="lookup-search" type="search" ref={input} value={query} placeholder="Từ, cụm từ, phiên âm hoặc nghĩa…" onChange={(event) => setQuery(event.target.value)} />
            {matches.length > 0 && (
              <ul className="lookup-results">
                {matches.map((word) => (
                  <li key={word.id}>
                    <div>
                      <strong lang={word.language}>{word.term}</strong>{word.phonetic && <span> {word.phonetic}</span>}
                      <p>{word.meaning}</p>
                    </div>
                    <button type="button" className="icon-button" onClick={() => speakPronunciation(word.term, word.language, speechRate)} aria-label={'Nghe ' + word.term}>
                      <Volume2 size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {q && matches.length === 0 && <p className="panel-empty" role="status">Chưa có kết quả ở ngôn ngữ và cấp độ này.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
