import { buildTranscript, type DiveSession } from './diveSession';
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
  capturedAt: string;
}

export interface PlayRecoveryDraftResult {
  updatedProject: SeriesProject;
  chapter: Chapter;
  created: boolean;
}

export type PlayRecoveryWritePlan =
  | { status: 'project-mismatch' }
  | { status: 'pending-sync'; pending: PendingSync }
  | {
      status: 'ready';
      committedProject: SeriesProject;
      workingProject?: SeriesProject;
      chapter: Chapter;
      created: boolean;
    };

export function buildPlayRecoverySnapshot(
  session: DiveSession,
  project: SeriesProject,
  capturedAt = new Date().toISOString()
): PlayRecoverySnapshot {
  return {
    schema: 'storyx/play-recovery/v1',
    projectId: project.id,
    projectTitle: project.title,
    episode: nextEpisodeNumber(project),
    scene: session.scene?.trim() ?? '',
    // 복구는 응결 후보가 아니라 사용자 기록 보존이다. 최근 턴·캐논 차단 턴까지 전부 남긴다.
    transcript: buildTranscript(session.chatBuffer),
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

export function recoverPlaySnapshotToDraft(
  project: SeriesProject,
  snapshot: PlayRecoverySnapshot
): PlayRecoveryDraftResult | null {
  if (project.id !== snapshot.projectId) return null;

  const prose = formatPlayRecoveryText(snapshot);
  const title = `PLAY 기록 복구본 · 당시 ${snapshot.episode}화`;
  const existing = project.chapters.find((chapter) => chapter.title === title && chapter.prose === prose);
  if (existing) {
    return { updatedProject: project, chapter: existing, created: false };
  }

  const result = chapterFromDraftPayload(
    project,
    {
      title,
      hook: '응결 실패 뒤 보존한 PLAY 원문',
      outline: [],
      beats: [],
      prose,
      newCanonFacts: []
    },
    // 빈 intent/pressure는 인물 성장 상태를 자동 갱신하지 않는다. 복구와 캐논·성장 승인을 분리한다.
    { genre: project.genre, intent: '', pressure: '' }
  );
  return { updatedProject: result.updatedProject, chapter: result.chapter, created: true };
}

export function planPlayRecoveryWrite(
  committed: SeriesProject,
  working: SeriesProject | null | undefined,
  snapshot: PlayRecoverySnapshot
): PlayRecoveryWritePlan {
  if (committed.id !== snapshot.projectId || (working && working.id !== committed.id)) {
    return { status: 'project-mismatch' };
  }

  const pending = countPendingSync(working, committed);
  if (pending.total > 0) return { status: 'pending-sync', pending };

  const recovered = recoverPlaySnapshotToDraft(committed, snapshot);
  if (!recovered) return { status: 'project-mismatch' };

  return {
    status: 'ready',
    committedProject: recovered.updatedProject,
    // 미반영 회차·캐논이 없을 때만 작업본을 본편과 같은 복구 스냅샷으로 교체한다.
    // session은 App이 그대로 보존하므로 PLAY 대화와 장면은 사라지지 않는다.
    workingProject: working ? recovered.updatedProject : undefined,
    chapter: recovered.chapter,
    created: recovered.created
  };
}
