// 에이전트 프로필 대화 컴포넌트
import { Check, Info, Send, ShieldAlert, WandSparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AgentPixelPortrait } from './AgentPixelPortrait';
import { agentStatusLabel, type AgentPersona } from '../lib/agentPersonas';
import { getAgentValidationProcess } from '../lib/agentReviewProcess';
import type { AgentRun } from '../lib/storyEngine';

interface AgentChatMessage {
  role: 'agent' | 'user';
  text: string;
}

export function AgentProfileDialog({
  run,
  persona,
  projectTitle,
  isReviewing,
  onRunReview,
  onClose
}: {
  run: AgentRun;
  persona: AgentPersona;
  projectTitle: string;
  isReviewing: boolean;
  onRunReview: () => void;
  onClose: () => void;
}) {
  const validationProcess = getAgentValidationProcess(persona.id);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      role: 'agent',
      text: persona.openingLine
    }
  ]);
  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  const strengths = run.strengths ?? [];
  const issues = run.issues ?? [];
  // 검토 전 상태 — pass/revise/block/complete 중 어떤 결과도 아직 없고, 항목 리스트도 비어 있을 때.
  const reviewed = run.status !== 'idle' || strengths.length > 0 || issues.length > 0;

  // 새 답변이 도착하면 대화 스레드를 항상 마지막 메시지로 스크롤한다
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages]);

  function submitAgentQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();

    if (!question) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      {
        role: 'agent',
        text: buildAgentReply(persona, run, projectTitle, question)
      }
    ]);
    setDraft('');
  }

  return (
    <div className="agent-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="agent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <AgentPixelPortrait persona={persona} />
          <div>
            <p className="sx-eyebrow">Story X Writers Room</p>
            <h2 id="agent-dialog-title">{persona.title}</h2>
            <span>{persona.subtitle}</span>
          </div>
          <div className="ex-pro-head-actions">
            <button
              type="button"
              className={`ex-pro-info-btn ${referenceOpen ? 'is-active' : ''}`}
              aria-label="에이전트 지시사항과 검증 프로세스 보기"
              aria-expanded={referenceOpen}
              aria-pressed={referenceOpen}
              onClick={() => setReferenceOpen((current) => !current)}
            >
              <Info size={17} />
            </button>
            <button type="button" className="agent-dialog-close" aria-label="에이전트 대화창 닫기" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>
        {referenceOpen && (
          <aside className="ex-pro-reference" aria-label={`${persona.title} 기준 정보`}>
            <h3>자세한 지시사항</h3>
            <p>{persona.instruction}</p>
            <h4>검수 기준</h4>
            <ul>
              {persona.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            <h4>검증 프로세스</h4>
            <ol className="agent-process-list">
              <li>{validationProcess.agenda}</li>
              <li>독립 검토 후 {validationProcess.outputFormat.join(', ')}을 남깁니다.</li>
              <li>차단 신호 — {validationProcess.blockingSignals.join(' / ')}</li>
            </ol>
            <h4>성장 메모리</h4>
            <ul>
              {validationProcess.evolutionMemory.map((memory) => (
                <li key={memory}>{memory}</li>
              ))}
            </ul>
          </aside>
        )}
        <div className="agent-dialog-body ex-dialog-scroll">
          <section className="ex-pro-review" aria-label={`${persona.title} 검토 결과`}>
            <div className="ex-pro-review-head">
              <span className="ex-pro-review-overline">이번 회차 검토</span>
              <span className={`ex-pro-verdict ex-pro-verdict--${run.status}`}>{agentStatusLabel(run.status)}</span>
            </div>
            {reviewed ? (
              <>
                {run.output && <p className="ex-pro-review-note">{run.output}</p>}
                <div className="ex-pro-split">
                  <div className="ex-pro-col ex-pro-col--good">
                    <h3>
                      <Check size={14} />
                      잘된 점
                    </h3>
                    {strengths.length > 0 ? (
                      <ul>
                        {strengths.map((item, index) => (
                          <li key={`good-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ex-pro-col-empty">짚어낸 강점이 아직 없습니다.</p>
                    )}
                  </div>
                  <div className="ex-pro-col ex-pro-col--bad">
                    <h3>
                      <ShieldAlert size={14} />
                      잘못된 점
                    </h3>
                    {issues.length > 0 ? (
                      <ul>
                        {issues.map((item, index) => (
                          <li key={`bad-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ex-pro-col-empty">짚어낸 문제가 아직 없습니다.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="ex-pro-empty">
                <p className="ex-pro-empty-title">아직 검토 전이에요</p>
                <p className="ex-pro-empty-body">
                  {persona.title}이 이번 회차를 읽으면 잘된 점과 잘못된 점이 여기에 항목으로 정리됩니다.
                </p>
                <button type="button" className="ex-pro-empty-btn" onClick={onRunReview} disabled={isReviewing}>
                  <WandSparkles size={15} />
                  {isReviewing ? '검토 진행 중' : '지금 검토 실행'}
                </button>
              </div>
            )}
          </section>
          <section className="ex-pro-chat" aria-label={`${persona.title} 대화`}>
            <span className="ex-pro-chat-overline">{persona.title}와의 대화</span>
            <div className="ex-pro-thread" ref={threadRef}>
              {messages.map((message, index) => (
                <p key={`${message.role}-${index}`} className={`agent-chat-message is-${message.role}`}>
                  {message.text}
                </p>
              ))}
            </div>
          </section>
        </div>
        <form className="agent-chat-form ex-dialog-input-pin" onSubmit={submitAgentQuestion}>
          <label>
            <span>{persona.title}에게 묻기 — 답은 위 대화창에 표시됩니다</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 이 인물이 여기서 이렇게 행동해도 괜찮을까?"
              autoComplete="off"
            />
          </label>
          <button type="submit" aria-label="질문 보내기">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}

function buildAgentReply(persona: AgentPersona, run: AgentRun, projectTitle: string, question: string) {
  const firstCheck = persona.checks[0] ?? '현재 작품 기준';
  const evidence = run.evidence[0] ? ` 최근 근거는 "${run.evidence[0]}"입니다.` : '';

  return `${projectTitle} 기준으로 보면, "${question}"은 "${firstCheck}"부터 확인하면 좋겠습니다. ${run.output}${evidence} 다음 단계는 이 결정을 canon, 인물 감정선, 독자 약속 중 어디에 저장할지 정하는 것입니다.`;
}
