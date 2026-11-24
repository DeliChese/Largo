import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, Bot, Check, CornerDownLeft, RotateCcw, Swords, Timer, Users, Zap } from 'lucide-react';
import type { FormEvent } from 'react';
import type { VocabWord } from '../types/vocab';
import {
  buildChainLexicon, CHAIN_AI_ATTEMPTS, CHAIN_DIFFICULTIES, CHAIN_RELAY_SECONDS,
  checkChainMove, chooseChainMove, hasChainReply, nextChainTurn,
  type ChainDifficulty, type ChainEntry, type ChainLanguage, type ChainMode, type ChainPlayer, type ChainVariant,
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
  side: ChainPlayer | 'bot' | 'opening';
  entry: ChainEntry;
  key: string;
}

type Result = 'bot-stuck' | 'blocked' | 'timeout' | 'resigned';

interface Match {
  stage: 'player' | 'bot' | 'finished';
  turn: ChainPlayer;
  moves: ChainMove[];
  lexicon: ReturnType<typeof buildChainLexicon>;
  deadline: number;
  aiAttempts: number;
  result?: Result;
}

const VARIANTS = {
  duel: { label: 'Đấu với bot', description: 'Thay phiên nối từ. Thắng khi bot bí chữ.', icon: Bot },
  relay: { label: 'Tiếp sức 60 giây', description: 'Tự nối liên tiếp. Mọi lượt dùng chung đồng hồ.', icon: Zap },
  pass: { label: 'Hai người cùng máy', description: 'Chuyền thiết bị cho nhau sau mỗi lượt.', icon: Users },
} as const;

const MODES = { word: 'Từ đơn', mixed: 'Từ + cụm từ' } as const;
const MOVE_ERRORS = {
  first: 'Hãy bắt đầu bằng chữ cái đang hiển thị.',
  repeat: 'Từ hoặc cụm từ này đã được dùng trong ván.',
  unknown: 'Mục này chưa có trong kho từ đang chơi. Hãy thử từ khác.',
} as const;
const RESULT_DETAILS: Record<Result, string> = {
  'bot-stuck': 'Bot đã hết nước đi.',
  blocked: 'Đã hết từ phù hợp với chữ cần nối.',
  timeout: 'Đã hết thời gian.',
  resigned: 'Ván đã kết thúc.',
};

async function requestSuggestion(language: ChainLanguage, mode: ChainMode, first: string, signal: AbortSignal) {
  try {
    const response = await fetch('/api/ai/word-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, mode, first, consent: true }),
      redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_500)]),
    });
    return response.ok ? parseChainSuggestion(await response.json(), language, mode, first) : null;
  } catch {
    return null;
  }
}

export function WordChainGame({ words, language, savedTerms, onSaveWord, onBack }: Props) {
  const [variant, setVariant] = useState<ChainVariant>('duel');
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
  const roundSeconds = variant === 'relay' ? CHAIN_RELAY_SECONDS : settings.seconds;
  const latest = match?.moves.at(-1);
  const first = latest ? chainEnds(latest.key).last : '';
  const result = match?.result;
  const playing = match?.stage === 'player';
  const playerName = (side: ChainPlayer) => variant === 'pass' ? side === 'player' ? 'Người 1' : 'Người 2' : 'Bạn';
  const playedCount = match?.moves.filter(({ side }) => side === 'player' || side === 'partner').length ?? 0;
  const outcome = variant === 'relay' ? playedCount + ' lượt nối đúng'
    : variant === 'pass' ? playerName(match?.turn === 'player' ? 'partner' : 'player') + ' thắng'
      : result === 'bot-stuck' ? 'Bạn thắng!' : 'Bot thắng';

  function start() {
    const opening = chooseChainMove(lexicon, '', new Set(), difficulty);
    if (!opening) return;
    setInput('');
    setError('');
    setSeconds(roundSeconds);
    setMatch({
      stage: 'player', turn: 'player', moves: [{ side: 'opening', entry: opening, key: opening.key }],
      lexicon, deadline: Date.now() + roundSeconds * 1_000, aiAttempts: 0,
    });
  }

  useEffect(() => {
    if (match?.stage !== 'player') return;
    inputRef.current?.focus({ preventScroll: true });
    const tick = () => {
      const left = Math.max(0, Math.ceil((match.deadline - Date.now()) / 1_000));
      setSeconds(left);
      if (left === 0) setMatch((current) => current === match ? { ...match, stage: 'finished', result: 'timeout' } : current);
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
      let next: Match = { ...match, stage: 'finished', result: 'bot-stuck' };
      if (move) {
        used.add(move.key);
        const playable = hasChainReply(match.lexicon, chainEnds(move.key).last, used);
        next = {
          ...match, moves: [...match.moves, move], aiAttempts,
          ...nextChainTurn('duel', match.turn, match.deadline, Date.now(), settings.seconds),
          stage: playable ? 'player' : 'finished', result: playable ? undefined : 'blocked',
        };
      }
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
    const now = Date.now();
    if (now >= match.deadline) {
      setMatch({ ...match, stage: 'finished', result: 'timeout' });
      return;
    }
    const used = new Set(match.moves.map(({ key }) => key));
    const checked = checkChainMove(input, language, first, used, match.lexicon);
    if (checked.error) {
      setError(MOVE_ERRORS[checked.error]);
      return;
    }
    const { entry } = checked;
    const moves: ChainMove[] = [...match.moves, { side: match.turn, entry, key: entry.key }];
    setInput('');
    setError('');
    if (variant === 'duel') {
      setMatch({ ...match, stage: 'bot', moves });
      return;
    }
    used.add(entry.key);
    const playable = hasChainReply(match.lexicon, entry.last, used);
    setMatch({
      ...match, moves, ...nextChainTurn(variant, match.turn, match.deadline, now, settings.seconds),
      stage: playable ? 'player' : 'finished', result: playable ? undefined : 'blocked',
    });
  }

  return (
    <div className="word-chain">
      <button type="button" className="button-secondary chain-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Trò chơi
      </button>
      <header className="chain-hero">
        <div>
          <h1>Đấu trường nối từ</h1>
          <p>Dùng chữ cái cuối để bắt đầu từ tiếp theo.</p>
        </div>
        <div className="chain-hero-example" aria-label="Ví dụ nối từ">
          <span lang="en">exchang<strong>e</strong></span>
          <span aria-hidden="true">→</span>
          <span lang="en"><strong>e</strong>ntr<strong>y</strong></span>
          <span aria-hidden="true">→</span>
          <span lang="en"><strong>y</strong>ellow</span>
        </div>
      </header>

      {!match ? (
        <section className="glass-panel chain-setup" aria-label="Thiết lập ván">
          <fieldset className="chain-variants">
            <legend>Cách chơi</legend>
            {Object.entries(VARIANTS).map(([id, { label, description, icon: Icon }]) => (
              <label key={id} className="chain-variant" data-active={id === variant}>
                <input type="radio" name="chain-variant" value={id} checked={id === variant}
                  onChange={() => setVariant(id as ChainVariant)} />
                <Icon size={22} aria-hidden="true" />
                <strong>{label}</strong><small>{description}</small>
              </label>
            ))}
          </fieldset>
          <div className="chain-fields">
            <label>Kho từ
              <select value={mode} onChange={(event) => setMode(event.target.value as ChainMode)}>
                {Object.entries(MODES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            {variant !== 'relay' && <label>Độ khó
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ChainDifficulty)}>
                {Object.entries(CHAIN_DIFFICULTIES).map(([id, config]) => (
                  <option key={id} value={id}>{config.label} · {config.seconds} giây/lượt</option>
                ))}
              </select>
            </label>}
          </div>
          {variant === 'duel' && <label className="chain-consent">
            <input type="checkbox" checked={useDeepSeek} onChange={(event) => setUseDeepSeek(event.target.checked)} />
            <span>Bật DeepSeek khi bot hết từ trong kho
              <small>Gửi chữ cần nối và chế độ. Tối đa {CHAIN_AI_ATTEMPTS} lần mỗi ván.</small>
            </span>
          </label>}
          <div className="chain-controls">
            <button type="button" className="button-primary" onClick={start} disabled={!lexicon.canStart}>
              <Swords size={17} aria-hidden="true" /> Bắt đầu
            </button>
            {!lexicon.canStart && <p className="chain-muted">Kho này cần thêm từ có thể nối với nhau.</p>}
          </div>
        </section>
      ) : (
        <div className="chain-board">
          <section className="glass-panel chain-stage" aria-label="Trận đấu">
            <div className="chain-stage-top">
              <span>{VARIANTS[variant].label} · {MODES[mode]}</span>
              <span>{playedCount} lượt nối đúng</span>
            </div>
            {result ? (
              <div className="chain-outcome" role="status">
                <h2>{outcome}</h2><p className="chain-muted">{RESULT_DETAILS[result]}</p>
              </div>
            ) : (
              <>
                <div className="chain-prompt" data-bot={match.stage === 'bot'}>
                  <div className="chain-prompt-term" aria-live="polite">
                    <p>{playing ? 'Lượt của ' + playerName(match.turn).toLowerCase() : 'Bot đang nối từ'}</p>
                    <strong lang={language}>{latest?.entry.term}</strong>
                  </div>
                  <div className="chain-prompt-letter" aria-live="polite">
                    <span>Bắt đầu bằng</span>
                    <strong className="chain-letter" lang={language}>{first.toUpperCase()}</strong>
                  </div>
                </div>
                {playing && <div className="chain-clock" data-urgent={seconds <= 5}>
                  <Timer size={17} aria-hidden="true" />
                  <progress value={seconds} max={roundSeconds} aria-label="Thời gian còn lại" />
                  <span role="timer" aria-label={`Còn ${seconds} giây`}>{seconds} giây</span>
                </div>}
                <form className="chain-form" onSubmit={submit}>
                  <label className="sr-only" htmlFor="chain-input">Từ nối của bạn</label>
                  <input id="chain-input" ref={inputRef} value={input} onChange={(event) => {
                    setInput(event.target.value);
                    setError('');
                  }} placeholder={mode === 'word' ? 'Nhập từ nối' : 'Nhập từ hoặc cụm từ'} autoComplete="off"
                    autoCapitalize="none" spellCheck={false} maxLength={120} disabled={!playing}
                    aria-invalid={!!error} aria-describedby={error ? 'chain-error' : undefined} />
                  <button type="submit" className="button-primary" disabled={!playing || !input.trim()}>
                    <CornerDownLeft size={16} aria-hidden="true" /> Nối từ
                  </button>
                </form>
                {error && <p id="chain-error" className="chain-error" role="alert">{error}</p>}
              </>
            )}
            <div className="chain-controls">
              {result ? (
                <>
                  <button type="button" className="button-primary" onClick={start}>
                    <RotateCcw size={16} aria-hidden="true" /> Chơi lại
                  </button>
                  <button type="button" className="button-secondary" onClick={() => setMatch(null)}>Đổi cách chơi</button>
                </>
              ) : (
                <button type="button" className="button-secondary"
                  onClick={() => setMatch({ ...match, stage: 'finished', result: 'resigned' })}>
                  {variant === 'relay' ? 'Kết thúc lượt chơi' : 'Chịu thua'}
                </button>
              )}
            </div>
          </section>
          <section className="glass-panel chain-history" aria-labelledby="chain-history-title">
            <h2 id="chain-history-title">Chuỗi đã nối</h2>
            <ol>
              {[...match.moves].reverse().map(({ side, entry, key }) => {
                const saved = savedTerms.has(key);
                const label = side === 'opening' ? 'Từ mở màn'
                  : side === 'bot' ? entry.generated ? 'Bot · DeepSeek' : 'Bot'
                    : playerName(side);
                return (
                  <li key={key}>
                    <div className="chain-move">
                      <span className="chain-side">{label}</span>
                      <strong lang={language}>{entry.term}</strong>
                      <span className="chain-muted">{entry.meaning}</span>
                    </div>
                    <button type="button" className="button-secondary chain-save" onClick={() => onSaveWord(entry)}
                      disabled={saved} aria-label={`${saved ? 'Đã lưu' : 'Lưu'} ${entry.term}`}>
                      {saved ? <Check size={15} aria-hidden="true" /> : <Bookmark size={15} aria-hidden="true" />}
                      {saved ? 'Đã lưu' : 'Lưu từ'}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
