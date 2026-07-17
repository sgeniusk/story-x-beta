// Dive X 실시간 채팅 세션의 순수 도메인 — 버퍼 누적·응결 분기·컨텍스트 압축
import type { PlayTurnVerdict } from './playRuntimeValidator';
import type { SeriesProject } from './storyEngine';
import type { VsCandidatesInput } from './vsCandidatesClient';
// episodeBriefing 은 런타임 import 가 전부 type-only 라 순환 없음.
import { collectUnpaidPromises } from './episodeBriefing';

export type DiveRole = 'user' | 'character';

export interface DiveMessage {
  id: string;
  role: DiveRole;
  text: string;
  turn: number;
  /** MVP-1 — PLAY 런타임 검증 결과. 캐릭터 답에만, 구버전/유저 메시지는 undefined. */
  verdict?: PlayTurnVerdict;
}

export interface StoryArc {
  dramaticQuestion: string;
  tension: number;
  nextBeat: string;
}

export interface DiveSession {
  characterId: string;
  projectId: string;
  chatBuffer: DiveMessage[];
  lastCondensedTurn: number;
  pendingCondenseSuggested: boolean;
  scene?: string;
  arc?: StoryArc;
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

export function appendMessage(
  session: DiveSession,
  role: DiveRole,
  text: string,
  verdict?: PlayTurnVerdict
): DiveSession {
  const lastTurn = session.chatBuffer.length
    ? session.chatBuffer[session.chatBuffer.length - 1].turn
    : session.lastCondensedTurn;
  const turn = lastTurn + 1;
  const message: DiveMessage = { id: `msg-${turn}`, role, text, turn, verdict };
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

// write-ahead checkpoint 재개는 현재 버퍼를 다시 N-2 방식으로 자르지 않는다.
// 최초 승인 때 실제로 응결한 turn 경계까지만 제거해, 부분 성공 뒤 이어진 PLAY 대화를 보존한다.
export function applyCondenseCheckpoint(
  session: DiveSession,
  condensedThroughTurn: number
): DiveSession {
  const boundary = Number.isInteger(condensedThroughTurn) && condensedThroughTurn >= 0
    ? condensedThroughTurn
    : session.lastCondensedTurn;
  return {
    ...session,
    chatBuffer: session.chatBuffer.filter((message) => message.turn > boundary),
    lastCondensedTurn: Math.max(session.lastCondensedTurn, boundary),
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

// PLAY 전개 후보 선택을 채팅에 태울 연출 지시 — ⏳계속·⏭전개과 같은 괄호 연출문 계열.
export function buildPlayDirectionSeed(direction: string): string {
  return `(전개 — ${direction.trim()})`;
}

// PLAY 런타임 상태(라이브 대화·장면·캐논) → VS 전개 후보 요청 입력.
// WRITE(StoryXDesk) 매핑을 미러링하되, recentSummary 만 "지난 회차"가 아니라 라이브 대화로 만든다.
export function buildVsCandidatesInput(session: DiveSession, project: SeriesProject): VsCandidatesInput {
  const scene = session.scene?.trim() ?? '';
  const recentSummary = [scene, buildRecentDialogue(session)].filter((s) => s.length > 0).join('\n');
  return {
    medium: project.medium ?? '',
    format: project.format ?? '',
    recentSummary,
    unpaidPromises: collectUnpaidPromises(project),
    canonStatements: project.canonFacts.map((f) => f.statement)
  };
}

// 응결 대상 span에서 캐논화 차단(앵커 위반) 턴을 제외한 transcript. 정본 §7 하드 차단.
export function buildCondenseTranscript(session: DiveSession): string {
  const { condense } = selectCondenseSpan(session);
  return buildTranscript(condense.filter((m) => !m.verdict?.blocksCanonization));
}

// 한 줄: "이름: 대사" → 화자 대사, 그 외 → 내레이션. 이름은 1~20자·별표 없음.
export interface SceneSegment {
  kind: 'narration' | 'dialogue';
  speaker?: string;
  text: string;
}

const SPEAKER_LINE = /^([^:：\n]{1,20})[:：]\s*(.+)$/;

export function parseSceneSegments(text: string): SceneSegment[] {
  const out: SceneSegment[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(SPEAKER_LINE);
    if (m && m[1].trim() && !m[1].includes('*')) {
      out.push({ kind: 'dialogue', speaker: m[1].trim(), text: m[2].trim() });
    } else {
      out.push({ kind: 'narration', text: line });
    }
  }
  return out;
}
