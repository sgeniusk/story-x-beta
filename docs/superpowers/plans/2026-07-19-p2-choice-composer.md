# P2-c1 — 선택지 칩 → 작성창 구현 계획

## 목표

PLAY 추천 선택지를 즉시 전송하지 않고 작성창에 담아, 사용자가 자기 말투로 고친 뒤 명시적으로 전송하게 한다. 작성 중인 답변과 P0/P1 생성·복구·반출 계약은 그대로 보존한다.

## Task 1 — 선택·수정·전송 계약 RED→GREEN

1. `src/components/diveDesk.test.ts`에 실제 첫 요청이 `choices`를 돌려주는 상호작용을 만든다.
2. 칩 클릭 뒤 fetch·`onChange`가 추가 호출되지 않고 textarea 값과 focus만 바뀌는 실패 테스트를 먼저 추가한다.
3. 선택 문구를 수정한 뒤 `보내기`를 눌렀을 때 두 번째 요청의 `query`가 수정본과 정확히 같고 한 번만 전송되는 실패 테스트를 추가한다.
4. 한글 IME 조합 확정 Enter가 전송으로 오인되지 않는 실패 테스트를 추가한다.
5. RED를 확인한 뒤 `DiveDesk.tsx`에 textarea ref와 칩 전용 `putChoiceInComposer`, IME 조합 보호를 구현한다. 공유 `send(textArg?)`는 변경하지 않는다.

## Task 2 — 기존 답변 보존·되돌리기 RED→GREEN

1. 응답 뒤 사용자가 직접 입력하면 추천 칩이 숨고 입력값이 보존되는 실패 테스트를 추가한다.
2. 직접 입력을 모두 지우면 전송 전 choices가 다시 나타나는 실패 테스트를 추가한다.
3. 추천 영역 조건에 빈 작성창 계약을 반영하고, 칩 선택 때 choices를 삭제하지 않는다.
4. `⏳ 계속`, `⏭ 전개`, VS 후보 호출부가 기존 `send(textArg)`를 계속 쓰는지 회귀 확인한다.

## Task 3 — 의도 안내·접근성·레이아웃 RED→GREEN

1. 선택지 영역에 `추천 답변 · 눌러 작성창에 담아 고치세요` 안내와 group/button 의미를 고정하는 실패 테스트를 추가한다.
2. 작성창에 명확한 접근성 이름을 주고, 칩 선택 뒤 focus와 커서 끝 위치를 검증한다.
3. `src/styles.studio.test.ts`에 안내가 warm `--st-*` 토큰을 쓰고 기존 칩 wrap을 유지하는 계약을 추가한다.
4. `src/styles.css`에서 기존 `.dx-choices`를 감싸는 최소 안내 스타일만 추가한다. 새 애니메이션과 색 체계는 만들지 않는다.

## Task 4 — 검증·인계

1. 변경 컴포넌트·스타일 집중 테스트와 `tsc --noEmit`을 실행한다.
2. 로컬 5175에서 실제 선택지 응답 또는 결정적 상태를 사용해 칩 클릭 시 요청 0, 수정 후 명시 전송을 확인한다.
3. 1280·390·320px에서 안내·칩·composer 겹침, 가로 overflow, 키보드 focus, 콘솔 오류를 실측한다.
4. 독립 코드 감사와 브라우저 레이아웃 감사를 통과한다.
5. `bash init.sh` 전체 녹색을 확인한다.
6. `progress.md`와 `session-handoff.md` 맨 위를 갱신하고 커밋·push·Draft PR을 만든다. base는 `codex/p1b-text-export`이며 머지는 사용자에게 남긴다.

## 허용 파일

- `src/components/DiveDesk.tsx`
- `src/components/diveDesk.test.ts`
- `src/styles.css`
- `src/styles.studio.test.ts`
- `docs/superpowers/specs/2026-07-19-p2-choice-composer-design.md`
- `docs/superpowers/plans/2026-07-19-p2-choice-composer.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

`src/App.tsx`, `src/lib/storyEngine.ts`, 생성 클라이언트·서버·잡·캐논·저장소 코드는 변경하지 않는다. 사용자 소유 `.agents/skills/story-score/`는 읽기·수정·staging 모두 하지 않는다.
