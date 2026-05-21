# Story X — Progress

> Last Updated: 2026-05-21 19:43 KST · Branch: `design/linear-dark`

## Current Objective

**M5 — 서버측 LLM Vercel Functions** (`todo` · 다음 자연스러운 활성 작업)

배포본(Vercel)에서 모든 AI 호출이 mock으로 떨어지는 문제 해결. `/api/draft` · `/api/review-agent` · `/api/interview` · `/api/review-data` 4개 라우트를 Vercel Functions로 구현하고 공유 스키마 명시. M4 (4단계 매트릭스 + 신설 12명 + 매체 풀 4개) 8 커밋으로 완료.

스튜디오 안에 남은 라이트 회색 박스 셀렉터들을 토큰 기반으로 정리한다. 트윅 5색 × 캔버스 3톤의 어떤 조합에서도 톤이 일관되려면 토픽바 회색 박스, "쇼러너가 잡은 이번" 카드 배경, 알파 셀프체크 바, prose textarea 같은 곳의 리터럴 색을 제거해야 한다.

## Current State

- 활성 feature — `M3.7-editor-literal-color-polish` (`feature_list.json` 참조)
- 직전 마일스톤 — M3.5 완료, 스튜디오 안에서 트윅(강조색)·캔버스(원고 배경) 라이브 변경 가능
- 마지막 통과 검증 — `npm run build` 성공 · `npx tsc --noEmit` exit 0 · 28 files / 149 tests 통과 (2026-05-21 13:30)
- 브랜치 — `design/linear-dark` (origin 푸시 진행 예정)

## What Was Done in the Last Session

1. 미사용 `src/assets/story-x-hero-forest-wind.png` (3MB) 제거
2. 스튜디오 편집기 설정 패널 신설 (M3.5)
   - `StoryXDesk.tsx` 에 `Settings` 톱니 토글 + 펼침 패널
   - 트윅 5색 chip — 라임·바이올렛·에메랄드·코랄·앰버
   - 캔버스 3톤 chip — 피치 블랙·그래파이트·인디고 슬레이트
   - state hook + `localStorage 'storyx.studio.accent'` · `'storyx.studio.canvas'`
   - `<main className="sx-desk">` 에 인라인 `style={{ --sx-brand, --sx-brand-press, --sx-page, --sx-page-soft }}` 오버라이드
   - 라이브 변경 — 캐논 진척률 바·CTA·Quick 토글·헤더 액센트가 즉시 적용됨
3. `styles.css` 에 `.sx-studio-settings-toggle` · `.sx-studio-settings-panel` · `.sx-accent-chip` · `.sx-canvas-chip` · `.sx-accent-dot` · `.sx-canvas-swatch` 스타일 추가
4. `Settings` lucide 아이콘 import 추가, `CSSProperties` 타입 import 추가

## Recommended Next Step

라임 + 피치 블랙 외의 조합으로 스튜디오를 열어 보고, 그때 눈에 띄게 어색해지는 리터럴 색 박스를 토큰 기반으로 교체. 우선 후보 — 토픽바 `sx-app-breadcrumb`/`sx-save-chip` 영역, "쇼러너가 잡은 이번..." 카드 배경, 알파 셀프체크 바, prose `<textarea>` 영역.

## Files To Touch

- `src/StoryXDesk.tsx` — JSX 내 인라인 색이 있다면 토큰으로
- `src/styles.css` `.sx-desk` 하위의 리터럴 hex/회색 셀렉터 — `var(--sx-page)` · `var(--sx-paper)` · `var(--sx-card)` 등으로 교체

## Files NOT To Touch

- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` 영역
- `:root --nx-*` 라이트 토큰
- `.sx-desk` 토큰 정의 자체 (인라인 오버라이드 메커니즘은 유지)
- 149 테스트 통과 상태

## Blockers

없음.

## Completed Milestones

| ID | Title | Done | Evidence |
|---|---|---|---|
| M1 | 스토리 하네스 통합 설계 문서 | 2026-05-19 | `docs/storyx-harness-architecture.md`, commit `e7a971a` |
| M2 | Linear 다크 랜딩 재작성 | 2026-05-21 | `src/App.tsx` MarketingLanding v4, commit `e7a971a` |
| M3 | 4파트 구조 + 랜딩 낮↔밤 토글 | 2026-05-21 | 흰 로고 변형, theme prop, `.landing-page.is-light` 오버라이드, nx-* 라이트 복원 |
| M3.5 | 스튜디오 편집기 설정 패널 (트윅·캔버스) | 2026-05-21 | `StoryXDesk` 설정 토글 + 패널, `--sx-brand`/`--sx-page` 인라인 오버라이드, localStorage 영속 |

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
