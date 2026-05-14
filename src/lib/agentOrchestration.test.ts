import { describe, expect, it } from 'vitest';

import { buildFlowAgentMap, getAgentLayerModel } from './agentOrchestration';

describe('Story X agent orchestration layers', () => {
  it('keeps visible, hidden, and service agents separated by layer', () => {
    const model = getAgentLayerModel();

    expect(model.front.map((agent) => agent.id)).toEqual(
      expect.arrayContaining(['onboarding-guide', 'editor-companion', 'publishing-guide'])
    );
    expect(model.mid.map((agent) => agent.id)).toEqual(
      expect.arrayContaining(['flow-orchestrator', 'context-router', 'canon-refactor'])
    );
    expect(model.back.map((agent) => agent.id)).toEqual(
      expect.arrayContaining(['memory-bank-manager', 'work-library-manager', 'insights-analyst'])
    );
  });

  it('assigns each fullscreen flow step one front agent and supporting mid/back agents', () => {
    const map = buildFlowAgentMap();

    expect(map.medium.frontAgent.id).toBe('onboarding-guide');
    expect(map.intake.midAgents.map((agent) => agent.id)).toContain('context-router');
    expect(map.editor.frontAgent.id).toBe('editor-companion');
    expect(map.publish.frontAgent.id).toBe('publishing-guide');
    expect(map.publish.backAgents.map((agent) => agent.id)).toContain('publishing-ops');
  });
});
