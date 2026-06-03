import {
  Check,
  ChevronRight,
  Clapperboard,
  Feather,
  FileText,
  Lock,
  Moon,
  PanelsTopLeft,
  Plus,
  Sparkles,
  Sun
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  buildCreativeBlueprint,
  getFormatOptions,
  getMediumOptions,
  isSerialFormat,
  type CreativeBlueprint,
  type CreativeFormat,
  type CreativeMedium
} from './lib/projectBlueprint';
import {
  buildProjectIntakePlan,
  getIntakePersona,
  type ProjectIntakeQuestion
} from './lib/projectIntake';
import { requestLlmInterview } from './lib/interviewClient';
import { AiStatusBadge } from './components/AiStatusBadge';
import { PublishScreen } from './components/PublishScreen';
import { buildAcademicPublishSummary } from './lib/academicPublish';

// 매체 코드를 사용자 표시용 한국어 라벨로 매핑. 헤더·퍼블리시 화면 등에 노출.
function mediumDisplayLabel(medium: CreativeMedium): string {
  switch (medium) {
    case 'essay':
      return '에세이';
    case 'novel':
      return '소설';
    case 'comics':
      return '만화';
    case 'audiobook':
      return '오디오북';
    case 'academic':
      return '사회과학/학술';
    default:
      return medium;
  }
}
import { buildFallbackDraft, type DraftChapterPayload, type SeriesProject } from './lib/storyEngine';
import { loadProject } from './lib/storage';
import { requestLlmDraft } from './lib/draftClient';
import { StoryXDesk } from './StoryXDesk';
import storyXSymbol from './assets/brand/story-x-symbol-mono.svg';
import storyXSymbolLight from './assets/brand/story-x-symbol-light.svg';

const mediumOptions = getMediumOptions();

// 작가 인터뷰어 id → 픽셀아트 초상 클래스. 에디터 작가진과 같은 픽셀 시스템을 재사용한다
const intakePixelClass: Record<string, string> = {
  showrunner: 'is-showrunner',
  'character-custodian': 'is-character',
  'world-keeper': 'is-world',
  'voice-curator': 'is-voice',
  'essay-interviewer': 'is-essay',
  'essay-thesis': 'is-thesis',
  'essay-curator': 'is-essay-curator',
  'critic-reviewer': 'is-critic',
  'interview-curator': 'is-interview',
  'continuity-editor': 'is-continuity',
  'creative-coach': 'is-coach',
  'storyboard-agent': 'is-storyboard',
  'speech-bubble-agent': 'is-bubble'
};

function InterviewerPortrait({ agentId }: { agentId: string }) {
  const pixelClass = intakePixelClass[agentId] ?? 'is-default';
  return (
    <span className="hx-interviewer-portrait" aria-hidden="true">
      <span className={`pixel-agent ${pixelClass}`}>
        <span className="pixel-agent-hair" />
        <span className="pixel-agent-head">
          <i />
          <b />
        </span>
        <span className="pixel-agent-neck" />
        <span className="pixel-agent-body" />
      </span>
    </span>
  );
}

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

type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor' | 'publish';
type HomeFlowStep = 'medium' | 'freewrite' | 'intake' | 'building';

function App() {
  const initialStage = useMemo<AppStage>(() => {
    if (typeof window === 'undefined') return 'landing';
    const stageParam = new URLSearchParams(window.location.search).get('stage');
    if (
      stageParam === 'editor' ||
      stageParam === 'home' ||
      stageParam === 'projects' ||
      stageParam === 'login' ||
      stageParam === 'landing' ||
      stageParam === 'publish'
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
        onOpenPublish={() => setStage('publish')}
      />
    );
  }

  if (stage === 'publish') {
    const publishProject = loadProject();
    const academicSummary = medium === 'academic'
      ? buildAcademicPublishSummary(buildAcademicPublishText(publishProject))
      : undefined;

    return (
      <PublishScreen
        medium={medium}
        format={format}
        academicSummary={academicSummary}
        workTitle={publishProject.title}
        mediumLabel={mediumDisplayLabel(medium)}
        onBack={() => setStage('editor')}
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

function buildAcademicPublishText(project: SeriesProject): string {
  const chapterText = project.chapters
    .map((chapter) => [`# ${chapter.title}`, chapter.prose].filter(Boolean).join('\n\n'))
    .filter((chapter) => chapter.trim().length > 0)
    .join('\n\n');

  return chapterText.trim() || project.logline || '';
}

function LandingBrand({
  onClick,
  theme = 'dark'
}: {
  onClick: () => void;
  theme?: 'dark' | 'light';
}) {
  return (
    <button type="button" className="landing-brand" onClick={onClick}>
      <span className="lx-brandmark" aria-hidden="true">
        <img
          className="nx-brand-symbol"
          src={theme === 'dark' ? storyXSymbolLight : storyXSymbol}
          alt=""
        />
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
      no: '01',
      title: '캐논은 흔들리지 않습니다',
      body: '30화가 쌓여도 1화의 규칙이 그대로 남습니다. 세계관·캐릭터·사건이 충돌하면, AI가 아니라 작가가 결정합니다.'
    },
    {
      no: '02',
      title: '캐릭터는 같은 사람입니다',
      body: '욕망, 상처, 말버릇이 매 회차 같은 기준으로 점검됩니다. 설정을 바꾸면 영향 범위를 먼저 펼쳐 보여줍니다.'
    },
    {
      no: '03',
      title: '승인은 작가가 합니다',
      body: 'AI가 만든 문장은 곧바로 작품이 되지 않습니다. 승인 대기함에 머물고, 작가가 확인한 것만 캐논으로 굳습니다.'
    }
  ];
  const navLinks = [
    { label: '핵심 원칙', target: 'features' },
    { label: '매체 전환', target: 'media-bridge' }
  ];

  // 낮/밤 토글 — localStorage 'storyx.landingTheme' 에 저장. 기본은 밤(다크).
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      return window.localStorage.getItem('storyx.landingTheme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('storyx.landingTheme', theme);
    } catch {
      /* silent */
    }
  }, [theme]);
  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`landing-page${theme === 'light' ? ' is-light' : ''}`}>
      <nav className="lx-nav" aria-label="Story X">
        <LandingBrand onClick={onOpenHome} theme={theme} />
        <div className="lx-nav-links">
          {navLinks.map((link) => (
            <a key={link.target} href={`#${link.target}`} className="lx-nav-link">
              {link.label}
            </a>
          ))}
          <span className="lx-nav-divider" aria-hidden="true" />
          <button type="button" className="lx-nav-link" onClick={onOpenProjects}>
            프로젝트 목록
          </button>
        </div>
        <div className="lx-nav-actions">
          <button
            type="button"
            className="lx-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '낮 모드로 전환' : '밤 모드로 전환'}
            title={theme === 'dark' ? '낮 모드로 전환' : '밤 모드로 전환'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button type="button" className="btn-primary" onClick={onOpenHome}>
            창작 시작
          </button>
        </div>
      </nav>

      <section className="hero-band" aria-labelledby="landing-title">
        <div className="hero-inner">
          <h1 id="landing-title" className="hero-title">
            한국어 장편 연재를
            <br />
            끝까지 데려가는 시스템.
          </h1>
          <div className="hero-meta">
            <p className="hero-sub">
              소설에서 시작한 이야기가 웹툰·동화책·오디오북으로 옮겨가도 캐릭터의 욕망도, 세계의
              규칙도, 30화 뒤까지 같은 얼굴로 남습니다.
            </p>
            <div className="hero-status">
              <span className="hero-status-dot" aria-hidden="true" />
              <span className="hero-status-label">Alpha v0.10 · 캐논 시스템 점검 중</span>
              <button type="button" className="hero-status-link" onClick={onOpenHome}>
                창작 시작 →
              </button>
            </div>
          </div>
        </div>

        <div className="hero-showcase" role="img" aria-label="Story X 에디터 미리보기">
          <div className="hm-titlebar">
            <span className="hm-traffic">
              <i />
              <i />
              <i />
            </span>
            <div className="hm-tab-row">
              <span className="hm-tab is-active">달의 탑 아래서</span>
              <span className="hm-tab">기억의 필사관</span>
              <span className="hm-tab hm-tab-add">＋</span>
            </div>
            <span className="hm-status-pill">
              <span className="hm-pill-dot" />
              2화 작업 중
            </span>
          </div>
          <div className="hm-body">
            <aside className="hm-sidebar">
              <div className="hm-search">⌘K · 명령·검색</div>
              <div className="hm-sb-section">
                <span className="hm-sb-label">에피소드 · 3</span>
                <div className="hm-sb-item">
                  <span className="hm-sb-no">01</span>
                  마르지 않는 잉크
                </div>
                <div className="hm-sb-item is-active">
                  <span className="hm-sb-no">02</span>
                  달의 수문장
                </div>
                <div className="hm-sb-item">
                  <span className="hm-sb-no">03</span>
                  역방향의 시간
                </div>
              </div>
              <div className="hm-sb-section">
                <span className="hm-sb-label">바이블</span>
                <div className="hm-sb-item">세계관 · 규칙 11</div>
                <div className="hm-sb-item">캐릭터 · 3명</div>
                <div className="hm-sb-item">캐논 레저 · 38</div>
              </div>
              <div className="hm-sb-section">
                <span className="hm-sb-label">매체</span>
                <div className="hm-sb-item">소설 · 장편</div>
                <div className="hm-sb-item hm-sb-muted">웹툰 변환 대기</div>
                <div className="hm-sb-item hm-sb-muted">오디오북 대기</div>
              </div>
            </aside>
            <div className="hm-main">
              <div className="hm-main-head">
                <div className="hm-chap">
                  <span className="hm-chap-no">2화</span>
                  <span className="hm-chap-title">달의 수문장</span>
                </div>
                <div className="hm-chap-meta">
                  <span>4,820자</span>
                  <span className="hm-dot-sep" />
                  <span>비트 4 / 7</span>
                  <span className="hm-dot-sep" />
                  <span className="hm-saved">저장됨</span>
                </div>
              </div>
              <div className="hm-prose">
                <p>
                  탑의 입구에는 빛이 없었다. 달만이 돌계단을 희미하게 비추고 있었다. 서아가 첫 번째
                  계단에 발을 올려놓았을 때, 그림자 속에서 목소리가 들렸다.
                </p>
                <p className="hm-prose-dialog">“이서아. 드디어 왔군.”</p>
                <p>
                  목소리는 차가웠다. 한 번도 들어본 적이 없는 음색이었지만, 분명히 자신의 이름을
                  알고 있었다.
                </p>
                <p className="hm-prose-caret">
                  서아는 가방 안의 잉크병을 더듬었다.
                  <span className="hm-caret" />
                </p>
              </div>
              <div className="hm-canon-line">
                <span className="hm-canon-label">캐논 적용</span>
                <span className="hm-canon-chip">서아 · 잉크병</span>
                <span className="hm-canon-chip">탑 · 수문장 규칙</span>
                <span className="hm-canon-chip hm-canon-new">+1 새 사실</span>
              </div>
            </div>
            <aside className="hm-rail">
              <div className="hm-rail-section">
                <div className="hm-rail-head">
                  <span>작가진 검토</span>
                  <span className="hm-rail-count">5</span>
                </div>
                <div className="hm-agent">
                  <span className="hm-dot pass" />
                  <span className="hm-agent-name">쇼러너</span>
                  <span className="hm-agent-state">통과</span>
                </div>
                <div className="hm-agent">
                  <span className="hm-dot revise" />
                  <span className="hm-agent-name">캐릭터 큐레이터</span>
                  <span className="hm-agent-state">수정 요청</span>
                </div>
                <div className="hm-agent">
                  <span className="hm-dot block" />
                  <span className="hm-agent-name">연속성 감수</span>
                  <span className="hm-agent-state">차단</span>
                </div>
                <div className="hm-agent hm-agent-muted">
                  <span className="hm-dot queued" />
                  <span className="hm-agent-name">세계관 지킴이</span>
                  <span className="hm-agent-state">대기</span>
                </div>
                <div className="hm-agent hm-agent-muted">
                  <span className="hm-dot queued" />
                  <span className="hm-agent-name">문체 큐레이터</span>
                  <span className="hm-agent-state">대기</span>
                </div>
              </div>
              <div className="hm-rail-section">
                <div className="hm-rail-head">
                  <span>승인 대기</span>
                  <span className="hm-rail-count hm-rail-count-accent">2</span>
                </div>
                <div className="hm-approve">
                  <span className="hm-approve-title">서아 · 새 잉크병 출처</span>
                  <span className="hm-approve-meta">캐릭터 큐레이터 · 2화</span>
                </div>
                <div className="hm-approve">
                  <span className="hm-approve-title">탑 · 수문장 규칙</span>
                  <span className="hm-approve-meta">세계관 지킴이 · 2화</span>
                </div>
              </div>
            </aside>
          </div>
          <div className="hm-footer">
            <span className="hm-foot-item">
              <span className="hm-foot-key">⌘K</span>
              명령
            </span>
            <span className="hm-foot-item">
              <span className="hm-foot-key">⌘.</span>
              집중 모드
            </span>
            <span className="hm-foot-item">
              <span className="hm-foot-key">⌘↵</span>
              초안 생성
            </span>
            <span className="hm-foot-spacer" />
            <span className="hm-foot-item hm-foot-item-good">
              <span className="hm-foot-bullet" />
              알파 셀프체크 63%
            </span>
          </div>
        </div>
      </section>

      <section className="feature-section" id="features" aria-label="핵심 원칙">
        <div className="feature-section-inner">
          <span className="lx-eyebrow">왜 Story X인가</span>
          <h2 className="section-h2">
            이야기를 지키는 일은
            <br />
            세 가지 약속에서 시작합니다.
          </h2>
          <div className="feature-list">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card">
                <span className="feature-no">{feature.no}</span>
                <div className="feature-text">
                  <div className="feature-title">{feature.title}</div>
                  <p className="feature-body">{feature.body}</p>
                </div>
                <ChevronRight size={14} className="feature-arrow" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lx-bridge-section" id="media-bridge" aria-label="매체 전환">
        <div className="lx-bridge-inner">
          <span className="lx-eyebrow">Media Bridge</span>
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
        <div className="landing-closing-inner">
          <span className="lx-eyebrow">Story X</span>
          <h2>
            어떤 매체로 바뀌어도
            <br />
            같은 이야기로 남습니다.
          </h2>
          <button type="button" className="btn-primary btn-primary-lg" onClick={onOpenHome}>
            창작 시작
          </button>
        </div>
      </section>
    </div>
  );
}

function LoginScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  return (
    <div className="login-page">
      <nav className="lgx-nav" aria-label="로그인">
        <button type="button" className="lgx-brand" onClick={onBack}>
          <span className="lgx-brandmark" aria-hidden="true">
            <img className="nx-brand-symbol" src={storyXSymbol} alt="" />
          </span>
          <span>Story X</span>
        </button>
        <button type="button" className="lgx-back" onClick={onBack}>
          소개로
        </button>
      </nav>
      <main className="lgx-main">
        <section className="lgx-card" aria-labelledby="login-title">
          <p className="lgx-eyebrow">Login</p>
          <h1 id="login-title" className="lgx-title">창작 공간으로 들어가기</h1>
          <p className="lgx-sub">
            지금은 로컬 프로토타입이라 계정 검증 없이 프로젝트 화면으로 이어집니다.
          </p>
          <label className="lgx-field">
            <span>이메일</span>
            <input type="email" name="email" defaultValue="writer@storyx.local" autoComplete="email" />
          </label>
          <button type="button" className="lgx-submit" onClick={onContinue}>
            계속하기
          </button>
        </section>
      </main>
    </div>
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
            <img className="nx-brand-symbol" src={storyXSymbol} alt="" />
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
          <span>소설, 웹툰, 에세이, 오디오북, 학술 중에서 선택</span>
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
  const intakePlan = useMemo(() => buildProjectIntakePlan(blueprint), [blueprint]);
  // 연재형이면 "회차" 언어를 쓰고, 단편·단독 완결형이면 "글/원고" 언어를 쓴다.
  const isSerial = isSerialFormat(format);
  const draftUnitLabel = isSerial ? '첫 회차' : '첫 원고';
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [intakeOtherAnswers, setIntakeOtherAnswers] = useState<Record<string, string>>({});
  const [interviewNote, setInterviewNote] = useState('');
  const [freewriteText, setFreewriteText] = useState('');
  const [intakeQuestionIndex, setIntakeQuestionIndex] = useState(0);
  const [homeFlowStep, setHomeFlowStep] = useState<HomeFlowStep>('medium');
  const [llmIntakeQuestions, setLlmIntakeQuestions] = useState<ProjectIntakeQuestion[] | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  // LLM 인터뷰 결과 메타 — 라인업 띠 / 폴백 안내에 쓴다
  const [interviewPersonaLineup, setInterviewPersonaLineup] = useState<
    Array<{ id: string; label: string; tone: string; category: string; isFictionalized: boolean }>
  >([]);
  const [interviewFallbackReason, setInterviewFallbackReason] = useState<string | null>(null);
  const effectiveIntakeQuestions = llmIntakeQuestions ?? intakePlan.questions;

  // 자유 서술이나 매체가 바뀌면 LLM 인터뷰 질문 캐시·라인업·폴백 사유를 비워 다음 진입 때 새로 생성한다
  useEffect(() => {
    setLlmIntakeQuestions(null);
    setInterviewPersonaLineup([]);
    setInterviewFallbackReason(null);
  }, [freewriteText, blueprint.medium]);

  // 인터뷰 단계로 진입 — 자유 서술이 있으면 그 작품에 맞는 질문을 LLM에 요청한다
  async function goToIntake() {
    setHomeFlowStep('intake');
    setIntakeQuestionIndex(0);
    if (llmIntakeQuestions || isInterviewLoading || !freewriteText.trim()) {
      return;
    }
    setIsInterviewLoading(true);
    setInterviewFallbackReason(null);
    try {
      const result = await requestLlmInterview({
        medium: blueprint.medium,
        format: blueprint.format,
        freewrite: freewriteText
      });
      if (result.personaLineup) {
        setInterviewPersonaLineup(result.personaLineup);
      }
      if (result.ok && result.questions) {
        setLlmIntakeQuestions(result.questions);
        setIntakeQuestionIndex(0);
        setInterviewFallbackReason(null);
      } else {
        // LLM 실패 — 매체별 고정 질문으로 폴백된다는 신호를 UI 에 노출
        const reason = result.reason ?? '알 수 없는 사유';
        setInterviewFallbackReason(reason);
        console.warn('[interview] LLM 호출 실패 → 기본 질문 폴백. reason:', reason);
      }
    } finally {
      setIsInterviewLoading(false);
    }
  }
  // 인터뷰 답변까지 모아 첫 초안(연재형=회차, 단독 완결형=원고)을 만들고, 끝나면 에디터로 넘긴다
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
    if (llm.ok && llm.payload) {
      onOpenEditor(llm.payload);
      return;
    }

    onOpenEditor(
      buildFallbackDraft({
        freewrite: freewriteText,
        interviewAnswers: [...answerLines, interviewNote.trim()].filter(Boolean),
        chapterNumber: 1
      })
    );
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
            <img className="nx-brand-symbol" src={storyXSymbol} alt="" />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AiStatusBadge />
          <button type="button" className="hx-btn" onClick={() => onOpenEditor()}>
            에디터로 <ChevronRight size={13} />
          </button>
        </div>
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

        <section
          className={`hx-panel ${isInterviewLoading ? 'hx-panel-building' : ''}`}
          aria-label="새 프로젝트 작가 인터뷰"
        >
          {isInterviewLoading ? (
            <div className="hx-building">
              <p className="hx-eyebrow">03 · 작가 인터뷰</p>
              <h1 className="hx-h1">작가진이 질문을 준비하고 있습니다.</h1>
              <p className="hx-lead">
                당신이 쓴 자유 서술을 처음부터 끝까지 읽고, 이 작품에만 필요한 인터뷰 질문을 만드는
                중입니다. 끝나면 질문이 하나씩 열립니다.
              </p>
              <div className="hx-studio" aria-hidden="true">
                <div className="hx-studio-paper">
                  <div className="hx-studio-head">
                    <span className="hx-studio-dot" />
                    <span className="hx-studio-dot" />
                    <span className="hx-studio-dot" />
                  </div>
                  <div className="hx-studio-lines">
                    <span className="hx-studio-line" />
                    <span className="hx-studio-line" />
                    <span className="hx-studio-line" />
                    <span className="hx-studio-line" />
                    <span className="hx-studio-line" />
                    <span className="hx-studio-line" />
                  </div>
                  <div className="hx-studio-foot">
                    <span className="hx-studio-caret" />
                    <span className="hx-studio-penning">작가진이 읽는 중</span>
                  </div>
                </div>
              </div>
              <ol className="hx-building-steps" aria-label="질문 준비 단계">
                <li>
                  <span className="hx-step-dot" />
                  자유 서술을 처음부터 끝까지 읽습니다.
                </li>
                <li>
                  <span className="hx-step-dot" />
                  인물·세계·문체에서 더 들어야 할 빈 곳을 찾습니다.
                </li>
                <li>
                  <span className="hx-step-dot" />
                  이 작품에만 필요한 질문을 추립니다.
                </li>
              </ol>
              <p className="hx-building-note">잠시만 기다려 주세요 — 보통 10~30초 걸립니다.</p>
            </div>
          ) : (
            <>
          <div className="hx-main">
            <p className="hx-eyebrow">03 · 작가 인터뷰</p>
            <h1 className="hx-h1">작가진이 먼저 묻습니다.</h1>
            <p className="hx-lead">
              {intakePlan.summary} 선택은 언제든지 에디터에서 바꿀 수 있습니다. 변경이 기존
              {isSerial ? ' 회차와' : ' 원고와'} 충돌하면 영향 범위를 먼저 보여줍니다.
            </p>
            {interviewFallbackReason && (
              <div
                className="hx-interview-fallback"
                role="status"
                aria-live="polite"
                style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 196, 0, 0.08)',
                  border: '1px solid rgba(255, 196, 0, 0.35)',
                  color: '#f3c95a',
                  fontSize: 13,
                  lineHeight: 1.5
                }}
              >
                ⚠️ LLM 인터뷰 호출 실패 — 매체별 기본 질문으로 진행 중입니다. 사유 — {interviewFallbackReason}
                <br />
                <span style={{ opacity: 0.8 }}>
                  터미널에서 <code>claude login</code> 또는 <code>export ANTHROPIC_API_KEY=…</code> 를 설정한 뒤 자유
                  서술을 살짝 바꿔 다시 진입하면 작품 맞춤 질문이 생성됩니다.
                </span>
              </div>
            )}
            {!interviewFallbackReason && interviewPersonaLineup.length > 0 && (
              <div
                className="hx-interview-lineup"
                aria-label="이번 인터뷰의 작가진 라인업"
                style={{
                  margin: '12px 0',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(228, 242, 34, 0.06)',
                  border: '1px solid rgba(228, 242, 34, 0.22)',
                  color: '#d6e26b',
                  fontSize: 13,
                  lineHeight: 1.5
                }}
              >
                <span style={{ opacity: 0.7, marginRight: 8 }}>오늘 인터뷰</span>
                {interviewPersonaLineup.map((persona, idx) => (
                  <span key={persona.id}>
                    {idx > 0 && <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>}
                    <strong style={{ fontWeight: 600 }}>{persona.label}</strong>
                  </span>
                ))}
              </div>
            )}
            <div className="hx-progress" aria-label="질문 진행도">
              <span>
                {intakeQuestionIndex + 1} / {effectiveIntakeQuestions.length}
              </span>
              <div className="hx-progress-bar" aria-hidden="true">
                <i style={{ width: `${((intakeQuestionIndex + 1) / effectiveIntakeQuestions.length) * 100}%` }} />
              </div>
            </div>
            {(() => {
              const question = effectiveIntakeQuestions[intakeQuestionIndex];
              if (!question) return null;
              // 사용자가 명시적으로 고른 옵션만 selected. 추천은 별도 뱃지로 표시.
              const selectedOption = intakeAnswers[question.id];
              const persona = getIntakePersona(question.agentId);
              const recommendedId = question.recommendedOptionId;

              return (
                <article className="hx-intake-q" key={question.id}>
                  <div className="hx-intake-interviewer">
                    <InterviewerPortrait agentId={question.agentId} />
                    <span className="hx-interviewer-text">
                      <b>{persona.name}</b>
                      <em>
                        {String(intakeQuestionIndex + 1).padStart(2, '0')} · {persona.blurb}
                      </em>
                    </span>
                  </div>
                  <h3 className="hx-intake-question-text">{question.question}</h3>
                  <div className="hx-intake-options">
                    {question.options.map((option) => {
                      const isRecommended = option.id === recommendedId;
                      const isSelected = selectedOption === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`hx-intake-option ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setIntakeAnswers((current) => ({ ...current, [question.id]: option.id }))}
                          style={
                            !isSelected && isRecommended
                              ? { borderStyle: 'dashed', borderColor: 'rgba(228, 242, 34, 0.45)' }
                              : undefined
                          }
                        >
                          <strong>
                            {option.label}
                            {isRecommended && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  padding: '2px 6px',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: 4,
                                  background: 'rgba(228, 242, 34, 0.12)',
                                  color: '#d6e26b',
                                  letterSpacing: 0.3,
                                  verticalAlign: 'middle'
                                }}
                              >
                                추천
                              </span>
                            )}
                          </strong>
                          <small>{option.impact}</small>
                        </button>
                      );
                    })}
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
            {!isInterviewLoading &&
              effectiveIntakeQuestions.length > 0 &&
              intakeQuestionIndex === effectiveIntakeQuestions.length - 1 && (
                <article className="hx-open-note">
                  <div className="hx-aside-label">마지막 · 자유 메모 (선택)</div>
                  <h3 className="hx-intake-question-text">
                    질문은 여기까지입니다. 작가진에게 더 하고 싶은 말이 있나요?
                  </h3>
                  <p className="hx-open-note-help">
                    위 객관식으로 담기 어려운 설정·복선·금기를 자유롭게 적어 주세요. 비워 두어도 됩니다.
                  </p>
                  <textarea
                    aria-label="자유 메모 (주관식)"
                    className="hx-other-input"
                    value={interviewNote}
                    onChange={(event) => setInterviewNote(event.target.value)}
                    placeholder="예: 1부는 인간 시점, 2부는 토착 종족 시점으로 같은 사건을 다시 본다."
                    rows={3}
                  />
                </article>
              )}
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
                질문 완료 — {draftUnitLabel} 만들기
              </button>
            </div>
          </aside>
            </>
          )}
        </section>

        <section className="hx-panel hx-panel-building" aria-label={`${draftUnitLabel} 구성 중`}>
          <div className="hx-building">
            <p className="hx-eyebrow">04 · 구성</p>
            <h1 className="hx-h1">작가진이 {draftUnitLabel}를 쓰고 있습니다.</h1>
            <p className="hx-lead">
              자유 서술과 인터뷰 답변을 읽고, {draftUnitLabel} 초안과 작품 바이블의 초기 설정을 구성합니다. 끝나면 편집
              화면이 열립니다.
            </p>
            <div className="hx-studio" aria-hidden="true">
              <div className="hx-studio-paper">
                <div className="hx-studio-head">
                  <span className="hx-studio-dot" />
                  <span className="hx-studio-dot" />
                  <span className="hx-studio-dot" />
                </div>
                <div className="hx-studio-lines">
                  <span className="hx-studio-line" />
                  <span className="hx-studio-line" />
                  <span className="hx-studio-line" />
                  <span className="hx-studio-line" />
                  <span className="hx-studio-line" />
                  <span className="hx-studio-line" />
                </div>
                <div className="hx-studio-foot">
                  <span className="hx-studio-caret" />
                  <span className="hx-studio-penning">작가진이 쓰는 중</span>
                </div>
              </div>
            </div>
            <ol className="hx-building-steps" aria-label="구성 단계">
              <li>
                <span className="hx-step-dot" />
                자유 서술과 인터뷰 답변을 읽습니다.
              </li>
              <li>
                <span className="hx-step-dot" />
                쇼러너가 {draftUnitLabel}의 약속과 후크를 잡습니다.
              </li>
              <li>
                <span className="hx-step-dot" />
                캐릭터·배경 설계가 첫 장면을 세웁니다.
              </li>
              <li>
                <span className="hx-step-dot" />
                {draftUnitLabel} 초안을 쓰고, 바이블에 초기 설정을 제안합니다.
              </li>
            </ol>
            <p className="hx-building-note">잠시만 기다려 주세요 — 보통 1~3분 걸립니다.</p>
          </div>
        </section>
      </div>
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

  if (medium === 'academic') {
    return <FileText size={24} />;
  }

  if (medium === 'audiobook') {
    return <Clapperboard size={24} />;
  }

  return <PanelsTopLeft size={24} />;
}

export default App;
