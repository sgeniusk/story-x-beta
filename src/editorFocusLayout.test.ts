import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const desk = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

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
    expect(css).toContain('--sx-paper: var(--framer-canvas)');
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
    expect(desk).toContain('className="sx-save-chip"');
    expect(desk).toContain('function StoryXStatusBar');
    expect(desk).toContain('<StoryXStatusBar');
    expect(desk).toContain('alphaReport={alphaReport}');
    expect(desk).not.toContain('AI 작가진과 함께, 흔들림 없는 세계관을 만듭니다.');
    expect(desk).not.toContain('<AlphaSelfCheckCard alphaReport={alphaReport} />');
    expect(css).toContain('.sx-statusbar');
    expect(css).toContain('height: 32px');
    expect(css).toContain('--sx-ink-2: rgba(32, 32, 30, 0.74)');
    expect(css).toContain('.sx-writing-surface .sx-writing-page h2');
    expect(css).toContain('color: #f7f3ea');
    expect(css).toContain('.sx-writing-surface .sx-outline-strip p');
    expect(css).toContain('color: #25211d');
  });

  it('supports user editing, review runs, and a chapter tree in the editor', () => {
    expect(desk).toContain('const [draftPrompt, setDraftPrompt]');
    expect(desk).toContain('const [editorText, setEditorText]');
    expect(desk).toContain('const [editedSinceReview, setEditedSinceReview]');
    expect(desk).toContain('function reviewDraft');
    expect(desk).toContain('바이블 열기');
    // P1 — '이번 회차 의도' 입력은 좌측 레일의 접이식 카드(ex-intent-card)로 이동했다
    expect(desk).toContain('className="ex-intent-card"');
    expect(desk).toContain('className="ex-intent-textarea"');
    expect(desk).toContain('aria-label="원고 편집기"');
    expect(desk).toContain('const [isFocusMode, setIsFocusMode]');
    expect(desk).toContain('className="sx-expand-editor-button"');
    expect(desk).toContain('편집기 확대');
    expect(desk).toContain('const mainActionLabel = !latestChapter');
    expect(desk).toContain('? actionLabels.draft');
    expect(desk).toContain(': actionLabels.review');
    expect(desk).toContain('수정됨');
    // P1 — 회차 이동은 툴스트립의 회차 탭으로 처리한다
    expect(desk).toContain('aria-label="회차 이동"');
    expect(desk).toContain('ChapterTreeCard');
    expect(desk).toContain('작품 목차');
    expect(desk).toContain('검토');
    expect(css).toContain('.sx-manuscript-editor');
    expect(css).toContain('position: sticky');
    expect(css).toContain('.sx-desk.is-focus-mode .sx-project-rail');
    expect(css).toContain('.sx-expand-editor-button');
    expect(css).toContain('.sx-manuscript-editor.is-edited');
    expect(css).toContain('.sx-desk .ex-chapter-tab');
    expect(css).toContain('.sx-chapter-tree');
  });

  it('P1 — keeps the manuscript as the protagonist with a thin toolstrip above it', () => {
    expect(desk).toContain("className={`sx-workbench ${isPublishingMode ? 'is-publishing' : activeTrack === 'bible' ? 'is-bible' : 'is-draft'}");
    expect(css).toContain('.sx-workbench.is-draft');
    // 편집 트랙: 툴스트립 1행 + 원고가 나머지 공간을 채우는 1행
    expect(css).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(css).toContain('.sx-workbench.is-draft .sx-creative-stage');
    // 얇은 툴스트립(~52px): 회차 탭 + 기본 액션 + 집중 모드 버튼
    expect(desk).toContain('className="ex-toolstrip"');
    expect(desk).toContain('className="ex-chapter-tabs"');
    expect(desk).toContain('className="ex-focus-btn"');
    expect(css).toContain('.sx-desk .ex-toolstrip');
    expect(css).toContain('min-height: 52px;');
    expect(css).toContain('.sx-desk .ex-chapter-tab');
    expect(css).toContain('.sx-desk .ex-focus-btn');
  });

  it('adds a command palette for quick navigation and editor actions', () => {
    expect(desk).toContain('const [isCommandPaletteOpen, setIsCommandPaletteOpen]');
    expect(desk).toContain('const [commandQuery, setCommandQuery]');
    expect(desk).toContain('const commandItems = useMemo<DeskCommand[]>');
    expect(desk).toContain('function CommandPalette');
    // P2 — 팔레트는 ⌘K 단축키로 연다. 상단 클러터를 줄이려 시각 버튼은 제거했다
    expect(desk).toContain("event.key.toLowerCase() === 'k'");
    expect(desk).toContain('setIsCommandPaletteOpen((current) => !current)');
    expect(desk).toContain('명령 또는 화면 검색');
    expect(desk).toContain('승인 대기 열기');
    expect(desk).toContain('집중 모드 토글');
    // 매체 변경도 팔레트 명령으로 유지된다
    expect(desk).toContain("id: 'open-media-change'");
    expect(css).toContain('.sx-command-palette-backdrop');
    expect(css).toContain('.sx-command-palette');
    expect(css).toContain('.sx-command-list');
  });

  it('P2 — declutters the editor topbar to brand plus two right-side actions', () => {
    // 상단 우측은 저장 상태 칩과 출간 버튼만 남긴다
    expect(desk).toContain('className="sx-topbar-actions"');
    expect(desk).toContain('className="sx-save-chip"');
    expect(desk).toContain('className="sx-publish-button"');
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
    expect(desk).toContain("type BibleSection = 'overview' | 'characters' | 'world' | 'canon' | 'voice' | 'approval'");
    expect(desk).toContain('const [activeTrack, setActiveTrack]');
    expect(desk).toContain('const [isPublishingMode, setIsPublishingMode]');
    expect(desk).toContain('const [activeBibleSection, setActiveBibleSection]');
    expect(desk).toContain('const [approvalDecisions, setApprovalDecisions]');
    expect(desk).toContain('const [isMediaPanelOpen, setIsMediaPanelOpen]');
    expect(desk).toContain('원고 편집');
    expect(desk).toContain('작품 바이블');
    expect(desk).toContain('출간 준비');
    expect(desk).toContain('className="sx-publish-button"');
    expect(desk).toContain('매체 변경');
    expect(desk).toContain('className="sx-track-tabs"');
    expect(desk).toContain('className="sx-bible-alert-badge"');
    expect(desk).toContain('className="sx-media-change-panel"');
    expect(desk).toContain('function MemoryBankStudio');
    expect(desk).toContain('function updateCharacterMemory');
    expect(desk).toContain('function updateWorldMemory');
    expect(desk).toContain('function updateCanonMemory');
    expect(desk).toContain('function setApprovalDecision');
    expect(desk).toContain('activeSection={activeBibleSection}');
    expect(desk).toContain('onSelectSection={setActiveBibleSection}');
    expect(css).toContain('flex-wrap: wrap');
    expect(desk).toContain('승인됨');
    expect(desk).toContain('수정 요청됨');
    expect(desk).toContain('보류됨');
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
    expect(desk).toContain('function StoryXStatusBar');
    expect(desk).toContain('alphaReport={alphaReport}');
    expect(desk).toContain('알파 셀프체크');
    expect(desk).toContain('report.nextActions[0]');
    expect(desk).not.toContain('<CurrentBlueprintCard');
    expect(desk).not.toContain('<MemoryBankCard bank={memoryBank} />');
    expect(desk).not.toContain('<AiCliHarnessCard');
    expect(desk).not.toContain('<EvaluatorQualityCard workflow={evaluatorWorkflow} />');
    expect(desk).not.toContain('<ContinuitySummaryCard');
    expect(desk).toContain("const isBibleMode = activeTrack === 'bible' && !isPublishingMode");
    expect(desk).toContain('function OpenThreadsCard');
    expect(desk).toContain('<OpenThreadsCard threads={project.openThreads} />');
    expect(desk).toContain('function BibleAssistantSidebar');
    expect(desk).toContain('조수진');
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
    expect(desk).toContain('className={`sx-bible-workbench is-${activeSection}`}');
    expect(desk).toContain('BibleWorkbenchHeader');
    expect(desk).toContain('buildBibleSectionState');
    expect(desk).toContain('sectionState.reviewAgents.map');
    expect(desk).toContain('변경 영향');
    expect(desk).toContain('검토 순서');
    expect(desk).toContain('function requestBibleReview');
    expect(desk).toContain('onRequestReview={requestBibleReview}');
    expect(desk).toContain('변경 검토 요청');
    expect(desk).toContain('className="sx-bible-review-request"');
    expect(desk).toContain("activeSection === 'characters'");
    expect(desk).toContain("activeSection === 'world'");
    expect(desk).toContain("activeSection === 'canon'");
    expect(desk).toContain("activeSection === 'voice'");
    expect(desk).toContain("activeSection === 'approval'");
    expect(desk).toContain('onUpdateCharacter(character.id');
    expect(desk).toContain('onUpdateWorldRule(rule.id');
    expect(desk).toContain('onUpdateCanon(fact.id');
    expect(desk).toContain('CanonRefactorPanel');
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
    expect(desk).toContain('CanonRefactorPanel');
    expect(desk).toContain('변경 로그');
    expect(desk).toContain('영향 회차');
    expect(desk).toContain('에이전트 검토 순서');
    expect(desk).toContain('캐논 리팩터');
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
    expect(desk).toContain('approvalQueue.items.map');
    expect(desk).toContain('value={item.editableStatement}');
    expect(desk).toContain('승인 대기함 열기');
    expect(desk).toContain('동기화 가능');
    expect(css).toContain('.sx-approval-summary');
    expect(css).toContain('.sx-approval-source-pill');
    expect(css).toContain('.sx-approval-impact-tags');
  });

  it('surfaces the one-project vertical slice inside the editor approval flow', () => {
    expect(desk).toContain('buildOneProjectVerticalSlice');
    expect(desk).toContain('const verticalSlice = useMemo');
    expect(desk).toContain('...verticalSlice.memoryCandidates');
    expect(desk).toContain('VerticalSliceProofPanel');
    expect(desk).toContain('verticalSlice={verticalSlice}');
    expect(desk).toContain('onOpenApprovalQueue');
    expect(desk).toContain('승인 대기함 열기');
    expect(desk).toContain('웹소설 1화');
    expect(desk).toContain('인스타툰 4컷');
    expect(desk).toContain('오디오북 30초');
    expect(css).toContain('.sx-vertical-slice-panel');
    expect(css).toContain('.sx-vertical-slice-artifacts');
    expect(css).toContain('.sx-vertical-slice-ledger');
  });
});
