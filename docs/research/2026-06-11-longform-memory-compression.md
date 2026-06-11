# 장편 기억 압축 — 캐논 컨텍스트의 두께 문제 (조사 + 반영안)

> 2026-06-11. 사용자 질문 — "1→10화 대비 1→100화는 토큰이 기하급수로 늘고 비용·품질이 무너지지 않나? 장기기억 압축이 Story X의 핵심 기술 아닌가?" 에 대한 실측·외부 조사·반영안.

## 1. 실측 — 비용은 기하급수가 아니다. 문제는 망각 방식이다

ch23 완권 백업(`02-work-backup-ch23.json`)으로 `buildProjectContextDigest` 크기를 회차별 재구성 측정했다.

| 시점 | digest 크기 | 누적 캐논 | 토큰 추정 |
|---|---|---|---|
| ch1 | 1,041자 | 5 | ~416 |
| ch5 | 2,069자 | 20 | ~828 |
| ch10 | 3,567자 | 40 | ~1,427 |
| ch23 | 3,858자 | 91 | **~1,543 (플래토)** |

- 생성 프롬프트에 **전체 프로즈는 들어가지 않는다**(구조화 digest만) — 설계 철학(`storyx-memory-bank.md`)은 이미 "원문 전체는 기본 컨텍스트가 아니다".
- `CONTEXT_CANON_LIMIT=40`(head 6 + tail 34)·`CONTEXT_THREAD_LIMIT=8` 덕에 **ch10 이후 토큰은 플래토**. 100화여도 회차당 컨텍스트 비용은 일정하다. 비용 축에서 기하급수 공포는 현 구조엔 해당 없음.
- **진짜 문제** — 플래토를 만드는 방식이 압축이 아니라 **recency 절단**이다. ch23에서 캐논 91개 중 **중반부 51개가 통째로 증발**(head 6 + tail 34만 생존). ch100이면 400개 이상이 증발한다. 인물(전원)·세계규칙(전원)은 무캡이라 캐스트가 큰 작품에선 역으로 부풀 수 있다.

## 2. 외부 근거 — 우리 절단 방식이 정확히 가장 위험한 지점을 친다

- **Lost in Stories / ConStory-Bench (ACL 2026)** — 장편 일관성 오류는 (a) 사실·시간 축에 가장 많고 (b) **서사 중반부에 집중**되며 (c) 오류 유형이 동시 발생한다. 5범주 19세부유형 분류 제공. → 우리 head/tail 절단은 중반부 캐논을 버리는 구조라 이 발견과 정면 충돌. https://arxiv.org/abs/2603.05890 · https://github.com/Picrew/ConStory-Bench
- **DOME — Dynamic Hierarchical Outlining with Memory (NAACL 2025)** — 장편 생성에서 동적 계층 아웃라인 + 메모리 강화가 일관성을 유지하는 정석 프레임. 쇼케이스 A/B(통제군 91.8 vs 실험군 76.5)의 점수차 주범으로 진단된 "사전 아크 설계 부재"의 학술적 대응물. https://arxiv.org/abs/2412.13575
- **Generative Agents (Stanford)** — 회상 점수 = recency × importance × relevance. 우리는 recency 단일 축. importance·relevance 축이 없다.
- **SillyTavern World Info / NovelAI Lorebook (실무 패턴)** — 키워드 트리거 시 해당 로어만 주입 + 재귀 활성화 + 토큰 버짓. 수만 자 롤플레이 일관성의 사실상 업계 표준 패턴. LLM 0회 결정론으로 구현 가능. https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- **GraphRAG (Microsoft)** — 엔티티 그래프 + 커뮤니티 요약 계층 질의. `storyOntology`(엔티티·관계 엣지)가 이미 절반을 갖고 있다.
- **프로덕션 메모리 레이어** — Mem0(LOCOMO 67%·대화당 ~1.7k tokens vs full-context 26k)·Zep/Graphiti(시간 인지 지식 그래프 — "사실이 언제 바뀌었나" 추적 = 우리 living state 와 동형)·Letta/MemGPT(컨텍스트=RAM, 외부 저장=디스크 페이징). 직접 의존성 추가보다 **패턴 차용** 권장(우리 캐논은 이미 구조화돼 있어 범용 레이어가 오히려 두껍다).
- 서베이/목록 — https://github.com/yingpengma/Awesome-Story-Generation · https://github.com/Shichun-Liu/Agent-Memory-Paper-List

## 3. 진단 요약 — 현 digest 의 갭 4개

1. **검색 없음** — 이번 화 의도와 무관한 캐논 40개를 일괄 주입. relevance 축 부재.
2. **계층 없음** — 회차 캐논(점)과 작품 계약(면) 사이에 **아크 요약층(선)이 없다**. A/B 점수차 주범과 같은 뿌리.
3. **중요도 없음** — 배신자 정체(플롯 핵심)와 소품 한 줄이 같은 무게로 절단된다.
4. **무캡 섹션** — characters·worldRules 는 캐스트 성장에 비례해 부푼다.

## 4. 반영안 (작은 것부터, 전부 기존 기반 재사용)

| 순서 | 작업 | 방법 | 비용 |
|---|---|---|---|
| **R1 검색 선별 주입** | digest 캐논 절단을 "head/tail" → "head/tail + **관련 캐논 top-K**"로. 관련도 = 이번 화 의도 메모·갈림길 시드·openThreads·직전 회차 엔티티와의 키워드/엔티티 매칭(lorebook 패턴, LLM 0회 결정론) | `buildProjectContextDigest` 한 곳 + `storyOntology` 엔티티 매칭 재사용 | 작음 |
| **R2 아크 다이제스트 계층** | 5화 잠금마다 LLM 1회로 아크 요약(인물 변화·회수된 약속·확정 전환점) 생성 → digest 에 "아크 기억" 섹션. **시즌 아크 플래너(7차 개선 백로그 1순위)와 한 묶음** — 플래너=하향식 계획, 아크 다이제스트=상향식 기억 | DOME/Dramatron 패턴 | 중간 |
| **R3 중요도 가중 절단** | canonFact importance = payoffLedger 연결 + relations 등장 횟수 + 검토 인용 횟수로 결정론 산출. 절단 시 낮은 것부터 | 기존 레저 재사용 | 작음 |
| **R4 무캡 섹션 캡** | characters/worldRules 도 "이번 화 등장 + 핵심 N명" 선별(R1 매칭 재사용) | | 작음 |
| 측정 | R1~R3 후 30화 A/B 재실행(StoryScore) + ConStory 5범주를 연속성 검토 evidence 분류에 차용(v0.2 후보) | 기존 하네스 | |

## 5. 한 줄 결론

"장기기억 압축이 핵심 기술"이라는 직감은 맞다 — 단, 현 병목은 **토큰 비용이 아니라 회상 정확도**다(비용은 이미 플래토). 100화에서 무너지는 것은 지갑이 아니라 중반부 기억이고, 처방은 더 큰 컨텍스트가 아니라 **검색(R1)·계층(R2)·중요도(R3)**다.
