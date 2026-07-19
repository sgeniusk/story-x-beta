# P1-b — 회차 본문 복사·TXT 반출 구현 계획

## 목표

WRITE에서 현재 선택한 회차의 저장 전 최신 본문을 한 번에 복사하거나 UTF-8 TXT로 내려받게 한다. JSON 백업과 PLAY 복구본의 의미를 섞지 않고, 빈 본문·권한 거부·다운로드 실패는 fail-closed로 드러낸다.

## Task 1 — 평문·파일명·다운로드 계약 RED→GREEN

1. `src/lib/manuscriptExport.test.ts`에 live body 보존, 한국어·빈 줄 무손실, 빈 본문 차단, 안전 파일명 실패 테스트를 먼저 추가한다.
2. 공용 파일명 조각이 기존 PLAY 복구 파일명 결과를 보존하는 회귀 테스트를 고정한다.
3. RED를 확인한 뒤 `src/lib/textFileExport.ts`와 `src/lib/manuscriptExport.ts`를 최소 구현한다.
4. `playRecovery.ts`의 private sanitizer를 공용 helper import로 이동하고 기존 복구 포맷 테스트를 통과시킨다.

## Task 2 — 반출 UI RED→GREEN

1. `src/components/manuscriptExportActions.test.tsx`에 본문 복사 성공, clipboard reject, TXT payload·파일명, 공백 disabled·무호출 실패 테스트를 먼저 추가한다.
2. RED를 확인한 뒤 `ManuscriptExportActions`를 구현한다. 성공은 실제 Promise resolve/다운로드 완료 뒤에만 알리고 실패는 `aria-live=polite`로 표시한다.
3. `src/App.tsx`의 PLAY 복구 TXT도 공용 다운로드 helper를 사용하게 해 세 번째 Blob/anchor 복제를 막는다.

## Task 3 — WRITE 선택 회차·live 본문 배선 RED→GREEN

1. `src/editorFocusLayout.test.ts` 또는 전용 계약 테스트에 WRITE 회차 컨텍스트가 `latestChapter`와 `editorText`를 반출 액션에 전달하고 recovery 작업실에서는 일반 컨텍스트가 렌더되지 않는 실패 테스트를 추가한다.
2. RED를 확인한 뒤 `StoryXDesk`의 회차 이동 줄에 compact `본문 복사`·`TXT` 액션을 연결한다.
3. `src/styles.studio.test.ts`에 warm `--st-*` 토큰, 44px 모바일 hit target, wrap·overflow 방어, 상태 문구 스타일 실패 테스트를 추가한 뒤 구현한다.

## Task 4 — 검증·인계

1. 변경한 순수 모듈·컴포넌트·레이아웃·스타일 집중 테스트와 `tsc --noEmit`을 실행한다.
2. 로컬 preview에서 과거 회차 선택, 미저장 문장 즉시 복사/TXT, 한국어·빈 줄 실파일, 빈 본문, clipboard reject, locked 회차를 검증한다.
3. 390px·1280px에서 회차 이동·액션 wrap, 가로 overflow, 키보드 포커스를 확인한다.
4. 독립 코드·범위·실브라우저 감사를 통과한다.
5. `bash init.sh` 전체 녹색을 확인한다.
6. `progress.md`와 `session-handoff.md` 맨 위를 갱신하고 커밋·push·Draft PR을 만든다. base는 `codex/p1a-play-progress-feedback`이며 머지는 사용자에게 남긴다.

## 허용 파일

- `src/lib/textFileExport.ts`
- `src/lib/textFileExport.test.ts`
- `src/lib/manuscriptExport.ts`
- `src/lib/manuscriptExport.test.ts`
- `src/lib/playRecovery.ts`
- `src/lib/playRecovery.test.ts`
- `src/components/ManuscriptExportActions.tsx`
- `src/components/manuscriptExportActions.test.tsx`
- `src/StoryXDesk.tsx`
- `src/App.tsx`
- `src/editorFocusLayout.test.ts`
- `src/styles.css`
- `src/styles.studio.test.ts`
- `docs/superpowers/specs/2026-07-19-p1b-text-export-design.md`
- `docs/superpowers/plans/2026-07-19-p1b-text-export.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

JSON export/import, PublishScreen, ProjectHub, storage schema, story generation/canon logic은 변경하지 않는다. 사용자 소유 `.agents/skills/story-score/`는 읽기·수정·staging 모두 하지 않는다.
