# P0-a 후속 — PLAY 응결 source boundary와 연결 문맥

> Date: 2026-07-18 · Status: accepted from sequential backlog review · Scope: latest-turn consumption boundary

## 문제

현재 응결은 `N-2`개의 오래된 메시지만 본문 재료로 보내고 최신 두 메시지는 버퍼에 남긴다. 원문 자체가 즉시 유실되지는 않지만, 응결 버튼을 누르게 만든 마지막 교환과 클라이맥스가 다음 회차로 밀린다. 동시에 `arc`는 최신 응답 뒤 상태인데 transcript는 그 전에서 끊겨, 모델이 빠진 사건을 추론하거나 요약으로 봉합할 수 있다.

잡 실행 뒤 PLAY를 더 이어간 경우에는 더 큰 경계 오류가 있다. 응결 결과의 캐논·retcon 검토가 생성 시작 당시 source가 아니라 승인 시점의 현재 버퍼를 다시 `N-2`로 계산해, 결과에 쓰이지 않은 후속 대화가 옛 회차 승인에 섞일 수 있다.

실패 복구 snapshot에는 숫자 `condensedThroughTurn`이 있지만, 저장 용량 압축 시 성공 영수증의 큰 recovery 원문은 제거될 수 있다. 따라서 생성 결과와 소비 source를 recovery 하나에만 연결하면 승인 시 경계가 `0`으로 퇴행할 수 있다.

## brainstorm 질문과 결정

### 1. 최신 두 턴은 어느 회차의 재료인가?

응결을 시작한 시점까지의 미소비 PLAY 턴은 최신 두 턴까지 모두 이번 회차의 재료다. `N-2`는 생성 입력 경계가 아니라 승인 뒤 다음 PLAY가 자연스럽게 이어지도록 보여 줄 **연결 문맥의 크기**로만 사용한다.

### 2. 승인 뒤 최신 두 턴을 지울 것인가?

아니다. 이번 회차가 소비한 source의 마지막 두 메시지는 채팅 화면과 다음 PLAY 요청의 recent dialogue에 남긴다. 다만 `lastCondensedTurn`을 source 끝까지 전진시켜 다음 응결 transcript와 deviation 검토에서는 제외한다. 즉 한 번 작품화하고, 다음 대화에는 기억하되, 다음 회차에는 다시 작품화하지 않는다.

### 3. 잡이 도는 동안 추가된 대화는 어떻게 처리하는가?

생성 시작 순간의 source span을 고정한다. 그 뒤 생긴 메시지는 span의 `throughTurn` 밖이므로 승인 시 삭제·표시 변경·캐논 검토 대상이 아니며 다음 응결 source로 남는다.

### 4. source span은 어디에 보관하는가?

원문을 중복 저장하지 않는 최소 메타데이터를 성공 영수증 root에 보관한다.

- `afterTurn` — 생성 직전까지 이미 소비된 watermark
- `throughTurn` — 이번 생성이 캡처한 마지막 turn
- `messageIds` — 생성 시작 때 캡처한 미소비 메시지 ID
- `continuityMessageIds` — 승인 뒤 연결 문맥으로 남길 마지막 최대 2개 ID

같은 span을 recovery snapshot과 승인 write-ahead checkpoint에도 선택적으로 보관한다. 성공 영수증의 recovery 원문이 용량 압축으로 제거돼도 root span은 제거하지 않는다. raw PLAY text를 새 메타데이터에 복제하지 않는다.

승인 전에는 shape만 맞는 메타데이터를 곧바로 신뢰하지 않는다. `messageIds` 수가 turn 구간과 일치하고 `continuityMessageIds`가 실제 마지막 최대 2개인지 확인한 뒤, 현재 PLAY snapshot의 같은 turn·ID와 정확히 대응하는 span만 **root → recovery** 순서로 사용한다. 불일치 span은 부모 영수증·복구 원문을 버리지 않고 legacy 숫자 경계로 강등하며, 검증 가능한 숫자도 없으면 `0`을 사용해 과도한 삭제보다 연결 문맥 보존을 택한다.

### 5. 캐논화 차단 턴은 source ID에 들어가는가?

들어간다. source span은 생성 시작 때 캡처한 PLAY 구간과 승인 소비 경계를 뜻한다. 실제 응결 transcript는 기존대로 `blocksCanonization` 메시지를 제외하지만, 해당 턴을 다음 회차에 반복 투입하지 않도록 승인 경계는 함께 전진한다. conflict/retcon 검토는 생성 당시 source span 안에서만 수행한다.

### 6. 구버전 영수증은 어떻게 처리하는가?

마이그레이션으로 과거 경계를 추정하지 않는다. source span이 없는 영수증은 기존 `recovery.condensedThroughTurn` 숫자를 그대로 존중한다. 숫자도 없으면 `0`으로 두어 과도한 삭제보다 중복 가능성을 택한다. 기존 `N-2` 결과는 당시 실제로 생성에 쓰인 구간까지만 소비한다.

### 7. 사용자에게 연결 문맥을 어떻게 보이는가?

승인 뒤 남은 연결 메시지 앞에 `지난 회차에서 이어지는 대화`라는 작은 구분선을 표시한다. 작품 본문이나 시스템 복구문을 WRITE에 노출하지 않고, PLAY 안에서만 이미 작품화된 연결 문맥임을 설명한다.

## 데이터 흐름

1. 응결 시작 — `turn > lastCondensedTurn` 전체를 source span으로 고정한다.
2. 생성 요청 — source 전체에서 캐논화 차단 턴만 제외해 transcript를 만든다.
3. 영수증 — recovery 원문과 별도로 root source span을 영속한다.
4. 검토 — source span의 메시지만 deviation/retcon 후보로 계산한다.
5. 승인 — source span을 소비하고 마지막 두 source 메시지만 연결 문맥으로 남긴다.
6. 다음 PLAY — 연결 문맥 + 새 메시지를 recent dialogue로 사용한다.
7. 다음 응결 — `lastCondensedTurn` 뒤의 새 메시지만 source로 사용한다.

## 수용 기준

- 최초 응결 transcript가 최신 두 메시지까지 한 번 포함한다.
- 승인 뒤 source 마지막 두 메시지는 PLAY 연결 문맥에 남고 다음 응결 transcript에는 포함되지 않는다.
- 생성 시작 뒤 추가된 메시지는 승인 뒤 그대로 남고 다음 응결 source가 된다.
- deviation/retcon 검토는 승인 시점의 재계산 span이 아니라 생성 당시 source span만 사용한다.
- 성공 receipt의 recovery가 용량 압축으로 제거돼도 source span은 왕복한다.
- 실패 복구 TXT는 이미 소비된 연결 문맥을 새 회차 원문으로 중복 내보내지 않는다.
- 승인 checkpoint 재시도는 source span 또는 legacy 숫자 경계로 멱등이다.
- 구버전 `N-2` 영수증은 실제 기존 경계보다 더 많이 소비하지 않는다.
- 손상되거나 현재 PLAY snapshot과 불일치하는 exact span은 root → recovery → legacy → 0 순으로 안전 강등된다.
- 사용자 승인, stale revision, 누수 검사, WRITE 직렬화 게이트는 그대로 유지한다.
- 집중 테스트와 `bash init.sh`가 녹색이며 로컬 PLAY에서 연결 구분선과 다음 응결 source를 확인한다.
- 600px 이하 PLAY 작성창은 입력칸을 한 행으로 확보하고 행동 버튼을 다음 행에 감싸 가로 붕괴가 없다.

## 비범위

- 분량·대사·후크 readiness 경고 또는 자동 승인 차단
- 캐논 후보별 `sourceTurnIds`와 explicit/inference/invention provenance
- 서버 잡의 재시작 생존이나 클라우드 동기화
- 기존 사용자 원고 자동 재생성·덮어쓰기
