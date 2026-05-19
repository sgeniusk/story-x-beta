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

function normalizeProject(project: SeriesProject): SeriesProject {
  // 표면 약속/심층 질문/무게중심 도입 이전에 저장된 프로젝트를 위한 백필.
  // 회차 구성(beats) 도입 이전 회차에는 beats: []를 채우고, beat에 tension이 없으면 기본값으로 보정한다.
  // 데이터 모드(places·objects·events·timeline·bibleOutline)와 인물 relations 도입 이전 저장본도 함께 백필한다.
  const normalizedProject = {
    ...project,
    localization: getProjectLocalization(project),
    deepQuestion: typeof project.deepQuestion === 'string' ? project.deepQuestion : '',
    creativeWeight: project.creativeWeight ?? 'balanced',
    formIntent: typeof project.formIntent === 'string' ? project.formIntent : '',
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
