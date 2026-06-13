# 품질·비용 로드맵 — 30화 A/B 이후 (2026-06-12)

> **For agentic workers:** 이 문서는 페이즈 단위 로드맵(핸드오프 정본)이다. 각 페이즈 착수 시 프로젝트 관례대로 spec(있으면 그것 기준) + per-feature 구현 계획을 만들고 TDD 로 진행한다. Phase A 의 spec 은 이미 있다 — `docs/superpowers/specs/2026-06-12-story-contract-design.md`.

**Goal:** 30화 쇼케이스에서 드러난 품질 결함(정체된 중후반·제목/후크 반복·온건한 문체)과 토큰 비용을 함께 잡고, 같은 모델 재실험으로 개선을 측정한다.

**근거:** A/B 리포트(`docs/reviews/2026-06-11-showcase-30ch/storyscore-ab-report.md`) + 사용자 실독 판정(2026-06-12) + 기억 압축 연구(`docs/research/2026-06-11-longform-memory-compression.md`).

---

## Phase 0 — 결함 카탈로그 (완료 · 2026-06-12 사용자 인테이크)

사용자 실독에서 나온 결함. StoryScore v0.2 와 게이트 설계의 입력이다.

| # | 결함 | 대상 | 반영처 |
|---|---|---|---|
| U1 | 제목 반복 (실험군) | Story X | Phase B 다양성 규칙 + StoryScore 제목 반복 신호 |
| U2 | 정체된 중후반 — 언제 끝날지 모르는 연재는 중구난방 | Story X | **Phase A 헌장 (1순위)** |
| U3 | 온건한 문체 — 날것·긴장감 없음, 웹소설로 식상 (통제군 포함) | 생성 모델 공통 | Phase B 긴장 감수자 + 날것 규칙 |
| U4 | 의외성 부재 — 보조만 하고 제안하지 않음 | Story X 제품 방향 | Phase C 트위스트 채널 |
| U5 | 토큰 비용 과대 | Story X 운용 | Phase E 계측·티어링 |

사용자 결정 — **분량 2등급**: 단편(short) 4~8화 · 장편(long) 24~36화 시즌제. 중편 없음.

사용자 제안 (2026-06-12 추가) — **단계적 집필 + 4줄 척추**. 장편·학술은 편집모드로 바로 들어가지 말고 "질문→4줄 척추 잠금→비트 확장→본문" 단계를 거친다. 《4줄이면 된다》(이은희) 함의 — 외부 사건이 아니라 주인공의 내적 변화(욕망/전진/시련/변화)를 4줄로 붙잡고, 길 잃으면 4줄로 돌아간다. 헌장 spec B 절에 반영.

## Phase D — 결정론 소건 (착수 1순위 · 반나절 · TDD)

- [x] **폴백 episode 번호 소모 버그** — `nextEpisodeNumber(project)`(chapters 마지막+1)로 도출해 폐기된 폴백 번호가 회복되게 수정. produceNextChapter·chapterFromDraftPayload 양 경로 적용. (`cf8f1de`, 회귀 테스트 1건)
- [x] **StoryScore v0.2** — 2글자 이름 변형 위양성 가드(length<3 skip) + analyzeTitles 제목 반복 신호(어간 공유) + 후크 신호 확장(느낌표·반전어). 스킬 루브릭에 온건함(U3)·제목 반복(U1) 감점 추가. V0_1→V0_2. (`b7f59f2`, 6건)
- [ ] **dev 서버 사망 원인 조사** — 30화 제작 중 3회 사망, 검토 동시 spawn 부하 가설. **Phase E-1 계측으로 이관**(재현 없이 추정 금지).

## Phase A — 작품 헌장 (핵심 · spec 완료)

spec — `docs/superpowers/specs/2026-06-12-story-contract-design.md`.

- [x] A-1 데이터 모델 — `StoryContract`·`StorySpine`(4줄 척추) 타입·`createEmptyProject` 시드·`validateContract`·`defaultPlannedEpisodes` (storyEngine.ts). (`a15728b`, 6건)
- [x] A-5(코어) 화수 예산 결정론 — `buildContractStatus`(episodeBriefing.ts): 위치·잔여·`overBudget`·`finalStretch`. chapters 기준 도출(드리프트 면역). (`e92c13d`, 5건)
- [x] A-4 프롬프트 주입 — digest 헌장 절(4줄+결말+위치) + buildDraftPrompt 예산/종반(새 큰 떡밥만)/척추(정체·초과 시만) + buildAgentReviewPrompt 길 잃음 점검·예산 초과 block + storyx.mjs 미러. 에세이·standalone 제외. 사용자 문구 승인. (`40646ea`, 12건)
- [x] A-5(배선) 예산 게이트 실효 — StoryXDesk 가 `buildContractStatus(project)` 계산 → 생성(requestLlmDraft)·검토(requestAgentReview ×3) 전달 → draftClient/reviewClient body·api/draft·api/review-agent 파싱·vite 브리지·storyx CLI `--contract-status` 플래그까지 전 경로. (`43c6d56`·`d2fd3f8`) **단 헌장은 A-2/A-3 가 만들기 전엔 작품에 없어 dormant — 백업 주입 시 발화.** UI 헌장 카드는 A-2 UI 묶음으로 이연.
- [x] A-3 온보딩 헌장 생성 — intake↔building 사이 'charter' 단계(연재 서사만). 분량 등급·확정 회차·결말 2문항·4줄 척추 입력 → buildStoryContractFromOnboarding → seed → createEmptyProject. **헌장 체인 dormant→live**(라이브 검증: 신규 장편 헌장 영속). (`54fa97a` 빌더 · `2e51fa2` UI)
- [ ] A-2 단계적 집필 게이트 — `spineLocked=false` 장편·학술 produceEpisode 차단 + 편집모드 탭 비활성. 단편 2줄 경량 잠금. (A-3 는 charter 입력을 강제하지만, 백업 주입 등으로 헌장 없는 장편이 본문 생성하는 경로 차단은 미구현.) **← 다음 1순위**
- [ ] A-3b 4줄 척추 LLM 제안 — 현재는 작가 직접 입력. pace-interview 패턴으로 쇼러너가 freewrite/deepQuestion 기반 4줄 초안 제안→작가 수정·승인(선택 강화)
- [ ] A-3c 비트 펼침 Stage 2 UI — 현재 beatSheet 는 deriveBeatSheet 자동 4핀. 작가가 핀을 조정하는 화면(선택)
- [ ] A-6 R1~R3 기억 반영 — 아크 다이제스트(R2, 비트 구간 단위)·관련 캐논 top-K(R1)·중요도 가중 절단(R3) — 같은 digest 빌더 묶음
- [ ] A-라이브 — 새 장편 온보딩→Stage 1 잠금 전 편집 차단 확인→4줄 승인→위치 주입 확인→종반 백업 주입으로 발급 차단 동작 확인

## Phase B — 날것 보강 (헌장 위에)

- [ ] B-1 **긴장 감수자 페르소나** — 임무 단일: "이번 화의 안전한 선택" 적발(갈등 조기 봉합·대가 없는 해결·전원 합리적 대화·해설체). `.claude/agents/` 신설 + AGENT_FILE_MAP + CORE 검토 합류 여부 결정(표준 5인→6인 vs 게이트 조건부 — 비용과 트레이드오프, Phase E 계측 후 확정). block 권한 부여.
- [ ] B-2 **생성 측 날것 규칙** — buildDraftPrompt 에 요구 목록(회차당 비가역 사건 ≥1·인물이 손해 보는 선택)과 금지 목록(해설체·갈등 즉시 봉합) 주입. 미러 동기화.
- [ ] B-3 **제목·후크 다양성** — 직전 N화 제목·말미 후크 유형을 프롬프트에 주고 "다른 결" 요구(U1 + A/B 백로그 4).

## Phase C — 트위스트 제안 채널 (보조→제안자)

- [ ] C-1 쇼러너 의외성 제안 — N화마다(헌장 비트 경계 권장) 쇼러너가 헌장+캐논을 읽고 역전/배신 1건 제안. pace-interview 인프라(LLM 질문→시드 합성→자동 소거) 재사용.
- [ ] C-2 수락 시 `storyContract.amendments` 에 개정 기록 + 비트 시트 갱신.
- [ ] C-3 fork 옵션에 "과격한 선택 ≥1" 의무(episodeBriefing 옵션 합성 규칙).

## Phase E — 비용 계측·검토 티어링

- [ ] E-1 계측 — `reportAiCall`(aiStatus.ts:19)에 토큰 추정/실측 필드 추가, 회차당 호출 수·누적 집계. 30화 = 생성 30 + 검토 150+ 가 베이스라인 가설.
- [ ] E-2 티어링 — 결정론 게이트·연속성 검사 선통과 시 LLM 검토 축소(기존 scale quick/standard/deep 활용 — 매 화 standard 5인 → 위험 신호 기반 차등). 차단 신호(continuity error·overBudget)는 항상 풀 검토.
- [ ] E-3 폴백 재시도 낭비 점검(runProviderWithRetry 경로).

## Phase F — 재실험 (검증 게이트)

- [ ] F-1 provider claude 배선(생성 측 우선 — 검토까지 전환할지는 E-1 계측 보고 결정, 사용자 합의 사항)
- [ ] F-2 **10화 중간 게이트** — 헌장 기반 장편 신작 10화 → StoryScore 중간 채점 + 사용자 실독. 통과 기준 — U1~U3 재발 없음·정체 구간 없음. 미달이면 30화 진행하지 않고 원인 수정(토큰 낭비 차단 장치).
- [ ] F-3 통과 시 30화 완주 → StoryScore A/B 재채점(같은 모델 조건) → 76.5 대비 개선 측정.

## 순서와 근거

**D → A → B·C → E(병행 가능) → F.** D 는 작고 확실하며 F 의 측정 신뢰도를 올린다. A 가 모든 것의 기반(B·C 는 헌장 필드·비트를 소비)이라 선행. E 는 A~C 와 파일 충돌이 적어 병행 후보. F 는 돈을 쓰기 전 게이트.
