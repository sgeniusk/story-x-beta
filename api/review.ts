// Vercel Function — 딥 검토 (여러 에이전트 시선이 한 응답에 합쳐진 종합 검토).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildReviewPrompt } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    scale?: string;
    target?: string;
    medium?: string;
    context?: string;
  };

  const scale = String(body.scale ?? 'small');
  const target = String(body.target ?? '');
  const medium = String(body.medium ?? 'novel');
  const context = String(body.context ?? '');

  const prompt = buildReviewPrompt({ scale, target, medium, context });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', mode: 'review', status: 'complete', summary: '', agentReports: [], memoryCandidates: [], nextActions: [], warning: result.warning });
    return;
  }

  const data = result.data ?? {};
  res.status(200).json({
    provider: result.provider,
    mode: 'review',
    status: result.status,
    summary: typeof data.summary === 'string' ? data.summary : '',
    agentReports: Array.isArray(data.agentReports) ? data.agentReports : [],
    memoryCandidates: Array.isArray(data.memoryCandidates) ? data.memoryCandidates : [],
    nextActions: Array.isArray(data.nextActions) ? data.nextActions : [],
    ...(result.warning ? { warning: result.warning } : {})
  });
}
