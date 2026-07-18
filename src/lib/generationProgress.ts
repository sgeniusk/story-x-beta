// 초안 생성 진행 피드백 — 경과시간 포맷·단계별 안심 메시지. 실 codex 초안은 보통 2~3분 걸려
// 정적 스피너만 두면 신규 작가가 hang 으로 오인한다(외부 테스트 게이트0 발견). 순수 로직으로 분리해 결정론 테스트.

/** 경과 초를 m:ss 로 포맷. 음수·NaN 은 0:00. */
export function formatElapsed(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export type PlayProgressKind =
  | 'dialogue'
  | 'showrunner'
  | 'candidates'
  | 'condense-register'
  | 'condense';

export interface PlayProgressPresentation {
  label: string;
  message: string;
  hint: string;
}

interface PlayProgressDefinition {
  label: string;
  hint: string;
  stages: ReadonlyArray<{ until: number; message: string }>;
}

const PLAY_PROGRESS: Record<PlayProgressKind, PlayProgressDefinition> = {
  dialogue: {
    label: '다음 대화',
    hint: '대개 30초~1분 걸려요. 이 화면에서 기다리면 대화가 이어집니다.',
    stages: [
      { until: 12, message: '현재 장면과 방금 건넨 말을 읽고 있어요' },
      { until: 30, message: '인물의 감정과 다음 반응을 맞추고 있어요' },
      { until: Number.POSITIVE_INFINITY, message: '대사의 결을 다듬고 있어요' }
    ]
  },
  showrunner: {
    label: '쇼러너 연출',
    hint: '대개 30초~1분 걸려요. 이 화면에서 기다리면 장면 제안이 도착합니다.',
    stages: [
      { until: 12, message: '지시와 현재 장면의 긴장을 읽고 있어요' },
      { until: 30, message: '장면을 움직일 연출을 고르고 있어요' },
      { until: Number.POSITIVE_INFINITY, message: '다음 장면 제안을 다듬고 있어요' }
    ]
  },
  candidates: {
    label: '전개 후보',
    hint: '대개 30초 안팎 걸려요. 현재 장면을 바꾸기 전까지 후보만 준비합니다.',
    stages: [
      { until: 10, message: '열린 떡밥과 현재 긴장을 살피고 있어요' },
      { until: 25, message: '예상 밖의 전개 갈래를 찾고 있어요' },
      { until: Number.POSITIVE_INFINITY, message: '각 갈래의 대가와 캐논 충돌을 비교하고 있어요' }
    ]
  },
  'condense-register': {
    label: '응결 등록',
    hint: '등록되면 화면을 떠나도 작업이 계속됩니다.',
    stages: [
      { until: 5, message: 'PLAY 원문과 응결 기준을 보관하고 있어요' },
      { until: Number.POSITIVE_INFINITY, message: '로컬 생성 작업에 안전하게 연결하고 있어요' }
    ]
  },
  condense: {
    label: '회차 응결',
    hint: '보통 2~3분 걸려요. 화면을 떠나도 작업은 계속되고 결과는 생성 보관함에 남습니다.',
    stages: [
      { until: 25, message: '이번 회차에 쓸 PLAY 원문을 정리하고 있어요' },
      { until: 70, message: '장면의 압력과 회차 구성을 세우고 있어요' },
      { until: 130, message: '보이스와 캐논 연속성을 점검하고 있어요' },
      { until: Number.POSITIVE_INFINITY, message: '한 회차로 읽히도록 마지막 결을 다듬고 있어요' }
    ]
  }
};

/** PLAY 비동기 작업의 정직한 시간대별 표현. 서버 telemetry인 것처럼 퍼센트를 추정하지 않는다. */
export function playProgressPresentation(
  kind: PlayProgressKind,
  elapsedSeconds: number
): PlayProgressPresentation {
  const definition = PLAY_PROGRESS[kind];
  const safe = Number.isFinite(elapsedSeconds) && elapsedSeconds > 0 ? elapsedSeconds : 0;
  const stage = definition.stages.find((candidate) => safe < candidate.until)
    ?? definition.stages[definition.stages.length - 1];
  return { label: definition.label, message: stage.message, hint: definition.hint };
}

/** number(ms) 또는 ISO 시작점부터의 경과 초. 손상·미래 값은 0초로 강등한다. */
export function elapsedSecondsSince(
  startedAt: number | string | null | undefined,
  now = Date.now()
): number {
  if (!Number.isFinite(now)) return 0;
  const startedAtMs = typeof startedAt === 'number'
    ? startedAt
    : typeof startedAt === 'string'
      ? Date.parse(startedAt)
      : Number.NaN;
  if (!Number.isFinite(startedAtMs) || startedAtMs < 0 || startedAtMs > now) return 0;
  return Math.max(0, Math.floor((now - startedAtMs) / 1000));
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

/** 예상 소요 안내 — 창을 닫거나 새로고침하지 않게 붙잡는 정직한 문구(새로고침 시 요청이 취소됨). */
export const GENERATION_TIME_HINT = '보통 2~3분쯤 걸려요. 새로고침하거나 창을 닫지 말고 기다려 주세요.';

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
