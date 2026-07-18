# P1-a PLAY 진행 피드백 설계

> 날짜: 2026-07-18
> 상태: brainstorm 결정 완료
> 브랜치: `codex/p1a-play-progress-feedback`
> 기준: Draft PR #42 (`codex/p0a-condense-source-boundary`) 위 단일 슬라이스

## 문제

PLAY 대화는 보통 30초~1분, 전개 후보는 약 30초, 응결은 2~3분 걸리지만 현재 화면은 각각 `입력 중…`, `잠시만요`, `백그라운드에서 응결 중`만 표시한다. 사용자는 경과시간과 다음 상태를 알 수 없어 멈춤·실패로 오인한다. 2026-07-13 실플레이에서 이 침묵이 새로고침과 몰입 이탈로 이어졌다.

P0-a 잡+폴링 도입 뒤 응결 중 화면을 비우거나 강제로 스크롤하는 코드는 더 이상 없지만, 진행 카드가 작성창에서 멀고 비동기 UI가 작성창 위에 삽입되는 구조라 체감상 상태가 사라질 수 있다. 이번 슬라이스는 스트리밍을 흉내 내지 않고 현재 비동기 계약을 정직하게 설명한다.

## Brainstorm 결정

### 질문 1 — 어느 작업을 같은 진행 피드백 계약으로 묶는가?

**결정:** PLAY 대화, 쇼러너, 전개 후보, 응결 잡 등록, 실행 중 응결을 묶는다. 쇼러너는 기존 `busy` 상태를 대화와 공유하므로 함께 교체하되 생성 동작 자체는 바꾸지 않는다. 정밀 검토와 온보딩·WRITE·PLAN은 이번 범위 밖이다.

### 질문 2 — 실제 서버 telemetry가 없는데 무엇을 진행률로 보여 주는가?

**결정:** 실제 경과시간과 시간 구간별 기대 안내만 보여 준다. 퍼센트, 남은 시간, 완료 임박 같은 확정 표현은 쓰지 않는다. 단계 문구는 `장면 읽기 → 반응 다듬기`, `갈래 찾기 → 대가 비교`, `원문 정리 → 장면 구성 → 보이스·연속성 점검`처럼 사용자에게 작업의 목적을 설명한다.

### 질문 3 — 응결의 대기 안내는 다른 요청과 어떻게 다른가?

**결정:** 대화·후보는 현재 화면에서 기다려야 하는 HTTP 요청이므로 예상 범위를 알린다. 응결은 서버 잡이 완주하고 영수증이 보관함에 남으므로 `화면을 떠나도 계속됩니다`를 명시한다. 새로고침 금지 문구를 복사하지 않는다.

### 질문 4 — 진행 카드는 어디에 놓고 스크롤은 어떻게 다루는가?

**결정:** 대화와 작성창 사이, sticky composer 바로 위의 한 작업등(activity rail)에 렌더한다. 기존 채팅과 작성창은 계속 mount하며, `window.scrollTo`·`scrollIntoView`·페이지 강제 바닥 이동을 추가하지 않는다. 실행 중 응결의 경과 안내도 같은 하단 작업 영역에서 확인 가능해야 한다. 실제 390px·1280px에서 작성창 가시성, 수동 스크롤 위치, 빈 검은 화면 부재를 검증한다.

### 질문 5 — 타이머의 시작점과 재진입은 어떻게 계산하는가?

**결정:** 대화·후보·등록은 사용자 행동 시각부터 1초 단위로 계산하고 종료 시 즉시 정리한다. 실행 중 응결은 영수증 `createdAt`에서 계산해 PLAY 재진입·새로고침 뒤에도 이어진 경과를 표시한다. 미래·손상 timestamp와 음수는 `0:00`으로 안전 강등한다.

### 질문 6 — 접근성과 시각 언어는 어떻게 유지하는가?

**결정:** 조용한 편집실의 작은 작업등처럼 `--st-*` warm studio 토큰과 PLAY lime 의미색을 사용한다. 상태 문구는 `role=status`, `aria-live=polite`, `aria-atomic=true`로 알리되 매초 바뀌는 `<time>`은 `aria-hidden=true`로 두어 화면낭독기 반복을 막는다. 점멸 장식은 `aria-hidden`이고 `prefers-reduced-motion`에서 정지한다.

### 질문 7 — 함께 발견된 비동기 race와 polling hang도 고치는가?

**결정:** 아니다. VS 요청 중 대화가 진행되면 늦은 후보가 다시 나타나는 race, non-2xx chat 응답 검사, polling GET 무한 대기는 별도 신뢰성 슬라이스다. 이번 변경은 상태 관찰과 안내만 추가하며 요청·성공·실패·취소·승인 의미를 바꾸지 않는다.

## 도메인 계약

`src/lib/generationProgress.ts`에 PLAY 전용 순수 계약을 추가한다.

- `PlayProgressKind`: `dialogue | showrunner | candidates | condense-register | condense`
- `playProgressPresentation(kind, elapsedSeconds)`: label·stage message·honest hint
- `elapsedSecondsSince(startedAt, now)`: number/ISO 시작점의 안전한 경과 초
- 기존 `formatElapsed`, 온보딩 인터뷰·초안 API는 변경하지 않는다.

## UI 계약

- `DiveDesk`는 로컬 요청의 kind·startedAt을 기록하고 활성 동안 하나의 1초 clock을 운용한다.
- 일반 응결 running은 receipt `createdAt` 기반 경과를 표시한다.
- 기존 오류·복구·취소·보관함 행동은 그대로 유지한다.
- 같은 로컬 요청에 구형 `.dx-status`와 새 작업등을 중복 렌더하지 않는다.
- 버튼 disabled와 입력값 보존 규칙은 기존과 같다.

## 수용 기준

- 각 kind의 단계 경계·긴 대기 수렴·힌트·손상 timestamp가 순수 테스트로 고정된다.
- 지연된 PLAY 대화에서 타이머가 `0:00 → 0:01` 이상 증가하고 단계 문구가 바뀐 뒤 성공·실패 시 제거된다.
- 전개 후보·잡 등록은 각각 맞는 label/hint를 표시한다.
- 실행 중 응결은 재진입 시 receipt 생성 시각부터의 경과와 `화면을 떠나도 계속` 안내, 취소·보관함 행동을 함께 보여 준다.
- live region은 시간 자체를 매초 낭독하지 않는다.
- 390px·1280px에서 진행 카드와 composer가 겹치거나 잘리지 않고 가로 overflow가 없다.
- 비동기 상태 전환 중 페이지 강제 스크롤 호출이 없고 채팅·작성창이 계속 보인다.
- focused 테스트, `bash init.sh`, 독립 코드/시각 감사 모두 녹색이다.

## 비범위

- SSE·토큰 스트리밍·서버의 실제 세부 진행률
- 가짜 퍼센트·남은 시간 예측
- VS stale response race, chat non-2xx 판정, poll timeout/병렬화
- readiness 품질 경고, 텍스트 반출, canon provenance
- 기존 사용자 작품·캐논·영수증 스키마 변경
