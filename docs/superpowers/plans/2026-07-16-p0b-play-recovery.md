# P0-b PLAY 기록 복구 Implementation Plan

## 목표

응결 생성 실패가 창작 기록 유실로 이어지지 않도록, 잡 시작 시 전체 PLAY 원문을 보존하고 실패 영수증/PLAY 현장에서 TXT 또는 WRITE 초안으로 구제한다. 생성 재시도나 캐논 승인 정책은 바꾸지 않는다.

## 허용 파일

- `src/lib/playRecovery.ts`
- `src/lib/playRecovery.test.ts`
- `src/lib/playRecoveryStore.ts`
- `src/lib/playRecoveryStore.test.ts`
- `src/lib/generationInbox.ts`
- `src/lib/generationInbox.test.ts`
- `src/lib/storage.ts`
- `src/lib/storage.test.ts`
- `src/lib/storyEngine.test.ts`
- `src/components/GenerationInboxPanel.tsx`
- `src/components/generationInboxPanel.test.ts`
- `src/components/WorkspaceModeBar.tsx`
- `src/components/RecoveryDraftWorkspace.tsx`
- `src/components/recoveryDraftWorkspace.test.ts`
- `src/components/DiveDesk.tsx`
- `src/components/diveDesk.test.ts`
- `src/StoryXDesk.tsx`
- `src/App.tsx`
- `src/appExperience.test.ts`
- `src/editorFocusLayout.test.ts`
- `src/styles.css`
- `src/styles.studio.test.ts`
- `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md`
- `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

## Task 1 — 원문 복구 도메인 RED→GREEN

> **폐기된 초기 흐름** — 아래 Task 1~4의 `WRITE 초안 = 즉시 Chapter`·`recoveredAt` 전환은 사용자 테스트 수정 Task 6~10으로 대체됐다. 현재 정본은 **빈 복구 작업본 → 명시적 회차 저장 → 완료 영수증** 순서다.

먼저 `storyEngine.test.ts`에 빈 intent/newCanonFacts 초안이 기존 캐논·인물 상태를 바꾸지 않는 안전 계약을 추가한다. 이어 `playRecovery.test.ts`에 실패 테스트를 쓴다.

- DiveSession 전체 대화를 역할 라벨과 함께 스냅샷으로 캡처.
- TXT에 작품·예정 회차·장면·시각·원문 보존.
- 파일명에서 경로/금지 문자를 제거.
- 원래 projectId가 일치할 때만 복구 작업본 생성.
- 작업본 열기 뒤 회차·캐논·인물 상태 무변경. 명시 저장한 회차만 newCanonFacts 빈 배열, unlocked.

그 뒤 `playRecovery.ts`를 최소 구현한다.

## Task 2 — 생성 영수증 영속 RED→GREEN

먼저 `generationInbox.test.ts`에 다음 실패 테스트를 추가한다.

- recovery와 draft-open/commit-complete 메타데이터 쌍의 직렬화 왕복.
- 손상 recovery만 제거하고 기존 영수증은 보존.
- 폴링 merge 뒤 client recovery 메타데이터 유지.
- recovery가 있는 실패 계열만 복구 가능.
- 구버전 recovery 없는 영수증 호환.

그 뒤 optional 필드 파서와 복구 가능 상태 판정을 구현한다. 서버 job 타입은 변경하지 않는다.

## Task 3 — 보관함·PLAY 복구 UI RED→GREEN

먼저 컴포넌트 테스트에 다음 계약을 추가한다.

- 생성 보관함 실패 계열의 안전 문구와 TXT/WRITE 행동.
- recovery 없는 구버전 실패에는 행동 없음.
- draft-open 뒤 `작업본 열기`, recoveredAt 뒤 `회차로 저장됨` disabled.
- DiveDesk에 잡 등록 실패용 복구 카드와 콜백 배선.

그 뒤 기존 `--nx-*`/`--st-*` 토큰 안에서 두 표면을 구현한다.

## Task 4 — App 저장/라우팅 배선 RED→GREEN

먼저 `appExperience.test.ts`에 다음 소스 계약을 추가한다.

- `handleStartGeneration`이 서버 요청과 별도로 recovery snapshot을 영수증에 넣음.
- TXT 다운로드가 pure formatter/filename을 사용.
- WRITE 전송은 `activateProject(recovery.projectId)` 성공 후에만 수행.
- recovery draft와 draft-open 영수증을 모두 영속한 뒤 전용 WRITE 작업실로 전환.
- 미반영 PLAY는 작업본 열기를 막지 않고, 명시적 회차 저장 때 최신화 안내로 차단한다. 안전할 때만 본편·PLAY working을 같은 새 회차로 맞춘다.
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

## 사용자 테스트 수정 Task 6 — 복구 작업본 도메인·영수증 의미 RED→GREEN

사용자 실화면에서 PLAY 복구 TXT 전체가 소설 본문 회차로 바로 들어가 회차 수·품질 입력까지 오염되는 결함을 확인했다. 기존 Task 1/4의 "WRITE 초안 = 즉시 Chapter" 계약을 폐기하고 다음 실패 테스트를 먼저 추가한다.

- `PlayRecoveryWorkDraft`는 빈 제목·본문과 분리된 source snapshot으로 생성되며 프로젝트를 참조 동일하게 보존한다.
- 같은 generation/snapshot 재열기는 기존 작업 본문을 덮지 않는다.
- 프로젝트별 여러 작업본·active draft가 새로고침과 작품 전환을 살아남고 손상 항목만 제거된다.
- 빈 본문은 회차 저장을 차단하고, 작성 본문은 명시 저장 때 정확히 한 회차만 만든다.
- 저장된 Chapter에는 PLAY 원문 헤더·보존 시각·복구 경고가 들어가지 않고 `newCanonFacts=[]`다.
- 작업본 열기에는 pending-sync가 영향을 주지 않되, 회차 저장에는 기존 pending-sync 게이트가 적용된다.
- 영수증의 draft-open 필드와 recovered 필드를 분리하고 polling/직렬화가 둘을 보존한다.

그 뒤 `playRecovery.ts`·별도 `playRecoveryStore.ts`·`generationInbox.ts`를 최소 구현한다.

## 사용자 테스트 수정 Task 7 — 엄격한 legacy 환원 RED→GREEN

이전 구현이 이미 만든 잘못된 회차를 안전하게 치유한다.

- 영수증 chapter id, project/episode, 정확한 제목·hook·포맷 본문, 빈 outline/beats/canon/reward/stakes, 미잠금, 최신 회차, currentEpisode를 모두 확인한다.
- PLAY working copy에 같은 id가 있으면 동일 조건으로 함께 환원할 수 있을 때만 committed도 제거한다.
- 본문 1자 수정·잠금·후속 회차·캐논/구조 추가·id 불일치 중 하나라도 있으면 자동 변경하지 않는다.
- 성공 시 먼저 별도 작업본을 영속하고 본편/working에서 오염 회차를 제거한 뒤 receipt를 draft-open 상태로 전환한다.

## 사용자 테스트 수정 Task 8 — 전용 WRITE 복구 작업실 RED→GREEN

`RecoveryDraftWorkspace`를 일반 회차 편집기와 분리해 다음 계약을 테스트한다.

- 원고지 밖 배너 `복구 작업본 · 아직 본편 아님`.
- 빈 제목·본문, 본문 placeholder, 접이식 PLAY 원문 참고 패널.
- source transcript가 작업 textarea 값에 섞이지 않음.
- 빈 본문 `회차로 저장` 비활성, 작성 뒤 한 번 호출, 저장 영향 설명.
- 작업본 저장 상태·저장 실패 경고·본편 복귀(삭제하지 않음).
- 1080px 이하 source 패널 폭 축소, 820px 이하 stack, 560px 이하 터치/줄바꿈.

`StoryXDesk`는 recovery prop이 있을 때 전용 작업실을 렌더하고, 최신 Chapter 초기 선택·800ms prose autosave·회차 reseed를 모두 우회한다. App은 열기에서 본편을 변경하지 않고, 명시 저장 콜백에서만 pending-sync→chapter commit→working sync→receipt 완료를 수행한다.

## 사용자 테스트 수정 Task 9 — 회귀·실브라우저·인계

1. 관련 RED 증거 뒤 GREEN.
2. 기존 잘못 생성된 테스트 회차가 엄격 조건에서 복구 작업본으로 환원되는지 확인한다.
3. 생성 보관함→작업본 열기에서 회차 수 불변·빈 본문·분리 source·새로고침 지속을 확인한다.
4. 한 문장 작성→회차로 저장 뒤에만 회차 수가 정확히 1 증가하고 배너/source가 사라지는지 확인한다.
5. TXT 내용은 기존 계약 그대로인지, 콘솔 오류와 좁은 화면 가로 넘침이 없는지 확인한다.
6. `bash init.sh`, progress/handoff, 커밋·push, 기존 Draft PR #40 본문 갱신. 머지는 사용자에게 남긴다.

## 차단 감사 수정 Task 10 — 부분 저장 재시도·이탈 안전성 RED→GREEN

읽기 전용 병렬 감사에서 `project → PLAY working → receipt → draft 삭제` 중간 실패가 동일 원고의 중복 회차 또는 고립 작업본을 만들 수 있음을 확인했다. 다음 실패 테스트를 먼저 추가하고 RED를 확인한다.

- 작업본의 `commitIntent`·`legacyRepair` journal 직렬화/손상 거부/새로고침 복원.
- intent가 아직 본편에 없으면 prepared, 정확한 회차가 있으면 committed, 같은 id의 다른 본문이면 conflict 판정.
- recovered/opened 영수증 메타는 각 필드 쌍이 완전할 때만 파싱.
- journal 중 제목·본문 잠금, `저장 마무리` CTA, 제목 Enter·IME 제출 차단.
- 일반 WRITE가 debounce 전에 언마운트돼도 최신 본문을 동기 flush.
- 잡 등록 전 실패 작업본도 local receipt를 만들어 생성 보관함 재열기 경로 확보.
- receipt의 `recoveryDraftId`를 local receipt id 재해시보다 우선해 기존 작성 본문을 정확히 재연다.
- 저장소의 최신 journal을 먼저 읽어 stale 탭이 `commitIntent`·`legacyRepair`를 지우거나 같은 본문을 다음 회차로 중복 저장하지 못하게 한다.
- legacy 환원은 journal 영속 뒤 본편·PLAY working 최신본을 다시 읽고 엄격 판정을 재실행한 뒤에만 회차를 제거한다.
- local receipt 영속이 실패하면 작업본을 닫거나 보관함 재진입 가능하다고 표시하지 않는다.
- 저장소 cap은 active·journal·작성 본문 작업본을 조용히 버리지 않고, 안전한 빈 비활성 작업본만 먼저 정리한다.

그 뒤 회차 저장 전에 intent를 영속하고, 이미 저장된 회차 재사용 → PLAY working 보강 → 완료 receipt의 실제 영속 확인 → draft 제거 순으로 마무리한다. 어느 단계든 실패하면 journal과 화면을 보존하고 이탈을 막는다. legacy 환원도 journal로 receipt 전환을 재개한다.

App 문자열 순서 단언만으로 끝내지 않고 저장소 실패를 주입하는 거래 테스트로 각 부분 성공 지점과 재시작 복원을 검증한다. 브라우저 인수에서는 빈 작업본·source 분리·재열기·명시 저장뿐 아니라 320px 상단 작업바와 콘솔 오류도 확인한다.
