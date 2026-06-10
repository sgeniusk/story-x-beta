# 진도 인터뷰 2단계 — 쇼러너 서술형 LLM 페이스 인터뷰 설계 (2026-06-11)

> 1단계(결정론 진도 체크 카드, `2026-06-10-pace-check-design.md`)의 대화형 확장. 착수 근거 — MVP 실효(과회수 4→0~1, `06-hunter-pace-check.md`) + P12 재관찰 통과. 원안은 사용자 아이디어(handoff 2026-06-10): "쇼러너가 진도·페이스를 서술형으로 인터뷰 — 전제 몇 부 능선·전진 vs 숨 고르기·다음 회수까지 몇 화".

## 문제

1단계 카드는 고정 3질문·9옵션의 **일반 문구**다. 작품이 깊어지면 작가의 페이스 결정은 작품 구체 내용에 붙어야 한다 — "전제가 중턱인가"가 아니라 "윤서문 추적이 중턱인가, 한지욱 합류 전에 고백을 둘 것인가". 또 갈림길·진도 시드가 서로 모순될 수 있는데(회수 페이스 + 연성 fork), 이를 중재할 화자가 없다.

## 접근 비교 (A 채택)

- **(A) 전용 명령·라우트 신설** — 온보딩 인터뷰(`interview` 명령·`/api/interview`·interviewClient) 아키텍처를 그대로 복제한 `pace-interview` 축. 경계 명확·기존 패턴 검증됨·실패 폴백 = 기존 결정론 카드(이미 렌더 중)라 강등 무비용. **채택.**
- (B) interview 명령에 mode 플래그 — 표면은 작지만 온보딩 계약(freewrite·페르소나 라인업)과 페이스 계약(ledger·약속)이 한 명령에 섞임. 기각.
- (C) review-agent 재사용 — verdict/note 계약과 안 맞음. 기각.

## 동작 설계

### 트리거·UI (FloatingEditor)
- fc-pace 카드 헤더에 **"쇼러너에게 묻기"** 버튼. 노출 조건 = 카드 표시 조건과 동일(연재 + 2화 이상 + 정체 또는 deferred 2+). 즉 1단계가 떠 있을 때만 2단계를 부를 수 있다.
- 클릭 → 로딩 상태("쇼러너가 진도를 읽는 중…") → 성공 시 **카드의 질문 목록을 LLM 질문으로 교체**(같은 PaceQuestion 렌더 패스 재사용, id `llm-pace-1..3`). 실패 시 기존 결정론 질문 유지 + 한 줄 실패 안내.
- 옵션 클릭 동작은 1단계와 동일 — `replacePaceSeed`(같은 질문 교체·append). 자유 텍스트 입력은 비범위 — 의도 메모 직접 타이핑이 이미 그 역할(YAGNI).
- LLM 질문의 intentSeed 는 LLM 이 작품 맞춤으로 산출하므로 1단계 템플릿 패턴과 다르다 → **stripConsumedSeeds 가 못 지운다.** 해결: LLM 시드는 합성 시 접두 `[페이스] ` 를 클라이언트가 붙이고, strip 패턴에 `^\[페이스\] ` 추가(결정론 anchored 유지).

### 데이터 흐름
```
StoryXDesk (트리거)
  → requestPaceInterview({ medium, format, payoffStatus, unpaidPromises, deferredStakes, contextDigest })   [paceInterviewClient.ts 신설]
  → POST /api/pace-interview   [vite.config.ts storyxBridge 라우트 신설 — 모든 인자 명시 전달(브리지 갭 전례 주의)]
  → node tools/storyx.mjs pace-interview --provider codex --medium … --format … --payoff-json … --promises-json … --stakes-json … --context …
  → buildPaceInterviewPrompt (promptBuilders.ts 정본 + storyx.mjs 미러 — 핵심 지시문 byte-identical + 동기화 테스트)
  → codex exec → JSON { questions: [{ question, options: [{ label, intentSeed }] }] } (1~3개)
  → normalizePaceQuestions (오형식·빈 옵션 무시, 최대 3질문·질문당 3옵션) → PaceQuestion[]
```
- 폴백 — 모든 실패 경로(브리지 오류·provider 실패·빈 질문)에서 `ok:false` 반환, UI 는 결정론 카드 유지. `reportAiCall` 로 상태 뱃지 보고(mode 'pace-interview').
- prod 미러 — `api/pace-interview.ts`(M5 라우트 5종과 동급, promptBuilders 재사용).

### 프롬프트 계약 (buildPaceInterviewPrompt)
- 화자 — 쇼러너(연재 페이스 책임자). 입력 — payoff 수치(deferredStreak·openPromises·isStalled), 미회수 약속 목록, deferred stake 목록, 작품 컨텍스트 digest.
- 지시 — (1) 질문 1~3개, 각 질문은 **작품의 구체 약속/위험 이름을 박아서**(일반론 금지) 전제 능선·이번 화 페이스·다음 회수 시점 중 어울리는 테마를 묻는다. (2) 옵션 2~3개, 각 옵션의 intentSeed 는 "이번 화 생성에 줄 한 줄 지시"로 작품 맞춤 문장. (3) **기확정 캐논을 재발급하는 질문/시드 금지**(P12 규칙 미러). (4) 연재 한정 — 단독 완결형이면 빈 questions.
- 출력 — JSON 하나만, 코드펜스 금지(기존 interview 계약과 동일 관행).

### 모듈 경계
| 단위 | 책임 | 의존 |
|---|---|---|
| `src/lib/paceInterviewClient.ts` (신설) | 요청 조립·fetch·normalize·폴백·reportAiCall | payoffLedger 타입, aiStatus |
| `src/lib/server/promptBuilders.ts` | `buildPaceInterviewPrompt` 정본 | — |
| `tools/storyx.mjs` | `pace-interview` 명령 + 프롬프트 미러 + dry-run | runProviderWithRetry(기존) |
| `vite.config.ts` / `api/pace-interview.ts` | dev 브리지 / prod 라우트 | storyx.mjs / promptBuilders |
| `FloatingEditor.tsx` | 버튼·로딩·질문 교체 렌더(기존 fc-pace 재사용) | PaceQuestion |
| `StoryXDesk.tsx` | 트리거 핸들러·paceQuestions state 교체 | paceInterviewClient |
| `episodeBriefing.ts` | strip 패턴에 `[페이스] ` 접두 추가 | — |

## 검증
- 단위 — 프롬프트(수치·약속 주입, 연재 한정, P12 규칙 줄), normalize(오형식·초과 절단), client 폴백 3경로, FloatingEditor 버튼/로딩/교체 렌더, strip `[페이스] ` 접두, 미러 동기화 테스트(핵심 지시문).
- CLI dry-run — pace-interview 4케이스(정상·payoff 누락·오형식 JSON·단독 완결형 빈 질문).
- 라이브 — #3 fixture 에서 버튼→질문 도착(작품 구체 문구 확인)→옵션 클릭→메모 합성→생성 1회→시드 자동 소거.

## 비범위
- 작가 자유 답변의 LLM 재요약(2.5단계) · 다회 왕복 대화 · 결정 부채 보드 · 갈림길 옵션 자체의 LLM 정제(이 스펙의 질문 생성과 별개 트랙).
