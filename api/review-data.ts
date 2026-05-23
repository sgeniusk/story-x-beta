// Vercel Function — 캐논 분야(인물/장소/사물/사건/시간선) 데이터 정합 검토.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildDataReviewPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    category?: string;
    target?: string;
    medium?: string;
    context?: string;
  };

  const category = String(body.category ?? '인물');
  const target = String(body.target ?? '');
  const medium = String(body.medium ?? 'novel');
  const context = String(body.context ?? '');

  const prompt = buildDataReviewPrompt({ category, target, medium, context });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', mode: 'review-data', status: 'complete', summary: '', notes: [], warning: result.warning });
    return;
  }

  const data = result.data ?? {};
  res.status(200).json({
    provider: result.provider,
    mode: 'review-data',
    status: result.status,
    summary: typeof data.summary === 'string' ? data.summary : '',
    notes: Array.isArray(data.notes) ? data.notes : [],
    ...(result.warning ? { warning: result.warning } : {})
  });
}
