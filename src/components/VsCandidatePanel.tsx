// PLAY 전개 후보(VS) 게이지 패널 — 의외도 3칸 막대·긴장 배지·캐논 배지·선택. 상태·fetch 는 DiveDesk 소유(프레젠테이션만).
import { rarityToBars, type VsCandidate } from '../lib/episodeBriefing';

interface VsCandidatePanelProps {
  candidates: VsCandidate[];
  onPick: (direction: string) => void;
  onDismiss: () => void;
}

export function VsCandidatePanel({ candidates, onPick, onDismiss }: VsCandidatePanelProps) {
  if (candidates.length === 0) return null;
  return (
    <div className="dx-vs-panel">
      <div className="dx-vs-head">
        <span className="dx-vs-title">✦ 전개 후보 — 의외도를 보고 하나 고르세요</span>
        <button className="dx-vs-dismiss" onClick={onDismiss} aria-label="후보 닫기">✕</button>
      </div>
      {candidates.map((c, i) => {
        const bars = rarityToBars(c.rarity);
        return (
          <button
            key={i}
            className={`dx-vs-opt dx-vs-${c.rarity}${c.canonSuspect ? ' is-canon-suspect' : ''}`}
            onClick={() => onPick(c.direction)}
            title={c.canonSuspect ? '기확정 캐논과 겹칠 수 있습니다 — 이미 일어난 일인지 확인하세요.' : undefined}
          >
            <span className="dx-vs-gauge" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <i key={n} className={`dx-vs-bar${n <= bars ? ' is-on' : ''}`} />
              ))}
            </span>
            <span className="dx-vs-direction">{c.direction}</span>
            {c.tension && (
              <em className={`dx-vs-tension is-${c.tension}`} title={c.tensionNote}>
                {c.tension === 'arms' ? '새 긴장' : '회수만'}
              </em>
            )}
            {c.canonSuspect && <em className="dx-vs-suspect">캐논 확인</em>}
          </button>
        );
      })}
    </div>
  );
}
