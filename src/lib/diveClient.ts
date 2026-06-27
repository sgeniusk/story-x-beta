// Dive X 로컬 브리지(/api/dive-chat·/api/dive-condense) fetch 래퍼

export interface DiveChatRequest {
  character: string;
  scene: string;
  context: string;
  dialogue: string;
  query: string;
}

export interface DiveChatResponse {
  status: string;
  reply: string;
  warning?: string;
}

export interface DiveCondenseRequest {
  character: string;
  scene: string;
  context: string;
  transcript: string;
  episode: number;
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

async function postJson<T>(route: string, body: unknown): Promise<T> {
  const res = await fetch(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return (await res.json()) as T;
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
