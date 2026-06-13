// Vercel Function — 쇼러너 4줄 척추 제안 (Phase A-3b).
// dev 환경에서는 vite.config.ts 의 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출.
// production 에서는 이 함수가 직접 AI SDK 로 Claude/AI Gateway 를 호출.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSpineSuggestionPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';
import type { CreativeFormat } from '../src/lib/projectBlueprint';

function normalizeSpine(
  value: unknown
): { desire: string; advance: string; obstacle: string; resolution: string } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const read = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  const spine = {
    desire: read(v.desire),
    advance: read(v.advance),
    obstacle: read(v.obstacle),
    resolution: read(v.resolution)
  };
  if (!spine.desire && !spine.advance && !spine.obstacle && !spine.resolution) return null;
  return spine;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    medium?: string;
    format?: string;
    freewrite?: string;
    endingStatement?: string;
    protagonistCost?: string;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const freewrite = String(body.freewrite ?? '');
  const endingStatement = String(body.endingStatement ?? '');
  const protagonistCost = String(body.protagonistCost ?? '');

  const prompt = buildSpineSuggestionPrompt({ medium, format, freewrite, endingStatement, protagonistCost });

  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res
      .status(200)
      .json({ provider: 'mock', medium, mode: 'spine-suggest', status: 'complete', spine: null, warning: result.warning });
    return;
  }

  const spine = normalizeSpine(result.data?.spine);
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'spine-suggest',
    status: result.status,
    spine,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
