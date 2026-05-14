import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('Story X page experience', () => {
  it('separates the product into landing, login, projects, new-project, and editor stages', () => {
    expect(app).toContain("type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor'");
    expect(app).toContain("useState<AppStage>('landing')");
    expect(app).toContain('className="marketing-landing"');
    expect(app).toContain('className="auth-shell"');
    expect(app).toContain('className="project-hub"');
    expect(app).toContain('className="storyx-home"');
    expect(app).toContain('<StoryXDesk');
    expect(app).toContain('onOpenProjects={() => setStage(\'projects\')}');
    expect(app).toContain('onOpenLanding={() => setStage(\'landing\')}');
    expect(app).not.toContain('className="editor-return-bar"');
    expect(app).toContain("import storyXLogoLockup from './assets/brand/story-x-logo-lockup-mono.svg'");
    expect(app).toContain('function BrandWordmark');
    expect(app).toContain("import storyXHeroImage from './assets/story-x-hero-clear-coast.webp'");
    expect(app).toContain('Story X는 맑은 해안처럼 조용하지만');
  });

  it('applies a calm Duna-inspired natural design language to the homepage layer', () => {
    expect(css).toContain('--framer-canvas:');
    expect(css).toContain('--framer-canvas: #f7f5ef');
    expect(css).toContain('--framer-primary: #160f0b');
    expect(css).toContain('.marketing-landing');
    expect(css).toContain('.hero-image-slot');
    expect(css).toContain('.hero-image-slot img');
    expect(css).toContain('.storyx-site-nav');
    expect(css).not.toContain('.nav-mega-panel');
    expect(css).toContain('.brand-lockup');
    expect(app).toContain('const navMenus = [');
    expect(app).toContain('function StoryXTopNav');
    expect(app).toContain('navLinks={navMenus.map((menu)');
    expect(app).toContain('제작 OS');
    expect(app).toContain('매체 전환');
    expect(app).toContain('프론트엔드 제작팀');
    expect(app).not.toContain('wordmark-star');
    expect(css).toContain('.duna-integrity-hero');
    expect(css).toContain('.integrity-grid');
    expect(css).toContain('border-radius: var(--framer-rounded-pill)');
    expect(app).not.toContain('living-landscape');
  });

  it('uses the top-right black CTA as the main path into login', () => {
    expect(app).toContain('className="framer-top-nav storyx-site-nav"');
    expect(app).toContain('창작 시작');
    expect(app).toContain('onClick={onOpenLogin}');
    expect(app).toContain('Engineered for story integrity');
  });

  it('keeps landing nav polished and turns post-start navigation into focused scroll steps', () => {
    expect(app).toContain('<StoryXTopNav');
    expect(app).toContain('ariaLabel="Story X"');
    expect(app).toContain('href={`#${link.target}`}');
    expect(app).toContain("type HomeFlowStep = 'medium' | 'intake'");
    expect(app).toContain('const [homeFlowStep, setHomeFlowStep]');
    expect(app).toContain('className="storyx-fullscreen-flow"');
    expect(app).toContain('className="home-flow-track"');
    expect(app).toContain('translateX(-${homeFlowIndex * 100}%)');
    expect(app).toContain('flow-agent-layer-card');
    expect(app).not.toContain('매체와 형식을 정하면 Story X가 필요한 작가진');
    expect(app).not.toContain("label: '창작 선택'");
    expect(app).not.toContain('nav-menu-trigger');
    expect(app).not.toContain('role="menu"');
    expect(css).toContain('scroll-behavior: smooth');
    expect(css).toContain('.storyx-site-nav > div');
    expect(css).toContain('.storyx-site-nav a.is-nav-link');
    expect(css).toContain('.liquid-glass-nav');
    expect(css).toContain('.storyx-home');
    expect(css).toContain('min-height: 100vh');
    expect(css).not.toContain('height: 100dvh;\n  min-height: 100dvh;\n  padding: 0;\n  overflow: hidden;');
    expect(css).toContain('.home-flow-panel');
    expect(css).toContain('flex: 0 0 100%');
    expect(css).toContain('overflow: visible');
    expect(css).toContain('.flow-agent-layer-card');
    expect(app).not.toContain('<MediaBridgeSection compact />');
    expect(app).not.toContain('<FrontendAgentShowcase compact />');
  });

  it('routes project cards to the editor and new project to the format chooser', () => {
    expect(app).toContain('function ProjectHub');
    expect(app).toContain('onOpenNewProject');
    expect(app).toContain('onOpenProject');
    expect(app).toContain('새 프로젝트');
  });

  it('keeps Korean marketing headlines breathable', () => {
    expect(css).toContain('--framer-display-line-height: 1.08');
    expect(css).toContain('line-height: var(--framer-display-line-height)');
    expect(css).not.toContain('line-height: 0.9;');
    expect(css).not.toContain('line-height: 0.96;');
  });

  it('shows format-specific production phases in the workflow card', () => {
    expect(app).toContain('const workflowPhases = blueprint.productionPhases');
    expect(app).toContain('workflowPhases.map((phase)');
    expect(app).toContain('phase.outcome');
    expect(app).toContain('className="workflow-quality-strip"');
    expect(css).toContain('.home-builder-grid .gradient-spotlight-card');
    expect(css).toContain('color: #20201e');
  });

  it('explains Story X as a cross-media creative operating system on the homepage', () => {
    expect(app).toContain('const landingWorkflowTracks = [');
    expect(app).toContain('className="landing-workflow-track"');
    expect(app).toContain('function StoryCurrentSection');
    expect(app).toContain('바람과 물결이 교차할 때');
    expect(app).toContain('소설에서 시작해 웹툰, 동화책, 오디오북으로 자연스럽게 확장');
    expect(app).toContain('function MediaBridgeSection');
    expect(app).toContain('소설 → 웹툰');
    expect(app).toContain('에세이 → 오디오북');
    expect(app).toContain('만화 → 컷별 영상');
    expect(css).toContain('.story-current-section');
    expect(css).toContain('.current-wave-map');
    expect(css).toContain('.media-bridge-section');
    expect(css).toContain('.bridge-route-grid');
  });

  it('adds objective agent questions before starting a new project', () => {
    expect(app).toContain('buildProjectIntakePlan');
    expect(app).toContain('getFocusedServiceScope');
    expect(app).toContain('buildFlowAgentMap');
    expect(app).toContain('const intakePlan = useMemo');
    expect(app).toContain('className="home-intake-questionnaire compact"');
    expect(app).toContain('객관식');
    expect(app).toContain('나중에 언제든지 바꿀 수 있습니다');
    expect(app).toContain('이미지 생성은 후속 단계');
    expect(app).toContain('프론트 에이전트');
    expect(app).toContain('미드 에이전트');
    expect(app).toContain('백 에이전트');
    expect(css).toContain('.home-intake-questionnaire');
    expect(css).toContain('.intake-question-card');
    expect(css).toContain('.scope-focus-strip');
  });

  it('introduces frontend production agents like a service team section', () => {
    expect(app).toContain('const frontendProductionAgentIds = [');
    expect(app).toContain('function FrontendAgentShowcase');
    expect(app).toContain('프론트엔드 제작팀');
    expect(app).toContain('구성원 소개');
    expect(app).toContain('에디터 UX 디렉터');
    expect(app).toContain('온보딩 설계자');
    expect(app).toContain('브랜드/홈페이지 디렉터');
    expect(css).toContain('.frontend-agent-section');
    expect(css).toContain('.frontend-agent-card');
    expect(css).toContain('.agent-portrait');
  });

  it('surfaces the next development plan from the homepage', () => {
    expect(app).toContain('function HomepageRoadmapSection');
    expect(app).toContain('홈페이지와 제작실을 잇는 다음 개발 계획');
    expect(app).toContain('매체 전환 브릿지');
    expect(app).toContain('워크플로우 라이브러리 고도화');
    expect(app).toContain('유료 검토/패키징');
    expect(css).toContain('.homepage-roadmap-section');
  });

  it('surfaces the one-project vertical slice as the next evaluator proof', () => {
    expect(app).toContain('buildOneProjectVerticalSlice');
    expect(app).toContain('p05EvaluationFollowups');
    expect(app).toContain('One Project Vertical Slice');
    expect(app).toContain('웹소설 1화');
    expect(app).toContain('인스타툰 4컷');
    expect(app).toContain('오디오북 30초');
    expect(css).toContain('.vertical-slice-proof-card');
  });
});
