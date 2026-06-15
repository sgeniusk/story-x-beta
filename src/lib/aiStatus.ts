// 글로벌 AI 호출 상태 — 인터뷰·초안·검토·데이터 검토 등 모든 LLM 호출의 최근 결과를 한 곳에 기록한다.
// UI 의 AiStatusBadge 가 이걸 구독해서 "AI 활성 / AI 폴백 / AI 대기" 신호를 사용자에게 노출.
// LLM 호출이 실패하면 매체별 고정 폴백이 흘러도 사용자가 즉시 "지금 AI 가 안 도는구나" 를 알 수 있게 한다.
// 추가로 — 모든 호출이 evolutionMemory 의 history 에 자동 누적된다. 작품 수명 동안의 학습 자산.
import { appendEvolutionEvent } from './evolutionMemory';

export type AiCallMode = 'draft' | 'review' | 'review-agent' | 'review-data' | 'interview' | 'pace-interview' | 'spine-suggest' | 'vs-candidates';

export interface AiCallStatus {
  mode: AiCallMode;
  ok: boolean;
  reason?: string;
  at: number;
}

let lastStatus: AiCallStatus | null = null;
const listeners = new Set<(status: AiCallStatus | null) => void>();

export function reportAiCall(status: Omit<AiCallStatus, 'at'>): void {
  lastStatus = { ...status, at: Date.now() };
  // evolution history 에도 같은 이벤트를 누적 — 백업·향후 학습 자산.
  // localStorage write 가 실패해도(SSR · quota) listener 흐름은 그대로 진행되도록 try.
  try {
    appendEvolutionEvent({
      kind: 'llm-call',
      source: status.mode,
      summary: status.ok ? `${status.mode} 호출 성공` : `${status.mode} 호출 실패`,
      detail: status.reason
    });
  } catch {
    /* silent — UI 신호는 계속 흘러야 한다 */
  }
  for (const fn of listeners) {
    try {
      fn(lastStatus);
    } catch (error) {
      console.error('[aiStatus] listener 실행 중 오류', error);
    }
  }
}

export function getAiStatus(): AiCallStatus | null {
  return lastStatus;
}

export function subscribeAiStatus(fn: (status: AiCallStatus | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// 테스트 헬퍼 — 다음 렌더에서 깨끗한 상태로 시작하고 싶을 때
export function resetAiStatus(): void {
  lastStatus = null;
  for (const fn of listeners) {
    try {
      fn(null);
    } catch (error) {
      console.error('[aiStatus] listener reset 중 오류', error);
    }
  }
}

export function aiCallModeLabel(mode: AiCallMode): string {
  switch (mode) {
    case 'draft':
      return '초안 생성';
    case 'review':
      return '딥 검토';
    case 'review-agent':
      return '에이전트 검토';
    case 'review-data':
      return '데이터 검토';
    case 'interview':
      return '작가 인터뷰';
    case 'pace-interview':
      return '진도 인터뷰';
    case 'spine-suggest':
      return '척추 제안';
    case 'vs-candidates':
      return '전개 후보';
  }
}
