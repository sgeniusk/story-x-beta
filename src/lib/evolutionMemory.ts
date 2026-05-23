// 에이전트 진화 메모리 — 작품 수명 동안 LLM 호출 결과·메모리 결정을 시간순 history 로 누적한다.
// 사용자에게 즉시 보여줄 UI 가 1차 컷에 없어도, 백업/복원·향후 학습 자산으로 즉시 의미가 생긴다.
// 호출 흐름 — aiStatus.reportAiCall 이 자동으로 추가, 메모리 큐 결정도 호출 측에서 명시적으로 append.

const STORAGE_KEY = 'serial-story-studio/evolution-history';
const MAX_EVENTS = 500;

export type EvolutionEventKind =
  | 'llm-call'
  | 'review-pass'
  | 'review-revise'
  | 'review-blocked'
  | 'memory-approved'
  | 'memory-revised'
  | 'memory-rejected'
  | 'memory-held'
  | 'draft-generated'
  | 'release-locked';

export interface EvolutionEvent {
  id: string;
  at: string;
  kind: EvolutionEventKind;
  /** 어떤 에이전트/모드가 만든 이벤트인지. 없으면 시스템 이벤트. */
  source?: string;
  /** 한 줄 요약. UI 에 그대로 노출 가능한 길이. */
  summary: string;
  /** 선택적 추가 정보 — 사유, 메타데이터. */
  detail?: string;
}

export interface EvolutionHistory {
  schema: 'storyx/evolution-history/v1';
  events: EvolutionEvent[];
}

const EMPTY: EvolutionHistory = { schema: 'storyx/evolution-history/v1', events: [] };

export function loadEvolutionHistory(): EvolutionHistory {
  if (typeof window === 'undefined') return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schema !== 'storyx/evolution-history/v1') return EMPTY;
    return { schema: 'storyx/evolution-history/v1', events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return EMPTY;
  }
}

export function saveEvolutionHistory(history: EvolutionHistory): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* quota — 다음 append 에서 trim 시도됨 */
  }
}

export function clearEvolutionHistory(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// 한 이벤트를 append. id·at 은 자동 생성. 용량 초과 시 가장 오래된 항목을 잘라낸다.
export function appendEvolutionEvent(input: Omit<EvolutionEvent, 'id' | 'at'>): EvolutionEvent {
  const event: EvolutionEvent = {
    id: `evo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    ...input
  };
  const current = loadEvolutionHistory();
  const next: EvolutionHistory = {
    schema: 'storyx/evolution-history/v1',
    events: [event, ...current.events].slice(0, MAX_EVENTS)
  };
  saveEvolutionHistory(next);
  return event;
}

// import 페이로드용 — 외부에서 받은 history 를 검증하고 통째로 덮어쓴다.
export function replaceEvolutionHistory(input: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!input || typeof input !== 'object') return false;
  const obj = input as Record<string, unknown>;
  if (obj.schema !== 'storyx/evolution-history/v1') return false;
  const events = Array.isArray(obj.events) ? (obj.events as EvolutionEvent[]) : [];
  saveEvolutionHistory({ schema: 'storyx/evolution-history/v1', events });
  return true;
}
