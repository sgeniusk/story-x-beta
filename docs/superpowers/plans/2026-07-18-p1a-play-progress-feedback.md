# P1-a — PLAY 진행 피드백 구현 계획

## 목표

PLAY 대화·쇼러너·전개 후보·응결 등록·실행 중 응결에 실제 경과시간과 정직한 단계 안내를 제공한다. 가짜 진행률이나 강제 스크롤 없이, 사용자가 요청이 살아 있는지와 화면을 떠나도 되는지를 즉시 판단하게 한다.

## Task 1 — 진행 표현 도메인 RED→GREEN

1. `src/lib/generationProgress.test.ts`에 PLAY 작업 kind별 label·단계 경계·기대 안내와 긴 대기 수렴 실패 테스트를 먼저 추가한다.
2. 숫자/ISO 시작 시각의 경과 초 계산, 미래·손상 timestamp의 `0:00` 안전 강등 테스트를 추가한다.
3. RED를 확인한 뒤 `PlayProgressKind`, `playProgressPresentation`, `elapsedSecondsSince`를 `src/lib/generationProgress.ts`에 구현한다.
4. 기존 초안·인터뷰 진행 표현과 `formatElapsed` 회귀가 없는지 집중 테스트한다.

## Task 2 — DiveDesk 요청 clock·응결 receipt RED→GREEN

1. `src/components/diveDesk.test.ts`에 지연된 대화의 `0:00 → 0:01` 경과, 시간 구간별 문구 전환, 완료·실패 뒤 제거 실패 테스트를 추가한다.
2. 전개 후보와 응결 등록이 서로 다른 label·hint를 보여 주는 실패 테스트를 추가한다.
3. 실행 중 응결 receipt가 `createdAt`부터의 경과, 화면 이탈 가능 안내, 취소·보관함 행동을 함께 보이는 실패 테스트를 추가한다.
4. RED를 확인한 뒤 로컬 요청의 kind·startedAt과 공유 1초 clock을 `DiveDesk.tsx`에 구현한다.
5. 기존 `.dx-status` 중복을 제거하고, 오류·복구·취소·승인 의미와 입력 보존은 변경하지 않는다.

## Task 3 — 작업등 UI·접근성 RED→GREEN

1. `src/styles.studio.test.ts`에 작업등이 warm `--st-*` 토큰, PLAY 의미색, 축소 모션 규칙, 작은 화면 wrap을 지키는 실패 테스트를 추가한다.
2. 상태 레일을 sticky composer 바로 위에 배치하고, 페이지 강제 스크롤 API를 추가하지 않았음을 컴포넌트 계약으로 고정한다.
3. `role=status`, `aria-live=polite`, `aria-atomic=true`를 적용하되 매초 바뀌는 `<time>`은 `aria-hidden=true`로 둔다.
4. 새 pulse는 기존 `fc-gen-pulse`와 `--st-dur-*`/`--st-ease`만 사용하고 `prefers-reduced-motion`에서 정지한다.

## Task 4 — 검증·인계

1. 변경한 도메인·컴포넌트·스타일 집중 테스트와 `tsc --noEmit`을 실행한다.
2. 로컬 preview에서 390px·1280px 작업등/composer 겹침, 가로 overflow, 수동 scroll 안정성, 완료 뒤 상태 제거를 실측한다.
3. 독립 코드 감사와 실제 브라우저 레이아웃 감사를 통과한다.
4. `bash init.sh` 전체 녹색을 확인한다.
5. `progress.md`와 `session-handoff.md` 맨 위를 갱신하고 커밋·push·Draft PR을 만든다. base는 `codex/p0a-condense-source-boundary`이며 머지는 사용자에게 남긴다.

## 허용 파일

- `src/lib/generationProgress.ts`
- `src/lib/generationProgress.test.ts`
- `src/components/DiveDesk.tsx`
- `src/components/diveDesk.test.ts`
- `src/styles.css`
- `src/styles.studio.test.ts`
- `docs/superpowers/specs/2026-07-18-p1a-play-progress-feedback-design.md`
- `docs/superpowers/plans/2026-07-18-p1a-play-progress-feedback.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

`src/App.tsx`와 요청·polling 구현은 이번 슬라이스에서 변경하지 않는다. 사용자 소유 `.agents/skills/story-score/`는 읽기·수정·staging 모두 하지 않는다.
