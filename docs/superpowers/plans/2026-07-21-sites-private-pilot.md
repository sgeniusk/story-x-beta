# SITES-0 소유자 전용 호환성 파일럿 구현 계획

> 설계: `docs/superpowers/specs/2026-07-21-sites-private-pilot-design.md`
> 단일 슬라이스: Story X의 기존 로컬 실행을 보존하면서 owner-only Sites UI 호스팅과 로컬 AI 경계를 증명한다.

## 작업 순서

### 1. 런타임 capability — 반드시 첫 RED

1. `src/lib/runtimeCapabilities.test.ts`를 먼저 추가한다.
   - dev 기본은 `local-codex`, production·Sites 기본은 `disabled`, 알 수 없는 값은 fail-closed한다.
   - disabled의 같은-origin `/api/**`는 실제 fetch를 호출하지 않고 503 구조화 오류를 반환한다.
   - local은 request/init을 그대로 fetch에 전달하고 정적·외부 URL은 차단하지 않는다.
2. 해당 테스트를 실행해 RED를 확인한다.
3. `src/lib/runtimeCapabilities.ts`를 구현하고 생성·검토 client 10개가 전역 fetch 대신 wrapper를 사용하게 한다.
4. 기존 client 집중 테스트로 local request body·URL 회귀가 없는지 확인한다.
5. 기존 Vercel build 명령에는 `VITE_STORYX_AI_RUNTIME=remote-api`를 명시해 Functions가 있는 배포만 core AI를 연다.

### 2. AI action mutation 차단 — TDD

1. 현재 action별 기존 테스트에 disabled RED를 먼저 추가한다.
   - `App`: running receipt polling/start/cancel 0회, 첫 초안 fallback·프로젝트 생성·stage 전환 0회.
   - `StoryXDesk`: draft/mock review/data review/PLAN fallback 0회.
   - `DiveDesk`: 사용자 turn·fallback bubble·recovery receipt mutation 0회.
   - `PublishScreen`: review 0회.
2. RED 뒤 각 action의 최상단 capability guard와 사용자 안내 state를 배선한다.
3. Onboard/PLAN 제출은 disabled일 때 입력을 비우지 않는다. 기존 성공 결과의 검토·반출·승인 기능은 막지 않는다.
4. running receipt는 disabled에서 polling/cancel·상태 변경 없이 그대로 보존한다.

### 3. Sites 안내면 — TDD

1. `src/components/hostedRuntimeBoundary.test.tsx`를 먼저 추가해 local 무변경과 disabled 안내 문구를 고정한다.
2. RED 뒤 `HostedRuntimeBoundary.tsx`를 구현하고 `src/main.tsx`에서 `SingleWriterGate` 바깥을 감싼다.
3. `src/styles.css`에 `--st-*` 기반 안내면과 320px 줄바꿈만 추가한다. 새 애니메이션은 만들지 않는다.

### 4. Worker·이중 Vite build — TDD

1. `src/sitesWorker.test.ts`를 먼저 추가한다.
   - `/api/**` 503·asset fetch 미호출.
   - 정상 asset pass-through.
   - HTML navigation 404만 `/index.html` fallback.
   - non-HTML 404 보존.
2. RED 뒤 `sites/worker.ts`, `vite.sites.client.config.ts`, `vite.sites.worker.config.ts`를 구현한다.
3. `package.json`에 `build:sites`를 추가하되 기존 `build`, `dev`, `preview`, `deploy`는 바꾸지 않는다.
4. `npm run build:sites`로 `dist/client/index.html`·`dist/server/index.js`를 확인하고 bundle의 Node builtin·비밀 문자열을 점검한다.

### 5. Sites project·archive·비공개 배포

1. `.openai/hosting.json` 부재와 slug 중복을 확인한다.
2. `story-x-private-pilot` Site를 한 번 만들고 반환 id를 `.openai/hosting.json`의 `project_id`에 즉시 기록한다.
3. 설정 포함 source를 커밋하고 동일 SHA를 Sites source branch에 credential 비영속 방식으로 push한다.
4. 그 commit에서 `npm run build:sites`를 다시 실행한다.
5. 공식 `scripts/package-site.sh`로 `/private/tmp/story-x-sites-private-pilot.tgz`를 만들고 allowlist를 검사한다.
6. commit SHA + archive로 version을 저장하고, owner-only access를 재확인한 뒤 private deployment를 실행한다.
7. 상태가 terminal이 아니면 같은 project/version/deployment id로 동기 polling해 `succeeded` URL을 회수한다.

### 6. 검증·인계

1. 집중 테스트 → `npm test` → `npm run build` → `npm run build:sites`를 통과시킨다.
2. 독립 보안/회귀 검토에서 API 전송·fallback mutation·작품 유출·Worker routing·로컬 회귀를 점검하고 차단 항목을 해결한다.
3. `NODE_DISABLE_COMPILE_CACHE=1 bash init.sh` 최종 녹색을 확인한다. Node 25 compile-cache 정지는 코드 실패와 분리해 증거에 기록한다.
4. `progress.md`와 `session-handoff.md`를 갱신하고 milestone id가 포함된 handoff 커밋을 만든다.
5. GitHub origin에 push하고 `codex/p2-condense-target-length` base의 Draft PR을 만든다. merge하지 않는다.

## 허용 파일

- `src/lib/runtimeCapabilities.ts`, `src/lib/runtimeCapabilities.test.ts`
- `src/lib/diveClient.ts`, `src/lib/draftClient.ts`, `src/lib/interviewClient.ts`, `src/lib/reviewClient.ts`, `src/lib/dataReviewClient.ts`
- `src/lib/paceInterviewClient.ts`, `src/lib/planChatClient.ts`, `src/lib/onboardChatClient.ts`, `src/lib/spineSuggestClient.ts`, `src/lib/vsCandidatesClient.ts`
- `src/App.tsx`, `src/appExperience.test.ts`, `src/StoryXDesk.tsx`, `src/editorFocusLayout.test.ts`
- `src/components/DiveDesk.tsx`, `src/components/diveDesk.test.ts`
- `src/components/PublishScreen.tsx`, 해당 publish 테스트
- `src/components/OnboardChatPanel.tsx`, `src/components/PlanChatPanel.tsx`, 해당 테스트
- `src/components/GenerationInboxPanel.tsx`, `src/components/FloatingEditor.tsx`, 해당 테스트
- `src/components/HostedRuntimeBoundary.tsx`, `src/components/hostedRuntimeBoundary.test.tsx`
- `src/main.tsx`, `src/styles.css`
- `sites/worker.ts`, `src/sitesWorker.test.ts`
- `vite.sites.client.config.ts`, `vite.sites.worker.config.ts`, `package.json`
- `tsconfig.json` — `sites/worker.ts`도 `tsc --noEmit` 검증 범위에 포함
- `vercel.json` — Functions가 있는 기존 Vercel build의 `remote-api` runtime 명시
- `.openai/hosting.json`
- 본 spec·plan, 종료 시 `progress.md`, `session-handoff.md`

사용자 소유 미추적 `.agents/skills/story-score/`는 읽기·수정·stage하지 않는다. 실제 작품·캐논·private memory-bank는 허용 파일이 아니다.
