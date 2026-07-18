# P0-a 후속 — PLAY 응결 source boundary 구현 계획

## 목표

응결 시작 시점의 미소비 PLAY 턴을 최신 두 턴까지 이번 회차에 정확히 한 번 사용하고, 승인 뒤 마지막 두 턴은 다음 PLAY 연결 문맥으로만 남긴다. 생성 뒤 대화와 캐논 검토를 exact source span으로 격리한다.

## Task 1 — source boundary 도메인 RED→GREEN

1. 프로젝트 규칙에 따라 `src/lib/storyEngine.test.ts`에 “최신 두 턴은 이번 transcript에 포함되고 승인 뒤 다음 transcript에서는 제외된다”는 통합 실패 테스트를 먼저 추가한다.
2. `src/lib/diveSession.test.ts`에 source span 고정, 연결 문맥 보존, 생성 뒤 추가 턴 보존, 멱등 재적용, legacy 숫자 경계 실패 테스트를 추가한다.
3. RED를 확인한 뒤 `CondenseSourceSpan`, parser/builder, `lastCondensedTurn` 기반 source 선택, exact checkpoint 적용을 `diveSession.ts`에 구현한다.
4. `shouldSuggestCondense`, recent dialogue, 캐논화 차단 transcript 회귀를 확인한다.

## Task 2 — recovery·receipt 영속 RED→GREEN

1. `playRecovery.test.ts`에 source span과 “이미 소비된 연결 문맥은 recovery transcript에서 제외” 실패 테스트를 추가한다.
2. `generationInbox.test.ts`와 `playRecoveryStore.test.ts`에 source span 왕복·손상 강등·성공 recovery 압축 뒤 root span 생존 실패 테스트를 추가한다.
3. `PlayRecoverySnapshot`, `GenerationInboxItem`, `ApprovedCondenseCheckpoint`에 하위호환 optional span을 배선한다.
4. App 생성 시작 영수증이 recovery span을 root에 복사하고, write-ahead checkpoint가 exact span을 보존하게 한다.

## Task 3 — 검토·승인 경계 RED→GREEN

1. `playRuntimeValidator.test.ts`에 생성 뒤 추가된 surprise/conflict가 옛 응결 검토에 섞이지 않는 실패 테스트를 추가한다.
2. `diveDesk.test.ts`에 요청 transcript 최신 턴 포함, root span 우선, 지연 승인 뒤 source tail/후속 대화 분리, legacy fallback 실패 테스트를 추가한다.
3. `deriveDeviationCandidates`가 source span 또는 legacy boundary로 정확히 필터하게 한다.
4. DiveDesk와 App 승인 경로가 현재 PLAY snapshot의 turn·ID와 일치하는 root → recovery span만 사용하고, 불일치 시 legacy → 0으로 안전 강등하게 한다.
5. 부분 저장 재개에서도 승인 checkpoint의 동일 경계를 재적용하게 한다.

## Task 4 — 연결 문맥 UI RED→GREEN

1. `diveDesk.test.ts`에 승인 뒤 연결 문맥 구분선이 있을 때만 렌더되는 실패 테스트를 추가한다.
2. PLAY 채팅에서 `turn <= lastCondensedTurn`인 보존 메시지 앞에 `지난 회차에서 이어지는 대화` 구분선을 추가한다.
3. 스튜디오 warm token만 사용해 구분선을 낮은 대비로 스타일링하고 작은 화면 회귀를 확인한다.
4. 390px 실측에서 발견된 기존 composer 입력칸 폭 붕괴를 TDD로 고쳐, 600px 이하에서는 입력칸을 한 행으로 확보하고 버튼을 감싼다.

## Task 5 — 검증·인계

1. 변경한 도메인·영속·컴포넌트·App 계약 테스트를 집중 실행한다.
2. 로컬 preview에서 새 PLAY 대화를 응결하고 승인한 뒤 연결 문맥이 남는지 확인한다.
3. 새 대화를 추가한 뒤 다음 응결 요청 transcript에 연결 문맥이 빠지고 새 대화만 들어가는지 확인한다.
4. `bash init.sh` 전체 녹색을 확인한다.
5. `progress.md`와 `session-handoff.md` 맨 위를 갱신하고 커밋·push·Draft PR을 만든다. base는 `codex/p0a-condense-quality-contract`, 머지는 사용자에게 남긴다.
