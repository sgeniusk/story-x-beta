// Dive X 실시간 채팅 세션의 순수 도메인 — 버퍼 누적·응결 분기·컨텍스트 압축
export type DiveRole = 'user' | 'character';

export interface DiveMessage {
  id: string;
  role: DiveRole;
  text: string;
  turn: number;
}

export interface DiveSession {
  characterId: string;
  projectId: string;
  chatBuffer: DiveMessage[];
  lastCondensedTurn: number;
  pendingCondenseSuggested: boolean;
}

export const CONDENSE_SUGGEST_TURNS = 12;
export const CONDENSE_KEEP_RECENT = 2;

export function createDiveSession(characterId: string, projectId: string): DiveSession {
  return {
    characterId,
    projectId,
    chatBuffer: [],
    lastCondensedTurn: 0,
    pendingCondenseSuggested: false
  };
}

export function appendMessage(session: DiveSession, role: DiveRole, text: string): DiveSession {
  const lastTurn = session.chatBuffer.length
    ? session.chatBuffer[session.chatBuffer.length - 1].turn
    : session.lastCondensedTurn;
  const turn = lastTurn + 1;
  const message: DiveMessage = { id: `msg-${turn}`, role, text, turn };
  return { ...session, chatBuffer: [...session.chatBuffer, message] };
}

export function shouldSuggestCondense(session: DiveSession): boolean {
  return session.chatBuffer.length >= CONDENSE_SUGGEST_TURNS;
}

export function selectCondenseSpan(session: DiveSession): {
  condense: DiveMessage[];
  keep: DiveMessage[];
} {
  const buffer = session.chatBuffer;
  if (buffer.length <= CONDENSE_KEEP_RECENT) {
    return { condense: [], keep: [...buffer] };
  }
  const splitAt = buffer.length - CONDENSE_KEEP_RECENT;
  return { condense: buffer.slice(0, splitAt), keep: buffer.slice(splitAt) };
}

export function applyCondenseResult(session: DiveSession): DiveSession {
  const { condense, keep } = selectCondenseSpan(session);
  const lastCondensedTurn = condense.length
    ? condense[condense.length - 1].turn
    : session.lastCondensedTurn;
  return {
    ...session,
    chatBuffer: keep,
    lastCondensedTurn,
    pendingCondenseSuggested: false
  };
}

function labelFor(role: DiveRole): string {
  return role === 'user' ? '나' : '상대';
}

export function buildTranscript(messages: DiveMessage[]): string {
  return messages.map((m) => `${labelFor(m.role)}: ${m.text}`).join('\n');
}

export function buildRecentDialogue(session: DiveSession, limit = 6): string {
  const recent = session.chatBuffer.slice(-limit);
  return buildTranscript(recent);
}
