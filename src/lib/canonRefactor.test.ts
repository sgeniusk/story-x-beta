import { describe, expect, it } from 'vitest';

import { buildCanonRefactorPlan, createCanonChangeEntry, revertCanonChange } from './canonRefactor';
import { applyContractAmendment, createEmptyProject, createSeedProject, produceNextChapter, type StoryContract } from './storyEngine';

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

describe('revertCanonChange (베타테스트 #1-undo)', () => {
  it('character/world/story-core 편집을 식별자로 before(최초 원본) 복원, 식별자 없으면 무변경', () => {
    const project = projectWithEpisode();
    const character = project.characters[0];
    const rule = project.worldRules[0];

    // character — targetId + revertField 로 정확 복원(이름 역매핑 불필요)
    const cEdited = {
      ...project,
      characters: project.characters.map((c) => (c.id === character.id ? { ...c, desire: '바뀐 욕망' } : c))
    };
    const cChange = createCanonChangeEntry({
      kind: 'character', targetId: character.id, revertField: 'desire',
      targetLabel: character.name, fieldLabel: '욕망', before: character.desire, after: '바뀐 욕망', origin: 'manual-bible-edit'
    });
    expect(revertCanonChange(cEdited, cChange).characters.find((c) => c.id === character.id)?.desire).toBe(character.desire);

    // world
    const wEdited = {
      ...project,
      worldRules: project.worldRules.map((r) => (r.id === rule.id ? { ...r, rule: '바뀐 규칙' } : r))
    };
    const wChange = createCanonChangeEntry({
      kind: 'world', targetId: rule.id, targetLabel: rule.title, fieldLabel: '규칙과 비용', before: rule.rule, after: '바뀐 규칙', origin: 'manual-bible-edit'
    });
    expect(revertCanonChange(wEdited, wChange).worldRules.find((r) => r.id === rule.id)?.rule).toBe(rule.rule);

    // story-core (project 직속 필드)
    const sChange = createCanonChangeEntry({
      kind: 'story-core', revertField: 'logline', targetLabel: project.title, fieldLabel: '로그라인', before: project.logline, after: 'Y', origin: 'manual-bible-edit'
    });
    expect(revertCanonChange({ ...project, logline: 'Y' }, sChange).logline).toBe(project.logline);

    // 식별자(targetId·revertField) 없으면 참조 그대로(무변경)
    const bad = createCanonChangeEntry({
      kind: 'character', targetLabel: '?', fieldLabel: '욕망', before: 'a', after: 'b', origin: 'manual-bible-edit'
    });
    expect(revertCanonChange(project, bad)).toBe(project);
  });

  it('story-core storyContract 개정은 before(직전 헌장 JSON)를 객체로 복원한다(중첩 spine, #7)', () => {
    const baseContract: StoryContract = {
      lengthClass: 'long',
      plannedEpisodes: 30,
      spine: { desire: '욕망', advance: '전진', obstacle: '시련', resolution: '변화' },
      endingStatement: '끝',
      protagonistCost: '대가',
      beatSheet: [],
      spineLocked: true,
      amendments: []
    };
    const project = { ...createEmptyProject(), storyContract: baseContract };
    const amended = applyContractAmendment(baseContract, {
      reason: '욕망 구체화',
      at: '2026-06-14T09:00:00.000Z',
      patch: { spine: { desire: '아버지의 이름을 되찾고 싶다' } }
    });
    const change = createCanonChangeEntry({
      kind: 'story-core', revertField: 'storyContract',
      targetLabel: project.title, fieldLabel: '작품 헌장',
      before: JSON.stringify(baseContract), after: JSON.stringify(amended), origin: 'manual-bible-edit'
    });
    const reverted = revertCanonChange({ ...project, storyContract: amended }, change);
    // 문자열이 아니라 객체로 복원돼야 한다(평면 대입이면 storyContract 에 JSON 문자열이 들어가 깨진다).
    expect(reverted.storyContract).toEqual(baseContract);
  });

  it('story-core storyContract revert — 손상된 before(JSON 아님)는 무변경(안전 실패)', () => {
    const project = {
      ...createEmptyProject(),
      storyContract: {
        lengthClass: 'long' as const, plannedEpisodes: 30, endingStatement: '끝', protagonistCost: '대가',
        beatSheet: [], spineLocked: true, amendments: []
      }
    };
    const change = createCanonChangeEntry({
      kind: 'story-core', revertField: 'storyContract',
      targetLabel: project.title, fieldLabel: '작품 헌장',
      before: 'not-json{', after: '{}', origin: 'manual-bible-edit'
    });
    expect(revertCanonChange(project, change)).toBe(project);
  });
});
