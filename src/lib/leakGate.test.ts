// AI 누수 방지 게이트 — leakGate 순수 모듈 테스트 (B1)
import { describe, it, expect } from 'vitest';
import { detectPromptLeak, inspectLeak } from './leakGate';

describe('detectPromptLeak — 프롬프트/지시문 누수 4범주', () => {
  it('llm-meta — LLM 메타 응답 문장을 잡는다', () => {
    const hits = detectPromptLeak('물론입니다, 다음 장면을 작성하겠습니다.\n\n비가 내렸다.');
    expect(hits.some((h) => h.kind === 'llm-meta')).toBe(true);
  });

  it('english-ai — 영어 AI 출력 누수를 잡는다', () => {
    const hits = detectPromptLeak('As an AI, I cannot continue. 그는 걸었다.');
    expect(hits.some((h) => h.kind === 'english-ai')).toBe(true);
  });

  it('role-marker — 줄 시작 역할 잔여를 잡는다', () => {
    const hits = detectPromptLeak('사용자: 다음 회차 써줘\n\n그녀는 멈췄다.');
    expect(hits.some((h) => h.kind === 'role-marker')).toBe(true);
  });

  it('markdown-residue — 산문에 안 어울리는 구조 마커를 잡는다', () => {
    const hits = detectPromptLeak('## 1장\n\n- 첫째\n- 둘째\n- 셋째');
    expect(hits.some((h) => h.kind === 'markdown-residue')).toBe(true);
  });

  it('오탐 가드 — 정상 한국어 산문은 누수 0', () => {
    const hits = detectPromptLeak('그는 물론 그녀를 사랑했다. 다음 날 아침이 밝았다. 창밖으로 새가 울었다.');
    expect(hits).toHaveLength(0);
  });

  it('빈 텍스트는 누수 0', () => {
    expect(detectPromptLeak('')).toHaveLength(0);
  });
});

describe('inspectLeak — 통합 리포트', () => {
  it('프롬프트 누수가 있으면 blocked=true', () => {
    const report = inspectLeak('물론입니다, 다음 장면을 작성하겠습니다.\n\n비가 내렸다.');
    expect(report.blocked).toBe(true);
    expect(report.promptLeaks.length).toBeGreaterThan(0);
  });

  it('깨끗한 본문은 blocked=false, promptLeaks 0', () => {
    const report = inspectLeak('비가 내렸다. 그는 우산 없이 걸었다. 골목 끝에서 그녀가 기다리고 있었다.');
    expect(report.blocked).toBe(false);
    expect(report.promptLeaks).toHaveLength(0);
  });

  it('clicheFlags 를 koreanVoiceGate 에서 가져온다(필드 존재)', () => {
    const report = inspectLeak('비가 내렸다.');
    expect(Array.isArray(report.clicheFlags)).toBe(true);
  });
});
