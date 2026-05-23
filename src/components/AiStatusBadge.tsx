// 헤더 우상단의 AI 상태 뱃지 + 클릭 시 펼쳐지는 evolution history popover.
// 뱃지 — 최근 LLM 호출 결과(녹색/노란/회색). 클릭 → popover 에 최근 이벤트 시간순 리스트.
// 모든 LLM 호출이 aiStatus.reportAiCall → evolutionMemory.appendEvolutionEvent 로 누적되므로
// 이 popover 가 작가에게 "지금까지 무엇이 진행됐는가" 의 단일 진실 출처가 된다.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Activity, Trash2, X } from 'lucide-react';
import { useAiStatus } from '../hooks/useAiStatus';
import { aiCallModeLabel } from '../lib/aiStatus';
import {
  clearEvolutionHistory,
  loadEvolutionHistory,
  type EvolutionEvent
} from '../lib/evolutionMemory';

const baseBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: 0.2,
  lineHeight: 1.2,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(255, 255, 255, 0.04)',
  color: 'rgba(237, 237, 243, 0.85)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
  fontFamily: 'inherit'
};

const dotStyle = (color: string): CSSProperties => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 8px ${color}`,
  flexShrink: 0
});

const popoverStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  width: 340,
  // 모바일 — 화면 가장자리에서 16px 여백 보장. 큰 화면에서는 340px 고정.
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'min(460px, calc(100vh - 120px))',
  background: 'rgba(15, 16, 17, 0.98)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  fontSize: 12.5,
  color: 'rgba(237, 237, 243, 0.85)',
  overflow: 'hidden'
};

const popoverHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  background: 'rgba(255, 255, 255, 0.02)'
};

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const iconButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 4,
  color: 'rgba(237, 237, 243, 0.6)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 6,
  fontFamily: 'inherit'
};

const eventListStyle: CSSProperties = {
  margin: 0,
  padding: '8px 0',
  listStyle: 'none',
  overflowY: 'auto',
  flex: 1
};

const emptyStyle: CSSProperties = {
  padding: '32px 18px',
  textAlign: 'center',
  color: 'rgba(237, 237, 243, 0.45)',
  fontSize: 12.5,
  lineHeight: 1.6
};

const eventItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '8px 14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
};

const eventDotStyle = (color: string): CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: color,
  flexShrink: 0,
  marginTop: 6
});

const eventBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: 1
};

const eventSummaryStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'rgba(237, 237, 243, 0.85)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const eventMetaStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  fontSize: 11,
  color: 'rgba(237, 237, 243, 0.45)'
};

export function AiStatusBadge() {
  const status = useAiStatus();
  const [isOpen, setIsOpen] = useState(false);
  // status 가 바뀔 때마다 history 도 갱신 — popover 가 열려 있는 동안 자동 반영.
  const events = useMemo<EvolutionEvent[]>(() => (isOpen ? loadEvolutionHistory().events : []), [isOpen, status]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapRef.current && !wrapRef.current.contains(target)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const { color, label, hint } = resolveBadgeAppearance(status);

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        style={{
          ...baseBadgeStyle,
          ...(status && !status.ok
            ? { color: '#f3c95a', background: 'rgba(255, 196, 0, 0.08)', border: '1px solid rgba(255, 196, 0, 0.32)' }
            : {})
        }}
        onClick={() => setIsOpen((v) => !v)}
        title={hint}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <i style={dotStyle(color)} />
        {label}
      </button>
      {isOpen && (
        <div style={popoverStyle} role="dialog" aria-label="AI 활동 이력">
          <header style={popoverHeaderStyle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <Activity size={13} color="rgba(228, 242, 34, 0.85)" />
              AI 활동 이력
              <span style={{ color: 'rgba(237, 237, 243, 0.45)', fontWeight: 400 }}>· 최근 {events.length}건</span>
            </span>
            <span style={headerActionsStyle}>
              {events.length > 0 && (
                <button
                  type="button"
                  style={iconButtonStyle}
                  onClick={() => {
                    if (window.confirm('이 작품의 AI 활동 이력을 모두 지웁니다. 계속할까요?')) {
                      clearEvolutionHistory();
                      setIsOpen(false);
                    }
                  }}
                  title="이력 비우기"
                  aria-label="이력 비우기"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                type="button"
                style={iconButtonStyle}
                onClick={() => setIsOpen(false)}
                title="닫기"
                aria-label="닫기"
              >
                <X size={13} />
              </button>
            </span>
          </header>
          {events.length === 0 ? (
            <div style={emptyStyle}>
              아직 누적된 AI 활동이 없습니다.
              <br />
              인터뷰·초안·검토 호출이 발생하면 이곳에 시간순으로 쌓입니다.
            </div>
          ) : (
            <ul style={eventListStyle}>
              {events.map((event) => {
                const tone = resolveEventTone(event);
                return (
                  <li key={event.id} style={eventItemStyle}>
                    <span style={eventDotStyle(tone)} aria-hidden="true" />
                    <div style={eventBodyStyle}>
                      <span style={eventSummaryStyle}>{event.summary}</span>
                      <span style={eventMetaStyle}>
                        <span>{formatRelative(new Date(event.at).getTime())}</span>
                        {event.source && <span>· {aiCallModeLabel(event.source as never)}</span>}
                        {event.detail && (
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            · {event.detail}
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// 뱃지 색/라벨/툴팁을 한 곳에서 결정. button 본문이 길어지지 않게 분리.
function resolveBadgeAppearance(status: ReturnType<typeof useAiStatus>): { color: string; label: string; hint: string } {
  if (!status) {
    return {
      color: 'rgba(160, 168, 180, 0.6)',
      label: 'AI 대기',
      hint: 'AI 호출 이력 없음 — 클릭하면 비어 있는 활동 이력이 열립니다.'
    };
  }
  if (status.ok) {
    return {
      color: '#7be37b',
      label: 'AI 활성',
      hint: `최근 ${aiCallModeLabel(status.mode)} 호출 성공 (${formatRelative(status.at)}) — 클릭하면 전체 활동 이력`
    };
  }
  return {
    color: '#f3c95a',
    label: 'AI 폴백',
    hint: `${aiCallModeLabel(status.mode)} 호출 실패 — ${status.reason ?? '알 수 없는 사유'}. 클릭하면 전체 활동 이력`
  };
}

function resolveEventTone(event: EvolutionEvent): string {
  // summary 의 "실패" 키워드를 가벼운 휴리스틱으로 — 풍부한 분기는 다음 단계에서.
  if (event.kind === 'review-blocked' || event.kind === 'memory-rejected' || event.summary.includes('실패')) {
    return '#e76464';
  }
  if (event.kind === 'review-revise' || event.kind === 'memory-revised' || event.kind === 'memory-held') {
    return '#f3c95a';
  }
  return 'rgba(123, 227, 123, 0.85)';
}

function formatRelative(at: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
