# 온보딩 소재발굴 재설계 — S2 onboard-chat 엔진 + 「함께 구상」 갈래 (2026-07-12)

## 방향 (S1 스펙 계승)

소재발굴 재설계(`2026-07-12-source-discovery-preset-design.md` 방향 절)의 두 번째 슬라이스. S1이 3갈래 선택 스텝과 인기 프리셋 갈래를 완성했고, S2는 「준비 중」 비활성이던 **「함께 구상」 갈래를 onboard-chat 대화 엔진으로 활성화**한다 — 사용자가 구상 파트너와 채팅하며 소재를 캐다가, 됐다 싶으면 DiveSetup(플레이 시드)으로 응결 → 기존 playseed 확인 카드(상대 선택) → dive 진입.

S1 brainstorm 결정 1·2(엔진 통합·종료 산출)의 구현이며, plan-chat(PR #30)이 정본 선례다 — 순수 모듈 + 클라이언트 + 프롬프트 정본·CLI 미러 + dev 브리지 + **prod Function 필수**(dive-* 의 prod 누락 반복 금지).

## brainstorm 확정 결정 3건 (2026-07-12, S2)

1. **응결 트리거 = 하이브리드** — LLM이 소재가 무르익었다고 판단하면 같은 턴에 시드 카드를 자발 제안하고, 사용자도 상시 「이걸로 시작」 버튼으로 강제 응결 지시 턴을 보낼 수 있다. 두 경로 모두 같은 JSON 계약(`{reply, setup?}`) 하나로 처리한다.
2. **제안 스키마 = 응결 한 방** — 대화 중에는 자유 텍스트만 오간다. 응결 시점에 완성된 DiveSetup 카드 하나만 제안한다. plan-chat 식 필드 단위 누적 제안은 하지 않는다.
3. **파트너 = 단일 구상 파트너** — 페르소나 로테이션 없음(S3 적응형 인터뷰 몫).

## 흐름

```
소재발굴 선택 스텝 'source'
  └─ 「함께 구상」 → 'ideate' 패널 (OnboardChatPanel)
       ├─ 대화 턴: sendOnboardChat(text) → /api/onboard-chat → {reply, setup?}
       │    ├─ setup 없음 → 파트너 버블만
       │    └─ setup 도착 → 버블 + 시드 카드 (「이 설정으로 계속」)
       ├─ 「이걸로 시작」(상시) → sendOnboardChat('이 소재로 시작할게요.', condense=true)
       │    └─ setup 미도착 시 note 강등("소재가 아직 얕아…") — 대화 계속 가능
       └─ 시드 카드 승인 → setPlaySetup → setPlaySeedEntry('ideate') → 'playseed'
            └─ 상대 선택 → 「이대로 시작」 → 기존 handleStartPlay (무변경)
```

## onboard-chat 엔진 (plan-chat 미러 — 카탈로그 없음)

plan-chat 과의 구조 차이는 하나 — **프로젝트가 아직 없으므로 엔티티 카탈로그·그라운딩이 없다**. 프롬프트 재료 = 매체/포맷 + 자유 서술 시드(적어둔 게 있으면) + 최근 대화(8개) + 작가의 말 + condense 플래그.

### 순수 모듈 `src/lib/onboardChat.ts`

```ts
export type OnboardChatRole = 'user' | 'partner';
export interface OnboardChatMessage {
  id: string;
  role: OnboardChatRole;
  text: string;
  setup?: DiveSetup;   // 응결 시드 카드 — partner 메시지에만
}
export interface OnboardChatTurn { reply: string; setup: DiveSetup | null; }
export const ONBOARD_CHAT_TRANSCRIPT_LIMIT = 8;   // plan-chat TRANSCRIPT_LIMIT 미러
export const ONBOARD_CHAT_MAX_MESSAGES = 40;       // PLAN_CHAT_MAX_MESSAGES 미러
export function buildOnboardChatTranscript(messages, limit?): string   // 작가:/파트너: 라벨
export function normalizeOnboardChatResponse(raw: unknown): OnboardChatTurn | null
```

- normalize 규칙 — reply 비면 `null`(턴 실패). setup 은 `parseDiveSetup` shape 가드(scene/myRole string·cast 비어있지 않음·name 필수) 실패 시 **setup 만 조용히 강등**하고 reply 는 살린다(무효 제안 드랍 관례).
- 전제 리팩 — `parseDiveSetup` 을 storage.ts 모듈-프라이빗에서 **diveProposal.ts(DiveSetup 도메인 홈)로 승격·export**. storage 는 재import. 동작 무변경.

### 프롬프트 계약 (정본 promptBuilders.ts ↔ storyx.mjs 미러)

`buildOnboardChatPrompt({medium, format, freewrite, dialogue, query, condense})`. 섹션 — 자유 서술 시드 / 최근 대화 / 작가의 말 / 역할(단일 구상 파트너, "작가는 아직 작품이 없습니다") / 지시 / 출력 형식.

- 응결 조건 지시 — "setup 은 소재가 무르익었을 때만 포함" + 아직이면 setup 필드 생략.
- **myRole cast 중복 방어(프롬프트 층)** — "작가 자신의 역할은 cast 에 넣지 않고 myRole 에만" 명시(dive-setup 백로그의 프롬프트 정련을 신규 경로에 선반영).
- 대화에 없는 설정 발명 금지(dive-setup 지시문 계승).
- `condense=true` 면 강제 응결 지시 줄 조건부 삽입("reply 한 문장 + setup 반드시 포함").
- JSON 계약 — `{ "reply": "...", "setup": { "scene", "cast": [{name, role, desire, wound, voiceRules}], "myRole" } }`.
- **[onboard-mirror] 핀** — JSON 계약 줄·응결 조건 줄·condense 지시 줄 3개를 readFileSync(storyx.mjs) 포함 단언으로 고정([plan-mirror] 동형). condense=false 프롬프트에 강제 지시 부재 단언 동반.

### 서버·브리지·클라이언트

- `tools/storyx.mjs` `onboard-chat` 커맨드 — plan-chat 커맨드 동형(`--provider codex` 기본·`--freewrite`·`--dialogue`·`--query`·`--condense` 존재 플래그·`--dry-run`). **mock 은 `--condense` 시 미니 setup 반환**(codex 없이 e2e 가능).
- `vite.config.ts` dev 브리지 `storyxBridge('/api/onboard-chat', …)`.
- **`api/onboard-chat.ts` prod Function** — api/plan-chat.ts 미러(runLlmJson·mock 강등). S2 필수물.
- `src/lib/onboardChatClient.ts` — planChatClient 미러. 모든 실패 `{ok:false, reason}` 강등, 성공도 normalize 재통과, `reportAiCall({mode:'onboard-chat'})`. aiStatus 유니온 `'onboard-chat'` + 라벨 「구상 대화」.

## HomeFlowStep·영속

- `HomeFlowStep` 에 `'ideate'` 추가(9값). **불변식** — `isHomeFlowStep` 동반 추가(누락 시 복원이 medium 롤백).
- **transcript 영속 = OnboardingDraft 통합**(별도 키 아님) — onboard-chat 은 온보딩 수명과 정확히 일치한다. `clearOnboardingDraft`(handleStartPlay)가 클리어를 공짜로 처리하고(순서 핀 무변경), 복원도 restoredDraft 관례 그대로.
  - `onboardChatMessages?: OnboardChatMessage[]` — 백필 `[]`, 손상 항목 드랍(id/text string·role 검증), 메시지 내 setup 은 parseDiveSetup 실패 시 setup 만 드랍.
  - cap = `ONBOARD_CHAT_MAX_MESSAGES`(40) — App append 시 slice.
  - `hasMeaningfulOnboardingInput` 에 대화 존재 조건 추가.
  - 매체 변경 시 대화 클리어 — `[blueprint.medium]` 의존 별도 effect(기존 인터뷰 캐시 클리어 effect 에 합치면 자유 서술 타이핑마다 소실).
- **playseed 진입원 분기** — `playSeedEntry?: 'preset' | 'ideate'` 신설(백필 `'preset'`, OnboardingDraft 영속). playseed onBack 이 `usesSourceDiscovery ? playSeedEntry : 'freewrite'` 로 분기. goToPlaySeed 휴면 주석이 예고한 문제의 S2 몫 해소(자유 서술 재배선 자체는 S3).

## UI — OnboardChatPanel (프레젠테이션 전용)

- props — `messages, busy, busyNote?, note, onSend, onCondense, onUseSetup`.
- 렌더 — 빈 상태 안내 / 작가·파트너 버블 / **파트너 메시지 내 시드 카드**(첫 장면·내 역할·cast 요약 + 「이 설정으로 계속」) / busy 시 busyNote(role=status) / note / 컴포저(Enter 전송·busy disabled) / 「이걸로 시작」(busy 또는 대화 0이면 disabled).
- **LLM 대기 관례 적용** — App 이 경과 타이머(playSeedElapsed 동형)로 busyNote 조립("m:ss 경과 · 보통 30초~1분 · 새로고침 금지").
- styles.css `ocp-*` 신규 블록 — **신규 버튼 전부 `color: var(--nx-ink)` 명시**(S1 라이브 발견 — 다크 홈 UA 검정 상속 비가시).

## 인디케이터·슬라이드 인덱스

- `'ideate'` 는 homeFlowSteps 인디케이터 배열에 넣지 않는다 — `isSourceBranch` 에 OR 추가로 source 항목에 접는다(freewrite/preset 과 동일, 전진 스킵 방지). 갈래 3패널은 상호배타 조건부 mount 라 sourceBranchIndex DOM 슬롯 공유가 그대로 성립.

## 테스트 핀 갱신 (의도적 — 약화 아님)

- `appExperience.test.ts` 「준비 중」 단언 → 함께 구상 활성 핀으로 교체(`setHomeFlowStep('ideate')` 배선·`not.toContain('준비 중')`).
- handleStartPlay 순서 핀·playseed 배선 핀·프리셋 갈래 핀 유지.

## 테스트 (TDD 순서)

1. 순수 — parseDiveSetup 승격(diveProposal.test 로 가드 케이스 이전·storage 라운드트립 무회귀).
2. 순수 — onboardChat: transcript 라벨·limit / normalize reply 비면 null·setup 유효 통과·setup shape 위반 시 setup 만 강등·setup 부재 null.
3. 프롬프트 — 역할·시드 섹션·응결 조건·condense 조건부 지시(true 포함/false 부재)·[onboard-mirror] 3줄 핀.
4. 클라이언트 — normalize 재사용 계약(planChatClient.test 동형).
5. storage — onboardChatMessages 백필·손상 드랍·setup 가드 / playSeedEntry 백필 'preset' / isHomeFlowStep('ideate') / hasMeaningfulOnboardingInput.
6. 컴포넌트 — OnboardChatPanel 렌더 계약(빈 상태·버블·시드 카드·busy·「이걸로 시작」 disabled 조건).
7. 소스 핀 — ideate 배선·「준비 중」 제거·isSourceBranch·onBack 분기.
8. 라이브 게이트 — 실 codex 로 함께 구상 2~3턴 → 자발 응결/강제 응결 → playseed(상대 선택) → dive. 프리셋·자유 서술·비소설 회귀. ideate 새로고침 복원. 콘솔 0.

## 불변식

- 기존 인터뷰 경로(goToIntake·requestLlmInterview) **로직 무변경**. 자유 서술 갈래 CTA 「인터뷰로 계속」 유지.
- 비-소설 매체 온보딩 무접촉.
- 프리셋 갈래 준-무접촉 — `setPlaySeedEntry('preset')` 1줄만.
- handleStartPlay 순서 핀 무변경(대화 클리어는 clearOnboardingDraft 내포).
- playseed 이후 경로 공유 — 응결 setup 도 같은 DiveSetup 스키마·같은 confirmPlaySeed→buildPlayFirstProject. 확인 카드 이후를 갈라놓지 않는다.
- plan-chat 계열(planChat.ts·planChatClient.ts·buildPlanChatPrompt·api/plan-chat.ts) 무접촉. 미러는 [onboard-mirror] 핀으로 byte-identical.
- 헌장·결말·회차 구조 선결정 금지(S1 계승).

## 비목표 (후속 슬라이스)

- S3 — 적응형 인터뷰(자유 서술 재배선·입력 유형 선분석·STORY_PRESETS.keywords 유사-앵커 비교 제안·상대 선택 마지막 질문·goToPlaySeed 재배선·playSeedEntry 확장).
- in-flight 응답 중 이탈 시 seq 가드(단일 in-flight 라 busy 게이트로 충분 — plan-chat 의 accepted-risk 와 동급).
- 진짜 스트리밍(SSE)·에세이 대화형 플레이.
