import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, ClipboardList, Feather, Layers3, ListChecks, Mic2, TextCursorInput, Timer, Zap } from 'lucide-react';
import type { BloomLevel, StudyModeId, VocabDeck, VocabWord } from '../types/vocab';
import { BLOOM_META, isWordDue } from '../utils/srsBloom';
import { getIntensiveStudyPlan, getPracticeWords, PRACTICE_SESSION_SIZE, type StudyFilter } from '../utils/studyPlan';

interface StudyHubViewProps {
  decks: VocabDeck[];
  words: VocabWord[];
  selectedMode: StudyModeId;
  selectedDeckId: string;
  now: number;
  dailyCount: number;
  intensive: ReturnType<typeof getIntensiveStudyPlan>;
  onSelectMode: (mode: StudyModeId) => void;
  onSelectDeck: (id: string) => void;
  onStartDaily: () => void;
  onStartIntensive: () => void;
  onBeginSession: (mode: StudyModeId, deckId: string, filter: StudyFilter, bloom: BloomLevel) => void;
}

const PRACTICE_MODES = [
  { id: 'flashcard', label: 'Thẻ ghi nhớ', detail: 'Tự nhắc lại nghĩa và chấm mức độ nhớ.', icon: BookOpen },
  { id: 'quiz', label: 'Trắc nghiệm', detail: 'Phân biệt các nghĩa gần nhau.', icon: ListChecks },
  { id: 'dictation', label: 'Nghe & chép', detail: 'Nghe và gõ lại từ vừa nghe.', icon: Mic2 },
  { id: 'cloze', label: 'Điền vào câu', detail: 'Nhớ lại từ trong ngữ cảnh thật.', icon: TextCursorInput },
  { id: 'collocation', label: 'Cụm từ', detail: 'Nhận diện những từ thường đi cùng nhau.', icon: Layers3 },
  { id: 'synthesis', label: 'Đặt câu', detail: 'Dùng từ trong câu do bạn tự viết.', icon: Feather },
  { id: 'speed', label: 'Ôn nhanh', detail: 'Trả lời trong 60 giây.', icon: Timer },
] as const;

const FILTERS = [
  { id: 'all', label: 'Tất cả từ' },
  { id: 'due', label: 'Đến hạn' },
  { id: 'bloom', label: 'Theo Bloom' },
] as const;

export function StudyHubView({ decks, words, selectedMode, selectedDeckId, now, dailyCount, intensive, onSelectMode, onSelectDeck, onStartDaily, onStartIntensive, onBeginSession }: StudyHubViewProps) {
  const [filter, setFilter] = useState<StudyFilter>('all');
  const [bloom, setBloom] = useState<BloomLevel>(1);
  const deckWords = useMemo(() => words.filter((word) => selectedDeckId === 'all' || word.deckId === selectedDeckId), [words, selectedDeckId]);
  const dueCount = deckWords.filter((word) => isWordDue(word, now)).length;
  const available = useMemo(() => getPracticeWords(words, selectedDeckId, filter, bloom, selectedMode, now),
    [words, selectedDeckId, filter, bloom, selectedMode, now]);
  const emptyMessage = !deckWords.length ? 'Bộ từ này đang trống.'
    : filter === 'due' && !dueCount ? 'Bộ từ này chưa có từ đến hạn.'
    : filter === 'bloom' && !deckWords.some((word) => word.bloomLevel === bloom) ? 'Chưa có từ ở mức Bloom này.'
    : 'Chưa đủ dữ liệu cho dạng bài này. Hãy chọn dạng bài hoặc bộ từ khác.';
  const intensiveDetails = [
    intensive.reviewCount ? intensive.reviewCount + ' từ đến hạn' : '',
    intensive.reinforcementCount ? intensive.reinforcementCount + ' từ để củng cố' : '',
  ].filter(Boolean).join(' · ');
  const nextRound = intensive.nextAvailableAt === null ? null
    : new Date(intensive.nextAvailableAt).toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="study-hub">
      <div className="page-intro">
        <h1>Luyện tập</h1>
        <p>Học theo lịch ôn hoặc tập trung vào kỹ năng bạn muốn cải thiện.</p>
      </div>

      <section className="glass-panel guided-panel" aria-labelledby="guided-title">
        <div className="guided-panel-icon"><ClipboardList size={25} aria-hidden="true" /></div>
        <div>
          <h2 id="guided-title">Kế hoạch hôm nay</h2>
          <p>{dailyCount ? dailyCount + ' từ được chọn theo lịch ôn và giới hạn từ mới.' : 'Bạn đã hoàn thành phần học được đề xuất hôm nay.'}</p>
        </div>
        <button type="button" className="button-primary" disabled={!dailyCount} onClick={onStartDaily}>
          Bắt đầu phiên học <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>

      <section className="glass-panel guided-panel intensive-panel" aria-labelledby="intensive-title">
        <div className="guided-panel-icon"><Zap size={24} aria-hidden="true" /></div>
        <div>
          <h2 id="intensive-title">Ôn tăng cường</h2>
          <p>{intensiveDetails || (nextRound ? 'Lượt tiếp theo · ' + nextRound : 'Học vài từ để có lượt củng cố sau một quãng nghỉ.')}</p>
        </div>
        <button type="button" className="button-secondary" disabled={!intensive.words.length} onClick={onStartIntensive}>
          Bắt đầu ôn tăng cường <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>

      <section className="glass-panel practice-panel" aria-labelledby="practice-title">
        <div className="panel-heading">
          <div>
            <h2 id="practice-title">Tự chọn bài luyện</h2>
            <p>Chọn bộ từ, phạm vi và dạng bài.</p>
          </div>
        </div>

        <div className="practice-options">
          <div className="control-field">
            <label htmlFor="practice-deck">Bộ từ</label>
            <div className="select-wrap">
              <select id="practice-deck" value={selectedDeckId} onChange={(event) => onSelectDeck(event.target.value)}>
                <option value="all">Tất cả bộ từ</option>
                {decks.map((deck) => <option value={deck.id} key={deck.id}>{deck.name}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="control-field">
            <span id="practice-filter">Phạm vi</span>
            <div className="segmented-control" role="group" aria-labelledby="practice-filter">
              {FILTERS.map(({ id, label }) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {label}{id === 'due' && ' (' + dueCount + ')'}
                </button>
              ))}
            </div>
          </div>
          {filter === 'bloom' && (
            <div className="control-field">
              <label htmlFor="practice-bloom">Mức Bloom</label>
              <div className="select-wrap">
                <select id="practice-bloom" value={bloom} onChange={(event) => setBloom(Number(event.target.value) as BloomLevel)}>
                  {([1, 2, 3, 4, 5, 6] as const).map((level) => <option key={level} value={level}>{level} · {BLOOM_META[level].nameVi}</option>)}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        <div className="mode-grid" role="group" aria-label="Dạng bài">
          {PRACTICE_MODES.map(({ id, label, detail, icon: Icon }) => (
            <button type="button" className="mode-card" key={id} aria-pressed={id === selectedMode} onClick={() => onSelectMode(id)}>
              <span className="metric-icon" data-tone="violet"><Icon size={19} aria-hidden="true" /></span>
              <span className="mode-label">{label}</span>
              <span className="mode-detail">{detail}</span>
              {id === selectedMode && <Check className="mode-check" size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="practice-footer">
          <p aria-live="polite">
            {available.length ? Math.min(available.length, PRACTICE_SESSION_SIZE) + ' từ trong phiên này' : emptyMessage}
          </p>
          <button className="button-primary" type="button" disabled={!available.length}
            onClick={() => onBeginSession(selectedMode, selectedDeckId, filter, bloom)}>
            Bắt đầu luyện tập <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
