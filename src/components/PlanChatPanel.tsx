// PLAN 설계 대화 패널 — 파트너 버블·승인형 제안 카드·하네스 미리보기. 상태·fetch 는 StoryXDesk 소유(프레젠테이션만).
import { useState } from 'react';
import type { PlanChatMessage } from '../lib/planChat';

export interface PlanChatHarnessPreview {
  before: number;
  after: number;
  count: number;
}

export interface PlanChatPanelProps {
  messages: PlanChatMessage[];
  busy: boolean;
  note: string | null;
  harnessPreview: PlanChatHarnessPreview | null;
  onSend: (text: string) => void;
  onApproveProposal: (messageId: string, index: number) => void;
}

const KIND_LABELS: Record<string, string> = {
  character: '인물',
  world: '세계 규칙',
  canon: '캐논',
  'story-core': '스토리 코어'
};

const FIELD_LABELS: Record<string, string> = {
  desire: '욕망',
  wound: '상처',
  currentState: '현재 상태',
  logline: '로그라인',
  audiencePromise: '표면 약속',
  deepQuestion: '심층 질문',
  formIntent: '형식·구조',
  tone: '문체 톤'
};

export function PlanChatPanel({ messages, busy, note, harnessPreview, onSend, onApproveProposal }: PlanChatPanelProps) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    onSend(text);
  };
  return (
    <div className="pcp">
      {harnessPreview && (
        <div className="pcp-harness">
          하네스 {harnessPreview.before} → {harnessPreview.after} · 설계안 {harnessPreview.count}건 반영 시
        </div>
      )}
      {messages.length === 0 && (
        <p className="pcp-empty">설계 파트너와 인물·세계·캐논·스토리 코어를 함께 다듬으세요. 제안을 승인하면 설계안(미반영)으로 쌓입니다.</p>
      )}
      <div className="pcp-log">
        {messages.map((m) => (
          <div key={m.id} className={`pcp-msg is-${m.role}`}>
            <p className="pcp-text">{m.text}</p>
            {m.proposals?.map((p, i) => (
              <div key={i} className={`pcp-prop${p.approved ? ' is-approved' : ''}`}>
                <span className="pcp-prop-kind">
                  {KIND_LABELS[p.kind] ?? p.kind}
                  {p.targetLabel ? ` · ${p.targetLabel}` : ''}
                  {p.field ? ` · ${FIELD_LABELS[p.field] ?? p.field}` : ''}
                </span>
                <span className="pcp-prop-after">{p.after}</span>
                {p.rationale && <span className="pcp-prop-why">{p.rationale}</span>}
                <button
                  type="button"
                  className="pcp-prop-stage"
                  disabled={!!p.approved}
                  onClick={() => onApproveProposal(m.id, i)}
                >
                  {p.approved ? '✓ 설계안 (미반영)' : '설계안으로'}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      {busy && <p className="pcp-busy">파트너가 생각 중… (수십 초 걸릴 수 있어요)</p>}
      {note && <p className="pcp-note">{note}</p>}
      <div className="pcp-input">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="파트너에게 말하기 (Enter 전송 · Shift+Enter 줄바꿈)"
          rows={2}
          disabled={busy}
          aria-label="설계 파트너에게 보낼 말"
        />
        <button type="button" onClick={submit} disabled={busy || !draft.trim()}>보내기</button>
      </div>
    </div>
  );
}
