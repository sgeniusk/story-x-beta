// PLAN 설계 대화(설계실 2단계) — 엔티티 카탈로그·transcript·파트너 응답 정규화 순수 모듈. spec 2026-07-07.
import type { SeriesProject } from './storyEngine';

export type PlanChatRole = 'user' | 'partner';

export interface PlanChatProposal {
  kind: 'character' | 'world' | 'canon' | 'story-core';
  targetId?: string;
  targetLabel?: string;  // 카드 표시용 — 카탈로그에서 파생(인물 이름 등)
  field?: string;        // character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone
  after: string;
  rationale: string;
  approved?: boolean;    // 승인 후 ✓ 상태(버퍼에 영속)
}

export interface PlanChatMessage {
  id: string;
  role: PlanChatRole;
  text: string;
  proposals?: PlanChatProposal[];
}

export interface PlanChatTurn {
  reply: string;
  proposals: PlanChatProposal[];
}

export interface PlanChatCatalog {
  text: string;
  characterIds: Set<string>;
  worldIds: Set<string>;
  canonIds: Set<string>;
  targetLabels: Record<string, string>;
}

const CATALOG_VALUE_LIMIT = 80;
// buildProjectContextDigest 의 CONTEXT_CANON_LIMIT 선례(40) — 비export 라 자체 상수로 둔다.
const CATALOG_CANON_LIMIT = 40;
const TRANSCRIPT_LIMIT = 8;
const MAX_PROPOSALS_PER_TURN = 3;
const MAX_RATIONALE = 120;

const CHARACTER_FIELDS = new Set(['desire', 'wound', 'currentState']);
// 'title' 은 의도적 제외 — stageStoryCore('title')은 staged 가 아니라 본편 직행(spec §4.1 필수 핀).
const STORY_CORE_FIELDS = new Set(['logline', 'audiencePromise', 'deepQuestion', 'formIntent', 'tone']);

function clip(value: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > CATALOG_VALUE_LIMIT ? trimmed.slice(0, CATALOG_VALUE_LIMIT) : trimmed;
}

// 파트너가 실존 id 만 겨냥하도록 프롬프트에 싣는 카탈로그 + 정규화 검증용 id 집합.
export function buildPlanChatCatalog(project: SeriesProject): PlanChatCatalog {
  const lines: string[] = [];
  const targetLabels: Record<string, string> = {};
  lines.push('[인물]');
  for (const character of project.characters) {
    targetLabels[character.id] = character.name;
    lines.push(`- id=${character.id} ${character.name} · 욕망=${clip(character.desire)} · 상처=${clip(character.wound)} · 현재=${clip(character.currentState)}`);
  }
  lines.push('[세계 규칙]');
  for (const rule of project.worldRules) {
    targetLabels[rule.id] = clip(rule.title).slice(0, 24);
    lines.push(`- id=${rule.id} ${clip(rule.title)} — ${clip(rule.rule)}`);
  }
  lines.push('[캐논 — 최근 순]');
  const recentCanon = project.canonFacts.slice(-CATALOG_CANON_LIMIT);
  for (const fact of recentCanon) {
    targetLabels[fact.id] = clip(fact.statement).slice(0, 20);
    lines.push(`- id=${fact.id} ${clip(fact.statement)}`);
  }
  lines.push('[스토리 코어]');
  lines.push(`- logline=${clip(project.logline)}`);
  lines.push(`- audiencePromise=${clip(project.audiencePromise)}`);
  lines.push(`- deepQuestion=${clip(project.deepQuestion)}`);
  lines.push(`- formIntent=${clip(project.formIntent)}`);
  lines.push(`- tone=${clip(project.tone)}`);
  return {
    text: lines.join('\n'),
    characterIds: new Set(project.characters.map((c) => c.id)),
    worldIds: new Set(project.worldRules.map((r) => r.id)),
    canonIds: new Set(recentCanon.map((f) => f.id)),
    targetLabels
  };
}

export function buildPlanChatTranscript(messages: PlanChatMessage[], limit = TRANSCRIPT_LIMIT): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.role === 'user' ? '작가' : '파트너'}: ${m.text}`)
    .join('\n');
}

// provider 응답({ reply, proposals })을 정규화 — 무효 제안은 조용히 드랍(강등 관례), reply 비면 턴 실패(null).
export function normalizePlanChatResponse(raw: unknown, catalog: PlanChatCatalog): PlanChatTurn | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const reply = typeof record.reply === 'string' ? record.reply.trim() : '';
  if (!reply) return null;
  const list = Array.isArray(record.proposals) ? record.proposals : [];
  const seen = new Set<string>();
  const proposals: PlanChatProposal[] = [];
  for (const item of list) {
    if (proposals.length >= MAX_PROPOSALS_PER_TURN) break;
    if (typeof item !== 'object' || item === null) continue;
    const p = item as Record<string, unknown>;
    const kind = typeof p.kind === 'string' ? p.kind : '';
    const after = typeof p.after === 'string' ? p.after.trim() : '';
    if (!after) continue;
    const targetId = typeof p.targetId === 'string' ? p.targetId : '';
    const field = typeof p.field === 'string' ? p.field : '';
    if (kind === 'character') {
      if (!catalog.characterIds.has(targetId) || !CHARACTER_FIELDS.has(field)) continue;
    } else if (kind === 'world') {
      if (!catalog.worldIds.has(targetId)) continue;
    } else if (kind === 'canon') {
      if (!catalog.canonIds.has(targetId)) continue;
    } else if (kind === 'story-core') {
      if (!STORY_CORE_FIELDS.has(field)) continue;
    } else {
      continue;
    }
    const dedupKey = `${kind}:${targetId}:${field}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    const rationale = typeof p.rationale === 'string' ? p.rationale.trim().slice(0, MAX_RATIONALE) : '';
    const isEntityKind = kind === 'character' || kind === 'world' || kind === 'canon';
    const targetLabel =
      isEntityKind && Object.prototype.hasOwnProperty.call(catalog.targetLabels, targetId)
        ? catalog.targetLabels[targetId]
        : undefined;
    proposals.push({
      kind: kind as PlanChatProposal['kind'],
      ...(isEntityKind ? { targetId } : {}),
      ...(targetLabel ? { targetLabel } : {}),
      ...(field && (kind === 'character' || kind === 'story-core') ? { field } : {}),
      after,
      rationale
    });
  }
  return { reply, proposals };
}
