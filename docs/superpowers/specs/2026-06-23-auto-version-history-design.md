<!-- 자동 버전 히스토리(B4) 설계 — 자동 스냅샷 트리거 확대 + 복원 영향범위 표시 -->

# 자동 버전 히스토리 (B4) 설계

> 2026-06-23 · feature `B4-auto-version-history` · 브랜치 `feat/auto-version-history`
> **근거** — UX 벤치마킹 P3 (`docs/research/2026-06-21-storytelling-service-ux-benchmark.md`, 차용 1순위). 명시적 저장이 아니라 시간순 자동 스냅샷. 본문·캐논·바이블 변경 이력을 되돌릴 수 있어야 한다. §5 공백 — 영향 범위 표시는 별도 설계 필요.
> **현황 발견** — 기존 인프라가 대부분 존재한다. `ProjectSnapshot`(전체 project = 본문+캐논+바이블, 메타 episode/chapterCount/canonCount) · `pushProjectSnapshot`/`appendSnapshot`(max 제한) · `ProjectHistoryDialog`(복원) · `restoreProjectVersion`. 자동 트리거는 회차 생성·캐논 반영에서만.
> **brainstorming 결정** — ① 프롬프트 버전 제외(작가 프롬프트 편집 기능 없어 버전 대상 없음) ② 트리거 확대 = 회차 확정·헌장 개정 추가(굵직한 마일스톤, 본문 타이핑 제외) ③ 영향범위 = ProjectHistoryDialog 인라인 표시 + 감소 시 confirm.

## 목표
- 굵직한 마일스톤(회차 생성·확정·캐논 반영·헌장 개정)마다 자동 스냅샷으로 작가가 의식 없이 버전을 누적한다.
- 복원 시 무엇이 사라지는지(회차·캐논 증감)를 표시해 실수 복원을 막는다 — P3 §5 영향범위 공백 해소.

## 비목표 (YAGNI / 이번 범위 밖)
- 프롬프트 버전 — 작가 프롬프트 편집 기능이 없어 버전관리 대상이 없다(편집 기능 생기면 후속).
- 본문 타이핑마다 스냅샷 — 자동저장이 현재 상태를 영속하므로, 스냅샷은 되돌릴 만한 마일스톤 단위.
- git식 브랜치/diff·줄 단위 diff — 메타(회차·캐논 수) 증감만 표시.
- ProjectSnapshot 구조 변경·max 정책 변경 — 기존 유지.

## 아키텍처

### 신규 — `src/lib/snapshotImpact.ts` (순수 모듈)
```ts
interface SnapshotImpact {
  chapterDelta: number;  // snapshot.chapterCount - current.chapters.length (음수 = 복원 시 감소)
  canonDelta: number;    // snapshot.canonCount - current.canonFacts.length
  episodeDelta: number;  // snapshot.episode - current.currentEpisode
  isRollback: boolean;   // 회차 또는 캐논이 줄어드는가(복원 시 손실 위험)
}
function describeSnapshotImpact(current: SeriesProject, snapshot: ProjectSnapshot): SnapshotImpact;
```
- ProjectSnapshot 메타(chapterCount/canonCount/episode) vs 현재 project 비교. 순수.
- `isRollback = chapterDelta < 0 || canonDelta < 0` (복원 시 현재보다 적어짐).

### 자동 트리거 확대 — `src/StoryXDesk.tsx`
- `confirmChapterLock`: 잠금 직후 `setProjectSnapshots(pushProjectSnapshot(stamped, `${label} 확정`))`.
- `amendCharter`: 개정 직후 `setProjectSnapshots(pushProjectSnapshot(next, '헌장 개정'))`.
- 기존 트리거(회차 생성 2111/2122·캐논 반영 2041) 유지.

### 영향범위 표시 — `src/components/ProjectHistoryDialog.tsx`
- props 에 `current: SeriesProject`(또는 계산된 impact 맵) 추가. 각 스냅샷에 `describeSnapshotImpact` 결과를 인라인 표시("회차 12→10 · 캐논 50→45", `isRollback`이면 경고 톤).
- `onRestore` 호출 전 `isRollback`이면 `window.confirm`("회차 N개·캐논 M개가 현재 상태에서 사라집니다").

## 데이터 흐름
```
마일스톤(생성·확정·반영·개정) → pushProjectSnapshot → projectSnapshots (영속, max 제한)
ProjectHistoryDialog → describeSnapshotImpact(current, snapshot) → 영향범위 인라인 표시
복원 클릭 → isRollback 이면 confirm → restoreProjectVersion
```

## 에러·엣지
- 스냅샷 == 현재 → 모든 delta 0, isRollback false.
- 첫 스냅샷(현재가 더 적음) → delta 양수(복원 시 증가), isRollback false.
- max 초과 → appendSnapshot 이 오래된 스냅샷 버림(기존 동작).
- 같은 날 여러 마일스톤 → 각각 스냅샷(라벨로 구분).

## 테스트 (TDD)
- `snapshotImpact.test` — chapterDelta/canonDelta/episodeDelta · isRollback(감소 시 true) · 동일(0·false) · 증가(양수·false).
- `editorFocusLayout.test` — confirmChapterLock·amendCharter 에 pushProjectSnapshot 배선 핀.
- `version.test`(또는 ProjectHistoryDialog 테스트) — 영향범위 렌더 + isRollback 경고/ confirm 핀.

## 손대지 말 것
- `ProjectSnapshot` 구조·`pushProjectSnapshot`·`appendSnapshot` max·`restoreProjectVersion`(복원 로직) — 불변.
- 기존 트리거(회차 생성·캐논 반영) — 유지, 추가만.
- 본문 자동저장(commitChapterProse) — 무관, 스냅샷과 별개.
