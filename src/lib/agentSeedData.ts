// 스튜디오 작가진 실행 시드 정적 데이터.

import type { ValidationAgentId } from './agentReviewProcess';
import { isSerialFormat } from './projectBlueprint';
import type { CreativeFormat, CreativeMedium } from './projectBlueprint';
import type { AgentRun } from './storyEngine';

export const defaultRuns: AgentRun[] = [
  {
    agentId: 'showrunner',
    title: '쇼러너',
    status: 'idle',
    output: '이번 회차의 약속, 압력, 마지막 질문을 한 줄로 잠글 준비가 되어 있습니다.',
    evidence: ['독자 약속', '클리프행어']
  },
  {
    agentId: 'character-custodian',
    title: '캐릭터',
    status: 'idle',
    output: '욕망, 상처, 관계 상태가 초안에서 흔들리지 않는지 확인합니다.',
    evidence: ['desire', 'wound']
  },
  {
    agentId: 'world-keeper',
    title: '월드',
    status: 'idle',
    output: '세계 규칙과 비용이 장면마다 같은 방식으로 작동하는지 봅니다.',
    evidence: ['rules', 'cost']
  },
  {
    agentId: 'genre-stylist',
    title: '장르',
    status: 'idle',
    output: '장르 리듬과 문체 질감을 회차 목적에 맞게 조정합니다.',
    evidence: ['beat', 'texture']
  },
  {
    agentId: 'continuity-editor',
    title: '연속성',
    status: 'idle',
    output: '모순은 숨기지 않고 충돌로 표시하고, 승인된 사실만 canon에 넣습니다.',
    evidence: ['canon', 'conflict']
  }
];

export const MARGIN_CORE_AGENT_IDS: ValidationAgentId[] = [
  'showrunner',
  'character-custodian',
  'world-keeper',
  'genre-stylist',
  'continuity-editor'
];

// 매체별 라이브 검토 특화 작가진 — CORE 5인에 더한다. 인터뷰(buildPersonaLineup)는 이미 매체별인데
// 검토만 고정 5인이던 비대칭을 해소한다. id 는 ValidationAgentId·.claude/agents/*.md 에 정의된 것만 쓴다.
export const MEDIUM_REVIEW_SPECIALISTS: Partial<Record<CreativeMedium, ValidationAgentId[]>> = {
  comics: ['storyboard-agent', 'speech-bubble-agent'],
  audiobook: ['audio-narration-director'],
  essay: ['essay-curator']
};

// 흡인력 게이트(2026-07-06 spec) — 긴장 축이 서사와 다른 매체는 제외한다.
const COMPELLINGNESS_EXCLUDED_MEDIA: readonly CreativeMedium[] = ['essay', 'academic'];

// 한 매체의 라이브 검토 작가진 id 목록 — CORE + 매체 specialist(중복 가드). novel·academic 은 CORE 만.
// format 이 연재형이고 에세이·학술이 아니면 critic-reviewer 를 흡인력 판정자로 마지막에 합류(격리·발견 순서 보존).
export function getMediumReviewAgentIds(medium: CreativeMedium, format?: CreativeFormat): ValidationAgentId[] {
  const specialists = MEDIUM_REVIEW_SPECIALISTS[medium] ?? [];
  const merged = [...MARGIN_CORE_AGENT_IDS];
  for (const id of specialists) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  if (format && isSerialFormat(format) && !COMPELLINGNESS_EXCLUDED_MEDIA.includes(medium) && !merged.includes('critic-reviewer')) {
    merged.push('critic-reviewer');
  }
  return merged;
}

export const visualStoryAgentRuns: AgentRun[] = [
  {
    agentId: 'storyboard-agent',
    title: '웹툰 연출',
    status: 'idle',
    output: '장면을 컷 기능, 스크롤 템포, 넘김 후크로 분해합니다.',
    evidence: ['panel-plan', 'scroll-rhythm']
  },
  {
    agentId: 'speech-bubble-agent',
    title: '말풍선',
    status: 'idle',
    output: '말풍선 위치와 대사 밀도가 표정, 손동작, 핵심 소품을 가리지 않는지 봅니다.',
    evidence: ['bubble-map', 'dialogue-density']
  },
  {
    agentId: 'keyframe-art-director',
    title: '원화',
    status: 'idle',
    output: 'Midjourney 원화 후보 중 사용자가 선택한 컷만 visual DNA로 잠급니다.',
    evidence: ['midjourney-keyframe', 'visual-dna']
  },
  {
    agentId: 'da-vinci',
    title: '다빈치',
    status: 'idle',
    output: '승인된 원화와 캐릭터 시트를 컷별 이미지 프롬프트로 변환합니다.',
    evidence: ['image-prompt', 'negative-prompt']
  },
  {
    agentId: 'frame-assembly-agent',
    title: '프레임',
    status: 'idle',
    output: '정사각형, 세로 스크롤, 페이지 시퀀스에 맞춰 컷 순서와 export 묶음을 확인합니다.',
    evidence: ['frame-order', 'export-package']
  }
];
