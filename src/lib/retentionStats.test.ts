// target/habit 이원 리텐션(B2) — habit 계산 순수 모듈 테스트
import { describe, it, expect } from 'vitest';
import {
  recordWritingDay,
  computeRetentionStats,
  isValidDayStr,
  emptyWritingLog,
  normalizeWritingLog,
} from './retentionStats';

describe('recordWritingDay — 활동일 기록(dedup·정렬)', () => {
  it('새 날짜를 추가하고 정렬한다', () => {
    const log = recordWritingDay({ activeDays: ['2026-06-20'] }, '2026-06-18');
    expect(log.activeDays).toEqual(['2026-06-18', '2026-06-20']);
  });

  it('같은 날 중복은 무시(참조 동일 no-op)', () => {
    const base = { activeDays: ['2026-06-20'] };
    const next = recordWritingDay(base, '2026-06-20');
    expect(next).toBe(base);
  });

  it('무효 dateStr 은 기록 안 함(참조 동일)', () => {
    const base = { activeDays: ['2026-06-20'] };
    expect(recordWritingDay(base, '오늘')).toBe(base);
    expect(recordWritingDay(base, '2026-13-40')).toBe(base);
  });
});

describe('computeRetentionStats — habit 지표', () => {
  it('오늘까지 연속 3일이면 currentStreak=3, activeToday=true', () => {
    const stats = computeRetentionStats(
      { activeDays: ['2026-06-20', '2026-06-21', '2026-06-22'] },
      '2026-06-22'
    );
    expect(stats.currentStreak).toBe(3);
    expect(stats.activeToday).toBe(true);
  });

  it('어제까지 이어졌으면 오늘 안 써도 streak 유지(activeToday=false)', () => {
    const stats = computeRetentionStats(
      { activeDays: ['2026-06-20', '2026-06-21'] },
      '2026-06-22'
    );
    expect(stats.currentStreak).toBe(2);
    expect(stats.activeToday).toBe(false);
  });

  it('마지막 활동일이 그제(today-2)면 끊김 currentStreak=0', () => {
    const stats = computeRetentionStats({ activeDays: ['2026-06-20'] }, '2026-06-22');
    expect(stats.currentStreak).toBe(0);
  });

  it('longestStreak 은 끊김과 무관한 전체 최장 연속', () => {
    const stats = computeRetentionStats(
      { activeDays: ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-10'] },
      '2026-06-22'
    );
    expect(stats.longestStreak).toBe(3);
    expect(stats.currentStreak).toBe(0);
  });

  it('thisWeekDays 는 최근 7일[today-6,today] 안의 활동일 수', () => {
    const stats = computeRetentionStats(
      { activeDays: ['2026-06-15', '2026-06-16', '2026-06-22'] }, // 06-15는 today-7(제외)
      '2026-06-22'
    );
    expect(stats.thisWeekDays).toBe(2); // 06-16, 06-22
  });

  it('빈 로그는 전부 0, lastActiveDay null', () => {
    const stats = computeRetentionStats(emptyWritingLog(), '2026-06-22');
    expect(stats).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      thisWeekDays: 0,
      totalDays: 0,
      lastActiveDay: null,
      activeToday: false,
    });
  });
});

describe('isValidDayStr / normalizeWritingLog', () => {
  it('isValidDayStr — 형식·실재 날짜 가드', () => {
    expect(isValidDayStr('2026-06-22')).toBe(true);
    expect(isValidDayStr('2026-6-2')).toBe(false);
    expect(isValidDayStr('nope')).toBe(false);
    expect(isValidDayStr('2026-13-40')).toBe(false);
  });

  it('normalizeWritingLog — 무효/비배열은 빈 로그, 유효분만 dedup·정렬', () => {
    expect(normalizeWritingLog(undefined)).toEqual({ activeDays: [] });
    expect(normalizeWritingLog({ activeDays: 'x' })).toEqual({ activeDays: [] });
    expect(
      normalizeWritingLog({ activeDays: ['2026-06-20', 'bad', '2026-06-18', '2026-06-20'] })
    ).toEqual({ activeDays: ['2026-06-18', '2026-06-20'] });
  });
});
