# StoryXDesk legacy 셸 정리 — 설계

<!-- 슬라이스 C 가 단일 바 셸을 완성하면서 도달 불가가 된 StoryXDesk 최종 return(옛 sx-topbar 셸)과 그에 딸린 죽은 헬퍼/state 를 삭제하고, 소스 문자열 단언 테스트를 live 계약으로 교정하는 부채 정리 조각. -->

> 작성 2026-07-03 · 상태 `draft` · 근거 슬라이스 C 최종 리뷰·Task 6 품질 리뷰의 정리 권고 + handoff "legacy 최종 return 정리(+테스트 교정)". 동작 무변경 리팩터.

## 0. 한 문장

StoryXDesk 의 도달 불가 최종 return(≈2655~3117행, 옛 3-zone 작업바 셸)과 그 삭제로 사용처가 0이 되는 헬퍼 컴포넌트·state·상수·import 를 걷어내고, `editorFocusLayout.test.ts` 의 legacy 소스 단언 22줄을 live 구조 계약으로 교정한다 — 렌더 산출물은 1바이트도 바뀌지 않는다.

## 1. 왜 지금

- draft/bible/publishing 세 조기 반환이 전 경로를 덮어 최종 return 은 렌더된 적 없는 죽은 무게(파일 3651행 중 ≈500+행)다. 슬라이스 C 리뷰 2회가 정리를 권고했다.
- 죽은 코드가 소스 단언 테스트에 물려 있어, 이후 StoryXDesk 를 만지는 모든 슬라이스가 "legacy 불가침" 제약을 끌고 다닌다. 지금 끊는 게 가장 싸다.

## 2. 범위

**한다** — ① 최종 return 블록 삭제 ② 삭제로 사용처 0이 되는 것만 연쇄 삭제(스코핑 결과 후보: `PublishingStudio`·`AiCliHarnessCard`·`CreativeStage`(이미 JSX 사용 0)·`VerticalSliceProofPanel`·`ContinuitySummaryCard` 헬퍼 5개 · `isStudioSettingsOpen`·`isMediaPanelOpen`·`isFocusMode`·`isMarginDrawerOpen`·`isBinderDrawerOpen` state · `studioAccent`/`studioCanvas` + `STUDIO_ACCENT_VALUES`/`STUDIO_CANVAS_VALUES`(설정 popover 가 legacy 에만 존재해 동반 사망) · `activeModeLabel`·`chapterCrumb` 파생값 · 이들만 쓰던 import/아이콘) ③ 효과가 legacy 루트에만 있던 ⌘K 명령(집중 모드 확대 등 **live-but-inert**) 동반 삭제 ④ `editorFocusLayout.test.ts` legacy 단언 교정 ⑤ 사망하는 localStorage 설정 키가 있으면 읽기/쓰기 코드만 제거(저장된 값은 방치 — 마이그레이션 불필요).

**안 한다** — CSS 삭제(`sx-topbar`·`ex-workbar`·`.fc-app .topbar` 등 죽은 규칙은 무해한 무게, 별도 조각) · 트윅/캔버스 설정 부활(죽은 기능의 부활은 별도 feature) · FloatingEditor/FloatingDataWorkspace/App 변경 · 새 기능 0.

## 3. 원칙 (하드)

1. **동작 무변경** — 라이브 렌더 경로(draft/bible/publishing 반환·⌘K·⋯ 메뉴·wm-bar 슬롯)의 산출물 동일. 유일한 사용자 가시 변화 허용 = 아무것도 하지 않던 ⌘K 명령의 소멸.
2. **tsc 가 증명하는 것만 삭제** — 삭제는 "최종 return 제거 → tsc/미사용 경고가 가리키는 것" 순서의 연쇄로만. 추측 삭제 금지. live 사용이 하나라도 있으면(예: `switchToTrack`·`openPublishingMode`·`handleExport*`·회차 픽커 심볼) 보존.
3. **테스트 교정 3분법** — 각 legacy 단언마다 ⓐ 죽은 UI 전용 계약 → 단언 삭제(테스트 전체가 비면 테스트 삭제) ⓑ 같은 계약이 live 구조에 존재 → live 단언으로 교체(예: 제목 인라인 편집 = `wm-title-input`, 회차 픽커 = wm-bar contextSlot, 저장 칩 = `dm-save`) ⓒ live 심볼 정의 단언(예: `function CreativeStage`)인데 심볼이 죽음 → 삭제. 교체가 원칙, 삭제는 대체 계약이 정말 없을 때만.
4. **한 커밋 한 검증** — 삭제 단계마다 `npx tsc --noEmit` + 해당 테스트 파일 실행. 최종 `bash init.sh`.

## 4. 검증 게이트

- `npm test`·`npm run build`·`bash init.sh` 녹색.
- 라이브(preview) 스모크 — editor 3모드 왕복·⌘K 팔레트(전체 검토 명령 존재)·⋯ 메뉴 3항목·회차 픽커·제목 편집·콘솔 0.
- 결과 보고에 삭제 라인 수·남은 파일 크기·삭제한 ⌘K 명령 목록 포함.

## 5. 리스크

- **live-but-inert 오판** — ⌘K 명령·state 가 실제로는 live 효과를 가질 수 있음 → 각 후보의 사용처를 모두 추적한 뒤 삭제(원칙 2). 특히 `isFocusMode` 는 ⌘K '집중/확대' 명령이 참조하나 효과 대상(legacy 루트 클래스·CreativeStage)이 전부 죽었는지 개별 확인.
- **테스트 계약 약화** — 교정이 삭제로 치우치면 회귀 감지력이 준다 → 3분법 ⓑ 우선, 리뷰에서 삭제/교체 비율 점검.
- **파일이 커서 편집 실수** — 블록 경계(2655 시작·3117 종료)를 diff 로 재확인, 단계 커밋.
