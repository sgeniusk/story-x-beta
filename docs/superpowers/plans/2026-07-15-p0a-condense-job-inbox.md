# P0-a 응결 신뢰성 — 로컬 Codex 잡 + 전역 생성 보관함 Implementation Plan

**Goal:** PLAY 응결 실행을 브라우저 요청 수명에서 분리해 로컬 Codex가 끝까지 완주하게 하고, 결과를 projectId 기반 전역 생성 보관함에서 승인하도록 한다.

**Architecture:** Vite 메모리 잡 레지스트리 + cancellable child runner, POST/GET/DELETE 잡 API, 폴링 클라이언트, localStorage 전역 보관함, App 전역 폴러, 프로젝트 허브 보관함과 PLAY 바로가기. 결과 승인은 기존 DiveDesk 계약을 재사용한다.

**Spec:** `docs/superpowers/specs/2026-07-15-p0a-condense-job-inbox-design.md`

## Task 1 — 서버 잡 레지스트리 (순수 TDD)

**Files:** `src/lib/server/localGenerationJobs.ts`, `src/lib/server/localGenerationJobs.test.ts`

- [ ] 실패 테스트: 시작→성공, active dedupe, 명시 취소, 5분 timeout, dispose 자식 정리.
- [ ] 최소 구현: runner 주입형 레지스트리와 직렬화 가능한 스냅샷.
- [ ] 국소 테스트 녹색.

## Task 2 — cancellable bridge + 잡 API (TDD)

**Files:** `vite.config.ts`, `src/viteJobBridge.test.ts`

- [ ] 실패 소스/행동 테스트: POST/GET/DELETE 라우트, 일반 브리지 close→cancel, 서버 종료 dispose.
- [ ] storyx 자식 실행을 단일 cancellable helper로 모으고 기존 JSON 추출 계약 유지.
- [ ] `/api/dive-condense-jobs` 플러그인을 추가하고 입력 전체 해시로 active dedupe.
- [ ] 기존 bridge route 인수와 `[onboard-mirror]` 무변경 확인.

## Task 3 — 폴링 클라이언트와 보관함 도메인 (순수 TDD)

**Files:** `src/lib/diveClient.ts`, `src/lib/diveClient.test.ts`, `src/lib/generationInbox.ts`, `src/lib/generationInbox.test.ts`

- [ ] 실패 테스트: start/get/cancel HTTP 계약과 오류 상태.
- [ ] 실패 테스트: inbox parse/serialize, 최신순 cap, 상태 merge, active/terminal 판정, project revision.
- [ ] 최소 구현 후 국소 테스트·tsc 녹색.

## Task 4 — App 전역 폴러와 프로젝트 허브 보관함 (컴포넌트 TDD)

**Files:** `src/components/GenerationInboxPanel.tsx`, `src/components/generationInboxPanel.test.ts`, `src/App.tsx`, `src/appExperience.test.ts`, `src/styles.css`

- [ ] 실패 테스트: running/succeeded/failed/expired 카드, 취소·검토·폐기 동작과 빈 상태.
- [ ] App에서 보관함을 로드하고 active 항목을 주기적으로 폴링·영속.
- [ ] ProjectHub에 보관함을 노출하고 성공 결과를 해당 작품 PLAY 검토로 연다.
- [ ] 기존 `--nx-*`, `--st-*`, `--st-dur-*`/`--st-ease` 토큰만 사용.

## Task 5 — PLAY 잡 시작·재연결·기존 승인 재사용 (컴포넌트 TDD)

**Files:** `src/components/DiveDesk.tsx`, `src/components/diveDesk.test.ts`, `src/App.tsx`

- [ ] 실패 테스트: 지금 응결이 잡 시작 콜백 사용, active 상태·취소·보관함 링크, 결과 선택 시 기존 승인 카드.
- [ ] 직접 `requestDiveCondense` 호출 제거. 대화는 백그라운드 응결 중에도 계속 가능.
- [ ] 승인/폐기 시 보관함 항목 정리, 보류 시 유지.
- [ ] 캐논 승인·연속성 검토 경로 무변경.

## Task 6 — 검증과 인계

- [ ] 국소 vitest → `bash init.sh`.
- [ ] 로컬 mock/실 Codex로 잡 시작→화면 이동/새로고침→완료→보관함→승인, 취소와 중복 실행을 실측.
- [ ] `progress.md`, `session-handoff.md` 맨 위 갱신.
- [ ] 범위 파일만 커밋·push, PR 생성. merge는 사용자에게 남긴다.
