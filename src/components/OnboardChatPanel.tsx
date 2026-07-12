// 온보딩 「함께 구상」 대화 패널 — user/partner 버블·응결 시드 카드·상시 「이걸로 시작」. 상태·fetch 는 App 소유(프레젠테이션 전용).
import { useState } from 'react';
import type { DiveSetup } from '../lib/diveProposal';
import type { OnboardChatMessage } from '../lib/onboardChat';

export interface OnboardChatPanelProps {
  messages: OnboardChatMessage[];
  busy: boolean;
  busyNote?: string;   // App 이 경과 타이머로 조립 — busy 중에만 렌더
  note: string | null; // 실패·응결 미완 강등 안내
  onSend: (text: string) => void;
  onCondense: () => void;                  // 「이걸로 시작」 상시 버튼
  onUseSetup: (setup: DiveSetup) => void;  // 시드 카드 승인 → playseed 진입
}

export function OnboardChatPanel({ messages, busy, busyNote, note, onSend, onCondense, onUseSetup }: OnboardChatPanelProps) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    onSend(text);
  };
  return (
    <div className="ocp">
      {messages.length === 0 && (
        <p className="ocp-empty">
          떠오르는 조각을 먼저 던져보세요 — 인물 한 명, 장면 하나, 관계 하나면 충분합니다. 파트너가 받아서 함께 키웁니다.
        </p>
      )}
      <div className="ocp-log">
        {messages.map((m) => {
          const setup = m.setup;
          return (
            <div key={m.id} className={`ocp-msg is-${m.role}`}>
              <p className="ocp-bubble">{m.text}</p>
              {m.role === 'partner' && setup && (
                <div className="ocp-seed">
                  <div className="ocp-seed-field">
                    <span className="ocp-seed-label">첫 장면</span>
                    <p>{setup.scene}</p>
                  </div>
                  {setup.myRole && (
                    <div className="ocp-seed-field">
                      <span className="ocp-seed-label">내 역할</span>
                      <p>{setup.myRole}</p>
                    </div>
                  )}
                  <div className="ocp-seed-field">
                    <span className="ocp-seed-label">대화 상대</span>
                    <ul className="ocp-seed-cast">
                      {setup.cast.map((c) => (
                        <li key={c.name}>
                          <strong>{c.name}</strong> · {c.role}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="hx-btn ocp-seed-use"
                    disabled={busy}
                    onClick={() => onUseSetup(setup)}
                  >
                    이 설정으로 계속
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {busy && busyNote && <p className="ocp-busy" role="status">{busyNote}</p>}
      {note && <p className="ocp-note">{note}</p>}
      <div className="ocp-input">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="구상 파트너에게 말하기 (Enter 전송 · Shift+Enter 줄바꿈)"
          rows={2}
          disabled={busy}
          aria-label="구상 파트너에게 보낼 말"
        />
        <button type="button" className="ocp-send" disabled={busy || !draft.trim()} onClick={submit}>
          보내기
        </button>
      </div>
      <div className="ocp-actions">
        <button
          type="button"
          className="hx-btn ocp-condense"
          disabled={busy || messages.length === 0}
          onClick={onCondense}
        >
          이걸로 시작
        </button>
      </div>
    </div>
  );
}
