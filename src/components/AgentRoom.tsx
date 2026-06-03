// 에이전트 룸 컴포넌트
import { ChevronRight } from 'lucide-react';
import { AgentPixelPortrait } from './AgentPixelPortrait';
import { getAgentPersona } from '../lib/agentPersonas';
import type { AgentRun } from '../lib/storyEngine';

export function AgentRoom({ runs }: { runs: AgentRun[] }) {
  return (
    <section className="sx-agent-room" aria-label="AI 작가진">
      {runs.map((run, index) => {
        const persona = getAgentPersona(run);

        return (
          <article key={`${run.agentId}-${run.title}`}>
            <AgentPixelPortrait persona={persona} />
            <div>
              <span>0{index + 1}</span>
              <h3>{persona.title}</h3>
              <p>{run.output}</p>
            </div>
            {index < runs.length - 1 && <ChevronRight className="sx-agent-arrow" size={16} />}
          </article>
        );
      })}
    </section>
  );
}
