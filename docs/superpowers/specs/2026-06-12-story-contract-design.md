# 작품 헌장(Story Contract) 설계 — 분량 확정 + 결말 역산 + 전 에이전트 공유 기준 (2026-06-12)

> 30화 쇼케이스 A/B(통제군 91.8 vs 실험군 76.5, `docs/reviews/2026-06-11-showcase-30ch/storyscore-ab-report.md`)와 사용자 실독 판정(2026-06-12 — "제목 반복·정체된 중후반·언제 끝날지 모르는 연재는 중구난방")으로 승격된 1순위 트랙. 기존 백로그의 "시즌 아크 플래너"와 기억 압축 연구 R2(`docs/research/2026-06-11-longform-memory-compression.md`)를 흡수한다.

## 문제

1. **모든 에이전트가 끝을 모른다** — 쇼러너 연재 편향(로판 23화 무한 연기), "0번 소품" 발견 축적(쇼케이스 19~27화), 중후반 정체가 전부 같은 뿌리. 통제군의 승인(勝因)은 집필 전 내부 바이블 + 떡밥 회수 사전 설계였고, Story X에는 그 강제 장치가 없다(A/B 리포트 교란 변수 3).
2. **분량 미확정 연재** — 언제 끝날지 모르는 이야기는 회차마다 즉흥 발급·즉흥 회수가 되고, 운영자 페이스 개입(시드·intent)으로만 절단됐다. 사용자 판정 — "회차를 정해놓고, 결말까지 구상된 상태에서 끌고가야 한다."
3. **위치 정보 부재** — 회차 프롬프트는 digest(캐논·스레드)만 받고 "전체 중 어디인가"(N/M화·이번 화의 구조적 임무)를 받지 않는다. `buildProjectContextDigest`(storyEngine.ts:1310)에 해당 절이 없다.
4. **종반 떡밥 발급 무제한** — 남은 화수보다 미회수 약속이 많아도 아무도 차단하지 않는다.

## 핵심 설계 결정

- **헌장 = 스토리판 CLAUDE.md.** 작고 안정적인 계약 문서를 `SeriesProject.storyContract` 로 박제하고, 모든 프롬프트(초안·검토·페이스 인터뷰)에 같은 절을 주입한다. 별도 "전개 견인 에이전트"는 만들지 않는다 — 헌장이 화수 예산을 쥐면 쇼러너가 그 역할을 한다(에이전트 증설은 토큰 비용과 정면 충돌).
- **분량 2등급 (사용자 결정 2026-06-12)** — `short` 단편 4~8화 · `long` 장편 24~36화(시즌제 — 시즌 1개 = 헌장 1개, 다음 시즌은 헌장 갱신). 중편 없음.
- **결말 역산** — 결말 문장·최종 이미지·주인공의 대가를 온보딩에서 먼저 확정하고, 비트 시트를 화수에 핀 박아 역산한다. "결말이 정해진 뒤에만 1화를 쓴다."
- **게이트로 강제** — 위치 주입(권고)만으로는 쇼러너 편향을 못 이긴다는 게 로판 23화의 교훈. 남은 화수 대비 미회수 약속 초과 시 새 약속 발급을 차단 규칙 + 검토 차단 신호 양쪽으로 강제한다.

## A. 데이터 모델 (storyEngine.ts)

`SeriesProject`(storyEngine.ts:269~322)에 옵셔널 필드 추가(기존 백업 하위호환).

```ts
export type ContractLengthClass = 'short' | 'long'; // 단편 4~8 · 장편 24~36(시즌제)

export interface ContractBeat {
  episode: number;        // 핀 화수
  mission: string;        // 이번 구간의 구조적 임무 ("1차 전환 — 조력자 상실" 류)
  promiseRefs?: string[]; // 이 비트가 회수해야 할 약속(rewardArc/stake 문구)
}

export interface ContractAmendment {
  at: string;             // ISO 날짜
  reason: string;         // 트위스트 수락·시즌 연장 등
  change: string;
}

// 4줄 척추 — 《4줄이면 된다》(이은희) 함의. 외부 사건이 아니라 주인공의 내적 변화를 4줄로 붙잡는다.
// question 은 기존 SeriesProject.deepQuestion 을 재사용(별도 저장 안 함). 아이러니(현재상태↔욕망 간극)가 긴장의 1차 원천.
export interface StorySpine {
  desire: string;       // 1줄 — [주인공]은 [결정적 상태] 때문에 [불가능에 가까운 욕망]을 품는다 (전사 아님, 출발 동력만)
  advance: string;      // 2줄 — 결심하고 전진하며 독자가 응원할 기준을 보인다
  obstacle: string;     // 3줄 — 장르·기대 감정 크기에 맞는 시련으로 상황·마음이 급변(곁가지가 질문을 삼키지 않게)
  resolution: string;   // 4줄 — 욕망·결심이 해소되고 질문의 답에 도달(표면 생사 아님)
}

export interface StoryContract {
  lengthClass: ContractLengthClass;
  plannedEpisodes: number;     // 확정 회차 수 (short 4~8 · long 24~36 범위 검증)
  spine?: StorySpine;          // 장편 필수 · 단편은 desire/resolution 만(가벼운 게이트)
  endingStatement: string;     // 결말 = 질문에 대한 답 + 욕망 해소 여부(마지막 "장면"이 아니라) — 역산 기준점
  finalImage?: string;         // 마지막 장면 이미지(선택)
  protagonistCost: string;     // 주인공이 결말까지 잃는 것
  beatSheet: ContractBeat[];   // 4줄 척추를 화수 구간으로 펼친 핀 (최소: 25%·50%·75%·결말 4핀 = 욕망/전진/시련/변화에 정렬)
  spineLocked: boolean;        // 단계적 집필 게이트 — 척추 잠금 전엔 본문 생성 불가(장편·학술)
  amendments: ContractAmendment[];
}
```

`beatSheet` 4핀은 `spine` 의 4줄과 1:1 정렬한다 — 25% 핀=욕망 발생, 50%=전진의 정점/1차 역전, 75%=시련 최저점, 결말=변화 완성. 비트 시트는 척추를 펼친 것이지 별개 구조가 아니다.

- `createEmptyProject`(storyEngine.ts:946) — `storyContract` 시드 인자 추가.
- 검증 헬퍼 `validateContract(contract)` — 화수 범위·비트 화수 ≤ plannedEpisodes·결말 문장 비어있지 않음.
- 시즌제 — 장편 완결 시 새 시즌은 `storyContract` 교체 + `amendments` 에 이월 기록(자동화는 비범위).

## B. 단계적 집필 — 척추 잠금 전엔 본문 없음 (《4줄이면 된다》 함의)

사용자 판정 — "장편·학술은 편집모드로 바로 들어가지 말고 단계적이어야 한다. 지금은 아이디어에서 바로 뿜어져 나와 중구난방." 책의 "4줄 이전 → 4줄 → 트리트먼트 → 묘사" 순서를 게이트로 강제한다.

- **Stage 1 — 질문 + 척추 잠금** (장편·학술 필수, 단편 경량)
  - 질문 = 기존 `deepQuestion`(온보딩에 이미 있음). "재미있는 사건"이 아니라 "내가 세상에 던지는 질문" + 그 질문을 짊어질 **가장 아이러니한 주인공**(현재상태↔욕망 간극이 클수록 강함)을 확정.
  - 4줄(`StorySpine`) 작성 — 쇼러너 LLM 제안 → 작가 수정·승인(pace-interview 패턴: 질문→선택→시드 재사용). 폴백은 deepQuestion·audiencePromise 기반 결정론 템플릿.
  - 잠금 시 `spineLocked=true`. **이 게이트가 false 인 장편/학술은 produceEpisode(본문 생성)가 차단**된다. 단편은 desire+resolution 2줄만으로 경량 잠금.
- **Stage 2 — 비트 확장(트리트먼트)** — 4줄을 화수 핀 `beatSheet` 로 펼침(자동 4핀 제안 + 작가 조정). 장편만.
- **Stage 3 — 본문 집필(편집모드)** — 기존 floating 편집기. 여기서부터 회차 생성. 매 회차에 헌장 절(C) 주입.
- 학술 — 같은 단계 골격. "질문"=연구 질문/주장, 4줄≈주장 제기/근거 전진/반론 시련/응답. 기존 claimLedger·citationGate 와 정렬(중복 신설 안 함, 헌장이 상위 골격만).
- UI — 온보딩 직후 단계 진행 표시. Stage 1 미완 시 편집모드 탭 비활성(장편·학술).

## B'. 온보딩 확장 — 분량·결말 인터뷰

> 참조 — 단계·4줄 척추의 출처는 《4줄이면 된다: 길 잃은 창작자를 위한 한예종 스토리 공식》(이은희, 부키). 사용자 제안(2026-06-12). 책의 산문 미학(묘사 vs 서사)은 헌장 범위 밖(voice-curator·문체 게이트 소관).

- 매체/포맷 선택 직후 **분량 등급 선택**(단편/장편) → `plannedEpisodes` 확정(기본값 short 6 · long 30, 작가 조정 가능).
- LLM 인터뷰(interviewClient.ts)에 **결말 질문 2문항 고정 추가** — "이 이야기의 마지막은 주인공의 어떤 욕망·결심이 실현되는 순간입니까(생사·표면이 아니라)" · "주인공은 그 결말까지 무엇을 잃습니까". 답이 `endingStatement`·`protagonistCost` 로 시드. "열린 결말은 되지만 없는 결말(답 회피)은 안 된다"를 인터뷰 안내에 명시.
- 비트 시트는 Stage 2 에서 4줄을 펼쳐 도출(쇼러너 제안→승인).

## C. 프롬프트 주입 (promptBuilders.ts ↔ storyx.mjs 미러)

- `buildProjectContextDigest`(storyEngine.ts:1310)에 **헌장 절** 추가.

```
## 작품 헌장
- 질문 — "{deepQuestion}"  (이 회차는 이 질문을 추적해야 한다)
- 4줄 척추 — 1:욕망 "{desire}" · 2:전진 "{advance}" · 3:시련 "{obstacle}" · 4:변화 "{resolution}"
- 전체 30화 중 현재 17화 (남은 화수 13)
- 결말 = 질문의 답 — "{endingStatement}" · 주인공의 대가 — "{protagonistCost}"
- 이번 구간 비트(15~22화, 척추 3줄=시련 구간) — "{mission}" · 이 구간이 회수할 약속 — {promiseRefs}
- 미회수 약속 {unpaid.length}건 / 남은 화수 {remaining} — {발급 가능 | 신규 발급 금지}
```

- **A-4 적용 범위 (2026-06-12 결정)** — 매체가 아니라 **헌장 잠금 + 연재(isSerial) 포맷**일 때만 예산·척추 규칙을 주입한다. 대상 = 장편 소설·단편(4~8화 연재)·연재 만화·오디오 연재. **에세이·학술은 A-4 제외**(서사 4줄 부적합 — 진실 계약·claimLedger 가 그 역할). 1편 완결 standalone 은 예산·종반 무의미 → 질문+4줄+결말만 한 편 초점으로.
- `buildDraftPrompt`(promptBuilders.ts:195) — stallRules 와 같은 방식으로 헌장 규칙 주입.
  - overBudget(미회수 > 잔여) — "새 약속 발급 금지, 가장 오래된 약속 회수 의무".
  - 종반 구간(잔여 ≤ plannedEpisodes×25%) — **"새 큰 떡밥(약속)만 금지, 결말로 수렴"**(2026-06-12 결정 — 새 인물·소품 자체는 허용, 큰 약속/스레드만 금지). 4줄 4번(변화)으로 기존 약속을 닫는다.
  - **척추 환기 한 줄("4줄의 어느 줄을 전진시키는가·질문 이탈 금지")은 정체·이탈 신호일 때만**(isStalled OR overBudget) 주입(2026-06-12 결정 — 매 회차 주입은 토큰 낭비라 Phase E 비용과 충돌). 평상시엔 헌장 절(컨텍스트)만으로 충분.
- `buildAgentReviewPrompt`(promptBuilders.ts:373) — 쇼러너 지시에 두 축 가산: ① 헌장 위치 대비 진척(전제진척 프롬프트 `aa98137` 자리) ② **"길 잃음 점검" — 이 회차가 아직 질문/4줄을 추적하는가, 3줄(방해요소)이 비대해져 원래 질문을 삼켰는가**(《4줄》 더 글로리 예시). 피날레 회차는 추가로 "질문에 답했는가 — 없는 결말(답 회피)이면 block".
- `buildPaceInterviewPrompt`(promptBuilders.ts:454) — 헌장 비트를 컨텍스트로 받아 질문이 비트 임무에 정렬.
- storyx.mjs 미러는 기존 byte-identical 동기화 테스트 패턴 그대로.

## D. 화수 예산 차단 게이트

- `episodeBriefing.ts` 에 `buildContractStatus(project)` — `remaining`·`unpaid`·`overBudget`(unpaid > remaining) 결정론 산출.
- **생성 측** — overBudget 시 buildDraftPrompt 에 "이번 화는 신규 약속 발급 금지, {가장 오래된 약속} 회수 의무" 강제 규칙(stallRules 강화판).
- **검토 측** — 쇼러너 검토 프롬프트에 overBudget 사실 주입 → 신규 떡밥 발급 회차는 revise/block 유도. 결정론 게이트(qualityGates)로의 승격은 운용 데이터를 본 뒤(위양성 위험 — 약속 추출 휴리스틱 의존).
- **UI** — FloatingEditor 상태 패널에 헌장 위치 카드(N/M화·다음 비트·예산 상태). `.fc-contract` 스코프.

## E. 기억 연구 R2 합류 — 아크 다이제스트

- 헌장 비트 구간(비트 사이)을 아크 단위로 보고, 구간 완료 시 5~8화 아크 다이제스트를 생성·digest 에 주입(R2). `CONTEXT_CANON_LIMIT`(storyEngine.ts:1304) head/tail 절단의 중반부 증발(ch23 에서 91중 51 소실)을 R1(관련 캐논 top-K)·R3(중요도 가중)과 함께 보완 — 구현 순서는 헌장 골격 먼저, R1~R3 은 같은 digest 빌더를 건드리므로 동일 묶음의 후반 태스크.

## 검증

- 단위 — validateContract 경계(4/8/24/36)·createEmptyProject 시드·digest 헌장 절(질문+4줄 포함) 스냅샷·overBudget 경계(unpaid=remaining±1)·promptBuilders↔storyx.mjs 미러 동기화·종반 발급 금지 규칙 주입·**spineLocked=false 장편에서 produceEpisode 차단**·단편은 2줄 경량 잠금 허용.
- 라이브 — 새 장편 온보딩(분량 선택→결말 2문항) → **Stage 1 척추 잠금 전 편집모드 차단 확인** → 4줄 승인·잠금 → Stage 2 비트 → 1화 생성 프롬프트에 헌장 절(질문+4줄) 확인 → 백업 주입으로 종반 상태(예: 27/30화·unpaid 5) 재현 → 발급 금지 규칙·쇼러너 "길 잃음 점검" revise 동작 확인.
- 효과 측정 — Phase F 재실험(같은 모델·10화 중간 게이트)에서 StoryScore 페이오프 축과 "정체 구간 길이"(발견 축적 연쇄 화수)를 전후 비교.

## 비범위

- 긴장 감수자 페르소나·날것 생성 규칙(별도 spec — 날것 보강).
- 트위스트 제안 채널(별도 spec — 헌장 amendments 를 소비하는 쪽).
- 검토 티어링·토큰 계측(별도 spec — 비용).
- 멀티시즌 자동 이월·100화+ 스케일 검증.
