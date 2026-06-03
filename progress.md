# Story X — Progress

> Last Updated: 2026-06-04 · Branch: `main` (rank5 Tier1~2B 체크포인트 커밋)
> 코드 하네스 상태는 이 파일, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

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
- 검증 — 매 티어 tsc 0 · 293 tests(올바른 이유로) · build · 편집기·캐논 뷰 렌더·콘솔 0. 남은 작업 — Tier2 잔여 ~11개(Dialogs·Publishing·Status 클러스터) + Tier3 훅(최고위험, code-reviewer 2차).

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
| 5 | StoryXDesk.tsx 훅·컴포넌트 분리 (6,097→3,772, Tier1·2A~2D done) | large | 🔄 진행 중 |
| 6 | 1.0 기준 시장증명 재정의 + 경량 검증 | medium | todo |
| 7 | 편집기 상단바 압축 + academic 1.0 범위 결정 | medium | todo |
| (B) | 로컬 작가진 Codex 연결 (M12) | small | ✅ done |

**rank3·rank4 로 해결** — 품질 게이트가 본문을 실제로 읽고(차별점 실재화), continuity 가 부정어 없는 충돌(생사·숫자)도 잡으며 3계층(hard/living/soft)이 실제로 작동한다. 남은 작업은 rank5~7 (StoryXDesk 분리·시장검증·UI 정돈).

## 다음 한 단계

rank5 Tier 2 Pass C — `StoryXDesk.tsx` 잔여 서브컴포넌트(Dialogs·Agent·Publishing·Memory/Bible·Status 클러스터 ~20개) 추출 계속. 이후 Tier 3 훅 분리(useProject·useDraftEditor·useReviewSession·useUIState — 최고위험, code-reviewer 2차 필수). 방식은 Codex 위임 + Claude 검증, 패스마다 tsc·293·build·시각 픽셀 비교다. **Codex 패킷 필수 조항 — 우회 주석 금지·상태 문서 수정 금지·이동 심볼 단언은 정의 파일로 재배치.**

## 최근 검증 (2026-06-04)

```
npx tsc --noEmit   → exit 0
npm test           → Test Files 42 passed (42) · Tests 293 passed (293) · Failures 0
bash init.sh       → tsc · vitest · build 전체 통과
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
