// 매체 인터뷰어 페르소나 공통 타입 — 에세이·소설·만화·오디오북 풀이 모두 이 인터페이스를 따른다.
// 매체별 도메인 디테일은 strengths·blockingSignals·matchKeywords 안에 풍부하게 담는다.
// 라이센스·인격권 면책: 실명 페르소나는 공인 작가의 공개 자료에서 추출한 craft 원칙·문장 스타일만 차용. 사적 영역 재현 금지.

export type MediaPersonaCategory = 'essay' | 'novel' | 'comic' | 'audiobook';

export interface MediaPersona {
  id: string;
  label: string;
  category: MediaPersonaCategory;
  tone: string;
  strengths: string[];
  questionStarters: string[];
  blockingSignals: string[];
  matchKeywords: string[];
  isFictionalized: boolean;
  references: string[];
}

export function scoreMediaPersona(
  persona: MediaPersona,
  freewrite: string,
  charLength: number
): number {
  let score = 0;
  for (const keyword of persona.matchKeywords) {
    if (freewrite.includes(keyword)) score += 2;
  }
  if (persona.isFictionalized) {
    if (charLength < 800) score += 3;
    else if (charLength > 2500) score -= 2;
  }
  return score;
}

export function pickFromMediaPool(
  pool: MediaPersona[],
  freewrite: string,
  charLength: number,
  topN = 3
): MediaPersona[] {
  const scored = pool.map((persona) => ({
    persona,
    score: scoreMediaPersona(persona, freewrite, charLength)
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.persona.isFictionalized === b.persona.isFictionalized ? 0 : a.persona.isFictionalized ? 1 : -1;
  });
  return scored.slice(0, Math.min(topN, scored.length)).map((entry) => entry.persona);
}

export function getPersonaFromPool<T extends MediaPersona>(pool: T[], id: string): T {
  const found = pool.find((persona) => persona.id === id);
  if (!found) {
    throw new Error(`Unknown persona id: ${id}`);
  }
  return found;
}
