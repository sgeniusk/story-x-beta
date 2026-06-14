// 메모리 뱅크 스튜디오 컴포넌트
import type { BibleSection } from '../lib/canonDataView';
import type { CanonChangeEntry, CanonRefactorPlan } from '../lib/canonRefactor';
import { type MemoryApprovalDecision, type MemoryApprovalQueue, type StoryMemoryBank } from '../lib/memoryBank';
import { describeCreativeWeight } from '../lib/storyEngine';
import type { ContractAmendmentPatch, CreativeWeight, SeriesProject } from '../lib/storyEngine';
import { BibleWorkbenchHeader, type BibleSectionState } from './BibleWorkbenchHeader';
import { CanonRefactorPanel } from './CanonRefactorPanel';
import { CharterAmendCard } from './CharterAmendCard';

type ApprovalDecision = MemoryApprovalDecision;

export const bibleSections: Array<{ id: BibleSection; label: string; summary: string }> = [
  { id: 'overview', label: '개요', summary: '프로젝트 핵심과 동기화 상태' },
  { id: 'characters', label: '캐릭터', summary: '욕망, 상처, 현재 상태' },
  { id: 'world', label: '세계관', summary: '규칙, 비용, 금지 충돌' },
  { id: 'canon', label: '캐논/타임라인', summary: '승인된 사실과 회차 흐름' },
  { id: 'voice', label: '문체/감각', summary: '문체, 시각, 오디오 앵커' },
  { id: 'approval', label: '승인 대기', summary: '새 기억 후보와 영향 범위' }
];
const approvalDecisionLabels: Record<ApprovalDecision, string> = {
  approved: '승인됨',
  revision: '수정 요청됨',
  hold: '보류됨'
};

export function MemoryBankStudio({
  project,
  bank,
  activeSection,
  onUpdateCharacter,
  onUpdateWorldRule,
  onUpdateCanon,
  onUpdateProject,
  onUpdateCreativeWeight,
  approvalQueue,
  approvalDecisions,
  onSetApprovalDecision,
  onUpdateApprovalStatement,
  onSyncApprovedMemory,
  onRequestReview,
  canonChanges,
  canonRefactorPlan,
  onClearCanonChanges,
  onRevertCanonChange,
  onAmendCharter
}: {
  project: SeriesProject;
  bank: StoryMemoryBank;
  activeSection: BibleSection;
  onUpdateCharacter: (characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) => void;
  onUpdateWorldRule: (ruleId: string, value: string) => void;
  onUpdateCanon: (canonId: string, value: string) => void;
  onUpdateProject: (
    field: 'title' | 'logline' | 'audiencePromise' | 'deepQuestion' | 'formIntent' | 'tone',
    value: string
  ) => void;
  onUpdateCreativeWeight: (weight: CreativeWeight) => void;
  approvalQueue: MemoryApprovalQueue;
  approvalDecisions: Record<string, ApprovalDecision>;
  onSetApprovalDecision: (candidateId: string, decision: ApprovalDecision) => void;
  onUpdateApprovalStatement: (candidateId: string, value: string) => void;
  onSyncApprovedMemory: () => void;
  onRequestReview: () => void;
  canonChanges: CanonChangeEntry[];
  canonRefactorPlan: CanonRefactorPlan;
  onClearCanonChanges: () => void;
  onRevertCanonChange?: (change: CanonChangeEntry) => void;
  onAmendCharter?: (patch: ContractAmendmentPatch, reason: string) => void;
}) {
  const sectionState = buildBibleSectionState({
    activeSection,
    project,
    bank,
    approvalQueue,
    canonChanges,
    canonRefactorPlan
  });
  const syncableMemoryCount = approvalQueue.items.filter(
    (item) => item.source === 'ai-review' && item.canSync
  ).length;

  return (
    <section className="sx-bible-studio" aria-label="작품 바이블">
      <header className="sx-bible-hero">
        <div>
          <p className="sx-eyebrow">작품 바이블</p>
          <h2>{project.title}</h2>
          <p>
            캐릭터와 배경은 생성 폼이 아니라 계속 자라는 기억 카드입니다. 여기서 직접 고친 내용만 다음 원고와
            에이전트 검토의 기준이 됩니다.
          </p>
        </div>
      </header>

      <div className={`sx-bible-workbench is-${activeSection}`}>
        <BibleWorkbenchHeader sectionState={sectionState} onRequestReview={onRequestReview} />

        {activeSection === 'overview' && (
        <div className="sx-bible-grid">
          <article className="sx-bible-card is-wide sx-memory-packet-card">
            <span>Story Contract</span>
            <h3>{project.title}</h3>
            <label>
              <small>로그라인</small>
              <textarea value={project.logline} onChange={(event) => onUpdateProject('logline', event.target.value)} rows={2} />
            </label>
            <label>
              <small>표면 약속 — 독자에게 거는 플롯·사건 차원의 약속</small>
              <textarea
                value={project.audiencePromise}
                onChange={(event) => onUpdateProject('audiencePromise', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>심층 질문 — 표면 사건 아래에서 작품이 진짜 묻는 것</small>
              <textarea
                value={project.deepQuestion}
                onChange={(event) => onUpdateProject('deepQuestion', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>형식·구조 — 시점·시제·구성이 주제를 어떻게 수행하는가</small>
              <textarea
                value={project.formIntent}
                onChange={(event) => onUpdateProject('formIntent', event.target.value)}
                rows={2}
              />
            </label>
            <div className="sx-creative-weight">
              <small>작품 무게중심</small>
              <div className="sx-creative-weight-options" role="group" aria-label="작품 무게중심">
                {(['popular', 'balanced', 'literary'] as CreativeWeight[]).map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    className={project.creativeWeight === weight ? 'is-active' : ''}
                    onClick={() => onUpdateCreativeWeight(weight)}
                  >
                    {weight === 'popular' ? '대중성' : weight === 'literary' ? '작품성' : '균형'}
                  </button>
                ))}
              </div>
              <p>{describeCreativeWeight(project.creativeWeight)}</p>
            </div>
          </article>
          {project.storyContract && onAmendCharter && (
            <CharterAmendCard contract={project.storyContract} onAmend={onAmendCharter} />
          )}
          <article className="sx-bible-card">
            <span>Context Packet</span>
            <h3>역할별 기억 패킷</h3>
            <p>에이전트는 원문 전체가 아니라 자기 역할에 필요한 기억만 읽습니다.</p>
            <div className="sx-bible-memory-tags">
              <em>showrunner</em>
              <em>characters</em>
              <em>world</em>
              <em>voice</em>
            </div>
          </article>
          <article className="sx-bible-card">
            <span>Storage Policy</span>
            <h3>{bank.files.length} files</h3>
            <p>{bank.syncableFiles.length}개는 동기화 가능, private/raw-sources는 기본 컨텍스트에서 제외됩니다.</p>
          </article>
        </div>
        )}

        {activeSection === 'characters' && (
        <div className="sx-bible-grid">
          {project.characters.map((character) => (
          <article className="sx-bible-card" key={character.id}>
            <span>캐릭터</span>
            <h3>{character.name}</h3>
            <p>{character.role}</p>
            <label>
              <small>욕망</small>
              <textarea
                value={character.desire}
                onChange={(event) => onUpdateCharacter(character.id, 'desire', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>상처</small>
              <textarea
                value={character.wound}
                onChange={(event) => onUpdateCharacter(character.id, 'wound', event.target.value)}
                rows={2}
              />
            </label>
            <label>
              <small>현재 상태</small>
              <textarea
                value={character.currentState}
                onChange={(event) => onUpdateCharacter(character.id, 'currentState', event.target.value)}
                rows={3}
              />
            </label>
            <div className="sx-bible-memory-tags">
              {character.canonAnchors.slice(0, 3).map((anchor) => (
                <em key={anchor}>{anchor}</em>
              ))}
            </div>
          </article>
          ))}
        </div>
        )}

        {activeSection === 'world' && (
        <div className="sx-bible-grid">
          {project.worldRules.map((rule) => (
          <article className="sx-bible-card is-world" key={rule.id}>
            <span>배경 / 세계관</span>
            <h3>{rule.title}</h3>
            <label>
              <small>규칙과 비용</small>
              <textarea value={rule.rule} onChange={(event) => onUpdateWorldRule(rule.id, event.target.value)} rows={5} />
            </label>
            <div className="sx-bible-memory-tags">
              {rule.forbiddenContradictions.slice(0, 2).map((contradiction) => (
                <em key={contradiction.claim}>{contradiction.claim}</em>
              ))}
            </div>
          </article>
          ))}
        </div>
        )}

        {activeSection === 'canon' && (
          <>
            <div className="sx-bible-grid sx-canon-board">
              <article className="sx-bible-card is-wide">
                <span>Canon Ledger</span>
                <h3>승인된 사실</h3>
                <div className="sx-canon-editor-list">
                  {project.canonFacts.map((fact) => (
                    <label key={fact.id}>
                      <small>EP {fact.episode} · {fact.owner}</small>
                      <textarea value={fact.statement} onChange={(event) => onUpdateCanon(fact.id, event.target.value)} rows={2} />
                    </label>
                  ))}
                </div>
              </article>
              <article className="sx-bible-card is-wide">
                <span>Timeline</span>
                <h3>회차 흐름</h3>
                <div className="sx-timeline-list">
                  {project.chapters.length === 0 ? (
                    <p>첫 초안을 생성하면 회차 타임라인이 이곳에 쌓입니다.</p>
                  ) : (
                    project.chapters.map((chapter) => (
                      <div key={chapter.id}>
                        <strong>{chapter.episode}화 · {chapter.title}</strong>
                        <span>{chapter.hook}</span>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
            <CanonRefactorPanel
              changes={canonChanges}
              plan={canonRefactorPlan}
              onClearChanges={onClearCanonChanges}
              onRevert={onRevertCanonChange}
            />
          </>
        )}

        {activeSection === 'voice' && (
        <div className="sx-bible-grid">
          <article className="sx-bible-card is-wide">
          <span>문체 바이블</span>
          <h3>{project.tone}</h3>
          <label>
            <small>톤</small>
            <textarea value={project.tone} onChange={(event) => onUpdateProject('tone', event.target.value)} rows={2} />
          </label>
          <label>
            <small>표면 약속 — 개요의 Story Contract와 같이 반영됩니다</small>
            <textarea
              value={project.audiencePromise}
              onChange={(event) => onUpdateProject('audiencePromise', event.target.value)}
              rows={3}
            />
          </label>
          <div className="sx-bible-memory-tags">
            {project.characters.flatMap((character) => character.voiceRules).slice(0, 5).map((rule) => (
              <em key={rule}>{rule}</em>
            ))}
          </div>
          </article>
          <article className="sx-bible-card">
            <span>시각 바이블</span>
            <h3>다빈치 프롬프트 앵커</h3>
            <p>캐릭터 외형, 색, 조명, 렌즈 규칙은 매체 전환 시 visual memory packet으로 전달됩니다.</p>
          </article>
          <article className="sx-bible-card">
            <span>오디오 바이블</span>
            <h3>낭독 리듬</h3>
            <p>톤, 쉼, 반복 후크, 발음 주의 단어는 오디오북/영상 보드의 기준으로 쓰입니다.</p>
          </article>
        </div>
        )}

        {activeSection === 'approval' && (
        <div className="sx-bible-grid sx-approval-queue">
          <article className="sx-bible-card sx-bible-approval is-wide">
            <span>승인 대기</span>
            <h3>메모리 승인 큐</h3>
            <p>회차에서 생긴 캐논 후보와 AI 검토 memoryCandidates를 한곳에서 편집한 뒤 승인/수정/보류합니다.</p>
            <div className="sx-approval-summary" aria-label="메모리 승인 요약">
              <strong>{approvalQueue.summary.total}</strong>
              <span>전체 후보</span>
              <strong>{approvalQueue.summary.approved}</strong>
              <span>승인됨</span>
              <strong>{approvalQueue.summary.canSync}</strong>
              <span>동기화 가능</span>
            </div>
            <div className="sx-approval-sync">
              <button
                type="button"
                className="sx-primary-button"
                onClick={onSyncApprovedMemory}
                disabled={syncableMemoryCount === 0}
              >
                승인한 AI 검토 후보 {syncableMemoryCount > 0 ? `${syncableMemoryCount}개 ` : ''}작품 캐논에 반영
              </button>
              <small>
                반영하면 승인한 후보가 작품 캐논에 추가되고, 다음 회차 생성이 이 사실을 지킵니다. 반영 후 목록에서
                사라집니다.
              </small>
            </div>
          {approvalQueue.items.length > 0 ? (
            <div className="sx-approval-list">
              {approvalQueue.items.map((item) => {
                const decision = approvalDecisions[item.id];

                return (
                  <article key={item.id} className={decision ? `is-${decision}` : undefined}>
                    <span>
                      <b className="sx-approval-source-pill">{item.source === 'ai-review' ? 'AI 검토' : '회차 캐논'}</b>
                      {item.owner} · {item.status}
                    </span>
                    <label>
                      <small>승인 전 편집</small>
                      <textarea
                        value={item.editableStatement}
                        onChange={(event) => onUpdateApprovalStatement(item.id, event.target.value)}
                        rows={3}
                      />
                    </label>
                    <p>{item.rationale}</p>
                    <small>{item.targetPath}</small>
                    <div className="sx-approval-impact-tags" aria-label="영향 범위">
                      {item.impactAreas.map((area) => (
                        <em key={`${item.id}-${area}`}>{area}</em>
                      ))}
                    </div>
                    {decision && <strong className="sx-approval-status">{approvalDecisionLabels[decision]}</strong>}
                    <div>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'approved')}>
                        승인
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'revision')}>
                        수정 요청
                      </button>
                      <button type="button" onClick={() => onSetApprovalDecision(item.id, 'hold')}>
                        보류
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>아직 승인 대기 후보가 없습니다. 초안 생성 또는 검토를 실행하면 이곳에 후보가 쌓입니다.</p>
          )}
          </article>
          <article className="sx-bible-card is-wide">
            <span>Impact Preview</span>
            <h3>영향 범위</h3>
            <p>승인된 항목만 다음 동기화 후보가 됩니다. 수정 요청과 보류는 원문을 덮어쓰지 않고 검토 기록으로 남깁니다.</p>
            <div className="sx-bible-memory-tags">
              <em>characters</em>
              <em>world</em>
              <em>canon</em>
              <em>voice</em>
              <em>visual</em>
              <em>audio</em>
            </div>
          </article>
        </div>
        )}
      </div>
    </section>
  );
}

function buildBibleSectionState({
  activeSection,
  project,
  bank,
  approvalQueue,
  canonChanges,
  canonRefactorPlan
}: {
  activeSection: BibleSection;
  project: SeriesProject;
  bank: StoryMemoryBank;
  approvalQueue: MemoryApprovalQueue;
  canonChanges: CanonChangeEntry[];
  canonRefactorPlan: CanonRefactorPlan;
}): BibleSectionState {
  const section = bibleSections.find((item) => item.id === activeSection) ?? bibleSections[0];
  const changedKindsBySection: Record<BibleSection, CanonChangeEntry['kind'][]> = {
    overview: ['story-core'],
    characters: ['character'],
    world: ['world'],
    canon: ['canon'],
    voice: ['voice', 'visual', 'audio'],
    approval: ['canon', 'story-core', 'character', 'world', 'voice', 'visual', 'audio']
  };
  const defaults: Record<BibleSection, Pick<BibleSectionState, 'directive' | 'primaryMetric' | 'syncTargets' | 'reviewAgents'>> = {
    overview: {
      directive: '작품의 한 문장 약속과 저장 정책을 고정합니다. 이 값이 바뀌면 이후 원고와 출간 패키지의 기준도 함께 움직입니다.',
      primaryMetric: `${bank.syncableFiles.length}개 동기화 기억`,
      syncTargets: ['story-core', 'manifest', 'context-packet'],
      reviewAgents: [
        { label: '쇼러너', focus: '독자 약속과 장기 전개 기준 확인' },
        { label: '연속성 감수자', focus: '기존 캐논과 저장 정책 충돌 확인' }
      ]
    },
    characters: {
      directive: '캐릭터의 욕망, 상처, 현재 상태를 직접 고칩니다. 인물 변경은 다음 회차 행동과 대사 선택에 바로 영향을 줍니다.',
      primaryMetric: `${project.characters.length}명 관리 중`,
      syncTargets: ['characters', 'canon-anchors', 'relationship-state'],
      reviewAgents: [
        { label: '캐릭터 큐레이터', focus: '욕망, 상처, 말투, 관계 상태 변화 검토' },
        { label: '연속성 감수자', focus: '이전 회차 행동과 승인된 캐논 충돌 확인' },
        { label: '쇼러너', focus: '앞으로의 회차 약속 재정렬' }
      ]
    },
    world: {
      directive: '세계 규칙과 비용을 편집합니다. 세계관 변경은 사건 해결 난이도와 장면 설득력을 함께 바꿉니다.',
      primaryMetric: `${project.worldRules.length}개 규칙`,
      syncTargets: ['world', 'forbidden-contradictions', 'visual-context'],
      reviewAgents: [
        { label: '배경 설계자', focus: '세계 규칙, 비용, 예외가 싸지지 않았는지 확인' },
        { label: '연속성 감수자', focus: '타임라인과 기존 사건 충돌 확인' },
        { label: '장르 스타일리스트', focus: '장르적 압력과 재미 유지 확인' }
      ]
    },
    canon: {
      directive: '승인된 사실과 회차 흐름을 고칩니다. 이미 독자에게 보여준 사실은 reveal, revision, blocked 중 하나로 판정해야 합니다.',
      primaryMetric: `${project.canonFacts.length}개 승인 사실`,
      syncTargets: ['canon', 'timeline', 'release-impact'],
      reviewAgents: [
        { label: '연속성 감수자', focus: '승인된 사실의 대체/폐기/반전 여부 판정' },
        { label: '쇼러너', focus: '복선 회수나 반전으로 쓸 수 있는지 판단' }
      ]
    },
    voice: {
      directive: '문체, 감각, 시각/오디오 앵커를 고정합니다. 매체가 바뀌어도 같은 작품처럼 느껴지는 기준을 만듭니다.',
      primaryMetric: `${project.characters.flatMap((character) => character.voiceRules).length}개 문체 앵커`,
      syncTargets: ['voice', 'visual', 'audio'],
      reviewAgents: [
        { label: '문체 큐레이터', focus: '문체 바이블과 한국어 자연스러움 재검토' },
        { label: '다빈치', focus: '시각 프롬프트와 visual DNA 영향 범위 확인' },
        { label: '오디오 연출가', focus: '낭독 톤, 쉼, 청취 리듬 영향 확인' }
      ]
    },
    approval: {
      directive: 'AI 검토나 새 회차에서 나온 기억 후보를 승인 전 편집합니다. 사용자가 승인하기 전에는 canon에 반영하지 않습니다.',
      primaryMetric: `${approvalQueue.summary.total}개 후보`,
      syncTargets: ['approval-queue', 'memory-candidates', 'change-log'],
      reviewAgents: [
        { label: '연속성 감수자', focus: '승인 가능한 사실과 보류할 후보 분리' },
        { label: '문제 큐레이터', focus: '사용자 직접 편집 문장을 문체와 우선 증거로 확인' },
        { label: '인사이트 분석가', focus: '반복 실패와 개선 포인트 기록' }
      ]
    }
  };
  const sectionChanges = canonChanges.filter((change) => changedKindsBySection[activeSection].includes(change.kind));
  const reviewAgents =
    sectionChanges.length > 0 && canonRefactorPlan.reviewOrder.length > 0
      ? canonRefactorPlan.reviewOrder.map((step) => ({ label: step.label, focus: step.focus }))
      : defaults[activeSection].reviewAgents;
  const pendingCount = approvalQueue.items.filter((item) => item.status !== 'approved').length;

  return {
    id: activeSection,
    label: section.label,
    summary: section.summary,
    directive: defaults[activeSection].directive,
    primaryMetric: defaults[activeSection].primaryMetric,
    impactLabel: sectionChanges.length > 0 ? `${sectionChanges.length}개 변경 로그` : activeSection === 'approval' ? `${pendingCount}개 승인 대기` : '대기 없음',
    impactScope:
      canonRefactorPlan.affectedChapters.length > 0
        ? `${canonRefactorPlan.affectedChapters.length}개 회차 영향 가능`
        : '아직 특정 회차 영향은 없습니다.',
    syncTargets: defaults[activeSection].syncTargets,
    reviewAgents
  };
}
