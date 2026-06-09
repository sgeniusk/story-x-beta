// Vercel Function — 에이전트 1명 분리 검토. 페르소나 .md 를 정체성으로 주입.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildAgentReviewPrompt, loadAgentPersona } from '../src/lib/server/promptBuilders';
import { runLlmJson } from '../src/lib/server/llmRunner';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const body = (req.body ?? {}) as {
    agent?: string;
    target?: string;
    medium?: string;
    context?: string;
    payoffStatus?: { isStalled?: boolean; deferredStreak?: number; openPromises?: number };
  };

  const agentId = String(body.agent ?? 'showrunner');
  const target = String(body.target ?? '');
  const medium = String(body.medium ?? 'novel');
  const context = String(body.context ?? '');
  const persona = loadAgentPersona(agentId);

  const payoffStatus =
    body.payoffStatus &&
    typeof body.payoffStatus === 'object' &&
    typeof body.payoffStatus.deferredStreak === 'number'
      ? {
          isStalled: Boolean(body.payoffStatus.isStalled),
          deferredStreak: body.payoffStatus.deferredStreak,
          openPromises: typeof body.payoffStatus.openPromises === 'number' ? body.payoffStatus.openPromises : 0
        }
      : undefined;

  const prompt = buildAgentReviewPrompt({ agentId, persona, target, medium, context, payoffStatus });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', mode: 'review-agent', status: 'complete', verdict: 'pass', note: '', evidence: [], strengths: [], issues: [], memoryCandidates: [], warning: result.warning });
    return;
  }

  const data = result.data ?? {};
  res.status(200).json({
    provider: result.provider,
    mode: 'review-agent',
    status: result.status,
    verdict: typeof data.status === 'string' ? data.status : 'pass',
    note: typeof data.note === 'string' ? data.note : '',
    evidence: Array.isArray(data.evidence) ? data.evidence : [],
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    issues: Array.isArray(data.issues) ? data.issues : [],
    memoryCandidates: Array.isArray(data.memoryCandidates) ? data.memoryCandidates : [],
    ...(result.warning ? { warning: result.warning } : {})
  });
}
