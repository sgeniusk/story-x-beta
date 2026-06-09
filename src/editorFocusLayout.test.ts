import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const desk = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');
const canonDataView = readFileSync(resolve(__dirname, 'lib/canonDataView.ts'), 'utf8');
// rank5 — 추출된 서브컴포넌트는 정의-존재를 각 파일에서 검사한다(사용처 단언은 desk 유지).
const componentSrc = (name: string) =>
  readFileSync(resolve(__dirname, `components/${name}.tsx`), 'utf8');

describe('Story X focused editor layout', () => {
  it('routes the center workspace by creative medium', () => {
    expect(desk).toContain('function CreativeStage');
    expect(desk).toContain('initialMedium');
    expect(desk).toContain("blueprint.medium === 'comics'");
    expect(desk).toContain("blueprint.medium === 'audiobook'");
    expect(desk).toContain('className="sx-canvas-surface"');
    expect(desk).toContain('className="sx-storyboard-surface"');
    expect(desk).toContain('className={`sx-writing-surface');
  });

  it('keeps the creative artifact as the 70 percent center of the editor', () => {
    expect(css).toContain('grid-template-columns: clamp(200px, 15vw, 260px) minmax(0, 1fr) clamp(220px, 18vw, 320px)');
    // P5 — 3컬럼 그리드는 1280px·1440px에서 유지, 약 1080px 미만에서만 에이전트 레일을 접는다
    expect(css).toContain('@media (max-width: 1080px)');
    expect(css).toContain('.sx-creative-stage');
    expect(css).toContain('.sx-writing-surface');
    expect(css).toContain('.sx-canvas-surface');
    expect(css).toContain('.sx-storyboard-surface');
    // P1 — 편집 트랙은 얇은 툴스트립 1행 + 원고가 채우는 1행
    expect(css).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(css).toContain('height: 100%');
    // Linear 다크 매핑 — pitch black 캔버스 토큰
    expect(css).toContain('--sx-paper: #08090a');
    expect(css).toContain('.sx-workbench {\n    order: 1;');
  });

  it('keeps evaluator quality gates visible inside the focused editor rail', () => {
    expect(desk).toContain('buildTesterDrivenWorkflow');
    expect(desk).toContain('EvaluatorQualityCard');
    expect(desk).toContain('품질 게이트');
    expect(css).toContain('.sx-evaluator-card');
  });

  it('uses a compact app shell instead of the marketing banner inside the editor', () => {
    expect(desk).toContain('sx-topbar-actions');
    expect(desk).toContain('className="sx-app-breadcrumb"');
    // P2 — 명령 팔레트는 ⌘K 단축키로 연다 (시각 버튼 제거)
    expect(desk).toContain("event.key.toLowerCase() === 'k'");
    // 일하는 바 — 저장 상태 칩은 좌측 존에 있다
    expect(desk).toContain('sx-save-chip ex-workbar-save');
    expect(componentSrc('StoryXStatusBar')).toContain('function StoryXStatusBar');
    expect(desk).toContain('<StoryXStatusBar');
    expect(desk).toContain('alphaReport={alphaReport}');
    expect(desk).not.toContain('AI 작가진과 함께, 흔들림 없는 세계관을 만듭니다.');
    expect(desk).not.toContain('<AlphaSelfCheckCard alphaReport={alphaReport} />');
    expect(css).toContain('.sx-statusbar');
    expect(css).toContain('height: 32px');
    expect(css).toContain('--sx-ink-2: rgba(247, 248, 248, 0.82)');
    expect(css).toContain('.sx-writing-surface .sx-writing-page h2');
    // 원고칸은 산문만 — beat 한줄 요약은 좌측 구조 트리에서만 본다
    expect(desk).not.toContain('sx-outline-strip');
    expect(desk).not.toContain('sx-writing-hook');
  });

  it('supports user editing, review runs, and a chapter tree in the editor', () => {
    expect(desk).toContain('const [draftPrompt, setDraftPrompt]');
    expect(desk).toContain('const [editorText, setEditorText]');
    expect(desk).toContain('const [editedSinceReview, setEditedSinceReview]');
    expect(desk).toContain('function reviewDraft');
    expect(desk).toContain('바이블 열기');
    // P2-B — '이번 회차 의도'는 FloatingEditor 로 이동했다. AgentIntentCard 정의는 컴포넌트 파일에 있다.
    expect(componentSrc('AgentIntentCard')).toContain('ex-intent-card');
    expect(componentSrc('AgentIntentCard')).toContain('function AgentIntentCard');
    expect(componentSrc('AgentIntentCard')).toContain('className="ex-intent-textarea"');
    expect(desk).toContain('aria-label="원고 편집기"');
    expect(desk).toContain('const [isFocusMode, setIsFocusMode]');
    expect(desk).toContain('className="sx-expand-editor-button"');
    expect(desk).toContain('편집기 확대');
    expect(desk).toContain('const mainActionLabel = !latestChapter');
    expect(desk).toContain('? actionLabels.draft');
    expect(desk).toContain(': actionLabels.review');
    expect(desk).toContain('수정됨');
    // 회차 이동은 상단바 회차 선택기로 일원화했다
    expect(desk).toContain('aria-label="회차 이동"');
    // P2-B — 좌측 레일은 평탄한 beat 목록 대신 기승전결 구조 트리를 보여준다
    expect(componentSrc('ChapterStructureTree')).toContain('function ChapterStructureTree');
    expect(componentSrc('ChapterStructureTree')).toContain('회차 구조');
    expect(componentSrc('ChapterStructureTree')).toContain('function groupBeatsIntoActs');
    expect(componentSrc('ChapterStructureTree')).toContain('function resolveActTitle');
    expect(desk).toContain("const [studioRailTab, setStudioRailTab]");
    expect(desk).toContain("window.localStorage.getItem('storyx.studio.railTab')");
    expect(desk).toContain('<DataPanel metrics={studioMetrics} onMediaAxisChange={updateStoryModeAxis} />');
    expect(desk).toContain('toStudioMetrics({');
    expect(desk).not.toContain('function HarnessReportCard');
    expect(desk).not.toContain('function QualityGatesCard');
    expect(desk).not.toContain('function MediaProjectionsCard');
    expect(desk).not.toContain('function OntologyCard');
    expect(desk).not.toContain('function ChapterBeatsCard');
    expect(desk).not.toContain('function ChapterTreeCard');
    expect(desk).toContain('검토');
    expect(css).toContain('.sx-manuscript-editor');
    expect(css).toContain('position: sticky');
    expect(css).toContain('.sx-desk.is-focus-mode .sx-project-rail');
    expect(css).toContain('.sx-expand-editor-button');
    expect(css).toContain('.sx-manuscript-editor p.is-anchored');
    expect(css).toContain('.sx-desk .ex-scene');
    expect(css).toContain('.sx-rail-seg');
    expect(css).toContain('.sx-data-stack');
    expect(css).toContain('.sx-axis-input');
  });

  it('P1 — keeps the manuscript as the protagonist with a thin toolstrip above it', () => {
    expect(desk).toContain("className={`sx-workbench ${isPublishingMode ? 'is-publishing' : activeTrack === 'bible' ? 'is-bible' : 'is-draft'}");
    expect(css).toContain('.sx-workbench.is-draft');
    // 편집 트랙: 툴스트립 1행 + 원고가 나머지 공간을 채우는 1행
    expect(css).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(css).toContain('.sx-workbench.is-draft .sx-creative-stage');
    // 얇은 툴스트립은 FloatingEditor 로 이동했다. CSS 정의는 styles.css 에 유지된다.
    expect(css).toContain('.sx-desk .ex-toolstrip');
    expect(css).toContain('min-height: 52px;');
    expect(css).toContain('.sx-desk .ex-scale-toggle');
    expect(css).toContain('.sx-desk .ex-focus-btn');
  });

  it('adds a command palette for quick navigation and editor actions', () => {
    expect(desk).toContain('const [isCommandPaletteOpen, setIsCommandPaletteOpen]');
    expect(desk).toContain('const [commandQuery, setCommandQuery]');
    expect(desk).toContain('const commandItems = useMemo<DeskCommand[]>');
    expect(componentSrc('CommandPalette')).toContain('function CommandPalette');
    // P2 — 팔레트는 ⌘K 단축키로 연다. 상단 클러터를 줄이려 시각 버튼은 제거했다
    expect(desk).toContain("event.key.toLowerCase() === 'k'");
    expect(desk).toContain('setIsCommandPaletteOpen((current) => !current)');
    expect(componentSrc('CommandPalette')).toContain('명령 또는 화면 검색');
    expect(desk).toContain('승인 대기 열기');
    expect(desk).toContain('집중 모드 토글');
    // 매체 변경도 팔레트 명령으로 유지된다
    expect(desk).toContain("id: 'open-media-change'");
    expect(css).toContain('.sx-command-palette-backdrop');
    expect(css).toContain('.sx-command-palette');
    expect(css).toContain('.sx-command-list');
  });

  it('P2 — restructures the editor topbar into a dense 3-zone working bar', () => {
    // 일하는 바 — 좌/중앙/우 3존 구조 (design3 working bar)
    expect(desk).toContain('sx-topbar sx-app-shell-topbar ex-workbar');
    expect(desk).toContain('sx-brand ex-workbar-left');
    expect(desk).toContain('sx-track-tabs ex-workbar-modes');
    expect(desk).toContain('sx-topbar-actions ex-workbar-right');
    // 저장 상태 칩과 출간 버튼은 유지되지만 working bar 존으로 재배치됐다
    expect(desk).toContain('sx-save-chip ex-workbar-save');
    expect(desk).toContain('sx-publish-button');
    // 홈 버튼/아바타/매체 칩/⌘K 버튼은 상단에서 제거했다
    expect(desk).not.toContain('className="sx-command-k"');
    expect(desk).not.toContain('className="sx-user-avatar"');
    expect(desk).not.toContain('className="sx-media-change-button"');
    expect(desk).not.toContain('className="sx-app-nav-links"');
    // 브랜드 영역은 홈 버튼 + 인라인 편집 가능한 제목을 포함한다
    expect(desk).toContain('className="sx-brand-mark sx-brand-home"');
    expect(desk).toContain('className="sx-crumb-title-input"');
  });

  it('uses a two-track editor with publishing moved to a separate action', () => {
    expect(desk).toContain("type DeskTrack = 'draft' | 'bible'");
    expect(canonDataView).toContain("type BibleSection = 'overview' | 'characters' | 'world' | 'canon' | 'voice' | 'approval'");
    expect(desk).toContain('const [activeTrack, setActiveTrack]');
    expect(desk).toContain('const [isPublishingMode, setIsPublishingMode]');
    // P3 — 데이터 모드는 단일 dataView 상태로 캐논 분야/바이블 작업장 진입점을 함께 표현한다
    expect(desk).toContain('const [dataView, setDataView]');
    expect(desk).toContain('const [approvalDecisions, setApprovalDecisions]');
    expect(desk).toContain('const [isMediaPanelOpen, setIsMediaPanelOpen]');
    expect(desk).toContain('원고 편집');
    expect(desk).toContain('작품 바이블');
    expect(desk).toContain('출간 준비');
    expect(desk).toContain('sx-publish-button');
    expect(desk).toContain('매체 변경');
    expect(desk).toContain('sx-track-tabs ex-workbar-modes');
    expect(desk).toContain('className="sx-bible-alert-badge"');
    expect(desk).toContain('className="sx-media-change-panel"');
    expect(componentSrc('MemoryBankStudio')).toContain('function MemoryBankStudio');
    expect(desk).toContain('function updateCharacterMemory');
    expect(desk).toContain('function updateWorldMemory');
    expect(desk).toContain('function updateCanonMemory');
    expect(desk).toContain('function setApprovalDecision');
    // P3 — 데이터 모드 가운데 캔버스는 dataView가 가리키는 분야/섹션을 받는다
    expect(desk).toContain('activeSection={dataView.section}');
    expect(desk).toContain('onSelectBibleSection={openBibleSection}');
    expect(css).toContain('flex-wrap: wrap');
    expect(componentSrc('MemoryBankStudio')).toContain('승인됨');
    expect(componentSrc('MemoryBankStudio')).toContain('수정 요청됨');
    expect(componentSrc('MemoryBankStudio')).toContain('보류됨');
    expect(css).toContain('.sx-track-tabs');
    // P5 — 편집/바이블/출간 트랙 전환 시 작업대에 약 130ms opacity 페이드
    expect(desk).toContain('const [isWorkbenchFading, setIsWorkbenchFading]');
    expect(desk).toContain('function runWithWorkbenchFade');
    expect(desk).toContain('function switchToTrack');
    expect(css).toContain('.sx-workbench.is-fading');
    expect(css).toContain('transition: opacity 130ms ease');
    expect(css).toContain('.sx-publish-button');
    expect(css).toContain('.sx-media-change-panel');
    expect(css).toContain('.sx-bible-studio');
    expect(css).toContain('.sx-bible-workbench');
    expect(css).toContain('.sx-bible-card textarea');
    expect(css).toContain('.sx-canon-board');
    expect(css).toContain('.sx-memory-packet-card');
    expect(css).toContain('.sx-approval-queue');
    expect(css).toContain('.sx-approval-status');
  });

  it('keeps editor rails focused and moves memory, quality, and harness work into the bible flow', () => {
    expect(desk).toContain('buildAlphaReadinessReport');
    expect(desk).toContain('const alphaReport = useMemo');
    expect(componentSrc('StoryXStatusBar')).toContain('function StoryXStatusBar');
    expect(desk).toContain('alphaReport={alphaReport}');
    expect(componentSrc('StoryXStatusBar')).toContain('알파 셀프체크');
    expect(componentSrc('StoryXStatusBar')).toContain('report.nextActions[0]');
    expect(desk).not.toContain('<CurrentBlueprintCard');
    expect(desk).not.toContain('<MemoryBankCard bank={memoryBank} />');
    expect(desk).not.toContain('<AiCliHarnessCard');
    expect(desk).not.toContain('<EvaluatorQualityCard workflow={evaluatorWorkflow} />');
    expect(desk).not.toContain('<ContinuitySummaryCard');
    expect(desk).toContain("const isBibleMode = activeTrack === 'bible' && !isPublishingMode");
    expect(componentSrc('OpenThreadsCard')).toContain('function OpenThreadsCard');
    expect(desk).toContain('<OpenThreadsCard threads={project.openThreads} />');
    expect(componentSrc('BibleAssistantSidebar')).toContain('function BibleAssistantSidebar');
    expect(componentSrc('BibleAssistantSidebar')).toContain('조수진');
    expect(desk).toContain('<BibleAssistantSidebar');
    expect(desk).toContain('sx-focused-assist-rail');
    expect(css).toContain('.sx-focused-assist-rail');
    expect(css).toContain('.sx-bible-assistant-sidebar');
    expect(css).toContain('.sx-statusbar');
    expect(css).toContain('.sx-statusbar-alpha');
  });

  it('adds a publishing studio for release snapshots and change-log review', () => {
    expect(desk).toContain('buildPublishingPlan');
    expect(desk).toContain('const publishingPlan = useMemo');
    expect(desk).toContain('{ approvalQueue }');
    expect(desk).toContain('PublishingStudio');
    expect(desk).toContain('PublishingIndexCard');
    expect(desk).toContain('onBackToEditor');
    expect(desk).toContain('출간 스냅샷');
    expect(desk).toContain('변경 로그 검토');
    expect(desk).toContain('plan.releaseLock');
    expect(desk).toContain('출간 스냅샷 잠그기');
    expect(desk).toContain('첫 300자');
    expect(desk).toContain('게시 위치');
    expect(desk).toContain('memory-approval');
    expect(desk).toContain('만화는 스토리보드 패키지');
    expect(css).toContain('.sx-publishing-studio');
    expect(css).toContain('.sx-release-checklist');
    expect(css).toContain('.sx-release-gate-state');
    expect(css).toContain('.sx-release-lock-panel');
    expect(css).toContain('.sx-platform-proof-card');
  });

  it('turns the memory bank into a left-indexed central editing workspace', () => {
    expect(componentSrc('MemoryBankStudio')).toContain('className={`sx-bible-workbench is-${activeSection}`}');
    expect(componentSrc('MemoryBankStudio')).toContain('BibleWorkbenchHeader');
    expect(componentSrc('MemoryBankStudio')).toContain('buildBibleSectionState');
    expect(componentSrc('BibleWorkbenchHeader')).toContain('sectionState.reviewAgents.map');
    expect(componentSrc('BibleWorkbenchHeader')).toContain('변경 영향');
    expect(componentSrc('BibleWorkbenchHeader')).toContain('검토 순서');
    expect(desk).toContain('function requestBibleReview');
    expect(desk).toContain('onRequestReview={requestBibleReview}');
    expect(componentSrc('BibleWorkbenchHeader')).toContain('변경 검토 요청');
    expect(componentSrc('BibleWorkbenchHeader')).toContain('className="sx-bible-review-request"');
    expect(componentSrc('MemoryBankStudio')).toContain("activeSection === 'characters'");
    expect(componentSrc('MemoryBankStudio')).toContain("activeSection === 'world'");
    expect(componentSrc('MemoryBankStudio')).toContain("activeSection === 'canon'");
    expect(componentSrc('MemoryBankStudio')).toContain("activeSection === 'voice'");
    expect(componentSrc('MemoryBankStudio')).toContain("activeSection === 'approval'");
    expect(componentSrc('MemoryBankStudio')).toContain('onUpdateCharacter(character.id');
    expect(componentSrc('MemoryBankStudio')).toContain('onUpdateWorldRule(rule.id');
    expect(componentSrc('MemoryBankStudio')).toContain('onUpdateCanon(fact.id');
    expect(componentSrc('MemoryBankStudio')).toContain('CanonRefactorPanel');
    expect(desk).not.toContain('className="sx-bible-section-tabs"');
    expect(desk).not.toContain('<MemoryWorkbenchPanel');
    expect(css).toContain('.sx-bible-workbench');
    expect(css).toContain('.sx-bible-workbench-header');
    expect(css).toContain('.sx-bible-impact-strip');
    expect(css).toContain('.sx-bible-review-request');
    expect(css).toContain('.sx-bible-card textarea');
  });

  it('tracks bible edits through a canon refactor impact panel', () => {
    expect(desk).toContain('buildCanonRefactorPlan');
    expect(desk).toContain('createCanonChangeEntry');
    expect(desk).toContain('const [canonChanges, setCanonChanges]');
    expect(desk).toContain('function logCanonChange');
    expect(componentSrc('CanonRefactorPanel')).toContain('CanonRefactorPanel');
    expect(componentSrc('CanonRefactorPanel')).toContain('변경 로그');
    expect(componentSrc('CanonRefactorPanel')).toContain('영향 회차');
    expect(componentSrc('CanonRefactorPanel')).toContain('에이전트 검토 순서');
    expect(componentSrc('CanonRefactorPanel')).toContain('캐논 리팩터');
    expect(css).toContain('.sx-canon-refactor-panel');
    expect(css).toContain('.sx-change-log-list');
    expect(css).toContain('.sx-refactor-review-order');
  });

  it('connects the flow validation button to the AI review contract and pending memory candidates', () => {
    expect(desk).toContain('buildAiCliRunPlan');
    expect(desk).toContain('buildMockAiCliReviewResult');
    expect(desk).toContain('agentReportsToRuns');
    expect(desk).toContain('const [reviewScale, setReviewScale]');
    expect(desk).toContain('const [reviewProvider, setReviewProvider]');
    expect(desk).toContain('const [latestReviewResult, setLatestReviewResult]');
    expect(desk).toContain('function AiCliHarnessCard');
    expect(desk).not.toContain('<AiCliHarnessCard');
    expect(desk).toContain('흐름 검증');
    expect(desk).toContain('memoryCandidates');
    expect(desk).toContain('setLatestReviewResult(result)');
    expect(css).toContain('.sx-memory-candidate-list');
  });

  it('routes AI review memory candidates into an editable memory approval queue', () => {
    expect(desk).toContain('buildMemoryApprovalQueue');
    expect(desk).toContain('const approvalQueue = useMemo');
    expect(desk).toContain('latestReviewResult?.memoryCandidates ?? []');
    expect(desk).toContain('const [approvalStatementOverrides, setApprovalStatementOverrides]');
    expect(desk).toContain('function updateApprovalStatement');
    expect(desk).toContain('approvalQueue={approvalQueue}');
    expect(desk).toContain('onUpdateApprovalStatement={updateApprovalStatement}');
    expect(componentSrc('MemoryBankStudio')).toContain('approvalQueue.items.map');
    expect(componentSrc('MemoryBankStudio')).toContain('value={item.editableStatement}');
    expect(desk).toContain('승인 대기함 열기');
    expect(componentSrc('MemoryBankStudio')).toContain('동기화 가능');
    expect(css).toContain('.sx-approval-summary');
    expect(css).toContain('.sx-approval-source-pill');
    expect(css).toContain('.sx-approval-impact-tags');
  });

  it('P2 — uses 편집/데이터 primary tabs and keeps 출간 reachable as a secondary action', () => {
    // 편집/데이터 두 PRIMARY 모드 탭 (디자인의 Workbar 편집/데이터)
    expect(desk).toContain('className="sx-track-tabs ex-workbar-modes ex-mode-pair"');
    expect(desk).toContain('aria-label="작업 모드"');
    expect(desk).toContain('데이터');
    // 출간은 탭에서 빠지고 우측 존의 secondary 버튼으로 유지된다
    expect(desk).toContain('ex-workbar-publish');
    expect(desk).toContain('openPublishingMode');
    expect(css).toContain('.sx-topbar .ex-workbar-publish');
  });

  it('P2-B — rebuilds the edit-mode left rail with work state, agent intent, structure tree and tension chart', () => {
    // 작품 상태 4셀 그리드 (마감 없음) — WorkStateGrid 는 DataLeftRail 에서 사용된다
    expect(componentSrc('WorkStateGrid')).toContain('function WorkStateGrid');
    expect(componentSrc('WorkStateGrid')).toContain('총 분량');
    expect(componentSrc('WorkStateGrid')).toContain('이번 회차 분량');
    expect(desk).not.toContain('마감');
    // 회차 의도는 AI 에이전트 발언으로 명시된다
    expect(componentSrc('AgentIntentCard')).toContain('가 잡은 ');
    expect(componentSrc('AgentIntentCard')).toContain('className="ex-intent-by"');
    // 회차 구조 트리 — 기승전결 act 묶음, 에이전트 선택 스킴
    expect(componentSrc('ChapterStructureTree')).toContain('STRUCTURE_ACTS');
    expect(componentSrc('ChapterStructureTree')).toContain('· 에이전트 선택');
    expect(componentSrc('ChapterStructureTree')).toContain('className="ex-act-body"');
    // 긴장 · 분량 곡선 — SVG 라인차트, 분량 비중은 계획값으로 라벨링
    expect(componentSrc('TensionShareChart')).toContain('function TensionShareChart');
    expect(componentSrc('TensionShareChart')).toContain('분량 비중 · 계획');
    expect(componentSrc('TensionShareChart')).toContain('beat.tension');
    expect(css).toContain('.sx-desk .ex-work-state');
    expect(css).toContain('.sx-desk .ex-structure-tree');
    expect(css).toContain('.sx-desk .ex-chart-svg');
  });

  it('P2-C — replaces the right review rail with margin annotations and a core strip', () => {
    expect(desk).toContain('const marginReview = useMarginReview');
    // MarginColumn 과 CoreStrip 은 FloatingEditor 로 이동했다.
    expect(desk).toContain('<MentionBar');
    expect(desk).toContain('toMarginReview');
    expect(desk).toContain('data-pid={paragraph.id}');
    expect(desk).not.toContain('function AgentReviewRow');
    expect(desk).not.toContain('ex-review-row ex-review-row--');
    expect(css).toContain('.sx-margin-col');
    expect(css).toContain('.sx-core-strip');
    expect(css).toContain('.sx-manuscript-editor p.is-anchored');
    expect(css).toContain('.sx-desk.is-draft-mode .sx-desk-grid');
    expect(css).toContain('.sx-desk.drawer-open .sx-margin-col');
    expect(css).not.toContain('.sx-desk .ex-review-row');
  });

  it('surfaces the one-project vertical slice inside the editor approval flow', () => {
    expect(desk).toContain('buildOneProjectVerticalSlice');
    expect(desk).toContain('const verticalSlice = useMemo');
    expect(desk).toContain('...verticalSlice.memoryCandidates');
    expect(desk).toContain('VerticalSliceProofPanel');
    // verticalSlice 는 floatingEditorProps 로 전달된다 — 직접 prop 전달은 FloatingEditor 경로에 있다
    expect(desk).toContain('onOpenApprovalQueue');
    expect(desk).toContain('승인 대기함 열기');
    expect(desk).toContain('웹소설 1화');
    expect(desk).toContain('인스타툰 4컷');
    expect(desk).toContain('오디오북 30초');
    expect(css).toContain('.sx-vertical-slice-panel');
    expect(css).toContain('.sx-vertical-slice-artifacts');
    expect(css).toContain('.sx-vertical-slice-ledger');
  });

  it('P3 — rebuilds the data mode with a canon nav left rail, a category canvas and a per-category review rail', () => {
    // 데이터 모드는 캐논 분야 5종 또는 바이블 작업장을 가리키는 dataView 하나로 라우팅된다
    expect(canonDataView).toContain("type CanonCategory = 'characters' | 'places' | 'objects' | 'events' | 'timeline'");
    expect(canonDataView).toContain('type DataView');
    expect(desk).toContain('function openBibleSection');
    // 좌레일 — 작품 상태(편집 모드와 공유) + 캐논 nav 5종 + 바이블 규칙 아코디언 + 작품 데이터 진입점
    expect(componentSrc('DataLeftRail')).toContain('function DataLeftRail');
    expect(componentSrc('CanonNav')).toContain('function CanonNav');
    expect(componentSrc('BibleRulesAccordion')).toContain('function BibleRulesAccordion');
    expect(componentSrc('DataLeftRail')).toContain('project.bibleOutline');
    expect(componentSrc('CanonNav')).toContain('캐논 분야');
    expect(componentSrc('DataLeftRail')).toContain('바이블 규칙');
    // 가운데 캔버스 — 인물 관계도 / 장소·사물·사건 카드 / 시간선
    expect(componentSrc('CanonCanvas')).toContain('function CanonCanvas');
    expect(componentSrc('CharacterGraph')).toContain('function CharacterGraph');
    expect(componentSrc('CharacterDetailPanel')).toContain('function CharacterDetailPanel');
    expect(componentSrc('CanonCardGrid')).toContain('function CanonCardGrid');
    expect(componentSrc('CanonTimeline')).toContain('function CanonTimeline');
    expect(componentSrc('CharacterGraph')).toContain('character.relations');
    expect(componentSrc('CanonCanvas')).toContain('project.timeline');
    // 우레일 — 분야별 데이터 검토, 4단계 전까지는 빈 상태와 트리거만
    expect(componentSrc('DataReviewRail')).toContain('function DataReviewRail');
    expect(componentSrc('DataReviewRail')).toContain('아직 검토 없음');
    expect(componentSrc('DataReviewRail')).toContain('데이터 검토 실행');
    // 옛 바이블 트랙의 기능 보존 — 승인 대기·캐논 원장은 데이터 모드에서 그대로 도달한다
    expect(componentSrc('MemoryBankStudio')).toContain('function MemoryBankStudio');
    expect(desk).toContain('작품 데이터');
    expect(desk).toContain('승인 대기');
    expect(componentSrc('DataLeftRail')).toContain('캐논 원장');
    expect(desk).not.toContain('function BibleIndexCard');
    expect(css).toContain('.sx-canon-canvas');
    expect(css).toContain('.sx-desk .ex-canon-nav');
    expect(css).toContain('.sx-desk .ex-char-graph-svg');
    expect(css).toContain('.sx-desk .ex-canon-card-grid');
    expect(css).toContain('.sx-desk .ex-timeline-tick');
    expect(css).toContain('.sx-data-review-rail');
    expect(css).toContain('.sx-desk .ex-bible-rules');
  });

  it('Phase 2c — DataView 에 board(정제 보드) 종류를 추가한다', () => {
    expect(canonDataView).toContain("kind: 'board'");
    // board 는 category/section 없는 단독 종류
    expect(canonDataView).toMatch(/\|\s*\{\s*kind:\s*'board'\s*\}/);
  });

  it('Phase 2c — isBibleMode 일 때 FloatingDataWorkspace 를 early-return 으로 렌더한다', () => {
    expect(desk).toContain('<FloatingDataWorkspace');
    expect(desk).toContain('if (isBibleMode)');
    expect(desk).toContain("setDataView({ kind: 'board' })");
    expect(desk).toContain('centerSlot=');
  });

  it('Phase 2c — floating 데이터 작업실 전용 CSS 가 있다', () => {
    expect(css).toContain('.fc-data');
    expect(css).toContain('.fc-data-board');
    expect(css).toContain('.fc-data-review-row');
    expect(css).toContain('.fc-data-crumb-board');
  });
});

describe('회차 생성 동작 회귀 — 의도 메모 오염·잠금 동기화 (P2·P3)', () => {
  // P3 — 모든 작품의 기본 회차 의도가 장르 데모 문구면, 사용자가 의도 메모를 비워도
  // produceEpisode 가 그 문구를 LLM intent(freewrite)로 넘겨 다음 회차를 오염시킨다.
  // 실증(2026-06-07 #2 로판) — 2화가 "용사와 외계인이 처음 충돌…"로 시작한 사고.
  it('기본 회차 의도에 장르 데모 문구("용사와 외계인")를 박지 않는다 (P3)', () => {
    expect(desk).not.toContain('용사와 외계인이 처음 충돌하는 장면으로 시작한다');
    const match = desk.match(/const defaultEpisodeIntent = (''|""|'[^']*'|"[^"]*")/);
    expect(match).not.toBeNull();
    // 기본값은 빈 문자열 — 비우면 캐논 digest 만으로 다음 회차를 생성한다.
    expect(match?.[1]).toBe("''");
  });

  // P2 — 출간에서 회차를 잠근 직후 편집으로 돌아가면 latestChapter 가 stale 해서
  // mainActionRun 이 여전히 reviewDraft 였다(새로고침해야 produceEpisode 로 전환).
  // onConfirmChapterLock 이 setLatestChapter 도 동기화해야 같은 세션에서 다음 회차 생성이 된다.
  it('회차 잠금(onConfirmChapterLock) 시 latestChapter 를 동기화한다 (P2)', () => {
    const start = desk.indexOf('onConfirmChapterLock');
    expect(start).toBeGreaterThan(-1);
    const block = desk.slice(start, start + 700);
    expect(block).toContain('setLatestChapter');
  });
});
