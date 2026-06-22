<!-- target/habit 이원 리텐션(B2) 설계 — 산출 진도와 집필 streak를 별개 1급 지표로 분리 -->

# target/habit 이원 리텐션 (B2) 설계

> 2026-06-22 · feature `B2-dual-retention` · 브랜치 `feat/dual-retention`
> **근거** — UX 벤치마킹 P5 (`docs/research/2026-06-21-storytelling-service-ux-benchmark.md`). target(누적 진도, progress bar) ≠ habit(규칙적 집필, streak·최장연속·달성률). 산출량과 일관성은 다른 동기 시스템이라 한 지표로 합치면 둘 다 약해진다. 현재 Story X는 화수 예산(target류, `buildContractStatus`)만 있고 habit/streak 완전 gap(리텐션 65%, 4영역 중 최약).
> **brainstorming 결정** — ① streak 단위 = 활동일(그날 편집/생성/확정하면 집필일) ② habit = 추적 중심(목표 설정 없음, refuted 경쟁·리더보드 배제) ③ 노출 = 상시 streak 배지 + 지표 패널 상세.

## 목표
- 작가의 **집필 일관성(habit)**을 산출 진도(target)와 **별개 1급 지표**로 추적한다.
- "한 문장이라도 매일"이 보상되도록, 활동일 기준 streak를 상시 노출해 중도이탈을 막는다(P5 정본의 이탈 방지 기제).
- target은 기존 `buildContractStatus`를 재사용하고, habit만 신설해 둘을 나란히(별개로) 보여준다.
- 충돌·정체를 숨기지 않는 프로젝트 원칙과 같은 결 — streak 끊김도 가혹하지 않게(어제까지 유지) 드러낸다.

## 비목표 (YAGNI / 이번 범위 밖)
- cadence 목표 설정(주 N일) — 추적 중심 결정. 압박·경쟁 요소 배제(refuted: 리더보드=안티외로움).
- 활동 heatmap 캘린더 시각화 — 이번엔 숫자(연속·최장·주간)만. 후속.
- target 재설계 — `buildContractStatus` 그대로. 새 진도 계산 안 만듦.
- 서버/클라우드 동기화 — localStorage project 필드 영속만.
- 알림·리마인더(자정 streak 만료 푸시 등) — 클라이언트 전용이라 범위 밖.

## 아키텍처

### 신규 — `src/lib/retentionStats.ts` (순수 모듈, 결정론)
```ts
interface WritingLog { activeDays: string[]; }  // YYYY-MM-DD, 정렬·dedup
interface RetentionStats {
  currentStreak: number;        // today 또는 어제까지 이어진 연속일, 끊기면 0
  longestStreak: number;        // 전체 이력 최장 연속
  thisWeekDays: number;         // 최근 7일(rolling) 중 활동일 수 (0~7)
  totalDays: number;            // 누적 활동일 수
  lastActiveDay: string | null;
  activeToday: boolean;         // 오늘 이미 집필했는지 (배지 톤 분기)
}
function recordWritingDay(log: WritingLog, dateStr: string): WritingLog;     // dedup·정렬, 순수
function computeRetentionStats(log: WritingLog, today: string): RetentionStats;  // today 주입(순수성)
function isValidDayStr(s: string): boolean;  // YYYY-MM-DD 형식 가드
function emptyWritingLog(): WritingLog;
```

**끊김 규칙** — 마지막 활동일이 `today` 또는 `today-1`(어제)이면 currentStreak 유효(어제까지 이어졌으면 오늘 안 써도 유지), `today-2` 이상이면 0. `longestStreak`는 끊김과 무관한 전체 이력 최장 연속.
**주간** — `thisWeekDays` = activeDays 중 `[today-6, today]` 범위 개수. 월요일 시작이 아니라 rolling 7일(단순·직관).
**날짜 산술** — `YYYY-MM-DD` 문자열을 UTC 자정 기준 epoch-day로 환산해 days-diff 계산(타임존 드리프트 회피, 순수). `Date` 객체를 보관하지 않고 dateStr만 다룬다.

### 데이터 모델 — `src/lib/storyEngine.ts`
- `SeriesProject`에 `writingLog?: WritingLog` optional 필드.
- `normalizeProject` 백필 — `writingLog` 있으면 activeDays를 dedup·정렬, 없으면 `{ activeDays: [] }`. 구버전 작품 호환(`nextEpisodeIntent` 백필과 동형).
- export/import(`storage.ts`)는 project 통째 직렬화라 자동 포함.

### target (재사용·무변경)
- 헌장 있으면 `buildContractStatus`(position/plannedEpisodes/remaining)로 진도바.
- 헌장 없으면 누적 회차 수만 표시(분모 없음). 새 계산 안 만듦.

### 활동 기록 배선 — `src/StoryXDesk.tsx`
- 집필 활동 지점 3곳에서 `today`(`new Date` → `YYYY-MM-DD`, UI 레이어)로 `recordWritingDay` → setProject + saveProject:
  - `commitChapterProse` 자동저장 effect(본문 편집)
  - `produceEpisode`(회차 생성)
  - `confirmChapterLock`(회차 확정)
- 같은 날 중복은 dedup으로 무해. setProject 가드(activeDays가 실제 변할 때만)로 불필요 저장 차단.
- `todayStr()` 헬퍼 = 로컬 시간 `YYYY-MM-DD`(작가 체감 '오늘'). storyEngine 순수성은 유지(주입만).

### UI
- **상시 배지** — FloatingEditor 헤더/독에 streak 미니 배지. `currentStreak>0` → "🔥 N일 연속"(오늘 안 썼으면 살짝 다른 톤), `=0` → "오늘 첫 문장을"(부드러운 시작 유도). retentionStats를 props로 주입(순수 표현).
- **지표 패널** — `fc-p-metrics`에 '리텐션' 섹션: target 진도바(N/M화) + habit(현재 연속·최장·이번 주 N/7). 다크 토큰(`--lc-`/`--nx-`/`--sx-`), `fc` 스코프.

## 데이터 흐름
```
편집/생성/확정 → recordWritingDay(today) → project.writingLog → saveProject(영속)
                                                    ↓
                  computeRetentionStats(log, today) → 배지 + 패널 (useMemo)
```

## 에러·엣지
- 빈 로그 → 전부 0, `lastActiveDay` null, 배지 "오늘 첫 문장을".
- 잘못된 dateStr → `isValidDayStr` 가드로 무시(기록 안 함).
- 미래 날짜·중복 → dedup·정렬로 흡수.
- 타임존 — dateStr(`YYYY-MM-DD`)만 비교, UTC 자정 days-diff. 작가 로컬 '오늘'을 UI에서 만들어 주입.

## 테스트 (TDD)
- `retentionStats.test` — recordWritingDay(추가·dedup·정렬·무효 무시) · computeRetentionStats(연속 N일·오늘 끊김(today-2)·어제까지 유지·최장>현재·빈 로그·주간 경계 today-6 포함/today-7 제외).
- `storyEngine.test` — normalizeProject writingLog 백필(구버전 undefined → activeDays [], 비정렬 입력 정렬·dedup).
- `floatingEditor.test` — streak 배지 렌더(>0 "연속", =0 안내).
- `editorFocusLayout.test` — 지표 패널 리텐션 섹션 배선 핀.

## 손대지 말 것
- `buildContractStatus` — target 재사용, 변경 0.
- storyEngine 순수성 — `retentionStats`도 today/dateStr 주입, `Date`/`random` 미사용(storyEngine.test 결정론 보존).
- 상투구·누수 게이트(B1) — 무관, 건드리지 않음.
