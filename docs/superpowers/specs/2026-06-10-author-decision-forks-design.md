# 작가 결정 갈림길 + 생성 측 회수 의무 — design

> 작성 2026-06-10 · 작성자 Claude(편집장) + 사용자 합의 · 관련 `docs/reviews/2026-06-07-persona-live-test/FINAL-REPORT-romancefantasy.md` 권고 1·2, `docs/superpowers/specs/2026-06-09-arc-payoff-gate-design.md`(1·2단계 완료)
> continuity≠payoff 처방의 다음 조각 — "측정·드러냄"에서 "생성 교정 + 작가 결정 유도"로.

## 1. 배경 — 왜 이걸 하나

페르소나 실증 테스트(#2 로판 23화 완결)의 두 핵심 발견이 출발점이다.

- **continuity ≠ payoff** — 연속성은 ★5인데 전제 페이오프가 0이었다. 1단계(`payoffLedger`)·2단계(`premise-progress` 스테이지·검토 evidence)는 이미 구현됐으나, **초안 생성 프롬프트는 여전히 정체를 모른다.** 검토가 revise를 내려도 생성은 같은 편향으로 또 연기한다.
- **사용자 intent가 들어가면 품질이 뛴다** — ch22·23에서 intent 유도로 deferral을 끊고 완결이 나왔다. 반대로 AI 상상으로 채운 결정(가족 이름 등)이 드리프트의 진원지였다. 그러나 현재 intent 메모는 빈 자유 입력일 뿐, 시스템이 "이번 화의 갈림길"을 묻지 않는다 — 작가가 무엇을 결정해야 하는지 모른 채 생성 버튼을 누른다.

## 2. 목표 / 비목표

**목표**
- (A) **생성 측 회수 의무** — `computePayoffLedger`의 `isStalled`를 초안 생성 프롬프트에 주입해, 정체 시 "새 약속 금지·열린 약속 최소 1개 회수"를 생성 단계에서 강제한다. 검토(이미 구현)와 생성이 같은 측정값을 본다.
- (B) **회차 갈림길 질문** — 회차 생성 전, 레저·캐논에서 **결정론으로** 갈림길 질문 2~3개를 도출해 의도 메모 위에 카드로 보여준다. 작가가 선택하면 한 줄 intent가 메모에 합쳐진다. AI가 채우면 안 되는 결정을 작가에게 돌려준다.

**비목표 (이 spec 범위 밖)**
- LLM 기반 갈림길 질문 생성(인터뷰 패턴 재활용) → 결정론 버전 라이브 검증 후 2단계.
- 결정 부채(decision debt) 보드 — 미정 결정 누적 추적 → 별도 스펙.
- promise↔payoff 고유 매칭·plotThread 상태 머신 → 페이오프 게이트 3단계 그대로 유지.

## 3. 결정 사항

| 항목 | 결정 |
|---|---|
| 갈림길 도출 방식 | **결정론** — `rewardArc` 미회수 promise + `openThreads` + 정체 신호. LLM 호출 없음(생성 전 지연 0·비용 0·환각 0) |
| 갈림길 강제력 | 선택은 **옵션** — 안 고르면 기존 흐름 그대로. 작가 주도권 원칙("질문이 명령이 되지 않는다") |
| 정체 시 생성 지시 | 검토 evidence와 동형 문구 — 측정값(`deferredStreak`·`openPromises`) 포함, 회수 의무 + rewardArc payoff 기록 지시 |
| 데이터 없을 때 | 갈림길 0개·정체 지시 없음 — `measured:false` 철학 유지(거짓 유도 차단) |
| intent 합성 | 선택 시 `intentSeed` 한 줄을 기존 메모에 **append**(덮어쓰지 않음) · 중복 클릭 무시 |

## 4. 데이터 흐름 — 터치포인트

| # | 파일 | 변경 |
|---|---|---|
| 1 | **`src/lib/episodeBriefing.ts` (신규)** | `buildEpisodeForks(project, ledger)` — 갈림길 결정론 도출 + `composeIntentWithFork` (순수 함수) |
| 2 | `src/lib/server/promptBuilders.ts` | `DraftPromptInput`에 `payoffStatus?` 추가 + isSerial 정체 시 회수 의무 규칙 주입 |
| 3 | `api/draft.ts` | body에서 `payoffStatus` 파싱(`api/review-agent.ts`와 동형) → `buildDraftPrompt` 전달 |
| 4 | `src/lib/draftClient.ts` | `DraftRequestInput`에 `payoffStatus?` 필드 |
| 5 | `src/StoryXDesk.tsx` `produceEpisode` | `computePayoffLedger(project.chapters)`를 draft 요청에 동봉(검토 3개 호출부와 동형) |
| 6 | `tools/storyx.mjs` | `buildDraftPrompt` 미러 + `--payoff-status` JSON 플래그 |
| 7 | `src/components/FloatingEditor.tsx` | `episodeForks`·`onIntentChange` 기반 갈림길 카드 — 의도 메모(textarea, ~619행) 위 렌더 |
| 8 | `src/StoryXDesk.tsx` `floatingEditorProps` | `buildEpisodeForks` 결과 주입 |
| 9 | `src/styles.css` | `.fc-fork*` 스타일(기존 `.fc-*` 토큰 재사용) |

## 5. 인터페이스 계약

```ts
// src/lib/episodeBriefing.ts
export interface EpisodeForkOption { label: string; intentSeed: string; }
export interface EpisodeFork {
  id: string;
  source: 'stalled-premise' | 'open-promise' | 'open-thread';
  question: string;
  options: EpisodeForkOption[];
}
export function buildEpisodeForks(project: StoryProject, ledger: PayoffLedgerReport): EpisodeFork[];
export function composeIntentWithFork(currentIntent: string, seed: string): string;
```

**도출 규칙 (우선순위 순, 최대 3개 질문 · 질문당 최대 3 옵션)**
1. `ledger.isStalled` && 미회수 promise 존재 → **회수 갈림길**("어느 약속을 회수할까요?") — 최근 미회수 promise들이 옵션.
2. 정체 아님 && 미회수 promise 존재 → **진척 갈림길**("어느 약속을 진척시킬까요?").
3. `openThreads` 존재 → **떡밥 갈림길**("어느 떡밥을 중심에 둘까요?").
4. 데이터 모두 없음 → 빈 배열(카드 미렌더).

## 6. 에러 / 폴백

- 구버전 작품(rewardArc 없음)·fallback draft → 갈림길은 openThreads만으로, 정체 지시는 `measured:false`라 미주입. 기존 흐름과 동일.
- `payoffStatus` 누락 요청(배포본·구클라이언트) → `api/draft.ts`가 undefined로 통과, 프롬프트 무변화(하위호환).
- FloatingEditor `onIntentChange` 없을 때(읽기 전용) → 갈림길 카드 클릭 비활성.

## 7. 테스트 (TDD 순서)

1. `episodeBriefing.test.ts` (신규, RED 먼저) — 데이터 없음→[], 정체→회수 갈림길 우선, 비정체→진척 갈림길, openThreads 갈림길, compose append·중복 무시.
2. `promptBuilders.test.ts` — 정체 시 회수 의무 문구, 비정체·누락 시 미주입, 단편 포맷은 정체여도 미주입.
3. `draftClient.test.ts` — `payoffStatus`가 요청 body로 전달.
4. `floatingEditor.test.ts` — 갈림길 카드 렌더 + 클릭 시 `onIntentChange` 합성 호출.

## 8. 리스크 / 미해결

- **갈림길 품질** — 결정론 도출이라 promise 문장이 길거나 어색할 수 있다. 1단계는 `label`을 그대로 노출하고, 라이브 검증에서 어색하면 LLM 정제(2단계)로.
- **stall 지시 vs 작가 intent 충돌** — 작가가 일부러 더 연기하고 싶을 수 있다. 지시 문구는 "회수합니다"로 강제하되, 작가 intent(자유 서술)가 프롬프트에서 더 앞·더 구체이므로 LLM이 작가를 우선할 여지를 남긴다. 라이브에서 관찰.
- **검증 계획** — #3 헌터물 테스트에서 갈림길 사용/미사용 회차를 섞어 6축 비교(권고 A 실증과 동형).
