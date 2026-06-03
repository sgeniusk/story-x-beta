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
    expect(app).toMatch(/className=.*landing-page/);
    expect(app).toContain('is-light');
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

  it('overrides --nx-ink-deep inside the .home-page dark scope so card titles stay readable', () => {
    // 회귀 방지 — .home-page 다크 블록이 --nx-ink-deep 를 오버라이드하지 않으면
    // 매체/포맷 카드 제목(strong, color: var(--nx-ink-deep))이 다크 배경(#08090a)에 묻힌다.
    const start = css.indexOf('.home-page {');
    const block = css.slice(start, css.indexOf('}', start));
    expect(block).toContain('--nx-ink-deep:');
  });

  it('keeps the .home-page top nav dark so its white brand/step text stays readable', () => {
    // 회귀 방지 — .home-page 는 다크 테마라 텍스트가 흰색(--nx-ink #ededf3)이다.
    // 상단 nav 가 흰 배경이면 흰 글씨(Story X 브랜드·스텝 라벨)가 묻힌다.
    const start = css.indexOf('.home-page .hx-nav {');
    const block = css.slice(start, css.indexOf('}', start));
    expect(block).not.toContain('rgba(255, 255, 255');
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
