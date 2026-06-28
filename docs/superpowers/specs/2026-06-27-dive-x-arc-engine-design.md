# Dive X 진전 엔진 (묶음 C-1) 설계

> 쇼러너가 반응자에서 연출자로 — "거대한 그림(StoryArc)"을 들고 매 턴 이야기를 끌고 가게 한다. dogfooding 피드백 "진전이 없다(큰 흠)"의 직접 해법.

- 작성 2026-06-27
- 상태 draft (브레인스토밍 합의 완료 → 구현 계획 대기)
- 선행 — Dive X 3차(장면+쇼러너+선택지, local main, 작동 중). 본 스펙은 그 위에 얹는다.
- 브랜치 `feat/dive-x-arc`
- **분해** — 묶음 C는 (C-1) 진전 엔진 [본 스펙] · (C-2) 능동적 멀티 캐릭터 [후속]. 묶음 B(되돌리기·캐논 god-편집)는 여전히 parked. 사용자가 C 우선 결정.

## 1. 문제와 원칙

- **문제** — 현재 쇼러너는 턴 단위로 *반응*만 하고, "이 이야기가 어디로 가는가"라는 큰 그림이 없어 서사가 정체된다(사용자가 지목한 "큰 흠").
- **해법** — 쇼러너에게 **StoryArc**(극적 질문·긴장 수준·다음 전개 의도)를 들려, 매 턴 그 방향으로 한 걸음 진전시키고 정체 시 스스로 전개를 민다.
- **설계 선택 — 가벼운 LLM-유지 arc.** Story X의 무거운 `storyHarness`/`serial-showrunner`(결정론·구조적)를 매 턴 돌리지 않고, **모델이 세션 arc를 직접 들고 갱신**한다. 실시간 채팅 감각에 맞고 추가 LLM 호출 0. (구조적 페이오프 검증이 필요해지면 그때 storyHarness 결합 — 비목표.)
- **자연어·연속성 원칙 유지** — 진전은 사용자의 자유 입력을 덮어쓰지 않는다. 사용자가 페이스를 쥔다(매 턴 자동 진전 + ⏭전개로 강한 진전 당기기). 기존 캐논은 보존.

## 2. 추가하는 것

### 2.1 StoryArc (세션 상태)
```ts
interface StoryArc {
  dramaticQuestion: string; // 이 이야기의 핵심 질문 (예 "도윤의 가족은 정말 외계인이고 도윤은 한패인가?")
  tension: number;          // 0~100 현재 긴장
  nextBeat: string;         // 다음에 밀어붙일 전개 의도 (예 "집 안에서 돌이킬 수 없는 단서를 발견하게 한다")
}
```
- `DiveSession.arc?: StoryArc` 추가. DiveState로 영속(scene처럼 세션에 실려 따라감).
- 부트스트랩 — 처음엔 undefined. dive-chat이 첫 응답에서 장면·캐논으로 dramaticQuestion을 잡아 채운다. 빈 상태로 시작해 자연 형성.

### 2.2 매 턴 진전 (dive-chat 확장, 추가 호출 0)
- `dive-chat` 입력에 현재 arc(JSON) 주입(`--arc`). 프롬프트에 "## 이야기 아크" 절 + 지시 — "응답을 nextBeat 방향으로 한 걸음 진전시켜라. tension이 낮거나 정체면 전개(단서·사건·전환)를 밀어라. 끝에 갱신된 arc를 내라."
- `dive-chat` 출력을 `{reply, choices, arc}`로 확장. `arc`는 갱신된 `{dramaticQuestion, tension, nextBeat}`(파서 기본값 가드).

### 2.3 ⏭ 전개 버튼 (on-demand 강한 진전)
- ⏳계속이 "시간 흘려보내기(잔잔)"라면, ⏭전개는 **"이야기를 다음 국면으로 크게 밀어붙인다."** 를 보낸다 — arc를 든 쇼러너가 긴장 고조·전환·결정적 사건으로 답한다.
- 구현은 별도 플래그 없이 기존 `send(text)` 재사용(implicit 액션 텍스트). arc 주입이 강한 전개를 가능케 한다.

### 2.4 arc 표시 (가벼움)
- 상단(장면 패널 근처)에 `🎯 {dramaticQuestion}` 한 줄 — arc.dramaticQuestion이 있을 때만. "어디로 가는지"를 사용자가 체감해 "진전 없음" 감각을 직접 해소.

### 2.5 응결 연동 (가벼움)
- dive-condense 입력에도 arc(JSON)를 주입해, 응결 회차가 현재 nextBeat·긴장을 반영한 페이오프 있는 회차가 되게 한다.

## 3. 시스템 설계 — 작은 단위

| 파일 | 변경 | 책임 |
|---|---|---|
| `src/lib/diveSession.ts` | 수정 | `StoryArc` 타입 + `DiveSession.arc?` |
| `tools/storyx.mjs` | 수정 | dive-chat `--arc` 입력·프롬프트·`arc` 출력 · dive-condense `--arc` 주입 |
| `vite.config.ts` | 수정 | `/api/dive-chat`·`/api/dive-condense`에 `--arc` |
| `src/lib/diveClient.ts` | 수정 | `DiveChatRequest.arc` · `DiveChatResponse.arc?` · `DiveCondenseRequest.arc` |
| `src/components/DiveDesk.tsx` | 수정 | arc 주입·응답 arc 저장 · ⏭전개 버튼 · 🎯 표시 |
| `src/styles.css` | 수정 | `.dx-arc` · `.dx-escalate` |

### 데이터 흐름
사용자/칩/계속/전개 → `send(text)` → `requestDiveChat({arc: JSON.stringify(session.arc ?? {}), ...})` → `{reply, choices, arc}` → reply 렌더, choices 칩, **arc는 `onChange({...session, arc: res.arc}, project)`로 세션 갱신·영속**. 응결도 arc 주입.

## 4. 비목표 (YAGNI)
능동적 멀티 캐릭터(C-2) · full storyHarness/serial-showrunner 배선 · 분기 트리 · 되돌리기·캐논 god-편집(묶음 B) · arc 수동 편집 UI · 긴장 그래프 시각화.

## 5. 리스크
- **과진전(폭주)** — 매 턴 너무 밀어붙이면 숨가쁘다. "한 걸음" 지시 + 잔잔한 ⏳계속과 강한 ⏭전개 분리로 페이스 균형. dogfooding으로 조정.
- **arc 드리프트** — 모델이 dramaticQuestion을 자꾸 바꾸면 일관성↓. 프롬프트에 "이미 잡힌 dramaticQuestion은 웬만하면 유지" 가드.
- **arc 파싱 실패** — 모델이 arc를 안 내면 기존 arc 유지(가드). 치명적 아님.

## 6. 검증 (DoD — 프로토타입)
- `npm test` 녹색(StoryArc 타입·diveClient arc 통과·DiveDesk ⏭전개 렌더 핀), `npm run build`·`tsc` 통과. 새 동작 TDD 우선.
- 라이브 한 바퀴 — dive-chat이 arc(dramaticQuestion·nextBeat) 산출·🎯 표시·매 턴 진전·⏭전개로 강한 전개·응결 페이오프. 콘솔 0.
- 판정 기준(사용자 체감 "진전이 생겼다")은 코드 DoD 밖, dogfooding 목표.
