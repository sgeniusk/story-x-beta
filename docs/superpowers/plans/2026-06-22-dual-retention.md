# target/habit 이원 리텐션 (B2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 작가의 집필 일관성(habit)을 활동일 기준 streak로 추적해 산출 진도(target)와 별개 1급 지표로 노출한다.

**Architecture:** `retentionStats.ts` 순수 모듈이 활동일 배열에서 streak·최장연속·주간 달성을 결정론으로 계산한다(today 주입). `SeriesProject.writingLog`에 활동일을 영속하고, StoryXDesk가 편집·생성·확정 3지점에서 오늘 날짜를 기록한다. FloatingEditor가 streak 배지(상시)와 지표 패널 리텐션 섹션을 표시한다.

**Tech Stack:** TypeScript · React · Vitest · 기존 영속(localStorage `saveProject`)·순수성(Date 주입) 패턴 재사용.

설계 정본 — `docs/superpowers/specs/2026-06-22-dual-retention-design.md`.

---

### Task 1: retentionStats.ts 순수 계산 모듈

활동일 배열에서 streak·최장연속·주간·총일수를 결정론으로 계산. `Date` 현재시각·random 미사용(today/dateStr 주입). storyEngine 순수성과 동형.

**Files:**
- Create: `src/lib/retentionStats.ts`
- Test: `src/lib/retentionStats.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/retentionStats.test.ts`:
```ts
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
  });

  it('normalizeWritingLog — 무효/비배열은 빈 로그, 유효분만 dedup·정렬', () => {
    expect(normalizeWritingLog(undefined)).toEqual({ activeDays: [] });
    expect(normalizeWritingLog({ activeDays: 'x' })).toEqual({ activeDays: [] });
    expect(
      normalizeWritingLog({ activeDays: ['2026-06-20', 'bad', '2026-06-18', '2026-06-20'] })
    ).toEqual({ activeDays: ['2026-06-18', '2026-06-20'] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/retentionStats.test.ts`
Expected: FAIL — `Cannot find module './retentionStats'`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/retentionStats.ts`:
```ts
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
  const activeDays = [...new Set(days.filter((d): d is string => typeof d === 'string' && isValidDayStr(d)))].sort();
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/retentionStats.test.ts`
Expected: PASS (모든 it 녹색).

- [ ] **Step 5: Commit**

```bash
git add src/lib/retentionStats.ts src/lib/retentionStats.test.ts
git commit -m "feat(quality): retentionStats 순수 모듈 — 활동일 streak·최장연속·주간 결정론 계산 (B2)"
```

---

### Task 2: SeriesProject.writingLog 필드 + normalizeProject 백필

활동일을 project 에 영속한다. 구버전 저장본 호환(`nextEpisodeIntent` 백필과 동형). `WritingLog` 는 type-only import 로 가져와 순환 의존을 피한다.

**Files:**
- Modify: `src/lib/storyEngine.ts:313-352` (SeriesProject interface)
- Modify: `src/lib/storage.ts:228-264` (normalizeProject)
- Test: `src/lib/storyEngine.test.ts` (백필 검증)

- [ ] **Step 1: Write the failing test**

`src/lib/storyEngine.test.ts` 에 추가(파일 맨 끝 describe 블록 또는 normalizeProject 관련 위치):
```ts
import { normalizeProject } from './storage';
// ↑ 이미 import 돼 있으면 생략

describe('B2 — writingLog 백필', () => {
  it('writingLog 없는 구버전 프로젝트는 빈 활성일로 백필', () => {
    const base = createEmptyProject('소설', 'novel'); // 기존 헬퍼 시그니처에 맞춰 호출
    const stripped = { ...base } as Record<string, unknown>;
    delete stripped.writingLog;
    const normalized = normalizeProject(stripped as typeof base);
    expect(normalized.writingLog).toEqual({ activeDays: [] });
  });

  it('비정렬·중복 activeDays 는 정렬·dedup', () => {
    const base = createEmptyProject('소설', 'novel');
    const withLog = { ...base, writingLog: { activeDays: ['2026-06-20', '2026-06-18', '2026-06-20'] } };
    const normalized = normalizeProject(withLog);
    expect(normalized.writingLog).toEqual({ activeDays: ['2026-06-18', '2026-06-20'] });
  });
});
```
> 주의 — `createEmptyProject` 의 실제 시그니처를 먼저 확인(`grep -n "export function createEmptyProject" src/lib/storyEngine.ts`)하고 인자를 맞춘다. 테스트 목적은 백필이므로 어떤 유효 프로젝트든 무방.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "writingLog 백필"`
Expected: FAIL — `normalized.writingLog` 가 undefined (백필 미구현).

- [ ] **Step 3: Write minimal implementation**

`src/lib/storyEngine.ts` — import 구역(상단)에 type-only import 추가:
```ts
import type { WritingLog } from './retentionStats';
```

`src/lib/storyEngine.ts:333` 의 `nextEpisodeIntent?: string;` 다음 줄에 필드 추가:
```ts
  /** B2 — target/habit 이원 리텐션 중 habit 측. 활동일(YYYY-MM-DD) 목록. 구버전 저장본엔 없을 수 있다. */
  writingLog?: WritingLog;
```

`src/lib/storage.ts` — import 에 `normalizeWritingLog` 추가:
```ts
import { normalizeWritingLog } from './retentionStats';
```
`src/lib/storage.ts:238` 의 `nextEpisodeIntent: ...` 줄 다음에 백필 추가:
```ts
    writingLog: normalizeWritingLog(project.writingLog),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storyEngine.test.ts -t "writingLog 백필"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyEngine.ts src/lib/storage.ts src/lib/storyEngine.test.ts
git commit -m "feat(quality): SeriesProject.writingLog 필드 + normalizeProject 백필 (B2)"
```

---

### Task 3: 활동 기록 배선 (StoryXDesk — 편집·생성·확정 3지점)

작가가 본문을 편집(자동저장)·회차 생성·회차 확정할 때 오늘 날짜를 `writingLog` 에 기록한다. `todayStr()`(로컬 YYYY-MM-DD)는 UI 레이어라 `Date` 허용. `withWritingDay` 는 `recordWritingDay` 를 project 레벨로 감싼 순수 헬퍼.

**Files:**
- Modify: `src/StoryXDesk.tsx` (헬퍼 2개 + 3지점 합성)
- Test: `src/editorFocusLayout.test.ts` (소스 핀)

- [ ] **Step 1: Write the failing test**

먼저 정확한 배선 코드를 확인한다:
```
grep -nE "async function produceEpisode|setProject\(result.updatedProject\)|function confirmChapterLock" src/StoryXDesk.tsx
```
produceEpisode(2018~) 내부에서 성공 시 project 를 setProject 하는 정확한 줄, confirmChapterLock(2352~) 의 `locked` 생성 줄을 눈으로 확인한다.

`src/editorFocusLayout.test.ts` 에 소스 핀 추가(이 프로젝트의 소스-문자열 핀 패턴):
```ts
it('B2 — StoryXDesk 가 편집·생성·확정 3지점에서 활동일을 기록한다', () => {
  const src = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf-8');
  // todayStr/withWritingDay 헬퍼 존재
  expect(src).toMatch(/function todayStr\(\)/);
  expect(src).toMatch(/function withWritingDay\(/);
  // recordWritingDay 가 3회 이상 합성(자동저장·생성·확정)
  expect((src.match(/withWritingDay\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
});
```
> `readFileSync`·`resolve` import 가 파일 상단에 이미 있는지 확인(다른 소스 핀이 쓰고 있을 것). 없으면 추가.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "활동일을 기록"`
Expected: FAIL — `todayStr` 미정의.

- [ ] **Step 3: Write minimal implementation**

`src/StoryXDesk.tsx` — `recordWritingDay`·`emptyWritingLog` import 추가(기존 storyEngine/retentionStats import 구역):
```ts
import { recordWritingDay, emptyWritingLog } from './lib/retentionStats';
```

컴포넌트 바깥(파일 상단 헬퍼 구역, 다른 순수 헬퍼 옆)에 추가:
```ts
// B2 — 활동일 기록 헬퍼. todayStr 는 작가 로컬 '오늘'(UI 레이어라 Date 허용), withWritingDay 는 recordWritingDay 를 project 레벨로 감싼 순수 합성.
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function withWritingDay(project: SeriesProject, dateStr: string): SeriesProject {
  const log = recordWritingDay(project.writingLog ?? emptyWritingLog(), dateStr);
  if (log === (project.writingLog ?? null)) return project; // 같은 날 중복 → no-op
  return { ...project, writingLog: log };
}
```
> `SeriesProject` 가 StoryXDesk 에 이미 import 돼 있는지 확인. 없으면 storyEngine import 에 추가.

**지점 1 — 자동저장 effect** (현재 `src/StoryXDesk.tsx:1630`):
```ts
// 변경 전
setProject((prev) => commitChapterProse(prev, chapterId, editorTextRef.current));
// 변경 후 — 실제 prose 변화가 있을 때만 활동 기록(commitChapterProse 가 no-op 이면 참조 동일)
setProject((prev) => {
  const committed = commitChapterProse(prev, chapterId, editorTextRef.current);
  return committed === prev ? prev : withWritingDay(committed, todayStr());
});
```

**지점 2 — produceEpisode 성공** (Step 1 에서 확인한 `setProject(result.updatedProject)` 줄, produceEpisode 내부):
```ts
// 변경 전
setProject(result.updatedProject);
// 변경 후
setProject(withWritingDay(result.updatedProject, todayStr()));
```
> 주의 — produceEpisode 내부의 setProject 만 바꾼다. 같은 문자열이 다른 함수(reviewDraft 등)에도 있으니 produceEpisode 본문 범위 안의 것만 교체한다.

**지점 3 — confirmChapterLock** (현재 `src/StoryXDesk.tsx:2361-2363` 의 `locked`):
```ts
// setProject((current) => { const locked = ...; saveProject(locked); return locked; })
// locked 를 만든 직후 활동일을 합성한다:
const stamped = withWritingDay(locked, todayStr());
saveProject(stamped);
return stamped;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "활동일을 기록"`
Expected: PASS.
그리고 회귀 확인: `npx vitest run src/StoryXDesk` 관련 + `npx tsc --noEmit` 통과.

- [ ] **Step 5: Commit**

```bash
git add src/StoryXDesk.tsx src/editorFocusLayout.test.ts
git commit -m "feat(quality): 편집·생성·확정 3지점에서 활동일 기록 — withWritingDay 배선 (B2)"
```

---

### Task 4: streak 배지 (FloatingEditor 헤더 상시 노출)

`ep-kicker` 옆에 streak 미니 배지를 상시 노출한다. `currentStreak>0` → "🔥 N일 연속"(activeToday=false 면 "어제까지 N일"), `=0` → "오늘 첫 문장을". 순수 표현(retention props 주입).

**Files:**
- Modify: `src/components/FloatingEditor.tsx:20-79` (props), `:525` (헤더 배지)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/floatingEditor.test.ts` 에 추가(기존 react-dom 렌더 패턴 따름 — 파일 내 기존 테스트의 render 헬퍼·baseProps 재사용):
```ts
it('B2 — currentStreak>0 이면 streak 배지에 "N일 연속"', () => {
  const { container } = renderEditor({
    ...baseProps,
    retention: {
      stats: { currentStreak: 5, longestStreak: 9, thisWeekDays: 4, totalDays: 20, lastActiveDay: '2026-06-22', activeToday: true },
      target: { current: 3, planned: 30 },
    },
  });
  const badge = container.querySelector('.ep-streak');
  expect(badge?.textContent).toContain('5');
  expect(badge?.textContent).toContain('연속');
});

it('B2 — currentStreak=0 이면 시작 유도 문구', () => {
  const { container } = renderEditor({
    ...baseProps,
    retention: {
      stats: { currentStreak: 0, longestStreak: 0, thisWeekDays: 0, totalDays: 0, lastActiveDay: null, activeToday: false },
      target: { current: 0, planned: null },
    },
  });
  expect(container.querySelector('.ep-streak')?.textContent).toContain('오늘 첫 문장');
});
```
> `renderEditor`/`baseProps` 가 기존 테스트의 헬퍼명과 다르면 파일 내 실제 이름에 맞춘다. retention 이 optional 이므로 기존 테스트(retention 미주입)는 영향 없어야 한다.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/floatingEditor.test.ts -t "streak 배지"`
Expected: FAIL — `.ep-streak` 없음.

- [ ] **Step 3: Write minimal implementation**

`src/components/FloatingEditor.tsx` props interface(`:79` 근처, 객체 끝부분)에 추가:
```ts
  /** B2 — target/habit 이원 리텐션. 없으면 배지·패널 섹션 미렌더(하위호환). */
  retention?: {
    stats: import('../lib/retentionStats').RetentionStats;
    target: { current: number; planned: number | null };
  };
```
> import 가능하면 파일 상단에 `import type { RetentionStats } from '../lib/retentionStats';` 두고 `retention?: { stats: RetentionStats; ... }` 로 정리.

함수 컴포넌트 시그니처 구조분해에 `retention` 추가(다른 props 와 같은 자리).

헤더 — `src/components/FloatingEditor.tsx:529`(`ep-kicker` 닫는 `</div>`) 직후, 회차 선택기 블록 앞에 배지 추가:
```tsx
{retention && (
  <div className="ep-streak" aria-label="집필 연속">
    {retention.stats.currentStreak > 0 ? (
      <span>🔥 {retention.stats.currentStreak}일 {retention.stats.activeToday ? '연속' : '연속 (오늘 이어가기)'}</span>
    ) : (
      <span>오늘 첫 문장을 써보세요</span>
    )}
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS (신규 2건 + 기존 전부).

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(quality): streak 배지 — FloatingEditor 헤더 상시 노출 (B2)"
```

---

### Task 5: 리텐션 패널 섹션 (FloatingEditor 지표 패널)

`fc-p-metrics` 패널에 '리텐션' fc-metric 카드를 추가한다. lead 에 streak, 본문에 target 진도(N/M화)·최장연속·이번 주 N/7. 기존 fc-metric 접이식 패턴 따름.

**Files:**
- Modify: `src/components/FloatingEditor.tsx` (openMetric 타입 + `:917` 패널 카드)
- Test: `src/components/floatingEditor.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/floatingEditor.test.ts` 에 추가:
```ts
it('B2 — 지표 패널에 리텐션 섹션(target N/M화 + 최장연속)', () => {
  const { container } = renderEditor({
    ...baseProps,
    retention: {
      stats: { currentStreak: 5, longestStreak: 9, thisWeekDays: 4, totalDays: 20, lastActiveDay: '2026-06-22', activeToday: true },
      target: { current: 12, planned: 30 },
    },
  });
  const card = container.querySelector('.fc-metric-retention');
  expect(card).not.toBeNull();
  expect(card?.textContent).toContain('12');
  expect(card?.textContent).toContain('30'); // planned
  expect(card?.textContent).toContain('9'); // longest
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/floatingEditor.test.ts -t "리텐션 섹션"`
Expected: FAIL — `.fc-metric-retention` 없음.

- [ ] **Step 3: Write minimal implementation**

`src/components/FloatingEditor.tsx` — `openMetric` state 타입에 `'retention'` 추가(현재 `'harness' | 'quality' | 'media' | ...` 유니온을 `grep -n "openMetric" src/components/FloatingEditor.tsx` 로 찾아 확장).

`fc-metrics` 컨테이너(`:917`) 안, 첫 카드(harness) **앞**에 리텐션 카드 추가(작가 동선상 진도·습관을 맨 위에):
```tsx
{retention && (
  <div className={`fc-metric fc-metric-retention${openMetric === 'retention' ? ' open' : ''}`}>
    <button className="fc-metric-h" onClick={() => setOpenMetric('retention')}>
      <span className="nm">리텐션</span>
      <span className="lead">
        {retention.stats.currentStreak > 0 ? `🔥 ${retention.stats.currentStreak}일 연속` : '오늘 첫 문장'}
      </span>
      <span className="sub">
        {retention.target.planned
          ? `${retention.target.current}/${retention.target.planned}화`
          : `${retention.target.current}화`}
      </span>
    </button>
    <div className="fc-metric-b">
      <span className="fc-row">진도 — 전체 {retention.target.planned ?? '?'}화 중 {retention.target.current}화</span>
      <span className="fc-row">현재 연속 — {retention.stats.currentStreak}일</span>
      <span className="fc-row">최장 연속 — {retention.stats.longestStreak}일</span>
      <span className="fc-row">이번 주 — {retention.stats.thisWeekDays}/7일</span>
    </div>
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/floatingEditor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/FloatingEditor.tsx src/components/floatingEditor.test.ts
git commit -m "feat(quality): 지표 패널 리텐션 섹션 — target 진도 + habit (B2)"
```

---

### Task 6: floatingEditorProps 배선 + CSS + init.sh + 라이브 검증

StoryXDesk 가 retention props 를 실제로 주입하고, 다크 토큰 CSS 를 추가한 뒤 전체 게이트·라이브로 마무리.

**Files:**
- Modify: `src/StoryXDesk.tsx:1367-1430` (floatingEditorProps), import
- Modify: `src/styles.css` (`.ep-streak`·`.fc-metric-retention`)
- Test: `src/editorFocusLayout.test.ts` (props 핀)

- [ ] **Step 1: Write the failing test**

`src/editorFocusLayout.test.ts`:
```ts
it('B2 — floatingEditorProps 가 retention(stats+target)을 주입', () => {
  const src = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf-8');
  expect(src).toMatch(/retention:\s*\{/);
  expect(src).toMatch(/computeRetentionStats\(/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/editorFocusLayout.test.ts -t "retention\(stats\+target\)"`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

`src/StoryXDesk.tsx` — import 에 `computeRetentionStats` 추가:
```ts
import { recordWritingDay, emptyWritingLog, computeRetentionStats } from './lib/retentionStats';
```

floatingEditorProps useMemo(`:1429` `leakBlock,` 다음, 객체 끝부분)에 추가:
```ts
      retention: {
        stats: computeRetentionStats(project.writingLog ?? emptyWritingLog(), todayStr()),
        target: { current: project.chapters.length, planned: project.storyContract?.plannedEpisodes ?? null },
      },
```
> `storyContract` 필드명·`plannedEpisodes` 경로를 `grep -n "plannedEpisodes" src/lib/storyEngine.ts` 로 확인(StoryContract 안에 있음). useMemo 의존성 배열에 `project` 가 이미 있으면 추가 불필요(project 통째 의존).

`src/styles.css` — 끝부분에 다크 토큰 CSS 추가:
```css
/* B2 — 리텐션: streak 배지(상시) + 지표 패널 섹션. fc 스코프 다크 토큰. */
.fc .ep-streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--lc-text-dim, #a0a0ab);
}
.fc .ep-streak span {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--lc-surface-2, rgba(255,255,255,0.04));
  border: 1px solid var(--lc-border, rgba(255,255,255,0.08));
}
.fc .fc-metric-retention .lead {
  color: var(--lc-accent, #b6f09c);
}
```
> 실제 토큰명은 인접 `.fc` CSS 에서 쓰는 변수(`--lc-*`/`--nx-*`/`--sx-*`)를 확인해 맞춘다. fallback 값을 둬서 토큰 누락 시에도 깨지지 않게 한다.

- [ ] **Step 4: Run full gate**

Run: `bash init.sh`
Expected: tsc 0 · vitest 전체 PASS(신규 케이스 포함) · build 성공.

- [ ] **Step 5: 라이브 검증 (preview)**

- preview_start 로 dev 서버 기동.
- `createSeedProject` + writingLog 주입한 작품을 localStorage 에 심고 `?stage=editor` 진입(B1 라이브 절차 동형 — ESM 동적 import).
  - 활동일 시나리오 2개: (a) 오늘 포함 연속 3일 → 배지 "🔥 3일 연속", (b) 빈 로그 → "오늘 첫 문장을".
- 확인: 헤더 `.ep-streak` 렌더 · 지표 패널 열어 `.fc-metric-retention`(target N/M화·최장·주간) · 콘솔 에러 0(fresh load) · 본문 편집 → 800ms 후 localStorage `writingLog.activeDays` 에 오늘 날짜 append.
- 스크린샷 저장.

- [ ] **Step 6: Commit**

```bash
git add src/StoryXDesk.tsx src/styles.css src/editorFocusLayout.test.ts
git commit -m "feat(quality): retention props 배선 + 다크 토큰 CSS + 라이브 검증 (B2)"
```

---

## 완료 후

- `progress.md` '최근 검증' 블록 갱신(B2 묶음·테스트 수치 한 곳) + 활성 트랙 메모.
- `feature_list.json` `B2-dual-retention` status `todo`→`done` + evidence.
- `session-handoff.md` 맨 위에 인계 노트(한 것·손대지 말 것·다음 한 가지=B3).
- 머지/푸시는 사용자 결정 대기(`feat/dual-retention` → main).

## 손대지 말 것 (회귀 가드)
- `retentionStats` 의 today/dateStr 주입 — `Date` 현재시각·random 미사용. 끊김 규칙(today 또는 어제까지 유지)은 retentionStats.test 가 핀.
- `withWritingDay` no-op 가드 — 같은 날 중복은 참조 동일 반환(자동저장 effect 가 매 타이핑 호출해도 불필요 saveProject 안 일어나게).
- `commitChapterProse === prev` 검사 — 실제 편집 없으면 활동 기록 안 함(회차 전환 flush 가 활동으로 오기록되지 않게).
- retention props optional — 미주입 시 배지·패널 미렌더(기존 테스트·하위호환 보존).
