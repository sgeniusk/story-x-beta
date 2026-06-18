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

  it('keeps the stepped home flow with a light Notion theme and a stepped nav', () => {
    // A-3 — 연재 서사는 intake 와 building 사이에 'charter'(작품 헌장) 단계가 조건부로 들어간다.
    expect(app).toContain('type HomeFlowStep');
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

  it('온보딩 입력을 localStorage 에 자동 저장·복원한다 (영속 Part 2)', () => {
    // 복원 — App 과 StoryXHome 이 loadOnboardingDraft 로 stage·매체·입력을 되살린다.
    expect(app).toContain('loadOnboardingDraft()');
    expect(app).toContain('restoredOnboarding?.medium');
    expect(app).toContain('restoredDraft?.freewriteText');
    expect(app).toContain('restoredDraft?.homeFlowStep');
    // 저장 — 변경을 debounce 저장하되, 의미있는 입력일 때만(빈 입력은 청소해 랜딩 보존).
    expect(app).toContain('saveOnboardingDraft(draft)');
    expect(app).toContain('hasMeaningfulOnboardingInput(draft)');
    // 졸업 — 작품 생성 시 onboarding draft 청소(다음 새 프로젝트 오염 방지).
    expect(app).toContain('clearOnboardingDraft();');
  });

  it('A-2 — 단편 헌장은 욕망·변화 2줄만으로 잠긴다(경량 잠금)', () => {
    // 장편은 4줄 전부, 단편은 desire+resolution 2줄만 채우면 charterReady 가 된다(빌더와 같은 규칙).
    expect(app).toContain("contractLengthClass === 'short'");
    expect(app).toContain('contractSpine.desire.trim().length > 0 && contractSpine.resolution.trim().length > 0');
  });

  it('A-3b — charter 4줄 척추에 쇼러너 제안 버튼이 있다', () => {
    // 작가가 빈 4줄을 맨손으로 채우지 않도록, 쇼러너가 자유 서술·결말을 읽고 4줄을 제안한다.
    expect(app).toContain('requestSpineSuggestion');
    expect(app).toContain('suggestSpine');
    expect(app).toContain('쇼러너에게 4줄 제안받기');
  });

  it('A-3c — charter 에서 장편 4줄이 비트 화수 핀 미리보기로 펼쳐진다', () => {
    // 잠근 4줄이 전체 화수의 어디에 박히는지(deriveBeatSheet) charter 에서 미리 보여준다.
    expect(app).toContain('deriveBeatSheet');
    expect(app).toContain('hx-charter-beats');
    expect(app).toContain('화에 이렇게 박힙니다');
  });

  it('charter 패널을 hx-main 스크롤 컨테이너로 감싸 긴 헌장도 세로 스크롤된다', () => {
    // 버그(2026-06-14 사용자 실사용) — charter 콘텐츠(결말 2 + 4줄 척추 4 textarea)가
    // 뷰포트보다 길면 .hx-panel(overflow:hidden)에 하단이 잘리고, 스크롤 컨테이너가 없어
    // 아래 필드(전진·시련·변화)에 접근조차 못 했다. 다른 단계처럼 .hx-main(overflow-y:auto)으로 감싼다.
    const charterStart = app.indexOf('hx-panel-charter');
    // hx-panel-building 은 1065(인터뷰 로딩)에도 있으므로 charter 이후부터 찾는다.
    const charterEnd = app.indexOf('hx-panel-building', charterStart);
    const charterBlock = app.slice(charterStart, charterEnd);
    expect(charterBlock).toContain('className="hx-main"');
    expect(charterBlock.indexOf('hx-main')).toBeLessThan(charterBlock.indexOf('hx-charter"'));
    // aside 가 없으니 단일 컬럼으로 — 기본 .hx-panel 의 2컬럼(빈 320px) 제거.
    expect(css).toContain('.home-page .hx-panel-charter');
  });

  it('building 캐러셀 인덱스가 조건부 charter 패널을 제외해 연재 생성 화면이 오프스크린되지 않는다', () => {
    // 버그(2026-06-14 베타테스트 #2) — charter 패널은 homeFlowStep==='charter'일 때만 mount 되어
    // building 진입 시 unmount 된다. building 인덱스를 homeFlowSteps.length(charter 포함)로 두면
    // usesCharter(연재) 작품에서 한 칸 과임 → '1화 쓰는 중' 패널이 화면 밖, 빈 다크 화면.
    expect(app).toContain("s.id !== 'charter'");
    const bi = app.indexOf("homeFlowStep === 'building'");
    expect(app.slice(bi, bi + 170)).not.toContain('homeFlowSteps.length');
  });

  it('오디오북 예상 낭독 미터가 총초 환산으로 60초 carry 를 막는다', () => {
    // 버그(2026-06-14 베타테스트 #4) — char%280/280*60 이 280 경계에서 60 → "0분 60초".
    // 총초로 환산한 뒤 분/초를 분리해야 한다.
    expect(app).toContain('Math.round((charCount / 280) * 60)');
    expect(app).toContain('totalSeconds % 60');
  });

  it('매체 변경 패널이 다크 토큰을 써서 흰/크림 박스로 뜨지 않는다', () => {
    // 버그(2026-06-14 베타테스트 #11) — .sx-media-change-panel 이 흰 그라데이션 + 크림 배경이라 다크 스튜디오에서 흰 박스.
    const start = css.indexOf('.sx-media-change-panel {');
    const block = css.slice(start, css.indexOf('}', start));
    expect(block).toContain('var(--sx-card)');
    expect(block).not.toContain('rgba(255, 255, 255, 0.8)');
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

  it('900px 이하에서 온보딩 진행 CTA가 aside 와 함께 사라지지 않는다 (F-007)', () => {
    // 검증 데스크 F-007 — 진행 버튼(자유 서술로 계속·인터뷰로 계속·이전)이 전부
    // .hx-aside 안에 있어, aside 를 통째로 숨기면 좁은 화면에서 온보딩이 진행 불가다.
    // 좁은 폭에서는 안내 카드만 접고 버튼은 유지한다.
    expect(css).not.toContain('.hx-aside { display: none; }');
    expect(css).toContain('.hx-aside-card { display: none; }');
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
