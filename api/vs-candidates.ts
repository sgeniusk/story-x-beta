// Vercel Function — 이번 화 전개 후보(VS, Phase C-1).
// dev 에서는 vite.config.ts storyxBridge 가 같은 path 를 가로채 storyx.mjs 호출. prod 는 이 함수가 AI SDK 직결.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildVsCandidatesPrompt } from '../src/lib/server/promptBuilders';
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
    contractDigest?: string;
    recentSummary?: string;
    unpaidPromises?: string[];
  };

  const medium = String(body.medium ?? 'novel');
  const format = (body.format ?? 'long-novel') as CreativeFormat;
  const contractDigest = String(body.contractDigest ?? '');
  const recentSummary = String(body.recentSummary ?? '');
  const unpaidPromises = Array.isArray(body.unpaidPromises) ? body.unpaidPromises.map(String) : [];

  const prompt = buildVsCandidatesPrompt({ medium, format, contractDigest, recentSummary, unpaidPromises });
  const result = await runLlmJson(prompt);

  if (result.status === 'mock') {
    res.status(200).json({ provider: 'mock', medium, mode: 'vs-candidates', status: 'complete', candidates: [], warning: result.warning });
    return;
  }

  const candidates = Array.isArray(result.data?.candidates) ? result.data.candidates : [];
  res.status(200).json({
    provider: result.provider,
    medium,
    mode: 'vs-candidates',
    status: result.status,
    candidates,
    ...(result.warning ? { warning: result.warning } : {})
  });
}
