# Story X 멀티에이전트 검토 리포트

> 2026-06-01 · 로컬 구동 점검 후 7에이전트 병렬 검토 · HEAD `1c652fa` (사회과학 A1~A5 완결)
> 방법 — 6관점 독립 검토(onboarding · editor-ux · code-quality · story-harness · business · harness-hygiene) → 총괄 종합(studio-architect). 7 agents · 884k tokens · 165 tool calls · 30분.
> 로컬 구동 — dev `http://127.0.0.1:5173` HTTP 200 · 콘솔 에러 0 · tsc 0 · 42 files / 269 tests.
> 화면 캡처 — `docs/reviews/screenshots/` (01 랜딩 · 02 편집기 · 03 퍼블리시 · 04 브릿지 매체선택).

## 총괄 진단

Story X 는 엔진은 1.0 에 근접했지만 신뢰·활성화·시장 증명은 0.5 에 머문 상태다. 검증은 통과한다(tsc 0, 42 files / 269 tests, dev 200). 그러나 세 가지 단층이 동시에 드러난다.

1. **주장과 실제의 괴리 — 가장 치명적.** 품질 게이트 12개 중 본문을 실제로 읽는 건 hook 2개뿐이고, 나머지는 `StoryXDesk.tsx:1352-1362` 의 하드코딩 리터럴(voiceMatchScore=75 등)을 평가한다. storyHarness 는 매체 문자열만 채워도 가산점으로 "production-ready" 가 된다. continuity 핵심 휴리스틱은 부정 마커 비대칭에만 의존해 "사망 vs 생존" 같은 부정어 없는 충돌을 놓친다. 제품의 유일한 차별점 "연속성을 제품 요건으로" 가 데모에선 작동하는 듯 보이나 실제 판정력이 비어 있다.
2. **상태 문서가 git 진실보다 5세대 뒤처짐.** feature_list active=M6.3(todo)인데 HEAD 는 A5 완결, academic 5개 마일스톤이 feature_list 에 0건이었다. (→ 이번 세션 rank1 에서 해소.)
3. **시장 증명 전무.** 1.0 완료 기준이 "1인(제작자) 만족 + 30화 기술 회귀" 라 외부 작가 검증·과금 가설이 없다.

1.0 까지의 핵심은 신기능이 아니라 "주장과 실제의 일치" — 게이트가 본문을 실제로 읽게 만들고, 상태 문서를 진실에 맞추고, 외부 작가 3~5명이 한 작품을 끝까지 완성하는지로 1.0 을 재정의하는 것이다.

## 우선순위 로드맵

| rank | 작업 | 규모 | 핵심 이유 |
|---|---|---|---|
| 1 | **상태 문서 진실 동기화** (feature_list A1~A5 등재+active, progress/handoff, init.sh+CLAUDE.md DoD 수치 제거) | small | 방치 시 다음 세션이 끝난 5개 마일스톤 재작업. 모든 후속의 전제. **이번 세션 완료.** |
| 2 | **빌딩 단계 폴백 초안 + 실패 배너** — LLM 실패 시 freewrite+답변에서 결정론적 한 장면을 항상 채우고 reportAiCall 로 배너 | medium | 활성화 최대 누수. mock/offline/401 이 흔한데 1~3분 애니메이션 후 빈 페이지가 열림 |
| 3 | **품질 게이트 실제 본문 배선 + storyHarness ready conjunctive 화** | medium | 제품 차별점 실재화 — 게이트가 하드코딩이 아니라 본문을 읽어야 함 |
| 4 | **continuity 충돌 감지 보강 + living/soft 3계층 통합** — 반의어·생사·숫자·인물ID, validateContinuity 가 3계층 실제로 채우기 | large | 연속성이 제품 요건인 이상 판정 정확도가 곧 가치 |
| 5 | **StoryXDesk.tsx(6,067줄/useState 40) 분리** — 커스텀 훅 4~5개 + 서브컴포넌트·agentPersonas 추출, 800줄 이하 | large | rank 2~4 가 모두 이 파일을 건드림. 비용 승수 |
| 6 | **1.0 기준 시장증명 재정의 + 경량 외부검증 + 과금 가설 1p** — M7 done_criteria 에 "외부 작가 3명 완성 + 2명 유료 지속 의향", 서버 인프라 전 BYO 키 핸즈온 | medium | build-first 함정 탈출 |
| 7 | **편집기 UX 정돈 + academic 범위 결정** — 상단바 7위젯 압축, 집중모드 폭, 좌레일 게이트 요약 / academic A1~A5 1.0 포함·제외 명시 | medium | 제품 완성도 마감 |

## Quick Wins (small effort · 높은 효과)

- **(완료) feature_list.json git 진실 동기화** — academic A1~A5 done 등재 + active 갱신. [harness-hygiene]
- **(완료) init.sh:22 + CLAUDE.md DoD 고정 테스트 수치 제거** — 절대 숫자 대신 "전체 통과". [harness-hygiene]
- **빌딩 LLM 실패 시 결정론적 폴백 초안 + 실패 배너** — `App.tsx:782`, `draftClient.ts:37-46`. [onboarding]
- **인터뷰 추천 답안 프리필** — recommendedOptionId 를 기본 선택값으로(Next 로 수락), 미답 시 n/6 표시. `App.tsx:1066,1091`. [onboarding]
- **우레일 "전체 검토 맡기기" 버튼 상시 노출** — 현재 items.length===0 일 때만 렌더(`MarginColumn.tsx:129-140`). 헤더에 고정. [editor-ux]
- **storyHarness readyForProduction 을 conjunctive(강제 게이트 전부 통과) 조건으로** — 현재 가산식 70점이면 ready(`storyHarness.ts:62-68`). [story-harness]

## Strategic Bets (큰 노력 · 제품 전환)

- **품질 게이트를 실제 본문 입력에 배선** — voiceMatchScore↔koreanVoiceGate, sceneSequelRatio↔단락분류, historicalDensity↔텍스트 스캔. academic 트랙의 text 실판정 패턴(`qualityGates.ts:300-353`)을 commercial/literary 로 이식. 측정 불가 지표는 "측정 안 됨" 표시. [story-harness]
- **continuity 충돌 감지를 반의어/생사 대립쌍 사전 + 숫자·연도 비교 + 인물 ID 일치로 보강**(중기 LLM 분류), living/soft 계층을 storyEngine 통합부에서 실제로 채워 죽은 코드 살리기. `continuityContract.ts:271-292`, `storyEngine.ts:878-880`. [story-harness]
- **StoryXDesk.tsx 분리** — useProject/useDraftEditor/useReviewSession/useUIState 훅 + 서브컴포넌트 개별 파일. 프롬프트 빌더 5개 이중화(`storyx.mjs` vs `promptBuilders.ts`) 해소 포함. [code-quality]
- **해자를 "연속성 기능" 이 아니라 결과 묶음으로 재정의** — 한국어 voice gate(영어권 도구가 못 하는 로컬 해자)와 다매체 동시 투영을 전면화. 게이트 점수가 아니라 "이 작품은 매체 3개로 늘려도 핵심 4요소 보존" 을 작가 언어로 제시. [business]

## Top Risks

1. **다음 세션이 끝난 academic A1~A5 를 재작업** — feature_list active=M6.3(todo)·academic 0건인데 HEAD 는 A5 완결. (→ rank1 해소.)
2. **차별점이 데모에서만 작동** — 품질 게이트가 하드코딩 리터럴을 먹고, storyHarness 는 매체 문자열만으로 ready, continuity 는 부정어 없는 충돌을 못 잡음. 외부 작가 실제 원고에서 무너지면 차별점이 거짓이 됨.
3. **신규 작가가 첫 세션에서 빈 에디터를 받고 이탈** — LLM 실패 시 약속한 첫 초안 대신 빈 페이지. 활성화 깔때기 최상단 누수.
4. **미검증 제품에 가장 비싼 인프라부터 건설** — 외부 작가 검증 없이 LLM 원가 드는 서버(E)를 베타(H)보다 먼저. 적자 런칭 위험.
5. **6,067줄 단일 파일이 모든 후속 작업의 세금** — useState 40개 집중, 거의 모든 개선이 이 파일을 훑어야 함.
6. **상태·버전 문서 상호 모순이 신뢰의 1차 관문을 깸** — 투자자·협업자에게 설명하는 순간 드러남. (→ rank1 일부 해소, launch-plan.md 버전 갱신 잔여.)

---

# 관점별 상세

## 1. 온보딩 (onboarding-architect)

해피 패스는 탄탄하나 활성화가 랜딩 CTA 발견성·빌딩 실패 시 빈 에디터·인터뷰 추천 미적용·빈 freewrite 무안내 폴백에서 샌다. 랜딩에서 즉시 체험할 데모 없음.

**최우선** — 빌딩 단계 빈 에디터 실패를 먼저 고쳐, 모든 신규 작가가 첫 챕터를 들고 나가게 한다. 지표 — 신규 방문자가 10분 내 비어있지 않은 에디터에 도달하는 비율.

| severity | effort | 항목 | 근거 |
|---|---|---|---|
| high | small | 랜딩 시작 CTA 가 풀폭 mockup + Alpha 라벨에 묻힘 — 본문 1차 CTA 부재 | `App.tsx:324, 344-347, 352-503, 570` |
| high | medium | 빌딩이 LLM 실패 시 빈 에디터로 떨어져 약속한 첫 초안 증발 (goToBuilding→onOpenEditor(undefined)) | `App.tsx:782, 1217-1224`, `draftClient.ts:37-46` |
| medium | small | 인터뷰 추천 답안 미자동적용 — 빈손 통과 가능, 초안에 신호 없음 | `App.tsx:1066, 1091, 753-763, 1208` |
| medium | small | 빈 freewrite 가 조용히 일반 질문으로 폴백, 작가진 라인업 사라짐 | `App.tsx:714, 935, 1030-1053` |
| medium | medium | 랜딩에서 즉시 데모 없음 + audiobook 매체(음성)와 포맷(전부 영상) 불일치 | `App.tsx:651-659, 188`, `projectBlueprint.ts:131-135, 191-210` |

## 2. 편집기 UX (editor-ux-director)

중앙 원고 편집기 타이포그래피는 잘 잡혀 있다(serif 1.06rem · 줄간 1.85 · keep-all · 680px). 진짜 위험은 상단바 우측의 과밀이다. **"대부분 버튼이 라임" 은 코드와 다르다** — 라임 채움 1차 버튼은 `.sx-primary-button` 하나뿐이고, 출간·승인대기·작가진·설정은 모두 중립 표면이다. 과포화 원인은 색이 아니라 위젯 7개의 동급 시각 무게다.

**최우선** — 상단바 우측을 1차 액션 1개(생성/검토) + overflow 그룹으로 압축. 채움 1 / outline 1 / 텍스트 다수의 3단 위계.

| severity | effort | 항목 | 근거 |
|---|---|---|---|
| high | medium | 상단바 우측 7위젯 동급 무게 경쟁 — 1차 액션 묻힘 | `StoryXDesk.tsx:2611-2805` |
| high | small | "전체 검토 맡기기" 가 빈 상태에서만 렌더 — 부분 검토 중 다음 행동 사라짐 | `MarginColumn.tsx:129-140` |
| medium | small | 집중 모드 그리드 1180px 인데 원고폭 680px 고정 — 좌우 빈 보이드 | `styles.css:2178-2181, 3078-3081, 3146-3147` |
| low | small | 제목 바로 아래 "원고" 중복 라벨이 글쓰기 첫 시선 분산 | `StoryXDesk.tsx:5918-5923` |
| medium | medium | 좁은 좌레일(200~260px)에 지표 카드 적층 — 게이트 한눈 스캔 어려움 | `DataPanel.tsx:18-114` |
| (유지) | — | 중앙 타이포·앵커·필터 디밍은 글쓰기 우선 원칙 잘 지킴 — 시각 회귀 기준선으로 보존 | `styles.css:3146-3163`, `StoryXDesk.tsx:5944-5959` |

## 3. 코드 품질 (code-reviewer)

타입 안전성은 양호(any 전무, tsc 통과). 구조 부채가 크다.

**최우선** — StoryXDesk.tsx 분리. 6,067줄/useState 40개 구조는 이후 모든 작업이 전체 파일을 훑게 만든다.

| severity | effort | 항목 | 근거 |
|---|---|---|---|
| high | large | StoryXDesk.tsx 6,067줄 · 메인 함수 2,156줄 · useState 40개 집중 | `StoryXDesk.tsx:1072-3228, 1081-1276` |
| high | medium | 프롬프트 빌더 5개 함수가 storyx.mjs ↔ promptBuilders.ts 이중화(drift 위험) | `promptBuilders.ts:1-3, 95-376`, `storyx.mjs:445-752` |
| medium | medium | continuityContract 휴리스틱 음성 오탐 + dead-code(shared≥3 빈 분기) + 경계 테스트 부재 | `continuityContract.ts:92-162, 251, 257, 271-291` |
| medium | small | qualityGates hook 판정이 고정 토큰 배열 포함 여부에만 의존 | `qualityGates.ts:356-370` |
| low | small | agentPersonas ~480줄 리터럴이 StoryXDesk 모듈 스코프 인라인 + agentFileMap 3중 복제 | `StoryXDesk.tsx:253-474`, `storyx.mjs:19-48`, `promptBuilders.ts:54-79` |

## 4. 스토리 하네스 (continuity-editor)

연속성 골격(3계층 계약·12 게이트·6단계 하네스)은 타입과 테스트엔 있으나 실파이프라인에서 세 군데 샌다 — 충돌 감지가 부정 마커에만 의존, living/soft 가 통합부에서 빈 배열(죽은 코드), 게이트가 본문 대신 하드코딩 상수를 먹음.

**최우선** — classifyCanonChange 를 반의어/생사 대립 + 인물 ID 로 보강하고, living/soft 계층을 storyEngine 통합부에서 실제로 채워 cause/cost 강제와 growthLedger 루프를 살린다.

| severity | effort | 항목 | 근거 |
|---|---|---|---|
| high | large | 캐논 충돌 감지가 부정 마커 비대칭에만 의존 — 사망/생존·실종/발견·숫자·영문 캐논 미검출 | `continuityContract.ts:271-292, 260-268` |
| high | medium | living/soft 계층과 growthLedger 가 실파이프라인에서 죽은 코드 (validateContinuity 가 hardCanon 만 채움) | `storyEngine.ts:878-901` |
| high | medium | 품질 게이트가 원고 대신 하드코딩 상수 평가(voiceMatchScore 75 등). academic 트랙만 text 실판정 | `StoryXDesk.tsx:1352-1362, 1349`, `qualityGates.ts:179,193,215,300-353` |
| medium | medium | hook/cliff 게이트가 토큰 포함 여부라 평범한 글 통과·강한 글 탈락 | `qualityGates.ts:356-371` |
| medium | small | storyHarness 100점이 가산식 — 매체 문자열만 채워도 20점 | `storyHarness.ts:62-68, 200-228` |
| medium | large | agentRunEngine 18명이 정적 agenda 출력, 판정은 continuity-editor 만 | `agentRunEngine.ts:118-126, 66-71` |

## 5. 비즈니스 (business-strategist)

기술 하네스는 동급 국산 도구 중 가장 정교하나, 비즈니스 정의가 "제품 완성" 에 머물고 "시장 검증" 으로 못 넘어갔다. 런칭 플랜 1단계 완료 기준이 사실상 1인(제작자) 만족이고 과금·외부 검증을 전부 2단계로 미룬다.

**최우선** — M7 완료 기준을 "30화 회귀 통과"(기술)에서 "유료 의향 외부 작가 N명이 한 작품 완성"(시장)으로 재정의하고, 서버 인프라 착수 전 외부 작가 3~5명 핸즈온 검증을 끼워라.

| severity | effort | 항목 | 근거 |
|---|---|---|---|
| high | medium | 1.0 완료 기준이 1인 사용 만족 + 기술 회귀 — 시장 신호 전무 | `storyx-launch-plan.md:37, 165`, feature_list M7 |
| high | medium | 과금 가설 부재 — "누가 얼마를 왜" 가 코드·문서에 없음 (반면 작가가 책 파는 가격은 이미 렌더) | `storyx-launch-plan.md:114-124, 180`, `serviceOperationsAgents.ts:79-85`, `PublishScreen.tsx:104-115` |
| high | large | "연속성" 해자가 Sudowrite/Novelcrafter 와 겹쳐 얇음 — 진짜 해자는 한국어 voice gate + 다매체 불변성 | `story-x-20-expert-retest-report.md:43-44, 55-56`, `koreanVoiceGate.ts`, `mediaProjection.ts` |
| medium | medium | 사회과학 학술 확장(A1~A5)이 연재 작가와 지불자가 다른 별도 제품 — 방향 분산 | `academicPublish.ts:51-54`, `App.tsx:32,173` |
| medium | small | 로드맵 순서 위험 — 시장 미검증인데 LLM 원가 서버 인프라부터 건설(build-first 함정) | `storyx-launch-plan.md:89-100, 165-167, 180` |
| low | small | 버전·상태 문서 stale 이 사업 의사결정 SSOT 흔듦 (launch-plan v0.8 기준인데 코드는 한참 앞) | `progress.md`, `feature_list.json`, `storyx-launch-plan.md:4` |

## 6. 하네스 위생 (harness-hygiene)

상태 아티팩트 3종 + init.sh 가 모두 git 진실(HEAD=1c652fa, A1~A5 완결, 42/269)보다 뒤처져 있었다. (대부분 이번 rank1 에서 해소.) 두 종류 하네스(코드 vs 스토리) 혼동 방어는 문서 곳곳에 잘 박혀 건강하다 — 유지.

| severity | effort | 항목 | 근거 | 상태 |
|---|---|---|---|---|
| high | medium | feature_list 에 academic A1~A5 통째 누락 + active 가 오래된 todo(M6.3) | `feature_list.json:4, 243-250` | ✅ rank1 |
| high | medium | progress.md M10(5/29) 동결 — Current Objective·완료표·검증 수치 stale | `progress.md:3, 7, 178-188, 202-204` | ✅ rank1 |
| medium | small | init.sh 완료 메시지 28/149 (실제 42/269) | `init.sh:22` | ✅ rank1 |
| medium | small | session-handoff 최신이 A2(5/30) — A3~A5 인계 누락 | `session-handoff.md:7, 18, 22` | ✅ rank1 |
| low | medium | done 항목 done_criteria 다수가 옛 테스트 수치 박제(28/149, 30/164, 36/220) | `feature_list.json:23, 59, 140, 158, 167, 185` | 잔여(rank 후속) |
| (유지) | — | 두 종류 하네스 혼동 방어는 CLAUDE.md·feature_list notes·State 표 3곳 교차강화 — 잘 됨 | CLAUDE.md, `feature_list.json:6` | 유지 |

---

## rank1 이후 잔여 (이 리포트 기준 미실행)

- launch-plan.md 버전 헤더(v0.8 기준) 갱신 또는 "스냅샷" 명시 — business low.
- done 항목들의 박제 테스트 수치 제거 — harness-hygiene low(effort medium).
- rank 2~7 코드 작업 — 사용자 우선순위 결정 대기.
