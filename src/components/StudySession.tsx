import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Mic,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import type {
  AppSettings,
  ReviewQuality,
  StudyModeId,
  VocabWord,
} from '../types/vocab';
import {
  BLOOM_META,
  calculateNextSRS,
  evaluateAnswerMatch,
  evaluateSynthesisSentence,
  formatIntervalVi,
} from '../utils/srsBloom';
import { soundEngine, speakPronunciation } from '../utils/soundEngine';

interface StudySessionProps {
  mode: StudyModeId;
  sessionWords: VocabWord[];
  allWords: VocabWord[];
  settings: AppSettings;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onRecordReview: (wordId: string, quality: ReviewQuality) => void;
  onCompleteSession: (summary: {
    mode: StudyModeId;
    wordsReviewed: number;
    correctCount: number;
    xpEarned: number;
    durationSeconds: number;
  }) => void;
  onExit: () => void;
}

const MODE_TITLES: Record<StudyModeId, string> = {
  flashcard: 'Thẻ ghi nhớ SRS',
  quiz: 'Trắc nghiệm đa chiều',
  dictation: 'Nghe & Chính tả',
  cloze: 'Điền từ theo ngữ cảnh',
  collocation: 'Học theo cụm từ & Collocation',
  synthesis: 'Phân tích & Sáng tạo câu (Bloom 5-6)',
  speed: 'Ôn tập siêu tốc 60 giây',
};

function stripTrailingPinyin(sentence: string): string {
  return sentence.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export const StudySession: React.FC<StudySessionProps> = ({
  mode,
  sessionWords,
  allWords,
  settings,
  zenMode,
  onToggleZenMode,
  onRecordReview,
  onCompleteSession,
  onExit,
}) => {
  const queue = useMemo(() => (sessionWords.length > 0 ? sessionWords : allWords.slice(0, 8)), [sessionWords, allWords]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [combo, setCombo] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Mode-specific interactive state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [checkedResult, setCheckedResult] = useState<{
    correct: boolean;
    message: string;
    detail?: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);

  // Speed mode timer
  const [secondsLeft, setSecondsLeft] = useState(60);
  const startedAtRef = useRef(Date.now());

  const currentWord = queue[index];

  // Auto-play pronunciation on card change if enabled or in dictation mode
  useEffect(() => {
    if (!currentWord || finished) return;
    if (mode === 'dictation' || settings.autoPlayAudio) {
      speakPronunciation(
        currentWord.term,
        currentWord.language,
        settings.speechRate,
        () => setSpeaking(true),
        () => setSpeaking(false),
      );
    }
  }, [index, currentWord, mode, settings.autoPlayAudio, settings.speechRate, finished]);

  // Speed timer
  useEffect(() => {
    if (mode !== 'speed' || finished) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        if (prev <= 6) soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, finished]);

  const resetCardState = () => {
    setFlipped(false);
    setSelectedChoice(null);
    setTypedInput('');
    setCheckedResult(null);
    setShowHint(false);
    setMicStatus(null);
  };

  const advanceNext = (wasCorrect: boolean, quality: ReviewQuality) => {
    if (!currentWord) return;
    onRecordReview(currentWord.id, quality);
    const nextCorrect = wasCorrect ? correctCount + 1 : correctCount;
    const nextCombo = wasCorrect ? combo + 1 : 0;
    const gained = quality === 1 ? 4 : quality === 2 ? 8 : quality === 3 ? 12 : 16;
    const nextXp = xpEarned + gained + (nextCombo >= 3 ? 4 : 0);

    setCorrectCount(nextCorrect);
    setCombo(nextCombo);
    setXpEarned(nextXp);

    if (index + 1 >= queue.length) {
      soundEngine.playLevelUp();
      setFinished(true);
      onCompleteSession({
        mode,
        wordsReviewed: queue.length,
        correctCount: nextCorrect,
        xpEarned: nextXp,
        durationSeconds: Math.max(5, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    } else {
      setIndex((i) => i + 1);
      resetCardState();
    }
  };

  // Quiz & Speed multiple choice options
  const quizOptions = useMemo(() => {
    if (!currentWord) return [];
    const distractors = allWords
      .filter((w) => w.id !== currentWord.id)
      .sort((a, b) => a.term.localeCompare(b.term))
      .slice(0, 3);
    const combined = [currentWord, ...distractors];
    // Deterministic shuffle based on word id + index
    return combined.sort((a, b) => {
      const ha = (a.id.charCodeAt(0) + index * 7) % 13;
      const hb = (b.id.charCodeAt(0) + index * 7) % 13;
      return ha - hb;
    });
  }, [currentWord, allWords, index]);

  // Collocation exercise options
  const collocationExercise = useMemo(() => {
    if (!currentWord) return null;
    const primary = currentWord.collocations[0] || {
      phrase: `${currentWord.term} example`,
      meaning: currentWord.meaning,
    };
    const otherPhrases = allWords
      .filter((w) => w.id !== currentWord.id && w.collocations.length > 0)
      .slice(0, 3)
      .map((w) => w.collocations[0].phrase);
    const options = [primary.phrase, ...otherPhrases].sort((a, b) => a.localeCompare(b));
    return {
      targetPhrase: primary.phrase,
      meaningVi: primary.meaning,
      options,
    };
  }, [currentWord, allWords]);

  // Cloze sentence builder (strips trailing Pinyin so the answer isn't leaked in the blank)
  const clozeSentence = useMemo(() => {
    if (!currentWord) return { masked: '', full: '', translation: '' };
    const ex = currentWord.examples[0] || {
      sentence: `我每天练习${currentWord.term}。`,
      translation: currentWord.meaning,
    };
    const cleanSentence = stripTrailingPinyin(ex.sentence);
    const escaped = currentWord.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const masked = regex.test(cleanSentence)
      ? cleanSentence.replace(regex, '______')
      : `${cleanSentence} (Từ cần điền: ______)`;
    return { masked, full: ex.sentence, translation: ex.translation };
  }, [currentWord]);

  const handleSpeak = (rate = settings.speechRate) => {
    if (!currentWord) return;
    speakPronunciation(
      currentWord.term,
      currentWord.language,
      rate,
      () => setSpeaking(true),
      () => setSpeaking(false),
    );
  };

  const handleSpeakExample = (exampleIdx = 0) => {
    const ex = currentWord?.examples[exampleIdx];
    if (!currentWord || !ex) return;
    speakPronunciation(
      stripTrailingPinyin(ex.sentence),
      currentWord.language,
      settings.speechRate,
      () => setSpeaking(true),
      () => setSpeaking(false),
    );
  };

  const handleSpeechPractice = () => {
    if (!currentWord) return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setMicStatus('Trình duyệt hiện tại không hỗ trợ nhận diện giọng nói trực tiếp. Hãy nghe và đọc theo mẫu!');
      handleSpeak(0.8);
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        start: () => void;
      };
      rec.lang =
        currentWord.language === 'zh'
          ? 'zh-CN'
          : currentWord.language === 'ja'
            ? 'ja-JP'
            : currentWord.language === 'fr'
              ? 'fr-FR'
              : 'en-US';
      rec.interimResults = false;
      setMicStatus('Đang lắng nghe... Hãy phát âm từ này.');
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const matched = evaluateAnswerMatch(transcript, currentWord.term);
        if (matched) {
          soundEngine.playCorrect();
          setMicStatus(`Chuẩn xác! Hệ thống nghe được: "${transcript}"`);
        } else {
          setMicStatus(`Bạn đã đọc "${transcript}" — thử nghe chậm lại và nhấn trọng âm rõ hơn.`);
        }
      };
      rec.onerror = () => {
        setMicStatus('Không thu được âm thanh micro. Bạn có thể bấm nút Loa để luyện nghe.');
      };
      rec.start();
    } catch {
      setMicStatus('Không thể kích hoạt micro trên môi trường này.');
    }
  };

  // Keyboard shortcuts for flashcard & quiz
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || !currentWord) return;
      if (mode === 'flashcard') {
        if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          soundEngine.playFlip();
          setFlipped((f) => !f);
        } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
          const q = Number(e.key) as ReviewQuality;
          if (q >= 3) soundEngine.playCorrect();
          else soundEngine.playIncorrect();
          advanceNext(q >= 2, q);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished || !currentWord) {
    const reviewed = finished ? (mode === 'speed' ? index + (correctCount > 0 ? 1 : 0) : queue.length) : 0;
    const accuracy = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 100;
    return (
      <div
        className="max-w-2xl mx-auto rounded-2xl border p-8 text-center space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Hoàn thành phiên học!</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Chế độ: {MODE_TITLES[mode]} · Dữ liệu SRS và sơ đồ Bloom đã được cập nhật ngoại tuyến.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Số từ đã ôn
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">{reviewed}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Độ chính xác
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Kinh nghiệm nhận
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-text)' }}>
              +{xpEarned} XP
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setCorrectCount(0);
              setXpEarned(0);
              setCombo(0);
              setSecondsLeft(60);
              setFinished(false);
              resetCardState();
              startedAtRef.current = Date.now();
            }}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Học lại phiên này</span>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Quay về bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((index + 1) / queue.length) * 100);
  const bloomInfo = BLOOM_META[currentWord.bloomLevel];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap"
          style={{
            borderColor: 'var(--border-hairline)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thoát phiên</span>
        </button>

        <div className="text-center min-w-0">
          <div className="font-display text-sm font-semibold truncate">{MODE_TITLES[mode]}</div>
          {!zenMode && (
            <div className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              Thẻ {index + 1}/{queue.length} · Bloom {currentWord.bloomLevel} ({bloomInfo.nameVi})
            </div>
          )}
          {zenMode && (
            <div className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {index + 1}/{queue.length}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs tabular-nums">
          {!zenMode && mode === 'speed' && (
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Timer className="w-3.5 h-3.5" />
              {secondsLeft}s
            </span>
          )}
          {!zenMode && combo >= 2 && (
            <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
              Combo x{combo}
            </span>
          )}
          {!zenMode && <span style={{ color: 'var(--text-secondary)' }}>+{xpEarned} XP</span>}
          <button
            type="button"
            onClick={onToggleZenMode}
            aria-pressed={zenMode}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-sans text-xs font-medium cursor-pointer whitespace-nowrap"
            style={{
              borderColor: zenMode ? 'var(--accent-primary)' : 'var(--border-hairline)',
              backgroundColor: zenMode ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: zenMode ? 'var(--accent-text)' : 'var(--text-primary)',
            }}
          >
            {zenMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{zenMode ? 'Thoát Zen' : 'Chế độ Zen'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, backgroundColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Animated Active Card / Exercise Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {/* MODE 1: FLASHCARD SRS */}
          {mode === 'flashcard' && (
            <div className="space-y-4">
              <div className="perspective-1200">
                <div
                  className={`relative min-h-[410px] w-full transition-transform duration-500 preserve-3d ${
                    flipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-2xl border p-6 sm:p-8 flex flex-col justify-between"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-hairline)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="truncate">
                        {currentWord.partOfSpeech} · Bloom {currentWord.bloomLevel}: {bloomInfo.nameVi}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSpeak(0.7)}
                          className="rounded-md border px-2 py-1 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                          style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-secondary)' }}
                        >
                          Chậm 0.7x
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSpeak(settings.speechRate)}
                          aria-label={`Phát âm ${currentWord.term}`}
                          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${speaking ? 'animate-pulse' : ''}`} />
                          <span>Nghe</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-center space-y-3 my-auto py-4">
                      <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
                        {currentWord.term}
                      </div>
                      <div className="font-mono text-base" style={{ color: 'var(--text-secondary)' }}>
                        {currentWord.phonetic}
                      </div>

                      {currentWord.collocations.length > 0 && (
                        <div className="pt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          Cụm gợi ý: <span className="font-medium">{currentWord.collocations[0].phrase}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleSpeechPractice}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                        style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-secondary)' }}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Luyện phát âm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playFlip();
                          setFlipped(true);
                        }}
                        className="w-full sm:w-auto rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        Lật xem nghĩa &amp; ví dụ (Space)
                      </button>
                    </div>
                    {micStatus && (
                      <p className="mt-2 text-xs text-center" style={{ color: 'var(--accent-text)' }}>
                        {micStatus}
                      </p>
                    )}
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border p-6 sm:p-7 flex flex-col justify-between overflow-y-auto"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-hairline)',
                    }}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="font-display text-2xl font-bold">{currentWord.term}</span>
                            <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                              {currentWord.phonetic}
                            </span>
                            {currentWord.sinoVietnamese && (
                              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                · Hán-Việt: {currentWord.sinoVietnamese}
                              </span>
                            )}
                          </div>
                          {currentWord.radical && (
                            <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              Cấu tạo / Bộ thủ: {currentWord.radical}
                            </div>
                          )}
                          <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--accent-text)' }}>
                            {currentWord.meaning}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSpeak(settings.speechRate)}
                          aria-label="Nghe lại từ vựng"
                          className="rounded-lg border p-2 cursor-pointer shrink-0"
                          style={{ borderColor: 'var(--border-hairline)' }}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Cách dùng & Ngữ pháp */}
                      {currentWord.notes && (
                        <div
                          className="rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed"
                          style={{
                            backgroundColor: 'var(--bg-canvas)',
                            borderColor: 'var(--border-hairline)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Cách dùng:{' '}
                          </span>
                          {currentWord.notes}
                        </div>
                      )}

                      {/* Collocations */}
                      {currentWord.collocations.length > 0 && (
                        <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Cụm từ tự nhiên (Collocations)
                          </div>
                          {currentWord.collocations.map((col, idx) => (
                            <div key={idx} className="text-xs flex items-center justify-between gap-2">
                              <span className="font-semibold">{col.phrase}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{col.meaning}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* All Examples */}
                      {currentWord.examples.length > 0 && (
                        <div className="space-y-2">
                          <span className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Ví dụ ngữ cảnh ({currentWord.examples.length})
                          </span>
                          {currentWord.examples.map((ex, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-sm font-medium leading-relaxed">{ex.sentence}</p>
                                <p style={{ color: 'var(--text-secondary)' }}>{ex.translation}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSpeakExample(idx)}
                                aria-label={`Đọc câu ví dụ ${idx + 1}`}
                                className="rounded-md border p-1.5 cursor-pointer shrink-0 mt-0.5"
                                style={{ borderColor: 'var(--border-hairline)', color: 'var(--accent-text)' }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFlipped(false)}
                      className="self-start mt-3 text-xs font-medium hover:underline cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Lật lại mặt trước
                    </button>
                  </div>
                </div>
              </div>

              {flipped && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {([
                    { q: 1 as ReviewQuality, label: '1 · Quên rồi', tone: 'text-rose-600 dark:text-rose-400' },
                    { q: 2 as ReviewQuality, label: '2 · Hơi khó', tone: 'text-amber-600 dark:text-amber-400' },
                    { q: 3 as ReviewQuality, label: '3 · Tốt', tone: 'text-emerald-600 dark:text-emerald-400' },
                    { q: 4 as ReviewQuality, label: '4 · Rất dễ', tone: 'text-sky-600 dark:text-sky-400' },
                  ]).map((btn) => {
                    const preview = calculateNextSRS(currentWord, btn.q, settings.srsMode);
                    return (
                      <button
                        key={btn.q}
                        type="button"
                        onClick={() => {
                          if (btn.q >= 3) soundEngine.playCorrect();
                          else soundEngine.playIncorrect();
                          advanceNext(btn.q >= 2, btn.q);
                        }}
                        className="rounded-xl border p-3 text-center transition-colors hover:opacity-90 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-hairline)',
                        }}
                      >
                        <div className={`text-xs font-semibold ${btn.tone}`}>{btn.label}</div>
                        <div className="mt-1 text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Lặp lại sau {formatIntervalVi(preview.srs.intervalDays)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE 2 & MODE 7: MULTIPLE CHOICE QUIZ & SPEED REVIEW */}
          {(mode === 'quiz' || mode === 'speed') && (
            <div
              className="rounded-2xl border p-6 sm:p-8 space-y-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Chọn nghĩa tiếng Việt đúng cho từ vựng sau
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak(settings.speechRate)}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Phát âm</span>
                </button>
              </div>

              <div className="text-center py-2">
                <div className="font-display text-3xl sm:text-4xl font-bold">{currentWord.term}</div>
                <div className="mt-1 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentWord.phonetic} · {currentWord.partOfSpeech}
                  {currentWord.sinoVietnamese ? ` · ${currentWord.sinoVietnamese}` : ''}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizOptions.map((opt, idx) => {
                  const isChosen = selectedChoice === opt.id;
                  const isCorrectOption = opt.id === currentWord.id;
                  let borderColor = 'var(--border-hairline)';
                  let bg = 'var(--bg-canvas)';
                  if (selectedChoice) {
                    if (isCorrectOption) {
                      borderColor = '#10b981';
                      bg = 'rgba(16, 185, 129, 0.12)';
                    } else if (isChosen) {
                      borderColor = '#ef4444';
                      bg = 'rgba(239, 68, 68, 0.12)';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!!selectedChoice}
                      onClick={() => {
                        setSelectedChoice(opt.id);
                        const ok = opt.id === currentWord.id;
                        if (ok) soundEngine.playCombo(combo + 1);
                        else soundEngine.playIncorrect();

                        if (mode === 'speed') {
                          setTimeout(() => advanceNext(ok, ok ? 3 : 1), 350);
                        }
                      }}
                      className="text-left rounded-xl border p-4 transition-colors cursor-pointer flex items-center justify-between gap-3"
                      style={{ borderColor, backgroundColor: bg }}
                    >
                      <span className="text-sm font-medium">
                        <span className="font-mono text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
                          {idx + 1}.
                        </span>
                        {opt.meaning}
                      </span>
                      {selectedChoice && isCorrectOption && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {selectedChoice && isChosen && !isCorrectOption && (
                        <X className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedChoice && mode === 'quiz' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
                  <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    {currentWord.notes && (
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Cách dùng:</strong> {currentWord.notes}
                      </div>
                    )}
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Ví dụ:</strong>{' '}
                      {currentWord.examples[0]?.sentence || currentWord.collocations[0]?.phrase}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const ok = selectedChoice === currentWord.id;
                      advanceNext(ok, ok ? 3 : 1);
                    }}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer shrink-0 self-end sm:self-center whitespace-nowrap"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    Tiếp tục
                  </button>
                </div>
              )}
            </div>
          )}

      {/* MODE 3: DICTATION & PRONUNCIATION */}
      {mode === 'dictation' && (
        <div
          className="rounded-2xl border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="text-center space-y-3">
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Nghe phát âm và gõ lại chính xác từ vựng
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSpeak(settings.speechRate)}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe chuẩn (1.0x)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSpeak(0.65)}
                className="rounded-xl border px-4 py-3 text-xs font-medium cursor-pointer"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                Nghe chậm (0.65x)
              </button>
            </div>
            <div className="text-sm font-medium pt-1" style={{ color: 'var(--text-secondary)' }}>
              Nghĩa gợi ý: {currentWord.meaning} ({currentWord.partOfSpeech})
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (checkedResult) {
                advanceNext(checkedResult.correct, checkedResult.correct ? 3 : 1);
                return;
              }
              const ok = evaluateAnswerMatch(typedInput, currentWord.term);
              if (ok) soundEngine.playCorrect();
              else soundEngine.playIncorrect();
              setCheckedResult({
                correct: ok,
                message: ok ? 'Chính xác tuyệt đối!' : `Đáp án đúng là "${currentWord.term}"`,
                detail: `${currentWord.phonetic} · ${currentWord.examples[0]?.sentence || ''}`,
              });
            }}
            className="space-y-4"
          >
            <label htmlFor="dictation-input" className="sr-only">
              Nhập từ bạn nghe được
            </label>
            <input
              id="dictation-input"
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Gõ từ vựng bạn nghe được..."
              autoComplete="off"
              className="w-full rounded-xl border px-4 py-3 text-center font-mono text-lg focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            />

            {checkedResult && (
              <div
                className="rounded-xl p-4 text-sm space-y-1"
                style={{
                  backgroundColor: checkedResult.correct
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                }}
              >
                <div className="font-semibold">{checkedResult.message}</div>
                {checkedResult.detail && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {checkedResult.detail}
                  </div>
                )}
                {currentWord.notes && (
                  <div className="text-xs pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Cách dùng:</strong> {currentWord.notes}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showHint
                    ? `Gợi ý: ${Array.from(currentWord.term)[0]}... (${Array.from(currentWord.term).length} chữ) ${currentWord.phonetic}`
                    : 'Hiện gợi ý chữ cái đầu'}
                </span>
              </button>

              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {checkedResult ? 'Thẻ tiếp theo' : 'Kiểm tra chính tả'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 4: CLOZE CONTEXT */}
      {mode === 'cloze' && (
        <div
          className="rounded-2xl border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Bloom 3 · Điền từ phù hợp vào chỗ trống trong câu ngữ cảnh
          </div>

          <div className="rounded-xl p-5 space-y-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <p className="text-lg font-medium leading-relaxed">{clozeSentence.masked}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Dịch nghĩa: {clozeSentence.translation}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (checkedResult) {
                advanceNext(checkedResult.correct, checkedResult.correct ? 3 : 1);
                return;
              }
              const ok = evaluateAnswerMatch(typedInput, currentWord.term);
              if (ok) soundEngine.playCorrect();
              else soundEngine.playIncorrect();
              setCheckedResult({
                correct: ok,
                message: ok
                  ? `Chuẩn xác! Câu đầy đủ: "${clozeSentence.full}"`
                  : `Từ cần điền là "${currentWord.term}" (${currentWord.meaning})`,
              });
            }}
            className="space-y-4"
          >
            <label htmlFor="cloze-input" className="sr-only">
              Điền từ vào chỗ trống
            </label>
            <input
              id="cloze-input"
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={
                currentWord.language === 'zh'
                  ? `Nhập chữ Hán (${currentWord.meaning})...`
                  : `Nhập từ tiếng ${currentWord.language.toUpperCase()} (${currentWord.meaning})...`
              }
              autoComplete="off"
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            />

            {checkedResult && (
              <div
                className="rounded-xl p-4 text-sm space-y-1"
                style={{
                  backgroundColor: checkedResult.correct
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                }}
              >
                <div className="font-medium">{checkedResult.message}</div>
                {currentWord.notes && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Cách dùng:</strong> {currentWord.notes}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                {showHint
                  ? `Gợi ý: ${currentWord.phonetic} · bắt đầu bằng "${Array.from(currentWord.term)[0]}"`
                  : 'Xem gợi ý phiên âm'}
              </button>
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {checkedResult ? 'Tiếp tục' : 'Kiểm tra ngữ cảnh'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 5: PHRASE & COLLOCATION */}
      {mode === 'collocation' && collocationExercise && (
        <div
          className="rounded-2xl border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bloom 4 · Chọn cụm từ (Collocation) tự nhiên mang nghĩa bên dưới
            </span>
            <button
              type="button"
              onClick={() =>
                speakPronunciation(collocationExercise.targetPhrase, currentWord.language, settings.speechRate)
              }
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs cursor-pointer"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe cụm từ</span>
            </button>
          </div>

          <div className="rounded-xl p-5 text-center space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Từ gốc: {currentWord.term} ({currentWord.phonetic})
            </div>
            <div className="font-display text-xl font-bold">{collocationExercise.meaningVi}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {collocationExercise.options.map((phrase) => {
              const isChosen = selectedChoice === phrase;
              const isRight = phrase === collocationExercise.targetPhrase;
              let borderColor = 'var(--border-hairline)';
              let bg = 'var(--bg-canvas)';
              if (selectedChoice) {
                if (isRight) {
                  borderColor = '#10b981';
                  bg = 'rgba(16, 185, 129, 0.12)';
                } else if (isChosen) {
                  borderColor = '#ef4444';
                  bg = 'rgba(239, 68, 68, 0.12)';
                }
              }
              return (
                <button
                  key={phrase}
                  type="button"
                  disabled={!!selectedChoice}
                  onClick={() => {
                    setSelectedChoice(phrase);
                    const ok = phrase === collocationExercise.targetPhrase;
                    if (ok) soundEngine.playCorrect();
                    else soundEngine.playIncorrect();
                  }}
                  className="rounded-xl border p-4 text-left text-sm font-semibold cursor-pointer"
                  style={{ borderColor, backgroundColor: bg }}
                >
                  {phrase}
                </button>
              );
            })}
          </div>

          {selectedChoice && (
            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Từ đồng nghĩa: {currentWord.synonyms.join(', ') || 'Chưa có'}
              </div>
              <button
                type="button"
                onClick={() => {
                  const ok = selectedChoice === collocationExercise.targetPhrase;
                  advanceNext(ok, ok ? 4 : 1);
                }}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Cụm tiếp theo
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 6: BLOOM SYNTHESIS / SENTENCE STUDIO */}
      {mode === 'synthesis' && (
        <div
          className="rounded-2xl border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bloom 5-6 · Sáng tạo câu hoàn chỉnh với từ khóa và cụm từ tự nhiên
            </span>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-3xl font-bold">{currentWord.term}</h2>
              <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                {currentWord.phonetic}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                — {currentWord.meaning}
              </span>
            </div>
          </div>

          <div className="rounded-xl p-4 text-xs space-y-1.5" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div className="font-semibold">Gợi ý cụm từ (Collocation nên dùng):</div>
            <div>
              {currentWord.collocations.map((c) => `${c.phrase} (${c.meaning})`).join(' · ')}
            </div>
            {currentWord.notes && (
              <div className="pt-1" style={{ color: 'var(--text-secondary)' }}>
                <strong>Cách dùng:</strong> {currentWord.notes}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (checkedResult) {
                advanceNext(checkedResult.correct, checkedResult.correct ? 4 : 2);
                return;
              }
              const evaluation = evaluateSynthesisSentence(typedInput, currentWord);
              if (evaluation.passed) soundEngine.playCorrect();
              else soundEngine.playIncorrect();
              setCheckedResult({
                correct: evaluation.passed,
                message: evaluation.feedback,
                detail: `Câu tham khảo: "${currentWord.examples[0]?.sentence || ''}"`,
              });
            }}
            className="space-y-4"
          >
            <label htmlFor="synthesis-textarea" className="sr-only">
              Đặt câu với từ vựng
            </label>
            <textarea
              id="synthesis-textarea"
              rows={3}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Viết một câu hoàn chỉnh chứa "${currentWord.term}"...`}
              className="w-full rounded-xl border p-4 text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            />

            {checkedResult && (
              <div
                className="rounded-xl p-4 text-sm space-y-1"
                style={{
                  backgroundColor: checkedResult.correct
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.14)',
                }}
              >
                <div className="font-semibold">{checkedResult.message}</div>
                {checkedResult.detail && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {checkedResult.detail}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {checkedResult ? 'Hoàn tất & Tiếp tục' : 'Đánh giá câu'}
              </button>
            </div>
          </form>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
