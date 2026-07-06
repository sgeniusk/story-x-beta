// 검토 프롬프트가 전제(중심 질문) 진척을 점검하도록 지시하는지 — continuity≠payoff 보정.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAgentReviewPrompt, buildDraftPrompt, buildPaceInterviewPrompt, buildSpineSuggestionPrompt } from './promptBuilders';

describe('buildAgentReviewPrompt — 전제 진척 점검 지시 (continuity≠payoff 보정)', () => {
  it('연재 장편에서 중심 질문(전제)의 진척을 함께 보도록 지시한다', () => {
    // 라이브 테스트 발견 — 쇼러너가 21화 동안 전제 페이오프 정체를 묵인(연재 편향).
    // 검토 프롬프트가 "발견만 쌓고 약속이 제자리인지"를 점검하도록 강제해야 한다.
    const prompt = buildAgentReviewPrompt({
      agentId: 'showrunner',
      persona: '쇼러너 페르소나',
      target: '리아나는 또 한 겹의 단서를 발견했다.',
      medium: 'novel',
      context: '작품 약속 — 가문을 살리고 운명을 바꾼다.'
    });
    expect(prompt).toContain('중심 질문');
    expect(prompt).toContain('진척');
  });
});

describe('buildDraftPrompt — 약속↔회수 산출 요청 (아크 페이오프 1단계)', () => {
  it('연재 회차에 rewardArc/stakesLedger 산출을 요청한다', () => {
    const p = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '' });
    expect(p).toContain('rewardArc');
    expect(p).toContain('stakesLedger');
    expect(p).toContain('deferred');
  });

  // P12(#3 ch5 캐논 충돌) — LLM 이 기확정 캐논을 새 promise 로 재발급하지 않게 규칙을 박는다.
  // storyx.mjs CLI 프롬프트는 byte-identical 미러 — 문구 변경 시 양쪽 동시 갱신.
  const P12_RULE = '- rewardArc 의 promise 는 작품 맥락에 이미 확정된 사실을 재발급하지 않습니다 — 이미 일어난 일은 새 약속이 될 수 없습니다.';

  it('[P12] 연재 초안 프롬프트에 기확정 사실 재발급 금지 규칙을 넣는다', () => {
    const p = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '' });
    expect(p).toContain(P12_RULE);
  });

  it('[P12] storyx.mjs CLI 프롬프트가 같은 규칙을 byte-identical 로 미러한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(P12_RULE);
  });

  it('정체 상태(payoffStatus.isStalled)면 연재 초안 프롬프트에 회수 의무를 주입한다', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x', title: 't', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 }
    });
    expect(p).toContain('전제 진척 정체');
    expect(p).toContain('3회차 연속');
    expect(p).toContain('열린 약속 4개');
    expect(p).toContain('최소 하나를');
  });

  it('정체가 아니거나 payoffStatus 가 없으면 회수 의무를 넣지 않는다', () => {
    const calm = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: false, deferredStreak: 1, openPromises: 2 }
    });
    const absent = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x' });
    expect(calm).not.toContain('전제 진척 정체');
    expect(absent).not.toContain('전제 진척 정체');
  });

  it('단독 완결형은 정체여도 회수 의무를 넣지 않는다 (연재 전용)', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'short-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 5, openPromises: 9 }
    });
    expect(p).not.toContain('전제 진척 정체');
  });
});

describe('buildAgentReviewPrompt — 정체 측정 evidence 주입 (아크 페이오프 1단계 Task6)', () => {
  it('정체 상태(payoffStatus.isStalled=true)면 측정값을 evidence 로 주입한다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: '', target: '본문', medium: 'novel', context: '',
      payoffStatus: { isStalled: true, deferredStreak: 4, openPromises: 5 }
    });
    expect(p).toContain('stakes_progression_audit');
    expect(p).toContain('4');
    expect(p).toContain('정체');
  });

  it('isStalled=false 면 측정 줄을 넣지 않는다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: '', target: 'n', medium: 'novel', context: '',
      payoffStatus: { isStalled: false, deferredStreak: 1, openPromises: 2 }
    });
    expect(p).not.toContain('stakes_progression_audit');
  });

  it('payoffStatus 없으면 측정 줄을 넣지 않는다(하위호환)', () => {
    const p = buildAgentReviewPrompt({ agentId: 'showrunner', persona: '', target: 't', medium: 'novel', context: '' });
    expect(p).not.toContain('stakes_progression_audit');
  });
});

// 흡인력 게이트 조기 소진 신호 — storyx.mjs 미러 byte-identical(문구 변경 시 양쪽 동시 갱신).
describe('buildAgentReviewPrompt — 흡인력 조기 소진 신호 (2026-07-06 흡인력 게이트)', () => {
  const TENSION_DRAIN_PIN = '- [측정] 긴장 조기 소진 신호 — 열린 약속 0개인데 잔여 ';
  const base = { persona: '', target: '본문', medium: 'novel', context: '' };
  const drained = { isStalled: false, deferredStreak: 0, openPromises: 0, paidPromises: 3 };
  const midContract = { remaining: 12, unpaidCount: 0, overBudget: false, finalStretch: false };

  it('critic-reviewer + 전부 회수 + 종반 아님이면 조기 소진 신호를 주입한다', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'critic-reviewer', payoffStatus: drained, contractStatus: midContract });
    expect(p).toContain(TENSION_DRAIN_PIN);
    expect(p).toContain('tension_decay_audit');
    expect(p).toContain('12회차');
  });

  it('열린 약속이 남아 있으면 미주입', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, openPromises: 2 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('정체(isStalled)면 미주입 — 정체 신호와 배타', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, isStalled: true, deferredStreak: 3 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('paidPromises 0(rewardArc 미사용·미측정 작품)이면 미주입 — 오탐 가드', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: { ...drained, paidPromises: 0 }, contractStatus: midContract
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('종반(finalStretch)이면 미주입 — 회수 국면은 소진이 정상', () => {
    const p = buildAgentReviewPrompt({
      ...base, agentId: 'critic-reviewer',
      payoffStatus: drained, contractStatus: { ...midContract, remaining: 3, finalStretch: true }
    });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('contractStatus 없으면 미주입(헌장 없는 작품)', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'critic-reviewer', payoffStatus: drained });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('같은 조건이라도 타 에이전트(showrunner)엔 미주입', () => {
    const p = buildAgentReviewPrompt({ ...base, agentId: 'showrunner', payoffStatus: drained, contractStatus: midContract });
    expect(p).not.toContain(TENSION_DRAIN_PIN);
  });

  it('[mirror] storyx.mjs 가 조기 소진 문구를 byte-identical 로 포함한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(TENSION_DRAIN_PIN);
  });
});

// ─── buildPaceInterviewPrompt — 페이스 인터뷰 프롬프트 (2026-06-11 신설) ───────
// storyx.mjs 미러와 핵심 지시문 byte-identical 유지.

const PACE_CANON_RULE = '이미 일어난 일은 새 약속이 될 수 없습니다';
const PACE_JSON_CONTRACT = '"questions": [{ "question":';

describe('buildPaceInterviewPrompt — 수치·약속·stake 주입', () => {
  it('deferredStreak·openPromises 수치가 프롬프트에 포함된다', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'long-novel',
      payoffStatus: { isStalled: true, deferredStreak: 5, openPromises: 7 },
      unpaidPromises: [],
      deferredStakes: [],
      context: ''
    });
    expect(p).toContain('5');
    expect(p).toContain('7');
  });

  it('unpaidPromises 목록이 프롬프트에 포함된다', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'long-novel',
      payoffStatus: { isStalled: false, deferredStreak: 0, openPromises: 0 },
      unpaidPromises: ['윤서문 체포 여부', '한지욱 합류 결정'],
      deferredStakes: [],
      context: ''
    });
    expect(p).toContain('윤서문 체포 여부');
    expect(p).toContain('한지욱 합류 결정');
  });

  it('deferredStakes 목록이 프롬프트에 포함된다', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'long-novel',
      payoffStatus: { isStalled: false, deferredStreak: 0, openPromises: 0 },
      unpaidPromises: [],
      deferredStakes: ['가문의 비밀', '태준의 배신'],
      context: ''
    });
    expect(p).toContain('가문의 비밀');
    expect(p).toContain('태준의 배신');
  });
});

describe('buildPaceInterviewPrompt — P12 규칙·JSON 계약·연재 한정', () => {
  it('P12 기확정 캐논 재발급 금지 규칙 줄이 존재한다', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'long-novel',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 },
      unpaidPromises: [],
      deferredStakes: [],
      context: ''
    });
    expect(p).toContain(PACE_CANON_RULE);
  });

  it('JSON 출력 계약 문자열이 존재한다', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'long-novel',
      payoffStatus: { isStalled: false, deferredStreak: 0, openPromises: 0 },
      unpaidPromises: [],
      deferredStakes: [],
      context: ''
    });
    expect(p).toContain(PACE_JSON_CONTRACT);
  });

  it('단독 완결형(short-novel)이면 빈 문자열을 반환한다 (CLI 가드 — 호출부가 빈 questions 처리)', () => {
    const p = buildPaceInterviewPrompt({
      medium: 'novel',
      format: 'short-novel',
      payoffStatus: { isStalled: true, deferredStreak: 5, openPromises: 9 },
      unpaidPromises: [],
      deferredStakes: [],
      context: ''
    });
    expect(p).toBe('');
  });
});

describe('buildPaceInterviewPrompt — storyx.mjs 미러 동기화', () => {
  it('[pace-mirror] storyx.mjs 가 P12 캐논 재발급 금지 규칙을 byte-identical 로 포함한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(PACE_CANON_RULE);
  });

  it('[pace-mirror] storyx.mjs 가 JSON 출력 계약 문자열을 포함한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(PACE_JSON_CONTRACT);
  });
});

// 쇼러너 4줄 척추 제안 — Phase A-3b. charter 단계에서 자유 서술·결말을 읽고 4줄을 제안한다.
// storyx.mjs 미러 byte-identical — 핵심 JSON 계약·4줄 정의 문구는 양쪽 동시 갱신.
describe('buildSpineSuggestionPrompt — 4줄 척추 제안 (Phase A-3b)', () => {
  const SPINE_JSON_CONTRACT = '  "spine": { "desire": "...", "advance": "...", "obstacle": "...", "resolution": "..." }';
  const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');

  it('자유 서술·결말·대가를 담고 4줄 정의와 JSON 계약을 출력한다', () => {
    const p = buildSpineSuggestionPrompt({
      medium: 'novel',
      format: 'long-novel',
      freewrite: '잃어버린 이름을 찾는 소녀가 달의 탑으로 들어가는 이야기',
      endingStatement: '소녀가 잃어버린 이름을 끝내 받아들인다',
      protagonistCost: '평범했던 일상'
    });
    expect(p).toContain('잃어버린 이름을 찾는 소녀');
    expect(p).toContain('소녀가 잃어버린 이름을 끝내 받아들인다');
    expect(p).toContain('평범했던 일상');
    // 4줄 정의(욕망·전진·시련·변화)를 프롬프트에 박는다.
    expect(p).toContain('욕망');
    expect(p).toContain('전진');
    expect(p).toContain('시련');
    expect(p).toContain('변화');
    expect(p).toContain(SPINE_JSON_CONTRACT);
  });

  it('결말·대가가 비어도 미정 표기로 프롬프트를 만든다', () => {
    const p = buildSpineSuggestionPrompt({ medium: 'novel', format: 'long-novel', freewrite: '아무 이야기' });
    expect(p).toContain('아무 이야기');
    expect(p.length).toBeGreaterThan(0);
  });

  it('[spine-mirror] storyx.mjs 가 JSON 출력 계약을 byte-identical 로 미러한다', () => {
    expect(cli).toContain(SPINE_JSON_CONTRACT);
  });
});

// 작품 헌장 프롬프트 주입 — Phase A-4. 연재(serial) + contractStatus 일 때만.
// storyx.mjs 미러 byte-identical — 정적 핵심 문구는 양쪽 동시 갱신.
describe('buildDraftPrompt — 작품 헌장 예산·척추 규칙 (Phase A-4)', () => {
  const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
  const OVERBUDGET = '[헌장] 약속 예산 초과';
  const FINALSTRETCH = '[헌장] 종반 구간';
  const SPINE = '4줄 척추의 어느 줄';

  it('overBudget 면 연재 초안에 예산 초과 회수 규칙을 넣는다', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      contractStatus: { remaining: 2, unpaidCount: 5, overBudget: true, finalStretch: false }
    });
    expect(p).toContain(OVERBUDGET);
    expect(p).toContain('가장 오래된 약속');
  });

  it('finalStretch 면 종반 규칙을 넣되 새 큰 떡밥만 금지한다(작은 인물·소품 허용)', () => {
    const p = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      contractStatus: { remaining: 6, unpaidCount: 2, overBudget: false, finalStretch: true }
    });
    expect(p).toContain(FINALSTRETCH);
    expect(p).toContain('새 큰 떡밥');
  });

  it('척추 환기는 정체(isStalled)나 예산 초과일 때만 넣는다', () => {
    const stalled = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      payoffStatus: { isStalled: true, deferredStreak: 3, openPromises: 4 },
      contractStatus: { remaining: 10, unpaidCount: 1, overBudget: false, finalStretch: false }
    });
    expect(stalled).toContain(SPINE);

    const over = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      contractStatus: { remaining: 1, unpaidCount: 3, overBudget: true, finalStretch: false }
    });
    expect(over).toContain(SPINE);

    const calm = buildDraftPrompt({
      medium: 'novel', format: 'long-novel', freewrite: 'x',
      contractStatus: { remaining: 10, unpaidCount: 1, overBudget: false, finalStretch: false }
    });
    expect(calm).not.toContain(SPINE);
  });

  it('에세이·단편 standalone 에는 헌장 규칙을 넣지 않는다 (A-4 범위 — 연재만)', () => {
    const essay = buildDraftPrompt({
      medium: 'essay', format: 'essay-series', freewrite: 'x',
      contractStatus: { remaining: 2, unpaidCount: 5, overBudget: true, finalStretch: true }
    });
    expect(essay).not.toContain(OVERBUDGET);
    const standalone = buildDraftPrompt({
      medium: 'novel', format: 'short-story', freewrite: 'x',
      contractStatus: { remaining: 2, unpaidCount: 5, overBudget: true, finalStretch: true }
    });
    expect(standalone).not.toContain(OVERBUDGET);
  });

  it('contractStatus 가 없으면 헌장 규칙을 넣지 않는다(하위호환)', () => {
    const p = buildDraftPrompt({ medium: 'novel', format: 'long-novel', freewrite: 'x' });
    expect(p).not.toContain(OVERBUDGET);
    expect(p).not.toContain(FINALSTRETCH);
  });

  it('storyx.mjs CLI 가 같은 헌장 규칙 문구를 byte-identical 로 미러한다', () => {
    expect(cli).toContain(OVERBUDGET);
    expect(cli).toContain(FINALSTRETCH);
    expect(cli).toContain(SPINE);
    expect(cli).toContain('가장 오래된 약속');
    expect(cli).toContain('새 큰 떡밥');
  });
});

describe('buildAgentReviewPrompt — 작품 헌장 길 잃음 점검 (Phase A-4)', () => {
  const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
  const LOST = '[헌장] 길 잃음 점검';

  it('contractStatus 가 있으면 길 잃음 점검 지시를 넣는다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: 'p', target: '원고', medium: 'novel', context: '',
      contractStatus: { remaining: 10, unpaidCount: 2, overBudget: false, finalStretch: false }
    });
    expect(p).toContain(LOST);
  });

  it('overBudget 면 새 약속 발급 시 revise/block 지시를 추가한다', () => {
    const p = buildAgentReviewPrompt({
      agentId: 'showrunner', persona: 'p', target: '원고', medium: 'novel', context: '',
      contractStatus: { remaining: 1, unpaidCount: 4, overBudget: true, finalStretch: false }
    });
    expect(p).toContain('약속 예산 초과');
    expect(p).toContain('revise');
  });

  it('contractStatus 가 없으면 길 잃음 점검을 넣지 않는다(하위호환)', () => {
    const p = buildAgentReviewPrompt({ agentId: 'showrunner', persona: 'p', target: '원고', medium: 'novel', context: '' });
    expect(p).not.toContain(LOST);
  });

  it('storyx.mjs CLI 가 같은 길 잃음 점검 문구를 미러한다', () => {
    expect(cli).toContain(LOST);
  });
});

// VS 전개 후보(Verbalized Sampling) 프롬프트 — Phase C-1. 방향 4개 + 확률 분포.
// storyx.mjs 미러 byte-identical — JSON 계약 문자열은 양쪽 동시 갱신.
import { buildVsCandidatesPrompt } from './promptBuilders';

describe('buildVsCandidatesPrompt — VS 전개 후보 (Phase C-1)', () => {
  const VS_JSON_CONTRACT = '  "candidates": [{ "direction": "...", "probability": 0.0 }]';
  it('방향 4개·꼬리 분포·결말 불가침·JSON 계약을 담는다', () => {
    const p = buildVsCandidatesPrompt({
      medium: 'novel', format: 'long-novel',
      contractDigest: '결말: X', recentSummary: '1화 흐름', unpaidPromises: ['약속A']
    });
    expect(p).toContain('방향 4개');
    expect(p).toContain('파격');
    expect(p).toContain('결말 헌장은 절대 배신하지 않습니다');
    expect(p).toContain('약속A');
    expect(p).toContain(VS_JSON_CONTRACT);
  });
  it('[vs-mirror] storyx.mjs 가 JSON 출력 계약을 byte-identical 로 미러한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(VS_JSON_CONTRACT);
  });
});
