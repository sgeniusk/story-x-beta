// 회차 생성 전 작가에게 던질 갈림길 질문을 레저·캐논에서 결정론으로 도출한다 (작가 결정 유도 1단계).
// 정본 — docs/superpowers/specs/2026-06-10-author-decision-forks-design.md
import type { StoryProject } from './storyEngine';
import type { PayoffLedgerReport } from './payoffLedger';

export interface EpisodeForkOption {
  label: string;
  /** 선택 시 의도 메모에 합쳐질 한 줄 intent 문장. */
  intentSeed: string;
}

export interface EpisodeFork {
  id: string;
  source: 'stalled-premise' | 'open-promise' | 'open-thread';
  question: string;
  options: EpisodeForkOption[];
}

const MAX_FORKS = 3;
const MAX_OPTIONS = 3;

// 전 회차에서 payoff 가 비어 있는 promise 를 등장 순서대로 모은다 (중복 제거).
function collectUnpaidPromises(project: StoryProject): string[] {
  const unpaid: string[] = [];
  for (const chapter of project.chapters) {
    for (const entry of chapter.rewardArc ?? []) {
      const promise = entry.promise.trim();
      if (promise.length > 0 && entry.payoff.trim().length === 0 && !unpaid.includes(promise)) {
        unpaid.push(promise);
      }
    }
  }
  return unpaid;
}

export function buildEpisodeForks(project: StoryProject, ledger: PayoffLedgerReport): EpisodeFork[] {
  const forks: EpisodeFork[] = [];
  const unpaid = collectUnpaidPromises(project);

  if (ledger.measured && ledger.isStalled && unpaid.length > 0) {
    forks.push({
      id: 'fork-stalled-payoff',
      source: 'stalled-premise',
      question: `회수 없이 ${ledger.deferredStreak}회차째입니다. 이번 화에서 어느 약속을 실제로 회수할까요?`,
      // 정체 갈림길: 가장 오래된 약속부터 — 오래 미룬 것이 회수 우선순위가 높다.
      options: unpaid.slice(0, MAX_OPTIONS).map((promise) => ({
        label: promise,
        intentSeed: `이번 화에서 "${promise}"를 인물의 선택과 대가로 실제 회수한다.`
      }))
    });
  } else if (unpaid.length > 0) {
    forks.push({
      id: 'fork-open-promise',
      source: 'open-promise',
      question: '열린 약속 중 이번 화에서 진척시킬 것은 무엇인가요?',
      // 진척 갈림길: 가장 최근 약속부터 — 독자 기억에 따뜻하게 남아 있는 것이 진척 후보다.
      options: unpaid.slice(-MAX_OPTIONS).map((promise) => ({
        label: promise,
        intentSeed: `이번 화에서 "${promise}"에 인물의 행동으로 한 발 다가간다.`
      }))
    });
  }

  // trim 후 동일 문자열은 중복 제거 — React key 충돌 및 옵션 중복 방지.
  const seen = new Set<string>();
  const threads = project.openThreads
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !seen.has(t) && seen.add(t));
  if (threads.length > 0) {
    forks.push({
      id: 'fork-open-thread',
      source: 'open-thread',
      question: '열린 떡밥 중 이번 화의 중심에 둘 것은 무엇인가요?',
      options: threads.slice(0, MAX_OPTIONS).map((thread) => ({
        label: thread,
        intentSeed: `이번 화의 중심 사건은 "${thread}"다.`
      }))
    });
  }

  return forks.slice(0, MAX_FORKS);
}

// 갈림길 선택을 기존 의도 메모에 합친다 — append 원칙, 중복 무시.
export function composeIntentWithFork(currentIntent: string, seed: string): string {
  const base = currentIntent.trim();
  if (base.includes(seed)) return base;
  return base.length > 0 ? `${base}\n${seed}` : seed;
}
