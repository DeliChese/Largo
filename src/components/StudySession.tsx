import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Focus, Maximize, Mic, RotateCcw, Timer, Volume2, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AppSettings, ReviewQuality, StudyModeId, StudySessionMode, VocabWord } from '../types/vocab';
import { calculateNextSRS, evaluateAnswerMatch, evaluateSynthesisSentence, formatIntervalVi, reviewXp } from '../utils/srsBloom';
import {
  getClozeExample, getCollocationPrompt, getPhraseClozeExample, getStudyChoices,
  getStudyExercise, isScheduledReview, stripTrailingPinyin, STUDY_MODE_LABELS,
} from '../utils/studyPlan';
import { soundEngine, speakPronunciation, stopPronunciation } from '../utils/soundEngine';
import { getEnglishLocale } from '../utils/englishStudy';
import { EnglishVariantDetails } from './EnglishVariantDetails';

export interface SessionProgress {
  wordsReviewed: number;
  correctCount: number;
  xpEarned: number;
  durationSeconds: number;
}

interface StudySessionProps {
  mode: StudySessionMode;
  sessionWords: VocabWord[];
  allWords: VocabWord[];
  settings: AppSettings;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onToggleExamplePhonetic?: () => void;
  onRecordReview: (wordId: string, quality: ReviewQuality, exercise: StudyModeId, answeredAt: number) => void;
  onProgress: (progress: SessionProgress) => void;
  onExit: () => void;
  onContinue?: () => void;
}

interface SessionCard {
  word: VocabWord;
  exercise: ReturnType<typeof getStudyExercise>;
  retries: number;
}

interface Feedback {
  correct: boolean;
  message: string;
}

const RATINGS: { value: ReviewQuality; label: string; tone: string }[] = [
  { value: 1, label: 'Quên', tone: 'missed' },
  { value: 2, label: 'Hơi khó', tone: 'hard' },
  { value: 3, label: 'Nhớ', tone: 'remembered' },
  { value: 4, label: 'Rất dễ', tone: 'easy' },
];

const SPEECH_LOCALES = { zh: 'zh-CN', ja: 'ja-JP', fr: 'fr-FR', ko: 'ko-KR', es: 'es-ES' };
const SPEED_DURATION = 60_000;
const EMPTY_PROGRESS: SessionProgress = { wordsReviewed: 0, correctCount: 0, xpEarned: 0, durationSeconds: 0 };

type SpeechRecognizer = {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  abort: () => void;
};

function suppressComposingEnter(event: ReactKeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault();
}

export function StudySession({ mode, sessionWords, allWords, settings, zenMode, onToggleZenMode, onToggleExamplePhonetic, onRecordReview, onProgress, onExit, onContinue }: StudySessionProps) {
  const [queue, setQueue] = useState<SessionCard[]>(() => sessionWords.map((word) => ({
    word, exercise: getStudyExercise(word, mode, false), retries: 0,
  })));
  const [localExamplePhonetic, setLocalExamplePhonetic] = useState(settings.showExamplePhonetic ?? true);
  const showExamplePhonetic = onToggleExamplePhonetic ? (settings.showExamplePhonetic ?? true) : localExamplePhonetic;
  const toggleExamplePhonetic = () => {
    if (onToggleExamplePhonetic) onToggleExamplePhonetic();
    else setLocalExamplePhonetic((v) => !v);
  };
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<SessionProgress>(EMPTY_PROGRESS);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [micStatus, setMicStatus] = useState('');
  const startedAt = useRef(Date.now());
  const gradedCard = useRef(-1);
  const timedAdvance = useRef<number | undefined>(undefined);
  const sessionLibrary = useRef(allWords);
  const sessionHeading = useRef<HTMLDivElement>(null);
  const answerHeading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const speech = useRef<SpeechRecognizer | null>(null);

  const { word, exercise, retries } = queue[index];
  const retry = retries > 0;
  const isIntensive = mode === 'intensive';
  const isPlannedSession = mode === 'guided' || isIntensive;
  const exerciseMode = exercise.mode;
  const isFlashcard = exerciseMode === 'flashcard';
  const isDictation = exerciseMode === 'dictation';
  const isCloze = exerciseMode === 'cloze';
  const isSynthesis = exerciseMode === 'synthesis';
  const isPhrase = exerciseMode === 'collocation';
  const isChoices = exerciseMode === 'quiz' || exerciseMode === 'speed' || isPhrase;
  const phraseCloze = useMemo(() => exercise.phrase ? getPhraseClozeExample(word) : null, [word, exercise.phrase]);
  const cloze = useMemo(() => isCloze ? phraseCloze ?? getClozeExample(word) : null, [word, isCloze, phraseCloze]);
  const expectedAnswer = cloze?.answer ?? word.term;
  const choices = useMemo(
    () => isChoices ? getStudyChoices(word, sessionLibrary.current, isPhrase) : [],
    [word, isChoices, isPhrase],
  );
  const language = word.language === 'en' ? getEnglishLocale(settings) : SPEECH_LOCALES[word.language];
  const canSpeakPrompt = !exercise.reverse || flipped;
  const shouldAutoSpeak = isDictation || (settings.autoPlayAudio && (isFlashcard || exerciseMode === 'quiz') && canSpeakPrompt);

  useEffect(() => {
    if (shouldAutoSpeak && !finished) speakPronunciation(word.term, word.language, settings.speechRate);
    return stopPronunciation;
  }, [index, word, shouldAutoSpeak, settings.speechRate, finished]);

  useEffect(() => {
    sessionHeading.current?.focus({ preventScroll: true });
    return () => {
      if (speech.current) {
        speech.current.onresult = null;
        speech.current.onerror = null;
        speech.current.abort();
        speech.current = null;
      }
    };
  }, [index, finished]);

  useEffect(() => {
    if (flipped) answerHeading.current?.focus({ preventScroll: true });
  }, [flipped]);

  useEffect(() => {
    if (feedback && mode !== 'speed') nextButton.current?.focus({ preventScroll: true });
  }, [feedback, mode]);

  useEffect(() => {
    if (mode !== 'speed' || finished) return;
    const clock = () => {
      const remaining = Math.max(0, startedAt.current + SPEED_DURATION - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining === 0) setFinished(true);
    };
    const timer = window.setInterval(clock, 200);
    return () => window.clearInterval(timer);
  }, [mode, finished]);

  useEffect(() => () => window.clearTimeout(timedAdvance.current), []);

  function advance(extraRetry = false) {
    if (index + 1 >= queue.length && !extraRetry) {
      setFinished(true);
      soundEngine.playLevelUp();
      return;
    }
    setIndex(index + 1);
    setFlipped(false);
    setTyped('');
    setHint(false);
    setUsedHint(false);
    setChoice(null);
    setFeedback(null);
    setMicStatus('');
  }

  function record(quality: ReviewQuality, correct: boolean): boolean {
    const now = Date.now();
    if (finished || gradedCard.current >= index || (mode === 'speed' && now - startedAt.current >= SPEED_DURATION)) return false;
    gradedCard.current = index;
    if (correct) soundEngine.playCorrect();
    else soundEngine.playIncorrect();
    if (!retry) {
      const updated = {
        wordsReviewed: progress.wordsReviewed + 1,
        correctCount: progress.correctCount + Number(correct),
        xpEarned: progress.xpEarned + reviewXp(quality),
        durationSeconds: Math.max(1, Math.round((now - startedAt.current) / 1000)),
      };
      setProgress(updated);
      onRecordReview(word.id, quality, exerciseMode, now);
      onProgress(updated);
    }

    const retryLimit = isIntensive && index + 1 < queue.length ? 2 : 1;
    const needsRetry = !correct || (isIntensive && !retry && quality === 2);
    const repeat = needsRetry && mode !== 'speed' && !isSynthesis && retries < retryLimit;
    if (repeat) {
      const recovery = getStudyExercise(word, exerciseMode, true);
      const nextExercise = exercise.phrase ? exercise : { ...recovery, reverse: recovery.reverse || exercise.reverse };
      setQueue((cards) => [...cards, { word, exercise: nextExercise, retries: retries + 1 }]);
    }
    return repeat;
  }

  function reveal() {
    soundEngine.playFlip();
    setFlipped(true);
  }

  function rate(quality: ReviewQuality) {
    if (gradedCard.current >= index) return;
    const extraRetry = record(quality, quality >= 2);
    advance(extraRetry);
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (finished || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('header, aside, dialog, input, textarea, select, [contenteditable="true"]')) return;
      if (isFlashcard && !flipped && event.code === 'Space' && !target?.closest('button, a, summary')) {
        event.preventDefault();
        reveal();
      } else if (isFlashcard && flipped && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        rate(Number(event.key) as ReviewQuality);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  function speak(rate = settings.speechRate) {
    speakPronunciation(word.term, word.language, rate);
  }

  function speakExample(sentence: string) {
    speakPronunciation(word.language === 'zh' ? stripTrailingPinyin(sentence) : sentence, word.language, settings.speechRate);
  }

  function practiceSpeech() {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognizer;
      webkitSpeechRecognition?: new () => SpeechRecognizer;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMicStatus('Bạn có thể nghe mẫu và đọc theo trên trình duyệt này.');
      speak(0.8);
      return;
    }
    try {
      speech.current?.abort();
      const recognition = new Recognition();
      speech.current = recognition;
      recognition.lang = language;
      recognition.onresult = ({ results }) => {
        const transcript = results[0]?.[0]?.transcript ?? '';
        setMicStatus(evaluateAnswerMatch(transcript, word.term)
          ? 'Đã nhận được từ bạn vừa đọc.'
          : 'Trình duyệt nghe được “' + transcript + '”. Bạn có thể nghe mẫu và thử lại.');
      };
      recognition.onerror = () => setMicStatus('Không thu được giọng nói. Bạn có thể nghe mẫu và đọc theo.');
      recognition.start();
      setMicStatus('Đang nghe bạn đọc…');
    } catch {
      setMicStatus('Không mở được micrô. Bạn có thể nghe mẫu và đọc theo.');
    }
  }

  function choose(answer: string) {
    if (choice || gradedCard.current >= index) return;
    const correct = answer === word.id;
    setChoice(answer);
    setFeedback({
      correct,
      message: correct ? 'Chính xác' : 'Đáp án đúng là ' + (isPhrase ? choices.find(({ id }) => id === word.id)?.label : word.meaning),
    });
    record(correct ? 3 : 1, correct);
    if (mode === 'speed') timedAdvance.current = window.setTimeout(() => advance(), 420);
  }

  function checkText(event: FormEvent) {
    event.preventDefault();
    if (feedback) {
      if (!isSynthesis) advance();
      return;
    }
    if (!typed.trim()) return;
    if (isSynthesis) {
      const result = evaluateSynthesisSentence(typed, word);
      setFeedback({ correct: result.passed, message: result.feedback });
      return;
    }
    const correct = evaluateAnswerMatch(typed, expectedAnswer);
    setFeedback({ correct, message: correct ? 'Chính xác' : 'Đáp án đúng là ' + expectedAnswer });
    record(correct ? usedHint ? 2 : 3 : 1, correct);
  }

  function finishSentence(applied: boolean) {
    if (gradedCard.current >= index || !feedback) return;
    const correct = applied && feedback.correct;
    record(correct ? 3 : 2, correct);
    advance();
  }

  const scheduled = !retry && isScheduledReview(word, Date.now());
  const isNew = !retry && word.srs.lastReviewedAt === null;
  const accuracy = progress.wordsReviewed ? Math.round(progress.correctCount * 100 / progress.wordsReviewed) : 0;
  const label = STUDY_MODE_LABELS[mode];
  const status = retry ? 'Ôn lại cuối phiên' : isNew ? 'Từ mới' : scheduled ? 'Đến hạn ôn'
    : isIntensive ? 'Củng cố sớm' : 'Luyện thêm';
  const completed = retry ? sessionWords.length : index;
  const nextReview = scheduled ? null : word.srs.nextReviewAt;
  const firstExample = word.examples[0];
  const phraseInUse = word.collocations.find(({ phrase, meaning }) => phrase.trim() && meaning.trim());

  if (finished) {
    const reinforced = queue.filter((card) => card.retries === 1).length;
    return (
      <div className="glass-panel session-summary" tabIndex={-1} ref={sessionHeading}>
        <span className="summary-mark"><CheckCircle2 size={30} aria-hidden="true" /></span>
        <h1>{mode === 'speed' && secondsLeft === 0 ? 'Hết giờ' : 'Hoàn thành phiên học'}</h1>
        <p>{progress.wordsReviewed ? 'Kết quả của lượt trả lời đầu tiên.' : 'Phiên này chưa có câu trả lời.'}</p>
        <div className="summary-metrics">
          <div><strong>{progress.wordsReviewed}</strong><span>Từ đã luyện</span></div>
          <div><strong>{accuracy}%</strong><span>Nhớ đúng</span></div>
          <div><strong>+{progress.xpEarned}</strong><span>XP</span></div>
        </div>
        {reinforced > 0 && <p>Bạn đã gặp lại {reinforced} từ hoặc cụm từ cần củng cố ở cuối phiên.</p>}
        <div className="session-actions">
          <button type="button" className={onContinue ? 'button-secondary' : 'button-primary'} onClick={onExit}>
            Về khu luyện tập
          </button>
          {onContinue && (
            <button type="button" className="button-primary" onClick={onContinue}>
              {isPlannedSession ? 'Phiên kế tiếp' : 'Luyện lại phiên này'}
              {isPlannedSession ? <ArrowRight size={17} aria-hidden="true" /> : <RotateCcw size={17} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      <div className="session-toolbar">
        <button type="button" className="button-secondary" onClick={onExit} aria-label="Thoát phiên">
          <ArrowLeft size={17} aria-hidden="true" /> <span>Thoát phiên</span>
        </button>
        <div className="session-meta" tabIndex={-1} ref={sessionHeading}>
          <span>{label}</span>
          <strong>{retry ? 'Ôn lại ' + (index - sessionWords.length + 1) + '/' + (queue.length - sessionWords.length) : 'Thẻ ' + (index + 1) + '/' + sessionWords.length}</strong>
        </div>
        <button type="button" className="icon-button" onClick={onToggleZenMode} aria-pressed={zenMode}
          aria-label={zenMode ? 'Thoát chế độ tập trung' : 'Bật chế độ tập trung'} title={zenMode ? 'Thoát chế độ tập trung' : 'Chế độ tập trung'}>
          {zenMode ? <Focus size={19} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}
        </button>
      </div>
      <div className="session-progress" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={0} aria-valuemax={sessionWords.length} aria-valuenow={completed}>
        <span style={{ width: completed / sessionWords.length * 100 + '%' }} />
      </div>
      {mode === 'speed' && <p className="session-timer"><Timer size={17} aria-hidden="true" /> {secondsLeft} giây</p>}

      <motion.div key={index} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <section className="glass-panel exercise-panel" aria-label={phraseCloze ? 'Điền cụm từ' : STUDY_MODE_LABELS[exerciseMode]}>
          <div className="exercise-top">
            <span className="exercise-status" data-new={isNew}>{status}</span>
            <div className="exercise-top-actions">
              {(firstExample?.phonetic || cloze?.phonetic) && (
                <button
                  type="button"
                  className="text-button example-pinyin-toggle"
                  aria-pressed={showExamplePhonetic}
                  onClick={toggleExamplePhonetic}
                >
                  {showExamplePhonetic ? 'Ẩn pinyin ví dụ' : 'Hiện pinyin ví dụ'}
                </button>
              )}
              {(isFlashcard && canSpeakPrompt || isChoices && !isPhrase) && (
                <button type="button" className="icon-button" onClick={() => speak()} aria-label="Nghe phát âm" title="Nghe phát âm">
                  <Volume2 size={19} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {isFlashcard && (
            <>
              <div className="recall">
                <p>{flipped ? 'Đáp án' : exercise.reverse ? 'Tự nhớ từ tương ứng với nghĩa sau' : 'Thử nhớ nghĩa trước khi xem đáp án'}</p>
                <h2 className="recall-term" lang={exercise.reverse && !flipped ? 'vi' : language}
                  data-meaning={exercise.reverse && !flipped} tabIndex={-1} ref={answerHeading}>
                  {exercise.reverse && !flipped ? word.meaning : word.term}
                </h2>
                {canSpeakPrompt && word.phonetic && <p className="recall-reading">{word.phonetic}</p>}
                {flipped && <p className="recall-answer">{word.meaning}</p>}
                {flipped && (word.partOfSpeech || word.sinoVietnamese) && (
                  <p className="recall-meta">{[word.partOfSpeech, word.sinoVietnamese].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              {!flipped ? (
                <div className="reveal-controls">
                  <button type="button" className="button-primary" onClick={reveal}>Xem đáp án <ArrowRight size={17} aria-hidden="true" /></button>
                  <span className="keyboard-hint">Phím <kbd>Space</kbd></span>
                </div>
              ) : (
                <div className="recall-detail">
                  <EnglishVariantDetails word={word} speechRate={settings.speechRate} />
                  {phraseInUse && (
                    <div className="example-line">
                      <div>
                        <p lang={language}>{phraseInUse.phrase}</p>
                        <p>Cụm dùng ngay · {phraseInUse.meaning}</p>
                      </div>
                      <button type="button" className="icon-button" onClick={() => speakExample(phraseInUse.phrase)} aria-label="Nghe cụm từ">
                        <Volume2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  {firstExample && (
                    <div className="example-line">
                      <div>
                        <p lang={language}>{word.language === 'zh' ? stripTrailingPinyin(firstExample.sentence) : firstExample.sentence}</p>
                        {showExamplePhonetic && firstExample.phonetic && <p className="example-phonetic">{firstExample.phonetic}</p>}
                        {firstExample.translation && <p>{firstExample.translation}</p>}
                      </div>
                      <button type="button" className="icon-button" onClick={() => speakExample(firstExample.sentence)} aria-label="Nghe câu ví dụ">
                        <Volume2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  <details className="word-details">
                    <summary>Cách dùng và phát âm <ChevronDown size={15} aria-hidden="true" /></summary>
                    {word.sinoVietnamese && <p>Âm Hán Việt · {word.sinoVietnamese}</p>}
                    {word.radical && <p>Bộ thủ · {word.radical}</p>}
                    {word.notes && <p>{word.notes}</p>}
                    {word.collocations.filter((item) => item !== phraseInUse)
                      .map((item, i) => <p key={i}><strong lang={language}>{item.phrase}</strong> · {item.meaning}</p>)}
                    {word.examples.slice(1).map((item, i) => (
                      <div className="example-line" key={i}>
                        <div>
                          <p lang={language}>{word.language === 'zh' ? stripTrailingPinyin(item.sentence) : item.sentence}</p>
                          {showExamplePhonetic && item.phonetic && <p className="example-phonetic">{item.phonetic}</p>}
                          {item.translation && <p>{item.translation}</p>}
                        </div>
                        <button className="icon-button" type="button" onClick={() => speakExample(item.sentence)} aria-label={'Nghe ví dụ ' + (i + 2)}><Volume2 size={17} aria-hidden="true" /></button>
                      </div>
                    ))}
                    <div className="practice-audio">
                      <button type="button" className="button-secondary" onClick={() => speak(0.7)}><Volume2 size={16} aria-hidden="true" /> Nghe chậm</button>
                      <button type="button" className="button-secondary" onClick={practiceSpeech}><Mic size={16} aria-hidden="true" /> Luyện phát âm</button>
                    </div>
                    {micStatus && <p role="status">{micStatus}</p>}
                  </details>
                </div>
              )}
            </>
          )}

          {isChoices && (
            <div className="question">
              <p>{isPhrase ? 'Chọn cụm từ phù hợp với nghĩa bên dưới' : 'Chọn nghĩa đúng của từ này'}</p>
              <h2 lang={isPhrase ? 'vi' : language}>{isPhrase ? getCollocationPrompt(word) : word.term}</h2>
              {!isPhrase && word.phonetic && <p className="recall-reading">{word.phonetic}</p>}
              <div className="choice-grid">
                {choices.map(({ id, label: answer }) => (
                  <button type="button" key={id} className="choice-button" disabled={choice !== null}
                    data-result={choice ? id === word.id ? 'correct' : choice === id ? 'incorrect' : undefined : undefined} onClick={() => choose(id)}>
                    <span lang={isPhrase ? language : 'vi'}>{answer}</span>
                    {choice && (id === word.id ? <Check size={18} aria-label="Đáp án đúng" /> : choice === id ? <X size={18} aria-label="Đáp án sai" /> : null)}
                  </button>
                ))}
              </div>
              {feedback && (
                <div className="exercise-feedback" data-correct={feedback.correct}>
                  <div role="status">
                    <strong>{feedback.message}</strong>
                    {mode !== 'speed' && firstExample && <p lang={language}>{word.language === 'zh' ? stripTrailingPinyin(firstExample.sentence) : firstExample.sentence}</p>}
                    {isPhrase && firstExample?.translation && <p>{firstExample.translation}</p>}
                    {mode !== 'speed' && showExamplePhonetic && firstExample?.phonetic && <p className="example-phonetic">{firstExample.phonetic}</p>}
                  </div>
                  {mode !== 'speed' && <button type="button" ref={nextButton} className="button-primary" onClick={() => advance()}>Tiếp tục <ArrowRight size={17} aria-hidden="true" /></button>}
                </div>
              )}
            </div>
          )}

          {(isDictation || isCloze || isSynthesis) && (
            <div className="question">
              <h2>{isDictation ? 'Nghe và gõ lại' : phraseCloze ? 'Điền cụm từ vào câu' : isCloze ? 'Điền từ vào câu' : 'Tự đặt câu'}</h2>
              {isDictation && (
                <div className="practice-audio">
                  <button type="button" className="button-secondary" onClick={() => speak()}><Volume2 size={17} aria-hidden="true" /> Nghe từ</button>
                  <button type="button" className="button-secondary" onClick={() => speak(0.65)}>Nghe chậm</button>
                </div>
              )}
              {isCloze && cloze && (
                <div className="example-line">
                  <div>
                    <p lang={language}>{feedback ? cloze.full : cloze.masked}</p>
                    {feedback && showExamplePhonetic && cloze.phonetic && <p className="example-phonetic">{cloze.phonetic}</p>}
                    <p>{cloze.translation}</p>
                    {phraseCloze && <p>Nghĩa của cụm · {phraseCloze.meaning}</p>}
                  </div>
                  {feedback && (
                    <button type="button" className="icon-button" onClick={() => speakExample(cloze.full)} aria-label="Nghe câu hoàn chỉnh">
                      <Volume2 size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
              {isSynthesis && (
                <p>Viết một câu có từ <strong lang={language}>{word.term}</strong> ({word.meaning}).
                  {word.collocations.length > 0 && <> Có thể dùng cụm <strong lang={language}>{word.collocations[0].phrase}</strong>.</>}
                </p>
              )}

              <form onSubmit={checkText} className="answer-form">
                <label htmlFor="study-response">{isSynthesis ? 'Câu của bạn' : 'Câu trả lời'}</label>
                {isSynthesis ? (
                  <textarea id="study-response" rows={3} value={typed} readOnly={!!feedback} onChange={(event) => setTyped(event.target.value)} />
                ) : (
                  <input id="study-response" type="text" value={typed} readOnly={!!feedback} autoComplete="off" spellCheck={false}
                    onChange={(event) => setTyped(event.target.value)} onKeyDown={suppressComposingEnter} />
                )}
                {!isSynthesis && !feedback && (
                  <div className="answer-hint">
                    <button type="button" className="text-button" aria-expanded={hint} onClick={() => { setHint(!hint); setUsedHint(true); }}>
                      {hint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
                    </button>
                    {hint && <span>Chữ đầu · {Array.from(expectedAnswer)[0]} {isDictation && ' · ' + word.meaning}</span>}
                  </div>
                )}
                {feedback && (
                  <div className="exercise-feedback" data-correct={feedback.correct}>
                    <div role="status">
                      <strong>{feedback.message}</strong>
                      {isSynthesis && firstExample && <p lang={language}>Câu mẫu · {word.language === 'zh' ? stripTrailingPinyin(firstExample.sentence) : firstExample.sentence}</p>}
                      {isSynthesis && showExamplePhonetic && firstExample?.phonetic && <p className="example-phonetic">{firstExample.phonetic}</p>}
                      {!isSynthesis && !phraseCloze && word.phonetic && <p>{word.phonetic}</p>}
                    </div>
                  </div>
                )}
                {isSynthesis && feedback ? (
                  <div className="session-actions">
                    <button type="button" className="button-secondary" onClick={() => finishSentence(false)}>Cần luyện thêm</button>
                    {feedback.correct && <button type="button" ref={nextButton} className="button-primary" onClick={() => finishSentence(true)}>Mình dùng được từ này</button>}
                    {!feedback.correct && <button type="button" ref={nextButton} className="button-primary" onClick={() => setFeedback(null)}>Sửa câu</button>}
                  </div>
                ) : (
                  <button type="submit" ref={nextButton} className="button-primary answer-submit" disabled={!typed.trim()}>
                    {feedback ? 'Tiếp tục' : isSynthesis ? 'Kiểm tra từ khóa' : 'Kiểm tra đáp án'} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                )}
              </form>
            </div>
          )}
        </section>
      </motion.div>

      {isFlashcard && flipped && (
        <div className="rating-area">
          <p>Bạn nhớ từ này đến mức nào?</p>
          <div className="rating-grid">
            {RATINGS.map(({ value, label: rating, tone }) => (
              <button type="button" className="glass-panel rating-button" key={value} data-tone={tone} onClick={() => rate(value)}>
                <span><kbd>{value}</kbd> {value === 1 && isNew ? 'Chưa biết' : rating}</span>
                {scheduled && <small>{formatIntervalVi(calculateNextSRS(word, value, settings.srsMode).srs.intervalDays)}</small>}
              </button>
            ))}
          </div>
          {!scheduled && !retry && nextReview !== null && <p className="rating-note">Lịch ôn · {new Date(nextReview).toLocaleDateString('vi-VN')}</p>}
          {retry && <p className="rating-note">Lượt này giúp củng cố từ vừa quên. Lịch ôn đã được ghi ở lượt đầu.</p>}
        </div>
      )}
    </div>
  );
}
