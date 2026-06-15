// 회차 생성 전 작가에게 던질 갈림길 질문을 레저·캐논에서 결정론으로 도출한다 (작가 결정 유도 1단계).
// 정본 — docs/superpowers/specs/2026-06-10-author-decision-forks-design.md
import type { StoryProject } from './storyEngine';
import type { PayoffLedgerReport } from './payoffLedger';

export interface EpisodeForkOption {
  label: string;
  /** 선택 시 의도 메모에 합쳐질 한 줄 intent 문장. */
  intentSeed: string;
  /** P12 — 기확정 캐논과 크게 겹치는 옵션(이미 일어난 일일 수 있음). 제외하지 않고 배지로만 경고한다. */
  canonSuspect?: boolean;
}

export interface EpisodeFork {
  id: string;
  source: 'stalled-premise' | 'open-promise' | 'open-thread' | 'deferred-stake';
  question: string;
  options: EpisodeForkOption[];
}

const MAX_FORKS = 3;
const MAX_OPTIONS = 3;

export type VsRarity = 'common' | 'surprising' | 'radical';
export interface VsCandidate {
  direction: string;
  probability: number;     // LLM verbalize 추정, 내부용(비노출)
  rarity: VsRarity;
  canonSuspect?: boolean;
}

// VS 의외도 — LLM verbalize 확률을 흔함/의외/파격 라벨로 결정론 변환(Phase C-1). 임계는 라이브 후 조정 가능.
export function classifyRarity(probability: number): VsRarity {
  if (probability >= 0.4) return 'common';
  if (probability >= 0.15) return 'surprising';
  return 'radical';
}

// VS 후보 선택을 의도 메모에 합칠 한 줄 시드. composeIntentWithFork 가 append, stripConsumedSeeds 가 소거.
export function buildVsIntentSeed(direction: string): string {
  return `이번 화의 전개: "${direction}"`;
}

// provider 응답({ candidates: [{ direction, probability }] })을 VsCandidate[] 로 정규화.
// direction 빈 것 제외 · probability 0~1 clamp(누락 시 0.3) · rarity 변환 · canonSuspect(overlapsCanonFact) · 최대 4개.
const MAX_VS_CANDIDATES = 4;
export function normalizeVsCandidates(raw: unknown, canonStatements: string[]): VsCandidate[] {
  if (typeof raw !== 'object' || raw === null) return [];
  const list = (raw as Record<string, unknown>).candidates;
  if (!Array.isArray(list)) return [];
  const out: VsCandidate[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const direction = typeof r.direction === 'string' ? r.direction.trim() : '';
    if (!direction) continue;
    let probability = typeof r.probability === 'number' && Number.isFinite(r.probability) ? r.probability : 0.3;
    probability = Math.min(1, Math.max(0, probability));
    out.push({
      direction,
      probability,
      rarity: classifyRarity(probability),
      ...(overlapsCanonFact(direction, canonStatements) ? { canonSuspect: true } : {})
    });
    if (out.length >= MAX_VS_CANDIDATES) break;
  }
  return out;
}

// stake 문자열을 토큰 집합으로 정규화한다 — 2자 이상 토큰, 한국어 조사 접미 단순 제거.
const KR_JOSA = /[의와과은는이가을를에]$/u;
function normalizeStakeTokens(stake: string): Set<string> {
  return new Set(
    stake
      .split(/\s+/)
      .map((t) => t.replace(KR_JOSA, ''))
      .filter((t) => t.length >= 2)
  );
}

// 두 정규화 토큰 집합이 "같은 stake" 기준을 충족하는지 판정.
// Jaccard ≥ 2/3 또는 한쪽이 다른 쪽의 부분집합이면 동일 stake 로 취급.
function isSameStake(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  const intersection = [...a].filter((t) => b.has(t)).length;
  if ([...a].every((t) => b.has(t)) || [...b].every((t) => a.has(t))) return true;
  const union = new Set([...a, ...b]).size;
  return intersection / union >= 2 / 3;
}

// stakesLedger 를 순회해 드리프트 매칭으로 클러스터화하고, deferred 만 남긴다.
// 최신 회차 결말 우선 — 뒤에서 kept/lost 로 결판난 클러스터는 제외.
import type { Chapter } from './storyEngine';

function collectDeferredStakes(chapters: Chapter[]): string[] {
  // 클러스터: { canonical: 최신 label, resolution: 최신 결말 }
  const clusters: Array<{ label: string; tokens: Set<string>; resolution: string }> = [];

  for (const chapter of chapters) {
    for (const entry of chapter.stakesLedger ?? []) {
      const stake = entry.stake.trim();
      if (!stake) continue;
      const tokens = normalizeStakeTokens(stake);
      const resolution = entry.resolution ?? 'deferred';

      // 기존 클러스터 중 매칭되는 것을 찾는다
      const match = clusters.find((c) => isSameStake(c.tokens, tokens));
      if (match) {
        // 최신 회차 결말로 갱신 — 단, 이미 kept/lost 로 결판난 클러스터는 덮어쓰지 않는다.
        // (결판난 stake 가 이후 드리프트 버전으로 재등장해도 결판 상태가 유지되어야 함)
        if (match.resolution !== 'kept' && match.resolution !== 'lost') {
          match.label = stake;
          match.tokens = tokens;
          match.resolution = resolution;
        }
      } else {
        clusters.push({ label: stake, tokens, resolution });
      }
    }
  }

  return clusters
    .filter((c) => c.resolution === 'deferred')
    .map((c) => c.label);
}

// P12(2026-06-10 #3 ch5 라이브) — 생성 LLM 이 기확정 캐논을 새 promise 로 재발급하면 fork 가
// 모순 약속을 노출해 캐논 충돌 회차가 생성된다. 옵션 텍스트가 한 캐논 문장과 크게 겹치면 의심 표시.
// 보수 판정: 옵션 토큰(조사 제거·2자+)의 65% 이상이 한 캐논 문장에서 prefix 단위로 발견될 때.
//   임계 0.65 라이브 캘리브레이션 — 진양성(고백 promise) 0.667 / 경계 거짓양성(관측 모델 이탈 stake,
//   캐논은 모델의 존재만 확정·이탈은 미결) 0.6 사이. 토큰 4개 미만은 판정하지 않는다.
// 제외가 아니라 배지 — 최종 판단은 작가.
function overlapsCanonFact(text: string, canonStatements: string[]): boolean {
  const tokens = [...normalizeStakeTokens(text)];
  if (tokens.length < 4) return false;
  for (const statement of canonStatements) {
    const factTokens = [...normalizeStakeTokens(statement)];
    const covered = tokens.filter((t) => factTokens.some((f) => f.startsWith(t) || t.startsWith(f))).length;
    if (covered / tokens.length >= 0.65) return true;
  }
  return false;
}

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

// 작품 헌장 화수 예산 상태 — Phase A-4. 위치·잔여 화수·미회수 약속을 결정론으로 산출한다.
// overBudget(미회수 > 잔여)면 신규 발급 금지, finalStretch(잔여 ≤ 25%)면 종반 — 둘 다 생성·검토 프롬프트에 강제.
export interface ContractStatus {
  plannedEpisodes: number;
  position: number;     // 마지막으로 쓴 회차(= chapters 마지막)
  remaining: number;    // 앞으로 쓸 회차 수 (plannedEpisodes - position)
  unpaidCount: number;  // 미회수 약속 수
  overBudget: boolean;  // 미회수 > 잔여
  finalStretch: boolean; // 잔여 ≤ plannedEpisodes×25%
}

export function buildContractStatus(project: StoryProject): ContractStatus | null {
  const contract = project.storyContract;
  if (!contract) return null;
  const planned = contract.plannedEpisodes;
  // 위치는 카운터가 아니라 실제 chapters 마지막 회차에서 도출(폴백 번호 드리프트 면역, Phase D 와 동일 원칙).
  const position = project.chapters.reduce((max, chapter) => Math.max(max, chapter.episode), 0);
  const remaining = planned - position;
  const unpaidCount = collectUnpaidPromises(project).length;
  return {
    plannedEpisodes: planned,
    position,
    remaining,
    unpaidCount,
    overBudget: unpaidCount > remaining,
    finalStretch: remaining <= planned * 0.25
  };
}

export function buildEpisodeForks(project: StoryProject, ledger: PayoffLedgerReport): EpisodeFork[] {
  const forks: EpisodeFork[] = [];
  const unpaid = collectUnpaidPromises(project);
  // P12 — 옵션이 기확정 캐논과 겹치면 의심 배지. true 일 때만 필드를 실어 옵션을 가볍게 유지한다.
  const canonStatements = project.canonFacts.map((fact) => fact.statement);
  const suspect = (label: string): boolean | undefined =>
    overlapsCanonFact(label, canonStatements) ? true : undefined;

  if (ledger.measured && ledger.isStalled && unpaid.length > 0) {
    forks.push({
      id: 'fork-stalled-payoff',
      source: 'stalled-premise',
      question: `회수 없이 ${ledger.deferredStreak}회차째입니다. 이번 화에서 어느 약속을 실제로 회수할까요?`,
      // 정체 갈림길: 가장 오래된 약속부터 — 오래 미룬 것이 회수 우선순위가 높다.
      options: unpaid.slice(0, MAX_OPTIONS).map((promise) => ({
        label: promise,
        intentSeed: `이번 화에서 "${promise}"를 인물의 선택과 대가로 실제 회수한다.`,
        canonSuspect: suspect(promise)
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
        intentSeed: `이번 화에서 "${promise}"에 인물의 행동으로 한 발 다가간다.`,
        canonSuspect: suspect(promise)
      }))
    });
  }

  // 라이브 발견(2026-06-10 #3 헌터물) — 생성 LLM 이 rewardArc payoff 를 회차 안에서 즉시 채우고
  // openThreads 는 생성 경로가 채우지 않아, 실제 미뤄진 위험은 stakesLedger deferred 에만 남는다.
  // stake 별 "마지막 회차의 결말"이 deferred 인 것만 옵션으로 — 뒤에서 kept/lost 로 결판난 위험은 제외.
  // 드리프트 매칭: 같은 stake 가 회차마다 다른 문구로 기록될 수 있으므로 토큰 정규화+Jaccard 로 병합.
  //   최신 회차 결말 우선, kept/lost 로 결판난 클러스터는 제외.
  const deferredStakes = collectDeferredStakes(project.chapters);
  if (deferredStakes.length > 0) {
    forks.push({
      id: 'fork-deferred-stake',
      source: 'deferred-stake',
      question: '결과가 미뤄진 위험 중 이번 화에서 결판낼 것은 무엇인가요?',
      // 시드 강도 2단(2026-06-10 A/B 발견): 정체면 결판 문구, 비정체면 진척 문구 — 비정체 과회수 방지.
      options: deferredStakes.slice(0, MAX_OPTIONS).map((stake) => ({
        label: stake,
        intentSeed: ledger.isStalled
          ? `이번 화에서 "${stake}"를 더 미루지 않고 인물의 선택과 대가로 결판낸다.`
          : `이번 화에서 "${stake}"에 인물의 행동으로 한 발 다가가되, 결판을 서두르지 않는다.`,
        canonSuspect: suspect(stake)
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
        intentSeed: `이번 화의 중심 사건은 "${thread}"다.`,
        canonSuspect: suspect(thread)
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

// 생성에 소비된 갈림길 시드 줄을 의도 메모에서 제거한다 — P7 (이미 회수된 약속 재지시 차단).
// 시드 템플릿 줄만 제거: buildEpisodeForks 가 만드는 두 패턴에 anchored 매칭.
//   - `이번 화에서 "..."`로 시작하는 줄 (deferred-stake, open-promise, stalled-premise 시드)
//   - `이번 화의 중심 사건은 "..."다.` 패턴 (open-thread 시드)
// 패턴과 정확히 매칭되지 않는 줄(작가 자필)은 보존한다.
const SEED_PATTERN_EPISODE = /^이번 화에서 "/u;
const SEED_PATTERN_THREAD = /^이번 화의 중심 사건은 ".*"다\.$/u;
// 진도 체크(paceInterview) 시드 — 고정 템플릿이라 anchored 매칭. paceInterview 가
// episodeBriefing 을 import 하므로(순환 방지) 패턴만 여기 미러한다. 문구 변경 시 양쪽 동기화.
const SEED_PATTERN_PACE_RIDGE = /^전제(는|가) .+다 — /u;
const SEED_PATTERN_PACE_EPISODE = /^이번 화는 (전진이|숨 고르기|회수)다 — /u;
const SEED_PATTERN_PACE_NEXT = /^다음 큰 회수는 /u;
// LLM 진도 인터뷰(paceInterviewClient) 시드 — paceInterviewClient 가 각 intentSeed 앞에 붙이는 접두.
// 접두가 있는 줄을 소비 처리해 생성 후 자동 소거. 접두 계약 변경 시 paceInterviewClient 와 동기화.
const SEED_PATTERN_PACE_LLM = /^\[페이스\] /u;
// VS 전개 후보(buildVsIntentSeed) 시드 — 생성 후 자동 소거.
const SEED_PATTERN_VS = /^이번 화의 전개: "/u;

export function stripConsumedSeeds(intent: string): string {
  if (!intent) return '';
  const lines = intent.split('\n');
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false; // 빈 줄 정리
    if (SEED_PATTERN_EPISODE.test(trimmed)) return false;
    if (SEED_PATTERN_THREAD.test(trimmed)) return false;
    if (SEED_PATTERN_PACE_RIDGE.test(trimmed)) return false;
    if (SEED_PATTERN_PACE_EPISODE.test(trimmed)) return false;
    if (SEED_PATTERN_PACE_NEXT.test(trimmed)) return false;
    if (SEED_PATTERN_PACE_LLM.test(trimmed)) return false;
    if (SEED_PATTERN_VS.test(trimmed)) return false;
    return true;
  });
  return kept.join('\n').trim();
}
