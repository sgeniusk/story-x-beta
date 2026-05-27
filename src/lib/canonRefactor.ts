import type { AgentId, Chapter, SeriesProject } from './storyEngine';

export type CanonChangeKind = 'story-core' | 'character' | 'world' | 'canon' | 'voice' | 'visual' | 'audio';
export type CanonChangeOrigin = 'manual-bible-edit' | 'ai-review' | 'publishing-review';
export type CanonRefactorStatus = 'clear' | 'needs-review' | 'blocked';

export interface CanonChangeEntryInput {
  kind: CanonChangeKind;
  targetLabel: string;
  fieldLabel: string;
  before: string;
  after: string;
  origin: CanonChangeOrigin;
  /** M4 청크 H — Gap 8: 변경 대상 캐논의 ID. 채워지면 chapter.newCanonFacts.id 와 직접 매칭, 없으면 부분문자열 fallback. */
  targetCanonId?: string;
}

export interface CanonChangeEntry extends CanonChangeEntryInput {
  id: string;
}

export interface CanonRefactorReviewStep {
  agentId: AgentId;
  label: string;
  focus: string;
}

export interface CanonRefactorAffectedChapter {
  id: string;
  title: string;
  episode: number;
  reason: string;
}

export interface CanonRefactorPlan {
  status: CanonRefactorStatus;
  summary: string;
  changeCount: number;
  affectedChapters: CanonRefactorAffectedChapter[];
  reviewOrder: CanonRefactorReviewStep[];
  conflictWarnings: string[];
  recommendations: string[];
  releaseAdvice: string;
}

const reviewStepByKind: Record<CanonChangeKind, CanonRefactorReviewStep[]> = {
  'story-core': [
    { agentId: 'showrunner', label: '쇼러너', focus: '독자 약속과 장기 전개가 같은 방향인지 확인' },
    { agentId: 'continuity-editor', label: '연속성 감수자', focus: '기존 canon과 출간본 영향 범위 확인' }
  ],
  character: [
    { agentId: 'character-custodian', label: '캐릭터 큐레이터', focus: '욕망, 상처, 말투, 관계 상태 변화 검토' },
    { agentId: 'continuity-editor', label: '연속성 감수자', focus: '이전 회차 행동과 승인된 캐논 충돌 확인' },
    { agentId: 'showrunner', label: '쇼러너', focus: '앞으로의 회차 약속과 클리프행어 재정렬' }
  ],
  world: [
    { agentId: 'world-keeper', label: '배경 설계자', focus: '세계 규칙, 비용, 예외가 싸지지 않았는지 확인' },
    { agentId: 'continuity-editor', label: '연속성 감수자', focus: '타임라인과 기존 사건 충돌 확인' },
    { agentId: 'genre-stylist', label: '장르 스타일리스트', focus: '장르적 압력과 재미가 유지되는지 확인' }
  ],
  canon: [
    { agentId: 'continuity-editor', label: '연속성 감수자', focus: '승인된 사실의 대체/폐기/반전 여부 판정' },
    { agentId: 'showrunner', label: '쇼러너', focus: '이 변경을 복선 회수나 반전으로 쓸 수 있는지 판단' }
  ],
  voice: [
    { agentId: 'voice-curator', label: '문체 큐레이터', focus: '문체 바이블과 한국어 자연스러움 재검토' },
    { agentId: 'genre-stylist', label: '장르 스타일리스트', focus: '장르 리듬과 문장 질감 확인' }
  ],
  visual: [
    { agentId: 'da-vinci', label: '다빈치', focus: '시각 프롬프트와 visual DNA 영향 범위 확인' },
    { agentId: 'storyboard-agent', label: '웹툰 연출가', focus: '컷 구성과 키프레임 후보 영향 확인' }
  ],
  audio: [
    { agentId: 'audio-narration-director', label: '오디오 연출가', focus: '낭독 톤, 쉼, 청취 리듬 영향 확인' },
    { agentId: 'voice-curator', label: '문체 큐레이터', focus: '문체와 소리의 호흡 충돌 확인' }
  ]
};

export function createCanonChangeEntry(input: CanonChangeEntryInput): CanonChangeEntry {
  return {
    ...input,
    id: [
      input.origin,
      input.kind,
      slug(input.targetLabel),
      slug(input.fieldLabel),
      stableHash(`${input.before}->${input.after}`)
    ].join('-')
  };
}

export function buildCanonRefactorPlan(project: SeriesProject, changes: CanonChangeEntry[]): CanonRefactorPlan {
  if (changes.length === 0) {
    return {
      status: 'clear',
      summary: '대기 중인 변경 로그가 없습니다. 바이블 수정이 생기면 영향 범위를 계산합니다.',
      changeCount: 0,
      affectedChapters: [],
      reviewOrder: [],
      conflictWarnings: [],
      recommendations: ['지금 상태에서는 새 초안 생성 또는 출간 전 검토를 바로 진행할 수 있습니다.'],
      releaseAdvice: '출간본을 수정하기 전까지 별도 캐논 리팩터는 필요하지 않습니다.'
    };
  }

  const warnings = buildWarnings(changes);
  const affectedChapters = findAffectedChapters(project.chapters, changes);
  const reviewOrder = uniqueReviewSteps(changes.flatMap((change) => reviewStepByKind[change.kind]));
  const status: CanonRefactorStatus = warnings.some((warning) => warning.includes('비어 있습니다')) ? 'blocked' : 'needs-review';

  return {
    status,
    summary:
      status === 'blocked'
        ? `${changes.length}개 변경 중 핵심 기억이 비어 있어 반영을 막았습니다.`
        : `${changes.length}개 변경을 기준으로 ${affectedChapters.length}개 회차와 ${reviewOrder.length}개 에이전트 검토가 필요합니다.`,
    changeCount: changes.length,
    affectedChapters,
    reviewOrder,
    conflictWarnings: warnings,
    recommendations: buildRecommendations(changes, affectedChapters),
    releaseAdvice:
      '이미 출간한 회차와 충돌할 수 있는 수정은 바로 덮어쓰지 말고, 변경 로그 검토 후 reveal, revision, blocked 중 하나로 결정합니다.'
  };
}

function buildWarnings(changes: CanonChangeEntry[]) {
  const warnings: string[] = [];

  changes.forEach((change) => {
    if (change.after.trim().length === 0) {
      warnings.push(`${change.targetLabel}의 ${change.fieldLabel} 값이 비어 있습니다.`);
    }

    if (change.kind === 'world') {
      warnings.push('세계 규칙 변경은 능력 비용, 장소 이동, 기존 사건의 원인을 다시 확인해야 합니다.');
    }

    if (change.kind === 'canon') {
      warnings.push('승인된 캐논 변경은 기존 회차의 독자 기억과 직접 충돌할 수 있습니다.');
    }
  });

  return Array.from(new Set(warnings));
}

function findAffectedChapters(chapters: Chapter[], changes: CanonChangeEntry[]): CanonRefactorAffectedChapter[] {
  if (chapters.length === 0) {
    return [];
  }

  // M4 청크 H — Gap 8: 엔티티 ID 링크 우선. change.targetCanonId 가 있으면 chapter.newCanonFacts.id 와 직접 매칭.
  // ID 없으면 기존 부분문자열 fallback 으로 호환성 유지. 새 변경은 ID 를 채워 의미적 매칭으로 가도록.
  const matched = chapters.filter((chapter) =>
    changes.some(
      (change) =>
        (change.targetCanonId && chapterReferencesCanonId(chapter, change.targetCanonId)) ||
        chapterContains(chapter, change.targetLabel) ||
        chapterContains(chapter, change.before)
    )
  );
  const candidates = matched.length > 0 ? matched : chapters.slice(-3);

  return candidates.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    episode: chapter.episode,
    reason: matched.includes(chapter) ? '변경 대상이 회차 원고나 훅에 직접 등장합니다.' : '직접 언급은 없지만 최근 회차 흐름에 영향이 있을 수 있습니다.'
  }));
}

function chapterContains(chapter: Chapter, text: string) {
  const needle = text.trim();

  if (needle.length < 2) {
    return false;
  }

  const haystack = [chapter.title, chapter.hook, chapter.prose, ...chapter.outline, ...chapter.memoryAnchors].join(' ');
  return haystack.includes(needle);
}

// M4 청크 H — Gap 8: chapter.newCanonFacts.id 가 변경 대상 캐논 id 와 일치하면 영향받음.
// 부분문자열 매칭이 잡지 못하던 의미적 영향(같은 사실을 다른 표현으로 언급) 을 직접 ID 링크로 잡는다.
function chapterReferencesCanonId(chapter: Chapter, canonId: string): boolean {
  const trimmed = canonId.trim();
  if (trimmed.length === 0) return false;
  return chapter.newCanonFacts.some((fact) => fact.id === trimmed);
}

function uniqueReviewSteps(steps: CanonRefactorReviewStep[]) {
  const seen = new Set<AgentId>();
  const unique: CanonRefactorReviewStep[] = [];

  steps.forEach((step) => {
    if (!seen.has(step.agentId)) {
      seen.add(step.agentId);
      unique.push(step);
    }
  });

  return unique;
}

function buildRecommendations(changes: CanonChangeEntry[], affectedChapters: CanonRefactorAffectedChapter[]) {
  const kinds = new Set(changes.map((change) => change.kind));
  const recommendations: string[] = [];

  if (kinds.has('character')) {
    recommendations.push('인물 변경은 다음 회차 행동 대안 2개를 만들어 캐릭터성이 자연스럽게 이어지는 쪽을 선택합니다.');
  }

  if (kinds.has('world')) {
    recommendations.push('세계관 변경은 능력의 대가와 예외 조건을 함께 적어 재미를 싼 설정으로 만들지 않습니다.');
  }

  if (kinds.has('canon')) {
    recommendations.push('캐논 변경은 오류 수정인지, 독자를 속였던 reveal인지 먼저 판정한 뒤 전개에 반영합니다.');
  }

  if (affectedChapters.length > 0) {
    recommendations.push(`${affectedChapters[0].episode}화부터 독자 기억과 충돌하는 문장을 먼저 확인합니다.`);
  }

  return recommendations.length > 0 ? recommendations : ['변경 목적을 한 문장으로 요약한 뒤 관련 에이전트 검토를 실행합니다.'];
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'empty';
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}
