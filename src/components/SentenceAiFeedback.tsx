import { useEffect, useId, useRef, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { VocabWord } from '../types/vocab';
import {
  parseSentenceFeedback, sentenceAssessmentInput, sentencePrecheck, SENTENCE_RUBRIC_VERSION, SENTENCE_TASK,
} from '../utils/sentenceAssessment.mjs';
import { stripTrailingPinyin } from '../utils/studyPlan';

const OUTCOME_LABELS = {
  passed: 'AI nhận thấy câu phù hợp',
  failed: 'AI gợi ý bạn sửa câu',
  uncertain: 'AI chưa thể đánh giá chắc chắn',
};
const FAILURE_MESSAGES: Readonly<Partial<Record<string, string>>> = {
  disabled: 'Máy chủ chưa bật góp ý AI. Bạn có thể tiếp tục kiểm tra từ khóa và xem câu mẫu.',
  quota: 'Đã dùng hết lượt AI trong hạn mức hiện tại. Bạn có thể tiếp tục luyện tại máy.',
  busy: 'AI đang tạm dừng. Bạn có thể tiếp tục luyện tại máy.',
};
const UNAVAILABLE = 'Chưa nhận được góp ý AI. Câu của bạn vẫn ở ô trả lời.';

interface Comment {
  heading: string;
  detail: string;
}

export function SentenceAiFeedback({ word, answer }: { word: VocabWord; answer: string }) {
  const isOnline = useOnlineStatus();
  const helpId = useId();
  const [pending, setPending] = useState(false);
  const [comments, setComments] = useState(() => new Map<string, Comment>());
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  const examples = word.examples.map(({ sentence }) => word.language === 'zh' ? stripTrailingPinyin(sentence) : sentence);
  const problem = sentencePrecheck(word.language, word.term, answer, examples);
  const input = problem ? null : sentenceAssessmentInput(word.language, word.term, word.meaning, answer);
  const key = answer.trim();
  const comment = comments.get(key);
  const hint = pending ? 'Đang nhận góp ý AI…'
    : !isOnline ? 'Kết nối mạng để nhận góp ý AI.'
    : !key ? 'Viết câu của bạn trước khi nhận góp ý AI.'
    : problem === 'copied_example' ? 'Hãy viết một câu khác câu mẫu để nhận góp ý.'
    : problem === 'too_short' ? 'Thêm ngữ cảnh cho câu để AI có thể đánh giá cách dùng từ.'
    : !input ? 'Câu hoặc thông tin từ vựng vượt giới hạn của bài góp ý AI.'
    : 'Bấm để gửi câu, từ và nghĩa đích cho DeepSeek. AI có thể chấm sai.';

  async function requestFeedback() {
    if (!input || comment || active.current || !isOnline || !navigator.onLine) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    let result: Comment = { heading: 'Chưa có góp ý AI', detail: UNAVAILABLE };
    try {
      const requestId = crypto.randomUUID();
      const response = await fetch('/api/ai/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId, consent: true, task: SENTENCE_TASK, rubricVersion: SENTENCE_RUBRIC_VERSION, ...input,
        }),
        redirect: 'error',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(48_000)]),
      });
      const data = await response.json();
      if (response.ok && data?.requestId === requestId && data.rubricVersion === SENTENCE_RUBRIC_VERSION) {
        const feedback = parseSentenceFeedback({ criteria: data.criteria, feedbackVi: data.feedbackVi });
        if (feedback && data.status === feedback.status) {
          result = { heading: OUTCOME_LABELS[feedback.status], detail: feedback.feedbackVi };
        }
      } else if (typeof data?.reason === 'string' && Object.hasOwn(FAILURE_MESSAGES, data.reason)) {
        result.detail = FAILURE_MESSAGES[data.reason] ?? UNAVAILABLE;
      }
    } catch {
      // The local exercise stays available while the separate request is pending or unavailable.
    } finally {
      active.current = null;
      if (!controller.signal.aborted) {
        setComments((previous) => {
          const next = new Map(previous).set(key, result);
          if (next.size > 24) next.delete(next.keys().next().value!);
          return next;
        });
        setPending(false);
      }
    }
  }

  return (
    <div className="sentence-ai">
      <div role="status">
        {comment ? (
          <div className="exercise-feedback">
            <div><strong>{comment.heading}</strong><p>{comment.detail}</p></div>
          </div>
        ) : <p id={helpId}>{hint}</p>}
      </div>
      {!comment && <button type="button" className="button-secondary" aria-describedby={helpId}
        disabled={!input || !isOnline || pending} onClick={() => void requestFeedback()}>Nhận góp ý AI</button>}
    </div>
  );
}
