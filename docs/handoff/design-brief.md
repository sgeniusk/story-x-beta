# Story X 디자인 핸드오프 brief (M9)

> 외주 디자이너 또는 Claude Design 에게 Story X UI 다음 라운드를 위임하기 위한 단일 진입 문서. 비전 문서·코드 위치·토큰 매핑·스크린샷·의뢰 항목을 한 페이지에서 시작할 수 있게 모은다.

| 항목 | 값 |
|---|---|
| 프로젝트 | Story X — 한국어 장편 연재 스튜디오 |
| 현재 버전 | 0.7.1 (`design/linear-dark` ↔ `main` 통합 완료, 2026-05-27) |
| 인계 시점 | M4 8/8 + M8 UI 통합 + Linear 다크 폴리시 완료 |
| 다음 마일스톤 | M9 — 외주 / Claude Design 인계 후 결과 통합 |
| 기술 스택 | React 18 + Vite 6 + TypeScript 5.6 + Vitest 2.1 |
| GitHub Repo | https://github.com/sgeniusk/story-x-beta (public · `git clone` 후 `npm install && npm run dev` 로 로컬 기동) |
| 데모 (외주용) | https://story-x-alpha.vercel.app — public · LLM env 미설정으로 인터뷰/드래프트는 mock 폴백, 디자인 검토엔 충분 |
| 데모 (로컬) | `npm run dev` → http://127.0.0.1:5173 |
| 검증 | `npm test` 220 / `npm run build` 1.04s / `tsc --noEmit` 0 |

---

## 1. 30초 안에 이해해야 할 것

Story X 는 "어떤 매체로든 살아남을 수 있는 이야기"를 만드는 작가용 OS 다. 작가실(Writers' Room) 메타포 — 36명의 AI 페르소나가 쇼러너·캐릭터 커스토디언·세계 키퍼·문체 큐레이터·연속성 에디터 같은 역할을 분담한다. 이 도구는 **빠른 출력**이 아니라 **이야기의 약속을 끝까지 지키는 일**이 목표다.

5초 약속:

> "Story X 는 AI 작가실로 이야기를 키우고, 캐릭터·세계·목소리·연속성이 무너지지 않게 잡아 준다."

자세한 비전 — `docs/claude-design-handoff-prompt.md` (357줄). 이 문서는 그 위에 얹는 **현황·요청** 묶음.

## 2. 4파트 구조 — 각 파트의 의도와 현재 톤

`src/App.tsx` 의 `AppStage` 가 6 단계로 분기한다.

| 파트 | 단계(stage) | 정의 위치 | 톤 정의 | 의도 |
|---|---|---|---|---|
| 1. 랜딩 | `landing` | `MarketingLanding` (src/App.tsx:230~) | Linear 다크 (낮/밤 토글) | "이게 어떤 도구인가" 30초 안에 |
| 2. 브릿지 | `login` · `projects` · `home` | `LoginScreen` / `ProjectHub` / `StoryXHome` | 로그인·프로젝트는 Notion 라이트, 홈은 Linear 다크 | 로그인 → 프로젝트 선택 → 매체 선택 → 인터뷰 → 빌딩 |
| 3. 스튜디오 | `editor` | `StoryXDesk.tsx` (744줄) | Linear pitch black + lime CTA | 원고 작성 + 작가진 검토 + 바이블 + 데이터 |
| 4. 퍼블리시 | `publish` | `PublishScreen.tsx` (789줄) | Linear 다크 + 앰버 액센트 | book-designer · pr-specialist · platform-curator · business-strategist 4 카드 |

브릿지 안의 홈 4 step (`medium → freewrite → intake → building`) 은 M8.5 에서 `.home-page` nx-* 토큰 12개를 다크로 오버라이드해 스튜디오 분위기에 미리 맞춰 둠.

### URL 진입점 (스크린샷·QA 용)

```
?stage=landing   ?stage=login     ?stage=projects
?stage=home      ?stage=editor    ?stage=publish
```

`localStorage.removeItem('storyx.landingTheme')` 으로 낮/밤 초기화.

## 3. 작업 자유도와 금지선

### 자유도 (Decisive 할 것)

- 화면 모델 자체를 바꿔도 됨 — `StoryXDesk` 단일 데스크 / 대시보드+워크스페이스 / 작가실 보드 / Scrivener-like binder 중 무엇이든.
- 컴포넌트 분할·신설, copy 갈아엎기, 시각 위계 재설계, 네비게이션 재설계 가능.
- 좌레일·우레일·중앙 원고 영역 비율 자유.
- `src/styles.css` 재구조화 가능 (현재 9100+ 줄, 단일 파일).
- `src/components/` 안에 새 컴포넌트 만들어도 됨.
- 한국어 카피 자유롭게 다듬기 — "쇼러너가 잡은 다음 회…" 같은 거친 표현 다 갈아도 OK.

### 금지선 (Don't)

- `src/lib/storyEngine.ts` 및 `src/lib/storyOntology.ts` · `storyHarness.ts` · `continuityContract.ts` · `koreanVoiceGate.ts` · `qualityGates.ts` · `agentRunEngine.ts` · `mediaProjection.ts` · `creativeDevelopment.ts` — **도메인 로직. 색깔 칠하기 위해 손대지 말 것.**
- `.claude/agents/*.md` 36 페르소나 정본 — 톤·이름·역할 변경 X.
- 연속성 검증 약화 금지. 충돌은 숨기지 않고 드러내야 함.
- Story X 라는 정체성 약화 금지 — AI Builder School 클론, 보라/파랑 그라데이션 hype, 일반 SaaS 대시보드, 챗봇 풍선 인터페이스 만들지 말 것.
- 마케팅 랜딩 page 처럼 만들지 말 것 — 첫 화면이 "사용 가능한 도구"여야 함.

## 4. 의뢰 항목 7개 (우선순위 순서)

각 항목 — 문제 / 현재 코드 위치 / 기대 결과.

### 4-1. 4파트 톤 일관성

**문제** — 랜딩(Linear 다크) · 브릿지(라이트→다크 혼재) · 스튜디오(Linear 다크) · 퍼블리시(다크+앰버) 가 같은 작품 안에 흐른다고 느껴지지 않음. M8.5 가 홈 4 step 만 다크화 — 로그인·프로젝트는 여전히 Notion 라이트.

**위치** — `src/styles.css` 의 4개 토큰 레이어 (token-map.md 참조). `App.tsx` 의 stage 분기.

**기대** — 4 파트가 같은 책의 5개 챕터처럼 느껴지게 — 톤은 달라도 같은 잉크·종이로 인쇄됐다는 느낌. 라이트/다크 사이 경계가 부자연스럽지 않게.

### 4-2. 좌레일 가독성

**문제** — 스튜디오 좌레일에 `AgentIntentCard` + M8 4 카드(`HarnessReportCard`, `QualityGatesCard`, `MediaProjectionsCard`, `OntologyCard`) + statusbar 가 쌓여 있는데, 카드 경계가 약해 위계가 안 보임. 다크 위에 다크 카드 + `--sx-line` 채도 부족.

**위치** — `src/StoryXDesk.tsx` 의 `HarnessReportCard` · `QualityGatesCard` · `MediaProjectionsCard` · `OntologyCard` (인라인 스타일 1차 컷) + `src/styles.css` 의 `.sx-rail-*`, `--sx-line*`, `--sx-paper*` ramp.

**기대** — 위에서 아래로 스캔할 때 "지금 어디까지 봐야 할지" 명확. 카드 4 개 사이 위계(작업 차원·정보 차원) 시각 분리.

### 4-3. 에이전트 검토·대화 UI 재설계

**문제** — 작가진 검토 패널이 "버튼 누르면 작가진 5명이 일제히 동작" → 결과가 한 묶음으로 떨어지는 거친 인터랙션. 검토 의견과 작가 응답이 같은 카드에 섞임.

**위치** — `src/StoryXDesk.tsx` 의 작가진 패널 영역(`sx-crew-rail` · `ex-review-*` 셀렉터) + `src/styles.css` :5237~5720 부근.

**기대** — 각 페르소나가 누군지(역할·관점) 명확하고, 검토 의견이 시간순 대화처럼 보이는 게 아니라 **각 페르소나의 분명한 입장 카드**로 보이게. 작가가 어떤 의견에 응답 중인지 추적 가능.

### 4-4. 인라인 diff 하이라이트

**문제** — 원고 textarea 위에 작가진 수정 제안 빨강/라임 표시가 별도 토글(`sx-diff-toggle`) 화면이라 작가가 "고친 곳"을 실시간으로 못 봄.

**위치** — `src/styles.css` :3094~3180 (다크 manuscript). 현재 `.sx-manuscript-editor.is-edited` 좌측 라임 글로우는 M8.6 에서 추가됨.

**기대** — 작가가 텍스트를 수정하는 동안 `was → is` 차이가 본문 위에 **인라인**으로 나타남. ContentEditable 또는 overlay 레이어 어느 쪽이든 작가가 흐름을 끊지 않고 검토 결과를 받게.

### 4-5. 확장(집중 모드) 시각 피드백

**문제** — `ex-focus-btn` 으로 원고 영역을 집중 모드로 펼치는 기능이 있지만, 들어갔다 나갔다 변화가 미묘해서 작가가 자기 모드를 인지하기 어려움.

**위치** — `src/StoryXDesk.tsx` 의 `isFocus` state + `src/styles.css` :3054~3094 부근.

**기대** — 집중 모드 진입 시 주변 패널이 명확히 비키고(또는 어둠), 나갈 때도 안정적인 transition. 키보드 단축키 안내.

### 4-6. 편집기 호흡

**문제** — 다크 manuscript 영역 여백이 M8.6 에서 `clamp(10px, ?, 16px)` 로 좁아짐. 가독성과 작업 폭 사이 트레이드오프가 거칠다. 줄간격·문단 간격·serif 본문 비율도 다듬기 필요.

**위치** — `src/styles.css` :3145~3162 (다크 manuscript 본문) + `--font-serif` 정의 :574.

**기대** — 1440·1920·24" 디스플레이 모두에서 1줄당 45~75자 사이 들어오게. serif 본문이 한글·영문 섞여도 자연스럽게 흐르게.

### 4-7. M8 4 카드 다듬기

**문제** — `HarnessReportCard` · `QualityGatesCard` · `MediaProjectionsCard` · `OntologyCard` 가 인라인 스타일 1차 컷. 카드 내부 위계 약함, 슬라이더 / 게이트 토글 / 점수 바 등 상호작용 요소가 거침.

**위치** — `src/StoryXDesk.tsx` 안 4 컴포넌트. 외부 클래스로 분리해 `src/styles.css` 에 정식 셀렉터화 가능.

**기대** — 각 카드가 보여주는 데이터의 의미를 작가가 한눈에 잡게. 슬라이더(commercial ↔ literary)·뱃지(`readyForProduction`)·매체 5종 비교가 제품 톤에 녹게.

## 5. 기술 컨텍스트

### 코드 핵심 진입점

```
src/App.tsx                         # 6 stage 라우터
src/StoryXDesk.tsx                  # 스튜디오 메인 (744줄)
src/components/PublishScreen.tsx    # 퍼블리시 (789줄)
src/components/AiStatusBadge.tsx    # AI 상태 + evolution history popover
src/lib/storyEngine.ts              # 도메인 로직 정본 (270줄)
src/lib/agentReviewProcess.ts       # 작가진 검토 프로세스 (23 페르소나 매트릭스)
src/styles.css                      # 단일 CSS (9100+ 줄)
docs/storyx-harness-architecture.md # 8 레이어 파이프라인 정본
docs/agent-system.md                # 23 ValidationAgentId + 16 criteriaKeys
docs/claude-design-handoff-prompt.md # 깊은 비전·자유도 문서 (357줄)
docs/handoff/token-map.md           # 토큰 4 레이어 매핑 (340줄)
```

### 페르소나 36명 위치

`.claude/agents/*.md` — 각 페르소나의 역할·관점·검토 기준이 markdown 본문에 들어 있음. UI 에서 이름·역할 카드를 표시할 때 reference.

주요 페르소나 그룹:
- **스튜디오 코어 5명** — serial-showrunner · character-custodian · world-keeper · genre-stylist · continuity-editor
- **확장 11명** — critic-reviewer · essay-curator · voice-curator · audio-narration-director · sound-music-agent · education-video-architect · onboarding-architect 등
- **M4 신설 12명** — studio-architect · interview-curator · book-designer · pr-specialist · platform-curator · business-strategist · timeline-keeper · canon-librarian · bible-curator · memory-evolution-keeper · essay-interviewer 등
- **매체별 풀 4 × 6명** — 에세이·소설·만화·오디오북 각각 6명 (`src/lib/{essay,novel,comic,audiobook}Personas.ts`)

### 디자인 토큰 4 레이어

`docs/handoff/token-map.md` 가 정본. 한 줄 요약:
- `--sx-*` — 스튜디오 (다크 고정)
- `--nx-*` — 브릿지 (라이트 기본, 홈 다크 오버라이드)
- `--lc-*` — 랜딩 (낮/밤 토글)
- 사용자 트윅 — 강조색 5 × 캔버스 톤 3 (localStorage)

### 폰트

- **`--font-serif`** — `Source Serif Pro` / `Noto Serif KR` / Georgia → 원고 본문
- **본문 sans** — `Inter Variable` / `Pretendard Variable` / `Apple SD Gothic Neo` → UI 전반
- **`--font-mono`** — `JetBrains Mono` / `Berkeley Mono` → 코드·메타·diff

한국어 polish 규칙은 작품 핵심 — `word-break: keep-all` · `text-wrap: pretty` 보존 필수.

## 6. 스크린샷 묶음

`docs/handoff/screenshots/` 폴더에 5단계 캡처(1440×900):

- `01-landing-dark.png` — 랜딩 밤
- `02-landing-light.png` — 랜딩 낮
- `03-bridge-home.png` — 홈 매체 선택 (4 step 첫 화면)
- `04-studio-editor.png` — 스튜디오 편집기 (좌레일 4 카드 + 원고 + 작가진 검토)
- `05-publish.png` — 퍼블리시 4 카드

세션 핸드오프 마지막 통과 상태에서 캡처. 외주가 재캡처해도 됨 — `?stage=` URL 파라미터로 직접 진입.

## 7. 검증·완료 기준

### 외주 결과 받았을 때 통합 전 체크

- [ ] `npm test` — 220 tests 통과
- [ ] `npm run build` — TypeScript 0 에러, vite build 성공
- [ ] `npx tsc --noEmit` — exit 0
- [ ] `npm run dev` — 6 stage 모두 진입 가능 (?stage= 으로)
- [ ] 스튜디오 진입 시 localStorage 트윅·캔버스 선택 보존
- [ ] 랜딩 낮/밤 토글 `storyx.landingTheme` 영속
- [ ] 모바일(min-width 360) 에서 텍스트 overflow 없음

### 외주가 갈아낼 때 보존해야 할 것

- `--sx-stage-*` 6색의 **의미 매핑**(생각·읽기·표시·쓰기·완료·대기) — hue 보존, 채도/명도만 손대도 OK
- 페르소나 36명의 이름/역할
- AppStage 6 분기 자체
- 도메인 로직(storyEngine 외 9개 lib 모듈) 호출 위치
- 키보드 단축키(Enter 승인 / Esc 취소 등) — 작가들 손에 박힘

## 8. 작업 의뢰 방식 제안

세 가지 옵션 — 외주 인력에 따라 선택.

### Option A — Claude Design / Claude Code 위임

`docs/claude-design-handoff-prompt.md` 전문을 그대로 보내고, 이 brief 와 token-map 을 첨부. Claude 가 직접 코드를 수정 (`src/StoryXDesk.tsx` + `src/styles.css` + 신설 컴포넌트). 검증은 위 체크리스트.

### Option B — Figma 디자이너 + 별도 구현

스크린샷 5장 + token-map 을 Figma 로 옮긴 뒤, 디자이너가 시안만 제공. 이쪽이 안전하지만 두 단계.

### Option C — 본인이 끌고 가기

이 brief 의 의뢰 항목 7개를 우선순위 순으로 직접 처리. 작업 단위가 큰 항목(#3, #7)은 별도 브랜치 권장.

---

## 부록 A — 변경 이력

- 2026-05-27 — M9 핸드오프 brief 신설. M4 8/8 + M8 UI 통합 + Linear 다크 폴리시 + `design/linear-dark` → `main` ff merge 완료 시점.

## 부록 B — 라이브 데모 접근

**Demo URL — https://story-x-alpha.vercel.app** (production, public)

Vercel "Deployment Protection" 의 적용 대상이 Production 채널에서 Disabled 라서 SSO 로그인 없이 누구나 접근 가능. 발송 직전 한 줄로 재검증.

```bash
curl -sI https://story-x-alpha.vercel.app/ | head -1
# HTTP/2 200 → OK, 외주 발송 가능
# HTTP/2 401 → Dashboard 에서 Deployment Protection 재확인
```

### Mock 폴백 안내 (외주에게)

LLM env(`AI_GATEWAY_API_KEY` · `ANTHROPIC_API_KEY`)가 미설정 상태라 인터뷰/드래프트/검토 응답은 mock 으로 떨어진다. 디자인 검토엔 충분 — 화면 구성·톤·인터랙션은 실제와 동일하게 렌더링됨. LLM 실 응답을 원하면 `docs/vercel-env-setup.md` 참조.

### Preview deployment 가 protected 인 이유

`*-gomgomee-s-projects.vercel.app` 형식의 preview deployment 는 여전히 Vercel SSO 가드(401). 외주에게 줄 때는 항상 짧은 production alias (`https://story-x-alpha.vercel.app`) 를 사용. preview URL 은 내부 검토용으로만.

---

## 부록 C — 참조 문서

| 문서 | 무엇 |
|---|---|
| `docs/claude-design-handoff-prompt.md` | 깊은 비전·자유도·금지선 (357줄) |
| `docs/storyx-harness-architecture.md` | 8 레이어 파이프라인 정본 |
| `docs/agent-system.md` | 23 ValidationAgentId + 16 criteriaKeys |
| `docs/handoff/token-map.md` | 토큰 4 레이어 매핑 |
| `docs/story-x-product-thesis.md` | 제품 명제 |
| `docs/storyx-launch-plan.md` | 출시 계획 |
| `feature_list.json` | 마일스톤 M1~M9 현황 |
| `session-handoff.md` | 세션별 작업 인계 로그 |
| `progress.md` | 진행 상태 요약 |
