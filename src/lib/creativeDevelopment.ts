import type { CreativeBlueprint } from './projectBlueprint';
import {
  buildReferenceDnaCards,
  buildTesterDrivenWorkflow,
  type QualityGateId,
  type ReferenceDnaCard,
  type TesterDrivenWorkflow
} from './evaluationSynthesis';

export interface CreativeDevelopmentInput {
  material: string;
  storySeed: string;
  artDirection: string;
  characterSeed: string;
  audience: string;
  constraints: string;
}

export interface DevelopmentAgentReport {
  agent: string;
  decision: string;
  output: string;
}

export interface DevelopedCharacter {
  name: string;
  role: string;
  desire: string;
  contradiction: string;
  visualCue: string;
}

export interface PanelPlan {
  position: string;
  purpose: string;
  scene: string;
  bubble: string;
}

export interface ImagePromptSubject {
  description: string;
  position: string;
  action: string;
}

export interface StructuredImagePrompt {
  scene: string;
  subjects: ImagePromptSubject[];
  style: string;
  context: string;
  composition: string;
  lighting: string;
  mood: string;
  text: string;
  color_guidance: string[];
  aspect_ratio: '1:1' | '4:3' | '9:16';
}

export interface ImagePromptFrame {
  position: string;
  purpose: string;
  prompt: string;
  structuredPrompt: StructuredImagePrompt;
  continuityAnchors: string[];
}

export interface ImagePromptPlan {
  agentName: '다빈치 이미지 에이전트';
  modelFamily: 'FLUX.2';
  principles: string[];
  frames: ImagePromptFrame[];
}

export interface StoryContract {
  audiencePromise: string;
  protagonistDesire: string;
  woundOrCost: string;
  forbiddenCliches: string[];
  genreExpectation: string;
  formatPromise: string;
  continuityGuardrails: string[];
}

export interface QualityGateResult {
  id: QualityGateId;
  label: string;
  status: 'ready' | 'needs-review';
  priority: string;
  checks: string[];
}

export interface RefactorImpactPreview {
  trigger: string;
  impactedAreas: string[];
  options: ['전체 적용', '일부 적용', '충돌로 보류'];
}

export interface OutputAutopsy {
  newCanonCandidates: string[];
  possibleDamage: string[];
  memoryUpdates: string[];
  userApprovalRequired: boolean;
}

export interface CreativeDevelopmentPackage {
  title: string;
  logline: string;
  premise: string;
  storyContract: StoryContract;
  workflowBoard: TesterDrivenWorkflow;
  qualityGates: QualityGateResult[];
  refactorImpactPreview: RefactorImpactPreview;
  referenceDnaCards: ReferenceDnaCard[];
  outputAutopsy: OutputAutopsy;
  storyArc: string[];
  characters: DevelopedCharacter[];
  visualPlan: string;
  panelPlan: PanelPlan[];
  imagePromptPlan?: ImagePromptPlan;
  agentReports: DevelopmentAgentReport[];
  nextActions: string[];
}

const defaultMaterial = '평범한 인물이 이상한 규칙을 발견하고 삶의 방향이 바뀐다';
const defaultStory = '작은 사건 하나가 숨겨진 세계의 문을 열고, 마지막 장면에서 대가가 드러난다';
const defaultCharacter = '주인공: 겁이 많지만 끝까지 확인해야 직성이 풀리는 사람';

export function createDefaultDevelopmentInput(blueprint: CreativeBlueprint): CreativeDevelopmentInput {
  const isVisual = blueprint.nextWorkspace === 'visual-storyboard-studio';
  const isEssay = blueprint.medium === 'essay';
  const isAudio = blueprint.medium === 'audiobook';

  return {
    material: isVisual
      ? '일상 속 작은 오해가 네 컷 또는 짧은 컷 만화로 반전된다'
      : isEssay
        ? '내가 오래 피했던 기억이나 관계를 다시 바라본다'
        : isAudio
          ? '듣는 사람이 한 번에 따라올 수 있는 짧은 이야기나 설명'
        : defaultMaterial,
    storySeed: isVisual
      ? '첫 컷은 공감 상황, 마지막 컷은 예상 밖의 표정이나 한 문장 반전'
      : isEssay
        ? 'AI가 계속 질문하며 그때의 사실, 감정, 지금의 해석을 분리한다'
        : isAudio
          ? '도입에서 귀를 붙잡고, 반복되는 리듬과 마지막 요약으로 기억에 남긴다'
        : defaultStory,
    artDirection: isVisual
      ? '플랫 미니멀, 두꺼운 선, 제한된 색상, 표정이 크게 읽히는 스타일'
      : isEssay
        ? '담담하지만 선명하게, 생활감 있는 은유를 쓰고, 과장된 감정 설명은 피한다'
        : isAudio
          ? '따뜻한 목소리, 명확한 발음, 과하지 않은 음악, 자막은 짧고 읽기 쉽게'
      : '문장은 선명하게, 장면은 감각적으로, 감정은 행동으로 보여준다',
    characterSeed: isEssay
      ? '나: 이 경험을 겪은 사람 / 주변 인물: 익명성과 감정 거리가 필요한 실제 인물'
      : isAudio
        ? '화자: 듣는 사람을 안내하는 목소리'
      : defaultCharacter,
    audience: blueprint.medium === 'comics'
      ? '짧은 시간에 공감과 반전을 원하는 독자'
      : isEssay
        ? '개인의 경험에서 자기 이야기를 발견하고 싶은 독자'
        : isAudio
          ? '듣고 보며 쉽게 따라오고 싶은 시청자'
        : '연재를 따라가며 인물 변화와 떡밥을 즐기는 독자',
    constraints: blueprint.formatLabel
  };
}

export function developCreativeProject(
  blueprint: CreativeBlueprint,
  input: CreativeDevelopmentInput
): CreativeDevelopmentPackage {
  const material = clean(input.material, defaultMaterial);
  const storySeed = clean(input.storySeed, defaultStory);
  const artDirection = clean(input.artDirection, createDefaultDevelopmentInput(blueprint).artDirection);
  const characterSeed = clean(input.characterSeed, defaultCharacter);
  const mainCharacter = parseCharacter(characterSeed, artDirection);
  const title = makeTitle(material, blueprint.formatLabel);
  const isFourCut = blueprint.format === 'four-cut-insta-toon';
  const isVisual = blueprint.nextWorkspace === 'visual-storyboard-studio';
  const isEssay = blueprint.medium === 'essay';
  const isAudio = blueprint.medium === 'audiobook';
  const panelPlan = isVisual ? buildPanelPlan(blueprint.formatLabel, material, storySeed) : [];
  const imagePromptPlan = isVisual
    ? buildImagePromptPlan(blueprint.format, panelPlan, artDirection, mainCharacter)
    : undefined;
  const storyContract = buildStoryContract(blueprint, material, storySeed, mainCharacter, input);
  const workflowBoard = buildTesterDrivenWorkflow(blueprint);
  const qualityGates = buildQualityGateResults(blueprint, workflowBoard.qualityGateIds);
  const refactorImpactPreview = buildRefactorImpactPreview(blueprint);
  const referenceDnaCards = buildReferenceDnaCards(blueprint);
  const logline = isEssay
    ? `${material}에서 출발해, ${mainCharacter.name}의 나의 경험을 ${storySeed} 질문으로 되짚는 ${blueprint.formatLabel} 프로젝트.`
    : isAudio
      ? `${material}을 ${mainCharacter.name}의 목소리와 ${storySeed} 구조로 전달하는 ${blueprint.formatLabel} 프로젝트.`
    : `${material} 소재를 바탕으로, ${mainCharacter.name}이 ${storySeed} 과정에서 자기모순을 통과하는 ${blueprint.formatLabel} 프로젝트.`;

  return {
    title,
    logline,
    premise: `${blueprint.mediumLabel} / ${blueprint.formatLabel}: ${material}`,
    storyContract,
    workflowBoard,
    qualityGates,
    refactorImpactPreview,
    referenceDnaCards,
    outputAutopsy: buildOutputAutopsy(blueprint, material, storySeed, mainCharacter, qualityGates),
    storyArc: buildStoryArc(blueprint.formatLabel, storySeed),
    characters: [mainCharacter],
    visualPlan: isVisual
      ? `${artDirection}. ${isFourCut ? '1:1 정사각형, 좌상/우상/좌하/우하 4컷 고정, 말풍선 위치를 컷별로 관리.' : '컷 리듬, 스크롤/페이지 전환, 말풍선 밀도를 관리.'}`
      : isEssay
        ? `${artDirection}. 문체 샘플, 금지 표현, 질문 리스트, 실제 주변 인물의 익명화 기준을 함께 저장.`
        : isAudio
          ? `${artDirection}. 음성 톤, 음악 큐, 자막 밀도, 장면 전환, 반복 리듬을 함께 저장.`
      : `${artDirection}. 장면 감각, 문체 규칙, 대사 톤을 시리즈 바이블에 저장.`,
    panelPlan,
    imagePromptPlan,
    agentReports: buildAgentReports(blueprint, material, storySeed, artDirection, mainCharacter),
    nextActions: isVisual
      ? ['비주얼 바이블 저장', '컷별 이미지 프롬프트 생성', '다빈치 프롬프트 검토', '연속성 레저 업데이트']
      : isEssay
        ? ['추가 질문 리스트 작성', '문체 샘플 저장', '주변 인물 익명화 점검']
        : isAudio
          ? ['낭독 스크립트 작성', '음악/효과음 큐 정리', '자막/장면 보드 생성']
      : ['시리즈 바이블 저장', '첫 회차 비트 생성', '연속성 레저 업데이트']
  };
}

function buildStoryContract(
  blueprint: CreativeBlueprint,
  material: string,
  storySeed: string,
  character: DevelopedCharacter,
  input: CreativeDevelopmentInput
): StoryContract {
  const mediumPromise =
    blueprint.medium === 'comics'
      ? '컷, 침묵, 말풍선, 시선 흐름이 산문 설명보다 먼저 읽히게 한다.'
      : blueprint.medium === 'audiobook'
        ? '귀로 들었을 때 한 번에 따라오는 화자, 발음, 호흡, 음악 큐를 지킨다.'
        : blueprint.medium === 'essay'
          ? '사용자가 말한 경험만 사용하고, 주변 인물의 거리와 익명성을 지킨다.'
          : '회차마다 답 하나와 새 질문 하나를 남겨 다음 회차 클릭을 만든다.';

  return {
    audiencePromise: `${material}에서 출발해 ${input.audience}에게 ${storySeed}의 보상을 제공합니다.`,
    protagonistDesire: character.desire,
    woundOrCost: character.contradiction,
    forbiddenCliches: [
      'AI가 사용자 대신 사적 기억을 발명하기',
      '모순을 숨기고 자연스러운 척 통과시키기',
      '레퍼런스의 표면 스타일을 복제하기'
    ],
    genreExpectation: `${blueprint.mediumLabel} 독자가 기대하는 형식적 보상과 ${blueprint.formatLabel}의 리듬을 지킵니다.`,
    formatPromise: `${blueprint.formatLabel}: ${mediumPromise}`,
    continuityGuardrails: [
      '새 사실은 Output Autopsy에서 승인받기 전까지 canon이 아니다.',
      '주요 변경은 Refactor Impact Preview를 거친다.',
      '캐릭터, 세계, 문체, 시각, 오디오 기억은 각각의 bible에 나눠 저장한다.'
    ]
  };
}

function buildQualityGateResults(
  blueprint: CreativeBlueprint,
  gateIds: QualityGateId[]
): QualityGateResult[] {
  const labels: Record<QualityGateId, string> = {
    story: 'Story Gate',
    voice: 'Voice Gate',
    continuity: 'Continuity Gate',
    visual: 'Visual Gate',
    audio: 'Audio Gate',
    platform: 'Platform Gate'
  };

  const checks: Record<QualityGateId, string[]> = {
    story: ['독자/청자 약속이 선명한가', '장면 기능이 선택과 갈등을 만든가', '답 하나와 새 질문 하나가 남는가'],
    voice: ['문체 drift가 없는가', '한국어가 번역투로 굳지 않았는가', '너무 깔끔한 AI식 정리가 아닌가'],
    continuity: ['canon 충돌이 없는가', '시간/공간/관계 오류가 없는가', '새 기억의 저장 위치가 명확한가'],
    visual: ['캐릭터 시각 참조가 유지되는가', '컷만 봐도 사건이 읽히는가', '말풍선이 그림을 압도하지 않는가'],
    audio: ['발음과 화자가 일관적인가', '문단별 호흡이 청취 피로를 낮추는가', '음악/SFX가 서사를 덮지 않는가'],
    platform: ['첫 300자/첫 3컷/첫 30초가 작동하는가', '제목과 썸네일/비율이 준비됐는가', 'export 패키지가 명확한가']
  };

  return gateIds.map((id) => ({
    id,
    label: labels[id],
    status: 'needs-review',
    priority:
      id === 'visual' && blueprint.medium === 'comics'
        ? '컷 가독성과 말풍선 밀도를 먼저 본다.'
        : id === 'audio' && blueprint.medium === 'audiobook'
          ? '첫 30초 청취 리듬과 발음 사전을 먼저 본다.'
          : id === 'continuity'
            ? '캐논 충돌은 다수결로 통과시키지 않는다.'
            : '생성 전후 모두 확인한다.',
    checks: checks[id]
  }));
}

function buildRefactorImpactPreview(blueprint: CreativeBlueprint): RefactorImpactPreview {
  const baseAreas = ['장면', '대사 규칙', '관계 상태', '소개문'];
  const impactedAreas =
    blueprint.medium === 'comics'
      ? [...baseAreas, '캐릭터 시각 참조', '컷별 프롬프트', '썸네일/비율']
      : blueprint.medium === 'audiobook'
        ? [...baseAreas, '오디오 화자', '발음 사전', '음악/SFX 큐']
        : blueprint.medium === 'essay'
          ? [...baseAreas, '실제 인물 익명화', '감정 거리', '문체 샘플']
          : [...baseAreas, '세계 규칙', '회차 후크', '장기 떡밥'];

  return {
    trigger: '이름, 성별, 관계, 직업, 화자, 시각 참조 같은 주요 설정 변경',
    impactedAreas,
    options: ['전체 적용', '일부 적용', '충돌로 보류']
  };
}

function buildOutputAutopsy(
  blueprint: CreativeBlueprint,
  material: string,
  storySeed: string,
  character: DevelopedCharacter,
  qualityGates: QualityGateResult[]
): OutputAutopsy {
  return {
    newCanonCandidates: [
      `${blueprint.formatLabel}의 중심 소재는 "${material}"이다.`,
      `${character.name}의 핵심 모순은 "${character.contradiction}"이다.`
    ],
    possibleDamage: [
      `결말이 "${storySeed}"만 설명하고 다음 행동을 만들지 못할 수 있음`,
      ...qualityGates
        .filter((gate) => gate.status === 'needs-review')
        .slice(0, 2)
        .map((gate) => `${gate.label} 미검수`)
    ],
    memoryUpdates: [
      'Story Contract를 첫 canon 후보로 저장',
      'Workflow Board 완료 상태 기록',
      '품질 게이트 결과를 review ledger에 저장'
    ],
    userApprovalRequired: true
  };
}

function clean(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function parseCharacter(seed: string, artDirection: string): DevelopedCharacter {
  const [rawName, rawDescription] = seed.split(':');
  const hasNamedCharacter = Boolean(rawDescription);
  const name = hasNamedCharacter ? rawName.trim() : '주인공';
  const description = (hasNamedCharacter ? rawDescription : rawName).trim() || defaultCharacter;

  return {
    name,
    role: description,
    desire: `${description}의 결핍을 해결하려 한다`,
    contradiction: '원하는 것을 얻으려면 가장 피하던 선택을 해야 한다',
    visualCue: artDirection.includes('두꺼운') ? '두꺼운 외곽선과 큰 표정 변화' : '반복되는 소품과 자세'
  };
}

function makeTitle(material: string, formatLabel: string) {
  const words = material
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean);
  const keyword = words
    .slice(0, 3)
    .join(' ');
  const motif = words.find((word) => word.includes('기억'));
  const titleCore = motif && !keyword.includes(motif) ? `${keyword} ${motif}` : keyword;

  return titleCore ? `${titleCore} ${formatLabel}` : `새 ${formatLabel}`;
}

function buildStoryArc(formatLabel: string, storySeed: string) {
  if (formatLabel.includes('뮤직비디오')) {
    return ['도입 훅', '1절 장면 전개', '후렴 반복 이미지', `브릿지/마지막 컷: ${storySeed}`];
  }

  if (formatLabel.includes('교육영상')) {
    return ['학습 목표 제시', '쉬운 비유 또는 예시', '따라 해볼 질문', `요약: ${storySeed}`];
  }

  if (formatLabel.includes('동요읽기')) {
    return ['부드러운 인사', '반복 문장 제시', '따라 말하기 구간', `마무리 후렴: ${storySeed}`];
  }

  if (formatLabel.includes('에세이')) {
    return ['겉으로 보이는 사건 정리', '그때의 나와 지금의 나를 분리', '주변 인물과 감정의 거리 조정', `질문: ${storySeed}`];
  }

  if (formatLabel.includes('네컷')) {
    return ['공감 가능한 상황 제시', '문제가 예상보다 커짐', '반전의 단서 노출', `결말: ${storySeed}`];
  }

  if (formatLabel.includes('인스타툰')) {
    return ['첫 장 후킹', '공감 디테일 누적', '감정 또는 정보 반전', '저장하고 싶은 마지막 문장'];
  }

  return ['도입: 결핍과 목표 제시', '전개: 규칙과 장애물 발견', '중반: 관계와 선택의 비용 확대', `후킹: ${storySeed}`];
}

function buildPanelPlan(formatLabel: string, material: string, storySeed: string): PanelPlan[] {
  if (formatLabel.includes('네컷')) {
    return [
      { position: '좌상', purpose: '상황 제시', scene: material, bubble: '상단 중앙, 짧은 한 문장' },
      { position: '우상', purpose: '긴장 상승', scene: '문제가 예상보다 커진다', bubble: '좌측 상단, 감탄 또는 질문' },
      { position: '좌하', purpose: '반전 준비', scene: '독자가 놓친 단서를 보여준다', bubble: '하단 우측, 작은 혼잣말' },
      { position: '우하', purpose: `반전 결말: ${storySeed}`, scene: storySeed, bubble: '필요하면 생략하고 표정으로 마무리' }
    ];
  }

  return [
    { position: '1', purpose: '첫 컷 후킹', scene: material, bubble: '짧고 크게' },
    { position: '2-3', purpose: '상황 확장', scene: '인물의 선택과 오해를 보여준다', bubble: '컷당 한 문장 이하' },
    { position: '마지막', purpose: '저장/공유 포인트', scene: storySeed, bubble: '마지막 문장 또는 무대사' }
  ];
}

function buildImagePromptPlan(
  format: CreativeBlueprint['format'],
  panelPlan: PanelPlan[],
  artDirection: string,
  character: DevelopedCharacter
): ImagePromptPlan {
  const aspectRatio = getAspectRatio(format);
  const style = artDirection.split(',')[0]?.trim() || artDirection;
  const characterDescription = `${character.name}, ${character.role}, ${character.visualCue}`;

  return {
    agentName: '다빈치 이미지 에이전트',
    modelFamily: 'FLUX.2',
    principles: [
      '주체, 행동, 스타일, 맥락 순서로 핵심 요소를 앞에 배치',
      '부정 프롬프트 없이 원하는 화면만 긍정형으로 기술',
      '캐릭터 묘사와 시각 단서를 컷마다 반복',
      '말풍선 텍스트는 따옴표, 위치, 크기, 스타일을 함께 명시',
      '복잡한 제작용 컷은 JSON 구조로 scene, subjects, style, composition을 분리'
    ],
    frames: panelPlan.map((panel) => {
      const structuredPrompt = buildStructuredImagePrompt(
        panel,
        characterDescription,
        artDirection,
        style,
        aspectRatio
      );

      return {
        position: panel.position,
        purpose: panel.purpose,
        prompt: flattenStructuredPrompt(structuredPrompt),
        structuredPrompt,
        continuityAnchors: [characterDescription, artDirection, `aspect ratio ${aspectRatio}`, panel.bubble]
      };
    })
  };
}

function buildStructuredImagePrompt(
  panel: PanelPlan,
  characterDescription: string,
  artDirection: string,
  style: string,
  aspectRatio: StructuredImagePrompt['aspect_ratio']
): StructuredImagePrompt {
  return {
    scene: panel.scene,
    subjects: [
      {
        description: characterDescription,
        position: getPanelSubjectPosition(panel.position),
        action: panel.purpose
      }
    ],
    style: artDirection,
    context: '한국 인스타툰 감성의 짧은 일상 장면, 문화적 맥락은 한국어 프롬프트로 유지',
    composition: `${panel.position} 컷, ${aspectRatio} 화면, 주체가 먼저 읽히는 단순한 구도, 여백은 말풍선 위치를 위해 확보`,
    lighting: '부드러운 실내광 또는 자연광, 선명한 초점, 표정과 손동작이 잘 보이는 조명',
    mood: panel.purpose,
    text: `말풍선: "${panel.bubble}", 위치와 크기를 명확히 유지, 읽기 쉬운 손글씨풍 한국어`,
    color_guidance: [`${style} 중심`, '캐릭터와 배경 색을 분리', '중요 소품의 색은 컷마다 동일하게 유지'],
    aspect_ratio: aspectRatio
  };
}

function flattenStructuredPrompt(prompt: StructuredImagePrompt) {
  const subject = prompt.subjects[0];

  return [
    `주체: ${subject.description}`,
    `행동: ${subject.action}, ${prompt.scene}`,
    `스타일: ${prompt.style}`,
    `맥락: ${prompt.context}`,
    `구도: ${prompt.composition}`,
    `조명/무드: ${prompt.lighting}, ${prompt.mood}`,
    prompt.text,
    `색상: ${prompt.color_guidance.join(', ')}`
  ].join('\n');
}

function getAspectRatio(format: CreativeBlueprint['format']): StructuredImagePrompt['aspect_ratio'] {
  if (format === 'serial-webtoon') {
    return '9:16';
  }

  if (format === 'graphic-novel' || format === 'short-comic') {
    return '4:3';
  }

  return '1:1';
}

function getPanelSubjectPosition(position: string) {
  const quadrantMap: Record<string, string> = {
    좌상: 'top-left panel center',
    우상: 'top-right panel center',
    좌하: 'bottom-left panel center',
    우하: 'bottom-right panel center'
  };

  return quadrantMap[position] ?? `panel ${position} center`;
}

function buildAgentReports(
  blueprint: CreativeBlueprint,
  material: string,
  storySeed: string,
  artDirection: string,
  character: DevelopedCharacter
): DevelopmentAgentReport[] {
  if (blueprint.medium === 'audiobook') {
    const reports: DevelopmentAgentReport[] = [
      {
        agent: '소재 에이전트',
        decision: '오디오/영상 소재 잠금',
        output: `${material}을 ${blueprint.formatLabel}의 듣기 흐름에 맞는 중심 약속으로 압축했습니다.`
      },
      {
        agent: '낭독 연출 에이전트',
        decision: '목소리 흐름 설정',
        output: `${storySeed}를 도입 훅, 반복 리듬, 쉬는 지점, 마지막 기억 포인트로 나눴습니다.`
      }
    ];

    if (blueprint.format === 'educational-video') {
      reports.push({
        agent: '교육 구성 에이전트',
        decision: '학습 흐름 설정',
        output: '학습 목표, 예시, 질문, 요약의 순서를 정리했습니다.'
      });
    } else {
      reports.push({
        agent: '사운드/음악 에이전트',
        decision: '음악 큐 설정',
        output: `${artDirection}을 기준으로 음악 진입, 반복 후렴, 효과음 밀도를 정리했습니다.`
      });
    }

    reports.push(
      {
        agent: '영상 콘티 에이전트',
        decision: '화면 보조 계획',
        output: '자막 밀도, 장면 전환, 반복 비주얼 모티프를 오디오 리듬에 맞췄습니다.'
      },
      {
        agent: '연속성 에이전트',
        decision: '오디오/영상 제작 항목 저장',
        output: `${blueprint.managementFocus.slice(0, 3).join(', ')}를 제작 전 고정 항목으로 표시했습니다.`
      }
    );

    return reports;
  }

  if (blueprint.medium === 'essay') {
    return [
      {
        agent: '소재 에이전트',
        decision: '내 이야기의 출발점 잠금',
        output: `${material}을 사실, 감정, 지금의 해석으로 나누어 다룰 준비를 했습니다.`
      },
      {
        agent: '인터뷰 에이전트',
        decision: '질문 흐름 생성',
        output: `${storySeed}를 바탕으로 더 물어봐야 할 기억, 장면, 감정의 빈칸을 표시했습니다.`
      },
      {
        agent: '주변 인물 에이전트',
        decision: '실제 인물 보호',
        output: `${character.name}와 주변 인물의 식별 정보, 감정 거리, 공개 가능한 범위를 분리했습니다.`
      },
      {
        agent: '문체 큐레이터 에이전트',
        decision: '문체 취향 고정',
        output: `${artDirection}을 글 전체의 문장 리듬, 은유 밀도, 금지 표현 기준으로 저장했습니다.`
      },
      {
        agent: '휴머나이저 에이전트',
        decision: '자연스러운 한국어 점검',
        output: 'AI스러운 추상어, 쉼표 과다, 명사형 문장을 줄이고 작성자의 말맛을 우선합니다.'
      },
      {
        agent: '연속성 에이전트',
        decision: '에세이 기억 장부 설정',
        output: `${blueprint.managementFocus.slice(0, 3).join(', ')}를 다음 초고 전 고정 항목으로 표시했습니다.`
      }
    ];
  }

  const reports: DevelopmentAgentReport[] = [
    {
      agent: '소재 에이전트',
      decision: '핵심 소재 잠금',
      output: `${material}을 ${blueprint.formatLabel}의 길이에 맞는 중심 질문으로 압축했습니다.`
    },
    {
      agent: '스토리 에이전트',
      decision: '진행 구조 생성',
      output: `${storySeed}를 시작-확장-반전-후킹 구조로 배치했습니다.`
    },
    {
      agent: '캐릭터 에이전트',
      decision: '인물 축 설정',
      output: `${character.name}의 욕망, 자기모순, 시각 단서를 설정했습니다.`
    },
    {
      agent: blueprint.medium === 'comics' ? '작화/문체 에이전트' : '문체 큐레이터 에이전트',
      decision: blueprint.medium === 'comics' ? '작화 규칙 설정' : '문체 규칙 설정',
      output: artDirection
    }
  ];

  if (blueprint.medium === 'comics') {
    reports.push({
      agent: '다빈치 이미지 에이전트',
      decision: 'FLUX.2 컷별 프롬프트 계약',
      output: '주체-행동-스타일-맥락 순서, 긍정형 묘사, 컷마다 반복되는 캐릭터 묘사와 말풍선 위치를 적용했습니다.'
    });
  }

  reports.push(
    {
      agent: '연속성 에이전트',
      decision: '저장 항목 선별',
      output: `${blueprint.managementFocus.slice(0, 3).join(', ')}를 제작 전 고정 항목으로 표시했습니다.`
    }
  );

  return reports;
}
