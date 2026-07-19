import type { Chapter } from './storyEngine';
import { safeTextFilenamePart } from './textFileExport';

export type ChapterTextExport =
  | { status: 'empty' }
  | { status: 'ready'; text: string };

/** 저장 debounce 전 live 본문을 손대지 않고 반출 가능 여부만 판정한다. */
export function prepareChapterTextExport(body: string): ChapterTextExport {
  if (!body.trim()) return { status: 'empty' };
  return { status: 'ready', text: body };
}

export function buildChapterTextFilename(
  projectTitle: string,
  chapter: Pick<Chapter, 'episode' | 'title'>
): string {
  const projectPart = safeTextFilenamePart(projectTitle);
  const chapterPart = safeTextFilenamePart(chapter.title, '제목-없음');
  return `storyx-${projectPart}-${chapter.episode}화-${chapterPart}.txt`;
}
