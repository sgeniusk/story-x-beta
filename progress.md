# Story X — Progress

> Last Updated: 2026-06-14 · Branch: `main` (**울트라코드 10인 베타테스트 → 중간 수정 루프 3대 골격 완료: #1 본문영속·#1-undo·#6 인물CRUD. 후속 #7 헌장 편집(TDD·라이브)·#3 영향회차 인라인(TDD, 라이브 갈음) 완료. 이야기 품질 딥리서치 정본**)
> 코드 하네스 상태는 이 파일, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

## 활성 트랙 — 품질·비용 로드맵: 작품 헌장 중심 (`in_progress` · 2026-06-12, main 머지 완료)

30화 A/B(76.5 vs 91.8) + **사용자 실독 판정**(제목 반복·정체된 중후반·온건한 문체·의외성 부재·토큰 비용)으로 수립. 정본 — 로드맵 `docs/superpowers/plans/2026-06-12-quality-cost-roadmap.md` · 헌장 spec `docs/superpowers/specs/2026-06-12-story-contract-design.md`.
- **사용자 결정 (2026-06-12)** — ① 분량 2등급: 단편 4~8화 · 장편 24~36화 시즌제, **중편 없음** ② 결말까지 구상된 상태에서 시작(결말 역산) ③ 별도 전개 에이전트 대신 **CLAUDE.md 식 공유 기준(작품 헌장)을 전 에이전트에 주입** ④ Story X 가 의외의 전개를 제안하는 동료로. 추가 — 단계적 집필 + 4줄 척추(《4줄이면 된다》).
- **순서** — Phase D → A(헌장) → B·C → E → F(같은 모델 재실험, **10화 중간 게이트 후 30화 결정**). 시즌 아크 플래너·R2 아크 다이제스트는 헌장 spec 에 흡수.
- **이번 세션 진행 (코딩, TDD·전부 녹색, main ff-merge 완료)** — 5커밋.
  - **Phase D-1** 폴백 episode 번호 드리프트 수정 — `nextEpisodeNumber`(chapters 마지막+1)로 도출, 폐기된 폴백 번호 회복(쇼케이스 16→19 결번 류 면역). (`cf8f1de`)
  - **Phase D-2** StoryScore v0.2 — 2글자 이름 위양성 가드·제목 반복 신호(어간 공유, U1)·후크 확장(느낌표·반전어). 스킬 루브릭에 온건함(U3)·제목 반복(U1) 감점. V0_1→V0_2. (`b7f59f2`)
  - **Phase A-1** 작품 헌장 데이터 모델 — `StoryContract`·`StorySpine`(4줄)·`validateContract`(4/8/24/36 경계·결말·비트)·`defaultPlannedEpisodes`(6/30)·createEmptyProject 시드. 전 필드 optional(하위호환). (`a15728b`)
  - **Phase A-5 코어** `buildContractStatus` — 위치·잔여·`overBudget`(미회수>잔여)·`finalStretch`(잔여≤25%) 결정론. chapters 기준 도출(드리프트 면역). U2 직격. (`e92c13d`)
  - **Phase A-4 프롬프트 주입** (`40646ea`) — digest 헌장 절(4줄+결말+대가+위치 N/M) + buildDraftPrompt 예산 회수/종반(새 큰 떡밥만 금지)/척추 환기(정체·초과 시만) + buildAgentReviewPrompt 쇼러너 길 잃음 점검·예산 초과 revise/block + storyx.mjs 미러. **에세이·standalone 제외(A-4=연재 서사만), 프롬프트 문구 사용자 승인.**
  - **Phase A-5 배선** (`43c6d56` 생성 · `d2fd3f8` 검토) — StoryXDesk 가 `buildContractStatus(project)` 계산 → 생성·검토 ×3 호출에 전달 → draftClient/reviewClient body·api/draft·api/review-agent·vite 브리지·storyx CLI `--contract-status` 플래그까지 전 경로. A-4 규칙이 실제 생성·검토 프롬프트에 발화. **헌장이 없으면 전 경로 no-op(하위호환).**
  - **Phase A-3 빌더+온보딩** (`54fa97a` deriveBeatSheet·buildStoryContractFromOnboarding · `2e51fa2` UI) — intake↔building 사이 'charter' 단계(연재 서사만, 에세이·학술·단독 단편 제외). 분량 등급·확정 회차·결말 2문항·4줄 척추 입력 → 헌장 빌드 → seed → createEmptyProject. **★ 헌장 체인 dormant→live** — 라이브에서 신규 장편 온보딩→헌장 패널·CTA 게이트·확정→프로젝트에 contract(long·30화·비트4·spineLocked) 영속 확인(콘솔 0). 이제 A-4/A-5 가 실제 작품에 발화.
- **A-2 단계 게이트 완료 (2026-06-13, TDD+라이브, `3d98fe1`)** — `evaluateProductionGate(project)`: 헌장이 있고 `spineLocked=false` 면 produceEpisode 차단(reason 반환), 헌장 없으면 통과(하위호환 — 기존 작품·백업 주입). buildStoryContractFromOnboarding 단편은 desire+resolution **2줄 경량 잠금**(장편은 4줄 전부). StoryXDesk produceEpisode 진입 가드(미잠금이면 안내만) + 메인 CTA `productionBlockedReason` 비활성, App.tsx charterReady 단편 2줄(빌더와 동일 규칙). storyEngine.test +5·editorFocusLayout +2·appExperience +1. **라이브 — 미잠금 헌장 편집모드 진입 시 CTA disabled "헌장 잠금 필요"+사유 툴팁 → spineLocked 복원 시 "초안 생성" enabled · 콘솔 0 · 원본 무손상.** ★학술은 charter 경로(usesCharter 제외)가 없어 헌장이 안 생기므로 현재 no-op — 학술 헌장 경로가 생기면 같은 게이트가 매체 무관하게 자동 적용된다.
- **A-3b 쇼러너 4줄 제안 완료 (2026-06-13 2차, TDD+codex 라이브, `7486e93`)** — charter 단계에 "쇼러너에게 4줄 제안받기" 버튼 → `/api/spine-suggest`(buildSpineSuggestionPrompt·promptBuilders↔storyx.mjs byte-identical 미러·vite 브리지·codex) → 작품 맞춤 4줄을 **빈 칸만 채움**(작가가 쓴 줄 보존). 실패 시 안내만(직접 입력 유지). pace-interview 인프라 미러. promptBuilders.test +3·spineSuggestClient.test +3·appExperience +1. **codex 라이브 — freewrite "달의 탑·이름 대가"+ending 주입 시 23초에 4줄 도착, resolution 이 endingStatement 와 정렬·콘솔 0.** charter UI 진입(온보딩 intake LLM 연쇄)은 비용 과다라 codex 통합을 직접 fetch 로 검증, 버튼은 소스검사+무조건 렌더(fieldset 내부)로 보장.
- **A-3c 비트 펼침 미리보기 완료 (2026-06-13 3차, TDD+라이브, `92c7ab2`)** — charter 단계에서 잠근 4줄(장편)이 전체 화수의 어디에 박히는지 `deriveBeatSheet`(25/50/75/100%)로 미리 보여준다(읽기 전용, 화수 자동 배분). App charter 비트 미리보기 + `.hx-charter-beats`/`.hx-beat-*` CSS(+A-3b 버튼 CSS 보강). appExperience +1. **라이브 — charter 진입+4줄 주입 시 8·15·23·30화 핀+미션 매핑·dashed 박스·라임 강조·콘솔 0.** 화수 조정(작가가 핀 이동)은 추후 — deriveBeatSheet 자동이 합리적 기본.
- **다음 1순위 — A-6(장편 기억 R1~R3)** — `buildProjectContextDigest`·`CONTEXT_CANON_LIMIT` 의 head/tail 절단이 중반부 캐논을 통째 폐기(ch23 91중 51 소실, `docs/research/2026-06-11-longform-memory-compression.md`)하는 문제. R1(관련 캐논 top-K 결정론 주입)·R2(5화 아크 다이제스트)·R3(중요도 가중 절단). digest 빌더를 건드리는 **큰 작업 — 신선한 세션 권장**. 그 뒤 Phase B(긴장·날것)·C(트위스트)·E(비용)·F(재실험). 학술 단계 게이트(charter 경로 신설)는 academic 1.0 실험 플래그라 후순위.
- **딥리서치 — 이야기 품질·의외성 (2026-06-14)** — Phase B/C 외부 근거 정본 `docs/research/2026-06-14-prose-quality-surprise-research.md`(18 확정·7 반박·23 소스). 핵심 — LLM 평탄함은 정렬 typicality bias·mode collapse·**조기 해소(후반부 긴장 전문가 0.607 vs LLM 0.215 = 3배 낮음)**이며, 처방은 VS(회차 후보 1.6~2.1배)·후반부 긴장 게이트·멀티 페르소나(단일 LLM-judge는 의외성 과소평가 — Story X 검토망 정당화). **★ 결말 역산 헌장이 조기 해소를 baking할 위험 → 헌장에 "정보 비대칭(숨길 정보) 레인" 추가 권고.** 착수 후보(사용자 결정 대기) — ① VS 회차 생성(최저비용) ② 후반부 긴장 게이트(헌장 역설 직격) ③ 헌장 정보비대칭 레인. ⚠️ 박제 금지 — min-p 창작 우월성·narrative-forecasting 정확 레시피는 검증 탈락(refuted). 근거 공백 — 한국어 문체(번역 투)는 영어 코퍼스라 미해결.
- **Phase D-3(dev 서버 사망 조사)는 Phase E-1 계측으로 이관** — 재현 없이 추정 금지.

## 병행 트랙 — 품질 실증 테스트: 실사용 창작자 10인 (`in_progress` · 2026-06-07 착수)

페르소나 실증 테스트로 이야기 품질·연속성을 검증하고 새 제작 계획을 만든다. 설계 정본 `docs/superpowers/specs/2026-06-07-persona-live-test-design.md`, 실행 `docs/superpowers/plans/2026-06-07-persona-live-test-plan.md`.
- **방식** — 실사용 창작자 10인(소설6·만화1·에세이1·오디오1·학술1) 풀 라이브 직접조작(Playwright+codex). 장편 #1~3 완권(~20~25화) 연속, #3·#4 캐릭터 일관성 집중. 6축 평가. 멀티세션 S0~S15.
- **S0 파일럿 #1 (웹소설 장편 회귀) 완료** — 1화 생성+검토 풀라이브. 인터뷰 freewrite 받아씀·1화 품질 높음·**검토 5명 중 3명이 "미래지식 과잉확정" 수렴 포착(차별점 실증)**. 로그 `docs/reviews/2026-06-07-persona-live-test/`.
- **중대 발견 — 온톨로지 0 (구조적 배선 갭)** — (A) 온보딩→project 메타 미배선 (B) 회차 canonFacts↔온톨로지 미연결. **갭 B·A 모두 수정·라이브 확인(TDD)** — 갭B: `buildStoryOntology` canonFacts 반영(`ebe46b5`). 갭A: `deriveOnboardingSeed`+`createEmptyProject` 메타 시드(`59c8d3f`). **새 작품(백작가 빙의) 라이브 — logline·audiencePromise 시드, 하니스 2/8·22 → 7/8·93/100·온톨로지 0→12·온톨로지빌더 pass.** "온톨로지 0" 실증 해소.
- **#2 (백작가 빙의 로판) 2화 회차 연속성 첫 실증 (2026-06-07 이어서)** — produceEpisode 2화 생성 + 5명 검토 풀라이브. 캐논 정확 계승 · **온톨로지 12→17 · canonFacts 5→8 · memoryAnchors 4**(갭B 가 회차 누적에서 작동 실증) · L 단서→레나 위클리프 추적. 검토 5명 중 3명(연속성·세계·장르)이 의도 메모 오염을 독립 포착(차별점). **발견 — P1 쇼러너 빈응답(간헐 ~2/3) · P2 floating 회차생성 경로 마찰(잠금 UI 부재 + 잠금 후 state 미갱신→새로고침) · P3 의도메모 잔류 오염 · P4 캐논화 안 된 세부 드리프트(characters 0, 가족 이름 에드릭·노엘→레오니드).** 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md`.
- **발견 수정 (A) — P3·P2 완료 (TDD+라이브, 2026-06-07 이어서)** — P3(`defaultEpisodeIntent` 데모문구 '용사와 외계인'→'')·P2(`onConfirmChapterLock` 에 `setLatestChapter` 동기화). `editorFocusLayout.test.ts` +2(RED→GREEN), 314 tests. 라이브 — #2 3화 "동부 물류 검인권" 용사/외계인 오염 0 · 새로고침 없이 잠금→생성 · canonFacts 8→11. 캡처 `02/03-ch3-p2p3-fix-verified.png`.
- **발견 수정 (A) — P4 인물 캐논화 완료 (TDD+라이브)** — extractEntityName 개선(공백 이름·조사 확장·generic/조직 가드, export)·commitChapter 가 owner=character 캐논을 `characters` 로 승격. storyOntology.test +5·storyEngine.test +3, 322 tests. 라이브 — #2 4화 생성 시 characters [] → ["레나 위클리프"]·데이터 인물 1·canonFacts 11→15. 갭B 시드도 동반 개선.
- **#2 5·6·7화 테스트 + P5 발견 (2026-06-08)** — 연속성 우수·오염 0·canonFacts 15→27·characters [레나,리아나]. **P5 — P4 한계(가족 이름 드리프트: 둘째 오빠 에드릭·노엘→레오니드→루시안). 단 7화 = 캐논화 후 고정 실증(6화 루시안 캐논화 → 7화 유지) — canonFacts→digest 메커니즘 작동.** 생성시간 누적 증가(40→95초). 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md`.
- **#2 9~13화 테스트 + 각 5인 검토 (2026-06-08 이어서, 코드변경 0)** — 9~13화(오른편으로 돌아가는 종이·오른편의 첫 날짜·지워진 오른편·첫 오른편의 약속·비어 있는 오른편) 생성+검토 풀라이브. 연속성 ★★★★★·오염 0·canonFacts 27→52·온톨로지 46→68·characters 2→3. **실증 — (1) 캐논화 후 고정 7연속(루시안 ch7~13) (2) 검토 일관성(세계 키퍼=미설명 비용/메커니즘 ch9~13 5연속·연속성=확정강도 ch10·11·13·캐릭터=리아나 신뢰속도 ch10·13 = 각 페르소나가 원칙을 반복 적용, 랜덤 아님) (3) 캐논 고정 이름이 미스터리 논리 규정 → ch12 페이오프(첫 배신자=죽은 벨로트 레오르)·ch13 덫 회수 (4) 게이트 본문반응 5/8→5/8→6/8→4/8→6/8 + ch12 게이트↔페르소나 분기 (5) 미스터리 자가교정(ch9 우려→ch10·ch11 우려→ch12).** **P6 신규 — extractEntityName 조사 버그**(ch12 "레오르 벨로트라"). P1 이번 0/5. 9·10 `aaf6d41`·11 `8ff27bf`·12 `d37159b` 커밋. 로그 `## 9~13화` 절.
- **#2 14~23화 테스트 + 완결 + 종합 리포트 (2026-06-08 이어서, 코드변경 0)** — ch14~21 무드리프트·검토 샘플링. **배신자 reveal(백작부인 ch19) → P5/P6 라이브 검증**(첫 character 캐논 "백작부인" 클린 승격). **★ 최대 발견 continuity ≠ payoff** — 21화 연속성 완벽하나 전제 페이오프 0, codex reveal 무한 연기. **근본 원인(피날레 확정)= 쇼러너 연재 편향**(완결에 역행). **권고 A 실증** — intent 유도 ch22·23 로 deferral 끊고 **23화 완결**(전제 이행·수미상관·연속성 무결점, L.B.=라비니아 벨로트). 연속성 감수자가 결말 캐논↔프로즈 불일치도 포착. **종합 리포트** `FINAL-REPORT-romancefantasy.md`(6축 연속성5·평균~3.8·권고1=아크 페이오프 게이트). P1 0/13·14.
- **개선 (B) — 검토 전제진척 프롬프트 (TDD+라이브, 2026-06-08 이어서)** — continuity≠payoff 근본 원인 = `criteriaKeys`(showrunner `stakes_progression_audit`)가 라이브 검토 프롬프트에 미주입돼 dead. `buildAgentReviewPrompt`(promptBuilders.ts·storyx.mjs) "## 지시"에 "연재면 중심 질문(전제) 진척도 본다" 가산. promptBuilders.test +1, 326 tests. **라이브 검증** — 새 프롬프트로 쇼러너가 ch20류 연기를 revise("선택·대가·전술 변화 없어 추적 못 끝냄")로 전환(이전 통과→revise). 커밋 `aa98137`. #2 상태 백업 `docs/reviews/.../backups/02-work-backup-ch23.json`(로컬).
- **일괄 수정 (A) — P6·P5·relations 완료 (TDD, 2026-06-08 이어서)** — 사용자 "일괄 수정 착수" 선택. **P6** `extractEntityName` 정규식에 명명 계사 "(이)라는" 추가("레오르 벨로트라"→"레오르 벨로트"). **P5** `extractCharacterNames`(주어 + 서술부 "이름은 X" 명명) 신설 → `promoteCharactersFromCanon` 가 서술부 인물도 승격(루시안 벨로트 등). **relations** `extractRelation`("A의 [관계] 이름은 B" 보수 파서) + `linkRelationsFromCanon` 신설 → commitChapter 가 관계 엣지 생성(리아나→루시안 "둘째 오빠"). storyOntology.test +1·storyEngine.test +2, **325 tests**·tsc·build 녹색. (#2 localStorage 의 "레오르 벨로트라"는 재현 보존 위해 안 건드림 — 수정은 향후 커밋부터 적용.)
- **개선 (C) — 작가 결정 갈림길 + 생성 측 회수 의무 완료 (TDD+라이브, 2026-06-10, 브랜치 `feat/author-decision-forks`)** — FINAL-REPORT 권고 1·2의 다음 조각. 스펙 `docs/superpowers/specs/2026-06-10-author-decision-forks-design.md`, 계획 `docs/superpowers/plans/2026-06-10-author-decision-forks.md`. (1) **생성 측 회수 의무** — 검토만 알던 `payoffStatus`(정체 측정)를 초안 생성 프롬프트까지 배선: `buildDraftPrompt` stallRules 주입(`dcb3632`) + StoryXDesk→draftClient→api/draft→storyx.mjs 미러(`caecedf`) + **vite 브리지 `--payoff-status` 전달 갭을 검토 루프가 적발·수정**(`0f243b2`). (2) **회차 갈림길 카드** — `episodeBriefing.ts` 신설(미회수 promise·openThreads 에서 결정론 도출, LLM 0회, `ec840af`)·정체 시 가장 오래된 약속 우선(`128497c`)·FloatingEditor `.fc-forks` 카드 — 옵션 클릭이 의도 메모에 intent 한 줄 append(`608db57`)·openThreads dedup(`5e1f1e3`). 서브에이전트 구현 + 2단 검토(스펙/품질) 루프 — 검토가 slice 방향·브리지 갭·dedup 3건을 잡아 수정. **라이브** — #2 ch23 백업+레저 주입으로 정체 갈림길 2질문·옵션 4개 렌더, 클릭→메모 합성·중복 무시·다중 선택 정상, 기본 작품은 떡밥 갈림길만(규칙 일치), CLI dry-run 4케이스(정체만 주입·오형식 무시), 콘솔 에러 0. 캡처 `docs/handoff/screenshots/author-decision-forks/`.
- **#3 헌터물 A/B 6축 실증 완료 (2026-06-10 2차, 코드 1건 수정)** — 같은 ch1-locked 분기점에서 B암(미사용) vs A암(사용) 각 2화 + 5인 검토. **★ 사전 발견 — 실생성 작품에서 갈림길이 안 뜨는 구조 갭**(codex 가 rewardArc payoff 즉시 채움 + openThreads 미생성 → fork 소스 0, 실위험은 stakesLedger deferred 에만) → `deferred-stake` fork 추가(TDD 2케이스, `a425042`). **실증 — 갈림길은 연속성(양암 5점 동률)이 아니라 페이오프·상업성을 움직임**: A암 fork 시드가 rewardArc 약속으로 직결·회차 내 이행(백도현=설계자→윤서문 reveal·서가을 안전 lost 실대가·deferred→kept/lost 회전), B암은 발견 축적 + 쇼러너 deferral 압박 재현(통제군). **과회수 신호 → 회차 진도 인터뷰 승격 근거.** P7 신규(fork 시드 의도메모 잔류)·stake 문자열 드리프트·P1 1/13. 리포트 `docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md`.
- **다음** — 회차 진도 인터뷰(승격, 1순위)·fork 시드 강도 2단화·P7 시드 잔류 정리. Follow-up — 갈림길 LLM 정제(2단계)·결정 부채 보드(별도 스펙).

## 병행 트랙 — 편집기 재설계: 방향 C "떠 있는 작업실" (실데이터 배선 완료)

2026-06-05. claude.ai design 에서 발산한 3방향 편집기 시안 중 **방향 C** 를 React 로 이식 착수. `design/floating-editor` 에서 작업 후 main 머지(체크포인트).
- **들어온 것** — `src/components/FloatingEditor.tsx`(739줄) 비주얼 Phase 1. 어두운 캔버스 + 종이 시트 + 좌측 플로팅 독 + 단락 옆 여백 주석 + 작가별 색 밑줄. 인터랙션 전부(드래그 호출 popover·5명 순차 검토·반영/보류·집중·모드탭·키보드). `?editor=floating` 진입, `.fc-*` 스코프 CSS — 기존 편집기·테스트·전역 토큰 무영향(그래서 게이트 녹색).
- **실데이터 배선 완료 (2026-06-05)** — `SAMPLE_*` 제거 → 순수 표현 컴포넌트. StoryXDesk 가 `?editor=floating` 일 때 실 `editorText·MarginReview·CORE_PERSONAS·beats·검토 콜백(onSummon/onRunAll/onAcceptDiff/onRejectReview)`을 props 주입(접근 A). `floatingEditor.test.ts`(react-dom+jsdom 렌더) 추가. 라이브 검증 — 실 페르소나 5명·전체검토 5건 도착·콘솔 0. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`.
- **Phase 2a 스왑 완료·머지 (2026-06-06, main `389a997` ff-merge + 정렬 `488b5e8`)** — floating 이 편집 기본(`isDraftMode && !isClassicEditor`, `?editor=classic` 한시 폴백). 본문 contentEditable 라이브 타이핑(IME compositionstart/end 가드 + bodyVersion-메모로 커서 클로버 차단) + 의도메모 쓰기-백 + 초안생성/편집·데이터/출간 네비 배선. emitBody 는 블록을 `\n\n`(splitIntoParagraphs 라운드트립)로 join. **사용자가 실제 한글 타이핑 정상 확인** → 머지. 추가 — 빈 마진 `display:none` 으로 종이 시트 가운데 정렬. 라이브 — 기본=floating·편집→글자수 0→24자·본문 단락 보존·시트 정중앙·콘솔 0·classic=옛 3컬럼. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2a-swap*`. 캡처 `docs/handoff/screenshots/floating-phase2a/`.
- **Phase 2b 완료·머지 (2026-06-06, main `8bc9d4a`)** — floating 독에 "지표" 버튼 1개 + `fc-p-metrics` 패널 4 접이식 섹션(하니스·품질게이트·매체투사+commercial↔literary 슬라이더·온톨로지), floating-네이티브 `.fc-*`. 이미 계산된 `studioMetrics`(+`updateStoryModeAxis`) 주입(순수 표현). 라이브 — 실데이터(하니스 7/8·95/100·8스테이지, 품질 2/7) 렌더·360 모바일 독 6버튼·패널 뷰포트 내(가로스크롤 0)·콘솔 0. 회차/곡선 리치판은 별도(미정). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2b-metrics-dock*`. 캡처 `docs/handoff/screenshots/floating-phase2b/`.
- **남은 단계 — 2c ✅ · 2d · 2f** — **2c 데이터(캐논/바이블) floating화 완료**(`FloatingDataWorkspace` 신설, 정제 보드 + 독, 브랜치 `feat/floating-phase2c-data`). 2e(옛 3컬럼 제거 + classic 제거)는 직전 완료. 잔여 — 2d 출간 floating화 · 2f topbar dead code 정리. (선택) 회차/곡선 리치판(ChapterStructureTree/TensionShareChart) 이식.

## 병행 트랙 — 쇼케이스 30화: "철거 전야의 이름" (`in_progress` · 2026-06-11 착수, S1/5)

사용자 결정 — "현대에 다시 쓰는 퇴마록 느낌의 30화 장편을 쇼케이스에" + 풀 라이브 루프. **M7 기술 게이트(30화 회귀)·공개 쇼케이스·페이스 체인 실전 운용을 한 작품으로 동시 달성**하는 트랙. 스펙 `docs/superpowers/specs/2026-06-11-showcase-30ch-occult-design.md`, 체크리스트 `docs/superpowers/plans/2026-06-11-showcase-30ch-occult-plan.md`, 로그 `docs/reviews/2026-06-11-showcase-30ch/production-log.md`.
- **S1 (2026-06-11)** — 온보딩(LLM 인터뷰 8문항 전부 작품 맞춤·캐논 4건 정확 시드) + 1화 "철거 전야의 이름"(3,019자·약속 정확 이행) + 2화 "대림장 탈의실의 이름표"(앵커 캐논 계승·"회수 예정" 후크) 각 5인 검토+잠금. canonFacts 7. **★P14 신규 발견** — 전체 검토 더블 트리거 시 pending 영구 잔류 + 기존 런 응답 폐기(StoryXDesk:1013 isReviewing 가드 + useMarginReview seq 가드 합작). P1 빈응답 1/10. 백업 `backups/occult-ch2-locked.json`.
- **완주 (같은 날 6~7차)** — 사용자 "이 세션 완주" 결정 → 3~30화 연속 풀 라이브(차단 0·캐논 122·66,695자). 사건 — dev 서버 사망 3회·codex 한도 1회·폴백 2회·P14 발견→수정(`6d900ac`). 로그 `production-log.md`.
- **★ A/B 비교 + StoryScore v0.1** — 통제군(맨 Claude 동일 기획 30화 『잿우물』 58,106자, `control-claude/`) 집필 + 평가 시스템(`tools/storyscore.mjs`+`story-score` 스킬, `8fdd8d5`) 구축 → 첫 공식 채점 **통제군 91.8 vs 실험군 76.5** (`storyscore-ab-report.md`). 점수차 주범 = 사전 아크 설계 부재·폴백 번호 드리프트·후크 반복. 교란 변수(모델 비대칭·단일 컨텍스트) 명시. **개선 백로그 5건** — 시즌 아크 플래너(1순위)·provider 품질 실험·폴백 번호 버그·후크 다양성·StoryScore v0.2.
- 데모 영상은 자막+BGM 풀 자동 생성으로 결정(별도 세션).

## 현재 활성 — M11 검토 기반 정비 (`in_progress`)

2026-06-01 로컬 구동 점검 + 7에이전트 멀티에이전트 검토 완료. 전체 리포트는 `docs/reviews/2026-06-01-multiagent-review.md`.

**이번 세션 진행 — rank1 · rank2 · rank3 · rank4 + (B) Codex 연결 완료.** 작업 모델 — 로컬 작가진 LLM 을 Codex 로 전환(M12), rank2~4 코딩은 Codex CLI(`codex:codex-rescue`)에 위임하고 Claude 가 검증·머지. rank3·rank4 는 code-reviewer 2차 검증으로 버그를 잡아 Codex 재수정까지 마쳤다.
- **rank1** (small) — 상태 문서 진실 동기화. feature_list A1~A5 done 등재 + active=M11.
- **(B) Codex 로컬 연결 (M12)** — dev 작가진(인터뷰·초안·검토) LLM 을 claude→codex 로. vite.config.ts 5 라우트 + storyx 기본값 codex. dev /api/review-agent codex 실호출 JSON 응답 확인.
- **rank2** (Codex 구현) — 빌딩 단계 LLM 실패 시 빈 에디터 대신 `buildFallbackDraft` 결정론적 폴백 초안 + 실패 배너. 시드 모티프 invent 방지.
- **rank3** (Codex 구현 + code-reviewer + Codex 수정) — 품질 게이트 12개가 하드코딩 리터럴 대신 본문을 실제로 읽음(voiceMatchScore↔koreanVoiceGate 등). 측정 불가 지표 measured:false skip(거짓 통과 차단). storyHarness ready conjunctive 화. **차별점 "연속성을 제품 요건으로" 실재화.**
- **rank4** (Codex 구현 + code-reviewer + Codex 수정) — continuity 충돌 감지를 반의어·생사 대립쌍(OPPOSITION_PATTERNS)·숫자 비교·인물ID(hasSameEntity 가드)로 보강. validateContinuity 가 3계층(hard/living/soft)을 실제로 채우고 growthLedger 루프(appendGrowthEntry·buildContextPack) 연결. code-reviewer 가 거짓양성 CRITICAL(숫자 divergence)+HIGH(presence 동사형·3계층 과분류)를 잡아 Codex 재수정 — 엔티티 가드·공유 목적어 요구·확정 사실 hard 유지. 거짓양성 가드 3 케이스 테스트.
rank 5~7 은 사용자 우선순위 결정 후 개별 착수한다.

**이번 세션(2026-06-04) 추가 — rank5 착수 (Codex 위임 + Claude 검증, 위험도 티어별 단계 추출).** `StoryXDesk.tsx` 6,097→3,772줄(-2,325 · 약 38%).
- **Tier 1 (상수)** — `agentPersonas`·`agentSeedData`·`studioConstants` 3모듈로 추출. 7개 리터럴 byte-identical 검증.
- **Tier 2 Pass A (리프 컴포넌트 8개)** — CanonStatusBadge·PublishingIndexCard·MemoryBankCard·OpenThreadsCard·EvaluatorQualityCard·CanonTimeline·BibleRulesAccordion·AgentPixelPortrait. Codex가 brittle source-string 테스트를 통과시키려 심은 우회 주석(false-green)을 Claude 검증이 적발 → 단언을 정의 파일로 재배치(`componentSrc` 헬퍼 도입).
- **Tier 2 Pass B (Canon/Data 7개 + `canonDataView.ts`)** — CanonNav·DataLeftRail·CharacterGraph·CharacterDetailPanel·CanonCardGrid·CanonCanvas·DataReviewRail. 공용 타입·헬퍼는 `src/lib/canonDataView.ts`로. 테스트 단언 21:21 재배치(삭제·약화 0). Codex 스코프 크리프(상태 문서 임의 수정)는 Claude가 되돌림.
- **Tier 2 Pass C (Bible/Memory 5개) + 헬퍼 de-dup** — ProjectStateCard·BibleWorkbenchHeader·CanonRefactorPanel·BibleAssistantSidebar·MemoryBankStudio. Codex가 getAgentPersona·agentStatusLabel를 복사해 만든 중복을 Claude가 적발 → `lib/agentPersonas.ts` 단일 진실원천으로 통합(드리프트 위험 제거).
- **Tier 2 Pass D (Agent 4개) + 순환의존 제거** — AgentIntentCard·AgentProfileDialog·AgentRoom·WorkStateGrid. Pass B에서 샌 DataLeftRail→StoryXDesk→WorkStateGrid 순환참조(+불필요 re-export)를 Claude가 적발·제거 → StoryXDesk가 다시 `StoryXDesk` 하나만 export(단일 계약 복구).
- 검증 — 매 티어 tsc 0 · 293 tests(올바른 이유로) · build · 편집기·캐논 뷰 렌더·콘솔 0.
- **Pass E (2026-06-06, Claude 직접, `bcca914`)** — Dialogs 3(ProjectHistoryDialog·CommandPalette·VersionLogDialog) + StoryXStatusBar + ChapterStructureTree(+구조 헬퍼블록) + TensionShareChart = **살아있는 6개 추출**. StoryXDesk **3,824→3,317**. 테스트 단언 componentSrc 재배치(삭제·약화 0). **발견 — Status 클러스터 3개(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard)는 죽은 코드(JSX 사용처 0)라 추출 보류 → 삭제 vs 추출 사용자 결정 대기.** PublishingStudio(최대·단독 패스 권장)·Tier3 훅도 잔여.

**추가 핫픽스 (사용자 발견 · 다크 스코프 대비 버그 2건)** — 둘 다 M8.5 의 `.home-page` 다크 전환 시 누락된 잔재다.
1. 매체·포맷 카드 제목이 다크 배경에 묻힘 — `.home-page` 다크 스코프에 `--nx-ink-deep` 오버라이드 누락(12토큰 중 빠짐). `styles.css:8821` 에 `--nx-ink-deep: #f7f7fb` 추가.
2. 상단 nav(`hx-nav`) 의 "Story X" 브랜드·스텝 라벨이 묻힘 — nav 배경이 흰색(`rgba(255,255,255,0.92)`)으로 하드코딩된 채 남아 다크 스코프의 흰 텍스트(`--nx-ink`)와 흰+흰 충돌. `styles.css:8854` 를 `rgba(8,9,10,0.85)` 다크로 교체.
각각 `appExperience.test.ts` 회귀 테스트 추가(블록 단위 검사). TDD RED→GREEN, 271 tests. 같은 유형(다크 스코프 속 흰 배경/색 잔재)은 rank 7 토큰 cascade 전수 점검으로 마무리 예정.

### 검토 7단계 로드맵
| rank | 작업 | 규모 | 상태 |
|---|---|---|---|
| 1 | 상태 문서 진실 동기화 | small | ✅ done |
| 2 | 빌딩 LLM 실패 폴백 초안 + 배너 | medium | ✅ done (Codex) |
| 3 | 품질 게이트 본문 배선 + ready conjunctive | medium | ✅ done (Codex+리뷰+수정) |
| 4 | continuity 충돌 감지 보강 + living/soft 3계층 통합 | large | ✅ done (Codex+리뷰+수정) |
| 5 | StoryXDesk.tsx 훅·컴포넌트 분리 (6,097→3,317, Tier1·2A~E live done) | large | 🔄 진행 중 |
| 6 | 1.0 기준 시장증명 재정의 + 경량 검증 | medium | ✅ done (결정 문서 + feature_list 반영) |
| 7 | 편집기 상단바 압축 + academic 1.0 범위 결정 | medium | ✅ done (상단바=floating 전환으로 해소 · academic=실험 플래그 조건부, 결정 문서) |
| (B) | 로컬 작가진 Codex 연결 (M12) | small | ✅ done |

**rank3·rank4 로 해결** — 품질 게이트가 본문을 실제로 읽고(차별점 실재화), continuity 가 부정어 없는 충돌(생사·숫자)도 잡으며 3계층(hard/living/soft)이 실제로 작동한다. 남은 작업은 rank5~7 (StoryXDesk 분리·시장검증·UI 정돈).

## 병행 트랙 — 10인 매체별 브레드스 (`done` · 2026-06-08 · 5매체 전수)
사용자 "10인 완주" 선택. #2(소설 로판) 완권 깊이 검증 후, 매체별 브레드스로 전환.
- **#3 헌터 회귀물 (소설·다수 캐릭터) — 1화 (2026-06-08)** — 로그 `docs/reviews/2026-06-07-persona-live-test/03-hunter-multichar.md`. **★ P5/P6 수정 다캐릭터 스케일 실증 — 1화에 4인(한지욱·서가을·마도협·백도현) 클린 승격.** 차별점 새 작품/다캐릭터에서도 일관(세계키퍼 비용·캐릭터 4인 동기·연속성 미회수장치). 하니스 7/8·95 첫 화부터. **발견 — 온보딩 첫 회차 build codex transient 폴백("Reading additional input from stdin" 프로즈 누수) → CLI 격리로 transient 확인·재생성 정상. 개선 후보(폴백 raw에러 가드+재시도).** #2는 `backups/02-work-backup-ch23.json` 백업.
- **매체별 경량 스모크 — 만화·에세이·오디오·학술 4종 완료 (2026-06-08)** — 로그 `04-media-breadth-smoke.md`. 각 1단위 codex 실생성, 매체 적합 문체 확인(만화 시각감정·에세이 성찰·학술 초록+가설·오디오 분위기). 인물 추출 전 매체 작동. **★ 매체 특화 = 게이트엔 배선(소설8·학술11·오디오7)·라이브 검토엔 미배선(고정 5인).** **★ 크래시 버그 발견·수정 `3eae1da`** — 매체/포맷 불일치 시 buildCreativeBlueprint throw → 앱 화이트스크린 → 폴백으로 수정(TDD). **5매체(소설 깊이+다캐릭터 + 4매체 스모크) 전수 커버 = 10인 브레드스 완주.**
- **권고(브레드스)** — 매체 특화 작가진 라이브 검토 배선 · 폴백 raw에러 가드(codex transient).

## 병행 트랙 — Codex 검증 데스크 합류 (`done` · 2026-06-11 6차)

사용자가 별도 Codex 오케스트레이션으로 9셀(아마추어 3·프로 4·메타 2) 외부 검증을 수행, Claude 가 합류 절차로 반영. 프롬프트·산출물·합류 기록 전부 `docs/reviews/2026-06-11-codex-validation-desk/` (계약 — 셀 원본 로그 + findings.json + FINAL-REPORT, 합류 판정은 `MERGE-NOTE.md`).
- **P1 표본 재현 판정** — F-007 진성(900px 이하 `.hx-aside` 통째 숨김 → 온보딩 진행 불가) · F-002 재분류(produceEpisode 정상, 실결함=생성 90초간 시각 피드백 0 — 데스크가 12초 대기 후 오판) · F-006 재현 불가(작가실 패널 정상, 자동화 클릭 유실 추정 — 단 검토 진입점 단일 취약성은 실재).
- **수정 3건 (TDD)** — ① FloatingEditor 메인 CTA `mainActionLabel`(상태별: 첫 회차/다음 회차/검토) + isGenerating "생성 중…" 라벨 ② draft 모드 ⌘K → CommandPalette(죽은 spotlight 제거) + `작가진 전체 검토` fallback 명령 ③ 900px 이하 `.hx-aside-card`만 접고 진행 CTA 유지. editorFocusLayout +2 · appExperience +1.
- **데스크 운영 교훈** — 다음 데스크 패킷에 "생성 대기 최소 120초" 조항 필수(F-002 오판 원인). 생성 품질 축은 강함(완결 회수·에세이 사실 보호·오디오/학술 형식) — "바꾸지 말 것" 목록 MERGE-NOTE §5.

## 다음 한 단계 — 품질·비용 로드맵 Phase D (2026-06-12 기준)

**현재 1순위는 위 "품질·비용 로드맵" 트랙** — 착수는 Phase D(폴백 episode 번호 버그부터, TDD 소건). A/B 개선 백로그 5건과 사용자 실독 결함 U1~U5 가 전부 이 로드맵으로 흡수됐다. 아래 1.0 백로그 표는 유지하되, 품질 작업은 로드맵이 정본.

## (이전) 1.0 범위 리프레시 (2026-06-11 마감 기준)

**페이스 통제 체인 완결** — A/B 실증 → deferred-stake fork → 결정론 진도 카드(과회수 4→0~1) → P12 캐논 배지 → P13 폴백 캐논 차단 → 쇼러너 LLM 인터뷰 + 실사용 사이클(ch6, 시드 3축 생성 반영·자동 소거·검토 통과). 리포트 `06-hunter-pace-check.md`. floating 전환(2a~2d)·M6 영속 묶음·매체 영속·매체별 검토(만화 7인 라이브)도 이번 묶음에서 종결.

잔여 백로그 — 1.0 게이트(`docs/decisions/2026-06-10-market-proof-1.0.md`) 기준 재정렬.
| 순위 | 작업 | 성격 | 비고 |
|---|---|---|---|
| 1 | **M7 외부 실증 경량 검증** — ~~C 데모 키트 + A 로그 공개 패키지~~ **A·C 제작 완료(2026-06-11 4차)** → 잔여 = 사용자 액션(A 공개 채널·연락처 기입, C Loom 녹화, B 베타 3~5인 모집) | 1.0 critical path | A `docs/public/` · C `docs/handoff/2026-06-11-demo-video-kit.md`+캡처 8종 |
| 2 | **M7 기술 게이트 — 30화 시리즈 회귀** → **쇼케이스 30화 실작품 완주로 착수**(2026-06-11 5차, S1 1·2화 완료) | 1.0 게이트 | 풀 라이브 루프, 병행 트랙 절 참조 |
| 3 | **갈림길 LLM 정제** — fork 옵션/시드 작품 맞춤화 | 이야기 완성도 | pace-interview 패턴 그대로 재사용 |
| 4 | **rank5 잔여 정리** — PublishingStudio 옛 JSX 제거(floating 전환 완료로 안전)·Status 죽은 코드 3개 처분·Tier3 훅 | 기술부채 | |
| 5 | **검증 데스크 P2/P3 6건** — F-001 인터뷰 대기 안내·F-003 카드 접근성·F-004 잔여(단독 원고 행동 구분)·F-005 만화 컷 수 hard constraint·F-008 literary 축 온보딩 노출·F-010 매체별 원클릭 검토 | UX/품질 | `docs/reviews/2026-06-11-codex-validation-desk/MERGE-NOTE.md` §4 |
| 6 | **academic 라이브 검토 배선** | 1.0 실험 플래그 전제 | 미완 시 1.1 자동 이연(결정 문서) — 핵심 루프 밖이라 후순위 |
| 6 | 결정 부채 보드(별도 스펙) · (push) origin | 낮음 | push 는 사용자 요청 시 |

## 최근 검증 (2026-06-14 7차 · #3 영향 회차 인라인 · main · ultracode)

```
init.sh            → tsc 0 · vitest 545(editorFocusLayout +2) · build 통과 (543→545)
#3 영향 회차 인라인 → 베타 검토대기 #3(설정 변경 영향 회차가 편집 지점에 안 뜸 — CanonRefactorPanel 이 canon 섹션에만,
  CanonCanvas 편집 입력 지점엔 부재. 랜딩 "영향 범위 먼저 펼쳐 보여줌" 약속 위반).
  청사진 maps[1] 대로 순수 로직 변경 0 — 기존 buildCanonRefactorPlan(project, canonChanges) 결과를 편집 지점에 표시만.
  CanonCanvas 에 canonRefactorPlan(required) prop + characters aside 에 affectedChapters 인라인 미리보기
  ("이 변경이 영향 주는 회차 N개", EP·title·reason, slice 5). StoryXDesk 2 호출처 배선. .ex-canon-impact 다크 토큰.
검증             → editorFocusLayout +2 소스핀(CanonCanvas affectedChapters·desk 전달)·tsc(canonRefactorPlan required 로 배선 강제)·build.
  배선 경로 코드 확인 — canonRefactorPlan = useMemo(buildCanonRefactorPlan(project, canonChanges), [canonChanges, project])(StoryXDesk:908)
  → CanonCanvas. 인물 편집 → logCanonChange → canonChanges → plan.affectedChapters → 미리보기.
★ 라이브 갈음     → preview 환경 불안정(resume 후 서버 종료·포트 5174→5173 드리프트·브라우저 컨텍스트 격리)으로 자동화 검증 불가.
  #3 저위험(새 상태/로직 0, buildCanonRefactorPlan canonRefactor.test GREEN, CanonCanvas 렌더는 #6 세션 라이브 확인분)
  + tsc·소스핀·build 로 갈음(#1-undo 선례). 다음 안정 세션에서 회차 있는 작품으로 눈 확인 권장.
남은         → 검토대기 #4(FloatingEditor 회차 선택기·단편 게이트 완화 — 청사진 maps[2], 가장 침습적).
```

## 최근 검증 (2026-06-14 6차 · #7 작품 헌장 편집 · main · ultracode)

```
init.sh            → tsc 0 · vitest 543(storyEngine +5·episodeBriefing +2·canonRefactor +2·editorFocusLayout +4) · build 통과 (530→543)
#7 헌장 편집       → 베타테스트 검토대기 #7(잠근 헌장 결말·4줄 척추·화수 재열람·수정·증보 UI 전무, ContractAmendment·validateContract 모델은 있으나 미배선 → 생성은 옛 척추로 발화).
  ultracode Workflow(Explore 3 병렬 매핑 + 청사진 합성)로 #7·#3·#4 코드 정밀 매핑 후 #7부터 TDD 착수. 청사진 핵심 사실 4건 Claude 독립 검증.
  storyEngine isSpineComplete(단편2줄/장편4줄 잠금규칙 추출)·applyContractAmendment(척추/결말/대가/화수 부분패치→비트 재산출·잠금 재계산·amendments 누적, at 인자주입으로 순수성 유지) 신설(TDD).
  canonRefactor revertCanonChange story-core 분기에 storyContract JSON 복원 추가(중첩 객체 — 평면대입이면 문자열 박힘, 손상 JSON 안전실패).
  CharterAmendCard(신규 컴포넌트, 로컬 draft + 외부 헌장변경 재시드 + 바뀐 필드만 patch) · StoryXDesk amendCharter(no-op 가드·logCanonChange storyContract revert) · MemoryBankStudio overview 배선 · styles.css .sx-charter-amend 다크 토큰.
검증             → 순수함수 TDD 5(척추교체·결말/화수패치·공란시 잠금해제·change명시·isSpineComplete)·미러불변 핀 2(buildContractStatus 형태 불변=promptBuilders↔storyx.mjs 무수정)·storyContract undo 2·소스핀 4.
  라이브(preview) — 헌장작품("반납되지 않은 편지", spineLocked) 데이터→바이블→작품계약: CharterAmendCard 렌더(장편30화·잠김 라임배지·6 textarea·다크 rgb(15,16,17))→
  욕망 편집 dirty 감지→"이 개정 반영"→spine 갱신·비트 핀 재산출·이력 "척추 욕망 개정"(전필드 아님)·버튼 재비활성→변경로그 "↩ 되돌리기"→storyContract 전체 원복(spine·beat·amendments)·콘솔 0·원본 무손상.
미러 무수정       → ContractStatusInput(예산 숫자만 운반)에 amendment 미노출 → promptBuilders.ts/storyx.mjs 편집 0(회귀 핀이 보증).
다음(#7 후속)     → 검토대기 #3(영향 회차 인라인·CanonCanvas)·#4(FloatingEditor 회차 선택기·단편 게이트 완화). 청사진 maps/blueprint 보존(이번 Workflow 산출).
```

## 최근 검증 (2026-06-14 · charter 스크롤 핫픽스 + 이야기 품질 딥리서치 · main)

```
init.sh            → tsc 0 · vitest 521(charter 스크롤 회귀 +1) · build 통과 (520→521)
charter 스크롤 버그 — 사용자 실사용 발견: 작품 헌장(charter) 단계 세로 스크롤 불가 + 하단 4줄 척추 편집 불가.
  근본원인 — charter 패널이 다른 온보딩 단계의 `.hx-panel > .hx-main(overflow-y:auto)` 스크롤 컨테이너 패턴을
  안 따르고 `.hx-panel-charter > .hx-charter` 직속이라, `.hx-panel` overflow:hidden 이 긴 콘텐츠 하단을 클리핑.
  수정 — App.tsx charter 를 `.hx-main` 으로 감쌈 + styles.css `.hx-panel-charter { grid-template-columns: 1fr }`(빈 320px aside 컬럼 제거).
  TDD — appExperience.test +1(charter 가 hx-main 안 + .hx-panel-charter CSS). RED(charterBlock 에 hx-main 없음)→GREEN.
라이브(preview)    — 장편 charter 진입: panelGridCols 단일 1fr(1440px)·scrollable(scrollHeight 1207 > client 840)·
  scrollTop max 시 하단 CTA bottom 1649→92(화면 안)·4줄 척추 4 textarea 전부 접근·padding 복원·reload 후 온보딩 정상.
  (vite 1467 JSX 에러는 1:17:36 편집 중간 HMR 잔여 로그 — init.sh tsc exit0 + 정상 렌더로 무효 확정.)
딥리서치          — 이야기 품질·의외성(U3·U4) SOTA 정본 docs/research/2026-06-14-prose-quality-surprise-research.md
```

## 최근 검증 (2026-06-14 5차 · #6 인물 CRUD · main)

```
init.sh            → tsc 0 · vitest 530(storyEngine +1·editorFocusLayout +1) · build 통과 (528→530)
#6 인물 CRUD       → 베타테스트(욕망/상처/현재상태 3필드 덮어쓰기만, 추가·삭제·이름변경 핸들러 0개).
  storyEngine addCharacter(빈 필드·결정론 char-N id)·removeCharacter(고아 relations 정리)·renameCharacter 순수 함수(TDD).
  StoryXDesk handleAdd/Remove/RenameCharacter → CanonCanvas → CharacterDetailPanel(이름 입력·"이 인물 삭제" confirm) + "+ 인물 추가" 버튼.
검증             → 순수 함수 TDD(add/rename/remove·relations 정리·없는 id 무변경)·배선 tsc·editorFocusLayout 소스 핀.
  라이브(preview) 확인 — 데이터→인물 카테고리 진입 시 CanonCanvas "+ 인물 추가"·이름 입력·"이 인물 삭제" 렌더,
  클릭 시 char-2 "새 인물" 추가(결정론 id). centerSlot 이 곧 CanonCanvas 라 floating 데이터에 정상 발화. 원본 복원.
남은 #6          → 인물 role 편집·캐논(장소/사물/사건) CRUD·매체별 캐릭터 스키마(만화 외관)는 분리(리포트 §3-6).
```

## 최근 검증 (2026-06-14 4차 · #1-undo 바이블 되돌리기 · main)

```
init.sh            → tsc 0 · vitest 528(canonRefactor +1·editorFocusLayout +1) · build 통과 (526→528)
#1-undo            → 베타테스트 2순위(전원 10명). 수동 바이블 편집(인물·세계·캐논·문체축·무게중심)에
  되돌리기 전무 → 3~6회 갈아엎기 안전망 신설.
  canonRefactor revertCanonChange(project,change) 순수 함수(TDD) — 식별자(targetId·revertField)로
  before(최초 원본) 정확 복원, 식별자 없으면 무변경(이름 역매칭 의존 0).
  CanonChangeEntryInput 에 targetId·revertField 추가 + 5개 update 함수가 식별자 기록 +
  StoryXDesk revertCanonChangeEntry(복원+로그 제거) → MemoryBankStudio → CanonRefactorPanel "↩ 이 변경 되돌리기" 버튼.
검증             → revertCanonChange TDD 4케이스(character/world/story-core 복원·식별자 없으면 참조동일)·
  배선 tsc·editorFocusLayout 소스 핀. 라이브 버튼 클릭은 순수 함수 TDD+배선 tsc 로 갈음(인물 주입 비용 대비).
```

## 최근 검증 (2026-06-14 3차 · #1 본문 영속 — 편집 자동 저장 · main)

```
init.sh            → tsc 0 · vitest 526(storyEngine +1·editorFocusLayout +1) · build 통과 (524→526)
#1 본문 영속       → 베타테스트 1순위(데이터 손실) 해결. editorText 가 chapter.prose 로 commit 안 돼
  회차 전환·새로고침·import 시 무음 소실되던 버그.
  storyEngine commitChapterProse(project,id,prose) 신설(TDD — 없는 id·동일 prose no-op 참조동일).
  StoryXDesk 배선 — editorTextRef(stale closure 회피 최신값)·debounce 800ms 자동 commit·
  latestChapter effect 에 loadedChapterIdRef 추가해 회차 전환 시 이전 회차에 미커밋 편집 flush 후 새 회차 시드.
라이브(preview)    — test 회차 주입 → contentEditable 편집 '[편집마커X9]' → 800ms 후 localStorage chapter.prose commit
  (hasMarker:true) → 새로고침 후 editorShowsMarker:true(이전엔 소실). 원본("반납되지 않은 편지") 무손상 복원.
남은 보강(낮음)    → 저장 중 표시·beforeunload(2c/2d) edge case. 자동저장으로 '저장됨' 칩이 사실상 참이 돼 우선순위↓.
```

## 최근 검증 (2026-06-14 2차 · 울트라코드 10인 베타테스트 + UI/UX 안전 자동수정 · main)

```
init.sh            → tsc 0 · vitest 524(appExperience +3: #2·#4·#11) · build 통과 (521→524)
베타테스트         → ultracode Workflow 10인(장편2·단편2·에세이2·만화2·오디오1·학술1) 코드·플로우 워크스루
  (각자 캐릭터·이야기 3~6회 중간수정 시나리오) → findings 74 → 종합 24 우선순위.
  리포트·raw docs/reviews/2026-06-14-ultracode-beta-10/. 첫 시도 동시 10 → 서버 rate limit 전멸 → 배치 3씩으로 해소.
★ 핵심 — "생성 중 설정 변경" 흐름이 구조적 미완성(본문 영속·undo·CRUD·헌장 편집 부재). charter 스크롤급 국소 아님.
자동수정 3 (TDD)  — #2 charter 연재 building 캐러셀 빈화면(buildingPanelIndex charter 제외 — ★직전 charter 후속 회귀)·
  #11 매체변경 패널 흰박스→var(--sx-card)·#4 오디오 낭독 "0분 60초"→총초 환산. 앱 콘솔 에러 0.
검토 대기 14      — 🔴#1 본문 편집 무음 소실(freq8 전매체·"저장됨" 오표시 = 데이터 손실 1순위)·undo 전무(freq10)·
  영향회차 미표시(랜딩 약속 위반)·회차 선택기·잠금 보호·CRUD·헌장 편집·학술 마진검토 dead 등.
보류 3            — #14 aside agentStack·#23 dataView 매체분기·#20 회차수 clamp(onBlur 권장).
라이브            — #2 결정론 산술+테스트 검증(charter→building 전경로 라이브는 codex 생성 비용으로 생략). 콘솔 0.
```

## 최근 검증 (2026-06-13 3차 · A-3c 비트 펼침 미리보기 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(appExperience +1: A-3c 비트 미리보기 소스검사) · build 통과
                     (변경 전 519 → 520)
A-3c               — App: deriveBeatSheet import + charter 4줄 fieldset 아래 비트 미리보기
                     (long && spineComplete 조건부) · styles: .hx-charter-beats/.hx-beat-* + .hx-spine-* CSS
라이브(preview)    — ?stage=home 온보딩 → 작품 헌장 단계 진입 → 4줄+결말+대가 주입:
                     "이 4줄은 전체 30화에 이렇게 박힙니다" + 8·15·23·30화 핀(라임)·미션 매핑·
                     dashed 박스 · "헌장 확정—1화 만들기" 활성 · A-3b 버튼 freewrite 없어 풀폭 disabled · 콘솔 0
                     (localStorage 작품은 헌장 확정 미클릭으로 무손상)
```

## 최근 검증 (2026-06-13 2차 · A-3b 쇼러너 4줄 제안 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 7건 추가: promptBuilders 3·spineSuggestClient 3·appExperience 1) · build 통과
                     (변경 전 512 → 519)
A-3b               — buildSpineSuggestionPrompt(promptBuilders↔storyx.mjs byte-identical 미러)·spine-suggest CLI 명령·
                     /api/spine-suggest 라우트·vite 브리지·spineSuggestClient(normalizeSpine)·aiStatus mode·
                     App charter "쇼러너에게 4줄 제안받기" 버튼(빈 칸만 채움·작가 입력 보존)
CLI dry-run        — spine-suggest --dry-run: mode·프롬프트 669자·JSON 계약 포함
codex 라이브(preview) — /api/spine-suggest 직접 fetch: provider=codex·status complete·23.5초·
                     4줄(desire/advance/obstacle/resolution) 작품 맞춤·resolution 이 endingStatement 와 정렬·콘솔 0
```

## 최근 검증 (2026-06-13 · A-2 단계 게이트 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 8건 추가: 게이트4·단편빌더1·UI게이트2·App charter1) · build 통과
                     (변경 전 504 녹색 → 512)
A-2 (3d98fe1)      — evaluateProductionGate(spineLocked 기준·헌장 없으면 통과)·단편 desire+resolution 2줄 경량 잠금·
                     produceEpisode 진입 가드·FloatingEditor productionBlockedReason CTA 비활성·App charterReady 단편 2줄
라이브(preview)    — 미잠금 헌장(spineLocked:false) ?stage=editor 진입: 메인 CTA disabled·"헌장 잠금 필요"·
                     title="장편 척추가 아직 잠기지 않았습니다…" → spineLocked:true 복원 시 "초안 생성" enabled·
                     콘솔 에러 0 · 원본 작품("반납되지 않은 편지") 무손상 복원(별도 백업 키 경유)
```

## 최근 검증 (2026-06-12 · 품질·비용 로드맵 Phase D+A · main ff-merge)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 30건 추가: 회귀1·StoryScore6·헌장6·예산5·A-4 12) · build 통과
                     (변경 전 465 녹색 · 각 커밋 후 재실행)
Phase D-1 (cf8f1de) — nextEpisodeNumber(chapters 마지막+1). 드리프트 재현 테스트 RED(19)→GREEN(17)
Phase D-2 (b7f59f2) — StoryScore v0.2: 이름 가드(length<3)·analyzeTitles 반복률·후크 느낌표/반전어
Phase A-1 (a15728b) — StoryContract/StorySpine·validateContract 경계(short 4~8·long 24~36)·결말·비트
Phase A-5코어(e92c13d) — buildContractStatus: 17/30→remaining13 · 28/30 unpaid3→overBudget · 23/30→finalStretch
Phase A-4 (40646ea) — digest 헌장 절·draft 예산/종반/척추 규칙·review 길 잃음 점검·storyx.mjs 미러 동기화
                     (에세이·standalone·헌장없음 미주입 가드 테스트 포함)
Phase A-5 (43c6d56·d2fd3f8) — contractStatus 전 경로 배선(생성+검토). CLI dry-run 프롬프트 검증·
                     draftClient/reviewClient body 전달·오형식 무시 가드 테스트
Phase A-3 (54fa97a·2e51fa2) — deriveBeatSheet·buildStoryContractFromOnboarding 5건 + 온보딩 charter 단계
라이브(Playwright/preview) — 신규 장편: charter 패널 렌더(분량/결말/4줄 fieldset·length chip·
  CTA 게이트 disabled→enabled)→확정→serial-story-studio/project 에 storyContract
  {long·30화·beatSheet 4·spineLocked:true·ending} 영속 · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 6차 · Codex 검증 데스크 합류 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 3건 추가) · build 통과 (수정 전·후 각 1회)
표본 재현(라이브)  — 백업 03-hunter-branchpoint-ch1-locked 주입:
  F-002 — 잠금 후 초안 생성 클릭 → ~80초에 2화 도착(기능 정상) · 클릭 직후 피드백 0 재현
  F-006 — 작가실 패널 520/1280px 열기·닫기·전체검토 버튼 모두 정상(미재현)
  F-007 — 520px 온보딩 CTA rect 0×0 재현(진성)
수정 후 라이브     — 520px CTA 풀폭 노출·클릭 진행 · floating ⌘K 팔레트+작가진 전체 검토 ·
  메인 CTA 상태별 라벨("흐름 검증") · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 5차 · 쇼케이스 30화 S1 · main)

```
코드 변경 0 (문서·라이브 제작만) — 직전 게이트 450 tests 녹색 유지
온보딩 — freewrite 121자 → LLM 인터뷰 8문항(전부 작품 맞춤, 범용 0) → 1화 빌드 72초
  확정 캐논 4건이 인터뷰 답 그대로 시드(검토 context 에서 확인) — 갭A 신작 재실증
ch1 "철거 전야의 이름" — 3,019자·누수 0·audiencePromise 정확 이행(원혼이 본명 "강이현" 호명)
  검토 수정3·결정1·관찰1(세계키퍼 빈응답=P1) · 3인 독립 수렴(호출 주체 모호) · 하니스 7/8·95
ch2 "대림장 탈의실의 이름표" — 76초·2,321자·memoryAnchors 가 1화 캐논 3건 명시 참조
  검토 수정4·결정1·차단0 (P1 0/5) · canonFacts 4→7 · 4인이 표면 약속 이행 방식 일관 추적
★P14 — 전체 검토 더블 트리거 시 pending 영구 잔류·기존 런 응답 폐기 (재현·원인 코드 특정,
  수정은 다음 세션 TDD 건) · 초기 런 5건 중 2건 와이어 미발화(재현 조건 미상, 리로드 후 5/5 정상)
백업 backups/occult-ch2-locked.json · 캡처 showcase-30ch/ch1-margin-reviews.png · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 4차 · M7 경량 검증 A·C 제작 · main)

```
init.sh            → tsc 0 · vitest(450 tests) · build 전체 통과 (세션 시작 시 — 이번 세션 코드 변경 0, 문서·캡처만)
A 공개 패키지       — docs/public/README.md(소개·정직성 명시·베타 모집 CTA) +
                     docs/public/storyx-live-test-showcase.md(23화 완권 4축 실증 + 한계 공개, 내부 코드명 제거)
C 데모 영상 키트    — docs/handoff/2026-06-11-demo-video-kit.md(5분 콘티 7장면·나레이션·백업 주입 절차)
라이브 검증 — 백업 2형식 주입 절차 실증(02-ch23 dump형 · 03-hunter 키맵형, /@fs/ fetch 스니펫):
  ch23 완권 재현(23화·캐논 91·온톨로지 113·인물 그래프·출간 체크리스트) ·
  헌터 ch6 재현(갈림길 카드+캐논 확인 배지·진도 체크+쇼러너에게 묻기·작가실 5인) · 콘솔 에러 0
캡처 8종 — docs/handoff/screenshots/demo-video-kit/ (S1·S3·S4×2·S5×3·S6)
```

## 직전 검증 (2026-06-11 3차 · 진도 인터뷰 2단계 · main)

```
init.sh            → tsc 0 · vitest(450 tests) · build 전체 통과
구현 — 병렬 2축 위임 + Claude 머지 통합:
  서버/CLI  — buildPaceInterviewPrompt 정본+storyx.mjs 미러(+동기화 테스트)·pace-interview 명령·
              /api/pace-interview 브리지·prod 라우트. 머지 시 Claude 가 구식 runProvider 호출을
              runProviderWithRetry+looksLikeProviderError 로 교체(베이스가 Q2 이전이던 갭).
  클라이언트 — paceInterviewClient(normalize·[페이스] 접두 계약·reportAiCall)·fc-pace-ask 버튼·
              로딩/note·StoryXDesk 질문 교체 배선·strip [페이스] 패턴
라이브 — #3 ch5 상태: 버튼→로딩("쇼러너가 진도를 읽는 중…")→작품 맞춤 질문 3개 교체
  ("'숨긴 진실' 어디까지 — 핵심 직전에서 멈춘다/부분 고백으로 금이 간다/행동으로 먼저 갚는다")
  옵션 클릭→[페이스] 시드 합성·같은 질문 교체·콘솔 0 · 캡처 pace-check/pace-interview-llm-live.png
```

## 직전 검증 (2026-06-11 2차 · P12 재관찰 + P13 · main)

```
init.sh            → tsc 0 · vitest(428 tests) · build 전체 통과
P13 (c6dd3bd)      — produceNextChapter 캐논 발명 제거(intent 누수·비밀 발명 템플릿 2건).
                     폴백 캐논을 픽스처로 쓰던 longformContinuity·memoryBank 테스트는 명시적 픽스처로 전환.
P12 재관찰 (라이브) — ch4 fixture 에서 배지 회피 + 정당 옵션(합류·전진·1~2화 안)으로 ch5 "예비 회수선" 재생성:
  연속성 — 출고 불가(결정) → 수정("큰 줄기는 기존 캐논과 맞고") · 고백 재서술 미발생(부분 전진 reframe)
  페이스 — 합류는 7분 시간창까지(본인 미등장) · 쇼러너 "합류 직전까지 전진·연재 압력 살아있음"
  메모 자동 소거 3회차 연속 · 백업 backups/03-hunter-p12-recheck-ch5.json
```

## 직전 검증 (2026-06-11 · P12 캐논 모순 의심 배지 · main)

```
init.sh            → tsc 0 · vitest(427 tests) · build 전체 통과
P12 수정 (9b9627a, 8534503):
  overlapsCanonFact — 옵션 토큰 65%+ 가 한 캐논 문장에서 prefix 발견 시 canonSuspect (ch5 fixture 실데이터 핀 3종)
  fc-fork-opt is-canon-suspect — "캐논 확인" 배지·dashed 보더 (제외 아님, 최종 판단은 작가)
  프롬프트 규칙   — "이미 일어난 일은 새 약속이 될 수 없습니다" promptBuilders+storyx.mjs byte-identical + 미러 동기화 테스트
  임계 캘리브레이션 — 라이브에서 0.6 경계 거짓양성(관측 모델 이탈 stake) 발견 → 0.65 + 경계 핀 테스트
  라이브 — ch4 fixture: 사고 옵션("숨긴 미래의 진실")에만 배지·정당 3개 깨끗·콘솔 0
```

## 직전 검증 (2026-06-10 4차 · 진도 체크 실효 관찰 · main)

```
init.sh            → tsc 0 · vitest(421 tests) · build 전체 통과
intentVersion      — strip 결과를 uncontrolled 메모 textarea 에 재시드 (066ea9f, P7 후속 라이브 발견·TDD)
실효 관찰 (#3 ch4~5, 회차당 진도 시드+갈림길+5인 검토):
  ch4 "관측자의 문턱" — 절제 시드 → 합류 payoff 단서 수준·새 약속 미회수로 남김 · 과회수 지적 0
  ch5 "고백의 비용"   — 회수 시드 → ch4 가 미룬 약속 1화 뒤 이행 · 과회수 지적 1(기준선 4)
  메모 사이클 — 시드 4줄 → 생성 → 자동 소거(0줄) 2회차 연속
  ★P12 — ch5 캐논 충돌을 검토 2인 독립 적발(출고 불가) — 갈림길의 모순 약속 미필터 갭 + 검토 망 작동 실증
  백업 — backups/03-hunter-pacecheck-ch5.json · 리포트 06-hunter-pace-check.md
```

## 직전 검증 (2026-06-10 3차 · 진도 체크 + 페이스 결함 + 매체 영속 · main)

```
init.sh            → tsc 0 · vitest(420 tests) · vite build 전체 통과
스펙 — docs/superpowers/specs/2026-06-10-pace-check-design.md (분업: sonnet 2 worktree + Claude 직접 1 + 라이브)
  paceInterview    — buildPaceCheck(질문 3·결정론·트리거: 연재+2화+정체/deferred2)·replacePaceSeed (be93014, 2d68457)
  페이스 결함 3건   — 시드 강도 isStalled 연동(c765c18)·P7 stripConsumedSeeds(a4ccc97)·stake 드리프트 Jaccard 매칭(c5f6704)
                     + 진도 시드 3종도 소비 처리(에이전트 간 갭 봉합)
  매체 영속        — SeriesProject.medium/format + createEmptyProject 시드 + 로드 복원 (e266894)
                     ★리로드 후 만화 작품이 소설 5인으로 검토되던 매체 연속성 버그 (#4 라이브 발견)
  라이브 — #4 만화: 리로드 후 7인 유지·7/7 검토 도착(스토리보드=컷 흐름·말풍선=캡션 압박, 캡션 과다 수렴 포착)
          #3 A암: 진도 카드 렌더·append·같은질문 교체·비정체 연성 시드·콘솔 0
  캡처 — docs/handoff/screenshots/pace-check/
```

## 직전 검증 (2026-06-10 2차 · 멀티에이전트 분업 세션 · main)

```
init.sh 등가 게이트 → tsc 0 · vitest(388 tests) · vite build 전체 통과 (S4 머지 후 재실행)
분업 모델 — Claude 오케스트레이션+라이브실증 / Codex(2d) / sonnet 서브에이전트(폴백가드·CLI·결정문서)
  Q2 폴백 가드   — runProviderWithRetry·looksLikeProviderError·buildCliDraftFallback (7865e2b)
                   ★Claude 검증이 치명결함 적발: codex 정상 호출도 stderr 배너 출력 → stderr 조건 제거 (deb0474)
                   라이브 — A암 ch3 실패 시 폴백 prose 에 raw 에러 누수 0 (#3 온보딩 누수와 대조)
  S1 2d 출간     — FloatingPublishWorkspace 270줄 + early-return + .fc-publish-* (29eec7b, 1차 위임 no-op 적발 후 재위임)
                   라이브 — A/B 잠금 동선에서 실데이터 렌더·잠금·복귀 정상, 캡처 hunter-ab-forks/floating-publish-2d-live.png
  S4 M6.3 CLI    — init/serve/memory sync + README (cdee90e) · dry-run 3종 + 실파일 스모크
  deferred fork  — buildEpisodeForks 'deferred-stake' 소스 추가 (a425042, TDD RED→GREEN)
  rank6·rank7    — docs/decisions/2026-06-10-{market-proof,academic-scope}-1.0.md · M7 done_criteria 교체
  A/B 실증       — docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md · 백업 3종
  vite watch     — .claude/.playwright-mcp/docs churn 의 dev 풀 리로드 차단 (65fdc1e)
```

## 직전 검증 (2026-06-09 · floating 2c + 코드성 개선 전체 + main 머지)

```
init.sh            → tsc · vitest(364 tests) · build 전체 통과 · main 안착(ff-only)
floating Phase 2c — 데이터 모드 floating화 (board 정제·파고들기·MetricSummary, ~839136c)
  DataView board · FloatingDataWorkspace · isBibleMode early-return · .fc-data-* · MetricSummary
  라이브 — board 정제(이상한 원 제거)·캐논 파고들기→복귀·모바일 360 가로스크롤 0 · 캡처 floating-phase2c/
코드성 개선 (사용자 "a하고 c"):
  P1 — codex stdin 누수 제거(spawnSync input:'') + 빈응답 폴백 (fe13581)
  매체별 검토 — getMediumReviewAgentIds(CORE + 매체 specialist) (0011749)
    comics→스토리보드·말풍선 / audiobook→낭독 / essay→큐레이터 / novel·academic→CORE
  2f — 출간 모드 return 의 isDraftMode dead 가드 7곳 제거 + 단언 정합 (c3b4cbf, -126줄)
  polish — FloatingEditor topbar '· 새 초안' 중복 제거 (6d79085)
  라이브 — 편집 작가실 CORE 5·콘솔 0
main 머지 — 전 작업 ff-only 안착. origin push 미실행(사용자 요청 시).
```

## 완료 마일스톤

| ID | Title | Evidence |
|---|---|---|
| M1 | 스토리 하네스 통합 설계 문서 | docs/storyx-harness-architecture.md |
| M2 | Linear 다크 랜딩 재작성 | src/App.tsx MarketingLanding v4 |
| M3 · M3.5~3.7 | 4파트 구조·낮밤 토글·스튜디오 설정·에디터 폴리시 | src/App.tsx · src/StoryXDesk.tsx · src/styles.css |
| M4 (.A~.H) | 스토리 하네스 구현 Layer 0~7 | storyOntology·storyHarness·continuityContract·koreanVoiceGate·qualityGates·agentRunEngine·mediaProjection |
| M4.5 | 매체 페르소나 풀 ↔ 인터뷰 연결 | interviewClient.ts · tools/storyx.mjs |
| M5 | 서버측 LLM Vercel Functions (5 라우트) | api/*.ts · src/lib/server/{promptBuilders,llmRunner}.ts |
| M6.1 · 6.2 · 6.2.1 | export/import · evolutionMemory 누적 · history UI | storage.ts · evolutionMemory.ts · AiStatusBadge.tsx |
| M8 (.1~.5) | 하네스·게이트·매체·온톨로지 UI 카드 + 홈 다크 | StoryXDesk 좌레일 카드 · DataPanel |
| M9 | 디자인 핸드오프 패키지 | docs/handoff/ |
| M10 (P1~P3) | 우레일 Margin 검토 모델 · 좌레일 DataPanel · pending/anchor · 마진 병렬화 | marginReview · DataPanel · perf 88282f1 (80s→16s) |
| A1~A5 | 사회과학/학술 확장 (매체 골격·주장 레저·인용 무결성·반론/윤리·학술 퍼블리시) | claimLedger·citationGate·academicIntegrity·academicPublish · 커밋 98d6221~513b50e |

## 미완 (백로그)

| ID | Status | Note |
|---|---|---|
| M11 rank 5 | in_progress | PublishingStudio 추출·Tier3 훅·Status 죽은 코드 3개 처분 잔여 |
| M7-alpha-1.0 | todo | done_criteria 재정의 완료(2026-06-10 결정) — 외부 실증 게이트 실행 대기 |

## Master Plan

`~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마일스톤 로드맵.
