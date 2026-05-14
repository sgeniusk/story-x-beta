import { describe, expect, it } from 'vitest';

import { buildAiCliRunPlan, buildProviderCommand, getProviderRuntimeChecks } from './aiCliHarness';
import { createSeedProject } from './storyEngine';

describe('Story X AI CLI harness', () => {
  it('builds a safe Claude Code review command without writing directly to memory bank', () => {
    const project = createSeedProject();
    const plan = buildAiCliRunPlan({
      provider: 'claude',
      mode: 'review',
      scale: 'small',
      project,
      agentIds: ['showrunner', 'continuity-editor']
    });

    expect(plan.provider).toBe('claude');
    expect(plan.commandPreview.slice(0, 3)).toEqual(['claude', '--print', '--output-format']);
    expect(plan.commandPreview).toContain('--max-budget-usd');
    expect(plan.commandPreview).not.toContain('--tools');
    expect(plan.prompt).toContain('AGENTS.md');
    expect(plan.prompt).toContain('docs/codex-agent-manifest.md');
    expect(plan.prompt).toContain('Context Packet');
    expect(plan.prompt).toContain('사용자 승인 전에는 canon, character, world, voice memory에 반영하지 마세요');
    expect(plan.pendingWriteTargets).toContain('reviews/pending');
    expect(plan.approvalRequiredBeforeSync).toBe(true);
    expect(plan.runOutputContract.pendingReviewPath).toBe('reviews/pending');
    expect(plan.runOutputContract.rawProviderOutputPath).toBe('reviews/provider-raw');
  });

  it('builds a Codex provider command through codex exec for the same prompt contract', () => {
    const command = buildProviderCommand({
      provider: 'codex',
      prompt: 'Story X small review',
      cwd: '/tmp/story-x'
    });

    expect(command.slice(0, 2)).toEqual(['codex', 'exec']);
    expect(command).not.toContain('--ask-for-approval');
    expect(command).toContain('--cd');
    expect(command).toContain('/tmp/story-x');
    expect(command).toContain('Story X small review');
  });

  it('keeps mock runs deterministic for low-cost harness tests', () => {
    const checks = getProviderRuntimeChecks(['mock', 'claude', 'codex']);
    const mockPlan = buildAiCliRunPlan({
      provider: 'mock',
      mode: 'draft',
      scale: 'small',
      project: createSeedProject()
    });

    expect(checks.find((check) => check.provider === 'mock')?.available).toBe(true);
    expect(mockPlan.commandPreview).toEqual(['storyx-mock', 'draft', '--scale', 'small']);
    expect(mockPlan.expectedOutputSections).toEqual(['summary', 'agentReports', 'memoryCandidates', 'nextActions']);
  });
});
