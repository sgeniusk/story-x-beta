// 회차 진도 체크 — 연재 포맷에서 결정론으로 도출하는 페이스 질문 3개 (LLM 0회).
// 정본 — docs/superpowers/specs/2026-06-10-pace-check-design.md A절
import type { StoryProject } from './storyEngine';
import type { PayoffLedgerReport } from './payoffLedger';
import { composeIntentWithFork } from './episodeBriefing';

export interface PaceQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; intentSeed: string }>;
}

// stake 별 최종 결말 기준 — 같은 stake 문자열의 마지막 resolution 이 deferred 인 것만 집계.
function countDeferredStakes(project: StoryProject): number {
  // stake → 마지막으로 등장한 resolution
  const lastResolution = new Map<string, string>();
  for (const chapter of project.chapters) {
    for (const entry of chapter.stakesLedger ?? []) {
      if (entry.resolution) {
        lastResolution.set(entry.stake, entry.resolution);
      }
    }
  }
  let count = 0;
  for (const resolution of lastResolution.values()) {
    if (resolution === 'deferred') count += 1;
  }
  return count;
}

/**
 * 연재 포맷에서 회차 진도 체크 질문 3개를 반환한다.
 * 트리거 조건 미달이면 빈 배열(거짓 질문 차단).
 *
 * @param isSerial - 호출부(StoryXDesk)에서 blueprint.format 기준으로 판별해 전달
 */
export function buildPaceCheck(
  project: StoryProject,
  ledger: PayoffLedgerReport,
  isSerial: boolean
): PaceQuestion[] {
  if (!isSerial) return [];
  if (project.chapters.length < 2) return [];
  const deferredCount = countDeferredStakes(project);
  if (!ledger.isStalled && deferredCount < 2) return [];

  return [
    {
      id: 'premise-ridge',
      question: '전제(중심 질문)가 어디까지 왔나요?',
      options: [
        {
          label: '초입',
          intentSeed: '전제는 아직 초입이다 — 이번 화는 토대를 쌓고 큰 reveal 은 아낀다.',
        },
        {
          label: '중턱',
          intentSeed: '전제는 중턱이다 — 이번 화는 한 단계 전진하되 마지막 답은 남겨 둔다.',
        },
        {
          label: '정상 직전',
          intentSeed: '전제가 정상 직전이다 — 이번 화는 결정적 전환을 향해 조여 간다.',
        },
      ],
    },
    {
      id: 'episode-pace',
      question: '이번 화의 페이스는 무엇인가요?',
      options: [
        {
          label: '전진',
          intentSeed: '이번 화는 전진이다 — 사건이 움직이고 선택이 좁아진다.',
        },
        {
          label: '숨 고르기',
          intentSeed: '이번 화는 숨 고르기다 — 인물과 관계의 결을 다지고 다음 폭발의 긴장을 쌓는다.',
        },
        {
          label: '회수',
          intentSeed: '이번 화는 회수다 — 열린 약속 하나를 인물의 선택과 대가로 결판낸다.',
        },
      ],
    },
    {
      id: 'next-payoff',
      question: '다음 큰 회수까지 몇 화를 남길까요?',
      options: [
        {
          label: '이번 화',
          intentSeed: '다음 큰 회수는 이번 화다.',
        },
        {
          label: '1~2화 안',
          intentSeed: '다음 큰 회수는 1~2화 안에 온다 — 이번 화는 그 직전 단계까지만 전진한다.',
        },
        {
          label: '3화 이상',
          intentSeed: '다음 큰 회수는 3화 이상 뒤다 — 이번 화는 복선과 압력을 쌓는 데 쓴다.',
        },
      ],
    },
  ];
}

/**
 * 같은 질문의 다른 옵션을 다시 클릭했을 때 이전 시드 줄을 교체한다.
 * - questionSeeds: 해당 질문의 모든 옵션 시드 배열
 * - newSeed: 새로 선택한 시드
 * 기존 시드 줄이 있으면 교체, 없으면 append. 이미 같은 시드면 중복 무시.
 */
export function replacePaceSeed(
  currentIntent: string,
  questionSeeds: string[],
  newSeed: string
): string {
  const lines = currentIntent.split('\n');
  const existingIdx = lines.findIndex((line) => questionSeeds.includes(line));

  if (existingIdx >= 0) {
    // 이미 같은 시드면 중복 무시
    if (lines[existingIdx] === newSeed) return currentIntent;
    // 같은 질문의 다른 옵션이면 교체
    lines[existingIdx] = newSeed;
    return lines.join('\n');
  }

  // 해당 질문 시드가 없으면 composeIntentWithFork 와 동일한 append 원칙
  return composeIntentWithFork(currentIntent, newSeed);
}
