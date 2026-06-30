# 캐논 거버넌스 정본 — 사건중심 그래프 + 중요도 게이트 (합본)

<!-- ChatGPT Pro·Claude 외부 리서치 2종 + Claude foil 을 합쳐 캐논 거버넌스 설계를 확정한 정본. 코드 착수의 근거 문서. -->

> 작성 2026-06-30 · 상태 `confirmed`(설계 확정 · research-gap §12에서 closed · empirical-tune만 dogfooding 잔존) · 입력 = [research-brief](2026-06-30-canon-governance-research-brief.md) + 외부 AI 2종(ChatGPT Pro 본문·Claude 첨부, 원문 사용자 보관) + Claude foil §6 + 포커스 딥리서치(§12, 한국어 craft).

## 0. 한 문장 설계 원칙

Story X의 캐논은 고정된 진실표가 아니라 **권한·중요도·증거·범위·상태**를 가진 **사건(Event) 중심 운영 그래프**다. 정합성은 "앵커를 지키는 능력", 의외성은 "낮은 중요도·낮은 권한의 가정을 안전하게 흔드는 능력"이며, 둘의 균형은 전역 슬라이더가 아니라 **중요도별 게이트**로 건다.

## 1. 수렴 — 두 외부 리포트 + foil 이 합의한 것

세 출처(ChatGPT·Claude·내 foil)가 독립적으로 같은 결론에 도달. foil 6개 입장 **전부 confirmed**.

| # | foil 입장 | 판정 | 핵심 근거(외부 2종 공통) |
|---|---|---|---|
| 1 | 중요도 = 연속값(0~1) 저장 + 3밴드 UI | 확인 | Generative Agents importance scoring · PageRank 중심성 자동도출 · RAG 점수 비보정→UI 단순화 |
| 2 | 일탈은 침묵 허용 X, 저비용 surface + 승인 시 캐논 승격 | 확인 | HITL propose/commit 분리·4종 신호 · fandom headcanon→fanon→canon · 떡밥회수=독자보상 |
| 3 | 전역 슬라이더 X, 중요도 게이트(앵커 불변/중 경고/소 허용) | 강하게 확인 | LLM 조기해소 편향(Tian EMNLP2024 TP4/TP5 조기화) · GPT-4 아크준수 55%↓ → 구조 게이트 필수 |
| 4 | 권한 3층 + lock 플래그, 과층화는 피로 | 대체로 확인 | HITL "중간이 최선" · World Anvil 2축 상태로 충분 · suggestion-pending은 boolean이면 족함 |
| 5 | PLAY는 앵커·중만 강제, 소 자유 / 무거운 검사는 응결 | 확인 | HITL async-first·위험등급 게이트 · AI Dungeon Required/Dynamic 분리 |
| 6 | 자동추정 오류로 중요항목 소실 위험 → 초기 작가핀 우선, AI는 제안만 | 확인(실증 리스크) | Story X 30화 91중 51 소실 · importance 가중 튜닝 불안정 · 요약=손실압축 |

## 2. 확정 설계 — Canon Governance Stack (6계층)

1. **Bedrock** — 시대·장소·언어·장르·물리/사회 규칙. 디폴트로 채우되 데이터엔 명시(연속성 엔진은 기록된 것만 검사). UI엔 접힘.
2. **Canon** — Entity / Event / Relation 정본 상태.
3. **Authority** — 누가 정했나(fixed / user / ai / session).
4. **Importance** — 0~1 연속값 + 3밴드 UI(anchor / major / soft).
5. **Retrieval** — 장면 질의 기반 관련 캐논 검색·압축.
6. **Governance** — 충돌 검사·일탈 승인·승격/강등·버전.

★ **Canon 층과 Governance 층을 분리**한다. 그래야 PLAY는 가볍고 WRITE/PLAN은 엄격해진다.

## 3. 데이터 모델 (확정 — 사건중심 3-엔티티 + 메타)

EventKG·Narrative Graph(학술)·World Anvil·articy:draft(실무)가 검증한 패턴. 공통 메타를 모든 항목이 보유.

- **공통 메타** — `id · type · title · summary · authority · status · scope · importance(0~1) · importanceBand · confidence · evidence[] · createdAt · updatedAt · accessCount · version`
- **Event** — `participants[] · povEntity? · time{absolute|relative|sequenceIndex|arcId|episodeId} · location? · causes[] · effects[] · resolvesThreads[] · opensThreads[] · contradictionPolicy(block|warn|allow_surface) · surprisePotential`
- **Entity** — `entityKind(character|place|object|org|concept) · aliases[] · traits[] · state · firstAppearanceEventId · currentArcRole`. ★ 인물 성격도 영구속성이 아니라 "어떤 사건 이후 그렇게 보이게 됐나"로 추적.
- **Relation** — `from · to · relationType · validFromEventId · validToEventId · strength · polarity`
- **Evidence(증거)** — `sourceType(preset|user_input|generated_scene|extracted_fact|manual_edit) · sourceId · quote? · charStart/End · confidence`. ★ 모든 캐논은 원문 증거 위의 view(PlotLens·GraphRAG provenance 패턴). "모델이 믿는 것"이 아니라 "어디서 나왔나".

내부는 권한/상태/범위를 분리하되 **UI는 3개만** 노출 — `고정 Canon` / `내 Canon` / `AI 제안` + 항목 배지(잠금·AI제안·이번화생성·충돌·의외후보·폐기). 작가를 DBA로 만들지 않는다.

## 4. 중요도 (확정)

- 저장 0~1 연속 / UI 3밴드. 권장 구간 — **Anchor 0.82~1.0**(깨지면 작품 신뢰 붕괴·항상 포함·위반 차단) · **Major 0.45~0.82**(중요 관계·동기·경고·근거요구) · **Soft 0~0.45**(주변·해석·허용 가능·surface). 구간은 초기값, 장르별 보정(추리=Anchor/Major↑, 코미디·일상=Soft 일탈↑).
- 도출식(초기) — `0.30·작가핀 + 0.18·권한 + 0.15·그래프중심성 + 0.12·재등장 + 0.10·열린떡밥관련 + 0.08·감정전환 + 0.07·인과영향`. **작가 핀이 자동점수를 항상 override**, 런칭 초기 핀 가중 지배.
- ★ 초기엔 AI 자동추정 = "점수 확정"이 아니라 "승격 제안". 불일치율(자동 vs 작가 사후수정) 추적해 <10% 떨어지면 AI 자동승격을 Major까지 단계 확대.

## 5. 정합성↔의외성 (핵심 축, 확정)

- **판별식** — 일탈이 기존 캐논과 양립 가능한 **재해석**이면 의외성(좋음), 명시적으로 **모순**이면 오류(나쁨). 좋은 의외성 = "그럴 줄 몰랐지만 돌이켜보니 말이 된다". retcon bridge 가능 여부가 경계.
- **Deviation Candidate 객체** — 일탈은 텍스트에 묻지 말고 별도 객체로. `affectedCanonIds · deviationType(soft_contradiction|reinterpretation|hidden_motive|timeline_shift|relationship_reversal|identity_reveal|world_rule_exception) · severity · surpriseBenefit · explanation · requiredPatch? · userDecision(accept_as_canon|allow_once|rewrite|reject)`.
- **판정** — `conflict_severity = 중요도 · 권한 · 모순유형 · 증거신뢰` / `surprise_benefit = novelty + thematic_fit + character_pressure + plot_potential − confusion_cost`.
- **게이트 규칙** — 앵커 위반=즉시 차단·재작성 / 중 위반=경고·대안·승인 / 소+benefit낮음=조용히 수정 / **소+benefit높음=진행 허용 + 배지 + (승격|이번만|수정)**.
- **생성 측 레버** — 의외성을 temperature에 맡기지 말고 구조에서. Soft 영역에 **Verbalized Sampling**(분포 명시 요청 → 다양성 1.6~2.1×) 등으로 의도적 부양, Anchor는 hard-constraint 고정.
- **UX 문장** — "의외 전개 1개 감지. 정본은 안 바꿨습니다." → 몰입 유지 + 통제감 유지.

## 6. 검색·기억 at scale (확정 — A-6 직접 대응)

30화 절단 소실의 교훈 — head/tail 요약 단일 메모리 의존이 원인. **앵커는 요약에 위임 말고 구조 저장소(이벤트 KG)에 원본 보존**, retrieval서 중요도 가중 우선 주입.

- **3계층 저장** — ① 이벤트중심 시간 KG(앵커 원본 영구) ② 벡터 인덱스(소·세부) ③ 재귀 요약 다이제스트(아크 단위, **원문 증거에 연결된 view** — 재귀 요약은 환각 증폭하니 context-augment).
- **R1 관련 캐논 주입** — SceneCanonQuery{pov·participants·location·time·activeThreads·intendedBeat}로 4단계 검색 — 구조필터 → 벡터회수 → 시간/인과확장 → 중요도 rerank(앵커 강제·중 예산내·소 관련시만). AI Dungeon Story Cards / NovelAI Lorebook 패턴.
- **R2 아크 다이제스트** — anchorEvents·majorEvents·openThreads·characterStateChanges(+evidenceEventIds). 원문 대체 금지.
- **R3 중요도 가중 절단** — 예산 배정 순 Bedrock핵심 → Anchor → 장면 관계자 Entity state → ArcDigest → 관련 Top-K Event → Relation → Soft. **앵커 절단 금지 · 소부터 절단**(단 현장면 직결 소는 의외성 재료로 잔류).
- **가시화** — 어느 캐논이 왜 포함/제외됐나 Context Viewer로(NovelAI 패턴) → 소실 조기 발견.

## 7. 운영 루프 (확정 — 이중 검증기)

- **Runtime Validator(PLAY, 가볍게)** — 입력→SceneCanonQuery→Top-K검색→생성→앵커=hard block·중=soft warning·소=free + surface 배지→delta 추출. 몰입 유지.
- **Consolidation Validator(최신화/응결, 무겁게)** — 화/세션 종료→전체 재추출→충돌검사→Deviation Candidate 목록→승인 UX(approve/edit/reject/respond 4종)→승격/거부→ArcDigest·Growth Ledger·Relation Snapshot 갱신. propose/commit 강분리·비동기 큐.
- **PLAN 루프** — 캐논 그래프 시각화·열린 떡밥/미해결 충돌 표시·중요도 승격 제안·다음 회수 추천·의외성 seed 제안.
- 응결 주기 — 아크 경계(예 25화, 문피아 1권 관행) 강제 응결 권고하나 **실험 보정 대상**.

## 8. 구현 단계 (확정 — MVP 0→4)

- **MVP 0 · Canon Core** — Entity/Event/Relation/Bedrock 스키마 + importance 0~1·3밴드 + 작가핀 + 앵커 alwaysInclude + 장면기반 Top-K + evidence ref. **목표 = 30화 절단 소실 재현 차단(런칭 게이트).** 의외성 UX보다 정합성 생존 우선.
- **MVP 1 · Runtime Governance** — Runtime Validator·앵커 차단·중 경고·소 로그·의외후보 배지·승인 없는 정본변경 금지.
- **MVP 2 · Consolidation Studio** — delta 추출·Deviation Candidate·승격/이번만/수정/거부·ArcDigest·Growth Ledger·Relation Snapshot.
- **MVP 3 · Surprise Engine** — Soft 기반 twist seed·떡밥 기반 반전·character pressure 선택지·surpriseBenefit·장르별 일탈 프로필.
- **MVP 4 · Collaborative Canon** — 권한별 편집·user lock·AI proposal queue·variant/what-if·changelog·preset marketplace canon contract.

## 9. 리스크 + 대응 (확정)

alert fatigue(PLAY 묶음 배지·PLAN 상세) · canon ossification(Soft 영역 명시 보존) · 중요도 오판(작가핀 우선·AI 제안만) · false conflict(차단보다 근거요구 단계) · extraction 오류(evidence span 필수·confidence) · retcon 남용(아크당 retcon budget) · 통제감 상실(AI 제안은 승인 전 상태) · "AI 맛"(Soft deviation·theme pressure·미해결 떡밥 활용).

## 10. 결정/엇갈림/empirical/research-gap 분류

**확정(코드 가능)** — §2~9 전부. 두 리포트 + foil 합의.

**작은 엇갈림(채택안)** — 중요도 도출식 항 수(ChatGPT 7항 vs Claude 3항) → **7항 채택하되 런칭 초기 작가핀 지배**(둘 다 핀 우선엔 동의). 권한 내부필드는 ChatGPT의 상태/범위 분리 채택.

**Empirical(리서치 아님 · dogfooding 튜닝)** — ① 중요도 가중치/밴드 임계 ② 의외성 surface 빈도 N ③ 응결 주기(아크 경계 가설) ④ AI 자동승격 신뢰 램프(불일치율 <10% 게이트). 모두 MVP-0~2 운용 데이터로 보정. 문헌으로 못 닫음.

**미검증 표시(무해)** — "3배 조기해소"는 문헌 미확인(방향성은 EMNLP2024·EACL2024·COLM2025 확고) · character.ai 절대수치 미확인 · Campfire 스키마 미확인. 설계 영향 없음.

**★ 진짜 남은 research gap(좁음)** — **한국 웹소설·장편 연재의 캐논(연속성) craft**. 두 리포트 모두 "한국어 1차 자료 빈약(translationese 위험)"으로 플래그. 구체 미해결 — (a) 떡밥회수·연재호흡이 '재해석 가능 반전 vs 모순'을 가르는 한국 웹소설 실무 규칙 (b) 번역 투 회피·한국어 문체 일관성 유지 기법 (c) '재해석 가능성'을 AI가 자동 판별하는 detector 설계. → §11 포커스 딥리서치로 닫는다.

## 11. 다음 — spec (리서치 종료)

§10★ 갭은 §12에서 닫음. 리서치 종료. **남은 건 사용자 결정 3건(아래) → 캐논 거버넌스 spec(MVP-0부터) → 단계 구현.** empirical 항목(가중치·surface빈도·응결주기·자동승격램프)은 MVP-0~2 dogfooding으로 보정 — 문헌 추가 불요. 캐논 코드 착수는 spec 확정 후.

## 12. 한국어 craft 갭 — 포커스 딥리서치 결과 (gap closed · 2026-06-30)

§10★ 갭을 직접 검색으로 닫음(워크플로 1회 실패 후 Claude 직접 WebSearch/WebFetch). **세 소스가 한 원리로 수렴.**

### 12.1 좋은 의외성 vs 나쁜 모순 = "회수되는가" (3소스 수렴)
- **한국 웹소설 craft(나무위키 떡밥회수·설정오류)** — "떡밥인지 설정 오류인지는 **작가만 알고 독자는 모른다** → 회수되기 전에는 설정 오류·개연성 없음으로 오해받기 쉽다." 잘 뿌리고 잘 회수하면 호평, 뿌리고 회수 못 하면 혹평. 독자는 핍진성을 적극 검증(《악역의 엔딩은 죽음뿐》 '기사 2만' 떡밥 갤러리 논쟁).
- **플롯홀 탐지(Finding Flawed Fictions, arXiv 2504.11900)** — 플롯홀=later justification 없는 연속성 위반. 의도적 모호성·복선(나중 해소)과 구분. 판별 단계 = Fact Extraction → Consistency Check → **Context Analysis(나중 해소되나?)** → Classification.
- **ConStory(arXiv 2603.05890)** — pairwise 판정이 "genuine contradiction vs acceptable narrative development"를 증거 인용으로 가름.
- ★ **Story X 결론** — 일탈은 생성 시점에 선악을 못 가린다. **등록된 회수 약속(opensThreads/resolvesThreads + Deviation Candidate.requiredPatch)과 함께 추적**하고 **페이오프를 검증**해야 비로소 "의외성"으로 확정. 회수 안 되면 응결 게이트가 "설정붕괴"로 승격 차단. = 기존 `payoffStatus·openThreads·stakesLedger` 기계를 일탈에 연결.

### 12.2 연속성 자동검사 detector = Consolidation Validator 엔진 (ConStory 채택)
- **5범주×19서브타입 taxonomy** — Timeline&Plot Logic(6) · Characterization(4) · World-building&Setting(3) · Factual&Detail(3) · Narrative&Style(3). 우리 Event/Entity/Relation/Bedrock/보이스 모델과 거의 1:1.
- **4단 파이프라인** — ① 범주별 Category-Guided Extraction(모순 후보 span) ② **Pairwise Contradiction Pairing**(Consistent/Contradictory — 오탐 감소) ③ Evidence Chain(reasoning + 정확 위치 인용 + conclusion) ④ JSON(char offset 포함). 우리 Evidence 모델·"충돌은 드러낸다"와 정합.
- **★ 강력한 검증 수치** — CONSTORY-CHECKER F1=0.678(Character 0.742·Factual 0.718) vs **인간 전문가 F1=0.229**. 인간은 오류 17.1%만, 검사기는 55% 잡음 = **3.2배**. → *자동 연속성 검사가 인간을 압도*. Story X의 "연속성을 제품 요건으로" 테제의 외부 실증.
- **집중 지점** — dominant 실패 = Factual&Detail + Timeline&Plot Logic(엔티티 추적·시간 추론). MVP-0 검사기를 여기 먼저.

### 12.3 번역 투 게이트 = 한국어 보이스 일관성 (KatFishNet, arXiv 2503.00032)
LLM 한국어 번역 투의 정량 마커 — 결정론 게이트로 구현(기존 koreanVoiceGate 일반화).
- **콤마 과용(최강 신호, AUROC 94.88%)** — LLM ~2.56% vs 인간 ~1.13%. **연결어미+콤마 동반 >15%** = 강한 LLM 마커(영어 구두점 간섭).
- **띄어쓰기 경직** — 의존명사 띄어쓰기 SD <0.05 = LLM(인간은 문체적 생략).
- **명사 과잉 >45%** = LLM(modifier-heavy noun phrase = 영어식). **종결어미 빈도 <8%/문장** = LLM(인간 10~12%).
- **POS n-gram 다양성 <0.40 · 어휘 반복(Zipf 평탄)** = LLM.
- **모델별** — GPT-4o=영어식 번역 투(수식 과다 명사구·대명사 남용) / Qwen=한자어 명사화·calque. → provider별 보정.
- 체크리스트(100형태소당) — 콤마 >2.0·의존명사 SD <0.05·명사비 >45%·종결어미 <8%·POS bigram 다양성 <0.40·연결어미+콤마 >15% 중 다수 적중 시 "번역 투" 경고.

**소스(§12)** — 나무위키(떡밥 회수·설정 오류·웹소설/문제점·사이다) · Finding Flawed Fictions(arXiv 2504.11900) · ConStory-Bench/Lost in Stories(arXiv 2603.05890) · KatFishNet(arXiv 2503.00032)·LLM-Korean rubric(arXiv 2601.19913).

### 12.4 정본 흡수
- §5 게이트에 **"회수 약속 추적 → 페이오프 검증"을 의외성 확정 조건**으로 추가(생성 시점 판정 금지).
- §7 Consolidation Validator 엔진 = ConStory 4단 파이프라인 + 5범주 taxonomy.
- §6 보이스 레인에 **번역 투 게이트(KatFishNet 마커)** 추가.
- MVP-0 검사기 우선순위 = Factual&Detail + Timeline&Plot Logic.

---

## 13. 사용자 결정 (2026-06-30 · 확정)

- **Q1 1차 타깃 장르 = 미스터리·스릴러.** 캐논 거버넌스를 가장 빡빡하게 쓰는 장르(정합성=앵커 + 회수 가능한 반전=의외성이 장르 핵심). 쇼케이스 퇴마록 면과도 이어짐. → Anchor·Soft 임계 둘 다 높게.
- **Q2 사용자상 = 플레이어형(PLAY 먼저).** MVP UX는 PLAY 몰입 + '의외 전개 후보' 배지·응결을 먼저. 캐논 승인은 최소 몽타주. 단 Canon Core(데이터·검색)는 PLAY Runtime Validator가 읽으므로 invisible infra로 먼저 깔린다.
- **Q3 1.0 간판 메시지 = "몰입 연재(Dive 융합)"** — "내가 주인공으로 플레이해 만드는 연재". 장편 일관성·의외성 제안은 그 밑의 엔진(간판 아님). 일관성 해자(3.2배 실증)는 신뢰 근거로 받치되 메시지는 몰입.

→ **첫 spec 권고** = **Canon Core(MVP-0) + PLAY Runtime Governance(MVP-1의 PLAY 슬라이스)**. 이유 — player-first 몰입 루프의 "일관성 + 추적된 의외성"은 Event 캐논 코어 위에서만 작동. 한 슬라이스로 foundational(코어) + player-visible(PLAY가 일관되게 굴러가고 의외 전개를 surface) 동시 충족. 런칭 게이트 = 30화 절단 소실 재현 차단.

## 14. 크래프트 정합성 — 좋은·재미있는 글쓰기를 돕는가 누르는가 (감사)

좋은/재미있는 글쓰기 크래프트(욕망·갈등·변화·구체성·목소리·보상 + 질문→방해→발견→전환→보상)에 캐논 거버넌스를 대조한 감사. **결론 — 대체로 강화, 단 4개 억압 위험을 티어·공개축으로 차단.**

**강하게 돕는 것** — ① 보상/payoff·"질문 심고 제때 답": `openThreads→resolvesThreads`·payoffLedger가 곧 그 기계(캐논이 최강). ② 갈등 전면화: "충돌은 드러낸다"와 동일. ③ 구체성: Evidence/provenance가 모든 캐논을 구체 사실로 강제. ④ 반 걸음 비켜가기: Soft 티어 통제 일탈 + Verbalized Sampling.

**억압 위험 4 + 처방.**
- **위험1 성장 차단** — 인물 내면(욕망·신념·관계·도덕적 입장)을 앵커로 박으면 변화(McKee·Truby의 영혼)가 막힌다. **처방 — 내면 상태는 living 티어(원인·대가 있으면 변함), 앵커는 불변 사실·일어난 사건만.** 기존 continuityContract hard/living/soft 3티어에 "내면=living" 자동 분류 명문화. (후속 spec: 티어.)
- **★ 위험2 withholding 무력화(코어 구멍)** — 크래프트는 "정보를 바로 주지 말고 질문을 먼저". 현 캐논 모델엔 중요도·권한·증거는 있으나 **공개 축(disclosure)이 없어** 비밀(정보 비대칭)까지 "확정 캐논"으로 주입→조기 누설(C축 조기 해소 그 병). **처방 — CanonFact에 `disclosure: 'revealed'|'secret'|'foreshadowed'` 추가.** 검색이 secret/foreshadowed는 **"모순 금지 + 누설 금지"**로 주입. withholding·긴장·조기해소 방지를 한 번에. 프리셋 정보비대칭 요소를 캐논이 실어나르는 통로. **MVP-0에 포함**(코어라 처음부터 — 마이그레이션 회피).
- **위험3 발견 vs 과잉 플롯** — King "설명 아닌 발견" + 결말 역산 헌장의 긴장. **처방 — 초기 캐논 희박·대부분 soft/living, 앵커는 커밋할수록 누적. PLAY=발견 엔진, 캐논 bottom-up 응결(scripting 아닌 steering).**
- **위험4 검사기 오발** — ConStory Characterization 범주가 인물의 의외의 선택·배신·성장을 "캐릭터 모순"으로 오탐. **처방 — 사실 모순(차단) vs 행동 전복(잠재 의외성, 회수로 판정) 분리(§12 원칙).** (후속 spec: 검사기.)

**핵심 재정의** — 캐논은 "고정"이 아니라 **"무엇을 언제 고정하고 무엇을 언제 드러내느냐의 통제"**. 크래프트의 "변화가 영혼"과 동치. disclosure 축이 그 통제의 빠진 절반이었다.
