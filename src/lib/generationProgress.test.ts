// 초안 생성 진행 피드백 순수 로직 — 경과시간 포맷·단계별 안심 메시지가 결정론적인지 검증.
import { describe, expect, it } from 'vitest';
import {
  elapsedSecondsSince,
  formatElapsed,
  generationStageMessage,
  GENERATION_TIME_HINT,
  interviewStageMessage,
  INTERVIEW_TIME_HINT,
  playProgressPresentation,
  type PlayProgressKind,
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

describe('PLAY progress presentation', () => {
  const kinds: PlayProgressKind[] = [
    'dialogue', 'showrunner', 'candidates', 'condense-register', 'condense'
  ];

  it('각 비동기 작업을 사용자가 구분할 수 있는 label과 정직한 hint로 설명한다', () => {
    expect(kinds.map((kind) => playProgressPresentation(kind, 0).label)).toEqual([
      '다음 대화', '쇼러너 연출', '전개 후보', '응결 등록', '회차 응결'
    ]);
    for (const kind of kinds) {
      const presentation = playProgressPresentation(kind, 0);
      expect(presentation.message.length).toBeGreaterThan(0);
      expect(presentation.hint.length).toBeGreaterThan(0);
      expect(`${presentation.message} ${presentation.hint}`).not.toMatch(/\d+%|남은 시간|완료 임박/);
    }
    expect(playProgressPresentation('candidates', 0).hint).toContain('30초');
    expect(playProgressPresentation('condense-register', 0).hint).toContain('등록되면 화면을 떠나도');
    expect(playProgressPresentation('condense', 0).hint).toContain('화면을 떠나도 작업은 계속되고');
    expect(playProgressPresentation('condense', 0).hint).toContain('생성 보관함');
    expect(playProgressPresentation('dialogue', 0).hint).not.toContain('화면을 떠나도');
  });

  it('대화·쇼러너·후보·등록은 경과 구간에 따라 목적 문구가 바뀌고 마지막 문구로 수렴한다', () => {
    expect(playProgressPresentation('dialogue', 11).message)
      .not.toBe(playProgressPresentation('dialogue', 12).message);
    expect(playProgressPresentation('dialogue', 29).message)
      .not.toBe(playProgressPresentation('dialogue', 30).message);
    expect(playProgressPresentation('dialogue', 300).message)
      .toBe(playProgressPresentation('dialogue', 30).message);

    expect(playProgressPresentation('showrunner', 11).message)
      .not.toBe(playProgressPresentation('showrunner', 12).message);
    expect(playProgressPresentation('showrunner', 29).message)
      .not.toBe(playProgressPresentation('showrunner', 30).message);
    expect(playProgressPresentation('showrunner', 300).message)
      .toBe(playProgressPresentation('showrunner', 30).message);

    expect(playProgressPresentation('candidates', 9).message)
      .not.toBe(playProgressPresentation('candidates', 10).message);
    expect(playProgressPresentation('candidates', 24).message)
      .not.toBe(playProgressPresentation('candidates', 25).message);
    expect(playProgressPresentation('candidates', 300).message)
      .toBe(playProgressPresentation('candidates', 25).message);

    expect(playProgressPresentation('condense-register', 4).message)
      .not.toBe(playProgressPresentation('condense-register', 5).message);
    expect(playProgressPresentation('condense-register', 300).message)
      .toBe(playProgressPresentation('condense-register', 5).message);
  });

  it('응결은 원문 정리→장면 구성→보이스·연속성→마무리 순서로 안내한다', () => {
    const messages = [0, 25, 70, 130].map((elapsed) =>
      playProgressPresentation('condense', elapsed).message
    );
    expect(new Set(messages).size).toBe(4);
    expect(messages[0]).toContain('원문');
    expect(messages[1]).toContain('장면');
    expect(messages[2]).toMatch(/보이스|연속성/);
    expect(playProgressPresentation('condense', 600).message).toBe(messages[3]);
  });
});

describe('elapsedSecondsSince', () => {
  const now = Date.parse('2026-07-18T00:02:03Z');

  it('millisecond와 ISO 시작점을 같은 경과 초로 계산한다', () => {
    expect(elapsedSecondsSince(now - 83_999, now)).toBe(83);
    expect(elapsedSecondsSince('2026-07-18T00:01:00Z', now)).toBe(63);
  });

  it('미래·손상·누락 timestamp와 잘못된 now를 0초로 안전 강등한다', () => {
    expect(elapsedSecondsSince(-1, now)).toBe(0);
    expect(elapsedSecondsSince(now + 1_000, now)).toBe(0);
    expect(elapsedSecondsSince('not-a-date', now)).toBe(0);
    expect(elapsedSecondsSince(undefined, now)).toBe(0);
    expect(elapsedSecondsSince(now, Number.NaN)).toBe(0);
  });
});
