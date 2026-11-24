import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, Bot, Check, CornerDownLeft, RotateCcw, Swords, Timer } from 'lucide-react';
import type { FormEvent } from 'react';
import type { VocabWord } from '../types/vocab';
import {
  buildChainLexicon, CHAIN_AI_ATTEMPTS, CHAIN_DIFFICULTIES, checkChainMove, chooseChainMove,
  type ChainDifficulty, type ChainEntry, type ChainLanguage, type ChainMode,
} from '../utils/wordChain';
import { chainEnds, normalizeChainTerm, parseChainSuggestion } from '../utils/wordChainRules.mjs';
import './wordChain.css';

interface Props {
  words: VocabWord[];
  language: ChainLanguage;
  savedTerms: ReadonlySet<string>;
  onSaveWord: (entry: ChainEntry) => void;
  onBack: () => void;
}

interface ChainMove {
  side: 'player' | 'bot';
  entry: ChainEntry;
  key: string;
}

interface Match {
  stage: 'player' | 'bot' | 'won' | 'timeout' | 'resigned';
  moves: ChainMove[];
  lexicon: ReturnType<typeof buildChainLexicon>;
  deadline: number;
  aiAttempts: number;
}

const MODES = {
  word: 'Từ đơn',
  mixed: 'Từ + cụm từ',
} as const;

const MOVE_ERRORS = {
  first: 'Hãy bắt đầu bằng ký tự đang hiển thị.',
  repeat: 'Từ hoặc cụm từ này đã được dùng trong ván.',
  unknown: 'Mục này chưa có trong kho từ của chế độ đang chơi. Hãy thử một từ khác.',
} as const;

async function requestSuggestion(language: ChainLanguage, mode: ChainMode, first: string, signal: AbortSignal) {
  try {
    const response = await fetch('/api/ai/word-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, mode, first, consent: true }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_500)]),
    });
    return response.ok ? parseChainSuggestion(await response.json(), language, mode, first) : null;
  } catch {
    return null;
  }
}

export function WordChainGame({ words, language, savedTerms, onSaveWord, onBack }: Props) {
  const [mode, setMode] = useState<ChainMode>('mixed');
  const [difficulty, setDifficulty] = useState<ChainDifficulty>('normal');
  const [useDeepSeek, setUseDeepSeek] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lexicon = useMemo(() => buildChainLexicon(words, language, mode), [words, language, mode]);
  const settings = CHAIN_DIFFICULTIES[difficulty];
  const latest = match?.moves.at(-1);
  const first = latest ? chainEnds(latest.key).last : '';
  const finished = match && match.stage !== 'player' && match.stage !== 'bot';

  function start() {
    const opening = chooseChainMove(lexicon, '', new Set(), difficulty);
    if (!opening) return;
    setInput('');
    setError('');
    setSeconds(settings.seconds);
    setMatch({
      stage: 'player', moves: [{ side: 'bot', entry: opening, key: opening.key }], lexicon,
      deadline: Date.now() + settings.seconds * 1_000, aiAttempts: 0,
    });
  }

  useEffect(() => {
    if (match?.stage !== 'player') return;
    inputRef.current?.focus({ preventScroll: true });
    const tick = () => {
      const left = Math.max(0, Math.ceil((match.deadline - Date.now()) / 1_000));
      setSeconds(left);
      if (left === 0) setMatch((current) => current === match ? { ...match, stage: 'timeout' } : current);
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [match]);

  useEffect(() => {
    if (match?.stage !== 'bot') return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const used = new Set(match.moves.map(({ key }) => key));
      const local = chooseChainMove(match.lexicon, first, used, difficulty);
      let move: ChainMove | undefined = local ? { side: 'bot', entry: local, key: local.key } : undefined;
      let aiAttempts = match.aiAttempts;
      if (!move && useDeepSeek && aiAttempts < CHAIN_AI_ATTEMPTS && navigator.onLine) {
        aiAttempts += 1;
        const suggestion = await requestSuggestion(language, mode, first, controller.signal);
        if (suggestion) {
          const key = normalizeChainTerm(suggestion.term, language);
          if (!used.has(key)) move = { side: 'bot', key, entry: { ...suggestion, generated: true } };
        }
      }
      if (controller.signal.aborted) return;
      const next: Match = move
        ? { ...match, moves: [...match.moves, move], aiAttempts, stage: 'player',
            deadline: Date.now() + settings.seconds * 1_000 }
        : { ...match, stage: 'won' };
      setSeconds(settings.seconds);
      setMatch((current) => current === match ? next : current);
    }, settings.botDelay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [match, first, difficulty, settings, useDeepSeek, language, mode]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (match?.stage !== 'player') return;
    if (Date.now() >= match.deadline) {
      setMatch({ ...match, stage: 'timeout' });
      return;
    }
    const used = new Set(match.moves.map(({ key }) => key));
    const result = checkChainMove(input, language, first, used, match.lexicon);
    if (result.error) {
      setError(MOVE_ERRORS[result.error]);
      return;
    }
    const { entry } = result;
    setMatch({ ...match, stage: 'bot', moves: [...match.moves, { side: 'player', entry, key: entry.key }] });
    setInput('');
    setError('');
  }

  return (
    <div className="word-chain">
      <button type="button" className="button-secondary" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Trò chơi
      </button>
      <header className="page-intro">
        <h1>Đấu trường nối từ</h1>
        <p>Lấy chữ cái cuối của lượt trước để bắt đầu lượt sau. Ví dụ: exchange → entry → yellow.</p>
      </header>

      {!match ? (
        <section className="glass-panel chain-setup" aria-label="Thiết lập trận đấu">
          <div className="chain-fields">
            <label>Chế độ
              <select value={mode} onChange={(event) => setMode(event.target.value as ChainMode)}>
                {Object.entries(MODES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <label>Độ khó
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ChainDifficulty)}>
                {Object.entries(CHAIN_DIFFICULTIES).map(([id, config]) => (
                  <option key={id} value={id}>{config.label} · {config.seconds}s/lượt</option>
                ))}
              </select>
            </label>
          </div>
          <p className="chain-muted">Bot đi trước. Dùng từ trong kho Largo, mỗi từ chỉ được chơi một lần.</p>
          <label className="chain-consent">
            <input type="checkbox" checked={useDeepSeek} onChange={(event) => setUseDeepSeek(event.target.checked)} />
            <span>Bật DeepSeek khi bot hết từ trong kho
              <small>Chỉ gửi ký tự cần nối và chế độ. Tối đa {CHAIN_AI_ATTEMPTS} lần mỗi ván.</small>
            </span>
          </label>
          <button type="button" className="button-primary" onClick={start} disabled={!lexicon.canStart}>
            <Swords size={17} aria-hidden="true" /> Bắt đầu đấu
          </button>
          {!lexicon.canStart && <p className="chain-muted">Kho hiện tại cần thêm từ có thể nối với nhau để bắt đầu.</p>}
        </section>
      ) : (
        <>
          <section className="glass-panel chain-stage" aria-label="Trận đấu">
            <div className="chain-stage-top">
              <span>{MODES[mode]} · {settings.label}</span>
              <span>{match.moves.filter(({ side }) => side === 'player').length} lượt nối đúng</span>
            </div>
            {finished ? (
              <div className="chain-outcome" role="status">
                <h2>{match.stage === 'won' ? 'Bạn thắng!' : 'Bot thắng'}</h2>
                <p className="chain-muted">{match.stage === 'won' ? 'Bot đã hết nước đi.'
                  : match.stage === 'timeout' ? 'Bạn đã hết thời gian cho lượt này.' : 'Bạn đã chịu thua.'}</p>
              </div>
            ) : (
              <div className="chain-prompt">
                <div aria-live="polite">
                  <p className="chain-muted">{match.stage === 'player' ? 'Lượt của bạn · Bắt đầu bằng' : 'Bot đang nối từ bằng'}</p>
                  <div className="chain-letter" lang={language}>{first.toUpperCase()}</div>
                </div>
                {match.stage === 'player' && (
                  <span className="chain-clock" data-urgent={seconds <= 5} role="timer" aria-label={`Còn ${seconds} giây`}>
                    <Timer size={18} aria-hidden="true" /> {seconds}s
                  </span>
                )}
              </div>
            )}

            {!finished && (
              <>
                <form className="chain-form" onSubmit={submit}>
                  <label className="sr-only" htmlFor="chain-input">Từ nối của bạn</label>
                  <input id="chain-input" ref={inputRef} value={input} onChange={(event) => {
                    setInput(event.target.value);
                    setError('');
                  }} placeholder={mode === 'word' ? 'Nhập từ nối' : 'Nhập từ hoặc cụm từ nối'}
                    autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={120}
                    disabled={match.stage !== 'player'} aria-invalid={!!error} aria-describedby={error ? 'chain-error' : undefined} />
                  <button type="submit" className="button-primary" disabled={match.stage !== 'player' || !input.trim()}>
                    <CornerDownLeft size={16} aria-hidden="true" /> Nối từ
                  </button>
                </form>
                {error && <p id="chain-error" className="chain-error" role="alert">{error}</p>}
              </>
            )}
            <div className="chain-controls">
              {finished ? (
                <>
                  <button type="button" className="button-primary" onClick={start}>
                    <RotateCcw size={16} aria-hidden="true" /> Đấu lại
                  </button>
                  <button type="button" className="button-secondary" onClick={() => setMatch(null)}>Đổi thiết lập</button>
                </>
              ) : (
                <button type="button" className="button-secondary" onClick={() => setMatch({ ...match, stage: 'resigned' })}>Chịu thua</button>
              )}
            </div>
          </section>

          <section className="glass-panel chain-history" aria-labelledby="chain-history-title">
            <h2 id="chain-history-title">Các lượt đã chơi</h2>
            <ol>
              {[...match.moves].reverse().map(({ side, entry, key }) => {
                const saved = savedTerms.has(key);
                return (
                  <li key={key}>
                    <div className="chain-move">
                      <span className="chain-side">{side === 'bot' ? <Bot size={15} aria-hidden="true" /> : null}
                        {side === 'player' ? 'Bạn' : entry.generated ? 'Bot · DeepSeek' : 'Bot'}
                      </span>
                      <strong lang={language}>{entry.term}</strong>
                      {side === 'bot' && <span className="chain-muted">{entry.meaning}</span>}
                    </div>
                    {side === 'bot' && (
                      <button type="button" className="button-secondary" onClick={() => onSaveWord(entry)} disabled={saved}
                        aria-label={`${saved ? 'Đã lưu' : 'Lưu'} ${entry.term}`}
                        title="Bộ cá nhân Đấu trường nối từ">
                        {saved ? <Check size={15} aria-hidden="true" /> : <Bookmark size={15} aria-hidden="true" />}
                        {saved ? 'Đã lưu' : 'Lưu từ'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
