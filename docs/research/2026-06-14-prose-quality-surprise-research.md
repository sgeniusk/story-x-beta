# LLM 산문 평탄함·의외성 부재 — 원인과 교정 (딥리서치 정본)

> 2026-06-14 딥리서치(deep-research 하네스, 105 에이전트·5각도 fan-out·23 소스·113 주장 추출→25 검증→18 확정·7 반박). 사용자 실독 결함 U3(온건한 문체)·U4(의외성 부재)의 외부 근거. 품질·비용 로드맵 Phase B(긴장·날것)·C(트위스트 제안)의 입력 정본.
> 입력 질문 — LLM이 장편 연재 소설(한국어 웹소설 포함)에서 "온건·평탄한 AI 글 티"와 "예측 가능한 전개"를 벗어나 날것·긴장 산문과 계산된 의외성을 쓰게 만드는 최신 기법.

## TL;DR

LLM 산문의 "온건·평탄·예측 가능"은 **디코딩 설정 문제가 아니라 정렬 후처리(RLHF/DPO)의 데이터 수준 원인**에서 온다. 선호 데이터에서 주석자가 친숙한 텍스트를 체계적으로 선호하는 **typicality bias** 가 핵심이다. 그 결과 LLM은 (a) 같은 모델·다른 모델 모두에서 출력이 수렴하는 **mode collapse("Artificial Hivemind")**, (b) 어휘는 달라도 플롯이 중복되는 **서사 동질화**, (c) 결말 직전 긴장이 무너지는 **조기 해소(premature resolution)** 를 보인다. 교정은 세 층이다 — 추론 시점(training-free, 즉시), 학습 시점(파인튜닝), 측정·게이트. **단, 디코딩만으로는 mode collapse를 못 깨고, 다중 모델 앙상블도 다양성을 보장하지 못하며, 단일 LLM-judge는 의외적 산문을 과소평가한다** — 이 셋이 Story X 설계에 직접 함의를 준다.

---

## 1. 진단 — 왜 평탄하고 예측 가능한가 (확정 주장)

### 1.1 근본 원인 = 정렬 후처리의 typicality bias (confidence: high)
평탄·예측 가능 문제의 근본 원인은 디코딩이 아니라 **정렬 후처리(RLHF/DPO)의 데이터 수준 driver** 다. 선호 데이터에서 주석자가 친숙·관습적 텍스트를 체계적으로 선호하는 typicality bias가 보상을 `task-utility + α·typicality` 로 왜곡한다(`α>0` 이면 분포 첨예화). HelpSteer에서 `α̂=0.57±0.07, p<10⁻¹⁴` 로 경험 검증됐다. "안전 정렬은 출력 수렴을 보상하는 반면 창작은 발산을 요구"하므로 같은 정렬 과정이 창의적 다양성을 억제한다. 불확실성을 억눌러 사실성을 높이는 기법이 표현 다양성을 줄이는 메커니즘도 명명됐다.
- 출처 — arXiv 2510.01171(VS, Stanford+Northeastern), 2604.01504(Microsoft 서베이). 독립 확증 — Padmakumar & He 2024, 2604.16027, 2601.06116.
- **Story X 함의** — 평탄 산문은 부분적으로 선호 데이터 인공물이다. 따라서 training-free 디코딩/프롬프트 대응이 정당화된다.

### 1.2 Mode collapse "Artificial Hivemind" — 디코딩으론 안 깨진다 (high)
세 층위에서 경험적으로 문서화됐다(NeurIPS 2025 Best Paper Oral, INFINITY-CHAT 26K 쿼리·70+ 모델).
- **(a) 단일 모델 intra-model** — top-p=0.9·temp=1.0에서 동일 프롬프트 50회 응답의 평균 쌍별 임베딩 유사도가 **79% 사례에서 0.8 초과**. min-p=0.1·temp=2.0으로 극단화해도 **81%가 0.7 초과, 61.2%가 0.8 초과** — 다양성 지향 디코딩에서도 collapse 잔존.
- **(b) inter-model** — 서로 다른 모델 패밀리 응답 간 평균 유사도 **71~82%**(DeepSeek-V3 vs qwen-max 0.82, vs GPT-4o 0.81). **multi-LLM writers' room 앙상블도 다양성을 보장하지 못한다.**
- **(c) 서사 차원** — 어휘가 다른 스토리도 플롯 요소가 고도로 중복(PNAS 'Echoes in AI', Sui Generis 점수).
- 저자 결론 — "more generalizable solutions are needed at the model training level". 디코딩 계층 수정만으론 불충분하고 사용자에게 샘플러 선택 부담을 전가한다.
- 출처 — arXiv 2510.22954, 2604.01504. 독립 확증 — Xu et al. 2025(PNAS), Wenger & Kenett.
- **Story X 함의** — 다중 페르소나/다중 모델만으로 다양성을 기대하지 말고 **출력 수준 발산을 명시적으로 강제·측정**해야 한다.

### 1.3 조기 해소(premature resolution) — 핵심 평탄화 실패 모드 (high)
LLM은 서사적 긴장을 결말까지 지속하지 못하고 결론 한참 전에 예측 가능해진다.
- 100-Endings(narrative forecasting) no-rate — top-10 LLM 평균 **0.630 vs New Yorker 0.765**. 격차는 결말부에서 가장 심해 **후반부(≥80% 공개 지점) no-rate가 New Yorker 0.607 vs LLM 0.215로 약 3배**.
- 중심 궤적(예: 로맨스)이 확정되면 no-rate가 **0.29로 붕괴**해 나머지 구간 내내 평탄. 전문 작가는 서사 질문을 제기하고 부분적으로 열어두지만 LLM은 거의 즉시 해소한다.
- EMNLP 2024 독립 확증 — "LLM stories are homogeneously positive and lack tension", **서스펜스·setback 격차가 중간점 이후 확대**(클라이맥스여야 할 후반부에서 정확히 평탄해짐).
- 핵심 — 긴장은 **정보 비대칭 유지 + 해소 지연** 을 요구한다.
- 출처 — arXiv 2604.09854(Spoiler Alert, Holtzman 공저), 2407.13248(EMNLP 2024).
- **Story X 함의 (가장 중요)** — **"결말 역산" 헌장이 조기 해소를 baking할 위험이 있다.** 후반부(>50%) valence 상승·setback 부족·정보 비대칭 조기 붕괴를 잡아내는 **긴장 게이트**를 계측하고, 지속적 정보 비대칭을 보상해야 한다.

### 1.4 단일 LLM-judge는 의외적 산문을 과소평가한다 (high)
LLM-as-judge와 reward model은 다양·특이한 창작 출력에 대해 인간 선호와 체계적으로 miscalibrated다. 개방형 응답이 전체 품질은 비슷하되 주석자 간 발산·특이 선호를 유발할 때 현행 파이프라인은 **단일 합의적 품질 개념을 가정해 다원적·의외적 출력을 처벌**한다(31,250 인간 주석·예시당 25명 독립 평가).
- 출처 — arXiv 2510.22954.
- **Story X 함의** — 의외성·트위스트 품질을 **단일 judge 점수에 게이트하지 말 것**. Story X의 **멀티 페르소나 독립 검토 설계가 정당화**된다.

---

## 2. 교정 — 3층 기법 (확정 주장)

### Layer 1 — 추론 시점 (training-free, 즉시 적용 가능)

#### Verbalized Sampling (VS) — 가장 즉시 적용 가능한 레버 (high)
직접 답 하나 대신 모델이 **N개 후보 응답 + 각 확률을 함께 verbalize** 하도록 요청한다(예 "5개의 후보와 각 확률을 함께 생성"). mode-seeking 수렴을 상쇄해 창작 과제(시·스토리·농담)에서 출력 다양성을 **직접 프롬프트 대비 1.6~2.1배** 높인다. 품질 trade-off 없음(품질-다양성 Pareto front, 인간평가 ~25.7% 평점 상승).
- 출처 — arXiv 2510.01171(OpenReview 채택), 공개 구현 GitHub CHATS-lab/verbalized-sampling.
- **Story X 적용** — 비트/회차 생성 프롬프트를 "N개 후보 + 확률" 형태로 바꿔 꼬리 분포에서 샘플. (주의 — GitHub의 "2-3x"는 cross-domain 마케팅 수치, **창작 한정 정밀값은 1.6~2.1배**.)

#### min-p 디코딩 — 보조 레버 (단독 해법 아님) (high)
top 토큰 확률로 스케일되는 동적 절단 임계값 `p_scaled = p_base × p_max`(권장 `p_base 0.05~0.1`)로 창의성-일관성 균형을 제공한다. **다양성 지향 디코딩임에도 mode collapse를 부분적으로만 완화**한다(§1.2 잔존 수치).
- 출처 — arXiv 2407.01082(HuggingFace transformers 구현).
- **Story X 적용** — 생성 호출 기본 디코딩을 min-p(`p_base≈0.05~0.1`)로 설정하되 **다양성 보증으로 의존하지 말 것**.
- ⚠️ **박제 금지** — min-p의 창작 품질 우월성 정량(고온 GPQA/GSM8K 벤치마크, AlpacaEval 56.54% 승률)은 본 검증에서 **refuted**. 파라미터(`p_base`)와 메커니즘만 견고, 우월성 수치는 인용 금지.

### Layer 2 — 학습 시점 (자체 파인튜닝 여력 있을 때)

#### CrPO / ReDiPO — 정렬로 다양성 회복 (high)
- **CrPO(Creative Preference Optimization)** — diversity·novelty·surprise·quality 네 차원을 DPO 목적함수에 **모듈식·개별 가중**(`L = −E[(λ_d·δ^w + λ_n·ν^w + λ_s·ξ^w + λ_q·γ^w)·l_DPO]`)으로 주입.
- **ReDiPO** — 명령 준수 보상이 ε 이내로 유사한(품질-매칭) 응답 중 더 다양한 쪽을 'chosen'으로 라벨링 → NoveltyBench distinct_k를 instruct 베이스 대비 **+134%(Qwen3-4B)·+44%(LLaMA-3.1-8B)·+33%(OLMo-3-7B)** 회복.
- **trade-off** — 품질 신호와 창의성 신호를 합치면 해당 창의성 차원 성능이 일부 하락(측정 가능).
- 출처 — arXiv 2505.14442(CrPO), 2605.30021(ReDiPO).
- ⚠️ **중요 한계** — distinct_k는 "기능 동치류 수"(개념/답변-모드 다양성)이며 두 논문 모두 **스타일·구문·장편 창작 변이를 명시적으로 제외**. 따라서 **아이디어 다양성 회복 증거이지 산문 질감·서사 긴장 회복의 직접 증거가 아니다.** LoRA·4B~8B·영어 한정. 한국어·대형 모델 일반화 미확인.

### Layer 3 — 측정·게이트
- **후반부 긴장 게이트** — no-rate/arousal류 late-stage 예측불가 지표로 조기 해소를 탐지. (단 §4 open question — "예측불가 ≠ 스테이크 있는 긴장" 구분 필요.)
- **멀티 페르소나 검토** — 단일 judge 대신 다중 독립 검토(§1.4). Story X 기보유.

---

## 3. Story X 적용 권고 (우선순위)

| 순위 | 권고 | 근거 | 성격 | 비용 |
|---|---|---|---|---|
| 1 | **VS 패턴을 비트/회차 생성 프롬프트에 도입** — "N개 후보 + 확률" 후 꼬리 분포 채택, 또는 후보 제시 후 작가 선택(의외성 채널 = Phase C 트위스트 제안과 직결) | §2 VS 1.6~2.1배 | training-free 프롬프트 | 낮음 |
| 2 | **후반부 긴장 게이트 신설** — chapters 위치(이미 `buildContractStatus`로 계산)가 후반부일 때 valence 단조 상승·setback 부재·정보 비대칭 조기 붕괴를 감점. 조기 해소 차단 | §1.3 no-rate 3배 격차 | 결정론 게이트(StoryScore v0.3 / qualityGates) | 중간 |
| 3 | **"결말 역산" 헌장에 정보 비대칭 보존 조항** — 결말을 알고 시작하되, 후반부까지 *무엇을 독자에게 숨길지*를 헌장에 명시(척추 4줄 옆에 "지연할 정보" 레인) | §1.3 헌장의 조기 해소 baking 위험 | 헌장 스키마 확장 (Phase A 후속) | 중간 |
| 4 | **min-p 디코딩 기본값** — codex/provider 생성 호출에 `p_base≈0.05~0.1` 적용(가능 범위 확인) | §2 min-p | 디코딩 파라미터 | 낮음(가능 시) |
| 5 | **다양성을 단일 judge·다중 모델에 의존 금지** — 의외성 품질은 멀티 페르소나 독립 검토로만 판정(기보유 정당화). 출력 발산은 명시적으로 강제·측정 | §1.2·§1.4 | 설계 원칙(현행 유지+강화) | 0 |

---

## 4. Caveat · Open Questions

### 박제 금지 (refuted claims)
- min-p 창작 품질 우월성 정량(고온 벤치마크·AlpacaEval 승률) — refuted. 파라미터·메커니즘만 인용.
- narrative-forecasting 정확한 레시피(Qwen3-32B T=1.2, 100 endings) — refuted. **메커니즘(no-rate로 조기 해소 측정)은 견고하나 정확한 모델/온도 레시피는 박제 금지** — Story X 자체 지표로 재구현할 것.
- "RLHF reverse-KL mode-seeking이 다양성 손실의 기계적 원인" — refuted(0-3). 원인은 데이터 수준(typicality bias)이 더 견고.
- perplexity/burstiness로 "AI 글 티" 조작화 — 약하게 refuted(1-2). 단일 지표로 신뢰 금지.

### 근거 공백 / Open Questions
1. **한국어 특수성(번역 투 회피·문체 자연스러움) 측정·교정 기법은 근거 공백** — 검증된 출처가 거의 영어 코퍼스 기반. Story X 자체 데이터로 채워야 할 축(별도 리서치 또는 koreanVoiceGate 실증 강화).
2. VS·min-p가 단발 출력 다양성을 넘어 **장편 연재 회차 간 서사 긴장**과 복선-회수 강제에도 효과 있는가 — 현재 증거는 단일 프롬프트 한정.
3. ReDiPO/CrPO의 개념 다양성(distinct_k) 회복이 **산문 질감·서사 의외성으로 전이**되는가, 아니면 별도 학습 신호(no-rate/긴장 보상)가 필요한가.
4. 후반부 긴장 게이트에서 **"예측불가 ≠ 스테이크 있는 긴장"** 을 어떻게 구분해 무의미한 혼돈이 아닌 의도된 서스펜스만 보상할 것인가.

### 시간 민감성
거의 모든 핵심 출처가 2024~2026 최신. 강한 근거 — Artificial Hivemind(NeurIPS Best Paper)·Spoiler Alert·VS(OpenReview 채택)·EMNLP 2024. 약한 근거(비peer-review 프리프린트) — ReDiPO·서베이(~2주).

## 5. 검증된 1차 소스
- arXiv 2510.01171 — Verbalized Sampling (typicality bias 형식화 + VS)
- arXiv 2510.22954 — Artificial Hivemind (NeurIPS 2025 Best Paper, mode collapse 3층위 + judge miscalibration)
- arXiv 2604.09854 — Spoiler Alert (premature resolution, no-rate)
- arXiv 2407.13248 — EMNLP 2024 (서스펜스 격차 중간점 이후 확대)
- arXiv 2604.01504 — Microsoft 서베이 (정렬·동질화 메커니즘)
- arXiv 2505.14442 — CrPO / arXiv 2605.30021 — ReDiPO (학습 시점 다양성 회복)
- arXiv 2407.01082 — min-p Sampling
