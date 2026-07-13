// Vercel Function — 온보딩 구상 대화(함께 구상).
// dev 에서는 vite.config.ts storyxBridge 가 같은 path 를 가로채 storyx.mjs 호출. prod 는 이 함수가 AI SDK 직결.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildOnboardChatPrompt } from '../src/lib/server/promptBuilders';
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
    dialogue?: string;
    query?: string;
    condense?: boolean;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const prompt = buildOnboardChatPrompt({
    medium,
    format,
    freewrite: String(body.freewrite ?? ''),
    dialogue: String(body.dialogue ?? ''),
    query: String(body.query ?? ''),
    condense: Boolean(body.condense)
  });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'onboard-chat', status: 'complete', reply: '', setup: null, warning: result.warning });
    return;
  }

  const reply = typeof result.data?.reply === 'string' ? result.data.reply : '';
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'onboard-chat',
    status: result.status,
    reply,
    setup: result.data?.setup ?? null,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
