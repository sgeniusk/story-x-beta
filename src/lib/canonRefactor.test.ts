import { describe, expect, it } from 'vitest';

import { buildCanonRefactorPlan, createCanonChangeEntry } from './canonRefactor';
import { createSeedProject, produceNextChapter } from './storyEngine';

function projectWithEpisode() {
  const seed = createSeedProject();

  return produceNextChapter(seed, {
    genre: seed.genre,
    intent: '주인공이 금지된 탑에서 사라진 오빠의 흔적을 발견한다',
    pressure: '오해가 풀리는 대신 세계 규칙의 더 큰 대가가 드러난다'
  }).updatedProject;
}

describe('canon refactor planning', () => {
  it('routes character edits through character and continuity review', () => {
    const project = projectWithEpisode();
    const character = project.characters[0];
    const change = createCanonChangeEntry({
      kind: 'character',
      targetLabel: character.name,
      fieldLabel: '욕망',
      before: character.desire,
      after: '사라진 가족을 찾되 더 이상 누구도 희생시키지 않는다',
      origin: 'manual-bible-edit'
    });
    const plan = buildCanonRefactorPlan(project, [change]);

    expect(plan.status).toBe('needs-review');
    expect(plan.reviewOrder.map((item) => item.agentId)).toEqual(
      expect.arrayContaining(['character-custodian', 'continuity-editor'])
    );
    expect(plan.affectedChapters.length).toBeGreaterThan(0);
    expect(plan.recommendations.join(' ')).toContain('인물');
  });

  it('marks empty canonical edits as blocked instead of hiding the conflict', () => {
    const project = projectWithEpisode();
    const change = createCanonChangeEntry({
      kind: 'world',
      targetLabel: project.worldRules[0].title,
      fieldLabel: '규칙과 비용',
      before: project.worldRules[0].rule,
      after: '',
      origin: 'manual-bible-edit'
    });
    const plan = buildCanonRefactorPlan(project, [change]);

    expect(plan.status).toBe('blocked');
    expect(plan.conflictWarnings.join(' ')).toContain('비어 있습니다');
    expect(plan.reviewOrder.map((item) => item.agentId)).toContain('world-keeper');
  });

  it('keeps a clear state when no changes are waiting', () => {
    const plan = buildCanonRefactorPlan(createSeedProject(), []);

    expect(plan.status).toBe('clear');
    expect(plan.summary).toContain('대기 중인 변경');
    expect(plan.reviewOrder).toHaveLength(0);
  });
});
