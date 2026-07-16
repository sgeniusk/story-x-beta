# P0-b PLAY 기록 복구 Implementation Plan

## 목표

응결 생성 실패가 창작 기록 유실로 이어지지 않도록, 잡 시작 시 전체 PLAY 원문을 보존하고 실패 영수증/PLAY 현장에서 TXT 또는 WRITE 초안으로 구제한다. 생성 재시도나 캐논 승인 정책은 바꾸지 않는다.

## 허용 파일

- `src/lib/playRecovery.ts`
- `src/lib/playRecovery.test.ts`
- `src/lib/generationInbox.ts`
- `src/lib/generationInbox.test.ts`
- `src/lib/storyEngine.test.ts`
- `src/components/GenerationInboxPanel.tsx`
- `src/components/generationInboxPanel.test.ts`
- `src/components/DiveDesk.tsx`
- `src/components/diveDesk.test.ts`
- `src/App.tsx`
- `src/appExperience.test.ts`
- `src/styles.css`
- `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md`
- `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

## Task 1 — 원문 복구 도메인 RED→GREEN

먼저 `storyEngine.test.ts`에 빈 intent/newCanonFacts 초안이 기존 캐논·인물 상태를 바꾸지 않는 안전 계약을 추가한다. 이어 `playRecovery.test.ts`에 실패 테스트를 쓴다.

- DiveSession 전체 대화를 역할 라벨과 함께 스냅샷으로 캡처.
- TXT에 작품·예정 회차·장면·시각·원문 보존.
- 파일명에서 경로/금지 문자를 제거.
- 원래 projectId가 일치할 때만 다음 회차 초안 생성.
- 초안 생성 뒤 기존 캐논·인물 상태 무변경, newCanonFacts 빈 배열, unlocked.

그 뒤 `playRecovery.ts`를 최소 구현한다.

## Task 2 — 생성 영수증 영속 RED→GREEN

먼저 `generationInbox.test.ts`에 다음 실패 테스트를 추가한다.

- recovery/recoveredAt 직렬화 왕복.
- 손상 recovery만 제거하고 기존 영수증은 보존.
- 폴링 merge 뒤 client recovery 메타데이터 유지.
- recovery가 있는 실패 계열만 복구 가능.
- 구버전 recovery 없는 영수증 호환.

그 뒤 optional 필드 파서와 복구 가능 상태 판정을 구현한다. 서버 job 타입은 변경하지 않는다.

## Task 3 — 보관함·PLAY 복구 UI RED→GREEN

먼저 컴포넌트 테스트에 다음 계약을 추가한다.

- 생성 보관함 실패 계열의 안전 문구와 TXT/WRITE 행동.
- recovery 없는 구버전 실패에는 행동 없음.
- recoveredAt 뒤 `WRITE로 보냄` disabled.
- DiveDesk에 잡 등록 실패용 복구 카드와 콜백 배선.

그 뒤 기존 `--nx-*`/`--st-*` 토큰 안에서 두 표면을 구현한다.

## Task 4 — App 저장/라우팅 배선 RED→GREEN

먼저 `appExperience.test.ts`에 다음 소스 계약을 추가한다.

- `handleStartGeneration`이 서버 요청과 별도로 recovery snapshot을 영수증에 넣음.
- TXT 다운로드가 pure formatter/filename을 사용.
- WRITE 전송은 `activateProject(recovery.projectId)` 성공 후에만 수행.
- recovery draft 저장 뒤 recoveredAt 기록·WRITE 전환.
- 미반영 PLAY가 있으면 최신화 안내로 차단하고, 없으면 본편·PLAY 작업본을 같은 복구 회차로 맞춤.
- 영수증 저장 용량 실패는 비예외 결과로 처리하고 오래된 안전 영수증 정리 후 1회 재시도.
- 저장이 연속 실패하면 기존 미영속 영수증과 새 영수증을 모두 표시하고, 성공 시 메모리 전용 표식을 제거.

그 뒤 App/DiveStage/ProjectHub 콜백을 배선한다. 작품 누락 시 다른 작품에 쓰지 않고 TXT 안내를 띄운다.

## Task 5 — 검증·인계·스택 PR

1. 관련 테스트 RED 증거 후 GREEN.
2. 타입/프로덕션 build.
3. 로컬 브라우저에서 취소 영수증을 실제로 만들고 TXT 다운로드, WRITE 전송, 캐논 무변경, 중복 방지, 새로고침 지속, 콘솔 오류 0을 확인한다.
4. `bash init.sh` 전체 녹색.
5. `progress.md` 최근 검증/증거 갱신.
6. `session-handoff.md` 맨 위 인계 노트.
7. `codex/p0b-failure-recovery` 커밋·push. P0-c PR #39가 아직 열려 있으면 `codex/p0c-work-library`를 base로 Draft PR을 만든다. 머지는 사용자에게 남긴다.
