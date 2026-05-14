import { describe, expect, it } from 'vitest';

import { buildMockAiCliReviewResult } from './aiCliHarness';
import { buildAlphaReadinessReport } from './alphaReadiness';
import { buildCanonRefactorPlan } from './canonRefactor';
import { buildMemoryApprovalQueue, buildStoryMemoryBank } from './memoryBank';
import { buildCreativeBlueprint } from './projectBlueprint';
import { buildPublishingPlan } from './publishing';
import { createSeedProject, produceNextChapter } from './storyEngine';

describe('Story X alpha readiness', () => {
  it('blocks alpha release when the project has no draft artifact yet', () => {
    const project = createSeedProject();
    const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
    const memoryBank = buildStoryMemoryBank(project);
    const approvalQueue = buildMemoryApprovalQueue({ project });
    const publishingPlan = buildPublishingPlan(project, blueprint);
    const report = buildAlphaReadinessReport({
      project,
      blueprint,
      memoryBank,
      approvalQueue,
      canonRefactorPlan: buildCanonRefactorPlan(project, []),
      latestReviewResult: null,
      publishingPlan
    });

    expect(report.version).toBe('alpha-0.1');
    expect(report.status).toBe('blocked');
    expect(report.score).toBeLessThan(70);
    expect(report.gates.find((gate) => gate.id === 'draft-artifact')?.status).toBe('blocked');
    expect(report.nextActions[0]).toContain('초안');
  });

  it('keeps an reviewed draft in needs-review until memory candidates are approved', () => {
    const seed = createSeedProject();
    const project = produceNextChapter(seed, {
      genre: seed.genre,
      intent: '서윤이 금지된 탑에서 사라진 오빠의 흔적을 발견한다',
      pressure: '계약 조건이 오해를 풀면서 더 큰 위험을 만든다'
    }).updatedProject;
    const blueprint = buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' });
    const latestReviewResult = buildMockAiCliReviewResult(
      { provider: 'mock', mode: 'review', scale: 'standard', project },
      project.chapters[0].prose
    );
    const approvalQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: latestReviewResult.memoryCandidates
    });
    const report = buildAlphaReadinessReport({
      project,
      blueprint,
      memoryBank: buildStoryMemoryBank(project),
      approvalQueue,
      canonRefactorPlan: buildCanonRefactorPlan(project, []),
      latestReviewResult,
      publishingPlan: buildPublishingPlan(project, blueprint)
    });

    expect(report.status).toBe('needs-review');
    expect(report.gates.find((gate) => gate.id === 'review-loop')?.status).toBe('ready');
    expect(report.gates.find((gate) => gate.id === 'approval-queue')?.status).toBe('needs-review');
    expect(report.nextActions.join(' ')).toContain('승인');
  });
});
