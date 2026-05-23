// Vercel Function — 회차/단편/에세이 초안 LLM 생성.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildDraftPrompt } from '../src/lib/server/promptBuilders';
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
    title?: string;
    context?: string;
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const freewrite = String(body.freewrite ?? '');
  const title = String(body.title ?? '');
  const context = String(body.context ?? '');

  const prompt = buildDraftPrompt({ medium, format, freewrite, title, context });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', mode: 'draft', status: 'complete', prose: '', warning: result.warning });
    return;
  }

  const data = result.data ?? {};
  res.status(200).json({
    provider: result.provider,
    mode: 'draft',
    status: result.status,
    title: typeof data.title === 'string' ? data.title : '',
    hook: typeof data.hook === 'string' ? data.hook : '',
    outline: Array.isArray(data.outline) ? data.outline : [],
    beats: Array.isArray(data.beats) ? data.beats : [],
    prose: typeof data.prose === 'string' ? data.prose : '',
    newCanonFacts: Array.isArray(data.newCanonFacts) ? data.newCanonFacts : [],
    ...(result.warning ? { warning: result.warning } : {})
  });
}
