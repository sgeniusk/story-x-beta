# Story X — Progress

> Last Updated: 2026-06-10 · Branch: `feat/author-decision-forks` (**작가 결정 갈림길 + 생성 측 회수 의무 완료** · episodeBriefing 신설 · payoffStatus 생성 경로 배선 · fc-forks UI)
> 코드 하네스 상태는 이 파일, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

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
- **다음** — #3 헌터물 페르소나 테스트에서 갈림길 사용/미사용 6축 A/B 실증. 남은 일괄 수정(floating 2d). Follow-up — 갈림길 LLM 정제(2단계)·결정 부채 보드(별도 스펙).

## 병행 트랙 — 편집기 재설계: 방향 C "떠 있는 작업실" (실데이터 배선 완료)

2026-06-05. claude.ai design 에서 발산한 3방향 편집기 시안 중 **방향 C** 를 React 로 이식 착수. `design/floating-editor` 에서 작업 후 main 머지(체크포인트).
- **들어온 것** — `src/components/FloatingEditor.tsx`(739줄) 비주얼 Phase 1. 어두운 캔버스 + 종이 시트 + 좌측 플로팅 독 + 단락 옆 여백 주석 + 작가별 색 밑줄. 인터랙션 전부(드래그 호출 popover·5명 순차 검토·반영/보류·집중·모드탭·키보드). `?editor=floating` 진입, `.fc-*` 스코프 CSS — 기존 편집기·테스트·전역 토큰 무영향(그래서 게이트 녹색).
- **실데이터 배선 완료 (2026-06-05)** — `SAMPLE_*` 제거 → 순수 표현 컴포넌트. StoryXDesk 가 `?editor=floating` 일 때 실 `editorText·MarginReview·CORE_PERSONAS·beats·검토 콜백(onSummon/onRunAll/onAcceptDiff/onRejectReview)`을 props 주입(접근 A). `floatingEditor.test.ts`(react-dom+jsdom 렌더) 추가. 라이브 검증 — 실 페르소나 5명·전체검토 5건 도착·콘솔 0. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`.
- **Phase 2a 스왑 완료·머지 (2026-06-06, main `389a997` ff-merge + 정렬 `488b5e8`)** — floating 이 편집 기본(`isDraftMode && !isClassicEditor`, `?editor=classic` 한시 폴백). 본문 contentEditable 라이브 타이핑(IME compositionstart/end 가드 + bodyVersion-메모로 커서 클로버 차단) + 의도메모 쓰기-백 + 초안생성/편집·데이터/출간 네비 배선. emitBody 는 블록을 `\n\n`(splitIntoParagraphs 라운드트립)로 join. **사용자가 실제 한글 타이핑 정상 확인** → 머지. 추가 — 빈 마진 `display:none` 으로 종이 시트 가운데 정렬. 라이브 — 기본=floating·편집→글자수 0→24자·본문 단락 보존·시트 정중앙·콘솔 0·classic=옛 3컬럼. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2a-swap*`. 캡처 `docs/handoff/screenshots/floating-phase2a/`.
- **Phase 2b 완료·머지 (2026-06-06, main `8bc9d4a`)** — floating 독에 "지표" 버튼 1개 + `fc-p-metrics` 패널 4 접이식 섹션(하니스·품질게이트·매체투사+commercial↔literary 슬라이더·온톨로지), floating-네이티브 `.fc-*`. 이미 계산된 `studioMetrics`(+`updateStoryModeAxis`) 주입(순수 표현). 라이브 — 실데이터(하니스 7/8·95/100·8스테이지, 품질 2/7) 렌더·360 모바일 독 6버튼·패널 뷰포트 내(가로스크롤 0)·콘솔 0. 회차/곡선 리치판은 별도(미정). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2b-metrics-dock*`. 캡처 `docs/handoff/screenshots/floating-phase2b/`.
- **남은 단계 — 2c ✅ · 2d · 2f** — **2c 데이터(캐논/바이블) floating화 완료**(`FloatingDataWorkspace` 신설, 정제 보드 + 독, 브랜치 `feat/floating-phase2c-data`). 2e(옛 3컬럼 제거 + classic 제거)는 직전 완료. 잔여 — 2d 출간 floating화 · 2f topbar dead code 정리. (선택) 회차/곡선 리치판(ChapterStructureTree/TensionShareChart) 이식.

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
| 6 | 1.0 기준 시장증명 재정의 + 경량 검증 | medium | todo |
| 7 | 편집기 상단바 압축 + academic 1.0 범위 결정 | medium | todo |
| (B) | 로컬 작가진 Codex 연결 (M12) | small | ✅ done |

**rank3·rank4 로 해결** — 품질 게이트가 본문을 실제로 읽고(차별점 실재화), continuity 가 부정어 없는 충돌(생사·숫자)도 잡으며 3계층(hard/living/soft)이 실제로 작동한다. 남은 작업은 rank5~7 (StoryXDesk 분리·시장검증·UI 정돈).

## 병행 트랙 — 10인 매체별 브레드스 (`done` · 2026-06-08 · 5매체 전수)
사용자 "10인 완주" 선택. #2(소설 로판) 완권 깊이 검증 후, 매체별 브레드스로 전환.
- **#3 헌터 회귀물 (소설·다수 캐릭터) — 1화 (2026-06-08)** — 로그 `docs/reviews/2026-06-07-persona-live-test/03-hunter-multichar.md`. **★ P5/P6 수정 다캐릭터 스케일 실증 — 1화에 4인(한지욱·서가을·마도협·백도현) 클린 승격.** 차별점 새 작품/다캐릭터에서도 일관(세계키퍼 비용·캐릭터 4인 동기·연속성 미회수장치). 하니스 7/8·95 첫 화부터. **발견 — 온보딩 첫 회차 build codex transient 폴백("Reading additional input from stdin" 프로즈 누수) → CLI 격리로 transient 확인·재생성 정상. 개선 후보(폴백 raw에러 가드+재시도).** #2는 `backups/02-work-backup-ch23.json` 백업.
- **매체별 경량 스모크 — 만화·에세이·오디오·학술 4종 완료 (2026-06-08)** — 로그 `04-media-breadth-smoke.md`. 각 1단위 codex 실생성, 매체 적합 문체 확인(만화 시각감정·에세이 성찰·학술 초록+가설·오디오 분위기). 인물 추출 전 매체 작동. **★ 매체 특화 = 게이트엔 배선(소설8·학술11·오디오7)·라이브 검토엔 미배선(고정 5인).** **★ 크래시 버그 발견·수정 `3eae1da`** — 매체/포맷 불일치 시 buildCreativeBlueprint throw → 앱 화이트스크린 → 폴백으로 수정(TDD). **5매체(소설 깊이+다캐릭터 + 4매체 스모크) 전수 커버 = 10인 브레드스 완주.**
- **권고(브레드스)** — 매체 특화 작가진 라이브 검토 배선 · 폴백 raw에러 가드(codex transient).

## 다음 한 단계

**floating Phase 2c + 코드성 개선(P1·매체검토·2f·polish) 완료 + main 머지(ff-only).** 다음 갈래.
- **(2d) 출간 모드 floating화** — PublishingStudio → FloatingDataWorkspace 패턴으로.
- **(매체검토 라이브)** — comics 작품에서 specialist 7인 검토 실사용 확인.
- **(push)** — origin/main 으로 (사용자 요청 시).

## 최근 검증 (2026-06-10 · 작가 결정 갈림길 + 생성 측 회수 의무 · 브랜치 `feat/author-decision-forks`)

```
init.sh            → tsc · vitest(380 tests) · build 전체 통과
작가 결정 갈림길 트랙 (b75b53f~5e1f1e3, 8커밋):
  episodeBriefing  — buildEpisodeForks(결정론 갈림길)·composeIntentWithFork (ec840af, 128497c)
  생성 회수 의무    — buildDraftPrompt stallRules (dcb3632) + 배선/미러 (caecedf) + vite 브리지 (0f243b2)
  fc-forks UI      — FloatingEditor 갈림길 카드→의도 메모 append (608db57, 5e1f1e3)
  라이브 — 정체 갈림길 2질문·클릭 합성·중복 무시·CLI dry-run 4케이스·콘솔 0
  캡처 — docs/handoff/screenshots/author-decision-forks/
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
| M11 rank 2~7 | todo | 위 검토 로드맵 |
| M6.3-storyx-cli | todo | init / serve / memory sync 3 명령 |
| M6-persistence-memory-sync | in_progress | M6.3 남음 |
| M7-alpha-1.0 | todo | 검토 결과 시장증명 게이트 추가 필요(rank 6) |

## Master Plan

`~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마일스톤 로드맵.
