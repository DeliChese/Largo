import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { EnglishLocale, ExampleSentence, VocabWord } from '../types/vocab';
import { WordExamples } from './WordExamples';

interface Props {
  word: Pick<VocabWord, 'term' | 'meaning' | 'partOfSpeech' | 'examples'>;
  locale: EnglishLocale;
  level?: string;
  speechRate: number;
}

const UNAVAILABLE = 'Chưa tạo được ví dụ. Bạn có thể tiếp tục học với nội dung trên thẻ.';
const ERRORS: Record<string, string> = {
  disabled: 'Máy chủ chưa bật tính năng tạo ví dụ AI.',
  auth_error: 'Máy chủ chưa kết nối được với dịch vụ AI.',
  quota: 'Đã hết lượt tạo ví dụ trong hạn mức hiện tại.',
  busy: 'AI đang xử lý nhiều yêu cầu. Hãy thử lại sau.',
};

function readExamples(data: unknown): ExampleSentence[] {
  if (!data || typeof data !== 'object' || !('status' in data) || data.status !== 'ok' ||
      !('examples' in data) || !Array.isArray(data.examples) || data.examples.length !== 2) return [];
  const examples = data.examples.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' || !('sentence' in item) || !('translation' in item) ||
        typeof item.sentence !== 'string' || typeof item.translation !== 'string') return [];
    return [{ sentence: item.sentence, translation: item.translation }];
  });
  return examples.length === 2 ? examples : [];
}

export function WordExampleGenerator({ word, locale, level, speechRate }: Props) {
  const isOnline = useOnlineStatus();
  const activeRequest = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [examples, setExamples] = useState<ExampleSentence[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => () => activeRequest.current?.abort(), []);
  const term = word.term.trim();
  const meaning = word.meaning.trim();
  const eligible = /[A-Za-z]/.test(term) && term.length <= 120 && meaning.length > 0 && meaning.length <= 240;

  async function generate() {
    if (!eligible || !isOnline || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/ai/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'error',
        body: JSON.stringify({
          term, meaning, locale, level, consent: true, partOfSpeech: word.partOfSpeech.slice(0, 80),
          avoidSentences: [...examples, ...word.examples].slice(0, 6).map(({ sentence }) => sentence),
        }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(38_000)]),
      });
      const data = await response.json();
      if (controller.signal.aborted) return;
      const next = response.ok ? readExamples(data) : [];
      if (next.length) {
        setExamples(next);
        setMessage('Đã tạo 2 ví dụ mới.');
      } else {
        setMessage(typeof data?.reason === 'string' && Object.hasOwn(ERRORS, data.reason) ? ERRORS[data.reason] : UNAVAILABLE);
      }
    } catch {
      if (!controller.signal.aborted) setMessage(UNAVAILABLE);
    } finally {
      activeRequest.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <details className="word-example-ai">
      <summary><Sparkles size={15} aria-hidden="true" /> Tạo lại ví dụ bằng AI</summary>
      <div className="word-example-ai-content">
        <p>Bấm tạo để gửi từ, nghĩa và câu mẫu trên thẻ đến dịch vụ AI. Ví dụ AI là gợi ý luyện tập.</p>
        <button type="button" className="button-secondary" disabled={!eligible || !isOnline || pending}
          onClick={() => void generate()}>
          {pending ? 'Đang tạo ví dụ…' : examples.length ? 'Tạo 2 ví dụ khác' : 'Tạo 2 ví dụ'}
        </button>
        <p role="status">{pending ? 'Đang tạo ví dụ…' : message || (!isOnline
          ? 'Kết nối mạng để tạo ví dụ.' : !eligible ? 'Nội dung thẻ vượt giới hạn của tính năng tạo ví dụ.' : '')}</p>
        <WordExamples examples={examples} speechRate={speechRate} />
      </div>
    </details>
  );
}
