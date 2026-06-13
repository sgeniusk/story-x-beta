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
    payoffStatus?: { isStalled?: boolean; deferredStreak?: number; openPromises?: number };
    contractStatus?: { remaining?: number; unpaidCount?: number; overBudget?: boolean; finalStretch?: boolean };
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const freewrite = String(body.freewrite ?? '');
  const title = String(body.title ?? '');
  const context = String(body.context ?? '');

  const payoffStatus =
    body.payoffStatus && typeof body.payoffStatus === 'object' && typeof body.payoffStatus.deferredStreak === 'number'
      ? {
          isStalled: Boolean(body.payoffStatus.isStalled),
          deferredStreak: body.payoffStatus.deferredStreak,
          openPromises: typeof body.payoffStatus.openPromises === 'number' ? body.payoffStatus.openPromises : 0
        }
      : undefined;

  const contractStatus =
    body.contractStatus && typeof body.contractStatus === 'object' && typeof body.contractStatus.remaining === 'number'
      ? {
          remaining: body.contractStatus.remaining,
          unpaidCount: typeof body.contractStatus.unpaidCount === 'number' ? body.contractStatus.unpaidCount : 0,
          overBudget: Boolean(body.contractStatus.overBudget),
          finalStretch: Boolean(body.contractStatus.finalStretch)
        }
      : undefined;

  const prompt = buildDraftPrompt({ medium, format, freewrite, title, context, payoffStatus, contractStatus });
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
