# Story X — Progress

> Last Updated: 2026-06-07 · Branch: `main` (**발견 P4 인물 캐논화 — TDD+라이브, 322 tests·미커밋** · P3·P2 `c4a9761`·`88acbf5` 커밋됨 · #2 4화까지 실증)
> 코드 하네스 상태는 이 파일, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

## 병행 트랙 — 품질 실증 테스트: 실사용 창작자 10인 (`in_progress` · 2026-06-07 착수)

페르소나 실증 테스트로 이야기 품질·연속성을 검증하고 새 제작 계획을 만든다. 설계 정본 `docs/superpowers/specs/2026-06-07-persona-live-test-design.md`, 실행 `docs/superpowers/plans/2026-06-07-persona-live-test-plan.md`.
- **방식** — 실사용 창작자 10인(소설6·만화1·에세이1·오디오1·학술1) 풀 라이브 직접조작(Playwright+codex). 장편 #1~3 완권(~20~25화) 연속, #3·#4 캐릭터 일관성 집중. 6축 평가. 멀티세션 S0~S15.
- **S0 파일럿 #1 (웹소설 장편 회귀) 완료** — 1화 생성+검토 풀라이브. 인터뷰 freewrite 받아씀·1화 품질 높음·**검토 5명 중 3명이 "미래지식 과잉확정" 수렴 포착(차별점 실증)**. 로그 `docs/reviews/2026-06-07-persona-live-test/`.
- **중대 발견 — 온톨로지 0 (구조적 배선 갭)** — (A) 온보딩→project 메타 미배선 (B) 회차 canonFacts↔온톨로지 미연결. **갭 B·A 모두 수정·라이브 확인(TDD)** — 갭B: `buildStoryOntology` canonFacts 반영(`ebe46b5`). 갭A: `deriveOnboardingSeed`+`createEmptyProject` 메타 시드(`59c8d3f`). **새 작품(백작가 빙의) 라이브 — logline·audiencePromise 시드, 하니스 2/8·22 → 7/8·93/100·온톨로지 0→12·온톨로지빌더 pass.** "온톨로지 0" 실증 해소.
- **#2 (백작가 빙의 로판) 2화 회차 연속성 첫 실증 (2026-06-07 이어서)** — produceEpisode 2화 생성 + 5명 검토 풀라이브. 캐논 정확 계승 · **온톨로지 12→17 · canonFacts 5→8 · memoryAnchors 4**(갭B 가 회차 누적에서 작동 실증) · L 단서→레나 위클리프 추적. 검토 5명 중 3명(연속성·세계·장르)이 의도 메모 오염을 독립 포착(차별점). **발견 — P1 쇼러너 빈응답(간헐 ~2/3) · P2 floating 회차생성 경로 마찰(잠금 UI 부재 + 잠금 후 state 미갱신→새로고침) · P3 의도메모 잔류 오염 · P4 캐논화 안 된 세부 드리프트(characters 0, 가족 이름 에드릭·노엘→레오니드).** 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md`.
- **발견 수정 (A) — P3·P2 완료 (TDD+라이브, 2026-06-07 이어서)** — P3(`defaultEpisodeIntent` 데모문구 '용사와 외계인'→'')·P2(`onConfirmChapterLock` 에 `setLatestChapter` 동기화). `editorFocusLayout.test.ts` +2(RED→GREEN), 314 tests. 라이브 — #2 3화 "동부 물류 검인권" 용사/외계인 오염 0 · 새로고침 없이 잠금→생성 · canonFacts 8→11. 캡처 `02/03-ch3-p2p3-fix-verified.png`.
- **발견 수정 (A) — P4 인물 캐논화 완료 (TDD+라이브)** — extractEntityName 개선(공백 이름·조사 확장·generic/조직 가드, export)·commitChapter 가 owner=character 캐논을 `characters` 로 승격. storyOntology.test +5·storyEngine.test +3, 322 tests. 라이브 — #2 4화 생성 시 characters [] → ["레나 위클리프"]·데이터 인물 1·canonFacts 11→15. 갭B 시드도 동반 개선.
- **다음** — P1(빈응답 간헐)·관계(relations) 추출 → #2 5화+ 드리프트 실효·완권 또는 #3 헌터물 → 종합 리포트 → 새 제작 계획.

## 병행 트랙 — 편집기 재설계: 방향 C "떠 있는 작업실" (실데이터 배선 완료)

2026-06-05. claude.ai design 에서 발산한 3방향 편집기 시안 중 **방향 C** 를 React 로 이식 착수. `design/floating-editor` 에서 작업 후 main 머지(체크포인트).
- **들어온 것** — `src/components/FloatingEditor.tsx`(739줄) 비주얼 Phase 1. 어두운 캔버스 + 종이 시트 + 좌측 플로팅 독 + 단락 옆 여백 주석 + 작가별 색 밑줄. 인터랙션 전부(드래그 호출 popover·5명 순차 검토·반영/보류·집중·모드탭·키보드). `?editor=floating` 진입, `.fc-*` 스코프 CSS — 기존 편집기·테스트·전역 토큰 무영향(그래서 게이트 녹색).
- **실데이터 배선 완료 (2026-06-05)** — `SAMPLE_*` 제거 → 순수 표현 컴포넌트. StoryXDesk 가 `?editor=floating` 일 때 실 `editorText·MarginReview·CORE_PERSONAS·beats·검토 콜백(onSummon/onRunAll/onAcceptDiff/onRejectReview)`을 props 주입(접근 A). `floatingEditor.test.ts`(react-dom+jsdom 렌더) 추가. 라이브 검증 — 실 페르소나 5명·전체검토 5건 도착·콘솔 0. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`.
- **Phase 2a 스왑 완료·머지 (2026-06-06, main `389a997` ff-merge + 정렬 `488b5e8`)** — floating 이 편집 기본(`isDraftMode && !isClassicEditor`, `?editor=classic` 한시 폴백). 본문 contentEditable 라이브 타이핑(IME compositionstart/end 가드 + bodyVersion-메모로 커서 클로버 차단) + 의도메모 쓰기-백 + 초안생성/편집·데이터/출간 네비 배선. emitBody 는 블록을 `\n\n`(splitIntoParagraphs 라운드트립)로 join. **사용자가 실제 한글 타이핑 정상 확인** → 머지. 추가 — 빈 마진 `display:none` 으로 종이 시트 가운데 정렬. 라이브 — 기본=floating·편집→글자수 0→24자·본문 단락 보존·시트 정중앙·콘솔 0·classic=옛 3컬럼. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2a-swap*`. 캡처 `docs/handoff/screenshots/floating-phase2a/`.
- **Phase 2b 완료·머지 (2026-06-06, main `8bc9d4a`)** — floating 독에 "지표" 버튼 1개 + `fc-p-metrics` 패널 4 접이식 섹션(하니스·품질게이트·매체투사+commercial↔literary 슬라이더·온톨로지), floating-네이티브 `.fc-*`. 이미 계산된 `studioMetrics`(+`updateStoryModeAxis`) 주입(순수 표현). 라이브 — 실데이터(하니스 7/8·95/100·8스테이지, 품질 2/7) 렌더·360 모바일 독 6버튼·패널 뷰포트 내(가로스크롤 0)·콘솔 0. 회차/곡선 리치판은 별도(미정). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2b-metrics-dock*`. 캡처 `docs/handoff/screenshots/floating-phase2b/`.
- **남은 단계 — 2c~2e** — 2c 데이터(캐논/바이블) floating 화 · 2d 출간 floating 화 · 2e 옛 3컬럼 제거 + `editorFocusLayout.test.ts` 새 구조 이관 + `?editor=classic` 제거. (선택) 회차/곡선 리치판(ChapterStructureTree/TensionShareChart) 이식. 계획 `docs/storyx-floating-editor-plan.md`.

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

## 다음 한 단계

두 갈래 중 택1. **(A) 플로팅 Phase 2 스왑** — floating 을 편집 모드 기본으로(StoryXDesk 3컬럼 제거 또는 토글) + `editorFocusLayout.test.ts` 새 구조로 갱신 + 라이브 타이핑(contentEditable)·의도 메모 쓰기-백. 위험 — 기존 편집기 테스트 다수 갱신, 시각 회귀. **(B) rank5 Tier2 Pass E** — `StoryXDesk.tsx` 잔여 ~11개(Dialogs·Publishing·Status) 추출 후 Tier3 훅 분리(useProject·useDraftEditor·useReviewSession·useUIState — 최고위험, code-reviewer 2차 필수). 방식은 Codex 위임 + Claude 검증. **Codex 패킷 필수 조항 — 우회 주석 금지·상태 문서 수정 금지·이동 심볼 단언은 정의 파일로 재배치.**

## 최근 검증 (2026-06-07 · 발견 P4 인물 캐논화 — TDD+라이브)

```
init.sh            → 43 files · 322 tests(+8: extractEntityName 5·commitChapter 3) · build · tsc 통과
P4 라이브          → #2 4화 생성 시 characters [] → ["레나 위클리프"] 승격·데이터 인물 1·canonFacts 11→15. 오염 0·콘솔 0
P3·P2 라이브(이전) → #2 3화 새로고침 없이 잠금→생성(P2)·용사외계인 오염 0(P3)
#2 2화 라이브(이전) → 회차연속성·온톨로지 12→17·검토 5명 중 3명 의도오염 포착·발견 P1~P4
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
