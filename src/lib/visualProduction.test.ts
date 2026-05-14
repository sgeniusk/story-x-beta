import { describe, expect, it } from 'vitest';

import { buildComicsVisualWorkflow, getComicsProductionAgents } from './visualProduction';

describe('comics visual production workflow', () => {
  it('assigns webtoon-specific agents for direction, bubbles, keyframes, prompts, and assembly', () => {
    const agents = getComicsProductionAgents('serial-webtoon').map((agent) => agent.id);

    expect(agents).toEqual([
      'showrunner',
      'storyboard-agent',
      'speech-bubble-agent',
      'keyframe-art-director',
      'da-vinci',
      'frame-assembly-agent',
      'continuity-editor'
    ]);
  });

  it('keeps Midjourney keyframes as selected references before DaVinci writes cut prompts', () => {
    const workflow = buildComicsVisualWorkflow('serial-webtoon');

    expect(workflow.referencePolicy.primaryGenerator).toBe('Midjourney');
    expect(workflow.referencePolicy.approvalRequired).toBe(true);
    expect(workflow.referencePolicy.rule).toContain('선택된 원화');
    expect(workflow.phases.map((phase) => phase.owner)).toContain('keyframe-art-director');
    expect(workflow.phases.map((phase) => phase.owner)).toContain('da-vinci');
    expect(workflow.phases.find((phase) => phase.owner === 'keyframe-art-director')?.outcome).toContain('키프레임 후보');
    expect(workflow.phases.find((phase) => phase.owner === 'da-vinci')?.outcome).toContain('컷별 이미지 프롬프트');
  });

  it('locks visual continuity anchors that image prompts must preserve', () => {
    const workflow = buildComicsVisualWorkflow('four-cut-insta-toon');

    expect(workflow.visualLocks).toEqual([
      'characterAppearance',
      'costumeAndProps',
      'paletteAndLighting',
      'cameraAndLens',
      'backgroundReuse',
      'speechBubbleRules',
      'negativePromptRules'
    ]);
    expect(workflow.platformOutput).toContain('1:1');
    expect(workflow.qualityGates).toContain('같은 인물이 컷마다 같은 사람으로 보이는가');
    expect(workflow.qualityGates).toContain('말풍선이 표정과 핵심 동작을 가리지 않는가');
  });
});
