import type { AiCliReviewResult } from './aiCliHarness';
import type { CanonRefactorPlan } from './canonRefactor';
import type { MemoryApprovalQueue, StoryMemoryBank } from './memoryBank';
import type { CreativeBlueprint } from './projectBlueprint';
import type { PublishingPlan } from './publishing';
import type { SeriesProject } from './storyEngine';

export type AlphaGateStatus = 'ready' | 'needs-review' | 'blocked';

export interface AlphaReadinessGate {
  id: string;
  label: string;
  status: AlphaGateStatus;
  owner: string;
  detail: string;
  nextAction: string;
}

export interface AlphaReadinessReport {
  version: 'alpha-0.1';
  status: AlphaGateStatus;
  score: number;
  releaseScope: string;
  proofSummary: string;
  gates: AlphaReadinessGate[];
  nextActions: string[];
}

export interface BuildAlphaReadinessReportOptions {
  project: SeriesProject;
  blueprint: CreativeBlueprint;
  memoryBank: StoryMemoryBank;
  approvalQueue: MemoryApprovalQueue;
  canonRefactorPlan: CanonRefactorPlan;
  latestReviewResult: AiCliReviewResult | null;
  publishingPlan: PublishingPlan;
}

const gateScore: Record<AlphaGateStatus, number> = {
  ready: 100,
  'needs-review': 65,
  blocked: 25
};

export function buildAlphaReadinessReport({
  project,
  blueprint,
  memoryBank,
  approvalQueue,
  canonRefactorPlan,
  latestReviewResult,
  publishingPlan
}: BuildAlphaReadinessReportOptions): AlphaReadinessReport {
  const hasDraft = project.chapters.length > 0;
  const latestChapter = project.chapters[project.chapters.length - 1] ?? null;
  const hasReview = Boolean(latestReviewResult);
  const hasBlockedReview = latestReviewResult?.agentReports.some((report) => report.status === 'blocked') ?? false;
  const syncLeaksPrivateSource = memoryBank.syncableFiles.some((file) => file.path.includes('/private/'));
  const releaseChecklistNeedsReview = publishingPlan.checklist.some((item) => item.status === 'review');
  const alphaMediumIsPrimary = blueprint.medium === 'novel' || blueprint.medium === 'essay';

  const gates: AlphaReadinessGate[] = [
    {
      id: 'draft-artifact',
      label: '초안 산출물',
      status: hasDraft ? 'ready' : 'blocked',
      owner: '쇼러너',
      detail: hasDraft
        ? `${latestChapter?.episode ?? project.currentEpisode}화 원고가 작업대에 있습니다.`
        : '아직 검토할 초안 산출물이 없습니다.',
      nextAction: hasDraft ? '다음 검토 단계로 이동합니다.' : '초안을 먼저 생성한 뒤 흐름 검증을 실행합니다.'
    },
    {
      id: 'story-foundation',
      label: '스토리 기준',
      status:
        project.logline.trim() && project.audiencePromise.trim() && project.characters.length > 0 && project.worldRules.length > 0
          ? 'ready'
          : 'blocked',
      owner: '브랜드/온보딩',
      detail: `${project.characters.length}명 캐릭터, ${project.worldRules.length}개 세계 규칙, 독자 약속을 기준으로 시작합니다.`,
      nextAction: '로그라인, 독자 약속, 핵심 캐릭터와 세계 규칙을 먼저 채웁니다.'
    },
    {
      id: 'memory-bank',
      label: '메모리 뱅크',
      status: syncLeaksPrivateSource ? 'blocked' : memoryBank.syncableFiles.length > 0 ? 'ready' : 'needs-review',
      owner: '메모리뱅크 관리자',
      detail: syncLeaksPrivateSource
        ? 'private/raw-sources가 동기화 후보에 섞였습니다.'
        : `${memoryBank.syncableFiles.length}개 sync 파일과 역할별 기억 패킷을 준비했습니다.`,
      nextAction: syncLeaksPrivateSource
        ? 'private/raw-sources는 기본 컨텍스트에서 제거합니다.'
        : '역할별 기억 패킷이 필요한 섹션만 읽는지 다시 확인합니다.'
    },
    {
      id: 'review-loop',
      label: 'AI 검토 루프',
      status: !hasDraft ? 'blocked' : !hasReview ? 'needs-review' : hasBlockedReview ? 'blocked' : 'ready',
      owner: '품질 게이트',
      detail: !hasDraft
        ? '초안이 없어 검토를 시작할 수 없습니다.'
        : !hasReview
          ? '초안은 있지만 아직 흐름 검증 결과가 없습니다.'
          : `${latestReviewResult?.agentReports.length ?? 0}개 에이전트 검토가 reviews/pending 계약으로 정규화됐습니다.`,
      nextAction: !hasDraft
        ? '초안을 생성한 뒤 흐름 검증 버튼을 누릅니다.'
        : !hasReview
          ? '흐름 검증을 실행해 작가진 검토와 memoryCandidates를 만듭니다.'
          : hasBlockedReview
            ? 'blocked 판정을 먼저 수정하고 다시 검토합니다.'
            : '검토 결과를 승인 대기 큐로 넘깁니다.'
    },
    {
      id: 'approval-queue',
      label: '기억 승인',
      status: resolveApprovalQueueStatus(approvalQueue, hasDraft, hasReview),
      owner: '연속성 감수자',
      detail:
        approvalQueue.summary.total > 0
          ? `${approvalQueue.summary.total}개 후보 중 ${approvalQueue.summary.undecided}개가 승인 대기입니다.`
          : '아직 승인할 새 기억 후보가 없습니다.',
      nextAction:
        approvalQueue.summary.total === 0
          ? hasReview
            ? '검토 결과에서 저장할 기억 후보를 만들거나 다음 회차를 생성합니다.'
            : '흐름 검증을 실행해 승인 대기 후보를 만듭니다.'
          : approvalQueue.summary.undecided > 0
            ? '승인 대기 후보를 승인, 수정 요청, 보류 중 하나로 결정합니다.'
            : approvalQueue.summary.revision > 0
              ? '수정 요청 후보를 고친 뒤 다시 승인합니다.'
              : '승인된 후보만 다음 메모리 동기화에 반영합니다.'
    },
    {
      id: 'canon-refactor',
      label: '변경 영향',
      status: canonRefactorPlan.status === 'clear' ? 'ready' : canonRefactorPlan.status === 'blocked' ? 'blocked' : 'needs-review',
      owner: '캐논 리팩터',
      detail: canonRefactorPlan.summary,
      nextAction:
        canonRefactorPlan.status === 'clear'
          ? '새 변경 로그가 생기면 영향 회차를 다시 계산합니다.'
          : '변경 로그를 보고 reveal, revision, blocked 중 하나로 판정합니다.'
    },
    {
      id: 'publishing-package',
      label: '출간 패키지',
      status: !hasDraft ? 'blocked' : releaseChecklistNeedsReview ? 'needs-review' : 'ready',
      owner: '출간 매니저',
      detail: hasDraft
        ? `${publishingPlan.title}와 ${publishingPlan.packageItems.length}개 산출물 묶음을 준비했습니다.`
        : '출간 패키지는 초안 생성 뒤에만 잠글 수 있습니다.',
      nextAction: !hasDraft
        ? '초안을 생성한 뒤 출간 준비 화면에서 스냅샷을 만듭니다.'
        : releaseChecklistNeedsReview
          ? '출간 전 체크리스트의 review 항목을 확인합니다.'
          : '출간 스냅샷을 잠그고 외부 게시 전 마지막 검토를 실행합니다.'
    },
    {
      id: 'medium-scope',
      label: '매체 범위',
      status: alphaMediumIsPrimary ? 'ready' : 'needs-review',
      owner: '프로덕트 오케스트레이터',
      detail: alphaMediumIsPrimary
        ? `${blueprint.mediumLabel}/${blueprint.formatLabel}는 알파의 핵심 제작 범위입니다.`
        : `${blueprint.mediumLabel}/${blueprint.formatLabel}는 알파에서 설계와 스토리보드까지 우선 지원합니다.`,
      nextAction: alphaMediumIsPrimary
        ? '소설과 에세이는 원고, 바이블, 검토, 출간 준비까지 연결합니다.'
        : '만화와 오디오는 원고 기반 스토리보드/연출 설계까지 검증합니다.'
    }
  ];

  return {
    version: 'alpha-0.1',
    status: resolveReportStatus(gates),
    score: Math.round(gates.reduce((total, gate) => total + gateScore[gate.status], 0) / gates.length),
    releaseScope: '알파: 소설/에세이 원고 제작, 만화 스토리보드, 바이블/검토/출간 준비 루프',
    proofSummary: buildProofSummary(project, blueprint, latestReviewResult, approvalQueue),
    gates,
    nextActions: buildNextActions(gates)
  };
}

function resolveApprovalQueueStatus(
  approvalQueue: MemoryApprovalQueue,
  hasDraft: boolean,
  hasReview: boolean
): AlphaGateStatus {
  if (!hasDraft) {
    return 'blocked';
  }

  if (approvalQueue.summary.total === 0) {
    return hasReview ? 'needs-review' : 'blocked';
  }

  if (approvalQueue.summary.undecided > 0 || approvalQueue.summary.revision > 0 || approvalQueue.summary.hold > 0) {
    return 'needs-review';
  }

  return 'ready';
}

function resolveReportStatus(gates: AlphaReadinessGate[]): AlphaGateStatus {
  if (gates.some((gate) => gate.status === 'blocked')) {
    return 'blocked';
  }

  if (gates.some((gate) => gate.status === 'needs-review')) {
    return 'needs-review';
  }

  return 'ready';
}

function buildProofSummary(
  project: SeriesProject,
  blueprint: CreativeBlueprint,
  latestReviewResult: AiCliReviewResult | null,
  approvalQueue: MemoryApprovalQueue
) {
  const latestChapter = project.chapters[project.chapters.length - 1] ?? null;
  const draftText = latestChapter ? `${latestChapter.episode}화 "${latestChapter.title}"` : '초안 없음';
  const reviewText = latestReviewResult
    ? `${latestReviewResult.provider}/${latestReviewResult.scale} 검토 ${latestReviewResult.agentReports.length}건`
    : '검토 전';

  return `${blueprint.mediumLabel} · ${blueprint.formatLabel} / ${draftText} / ${reviewText} / 승인 대기 ${approvalQueue.summary.undecided}건`;
}

function buildNextActions(gates: AlphaReadinessGate[]) {
  const actions = gates
    .filter((gate) => gate.status !== 'ready')
    .map((gate) => gate.nextAction)
    .filter((action, index, all) => all.indexOf(action) === index);

  return actions.length > 0
    ? actions.slice(0, 4)
    : ['출간 준비에서 스냅샷을 만들고 외부 게시 전 마지막 검토를 실행합니다.'];
}
