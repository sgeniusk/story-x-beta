// 작품 프로젝트와 버전 스냅샷을 브라우저 localStorage에 저장·복원한다
import {
  createSeedProject,
  defaultPlannedEpisodes,
  DEFAULT_BEAT_TENSION,
  type BibleSection,
  type CanonEntity,
  type CharacterProfile,
  type ContractLengthClass,
  type SeriesProject,
  type StorySpine,
  type TimelineEntry
} from './storyEngine';
import { getProjectLocalization } from './localization';
import { deriveImportance, deriveParticipants } from './canonImportance';
import { normalizeWritingLog } from './retentionStats';
import { loadEvolutionHistory, replaceEvolutionHistory, type EvolutionHistory } from './evolutionMemory';
import type { CreativeFormat, CreativeMedium, HomeFlowStep } from './projectBlueprint';
import type { DiveSession } from './diveSession';
import type { DiveSetup } from './diveProposal';
import type { ProjectIntakeQuestion } from './projectIntake';
import type { PlanPatch } from './planStage';
import type { PlanChatMessage } from './planChat';

const storageKey = 'serial-story-studio/project';
const snapshotsKey = 'serial-story-studio/snapshots';
const MAX_SNAPSHOTS = 20;

export function loadProject(): SeriesProject {
  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return createSeedProject();
  }

  try {
    return normalizeProject(JSON.parse(saved) as SeriesProject);
  } catch {
    return createSeedProject();
  }
}

export function saveProject(project: SeriesProject) {
  window.localStorage.setItem(storageKey, JSON.stringify(project));
}

// 융합 셸 브리지 — 진짜 저장된 project 가 있는지(loadProject 는 없으면 seed 를 반환하므로 구분 필요).
export function hasSavedProject(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(storageKey) !== null;
}

export function clearProject() {
  window.localStorage.removeItem(storageKey);
}

export interface ProjectSnapshot {
  id: string;
  savedAt: string;
  label: string;
  episode: number;
  chapterCount: number;
  canonCount: number;
  project: SeriesProject;
}

// 현재 프로젝트 상태로 버전 스냅샷 하나를 만든다 (순수 함수)
export function buildProjectSnapshot(project: SeriesProject, label: string, now: Date = new Date()): ProjectSnapshot {
  return {
    id: `snap-${now.getTime().toString(36)}`,
    savedAt: now.toISOString(),
    label,
    episode: project.currentEpisode,
    chapterCount: project.chapters.length,
    canonCount: project.canonFacts.length,
    project
  };
}

// 새 스냅샷을 목록 맨 앞에 넣고 최대 개수로 자른다 (순수 함수)
export function appendSnapshot(
  list: ProjectSnapshot[],
  snapshot: ProjectSnapshot,
  max: number = MAX_SNAPSHOTS
): ProjectSnapshot[] {
  return [snapshot, ...list].slice(0, max);
}

export function loadProjectSnapshots(): ProjectSnapshot[] {
  const saved = window.localStorage.getItem(snapshotsKey);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as ProjectSnapshot[]) : [];
  } catch {
    return [];
  }
}

// 새 스냅샷을 저장하고 갱신된 목록을 돌려준다.
// localStorage 용량 초과 시 가장 오래된 스냅샷을 버리며 재시도해 생성 흐름이 끊기지 않게 한다.
export function pushProjectSnapshot(project: SeriesProject, label: string): ProjectSnapshot[] {
  let candidate = appendSnapshot(loadProjectSnapshots(), buildProjectSnapshot(project, label));

  while (candidate.length > 0) {
    try {
      window.localStorage.setItem(snapshotsKey, JSON.stringify(candidate));
      return candidate;
    } catch {
      candidate = candidate.slice(0, candidate.length - 1);
    }
  }

  return [];
}

export function clearProjectSnapshots() {
  window.localStorage.removeItem(snapshotsKey);
}

// 전체 작품 데이터를 한 파일로 묶는 export 페이로드.
// 사용자가 백업·다른 기기 이동·공유에 쓰는 단일 단위.
export interface StoryXExportPayload {
  schema: 'storyx/export/v1';
  exportedAt: string;
  project: SeriesProject;
  snapshots: ProjectSnapshot[];
  preferences: {
    landingTheme?: 'light' | 'dark' | null;
    studioAccent?: string | null;
    studioCanvas?: string | null;
  };
  evolutionHistory?: EvolutionHistory;
}

export interface ImportOutcome {
  ok: boolean;
  /** 사용자에게 보여 줄 한 줄 사유. ok=false 면 reason, ok=true 면 요약(스냅샷 N개 등). */
  message: string;
}

export function exportAllData(): StoryXExportPayload {
  return {
    schema: 'storyx/export/v1',
    exportedAt: new Date().toISOString(),
    project: loadProject(),
    snapshots: loadProjectSnapshots(),
    preferences: {
      landingTheme: normalizeTheme(readPreference('storyx.landingTheme')),
      studioAccent: readPreference('storyx.studio.accent'),
      studioCanvas: readPreference('storyx.studio.canvas')
    },
    evolutionHistory: loadEvolutionHistory()
  };
}

// JSON 문자열·객체 어느 쪽이든 받아 검증 후 전체 키를 덮어쓴다. 잘못된 스키마면 ok:false.
// 호출 측은 import 전에 사용자 confirm 을 받아야 한다 — 이 함수는 즉시 덮어쓴다.
export function importAllData(input: unknown): ImportOutcome {
  let payload: unknown = input;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { ok: false, message: 'JSON 파싱 실패 — 올바른 export 파일이 아닙니다.' };
    }
  }
  if (!isRecord(payload)) {
    return { ok: false, message: '루트가 객체가 아닙니다.' };
  }
  if (payload.schema !== 'storyx/export/v1') {
    return { ok: false, message: `알 수 없는 스키마 — schema='${String(payload.schema)}'. storyx/export/v1 만 지원합니다.` };
  }
  if (!isRecord(payload.project)) {
    return { ok: false, message: 'project 필드가 객체가 아닙니다.' };
  }
  const snapshots = Array.isArray(payload.snapshots) ? (payload.snapshots as ProjectSnapshot[]) : [];
  const preferences = isRecord(payload.preferences) ? payload.preferences : {};

  try {
    saveProject(normalizeProject(payload.project as unknown as SeriesProject));
    window.localStorage.setItem(snapshotsKey, JSON.stringify(snapshots));
    writePreference('storyx.landingTheme', preferences.landingTheme);
    writePreference('storyx.studio.accent', preferences.studioAccent);
    writePreference('storyx.studio.canvas', preferences.studioCanvas);
    // 진화 메모리 history 도 함께 복원 — 없으면 기존 값 유지.
    let historyCount = 0;
    if (payload.evolutionHistory && replaceEvolutionHistory(payload.evolutionHistory)) {
      const hist = payload.evolutionHistory as EvolutionHistory;
      historyCount = Array.isArray(hist.events) ? hist.events.length : 0;
    }
    return {
      ok: true,
      message: `프로젝트 복원 완료 — 스냅샷 ${snapshots.length}개, 진화 메모리 ${historyCount}개 포함.`
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '복원 중 알 수 없는 오류.' };
  }
}

function readPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePreference(key: string, value: unknown): void {
  if (typeof value === 'string' && value.length > 0) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTheme(value: string | null): 'dark' | 'light' | null {
  return value === 'dark' || value === 'light' ? value : null;
}

// 데이터 모드 도입 이전 저장본을 위한 기본 바이블 5섹션. createSeedProject와 같은 id·제목을 쓴다.
function defaultBibleOutline(): BibleSection[] {
  return [
    { id: 'tone', title: '톤', body: '' },
    { id: 'rhythm', title: '문장 리듬', body: '' },
    { id: 'world', title: '세계관 규칙', body: '' },
    { id: 'vocab', title: '어휘 금기', body: '' },
    { id: 'motif', title: '시각 모티프', body: '' }
  ];
}

export function normalizeProject(project: SeriesProject): SeriesProject {
  // 표면 약속/심층 질문/무게중심 도입 이전에 저장된 프로젝트를 위한 백필.
  // 회차 구성(beats) 도입 이전 회차에는 beats: []를 채우고, beat에 tension이 없으면 기본값으로 보정한다.
  // 데이터 모드(places·objects·events·timeline·bibleOutline)와 인물 relations 도입 이전 저장본도 함께 백필한다.
  // MVP-0: CanonFact의 importance·participants·reveal·evidence를 2-pass로 백필한다.
  const rawFacts = Array.isArray(project.canonFacts) ? project.canonFacts : [];
  const factsWithMeta = rawFacts.map((fact) => ({
    ...fact,
    alwaysInclude: typeof fact.alwaysInclude === 'boolean' ? fact.alwaysInclude : false,
    participants:
      Array.isArray(fact.participants) && fact.participants.length > 0
        ? fact.participants
        : deriveParticipants(fact.statement),
    reveal: fact.reveal ?? ('revealed' as const),
    evidence: fact.evidence ?? { sourceType: 'chapter' as const, sourceId: String(fact.episode) }
  }));
  const canonFacts = factsWithMeta.map((fact) => ({
    ...fact,
    importance:
      typeof fact.importance === 'number'
        ? fact.importance
        : deriveImportance(fact, factsWithMeta, Array.isArray(project.openThreads) ? project.openThreads : [])
  }));

  const normalizedProject = {
    ...project,
    localization: getProjectLocalization(project),
    deepQuestion: typeof project.deepQuestion === 'string' ? project.deepQuestion : '',
    creativeWeight: project.creativeWeight ?? 'balanced',
    formIntent: typeof project.formIntent === 'string' ? project.formIntent : '',
    nextEpisodeIntent: typeof project.nextEpisodeIntent === 'string' ? project.nextEpisodeIntent : '',
    writingLog: normalizeWritingLog(project.writingLog),
    canonFacts,
    characters: Array.isArray(project.characters)
      ? project.characters.map((character): CharacterProfile => ({
          ...character,
          // 하드-시딩/import 인물이 배열 필드를 빠뜨리면 buildCodexEntries 의 character.voiceRules.join
          // (또는 canonAnchors·forbiddenContradictions 소비처)에서 TypeError → 에디터 크래시.
          role: typeof character.role === 'string' ? character.role : '',
          desire: typeof character.desire === 'string' ? character.desire : '',
          wound: typeof character.wound === 'string' ? character.wound : '',
          currentState: typeof character.currentState === 'string' ? character.currentState : '',
          voiceRules: Array.isArray(character.voiceRules) ? character.voiceRules : [],
          canonAnchors: Array.isArray(character.canonAnchors) ? character.canonAnchors : [],
          forbiddenContradictions: Array.isArray(character.forbiddenContradictions) ? character.forbiddenContradictions : [],
          relations: Array.isArray(character.relations) ? character.relations : []
        }))
      : [],
    places: Array.isArray(project.places) ? (project.places as CanonEntity[]) : [],
    objects: Array.isArray(project.objects) ? (project.objects as CanonEntity[]) : [],
    events: Array.isArray(project.events) ? (project.events as CanonEntity[]) : [],
    timeline: Array.isArray(project.timeline) ? (project.timeline as TimelineEntry[]) : [],
    bibleOutline:
      Array.isArray(project.bibleOutline) && project.bibleOutline.length > 0
        ? (project.bibleOutline as BibleSection[])
        : defaultBibleOutline(),
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      // 하드-시딩/import 회차가 파생 배열 필드를 빠뜨리면 buildStoryEditorWorkspace 등에서
      // chapter.memoryAnchors.length·newCanonFacts.length 접근이 TypeError → 에디터 크래시.
      // 로드/import 는 모두 이 정규화를 거치므로 여기서 누락 배열을 [] 로 백필해 방어한다.
      outline: Array.isArray(chapter.outline) ? chapter.outline : [],
      memoryAnchors: Array.isArray(chapter.memoryAnchors) ? chapter.memoryAnchors : [],
      newCanonFacts: Array.isArray(chapter.newCanonFacts) ? chapter.newCanonFacts : [],
      beats: Array.isArray(chapter.beats)
        ? chapter.beats.map((beat) => ({
            ...beat,
            tension: typeof beat.tension === 'number' && Number.isFinite(beat.tension)
              ? beat.tension
              : DEFAULT_BEAT_TENSION
          }))
        : []
    }))
  };

  if (project.title !== '달의 문서고' && project.id !== 'moon-archive') {
    return normalizedProject;
  }

  return {
    ...normalizedProject,
    id: 'sample-project',
    title: '샘플 작품',
    chapters: normalizedProject.chapters.map((chapter) => ({
      ...chapter,
      outline: chapter.outline.map((line) => line.replace(/^달의 문서고\s+/, ''))
    }))
  };
}

// 온보딩 중간 입력(매체 선택~작품 헌장)을 작품 생성 전에도 영속한다.
// 작품(SeriesProject)이 아직 없는 단계라 project 필드가 아니라 독립 키에 저장한다(영속 보강 Part 2).
const onboardingKey = 'serial-story-studio/onboarding';

export interface OnboardingPersonaLineupEntry {
  id: string;
  label: string;
  tone: string;
  category: string;
  isFictionalized: boolean;
}

export interface OnboardingDraft {
  schema: 'storyx/onboarding/v1';
  medium: CreativeMedium;
  format: CreativeFormat;
  homeFlowStep: HomeFlowStep;
  intakeAnswers: Record<string, string>;
  intakeOtherAnswers: Record<string, string>;
  interviewNote: string;
  freewriteText: string;
  intakeQuestionIndex: number;
  contractLengthClass: ContractLengthClass;
  contractPlannedEpisodes: number;
  contractEnding: string;
  contractCost: string;
  contractSpine: StorySpine;
  // LLM 인터뷰 캐시 — 복원 시 codex 재호출을 막아 비용·시간을 아끼고 질문을 고정한다.
  llmIntakeQuestions: ProjectIntakeQuestion[] | null;
  interviewPersonaLineup: OnboardingPersonaLineupEntry[];
  interviewFallbackReason: string | null;
  // PLAY-first 시드 캐시 — playseed 단계 복원 시 requestDiveSetup 재호출 없이 제안을 유지한다.
  playSetup?: DiveSetup | null;
}

export function serializeOnboardingDraft(draft: OnboardingDraft): string {
  return JSON.stringify(draft);
}

// 저장본을 안전하게 복원한다. 손상·구버전 스키마는 null, 누락 필드는 기본값으로 백필(normalizeProject 패턴).
export function parseOnboardingDraft(raw: string | null): OnboardingDraft | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.schema !== 'storyx/onboarding/v1') {
    return null;
  }

  const lengthClass: ContractLengthClass = parsed.contractLengthClass === 'short' ? 'short' : 'long';
  const spine = isRecord(parsed.contractSpine) ? parsed.contractSpine : {};

  return {
    schema: 'storyx/onboarding/v1',
    medium: isCreativeMedium(parsed.medium) ? parsed.medium : 'novel',
    format: typeof parsed.format === 'string' ? (parsed.format as CreativeFormat) : 'long-novel',
    homeFlowStep: isHomeFlowStep(parsed.homeFlowStep) ? parsed.homeFlowStep : 'medium',
    intakeAnswers: isStringRecord(parsed.intakeAnswers) ? parsed.intakeAnswers : {},
    intakeOtherAnswers: isStringRecord(parsed.intakeOtherAnswers) ? parsed.intakeOtherAnswers : {},
    interviewNote: typeof parsed.interviewNote === 'string' ? parsed.interviewNote : '',
    freewriteText: typeof parsed.freewriteText === 'string' ? parsed.freewriteText : '',
    intakeQuestionIndex:
      typeof parsed.intakeQuestionIndex === 'number' && Number.isFinite(parsed.intakeQuestionIndex)
        ? parsed.intakeQuestionIndex
        : 0,
    contractLengthClass: lengthClass,
    contractPlannedEpisodes:
      typeof parsed.contractPlannedEpisodes === 'number' && Number.isFinite(parsed.contractPlannedEpisodes)
        ? parsed.contractPlannedEpisodes
        : defaultPlannedEpisodes(lengthClass),
    contractEnding: typeof parsed.contractEnding === 'string' ? parsed.contractEnding : '',
    contractCost: typeof parsed.contractCost === 'string' ? parsed.contractCost : '',
    contractSpine: {
      desire: typeof spine.desire === 'string' ? spine.desire : '',
      advance: typeof spine.advance === 'string' ? spine.advance : '',
      obstacle: typeof spine.obstacle === 'string' ? spine.obstacle : '',
      resolution: typeof spine.resolution === 'string' ? spine.resolution : ''
    },
    llmIntakeQuestions: Array.isArray(parsed.llmIntakeQuestions)
      ? (parsed.llmIntakeQuestions as ProjectIntakeQuestion[])
      : null,
    interviewPersonaLineup: Array.isArray(parsed.interviewPersonaLineup)
      ? (parsed.interviewPersonaLineup as OnboardingPersonaLineupEntry[])
      : [],
    interviewFallbackReason: typeof parsed.interviewFallbackReason === 'string' ? parsed.interviewFallbackReason : null,
    playSetup: isRecord(parsed.playSetup) ? (parsed.playSetup as unknown as DiveSetup) : null
  };
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  try {
    window.localStorage.setItem(onboardingKey, serializeOnboardingDraft(draft));
  } catch {
    // 용량 초과 등은 무시 — 온보딩 입력 영속은 best-effort.
  }
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  try {
    return parseOnboardingDraft(window.localStorage.getItem(onboardingKey));
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(): void {
  try {
    window.localStorage.removeItem(onboardingKey);
  } catch {
    // 무시
  }
}

// 빈 온보딩(매체 단계에 머문 채 입력 없음)은 영속하지 않는다 — 신규 사용자의 랜딩 진입을 가로채지 않기 위함.
export function hasMeaningfulOnboardingInput(draft: OnboardingDraft): boolean {
  return (
    draft.homeFlowStep !== 'medium' ||
    draft.freewriteText.trim().length > 0 ||
    draft.interviewNote.trim().length > 0 ||
    Object.keys(draft.intakeAnswers).length > 0 ||
    Object.keys(draft.intakeOtherAnswers).length > 0 ||
    draft.contractEnding.trim().length > 0 ||
    draft.contractCost.trim().length > 0 ||
    draft.contractSpine.desire.trim().length > 0 ||
    draft.contractSpine.advance.trim().length > 0 ||
    draft.contractSpine.obstacle.trim().length > 0 ||
    draft.contractSpine.resolution.trim().length > 0
  );
}

// Dive X 활성 연대기(채팅 세션 + 작품)를 작업 중에도 영속한다.
// 순수 함수(serialize/parse)는 window 에 접근하지 않는다.
const diveKey = 'serial-story-studio/dive';

export interface DiveState {
  schema: 'storyx/dive/v1';
  session: DiveSession;
  project: SeriesProject;
}

export function serializeDiveState(state: DiveState): string {
  return JSON.stringify(state);
}

export function parseDiveState(raw: string | null): DiveState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<DiveState>;
    if (!value || value.schema !== 'storyx/dive/v1' || !value.session || !value.project) {
      return null;
    }
    return {
      schema: 'storyx/dive/v1',
      session: value.session as DiveSession,
      project: normalizeProject(value.project as SeriesProject)
    };
  } catch {
    return null;
  }
}

export function saveDiveState(state: DiveState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(diveKey, serializeDiveState(state));
}

export function loadDiveState(): DiveState | null {
  if (typeof window === 'undefined') return null;
  return parseDiveState(window.localStorage.getItem(diveKey));
}

export function clearDiveState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(diveKey);
}

// PLAN staged — 설계실 패치 목록 영속(spec 2026-07-04). 본편(storageKey)과 분리된 수정 목록.
const planStageKey = 'serial-story-studio/plan-stage';

export function loadPlanPatches(): PlanPatch[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(planStageKey);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as PlanPatch[]) : [];
  } catch {
    return [];
  }
}

export function savePlanPatches(patches: PlanPatch[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(planStageKey, JSON.stringify(patches));
}

export function clearPlanPatches(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(planStageKey);
}

// PLAN 설계 대화 버퍼 — syncVersion remount·새로고침 생존(spec 2026-07-07). 패치(plan-stage)와 별개 키.
const planChatKey = 'serial-story-studio/plan-chat';
const PLAN_CHAT_MAX_MESSAGES = 40;

export interface PlanChatState {
  schema: 'storyx/plan-chat/v1';
  messages: PlanChatMessage[];
}

export function loadPlanChatMessages(): PlanChatMessage[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(planChatKey);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as Partial<PlanChatState>;
    if (!value || value.schema !== 'storyx/plan-chat/v1' || !Array.isArray(value.messages)) return [];
    return value.messages as PlanChatMessage[];
  } catch {
    return [];
  }
}

export function savePlanChatMessages(messages: PlanChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const state: PlanChatState = {
    schema: 'storyx/plan-chat/v1',
    messages: messages.slice(-PLAN_CHAT_MAX_MESSAGES)
  };
  window.localStorage.setItem(planChatKey, JSON.stringify(state));
}

export function clearPlanChatMessages(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(planChatKey);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}

function isCreativeMedium(value: unknown): value is CreativeMedium {
  return (
    value === 'novel' || value === 'essay' || value === 'audiobook' || value === 'comics' || value === 'academic'
  );
}

function isHomeFlowStep(value: unknown): value is HomeFlowStep {
  return (
    value === 'medium' ||
    value === 'freewrite' ||
    value === 'intake' ||
    value === 'charter' ||
    value === 'building'
  );
}
