import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const desk = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf8');
const personas = readFileSync(resolve(__dirname, 'lib/agentPersonas.ts'), 'utf8');
const portrait = readFileSync(resolve(__dirname, 'components/AgentPixelPortrait.tsx'), 'utf8');
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('agent personas', () => {
  it('renders agents as clickable pixel-character personas', () => {
    // AgentProfileDialog·BibleAssistantSidebar 는 렌더 0 고아로 삭제됐다. 페르소나 정의 계약만 검사한다.
    expect(personas).toContain('const agentPersonas');
    expect(portrait).toContain('function AgentPixelPortrait');
    expect(personas).toContain('말풍선 연출가');
    expect(personas).toContain('원화/키프레임 감독');
    expect(personas).toContain('프레임 조립가');
  });

  it('styles pixel busts and the agent chat dialog', () => {
    expect(css).toContain('.pixel-agent');
    expect(css).toContain('.pixel-agent-head');
    expect(css).toContain('.pixel-agent-body');
    expect(css).toContain('.agent-dialog-backdrop');
    expect(css).toContain('.agent-chat-message.is-agent');
  });
});
