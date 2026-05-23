// 모든 Vercel Function 라우트가 공유하는 LLM 호출 헬퍼.
// AI Gateway 가 설정돼 있으면 `anthropic/...` provider-model 문자열로 라우팅 (Vercel knowledge update 권장),
// 아니면 @ai-sdk/anthropic 으로 직접 호출.
// 둘 다 없으면 mock 폴백 — 클라이언트 측 폴백 흐름과 합쳐 안전한 기본값.
import { generateText, type LanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { parseLlmJson } from './promptBuilders';

const MODEL_ID = 'claude-3-5-sonnet-20241022';

export type LlmProvider = 'mock' | 'ai-gateway' | 'anthropic';

export interface RunLlmResult {
  provider: LlmProvider;
  status: 'complete' | 'failed' | 'mock';
  data: Record<string, unknown> | null;
  rawText: string;
  warning?: string;
}

export async function runLlmJson(prompt: string): Promise<RunLlmResult> {
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasGateway && !hasAnthropic) {
    return {
      provider: 'mock',
      status: 'mock',
      data: null,
      rawText: '',
      warning: 'AI_GATEWAY_API_KEY 또는 ANTHROPIC_API_KEY 가 설정되지 않아 mock 응답으로 폴백.'
    };
  }

  const model: LanguageModel = hasGateway
    ? (`anthropic/${MODEL_ID}` as unknown as LanguageModel)
    : anthropic(MODEL_ID);

  try {
    const { text } = await generateText({
      model,
      prompt,
      maxOutputTokens: 4096
    });
    return {
      provider: hasGateway ? 'ai-gateway' : 'anthropic',
      status: 'complete',
      data: parseLlmJson(text),
      rawText: text
    };
  } catch (error) {
    return {
      provider: hasGateway ? 'ai-gateway' : 'anthropic',
      status: 'failed',
      data: null,
      rawText: '',
      warning: error instanceof Error ? error.message : 'unknown error'
    };
  }
}
