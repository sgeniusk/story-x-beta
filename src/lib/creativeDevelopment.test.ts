import { describe, expect, it } from 'vitest';
import { buildCreativeBlueprint } from './projectBlueprint';
import {
  createDefaultDevelopmentInput,
  developCreativeProject
} from './creativeDevelopment';

describe('creativeDevelopment', () => {
  it('turns novel inputs into a collaborative project package', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '망한 아이돌 연습생이 기억을 고치는 능력을 얻는다';
    input.storySeed = '첫 무대 전날, 모두가 잊은 데뷔곡을 혼자 기억한다';
    input.characterSeed = '주인공: 무대 공포증이 있지만 포기하지 않음';

    const result = developCreativeProject(blueprint, input);

    expect(result.title).toContain('기억');
    expect(result.logline).toContain('망한 아이돌 연습생');
    expect(result.agentReports.map((report) => report.agent)).toEqual([
      '소재 에이전트',
      '스토리 에이전트',
      '캐릭터 에이전트',
      '문체 큐레이터 에이전트',
      '연속성 에이전트'
    ]);
    expect(result.characters[0].name).toBe('주인공');
    expect(result.nextActions).toContain('시리즈 바이블 저장');
  });

  it('turns essay inputs into an interview-led personal story package', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'essay', format: 'personal-essay' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '퇴사 후 매일 아침 같은 카페에 앉아 있던 시간';
    input.storySeed = '그 시간에 내가 진짜로 피하고 있던 질문을 마주한다';
    input.characterSeed = '나: 일을 그만둔 뒤에도 쓸모를 증명하려는 사람 / 친구: 자꾸 괜찮냐고 묻는 사람';
    input.artDirection = '담담하지만 날카로운 문장, 은유는 생활감 있게, 과장된 감정 설명은 피한다';

    const result = developCreativeProject(blueprint, input);

    expect(result.premise).toContain('에세이 / 개인 에세이');
    expect(result.logline).toContain('나의 경험');
    expect(result.characters[0].name).toBe('나');
    expect(result.visualPlan).toContain('문체 샘플');
    expect(result.agentReports.map((report) => report.agent)).toEqual([
      '소재 에이전트',
      '인터뷰 에이전트',
      '주변 인물 에이전트',
      '문체 큐레이터 에이전트',
      '휴머나이저 에이전트',
      '연속성 에이전트'
    ]);
    expect(result.nextActions).toContain('추가 질문 리스트 작성');
  });

  it('turns audiobook inputs into an audio-video production package', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'audiobook', format: 'children-song-reading' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '잠들기 전 아이에게 읽어주는 달빛 기차 이야기';
    input.storySeed = '반복 후렴과 짧은 질문으로 아이가 따라 말하게 만든다';
    input.artDirection = '따뜻한 목소리, 느린 박자, 실로폰과 작은 코러스';
    input.characterSeed = '화자: 부드럽게 질문하는 보호자 / 아이: 따라 부르는 청자';

    const result = developCreativeProject(blueprint, input);

    expect(result.premise).toContain('오디오북 / 동요읽기');
    expect(result.visualPlan).toContain('음성 톤');
    expect(result.visualPlan).toContain('음악 큐');
    expect(result.agentReports.map((report) => report.agent)).toEqual([
      '소재 에이전트',
      '낭독 연출 에이전트',
      '사운드/음악 에이전트',
      '영상 콘티 에이전트',
      '연속성 에이전트'
    ]);
    expect(result.nextActions).toContain('낭독 스크립트 작성');
  });

  it('turns four-cut insta-toon inputs into a quadrant panel package', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'comics', format: 'four-cut-insta-toon' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '출근길 커피를 놓친 직장인의 작은 복수';
    input.storySeed = '엘리베이터에서 커피를 쏟고, 마지막 컷에서 사실 팀장 커피였음이 밝혀진다';
    input.artDirection = '플랫 미니멀, 두꺼운 검은 선, 파스텔 배경';

    const result = developCreativeProject(blueprint, input);

    expect(result.visualPlan).toContain('1:1 정사각형');
    expect(result.panelPlan.map((panel) => panel.position)).toEqual(['좌상', '우상', '좌하', '우하']);
    expect(result.panelPlan[3].purpose).toContain('반전');
    expect(result.nextActions).toContain('컷별 이미지 프롬프트 생성');
  });

  it('creates DaVinci image prompts with FLUX.2 structure for four-cut insta-toons', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'comics', format: 'four-cut-insta-toon' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '출근길 커피를 놓친 직장인의 작은 복수';
    input.storySeed = '엘리베이터에서 커피를 쏟고, 마지막 컷에서 사실 팀장 커피였음이 밝혀진다';
    input.artDirection = '플랫 미니멀, 두꺼운 검은 선, 파스텔 배경';
    input.characterSeed = '민서: 표정은 차분하지만 손에 든 물건으로 감정이 드러나는 직장인';

    const result = developCreativeProject(blueprint, input);

    expect(result.imagePromptPlan?.agentName).toBe('다빈치 이미지 에이전트');
    expect(result.imagePromptPlan?.principles).toContain('부정 프롬프트 없이 원하는 화면만 긍정형으로 기술');
    expect(result.imagePromptPlan?.frames).toHaveLength(4);
    expect(result.imagePromptPlan?.frames.map((frame) => frame.position)).toEqual(['좌상', '우상', '좌하', '우하']);
    expect(result.imagePromptPlan?.frames[0].structuredPrompt.aspect_ratio).toBe('1:1');
    expect(result.imagePromptPlan?.frames[0].structuredPrompt.subjects[0].description).toContain('민서');
    expect(result.imagePromptPlan?.frames[0].prompt).toContain('주체: 민서');
    expect(result.imagePromptPlan?.frames[0].prompt).toContain('스타일: 플랫 미니멀');
    expect(result.imagePromptPlan?.frames[0].prompt).toContain('말풍선');
  });

  it('adds tester-driven story contract, gates, refactor preview, and autopsy to every package', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'comics', format: 'insta-toon' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '오래된 우산을 빌려 쓰는 순간 비밀 편지가 보인다';
    input.storySeed = '마지막 장에서 우산 주인이 내일의 나였음이 드러난다';
    input.artDirection = '담담한 흑백선, 한 가지 파란 포인트 컬러';

    const result = developCreativeProject(blueprint, input);

    expect(result.storyContract.audiencePromise).toContain('오래된 우산');
    expect(result.storyContract.formatPromise).toContain('인스타툰');
    expect(result.workflowBoard.steps.map((step) => step.title)).toContain('Story Contract');
    expect(result.workflowBoard.steps.map((step) => step.title)).toContain('컷/스와이프 보드');
    expect(result.qualityGates.map((gate) => gate.id)).toEqual(['story', 'voice', 'continuity', 'visual', 'platform']);
    expect(result.refactorImpactPreview.impactedAreas).toContain('캐릭터 시각 참조');
    expect(result.outputAutopsy.newCanonCandidates.length).toBeGreaterThan(0);
    expect(result.outputAutopsy.userApprovalRequired).toBe(true);
    expect(result.referenceDnaCards[0].guardrail).toContain('표면 모방 금지');
  });

  // M4 청크 H 후속 — Layer 0·1·7 통합 검증.
  it('developCreativeProject 가 storyOntology · harnessReport · mediaProjections · continuityContract 를 통합 산출', () => {
    const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
    const input = createDefaultDevelopmentInput(blueprint);
    input.material = '기억을 고치는 필사관이 사라진 오빠를 찾는다';
    input.storySeed = '탑에 들어갈수록 자신의 이름이 사라진다';
    input.characterSeed = '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관';
    input.audience = '연재 미스터리 독자';
    input.constraints = '장편';

    const result = developCreativeProject(blueprint, input);

    // storyOntology — 작품 그래프 채워짐.
    expect(result.storyOntology?.premise.dramaticQuestion).toContain('찾');
    expect(result.storyOntology?.characters[0]?.desire).toBeTruthy();
    expect(result.storyOntology?.worldRules[0]?.cost).toBeTruthy();

    // harnessReport — 7단계 스테이지 + 점수 (premise-progress 추가 2026-06-09).
    expect(result.harnessReport?.stages.length).toBe(7);
    expect(result.harnessReport?.qualityScore).toBeGreaterThanOrEqual(70);
    expect(result.harnessReport?.readyForProduction).toBe(true);

    // mediaProjections — 기존 5 매체 순서를 보존하고 academic 을 끝에 추가.
    expect(result.mediaProjections?.length).toBe(6);
    expect(result.mediaProjections?.map((p) => p.target)).toEqual([
      'novel',
      'essay',
      'webtoon',
      'insta-toon',
      'four-cut',
      'academic'
    ]);

    // continuityContract — 빈 hardCanon 으로 시작.
    expect(result.continuityContract?.hardCanon).toEqual([]);
    expect(result.continuityContract?.livingState).toEqual([]);
    expect(result.continuityContract?.softSignals).toEqual([]);
  });
});
