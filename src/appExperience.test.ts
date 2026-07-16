import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const app = readFileSync(resolve(__dirname, 'App.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');
const blueprintSource = readFileSync(resolve(__dirname, 'lib/projectBlueprint.ts'), 'utf8');
const projectCardSource = readFileSync(resolve(__dirname, 'components/ProjectLibraryCard.tsx'), 'utf8');
const diveDeskSource = readFileSync(resolve(__dirname, 'components/DiveDesk.tsx'), 'utf8');

describe('Story X page experience', () => {
  it('separates the product into landing, login, projects, new-project, and editor stages', () => {
    expect(app).toContain("type AppStage = 'landing' | 'login' | 'projects' | 'home' | 'editor'");
    expect(app).toContain('useState<AppStage>(initialStage)');
    expect(app).toContain("return 'landing';");
    expect(app).toContain('<StoryXDesk');
    expect(app).toContain('onOpenProjects={openProjectHub}');
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

  it('owns a global generation inbox and exposes it from projects and PLAY', () => {
    expect(app).toContain('loadGenerationInbox()');
    expect(app).toContain('<GenerationInboxPanel');
    expect(app).toContain('startDiveCondenseJob');
    expect(app).toContain('onOpenGenerationInbox');
    expect(css).toContain('.projects-page .gix-panel');
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

describe('온보딩 소재발굴 (S1+S2 — 선택 스텝 + 프리셋·구상 갈래)', () => {
  it('소설류 2단계는 소재발굴 3갈래 카드다 — 함께 구상 활성(S2)', () => {
    expect(blueprintSource).toContain("'source'");
    expect(blueprintSource).toContain("'ideate'");
    expect(app).toContain('소재발굴');
    expect(app).toContain('함께 구상');
    expect(app).toContain('인기 프리셋');
    expect(app).not.toContain('준비 중'); // S2 — 함께 구상 활성화
    expect(app).toContain("setHomeFlowStep('ideate')");
    expect(app).toContain('소재발굴로 계속');
    expect(app).toContain('자유 서술로 계속');
    expect(app).toContain('인터뷰로 계속');
  });

  it('함께 구상 갈래는 onboard-chat 으로 응결해 playseed 에 합류한다', () => {
    expect(app).toContain('OnboardChatPanel');
    expect(app).toContain("homeFlowStep === 'ideate'");
    expect(app).toContain('sendOnboardChat');
    expect(app).toContain('requestOnboardChat');
    expect(app).toContain("setPlaySeedEntry('ideate')");
  });

  it('playseed 의 이전 버튼은 진입원 갈래로 돌아간다', () => {
    expect(app).toContain('playSeedEntry');
    expect(app).toMatch(/usesSourceDiscovery \? playSeedEntry : 'freewrite'/);
  });

  it('프리셋 갈래는 LLM 0콜로 playseed 확인 카드에 도달한다', () => {
    expect(app).toContain('STORY_PRESETS');
    expect(app).toContain('pickStoryPreset');
    expect(app).toContain("homeFlowStep === 'preset'");
  });

  it("HomeFlowStep 에 'playseed' 가 있고 PlaySeedPanel 이 배선된다", () => {
    expect(blueprintSource).toContain("'playseed'");
    expect(app).toContain('PlaySeedPanel');
    expect(app).toContain("homeFlowStep === 'playseed'");
    expect(app).toContain('partnerIndex'); // 상대 선택 배선
  });

  it('플레이 승인 핸들러는 임시작 저장→PLAY 저장→온보딩 정리→dive 순서를 지킨다', () => {
    const handler = app.match(/function handleStartPlay[\s\S]{0,600}?\n  \}/)?.[0] ?? '';
    const order = ['saveTemporaryProject(', 'setWorkTitle(', 'saveDiveState(', 'clearOnboardingDraft(', "setStage('dive')"];
    const idx = order.map((s) => handler.indexOf(s));
    expect(idx.every((v) => v >= 0)).toBe(true);
    expect([...idx]).toEqual([...idx].sort((a, b) => a - b));
  });
});

describe('P0-c 작품 라이브러리 배선', () => {
  it('ProjectHub가 실제 라이브러리와 임시/확정 카드를 렌더한다', () => {
    expect(app).toContain('loadProjectLibrary');
    expect(app).toContain('ProjectLibraryCard');
    expect(projectCardSource).toContain('임시작');
    expect(projectCardSource).toContain('작품으로 확정');
  });

  it('작품 이어쓰기는 해당 projectId를 활성화한 뒤 editor로 들어간다', () => {
    expect(app).toContain('activateProject(entry.projectId)');
    expect(app).toContain('handleOpenLibraryProject');
  });

  it('생성 결과 검토도 결과의 projectId 활성화에 성공한 뒤에만 dive로 들어간다', () => {
    expect(app).toContain('activateProject(item.projectId)');
    expect(app).toMatch(/if \(!activateProject\(item\.projectId\)\) return;/);
  });

  it('초안 부트와 PLAY-first 모두 새 작품을 temporary lifecycle로 저장한다', () => {
    expect(app).toContain('saveTemporaryProject(project)');
    expect(app).toContain('initialProjectLifecycle="temporary"');
  });
});

describe('P0-b PLAY 기록 복구 배선', () => {
  it('잡 요청과 별도로 전체 PLAY recovery snapshot을 생성 영수증에 보존한다', () => {
    expect(diveDeskSource).toContain('buildPlayRecoverySnapshot(session, project)');
    expect(app).toMatch(/handleStartGeneration[\s\S]{0,500}?recovery/);
    expect(app).toMatch(/appendGenerationInboxItem[\s\S]{0,300}?recovery/);
  });

  it('TXT 다운로드는 복구 포맷터와 안전 파일명을 사용한다', () => {
    expect(app).toContain('formatPlayRecoveryText(recovery)');
    expect(app).toContain('buildPlayRecoveryFilename(recovery)');
  });

  it('WRITE 작업본 열기는 대상 작품만 활성화하고 본편 Chapter를 만들지 않는다', () => {
    const handler = app.match(/function handleOpenRecoveryWorkDraft[\s\S]{0,3000}?\n  \}/)?.[0] ?? '';
    expect(handler).toContain('activateProject(recovery.projectId)');
    expect(handler).toContain('createPlayRecoveryWorkDraft(');
    expect(handler).toContain('savePlayRecoveryWorkDraft(');
    expect(handler).toContain('persistRecoveryDraftReceipt(');
    expect(app).toContain('buildLocalRecoveryReceipt(');
    expect(app).toContain('appendGenerationInboxItem(');
    expect(app).toContain('recoveryDraftOpenedAt');
    expect(handler).toContain("setStage('editor')");
    expect(handler).not.toContain('saveProject(');
    expect(handler).not.toContain('chapterFromDraftPayload(');
    expect(handler).not.toContain('planPlayRecoveryCommit(');
  });

  it('local 영수증을 다시 열 때 계산한 새 id보다 영수증의 recoveryDraftId를 우선해 기존 본문을 재개한다', () => {
    const handler = app.match(/function handleOpenRecoveryWorkDraft[\s\S]{0,3500}?\n  \}/)?.[0] ?? '';
    expect(handler).toContain('previousReceipt?.recoveryDraftId');
    expect(handler.indexOf('const previousReceipt')).toBeLessThan(handler.indexOf('const previousDraft'));
  });

  it('명시적 회차 저장에서만 pending-sync를 검사하고 본편·영수증을 완료 처리한다', () => {
    const handler = app.match(/function handleCommitRecoveryWorkDraft[\s\S]{0,7500}?\n  \}/)?.[0] ?? '';
    const order = [
      'savePlayRecoveryWorkDraft(',
      'activateProject(receiptLinkedDraft.projectId)',
      'inspectPlayRecoveryCommitIntent(',
      'planPlayRecoveryCommit(',
      'preparePlayRecoveryCommitIntent(',
      'saveProject(',
      'saveDiveState(',
      'const recoveredAt = new Date()',
      'commitGenerationInbox(',
      'removePlayRecoveryWorkDraft(',
      'refreshActiveProjectState()',
      "setStage('editor')"
    ];
    let cursor = 0;
    const indexes = order.map((token) => {
      const index = handler.indexOf(token, cursor);
      if (index >= 0) cursor = index + token.length;
      return index;
    });
    expect(indexes.every((index) => index >= 0)).toBe(true);
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
    expect(handler).toContain('localPersistenceFailed');
  });

  it('회차 저장 시 저장소의 최신 draft를 다시 읽은 뒤 commit intent를 판정한다', () => {
    const handler = app.match(/function handleCommitRecoveryWorkDraft[\s\S]{0,7500}?\n  \}/)?.[0] ?? '';
    expect(handler).toContain('const persistedDraft = listPlayRecoveryWorkDrafts(');
    expect(handler.indexOf('savePlayRecoveryWorkDraft(')).toBeLessThan(handler.indexOf('const persistedDraft'));
    expect(handler.indexOf('const persistedDraft')).toBeLessThan(handler.indexOf('inspectPlayRecoveryCommitIntent('));
  });

  it('다른 탭이 이미 영수증·draft 정리를 완료했으면 stale 화면에서 새 draft를 만들지 않는다', () => {
    const handler = app.match(/function handleCommitRecoveryWorkDraft[\s\S]{0,7500}?\n  \}/)?.[0] ?? '';
    expect(handler).toContain('const durableCompletedReceipt = loadGenerationInbox()');
    expect(handler.indexOf('const durableCompletedReceipt')).toBeLessThan(handler.indexOf('savePlayRecoveryWorkDraft('));
    expect(handler).toContain('durableCompletedReceipt.recoveredChapterId');
  });

  it('local 영수증 영속에 실패한 작업본은 닫기·전역 이탈·beforeunload를 막고 재저장을 시도한다', () => {
    expect(app).toContain('hasDurableRecoveryDraftReceipt(');
    expect(app).toContain('recoveryExitGuardActive');
    expect(app).toMatch(/function canLeaveRecoveryWorkDraft[\s\S]{0,1000}?recoveryExitGuardActive/);
    expect(app).toMatch(/beforeunload[\s\S]{0,500}?recoveryExitGuardActive|recoveryExitGuardActive[\s\S]{0,500}?beforeunload/);
    const changeHandler = app.match(/function handleRecoveryWorkDraftChange[\s\S]{0,1800}?\n  \}/)?.[0] ?? '';
    expect(changeHandler).toContain('persistRecoveryDraftReceipt(');
  });

  it('이전 오염 회차는 엄격한 도메인 판정과 PLAY working copy 동시 수리 뒤에만 작업본으로 환원한다', () => {
    expect(app).toContain('repairLegacyPlayRecoveryChapter(');
    expect(app).toContain('loadDiveStateForProject(item.projectId)');
    expect(app).toContain('saveDiveStateForProject(');
    expect(app).toContain('recoveryDraftId: draft.id');
    expect(app).toContain('recoveredAt: undefined');
    expect(app).toContain('recoveredChapterId: undefined');
  });

  it('legacy 환원 journal을 남긴 뒤 최신 본편·PLAY를 다시 읽고 엄격 판정을 재실행한다', () => {
    const migration = app.match(/function migrateLegacyRecoveryDrafts[\s\S]{0,8000}?\n  \}/)?.[0] ?? '';
    const journalIndex = migration.indexOf('savePlayRecoveryWorkDraft(draft, isActiveProject)');
    const latestLibraryIndex = migration.indexOf('const latestLibraryEntry = loadProjectLibrary()');
    const latestWorkingIndex = migration.indexOf('const latestWorkingState = loadDiveStateForProject');
    const saveProjectIndex = migration.indexOf('saveProject(latestCommittedRepair.updatedProject');
    expect(journalIndex).toBeGreaterThanOrEqual(0);
    expect(latestLibraryIndex).toBeGreaterThan(journalIndex);
    expect(latestWorkingIndex).toBeGreaterThan(latestLibraryIndex);
    expect(saveProjectIndex).toBeGreaterThan(latestWorkingIndex);
    expect(migration).toContain('if (latestCommittedContainsLegacy && !latestCommittedRepair) continue;');
    expect(migration).toContain('if (latestWorkingContainsLegacy && !latestWorkingRepair) continue;');
  });

  it('StoryXDesk에 프로젝트 밖 복구 작업본과 저장·닫기 콜백을 전달한다', () => {
    expect(app).toContain('recoveryWorkDraft={activeRecoveryWorkDraft}');
    expect(app).toContain('onRecoveryWorkDraftChange={handleRecoveryWorkDraftChange}');
    expect(app).toContain('onCommitRecoveryWorkDraft={handleCommitRecoveryWorkDraft}');
    expect(app).toContain('onCloseRecoveryWorkDraft={handleCloseRecoveryWorkDraft}');
  });

  it('생성 영수증 저장 실패를 잡 시작 실패로 전파하지 않고 메모리 상태를 유지한다', () => {
    expect(app).toContain('persistGenerationInboxState(next)');
    expect(app).toContain('generationInboxRef.current = visible');
  });
});
