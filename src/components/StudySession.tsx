import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Focus, Maximize, Mic, RotateCcw, Timer, Volume2, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AppSettings, ReviewQuality, StudySessionMode, VocabWord } from '../types/vocab';
import { WordExamples } from './WordExamples';
import { WordExampleGenerator } from './WordExampleGenerator';
import { WordRelations } from './WordRelations';
import { SentenceAiFeedback } from './SentenceAiFeedback';
import { isSentenceAssessmentLanguage } from '../utils/sentenceAssessment.mjs';
import { calculateNextSRS, evaluateAnswerMatch, formatIntervalVi } from '../utils/srsBloom';
import {
  getClozeExample, getCollocationPrompt, getPhraseClozeExample, getStudyChoices,
  getStudyExercise, isScheduledReview, STUDY_MODE_LABELS,
} from '../utils/studyPlan';
import { soundEngine, speakLocalPronunciation, speakPronunciation, stopPronunciation } from '../utils/soundEngine';
import { DEFAULT_ENGLISH_LOCALE } from '../utils/englishStudy';
import { EnglishPronunciation, EnglishVariantDetails } from './EnglishVariantDetails';
import { createLearningAttempt, type LearningAttemptEvent } from '../utils/learningAttempt';
import { describeMastery, type WordMastery } from '../utils/mastery';
import { explainPlanItem, type AdaptiveStudyPlan, type PlanItem } from '../utils/adaptivePlanner';
import {
  EMPTY_PROGRESS, gradeChoice, gradeSelfRating, gradeSentence, gradeText, studyContextId,
  type LocalGrade, type SessionProgress, type StudySessionIdentity,
} from '../utils/studyAttempt';

interface StudySessionProps {
  mode: StudySessionMode;
  session: StudySessionIdentity;
  sessionWords: VocabWord[];
  adaptivePlan?: Pick<AdaptiveStudyPlan, 'plannerVersion' | 'items'>;
  allWords: VocabWord[];
  masteryByWord: ReadonlyMap<string, WordMastery>;
  settings: AppSettings;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onRecordReview: (attempt: LearningAttemptEvent) => Promise<{ progress: SessionProgress; retained: boolean }>;
  onExit: () => void;
  onContinue?: () => void;
}

interface SessionCard {
  word: VocabWord;
  exercise: ReturnType<typeof getStudyExercise>;
  retries: number;
  suggestion?: PlanItem;
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

const SPEED_DURATION = 60_000;
const AI_PILOT_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function newPrompt() {
  return {
    startedAt: Date.now(),
    eventId: globalThis.crypto?.randomUUID?.() ?? 'attempt-' + Date.now() + '-' + Math.random().toString(36).slice(2),
  };
}

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

export function StudySession({ mode, session, sessionWords, adaptivePlan, allWords, masteryByWord, settings, zenMode, onToggleZenMode, onRecordReview, onExit, onContinue }: StudySessionProps) {
  const [queue, setQueue] = useState<SessionCard[]>(() => sessionWords.map((word, index) => {
    const item = adaptivePlan?.items[index];
    const suggestion = item?.wordId === word.id ? item : undefined;
    const exercise = suggestion
      ? { mode: suggestion.taskType, reverse: suggestion.reverse, phrase: suggestion.phrase }
      : getStudyExercise(word, mode, false);
    return { word, exercise, retries: 0, suggestion };
  }));
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<SessionProgress>(EMPTY_PROGRESS);
  const [prompt, setPrompt] = useState(newPrompt);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [ledgerUnavailable, setLedgerUnavailable] = useState(false);
  const [previewedSentence, setPreviewedSentence] = useState<LocalGrade>();
  const [revisingSentence, setRevisingSentence] = useState(false);
  const submission = useRef<(() => Promise<void>) | undefined>(undefined);
  const inFlight = useRef(false);
  const attemptIndex = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [micStatus, setMicStatus] = useState('');
  const [audioStatus, setAudioStatus] = useState('');
  const gradedCard = useRef(-1);
  const timedAdvance = useRef<number | undefined>(undefined);
  const sessionLibrary = useRef(allWords);
  const sessionHeading = useRef<HTMLDivElement>(null);
  const answerHeading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const speech = useRef<SpeechRecognizer | null>(null);

  const { word, exercise, retries, suggestion } = queue[index];
  const retry = retries > 0;
  const isIntensive = mode === 'intensive';
  const isPlannedSession = mode === 'guided' || isIntensive;
  const exerciseMode = exercise.mode;
  const isFlashcard = exerciseMode === 'flashcard';
  const isDictation = exerciseMode === 'dictation';
  const offlineDictation = !!suggestion && isDictation;
  const isCloze = exerciseMode === 'cloze';
  const isSynthesis = exerciseMode === 'synthesis';
  const isPhrase = exerciseMode === 'collocation';
  const isChoices = exerciseMode === 'quiz' || exerciseMode === 'speed' || isPhrase;
  const exampleOffset = Number.parseInt(studyContextId(session.id), 36);
  const phraseCloze = useMemo(() => exercise.phrase ? getPhraseClozeExample(word, exampleOffset) : null, [word, exercise.phrase, exampleOffset]);
  const cloze = useMemo(() => isCloze ? phraseCloze ?? getClozeExample(word, exampleOffset) : null, [word, isCloze, phraseCloze, exampleOffset]);
  const expectedAnswer = cloze?.answer ?? word.term;
  const scheduled = !retry && isScheduledReview(word, prompt.startedAt);
  const choices = useMemo(
    () => isChoices ? getStudyChoices(word, sessionLibrary.current, isPhrase) : [],
    [word, isChoices, isPhrase],
  );
  const language = DEFAULT_ENGLISH_LOCALE;
  const canSpeakPrompt = !exercise.reverse || flipped;
  const shouldAutoSpeak = isDictation || (settings.autoPlayAudio && (isFlashcard || exerciseMode === 'quiz') && canSpeakPrompt);

  useEffect(() => {
    if (shouldAutoSpeak && !finished) {
      if (offlineDictation) speakLocalPronunciation(word.term, word.language, settings.speechRate);
      else speakPronunciation(word.term, word.language, settings.speechRate);
    }
    return stopPronunciation;
  }, [index, word, offlineDictation, shouldAutoSpeak, settings.speechRate, finished]);

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
      const remaining = Math.max(0, session.startedAt + SPEED_DURATION - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining === 0 && !submission.current) setFinished(true);
    };
    const timer = window.setInterval(clock, 200);
    return () => window.clearInterval(timer);
  }, [mode, finished, session.startedAt]);

  useEffect(() => () => window.clearTimeout(timedAdvance.current), []);

  function advance(extraRetry = false) {
    if (index + 1 >= queue.length && !extraRetry) {
      setFinished(true);
      soundEngine.playLevelUp();
      return;
    }
    setIndex(index + 1);
    setPrompt(newPrompt());
    setFlipped(false);
    setTyped('');
    setHint(false);
    setUsedHint(false);
    setChoice(null);
    setFeedback(null);
    setPreviewedSentence(undefined);
    setRevisingSentence(false);
    setMicStatus('');
    setAudioStatus('');
  }

  function record(grade: LocalGrade, onSaved: (repeat: boolean) => void) {
    const now = Math.max(Date.now(), prompt.startedAt);
    if (finished || submission.current || gradedCard.current >= index || (mode === 'speed' && now - session.startedAt >= SPEED_DURATION)) return;
    const { outcome, quality, assessmentSource, criteria } = grade;
    const retryLimit = isIntensive && index + 1 < queue.length ? 2 : 1;
    const needsRetry = outcome === 'incorrect' || (isIntensive && !retry && quality === 2);
    const repeat = needsRetry && mode !== 'speed' && !isSynthesis && retries < retryLimit;
    const skill = isSynthesis ? 'production' : isDictation ? 'listening' : phraseCloze || isPhrase ? 'collocation'
      : isCloze ? 'context' : 'recognition';
    const context = cloze?.masked ?? (isPhrase ? getCollocationPrompt(word) : undefined) ?? exerciseMode;
    const event = createLearningAttempt({
      ...prompt, sessionId: session.id, attemptIndex: attemptIndex.current, wordId: word.id, language: word.language,
      taskType: exerciseMode, source: mode === 'guided' || isIntensive ? mode : 'manual',
      answeredAt: now, isRetry: retry || revisingSentence, scheduledAtStart: scheduled && !isSynthesis,
      hintCount: Number(usedHint), revealedAnswer: flipped || (isSynthesis && usedHint),
      assessmentSource, criteria, quality, outcome, skill, contextId: studyContextId(context),
      ...(adaptivePlan && { adaptivePlan: {
        version: adaptivePlan.plannerVersion, plannedItems: adaptivePlan.items.length,
        weakSkill: suggestion?.reasonCode.startsWith('weak_') ?? false,
      } }),
    });
    submission.current = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaving(true);
      setSaveError('');
      try {
        const saved = await onRecordReview(event);
        submission.current = undefined;
        attemptIndex.current += 1;
        gradedCard.current = index;
        setProgress(saved.progress);
        if (!saved.retained) setLedgerUnavailable(true);
        if (outcome === 'correct') soundEngine.playCorrect();
        if (outcome === 'incorrect') soundEngine.playIncorrect();
        if (repeat) {
          const recovery = getStudyExercise(word, exerciseMode, true);
          const nextExercise = exercise.phrase ? exercise : { ...recovery, reverse: recovery.reverse || exercise.reverse };
          setQueue((cards) => [...cards, { word, exercise: nextExercise, retries: retries + 1 }]);
        }
        onSaved(repeat);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Largo chưa lưu được lượt trả lời.');
      } finally {
        inFlight.current = false;
        setSaving(false);
      }
    };
    void submission.current();
  }

  function reveal() {
    soundEngine.playFlip();
    setFlipped(true);
  }

  function rate(quality: ReviewQuality) {
    if (!flipped) return;
    record(gradeSelfRating(quality), advance);
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
    if (offlineDictation) {
      const started = speakLocalPronunciation(word.term, word.language, rate);
      setAudioStatus(started ? '' : 'Giọng đọc trên thiết bị hiện không khả dụng.');
    } else {
      speakPronunciation(word.term, word.language, rate);
    }
  }

  function useFlashcardForAudio() {
    if (submission.current || gradedCard.current >= index) return;
    stopPronunciation();
    setQueue((cards) => cards.map((card, position) => position === index
      ? { ...card, exercise: { mode: 'flashcard', reverse: false }, suggestion: undefined } : card));
    setTyped('');
    setHint(false);
    setUsedHint(false);
    setAudioStatus('');
    setPrompt(newPrompt());
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
    if (choice) return;
    const grade = gradeChoice(answer, word.id, choices.find(({ id }) => id === word.id)?.label ?? word.meaning);
    record(grade, () => {
      setChoice(answer);
      setFeedback({ correct: grade.outcome === 'correct', message: grade.message });
      if (mode === 'speed') timedAdvance.current = window.setTimeout(() => advance(), 420);
    });
  }

  function checkText(event: FormEvent) {
    event.preventDefault();
    if (feedback) {
      if (!isSynthesis) advance();
      return;
    }
    if (!typed.trim()) return;
    if (isSynthesis) {
      const grade = gradeSentence(typed, word);
      record(grade, () => setPreviewedSentence(grade));
      return;
    }
    const grade = gradeText(typed, expectedAnswer, usedHint);
    record(grade, () => setFeedback({ correct: grade.outcome === 'correct', message: grade.message }));
  }

  function reviseSentence() {
    setUsedHint(true);
    setRevisingSentence(true);
    setPreviewedSentence(undefined);
    setPrompt(newPrompt());
    gradedCard.current = index - 1;
  }

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
        <p>{mode === 'synthesis' ? 'Bạn đã luyện đặt câu và đối chiếu với câu mẫu.'
          : progress.wordsReviewed ? 'Kết quả của lượt trả lời đầu tiên.' : 'Phiên này chưa có câu trả lời.'}</p>
        {mode !== 'synthesis' && <div className="summary-metrics">
          <div><strong>{progress.wordsReviewed}</strong><span>Từ đã luyện</span></div>
          <div><strong>{accuracy}%</strong><span>Nhớ đúng</span></div>
          <div><strong>+{progress.xpEarned}</strong><span>XP</span></div>
        </div>}
        {ledgerUnavailable && <p>Lịch ôn đã lưu trên thiết bị. Trình duyệt chưa lưu được lịch sử từng lượt.</p>}
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
        <button type="button" className="button-secondary" onClick={onExit} aria-label="Thoát phiên" disabled={saving}>
          <ArrowLeft size={17} aria-hidden="true" /> <span>Thoát phiên</span>
        </button>
        <div className="session-meta" tabIndex={-1} ref={sessionHeading}>
          <span>{label}</span>
          <strong>{retry ? 'Ôn lại ' + (index - sessionWords.length + 1) + '/' + (queue.length - sessionWords.length) : 'Thẻ ' + (index + 1) + '/' + sessionWords.length}</strong>
        </div>
        <button type="button" className="icon-button" onClick={onToggleZenMode} aria-pressed={zenMode} disabled={saving}
          aria-label={zenMode ? 'Thoát chế độ tập trung' : 'Bật chế độ tập trung'} title={zenMode ? 'Thoát chế độ tập trung' : 'Chế độ tập trung'}>
          {zenMode ? <Focus size={19} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}
        </button>
      </div>
      <div className="session-progress" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={0} aria-valuemax={sessionWords.length} aria-valuenow={completed}>
        <span style={{ width: completed / sessionWords.length * 100 + '%' }} />
      </div>
      <p className="rating-note">Năng lực · {describeMastery(masteryByWord.get(word.id))}</p>
      {suggestion && <p className="rating-note">{explainPlanItem(suggestion)}</p>}
      {mode === 'speed' && <p className="session-timer"><Timer size={17} aria-hidden="true" /> {secondsLeft} giây</p>}
      {saving && <p role="status">Đang lưu lượt trả lời…</p>}
      {saveError && (
        <div className="form-error" role="alert">
          <p>{saveError}</p>
          <button type="button" className="button-secondary" onClick={() => void submission.current?.()}>Thử lưu lại</button>
        </div>
      )}

      <motion.div key={index} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <section className="glass-panel exercise-panel" aria-label={phraseCloze ? 'Điền cụm từ' : STUDY_MODE_LABELS[exerciseMode]}>
          <div className="exercise-top">
            <span className="exercise-status" data-new={isNew}>{status}</span>
            <div className="exercise-top-actions">
              {(isFlashcard && canSpeakPrompt || isChoices && !isPhrase) && (
                <EnglishVariantDetails word={word} speechRate={settings.speechRate} />
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
                {flipped && <p className="recall-answer"><span className="sr-only">Nghĩa · </span>{word.meaning}</p>}
                {flipped && word.partOfSpeech && (
                  <p className="recall-meta">{word.partOfSpeech}</p>
                )}
              </div>

              {!flipped ? (
                <div className="reveal-controls">
                  <button type="button" className="button-primary" onClick={reveal}>Xem đáp án <ArrowRight size={17} aria-hidden="true" /></button>
                  <span className="keyboard-hint">Phím <kbd>Space</kbd></span>
                </div>
              ) : (
                <div className="recall-detail">
                  {word.notes && (
                    <div className="example-line">
                      <div>
                        <p><strong>Giải thích và cách dùng</strong></p>
                        <p>{word.notes}</p>
                      </div>
                    </div>
                  )}
                  {phraseInUse && (
                    <div className="example-line">
                      <div>
                        <p lang={language}>{phraseInUse.phrase}</p>
                        <p>Cụm từ đi kèm · {phraseInUse.meaning}</p>
                      </div>
                      <EnglishPronunciation text={phraseInUse.phrase} speechRate={settings.speechRate} label="cụm từ" />
                    </div>
                  )}
                  {word.collocations.filter((item) => item !== phraseInUse)
                    .map((item, i) => <p key={i}><strong lang={language}>{item.phrase}</strong> · {item.meaning}</p>)}
                  <WordExamples examples={word.examples.slice(0, 2)} speechRate={settings.speechRate} />
                  <WordRelations word={word} />
                  <WordExampleGenerator key={word.id} word={word} locale={language} level={session.level}
                    speechRate={settings.speechRate} />
                  <details className="word-details">
                    <summary>Ví dụ bổ sung và phát âm <ChevronDown size={15} aria-hidden="true" /></summary>
                    <WordExamples examples={word.examples.slice(2)} startAt={3} speechRate={settings.speechRate} />
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
                    data-result={choice ? id === word.id ? 'correct' : choice === id ? 'incorrect' : undefined : undefined}
                    aria-disabled={saving || !!saveError || undefined} onClick={() => choose(id)}>
                    <span lang={isPhrase ? language : 'vi'}>{answer}</span>
                    {choice && (id === word.id ? <Check size={18} aria-label="Đáp án đúng" /> : choice === id ? <X size={18} aria-label="Đáp án sai" /> : null)}
                  </button>
                ))}
              </div>
              {feedback && (
                <div className="exercise-feedback" data-correct={feedback.correct}>
                  <div role="status">
                    <strong>{feedback.message}</strong>
                    {mode !== 'speed' && firstExample && <p lang={language}>{firstExample.sentence}</p>}
                    {isPhrase && firstExample?.translation && <p>{firstExample.translation}</p>}
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
                  <EnglishPronunciation text={word.term} speechRate={settings.speechRate} label="từ cần nghe" offlineOnly={offlineDictation} />
                  <button type="button" className="button-secondary" onClick={() => speak(0.65)}>Nghe chậm</button>
                  {offlineDictation && !feedback && <button type="button" className="text-button"
                    onClick={useFlashcardForAudio} disabled={saving || !!saveError}>Đổi sang thẻ ghi nhớ</button>}
                  {audioStatus && <p role="status">{audioStatus}</p>}
                </div>
              )}
              {isCloze && cloze && (
                <div className="example-line">
                  <div>
                    <p lang={language}>{feedback ? cloze.full : cloze.masked}</p>
                    <p>{cloze.translation}</p>
                    {phraseCloze && <p>Nghĩa của cụm · {phraseCloze.meaning}</p>}
                  </div>
                  {feedback && <EnglishPronunciation text={cloze.full} speechRate={settings.speechRate} label="câu hoàn chỉnh" />}
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
                  <textarea id="study-response" rows={3} value={typed} readOnly={!!previewedSentence || saving || !!saveError} onChange={(event) => setTyped(event.target.value)} />
                ) : (
                  <input id="study-response" type="text" value={typed} readOnly={!!feedback || saving || !!saveError} autoComplete="off" spellCheck={false}
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
                {(previewedSentence || feedback) && (
                  <div className="exercise-feedback" data-correct={feedback?.correct}>
                    <div role="status">
                      <strong>{previewedSentence?.message ?? feedback?.message}</strong>
                      {isSynthesis && firstExample && <p lang={language}>Câu mẫu · {firstExample.sentence}</p>}
                      {!isSynthesis && !phraseCloze && word.phonetic && <p>{word.phonetic}</p>}
                    </div>
                  </div>
                )}
                {isSynthesis && previewedSentence ? (
                  <div className="session-actions">
                    <button type="button" className="button-secondary" disabled={saving || !!saveError}
                      onClick={reviseSentence}>Sửa câu</button>
                    <button type="button" ref={nextButton} className="button-primary" disabled={saving || !!saveError}
                      onClick={() => advance()}>Tiếp tục</button>
                  </div>
                ) : (
                  <button type="submit" ref={nextButton} className="button-primary answer-submit" disabled={!typed.trim() || saving || !!saveError}>
                    {feedback ? 'Tiếp tục' : isSynthesis ? 'Kiểm tra từ khóa' : 'Kiểm tra đáp án'} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                )}
              </form>
              {isSynthesis && isSentenceAssessmentLanguage(word.language) && window.location.protocol === 'http:' &&
                AI_PILOT_HOSTS.has(window.location.hostname) && <SentenceAiFeedback key={index} word={word} answer={typed} />}
            </div>
          )}
        </section>
      </motion.div>

      {isFlashcard && flipped && (
        <div className="rating-area">
          <p>Bạn nhớ từ này đến mức nào?</p>
          <div className="rating-grid">
            {RATINGS.map(({ value, label: rating, tone }) => (
              <button type="button" className="glass-panel rating-button" key={value} data-tone={tone} onClick={() => rate(value)} disabled={saving || !!saveError}>
                <span><kbd>{value}</kbd> {value === 1 && isNew ? 'Chưa biết' : rating}</span>
                {scheduled && <small>{formatIntervalVi(calculateNextSRS(word, value, settings.srsMode).intervalDays)}</small>}
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
