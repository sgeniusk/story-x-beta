# P2-d 응결 목표 분량 구현 계획

> 설계: `docs/superpowers/specs/2026-07-20-p2d-condense-target-length-design.md`
> 단일 슬라이스: 새 응결의 회차별 3천/5천/8천 목표를 생성·복구·검토·WRITE까지 잃지 않는다.

## 작업 순서

### 1. 도메인 계약 — 반드시 첫 RED

1. `src/lib/storyEngine.test.ts`에 먼저 실패 테스트를 추가한다.
   - 기본 `standard=5,000`, 세 프리셋의 ±10% 범위·생성 범위·장면 수.
   - 공백 제외 글자 수와 `under | within | over` 판정.
   - `chapterFromDraftPayload`가 요청의 계약을 Chapter에 기록.
2. 해당 테스트만 실행해 RED를 확인한다.
3. `src/lib/storyEngine.ts`에 `EpisodeLengthContract`·프리셋 상수·parser·counter·평가 함수를 구현한다.
4. `src/lib/storage.ts`와 테스트에서 valid 계약은 보존하고 invalid optional 계약만 강등한다.

### 2. 요청·프롬프트·실제 CLI — TDD

1. `src/lib/server/promptBuilders.test.ts`에 세 프리셋 동적 분량·장면·무패딩 계약 테스트를 먼저 추가한다.
2. `src/storyxCliScript.test.ts`에 세 프리셋의 TS/CLI byte-identical dry-run과 결과 메타 테스트를 추가한다.
3. RED 뒤 `src/lib/server/promptBuilders.ts`와 `tools/storyx.mjs`를 같은 문장으로 구현한다.
4. `src/lib/diveClient.test.ts`, `src/viteJobBridge.test.ts`를 먼저 보강한 뒤 `src/lib/diveClient.ts`, `vite.config.ts`에 필수 v1 계약 전달·검증·CLI 인자를 구현한다.
5. 직접 API/CLI의 비문자·공백·누락 transcript와 다음 flag 승격을 RED로 고정하고 생성 전에 fail-closed한다.
6. 다른 목표가 다른 canonical dedupe 입력이며 mock/실제 결과가 계약·actualChars·상태를 갖는지 확인한다.
7. 장문 로컬 Codex는 provider 9분·잡 10분으로 경합을 피하고, timeout을 무재시도·비민감 구조화 메타로 남기는 RED를 고정한다.

### 3. 영수증·복구·재시도 — TDD

1. `src/lib/playRecovery.test.ts`, `src/lib/playRecoveryStore.test.ts`, `src/lib/generationInbox.test.ts`에 다음 RED를 추가한다.
   - snapshot/root/recovery-work-draft 왕복.
   - quota 압축 뒤 root 목표 보존.
   - 손상된 optional 목표만 강등.
   - poll·404·checkpoint 병합 뒤 목표 보존.
2. `src/lib/diveSession.ts`에 PLAY 세션 선택값을 optional로 저장하고 새/legacy 기본은 도메인 helper로 5천자를 해석한다.
3. `src/lib/playRecovery.ts`, `src/lib/playRecoveryStore.ts`, `src/lib/generationInbox.ts`, `src/App.tsx`에 계약을 배선한다.
4. 실패 재시도는 영수증 root의 frozen span·scene·episode·목표를 쓰고, 전체 ordered ID·연속 turn이 현재 PLAY와 정확히 맞을 때만 차단 턴과 추가 PLAY 턴을 제외해 조립한다.
5. 영수증 root 목표나 exact source가 없거나 손상된 경우 기본값·raw recovery transcript로 강등하지 않고 TXT·분리 작업본만 남기는 회귀를 고정한다. 영수증 없는 등록 전 로컬 실패만 recovery 목표를 허용한다.
6. root가 삭제된 현대 영수증은 nested 길이 메타로 marker만 복원하고, commitIntent journal 재로드 뒤 receipt 연결·목표를 다시 검증하는 우회 회귀를 고정한다.

### 4. PLAY·보관함·WRITE 표면 — TDD

1. `src/components/diveDesk.test.ts`에 기본 선택·선택 변경·유효 재료 차단·요청 snapshot·retry·진행 카드·under/within/over·명시 승인 copy 테스트를 먼저 추가한다.
2. `src/components/generationInboxPanel.test.ts`, `src/components/workStateGrid.test.tsx`, `src/components/floatingEditor.test.ts`, `src/editorFocusLayout.test.ts`에 목표 표시·동적 진행률·실제 WRITE 편집기의 빈 본문 0자 회귀 테스트를 추가한다.
3. RED 뒤 `src/components/DiveDesk.tsx`, `src/components/GenerationInboxPanel.tsx`, `src/components/WorkStateGrid.tsx`, `src/components/FloatingEditor.tsx`, `src/StoryXDesk.tsx`, `src/styles.css`를 구현한다.
4. 선택기는 sticky dock 앞의 비고정 compact fieldset으로 두고 `지금 응결` CTA를 작성창에서 이 레일로 옮긴다. global warm `--st-*` 토큰만 사용하고 새 애니메이션은 추가하지 않는다.

### 5. StoryScore 일관성

1. `src/storyscoreCli.test.ts`에 회차별 v1 목표와 legacy 고정 범위 입력을 함께 넣어 RED를 확인한다.
2. `tools/storyscore.mjs`가 새 Chapter 계약이 있으면 그 범위와 공백 제외 카운트를 쓰고, legacy 회차는 기존 1,800~2,700 분석을 유지하게 한다.

### 6. 검증·인계

1. 집중 테스트 → 전체 `npm test` → `npm run build`를 순서대로 통과시킨다.
2. 연속성·복구·UI 관점의 독립 코드 검토를 받고 차단 항목을 해결한다.
3. 로컬 앱에서 390px·320px와 데스크톱을 확인하고, 5천자 mock 및 실제 로컬 Codex 응결 한 건을 동기 실행해 요청·진행·검토·WRITE 반영을 확인한다. 실제 결과는 사용자 승인 없이 캐논에 넣지 않는다.
4. `bash init.sh` 최종 녹색 후 `progress.md` 검증 증거를 갱신하고 `session-handoff.md` 맨 위에 인계 노트를 추가한다.
5. milestone id를 포함해 커밋·push하고, `codex/p2-choice-composer`를 base로 Draft PR을 만든다. 머지는 사용자에게 남긴다.

## 허용 파일

- `src/lib/storyEngine.ts`, `src/lib/storyEngine.test.ts`, `src/lib/storage.ts`, `src/lib/storage.test.ts`
- `src/lib/server/promptBuilders.ts`, `src/lib/server/promptBuilders.test.ts`
- `src/lib/diveClient.ts`, `src/lib/diveClient.test.ts`, `src/viteJobBridge.test.ts`, `vite.config.ts`
- `tools/storyx.mjs`, `src/storyxCliScript.test.ts`
- `src/lib/diveSession.ts`, `src/lib/diveSession.test.ts`
- `src/lib/playRecovery.ts`, `src/lib/playRecovery.test.ts`
- `src/lib/playRecoveryStore.ts`, `src/lib/playRecoveryStore.test.ts`
- `src/lib/generationInbox.ts`, `src/lib/generationInbox.test.ts`, `src/App.tsx`, `src/appExperience.test.ts`
- `src/components/DiveDesk.tsx`, `src/components/diveDesk.test.ts`
- `src/components/GenerationInboxPanel.tsx`, `src/components/generationInboxPanel.test.ts`
- `src/components/WorkStateGrid.tsx`, `src/components/workStateGrid.test.tsx`
- `src/components/FloatingEditor.tsx`, `src/components/floatingEditor.test.ts`, `src/editorFocusLayout.test.ts`
- `src/StoryXDesk.tsx`, `src/styles.css`
- `tools/storyscore.mjs`, `src/storyscoreCli.test.ts`
- 본 spec·plan, 종료 시 `progress.md`, `session-handoff.md`

사용자 소유 미추적 `.agents/skills/story-score/`는 읽기·수정·stage하지 않는다.
