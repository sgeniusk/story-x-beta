// 퍼블리시 파트 — 스튜디오에서 분리된 4번째 stage.
// 출판 에이전트 4명(book-designer · pr-specialist · platform-curator · business-strategist)이 각자의 영역에서 출간 준비를 책임진다.
// 실데이터 — loadProject + buildPublishingPlan 으로 출간 게이트(checklist) · packaging · releaseLock 을 모두 노출.
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Megaphone,
  Layers,
  LineChart,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import { AiStatusBadge } from './AiStatusBadge';
import { loadProject } from '../lib/storage';
import { buildCreativeBlueprint, type CreativeFormat, type CreativeMedium } from '../lib/projectBlueprint';
import { buildMemoryApprovalQueue } from '../lib/memoryBank';
import { buildPublishingPlan, type PublishingChecklistItem, type PublishingPlan } from '../lib/publishing';
import { requestAgentReview } from '../lib/reviewClient';
import type { AiCliAgentReport } from '../lib/aiCliHarness';
import type { AcademicPublishSummary } from '../lib/academicPublish';
import type { SeriesProject } from '../lib/storyEngine';
import {
  LOCAL_RUNTIME_REQUIRED_MESSAGE,
  STORYX_RUNTIME_CAPABILITIES
} from '../lib/runtimeCapabilities';

type PublishAgentId = 'book-designer' | 'pr-specialist' | 'platform-curator' | 'business-strategist';

type AgentReviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: AiCliAgentReport }
  | { status: 'failed'; reason: string };

interface PublishScreenProps {
  medium: CreativeMedium;
  format: CreativeFormat;
  academicSummary?: AcademicPublishSummary;
  workTitle?: string;
  mediumLabel?: string;
  onBack: () => void;
  aiEnabled?: boolean;
  disabledReason?: string;
}

interface PublishAgentCard {
  id: PublishAgentId;
  label: string;
  agentLabel: string;
  Icon: typeof BookOpen;
  description: string;
  /** deliverables 가 매체별로 다르게 변동될 수 있는 카드는 함수 형태로 둔다. */
  deliverablesByMedium: (medium: CreativeMedium) => string[];
  cta: string;
}

const PUBLISH_AGENTS: PublishAgentCard[] = [
  {
    id: 'book-designer',
    label: '북 디자인',
    agentLabel: 'book-designer',
    Icon: BookOpen,
    description: '원고가 잠긴 뒤, 표지·내부·여백·서체를 작품에 맞게 잡습니다.',
    deliverablesByMedium: (medium) => {
      if (medium === 'comics') return ['표지 + 첫 컷 샘플', '세로 스크롤 번들', '캡션 서체 잠금', '말풍선 스타일 인계'];
      if (medium === 'audiobook') return ['1:1 앨범 표지 3000×3000', '챕터별 트랙 아트 (선택)', '메타데이터 한국어'];
      return ['표지 + 책등 + 뒷면', 'IBM Plex Sans KR 본문', '챕터 디바이더', 'CMYK PDF · EPUB 3 출력'];
    },
    cta: '디자인 준비'
  },
  {
    id: 'pr-specialist',
    label: 'PR 보도',
    agentLabel: 'pr-specialist',
    Icon: Megaphone,
    description: '과장 없이, 작품의 결을 그대로 전달하는 출시 커뮤니케이션 패키지를 만듭니다.',
    deliverablesByMedium: () => [
      '보도자료 250~400자',
      '소셜 3종 (롱·숏·캐러셀)',
      '플랫폼별 메타데이터',
      'D-7 → D+14 출시 시퀀스',
      'FAQ 5문항'
    ],
    cta: '보도 패키지 준비'
  },
  {
    id: 'platform-curator',
    label: '플랫폼 핸드오프',
    agentLabel: 'platform-curator',
    Icon: Layers,
    description: '매체별 플랫폼의 포맷·규격에 맞춰 작품을 변환합니다. 한 작품, 여러 채널.',
    deliverablesByMedium: (medium) => {
      if (medium === 'comics') return ['네이버 웹툰 (~65컷)', '카카오웹툰 (~50컷)', '레진 (성인 게이트)', '포스타입 후원 잠금'];
      if (medium === 'audiobook') return ['윌라 (MP3/AAC)', 'Audible 챕터 분할', '오디오북 메타데이터', '청취 샘플 30초'];
      return ['Kindle KDP (EPUB 3)', 'Ridi (한국어 카테고리)', 'Yes24 Crema (ISBN 필수)', '인디 (Booksum·텀블벅)'];
    },
    cta: '플랫폼 매칭'
  },
  {
    id: 'business-strategist',
    label: '비즈니스 전략',
    agentLabel: 'business-strategist',
    Icon: LineChart,
    description: '가격·로열티·독점·라이선스를 두 시나리오 이상으로 비교합니다. 독점 함정은 짚어 줍니다.',
    deliverablesByMedium: (medium) => {
      const priceRange =
        medium === 'comics' ? '단행본 12,000~15,000원' :
        medium === 'audiobook' ? '챕터당 ~1,500원 / 월구독' :
        medium === 'essay' ? '에세이 단편 ~13,000원' :
        '장편 소설 15,000~19,000원';
      return [
        `가격 범위: ${priceRange}`,
        '로열티 비교 (플랫폼별)',
        '독점 권고 (할까/말까 + 이유)',
        '계약 레드플래그 5종',
        '3·6·12개월 ROI 시나리오'
      ];
    },
    cta: '계약 비교 준비'
  }
];

// 분위기 — 스튜디오 warm 다크 톤 + 따뜻한 앰버 액센트로 "출간의 무게" 분리 (핀 완화: --st-* 공통 언어)
const screenStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, var(--st-sheet) 0%, var(--st-bg) 100%)',
  color: 'var(--st-ink)',
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 32px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  background: 'rgba(15, 16, 17, 0.5)',
  backdropFilter: 'blur(8px)',
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const backButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  color: 'rgba(237, 237, 243, 0.85)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit'
};

const titleAreaStyle: CSSProperties = {
  textAlign: 'center',
  flex: 1,
  marginLeft: 24,
  marginRight: 24
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: 'rgba(243, 201, 90, 0.75)',
  fontWeight: 600,
  marginBottom: 4
};

const workTitleStyle: CSSProperties = {
  fontSize: 14,
  color: 'rgba(237, 237, 243, 0.7)',
  fontWeight: 500
};

const mainStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  padding: '56px 32px 80px'
};

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1080,
  display: 'flex',
  flexDirection: 'column',
  gap: 48
};

const heroStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  paddingBottom: 8
};

const heroEyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 3,
  textTransform: 'uppercase',
  color: 'rgba(243, 201, 90, 0.85)',
  fontWeight: 600
};

const heroTitleStyle: CSSProperties = {
  fontSize: 56,
  fontWeight: 300,
  lineHeight: 1.05,
  letterSpacing: -1.2,
  margin: 0,
  color: '#ededf3'
};

const heroLeadStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  color: 'rgba(237, 237, 243, 0.7)',
  maxWidth: 640,
  margin: 0
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: 'rgba(243, 201, 90, 0.7)',
  fontWeight: 600,
  marginBottom: 16
};

const checklistGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12
};

const checklistItemStyle = (status: PublishingChecklistItem['status']): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '14px 16px',
  borderRadius: 10,
  background: status === 'ready' ? 'rgba(123, 227, 123, 0.05)' : 'rgba(243, 201, 90, 0.06)',
  border: `1px solid ${status === 'ready' ? 'rgba(123, 227, 123, 0.22)' : 'rgba(243, 201, 90, 0.22)'}`
});

const checklistHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  color: '#ededf3'
};

const checklistDetailStyle: CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: 'rgba(237, 237, 243, 0.65)'
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: 20
};

const cardStyle: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(22, 23, 24, 0.95) 0%, rgba(15, 16, 17, 0.95) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 14,
  padding: '28px 26px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  position: 'relative',
  overflow: 'hidden'
};

const cardHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14
};

const cardIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  background: 'rgba(243, 201, 90, 0.08)',
  border: '1px solid rgba(243, 201, 90, 0.18)',
  color: '#f3c95a',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const cardLabelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2
};

const cardTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 500,
  color: '#ededf3',
  letterSpacing: -0.2
};

const cardAgentStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, "SF Mono", monospace',
  color: 'rgba(237, 237, 243, 0.4)',
  letterSpacing: 0.5
};

const cardDescStyle: CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.6,
  color: 'rgba(237, 237, 243, 0.72)',
  margin: 0
};

const deliverableListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 7
};

const deliverableItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: 12.5,
  color: 'rgba(237, 237, 243, 0.65)',
  lineHeight: 1.5
};

const bulletStyle: CSSProperties = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: 'rgba(243, 201, 90, 0.6)',
  marginTop: 8,
  flexShrink: 0
};

const cardCtaStyle = (isLoading: boolean, isDone: boolean): CSSProperties => ({
  marginTop: 'auto',
  padding: '10px 16px',
  background: isDone ? 'rgba(123, 227, 123, 0.1)' : 'rgba(243, 201, 90, 0.12)',
  border: `1px solid ${isDone ? 'rgba(123, 227, 123, 0.32)' : 'rgba(243, 201, 90, 0.32)'}`,
  borderRadius: 8,
  color: isDone ? '#7be37b' : '#f3c95a',
  fontSize: 13,
  fontWeight: 500,
  cursor: isLoading ? 'progress' : 'pointer',
  fontFamily: 'inherit',
  alignSelf: 'flex-start',
  opacity: isLoading ? 0.7 : 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'transform 120ms ease'
});

const reviewPanelStyle = (status: AiCliAgentReport['status'] | 'failed'): CSSProperties => ({
  marginTop: 8,
  padding: '14px 16px',
  background: 'rgba(0, 0, 0, 0.25)',
  border: `1px solid ${
    status === 'pass' ? 'rgba(123, 227, 123, 0.22)' :
    status === 'failed' ? 'rgba(231, 100, 100, 0.3)' :
    'rgba(243, 201, 90, 0.22)'
  }`,
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontSize: 12.5,
  lineHeight: 1.55
});

const reviewStatusChipStyle = (status: AiCliAgentReport['status'] | 'failed'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 9px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  borderRadius: 999,
  background:
    status === 'pass' ? 'rgba(123, 227, 123, 0.14)' :
    status === 'failed' ? 'rgba(231, 100, 100, 0.18)' :
    'rgba(243, 201, 90, 0.16)',
  color:
    status === 'pass' ? '#7be37b' :
    status === 'failed' ? '#e76464' :
    '#f3c95a',
  alignSelf: 'flex-start'
});

const reviewListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  color: 'rgba(237, 237, 243, 0.78)'
};

const packagingGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16
};

const packagingCardStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const packagingTitleStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'rgba(237, 237, 243, 0.55)',
  fontWeight: 600
};

const packagingListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  color: 'rgba(237, 237, 243, 0.78)',
  lineHeight: 1.5
};

const academicGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16
};

const academicPanelStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 12,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0
};

const academicPanelTitleStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'rgba(243, 201, 90, 0.78)',
  fontWeight: 600
};

const academicEmptyStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: 'rgba(237, 237, 243, 0.52)'
};

const academicClaimListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const academicClaimItemStyle = (hasEvidence: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  padding: '10px 11px',
  borderRadius: 9,
  background: hasEvidence ? 'rgba(123, 227, 123, 0.05)' : 'rgba(231, 100, 100, 0.08)',
  border: `1px solid ${hasEvidence ? 'rgba(123, 227, 123, 0.18)' : 'rgba(231, 100, 100, 0.24)'}`
});

const academicClaimTextStyle: CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.55,
  color: 'rgba(237, 237, 243, 0.82)'
};

const academicChipStyle = (tone: 'pass' | 'warn'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  padding: '3px 8px',
  borderRadius: 999,
  background: tone === 'pass' ? 'rgba(123, 227, 123, 0.12)' : 'rgba(231, 100, 100, 0.14)',
  color: tone === 'pass' ? '#7be37b' : '#e76464',
  border: `1px solid ${tone === 'pass' ? 'rgba(123, 227, 123, 0.24)' : 'rgba(231, 100, 100, 0.28)'}`,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: 'uppercase'
});

const academicMetricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8
};

const academicMetricStyle: CSSProperties = {
  padding: '10px 11px',
  borderRadius: 9,
  background: 'rgba(0, 0, 0, 0.22)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: 3
};

const academicMetricLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(237, 237, 243, 0.5)'
};

const academicMetricValueStyle: CSSProperties = {
  fontSize: 18,
  color: '#ededf3',
  fontWeight: 600
};

const academicGateListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 9
};

const academicGateItemStyle = (passed: boolean): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 8,
  alignItems: 'flex-start',
  fontSize: 12.5,
  lineHeight: 1.5,
  color: 'rgba(237, 237, 243, 0.76)'
});

const releaseStatusStyle = (canLock: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  padding: '20px 22px',
  borderRadius: 12,
  background: canLock ? 'rgba(123, 227, 123, 0.06)' : 'rgba(243, 201, 90, 0.06)',
  border: `1px solid ${canLock ? 'rgba(123, 227, 123, 0.26)' : 'rgba(243, 201, 90, 0.26)'}`
});

const footerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  paddingTop: 24,
  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
};

const footerNoteStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(237, 237, 243, 0.5)',
  textAlign: 'center',
  maxWidth: 540,
  lineHeight: 1.6,
  margin: 0
};

const lockButtonStyle = (canLock: boolean, isLocked: boolean): CSSProperties => ({
  padding: '14px 32px',
  background: isLocked
    ? 'rgba(123, 227, 123, 0.12)'
    : canLock
      ? 'rgba(243, 201, 90, 0.18)'
      : 'rgba(243, 201, 90, 0.08)',
  border: `1px solid ${isLocked ? 'rgba(123, 227, 123, 0.5)' : canLock ? 'rgba(243, 201, 90, 0.5)' : 'rgba(243, 201, 90, 0.22)'}`,
  borderRadius: 10,
  color: isLocked ? '#7be37b' : '#f3c95a',
  fontSize: 14,
  fontWeight: 600,
  cursor: canLock || isLocked ? 'pointer' : 'not-allowed',
  fontFamily: 'inherit',
  opacity: canLock || isLocked ? 1 : 0.55,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  transition: 'transform 120ms ease'
});

export function PublishScreen({
  medium,
  format,
  academicSummary,
  workTitle,
  mediumLabel,
  onBack,
  aiEnabled = STORYX_RUNTIME_CAPABILITIES.coreAi,
  disabledReason = LOCAL_RUNTIME_REQUIRED_MESSAGE
}: PublishScreenProps) {
  // 출간 화면도 스튜디오와 같은 storage 에서 project 를 읽고 동일한 publishingPlan 빌더를 쓴다.
  // reviewCandidates·decisions 같은 in-memory state 는 출간 단계에서 별도 관리하지 않으므로 빈 옵션으로 호출.
  const project = useMemo(() => loadProject(), []);
  const blueprint = useMemo(() => buildCreativeBlueprint({ medium, format }), [medium, format]);
  const approvalQueue = useMemo(() => buildMemoryApprovalQueue({ project }), [project]);
  const publishingPlan = useMemo(
    () => buildPublishingPlan(project, blueprint, { approvalQueue }),
    [project, blueprint, approvalQueue]
  );

  const [isLocked, setIsLocked] = useState(false);
  const [reviewStates, setReviewStates] = useState<Record<PublishAgentId, AgentReviewState>>({
    'book-designer': { status: 'idle' },
    'pr-specialist': { status: 'idle' },
    'platform-curator': { status: 'idle' },
    'business-strategist': { status: 'idle' }
  });
  const canLock = publishingPlan.releaseLock.canLock;
  const blockedIds = publishingPlan.releaseLock.blockerIds;

  const handleLockToggle = () => {
    if (isLocked) {
      setIsLocked(false);
      return;
    }
    if (!canLock) return;
    setIsLocked(true);
  };

  // 출판 에이전트 호출 — 작품의 핵심 결만 컨텍스트로 던지고, 각자의 영역에서 출간 단계 가이드를 받는다.
  // target 은 원고 미리보기(excerpt), context 는 작품·매체·발간 노트·패키지 묶음.
  const handleAgentInvoke = async (agentId: PublishAgentId) => {
    if (!aiEnabled) return;
    const target = publishingPlan.excerpt || publishingPlan.platformProof || project.logline;
    const context = buildAgentContext(project, publishingPlan, mediumLabel ?? medium);
    setReviewStates((current) => ({ ...current, [agentId]: { status: 'loading' } }));
    const result = await requestAgentReview({ agentId, target, medium, context });
    if (result.ok && result.report) {
      setReviewStates((current) => ({ ...current, [agentId]: { status: 'success', report: result.report } }));
    } else {
      setReviewStates((current) => ({
        ...current,
        [agentId]: { status: 'failed', reason: result.reason ?? '알 수 없는 사유' }
      }));
    }
  };

  return (
    <div style={screenStyle}>
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={onBack}>
          <ArrowLeft size={14} />
          에디터로
        </button>
        <div style={titleAreaStyle}>
          <div style={eyebrowStyle}>Publish</div>
          <div style={workTitleStyle}>
            {workTitle ?? project.title ?? '이름 없는 작품'}
            {mediumLabel && <span style={{ opacity: 0.5, margin: '0 8px' }}>·</span>}
            {mediumLabel}
          </div>
        </div>
        <AiStatusBadge />
      </header>

      <main style={mainStyle}>
        <div style={containerStyle}>
          <section style={heroStyle}>
            <span style={heroEyebrowStyle}>4단계 · 출간 준비</span>
            <h1 style={heroTitleStyle}>{publishingPlan.title}</h1>
            <p style={heroLeadStyle}>{publishingPlan.releaseNotice}</p>
          </section>

          <section style={releaseStatusStyle(canLock)}>
            {canLock ? (
              <CheckCircle2 size={22} color="#7be37b" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <AlertTriangle size={22} color="#f3c95a" style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ededf3' }}>
                {canLock ? '출간 스냅샷을 잠글 수 있습니다' : `${blockedIds.length}개 게이트가 아직 review 상태`}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(237, 237, 243, 0.7)', lineHeight: 1.5 }}>
                {publishingPlan.releaseLock.notice}
              </span>
            </div>
          </section>

          {publishingPlan.checklist.length > 0 && (
            <section>
              <h2 style={sectionTitleStyle}>출간 게이트</h2>
              <div style={checklistGridStyle}>
                {publishingPlan.checklist.map((item) => (
                  <div key={item.id} style={checklistItemStyle(item.status)}>
                    <span style={checklistHeaderStyle}>
                      {item.status === 'ready' ? (
                        <CheckCircle2 size={14} color="#7be37b" />
                      ) : (
                        <AlertTriangle size={14} color="#f3c95a" />
                      )}
                      {item.label}
                    </span>
                    <span style={checklistDetailStyle}>{item.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 style={sectionTitleStyle}>출판 에이전트 4명</h2>
            {!aiEnabled && <p role="status" style={footerNoteStyle}>{disabledReason}</p>}
            <div style={gridStyle}>
              {PUBLISH_AGENTS.map((agent) => {
                const Icon = agent.Icon;
                const deliverables = agent.deliverablesByMedium(medium);
                return (
                  <article key={agent.id} style={cardStyle}>
                    <div style={cardHeadStyle}>
                      <span style={cardIconStyle}>
                        <Icon size={20} />
                      </span>
                      <div style={cardLabelStyle}>
                        <span style={cardTitleStyle}>{agent.label}</span>
                        <span style={cardAgentStyle}>{agent.agentLabel}</span>
                      </div>
                    </div>
                    <p style={cardDescStyle}>{agent.description}</p>
                    <ul style={deliverableListStyle}>
                      {deliverables.map((item) => (
                        <li key={item} style={deliverableItemStyle}>
                          <span style={bulletStyle} aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {renderAgentReview(
                      reviewStates[agent.id],
                      () => handleAgentInvoke(agent.id),
                      agent.cta,
                      aiEnabled
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>출간 자료 패키지</h2>
            <div style={packagingGridStyle}>
              <article style={packagingCardStyle}>
                <span style={packagingTitleStyle}>출간 스냅샷</span>
                <ul style={packagingListStyle}>
                  {publishingPlan.snapshotItems.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </article>
              <article style={packagingCardStyle}>
                <span style={packagingTitleStyle}>변경 로그 검토</span>
                <ul style={packagingListStyle}>
                  {publishingPlan.changeLogReview.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </article>
              <article style={packagingCardStyle}>
                <span style={packagingTitleStyle}>패키지 묶음</span>
                <ul style={packagingListStyle}>
                  {publishingPlan.packageItems.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          {publishingPlan.platformProof && (
            <section style={{ ...packagingCardStyle, background: 'rgba(243, 201, 90, 0.04)', border: '1px solid rgba(243, 201, 90, 0.16)' }}>
              <span style={packagingTitleStyle}>플랫폼 미리보기 증거</span>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: 'rgba(237, 237, 243, 0.82)' }}>
                {publishingPlan.platformProof}
              </p>
            </section>
          )}

          {medium === 'academic' && academicSummary && (
            <section>
              <h2 style={sectionTitleStyle}>학술 퍼블리시 무결성</h2>
              <div style={academicGridStyle}>
                <article style={academicPanelStyle}>
                  <span style={academicPanelTitleStyle}>References</span>
                  {academicSummary.references.length === 0 ? (
                    <p style={academicEmptyStyle}>참고문헌 없음</p>
                  ) : (
                    <ol style={{ ...packagingListStyle, listStyle: 'decimal', paddingLeft: 18 }}>
                      {academicSummary.references.map((reference) => (
                        <li key={reference}>{reference}</li>
                      ))}
                    </ol>
                  )}
                </article>

                <article style={academicPanelStyle}>
                  <span style={academicPanelTitleStyle}>Claim · Evidence Map</span>
                  {academicSummary.claimLedger.claims.length === 0 ? (
                    <p style={academicEmptyStyle}>명시적 학술 주장 없음</p>
                  ) : (
                    <ul style={academicClaimListStyle}>
                      {academicSummary.claimLedger.claims.map((claim) => (
                        <li key={claim.id} style={academicClaimItemStyle(claim.hasEvidence)}>
                          <span style={academicClaimTextStyle}>{claim.text}</span>
                          <span style={academicChipStyle(claim.hasEvidence ? 'pass' : 'warn')}>
                            {claim.hasEvidence ? formatEvidenceType(claim.evidenceType) : '근거 없음'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article style={academicPanelStyle}>
                  <span style={academicPanelTitleStyle}>Citation Integrity</span>
                  <div style={academicMetricGridStyle}>
                    <Metric label="본문 인용" value={academicSummary.citationSummary.totalCitations} />
                    <Metric label="Orphan" value={academicSummary.citationSummary.orphanCitations} />
                    <Metric label="Page missing" value={academicSummary.citationSummary.pageMissingQuotes} />
                    <Metric label="Uncited ref" value={academicSummary.citationSummary.uncitedReferences} />
                  </div>
                  {academicSummary.citationSummary.missingReferenceSection && (
                    <p style={academicEmptyStyle}>References 섹션이 없어 orphan 판정을 보류했습니다.</p>
                  )}
                </article>

                <article style={academicPanelStyle}>
                  <span style={academicPanelTitleStyle}>Academic Gates</span>
                  <ul style={academicGateListStyle}>
                    {academicSummary.gateStatus.map((gate) => (
                      <li key={gate.gate} style={academicGateItemStyle(gate.passed)}>
                        {gate.passed ? (
                          <CheckCircle2 size={14} color="#7be37b" style={{ marginTop: 2 }} />
                        ) : (
                          <AlertTriangle size={14} color="#f3c95a" style={{ marginTop: 2 }} />
                        )}
                        <span>
                          <strong style={{ color: '#ededf3' }}>{formatGateLabel(gate.gate)}</strong>
                          <br />
                          {gate.passed ? '통과' : '주의'} · {gate.reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          )}

          <footer style={footerStyle}>
            <p style={footerNoteStyle}>
              네 영역이 모두 끝나고 출간 게이트가 ready 가 되면 잠금이 활성화됩니다.
              잠근 뒤에는 작가 노트만 별도로 추가할 수 있고, 본문 수정은 변경 로그로 남깁니다.
            </p>
            <button
              type="button"
              style={lockButtonStyle(canLock, isLocked)}
              onClick={handleLockToggle}
              disabled={!canLock && !isLocked}
              title={
                isLocked
                  ? '잠금 해제 — 변경 로그 추가 가능'
                  : canLock
                    ? publishingPlan.releaseLock.label
                    : `${blockedIds.length}개 게이트가 아직 review 상태`
              }
            >
              {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
              {isLocked ? '잠금 해제 (변경 로그로 추가)' : publishingPlan.releaseLock.label}
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span style={academicMetricStyle}>
      <span style={academicMetricLabelStyle}>{label}</span>
      <span style={academicMetricValueStyle}>{value}</span>
    </span>
  );
}

function formatEvidenceType(type: AcademicPublishSummary['claimLedger']['claims'][number]['evidenceType']) {
  switch (type) {
    case 'data':
      return 'data';
    case 'prior-work':
      return 'prior work';
    case 'logic':
      return 'logic';
    case 'anecdote':
      return 'anecdote';
    default:
      return '근거 확인';
  }
}

function formatGateLabel(gate: AcademicPublishSummary['gateStatus'][number]['gate']) {
  switch (gate) {
    case 'claim_evidence_mapping':
      return '주장-근거 매핑';
    case 'citation_integrity':
      return '인용 무결성';
    case 'counter_argument_present':
      return '반론·대안 가설';
    case 'research_ethics_disclosure':
      return '연구 윤리 공개';
    default:
      return gate;
  }
}

// 카드의 CTA + 결과 패널 렌더링. idle / loading / success / failed 4가지 상태를 인라인 처리.
function renderAgentReview(
  state: AgentReviewState,
  onInvoke: () => void,
  ctaLabel: string,
  aiEnabled = true
) {
  if (state.status === 'idle') {
    return (
      <button type="button" style={cardCtaStyle(false, false)} disabled={!aiEnabled} onClick={onInvoke}>
        {ctaLabel}
      </button>
    );
  }
  if (state.status === 'loading') {
    return (
      <button type="button" style={cardCtaStyle(true, false)} disabled>
        {ctaLabel} 호출 중…
      </button>
    );
  }
  if (state.status === 'failed') {
    return (
      <div style={reviewPanelStyle('failed')}>
        <span style={reviewStatusChipStyle('failed')}>호출 실패</span>
        <span style={{ color: 'rgba(237, 237, 243, 0.78)' }}>{state.reason}</span>
        <button type="button" style={cardCtaStyle(false, false)} disabled={!aiEnabled} onClick={onInvoke}>
          다시 호출
        </button>
      </div>
    );
  }
  const report = state.report;
  const statusLabel = report.status === 'pass' ? '통과' : report.status === 'revise' ? '수정 필요' : '잠금';
  return (
    <div style={reviewPanelStyle(report.status)}>
      <span style={reviewStatusChipStyle(report.status)}>{statusLabel}</span>
      <p style={{ margin: 0, color: 'rgba(237, 237, 243, 0.88)' }}>{report.note}</p>
      {report.strengths.length > 0 && (
        <div>
          <span style={{ fontSize: 11, color: 'rgba(123, 227, 123, 0.85)', fontWeight: 600, letterSpacing: 1 }}>잘된 점</span>
          <ul style={reviewListStyle}>
            {report.strengths.map((item, idx) => (
              <li key={idx}>· {item}</li>
            ))}
          </ul>
        </div>
      )}
      {report.issues.length > 0 && (
        <div>
          <span style={{ fontSize: 11, color: 'rgba(243, 201, 90, 0.9)', fontWeight: 600, letterSpacing: 1 }}>짚어야 할 점</span>
          <ul style={reviewListStyle}>
            {report.issues.map((item, idx) => (
              <li key={idx}>· {item}</li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" style={cardCtaStyle(false, true)} disabled={!aiEnabled} onClick={onInvoke}>
        다시 호출
      </button>
    </div>
  );
}

// 출판 에이전트가 받을 컨텍스트 — 작품의 핵심 결 + 매체 + 출간 노트 + 패키지 묶음.
// 작품 전체를 던지지 않고, 출판 단계에서 의사결정에 쓸 만한 정보만 추린다.
function buildAgentContext(project: SeriesProject, plan: PublishingPlan, mediumLabel: string): string {
  return [
    `매체: ${mediumLabel}`,
    `작품 한 줄: ${project.logline}`,
    `출간 노트: ${plan.releaseNotice}`,
    `패키지 묶음: ${plan.packageItems.join(' · ')}`,
    plan.platformProof
  ]
    .filter(Boolean)
    .join('\n');
}
