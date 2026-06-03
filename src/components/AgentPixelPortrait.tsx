// 에이전트 픽셀 초상
import type { AgentPersona } from '../lib/agentPersonas';

export function AgentPixelPortrait({ persona }: { persona: AgentPersona }) {
  return (
    <div className={`pixel-agent ${persona.pixelClass}`} aria-hidden="true">
      <span className="pixel-agent-hair" />
      <span className="pixel-agent-head">
        <i />
        <b />
      </span>
      <span className="pixel-agent-neck" />
      <span className="pixel-agent-body" />
    </div>
  );
}
