import { describe, expect, it } from 'vitest';

import {
  agentReportsToRuns,
  buildAiCliRunPlan,
  buildMockAiCliReviewResult,
  buildProviderCommand,
  getProviderRuntimeChecks,
  normalizeProviderReviewOutput
} from './aiCliHarness';
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
    expect(plan.prompt).toContain('Language policy');
    expect(plan.prompt).toContain('UI Locale: ko');
    expect(plan.prompt).toContain('Work Language: ko');
    expect(plan.prompt).toContain('Target Market: kr');
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

  it('returns structured mock review output that can feed the editor rails', () => {
    const project = createSeedProject();
    const result = buildMockAiCliReviewResult({
      provider: 'mock',
      mode: 'review',
      scale: 'standard',
      project
    }, '서윤이 탑에서 오빠의 새 표식을 발견하고 이안은 대가를 숨긴다.');
    const runs = agentReportsToRuns(result);

    expect(result.summary).toContain('Story X mock review');
    expect(result.agentReports.length).toBe(5);
    expect(result.memoryCandidates.length).toBeGreaterThan(0);
    expect(result.memoryCandidates[0].status).toBe('pending');
    expect(result.memoryCandidates[0].targetPath).toContain('reviews/pending');
    expect(result.approvalRequiredBeforeSync).toBe(true);
    expect(runs[0].agentId).toBe('showrunner');
    expect(runs[0].output).toContain('mock');
  });

  it('normalizes provider raw JSON into the same pending review contract', () => {
    const raw = [
      '```json',
      JSON.stringify({
        summary: 'Claude review completed.',
        agentReports: [
          {
            agentId: 'showrunner',
            status: 'pass',
            note: '독자 약속은 선명하지만 마지막 질문을 더 빨리 배치하세요.',
            evidence: ['hook']
          }
        ],
        memoryCandidates: [
          {
            owner: 'plot',
            status: 'pending',
            statement: '1화 마지막 질문은 탑의 대가를 숨긴 인물에게 연결된다.',
            sourceAgentId: 'showrunner',
            targetPath: 'reviews/pending/plot-candidates.json',
            rationale: '승인 전 canon에 넣지 않습니다.'
          }
        ],
        nextActions: ['후크 강화안을 선택하세요.']
      }),
      '```'
    ].join('\n');

    const normalized = normalizeProviderReviewOutput(raw, {
      provider: 'claude',
      mode: 'review',
      scale: 'small',
      projectTitle: '샘플 작품'
    });

    expect(normalized.provider).toBe('claude');
    expect(normalized.summary).toBe('Claude review completed.');
    expect(normalized.agentReports[0].agentId).toBe('showrunner');
    expect(normalized.memoryCandidates[0].targetPath).toBe('reviews/pending/plot-candidates.json');
    expect(normalized.pendingReviewTarget).toBe('reviews/pending');
    expect(normalized.approvalRequiredBeforeSync).toBe(true);
  });

  it('falls back safely when provider output is prose instead of JSON', () => {
    const normalized = normalizeProviderReviewOutput('전체적으로 좋지만 캐논 후보는 별도로 확인해야 합니다.', {
      provider: 'codex',
      mode: 'review',
      scale: 'small',
      projectTitle: '샘플 작품'
    });

    expect(normalized.summary).toContain('전체적으로 좋지만');
    expect(normalized.agentReports[0].agentId).toBe('continuity-editor');
    expect(normalized.memoryCandidates).toEqual([]);
    expect(normalized.nextActions[0]).toContain('구조화되지 않은 provider 출력');
  });
});
