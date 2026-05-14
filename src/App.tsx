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
  Map,
  PanelsTopLeft,
  PenTool,
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
import { buildProjectIntakePlan, getFocusedServiceScope } from './lib/projectIntake';
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
  p0EvaluationCapabilities
} from './lib/evaluationSynthesis';
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
  type GenreId,
  type ProductionRequest,
  type SeriesProject
} from './lib/storyEngine';
import { clearProject, loadProject, saveProject } from './lib/storage';
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
type StoryXNavLink = {
  label: string;
  target: string;
};

function App() {
  const [stage, setStage] = useState<AppStage>('landing');
  const [medium, setMedium] = useState<CreativeMedium>('novel');
  const [format, setFormat] = useState<CreativeFormat>('long-novel');

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
        onOpenEditor={() => setStage('editor')}
      />
    );
  }

  return <MarketingLanding onOpenHome={() => setStage('home')} onOpenLogin={() => setStage('login')} />;
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

function MarketingLanding({
  onOpenHome,
  onOpenLogin
}: {
  onOpenHome: () => void;
  onOpenLogin: () => void;
}) {
  const creationPillars = [
    {
      label: 'Story core',
      title: '하나의 이야기 중심을 먼저 세웁니다.',
      body: '소설, 웹툰, 인스타툰, 오디오북으로 바뀌어도 주인공의 욕망과 세계의 규칙은 같은 중심에서 움직입니다.'
    },
    {
      label: 'Continuity',
      title: '설정 변경은 치환이 아니라 refactor입니다.',
      body: '주인공 성별, 이름, 관계, 음성, 이미지 레퍼런스가 바뀌면 영향 범위를 계산하고 안전하게 반영합니다.'
    },
    {
      label: 'Multimodal',
      title: '글, 그림, 소리를 조용히 연결합니다.',
      body: '초안, 컷, 말풍선, 음악 cue, narrator voice가 하나의 Codex와 품질 게이트를 공유합니다.'
    }
  ];
  const integrityRows = [
    {
      eyebrow: 'Creative infrastructure',
      title: '작품의 신뢰성은 보이지 않는 구조에서 시작됩니다.',
      body: 'Story X는 캐릭터 계약, 세계 규칙, 장면 기능, 음성 캐스팅, 이미지 레퍼런스를 연결해 창작자가 자유롭게 바꿔도 작품이 무너지지 않도록 돕습니다.',
      metric: 'Canon'
    },
    {
      eyebrow: 'Quality gates',
      title: '좋아 보이는 결과보다, 다시 쓸 수 있는 결과를 남깁니다.',
      body: '문체, 컷 밀도, 말풍선, 발음, 음악 분위기, 플랫폼 패키징을 포맷별로 따로 점검합니다. 막힌 부분은 숨기지 않고 다음 행동으로 보여줍니다.',
      metric: 'Gates'
    },
    {
      eyebrow: 'Reference DNA',
      title: '햄릿 같은 압력, 인터스텔라 같은 상상력을 구조로 다룹니다.',
      body: '작품 레퍼런스는 표면을 베끼기 위한 것이 아니라, 감정 엔진과 구조 엔진을 이해해 새로운 창작에 적용하기 위한 데이터입니다.',
      metric: 'DNA'
    }
  ];
  const navMenus = [
    {
      label: '제작 OS',
      target: 'product',
      columns: [
        {
          heading: '이야기 중심 엔진',
          items: [
            ['Story Contract', '독자 약속, 주인공 욕망, 금기, 형식 약속을 첫 기준으로 잠급니다.'],
            ['Memory Bank', '캐논, 문체, 시각, 오디오 바이블을 필요한 에이전트에게만 전달합니다.'],
            ['Quality Gates', 'Story, Voice, Continuity, Visual, Audio, Platform을 통과해야 다음 단계로 갑니다.']
          ]
        },
        {
          heading: 'AI 자원 조립',
          items: [
            ['글', '소설, 에세이, 각본, 내레이션 원고의 구조와 문체를 관리합니다.'],
            ['그림', '캐릭터 시트, 컷 구성, 이미지 프롬프트, 시각 연속성을 관리합니다.'],
            ['소리', '낭독, 음악 큐, 자막, 교육 영상 흐름과 청취 리듬을 설계합니다.']
          ]
        }
      ]
    },
    {
      label: '워크플로우',
      target: 'workflows',
      columns: [
        {
          heading: '매체별 제작실',
          items: [
            ['소설 제작실', '시리즈 바이블, 회차 보상, 복선 회수, 문체 일관성'],
            ['만화 제작실', '컷 리듬, 말풍선, 캐릭터 비주얼, 스크롤 후킹'],
            ['오디오 제작실', '화자 톤, 발음, 쉼, 음악 모티프, 첫 30초 증거']
          ]
        },
        {
          heading: '흐름 유지 장치',
          items: [
            ['Workflow Board', '지금 해야 할 행동, 담당 에이전트, 승인 조건을 한 화면에 둡니다.'],
            ['Refactor Preview', '이름, 성별, 관계, 화자, 그림체 변경의 영향 범위를 먼저 보여줍니다.'],
            ['AI Output Autopsy', '생성 뒤 새 캐논 후보와 손상 위험을 분리해 승인받습니다.']
          ]
        }
      ]
    },
    {
      label: '매체 전환',
      target: 'media-bridge',
      columns: [
        {
          heading: '전환 브릿지',
          items: [
            ['소설 → 웹툰', '장면 기능을 컷, 말풍선, 스크롤 리듬으로 변환합니다.'],
            ['소설 → 동화책', '핵심 갈등을 반복 가능한 페이지 장면과 낭독 톤으로 압축합니다.'],
            ['에세이 → 오디오북', '내 목소리의 거리와 쉼을 청취 경험으로 바꿉니다.']
          ]
        },
        {
          heading: '출력 패키지',
          items: [
            ['첫 300자', '웹소설/출판 플랫폼에 맞는 시작 증거를 만듭니다.'],
            ['첫 3컷', '웹툰/인스타툰의 훅과 저장 포인트를 검증합니다.'],
            ['첫 30초', '오디오북/교육영상의 이해 가능성과 피로도를 점검합니다.']
          ]
        }
      ]
    },
    {
      label: '프론트엔드 제작팀',
      target: 'frontend-agents',
      columns: [
        {
          heading: '제품 경험 에이전트',
          items: [
            ['에디터 UX 디렉터', '중앙 창작면, 사이드바, 품질 게이트의 위치를 정합니다.'],
            ['온보딩 설계자', '첫 선택에서 첫 workflow board까지의 시간을 줄입니다.'],
            ['작품 관리인', '시리즈, 버전, 캐논, 산출물 패키지를 잃어버리지 않게 합니다.']
          ]
        },
        {
          heading: '서비스 성장 에이전트',
          items: [
            ['브랜드/홈페이지 디렉터', 'Story X의 철학과 차별점을 소개 페이지로 번역합니다.'],
            ['출판/배포 매니저', '게시, 다운로드, 매체 변환, 플랫폼 handoff를 준비합니다.'],
            ['인사이트 분석가', '사용자 막힘과 검토 결과를 다음 개발로 되돌립니다.']
          ]
        }
      ]
    }
  ];
  const landingWorkflowTracks = [
    {
      title: '소설/웹소설',
      promise: '주인공 욕망과 세계 규칙을 먼저 잠그고 회차가 늘어나도 무너지지 않는 연재 구조를 만듭니다.',
      steps: ['Story Contract', 'Series Bible', 'Episode Promise', 'AI Output Autopsy'],
      proof: '첫 300자, 다음 화 클릭 질문, 새 캐논 후보'
    },
    {
      title: '만화/웹툰',
      promise: '산문을 그림으로 옮기는 수준이 아니라 컷, 말풍선, 시선 흐름, 캐릭터 비주얼을 함께 설계합니다.',
      steps: ['Visual Bible', 'Cut Board', 'Bubble Plan', 'DaVinci Prompt'],
      proof: '첫 3컷, 저장 컷, 캐릭터 레퍼런스'
    },
    {
      title: '에세이',
      promise: '내 이야기를 AI가 지어내지 않도록 질문을 먼저 쌓고, 실제 주변 인물과 문체를 보호합니다.',
      steps: ['Interview', 'Privacy Distance', 'Voice Sample', 'Korean Naturalness'],
      proof: '내 문장 리듬, 질문 로그, 익명화 체크'
    },
    {
      title: '오디오북/영상',
      promise: '글을 귀와 화면으로 바꾸기 위해 낭독 톤, 쉼, 자막 밀도, 음악 큐를 한 흐름으로 연결합니다.',
      steps: ['Narration Map', 'Pronunciation', 'Music Cue', 'First 30s Proof'],
      proof: '첫 30초, 반복 후렴, 청취 피로 점검'
    }
  ];

  return (
    <main className="marketing-landing">
      <StoryXTopNav
        ariaLabel="Story X"
        navLinks={navMenus.map((menu) => ({ label: menu.label, target: menu.target }))}
        ctaLabel="창작 시작"
        onLogoClick={onOpenHome}
        onCtaClick={onOpenLogin}
      />

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-image-slot" aria-hidden="true">
          <div className="hero-image-fallback" />
          <img src={storyXHeroImage} alt="" />
        </div>
        <div className="hero-copy">
          <button type="button" className="news-pill" onClick={onOpenHome}>
            Story workflows v0.2
            <ChevronRight size={14} />
          </button>
          <h1 id="landing-title">The calm way to make stories.</h1>
          <p>
            Story X는 맑은 해안처럼 조용하지만, 안쪽에는 캐릭터, 세계관, 이미지, 음악, 오디오북까지
            이어지는 정밀한 AI 제작 시스템을 품고 있습니다.
          </p>
          <button type="button" className="button-primary hero-start-button" onClick={onOpenLogin}>
            Get started
          </button>
        </div>
      </section>

      <StoryCurrentSection />

      <section className="duna-marquee" aria-label="creative formats">
        {['Novel', 'Webtoon', 'Insta-toon', 'Audiobook', 'Audio drama', 'Reference DNA', 'Story refactor'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="duna-metrics" id="product" aria-label="Story X product pillars">
        <div className="duna-section-head">
          <h2>Designed for creation. Built for continuity.</h2>
          <p>
            좋은 AI 창작 서비스는 더 많은 버튼을 보여주는 게 아니라, 창작자가 지금 무엇을 해야 하는지
            조용히 알려줘야 합니다.
          </p>
        </div>
        <div className="duna-pillar-grid">
          {creationPillars.map((pillar) => (
            <article key={pillar.label}>
              <span>{pillar.label}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="duna-integrity-hero" id="integrity">
        <p className="trust-pill">Trust</p>
        <h2>Engineered for story integrity</h2>
        <p>
          창작자는 자유롭게 바꿀 수 있어야 합니다. 시스템은 조용히 영향 범위를 추적하고,
          모순과 품질 저하를 드러내야 합니다.
        </p>
      </section>

      <section className="integrity-grid" aria-label="Story X trust principles">
        {integrityRows.map((row, index) => (
          <article key={row.title} className={index % 2 === 1 ? 'is-reversed' : ''}>
            <div>
              <p className="framer-eyebrow">{row.eyebrow}</p>
              <h3>{row.title}</h3>
              <p>{row.body}</p>
            </div>
            <div className="integrity-visual" aria-hidden="true">
              <span>{row.metric}</span>
              <i />
              <i />
              <i />
            </div>
          </article>
        ))}
      </section>

      <section className="workflow-band" id="workflows">
        <div>
          <p className="framer-eyebrow">Workflow library</p>
          <h2>홈화면은 단순 선택지가 아니라, 작품 제작의 관제탑이어야 합니다.</h2>
          <p>
            소설에서 시작해 웹툰, 동화책, 오디오북으로 자연스럽게 확장되도록 각 매체의 입력, 제작 단계,
            검수 증거를 끊기지 않는 흐름으로 연결합니다.
          </p>
        </div>
        <div className="workflow-list">
          {landingWorkflowTracks.map((track, index) => (
            <button key={track.title} type="button" className="landing-workflow-track" onClick={onOpenHome}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{track.title}</strong>
              <small>{track.promise}</small>
              <div className="track-step-row">
                {track.steps.map((step) => (
                  <em key={step}>{step}</em>
                ))}
              </div>
              <p>{track.proof}</p>
            </button>
          ))}
        </div>
      </section>

      <MediaBridgeSection />
      <FrontendAgentShowcase />
      <HomepageRoadmapSection />

      <section className="duna-closing" id="resources">
        <h2>Start with a story that can survive every form.</h2>
        <button type="button" className="button-primary" onClick={onOpenLogin}>
          창작 시작
        </button>
      </section>
    </main>
  );
}

function StoryCurrentSection() {
  return (
    <section className="story-current-section" aria-label="Story X brand concept">
      <div>
        <p className="framer-eyebrow">Brand Current</p>
        <h2>바람과 물결이 교차할 때, 나의 이야기가 완성됩니다.</h2>
        <p>
          바람은 작가가 던지는 선택, 수정, 충동입니다. 물결은 메모리 뱅크와 에이전트 검토가 남기는
          흐름입니다. Story X는 둘이 만나는 지점에서 회차, 문체, 인물, 세계관을 다시 정렬합니다.
        </p>
      </div>
      <div className="current-wave-map" aria-hidden="true">
        <span>wind</span>
        <i />
        <i />
        <i />
        <strong>story</strong>
        <em>wave</em>
      </div>
    </section>
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
  const recentProjects = [
    {
      id: project.id,
      title: project.title,
      description: project.logline,
      meta: `${project.currentEpisode} episodes · ${project.canonFacts.length} canon facts`
    }
  ];

  return (
    <main className="project-hub">
      <nav className="auth-nav" aria-label="projects">
        <button type="button" className="framer-wordmark" onClick={onOpenLanding}>
          <BrandWordmark />
        </button>
        <button type="button" className="button-primary" onClick={onOpenNewProject}>
          새 프로젝트
        </button>
      </nav>

      <section className="project-hub-head">
        <p className="framer-eyebrow">Projects</p>
        <h1>작품을 고르거나 새 프로젝트를 시작하세요.</h1>
        <p>기존 프로젝트는 바로 편집창으로 열리고, 새 프로젝트는 매체와 포맷을 고르는 장면으로 이동합니다.</p>
      </section>

      <section className="project-grid" aria-label="project list">
        <button type="button" className="new-project-card" onClick={onOpenNewProject}>
          <Sparkles size={22} />
          <strong>새 프로젝트</strong>
          <span>소설, 웹툰, 인스타툰, 오디오북 중에서 제작 흐름을 선택합니다.</span>
        </button>

        {recentProjects.map((item) => (
          <button type="button" key={item.id} className="project-card" onClick={onOpenProject}>
            <span>{item.meta}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </button>
        ))}
      </section>
    </main>
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
  onOpenEditor: () => void;
}) {
  const formatOptions = getFormatOptions(medium);
  const workflowBoard = buildTesterDrivenWorkflow(blueprint);
  const workflowPhases = blueprint.productionPhases;
  const intakePlan = useMemo(() => buildProjectIntakePlan(blueprint), [blueprint]);
  const focusedScope = useMemo(() => getFocusedServiceScope(), []);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const homeNavLinks = [
    { label: '작업 선택', target: 'choose' },
    { label: '세팅 질문', target: 'intake' },
    { label: '제작 보드', target: 'workflow' },
    { label: '검토 기준', target: 'evaluation-update' },
    { label: '작가진', target: 'agents' },
    { label: '에디터 준비', target: 'roadmap' }
  ];

  return (
    <main className="storyx-home">
      <StoryXTopNav
        ariaLabel="homepage"
        navLinks={homeNavLinks}
        ctaLabel="에디터로"
        onLogoClick={onOpenLanding}
        onCtaClick={onOpenEditor}
      />

      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <p className="framer-eyebrow">Homepage</p>
          <h1 id="home-title">오늘 만들 이야기를 선택하세요.</h1>
          <p>
            매체와 포맷을 고르면 Story X가 필요한 에이전트, 스킬, 제작 단계, 품질 게이트,
            매체 전환 후보를 한 번에 조립합니다. 핵심은 하나의 이야기가 형태를 바꿔도 무너지지 않는 것입니다.
          </p>
        </div>
        <aside className="home-summary-card">
          <span>Selected pipeline</span>
          <strong>
            {blueprint.mediumLabel} · {blueprint.formatLabel}
          </strong>
          <p>{blueprint.projectRoomSubtitle}</p>
          <button type="button" className="button-primary" onClick={onOpenEditor}>
            이 구조로 제작 시작
          </button>
        </aside>
      </section>

      <section className="home-builder-grid" id="choose" aria-label="creative homepage">
        <article className="home-choice-panel">
          <div className="home-section-head">
            <span>01</span>
            <h2>무엇을 만들까요?</h2>
          </div>
          <div className="home-option-grid">
            {mediumOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={medium === option.id ? 'is-selected' : ''}
                onClick={() => onSelectMedium(option.id)}
              >
                {getMediumIcon(option.id)}
                <strong>{option.label}</strong>
                <span>{option.signal}</span>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="home-choice-panel">
          <div className="home-section-head">
            <span>02</span>
            <h2>어떤 형태인가요?</h2>
          </div>
          <div className="home-format-stack">
            {formatOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={format === option.id ? 'is-selected' : ''}
                onClick={() => onSelectFormat(option.id)}
              >
                <span>{option.cadence}</span>
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        </article>

        <aside className="gradient-spotlight-card gradient-spotlight-card-magenta" id="workflow">
          <span>03 · Workflow</span>
          <h2>{blueprint.projectRoomTitle}</h2>
          <p>{blueprint.projectRoomSubtitle}</p>
          <ul>
            {workflowPhases.map((phase) => (
              <li key={phase.title}>
                <strong>{phase.title}</strong>
                <small>{phase.outcome}</small>
              </li>
            ))}
          </ul>
          <div className="workflow-quality-strip" aria-label="공통 품질 게이트">
            {workflowBoard.qualityGateIds.map((gate) => (
              <span key={gate}>{gate}</span>
            ))}
          </div>
          <p className="workflow-proof">{workflowBoard.platformProof}</p>
        </aside>
      </section>

      <section className="home-intake-questionnaire" id="intake" aria-label="새 프로젝트 에이전트 질문">
        <div className="home-intake-head">
          <div>
            <p className="framer-eyebrow">Agent setup · 객관식</p>
            <h2>에이전트들이 먼저 묻는 세팅 질문</h2>
            <p>
              {intakePlan.summary} 이 선택은 나중에 언제든지 바꿀 수 있습니다. 변경이 기존 출간본과 충돌하면
              변경 로그와 캐논 리팩터가 먼저 검토합니다.
            </p>
          </div>
          <aside>
            <span>{intakePlan.focusLabel}</span>
            <p>{intakePlan.notice}</p>
          </aside>
        </div>
        <div className="scope-focus-strip" aria-label="현재 개발 집중 범위">
          <strong>현재 집중</strong>
          {focusedScope.now.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <em>후속: {focusedScope.later.join(' · ')}. 만화의 완성 이미지 생성은 후속 단계입니다.</em>
        </div>
        <div className="intake-question-grid">
          {intakePlan.questions.map((question, index) => {
            const selectedOption = intakeAnswers[question.id] ?? question.recommendedOptionId;

            return (
              <article className="intake-question-card" key={question.id}>
                <span>
                  {String(index + 1).padStart(2, '0')} · {question.agentLabel}
                </span>
                <h3>{question.question}</h3>
                <div>
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={selectedOption === option.id ? 'is-selected' : ''}
                      onClick={() => setIntakeAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    >
                      <strong>{option.label}</strong>
                      <small>{option.impact}</small>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <TesterEvaluationUpdateSection blueprint={blueprint} />
      <HomepageRoadmapSection />

      <section className="home-agent-strip" id="agents">
        {blueprint.agentStack.slice(0, 6).map((agent) => (
          <span key={agent}>{agent}</span>
        ))}
      </section>

      <ServiceOperationsSection compact />
    </main>
  );
}

function TesterEvaluationUpdateSection({ blueprint }: { blueprint: CreativeBlueprint }) {
  const workflowBoard = buildTesterDrivenWorkflow(blueprint);

  return (
    <section className="tester-update-section" id="evaluation-update" aria-label="테스터 평가 반영 업데이트">
      <div className="tester-update-head">
        <p className="framer-eyebrow">Evaluator Update · 2026-05-14</p>
        <h2>12인 창작자 테스터 의견은 여섯 개의 제품 원칙으로 압축했습니다.</h2>
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
