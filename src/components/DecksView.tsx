import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  FolderPlus,
  LibraryBig,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { CollocationItem, DeckCollection, DeckWordImport, EnglishAdditionalSense, EnglishWordForms, ExampleSentence, LexicalRelations, StudyModeId, VocabDeck, VocabWord, WordFamilyItem } from '../types/vocab';
import { isBuiltinWord } from '../data/seedVocab';
import { ENGLISH_LEGACY_PHRASAL_DUPLICATES } from '../data/englishDecks';
import { BLOOM_META, calculateRetentionProbability, formatIntervalVi } from '../utils/srsBloom';
import { getDeckStudyLevel, getScopedDecks, getScopedWords, getStudyLevels } from '../utils/studyScope';
import { compactPhonetic, searchable } from '../utils/vocabSearch';
import { exportDeckWord, importExamples, importTerms } from '../utils/vocabImport';
import { cambridgeEnViLookupUrl, cambridgeLookupUrl, DEFAULT_ENGLISH_LOCALE, ENGLISH_COLLOCATION_POS, ENGLISH_LOCALES, ENGLISH_LOCALE_LABEL, getEnglishStudyWord } from '../utils/englishStudy';
import { buildWordDraftFromDictionary, fetchDictionaryEntry, getMergedWordFamily } from '../utils/dictionaryClient';
import { EnglishVariantDetails } from './EnglishVariantDetails';
import { EMPTY_EXAMPLES, EMPTY_RELATIONS, ExampleFields, RelationFields } from './WordFormFields';
import { WordRelations } from './WordRelations';
import { WordExamples } from './WordExamples';
import { WordAdditionalSenses } from './WordAdditionalSenses';
import { WordFamilyList } from './WordFamilyList';
import { WordExampleGenerator } from './WordExampleGenerator';
import { describeMastery, type WordMastery } from '../utils/mastery';

const WORDS_PER_PAGE = 24;
const EMPTY_ENGLISH_FORM = { term: '', phonetic: '', examples: EMPTY_EXAMPLES as readonly ExampleSentence[] };

const COLLECTION_LABELS: Record<DeckCollection | 'personal', string> = {
  textbook: 'Giáo trình',
  vocabulary: 'Từ theo chủ đề',
  situations: 'Giao tiếp',
  phrasal: 'Cụm động từ',
  phrases: 'Cụm danh từ và tính từ',
  collocations: 'Collocations',
  regional: 'Anh-Anh / Anh-Mỹ',
  personal: 'Bộ cá nhân',
};

function deckCollection(deck: VocabDeck) {
  return deck.isCustom ? 'personal' : deck.collection ?? 'vocabulary';
}

const ENGLISH_FORM_EXAMPLE = {
  term: 'progress',
  phonetic: '/ˈprɑːɡres/',
  meaning: 'sự tiến bộ',
  notes: 'Danh từ này thường được dùng với make.',
  phrase: 'make progress',
  phraseMeaning: 'có tiến bộ',
  sentence: 'We make progress when we practice every day.',
  translation: 'Chúng ta tiến bộ khi luyện tập mỗi ngày.',
};

interface DecksViewProps {
  decks: VocabDeck[];
  words: VocabWord[];
  masteryByWord: ReadonlyMap<string, WordMastery>;
  levels: ReturnType<typeof getStudyLevels>;
  activeLevel: string;
  onChangeLevel: (level: string) => void;
  speechRate: number;
  onCreateDeck: (deck: Omit<VocabDeck, 'id' | 'createdAt' | 'isCustom'>) => string;
  onDeleteDeck: (deckId: string) => void;
  onAddWord: (word: Omit<VocabWord, 'id' | 'createdAt' | 'srs'>) => void;
  onDeleteWord: (wordId: string, deckId?: string) => void;
  onUpdateWordRelations: (wordId: string, relations: LexicalRelations) => void;
  onStartDeckStudy: (deckId: string, mode: StudyModeId) => void;
  onImportWordsJson: (deckId: string, items: DeckWordImport[]) => number;
  onInspectTerm: (term: string) => void;
}

export const DecksView: React.FC<DecksViewProps> = ({
  decks,
  words,
  masteryByWord,
  levels,
  activeLevel,
  onChangeLevel,
  speechRate,
  onCreateDeck,
  onDeleteDeck,
  onAddWord,
  onDeleteWord,
  onUpdateWordRelations,
  onStartDeckStudy,
  onImportWordsJson,
  onInspectTerm,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [deckQuery, setDeckQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'directory' | 'words'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const wordScroll = useRef<HTMLDivElement>(null);
  const directoryScroll = useRef<HTMLDivElement>(null);
  const wordsHeading = useRef<HTMLHeadingElement>(null);
  const deckSearch = useRef<HTMLInputElement>(null);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // New Deck Form State
  const [deckName, setDeckName] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckLevel, setDeckLevel] = useState(activeLevel === 'all' ? 'custom' : activeLevel);
  const [deckCategory, setDeckCategory] = useState('Cá nhân');

  // New Word Form State
  const [wordTerm, setWordTerm] = useState('');
  const [wordPhonetic, setWordPhonetic] = useState('');
  const [alternateForm, setAlternateForm] = useState(EMPTY_ENGLISH_FORM);
  const [wordIsCollocation, setWordIsCollocation] = useState(false);
  const [wordPos, setWordPos] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordNotes, setWordNotes] = useState('');
  const [wordCollocation, setWordCollocation] = useState('');
  const [wordCollocationMeaning, setWordCollocationMeaning] = useState('');
  const [wordExtraCollocations, setWordExtraCollocations] = useState<CollocationItem[]>([]);
  const [wordExamples, setWordExamples] = useState<readonly ExampleSentence[]>(EMPTY_EXAMPLES);
  const [wordRelations, setWordRelations] = useState(EMPTY_RELATIONS);
  const [wordAdditionalSenses, setWordAdditionalSenses] = useState<EnglishAdditionalSense[]>([]);
  const [wordFamily, setWordFamily] = useState<WordFamilyItem[]>([]);
  const [dictLookupBusy, setDictLookupBusy] = useState(false);
  const [dictLookupStatus, setDictLookupStatus] = useState('');
  const [relationWordId, setRelationWordId] = useState<string>();
  const [relationDraft, setRelationDraft] = useState(EMPTY_RELATIONS);
  const relationDialog = useRef<HTMLDialogElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const collections = useMemo(() => {
    const present = new Set(decks.map(deckCollection));
    return Object.entries(COLLECTION_LABELS).filter(([id]) => present.has(id as DeckCollection | 'personal'));
  }, [decks]);
  const browseLevels = collection
    ? levels.filter(({ id }) => id === 'all' || decks.some((deck) => deckCollection(deck) === collection && getDeckStudyLevel(deck) === id))
    : levels;
  const scopedDecks = useMemo(() => getScopedDecks(decks, 'en', activeLevel), [decks, activeLevel]);
  const filteredDecks = useMemo(() => {
    const terms = searchable(deckQuery).split(' ').filter(Boolean);
    return scopedDecks.filter((deck) => {
      const level = levels.find(({ id }) => id === getDeckStudyLevel(deck))?.label ?? '';
      const text = searchable([deck.name, deck.nativeName, deck.category, deck.description, level, COLLECTION_LABELS[deckCollection(deck)]].join(' '));
      return (!collection || deckCollection(deck) === collection) && terms.every((term) => text.includes(term));
    });
  }, [scopedDecks, collection, deckQuery, levels]);
  const topicGroups = useMemo(() => {
    const topics = new Map<string, VocabDeck[]>();
    for (const deck of filteredDecks) {
      const title = deck.category || COLLECTION_LABELS[deckCollection(deck)];
      const group = topics.get(title);
      if (group) group.push(deck);
      else topics.set(title, [deck]);
    }
    return [...topics];
  }, [filteredDecks]);
  const activeDeck = selectedDeckId === 'all' ? undefined : filteredDecks.find((deck) => deck.id === selectedDeckId) ?? filteredDecks[0];
  const scopeWords = useMemo(() => {
    const scoped = getScopedWords(words, filteredDecks, 'en');
    const ids = new Set(scoped.map(({ id }) => id));
    return scoped.filter(({ id }) => {
      const legacy = ENGLISH_LEGACY_PHRASAL_DUPLICATES.get(id);
      return !legacy || !ids.has(legacy.canonicalId);
    });
  }, [words, filteredDecks]);
  const deckWords = useMemo(() => activeDeck ? getScopedWords(words, [activeDeck], 'en') : scopeWords,
    [activeDeck, scopeWords, words]);
  const targetDeck = activeDeck ?? filteredDecks[0] ?? scopedDecks[0];
  const englishLocale = DEFAULT_ENGLISH_LOCALE;
  const alternateLocale = 'en-GB';
  const creationLevels = levels.filter(({ id }) => id !== 'all' && id !== 'custom');
  const relationWord = relationWordId ? words.find(({ id }) => id === relationWordId) : undefined;

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const byId = new Map<string, string>();
    for (const word of words) {
      if (word.language !== 'en') continue;
      counts.set(word.deckId, (counts.get(word.deckId) ?? 0) + 1);
      byId.set(word.id, word.deckId);
    }
    for (const deck of decks) {
      if (!deck.wordIds) continue;
      const sharedCount = deck.wordIds.filter((id) => byId.has(id) && byId.get(id) !== deck.id).length;
      counts.set(deck.id, (counts.get(deck.id) ?? 0) + sharedCount);
    }
    return counts;
  }, [decks, words]);

  const visibleWords = useMemo(() => {
    const q = searchable(searchQuery);
    if (!q) return deckWords;
    const phoneticQuery = compactPhonetic(q);
    const exactTerm = (word: VocabWord) => searchable(word.term) === q ||
      ENGLISH_LOCALES.some((locale) => searchable(word.englishForms?.[locale]?.term ?? '') === q);
    return deckWords.filter(
      (w) =>
        searchable(w.term).includes(q) ||
        (phoneticQuery && compactPhonetic(w.phonetic).includes(phoneticQuery)) ||
        searchable(w.meaning).includes(q) ||
        searchable(w.notes ?? '').includes(q) ||
        w.additionalSenses?.some(sense => [sense.partOfSpeech, sense.meaning, sense.notes ?? ''].some(value => searchable(value).includes(q))) ||
        [w.synonyms, w.antonyms, w.personalRelations?.synonyms, w.personalRelations?.antonyms]
          .some((terms) => terms?.some((term) => searchable(term).includes(q))) ||
        w.collocations.some((c) => searchable(c.phrase).includes(q) || searchable(c.meaning).includes(q)) ||
        ENGLISH_LOCALES.some((locale) => {
          const form = w.englishForms?.[locale];
          return form && (
            searchable(form.term ?? '').includes(q) ||
            (phoneticQuery && compactPhonetic(form.phonetic ?? '').includes(phoneticQuery)) ||
            form.collocations?.some(({ phrase }) => searchable(phrase).includes(q))
          );
        }),
    ).sort((a, b) => Number(exactTerm(b)) - Number(exactTerm(a)));
  }, [deckWords, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(visibleWords.length / WORDS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * WORDS_PER_PAGE;
  const pageWords = visibleWords.slice(pageStart, pageStart + WORDS_PER_PAGE);

  useEffect(() => {
    if (wordScroll.current) wordScroll.current.scrollTop = 0;
  }, [activeDeck?.id, activeLevel, collection, currentPage, deckQuery, searchQuery]);
  useEffect(() => {
    if (directoryScroll.current) directoryScroll.current.scrollTop = 0;
  }, [activeLevel, collection, deckQuery]);

  const selectDeck = (id: string) => {
    setSelectedDeckId(id);
    setSearchQuery('');
    setPage(1);
    setMobilePanel('words');
    if (window.matchMedia('(max-width: 779px)').matches) {
      requestAnimationFrame(() => wordsHeading.current?.focus());
    }
  };

  const changeCollection = (id: string) => {
    setCollection(id);
    if (id && !scopedDecks.some((deck) => deckCollection(deck) === id)) onChangeLevel('all');
    setSelectedDeckId('');
    setSearchQuery('');
    setPage(1);
    setMobilePanel('directory');
  };

  const changeLibraryLevel = (id: string) => {
    if (id === activeLevel) return;
    if (collection && !decks.some((deck) => deckCollection(deck) === collection && (id === 'all' || getDeckStudyLevel(deck) === id))) {
      setCollection('');
    }
    onChangeLevel(id);
    setSelectedDeckId('');
    setSearchQuery('');
    setPage(1);
  };

  const openRelationEditor = (word: VocabWord) => {
    const relations = isBuiltinWord(word.id) ? word.personalRelations : word;
    setRelationDraft({
      synonyms: relations?.synonyms?.join(', ') ?? '',
      antonyms: relations?.antonyms?.join(', ') ?? '',
    });
    setRelationWordId(word.id);
    relationDialog.current?.showModal();
  };

  const openCreateDeck = () => {
    setFormError(null);
    setDeckLevel(activeLevel === 'all' ? 'custom' : activeLevel);
    setShowNewDeckModal(true);
  };

  const openAddWord = () => {
    setFormError(null);
    setDictLookupStatus('');
    setShowAddWordModal(true);
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
      language: 'en',
      level: deckLevel,
      category: deckCategory.trim() || 'Cá nhân',
    });
    setDeckQuery('');
    setCollection('personal');
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

    const term = wordTerm.trim();
    const phonetic = wordPhonetic.trim();
    const englishForms: EnglishWordForms = {};
    const alternateTerm = alternateForm.term.trim();
    const alternatePhonetic = alternateForm.phonetic.trim();
    const alternateExamples = importExamples(alternateForm.examples) ?? [];
    if (alternateTerm || alternatePhonetic || alternateExamples.length) {
      englishForms[englishLocale] = { term, phonetic: phonetic || undefined };
      englishForms[alternateLocale] = {
        term: alternateTerm || term,
        phonetic: alternatePhonetic || undefined,
        examples: alternateExamples.length ? alternateExamples : undefined,
      };
    } else if (phonetic) {
      englishForms[englishLocale] = { phonetic };
    }
    const collocations: CollocationItem[] = [
      ...(wordCollocation.trim()
        ? [{ phrase: wordCollocation.trim(), meaning: wordCollocationMeaning.trim() }]
        : []),
      ...wordExtraCollocations.filter((item) => item.phrase.trim() &&
        item.phrase.trim().toLowerCase() !== wordCollocation.trim().toLowerCase()),
    ];
    onAddWord({
      deckId: targetDeck.id,
      language: 'en',
      term,
      phonetic,
      ...(Object.keys(englishForms).length > 0 && { englishForms }),
      ...(wordAdditionalSenses.length > 0 && { additionalSenses: wordAdditionalSenses }),
      ...(wordFamily.length > 0 && { wordFamily }),
      partOfSpeech: wordIsCollocation ? ENGLISH_COLLOCATION_POS : wordPos.trim() || 'Từ / cụm từ',
      meaning: wordMeaning.trim(),
      notes: wordNotes.trim() || undefined,
      collocations,
      examples: importExamples(wordExamples) ?? [],
      synonyms: importTerms(wordRelations.synonyms),
      antonyms: importTerms(wordRelations.antonyms),
      bloomLevel: 1,
    });

    setWordTerm('');
    setWordPhonetic('');
    setAlternateForm(EMPTY_ENGLISH_FORM);
    setWordIsCollocation(false);
    setWordPos('');
    setWordMeaning('');
    setWordNotes('');
    setWordCollocation('');
    setWordCollocationMeaning('');
    setWordExtraCollocations([]);
    setWordExamples(EMPTY_EXAMPLES);
    setWordRelations(EMPTY_RELATIONS);
    setWordAdditionalSenses([]);
    setWordFamily([]);
    setDictLookupStatus('');
    setFormError(null);
    setShowAddWordModal(false);
  };

  const handleDeckDictionaryAutofill = async () => {
    const clean = wordTerm.trim();
    if (!clean) {
      setFormError('Hãy nhập từ tiếng Anh trước khi tra tự động.');
      return;
    }
    setDictLookupBusy(true);
    setDictLookupStatus('');
    setFormError(null);
    try {
      const result = await fetchDictionaryEntry(clean);
      if (result.status === 'not_found') {
        setFormError(result.message);
        return;
      }
      const draft = buildWordDraftFromDictionary(result, 0);
      setWordTerm(draft.term);
      setWordPhonetic(draft.phonetic);
      if (draft.ukPhonetic && draft.ukPhonetic !== draft.phonetic) {
        setAlternateForm((current) => ({ ...current, phonetic: draft.ukPhonetic }));
      }
      setWordPos(draft.partOfSpeech);
      setWordMeaning(draft.meaning);
      setWordNotes(draft.notes);
      setWordCollocation(draft.collocation);
      setWordCollocationMeaning(draft.collocationMeaning);
      setWordExtraCollocations(draft.extraCollocations);
      setWordExamples(draft.examples);
      setWordRelations({ synonyms: draft.synonyms, antonyms: draft.antonyms });
      setWordAdditionalSenses(draft.additionalSenses ?? []);
      setWordFamily(draft.wordFamily ?? []);
      setDictLookupStatus(`Đã điền tự động cho “${draft.term}”`);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Chưa thể tra từ điển trực tuyến.');
    } finally {
      setDictLookupBusy(false);
    }
  };

  const handleExportDeck = () => {
    const payload = visibleWords.map(exportDeckWord);
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
    <div className="deck-library" data-mobile-panel={mobilePanel}>
      <div className="deck-library-heading">
        <div className="page-intro min-w-0">
          <h1>Thư viện từ vựng</h1>
          <p>Tiếng Anh · <a className="text-button" href={import.meta.env.BASE_URL + 'english-sources.txt'}
            target="_blank" rel="noreferrer">Nguồn học liệu</a></p>
        </div>

        <div className="deck-library-actions">

          <button
            type="button"
            onClick={openCreateDeck}
            className="button-secondary" aria-label="Tạo bộ từ" title="Tạo bộ từ"
          >
            <FolderPlus size={16} aria-hidden="true" />
            <span>Tạo bộ từ</span>
          </button>
        </div>
      </div>

      {importFeedback && (
        <div className="deck-notice">
          <p role="status">{importFeedback}</p>
          <button type="button" onClick={() => setImportFeedback(null)} aria-label="Đóng thông báo" className="cursor-pointer">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="deck-browse-controls">
        {collections.length > 1 && (
          <div className="deck-filter-bar" role="group" aria-label="Loại bộ từ">
            <button type="button" className="deck-filter" onClick={() => changeCollection('')} aria-pressed={!collection}>Tất cả bộ</button>
            {collections.map(([id, label]) => (
              <button type="button" key={id} className="deck-filter" onClick={() => changeCollection(id)} aria-pressed={collection === id}>{label}</button>
            ))}
          </div>
        )}
        {browseLevels.length > 2 && (
          <div className="deck-filter-bar deck-levels" role="group" aria-label="Lọc cấp độ">
            {browseLevels.map(({ id, label }) => (
              <button type="button" key={id} className="deck-filter" onClick={() => changeLibraryLevel(id)} aria-pressed={activeLevel === id}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="deck-workspace">
        <aside className="glass-panel deck-directory" aria-label="Danh mục bộ thẻ">
          <div className="deck-directory-controls">
            <div className="deck-directory-heading">
              <h2>Chủ đề và bộ thẻ</h2>
              <span>{filteredDecks.length} bộ</span>
            </div>
            <label className="deck-search">
              <Search size={16} aria-hidden="true" />
              <input ref={deckSearch} type="search" aria-label="Tìm bộ từ hoặc chủ đề" placeholder="Tìm bộ từ hoặc chủ đề…" value={deckQuery}
                onChange={(event) => { setDeckQuery(event.target.value); setPage(1); }} />
            </label>
            {filteredDecks.length > 0 && (
              <button type="button" className="deck-picker deck-picker-all" onClick={() => selectDeck('all')} aria-pressed={!activeDeck}>
                <LibraryBig size={16} aria-hidden="true" />
                <span>Tất cả thẻ trong phạm vi</span>
                <span className="deck-card-count">{scopeWords.length.toLocaleString('vi-VN')} thẻ</span>
              </button>
            )}
          </div>

          <div ref={directoryScroll} className="deck-directory-list" tabIndex={0} role="region" aria-label="Danh sách bài học và bộ từ">
            {topicGroups.map(([topic, group]) => (
              <section className="deck-topic" key={topic}>
                <h3>{topic}</h3>
                <ul>
                  {group.map((deck) => (
                    <li className="deck-list-item" key={deck.id}>
                      <button type="button" className="deck-picker" onClick={() => selectDeck(deck.id)} aria-pressed={activeDeck?.id === deck.id}>
                        <BookOpen size={15} aria-hidden="true" />
                        <span className="deck-picker-title">
                          <span>{deck.name}</span>
                          {deck.nativeName && <span className="deck-native-name" lang={deck.language} dir="auto">{deck.nativeName}</span>}
                        </span>
                        <span className="deck-card-count">{deckCounts.get(deck.id) ?? 0} thẻ</span>
                      </button>
                      {deck.isCustom && (
                        <button type="button" onClick={() => onDeleteDeck(deck.id)} aria-label={`Xóa bộ từ ${deck.name}`} className="deck-delete">
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {!filteredDecks.length && <p className="panel-empty">{decks.length ? 'Không có bộ từ phù hợp.' : 'Tạo bộ từ đầu tiên để bắt đầu học.'}</p>}
          </div>
        </aside>

        <section className="glass-panel deck-content" aria-labelledby="deck-content-title">
          <div className="deck-content-controls">
            <button type="button" className="text-button deck-back" onClick={() => {
              setMobilePanel('directory');
              requestAnimationFrame(() => deckSearch.current?.focus());
            }}><ArrowLeft size={16} aria-hidden="true" /> Đổi bộ từ</button>
            <div className="deck-content-heading">
              <div className="deck-title-group">
                {activeDeck && <p className="deck-topic-label">{activeDeck.category}</p>}
                <h2 id="deck-content-title" ref={wordsHeading} tabIndex={-1}>
                  {activeDeck ? activeDeck.name : 'Thẻ trong phạm vi'}
                </h2>
                {activeDeck?.nativeName && (
                  <p className="deck-native-name" lang={activeDeck.language} dir="auto">{activeDeck.nativeName}</p>
                )}
                <p className="deck-description">
                  {deckWords.length.toLocaleString('vi-VN')} thẻ
                  {activeDeck?.description && <span> · {activeDeck.description}</span>}
                </p>
              </div>
              {activeDeck && (
                <div className="deck-study-actions">
                  {activeDeck.collection === 'collocations' && !activeDeck.isCustom && (
                    <button type="button" onClick={() => onStartDeckStudy(activeDeck.id, 'collocation')} className="button-secondary"
                      disabled={!deckCounts.get(activeDeck.id)}>Luyện collocations</button>
                  )}
                  <button type="button" onClick={() => onStartDeckStudy(activeDeck.id, 'flashcard')} className="button-primary"
                    disabled={!deckCounts.get(activeDeck.id)}>
                    <Play size={15} aria-hidden="true" />
                    Học bộ này
                  </button>
                </div>
              )}
            </div>
            <div className="deck-content-tools">
              <label className="deck-search">
                <Search size={16} aria-hidden="true" />
                <input type="search" aria-label="Tìm trong bộ từ vựng" value={searchQuery}
                  onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                  placeholder="Từ, cụm từ hoặc nghĩa…" />
              </label>
              {targetDeck && (
                <button type="button" className="button-secondary" onClick={openAddWord}>
                  <Plus size={16} aria-hidden="true" /> Thêm từ
                </button>
              )}
              <label className={`button-secondary deck-transfer deck-import${activeDeck ? '' : ' opacity-50'}`}
                title={activeDeck ? 'Nhập vào bộ ' + activeDeck.name : 'Chọn một bộ từ để nhập'}>
                <Upload size={15} aria-hidden="true" /> <span>Nhập JSON</span>
                <input aria-label="Nhập JSON" type="file" accept=".json" disabled={!activeDeck} onChange={handleImportFile} className="sr-only" />
              </label>
              <button type="button" className="button-secondary deck-transfer" aria-label="Xuất JSON" title="Xuất JSON"
                onClick={handleExportDeck} disabled={!visibleWords.length}>
                <Download size={15} aria-hidden="true" /> <span>Xuất JSON</span>
              </button>
            </div>


          </div>

          <div ref={wordScroll} className="deck-word-list" tabIndex={0} role="region" aria-label="Danh sách thẻ từ vựng">
            {visibleWords.length === 0 ? (
              <div className="deck-empty">
                <BookOpen size={27} aria-hidden="true" />
                <p>{searchQuery.trim() || (decks.length && !filteredDecks.length) ? 'Không có kết quả phù hợp.' : 'Bộ từ này đang trống.'}</p>
              </div>
            ) : (
              <div className="deck-word-cards">
                {pageWords.map((storedWord) => {
                  const word = getEnglishStudyWord(storedWord, englishLocale);
                  const sourceDeck = activeDeck ?? decks.find(({ id }) => id === word.deckId);
                  const retention = word.srs.lastReviewedAt === null ? null : Math.round(calculateRetentionProbability(word) * 100);
                  return (
                    <article className="deck-word-card" key={word.id}>
                      <header className="deck-word-heading">
                        <div>
                          <div className="deck-term">
                            <h3 lang={englishLocale}>{word.term}</h3>
                          </div>
                          <p className="deck-word-meta">{[word.phonetic, word.additionalSenses?.length ? 'Từ loại chính: ' + word.partOfSpeech : word.partOfSpeech].filter(Boolean).join(' · ')}</p>
                          <p className="deck-word-meaning"><span className="sr-only">Nghĩa · </span>{word.meaning}</p>
                        </div>
                        <div className="deck-word-actions">
                          <span className="deck-word-status">
                            {retention === null ? 'Chưa có lịch ôn' : `Ước tính nhớ ${retention}%`}
                          </span>
                          <button type="button" className="deck-word-action" onClick={() => openRelationEditor(word)}
                            aria-label={`Sửa đồng nghĩa và trái nghĩa của ${word.term}`} title="Sửa đồng nghĩa và trái nghĩa">
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button type="button" className="deck-word-action deck-delete" onClick={() => onDeleteWord(word.id, activeDeck?.id)}
                            aria-label={`Xóa từ ${word.term}`} title="Xóa thẻ">
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </header>
                      <EnglishVariantDetails word={storedWord} speechRate={speechRate} />
                      <p className="deck-word-meta">Năng lực · {describeMastery(masteryByWord.get(word.id))}</p>
                      {retention !== null && <p className="deck-word-meta">Ôn tiếp · {new Date(word.srs.nextReviewAt).toLocaleDateString('vi-VN')}</p>}
                      {word.notes && (
                        <div className="deck-usage">
                          <h4>Giải thích và cách dùng</h4>
                          <p>{word.notes}</p>
                        </div>
                      )}
                      {word.collocations.length > 0 && (
                        <div className="deck-usage">
                          <h4>Cụm từ đi kèm</h4>
                          {word.collocations.map(({ phrase, meaning }, index) => (
                            <p key={index}><strong lang="en">{phrase}</strong>{meaning && ` · ${meaning}`}</p>
                          ))}
                        </div>
                      )}
                      {word.examples.length > 0 && (
                        <div className="deck-usage">
                          <h4>{word.additionalSenses?.length ? 'Ví dụ nghĩa chính' : 'Ví dụ'}</h4>
                          <WordExamples examples={word.examples.slice(0, 2)} speechRate={speechRate} />
                        </div>
                      )}
                      <WordAdditionalSenses word={word} speechRate={speechRate} />
                      <WordFamilyList
                        items={getMergedWordFamily(storedWord, words)}
                        headword={word.term}
                        onInspectTerm={onInspectTerm}
                      />
                      <WordRelations word={word} />
                      <WordExampleGenerator key={englishLocale + ':' + word.term} word={word} locale={englishLocale}
                        level={sourceDeck ? getDeckStudyLevel(sourceDeck) : undefined} speechRate={speechRate} />
                      <details className="deck-word-details">
                        <summary>Chi tiết thẻ</summary>
                        <WordExamples examples={word.examples.slice(2)} startAt={3} speechRate={speechRate} />
                        {retention !== null && <p>Bloom cũ · Tầng {word.bloomLevel} · {BLOOM_META[word.bloomLevel].nameVi}</p>}
                        {word.srs.intervalDays > 0 && <p>Chu kỳ ôn · {formatIntervalVi(word.srs.intervalDays)}</p>}
                        <div className="lookup-ext-links">
                          <a href={cambridgeEnViLookupUrl(word.term)} target="_blank" rel="noopener noreferrer" className="text-button">
                            Tra Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> cho {word.term}</span>
                          </a>
                          <a href={cambridgeLookupUrl(word.term)} target="_blank" rel="noopener noreferrer" className="text-button">
                            Cambridge EN <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> cho {word.term}</span>
                          </a>
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          {!!visibleWords.length && (
            <nav className="deck-pagination" aria-label="Phân trang bộ từ">
              <p role="status">{pageStart + 1}–{pageStart + pageWords.length} / {visibleWords.length.toLocaleString('vi-VN')} thẻ</p>
              {pageCount > 1 && (
                <div>
                  <button type="button" className="icon-button" aria-label="Trang trước" disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}><ArrowLeft size={16} aria-hidden="true" /></button>
                  <button type="button" className="icon-button" aria-label="Trang sau" disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}><ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              )}
            </nav>
          )}
        </section>
      </div>

      <dialog ref={relationDialog} className="quick-add-dialog" aria-labelledby="edit-relations-title" onClose={() => setRelationWordId(undefined)}>
        {relationWord && (
          <div className="quick-add-card glass-panel">
            <div className="popover-heading">
              <h2 id="edit-relations-title">Đồng nghĩa và trái nghĩa</h2>
              <button type="button" className="icon-button" aria-label="Đóng" onClick={() => relationDialog.current?.close()}><X size={18} aria-hidden="true" /></button>
            </div>
            <form className="quick-add-form" onSubmit={(event) => {
              event.preventDefault();
              onUpdateWordRelations(relationWord.id, {
                synonyms: importTerms(relationDraft.synonyms),
                antonyms: importTerms(relationDraft.antonyms),
              });
              relationDialog.current?.close();
            }}>
              <p><strong lang={relationWord.language}>{relationWord.term}</strong> · {relationWord.meaning}</p>
              {isBuiltinWord(relationWord.id) && (
                <>
                  <WordRelations word={{ ...relationWord, personalRelations: undefined }} />
                  <h3 className="deck-personal-relations-heading">Từ bạn thêm</h3>
                </>
              )}
              <RelationFields value={relationDraft} onChange={setRelationDraft} />
              <div className="session-actions"><button type="submit" className="button-primary">Lưu</button></div>
            </form>
          </div>
        )}
      </dialog>


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
              <div>
                <label htmlFor="add-term" className="block text-xs font-medium mb-1">
                  Từ hoặc cụm từ *
                </label>
                <div className="quick-add-term-row">
                  <input
                    id="add-term"
                    type="text"
                    lang="en"
                    value={wordTerm}
                    onChange={(e) => setWordTerm(e.target.value)}
                    placeholder={ENGLISH_FORM_EXAMPLE.term}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                  <button
                    type="button"
                    className="button-secondary quick-add-autofill"
                    onClick={() => void handleDeckDictionaryAutofill()}
                    disabled={!wordTerm.trim() || dictLookupBusy}
                    title="Tra từ điển trực tuyến và điền đúng form tự động"
                  >
                    {dictLookupBusy
                      ? <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                      : <Sparkles size={15} aria-hidden="true" />}
                    <span>Tra & điền</span>
                  </button>
                </div>
              </div>

              {dictLookupStatus && (
                <div className="quick-add-lookup-banner" role="status">
                  <span>{dictLookupStatus}</span>
                  <a href={cambridgeEnViLookupUrl(wordTerm.trim())} target="_blank" rel="noopener noreferrer" className="text-button">
                    Cambridge Anh–Việt <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              )}

              <div>
                <label htmlFor="add-phonetic" className="block text-xs font-medium mb-1">
                  {`Phiên âm (${ENGLISH_LOCALE_LABEL[englishLocale]})`}
                </label>
                <input
                  id="add-phonetic"
                  type="text"
                  value={wordPhonetic}
                  onChange={(e) => setWordPhonetic(e.target.value)}
                  placeholder={ENGLISH_FORM_EXAMPLE.phonetic}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                />
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
                    placeholder={ENGLISH_FORM_EXAMPLE.meaning}
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

              <label className="flex items-center gap-2 text-xs font-medium">
                <input type="checkbox" checked={wordIsCollocation} onChange={(event) => setWordIsCollocation(event.target.checked)} />
                Đây là một collocation
              </label>

              <div>
                <label htmlFor="add-notes" className="block text-xs font-medium mb-1">
                  Cách dùng &amp; Ngữ pháp
                </label>
                <input
                  id="add-notes"
                  type="text"
                  value={wordNotes}
                  onChange={(e) => setWordNotes(e.target.value)}
                  placeholder={ENGLISH_FORM_EXAMPLE.notes}
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
                    placeholder={ENGLISH_FORM_EXAMPLE.phrase}
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
                    placeholder={ENGLISH_FORM_EXAMPLE.phraseMeaning}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-hairline)' }}
                  />
                </div>
              </div>

              <ExampleFields values={wordExamples} onChange={setWordExamples}
                language="en" sample={ENGLISH_FORM_EXAMPLE} />
              <RelationFields value={wordRelations} onChange={setWordRelations} />

              <details className="text-xs space-y-2">
                <summary className="cursor-pointer font-medium">Thêm biến thể {ENGLISH_LOCALE_LABEL[alternateLocale]}</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="control-field">
                    <span>Từ hoặc cụm từ ({ENGLISH_LOCALE_LABEL[alternateLocale]})</span>
                    <input value={alternateForm.term} onChange={(event) => setAlternateForm({ ...alternateForm, term: event.target.value })} />
                  </label>
                  <label className="control-field">
                    <span>Phiên âm ({ENGLISH_LOCALE_LABEL[alternateLocale]})</span>
                    <input value={alternateForm.phonetic} onChange={(event) => setAlternateForm({ ...alternateForm, phonetic: event.target.value })} />
                  </label>
                </div>
                <ExampleFields values={alternateForm.examples}
                  onChange={(examples) => setAlternateForm({ ...alternateForm, examples })} language="en" />
              </details>

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
