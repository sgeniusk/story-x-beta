# SITES-0 소유자 전용 호환성 파일럿 설계

> 기준 브랜치: `codex/p2-condense-target-length` · 구현 브랜치: `codex/sites-private-pilot`
> 사용자 결정: Vercel을 대체한다고 선언하기 전에 ChatGPT Sites에서 Story X를 직접 시험한다. 첫 배포는 소유자만 접근하며 실제 작품·캐논은 옮기지 않는다.

## 1. brainstorm — 결정 쟁점과 답

### Q1. 이번 Sites 배포가 곧 Story X의 새 정식 실행 환경인가?

아니다. 이번 슬라이스는 **호환성 파일럿**이다. 현재 정본인 로컬 React/Vite 앱과 `codex exec` 생성 경로를 보존하고, Sites가 UI 호스팅·버전 저장·소유자 전용 접근을 안정적으로 맡을 수 있는지만 증명한다. 기존 Vercel Functions·GitHub Pages 설정을 삭제하거나 전환하지 않는다.

### Q2. 누가 접근할 수 있는가?

첫 버전은 현재 소유자 한 명만 허용한다. 공개·워크스페이스 전체·사용자 추가 공유는 이 슬라이스의 비목표다. Sites가 owner-only 상태를 검증할 수 있을 때만 private deployment 도구로 배포한다.

### Q3. 작품과 캐논은 어디에 저장하는가?

이번 버전은 D1·R2·서버 저장을 붙이지 않는다. 배포 도메인은 새 origin이므로 기존 로컬 작품을 자동으로 읽거나 이전하지 못한다. 배포본에서 만든 임시 데이터는 그 브라우저의 localStorage에만 남고, JSON 가져오기도 사용자가 명시적으로 실행할 때만 동작한다. 실제 작품·원문·캐논·memory-bank private 자료·로컬 환경변수는 빌드나 배포 archive에 넣지 않는다.

### Q4. ChatGPT Sites 안에서 로컬 Codex 생성은 어떻게 다루는가?

Sites의 Cloudflare Worker는 `node:child_process`와 로컬 `codex exec`를 실행할 수 없다. 이를 숨은 폴백이나 ChatGPT 구독 모델 호출로 위장하지 않는다.

- `VITE_STORYX_AI_RUNTIME=disabled`를 Sites client build에 고정한다. dev 기본은 `local-codex`, API가 보장되지 않은 production 기본은 `disabled`다. Vercel처럼 Story X API가 함께 배포되는 환경만 build 명령에서 `remote-api`를 명시한다.
- Sites build의 API wrapper는 같은 origin의 `/api/**` 요청을 **네트워크 전송 전에** 503 `local_runtime_required`로 차단한다.
- AI action은 wrapper 실패 뒤 결정론적 초안·mock 검토·가짜 PLAY 답변을 만들거나 프로젝트를 바꾸지 않는다.
- 저장된 running 영수증은 Sites에서 poll/cancel하지도, 실패·만료로 바꾸거나 삭제하지도 않는다.
- Worker도 `/api/**`를 동일한 구조화 오류로 막아 직접 호출을 방어한다.
- 화면 상단에는 `Sites 비공개 미리보기`와 `AI 생성·응결·검토는 로컬 Story X에서 실행` 안내를 계속 표시한다.
- 직접 편집·기존 결과 읽기·본문/TXT/JSON 반출은 유지한다.

### Q5. 기존 Vite 앱을 Sites가 요구하는 산출물로 어떻게 만든다?

현재 `vite.config.ts`는 로컬 bridge를 위해 Node `child_process`를 import하므로 Worker bundle에 포함할 수 없다. 별도 Sites client/worker config를 둔다.

1. client build는 기존 React 앱을 `dist/client`에 만들고 AI runtime을 `disabled`로 고정한다.
2. worker build는 `sites/worker.ts`만 Cloudflare-compatible ESM으로 묶어 `dist/server/index.js`를 만든다.
3. Worker는 정적 asset을 `ASSETS` binding으로 제공하고, HTML navigation의 404만 `/index.html`로 되돌려 SPA query/deep-link를 보존한다.
4. 공식 Sites packaging helper가 `dist/server/index.js`와 `.openai/hosting.json`을 검증하고 `dist/client`를 함께 archive한다.

새 package dependency는 추가하지 않는다. 기존 Vite/Rollup으로 두 bundle을 만든다. `ASSETS` catch-all과 SPA fallback은 제공 템플릿이 보장하는 일반 SPA 계약이 아니므로 이 Worker의 테스트와 실제 배포가 별도 검증 gate다.

## 2. 런타임·데이터 경계

| 영역 | 로컬 Story X | Sites 비공개 파일럿 |
|---|---|---|
| React UI·프로젝트 보관함 | 기존 그대로 | 같은 UI, 새 origin의 빈 저장소로 시작 |
| 작품 저장 | 로컬 브라우저 localStorage | 배포본 브라우저 localStorage만 |
| AI 생성·검토·응결 | Vite bridge → local `codex exec` | action·fetch·poll 차단 |
| 기존 결과·직접 편집·반출 | 허용 | 허용 |
| 캐논 반영 | 기존 사용자 승인 gate | 기존 저장 결과의 승인 gate만, 자동 이관 없음 |
| 서버 DB·파일 | 로컬 CLI/명시 export | D1·R2 없음 |
| 접근 | localhost | Sites owner-only |

런타임 capability는 hostname이 아니라 compile-time 설정으로 판별한다. `npm run preview`처럼 localhost지만 bridge가 없는 환경을 local Codex로 오판하지 않는다. 개발 서버만 기본 `local-codex`이며 production build는 기본 `disabled`로 닫힌다. Vercel은 `VITE_STORYX_AI_RUNTIME=remote-api`를 명시해 기존 Functions를 유지한다. `VITE_*`에는 API key를 넣지 않는다.

`storyxApiFetch`는 Story X의 생성 API 전용 wrapper다. `disabled` 모드에서 같은 origin의 `/api/` 경로만 막고, 정적 asset이나 외부 링크는 건드리지 않는다. `local-codex` 모드에서는 현재의 `globalThis.fetch`에 그대로 위임해 기존 테스트 mock과 요청 semantics를 보존한다.

## 3. AI action 불변식

disabled 모드에서 다음은 모두 호출 전 즉시 멈춘다.

- HOME — 인터뷰, 구상 대화, 척추 제안, 첫 초안.
- PLAY — 캐릭터 대화, 쇼러너, VS, 응결 시작·조회·취소, 정합 검사.
- WRITE/PLAN — 다음 회차, 에이전트·데이터 검토, 페이스 인터뷰, VS, 설계 대화.
- PUBLISH — 에이전트 검토.

차단은 사용자 입력·대화·영수증·캐논·프로젝트를 지우거나 새로 쓰지 않는다. 특히 첫 초안의 deterministic fallback 저장, mock pass 검토, PLAY의 fallback 말풍선, running receipt의 반복 poll을 금지한다. 기존 성공 영수증의 검토·다운로드·명시 승인과 로컬 편집은 계속 허용한다.

## 4. Worker 계약

- `GET`/`HEAD` asset 요청은 `env.ASSETS.fetch(request)`에 전달한다.
- asset이 404이고 요청이 HTML navigation일 때만 `/index.html`을 반환한다.
- 존재하지 않는 이미지·JS·CSS·일반 API를 HTML 200으로 바꾸지 않는다.
- `/api`와 `/api/**`는 body를 읽지 않고 JSON 503을 반환한다.
- 응답에는 `Cache-Control: no-store`를 붙여 로컬-runtime 오류가 캐시되지 않게 한다.
- Worker bundle에는 Node builtin, API key, 실제 작품 데이터가 없어야 한다.

## 5. 사용자 경험

Sites 모드에서만 앱 바깥 최상단에 작은 안내면을 둔다.

- 제목: `Sites 비공개 미리보기`
- 본문: `작품은 이 브라우저에만 저장됩니다. AI 생성·응결·검토는 시작하지 않으며 로컬 Story X에서 실행하세요.`
- AI action을 누르면 같은 이유를 현재 화면의 안내로 보여주되 기존 입력을 보존한다.
- running 영수증: `이 배포본에서는 로컬 생성 상태를 확인하거나 취소할 수 없습니다. 영수증과 PLAY 기록은 지우지 않았습니다.`
- `role="status"`, 눈에 보이는 텍스트, 320px에서 자연 줄바꿈.
- 기존 랜딩 `--lc-*`, 브리지 `--nx-*`, 스튜디오 `--st-*` 값을 바꾸지 않는다. 안내면 자체는 global warm `--st-*` 토큰만 쓴다.
- 로컬 build에는 DOM도 여백도 추가하지 않는다.

## 6. 배포·버전 계약

1. `.openai/hosting.json`이 없음을 다시 확인하고 Sites project는 정확히 한 번 만든다.
2. 반환된 opaque id를 그대로 `project_id`에 저장한다. `d1`·`r2`는 선언하지 않는다.
3. 검증된 source를 커밋하고, 단기 credential을 파일·remote URL·git config에 남기지 않은 채 Sites source branch로 push한다.
4. 그 commit에서 `build:sites`와 공식 `package-site.sh`를 실행한다.
5. 같은 commit SHA와 archive로 version을 저장하고 owner-only private deployment를 수행한다.
6. terminal `succeeded`와 정확한 URL을 확인하기 전에는 배포 완료라 하지 않는다.
7. GitHub에는 현재 P2-d branch를 base로 Draft PR까지만 만들고 merge하지 않는다.

## 7. archive allowlist

archive는 `dist/**`와 복사된 `dist/.openai/hosting.json`만 포함한다. `.git`, source, `api/`, `.env*`, `.storyx-runs*`, `.playwright-mcp`, `.vercel`, docs/handoff, memory-bank private는 포함하지 않는다. seed/preset 데모 상수는 기존 프런트 bundle 일부지만 실제 사용자 작품으로 간주하지 않으며, 실제 작품 데이터가 build-time source에 들어오지 않았는지 별도 scan한다.

## 8. 비목표

- ChatGPT 구독을 Story X의 모델 API entitlement로 전환하는 것.
- OAuth/SIWC, 계정별 서버 저장, D1/R2 동기화, 여러 기기 이어쓰기.
- Vercel·GitHub Pages 제거, production migration, custom domain.
- 실제 사용자 작품·캐논·private memory-bank 업로드 또는 자동 import.
- 생성 품질·응결 계약·캐논 승인 로직 변경.
- UI 리디자인.

## 9. 수용 기준

1. local dev API client·잡 polling과 명시적 `remote-api` Vercel build가 회귀하지 않으며, 일반 production build는 API 없는 상태에서 fail-closed한다.
2. `npm run build:sites`가 `dist/client/index.html`과 Cloudflare-compatible `dist/server/index.js`를 만든다.
3. disabled API wrapper가 `/api/**` 요청을 실제 fetch 전에 503으로 막고 local 모드는 원래 fetch에 위임한다.
4. Sites mode AI action은 fetch·poll·fallback 결과·프로젝트 mutation을 만들지 않고 사용자 입력·running 영수증을 보존한다.
5. Worker가 asset·SPA fallback·API 503을 각각 올바르게 처리한다.
6. Sites build에만 비공개 미리보기/브라우저 저장/로컬 AI 안내가 보인다.
7. 공식 packaging helper가 archive를 만들고 allowlist·필수 entry/config 검사를 통과한다.
8. Sites access가 owner-only이고 private deployment가 `succeeded`한 정확한 URL이 있다.
9. `bash init.sh`가 최종 녹색이며 progress/handoff·커밋·push·Draft PR이 완료되고 merge는 남는다.
