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
    expect(css).toContain('@media (max-width: 1040px)');
    expect(css).toContain('.sx-creative-stage');
    expect(css).toContain('.sx-writing-surface');
    expect(css).toContain('.sx-canvas-surface');
    expect(css).toContain('.sx-storyboard-surface');
    expect(css).toContain('grid-template-rows: auto auto minmax(620px, 1fr)');
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

  it('keeps the focused editor readable and avoids floating duplicate navigation', () => {
    expect(desk).toContain('sx-topbar-actions');
    expect(desk).toContain('sx-editor-links');
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
    expect(desk).toContain('aria-label="주요 내용 입력"');
    expect(desk).toContain('aria-label="원고 편집기"');
    expect(desk).toContain('const [isFocusMode, setIsFocusMode]');
    expect(desk).toContain('className="sx-expand-editor-button"');
    expect(desk).toContain('편집기 확대');
    expect(desk).toContain("{latestChapter ? '흐름 검증' : '초안 생성'}");
    expect(desk).toContain('수정됨');
    expect(desk).toContain('ChapterNavigator');
    expect(desk).toContain('ChapterTreeCard');
    expect(desk).toContain('작품 목차');
    expect(desk).toContain('검토');
    expect(css).toContain('.sx-manuscript-editor');
    expect(css).toContain('.sx-desk.is-focus-mode .sx-project-rail');
    expect(css).toContain('.sx-expand-editor-button');
    expect(css).toContain('.sx-manuscript-editor.is-edited');
    expect(css).toContain('.sx-episode-tabs');
    expect(css).toContain('.sx-chapter-tree');
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
    expect(desk).toContain('승인됨');
    expect(desk).toContain('수정 요청됨');
    expect(desk).toContain('보류됨');
    expect(css).toContain('.sx-track-tabs');
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
  });

  it('adds a publishing studio for release snapshots and change-log review', () => {
    expect(desk).toContain('buildPublishingPlan');
    expect(desk).toContain('const publishingPlan = useMemo');
    expect(desk).toContain('PublishingStudio');
    expect(desk).toContain('PublishingIndexCard');
    expect(desk).toContain('onBackToEditor');
    expect(desk).toContain('출간 스냅샷');
    expect(desk).toContain('변경 로그 검토');
    expect(desk).toContain('첫 300자');
    expect(desk).toContain('게시 위치');
    expect(desk).toContain('만화는 스토리보드 패키지');
    expect(css).toContain('.sx-publishing-studio');
    expect(css).toContain('.sx-release-checklist');
    expect(css).toContain('.sx-platform-proof-card');
  });

  it('turns the memory bank into a left-indexed central editing workspace', () => {
    expect(desk).toContain('className={`sx-bible-workbench is-${activeSection}`}');
    expect(desk).toContain('BibleWorkbenchHeader');
    expect(desk).toContain('buildBibleSectionState');
    expect(desk).toContain('sectionState.reviewAgents.map');
    expect(desk).toContain('변경 영향');
    expect(desk).toContain('검토 순서');
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
});
