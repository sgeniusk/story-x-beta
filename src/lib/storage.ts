import { createSeedProject, type SeriesProject } from './storyEngine';

const storageKey = 'serial-story-studio/project';

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

function normalizeProject(project: SeriesProject): SeriesProject {
  if (project.title !== '달의 문서고' && project.id !== 'moon-archive') {
    return project;
  }

  return {
    ...project,
    id: 'sample-project',
    title: '샘플 작품',
    chapters: project.chapters.map((chapter) => ({
      ...chapter,
      outline: chapter.outline.map((beat) => beat.replace(/^달의 문서고\s+/, ''))
    }))
  };
}
