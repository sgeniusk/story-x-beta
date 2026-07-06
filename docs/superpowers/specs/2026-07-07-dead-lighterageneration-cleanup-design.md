# 디자인 정비 슬라이스 4a — 죽은 라이트 세대 정리 (렌더 무변경 삭제)

> 2026-07-07. 슬라이스 1~3(PR #26·#27) 적대적 검토 렌즈들이 식별한 죽은 라이트 시절 잔재를 걷어내는 삭제 슬라이스. 삭제 전 사망 판정(콜사이트 0·테스트 참조 0) 완료, 출하 전 적대적 검토 필수([[subagent-commit-hygiene]]).

## 삭제 대상 (사망 근거)

1. `src/lib/studioConstants.ts` — import 0. 옛 Linear 팔레트(STUDIO_CANVAS/ACCENT_VALUES)를 든 지뢰 모듈(되살려 배선하면 sx→st 매핑을 무음 우회).
2. `src/components/Spotlight.tsx` + `.sx-spotlight-*` CSS + sx 토큰 스코프 셀렉터의 `.sx-spotlight-backdrop` 항목 — 컴포넌트 import 0(⌘K는 CommandPalette가 담당). editorFocusLayout:451의 `not.toContain('isSpotlightOpen')`은 StoryXDesk 소스 부정 단언이라 무영향.
3. `.sx-version-log-*` CSS — VersionLogDialog는 PR #19에서 삭제, CSS만 잔존(흰 베니어 포함). TSX 참조 0.
4. `src/components/PublishingIndexCard.tsx` + `.sx-publishing-*` CSS(+미디어 쿼리 참조) — PublishingStudio가 PR #18에서 삭제되며 고아화. import 0, 라이브 출간은 FloatingPublishWorkspace.
5. `.landing-page`의 `--mx-*` 레거시 별칭 블록 — `var(--mx-` 소비자 0.

## 지키는 것 (범위 밖)

- **테스트 계약에 물린 desk-grid 세대**(`.sx-workbench`·`.sx-creative-stage`·`.sx-writing-surface`·`.sx-canvas-surface`·`.sx-storyboard-surface`·`.sx-desk .ex-toolstrip`) — editorFocusLayout.test.ts가 원문 핀. 계약 재협상이 필요한 큰 조각이라 4b로 분리(이전 세션들도 같은 이유로 보류).
- PixelAvatar·extendedPersonas 등 유사 이름 live 심볼 — Spotlight 삭제 후 고아화 여부 재확인.
- `--wds-*`·파스텔·랜딩 `--lc-*` — 핀 유지.

## 검증 게이트

init.sh 녹색 · 적대적 검토(도달성 반증·동적 클래스 조립·테스트 약화) · 라이브 3모드 + ⌘K + 출간 fresh load 콘솔 0.
