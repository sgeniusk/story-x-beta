# Session Handoff

다음 세션이 즉시 이어 시작할 수 있도록 한 세션 끝에 이 파일을 갱신한다. 가장 최근 인계가 맨 위.

---

## 2026-05-21 20:41 — M4.A 캐논 기반 정리 (선행) 완료

> Last Updated: 2026-05-21 20:41 KST

### Current Objective
M4 스토리 하네스 구현의 청크 A (캐논 기반 정리) 완료 — CanonFact.owner 타입 통일 + produceNextChapter 시드 모티프 제거. 다음 자연스러운 작업 — M4 청크 B (storyOntology + storyHarness Layer 0 신설).

### Recommended Next Step
1. M4 청크 B 시작 — `src/lib/storyOntology.ts` + `storyHarness.ts` 신설 (TDD)
2. 청크 B 의 6단계 스테이지 (진단·전제·온톨로지·압력·문체·매체) 와 점수 시스템

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 166 tests · `npm run build` 성공
- 신규 테스트 2개 (Gap 5 owner 통일, Gap 7 빈 프로젝트 가드)
- 수정 — `src/lib/storyEngine.ts` 3곳, `src/lib/storyEngine.test.ts` 2 it 추가

### What the Last Session Did
1. **TDD — 테스트 우선 추가** (storyEngine.test.ts)
   - "chapterFromDraftPayload 가 매체별 owner(voice/visual/audio) 를 plot 으로 다운캐스트하지 않는다" (Gap 5)
   - "produceNextChapter 가 빈 프로젝트(인물 0명)에서도 throw 없이 chapter 를 만들고 시드 모티프를 새지 않는다" (Gap 7)
2. **storyEngine.ts CanonFact.owner 6개 통일** — `'character'|'world'|'plot'|'voice'|'visual'|'audio'`. aiCliHarness·memoryBank 와 일관.
3. **normalizeCanonOwner 6개 확장** — 6개 모두 통과시키고 모르는 값만 plot 폴백.
4. **produceNextChapter 시드 모티프 제거**
   - 작품 묶임 텍스트(달의 탑·오빠의 표식·이안) 모두 제거
   - `project.characters[0]?.name ?? '주인공'`, `[1]?.name ?? '동료'` 가드
   - intent/pressure trim + 빈 값 generic 대체 ("오래 미뤄 둔 결정에 직면하는 것" 등)
   - hook·outline·prose·beats 모두 작가 입력 + 장르 메타로만 산출

### Files To Touch (next milestone — M4 청크 B)
- 신설 `src/lib/storyOntology.ts` + `.test.ts` — 엔티티·관계·검증자
- 신설 `src/lib/storyHarness.ts` + `.test.ts` — 6단계 스테이지·점수

### Files NOT To Touch
- M3.6 / M4.5 / M5 / M6 완성본 (이전 세션들)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
없음. M5 인증 블로커는 별개로 사용자 액션 영역.

### Known Issues
- 청크 A 의 produceNextChapter 가 deterministic fallback 으로 충분히 generic 화됐지만, 캐릭터·intent 가 모두 빈 경우 텍스트가 다소 평이함. LLM 응답이 정상 흐를 때는 사용되지 않는 경로라 1차 컷에서는 OK.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 A~H 정의

---

## 2026-05-21 15:30 — M6.2.1 evolution history UI (AiStatusBadge popover) 완료

> Last Updated: 2026-05-21 15:30 KST

### Current Objective
사용자가 헤더의 작은 AI 상태 뱃지를 클릭하면 popover 가 열리고, 작품 전체 AI 활동 이력을 시간순으로 본다. M6.2 의 인프라가 처음으로 가시화됨. 다음 자연스러운 작업 — M6.3 storyx CLI 또는 M4 스토리 하네스 (Layer 0~7) 또는 evolution 이벤트 종류 확장(검토 결과·메모리 결정 자동 누적).

### Recommended Next Step
1. dev 서버에서 자유서술 → 인터뷰 클릭 → 뱃지가 라임 "AI 활성" 또는 노란 "AI 폴백" 으로 변함 → 클릭 → popover 에 이벤트 노출 확인
2. evolutionMemory 가 글로벌 한 키 — projectId 별 분리 또는 storyx CLI 작업 우선순위 결정
3. M4 또는 M6.3 으로 진입

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 529kb js · 175kb css (1.03s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/components/AiStatusBadge.tsx` (재작성)
- 하네스 — `feature_list.json` M6.2.1 신설 + active

### What the Last Session Did
1. **`AiStatusBadge.tsx` 재작성**
   - `span` → `button` (클릭 가능), `cursor: pointer`
   - `isOpen` state + 바깥 클릭 / Escape 닫기 hook
   - `loadEvolutionHistory()` 으로 최근 이벤트 가져오기 (status 변경 시 자동 갱신)
   - popover — 헤더(제목 + 카운터 + 비우기 + 닫기) + 이벤트 리스트
2. **이벤트 표시**
   - 색 분기 — 성공(라임) / 주의(앰버, review-revise·memory-revised·held) / 실패(빨강, review-blocked·memory-rejected·summary 에 "실패" 포함)
   - 메타 — 상대 시간(초/분/시간/일) · source(mode label) · detail
   - 빈 상태 안내 — "아직 누적된 AI 활동이 없습니다…"
3. **비우기 버튼** — confirm 후 `clearEvolutionHistory()` + popover 닫기
4. **닫기 X 버튼** — popover 만 닫기 (state 보존)
5. **lucide 아이콘** — Activity (헤더) · Trash2 (비우기) · X (닫기)

### Files To Touch (next milestone)
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync
- **M4 스토리 하네스 Layer 0~7** — `docs/storyx-harness-architecture.md` 청크 A~H TDD
- **(보강) evolution 이벤트 자동 누적 확장** — 메모리 큐 결정·검토 결과 등도 자동 append (현재는 llm-call 만)

### Files NOT To Touch
- `src/lib/evolutionMemory.ts` (M6.2 정본)
- `src/lib/aiStatus.ts` (M6.2 정본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401

### Known Issues
- evolutionHistory 가 글로벌 한 키 — 여러 작품 간 이력이 섞임. projectId 별 분리 검토.
- llm-call kind 만 자동 누적 — review-pass/revise/blocked 등 다른 kind 는 호출 측에서 명시적 append 가 필요. 현재는 reviewClient 가 reportAiCall 만 호출하므로 모든 검토가 llm-call 로 기록됨.
- popover 가 width 340px 고정 — 모바일 미고려.

### Reference Documents
- `docs/vercel-env-setup.md`
- `~/.claude/plans/x-zippy-graham.md`

---

## 2026-05-21 15:22 — M6.2 evolutionMemory 누적 저장 완료

> Last Updated: 2026-05-21 15:22 KST

### Current Objective
모든 LLM 호출이 시간순 evolution history 에 자동 누적되고, export/import 페이로드에 포함되어 백업·이동 가능. 다음 자연스러운 작업 — M6.3 storyx CLI 확장 또는 M4 스토리 하네스 구현 (Layer 0~7) 또는 evolution history UI 노출.

### Recommended Next Step
1. dev 서버에서 LLM 호출 발생 → localStorage 의 `serial-story-studio/evolution-history` 누적 확인
2. M6.1 내보내기 → JSON 파일에 `evolutionHistory.events` 포함 확인
3. 그 뒤 M6.3 (CLI) 또는 evolution-history UI 패널 신설 (M6.2.1) 또는 M4 시작

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 524kb js · 175kb css (1.22s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 신설 — `src/lib/evolutionMemory.ts`
- 수정 — `src/lib/aiStatus.ts` · `src/lib/storage.ts` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/evolutionMemory.ts` 신설**
   - `EvolutionEventKind` — llm-call / review-pass·revise·blocked / memory-approved·revised·rejected·held / draft-generated / release-locked
   - `EvolutionEvent` — { id, at, kind, source?, summary, detail? }
   - `EvolutionHistory` — schema='storyx/evolution-history/v1' + events[]
   - `loadEvolutionHistory` · `saveEvolutionHistory` · `clearEvolutionHistory`
   - `appendEvolutionEvent` — id·at 자동 생성, MAX 500 trim
   - `replaceEvolutionHistory` — import 페이로드 검증 + 통째 덮어쓰기
2. **`src/lib/aiStatus.ts` 훅 추가**
   - `reportAiCall` 에서 `appendEvolutionEvent({ kind: 'llm-call', source: mode, summary, detail: reason })` 자동 호출
   - SSR · quota 실패 시 silent (UI 신호는 그대로 흐름)
3. **`src/lib/storage.ts` export/import 페이로드 확장**
   - `StoryXExportPayload` 에 `evolutionHistory?: EvolutionHistory` 추가
   - `exportAllData` 에서 `loadEvolutionHistory()` 포함
   - `importAllData` 에서 `replaceEvolutionHistory(payload.evolutionHistory)` 호출, message 에 "진화 메모리 N개 포함" 표시

### Files To Touch (next milestone)
- **M6.2.1 (선택) UI 노출** — 스튜디오 ⚙ 설정 또는 별도 패널에 최근 N개 이벤트 표시. 작가가 자기 작품의 학습 흐름을 본다.
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync. 파일 영속 (vault 모드).
- **M4 스토리 하네스 (Layer 0~7)** — `docs/storyx-harness-architecture.md` 청크 A~H TDD.

### Files NOT To Touch
- `src/lib/agentReviewProcess.ts` 의 `evolutionMemory: string[]` 필드 (정적 카테고리 안내문 — 별개)
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자 액션 필요

### Known Issues
- evolution history 가 작품마다 분리 없이 글로벌 한 키 — 여러 작품 사이 누적이 섞임. M6.3 (또는 storage 확장)에서 projectId 별 분리 고려.
- UI 노출 없음 — 백업/복원에는 즉시 가치, 작가가 history 를 보는 흐름은 다음 단계.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵

---

## 2026-05-21 15:18 — M6.1 프로젝트 export/import (JSON 파일) 완료

> Last Updated: 2026-05-21 15:18 KST

### Current Objective
M6 영속성·메모리 싱크의 첫 컷 완료 — 사용자가 작품 전체(project + snapshots + preferences)를 한 JSON 으로 백업/복원할 수 있다. 다음 자연스러운 작업 — M6.2 evolutionMemory 누적 또는 M6.3 storyx CLI 확장.

### Recommended Next Step
1. dev 서버에서 스튜디오 → ⚙ 설정 → 프로젝트 데이터 → 내보내기 동작 확인
2. 내보낸 JSON 을 다른 브라우저/계정에서 가져오기 시연
3. 그 뒤 M6.2 (evolutionMemory) 또는 M4 (스토리 하네스 Layer 0~7) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 523kb js · 174kb css (847ms) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/lib/storage.ts` · `src/StoryXDesk.tsx` · `src/styles.css` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/storage.ts` 확장**
   - `StoryXExportPayload` 타입 (schema='storyx/export/v1', exportedAt, project, snapshots, preferences)
   - `exportAllData()` — 5 localStorage 키(project · snapshots · landingTheme · studio.accent · studio.canvas) 한 묶음
   - `importAllData(input)` — 문자열/객체 둘 다 받고 검증 후 덮어쓰기. ImportOutcome { ok, message } 반환
   - `normalizeTheme` · `isRecord` · `readPreference` · `writePreference` 헬퍼
2. **`src/StoryXDesk.tsx` 핸들러**
   - `fileInputRef` + `handleExportProject` (Blob 다운로드) + `handleImportClick` + `handleImportFile` (confirm → 덮어쓰기 → reload)
   - lucide import 에 `Download`, `Upload` 추가
3. **설정 패널 확장**
   - 트윅·캔버스 두 그룹 다음에 "프로젝트 데이터" 그룹 추가
   - 내보내기/가져오기 두 버튼 + 숨김 file input
   - hint 텍스트 갱신 — "가져오기는 현재 작품을 덮어쓰니 먼저 내보내기를 권장합니다."
4. **`src/styles.css`** — `.sx-studio-data-action` 클래스 (기존 chip 톤과 일관)
5. **TypeScript 두 곳 수정** — `landingTheme` 좁히기 + `payload.project as unknown as SeriesProject` 우회

### Files To Touch (next milestone)
- **M6.2 선택 시** — `src/lib/memoryBank.ts` 에 `evolutionMemory.history` 추가, `exportAllData` 페이로드에 포함
- **M6.3 선택 시** — `tools/storyx.mjs` 또는 신규 `tools/storyx-cli.mjs` 에 init/serve/memory sync 명령
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백. `docs/vercel-env-setup.md` 참고.
- (로컬 LLM) `claude` CLI 401. 사용자 액션 필요.

### Known Issues
- 가져오기가 성공하면 즉시 `window.location.reload()` — 작업 중인 미저장 변경이 있으면 손실. M6.2 에서 dirty state 체크 추가 고려.
- import 페이로드 검증이 schema 와 project 객체 여부만 — 깊은 필드 검증 없음. normalizeProject 가 누락 필드를 채우지만 악의적 입력엔 약함.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:58 — M5 Vercel Functions 5 라우트 완료

> Last Updated: 2026-05-21 15:58 KST

### Current Objective
5 라우트(`/api/draft`·`/api/review`·`/api/review-agent`·`/api/review-data`·`/api/interview`) 가 production 배포본에서 직접 LLM 호출. dev 환경에서는 기존 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출 (병행 유지).

### Recommended Next Step
1. 사용자가 Vercel Project Settings 에 `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 설정
2. `vercel deploy` 또는 git push 로 새 배포
3. `curl POST .vercel.app/api/interview` 로 한 줄 검증 — `"provider": "ai-gateway"` / `"anthropic"` 응답 확인
4. 다음 자연스러운 작업 — M6 영속성·메모리 싱크 또는 M4 스토리 하네스 구현(Layer 0~7)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (963ms)
- 새 파일 — `api/*.ts` 5개, `src/lib/server/{promptBuilders,llmRunner}.ts`, `docs/vercel-env-setup.md`
- 수정 — `vercel.json` functions config, `feature_list.json` M5 done

### What the Last Session Did
1. **AI SDK 의존성 설치** — `ai` + `@ai-sdk/anthropic` + `@vercel/node`
2. **공유 모듈 신설**
   - `src/lib/server/promptBuilders.ts` — buildInterviewPrompt + buildDraftPrompt + buildReviewPrompt + buildAgentReviewPrompt + buildDataReviewPrompt + loadAgentPersona + parseLlmJson
   - `src/lib/server/llmRunner.ts` — runLlmJson 헬퍼 (AI Gateway 우선, Anthropic 직결 fallback, 키 없으면 mock)
3. **5 Vercel Functions 신설**
   - `api/interview.ts` · `api/draft.ts` · `api/review.ts` · `api/review-agent.ts` · `api/review-data.ts`
   - 모두 같은 패턴 — body 파싱 → prompt 빌드 → runLlmJson → 클라이언트 응답 형태로 정규화
4. **`vercel.json` 갱신** — `functions.api/review-agent.ts.includeFiles: ".claude/agents/**"` 로 페르소나 .md 를 serverless 번들에 포함
5. **`docs/vercel-env-setup.md` 신설** — env 변수 두 가지(`AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY`), 로컬 vs 배포본 동작 차이, curl 검증 예시

### Files To Touch (next milestone)
- **M6 선택 시** — `src/lib/storage.ts` 확장으로 파일/클라우드 영속, `storyx` CLI 확장
- **M4 (Layer 0~7) 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `tools/storyx.mjs` (로컬 CLI 호환 — 같은 로직이 promptBuilders.ts 에 복제됐지만 양쪽 유지)
- `vite.config.ts` storyxBridge (dev 전용)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 가 Vercel Project Settings 에 없으면 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자가 `claude login` 또는 ANTHROPIC_API_KEY 설정 필요

### Known Issues
- promptBuilders.ts 와 storyx.mjs 가 같은 로직 두 곳에 — 변경 시 양쪽 함께 수정 필요. 추후 storyx.mjs 를 .ts 마이그레이션 또는 promptBuilders 를 child_process 에서 import 하는 방식 고려.
- `LanguageModel` 타입에 `'anthropic/...'` 문자열 직접 캐스팅. AI SDK v6 가 provider/model string 을 정식 지원하지만 타입 시그니처는 LanguageModel 인스턴스를 요구해서 `as unknown as LanguageModel` 우회.
- 빌드 chunk 519kb (gzip 160kb) — 500kb 경고. M6 또는 별도 작업에서 manualChunks 또는 dynamic import 로 분할 고려.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 + 배포 검증 안내
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:48 — M3.6.1 퍼블리시 화면 실데이터 + 4 카드 CTA LLM 호출 + agentFileMap 확장 완료

> Last Updated: 2026-05-21 15:48 KST

### Current Objective
퍼블리시 stage 가 정적 4 카드에서 진짜 출간 도구로 진화. 다음 자연스러운 작업은 M5 Vercel Functions 또는 M4 스토리 하네스 구현(Layer 0~7).

### Recommended Next Step
1. 사용자가 `claude login` 으로 401 블로커 해제
2. dev 서버에서 스튜디오 → 출간 클릭 → PublishScreen 진입 → 4 카드 CTA 호출 → 결과 인라인 노출까지 end-to-end 검증
3. 검증 후 M5 (Vercel Functions) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (1.39s)
- 추적 — 14 modified + 3 new

### What the Last Session Did
1. **PublishScreen 실데이터 표시**
   - publishingPlan 의 모든 필드 노출 — title · releaseNotice · checklist · snapshotItems · changeLogReview · packageItems · platformProof · releaseLock
   - 출간 게이트 영역에 status 색(ready=라임, review=앰버) + 아이콘
2. **잠금 버튼 동작**
   - `releaseLock.canLock` 에 연동, 토글 동작
   - blocker 있으면 "N개 게이트가 아직 review 상태" 안내
3. **4 카드 CTA → requestAgentReview LLM 호출**
   - 4 상태 (idle / loading / success / failed) 인라인 렌더링
   - 성공 시 status chip + note + strengths + issues 표시
   - 실패 시 reason + "다시 호출" 버튼
   - buildAgentContext 헬퍼로 컨텍스트 추출 (작품의 핵심 결만)
4. **storyx.mjs agentFileMap 확장 — M4 신설 12명 모두 추가**
   - 스튜디오 6 + 랜딩 1 + 브릿지 1 + 출판 4
   - 출판 4명도 review-agent 흐름으로 호출 가능해짐
5. **매체별 deliverables 변동** — essay/novel/comics/audiobook 에 따라 카드 산출물 리스트 다름

### Files To Touch (next milestone)
- **M5 선택 시** — `vite.config.ts` 의 5 storyxBridge 를 Vercel Functions 로. `api/draft.ts` · `api/review-agent.ts` · `api/interview.ts` · `api/review-data.ts` · `api/review.ts` 신설. agentFileMap 의 .md 페르소나를 serverless 번들에 포함해야 함.
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H 순서로 TDD.

### Files NOT To Touch
- `src/lib/publishing.ts` PublishingPlan 타입 (그대로 사용)
- `src/lib/agentReviewProcess.ts` ValidationAgentId (craft 검토용으로 분리 유지)
- `.claude/agents/*.md` (페르소나 정본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- Vercel 배포본 — 5 storyxBridge 가 Vite plugin 이라 production 에선 mock 폴백. M5 에서 해결.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-22 15:18 — M3.6 퍼블리시 파트 신설 + AI 상태 표시기 + 인터뷰 폴백 신호 완료

> Last Updated: 2026-05-22 15:18 KST

### Current Objective
4파트 구조의 마지막 파트(퍼블리시) 1차 컷 완료. 다음 자연스러운 작업은 (a) M3.6.1 PublishScreen 실데이터 연동 또는 (b) M5 Vercel Functions 중 사용자 선택.

### Recommended Next Step
사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정으로 인증 해제 → dev 서버에서 4파트 흐름 끝까지 확인. 그 뒤 M3.6.1(실데이터) 또는 M5(Vercel) 우선순위 결정.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과 · `npm run build` 성공 (511kb js · 174kb css)
- 추적 — 11 modified + 3 new + 1 new (PublishScreen)

### What the Last Session Did
1. **M3.6 퍼블리시 파트 신설**
   - `src/components/PublishScreen.tsx` 신설 — 정적 4 카드 (book-designer · pr-specialist · platform-curator · business-strategist) + 분위기(다크 + 앰버 액센트)
   - `src/App.tsx` AppStage 에 `'publish'` 추가, URL stageParam 파싱, mediumDisplayLabel 매핑, 분기 라우팅
   - `src/StoryXDesk.tsx` onOpenPublish prop 추가, 출간 버튼이 prop 있으면 stage 전환 / 없으면 legacy 내부 모드 폴백
2. **글로벌 AI 상태 표시기 (이전 작업)**
   - `src/lib/aiStatus.ts` · `src/hooks/useAiStatus.ts` · `src/components/AiStatusBadge.tsx` 신설
   - 4 클라이언트(draft · review-agent · review-data · interview)가 wrap 패턴으로 reportAiCall
   - 헤더 두 곳(hx-nav · sx-topbar-actions)에 뱃지 노출
3. **인터뷰 폴백 신호 + 라인업 띠 (이전 작업)**
   - LLM 호출 실패 시 노란 띠 + claude login 안내
   - 성공 시 라임 라인업 띠 (한강風 · 박완서風 …)
   - 사전질문 자동선택 제거, 추천에는 점선 외곽선 + "추천" 뱃지

### Files To Touch (next milestone)
- (M3.6.1 선택 시) `src/components/PublishScreen.tsx` — props 확장으로 publishingPlan 전달
- (M3.6.1 선택 시) `src/App.tsx` — stage 'publish' 분기에 project + blueprint 전달
- (M5 선택 시) `vite.config.ts` 의 5 storyxBridge → Vercel Functions

### Files NOT To Touch
- `src/lib/publishing.ts` `PublishingPlan` 타입 (legacy 호환 유지)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 진행 가능.

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` export 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- PublishScreen 의 CTA 4개 + 최종 잠금 버튼은 placeholder. M3.6.1 에서 실 연동.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 20:21 — M4.5 매체 페르소나 풀 ↔ 로컬 LLM 인터뷰 플로우 연결 완료

> Last Updated: 2026-05-21 20:21 KST

### Current Objective
로컬에서 4개 매체 인터뷰가 페르소나 톤 가이드와 함께 LLM 호출까지 정상 동작. 사용자 인증(`claude login` 또는 `ANTHROPIC_API_KEY`) 확인 후 실호출 테스트 → 그 뒤 M3.6 퍼블리시 화면 또는 M5 Vercel Functions 선택.

### Recommended Next Step
1. 사용자가 `claude login` 또는 `export ANTHROPIC_API_KEY=...` 실행해 401 블로커 해제
2. dev 서버 (`npm run dev`) 띄우고 매체 = essay 로 자유 서술 입력 → 인터뷰 질문이 한강風·박완서風 등의 결로 생성되는지 확인
3. 라인업 확인되면 `requestLlmInterview` 결과의 `personaLineup` 을 UI 에 표시할지 결정 — "오늘 인터뷰: 한강風 · 박완서風 · 김연수風" 같은 띠

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과
- `node tools/storyx.mjs interview --provider mock --personas-json '[...]'` 스모크 OK

### What the Last Session Did
1. `src/lib/interviewClient.ts` 재작성 — 매체별 pick 함수 4개 import, `buildPersonaLineup(medium, freewrite)` 신설, POST body 에 `personaLineup` 추가, `LlmInterviewResult` 에 `personaLineup` 응답 필드 추가
2. `vite.config.ts` `/api/interview` 브리지 — `--personas-json` 인자로 `JSON.stringify(input.personaLineup)` 전달
3. `tools/storyx.mjs` interview 커맨드 — `--personas-json` 플래그 파싱, `buildInterviewPrompt({ medium, format, freewrite, personas })` 시그니처 확장
4. `buildInterviewPrompt` — `personas.length > 0` 일 때 "## 페르소나 톤 가이드" 섹션 주입 (label · tone · questionStarters · blockingSignals)
5. 30 files / 164 tests 통과 유지

### Files To Touch (next milestone)
- (선택) `src/StoryXDesk.tsx` 또는 인터뷰 화면 — `personaLineup` 표시 띠
- (선택) `vite.config.ts` 나머지 4개 브리지를 Vercel Functions 로 이관 (M5)
- (선택) 퍼블리시 화면 신설 (M3.6)

### Files NOT To Touch
- `src/lib/essayPersonas.ts` · `novelPersonas.ts` · `comicPersonas.ts` · `audiobookPersonas.ts` (정본)
- `src/lib/mediaPersonas.ts` (정본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 완료.

### Known Issues
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- EssayPersona 에 `category` 필드 없음 — interviewClient.ts 에서 `as unknown as MediaPersona[]` 캐스팅으로 우회. 향후 EssayPersona 에 `category: 'essay'` 추가하면 캐스트 제거 가능.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 19:43 — M4 (4단계 매트릭스 + 신설 12명 + 매체 풀 4개) 완료, M5 Vercel Functions로 인계

> Last Updated: 2026-05-21 19:43 KST

### Current Objective
M5 — 서버측 LLM Vercel Functions. 배포본 Vercel 에서 mock 폴백이 아닌 실제 LLM 응답.

### Recommended Next Step
`vite.config.ts` 의 5개 `storyxBridge` 미들웨어를 Vercel Functions(`/api/draft`, `/api/review-agent`, `/api/interview`, `/api/review-data`, `/api/data-review`)로 마이그레이션. 공유 요청/응답 스키마를 `src/lib/aiBridgeContract.ts` 같은 곳에 박고, 클라이언트 4개 모듈이 그 스키마를 임포트하도록.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `bash init.sh` 30 files / 164 tests · 빌드 성공
- M4 8 커밋 — effba1a · f5c2baf · 251518a · a3da8b7 · dc65884 · 739d1e0 · cfb65c6 · 8b82c26

### What the Last Session Did
1. 스튜디오 단계 신설 6명 — canon-librarian · timeline-keeper · bible-curator · critic-reviewer · essay-curator · memory-evolution-keeper
2. 랜딩 단계 신설 — studio-architect
3. 브릿지 단계 신설 — interview-curator
4. 출판 단계 신설 4명 — book-designer · pr-specialist · platform-curator · business-strategist (service ops 카테고리, ValidationAgentId 미등록)
5. 에세이 페르소나 풀 6명 (한강·박완서·김연수·김애란·신형철 + 가공) — docs + 런타임 + 테스트
6. 소설·만화·오디오북 페르소나 풀 각 6명 — 매체별 license-safety 정책 차등 (소설 5+1, 만화 3가공, 오디오북 전부 가공)
7. UI 통합 — StoryXDesk agentPersonas 에 8명 매핑 + 8개 pixel-agent CSS 클래스
8. AGENTS.md Stage × Media Matrix 전 셀 박힘

### 자산 현황
- 작가진 풀 — `.claude/agents/` 32 파일
- ValidationAgentId — 23개 (스토리 craft 15 + 신설 8: 6 스튜디오 + 1 랜딩 + 1 브릿지)
- 매체 페르소나 풀 — 4 매체 × 6명 = 24명
- 30 files / 164 tests

### Files To Touch (M5)
- `vite.config.ts` 의 `storyxBridge()` 5 미들웨어
- 신설 `/api/*.ts` Vercel Functions (Next.js App Router 또는 vanilla Vercel Function 형태)
- `src/lib/aiBridgeContract.ts` (신설 권장) — 공유 요청/응답 스키마
- `src/lib/draftClient.ts` · `reviewClient.ts` · `interviewClient.ts` · `dataReviewClient.ts` — 새 스키마 import

### Files NOT To Touch
- `src/StoryXDesk.tsx` agentPersonas (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
없음.

### Known Issues
- Vercel 환경변수 `ANTHROPIC_API_KEY` 필요 — M5 시작 시 사용자 확인
- AI Gateway 사용 가능 (`provider/model` 스트링 권장 — Vercel knowledge update)

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵 (M5 라인업)
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 13:30 — M3.5 스튜디오 설정 패널 완료, M3.7 리터럴 색 정리로 인계

> Last Updated: 2026-05-21 13:30 KST

### Current Objective
M3.7 — 에디터 안의 리터럴 색 박스 정리. 트윅 5색 × 캔버스 3톤 조합 어디서나 톤 일관.

### Recommended Next Step
라임 + 피치 블랙이 아닌 조합(예 — 바이올렛 + 인디고)을 띄워 가장 어색해지는 셀렉터부터. 우선 후보 — `sx-app-breadcrumb` 영역, `sx-save-chip`, "쇼러너가 잡은 이번" 카드 배경, 알파 셀프체크 바, prose textarea. 리터럴 hex를 `var(--sx-page)`·`var(--sx-paper)`·`var(--sx-card)` 등으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `npx tsc --noEmit` 통과 · `npm run build` 성공 · 28 files / 149 tests 통과
- 캡처 — `.playwright-mcp/studio-settings-default.jpeg` (라임+피치) · `studio-settings-aether-indigo.jpeg` (바이올렛+인디고)

### What the Last Session Did
1. 미사용 `src/assets/story-x-hero-forest-wind.png` 제거
2. 스튜디오 편집기 설정 패널 신설 (M3.5)
   - 토픽바 우측에 `Settings` 톱니 토글
   - 펼침 패널 — 트윅 chip 5색·캔버스 chip 3톤
   - state + `localStorage 'storyx.studio.accent'`·`'storyx.studio.canvas'`
   - `<main className="sx-desk">` 인라인 style 로 `--sx-brand`/`--sx-page` 등 오버라이드 → 라이브 적용
3. 관련 lucide·CSSProperties import 정리, 토큰 정의 모듈 레벨 상수로 분리

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 인라인 색이 있다면 토큰으로
- `src/styles.css` `.sx-desk` 하위 — 리터럴 hex·rgba를 토큰 호출로

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` 영역
- `:root --nx-*` 라이트 토큰
- `.sx-desk` 토큰 정의 (인라인 오버라이드 메커니즘 유지)
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지 README/index.html은 텍스트로 받기 전까지 보류
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 11:46 — M3 4파트 구조 완료, M3.5 스튜디오 설정으로 인계

> Last Updated: 2026-05-21 11:46 KST

### Current Objective
M3.5 — 스튜디오 편집기 설정 패널 (트윅 = 강조색, 캔버스 = 창 배경색)

### Recommended Next Step
스튜디오 헤더(또는 우측 패널)에 "편집기 설정" 진입점 추가 → 모달/드롭다운 안에 트윅 색 피커 + 캔버스 토널 선택 + localStorage 저장. 한 컴포넌트 끝내고 `bash init.sh` 통과 후 다음.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `bash init.sh` 28 files / 149 tests 통과 · 빌드 성공
- 4 화면 캡처 — `.playwright-mcp/landing-dark.jpeg` · `landing-light.jpeg` · `bridge-projects.jpeg` · `studio-editor.jpeg`

### What the Last Session Did
1. 디자인 패키지 fetch — 바이너리/외부 캐시라 classifier 차단. 사용자 결정으로 로고 외 요구만 반영
2. 흰 로고 변형 두 개 생성 — `story-x-symbol-light.svg`, `story-x-logo-lockup-light.svg`
3. `:root --nx-*` 라이트로 복원 → 브릿지(로그인·프로젝트·홈) 다시 흰 배경
4. 랜딩 낮↔밤 토글 — useState + localStorage + Sun/Moon nav 버튼 + `.landing-page.is-light` 오버라이드
5. 스튜디오 mockup은 라이트 모드에서도 항상 다크 유지 (`.landing-page.is-light .hero-showcase` 재고정)
6. `LandingBrand` `theme` prop → 다크 컨텍스트는 흰 SVG, 라이트는 검정 SVG. CSS invert 해킹 제거
7. `StoryXDesk` 로고 import를 흰 변형으로 교체

### 4파트 구조 정리 (확정)
- **랜딩** — 낮/밤 토글, Linear 분위기, 흰/검정 pill CTA
- **브릿지** — 로그인 → 프로젝트 → 인터뷰 → 로딩, 흰 배경, Notion-Linear 톤
- **스튜디오** — 편집·바이블·데이터, 항상 다크 + 흰 로고
- **퍼블리시** — 출간 버튼 누른 뒤 화면, 분위기 미정 (M3.6 신설 대기)

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 설정 모달/드롭다운 컴포넌트 + state
- `src/styles.css` `.sx-desk` — 설정 패널 스타일
- `src/lib/storage.ts` — 설정 영속화 (선택)

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` LINEAR 블록
- `:root --nx-*` 라이트 토큰
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지의 README/index.html은 아직 못 읽었음 — 필요해지면 사용자가 텍스트로 붙여 주기로 약속됨
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 00:34 — M2 완료, M3 디자인 폴리시로 인계

> Last Updated: 2026-05-21 00:34 KST

### Current Objective
M3 — 에디터·보조 화면 Linear 폴리시 (owner: design-handoff)

### Recommended Next Step
새 세션에서 design 의뢰 프롬프트로 시작, `src/StoryXDesk.tsx` 상단 토픽바부터 리터럴 색 박스를 토큰 기반으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시됨)
- Commit — `e7a971a` "M1+M2: 하네스 설계 문서 + Linear 다크 랜딩 재작성"
- Verification — `npm test` 28 files / 149 tests · `npm run build` 성공

### What the Last Session Did
1. `docs/storyx-harness-architecture.md` 통합 설계 문서 (M1)
2. 랜딩을 Linear "Midnight Command Center" 다크로 재작성 (M2)
3. `:root --nx-*` 와 `.sx-desk --sx-*` 토큰 값 Linear 등가로 cascade
4. 코딩 에이전트 하네스 산출물 신설

---

## Handoff Template

새 인계를 작성할 때 다음 템플릿을 맨 위에 복사한다.

```
## YYYY-MM-DD HH:MM — 한 줄 요약

> Last Updated: YYYY-MM-DD HH:MM KST

### Current Objective

### Recommended Next Step

### Branch · Commit · Verification

### What the Last Session Did
1.

### Files To Touch (this milestone)
-

### Files NOT To Touch
-

### Blockers

### Known Issues
-

### Reference Documents
-
```
