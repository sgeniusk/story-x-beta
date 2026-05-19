import {
  Check,
  ChevronRight,
  Clapperboard,
  Feather,
  FileText,
  Lock,
  PanelsTopLeft,
  Plus,
  Sparkles
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
import { type DraftChapterPayload } from './lib/storyEngine';
import { loadProject } from './lib/storage';
import { requestLlmDraft } from './lib/draftClient';
import { StoryXDesk } from './StoryXDesk';
import storyXSymbol from './assets/brand/story-x-symbol-mono.svg';

const mediumOptions = getMediumOptions();

// 작가 인터뷰어 id → 픽셀아트 초상 클래스. 에디터 작가진과 같은 픽셀 시스템을 재사용한다
const intakePixelClass: Record<string, string> = {
  showrunner: 'is-showrunner',
  'character-custodian': 'is-character',
  'world-keeper': 'is-world',
  'voice-curator': 'is-voice',
  'essay-interviewer': 'is-essay',
  'essay-thesis': 'is-thesis',
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

type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor';
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

function LandingBrand({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="landing-brand" onClick={onClick}>
      <span className="lx-brandmark" aria-hidden="true">
        <img className="nx-brand-symbol" src={storyXSymbol} alt="" />
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
      const result = await requestLlmInterview({
        medium: blueprint.medium,
        format: blueprint.format,
        freewrite: freewriteText
      });
      if (result.ok && result.questions) {
        setLlmIntakeQuestions(result.questions);
        setIntakeQuestionIndex(0);
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
              const selectedOption = intakeAnswers[question.id] ?? question.recommendedOptionId;
              const persona = getIntakePersona(question.agentId);

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

  if (medium === 'audiobook') {
    return <Clapperboard size={24} />;
  }

  return <PanelsTopLeft size={24} />;
}

export default App;
