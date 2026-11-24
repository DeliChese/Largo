import { createHash } from 'node:crypto';
import express from 'express';
import { parseSentenceFeedback, sentenceAssessmentInput, SENTENCE_RUBRIC_VERSION, SENTENCE_TASK } from '../src/utils/sentenceAssessment.mjs';
import { createDeepSeekAssessor } from './deepseek.mjs';
import { isLocalRequest } from './localRequest.mjs';

const MINUTE = 60_000;
const REQUEST_ID_TTL = 24 * 60 * MINUTE;
const MAX_REQUEST_ENTRIES = 512;
const REQUEST_LIMITS = { minute: 6, day: 20, month: 150, concurrent: 2 };
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function validateRequest(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).length !== 8 ||
      body.task !== SENTENCE_TASK || body.rubricVersion !== SENTENCE_RUBRIC_VERSION || body.consent !== true ||
      typeof body.requestId !== 'string' || !UUID_V4.test(body.requestId)) return null;
  return sentenceAssessmentInput(body.language, body.term, body.targetMeaning, body.answer);
}

export function createSentenceAssessmentRouter(env, { request = fetch, now = Date.now } = {}) {
  const router = express();
  router.disable('x-powered-by');
  const assess = createDeepSeekAssessor(env, parseSentenceFeedback, request);
  const unlimited = env.DEEPSEEK_PROVIDER === 'community_local' && env.DEEPSEEK_LOCAL_UNLIMITED === 'true';
  const entries = new Map();
  let recentCalls = [];
  let day = '';
  let month = '';
  let dayCalls = 0;
  let monthCalls = 0;
  let inFlight = 0;
  let failures = 0;
  let pausedUntil = 0;

  async function dispatch(input, requestId) {
    const started = now();
    let result;
    try {
      result = await assess(input);
    } catch {
      // Treat network and provider parsing failures alike. The request may already be billed.
    }
    inFlight -= 1;
    const { feedback, usage } = result ?? {};
    if (feedback) {
      failures = 0;
    } else if (++failures >= 3) {
      pausedUntil = now() + MINUTE;
      failures = 0;
    }
    if (env.DEEPSEEK_AI_LOG_USAGE === 'true') {
      process.stdout.write(JSON.stringify({
        event: 'sentence_assessment', status: feedback?.status ?? 'unavailable', latencyMs: now() - started, ...usage,
      }) + '\n');
    }
    return feedback && {
      requestId, ...feedback, assessor: 'deepseek', rubricVersion: SENTENCE_RUBRIC_VERSION, ...(usage && { usage }),
    };
  }

  function unavailable(res, status, reason) {
    res.status(status).json({ status: 'unavailable', reason });
  }

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/assess',
    (req, res, next) => {
      if (!isLocalRequest(req)) return unavailable(res, 403, 'forbidden');
      if (!assess) return unavailable(res, 503, 'disabled');
      if (!req.is('application/json')) return unavailable(res, 415, 'invalid_request');
      next();
    },
    express.json({ limit: '3kb', inflate: false }),
    async (req, res) => {
      const input = validateRequest(req.body);
      if (!input) return unavailable(res, 400, 'invalid_request');
      const { requestId } = req.body;
      const time = now();
      const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
      for (const [id, entry] of entries) {
        if (time >= entry.expiresAt) entries.delete(id);
      }
      let entry = entries.get(requestId);
      if (entry && entry.fingerprint !== fingerprint) return unavailable(res, 409, 'invalid_request');
      if (!entry) {
        if (inFlight >= REQUEST_LIMITS.concurrent || time < pausedUntil) return unavailable(res, 503, 'busy');
        if (!unlimited) {
          const utcDay = new Date(time).toISOString().slice(0, 10);
          const utcMonth = utcDay.slice(0, 7);
          if (utcDay !== day) { day = utcDay; dayCalls = 0; }
          if (utcMonth !== month) { month = utcMonth; monthCalls = 0; }
          recentCalls = recentCalls.filter((start) => time - start < MINUTE);
          if (recentCalls.length >= REQUEST_LIMITS.minute || dayCalls >= REQUEST_LIMITS.day ||
              monthCalls >= REQUEST_LIMITS.month) return unavailable(res, 429, 'quota');

          recentCalls.push(time);
          dayCalls += 1;
          monthCalls += 1;
        }

        if (entries.size >= MAX_REQUEST_ENTRIES) {
          const oldest = [...entries].find(([, cached]) => cached.completed);
          if (oldest) entries.delete(oldest[0]);
          else return unavailable(res, 503, 'busy');
        }
        inFlight += 1;
        const created = { fingerprint, expiresAt: time + REQUEST_ID_TTL, completed: false, result: undefined };
        created.result = dispatch(input, requestId).finally(() => { created.completed = true; });
        entries.set(requestId, created);
        entry = created;
      }
      const result = await entry.result;
      if (result) res.json(result);
      else unavailable(res, 502, 'provider');
    },
  );

  router.use((error, _req, res, _next) => {
    const status = [400, 413, 415].includes(error.status) ? error.status : 500;
    unavailable(res, status, status === 500 ? 'provider' : 'invalid_request');
  });

  return router;
}
