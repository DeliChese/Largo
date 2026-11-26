import { useMemo } from 'react';
import { ArrowLeft, BookmarkPlus, Check, ExternalLink } from 'lucide-react';
import type { VocabWord, WordFamilyItem } from '../types/vocab';
import {
  buildWordDraftFromDictionary,
  getMergedWordFamily,
  safeExternalUrl,
  type DictionaryLookupResult,
  type DictionaryWordDraft,
} from '../utils/dictionaryClient';
import { searchable } from '../utils/vocabSearch';
import { EnglishPronunciation } from './EnglishVariantDetails';

interface DictionaryEntryCardProps {
  entry: DictionaryLookupResult;
  allWords: readonly VocabWord[];
  selectedSenseIndex: number;
  onSelectSense: (index: number) => void;
  speechRate: number;
  onSaveDraft: (draft: DictionaryWordDraft) => void;
  onInspectTerm?: (term: string) => void;
  previousTerm?: string;
  onBack?: () => void;
}

export function DictionaryEntryCard({
  entry,
  allWords,
  selectedSenseIndex,
  onSelectSense,
  speechRate,
  onSaveDraft,
  onInspectTerm,
  previousTerm,
  onBack,
}: DictionaryEntryCardProps) {
  const activeSense = entry.senses[selectedSenseIndex] ?? entry.senses[0];

  const isAlreadyInLibrary = useMemo(() => {
    const target = searchable(entry.term);
    return allWords.some((word) =>
      searchable(word.term) === target ||
      (word.englishForms?.['en-GB']?.term && searchable(word.englishForms['en-GB'].term) === target) ||
      (word.englishForms?.['en-US']?.term && searchable(word.englishForms['en-US'].term) === target),
    );
  }, [allWords, entry.term]);

  const activeExamples = useMemo(() => {
    const senseExamples = activeSense?.examples ?? [];
    const sourcePool = entry.senses.length > 1 && senseExamples.length > 0
      ? senseExamples
      : [...senseExamples, ...entry.examples];
    const seen = new Set<string>();
    const bilingual = [];
    const englishOnly = [];
    for (const ex of sourcePool) {
      const key = ex.sentence.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (ex.translation.trim()) bilingual.push(ex);
      else englishOnly.push(ex);
    }
    return [...bilingual, ...englishOnly].slice(0, 4);
  }, [entry.examples, entry.senses.length, activeSense]);

  const activeCollocations = useMemo(() => {
    const senseCollocs = activeSense?.collocations ?? [];
    const sourcePool = entry.senses.length > 1
      ? senseCollocs
      : [...senseCollocs, ...entry.collocations];
    const seen = new Set<string>();
    const list = [];
    for (const item of sourcePool) {
      const key = item.phrase.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push(item);
      if (list.length >= 4) break;
    }
    return list;
  }, [entry.collocations, entry.senses.length, activeSense]);

  const activeSynonyms = useMemo(() => {
    const senseList = activeSense?.synonyms ?? [];
    return (senseList.length > 0 ? senseList : entry.synonyms).slice(0, 5);
  }, [activeSense?.synonyms, entry.synonyms]);

  const activeAntonyms = useMemo(() => {
    const senseList = activeSense?.antonyms ?? [];
    return (senseList.length > 0 ? senseList : entry.antonyms).slice(0, 5);
  }, [activeSense?.antonyms, entry.antonyms]);

  const wordFamily: WordFamilyItem[] = useMemo(
    () => getMergedWordFamily({ term: entry.term, wordFamily: entry.wordFamily }, allWords),
    [entry.term, entry.wordFamily, allWords],
  );

  const relatedIdioms = entry.relatedIdioms ?? [];
  const isIdiomEntry = Boolean(entry.isIdiom || activeSense?.partOfSpeech === 'Thành ngữ');

  const handleSave = () => {
    const enrichedEntry: DictionaryLookupResult = {
      ...entry,
      wordFamily,
    };
    onSaveDraft(buildWordDraftFromDictionary(enrichedEntry, selectedSenseIndex));
  };

  return (
    <section className="lookup-dict-card" aria-label={`Kết quả từ điển cho ${entry.term}`}>
      {previousTerm && onBack && (
        <button type="button" className="text-button lookup-back-btn" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Quay lại <strong lang="en">{previousTerm}</strong></span>
        </button>
      )}

      <header className="lookup-dict-head">
        <div>
          <div className="lookup-term-line">
            <strong lang="en">{entry.term}</strong>
            {isIdiomEntry && (
              <span className="lookup-idiom-badge">Thành ngữ</span>
            )}
            {isAlreadyInLibrary && (
              <span className="lookup-saved-badge">
                <Check size={12} aria-hidden="true" /> Đã có trong kho
              </span>
            )}
          </div>
          <div className="lookup-ipa-row">
            {entry.englishForms?.['en-US']?.phonetic && (
              <span className="lookup-phonetic">US {entry.englishForms['en-US'].phonetic}</span>
            )}
            {entry.englishForms?.['en-GB']?.phonetic &&
              entry.englishForms['en-GB'].phonetic !== entry.englishForms?.['en-US']?.phonetic && (
              <span className="lookup-phonetic">UK {entry.englishForms['en-GB'].phonetic}</span>
            )}
            {!entry.englishForms?.['en-US']?.phonetic && entry.phonetic && (
              <span className="lookup-phonetic">{entry.phonetic}</span>
            )}
          </div>
        </div>
        <EnglishPronunciation text={entry.term} speechRate={speechRate} />
      </header>

      {entry.inflectionNote && (
        <p className="lookup-inflection-note">{entry.inflectionNote}</p>
      )}

      {entry.senses.length > 1 && (
        <div className="lookup-sense-tabs" role="tablist" aria-label="Chọn từ loại để xem và lưu">
          {entry.senses.map((sense, index) => (
            <button
              key={sense.partOfSpeech + '-' + index}
              type="button"
              role="tab"
              aria-selected={index === selectedSenseIndex}
              className={'lookup-sense-tab' + (index === selectedSenseIndex ? ' is-active' : '')}
              onClick={() => onSelectSense(index)}
            >
              {sense.partOfSpeech}
            </button>
          ))}
        </div>
      )}

      {activeSense && (
        <div className="lookup-sense-body">
          {entry.senses.length === 1 && (
            <span className="lookup-pos">{activeSense.partOfSpeech}</span>
          )}
          <p className="lookup-dict-meaning">{activeSense.meaning}</p>
          {activeSense.englishDefinition && activeSense.englishDefinition !== activeSense.meaning && (
            <p className="lookup-dict-en-def" lang="en">{activeSense.englishDefinition}</p>
          )}
        </div>
      )}

      {activeCollocations.length > 0 && (
        <div className="lookup-dict-block">
          <span className="lookup-section-label">Cụm từ đi kèm</span>
          <ul className="lookup-mini-list">
            {activeCollocations.map((item, idx) => (
              <li key={idx}>
                <strong lang="en">{item.phrase}</strong>
                {item.meaning ? ` · ${item.meaning}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeExamples.length > 0 && (
        <div className="lookup-dict-block">
          <span className="lookup-section-label">Ví dụ ({activeExamples.length})</span>
          <ul className="lookup-dict-examples">
            {activeExamples.map((ex, idx) => (
              <li key={idx}>
                <div>
                  <p lang="en" className="lookup-ex-en">{ex.sentence}</p>
                  {ex.translation && <p className="lookup-ex-vi">{ex.translation}</p>}
                </div>
                <EnglishPronunciation text={ex.sentence} speechRate={speechRate} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {wordFamily.length > 0 && (
        <div className="lookup-dict-block">
          <span className="lookup-section-label">Gia đình từ ({wordFamily.length})</span>
          <div className="word-family-chips" role="list" aria-label={`Gia đình từ của ${entry.term}`}>
            {wordFamily.map((member) => (
              <button
                key={member.term}
                type="button"
                role="listitem"
                className="word-family-chip"
                title={member.meaning ? `${member.term} (${member.partOfSpeech}): ${member.meaning} — Bấm để xem chi tiết` : `Xem chi tiết từ ${member.term} (${member.partOfSpeech})`}
                onClick={() => onInspectTerm?.(member.term)}
              >
                <span className="word-family-term" lang="en">{member.term}</span>
                <span className="word-family-pos">{member.partOfSpeech}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {relatedIdioms.length > 0 && (
        <div className="lookup-dict-block">
          <span className="lookup-section-label">Thành ngữ liên quan ({relatedIdioms.length})</span>
          <div className="word-family-chips" role="list" aria-label={`Thành ngữ liên quan tới ${entry.term}`}>
            {relatedIdioms.map((idiom) => (
              <button
                key={idiom}
                type="button"
                role="listitem"
                className="word-family-chip idiom-related-chip"
                title={`Xem chi tiết thành ngữ “${idiom}”`}
                onClick={() => onInspectTerm?.(idiom)}
              >
                <span className="word-family-term" lang="en">{idiom}</span>
                <span className="word-family-pos">Thành ngữ</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(activeSynonyms.length > 0 || activeAntonyms.length > 0) && (
        <div className="lookup-dict-relations">
          {activeSynonyms.length > 0 && (
            <p><span>Đồng nghĩa:</span> <span lang="en">{activeSynonyms.join(', ')}</span></p>
          )}
          {activeAntonyms.length > 0 && (
            <p><span>Trái nghĩa:</span> <span lang="en">{activeAntonyms.join(', ')}</span></p>
          )}
        </div>
      )}

      {entry.providers.length > 0 && (
        <p className="lookup-provider-footer">
          {'Nguồn tham khảo: '}
          {entry.providers.map((provider, idx) => {
            const href = safeExternalUrl(provider.url);
            return (
              <span key={provider.id}>
                {idx > 0 ? ' · ' : ''}
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 hover:opacity-80">
                    {provider.name}
                  </a>
                ) : (
                  provider.name
                )}
              </span>
            );
          })}
        </p>
      )}

      <div className="lookup-dict-actions">
        <button type="button" className="button-primary" onClick={handleSave}>
          <BookmarkPlus size={15} aria-hidden="true" />
          <span>{isIdiomEntry ? 'Lưu thành ngữ…' : 'Lưu vào bộ từ…'}</span>
        </button>
        <div className="lookup-ext-links">
          {safeExternalUrl(entry.links.cambridgeEnVi) && (
            <a href={entry.links.cambridgeEnVi} target="_blank" rel="noopener noreferrer" className="text-button">
              Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
          {safeExternalUrl(entry.links.cambridgeEn) && (
            <a href={entry.links.cambridgeEn} target="_blank" rel="noopener noreferrer" className="text-button">
              Cambridge EN <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
