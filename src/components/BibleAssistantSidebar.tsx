// Bible 조수진 사이드바 컴포넌트
import { BrainCircuit, MessageCircle } from 'lucide-react';
import { getAgentPersona, agentStatusLabel, type AgentPersona } from '../lib/agentPersonas';
import type { BibleSection } from '../lib/canonDataView';
import type { AgentRun } from '../lib/storyEngine';
import { AgentPixelPortrait } from './AgentPixelPortrait';
import { bibleSections } from './MemoryBankStudio';

export function BibleAssistantSidebar({
  runs,
  activeSection,
  onSelectAgent
}: {
  runs: AgentRun[];
  activeSection: BibleSection;
  onSelectAgent: (run: AgentRun, persona: AgentPersona) => void;
}) {
  const activeLabel = bibleSections.find((section) => section.id === activeSection)?.label ?? '바이블';

  return (
    <section className="sx-panel sx-agent-sidebar sx-bible-assistant-sidebar" aria-label="AI 조수진">
      <div className="sx-panel-heading">
        <BrainCircuit size={16} />
        <h2>조수진</h2>
      </div>
      <p>{activeLabel} 작업장을 기준으로 필요한 기억, 충돌, 승인 상태만 옆에서 확인합니다.</p>
      <div>
        {runs.map((run) => {
          const persona = getAgentPersona(run);

          return (
            <button
              key={`${run.agentId}-${run.title}`}
              type="button"
              className={`sx-agent-card sx-agent-card--${run.status}`}
              aria-label={`${persona.title} ${agentStatusLabel(run.status)} 상태, 자세한 지시사항 열기`}
              onClick={() => onSelectAgent(run, persona)}
            >
              <span
                className="sx-agent-status-cluster"
                role="status"
                aria-label={`상태 ${agentStatusLabel(run.status)}`}
              >
                <span className={`sx-agent-status sx-agent-status--${run.status}`} aria-hidden="true" />
                {(run.status === 'revise' || run.status === 'block') && (
                  <span className={`sx-agent-status-label sx-agent-status-label--${run.status}`}>
                    {agentStatusLabel(run.status)}
                  </span>
                )}
              </span>
              <AgentPixelPortrait persona={persona} />
              <div>
                <span>{run.title}</span>
                <strong>{persona.title}</strong>
                <p>{run.output}</p>
                <small>
                  <MessageCircle size={13} />
                  대화하기
                </small>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
