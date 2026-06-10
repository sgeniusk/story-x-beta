// Vercel Function — 쇼러너 페이스 인터뷰 질문 생성.
// dev 환경에서는 vite.config.ts 의 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출.
// production 에서는 이 함수가 직접 AI SDK 로 Claude/AI Gateway 를 호출.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPaceInterviewPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';
import type { CreativeFormat } from '../src/lib/projectBlueprint';

function normalizePaceQuestions(
  value: unknown
): Array<{ question: string; options: Array<{ label: string; intentSeed: string }> }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null && !Array.isArray(q))
    .slice(0, 3)
    .map((q) => {
      const question = typeof q.question === 'string' ? q.question.trim() : '';
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions
        .filter((o): o is Record<string, unknown> => typeof o === 'object' && o !== null && !Array.isArray(o))
        .slice(0, 3)
        .map((o) => ({
          label: typeof o.label === 'string' ? o.label.trim() : '',
          intentSeed: typeof o.intentSeed === 'string' ? o.intentSeed.trim() : ''
        }))
        .filter((o) => o.label && o.intentSeed);
      return { question, options };
    })
    .filter((q) => q.question && q.options.length > 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    medium?: string;
    format?: string;
    payoffStatus?: { isStalled: boolean; deferredStreak: number; openPromises: number };
    unpaidPromises?: string[];
    deferredStakes?: string[];
    context?: string;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const payoffStatus = body.payoffStatus ?? { isStalled: false, deferredStreak: 0, openPromises: 0 };
  const unpaidPromises = Array.isArray(body.unpaidPromises) ? body.unpaidPromises : [];
  const deferredStakes = Array.isArray(body.deferredStakes) ? body.deferredStakes : [];
  const context = String(body.context ?? '');

  const prompt = buildPaceInterviewPrompt({ medium, format, payoffStatus, unpaidPromises, deferredStakes, context });

  // 단독 완결형이면 prompt 가 빈 문자열 — provider 호출 없이 빈 questions 반환
  if (!prompt) {
    res.status(200).json({ provider: 'none', medium, mode: 'pace-interview', status: 'complete', questions: [] });
    return;
  }

  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'pace-interview', status: 'complete', questions: [], warning: result.warning });
    return;
  }

  const questions = normalizePaceQuestions(result.data?.questions);
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'pace-interview',
    status: result.status,
    questions,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
