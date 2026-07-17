// 검토 프롬프트가 전제(중심 질문) 진척을 점검하도록 지시하는지 — continuity≠payoff 보정.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAgentReviewPrompt, buildDiveCondensePrompt, buildDraftPrompt, buildPaceInterviewPrompt, buildSpineSuggestionPrompt } from './promptBuilders';

const DIVE_CONDENSE_QUALITY_RULES = [
  '- 본문은 한국어 기준 1,800~2,700자로 씁니다. 재료가 부족하면 설정을 발명하거나 같은 내용을 반복해 분량을 억지로 채우지 말고, 짧더라도 주어진 사실 범위를 지킵니다.',
  '- 서로 다른 압력을 가진 현재 장면 2~3개로 재구성합니다. 사건 보고나 줄거리 요약으로 대신하지 않습니다.',
  '- 원문에 인물 간 대화가 있으면 서로 원하는 것이 부딪히는 직접 대화 교환을 최소 1회 장면 안에 넣습니다. 원문에 없는 핵심 사실을 대사로 발명하지 않습니다.',
  '- 각 장면은 압력을 높이거나, 선택지를 줄이거나, 실제 대가를 발생시켜야 합니다.',
  '- 같은 장면 안에서 모두가 합리적으로 합의해 갈등을 봉합하지 않습니다.',
  '- 이번 회차는 열린 질문 하나에 답하고, 그 답 때문에 더 날카로운 다음 질문을 엽니다.',
  '- 마지막 2~3문장은 구체적인 반전·위협·기한·강제된 선택 중 하나로 끝냅니다. 주제나 교훈을 요약하며 닫지 않습니다.',
  '- 테스트·QA·복구·UI 안내·스키마·타임스탬프처럼 작품 밖 메타 표식은, 사용자가 작품 내부 고유명사라고 명시하지 않은 한 title·hook·outline·beats·prose·newCanonFacts 어디에도 넣지 않습니다.',
  '- newCanonFacts에는 원문·현재 장면·기존 캐논에 명시된 사실과 장면 성립에 꼭 필요한 최소 추론만 넣습니다. 근거 없는 새 이름·기관·범행 원인·시간·관계는 확정하지 않습니다.',
  '- 초안을 장면화한 뒤, 기존 기억의 "한국어 문체·보이스 규칙"을 마지막 문장 패스로 적용합니다. 사건·사실은 바꾸지 않고 문장 리듬·어휘·말투를 그 규칙에 맞춥니다.'
] as const;

const DIVE_CONDENSE_VOICE_REVIEW_RULES = [
  '- "한국어 문체·보이스 규칙"을 최종 검수 체크리스트로 사용합니다. 물리적 신호로 드러낸 감정을 바로 뒤에서 감정 이름으로 재설명하지 않고, 규칙에 적힌 금지어를 최종 원고에 남기지 않습니다.',
  '- 인물별 호칭·높임말·말끝은 원문과 캐릭터 카드의 근거를 따릅니다. 근거 없이 반말과 존댓말을 오가거나 호칭을 바꾸지 않습니다.',
  '- 장면 연결과 말미에서는 질문·선택을 기능적으로 해설하거나 요약하지 말고, 사물·행동·대사로 압력을 보여줍니다. 인과를 설명한 뒤 내리는 결정은 구체 동사의 독립 단문으로 둡니다.'
] as const;

const DIVE_CONDENSE_LENGTH_SELF_CHECK =
  '- 완료 전에 prose 글자 수를 직접 확인합니다. 1,800자 미만이면 새 설정·기능적 해설·같은 내용 반복으로 채우지 말고, 입력에 이미 있는 장면의 행동·감각·갈등 대사를 더 구체화합니다. 입력 재료가 실제로 부족할 때만 사실 범위를 지키기 위해 1,800자 미만을 허용합니다.';

const DIVE_CONDENSE_LENGTH_SAFETY_MARGIN =
  '- 최종 허용 범위는 1,800~2,700자로 유지하되, 모델의 글자 수 계산 편차를 고려해 생성 목표는 1,900~2,600자로 둡니다. 하한과 상한 모두에 안전 여유를 남깁니다.';

const DIVE_CONDENSE_ANTI_EXPOSITION_RULES = [
  '- 캐릭터 카드의 욕망·말투·우선순위를 서술자가 요약·평가하거나 이행 보고처럼 재진술하지 않습니다. 독자가 행동과 대사에서만 알아차리게 합니다.',
  '- 말투 규칙은 캐릭터의 실제 대사 배열에만 적용합니다. 대사 앞뒤에 문장 길이·말끝·호칭의 변화를 해설하는 문장을 추가하지 않습니다.',
  '- prose에서 장면 기능을 "질문"·"문제"·"선택"·"답"이라고 명명하지 않고, 이미 드러난 양자택일을 다시 비교 설명하지 않습니다. 딜레마가 드러나면 즉시 행동으로 넘어갑니다.',
  '- 마지막 2~3문장은 각 문장마다 하나의 구체 행동·감각·시한만 담은 독립문으로 둡니다. 행동 직전에 의미·동기·선택을 해설하지 않습니다.'
] as const;

const DIVE_CONDENSE_LEGACY_CONFLICTS = [
  '3인칭 서사 회차로 압축',
  '대사를 그대로 옮기지 말고',
  '인과로 봉합'
] as const;

describe('buildDiveCondensePrompt — PLAY 응결 장면화·보이스 품질 계약', () => {
  const input = {
    character: '한서윤 — 선배. 욕망: 진실. 상처: 배신. 현재 상태: 옥상 앞. 말투: 짧게 말한다. 캐논 앵커: 비를 싫어한다.',
    scene: '비 오는 회사 옥상 문 앞',
    context: '## 한국어 문체·보이스 규칙\n- 리듬: 짧고 긴 문장을 교차한다.',
    transcript: '나: 문을 열 거예요.\n한서윤: 열면 돌아갈 수 없어.',
    arc: '{"dramaticQuestion":"문을 열 것인가","tension":72,"nextBeat":"경보"}'
  };

  it('입력의 다섯 섹션과 기존 JSON 출력 계약을 보존한다', () => {
    const prompt = buildDiveCondensePrompt(input);

    expect(prompt).toContain(input.character);
    expect(prompt).toContain(input.scene);
    expect(prompt).toContain(input.context);
    expect(prompt).toContain(input.transcript);
    expect(prompt).toContain(input.arc);
    for (const fieldContract of [
      '"title": "이 회차 제목"',
      '"hook": "다음을 부르는 한 줄"',
      '"outline": ["장면 비트 1", "비트 2"]',
      '"beats": [{ "label": "구성 단위", "summary": "한 문장", "tension": 0 }]',
      '"prose": "3인칭 본문"',
      '"newCanonFacts": [{ "owner": "character|world|plot", "statement": "이 회차에서 확정된 새 사실(약속·사건·관계 변화)" }]'
    ]) expect(prompt).toContain(fieldContract);
  });

  it('장면화·직접 갈등 대사 계약과 상충하는 구형 응결 문구를 제거한다', () => {
    const prompt = buildDiveCondensePrompt(input);
    for (const legacy of DIVE_CONDENSE_LEGACY_CONFLICTS) expect(prompt).not.toContain(legacy);
  });

  it('분량·장면·대화·압력·후크·메타·캐논·보이스 계약을 모두 포함한다', () => {
    const prompt = buildDiveCondensePrompt(input);
    for (const rule of DIVE_CONDENSE_QUALITY_RULES) expect(prompt).toContain(rule);
  });

  it('보이스 최종 검수에서 감정 재설명·금지어·호칭 흔들림·기능적 해설을 제거한다', () => {
    const prompt = buildDiveCondensePrompt(input);
    for (const rule of DIVE_CONDENSE_VOICE_REVIEW_RULES) expect(prompt).toContain(rule);
  });

  it('완료 전에 prose 하한을 self-check하고 기존 장면 재료로만 구체화한다', () => {
    expect(buildDiveCondensePrompt(input)).toContain(DIVE_CONDENSE_LENGTH_SELF_CHECK);
  });

  it('최종 허용 범위 안에서 생성 목표에 하한·상한 안전 여유를 둔다', () => {
    expect(buildDiveCondensePrompt(input)).toContain(DIVE_CONDENSE_LENGTH_SAFETY_MARGIN);
  });

  it('캐릭터 카드와 장면 기능을 해설하지 않고 딜레마·말미를 즉시 구체 행동으로 전환한다', () => {
    const prompt = buildDiveCondensePrompt(input);
    for (const rule of DIVE_CONDENSE_ANTI_EXPOSITION_RULES) expect(prompt).toContain(rule);
  });

  it('비어 있는 장면·아크·캐릭터·기존 기억에는 명시적 fallback을 쓴다', () => {
    const prompt = buildDiveCondensePrompt({ character: '', scene: '', context: '', transcript: '', arc: '' });
    expect(prompt).toContain('(장면 미설정)');
    expect(prompt).toContain('(없음)');
    expect(prompt).toContain('(미정)');
    expect(prompt).toContain('(아직 없음)');
  });
});

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
  const VS_JSON_CONTRACT =
    '  "candidates": [{ "direction": "...", "probability": 0.0, "tension": "arms", "tensionNote": "..." }]';
  const VS_TENSION_INSTRUCTION =
    '- 각 방향의 "tension"을 판정합니다 — 새 질문·위험·갈등을 장전하면 "arms", 열린 질문·약속을 닫기만 하면 "drains". "tensionNote"에는 그 판정의 근거를 한 문장으로 씁니다.';
  it('방향 4개·꼬리 분포·결말 불가침·JSON 계약을 담는다', () => {
    const p = buildVsCandidatesPrompt({
      medium: 'novel', format: 'long-novel',
      contractDigest: '결말: X', recentSummary: '1화 흐름', unpaidPromises: ['약속A']
    });
    expect(p).toContain('방향 4개');
    expect(p).toContain('파격');
    expect(p).toContain('결말 헌장은 절대 배신하지 않습니다');
    expect(p).toContain('약속A');
    expect(p).toContain(VS_TENSION_INSTRUCTION);
    expect(p).toContain(VS_JSON_CONTRACT);
  });
  it('[vs-mirror] storyx.mjs 가 JSON 출력 계약을 byte-identical 로 미러한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(VS_JSON_CONTRACT);
    expect(cli).toContain(VS_TENSION_INSTRUCTION);
  });
});

// PLAN 설계 대화 프롬프트 — 설계실 2단계. storyx.mjs 미러 byte-identical — 계약·지시문 전문 양쪽 동시 갱신.
import { buildPlanChatPrompt } from './promptBuilders';

describe('buildPlanChatPrompt — PLAN 설계 대화 (설계실 2단계)', () => {
  const PLAN_CHAT_JSON_CONTRACT =
    '  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]';
  const PLAN_CHAT_ID_INSTRUCTION =
    '- 제안은 엔티티 카탈로그의 실존 id 만 겨냥합니다. kind 별 필드 — character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone · world/canon: 필드 없음.';
  it('역할·카탈로그·제안 상한·헌장 불가침·JSON 계약을 담는다', () => {
    const p = buildPlanChatPrompt({
      medium: 'novel', format: 'long-novel', activeSection: 'characters',
      contextDigest: '계약 요약', catalog: '- id=c1 리아나', dialogue: '작가: 안녕', query: '욕망을 다듬자'
    });
    expect(p).toContain('설계 파트너');
    expect(p).toContain('- id=c1 리아나');
    expect(p).toContain('proposals 는 0~3개');
    expect(p).toContain('결말 헌장은 절대 배신하지 않습니다');
    expect(p).toContain(PLAN_CHAT_ID_INSTRUCTION);
    expect(p).toContain(PLAN_CHAT_JSON_CONTRACT);
  });
  it('[plan-mirror] storyx.mjs 가 JSON 계약·id 지시문을 byte-identical 로 미러한다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(PLAN_CHAT_JSON_CONTRACT);
    expect(cli).toContain(PLAN_CHAT_ID_INSTRUCTION);
  });
});

// 온보딩 구상 대화(함께 구상) 프롬프트 — S2. storyx.mjs 미러 byte-identical — 계약·지시문 전문 양쪽 동시 갱신.
import { buildOnboardChatPrompt } from './promptBuilders';
import type { CreativeFormat } from '../projectBlueprint';

describe('buildOnboardChatPrompt', () => {
  const ONBOARD_CHAT_JSON_CONTRACT =
    '  "reply": "...", "setup": { "scene": "...", "cast": [{ "name": "...", "role": "...", "desire": "...", "wound": "...", "voiceRules": ["..."] }], "myRole": "..." }';
  const ONBOARD_CHAT_RIPENESS_INSTRUCTION =
    '- setup 은 소재가 무르익었을 때만 포함합니다 — 상대 인물, 첫 장면, 작가가 연기할 역할이 대화에서 잡혔을 때. 아직이면 setup 필드를 넣지 않습니다.';
  const ONBOARD_CHAT_CONDENSE_INSTRUCTION =
    '- 작가가 이 소재로 시작하기로 했습니다. 이번 턴에는 reply 를 한 문장으로 짧게 하고, 지금까지 나온 재료를 응결한 setup 을 반드시 포함합니다.';

  const baseInput = {
    medium: 'novel',
    format: 'long-novel' as CreativeFormat,
    freewrite: '심야에만 여는 세탁소',
    dialogue: '작가: 세탁소 얘기',
    query: '노인이 주인이면 어때?',
    condense: false
  };

  it('구상 파트너 역할·시드 섹션·응결 조건·JSON 계약을 담는다', () => {
    const prompt = buildOnboardChatPrompt(baseInput);
    expect(prompt).toContain('구상 파트너');
    expect(prompt).toContain('아직 작품이 없습니다');
    expect(prompt).toContain('## 먼저 적어둔 자유 서술');
    expect(prompt).toContain('심야에만 여는 세탁소');
    expect(prompt).toContain(ONBOARD_CHAT_RIPENESS_INSTRUCTION);
    expect(prompt).toContain('myRole 에만');
    expect(prompt).toContain(ONBOARD_CHAT_JSON_CONTRACT);
    expect(prompt).not.toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });

  it('condense=true 면 강제 응결 지시가 삽입된다', () => {
    const prompt = buildOnboardChatPrompt({ ...baseInput, condense: true });
    expect(prompt).toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });

  it('[onboard-mirror] storyx.mjs 미러가 계약·응결 조건·condense 지시와 byte-identical 이다', () => {
    const cli = readFileSync(resolve(__dirname, '../../../tools/storyx.mjs'), 'utf8');
    expect(cli).toContain(ONBOARD_CHAT_JSON_CONTRACT);
    expect(cli).toContain(ONBOARD_CHAT_RIPENESS_INSTRUCTION);
    expect(cli).toContain(ONBOARD_CHAT_CONDENSE_INSTRUCTION);
  });
});
