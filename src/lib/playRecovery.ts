import {
  buildTranscript,
  captureCondenseSourceSpan,
  selectCondenseSpan,
  type CondenseSourceSpan,
  type DiveSession
} from './diveSession';
import {
  chapterFromDraftPayload,
  nextEpisodeNumber,
  type Chapter,
  type SeriesProject
} from './storyEngine';
import { countPendingSync, type PendingSync } from './syncConsole';

export interface PlayRecoverySnapshot {
  schema: 'storyx/play-recovery/v1';
  projectId: string;
  projectTitle: string;
  episode: number;
  scene: string;
  transcript: string;
  /** 응결 시작 순간에 고정한 미소비 PLAY source. 구버전 스냅샷은 undefined. */
  sourceSpan?: CondenseSourceSpan;
  /** 생성 시작 시 실제 응결 payload에 포함된 마지막 turn. 구버전 스냅샷은 undefined. */
  condensedThroughTurn?: number;
  capturedAt: string;
}

export interface PlayRecoveryWorkDraft {
  schema: 'storyx/play-recovery-work-draft/v1';
  id: string;
  projectId: string;
  generationId?: string;
  episodeHint: number;
  title: string;
  body: string;
  source: PlayRecoverySnapshot;
  /** 회차 저장 전에 먼저 영속하는 write-ahead marker. 부분 성공 재시도에서 중복 회차를 막는다. */
  commitIntent?: {
    chapterId: string;
    chapterTitle: string;
    requestedAt: string;
  };
  /** 구 P0-b가 만든 시스템 회차 제거가 receipt 저장보다 먼저 끝나도 재개할 수 있게 하는 marker. */
  legacyRepair?: {
    chapterId: string;
    startedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** 빈 자동 생성 작업본은 프로젝트 기본 재개를 가로채지 않는다. */
export function shouldResumePlayRecoveryWorkDraft(
  draft: PlayRecoveryWorkDraft | null | undefined
): boolean {
  return Boolean(draft && (
    draft.title.trim() ||
    draft.body.trim() ||
    draft.commitIntent ||
    draft.legacyRepair
  ));
}

export type PlayRecoveryCommitPlan =
  | { status: 'project-mismatch' }
  | { status: 'empty-body' }
  | { status: 'pending-sync'; pending: PendingSync }
  | {
      status: 'ready';
      committedProject: SeriesProject;
      workingProject?: SeriesProject;
      chapter: Chapter;
    };

export interface LegacyPlayRecoveryRepair {
  updatedProject: SeriesProject;
  removedChapter: Chapter;
}

export type PlayRecoveryCommitIntentInspection =
  | { status: 'none' }
  | { status: 'prepared' }
  | { status: 'conflict' }
  | { status: 'committed'; chapter: Chapter };

export function buildPlayRecoverySnapshot(
  session: DiveSession,
  project: SeriesProject,
  capturedAt = new Date().toISOString()
): PlayRecoverySnapshot {
  const sourceSpan = captureCondenseSourceSpan(session);
  const { condense } = selectCondenseSpan(session);
  return {
    schema: 'storyx/play-recovery/v1',
    projectId: project.id,
    projectTitle: project.title,
    episode: nextEpisodeNumber(project),
    scene: session.scene?.trim() ?? '',
    // 차단 턴을 포함한 이번 미소비 source 원문만 보존한다.
    // 이미 작품화된 연결 tail은 PLAY에 남아도 recovery에서 다시 반출하지 않는다.
    transcript: buildTranscript(condense),
    sourceSpan,
    condensedThroughTurn: sourceSpan.throughTurn,
    capturedAt
  };
}

export function formatPlayRecoveryText(snapshot: PlayRecoverySnapshot): string {
  const transcript = snapshot.transcript.trim() || '(대화 기록 없음)';
  return [
    'Story X PLAY 기록 복구본',
    `작품: ${snapshot.projectTitle}`,
    `응결 시도: ${snapshot.episode}화`,
    `장면: ${snapshot.scene.trim() || '미지정'}`,
    `보존 시각: ${snapshot.capturedAt}`,
    '',
    '※ 생성 결과가 아닌 PLAY 원문입니다. 캐논에 자동 반영되지 않습니다.',
    '',
    '--- PLAY 원문 ---',
    transcript
  ].join('\n');
}

function safeFilenamePart(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\\/:?*"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || 'untitled';
}

export function buildPlayRecoveryFilename(snapshot: PlayRecoverySnapshot): string {
  return `storyx-${safeFilenamePart(snapshot.projectTitle)}-${snapshot.episode}화-play-record.txt`;
}

function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function buildPlayRecoveryWorkDraftId(
  snapshot: PlayRecoverySnapshot,
  generationId?: string
): string {
  const identity = generationId?.trim() || [
    snapshot.projectId,
    snapshot.episode,
    snapshot.capturedAt,
    snapshot.transcript
  ].join('\u001f');
  return `play-recovery-${hashText(identity)}`;
}

export function createPlayRecoveryWorkDraft(
  snapshot: PlayRecoverySnapshot,
  generationId?: string,
  openedAt = new Date().toISOString()
): PlayRecoveryWorkDraft {
  return {
    schema: 'storyx/play-recovery-work-draft/v1',
    id: buildPlayRecoveryWorkDraftId(snapshot, generationId),
    projectId: snapshot.projectId,
    generationId: generationId?.trim() || undefined,
    episodeHint: snapshot.episode,
    title: '',
    body: '',
    source: snapshot,
    createdAt: openedAt,
    updatedAt: openedAt
  };
}

export function planPlayRecoveryCommit(
  committed: SeriesProject,
  working: SeriesProject | null | undefined,
  draft: PlayRecoveryWorkDraft
): PlayRecoveryCommitPlan {
  if (
    committed.id !== draft.projectId ||
    draft.source.projectId !== draft.projectId ||
    (working && working.id !== committed.id)
  ) {
    return { status: 'project-mismatch' };
  }

  if (!draft.body.trim()) return { status: 'empty-body' };

  const pending = countPendingSync(working, committed);
  if (pending.total > 0) return { status: 'pending-sync', pending };

  const recovered = chapterFromDraftPayload(
    committed,
    {
      title: draft.title.trim(),
      hook: '',
      outline: [],
      beats: [],
      prose: draft.body,
      newCanonFacts: []
    },
    // 복구 작업본 저장은 캐논·성장 승인이 아니다. 본문만 정식 회차에 옮긴다.
    { genre: committed.genre, intent: '', pressure: '' }
  );

  return {
    status: 'ready',
    committedProject: recovered.updatedProject,
    workingProject: working ? recovered.updatedProject : undefined,
    chapter: recovered.chapter
  };
}

export function preparePlayRecoveryCommitIntent(
  draft: PlayRecoveryWorkDraft,
  chapter: Chapter,
  requestedAt = new Date().toISOString()
): PlayRecoveryWorkDraft {
  if (
    draft.commitIntent?.chapterId === chapter.id &&
    draft.commitIntent.chapterTitle === chapter.title
  ) {
    return draft;
  }
  return {
    ...draft,
    commitIntent: {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      requestedAt
    }
  };
}

export function inspectPlayRecoveryCommitIntent(
  project: SeriesProject,
  draft: PlayRecoveryWorkDraft
): PlayRecoveryCommitIntentInspection {
  const intent = draft.commitIntent;
  if (!intent) return { status: 'none' };
  const chapter = project.chapters.find((candidate) => candidate.id === intent.chapterId);
  if (!chapter) return { status: 'prepared' };
  const matchesPreparedChapter =
    chapter.title === intent.chapterTitle &&
    chapter.prose === draft.body &&
    chapter.hook === '' &&
    chapter.locked !== true &&
    hasNoEntries(chapter.outline) &&
    hasNoEntries(chapter.beats) &&
    hasNoEntries(chapter.newCanonFacts) &&
    hasNoEntries(chapter.rewardArc) &&
    hasNoEntries(chapter.stakesLedger);
  return matchesPreparedChapter
    ? { status: 'committed', chapter }
    : { status: 'conflict' };
}

function hasNoEntries(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

/**
 * P0-b 초기 구현이 PLAY TXT 전체를 Chapter로 넣었던 오염만 엄격하게 식별해 제거한다.
 * 한 글자 편집·잠금·후속 회차·구조/캐논 추가가 있으면 사용자 원고로 간주한다.
 */
export function repairLegacyPlayRecoveryChapter(
  project: SeriesProject,
  snapshot: PlayRecoverySnapshot,
  recoveredChapterId: string
): LegacyPlayRecoveryRepair | null {
  if (project.id !== snapshot.projectId || !recoveredChapterId) return null;
  const chapter = project.chapters.find((candidate) => candidate.id === recoveredChapterId);
  const latest = project.chapters[project.chapters.length - 1];
  if (!chapter || latest?.id !== chapter.id) return null;
  if (project.currentEpisode !== chapter.episode || chapter.episode !== snapshot.episode) return null;
  if (chapter.locked === true) return null;
  if (chapter.title !== `PLAY 기록 복구본 · 당시 ${snapshot.episode}화`) return null;
  if (chapter.hook !== '응결 실패 뒤 보존한 PLAY 원문') return null;
  if (chapter.prose !== formatPlayRecoveryText(snapshot)) return null;
  if (
    !hasNoEntries(chapter.outline) ||
    !hasNoEntries(chapter.beats) ||
    !hasNoEntries(chapter.newCanonFacts) ||
    !hasNoEntries(chapter.rewardArc) ||
    !hasNoEntries(chapter.stakesLedger)
  ) return null;

  const chapters = project.chapters.filter((candidate) => candidate.id !== chapter.id);
  const currentEpisode = chapters.length > 0
    ? chapters.reduce((max, candidate) => Math.max(max, candidate.episode), 0)
    : Math.max(0, chapter.episode - 1);
  return {
    removedChapter: chapter,
    updatedProject: { ...project, chapters, currentEpisode }
  };
}
