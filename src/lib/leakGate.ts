// AI 누수 방지 게이트 — 회차 본문의 프롬프트/지시문 잔여·AI 상투구 탐지 (B1)
// 정본 — docs/superpowers/specs/2026-06-21-ai-leak-gate-design.md.
// 결정론 휴리스틱(정규식). ML 탐지기는 창작물 오탐이 커서 배제 — 명백한 누수 아티팩트만 잡는다.
import { inspectKoreanVoice, type KoreanVoiceFlag } from './koreanVoiceGate';

export type PromptLeakKind = 'llm-meta' | 'english-ai' | 'role-marker' | 'markdown-residue';

export interface PromptLeakHit {
  kind: PromptLeakKind;
  /** 매치된 누수 텍스트(최대 40자) — 작가에게 위치를 보여주기 위함. */
  evidence: string;
  /** 본문 내 문자 인덱스. */
  index: number;
}

export interface LeakReport {
  /** 차단 근거 — 프롬프트/지시문 잔여. */
  promptLeaks: PromptLeakHit[];
  /** 경고 — AI 상투구·기계 문체(koreanVoiceGate 재사용). */
  clicheFlags: KoreanVoiceFlag[];
  /** promptLeaks 가 하나라도 있으면 true(회차 확정 차단). */
  blocked: boolean;
}

// LLM 메타 응답 — 작가가 본문에 쓸 일이 거의 없는, 모델이 답을 시작/마무리할 때의 상투.
const LLM_META: RegExp[] = [
  /물론입니다/,
  /다음은[^\n]{0,40}(입니다|이에요|예요)/,
  /(작성|서술|이어서\s*쓰|계속\s*쓰)(하겠|해\s*드리겠|하도록\s*하겠)습니다/,
  /요청하신\s*대로/,
  /도움이\s*되었기를/
];

// 영어 AI 출력 누수 — 한국어 본문에 섞인 영어 모델 상투.
const ENGLISH_AI: RegExp[] = [
  /\bas an AI\b/i,
  /\bas a language model\b/i,
  /\bI cannot\b/,
  /\bI can't\b/,
  /\bsure,\s*here\b/i,
  /\bcertainly,/i,
  /\bhere(?:'s| is) the\b/i,
  /\bI hope this helps\b/i,
  /\bI apologize, but\b/i
];

// 대화/지시 역할 잔여 — 줄 시작에만(본문 중간의 콜론은 정상).
const ROLE_MARKER: RegExp[] = [
  /^\s*(사용자|어시스턴트|시스템|system|user|assistant|프롬프트|prompt)\s*[:：]/im,
  /\[지시/,
  /<\|/
];

function pushMatches(text: string, patterns: RegExp[], kind: PromptLeakKind, hits: PromptLeakHit[]): void {
  for (const pattern of patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      hits.push({ kind, evidence: match[0].trim().slice(0, 40), index: match.index });
      if (match.index === re.lastIndex) re.lastIndex += 1; // zero-width 가드
    }
  }
}

// 산문에 안 어울리는 구조 마커 — 줄 시작 헤딩/코드펜스, 또는 리스트 마커 연속 3줄 이상.
function detectMarkdownResidue(text: string): PromptLeakHit[] {
  const hits: PromptLeakHit[] = [];
  const lines = text.split('\n');
  let offset = 0;
  let listRun = 0;
  let listRunStart = 0;
  for (const line of lines) {
    if (/^\s*(#{2,}\s|```)/.test(line)) {
      hits.push({ kind: 'markdown-residue', evidence: line.trim().slice(0, 40), index: offset });
    }
    if (/^\s*([-*]\s|\d+\.\s)/.test(line)) {
      if (listRun === 0) listRunStart = offset;
      listRun += 1;
    } else {
      if (listRun >= 3) hits.push({ kind: 'markdown-residue', evidence: '연속 리스트 마커', index: listRunStart });
      listRun = 0;
    }
    offset += line.length + 1;
  }
  if (listRun >= 3) hits.push({ kind: 'markdown-residue', evidence: '연속 리스트 마커', index: listRunStart });
  return hits;
}

// 본문에서 프롬프트/지시문 잔여 누수를 모두 찾아 인덱스 순으로 반환한다. 빈 텍스트는 누수 0.
export function detectPromptLeak(text: string): PromptLeakHit[] {
  if (!text || !text.trim()) return [];
  const hits: PromptLeakHit[] = [];
  pushMatches(text, LLM_META, 'llm-meta', hits);
  pushMatches(text, ENGLISH_AI, 'english-ai', hits);
  pushMatches(text, ROLE_MARKER, 'role-marker', hits);
  hits.push(...detectMarkdownResidue(text));
  return hits.sort((a, b) => a.index - b.index);
}

// 통합 리포트 — 프롬프트 누수(차단) + 상투구 flag(경고).
export function inspectLeak(text: string): LeakReport {
  const promptLeaks = detectPromptLeak(text);
  const clicheFlags = inspectKoreanVoice(text).flags;
  return { promptLeaks, clicheFlags, blocked: promptLeaks.length > 0 };
}
