// 초안 생성 진행 피드백 순수 로직 — 경과시간 포맷·단계별 안심 메시지가 결정론적인지 검증.
import { describe, expect, it } from 'vitest';
import {
  formatElapsed,
  generationStageMessage,
  GENERATION_TIME_HINT,
  interviewStageMessage,
  INTERVIEW_TIME_HINT,
} from './generationProgress';

describe('formatElapsed', () => {
  it('0초는 0:00', () => {
    expect(formatElapsed(0)).toBe('0:00');
  });
  it('초를 m:ss 로 zero-pad 한다', () => {
    expect(formatElapsed(7)).toBe('0:07');
    expect(formatElapsed(47)).toBe('0:47');
    expect(formatElapsed(83)).toBe('1:23');
    expect(formatElapsed(600)).toBe('10:00');
  });
  it('음수·NaN 은 0:00 로 방어한다', () => {
    expect(formatElapsed(-5)).toBe('0:00');
    expect(formatElapsed(Number.NaN)).toBe('0:00');
  });
});

describe('generationStageMessage', () => {
  it('경과 구간마다 다른 안심 메시지를 준다', () => {
    const s0 = generationStageMessage(3);
    const s1 = generationStageMessage(30);
    const s2 = generationStageMessage(70);
    const s3 = generationStageMessage(150);
    for (const s of [s0, s1, s2, s3]) {
      expect(s.length).toBeGreaterThan(0);
      expect(s.endsWith(':')).toBe(false); // 콜론 종결 금지
    }
    // 구간이 진행하며 메시지가 바뀐다(단조 진전 확인)
    expect(new Set([s0, s1, s2, s3]).size).toBe(4);
  });
  it('경계값에서 안정적이다(경계 직전/직후 동일 구간 아님)', () => {
    expect(generationStageMessage(0)).toBe(generationStageMessage(19));
    expect(generationStageMessage(20)).not.toBe(generationStageMessage(19));
  });
  it('아주 긴 대기도 마지막 구간 메시지로 수렴한다', () => {
    expect(generationStageMessage(400)).toBe(generationStageMessage(150));
  });
});

describe('GENERATION_TIME_HINT', () => {
  it('예상 소요 + 새로고침 금지를 안내한다(fetch 는 새로고침에 죽는다)', () => {
    expect(GENERATION_TIME_HINT).toContain('분');
    expect(GENERATION_TIME_HINT).toContain('새로고침');
    expect(GENERATION_TIME_HINT.endsWith(':')).toBe(false);
  });
});

describe('interviewStageMessage', () => {
  it('경과 구간마다 다른 안심 메시지를 준다', () => {
    const s0 = interviewStageMessage(3);
    const s1 = interviewStageMessage(25);
    const s2 = interviewStageMessage(60);
    for (const s of [s0, s1, s2]) {
      expect(s.length).toBeGreaterThan(0);
      expect(s.endsWith(':')).toBe(false); // 콜론 종결 금지
    }
    expect(new Set([s0, s1, s2]).size).toBe(3);
  });
  it('경계값에서 안정적이다', () => {
    expect(interviewStageMessage(0)).toBe(interviewStageMessage(14));
    expect(interviewStageMessage(15)).not.toBe(interviewStageMessage(14));
  });
  it('아주 긴 대기도 마지막 구간으로 수렴한다', () => {
    expect(interviewStageMessage(300)).toBe(interviewStageMessage(60));
  });
});

describe('INTERVIEW_TIME_HINT', () => {
  it('예상 소요 + 새로고침 금지를 안내한다(fetch 는 새로고침에 죽는다)', () => {
    expect(INTERVIEW_TIME_HINT).toContain('분');
    expect(INTERVIEW_TIME_HINT).toContain('새로고침');
    expect(INTERVIEW_TIME_HINT.endsWith(':')).toBe(false);
  });
});
