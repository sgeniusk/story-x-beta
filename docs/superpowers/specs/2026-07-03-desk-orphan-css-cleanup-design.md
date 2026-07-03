# 고아 컴포넌트·죽은 CSS 정리 — 설계

<!-- legacy 셸 정리(PR #18)의 알려진 잔여 2건 마무리 — 렌더 0 고아 컴포넌트 삭제 + 죽은 셸 CSS 삭제. 방법론은 선행 spec(2026-07-03-desk-legacy-shell-cleanup)의 원칙(동작 무변경·tsc/grep 증명 삭제·테스트 3분법)을 계승한다. -->

> 작성 2026-07-03 · 상태 `draft` · 근거 PR #18 "알려진 잔여" + 사용자 지시("1,2 작업 마무리"). 선행 spec `2026-07-03-desk-legacy-shell-cleanup-design.md`.

## 0. 한 문장

JSX 렌더 사용처가 0인 고아 컴포넌트(스캔 결과 11개 — BibleAssistantSidebar·AgentProfileDialog·StoryXStatusBar·EvaluatorQualityCard·AgentRoom·AgentIntentCard·MentionBar·CoreStrip·MarginColumn·VersionLogDialog·ProjectHistoryDialog)와, 어떤 live TSX 도 참조하지 않는 죽은 셸 CSS(옛 sx-topbar 셸·`.fc-app .topbar`·설정 popover·미디어 패널 계열)를 삭제한다 — 렌더 산출물 무변경.

## 1. 범위

**한다** — ① 위 11개 고아 컴포넌트 파일 삭제(각각 삭제 전 JSX 렌더 0 **과** 비테스트 import 0 을 재검증, 하나라도 있으면 보존·보고) ② 고아 삭제로 사용처 0이 되는 2차 고아(그들만 쓰던 하위 컴포넌트·lib 함수·타입) 연쇄 스캔·삭제 ③ 죽은 CSS 삭제 — 후보 패밀리를 클래스 단위로 grep 증명 후 제거 ④ 관련 테스트 3분법 교정(고아 컴포넌트 자체 테스트 파일·componentSrc 존재 단언·CSS 문자열 단언).

**안 한다** — 재배선/기능 부활 · live 컴포넌트(DataPanel·CanonStatusBadge·WorkStateGrid 등 렌더≥1) 변경 · styles.css 의 live 규칙 정리/리포맷 · FloatingEditor/App 동작 변경.

## 2. 원칙 (선행 spec 계승 + CSS 특화)

1. **동작 무변경** — 삭제 대상은 렌더 경로에 없음을 증명한 것만.
2. **클래스 단위 grep 증명** — CSS 셀렉터 삭제는 그 셀렉터의 모든 클래스가 `src/**/*.tsx` 에서 0회 사용일 때만. **함정 명시** — `ex-chapter-picker-step`(wm-bar 회차 픽커)·`sx-desk`(FloatingDataWorkspace centerSlot)·`.mnote` 등 이름이 legacy 스러워도 live 인 클래스가 있다. 접두사 일괄 삭제 금지, 셀렉터별 판정.
3. **CSS 후보 패밀리(출발점, 전수 아님)** — `.fc-app .topbar` 계열(반응형·focus 포함) · `ex-workbar*`·`ex-mode*` · `sx-topbar*`·`sx-app-breadcrumb`·`sx-crumb-title-input`·`sx-save-chip`·`sx-track-tabs`·`sx-bible-alert-badge` · `sx-studio-settings*`·`sx-accent-chip`·`sx-canvas-chip`·`sx-canvas-swatch` · `sx-media-change*` · 삭제 고아 컴포넌트 전용 클래스(`sx-statusbar`·`sx-evaluator-card` 등).
4. **테스트 3분법** — ⓐ 죽은 UI 단언 삭제 ⓑ live 대체 계약 존재 시 교체 ⓒ 죽은 심볼 정의 단언 삭제. 고아 컴포넌트의 자체 테스트 파일은 컴포넌트와 함께 삭제.
5. **단계 커밋 + 매 단계 tsc·해당 테스트.**

## 3. 검증 게이트

- `npm test`·`npm run build`·`bash init.sh` 녹색.
- 라이브(preview) fresh load — 3모드 렌더·⌘K·⋯ 메뉴·회차 픽커·여백 주석 경로(.mnote CSS 보존)·콘솔 0.
- 보고 — 삭제 컴포넌트/파일 목록·보존 판정 목록(이유)·CSS 삭제 라인 수·테스트 3분법 집계.

## 4. 리스크

- **live 클래스 오인 삭제** → 원칙 2 함정 목록 + 셀렉터별 grep. 시각 회귀는 라이브 스모크와 적대적 검토로 방어.
- **간접 참조**(비 JSX import — 타입·유틸 re-export) → import 그래프까지 확인 후 삭제.
- **테스트 계약 약화** → ⓑ 우선, 검토에서 비율 점검.
