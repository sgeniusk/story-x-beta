import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  getServiceAgentsByGroup,
  serviceOperationsAgents,
  serviceOperationsGroups
} from './lib/serviceOperationsAgents';

const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');
const manifest = readFileSync(resolve(__dirname, '../docs/codex-agent-manifest.md'), 'utf8');

describe('service operations agents', () => {
  it('defines product and growth agents outside the creative editor team', () => {
    expect(serviceOperationsGroups.map((group) => group.id)).toEqual(['product', 'growth']);
    expect(serviceOperationsAgents.map((agent) => agent.id)).toEqual([
      'editor-ux-director',
      'creative-coach',
      'onboarding-architect',
      'work-library-manager',
      'brand-homepage-director',
      'monetization-strategist',
      'publishing-distribution-manager',
      'insights-analyst'
    ]);
    expect(getServiceAgentsByGroup('product')).toHaveLength(4);
    expect(getServiceAgentsByGroup('growth')).toHaveLength(4);
  });

  it('surfaces the service operations room on the homepage', () => {
    expect(app).toContain('serviceOperationsAgents');
    expect(app).toContain('서비스 운영실');
    expect(app).toContain('에디터 UX 디렉터');
    expect(app).toContain('수익화 설계자');
    expect(app).toContain('FrontendAgentShowcase');
    expect(app).toContain('frontendProductionAgentIds');
    expect(css).toContain('.service-ops-section');
    expect(css).toContain('.service-agent-grid');
    expect(css).toContain('.frontend-agent-grid');
  });

  it('documents the service agents for Codex and Claude Code compatibility', () => {
    expect(manifest).toContain('Service Operations Roles');
    expect(manifest).toContain('Editor UX Director');
    expect(manifest).toContain('Brand Homepage Director');
    expect(manifest).toContain('Monetization Strategist');
  });

  it('aligns operations agents with the evaluator P0 recommendations', () => {
    const editor = serviceOperationsAgents.find((agent) => agent.id === 'editor-ux-director');
    const insights = serviceOperationsAgents.find((agent) => agent.id === 'insights-analyst');
    const publishing = serviceOperationsAgents.find((agent) => agent.id === 'publishing-distribution-manager');

    expect(editor?.deliverables).toContain('Workflow Board 기준');
    expect(editor?.signals).toContain('품질 게이트 노출 여부');
    expect(insights?.signals).toContain('AI Output Autopsy 승인률');
    expect(insights?.deliverables).toContain('테스터 보고서 반영 로그');
    expect(publishing?.deliverables).toContain('플랫폼 패키징 랩 기준');
  });
});
