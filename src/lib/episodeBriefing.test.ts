import { describe, it, expect } from 'vitest';
import { buildContractStatus, buildEpisodeForks, composeIntentWithFork, stripConsumedSeeds } from './episodeBriefing';
import { computePayoffLedger } from './payoffLedger';
import type { Chapter, StoryContract, StoryProject } from './storyEngine';
import { applyContractAmendment, createEmptyProject } from './storyEngine';

function ch(episode: number, opts: Partial<Pick<Chapter, 'rewardArc' | 'stakesLedger'>> = {}): Chapter {
  return {
    id: `episode-${episode}`, episode, title: `${episode}화`, hook: '', outline: [],
    beats: [], prose: '', memoryAnchors: [], newCanonFacts: [], ...opts
  };
}

function projectWith(chapters: Chapter[], openThreads: string[] = []): StoryProject {
  const project = createEmptyProject();
  return { ...project, chapters, openThreads };
}

describe('buildEpisodeForks', () => {
  it('레저·떡밥 데이터가 전혀 없으면 빈 배열 (거짓 질문 차단)', () => {
    const project = projectWith([ch(1), ch(2)]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toEqual([]);
  });

  it('정체 상태면 회수 갈림길(stalled-premise)이 첫 질문이고, 미회수 promise 가 옵션이다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '배신자의 정체', payoff: '' }] }),
      ch(2, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(3, { rewardArc: [{ promise: '오른편 장부의 주인', payoff: '' }] }),
      ch(4, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('stalled-premise');
    expect(forks[0].options.map((o) => o.label)).toContain('배신자의 정체');
    expect(forks[0].options[0].intentSeed.length).toBeGreaterThan(0);
  });

  it('정체가 아니면 진척 갈림길(open-promise)로 묻는다', () => {
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: '탑의 비밀', payoff: '' }, { promise: 'q', payoff: '회수됨' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('open-promise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['탑의 비밀']);
  });

  it('[stall] 미회수 약속이 4개면 가장 오래된 3개(P1·P2·P3)를 제시한다 — slice(0, MAX_OPTIONS)', () => {
    // P1..P4 를 ch1~4에 도입, ch3~5 는 deferred-only 로 정체(deferredStreak ≥ 3) 유발
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: 'P1', payoff: '' }] }),
      ch(2, { rewardArc: [{ promise: 'P2', payoff: '' }] }),
      ch(3, { rewardArc: [{ promise: 'P3', payoff: '' }], stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(4, { rewardArc: [{ promise: 'P4', payoff: '' }], stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] }),
      ch(5, { stakesLedger: [{ stake: 's', atRisk: 'x', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('stalled-premise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['P1', 'P2', 'P3']);
  });

  it('[open-promise] 미회수 약속이 4개면 가장 최근 3개(P2·P3·P4)를 제시한다 — slice(-MAX_OPTIONS)', () => {
    // 정체 없음: ch4에 paid promise 포함해 deferredStreak < 3
    const project = projectWith([
      ch(1, { rewardArc: [{ promise: 'P1', payoff: '' }] }),
      ch(2, { rewardArc: [{ promise: 'P2', payoff: '' }] }),
      ch(3, { rewardArc: [{ promise: 'P3', payoff: '' }] }),
      ch(4, { rewardArc: [{ promise: 'P4', payoff: '' }, { promise: 'P_paid', payoff: '회수' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks[0].source).toBe('open-promise');
    expect(forks[0].options.map((o) => o.label)).toEqual(['P2', 'P3', 'P4']);
  });

  it('openThreads 중복(trim 후 동일 포함)은 제거해 옵션을 만든다', () => {
    const project = projectWith([], ['떡밥A', '떡밥A', ' 떡밥A ', '떡밥B']);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('open-thread');
    expect(forks[0].options.map((o) => o.label)).toEqual(['떡밥A', '떡밥B']);
  });

  it('openThreads 가 있으면 떡밥 갈림길을 추가한다 (최대 3 옵션)', () => {
    const project = projectWith([], ['떡밥A', '떡밥B', '떡밥C', '떡밥D']);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('open-thread');
    expect(forks[0].options).toHaveLength(3);
  });

  // 라이브 발견(2026-06-10 #3 헌터물) — 생성 LLM 이 rewardArc payoff 를 회차 안에서 즉시 채우고
  // openThreads 는 생성 경로가 채우지 않아, 실제 미뤄진 위험은 stakesLedger deferred 에만 남는다.
  // deferred 를 fork 소스로 쓰지 않으면 실생성 작품에서 갈림길이 영원히 안 뜬다.
  // [시드 강도 2단] 비정체 상황 — "한 발 다가가되, 결판을 서두르지 않는다" 문구
  it('미회수 promise·openThreads 가 없어도 stakesLedger deferred 가 있으면 위험 갈림길을 만든다 (비정체)', () => {
    const project = projectWith([
      ch(1, {
        rewardArc: [{ promise: '첫 변수', payoff: '즉시 회수됨' }],
        stakesLedger: [
          { stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' },
          { stake: '백도현의 정체와 게이트 조작의 진실', atRisk: '태준의 계획', resolution: 'deferred' }
        ]
      })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('deferred-stake');
    expect(forks[0].options.map((o) => o.label)).toEqual([
      '서가을의 정신적 안전',
      '백도현의 정체와 게이트 조작의 진실'
    ]);
    // 비정체 문구: 한 발 다가가되 결판 서두르지 않음
    expect(forks[0].options[0].intentSeed).toBe(
      '이번 화에서 "서가을의 정신적 안전"에 인물의 행동으로 한 발 다가가되, 결판을 서두르지 않는다.'
    );
  });

  // [시드 강도 2단] 비정체 상황 — kept/lost 후 deferred 잔존 확인 (비정체)
  it('같은 stake 가 뒤 회차에서 kept/lost 로 결판나면 deferred 갈림길 옵션에서 빠진다 (비정체)', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '민간인 피해', atRisk: '시민', resolution: 'deferred' },
          { stake: '붕괴 위험', atRisk: '시간선', resolution: 'deferred' }
        ]
      }),
      ch(2, { stakesLedger: [{ stake: '민간인 피해', atRisk: '시민', resolution: 'kept' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    expect(forks).toHaveLength(1);
    expect(forks[0].source).toBe('deferred-stake');
    expect(forks[0].options.map((o) => o.label)).toEqual(['붕괴 위험']);
    // 비정체 문구 확인
    expect(forks[0].options[0].intentSeed).toBe(
      '이번 화에서 "붕괴 위험"에 인물의 행동으로 한 발 다가가되, 결판을 서두르지 않는다.'
    );
  });

  // [시드 강도 2단] 정체 상황 — "더 미루지 않고 인물의 선택과 대가로 결판낸다" 문구
  it('정체(isStalled=true) 상황에서 deferred-stake 시드는 결판 문구를 사용한다', () => {
    // deferredStreak >= 3 을 유발: ch1~3 이 모두 deferred-only
    const project = projectWith([
      ch(1, { stakesLedger: [{ stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' }] }),
      ch(2, { stakesLedger: [{ stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' }] }),
      ch(3, { stakesLedger: [{ stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' }] })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    expect(deferredFork).toBeDefined();
    // 정체 문구: 결판낸다
    expect(deferredFork!.options[0].intentSeed).toBe(
      '이번 화에서 "서가을의 정신적 안전"를 더 미루지 않고 인물의 선택과 대가로 결판낸다.'
    );
  });
});

describe('composeIntentWithFork', () => {
  it('기존 메모에 줄바꿈으로 덧붙인다', () => {
    expect(composeIntentWithFork('기존 의도', '새 시드')).toBe('기존 의도\n새 시드');
  });

  it('빈 메모면 시드만 넣는다', () => {
    expect(composeIntentWithFork('  ', '새 시드')).toBe('새 시드');
  });

  it('이미 포함된 시드는 중복 추가하지 않는다', () => {
    expect(composeIntentWithFork('기존\n새 시드', '새 시드')).toBe('기존\n새 시드');
  });
});

describe('stake 드리프트 매칭 — buildEpisodeForks deferred-stake', () => {
  // 실제 발생 사례: ch1 "백도현의 정체와 게이트 조작의 진실" deferred
  //                ch2 "백도현과 게이트 조작의 핵심 진실"   deferred
  // → 같은 stake로 취급, deferred 갈림길 옵션 1개로 병합 (최신 회차 우선)
  it('같은 stake 의 문구 드리프트는 같은 키로 취급해 하나의 deferred 옵션으로 병합한다', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '백도현의 정체와 게이트 조작의 진실', atRisk: '태준', resolution: 'deferred' }
        ]
      }),
      ch(2, {
        stakesLedger: [
          { stake: '백도현과 게이트 조작의 핵심 진실', atRisk: '태준', resolution: 'deferred' }
        ]
      })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    expect(deferredFork).toBeDefined();
    // 병합되어 옵션 1개 (드리프트 케이스)
    expect(deferredFork!.options).toHaveLength(1);
    // 최신 회차(ch2) 문구 우선
    expect(deferredFork!.options[0].label).toBe('백도현과 게이트 조작의 핵심 진실');
  });

  // 거짓 병합 가드: 일부 토큰만 겹치는 쌍은 병합되지 않아야 한다
  it('토큰이 일부만 겹치는 stake 는 병합하지 않는다 (거짓 병합 가드)', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '서가을의 정신적 안전', atRisk: '서가을', resolution: 'deferred' },
          { stake: '태준과 서가을 사이의 신뢰', atRisk: '팀', resolution: 'deferred' }
        ]
      })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    expect(deferredFork).toBeDefined();
    // 병합되지 않고 2개 유지
    expect(deferredFork!.options).toHaveLength(2);
    const labels = deferredFork!.options.map((o) => o.label);
    expect(labels).toContain('서가을의 정신적 안전');
    expect(labels).toContain('태준과 서가을 사이의 신뢰');
  });

  // kept/lost 로 결판난 stake 가 이후 드리프트 버전으로 deferred 가 오면 제거돼야 함
  it('드리프트 쌍에서 이전 버전이 kept 로 결판났으면 deferred 갈림길에서 제외한다', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '백도현의 정체와 게이트 조작의 진실', atRisk: '태준', resolution: 'kept' }
        ]
      }),
      ch(2, {
        stakesLedger: [
          // 드리프트 버전 — 같은 stake 로 인식돼야 함 → 이미 kept 로 결판남
          { stake: '백도현과 게이트 조작의 핵심 진실', atRisk: '태준', resolution: 'deferred' }
        ]
      })
    ]);
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    // kept 로 결판난 stake 는 옵션에서 빠져야 함
    expect(deferredFork).toBeUndefined();
  });

  // P12(2026-06-10 4차 라이브) — 생성 LLM 이 기확정 캐논(태준의 고백 비밀)을 새 promise 로
  // 재발급 → fork 가 노출 → 선택 → ch5 캐논 충돌(검토 2인 출고 불가). fork 옵션이 캐논과
  // 겹치면 canonSuspect 로 표시한다(제외가 아니라 배지 — 거짓 양성 안전).
  it('[P12] 기확정 캐논과 토큰이 크게 겹치는 promise 옵션은 canonSuspect 로 표시된다 (ch5 fixture 실데이터)', () => {
    const project = projectWith([
      ch(1, {
        rewardArc: [{ promise: '태준이 서가을에게 숨긴 미래의 진실을 말하는가?', payoff: '' }]
      })
    ]);
    project.canonFacts = [
      {
        id: 'canon-x',
        episode: 1,
        owner: 'character',
        statement:
          '태준이 서가을에게 숨긴 사실은 미래에서 서가을이 태준을 살리며 그의 붕괴 기억과 공포를 떠안고 무너졌다는 것이다.'
      }
    ];
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const promiseFork = forks.find((f) => f.source === 'open-promise');
    expect(promiseFork).toBeDefined();
    expect(promiseFork!.options[0].canonSuspect).toBe(true);
  });

  it('[P12] 캐논과 겹치지 않는 정당한 옵션은 canonSuspect 가 아니다 (거짓 양성 가드, ch5 fixture 실데이터)', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '한지욱과 마도협의 실제 합류', atRisk: '팀', resolution: 'deferred' },
          { stake: '두 핵심 변수가 함께 움직일 때 발생하는 붕괴 전조', atRisk: '시간선', resolution: 'deferred' }
        ]
      })
    ]);
    project.canonFacts = [
      {
        id: 'canon-17',
        episode: 4,
        owner: 'plot',
        statement: '윤서문의 예비 회수 지점에 마도협 계열의 외부 간섭 흔적과 한지욱에게 변수를 먼저 만나라는 메모가 남아 있었다.'
      },
      {
        id: 'canon-21',
        episode: 5,
        owner: 'world',
        statement: '관측장은 태준과 서가을이 함께 접촉 지점에 접근하면 붕괴 전조가 조기 발현될 수 있다는 조건을 제시했다.'
      }
    ];
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    expect(deferredFork).toBeDefined();
    expect(deferredFork!.options.every((o) => o.canonSuspect !== true)).toBe(true);
  });

  // 임계 캘리브레이션 핀 — 캐논이 "관측 모델의 존재"만 확정하고 "이탈"은 미결인 stake 는
  // 토큰이 일부 겹쳐도(커버리지 0.6) 의심 표시하지 않는다. 임계 0.65 의 근거 케이스(라이브).
  it('[P12] 캐논이 존재만 확정한 대상의 미결 위험 stake 는 canonSuspect 가 아니다 (임계 경계 핀)', () => {
    const project = projectWith([
      ch(1, {
        stakesLedger: [
          { stake: '윤서문의 관측 모델을 벗어날 가능성', atRisk: '태준과 서가을', resolution: 'deferred' }
        ]
      })
    ]);
    project.canonFacts = [
      {
        id: 'canon-12',
        episode: 3,
        owner: 'plot',
        statement:
          '백도현은 최종 명령자가 아니라 윤서문의 관측 모델을 현장에서 실행하고 보고하는 인물이며, 그 자신도 완전히 신뢰받는 주체가 아니다.'
      }
    ];
    const forks = buildEpisodeForks(project, computePayoffLedger(project.chapters));
    const deferredFork = forks.find((f) => f.source === 'deferred-stake');
    expect(deferredFork).toBeDefined();
    expect(deferredFork!.options[0].canonSuspect).not.toBe(true);
  });
});

describe('stripConsumedSeeds', () => {
  it('시드 2줄과 작가 자필 1줄이 있을 때 자필만 남긴다', () => {
    const intent = [
      '이번 화에서 "서가을의 정신적 안전"에 인물의 행동으로 한 발 다가가되, 결판을 서두르지 않는다.',
      '이번 화의 중심 사건은 "백도현 정체"다.',
      '강태준이 한지욱에게 진실을 털어놓는 장면 원함.'
    ].join('\n');
    expect(stripConsumedSeeds(intent)).toBe('강태준이 한지욱에게 진실을 털어놓는 장면 원함.');
  });

  it('시드 없는 자필 메모는 그대로 반환한다', () => {
    const intent = '강태준의 회귀 능력을 더 강조해 주세요.';
    expect(stripConsumedSeeds(intent)).toBe('강태준의 회귀 능력을 더 강조해 주세요.');
  });

  it('빈 문자열은 빈 문자열을 반환한다', () => {
    expect(stripConsumedSeeds('')).toBe('');
  });

  it('"이번 화에서 ..."로 시작하는 결판 문구도 제거한다', () => {
    const intent = [
      '이번 화에서 "붕괴 위험"를 더 미루지 않고 인물의 선택과 대가로 결판낸다.',
      '내가 원하는 것.'
    ].join('\n');
    expect(stripConsumedSeeds(intent)).toBe('내가 원하는 것.');
  });

  // 진도 체크(paceInterview) 시드도 회차당 1회 소비되는 지시라 생성 후 제거한다 (스펙 B.2).
  it('진도 체크 시드 3종(전제 능선·페이스·다음 회수)도 제거하고 자필은 보존한다', () => {
    const intent = [
      '전제는 중턱이다 — 이번 화는 한 단계 전진하되 마지막 답은 남겨 둔다.',
      '이번 화는 숨 고르기다 — 인물과 관계의 결을 다지고 다음 폭발의 긴장을 쌓는다.',
      '다음 큰 회수는 1~2화 안에 온다 — 이번 화는 그 직전 단계까지만 전진한다.',
      '서가을의 후유증 장면을 꼭 넣을 것.'
    ].join('\n');
    expect(stripConsumedSeeds(intent)).toBe('서가을의 후유증 장면을 꼭 넣을 것.');
  });

  it('진도 체크 시드와 비슷하지만 자필인 줄("이번 화는" 으로 시작하는 자유문)은 패턴 불일치 시 보존한다', () => {
    const intent = '이번 화는 분위기를 바꿔 보고 싶다.';
    expect(stripConsumedSeeds(intent)).toBe('이번 화는 분위기를 바꿔 보고 싶다.');
  });

  // LLM 진도 인터뷰(paceInterviewClient) 시드 — 접두 [페이스] 를 단서로 소거.
  it('[페이스] 접두가 붙은 LLM 시드 줄을 제거하고 자필은 보존한다', () => {
    const intent = [
      '[페이스] 윤서문 추적이 중턱에 왔다 — 이번 화에서 한 발 조인다.',
      '[페이스] 이번 화는 숨 고르기다 — 한지욱과 갈등을 쌓는다.',
      '자필 메모: 강태준의 표정을 클로즈업.'
    ].join('\n');
    expect(stripConsumedSeeds(intent)).toBe('자필 메모: 강태준의 표정을 클로즈업.');
  });
});

describe('buildContractStatus (작품 헌장 화수 예산 — Phase A-4)', () => {
  function contract(overrides: Partial<StoryContract> = {}): StoryContract {
    return {
      lengthClass: 'long',
      plannedEpisodes: 30,
      endingStatement: '끝',
      protagonistCost: '대가',
      beatSheet: [],
      spineLocked: true,
      amendments: [],
      ...overrides
    };
  }

  it('헌장이 없으면 null', () => {
    const project = projectWith([ch(1)]);
    expect(buildContractStatus(project)).toBeNull();
  });

  it('위치와 잔여 화수를 chapters 마지막 회차에서 도출한다', () => {
    const project: StoryProject = {
      ...projectWith([ch(16), ch(17)]),
      storyContract: contract({ plannedEpisodes: 30 })
    };
    const status = buildContractStatus(project);
    expect(status?.position).toBe(17);
    expect(status?.remaining).toBe(13);
  });

  it('미회수 약속이 잔여 화수를 넘으면 overBudget', () => {
    // 28화까지 진행(잔여 2), 미회수 약속 3건 → 예산 초과
    const project: StoryProject = {
      ...projectWith([
        ch(28, {
          rewardArc: [
            { promise: 'p1', payoff: '' },
            { promise: 'p2', payoff: '' },
            { promise: 'p3', payoff: '' }
          ]
        })
      ]),
      storyContract: contract({ plannedEpisodes: 30 })
    };
    const status = buildContractStatus(project);
    expect(status?.remaining).toBe(2);
    expect(status?.unpaidCount).toBe(3);
    expect(status?.overBudget).toBe(true);
  });

  it('미회수 약속이 잔여 화수 이하면 overBudget 가 아니다', () => {
    const project: StoryProject = {
      ...projectWith([
        ch(20, { rewardArc: [{ promise: 'p1', payoff: '' }, { promise: 'p2', payoff: '' }] })
      ]),
      storyContract: contract({ plannedEpisodes: 30 })
    };
    const status = buildContractStatus(project);
    expect(status?.remaining).toBe(10);
    expect(status?.unpaidCount).toBe(2);
    expect(status?.overBudget).toBe(false);
  });

  it('잔여 화수가 전체의 25% 이하면 종반(finalStretch) — 신규 발급 금지 구간', () => {
    // 23/30 → 잔여 7 = 30*0.25=7.5 이하 → 종반
    const inFinal: StoryProject = { ...projectWith([ch(23)]), storyContract: contract({ plannedEpisodes: 30 }) };
    expect(buildContractStatus(inFinal)?.finalStretch).toBe(true);
    // 22/30 → 잔여 8 > 7.5 → 아직 아님
    const notYet: StoryProject = { ...projectWith([ch(22)]), storyContract: contract({ plannedEpisodes: 30 }) };
    expect(buildContractStatus(notYet)?.finalStretch).toBe(false);
  });

  it('척추 개정(applyContractAmendment)은 예산 상태 형태를 바꾸지 않는다 — 미러 무수정 보증', () => {
    const base: StoryProject = {
      ...projectWith([ch(16), ch(17)]),
      storyContract: contract({
        plannedEpisodes: 30,
        spine: { desire: '욕망', advance: '전진', obstacle: '시련', resolution: '변화' }
      })
    };
    const baseStatus = buildContractStatus(base);
    const amended: StoryProject = {
      ...base,
      storyContract: applyContractAmendment(base.storyContract!, {
        reason: '욕망 구체화',
        at: '2026-06-14T09:00:00.000Z',
        patch: { spine: { desire: '아버지의 이름을 되찾고 싶다' } }
      })
    };
    // 척추 텍스트가 바뀌어도 화수 예산은 그대로 → ContractStatusInput(미러) 형태 불변.
    expect(buildContractStatus(amended)).toEqual(baseStatus);
  });

  it('화수를 늘리는 개정은 plannedEpisodes·remaining 을 그만큼 키운다', () => {
    const base: StoryProject = {
      ...projectWith([ch(16), ch(17)]),
      storyContract: contract({ plannedEpisodes: 30 })
    };
    const amended: StoryProject = {
      ...base,
      storyContract: applyContractAmendment(base.storyContract!, {
        reason: '시즌 연장',
        at: '2026-06-14T09:00:00.000Z',
        patch: { plannedEpisodes: 36 }
      })
    };
    const status = buildContractStatus(amended);
    expect(status?.plannedEpisodes).toBe(36);
    expect(status?.remaining).toBe(19);
  });
});
