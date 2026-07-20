// Dive X 실시간 채팅 세션의 순수 도메인 — 버퍼 누적·응결 분기·컨텍스트 압축
import type { PlayTurnVerdict } from './playRuntimeValidator';
import type { EpisodeLengthPreset, SeriesProject } from './storyEngine';
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
  /** P2-d — 이 PLAY 세션에서 다음 응결에 쓸 회차 목표. 없으면 standard로 해석한다. */
  episodeLengthPreset?: EpisodeLengthPreset;
  scene?: string;
  arc?: StoryArc;
}

export interface CondenseSourceSpan {
  /** 생성 직전까지 이미 작품화된 마지막 turn. */
  afterTurn: number;
  /** 이번 생성 source가 캡처한 마지막 turn. */
  throughTurn: number;
  /** 생성 시작 순간 캡처한 미소비 메시지 ID. */
  messageIds: string[];
  /** 승인 뒤 PLAY 연결 문맥으로 남길 source tail(최대 2개). */
  continuityMessageIds: string[];
}

/**
 * 자동 재시도·승인이 같은 turn 번호의 다른 PLAY를 원문으로 오인하지 않게 하는
 * 충돌 없는 canonical source identity. 해시로 줄이지 않아 원문 차이를 잃지 않는다.
 */
export function buildCondenseSourceFingerprint(messages: DiveMessage[]): string {
  return JSON.stringify({
    schema: 'storyx/condense-source-fingerprint/v1',
    messages: messages.map((message) => [
      message.id,
      message.turn,
      message.role,
      message.text,
      Boolean(message.verdict?.blocksCanonization)
    ])
  });
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
  return selectCondenseSpan(session).condense.length >= CONDENSE_SUGGEST_TURNS;
}

export function selectCondenseSpan(session: DiveSession): {
  condense: DiveMessage[];
  keep: DiveMessage[];
} {
  return {
    condense: session.chatBuffer.filter((message) => message.turn > session.lastCondensedTurn),
    keep: session.chatBuffer.filter((message) => message.turn <= session.lastCondensedTurn)
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseMessageIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  if (ids.length !== value.length || new Set(ids).size !== ids.length) return undefined;
  return ids;
}

export function parseCondenseSourceSpan(value: unknown): CondenseSourceSpan | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (!isNonNegativeInteger(candidate.afterTurn) || !isNonNegativeInteger(candidate.throughTurn)) {
    return undefined;
  }
  if (candidate.throughTurn < candidate.afterTurn) return undefined;

  const messageIds = parseMessageIds(candidate.messageIds);
  const continuityMessageIds = parseMessageIds(candidate.continuityMessageIds);
  if (!messageIds || !continuityMessageIds || continuityMessageIds.length > CONDENSE_KEEP_RECENT) {
    return undefined;
  }
  const sourceIds = new Set(messageIds);
  if (continuityMessageIds.some((id) => !sourceIds.has(id))) return undefined;

  const emptyBoundary = candidate.afterTurn === candidate.throughTurn;
  if (emptyBoundary !== (messageIds.length === 0)) return undefined;
  if (messageIds.length !== candidate.throughTurn - candidate.afterTurn) return undefined;
  const expectedContinuityIds = messageIds.slice(-CONDENSE_KEEP_RECENT);
  if (
    continuityMessageIds.length !== expectedContinuityIds.length ||
    continuityMessageIds.some((id, index) => id !== expectedContinuityIds[index])
  ) return undefined;

  return {
    afterTurn: candidate.afterTurn,
    throughTurn: candidate.throughTurn,
    messageIds: [...messageIds],
    continuityMessageIds: [...continuityMessageIds]
  };
}

export function captureCondenseSourceSpan(session: DiveSession): CondenseSourceSpan {
  const { condense } = selectCondenseSpan(session);
  const messageIds = condense.map((message) => message.id);
  return {
    afterTurn: session.lastCondensedTurn,
    throughTurn: condense.at(-1)?.turn ?? session.lastCondensedTurn,
    messageIds,
    continuityMessageIds: messageIds.slice(-CONDENSE_KEEP_RECENT)
  };
}

function sourceSpanMatchesSession(session: DiveSession, value: unknown): CondenseSourceSpan | undefined {
  const span = parseCondenseSourceSpan(value);
  if (!span || session.lastCondensedTurn !== span.afterTurn) return undefined;
  const captured = session.chatBuffer.filter(
    (message) => message.turn > span.afterTurn && message.turn <= span.throughTurn
  );
  if (captured.length !== span.messageIds.length) return undefined;
  if (captured.some((message, index) => (
    message.id !== span.messageIds[index] ||
    message.turn !== span.afterTurn + index + 1
  ))) return undefined;
  if ((captured.at(-1)?.turn ?? span.afterTurn) !== span.throughTurn) return undefined;
  return span;
}

function sourceMessagesForSpan(session: DiveSession, sourceSpan: CondenseSourceSpan): DiveMessage[] {
  return session.chatBuffer.filter(
    (message) => message.turn > sourceSpan.afterTurn && message.turn <= sourceSpan.throughTurn
  );
}

export interface CondenseRetrySource {
  sourceSpan: CondenseSourceSpan;
  transcript: string;
}

/**
 * 재시도는 복구 TXT용 raw transcript를 생성 source로 승격하지 않는다.
 * root → recovery 순으로 현재 PLAY와 정확히 일치하는 frozen span만 재조립하고,
 * 차단 턴을 걸러 빈 source가 되면 fail-closed한다.
 */
export function resolveCondenseRetrySource(
  session: DiveSession,
  primarySourceSpan?: unknown,
  recoverySourceSpan?: unknown,
  expectedSourceFingerprint?: unknown
): CondenseRetrySource | undefined {
  if (typeof expectedSourceFingerprint !== 'string' || !expectedSourceFingerprint) return undefined;
  const candidates = [primarySourceSpan, recoverySourceSpan]
    .map((candidate) => sourceSpanMatchesSession(session, candidate))
    .filter((candidate): candidate is CondenseSourceSpan => Boolean(candidate));
  for (const sourceSpan of candidates) {
    if (sourceSpan.messageIds.length === 0) continue;
    const messages = sourceMessagesForSpan(session, sourceSpan);
    if (buildCondenseSourceFingerprint(messages) !== expectedSourceFingerprint) continue;
    const transcript = buildTranscript(messages.filter((message) => !message.verdict?.blocksCanonization));
    if (!transcript.trim()) continue;
    return { sourceSpan, transcript };
  }
  return undefined;
}

/**
 * 영수증의 exact 경계는 현재 승인 전 PLAY snapshot과 일치할 때만 신뢰한다.
 * 손상 root는 recovery exact로, 둘 다 불일치하면 검증 가능한 legacy 숫자 또는 0으로 강등한다.
 */
export function resolveCondenseSourceBoundary(
  session: DiveSession,
  primarySourceSpan?: unknown,
  recoverySourceSpan?: unknown,
  legacyBoundary?: unknown,
  expectedSourceFingerprint?: unknown
): CondenseSourceSpan | number | undefined {
  const matchesFingerprint = (span: CondenseSourceSpan | undefined): span is CondenseSourceSpan => Boolean(
    span && (
      typeof expectedSourceFingerprint !== 'string' ||
      !expectedSourceFingerprint ||
      buildCondenseSourceFingerprint(sourceMessagesForSpan(session, span)) === expectedSourceFingerprint
    )
  );
  const primary = sourceSpanMatchesSession(session, primarySourceSpan);
  if (matchesFingerprint(primary)) return primary;
  const recovery = sourceSpanMatchesSession(session, recoverySourceSpan);
  if (matchesFingerprint(recovery)) return recovery;
  // 현대 영수증의 source identity가 하나라도 존재하면 불일치를 legacy 숫자로
  // 강등하지 않는다. 숫자 fallback은 fingerprint 이전 영수증에만 허용한다.
  if (typeof expectedSourceFingerprint === 'string' && expectedSourceFingerprint) return undefined;
  const maxTurn = session.chatBuffer.at(-1)?.turn ?? session.lastCondensedTurn;
  return isNonNegativeInteger(legacyBoundary) && legacyBoundary <= maxTurn
    ? legacyBoundary
    : 0;
}

export function applyCondenseResult(session: DiveSession): DiveSession {
  return applyCondenseCheckpoint(session, captureCondenseSourceSpan(session));
}

// exact checkpoint는 생성 당시 source만 소비하고 tail 2개를 연결 문맥으로 남긴다.
// legacy 숫자 checkpoint는 과거 N-2 결과의 실제 경계까지만 제거한다.
export function applyCondenseCheckpoint(
  session: DiveSession,
  source: CondenseSourceSpan | number
): DiveSession {
  if (typeof source !== 'number') {
    const span = parseCondenseSourceSpan(source);
    if (!span) {
      return { ...session, pendingCondenseSuggested: false };
    }
    const continuityIds = new Set(span.continuityMessageIds);
    return {
      ...session,
      chatBuffer: session.chatBuffer.filter(
        (message) => message.turn > span.throughTurn || continuityIds.has(message.id)
      ),
      lastCondensedTurn: Math.max(session.lastCondensedTurn, span.throughTurn),
      pendingCondenseSuggested: false
    };
  }

  const boundary = isNonNegativeInteger(source) ? source : session.lastCondensedTurn;
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

// 응결 source에서 캐논화 차단(앵커 위반) 턴을 제외한 transcript. 정본 §7 하드 차단.
export function buildCondenseTranscript(session: DiveSession, sourceSpan?: CondenseSourceSpan): string {
  let condense: DiveMessage[];
  if (sourceSpan) {
    const span = parseCondenseSourceSpan(sourceSpan);
    if (!span) return '';
    const sourceIds = new Set(span.messageIds);
    condense = session.chatBuffer.filter((message) => sourceIds.has(message.id));
  } else {
    ({ condense } = selectCondenseSpan(session));
  }
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
