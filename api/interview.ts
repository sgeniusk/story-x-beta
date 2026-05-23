// Vercel Function — 작가 인터뷰 질문 생성.
// dev 환경에서는 vite.config.ts 의 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출.
// production 에서는 이 함수가 직접 AI SDK 로 Claude/AI Gateway 를 호출.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildInterviewPrompt, type PersonaTone } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';
import type { CreativeFormat } from '../src/lib/projectBlueprint';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    medium?: string;
    format?: string;
    freewrite?: string;
    personaLineup?: PersonaTone[];
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const freewrite = String(body.freewrite ?? '');
  const personas = Array.isArray(body.personaLineup) ? body.personaLineup : [];

  const prompt = buildInterviewPrompt({ medium, format, freewrite, personas });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'interview', status: 'complete', questions: [], warning: result.warning });
    return;
  }

  const questions = Array.isArray(result.data?.questions) ? result.data?.questions : [];
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'interview',
    status: result.status,
    questions,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
