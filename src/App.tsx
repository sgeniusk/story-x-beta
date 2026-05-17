import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  Clapperboard,
  Database,
  Drama,
  Feather,
  FileText,
  GitBranch,
  Home,
  History,
  Layers,
  Library,
  Lock,
  Map,
  PanelsTopLeft,
  PenTool,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  UserRound,
  WandSparkles
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  buildCreativeBlueprint,
  getFormatOptions,
  getMediumOptions,
  type CreativeBlueprint,
  type CreativeFormat,
  type CreativeMedium
} from './lib/projectBlueprint';
import {
  buildProjectIntakePlan,
  getFocusedServiceScope,
  getIntakePersona,
  type ProjectIntakeQuestion
} from './lib/projectIntake';
import { requestLlmInterview } from './lib/interviewClient';
import { buildFlowAgentMap, type FlowAgentAssignment } from './lib/agentOrchestration';
import {
  createDefaultDevelopmentInput,
  developCreativeProject,
  type CreativeDevelopmentInput,
  type CreativeDevelopmentPackage
} from './lib/creativeDevelopment';
import {
  buildTesterDrivenWorkflow,
  evaluationDrivenRoadmap,
  evaluationNorthStar,
  p05EvaluationFollowups,
  p0EvaluationCapabilities
} from './lib/evaluationSynthesis';
import { buildOneProjectVerticalSlice } from './lib/verticalSlice';
import {
  getServiceAgentsByGroup,
  serviceOperationsAgents,
  serviceOperationsGroups
} from './lib/serviceOperationsAgents';
import {
  createSeedProject,
  getGenreProfiles,
  produceNextChapter,
  type AgentRun,
  type Chapter,
  type DraftChapterPayload,
  type GenreId,
  type ProductionRequest,
  type SeriesProject
} from './lib/storyEngine';
import { clearProject, loadProject, saveProject } from './lib/storage';
import { requestLlmDraft } from './lib/draftClient';
import { StoryXDesk } from './StoryXDesk';
import { StoryXTestPage } from './StoryXTestPage';
import storyXLogoLockup from './assets/brand/story-x-logo-lockup-mono.svg';
import storyXHeroImage from './assets/story-x-hero-clear-coast.webp';

const genreProfiles = getGenreProfiles();
const mediumOptions = getMediumOptions();
const frontendProductionAgentIds = [
  'editor-ux-director',
  'creative-coach',
  'onboarding-architect',
  'work-library-manager',
  'brand-homepage-director',
  'publishing-distribution-manager',
  'insights-analyst'
];

const frontendAgentDirectives: Record<string, { tag: string; studio: string; instruction: string }> = {
  'editor-ux-director': {
    tag: 'Focus Surface',
    studio: '원고 · 캔버스 · 스토리보드',
    instruction: '중앙 창작면이 항상 70% 이상을 차지하게 하고, 품질 게이트는 시야를 빼앗지 않는 위치에 둡니다.'
  },
  'creative-coach': {
    tag: 'Next Action',
    studio: '막힘 해소 · 질문 카드',
    instruction: '대신 써주기보다 사용자가 답할 수 있는 질문과 다음 행동을 먼저 제시합니다.'
  },
  'onboarding-architect': {
    tag: 'First Project',
    studio: '선택 흐름 · 첫 제작 보드',
    instruction: '처음 2분 안에 매체, 포맷, 첫 workflow board가 보이도록 선택 단계를 줄입니다.'
  },
  'work-library-manager': {
    tag: 'Library',
    studio: '프로젝트 · 시리즈 · 버전',
    instruction: '작품, 캐논, 문체, 시각/오디오 바이블, 산출물을 같은 기억은행에서 찾을 수 있게 정리합니다.'
  },
  'brand-homepage-director': {
    tag: 'Story X Voice',
    studio: '홈페이지 · 소개 페이지',
    instruction: 'Story X를 생성기가 아니라 매체를 넘나드는 이야기 운영체제로 설명합니다.'
  },
  'publishing-distribution-manager': {
    tag: 'Export Bridge',
    studio: '게시 · 다운로드 · 전환 패키지',
    instruction: '완성 순간에 웹소설 첫 300자, 웹툰 첫 3컷, 오디오 첫 30초 같은 플랫폼 증거를 준비합니다.'
  },
  'insights-analyst': {
    tag: 'Learning Loop',
    studio: '테스터 리포트 · 개선 로그',
    instruction: '사용자가 막힌 지점과 승인한 개선을 다음 UI, 에이전트 규칙, 유료 검토 기준으로 되돌립니다.'
  }
};

const mediaBridgeRoutes = [
  {
    from: '소설',
    to: '웹툰',
    title: '소설 → 웹툰',
    body: '장면 기능, 인물 욕망, 세계 규칙을 컷/스크롤 리듬으로 변환하고 다빈치가 시각 바이블을 이어받습니다.',
    packet: ['Story Contract', 'Character Bible', 'Visual Bible', 'Panel Board']
  },
  {
    from: '소설',
    to: '동화책',
    title: '소설 → 동화책',
    body: '핵심 갈등을 아이가 따라갈 수 있는 반복 구조와 페이지 장면으로 압축합니다.',
    packet: ['Theme Lock', 'Page Beat', 'Illustration Prompt', 'Read-aloud Tone']
  },
  {
    from: '에세이',
    to: '오디오북',
    title: '에세이 → 오디오북',
    body: '내 이야기를 훼손하지 않으면서 화자 거리, 쉼, 강조, 배경 음악 큐를 낭독 패키지로 바꿉니다.',
    packet: ['Voice Bible', 'Pronunciation', 'Pause Map', 'First 30s Proof']
  },
  {
    from: '만화',
    to: '영상',
    title: '만화 → 컷별 영상',
    body: '컷 구도와 말풍선을 쇼트, 카메라 움직임, 자막 밀도, 음악 모티프로 이어붙입니다.',
    packet: ['Cut Sheet', 'Shot List', 'Caption Density', 'Music Cue']
  }
];

const homepageRoadmapItems = [
  {
    horizon: 'Now',
    title: '매체 전환 브릿지',
    body: '소설에서 시작해 웹툰, 동화책, 오디오북으로 자연스럽게 확장하는 전환 패킷을 UI에 고정합니다.'
  },
  {
    horizon: 'Next',
    title: '워크플로우 라이브러리 고도화',
    body: '각 제작 분야가 끊기지 않도록 Story Contract, Memory Bank, Quality Gates를 포맷별 단계에 연결합니다.'
  },
  {
    horizon: 'Next',
    title: '프론트엔드 제작팀 실행',
    body: '에디터 UX, 온보딩, 작품 라이브러리, 홈페이지, 배포 에이전트가 사용자 여정을 함께 검토합니다.'
  },
  {
    horizon: 'Later',
    title: '유료 검토/패키징',
    body: 'Standard/Deep 검토, 플랫폼별 샘플, 다운로드 패키지, 매체 변환 제안을 수익화 지점으로 설계합니다.'
  }
];

type ActivePane = 'chapter' | 'canon';
type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor';
type HomeFlowStep = 'medium' | 'freewrite' | 'intake' | 'building';
type StoryXNavLink = {
  label: string;
  target: string;
};

function App() {
  const initialStage = useMemo<AppStage>(() => {
    if (typeof window === 'undefined') return 'landing';
    const stageParam = new URLSearchParams(window.location.search).get('stage');
    if (
      stageParam === 'editor' ||
      stageParam === 'home' ||
      stageParam === 'projects' ||
      stageParam === 'login' ||
      stageParam === 'landing'
    ) {
      return stageParam;
    }
    return 'landing';
  }, []);
  const [stage, setStage] = useState<AppStage>(initialStage);
  const [medium, setMedium] = useState<CreativeMedium>('novel');
  const [format, setFormat] = useState<CreativeFormat>('long-novel');
  // 새 프로젝트 플로우의 빌드 단계에서 만든 첫 회차 초안 — 에디터가 이걸로 시작한다
  const [pendingDraft, setPendingDraft] = useState<DraftChapterPayload | null>(null);

  const blueprint = useMemo(() => buildCreativeBlueprint({ medium, format }), [format, medium]);

  function selectMedium(nextMedium: CreativeMedium) {
    setMedium(nextMedium);
    setFormat(getFormatOptions(nextMedium)[0].id);
  }

  if (stage === 'editor') {
    return (
      <StoryXDesk
        initialMedium={medium}
        initialFormat={format}
        initialDraftPayload={pendingDraft}
        onOpenProjects={() => setStage('projects')}
        onOpenLanding={() => setStage('landing')}
      />
    );
  }

  if (stage === 'login') {
    return <LoginScreen onBack={() => setStage('landing')} onContinue={() => setStage('projects')} />;
  }

  if (stage === 'projects') {
    return (
      <ProjectHub
        onOpenLanding={() => setStage('landing')}
        onOpenNewProject={() => setStage('home')}
        onOpenProject={() => setStage('editor')}
      />
    );
  }

  if (stage === 'home') {
    return (
      <StoryXHome
        medium={medium}
        format={format}
        blueprint={blueprint}
        onSelectMedium={selectMedium}
        onSelectFormat={setFormat}
        onOpenLanding={() => setStage('landing')}
        onOpenEditor={(draft) => {
          setPendingDraft(draft ?? null);
          setStage('editor');
        }}
      />
    );
  }

  return <MarketingLanding onOpenHome={() => setStage('home')} onOpenProjects={() => setStage('projects')} />;
}

function BrandWordmark() {
  return <img className="brand-lockup" src={storyXLogoLockup} alt="Story X" />;
}

function StoryXTopNav({
  ariaLabel,
  navLinks,
  ctaLabel,
  onLogoClick,
  onCtaClick
}: {
  ariaLabel: string;
  navLinks: StoryXNavLink[];
  ctaLabel: string;
  onLogoClick: () => void;
  onCtaClick: () => void;
}) {
  return (
    <nav className="framer-top-nav storyx-site-nav" aria-label={ariaLabel}>
      <button type="button" className="framer-wordmark" onClick={onLogoClick}>
        <BrandWordmark />
      </button>
      <div className="storyx-nav-links">
        {navLinks.map((link) => (
          <a className="is-nav-link" href={`#${link.target}`} key={link.target}>
            {link.label}
          </a>
        ))}
      </div>
      <button type="button" className="button-primary" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    </nav>
  );
}

function LandingBrand({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="landing-brand" onClick={onClick}>
      <span className="lx-brandmark" aria-hidden="true">
        <Sparkles size={13} />
      </span>
      <span>Story X</span>
    </button>
  );
}

function MarketingLanding({
  onOpenHome,
  onOpenProjects
}: {
  onOpenHome: () => void;
  onOpenProjects: () => void;
}) {
  const features = [
    {
      sym: '⌀',
      title: '캐논이 흔들리지 않습니다',
      body: '30화가 쌓여도 1화의 규칙이 그대로입니다. 세계관, 캐릭터, 사건이 충돌하면 AI가 아닌 내가 결정합니다.',
      tint: 'tint-lavender'
    },
    {
      sym: '◉',
      title: '캐릭터는 같은 사람이어야 합니다',
      body: '매 회차마다 욕망, 상처, 말버릇이 동일한 기준으로 점검됩니다. 설정이 바뀌면 영향 범위를 먼저 보여줍니다.',
      tint: 'tint-mint'
    },
    {
      sym: '◈',
      title: '승인은 작가가 합니다',
      body: 'AI가 생성한 내용은 즉시 작품에 들어가지 않습니다. 승인 대기함에 쌓이고, 내가 확인한 것만 캐논이 됩니다.',
      tint: 'tint-peach'
    }
  ];
  const navLinks = [
    { label: '핵심 원칙', target: 'features' },
    { label: '매체 전환', target: 'media-bridge' }
  ];
  const mockAgents: Array<[string, string]> = [
    ['쇼러너', 'pass'],
    ['캐릭터', 'revise'],
    ['연속성', 'block']
  ];

  return (
    <div className="landing-page">
      <nav className="lx-nav" aria-label="Story X">
        <LandingBrand onClick={onOpenHome} />
        <div className="lx-nav-links">
          {navLinks.map((link) => (
            <a key={link.target} href={`#${link.target}`} className="lx-nav-link">
              {link.label}
            </a>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={onOpenHome}>
          창작 시작
        </button>
      </nav>

      <section className="hero-band" aria-labelledby="landing-title">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <Sparkles size={12} />
            이야기 창작 시스템
          </div>
          <h1 id="landing-title" className="hero-title">
            조용하게 이야기를
            <br />
            만드는 방법.
          </h1>
          <p className="hero-sub">
            소설에서 시작한 이야기가 웹툰, 동화책, 오디오북으로 이어질 때도 캐릭터, 세계관, 문체가
            흔들리지 않도록 지켜줍니다.
          </p>
          <div className="hero-cta-row">
            <button type="button" className="btn-primary btn-primary-lg" onClick={onOpenHome}>
              창작 시작 — 무료
            </button>
            <button type="button" className="btn-secondary-on-dark" onClick={onOpenHome}>
              데모 둘러보기
            </button>
          </div>
          <p className="hero-already">
            이미 프로젝트가 있나요?&nbsp;
            <button type="button" className="link-btn" onClick={onOpenProjects}>
              프로젝트 목록 →
            </button>
          </p>
        </div>

        <div className="hero-mockup" role="img" aria-label="Story X 에디터 미리보기">
          <div className="hv-topbar">
            <span className="hv-brand">
              <Sparkles size={11} /> Story X
            </span>
            <div className="hv-tabs">
              <span className="hv-tab active">편집</span>
              <span className="hv-tab">바이블</span>
            </div>
            <span className="hv-pub">출간</span>
          </div>
          <div className="hv-body">
            <div className="hv-rail">
              <div className="hv-rail-proj">달의 탑 아래서</div>
              <div className="hv-rail-ep">1화 · 마르지 않는 잉크</div>
              <div className="hv-rail-ep active">2화 · 달의 수문장</div>
              <div className="hv-rail-ep">3화 · 역방향의 시간</div>
            </div>
            <div className="hv-prose">
              <div className="hv-prose-bar">2화 · 달의 수문장</div>
              <div className="hv-prose-text">
                탑의 입구에는 빛이 없었다. 달만이 돌계단을 희미하게 비추고 있었다. 서아가 첫 번째
                계단에 발을 올려놓았을 때, 그림자 속에서 목소리가 들렸다.
                <br />
                <br />
                “이서아. 드디어 왔군.”
              </div>
            </div>
            <div className="hv-agents">
              <div className="hv-agent-label">작가진</div>
              {mockAgents.map(([name, state]) => (
                <div key={name} className="hv-agent">
                  <span className={`hv-dot hv-dot-${state}`} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section" id="features" aria-label="핵심 원칙">
        <div className="feature-section-inner">
          <div className="feature-eyebrow">왜 Story X인가요</div>
          <div className="feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className={`feature-card ${feature.tint}`}>
                <div className="feature-sym">{feature.sym}</div>
                <div className="feature-title">{feature.title}</div>
                <p className="feature-body">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lx-bridge-section" id="media-bridge" aria-label="매체 전환">
        <div className="lx-bridge-inner">
          <p className="lx-eyebrow" style={{ marginBottom: 14 }}>
            Media Bridge
          </p>
          <h2 className="section-h2">
            이야기가 먼저이고,
            <br />
            매체는 그 다음입니다.
          </h2>
          <p className="bridge-lead">
            하나의 이야기가 소설에서 웹툰, 동화책, 오디오북으로 이동할 때 무엇을 보존하고 무엇을 다시
            설계할지 보여줍니다.
          </p>
          <div className="bridge-grid">
            {mediaBridgeRoutes.map((route) => (
              <article key={route.title} className="bridge-card">
                <div className="lx-bridge-route">
                  <span>{route.from}</span>
                  <ChevronRight size={11} />
                  <span>{route.to}</span>
                </div>
                <div className="bridge-title">{route.title}</div>
                <p className="bridge-body">{route.body}</p>
                <div className="bridge-packet">
                  {route.packet.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-closing">
        <h2>
          어떤 형태로 바뀌어도
          <br />
          살아남는 이야기로 시작하세요.
        </h2>
        <button type="button" className="btn-primary btn-primary-lg" onClick={onOpenHome}>
          창작 시작 — 무료
        </button>
      </section>
    </div>
  );
}

function getFrontendProductionAgents() {
  return frontendProductionAgentIds
    .map((id) => serviceOperationsAgents.find((agent) => agent.id === id))
    .filter((agent): agent is (typeof serviceOperationsAgents)[number] => Boolean(agent));
}

function MediaBridgeSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`media-bridge-section ${compact ? 'is-compact' : ''}`} id="media-bridge" aria-label="매체 전환 브릿지">
      <div className="media-bridge-head">
        <p className="framer-eyebrow">Media Bridge</p>
        <h2>이야기가 먼저이고, 매체는 그 다음입니다.</h2>
        <p>
          Story X는 한 작품을 한 번 쓰고 끝내지 않습니다. Story Contract와 Memory Bank를 중심에 두고,
          하나의 이야기가 소설, 만화, 동화책, 오디오북, 컷별 영상으로 이동할 때 무엇을 보존하고 무엇을
          다시 설계해야 하는지 보여줍니다.
        </p>
      </div>
      <div className="bridge-route-grid">
        {mediaBridgeRoutes.map((route) => (
          <article key={route.title}>
            <div className="bridge-route-head">
              <span>{route.from}</span>
              <ChevronRight size={16} />
              <span>{route.to}</span>
            </div>
            <h3>{route.title}</h3>
            <p>{route.body}</p>
            <div className="bridge-packet-row">
              {route.packet.map((item) => (
                <small key={item}>{item}</small>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FrontendAgentShowcase({ compact = false }: { compact?: boolean }) {
  const agents = getFrontendProductionAgents();

  return (
    <section className={`frontend-agent-section ${compact ? 'is-compact' : ''}`} id="frontend-agents" aria-label="프론트엔드 제작팀">
      <div className="frontend-agent-head">
        <p className="framer-eyebrow">Frontend Production Agents · 구성원 소개</p>
        <h2>UI와 UX도 작가진처럼 협업해야 합니다.</h2>
        <p>
          Story X의 혁신은 모델만으로 나오지 않습니다. 에디터 집중도, 첫 사용 흐름, 작품 라이브러리,
          홈페이지 메시지, 배포 패키지를 각각의 전문 에이전트가 지키며 창작 경험을 개발합니다.
        </p>
      </div>
      <div className="frontend-agent-grid">
        {agents.map((agent, index) => {
          const directive = frontendAgentDirectives[agent.id];

          return (
            <article key={agent.id} className="frontend-agent-card">
              <div className={`agent-portrait portrait-${index % 4}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div>
                <span>{directive?.tag}</span>
                <h3>{agent.title}</h3>
                <p>{agent.mission}</p>
              </div>
              <dl>
                <div>
                  <dt>담당 화면</dt>
                  <dd>{directive?.studio}</dd>
                </div>
                <div>
                  <dt>작업 지침</dt>
                  <dd>{directive?.instruction}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HomepageRoadmapSection() {
  return (
    <section className="homepage-roadmap-section" id="roadmap" aria-label="향후 개발 계획">
      <div>
        <p className="framer-eyebrow">Roadmap Update</p>
        <h2>홈페이지와 제작실을 잇는 다음 개발 계획</h2>
      </div>
      <div className="homepage-roadmap-grid">
        {homepageRoadmapItems.map((item) => (
          <article key={item.title}>
            <span>{item.horizon}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LoginScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  return (
    <main className="auth-shell">
      <nav className="auth-nav" aria-label="login">
        <button type="button" className="framer-wordmark" onClick={onBack}>
          <BrandWordmark />
        </button>
        <button type="button" className="button-secondary" onClick={onBack}>
          소개로
        </button>
      </nav>
      <section className="auth-card" aria-labelledby="login-title">
        <p className="framer-eyebrow">Login</p>
        <h1 id="login-title">창작 공간으로 들어가기</h1>
        <p>지금은 로컬 프로토타입이라 계정 검증 없이 프로젝트 관리 화면으로 이어집니다.</p>
        <label>
          <span>이메일</span>
          <input type="email" name="email" defaultValue="writer@storyx.local" autoComplete="email" />
        </label>
        <button type="button" className="button-primary" onClick={onContinue}>
          계속하기
        </button>
      </section>
    </main>
  );
}

function ProjectHub({
  onOpenLanding,
  onOpenNewProject,
  onOpenProject
}: {
  onOpenLanding: () => void;
  onOpenNewProject: () => void;
  onOpenProject: () => void;
}) {
  const project = loadProject();
  const projectMeta = `소설 / 웹소설 · ${project.currentEpisode}화 · 캐논 ${project.canonFacts.length}개 · 캐릭터 ${project.characters.length}명`;

  return (
    <div className="projects-page">
      <nav className="pjx-nav" aria-label="프로젝트">
        <button type="button" className="pjx-brand" onClick={onOpenLanding}>
          <span className="pjx-brandmark" aria-hidden="true">
            <Sparkles size={13} />
          </span>
          <span>Story X</span>
        </button>
        <button type="button" className="pjx-btn" onClick={onOpenNewProject}>
          <Plus size={13} /> 새 프로젝트
        </button>
      </nav>

      <header className="pjx-head">
        <p className="pjx-eyebrow">Projects</p>
        <h1 className="pjx-title">작품을 골라 이어가세요.</h1>
      </header>

      <section className="pjx-grid" aria-label="프로젝트 목록">
        <button type="button" className="pjx-new-card" onClick={onOpenNewProject}>
          <Plus size={28} />
          <strong>새 프로젝트</strong>
          <span>소설, 웹툰, 에세이, 오디오북 중에서 선택</span>
        </button>

        <button type="button" className="pjx-card" onClick={onOpenProject}>
          <div className="pjx-card-meta">{projectMeta}</div>
          <div className="pjx-card-title">{project.title}</div>
          <p className="pjx-card-logline">{project.logline}</p>
          <div className="pjx-card-status">
            <span className="pjx-dot" />
            원고 작업 중
          </div>
        </button>
      </section>
    </div>
  );
}

function StoryXHome({
  medium,
  format,
  blueprint,
  onSelectMedium,
  onSelectFormat,
  onOpenLanding,
  onOpenEditor
}: {
  medium: CreativeMedium;
  format: CreativeFormat;
  blueprint: CreativeBlueprint;
  onSelectMedium: (medium: CreativeMedium) => void;
  onSelectFormat: (format: CreativeFormat) => void;
  onOpenLanding: () => void;
  onOpenEditor: (draft?: DraftChapterPayload) => void;
}) {
  const formatOptions = getFormatOptions(medium);
  const workflowBoard = buildTesterDrivenWorkflow(blueprint);
  const workflowPhases = blueprint.productionPhases;
  const intakePlan = useMemo(() => buildProjectIntakePlan(blueprint), [blueprint]);
  const focusedScope = useMemo(() => getFocusedServiceScope(), []);
  const flowAgentMap = useMemo(() => buildFlowAgentMap(), []);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [intakeOtherAnswers, setIntakeOtherAnswers] = useState<Record<string, string>>({});
  const [interviewNote, setInterviewNote] = useState('');
  const [freewriteText, setFreewriteText] = useState('');
  const [intakeQuestionIndex, setIntakeQuestionIndex] = useState(0);
  const [homeFlowStep, setHomeFlowStep] = useState<HomeFlowStep>('medium');
  const [llmIntakeQuestions, setLlmIntakeQuestions] = useState<ProjectIntakeQuestion[] | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const effectiveIntakeQuestions = llmIntakeQuestions ?? intakePlan.questions;

  // 자유 서술이나 매체가 바뀌면 LLM 인터뷰 질문 캐시를 비워 다음 진입 때 새로 생성한다
  useEffect(() => {
    setLlmIntakeQuestions(null);
  }, [freewriteText, blueprint.medium]);

  // 인터뷰 단계로 진입 — 자유 서술이 있으면 그 작품에 맞는 질문을 LLM에 요청한다
  async function goToIntake() {
    setHomeFlowStep('intake');
    setIntakeQuestionIndex(0);
    if (llmIntakeQuestions || isInterviewLoading || !freewriteText.trim()) {
      return;
    }
    setIsInterviewLoading(true);
    try {
      const result = await requestLlmInterview({ medium: blueprint.medium, freewrite: freewriteText });
      if (result.ok && result.questions) {
        setLlmIntakeQuestions(result.questions);
        setIntakeQuestionIndex(0);
      }
    } finally {
      setIsInterviewLoading(false);
    }
  }
  // 인터뷰 답변까지 모아 첫 회차 초안을 만들고, 끝나면 에디터로 넘긴다
  async function goToBuilding() {
    if (isBuilding) {
      return;
    }
    setHomeFlowStep('building');
    setIsBuilding(true);

    const answerLines = effectiveIntakeQuestions
      .map((question) => {
        const selected = intakeAnswers[question.id];
        if (!selected) {
          return null;
        }
        if (selected === '_other') {
          const other = intakeOtherAnswers[question.id]?.trim();
          return other ? `- ${question.question} → ${other}` : null;
        }
        const option = question.options.find((opt) => opt.id === selected);
        return option ? `- ${question.question} → ${option.label}` : null;
      })
      .filter((line): line is string => Boolean(line));

    const enrichedFreewrite = [
      freewriteText.trim(),
      answerLines.length > 0 ? `[작가 인터뷰 답변]\n${answerLines.join('\n')}` : '',
      interviewNote.trim() ? `[추가 메모]\n${interviewNote.trim()}` : ''
    ]
      .filter(Boolean)
      .join('\n\n');

    const llm = await requestLlmDraft({
      medium: blueprint.medium,
      format: blueprint.format,
      freewrite: enrichedFreewrite,
      title: '',
      context: ''
    });

    setIsBuilding(false);
    onOpenEditor(llm.ok && llm.payload ? llm.payload : undefined);
  }

  const homeFlowSteps: Array<{ id: HomeFlowStep; label: string; caption: string }> = [
    { id: 'medium', label: '매체 선택', caption: '무엇을 만들지 정합니다.' },
    { id: 'freewrite', label: '자유 서술', caption: '쓰고 싶은 이야기를 흘려 적습니다.' },
    { id: 'intake', label: '작가 인터뷰', caption: '에이전트가 맞춤 질문을 합니다.' }
  ];
  const homeFlowIndex =
    homeFlowStep === 'building' ? 3 : homeFlowSteps.findIndex((step) => step.id === homeFlowStep);

  return (
    <main className="home-page">
      <header className="hx-nav">
        <button type="button" className="hx-brand" onClick={onOpenLanding}>
          <span className="hx-brandmark" aria-hidden="true">
            <Sparkles size={13} />
          </span>
          <span>Story X</span>
        </button>
        <div className="hx-steps" role="tablist" aria-label="온보딩 단계">
          {homeFlowSteps.map((step, index) => {
            const stepIndex = homeFlowIndex < 0 ? 0 : homeFlowIndex;
            const isActive = step.id === homeFlowStep;
            const isDone = index < stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`hx-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                onClick={() => index <= stepIndex && setHomeFlowStep(step.id)}
              >
                <span className="hx-step-num">{isDone ? <Check size={11} /> : index + 1}</span>
                {step.label}
              </button>
            );
          })}
        </div>
        <button type="button" className="hx-btn" onClick={() => onOpenEditor()}>
          에디터로 <ChevronRight size={13} />
        </button>
      </header>

      <div className="hx-track" style={{ transform: `translateX(-${homeFlowIndex * 100}%)` }}>
        <section className="hx-panel" aria-label="매체와 형식 선택">
          <div className="hx-main">
            <p className="hx-eyebrow">01 · 매체</p>
            <h1 className="hx-h1">무엇을 만들까요?</h1>
            <p className="hx-lead">매체를 고르면 맞춤 작가진과 제작 흐름이 자동 배정됩니다.</p>
            <div className="hx-medium-grid">
              {mediumOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`hx-medium-card ${medium === option.id ? 'is-selected' : ''}`}
                  aria-pressed={medium === option.id}
                  onClick={() => onSelectMedium(option.id)}
                >
                  <span className="hx-medium-icon">{getMediumIcon(option.id)}</span>
                  <strong>{option.label}</strong>
                  <span className="hx-medium-signal">{option.signal}</span>
                  <p>{option.description}</p>
                  {medium === option.id && (
                    <span className="hx-medium-check">
                      <Check size={11} /> 선택됨
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="hx-format-stack">
              {formatOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`hx-format-card ${format === option.id ? 'is-selected' : ''}`}
                  aria-pressed={format === option.id}
                  onClick={() => onSelectFormat(option.id)}
                >
                  <span className="hx-format-cadence">{option.cadence}</span>
                  <strong>{option.label}</strong>
                  <p>{option.description}</p>
                </button>
              ))}
            </div>
          </div>
          <aside className="hx-aside">
            <div className="hx-aside-card">
              <div className="hx-aside-label">다음 단계</div>
              <div className="hx-aside-title">자유 서술</div>
              <p>쓰고 싶은 이야기를 자유롭게 흘려 적습니다. 구조나 인물 이름은 신경 쓰지 않아도 됩니다.</p>
            </div>
            <div className="hx-aside-card is-selected">
              <div className="hx-aside-label">선택됨</div>
              <div className="hx-aside-title">
                {blueprint.mediumLabel} · {blueprint.formatLabel}
              </div>
              <p>{blueprint.projectRoomSubtitle}</p>
            </div>
            <button type="button" className="hx-btn hx-btn-block" onClick={() => setHomeFlowStep('freewrite')}>
              자유 서술로 계속
            </button>
          </aside>
        </section>

        <section className="hx-panel" aria-label="자유 서술 단계">
          <div className="hx-main">
            <p className="hx-eyebrow">02 · 자유 서술</p>
            <h1 className="hx-h1">쓰고 싶은 이야기를 자유롭게 적어주세요.</h1>
            <p className="hx-lead">
              구조, 인물 이름, 사건 순서는 신경 쓰지 않아도 됩니다. 떠오르는 대로 한 문단이면 충분합니다. 다음
              단계에서 이 글을 기반으로 맞춤 인터뷰를 드립니다.
            </p>
            <textarea
              className="hx-freewrite"
              aria-label="자유 서술 입력"
              value={freewriteText}
              onChange={(event) => setFreewriteText(event.target.value)}
              placeholder={
                blueprint.medium === 'essay'
                  ? '예: 엄마가 돌아가신 뒤 1년 동안 부엌을 못 들어갔다. 1년 후 처음 들어갔을 때 냉장고에 메모를 발견했다.'
                  : '예: 오빠가 사라진 그날 새벽, 한 소녀가 달의 탑 아래에서 마르지 않은 잉크 자국을 찾는다.'
              }
              rows={10}
            />
            <p className="hx-freewrite-meter">
              {freewriteText.trim().length}자
              {blueprint.medium === 'audiobook' && (() => {
                const charCount = freewriteText.trim().length;
                const minutes = Math.floor(charCount / 280);
                const seconds = Math.round((charCount % 280) / 280 * 60);
                return ` · 예상 낭독 ${minutes}분 ${seconds}초`;
              })()}
            </p>
            {blueprint.medium === 'essay' && (
              <p className="hx-fact-note">
                <Lock size={13} aria-hidden="true" />
                <span>
                  <strong>사실 보호 모드</strong> 에세이/회고 매체에서는 자유 서술에 적지 않은 디테일(인물의
                  직업·나이·장소 등)을 AI가 발명하지 않습니다. 빈 곳은 빈 곳으로 남고, 채우는 건 작가의 몫입니다.
                </span>
              </p>
            )}
          </div>
          <aside className="hx-aside">
            <div className="hx-aside-card">
              <div className="hx-aside-label">다음 단계</div>
              <div className="hx-aside-title">작가 인터뷰</div>
              <p>이 서술을 기반으로 작가진이 인물·세계·문체를 빠르게 묻습니다. 비워도 인터뷰는 작동합니다.</p>
            </div>
            <div className="hx-aside-actions">
              <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('medium')}>
                이전
              </button>
              <button type="button" className="hx-btn" onClick={goToIntake}>
                인터뷰로 계속
              </button>
            </div>
          </aside>
        </section>

        <section className="hx-panel" aria-label="새 프로젝트 작가 인터뷰">
          <div className="hx-main">
            <p className="hx-eyebrow">03 · 작가 인터뷰</p>
            <h1 className="hx-h1">작가진이 먼저 묻습니다.</h1>
            <p className="hx-lead">
              {intakePlan.summary} 선택은 언제든지 에디터에서 바꿀 수 있습니다. 변경이 기존 회차와 충돌하면 영향
              범위를 먼저 보여줍니다.
            </p>
            <div className="hx-progress" aria-label="질문 진행도">
              <span>
                {intakeQuestionIndex + 1} / {effectiveIntakeQuestions.length}
              </span>
              <div className="hx-progress-bar" aria-hidden="true">
                <i style={{ width: `${((intakeQuestionIndex + 1) / effectiveIntakeQuestions.length) * 100}%` }} />
              </div>
            </div>
            {(() => {
              if (isInterviewLoading) {
                return (
                  <article className="hx-intake-q">
                    <div className="hx-intake-interviewer">
                      <b>인터뷰어들이 원고를 읽고 있습니다…</b>
                      <em>당신이 쓴 자유 서술에 맞는 질문을 준비하는 중입니다.</em>
                    </div>
                  </article>
                );
              }

              const question = effectiveIntakeQuestions[intakeQuestionIndex];
              if (!question) return null;
              const selectedOption = intakeAnswers[question.id] ?? question.recommendedOptionId;
              const persona = getIntakePersona(question.agentId);

              return (
                <article className="hx-intake-q" key={question.id}>
                  <div className="hx-intake-interviewer">
                    <b>{persona.name}</b>
                    <em>
                      {String(intakeQuestionIndex + 1).padStart(2, '0')} · {persona.blurb}
                    </em>
                  </div>
                  <h3 className="hx-intake-question-text">{question.question}</h3>
                  <div className="hx-intake-options">
                    {question.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`hx-intake-option ${selectedOption === option.id ? 'is-selected' : ''}`}
                        onClick={() => setIntakeAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      >
                        <strong>{option.label}</strong>
                        <small>{option.impact}</small>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`hx-intake-option ${selectedOption === '_other' ? 'is-selected' : ''}`}
                      onClick={() => setIntakeAnswers((current) => ({ ...current, [question.id]: '_other' }))}
                    >
                      <strong>기타 (직접 입력)</strong>
                      <small>객관식으로 안 맞는 답을 이쪽에 직접 적습니다.</small>
                    </button>
                  </div>
                  {selectedOption === '_other' && (
                    <textarea
                      className="hx-other-input"
                      aria-label={`${question.question} 기타 답변`}
                      placeholder="이 질문에 대한 답을 한두 문장으로 적어주세요."
                      value={intakeOtherAnswers[question.id] ?? ''}
                      onChange={(event) =>
                        setIntakeOtherAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value
                        }))
                      }
                      rows={3}
                    />
                  )}
                </article>
              );
            })()}
            <div className="hx-q-nav">
              {intakeQuestionIndex > 0 && (
                <button
                  type="button"
                  className="hx-btn-ghost"
                  onClick={() => setIntakeQuestionIndex((current) => Math.max(0, current - 1))}
                >
                  이전 질문
                </button>
              )}
              {!isInterviewLoading && intakeQuestionIndex < effectiveIntakeQuestions.length - 1 && (
                <button
                  type="button"
                  className="hx-btn"
                  style={{ marginLeft: 'auto' }}
                  onClick={() =>
                    setIntakeQuestionIndex((current) =>
                      Math.min(effectiveIntakeQuestions.length - 1, current + 1)
                    )
                  }
                >
                  다음 질문
                </button>
              )}
            </div>
            <article className="hx-open-note">
              <div className="hx-aside-label">추가 메모 (선택)</div>
              <h3 className="hx-intake-question-text">선택지로 담기 어려운 설정이 있나요?</h3>
              <textarea
                aria-label="추가 메모 (주관식)"
                className="hx-other-input"
                value={interviewNote}
                onChange={(event) => setInterviewNote(event.target.value)}
                placeholder="예: 1부는 인간 시점, 2부는 토착 종족 시점으로 같은 사건을 다시 본다."
                rows={3}
              />
            </article>
          </div>
          <aside className="hx-aside">
            <div className="hx-aside-card is-selected">
              <div className="hx-aside-label">선택한 파이프라인</div>
              <div className="hx-aside-title">
                {blueprint.mediumLabel} · {blueprint.formatLabel}
              </div>
              <p>쇼러너, 캐릭터 큐레이터, 배경 설계자, 장르 스타일리스트, 연속성 감수자가 작가진으로 배정됩니다.</p>
            </div>
            <div className="hx-aside-actions">
              <button type="button" className="hx-btn-ghost" onClick={() => setHomeFlowStep('freewrite')}>
                이전
              </button>
              <button type="button" className="hx-btn" onClick={goToBuilding}>
                질문 완료 — 첫 회차 만들기
              </button>
            </div>
          </aside>
        </section>

        <section className="hx-panel hx-panel-building" aria-label="첫 회차 구성 중">
          <div className="hx-building">
            <p className="hx-eyebrow">04 · 구성</p>
            <h1 className="hx-h1">작가진이 첫 회차를 쓰고 있습니다.</h1>
            <p className="hx-lead">
              자유 서술과 인터뷰 답변을 읽고, 첫 회차 초안과 작품 바이블의 초기 설정을 구성합니다. 끝나면 편집
              화면이 열립니다.
            </p>
            <ol className="hx-building-steps" aria-label="구성 단계">
              <li>자유 서술과 인터뷰 답변을 읽습니다.</li>
              <li>쇼러너가 첫 회차의 약속과 후크를 잡습니다.</li>
              <li>캐릭터·배경 설계가 첫 장면을 세웁니다.</li>
              <li>첫 회차 초안을 쓰고, 바이블에 초기 설정을 제안합니다.</li>
            </ol>
            <p className="hx-building-note">잠시만 기다려 주세요 — 보통 1~3분 걸립니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FlowAgentLayerCard({ assignment }: { assignment: FlowAgentAssignment }) {
  const layerRows = [
    { label: '프론트 에이전트', agents: [assignment.frontAgent] },
    { label: '미드 에이전트', agents: assignment.midAgents },
    { label: '백 에이전트', agents: assignment.backAgents }
  ];

  return (
    <article className="flow-agent-layer-card" aria-label="단계별 에이전트 운영">
      <span>Agent Stack</span>
      <h2>보이는 도움과 보이지 않는 관리</h2>
      {layerRows.map((row) => (
        <div key={row.label}>
          <strong>{row.label}</strong>
          {row.agents.map((agent) => (
            <p key={agent.id}>
              <b>{agent.label}</b>
              <small>{agent.role}</small>
            </p>
          ))}
        </div>
      ))}
    </article>
  );
}

function TesterEvaluationUpdateSection({ blueprint }: { blueprint: CreativeBlueprint }) {
  const workflowBoard = buildTesterDrivenWorkflow(blueprint);
  const verticalSlice = buildOneProjectVerticalSlice();
  const verticalSliceFollowup = p05EvaluationFollowups.find((followup) => followup.id === 'one-project-vertical-slice');

  return (
    <section className="tester-update-section" id="evaluation-update" aria-label="테스터 평가 반영 업데이트">
      <div className="tester-update-head">
        <p className="framer-eyebrow">Evaluator Update · 2026-05-15</p>
        <h2>20인 재테스트는 다음 증명을 One Project Vertical Slice로 좁혔습니다.</h2>
        <p>{evaluationNorthStar}</p>
      </div>
      <div className="tester-update-grid">
        <article className="tester-workflow-card">
          <span>Current board</span>
          <strong>
            {workflowBoard.mediumLabel} · {workflowBoard.formatLabel}
          </strong>
          <p>{workflowBoard.activationMetric}</p>
          <ol>
            {workflowBoard.steps.slice(0, 5).map((step) => (
              <li key={step.title}>
                <b>{step.title}</b>
                <small>{step.owner}</small>
              </li>
            ))}
          </ol>
        </article>
        <div className="tester-capability-grid">
          {p0EvaluationCapabilities.map((capability) => (
            <article key={capability.id}>
              <span>{capability.label}</span>
              <p>{capability.productMove}</p>
              <small>{capability.guardrail}</small>
            </article>
          ))}
        </div>
        <article className="vertical-slice-proof-card">
          <span>One Project Vertical Slice</span>
          <strong>{verticalSlice.title}</strong>
          <p>짧은 원작을 웹소설 1화, 인스타툰 4컷, 오디오북 30초 샘플로 증명합니다.</p>
          <p>{verticalSliceFollowup?.proof}</p>
          <div>
            {verticalSlice.artifacts.map((artifact) => (
              <small key={artifact.id}>
                {artifact.label}
                <b>{artifact.proof.split(':')[0]}</b>
              </small>
            ))}
          </div>
          <em>{verticalSlice.approvalRequiredBeforeSync ? '승인 전 memory sync 금지' : '자동 sync 가능'}</em>
        </article>
      </div>
      <div className="tester-roadmap-strip">
        <span>Now: {evaluationDrivenRoadmap.now[0]}</span>
        <span>Next: {evaluationDrivenRoadmap.next[0]}</span>
        <span>Later: {evaluationDrivenRoadmap.later[3]}</span>
      </div>
    </section>
  );
}

function ServiceOperationsSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`service-ops-section ${compact ? 'is-compact' : ''}`} id="operations" aria-label="서비스 운영실">
      <div className="service-ops-head">
        <p className="framer-eyebrow">Service Operations Room</p>
        <h2>작품을 만드는 에디터 바깥에는, 서비스를 키우는 운영실이 있습니다.</h2>
        <p>
          창작실 에이전트가 작품의 재미와 일관성을 책임진다면, 서비스 운영실은 에디터 집중도,
          온보딩, 홈페이지 메시지, 수익화, 배포, 개선 루프를 관리합니다.
          에디터 UX 디렉터와 수익화 설계자가 각각 집중 경험과 유료 전환의 균형을 잡습니다.
        </p>
      </div>
      <div className="service-ops-groups">
        {serviceOperationsGroups.map((group) => (
          <article key={group.id}>
            <span>{group.label}</span>
            <p>{group.mission}</p>
            <div className="service-agent-grid">
              {getServiceAgentsByGroup(group.id).map((agent) => (
                <div key={agent.id} className="service-agent-card">
                  <strong>{agent.title}</strong>
                  <p>{agent.priority}</p>
                  <small>{agent.deliverables[0]}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="service-ops-note">등록된 서비스 운영 에이전트 {serviceOperationsAgents.length}명</p>
    </section>
  );
}

interface CreativeGatewayProps {
  medium: CreativeMedium;
  format: CreativeFormat;
  onSelectMedium: (medium: CreativeMedium) => void;
  onSelectFormat: (format: CreativeFormat) => void;
  onOpenStoryXTest: () => void;
  onStart: () => void;
}

function CreativeGateway({
  medium,
  format,
  onSelectMedium,
  onSelectFormat,
  onOpenStoryXTest,
  onStart
}: CreativeGatewayProps) {
  const formatOptions = getFormatOptions(medium);
  const selectedBlueprint = buildCreativeBlueprint({ medium, format });
  const routeSteps = [
    { label: '매체 선택', value: selectedBlueprint.mediumLabel, complete: Boolean(medium) },
    { label: '포맷 선택', value: selectedBlueprint.formatLabel, complete: Boolean(format) },
    { label: '바이블 구성', value: '다음', complete: false },
    { label: '제작실', value: '대기', complete: false }
  ];

  return (
    <main className="gateway-shell">
      <nav className="site-nav" aria-label="main">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Feather size={18} />
          </span>
          <div>
            <p>Story X workspace</p>
            <h1>Story X</h1>
          </div>
        </div>
        <button type="button" className="ghost-button" onClick={onStart}>
          <PanelsTopLeft size={17} />
          설계 보드
        </button>
        <button type="button" className="ghost-button" onClick={onOpenStoryXTest}>
          <Sparkles size={17} />
          Story X
        </button>
      </nav>

      <section className="gateway-hero">
        <div>
          <p className="eyebrow">Project intake</p>
          <h2>글, 그림, 소리를 이야기 하네스로 조립합니다.</h2>
          <p>
            Story X는 스토리의 재미와 완성도를 먼저 세우고, 그다음 소설, 에세이, 만화,
            오디오북, 영상 컷으로 빠르게 전환합니다. 매체를 고르면 필요한 AI 자원과 제작 역할이
            하나의 흐름으로 맞춰집니다.
          </p>
          <div className="hero-actions">
            <button type="button" className="produce-button" onClick={onStart}>
              <WandSparkles size={18} />
              선택한 구조로 시작
            </button>
            <span>{selectedBlueprint.projectRoomTitle}</span>
          </div>
        </div>
        <div className="routing-map" aria-label="selected workflow preview">
          {routeSteps.map((step, index) => (
            <div key={step.label} className={step.complete ? 'is-complete' : ''}>
              <span>{step.complete ? <Check size={13} /> : index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.value}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="gateway-grid" aria-label="creative choices">
        <div className="choice-section">
          <div className="section-title">
            <Library size={16} />
            <h2>1. 무엇을 만들까요?</h2>
          </div>
          <div className="medium-grid">
            {mediumOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={`choice-card ${medium === option.id ? 'selected' : ''}`}
                onClick={() => onSelectMedium(option.id)}
                aria-pressed={medium === option.id}
              >
                {medium === option.id && (
                  <span className="selection-check" aria-label="선택됨">
                    <Check size={14} />
                  </span>
                )}
                {getMediumIcon(option.id)}
                <strong>{option.label}</strong>
                <span>{option.signal}</span>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="choice-section">
          <div className="section-title">
            <Layers size={16} />
            <h2>2. 어떤 규모인가요?</h2>
          </div>
          <div className="format-list">
            {formatOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={format === option.id ? 'selected' : ''}
                onClick={() => onSelectFormat(option.id)}
                aria-pressed={format === option.id}
              >
                {format === option.id && (
                  <span className="selection-check" aria-label="선택됨">
                    <Check size={13} />
                  </span>
                )}
                <span>{option.cadence}</span>
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="gateway-summary">
          <div className="section-title">
            <Map size={16} />
            <h2>선택 결과</h2>
          </div>
          <strong>
            {selectedBlueprint.mediumLabel} / {selectedBlueprint.formatLabel}
          </strong>
          <p>{selectedBlueprint.projectRoomSubtitle}</p>
          <ul>
            {selectedBlueprint.managementFocus.slice(0, 4).map((item) => (
              <li key={item}>
                <Check size={14} />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}

function getMediumIcon(medium: CreativeMedium) {
  if (medium === 'novel') {
    return <FileText size={24} />;
  }

  if (medium === 'essay') {
    return <Feather size={24} />;
  }

  if (medium === 'audiobook') {
    return <Clapperboard size={24} />;
  }

  return <PanelsTopLeft size={24} />;
}

function BlueprintRoom({
  blueprint,
  onHome,
  onOpenDevelopment
}: {
  blueprint: CreativeBlueprint;
  onHome: () => void;
  onOpenDevelopment: () => void;
}) {
  return (
    <main className="blueprint-shell">
      <nav className="site-nav">
        <button type="button" className="ghost-button" onClick={onHome}>
          <Home size={17} />
          처음으로
        </button>
        <button type="button" className="produce-button" onClick={onOpenDevelopment}>
          <WandSparkles size={18} />
          작품 개발실 열기
        </button>
      </nav>

      <header className="blueprint-header">
        <p className="eyebrow">
          {blueprint.mediumLabel} / {blueprint.formatLabel}
        </p>
        <h1>{blueprint.projectRoomTitle}</h1>
        <p>{blueprint.projectRoomSubtitle}</p>
      </header>

      <section className="blueprint-grid">
        <BlueprintPanel icon={<BookOpen size={18} />} title="관리 항목">
          <ul className="stack-list">
            {blueprint.managementFocus.map((item) => (
              <li key={item}>
                <Check size={14} />
                {item}
              </li>
            ))}
          </ul>
        </BlueprintPanel>

        <BlueprintPanel icon={<BrainCircuit size={18} />} title="협업 에이전트">
          <div className="pill-cloud">
            {blueprint.agentStack.map((agent) => (
              <span key={agent}>{agent}</span>
            ))}
          </div>
        </BlueprintPanel>

        <BlueprintPanel icon={<Feather size={18} />} title="적용 스킬">
          <div className="skill-stack">
            {blueprint.skillStack.map((skill) => (
              <code key={skill}>{skill}</code>
            ))}
          </div>
          <p className="panel-note">
            Claude Code용 파일은 `.claude`에 있고, Codex는 `AGENTS.md`와 `docs/codex-agent-manifest.md`를
            기준으로 같은 역할 구조를 적용합니다.
          </p>
        </BlueprintPanel>

        <BlueprintPanel icon={<GitBranch size={18} />} title="제작 단계">
          <div className="phase-stack">
            {blueprint.productionPhases.map((phase, index) => (
              <article key={phase.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{phase.title}</strong>
                  <p>{phase.outcome}</p>
                </div>
              </article>
            ))}
          </div>
        </BlueprintPanel>
      </section>
    </main>
  );
}

function DevelopmentRoom({
  blueprint,
  input,
  packageResult,
  onInputChange,
  onDevelop,
  onHome,
  onBack,
  onOpenStudio
}: {
  blueprint: CreativeBlueprint;
  input: CreativeDevelopmentInput;
  packageResult: CreativeDevelopmentPackage | null;
  onInputChange: (input: CreativeDevelopmentInput) => void;
  onDevelop: () => void;
  onHome: () => void;
  onBack: () => void;
  onOpenStudio: () => void;
}) {
  const fieldCopy = getDevelopmentFieldCopy(blueprint);

  function updateField(field: keyof CreativeDevelopmentInput, value: string) {
    onInputChange({ ...input, [field]: value });
  }

  return (
    <main className="development-shell">
      <nav className="site-nav">
        <div className="top-actions">
          <button type="button" className="ghost-button" onClick={onHome}>
            <Home size={17} />
            처음으로
          </button>
          <button type="button" className="ghost-button" onClick={onBack}>
            <ArrowLeft size={17} />
            설계 보드
          </button>
        </div>
        <button type="button" className="produce-button" onClick={onOpenStudio}>
          <PanelsTopLeft size={18} />
          제작실로
        </button>
      </nav>

      <header className="development-header">
        <p className="eyebrow">
          {blueprint.mediumLabel} / {blueprint.formatLabel}
        </p>
        <h1>작품 개발실</h1>
        <p>{fieldCopy.description}</p>
      </header>

      <section className="development-grid">
        <article className="development-form">
          <DevelopmentField
            icon={<Sparkles size={17} />}
            label={fieldCopy.material}
            value={input.material}
            onChange={(value) => updateField('material', value)}
          />
          <DevelopmentField
            icon={<Drama size={17} />}
            label={fieldCopy.story}
            value={input.storySeed}
            onChange={(value) => updateField('storySeed', value)}
          />
          <DevelopmentField
            icon={<PenTool size={17} />}
            label={fieldCopy.style}
            value={input.artDirection}
            onChange={(value) => updateField('artDirection', value)}
          />
          <DevelopmentField
            icon={<UserRound size={17} />}
            label={fieldCopy.character}
            value={input.characterSeed}
            onChange={(value) => updateField('characterSeed', value)}
          />
          <div className="development-row">
            <label>
              <span>독자</span>
              <input value={input.audience} onChange={(event) => updateField('audience', event.target.value)} />
            </label>
            <label>
              <span>제약</span>
              <input value={input.constraints} onChange={(event) => updateField('constraints', event.target.value)} />
            </label>
          </div>
          <button type="button" className="produce-button" onClick={onDevelop}>
            <BrainCircuit size={18} />
            에이전트 협업 시작
          </button>
        </article>

        <DevelopmentResult blueprint={blueprint} packageResult={packageResult} />
      </section>
    </main>
  );
}

function getDevelopmentFieldCopy(blueprint: CreativeBlueprint) {
  if (blueprint.medium === 'essay') {
    return {
      description: '내 경험, 질문, 주변 인물, 문체 취향을 계속 물어보며 에세이 패키지로 정리합니다.',
      material: '내 이야기',
      story: '질문/전환점',
      style: '문체 취향',
      character: '주변 인물'
    };
  }

  if (blueprint.medium === 'comics') {
    return {
      description: '소재, 스토리, 작화, 캐릭터를 함께 입력하면 에이전트들이 작품 패키지로 정리합니다.',
      material: '소재',
      story: '스토리',
      style: '작화',
      character: '캐릭터'
    };
  }

  if (blueprint.medium === 'audiobook') {
    return {
      description: '원문/소재, 오디오 구성, 목소리와 음악 톤, 화자를 함께 입력하면 낭독과 영상 제작 패키지로 정리합니다.',
      material: '원문/소재',
      story: '오디오 구성',
      style: '음성/음악 톤',
      character: '화자/등장인물'
    };
  }

  return {
    description: '소재, 스토리, 문체, 캐릭터를 함께 입력하면 에이전트들이 작품 패키지로 정리합니다.',
    material: '소재',
    story: '스토리',
    style: '문체',
    character: '캐릭터'
  };
}

function DevelopmentField({
  icon,
  label,
  value,
  onChange
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="development-field">
      <span>
        {icon}
        {label}
      </span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function DevelopmentResult({
  blueprint,
  packageResult
}: {
  blueprint: CreativeBlueprint;
  packageResult: CreativeDevelopmentPackage | null;
}) {
  if (!packageResult) {
    return (
      <aside className="development-result empty">
        <Sparkles size={24} />
        <h2>협업 대기 중</h2>
        <p>{blueprint.agentStack.join(', ')}가 입력을 기다리고 있습니다.</p>
      </aside>
    );
  }

  return (
    <aside className="development-result">
      <p className="eyebrow">Project Package</p>
      <h2>{packageResult.title}</h2>
      <p className="result-logline">{packageResult.logline}</p>

      <div className="result-section contract-section">
        <h3>Story Contract</h3>
        <p>{packageResult.storyContract.audiencePromise}</p>
        <div className="contract-chip-row">
          <span>{packageResult.storyContract.formatPromise}</span>
          <span>{packageResult.storyContract.woundOrCost}</span>
        </div>
      </div>

      <div className="result-section workflow-board-mini">
        <h3>Workflow Board</h3>
        <ol>
          {packageResult.workflowBoard.steps.slice(0, 5).map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.owner}</span>
            </li>
          ))}
        </ol>
        <p>{packageResult.workflowBoard.platformProof}</p>
      </div>

      <div className="result-section">
        <h3>스토리 아크</h3>
        <ol>
          {packageResult.storyArc.map((beat) => (
            <li key={beat}>{beat}</li>
          ))}
        </ol>
      </div>

      <div className="result-section">
        <h3>캐릭터</h3>
        {packageResult.characters.map((character) => (
          <article key={character.name} className="mini-character">
            <strong>{character.name}</strong>
            <p>{character.role}</p>
            <span>{character.contradiction}</span>
          </article>
        ))}
      </div>

      <div className="result-section">
        <h3>
          {blueprint.medium === 'comics'
            ? '컷/작화 계획'
            : blueprint.medium === 'essay'
              ? '문체/질문 계획'
              : blueprint.medium === 'audiobook'
                ? '오디오/영상 계획'
                : '문체 계획'}
        </h3>
        <p>{packageResult.visualPlan}</p>
        {packageResult.panelPlan.length > 0 && (
          <div className="panel-plan-grid">
            {packageResult.panelPlan.map((panel) => (
              <article key={panel.position}>
                <span>{panel.position}</span>
                <strong>{panel.purpose}</strong>
                <p>{panel.scene}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {packageResult.imagePromptPlan && (
        <div className="result-section">
          <h3>{packageResult.imagePromptPlan.agentName}</h3>
          <div className="prompt-principles">
            {packageResult.imagePromptPlan.principles.slice(0, 3).map((principle) => (
              <span key={principle}>{principle}</span>
            ))}
          </div>
          <div className="image-prompt-list">
            {packageResult.imagePromptPlan.frames.map((frame) => (
              <article key={frame.position}>
                <div className="prompt-frame-head">
                  <span>{frame.position}</span>
                  <strong>{frame.purpose}</strong>
                  <em>{frame.structuredPrompt.aspect_ratio}</em>
                </div>
                <pre>{frame.prompt}</pre>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="result-section">
        <h3>Quality Gates</h3>
        <div className="quality-gate-grid">
          {packageResult.qualityGates.map((gate) => (
            <article key={gate.id}>
              <span>{gate.label}</span>
              <strong>{gate.status === 'ready' ? 'ready' : 'review'}</strong>
              <p>{gate.priority}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="result-section autopsy-section">
        <h3>AI Output Autopsy</h3>
        <ul>
          {packageResult.outputAutopsy.newCanonCandidates.slice(0, 2).map((candidate) => (
            <li key={candidate}>{candidate}</li>
          ))}
        </ul>
        <p>{packageResult.outputAutopsy.userApprovalRequired ? '기억은행 반영 전 사용자 승인이 필요합니다.' : '자동 반영 가능'}</p>
      </div>

      <div className="result-section refactor-section">
        <h3>Refactor Impact Preview</h3>
        <p>{packageResult.refactorImpactPreview.trigger}</p>
        <div className="contract-chip-row">
          {packageResult.refactorImpactPreview.impactedAreas.slice(0, 5).map((area) => (
            <span key={area}>{area}</span>
          ))}
        </div>
      </div>

      <div className="result-section reference-dna-section">
        <h3>Reference DNA</h3>
        {packageResult.referenceDnaCards.map((card) => (
          <article key={card.title}>
            <strong>{card.title}</strong>
            <p>{card.structuralEngine}</p>
            <small>{card.guardrail}</small>
          </article>
        ))}
      </div>

      <div className="result-section">
        <h3>에이전트 결정</h3>
        <div className="agent-report-list">
          {packageResult.agentReports.map((report) => (
            <article key={report.agent}>
              <strong>{report.agent}</strong>
              <span>{report.decision}</span>
              <p>{report.output}</p>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}

function BlueprintPanel({
  icon,
  title,
  children
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="blueprint-panel">
      <div className="section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

interface StudioLayoutProps {
  blueprint: CreativeBlueprint;
  developmentPackage: CreativeDevelopmentPackage | null;
  project: SeriesProject;
  setProject: (project: SeriesProject) => void;
  request: ProductionRequest;
  setRequest: React.Dispatch<React.SetStateAction<ProductionRequest>>;
  agentRuns: AgentRun[];
  setAgentRuns: (runs: AgentRun[]) => void;
  latestChapter: Chapter | null;
  setLatestChapter: (chapter: Chapter | null) => void;
  activePane: ActivePane;
  setActivePane: (pane: ActivePane) => void;
  onBack: () => void;
  onHome: () => void;
}

function StudioLayout({
  blueprint,
  developmentPackage,
  project,
  setProject,
  request,
  setRequest,
  agentRuns,
  setAgentRuns,
  latestChapter,
  setLatestChapter,
  activePane,
  setActivePane,
  onBack,
  onHome
}: StudioLayoutProps) {
  const canonHealth = useMemo(() => {
    const total = project.canonFacts.length + project.worldRules.length + project.characters.length;
    const episodes = Math.max(project.currentEpisode, 1);
    return Math.min(99, Math.round((total / (episodes + 6)) * 16));
  }, [project]);

  function handleProduce() {
    const result = produceNextChapter(project, request);
    setProject(result.updatedProject);
    setAgentRuns(result.agentRuns);
    setLatestChapter(result.chapter);
    setActivePane('chapter');
  }

  function handleReset() {
    clearProject();
    const seed = createSeedProject();
    setProject(seed);
    setLatestChapter(null);
    setAgentRuns([]);
    setRequest((current) => ({ ...current, genre: seed.genre }));
  }

  const isVisualWorkspace = blueprint.nextWorkspace === 'visual-storyboard-studio';

  return (
    <main className="studio-shell">
      <section className="command-rail" aria-label="series bible">
        <div className="brand-lockup">
          <span className="brand-mark">
            {isVisualWorkspace ? <Clapperboard size={18} /> : <Feather size={18} />}
          </span>
          <div>
            <p>{blueprint.mediumLabel} Studio</p>
            <h1>{developmentPackage?.title ?? (isVisualWorkspace ? blueprint.projectRoomTitle : project.title)}</h1>
          </div>
        </div>

        <div className="series-pulse">
          <div>
            <span>{isVisualWorkspace ? 'CUTS' : 'EP'}</span>
            <strong>{String(project.currentEpisode).padStart(2, '0')}</strong>
          </div>
          <div>
            <span>CANON</span>
            <strong>{canonHealth}%</strong>
          </div>
          <div>
            <span>THREADS</span>
            <strong>{project.openThreads.length}</strong>
          </div>
        </div>

        <section className="rail-section">
          <div className="section-title">
            <BookOpen size={16} />
            <h2>{isVisualWorkspace ? '비주얼 바이블' : '시리즈 바이블'}</h2>
          </div>
          <p className="logline">
            {developmentPackage?.logline ?? (isVisualWorkspace ? blueprint.projectRoomSubtitle : project.logline)}
          </p>
          <dl className="compact-list">
            {blueprint.managementFocus.slice(0, 2).map((focus) => (
              <div key={focus}>
                <dt>관리</dt>
                <dd>{focus}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rail-section">
          <div className="section-title">
            <BrainCircuit size={16} />
            <h2>에이전트 메모리</h2>
          </div>
          <div className="character-stack">
            {project.characters.map((character) => (
              <article className="character-tile" key={character.id}>
                <div>
                  <strong>{character.name}</strong>
                  <span>{character.role}</span>
                </div>
                <p>{character.currentState}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rail-section">
          <div className="section-title">
            <Boxes size={16} />
            <h2>규칙 잠금</h2>
          </div>
          <ul className="rule-list">
            {project.worldRules.map((rule) => (
              <li key={rule.id}>
                <Check size={14} />
                <span>{rule.rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="workbench" aria-label="agent collaboration workbench">
        <header className="top-strip">
          <div>
            <p>{blueprint.mediumLabel} Pipeline</p>
            <h2>{isVisualWorkspace ? '비주얼 콘티 제작실' : '연재 일관성 제작실'}</h2>
          </div>
          <div className="top-actions">
            <button type="button" className="ghost-button compact" onClick={onHome}>
              <Home size={17} />
              처음으로
            </button>
            <button type="button" className="icon-button" onClick={onBack} aria-label="설계 보드로">
              <ArrowLeft size={18} />
            </button>
            <button type="button" className="icon-button" onClick={() => saveProject(project)} aria-label="저장">
              <Save size={18} />
            </button>
            <button type="button" className="icon-button" onClick={handleReset} aria-label="초기화">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {isVisualWorkspace ? (
          <StoryboardWorkspace blueprint={blueprint} />
        ) : (
          <WritingWorkspace
            request={request}
            setRequest={setRequest}
            onProduce={handleProduce}
            agentRuns={agentRuns}
            latestChapter={latestChapter}
            project={project}
            activePane={activePane}
            setActivePane={setActivePane}
          />
        )}
      </section>

      <section className="history-rail" aria-label="chapter history">
        <div className="section-title">
          <History size={16} />
          <h2>{isVisualWorkspace ? '콘티 로그' : '연재 로그'}</h2>
        </div>
        {project.chapters.length === 0 ? (
          <div className="empty-log">
            <Sparkles size={22} />
            <p>{isVisualWorkspace ? '콘티 엔진이 연결되면 로그가 채워집니다.' : '첫 회차를 생성하면 로그가 채워집니다.'}</p>
          </div>
        ) : (
          <div className="episode-list">
            {project.chapters
              .slice()
              .reverse()
              .map((chapter) => (
                <button
                  type="button"
                  key={chapter.id}
                  onClick={() => {
                    setLatestChapter(chapter);
                    setActivePane('chapter');
                  }}
                >
                  <span>{String(chapter.episode).padStart(2, '0')}</span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.hook}</small>
                </button>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

function WritingWorkspace({
  request,
  setRequest,
  onProduce,
  agentRuns,
  latestChapter,
  project,
  activePane,
  setActivePane
}: {
  request: ProductionRequest;
  setRequest: React.Dispatch<React.SetStateAction<ProductionRequest>>;
  onProduce: () => void;
  agentRuns: AgentRun[];
  latestChapter: Chapter | null;
  project: SeriesProject;
  activePane: ActivePane;
  setActivePane: (pane: ActivePane) => void;
}) {
  return (
    <>
      <section className="draft-console">
        <label>
          <span>장르 엔진</span>
          <select
            value={request.genre}
            onChange={(event) => setRequest((current) => ({ ...current, genre: event.target.value as GenreId }))}
          >
            {Object.entries(genreProfiles).map(([id, profile]) => (
              <option key={id} value={id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label className="wide-field">
          <span>이번 회차 사건</span>
          <input
            value={request.intent}
            onChange={(event) => setRequest((current) => ({ ...current, intent: event.target.value }))}
          />
        </label>
        <label className="wide-field">
          <span>감정 압력</span>
          <input
            value={request.pressure}
            onChange={(event) => setRequest((current) => ({ ...current, pressure: event.target.value }))}
          />
        </label>
        <button type="button" className="produce-button" onClick={onProduce}>
          <WandSparkles size={18} />
          회차 생성
        </button>
      </section>

      <AgentLane runs={agentRuns.length > 0 ? agentRuns : placeholderRuns} />

      <section className="result-grid">
        <article className="manuscript-panel">
          <div className="tabs" role="tablist" aria-label="result views">
            <button
              type="button"
              className={activePane === 'chapter' ? 'active' : ''}
              onClick={() => setActivePane('chapter')}
            >
              <Feather size={15} />
              원고
            </button>
            <button
              type="button"
              className={activePane === 'canon' ? 'active' : ''}
              onClick={() => setActivePane('canon')}
            >
              <Database size={15} />
              캐논
            </button>
          </div>

          {activePane === 'chapter' ? <ChapterView chapter={latestChapter} /> : <CanonView project={project} />}
        </article>

        <ContinuityPanel project={project} />
      </section>
    </>
  );
}

function StoryboardWorkspace({ blueprint }: { blueprint: CreativeBlueprint }) {
  const storyboardRuns: AgentRun[] = blueprint.agentStack.map((agent, index) => ({
    agentId: index === 0 ? 'showrunner' : index === 1 ? 'character-custodian' : index === 2 ? 'world-keeper' : index === 3 ? 'genre-stylist' : 'continuity-editor',
    title: agent,
    status: 'complete',
    output: index === 3 ? '장면을 컷, 카메라 거리, 스크롤 후킹으로 분해합니다.' : `${blueprint.formatLabel} 제작 기준을 점검합니다.`,
    evidence: [blueprint.managementFocus[index % blueprint.managementFocus.length]]
  }));

  return (
    <>
      <section className="storyboard-console">
        <div>
          <p className="eyebrow">Visual Workspace</p>
          <h3>{blueprint.projectRoomTitle}</h3>
          <p>{blueprint.projectRoomSubtitle}</p>
        </div>
        <button type="button" className="produce-button">
          <PenTool size={18} />
          콘티 보드 준비
        </button>
      </section>

      <AgentLane runs={storyboardRuns} />

      <section className="storyboard-grid">
        {blueprint.productionPhases.map((phase, index) => (
          <article key={phase.title} className="storyboard-card">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{phase.title}</h3>
            <p>{phase.outcome}</p>
            <div className="panel-strip" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function AgentLane({ runs }: { runs: AgentRun[] }) {
  return (
    <section className="agent-lane">
      {runs.map((run, index) => (
        <article className="agent-node" key={`${run.agentId}-${run.title}`}>
          <div className="node-index">{index + 1}</div>
          <div>
            <div className="node-heading">
              <strong>{run.title}</strong>
              <span>{run.status === 'complete' ? '승인' : '대기'}</span>
            </div>
            <p>{run.output}</p>
            <small>{run.evidence[0]}</small>
          </div>
          {index < runs.length - 1 && <ChevronRight className="node-arrow" size={18} />}
        </article>
      ))}
    </section>
  );
}

function ContinuityPanel({ project }: { project: SeriesProject }) {
  return (
    <aside className="continuity-panel">
      <div className="section-title">
        <GitBranch size={16} />
        <h2>연속성 레저</h2>
      </div>
      <div className="ledger-visual" aria-hidden="true">
        {project.canonFacts.slice(-7).map((fact, index) => (
          <span key={fact.id} style={{ '--i': index } as CSSProperties} />
        ))}
      </div>
      <ul className="canon-list">
        {project.canonFacts.slice(-5).map((fact) => (
          <li key={fact.id}>
            <span>{fact.owner}</span>
            <p>{fact.statement}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ChapterView({ chapter }: { chapter: Chapter | null }) {
  if (!chapter) {
    return (
      <div className="blank-slate">
        <AlertTriangle size={24} />
        <h3>대기 중</h3>
        <p>쇼러너와 전문 에이전트들이 첫 회차를 준비하고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="chapter-view">
      <p className="eyebrow">Episode {chapter.episode}</p>
      <h3>{chapter.title}</h3>
      <p className="hook">{chapter.hook}</p>
      <div className="outline-stack">
        {chapter.outline.map((beat) => (
          <p key={beat}>{beat}</p>
        ))}
      </div>
      <pre>{chapter.prose}</pre>
    </div>
  );
}

function CanonView({ project }: { project: SeriesProject }) {
  return (
    <div className="canon-view">
      {project.canonFacts.map((fact) => (
        <article key={fact.id}>
          <span>EP {fact.episode}</span>
          <p>{fact.statement}</p>
        </article>
      ))}
    </div>
  );
}

const placeholderRuns: AgentRun[] = [
  {
    agentId: 'showrunner',
    title: '쇼러너 에이전트',
    status: 'complete',
    output: '시리즈 약속과 장기 떡밥을 기준으로 회차 목표를 정렬합니다.',
    evidence: ['독자 약속, 열린 떡밥, 전 회차 후크']
  },
  {
    agentId: 'character-custodian',
    title: '캐릭터 에이전트',
    status: 'complete',
    output: '욕망, 상처, 말투, 관계 변화를 캐릭터 바이블과 대조합니다.',
    evidence: ['인물별 canonAnchors']
  },
  {
    agentId: 'world-keeper',
    title: '배경 에이전트',
    status: 'complete',
    output: '마법, 정치, 장소 규칙을 잠금 목록과 비교합니다.',
    evidence: ['worldRules']
  },
  {
    agentId: 'genre-stylist',
    title: '장르별 글쓰기 에이전트',
    status: 'complete',
    output: '선택 장르의 장면 리듬, 문체 질감, 클리프행어를 적용합니다.',
    evidence: ['genreProfiles']
  },
  {
    agentId: 'continuity-editor',
    title: '연속성 감수 에이전트',
    status: 'complete',
    output: '충돌을 차단하고 새 캐논을 레저에 기록합니다.',
    evidence: ['canonFacts']
  }
];

export default App;
