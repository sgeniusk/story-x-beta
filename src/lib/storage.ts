// 작품 프로젝트와 버전 스냅샷을 브라우저 localStorage에 저장·복원한다
import {
  createSeedProject,
  DEFAULT_BEAT_TENSION,
  type BibleSection,
  type CanonEntity,
  type CharacterProfile,
  type SeriesProject,
  type TimelineEntry
} from './storyEngine';
import { getProjectLocalization } from './localization';
import { loadEvolutionHistory, replaceEvolutionHistory, type EvolutionHistory } from './evolutionMemory';

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
  const normalizedProject = {
    ...project,
    localization: getProjectLocalization(project),
    deepQuestion: typeof project.deepQuestion === 'string' ? project.deepQuestion : '',
    creativeWeight: project.creativeWeight ?? 'balanced',
    formIntent: typeof project.formIntent === 'string' ? project.formIntent : '',
    nextEpisodeIntent: typeof project.nextEpisodeIntent === 'string' ? project.nextEpisodeIntent : '',
    characters: Array.isArray(project.characters)
      ? project.characters.map((character): CharacterProfile => ({
          ...character,
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
