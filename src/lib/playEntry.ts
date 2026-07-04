// 현재 작품에서 PLAY 세션을 이어 시딩하는 순수 로직 — 인물·최근 회차 기반
import type { Chapter, SeriesProject } from './storyEngine';
import type { DiveState } from './storage';
import { createDiveSession } from './diveSession';

const CONTINUATION_PREFIX = '직전 회차 이후 — ';

// Chapter 인터페이스에는 summary 필드가 없다(ChapterBeat 에만 있음). 최근 회차 요약이
// 있으면 우선 쓰되, 타입 안전을 위해 optional 로 확장해 접근한다.
type ChapterWithSummary = Chapter & { summary?: string };

/** 최근 회차에서 PLAY 시작 장면을 만든다. summary 우선, 없으면 prose 마지막 문단. */
export function deriveContinuationScene(chapter: ChapterWithSummary): string {
  const summary = chapter.summary?.trim();
  if (summary) return CONTINUATION_PREFIX + summary;
  const prose = chapter.prose?.trim();
  if (!prose) return '';
  const paragraphs = prose.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const tail = paragraphs[paragraphs.length - 1] ?? '';
  return tail ? CONTINUATION_PREFIX + tail : '';
}

/** 현재 작품(본편)에서 이어 플레이할 DiveState 를 만든다. 인물이 없으면 null. */
export function seedPlayFromProject(project: SeriesProject): DiveState | null {
  const primary = project.characters[0];
  if (!primary) return null;
  const session = createDiveSession(primary.id, project.id);
  const latest = project.chapters[project.chapters.length - 1];
  const scene = latest ? deriveContinuationScene(latest) : '';
  return {
    schema: 'storyx/dive/v1',
    session: scene ? { ...session, scene } : session,
    project
  };
}
