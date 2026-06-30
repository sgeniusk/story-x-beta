// 장편 연재가 길어져도 캐논·인물·세계가 무너지지 않고, 생성 컨텍스트가 예산 안에 머무는지 검증한다
import { describe, expect, it } from 'vitest';
import { buildProjectContextDigest, createSeedProject, produceNextChapter } from './storyEngine';
import type { CanonFact, SeriesProject } from './storyEngine';
import { normalizeProject } from './storage';

// P13 이후 폴백(produceNextChapter)은 캐논을 발명하지 않으므로, LLM 경로가 회차마다
// 캐논을 채우는 장편을 명시적 픽스처로 시뮬레이션한다(회차당 2건 — 이전 폴백 주조량과 동일).
function chapterCanon(episode: number): CanonFact[] {
  return [
    { id: `canon-fixture-${episode}-a`, episode, owner: 'plot', statement: `${episode}화에서 단서 ${episode}-a 가 확정됐다.` },
    { id: `canon-fixture-${episode}-b`, episode, owner: 'world', statement: `${episode}화에서 규칙 ${episode}-b 의 비용이 드러났다.` }
  ];
}

function runChapters(count: number): SeriesProject {
  let project = createSeedProject();
  for (let episode = 1; episode <= count; episode += 1) {
    const result = produceNextChapter(project, {
      genre: project.genre,
      intent: `${episode}화 핵심 사건`,
      pressure: '낮은 감정선에서 시작해 마지막에 큰 반전을 둔다'
    });
    expect(result.chapter.episode).toBe(episode);
    const facts = chapterCanon(episode);
    result.updatedProject = {
      ...result.updatedProject,
      canonFacts: [...result.updatedProject.canonFacts, ...facts],
      chapters: result.updatedProject.chapters.map((chapter, index, all) =>
        index === all.length - 1 ? { ...chapter, newCanonFacts: facts } : chapter
      )
    };
    project = result.updatedProject;
  }
  return project;
}

describe('longform continuity', () => {
  it('keeps canon, characters, and world stable across 10 produced chapters', () => {
    const seed = createSeedProject();
    const seedCanonCount = seed.canonFacts.length;
    const seedCharacterIds = seed.characters.map((character) => character.id);
    const seedWorldIds = seed.worldRules.map((rule) => rule.id);

    const project = runChapters(10);

    expect(project.currentEpisode).toBe(10);
    expect(project.chapters.map((chapter) => chapter.episode)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(project.canonFacts.length).toBeGreaterThan(seedCanonCount);
    expect(project.characters.map((character) => character.id)).toEqual(seedCharacterIds);
    expect(project.worldRules.map((rule) => rule.id)).toEqual(seedWorldIds);

    const canonIds = project.canonFacts.map((fact) => fact.id);
    expect(new Set(canonIds).size).toBe(canonIds.length);
  });

  // MVP-0(중요도 검색): digest 절단이 head/tail 이 아니라 중요도 가중이라,
  // 위치와 무관하게 앵커 캐논은 살아남는다 — A-6(중반 캐논 소실)의 직접 회귀.
  it('keeps the generation context digest bounded and never truncates anchor canon (A-6)', () => {
    const raw = runChapters(30);
    expect(raw.canonFacts.length).toBeGreaterThan(40);

    // 정확히 '중간'에 있는 캐논을 앵커로 표시한다. 옛 head/tail 로직은 중간을 버려 소실시켰다.
    const midIndex = Math.floor(raw.canonFacts.length / 2);
    const midFact = raw.canonFacts[midIndex];
    const project = normalizeProject({
      ...raw,
      canonFacts: raw.canonFacts.map((fact, index) =>
        index === midIndex ? { ...fact, alwaysInclude: true } : fact
      )
    });

    const digest = buildProjectContextDigest(project);
    const canonLines = digest.split('\n').filter((line) => line.startsWith('- ['));

    expect(canonLines.length).toBeLessThanOrEqual(40);
    expect(digest).toContain('생략');
    // 앵커로 표시된 중간 캐논이 절단을 뚫고 살아남는다(옛 로직은 실패하던 케이스).
    expect(digest).toContain(midFact.statement);
  });

  it('always carries the story contract, even before any chapter exists', () => {
    const digest = buildProjectContextDigest(createSeedProject());
    expect(digest).toContain('작품 계약');
    expect(digest).toContain('심층 질문');
    expect(digest).toContain('무게중심');
    expect(digest).not.toContain('지금까지');
  });
});
