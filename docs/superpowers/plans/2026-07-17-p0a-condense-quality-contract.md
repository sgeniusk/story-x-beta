# P0-a 후속 — PLAY 응결 장면화·보이스 품질 계약 구현 계획

## 목표

실제 dogfooding에서 나온 요약체·0대사·약한 후크·메타 표식 작품화 문제를, 결과 후처리로 숨기지 않고 입력 컨텍스트와 생성 계약에서 먼저 고친다.

## Task 1 — 보이스 컨텍스트 RED→GREEN

1. `src/lib/storyEngine.test.ts`에 tone/rhythm/vocab 바이블이 context digest에 출력되는 실패 테스트를 먼저 추가한다.
2. RED를 확인한 뒤 `buildProjectContextDigest`에 `한국어 문체·보이스 규칙` 섹션을 추가한다.
3. 기존 캐논·인물·세계 규칙 컨텍스트 회귀를 확인한다.

## Task 2 — 응결 prompt builder RED→GREEN

1. `src/lib/server/promptBuilders.test.ts`에 장면화 품질 계약과 CLI 미러 실패 테스트를 먼저 추가한다.
2. `buildDiveCondensePrompt`를 TypeScript 빌더에 추가한다.
3. `tools/storyx.mjs`에 byte-identical 핵심 문장을 미러하고 `dive-condense` 명령이 빌더를 사용하게 한다.
4. 실제 1차 생성의 voice-curator P1을 실패 입력으로 삼아 감정 재설명·금지어·호칭/높임말 흔들림·기능적 선택 해설을 막는 최종 문장 검수 계약을 추가한다.
5. 2차 실생성의 1,761자 결과를 실패 입력으로 삼아, 1,800자 미만이면 새 설정·기능 해설·반복 대신 기존 장면의 행동·감각·갈등 대사를 구체화하는 self-check를 추가한다.
6. 3차 실생성의 voice-curator P1을 실패 입력으로 삼아 캐릭터 카드 이행 보고·장면 기능 명명·양자택일 재설명을 막고, 말미 2~3문장을 각각 하나의 구체 사건을 담은 독립문으로 제한한다.
7. 4차 실생성의 하한 미달을 실패 입력으로 삼아 최종 허용 범위 1,800~2,700자 안에서 실제 생성 목표를 1,900~2,600자로 보정한다.
8. 5차 실생성에서 남은 `말투가 짧아졌다`식 캐릭터 카드 이행 보고를 실패 입력으로 삼아, 말투 규칙은 실제 대사 배열에만 적용하고 대사 앞뒤의 리듬 해설을 금지한다.
9. JSON 출력 형태와 mock 계약은 유지한다.

## Task 3 — 인물 입력 밀도 RED→GREEN

1. `src/components/diveDesk.test.ts`의 잡 요청 캡처에 wound/currentState/canonAnchors 포함 실패 테스트를 추가한다.
2. `characterCardText`가 욕망·상처·현재 상태·말투·캐논 앵커를 전달하게 한다. 관계 전체나 민감 원문은 추가하지 않는다.

## Task 4 — 검증

1. `storyEngine.test.ts`, `promptBuilders.test.ts`, `diveDesk.test.ts`, `storyxCliScript.test.ts` 집중 실행.
2. 로컬 Codex로 같은 PLAY 재료를 새 테스트 프로젝트에서 응결한다.
3. 1,800~2,700자, 2~3 장면, 직접 대화, 실제 대가, 구체 후크, P0B 표식 제외, 보이스 규칙 반영을 근거 문장으로 확인한다.
4. voice-curator로 물리 묘사 뒤 감정 재설명·인물 말투 드리프트·기능적 선택 요약이 남는지 재감사한다.
5. `bash init.sh` 녹색, progress/handoff, 별도 커밋·push·Draft PR 기록. 머지는 사용자에게 남긴다.
