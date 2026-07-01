// Dive X 로컬 브리지(/api/dive-chat·/api/dive-condense) fetch 래퍼
import { isValidProposal, type DiveProposal, type DiveSetup, type NoveltyLevel } from './diveProposal';

export interface DiveChatRequest {
  character: string;
  scene: string;
  context: string;
  dialogue: string;
  query: string;
  arc?: string;
}

export interface DiveChatResponse {
  status: string;
  reply: string;
  choices?: string[];
  arc?: { dramaticQuestion: string; tension: number; nextBeat: string };
  warning?: string;
}

export interface DiveCondenseRequest {
  character: string;
  scene: string;
  context: string;
  transcript: string;
  episode: number;
  arc?: string;
}

export interface DiveCondensePayload {
  status: string;
  title: string;
  hook: string;
  outline: string[];
  beats: Array<{ label: string; summary: string; tension: number }>;
  prose: string;
  newCanonFacts: Array<{ owner: string; statement: string }>;
  warning?: string;
}

// 코덱스가 멈춰도 영영 "입력 중…"에 갇히지 않도록 타임아웃. 응결(고급 모델)은 느려서 넉넉히 120초.
const DIVE_TIMEOUT_MS = 120000;

async function postJson<T>(route: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIVE_TIMEOUT_MS);
  try {
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function requestDiveChat(req: DiveChatRequest): Promise<DiveChatResponse> {
  return postJson<DiveChatResponse>('/api/dive-chat', req);
}

export function requestDiveCondense(req: DiveCondenseRequest): Promise<DiveCondensePayload> {
  return postJson<DiveCondensePayload>('/api/dive-condense', req);
}

export interface DiveShowrunnerRequest { scene: string; context: string; directive: string; }
export interface DiveShowrunnerResponse { status: string; reply: string; sceneUpdate: string; warning?: string; }

export function requestDiveShowrunner(req: DiveShowrunnerRequest): Promise<DiveShowrunnerResponse> {
  return postJson<DiveShowrunnerResponse>('/api/dive-showrunner', req);
}

export interface DiveProposalRequest { topic: string; novelty: NoveltyLevel; }
export interface DiveProposalResponse { status: string; proposals: DiveProposal[]; warning?: string; }

export async function requestDiveProposals(req: DiveProposalRequest): Promise<DiveProposalResponse> {
  const raw = await postJson<Partial<DiveProposalResponse>>('/api/dive-propose', req);
  const proposals = Array.isArray(raw.proposals) ? raw.proposals.filter(isValidProposal) : [];
  return { status: typeof raw.status === 'string' ? raw.status : 'complete', proposals, warning: raw.warning };
}

export interface DiveSetupRequest { story: string; }
export interface DiveSetupResponse { status: string; setup: DiveSetup | null; warning?: string; }

function isValidSetup(x: unknown): x is DiveSetup {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return typeof s.scene === 'string' && s.scene.trim() !== '' && Array.isArray(s.cast) && s.cast.length > 0;
}

export async function requestDiveSetup(req: DiveSetupRequest): Promise<DiveSetupResponse> {
  const raw = await postJson<Partial<DiveSetupResponse>>('/api/dive-setup', req);
  return {
    status: typeof raw.status === 'string' ? raw.status : 'complete',
    setup: isValidSetup(raw.setup) ? raw.setup : null,
    warning: raw.warning
  };
}

export interface ConsolidationFinding {
  claim: string;
  conflictsWith: string;
  evidence: string;
  severity: 'high' | 'low';
}
export interface DiveConsolidateRequest { prose: string; context: string; }
export interface DiveConsolidateResponse { status: string; findings: ConsolidationFinding[]; warning?: string; }

// LLM findings 견고 파싱 — 배열 아니면 [], claim 없으면 스킵, severity는 high|low만.
export function normalizeFindings(raw: unknown): ConsolidationFinding[] {
  if (!Array.isArray(raw)) return [];
  const out: ConsolidationFinding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const claim = typeof r.claim === 'string' ? r.claim.trim() : '';
    if (!claim) continue;
    out.push({
      claim,
      conflictsWith: typeof r.conflictsWith === 'string' ? r.conflictsWith.trim() : '',
      evidence: typeof r.evidence === 'string' ? r.evidence.trim() : '',
      severity: r.severity === 'high' ? 'high' : 'low'
    });
  }
  return out;
}

export async function requestDiveConsolidate(req: DiveConsolidateRequest): Promise<DiveConsolidateResponse> {
  const raw = await postJson<Partial<DiveConsolidateResponse>>('/api/dive-consolidate', req);
  return {
    status: typeof raw.status === 'string' ? raw.status : 'complete',
    findings: normalizeFindings(raw.findings),
    warning: raw.warning
  };
}
