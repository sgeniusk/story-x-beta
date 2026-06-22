// 집필 일관성(habit) 추적 — 활동일 배열에서 streak·최장연속·주간 달성을 결정론으로 계산하는 순수 모듈
// today/dateStr 를 주입받아 Date 현재시각·random 을 쓰지 않는다(storyEngine 순수성과 동형).

export interface WritingLog {
  /** YYYY-MM-DD 활동일 목록 — 항상 dedup·오름차순 정렬 상태를 유지한다. */
  activeDays: string[];
}

export interface RetentionStats {
  currentStreak: number; // today 또는 어제까지 이어진 연속일, 끊기면 0
  longestStreak: number; // 전체 이력 최장 연속
  thisWeekDays: number; // 최근 7일[today-6, today] 중 활동일 수 (0~7)
  totalDays: number; // 누적 활동일 수
  lastActiveDay: string | null;
  activeToday: boolean; // 마지막 활동일이 오늘인가 (배지 톤 분기)
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyWritingLog(): WritingLog {
  return { activeDays: [] };
}

// YYYY-MM-DD → UTC 자정 기준 epoch day(정수). 고정 입력→고정 출력이라 순수. 타임존 드리프트 회피.
function toEpochDay(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function isValidDayStr(s: string): boolean {
  if (typeof s !== 'string' || !DAY_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // 실재 날짜인지 round-trip 검증(2026-13-40 류 차단)
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function recordWritingDay(log: WritingLog, dateStr: string): WritingLog {
  if (!isValidDayStr(dateStr)) return log;
  if (log.activeDays.includes(dateStr)) return log;
  return { activeDays: [...log.activeDays, dateStr].sort() };
}

export function normalizeWritingLog(raw: unknown): WritingLog {
  if (!raw || typeof raw !== 'object') return emptyWritingLog();
  const days = (raw as { activeDays?: unknown }).activeDays;
  if (!Array.isArray(days)) return emptyWritingLog();
  const activeDays = [
    ...new Set(days.filter((d): d is string => typeof d === 'string' && isValidDayStr(d))),
  ].sort();
  return { activeDays };
}

export function computeRetentionStats(log: WritingLog, today: string): RetentionStats {
  const valid = [...new Set(log.activeDays.filter(isValidDayStr))].sort();
  if (valid.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      thisWeekDays: 0,
      totalDays: 0,
      lastActiveDay: null,
      activeToday: false,
    };
  }
  const epochs = valid.map(toEpochDay);
  const todayEpoch = toEpochDay(today);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < epochs.length; i += 1) {
    if (epochs[i] === epochs[i - 1] + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const last = epochs[epochs.length - 1];
  let current = 0;
  if (last === todayEpoch || last === todayEpoch - 1) {
    current = 1;
    for (let i = epochs.length - 2; i >= 0; i -= 1) {
      if (epochs[i] === epochs[i + 1] - 1) current += 1;
      else break;
    }
  }

  const weekStart = todayEpoch - 6;
  const thisWeekDays = epochs.filter((e) => e >= weekStart && e <= todayEpoch).length;

  return {
    currentStreak: current,
    longestStreak: longest,
    thisWeekDays,
    totalDays: valid.length,
    lastActiveDay: valid[valid.length - 1],
    activeToday: last === todayEpoch,
  };
}
