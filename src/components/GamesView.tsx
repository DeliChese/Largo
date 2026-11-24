import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Check,
  Gamepad2,
  Headphones,
  Layers,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Swords,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import type { UserProfile, VocabWord } from '../types/vocab';
import { evaluateAnswerMatch } from '../utils/srsBloom';
import { soundEngine, speakPronunciation } from '../utils/soundEngine';
import { EnglishPronunciation } from './EnglishVariantDetails';
import { WordChainGame } from './WordChainGame';
import type { ChainEntry, ChainLanguage } from '../utils/wordChain';

interface GamesViewProps {
  words: VocabWord[];
  profile: UserProfile;
  speechRate: number;
  arena?: {
    language: ChainLanguage;
    words: VocabWord[];
    savedTerms: ReadonlySet<string>;
    onSaveWord: (entry: ChainEntry) => void;
  };
  onSaveGameResult: (
    game: 'match' | 'wordfall' | 'scramble' | 'audioblitz',
    score: number,
    xpEarned: number,
  ) => void;
}

type ActiveGame = 'hub' | 'match' | 'wordfall' | 'scramble' | 'audioblitz' | 'wordchain';

interface MatchTile {
  uid: string;
  wordId: string;
  text: string;
  side: 'term' | 'meaning';
  matched: boolean;
}

interface FallingItem {
  id: string;
  word: VocabWord;
  x: number;
  y: number;
  speed: number;
}

export const GamesView: React.FC<GamesViewProps> = ({
  words,
  profile,
  speechRate,
  arena,
  onSaveGameResult,
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('hub');

  // --- GAME 1: MEMORY MATCH BLITZ ---
  const [matchTiles, setMatchTiles] = useState<MatchTile[]>([]);
  const [selectedTileUid, setSelectedTileUid] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [matchCombo, setMatchCombo] = useState(0);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [matchFinished, setMatchFinished] = useState(false);

  const startMatchGame = () => {
    const pool = [...words].sort(() => Math.random() - 0.5).slice(0, 6);
    const tiles: MatchTile[] = [];
    pool.forEach((w) => {
      tiles.push({ uid: `${w.id}-t`, wordId: w.id, text: w.term, side: 'term', matched: false });
      tiles.push({
        uid: `${w.id}-m`,
        wordId: w.id,
        text: w.meaning,
        side: 'meaning',
        matched: false,
      });
    });
    setMatchTiles(tiles.sort(() => Math.random() - 0.5));
    setSelectedTileUid(null);
    setMatchScore(0);
    setMatchCombo(0);
    setMatchSeconds(0);
    setMatchFinished(false);
    setActiveGame('match');
  };

  useEffect(() => {
    if (activeGame !== 'match' || matchFinished) return;
    const t = window.setInterval(() => setMatchSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeGame, matchFinished]);

  const handleTileClick = (tile: MatchTile) => {
    if (tile.matched || matchFinished) return;
    if (!selectedTileUid) {
      setSelectedTileUid(tile.uid);
      if (tile.side === 'term') {
        const w = words.find((item) => item.id === tile.wordId);
        if (w) speakPronunciation(w.term, w.language, speechRate);
      }
      return;
    }
    if (selectedTileUid === tile.uid) {
      setSelectedTileUid(null);
      return;
    }

    const first = matchTiles.find((t) => t.uid === selectedTileUid);
    if (!first) return;

    if (first.wordId === tile.wordId && first.side !== tile.side) {
      const nextCombo = matchCombo + 1;
      const gained = 80 + nextCombo * 20;
      const nextScore = matchScore + gained;
      soundEngine.playCombo(nextCombo);
      const updated = matchTiles.map((t) =>
        t.wordId === tile.wordId ? { ...t, matched: true } : t,
      );
      setMatchTiles(updated);
      setMatchCombo(nextCombo);
      setMatchScore(nextScore);
      setSelectedTileUid(null);

      if (updated.every((t) => t.matched)) {
        const timeBonus = Math.max(0, 120 - matchSeconds * 2);
        const total = nextScore + timeBonus;
        setMatchScore(total);
        setMatchFinished(true);
        soundEngine.playLevelUp();
        onSaveGameResult('match', total, Math.round(total / 15));
      }
    } else {
      soundEngine.playIncorrect();
      setMatchCombo(0);
      setMatchScore((s) => Math.max(0, s - 15));
      setSelectedTileUid(null);
    }
  };

  // --- GAME 2: WORD FALL ARCADE (CANVAS) ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallingRef = useRef<FallingItem[]>([]);
  const [wfRunning, setWfRunning] = useState(false);
  const [wfScore, setWfScore] = useState(0);
  const [wfLives, setWfLives] = useState(3);
  const [wfInput, setWfInput] = useState('');
  const [wfGameOver, setWfGameOver] = useState(false);
  const wfScoreRef = useRef(0);
  const wfLivesRef = useRef(3);

  const startWordFall = () => {
    fallingRef.current = [];
    wfScoreRef.current = 0;
    wfLivesRef.current = 3;
    setWfScore(0);
    setWfLives(3);
    setWfInput('');
    setWfGameOver(false);
    setWfRunning(true);
    setActiveGame('wordfall');
  };

  useEffect(() => {
    if (activeGame !== 'wordfall' || !wfRunning || wfGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const spawnWord = () => {
      const candidate = words[Math.floor(Math.random() * words.length)];
      if (!candidate) return;
      fallingRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        word: candidate,
        x: 90 + Math.random() * (canvas.width - 180),
        y: -24,
        speed: 34 + Math.min(45, wfScoreRef.current * 0.05),
      });
    };

    spawnWord();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      spawnTimer += dt;

      if (spawnTimer >= 2.7 && fallingRef.current.length < 4) {
        spawnTimer = 0;
        spawnWord();
      }

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0b1120' : '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 34);
      ctx.lineTo(canvas.width, canvas.height - 34);
      ctx.stroke();

      const remaining: FallingItem[] = [];
      for (const item of fallingRef.current) {
        item.y += item.speed * dt;
        if (item.y >= canvas.height - 34) {
          wfLivesRef.current -= 1;
          setWfLives(wfLivesRef.current);
          soundEngine.playIncorrect();
          if (wfLivesRef.current <= 0) {
            setWfGameOver(true);
            setWfRunning(false);
            onSaveGameResult('wordfall', wfScoreRef.current, Math.round(wfScoreRef.current / 12));
            return;
          }
          continue;
        }
        remaining.push(item);

        const label = item.word.meaning.length > 26 ? `${item.word.meaning.slice(0, 24)}…` : item.word.meaning;
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(label).width;
        const boxW = Math.max(130, textWidth + 28);
        const boxH = 38;
        const bx = Math.max(12, Math.min(canvas.width - boxW - 12, item.x - boxW / 2));

        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, item.y, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + boxW / 2, item.y + boxH / 2);
      }

      fallingRef.current = remaining;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeGame, wfRunning, wfGameOver, words, onSaveGameResult]);

  const submitWordFallGuess = (guess: string) => {
    const idx = fallingRef.current.findIndex((item) => evaluateAnswerMatch(guess, item.word.term));
    if (idx !== -1) {
      const hit = fallingRef.current[idx];
      fallingRef.current.splice(idx, 1);
      wfScoreRef.current += 100;
      setWfScore(wfScoreRef.current);
      setWfInput('');
      soundEngine.playCorrect();
      speakPronunciation(hit.word.term, hit.word.language, speechRate);
    }
  };

  const wordFallAssistChoices = useMemo(() => {
    if (activeGame !== 'wordfall') return [];
    const activeTerms = fallingRef.current.map((f) => f.word);
    const extras = words.filter((w) => !activeTerms.some((a) => a.id === w.id)).slice(0, 4);
    return [...activeTerms, ...extras].slice(0, 6).sort((a, b) => a.term.localeCompare(b.term));
  }, [activeGame, wfScore, wfLives, words]);

  // --- GAME 3: WORD SCRAMBLE ---
  const [scrambleQueue, setScrambleQueue] = useState<VocabWord[]>([]);
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [scrambleTiles, setScrambleTiles] = useState<Array<{ id: number; char: string; used: boolean }>>([]);
  const [scramblePicked, setScramblePicked] = useState<Array<{ id: number; char: string }>>([]);
  const [scrambleScore, setScrambleScore] = useState(0);
  const [scrambleFeedback, setScrambleFeedback] = useState<'ok' | 'err' | null>(null);
  const [scrambleFinished, setScrambleFinished] = useState(false);

  const loadScrambleRound = (w: VocabWord) => {
    const chars = Array.from(w.term);
    const pool = chars
      .map((char, id) => ({ id, char, used: false }))
      .sort(() => Math.random() - 0.5);
    setScrambleTiles(pool);
    setScramblePicked([]);
    setScrambleFeedback(null);
  };

  const startScrambleGame = () => {
    const multiChar = words.filter((w) => Array.from(w.term).length >= 2);
    const source = multiChar.length >= 6 ? multiChar : words;
    const pool = [...source].sort(() => Math.random() - 0.5).slice(0, 6);
    setScrambleQueue(pool);
    setScrambleIdx(0);
    setScrambleScore(0);
    setScrambleFinished(false);
    if (pool[0]) loadScrambleRound(pool[0]);
    setActiveGame('scramble');
  };

  const handlePickScrambleTile = (tileId: number) => {
    if (scrambleFeedback) return;
    const tile = scrambleTiles.find((t) => t.id === tileId);
    if (!tile || tile.used) return;
    const nextTiles = scrambleTiles.map((t) => (t.id === tileId ? { ...t, used: true } : t));
    const nextPicked = [...scramblePicked, { id: tile.id, char: tile.char }];
    setScrambleTiles(nextTiles);
    setScramblePicked(nextPicked);

    const current = scrambleQueue[scrambleIdx];
    if (current && nextPicked.length === Array.from(current.term).length) {
      const attempt = nextPicked.map((p) => p.char).join('');
      const ok = attempt === current.term;
      setScrambleFeedback(ok ? 'ok' : 'err');
      if (ok) {
        soundEngine.playCorrect();
        speakPronunciation(current.term, current.language, speechRate);
      } else {
        soundEngine.playIncorrect();
      }
      const nextScore = scrambleScore + (ok ? 120 : 20);
      setScrambleScore(nextScore);

      setTimeout(() => {
        if (scrambleIdx + 1 >= scrambleQueue.length) {
          soundEngine.playLevelUp();
          setScrambleFinished(true);
          onSaveGameResult('scramble', nextScore, Math.round(nextScore / 14));
        } else {
          const nxt = scrambleIdx + 1;
          setScrambleIdx(nxt);
          loadScrambleRound(scrambleQueue[nxt]);
        }
      }, 900);
    }
  };

  // --- GAME 4: AUDIO SPEED BLITZ (45s) ---
  const [abQueue, setAbQueue] = useState<VocabWord[]>([]);
  const [abIdx, setAbIdx] = useState(0);
  const [abScore, setAbScore] = useState(0);
  const [abCombo, setAbCombo] = useState(0);
  const [abSeconds, setAbSeconds] = useState(45);
  const [abFinished, setAbFinished] = useState(false);
  const [abPickedId, setAbPickedId] = useState<string | null>(null);

  const startAudioBlitz = () => {
    const pool = [...words].sort(() => Math.random() - 0.5).slice(0, 12);
    setAbQueue(pool);
    setAbIdx(0);
    setAbScore(0);
    setAbCombo(0);
    setAbSeconds(45);
    setAbFinished(false);
    setAbPickedId(null);
    setActiveGame('audioblitz');
    if (pool[0]) {
      speakPronunciation(pool[0].term, pool[0].language, speechRate);
    }
  };

  useEffect(() => {
    if (activeGame !== 'audioblitz' || abFinished) return;
    const t = window.setInterval(() => {
      setAbSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setAbFinished(true);
          onSaveGameResult('audioblitz', abScore, Math.round(abScore / 15));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activeGame, abFinished, abScore, onSaveGameResult]);

  const abOptions = useMemo(() => {
    const current = abQueue[abIdx];
    if (!current) return [];
    const others = words
      .filter((w) => w.id !== current.id)
      .sort((a, b) => a.term.localeCompare(b.term))
      .slice(0, 3);
    return [current, ...others].sort((a, b) => ((a.id.charCodeAt(0) + abIdx) % 7) - ((b.id.charCodeAt(0) + abIdx) % 7));
  }, [abQueue, abIdx, words]);

  if (activeGame === 'wordchain' && arena) {
    return <WordChainGame {...arena} onBack={() => setActiveGame('hub')} />;
  }

  if (activeGame === 'hub') {
    return (
      <div className="space-y-6">
        <div className="page-intro">
          <h1>Trò chơi từ vựng</h1>
          <p>Luyện nghe, nhận diện nghĩa và sắp xếp chữ bằng các từ trong kho của bạn.</p>
        </div>

        {arena && (
          <section className="chain-launch">
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold">Đấu trường nối từ</h2>
              <p className="text-sm">
                Đấu với bot, nối tiếp sức 60 giây hoặc chơi hai người trên cùng một máy.
              </p>
            </div>
            <button type="button" onClick={() => setActiveGame('wordchain')} className="button-primary">
              <Swords size={17} aria-hidden="true" /> Vào đấu trường
            </button>
          </section>
        )}

        {words.length === 0 ? (
          <section className="glass-panel p-5 sm:p-6 space-y-3" aria-labelledby="games-empty-title">
            <h2 id="games-empty-title" className="font-display text-xl font-bold">Chưa có từ để chơi</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thêm từ vào bộ hiện tại hoặc chọn cấp độ có sẵn từ vựng.</p>
            <a className="button-secondary" href="#/decks">Mở bộ từ vựng</a>
          </section>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
            className="glass-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  Kỷ lục: {profile.bestMatchScore} điểm
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Ghép cặp</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Ghép từ với nghĩa tiếng Việt tương ứng.
              </p>
            </div>
            <button
              type="button"
              onClick={startMatchGame}
              className="button-primary self-start"
            >
              <Play className="w-4 h-4" />
              <span>Chơi ghép cặp</span>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
            className="glass-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Gamepad2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  Kỷ lục: {profile.bestWordFallScore} điểm
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Thợ săn từ</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Gõ hoặc chọn từ đang rơi trước khi chạm đáy.
              </p>
            </div>
            <button
              type="button"
              onClick={startWordFall}
              className="button-primary self-start"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Chơi thợ săn từ</span>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
            className="glass-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Shuffle className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  Kỷ lục: {profile.bestScrambleScore} điểm
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Sắp xếp chữ</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Dựa vào nghĩa và phiên âm để đặt các chữ về đúng thứ tự.
              </p>
            </div>
            <button
              type="button"
              onClick={startScrambleGame}
              className="button-primary self-start"
            >
              <Shuffle className="w-4 h-4" />
              <span>Chơi sắp xếp chữ</span>
            </button>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16 }}
            className="glass-panel p-5 sm:p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  Kỷ lục: {profile.bestAudioBlitzScore} điểm
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Phản xạ nghe</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Nghe và nhận diện từ đúng trong 45 giây.
              </p>
            </div>
            <button
              type="button"
              onClick={startAudioBlitz}
              className="button-primary self-start"
            >
              <Headphones className="w-4 h-4" />
              <span>Chơi phản xạ nghe</span>
            </button>
          </motion.div>
        </div>
        )}
      </div>
    );
  }

  if (activeGame === 'match') {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveGame('hub')}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            Quay lại
          </button>
          <div className="flex items-center gap-5 font-mono text-sm tabular-nums">
            <span>Điểm: <strong>{matchScore}</strong></span>
            <span>Combo: <strong>x{matchCombo}</strong></span>
            <span>Thời gian: <strong>{matchSeconds}s</strong></span>
          </div>
          <button
            type="button"
            onClick={startMatchGame}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ván mới</span>
          </button>
        </div>

        {matchFinished ? (
          <div
            className="rounded-2xl border p-8 text-center space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          >
            <Award className="w-12 h-12 mx-auto" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="font-display text-2xl font-bold">Hoàn thành bảng ghép cặp!</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tổng điểm: <strong className="font-mono tabular-nums">{matchScore}</strong> điểm trong {matchSeconds} giây.
            </p>
            <button
              type="button"
              onClick={startMatchGame}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Chơi ván tiếp theo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {matchTiles.map((tile) => {
              const isSelected = selectedTileUid === tile.uid;
              return (
                <button
                  key={tile.uid}
                  type="button"
                  disabled={tile.matched}
                  onClick={() => handleTileClick(tile)}
                  className="min-h-[96px] rounded-xl border p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 disabled:opacity-25"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  }}
                >
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {tile.side === 'term' ? 'Từ vựng' : 'Nghĩa'}
                  </span>
                  <span className={`text-sm ${tile.side === 'term' ? 'font-display font-bold' : 'font-medium'}`}>
                    {tile.text}
                  </span>
                  {tile.side === 'term' && !tile.matched && <Volume2 className="w-3 h-3 opacity-50" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeGame === 'scramble') {
    const current = scrambleQueue[scrambleIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveGame('hub')}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            Quay lại
          </button>
          <div className="font-mono text-sm tabular-nums">
            Câu {Math.min(scrambleIdx + 1, scrambleQueue.length)}/{scrambleQueue.length} · Điểm: <strong>{scrambleScore}</strong>
          </div>
          <button
            type="button"
            onClick={startScrambleGame}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            Chơi lại
          </button>
        </div>

        {scrambleFinished || !current ? (
          <div
            className="rounded-2xl border p-8 text-center space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          >
            <Award className="w-12 h-12 mx-auto" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="font-display text-2xl font-bold">Hoàn thành Sắp Xếp Chữ!</h2>
            <p className="text-sm font-mono tabular-nums">Tổng điểm: {scrambleScore}</p>
            <button
              type="button"
              onClick={startScrambleGame}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Chơi lượt mới
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 sm:p-8 space-y-6 text-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          >
            <div className="space-y-1.5">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Phiên âm: <span className="font-mono">{current.phonetic}</span>
              </div>
              <div className="font-display text-xl font-bold">{current.meaning}</div>
              <button
                type="button"
                onClick={() => speakPronunciation(current.term, current.language, speechRate)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium cursor-pointer mt-2"
                style={{ borderColor: 'var(--border-hairline)' }}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe gợi ý</span>
              </button>
            </div>

            {/* Answer slots */}
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[48px] p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {scramblePicked.length === 0 ? (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Nhấn vào các ký tự bên dưới theo đúng thứ tự...
                </span>
              ) : (
                scramblePicked.map((p, i) => (
                  <span
                    key={`${p.id}-${i}`}
                    className="px-3 py-1.5 rounded-lg font-display text-base font-bold border"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
                  >
                    {p.char}
                  </span>
                ))
              )}
            </div>

            {scrambleFeedback && (
              <div className={`text-sm font-semibold ${scrambleFeedback === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {scrambleFeedback === 'ok' ? 'Chính xác!' : `Đáp án đúng: ${current.term}`}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              {scrambleTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={tile.used || !!scrambleFeedback}
                  onClick={() => handlePickScrambleTile(tile.id)}
                  className="min-w-[44px] h-11 px-3 rounded-xl border font-display text-base font-bold cursor-pointer disabled:opacity-25"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  {tile.char}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadScrambleRound(current)}
              className="text-xs font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Xếp lại từ đầu
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeGame === 'audioblitz') {
    const current = abQueue[abIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setAbFinished(true);
              setActiveGame('hub');
            }}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
            style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
          >
            Quay lại
          </button>
          <div className="flex items-center gap-4 font-mono text-sm tabular-nums">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Timer className="w-3.5 h-3.5" />
              {abSeconds}s
            </span>
            <span>Điểm: <strong>{abScore}</strong></span>
            <span>Combo: <strong>x{abCombo}</strong></span>
          </div>
        </div>

        {abFinished || !current ? (
          <div
            className="rounded-2xl border p-8 text-center space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          >
            <Headphones className="w-12 h-12 mx-auto" style={{ color: 'var(--accent-primary)' }} />
            <h2 className="font-display text-2xl font-bold">Hết giờ Phản Xạ Âm Thanh!</h2>
            <p className="text-sm font-mono tabular-nums">Điểm đạt được: {abScore}</p>
            <button
              type="button"
              onClick={startAudioBlitz}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Chơi lại 45s
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 sm:p-8 space-y-6 text-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
          >
            <div className="space-y-3">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Nghe âm thanh và chọn từ vựng tương ứng
              </div>
              <div className="flex justify-center">
                <EnglishPronunciation key={current.id} text={current.term} speechRate={speechRate} label="từ cần nghe" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {abOptions.map((opt) => {
                const isChosen = abPickedId === opt.id;
                const isRight = opt.id === current.id;
                let borderColor = 'var(--border-hairline)';
                let bg = 'var(--bg-canvas)';
                if (abPickedId) {
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
                    key={opt.id}
                    type="button"
                    disabled={!!abPickedId}
                    onClick={() => {
                      setAbPickedId(opt.id);
                      const ok = opt.id === current.id;
                      const nextCombo = ok ? abCombo + 1 : 0;
                      const nextScore = abScore + (ok ? 90 + nextCombo * 15 : 0);
                      if (ok) soundEngine.playCombo(nextCombo);
                      else soundEngine.playIncorrect();
                      setAbCombo(nextCombo);
                      setAbScore(nextScore);

                      setTimeout(() => {
                        setAbPickedId(null);
                        if (abIdx + 1 >= abQueue.length) {
                          soundEngine.playLevelUp();
                          setAbFinished(true);
                          onSaveGameResult('audioblitz', nextScore, Math.round(nextScore / 15));
                        } else {
                          const nxt = abIdx + 1;
                          setAbIdx(nxt);
                          speakPronunciation(abQueue[nxt].term, abQueue[nxt].language, speechRate);
                        }
                      }, 450);
                    }}
                    className="rounded-xl border p-4 cursor-pointer flex items-center justify-between gap-2"
                    style={{ borderColor, backgroundColor: bg }}
                  >
                    <div>
                      <div className="font-display text-base font-bold">{opt.term}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {opt.meaning}
                      </div>
                    </div>
                    {abPickedId && isRight && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {abPickedId && isChosen && !isRight && <X className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Word Fall Arcade View
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setWfRunning(false);
            setActiveGame('hub');
          }}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
          style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
        >
          Thoát game
        </button>

        <div className="flex items-center gap-5 font-mono text-sm tabular-nums">
          <span>Điểm: <strong>{wfScore}</strong></span>
          <span>Mạng: <strong>{wfLives}/3</strong></span>
        </div>

        <button
          type="button"
          onClick={startWordFall}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
          style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--bg-surface)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Chơi lại</span>
        </button>
      </div>

      <div className="relative rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-hairline)' }}>
        <canvas
          ref={canvasRef}
          data-testid="wordfall-canvas"
          width={720}
          height={360}
          className="w-full h-[320px] sm:h-[360px] block"
        />

        {wfGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 text-white p-6 text-center space-y-4">
            <Sparkles className="w-10 h-10 text-amber-400" />
            <h2 className="font-display text-2xl font-bold">Kết thúc lượt chơi</h2>
            <p className="text-sm font-mono tabular-nums">Điểm đạt được: {wfScore}</p>
            <button
              type="button"
              onClick={startWordFall}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Chơi ván mới
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitWordFallGuess(wfInput);
        }}
        className="flex gap-2"
      >
        <label htmlFor="wordfall-input" className="sr-only">
          Gõ từ vựng tương ứng
        </label>
        <input
          id="wordfall-input"
          type="text"
          value={wfInput}
          onChange={(e) => {
            setWfInput(e.target.value);
            submitWordFallGuess(e.target.value);
          }}
          placeholder="Gõ nhanh từ tiếng Anh đang rơi..."
          disabled={wfGameOver}
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={wfGameOver}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Bắn từ
        </button>
      </form>

      {!wfGameOver && wordFallAssistChoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Chọn nhanh:
          </span>
          {wordFallAssistChoices.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => submitWordFallGuess(w.term)}
              className="rounded-lg border px-3 py-1 text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              {w.term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
