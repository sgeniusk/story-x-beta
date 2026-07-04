// 현재 작품에서 PLAY 세션을 이어 시딩하는 순수 로직 — 인물·최근 회차 기반
import type { Chapter, SeriesProject } from './storyEngine';
import { FALLBACK_EMPTY_LINE } from './storyEngine';
import type { DiveState } from './storage';
import { createDiveSession } from './diveSession';

const CONTINUATION_PREFIX = '직전 회차 이후 — ';

/** 최근 회차에서 "직전에 무슨 일이 있었나"를 잇는 시작 장면. 원고 마지막 문단 > 마지막 beat 요약 > hook. */
export function deriveContinuationScene(chapter: Chapter): string {
  const prose = chapter.prose?.trim();
  if (prose && prose !== FALLBACK_EMPTY_LINE) {
    const paragraphs = prose
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && p !== FALLBACK_EMPTY_LINE);
    const tail = paragraphs[paragraphs.length - 1];
    if (tail) return CONTINUATION_PREFIX + tail;
  }
  const lastBeat = chapter.beats?.[chapter.beats.length - 1];
  if (lastBeat?.summary?.trim()) return CONTINUATION_PREFIX + lastBeat.summary.trim();
  const hook = chapter.hook?.trim();
  if (hook) return CONTINUATION_PREFIX + hook;
  return '';
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
