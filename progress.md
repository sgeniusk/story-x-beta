# Story X — Progress

> Last Updated: 2026-05-21 11:46 KST · Branch: `design/linear-dark`

## Current Objective

**M3.5 — 스튜디오 편집기 설정 패널 (트윅·캔버스)** (`todo`)

스튜디오 안에 사용자가 강조색(트윅)과 창 배경색(캔버스)을 바꿀 수 있는 편집기 설정 패널을 추가한다. localStorage에 저장. M3 4파트 구조가 확정되었으니 이제 스튜디오 안의 사용자 커스터마이즈를 붙인다.

## Current State

- 활성 feature — `M3.5-studio-settings` (`feature_list.json` 참조)
- 직전 마일스톤 — M3 완료, 4파트 구조 확정 (랜딩 낮↔밤 / 브릿지 라이트 / 스튜디오 다크 / 퍼블리시 신설 대기)
- 마지막 통과 검증 — `bash init.sh` 28 files / 149 tests · 빌드 성공 (2026-05-21 11:46)
- 브랜치 — `design/linear-dark` (origin 푸시 진행 예정)

## What Was Done in the Last Session

1. design 패키지 fetch 시도 — 바이너리(gzip 107KB), 프로젝트 외부 캐시라 classifier 차단. 사용자가 "로고 외에는 그대로 진행" 결정
2. 흰 로고 변형 생성 — `src/assets/brand/story-x-symbol-light.svg`, `story-x-logo-lockup-light.svg`
3. 4파트 구조 분리
   - `:root --nx-*` 라이트로 복원 → 브릿지(로그인·프로젝트·홈) 다시 흰 배경
   - 랜딩에 낮↔밤 토글 추가 (`useState` + `localStorage 'storyx.landingTheme'`)
   - 토글 UI — nav 우측에 Sun/Moon 아이콘 32px 버튼
   - `.landing-page.is-light` 오버라이드 — 토큰을 라이트 등가로 재정의
   - `.landing-page.is-light .hero-showcase` — mockup은 항상 다크 (스튜디오 미리보기)
   - `LandingBrand` `theme` prop 추가 → 다크 컨텍스트는 흰 SVG, 라이트는 검정 SVG
   - `StoryXDesk` 로고 import를 흰 변형으로 교체
   - CSS `filter: brightness(0) invert(1)` 해킹 제거
4. 코드 하네스 산출물(`feature_list.json` · `progress.md` · `session-handoff.md`) 갱신

## Recommended Next Step

스튜디오(에디터) 우측 패널 또는 헤더 영역에 "편집기 설정" 드롭다운/모달을 추가하고, 트윅(`--sx-brand`) 컬러 피커 + 캔버스(`--sx-page` / `--sx-paper`) 토널 선택 + localStorage 저장. 한 컴포넌트씩 하고 `bash init.sh` 통과 후 다음.

## Files To Touch

- `src/StoryXDesk.tsx` — 설정 모달/드롭다운 컴포넌트 + state hook
- `src/styles.css` `.sx-desk` 영역 — 설정 패널 스타일
- `src/lib/storage.ts` — 설정 영속화 헬퍼 추가 (선택)

## Files NOT To Touch

- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` 영역
- `src/styles.css` `:root --nx-*` 라이트 토큰 (브릿지)
- 149 테스트 통과 상태

## Blockers

없음.

## Completed Milestones

| ID | Title | Done | Evidence |
|---|---|---|---|
| M1 | 스토리 하네스 통합 설계 문서 | 2026-05-19 | `docs/storyx-harness-architecture.md`, commit `e7a971a` |
| M2 | Linear 다크 랜딩 재작성 | 2026-05-21 | `src/App.tsx` MarketingLanding v4, commit `e7a971a` |
| M3 | 4파트 구조 + 랜딩 낮↔밤 토글 | 2026-05-21 | 흰 로고 변형, theme prop, `.landing-page.is-light` 오버라이드, nx-* 라이트 복원 |

## Blocked Work

| ID | Reason |
|---|---|
| M3.6 — 퍼블리시 화면 | M3.5 후 진행 권장 (스튜디오 내부 마무리 먼저) |
| M4 — 스토리 하네스 구현 | 디자인 단계 후 착수. `docs/storyx-harness-architecture.md` 정본 |
| M5~M7 | M4 의존 |

## Verification Evidence (Last Pass)

```
bash init.sh    → exit 0
                  Test Files 28 passed (28)
                  Tests 149 passed (149)
                  ✓ 하네스 검증 통과 (2026-05-21 11:46)
Playwright       → landing dark / landing light / bridge projects / studio editor 캡처
                  - 랜딩 다크: 흰 pill CTA, 흰 로고, mockup 다크
                  - 랜딩 라이트: 검정 pill CTA, 검정 로고, mockup 다크 유지
                  - 브릿지(프로젝트): 흰 배경, purple primary, 검정 로고
                  - 스튜디오(에디터): 다크, 흰 로고 좌상단
```

## Master Plan

`~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마일스톤 로드맵.
