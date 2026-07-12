// 온보딩 구상 대화(함께 구상) — transcript 재조립·응결 setup 정규화 순수 모듈. plan-chat(planChat.ts) 미러, 카탈로그 없음. spec 2026-07-12.
import { parseDiveSetup, type DiveSetup } from './diveProposal';

export type OnboardChatRole = 'user' | 'partner';

export interface OnboardChatMessage {
  id: string;
  role: OnboardChatRole;
  text: string;
  setup?: DiveSetup; // 응결 시드 카드 — partner 메시지에만 실린다
}

export interface OnboardChatTurn {
  reply: string;
  setup: DiveSetup | null;
}

export const ONBOARD_CHAT_TRANSCRIPT_LIMIT = 8; // plan-chat TRANSCRIPT_LIMIT 미러
export const ONBOARD_CHAT_MAX_MESSAGES = 40; // plan-chat PLAN_CHAT_MAX_MESSAGES 미러 — OnboardingDraft cap

export function buildOnboardChatTranscript(messages: OnboardChatMessage[], limit = ONBOARD_CHAT_TRANSCRIPT_LIMIT): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.role === 'user' ? '작가' : '파트너'}: ${m.text}`)
    .join('\n');
}

// provider 응답({ reply, setup? })을 정규화 — reply 비면 턴 실패(null), 손상 setup 은 setup 만 조용히 강등(무효 제안 드랍 관례).
export function normalizeOnboardChatResponse(raw: unknown): OnboardChatTurn | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const reply = typeof record.reply === 'string' ? record.reply.trim() : '';
  if (!reply) return null;
  return { reply, setup: parseDiveSetup(record.setup) };
}
