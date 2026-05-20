import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('Story X page experience', () => {
  it('separates the product into landing, login, projects, new-project, and editor stages', () => {
    expect(app).toContain("type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor'");
    expect(app).toContain('useState<AppStage>(initialStage)');
    expect(app).toContain("return 'landing';");
    expect(app).toContain('<StoryXDesk');
    expect(app).toContain("onOpenProjects={() => setStage('projects')}");
    expect(app).toContain("onOpenLanding={() => setStage('landing')}");
    expect(app).not.toContain('className="editor-return-bar"');
  });

  it('renders the landing on the Linear design system — dark command-center with product mockup and Neon Lime CTA', () => {
    expect(app).toContain('function MarketingLanding');
    expect(app).toContain('function LandingBrand');
    expect(app).toContain('className="landing-page"');
    expect(app).toContain('className="hero-band"');
    expect(app).toContain('끝까지 데려가는 시스템');
    expect(app).toContain('className="feature-card"');
    expect(app).toContain('className="lx-bridge-section"');
    expect(app).toContain('className="hero-showcase"');
    expect(css).toContain('--lc-lime: #e4f222');
    expect(css).toContain('--lc-pitch: #08090a');
    expect(css).toContain('.landing-page .hero-band');
    expect(css).toContain('.landing-page .feature-card');
    expect(css).toContain('.landing-page .lx-bridge-section');
  });

  it('routes the landing CTA into the new-project flow and the projects list', () => {
    expect(app).toContain('onOpenHome');
    expect(app).toContain('onOpenProjects');
    expect(app).toContain('창작 시작');
    expect(app).toContain('프로젝트 목록');
  });

  it('keeps the projects list as a clean white card grid', () => {
    expect(app).toContain('function ProjectHub');
    expect(app).toContain('className="projects-page"');
    expect(app).toContain('className="pjx-grid"');
    expect(app).toContain('새 프로젝트');
    expect(css).toContain('.projects-page .pjx-card');
    expect(css).toContain('.projects-page .pjx-new-card');
  });

  it('keeps the three-step home flow with a light Notion theme and a stepped nav', () => {
    expect(app).toContain("type HomeFlowStep = 'medium' | 'freewrite' | 'intake' | 'building'");
    expect(app).toContain('const [homeFlowStep, setHomeFlowStep]');
    expect(app).toContain('className="home-page"');
    expect(app).toContain('className="hx-track"');
    expect(app).toContain('translateX(-${homeFlowIndex * 100}%)');
    expect(app).toContain('className="hx-steps"');
    expect(app).toContain('자유 서술로 계속');
    expect(app).toContain('인터뷰로 계속');
    expect(css).toContain('.home-page .hx-track');
    expect(css).toContain('.home-page .hx-step');
    expect(css).toContain('.home-page .hx-medium-card');
  });

  it('removes the agent-architecture noise from the new-project flow (P3)', () => {
    expect(app).not.toContain('<FlowAgentLayerCard');
    expect(app).not.toContain('scope-focus-strip');
    expect(app).not.toContain('Agent setup · 객관식');
  });

  it('keeps the real LLM-backed interview and first-chapter build logic', () => {
    expect(app).toContain('buildProjectIntakePlan');
    expect(app).toContain('requestLlmInterview');
    expect(app).toContain('requestLlmDraft');
    expect(app).toContain('getIntakePersona');
    expect(app).toContain('async function goToIntake');
    expect(app).toContain('async function goToBuilding');
    expect(app).toContain('effectiveIntakeQuestions');
  });

  it('keeps the editor desk reachable from the routed stages', () => {
    expect(app).toContain("import { StoryXDesk }");
    expect(app).toContain('initialDraftPayload={pendingDraft}');
  });
});
