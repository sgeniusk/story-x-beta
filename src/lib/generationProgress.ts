// 초안 생성 진행 피드백 — 경과시간 포맷·단계별 안심 메시지. 실 codex 초안은 보통 2~3분 걸려
// 정적 스피너만 두면 신규 작가가 hang 으로 오인한다(외부 테스트 게이트0 발견). 순수 로직으로 분리해 결정론 테스트.

/** 경과 초를 m:ss 로 포맷. 음수·NaN 은 0:00. */
export function formatElapsed(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// 경과 구간 경계(초)와 각 구간 안심 메시지. 실제 생성 파이프라인 순서를 정직하게 반영한다.
const STAGES: ReadonlyArray<{ until: number; message: string }> = [
  { until: 20, message: '작가진이 이번 회차를 준비하고 있어요' },
  { until: 50, message: '인물의 욕망과 세계 규칙을 반영하는 중이에요' },
  { until: 100, message: '장면과 긴장 곡선을 짜는 중이에요' },
  { until: Number.POSITIVE_INFINITY, message: '연속성을 점검하고 마무리하는 중이에요' },
];

/** 경과 초에 맞는 단계별 안심 메시지. 마지막 구간으로 수렴한다. */
export function generationStageMessage(elapsedSeconds: number): string {
  const safe = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0;
  for (const stage of STAGES) {
    if (safe < stage.until) return stage.message;
  }
  return STAGES[STAGES.length - 1].message;
}

/** 예상 소요 안내 — 창을 닫지 않게 붙잡는 정직한 문구. */
export const GENERATION_TIME_HINT = '보통 2~3분쯤 걸려요. 창을 닫지 말고 기다려 주세요.';

// 작가 인터뷰 생성(dev codex ~1분) 단계 안심 메시지. 실제 인터뷰 파이프라인 순서를 반영한다.
const INTERVIEW_STAGES: ReadonlyArray<{ until: number; message: string }> = [
  { until: 15, message: '작가진이 자유 서술을 처음부터 끝까지 읽는 중이에요' },
  { until: 40, message: '이 작품에만 필요한 질문을 고르는 중이에요' },
  { until: Number.POSITIVE_INFINITY, message: '질문과 선택지를 다듬는 중이에요' },
];

/** 인터뷰 생성 경과 초에 맞는 단계별 안심 메시지. 마지막 구간으로 수렴한다. */
export function interviewStageMessage(elapsedSeconds: number): string {
  const safe = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0;
  for (const stage of INTERVIEW_STAGES) {
    if (safe < stage.until) return stage.message;
  }
  return INTERVIEW_STAGES[INTERVIEW_STAGES.length - 1].message;
}

/** 인터뷰 예상 소요 + 새로고침 금지 안내 — fetch 는 새로고침 시 취소되므로 명시해 붙잡는다. */
export const INTERVIEW_TIME_HINT = '보통 1분 안팎 걸려요. 새로고침하지 말고 기다려 주세요.';
