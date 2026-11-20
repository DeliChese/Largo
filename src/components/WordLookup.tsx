import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Volume2, X } from 'lucide-react';
import type { EnglishLocale, VocabWord } from '../types/vocab';
import { speakPronunciation } from '../utils/soundEngine';
import { compactPhonetic, searchable } from '../utils/vocabSearch';
import { ENGLISH_LOCALE_LABEL, getEnglishStudyWord } from '../utils/englishStudy';

interface WordLookupProps {
  words: VocabWord[];
  englishLocale: EnglishLocale;
  speechRate: number;
}

interface LookupMatch {
  id: string;
  language: VocabWord['language'];
  term: string;
  phonetic: string;
  meaning: string;
  sinoVietnamese?: string;
  partOfSpeech?: string;
  topCollocation?: VocabWord['collocations'][number];
  englishLocale?: EnglishLocale;
  rank: number;
}

export function WordLookup({ words, englishLocale, speechRate }: WordLookupProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const q = searchable(query);

  const matches = useMemo(() => {
    if (!q) return [];
    const includesQuery = (text: string) => searchable(text).includes(q);
    const phoneticQuery = compactPhonetic(q);
    const alternateLocale = englishLocale === 'en-GB' ? 'en-US' : 'en-GB';
    return words.flatMap<LookupMatch>((storedWord) => {
      const word = getEnglishStudyWord(storedWord, englishLocale);
      const { id, language, term, phonetic, meaning, sinoVietnamese, partOfSpeech, collocations } = word;
      const topCollocation = collocations[0];
      if (searchable(term) === q) return [{ id, language, term, phonetic, meaning, sinoVietnamese, partOfSpeech, topCollocation, rank: 0 }];

      const alternate = storedWord.englishForms && getEnglishStudyWord(storedWord, alternateLocale);
      if (alternate && searchable(alternate.term) === q) {
        return [{ ...alternate, englishLocale: alternateLocale, topCollocation: alternate.collocations[0], rank: 0 }];
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
      if (phoneticMatch || [term, meaning, sinoVietnamese ?? ''].some(includesQuery)) {
        return [{ id, language, term, phonetic, meaning, sinoVietnamese, partOfSpeech, topCollocation, rank: 2 }];
      }
      if (alternate && (includesQuery(alternate.term) ||
        (phoneticQuery && compactPhonetic(alternate.phonetic).includes(phoneticQuery)))) {
        return [{ ...alternate, englishLocale: alternateLocale, topCollocation: alternate.collocations[0], rank: 2 }];
      }
      const phrase = collocations.find((item) => includesQuery(item.phrase) || includesQuery(item.meaning));
      return phrase ? [{ id, language, term: phrase.phrase, phonetic: '', meaning: phrase.meaning, partOfSpeech: 'Cụm từ', rank: 3 }] : [];
    }).sort((a, b) => a.rank - b.rank).slice(0, 8);
  }, [words, q, englishLocale]);

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
                      <div className="lookup-term-line">
                        <strong lang={word.englishLocale ?? word.language}>{word.term}</strong>
                        {word.phonetic && <span className="lookup-phonetic">{word.phonetic}</span>}
                        {word.englishLocale && <span className="lookup-pos">{ENGLISH_LOCALE_LABEL[word.englishLocale]}</span>}
                        {word.sinoVietnamese && <span className="lookup-sv">· {word.sinoVietnamese}</span>}
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
                    <button type="button" className="icon-button" onClick={() => speakPronunciation(word.term, word.englishLocale ?? word.language, speechRate)} aria-label={'Nghe ' + word.term}>
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
