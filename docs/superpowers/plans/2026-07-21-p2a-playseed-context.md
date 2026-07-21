# P2-a — PLAY 시드 확인 카드 맥락 정리 구현 계획

## 목표

PLAY 시드 확인 카드를 현재 선택한 setup의 검토·상대 선택 단계로 한정한다. 초기 Dive X 범용 상대 3종이 다른 세계관에 섞이거나 현재 setup을 조용히 교체하는 경로를 제거한다.

## Task 1 — 확인 카드 구조 계약 RED→GREEN

1. `src/components/playSeedPanel.test.ts`의 `프리셋 3칩을 항상 렌더` 계약을 제거한다.
2. contextual setup에서 범용 preset 그룹·접근성 이름이 없어야 하고, cast partner 버튼 수가 setup의 cast 수와 정확히 같아야 한다는 실패 테스트를 먼저 추가한다.
3. setup 없음·loading·error·confirm disabled와 partner 선택 테스트는 유지해 제거 범위 밖 회귀를 감시한다.
4. RED를 확인한 뒤 `PlaySeedPanel.tsx`에서 `presets`, `onPickPreset` props와 범용 칩 블록을 제거한다.

## Task 2 — App 배선·사장 스타일 RED→GREEN

1. `src/appExperience.test.ts`에 `PlaySeedPanel` 호출 구간이 `DIVE_SEED_CHARACTERS`, `presetToDiveSetup`, `presets`, `onPickPreset`을 넘기지 않는 소스 계약을 실패 테스트로 추가한다.
2. `src/App.tsx`에서 확인 카드 전용 import와 props·콜백을 제거한다. 인기 프리셋 `pickStoryPreset`, 함께 구상 `useOnboardSetup`, `confirmPlaySeed`는 변경하지 않는다.
3. `src/styles.css`에서 이제 호출자가 없는 `.hx-playseed-presets`·`.hx-playseed-preset*` 규칙만 삭제한다. contextual card·partner·action 스타일은 유지한다.
4. `DIVE_SEED_CHARACTERS`와 `presetToDiveSetup` 도메인 모듈·테스트는 그대로 보존한다.

## Task 3 — 집중 회귀·브라우저 검증

1. PlaySeedPanel·App experience·playEntry·storyPresets·diveSeedCharacters 집중 테스트를 실행한다.
2. 타입 검사와 `git diff --check`를 통과시킨다.
3. 로컬 브라우저에서 인기 프리셋과 함께 구상 두 진입 경로를 각각 확인한다.
4. 1280·390·320px에서 현재 setup만 표시되는지, 상대 선택·이전·시작 버튼과 가로 overflow·콘솔 오류를 실측한다.
5. Quick 페르소나 재검토에서 현재 세계관 맥락·연속성·범위 준수를 독립 판정한다.

## Task 4 — 전체 검증·인계

1. 완료 주장 전에 `bash init.sh`를 다시 실행한다.
2. `progress.md`의 최근 검증과 P2-a 완료 트랙을 갱신한다.
3. `session-handoff.md` 맨 위에 구현·검증·Files NOT To Touch를 남긴다.
4. milestone id를 포함해 커밋하고 `codex/sites-private-pilot` base의 Draft PR을 만든다. 머지는 사용자에게 남긴다.

## 허용 파일

- `src/components/PlaySeedPanel.tsx`
- `src/components/playSeedPanel.test.ts`
- `src/App.tsx`
- `src/appExperience.test.ts`
- `src/styles.css`
- `docs/superpowers/specs/2026-07-21-p2a-playseed-context-design.md`
- `docs/superpowers/plans/2026-07-21-p2a-playseed-context.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

`src/lib/storyEngine.ts`, 생성 클라이언트·서버·프롬프트·잡·캐논·저장소·S3 코드는 변경하지 않는다. 사용자 소유 `.agents/skills/story-score/`는 읽기·수정·staging 모두 하지 않는다.
