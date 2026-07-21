// PLAY-first 온보딩 확인 카드 — 제안/프리셋 설정을 보여주고 바로 플레이로. 수정 UI 없음(스펙 결정 3).
import type { DiveSetup } from '../lib/diveProposal';

export const PLAY_SEED_DISCLAIMER =
  '이 설정은 정확하지 않아도 됩니다 — 플레이하며 완성해나가는 초안입니다.';

interface PlaySeedPanelProps {
  setup: DiveSetup | null;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onBack: () => void;
  // 대화 상대 선택 — cast 중 세션 상대역(기본 cast[0]). 프레젠테이션 전용, 상태는 App 이 쥔다.
  partnerIndex: number;
  onPickPartner: (index: number) => void;
  // LLM 대기 안내 — 경과 시간·새로고침 금지 문구(App 이 조립). loading 중에만 렌더한다.
  loadingNote?: string;
}

export function PlaySeedPanel({
  setup, loading, error, onConfirm, onBack, partnerIndex, onPickPartner, loadingNote
}: PlaySeedPanelProps) {
  return (
    <div className="hx-playseed">
      <p className="hx-playseed-disclaimer">{PLAY_SEED_DISCLAIMER}</p>

      {loading && <p className="hx-playseed-loading" role="status">플레이 상대를 준비하는 중…</p>}
      {loading && loadingNote && <p className="hx-playseed-loading-note">{loadingNote}</p>}
      {error && !loading && <p className="hx-playseed-error">{error}</p>}

      {setup && !loading && (
        <div className="hx-playseed-card">
          <div className="hx-playseed-field">
            <span className="hx-playseed-label">첫 장면</span>
            <p>{setup.scene}</p>
          </div>
          {setup.myRole && (
            <div className="hx-playseed-field">
              <span className="hx-playseed-label">내 역할</span>
              <p>{setup.myRole}</p>
            </div>
          )}
          <div className="hx-playseed-field">
            <span className="hx-playseed-label">대화 상대</span>
            <div className="hx-playseed-cast" role="group" aria-label="대화 상대 선택">
              {setup.cast.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={i === partnerIndex ? 'hx-playseed-partner is-selected' : 'hx-playseed-partner'}
                  aria-pressed={i === partnerIndex}
                  onClick={() => onPickPartner(i)}
                >
                  <strong>{c.name}</strong> · {c.role}
                  {c.desire ? <em> — {c.desire}</em> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hx-playseed-actions">
        <button type="button" className="hx-btn-ghost" onClick={onBack}>이전</button>
        <button type="button" className="hx-btn" onClick={onConfirm} disabled={!setup || loading}>
          이대로 시작
        </button>
      </div>
    </div>
  );
}
