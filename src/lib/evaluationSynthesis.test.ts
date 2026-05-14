import { describe, expect, it } from 'vitest';

import { buildCreativeBlueprint } from './projectBlueprint';
import {
  buildTesterDrivenWorkflow,
  evaluationDrivenRoadmap,
  evaluationNorthStar,
  p0EvaluationCapabilities
} from './evaluationSynthesis';

describe('evaluation synthesis', () => {
  it('condenses the tester panel into a compact non-conflicting product direction', () => {
    expect(evaluationNorthStar).toContain('형태를 바꿔도');
    expect(p0EvaluationCapabilities.map((capability) => capability.id)).toEqual([
      'workflow-board',
      'story-contract',
      'refactor-impact-preview',
      'quality-gate-system',
      'reference-dna-cards',
      'ai-output-autopsy'
    ]);
    expect(p0EvaluationCapabilities.every((capability) => capability.ownerAgents.length > 0)).toBe(true);
    expect(p0EvaluationCapabilities.find((capability) => capability.id === 'reference-dna-cards')?.guardrail).toContain(
      '표면 모방 금지'
    );
  });

  it('builds medium-specific workflow boards from tester feedback', () => {
    const comicsBoard = buildTesterDrivenWorkflow(
      buildCreativeBlueprint({ medium: 'comics', format: 'insta-toon' })
    );
    const audioBoard = buildTesterDrivenWorkflow(
      buildCreativeBlueprint({ medium: 'audiobook', format: 'educational-video' })
    );

    expect(comicsBoard.activationMetric).toBe('2분 안에 첫 workflow board 도착');
    expect(comicsBoard.steps.map((step) => step.title)).toContain('컷/스와이프 보드');
    expect(comicsBoard.qualityGateIds).toContain('visual');
    expect(comicsBoard.platformProof).toContain('첫 3컷');

    expect(audioBoard.steps.map((step) => step.title)).toContain('화자/발음/호흡 보드');
    expect(audioBoard.qualityGateIds).toContain('audio');
    expect(audioBoard.platformProof).toContain('첫 30초');
  });

  it('updates the development roadmap from evaluator reports', () => {
    expect(evaluationDrivenRoadmap.now).toContain('P0 최소 구조를 제작 패키지와 홈페이지에 노출');
    expect(evaluationDrivenRoadmap.next).toContain('Creator Memory Bank UI 탭화');
    expect(evaluationDrivenRoadmap.later).toContain('Reader/Listener Test Clips');
  });
});
