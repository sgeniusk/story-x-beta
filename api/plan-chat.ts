// Vercel Function — PLAN 설계 대화(설계실 2단계).
// dev 에서는 vite.config.ts storyxBridge 가 같은 path 를 가로채 storyx.mjs 호출. prod 는 이 함수가 AI SDK 직결.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPlanChatPrompt } from '../src/lib/server/promptBuilders';
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
    activeSection?: string;
    contextDigest?: string;
    catalogText?: string;
    dialogue?: string;
    query?: string;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const prompt = buildPlanChatPrompt({
    medium,
    format,
    activeSection: String(body.activeSection ?? ''),
    contextDigest: String(body.contextDigest ?? ''),
    catalog: String(body.catalogText ?? ''),
    dialogue: String(body.dialogue ?? ''),
    query: String(body.query ?? '')
  });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'plan-chat', status: 'complete', reply: '', proposals: [], warning: result.warning });
    return;
  }

  const reply = typeof result.data?.reply === 'string' ? result.data.reply : '';
  const proposals = Array.isArray(result.data?.proposals) ? result.data.proposals : [];
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'plan-chat',
    status: result.status,
    reply,
    proposals,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
