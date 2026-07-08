# PLAN 설계 대화 채널 — 설계실 2단계 설계

> 2026-07-07 · 근거 = PLAN staged spec `2026-07-04-plan-staged-patches-design.md`(사용자 결정 ① "PLAN 역할 = AI와 같이 짜는 설계실 — 설계안은 정본이 아니므로 staged가 자연스러움", 비목표 절이 이 채널을 1순위 후속으로 명시). staged 패치 모델은 이 채널의 "안전 기반"으로 설계되었다.
> 사용자 결정 6건(brainstorming·목업) — ① 산출 = **승인형 패치 제안**(자유 대화만·자동 staged 기각) ② 위치 = **dock 패널 확장**(워크벤치 상주 컬럼·플로팅 시트 기각) ③ 상대 = **단일 설계 파트너**(섹션별 스위칭·무페르소나 기각) ④ 영속 = **localStorage**(세션 휘발 기각 — 반영 remount 증발 방지) ⑤ 배선 = **6점 풀세트**(dev 전용 기각) ⑥ 범위 = **접근안 2**(최소 설계실 + 하네스 점수 미리보기).

## 1. 문제

PLAN staged(PR #20)는 설계안을 안전하게 쌓는 그릇까지 만들었지만, 설계를 "같이 짜는" 상대가 없다 — 작가는 빈 필드 앞에서 혼자 고민하고 손으로 고친다. 기존 AI 채널(PLAY dive-chat·쇼러너·페이스 인터뷰)은 전부 생성/진행 표면이고, 바이블(인물 욕망·세계 규칙·캐논·스토리코어)을 대화로 다듬어 설계안으로 응결시키는 채널이 없다. 온보딩 인터뷰는 프로젝트 씨앗을 만드는 일회성 선택지 흐름이라, 기존 바이블을 before/after 패치로 고치는 반복 대화와 다른 표면이다.

## 2. 변경 지점

### 2.1 데이터 계약 — 신규 순수 모듈 `src/lib/planChat.ts` + `storage.ts`

```ts
export interface PlanChatMessage {
  id: string;
  role: 'user' | 'partner';
  text: string;
  proposals?: PlanChatProposal[];   // partner 턴에만
}
export interface PlanChatProposal {
  kind: 'character' | 'world' | 'canon' | 'story-core';
  targetId?: string;   // character/world/canon 필수 — 실존 엔티티 id
  field?: string;      // character: desire|wound|currentState · story-core: logline|audiencePromise|deepQuestion|formIntent|tone
  after: string;
  rationale: string;   // 근거 한 문장
  approved?: boolean;  // 승인 후 카드 ✓ 상태(버퍼에 영속)
}
```

- **제안 경계 = PlanPatch 필드 수정만.** creative-weight는 구조값이라 v1 제안 대상 제외(손 staged는 그대로). 인물 추가/삭제·헌장·제목은 직행 영역 — 제안 불가.
- `buildPlanChatCatalog(project)` — **구조체 반환** `{ text, characterIds, worldIds, canonIds }`. `text`는 프롬프트에 싣는 카탈로그(인물 전원 id+3필드 현재값·세계 rule 전원 id+제목·캐논 **최근 40개** id+statement·스토리코어 5필드 현재값, 값 **80자 절단**), id 집합들은 normalize의 targetId 실존 검증용(텍스트 substring 매칭 금지 — 절단 값 우연 일치 오검증 방지). 캐논 상한 40은 `CONTEXT_CANON_LIMIT` 선례를 따르되 그 상수가 storyEngine 비export라 planChat.ts 자체 상수로 둔다.
- `buildPlanChatTranscript(messages, limit=8)` — 최근 8메시지를 `작가:/파트너:` transcript로(dive `buildRecentDialogue` 동형).
- `normalizePlanChatResponse(raw, catalog)` — reply trim(비면 실패 취급), proposals는 ⓐ kind 4종 외 버림 ⓑ targetId가 카탈로그에 없으면 버림(canon/world/character) ⓒ field가 kind별 화이트리스트 밖이면 버림 ⓓ after 빈 것 버림·trim ⓔ rationale trim+120자 캡(비면 '' 허용) ⓕ 같은 (kind,targetId,field) 턴 내 중복 첫 것만 ⓖ **턴당 상한 3**. 무효는 조용히 드랍(강등 관례) — reply만 남아도 정상 턴.
- `storage.ts` — `planChatKey = 'serial-story-studio/plan-chat'` · `PlanChatState { schema: 'storyx/plan-chat/v1', messages }` · load(스키마 불일치·파싱 실패 → [])/save/clear. **버퍼 cap 최근 40메시지**(저장 시 절단). `syncVersion` remount·새로고침 생존이 목적(결정 ④).

### 2.2 LLM 왕복 — 6점 배선 (vs-candidates 선례)

- **입력** `PlanChatInput { medium, format, activeSection, contextDigest, catalog, dialogue, query }` — contextDigest·catalog는 **overlayProject 기준**(파트너가 현 설계안이 반영된 상태를 보고 대화). digest는 `buildProjectContextDigest` 재사용.
- **프롬프트** `buildPlanChatPrompt` — 섹션: 역할(단일 설계 파트너 — 바이블 큐레이터 성격, 작가의 설계를 다듬는 조력자. 지시가 아니라 제안·질문. 결말 헌장 불가침)/작품 컨텍스트(digest)/엔티티 카탈로그/지금 보는 섹션(activeSection)/최근 대화/작가의 말/지시(제안은 0~3개·카탈로그의 실존 id만·kind별 필드 경계·근거 한 문장·제안 없이 대화만 해도 됨)/출력 형식.
- **출력 JSON 계약** (핀 상수 · 미러 byte-identical)

```
  "reply": "...", "proposals": [{ "kind": "character", "targetId": "...", "field": "desire", "after": "...", "rationale": "..." }]
```

- **6점** — ① vite.config.ts `storyxBridge('/api/plan-chat')`(플래그: --medium --format --section --context --catalog --dialogue --query) ② tools/storyx.mjs `plan-chat` 커맨드(mock 분기·runProviderWithRetry·proposals 배열 체크만 하고 무가공 통과) ③ promptBuilders.ts `buildPlanChatPrompt`(+storyx.mjs 미러 — 핵심 지시문·JSON 계약 byte-identical, 핀 테스트가 계약+지시문 전문 둘 다 문다[vs-mirror 보강 선례]) ④ `api/plan-chat.ts` prod Function(buildPrompt+runLlmJson, 무가공 통과 — 정규화는 카탈로그가 필요해 클라이언트 전용) ⑤ `src/lib/planChatClient.ts` `requestPlanChat`(= _run + reportAiCall, 실패 전부 `{ok:false, reason}` 강등, throw 없음) ⑥ aiStatus.ts `AiCallMode`에 `'plan-chat'` 추가(exhaustive switch `aiCallModeLabel`에 라벨 「설계 대화」 동반 — tsc가 강제).

### 2.3 UI — dock 「✦ 설계」 패널 + `PlanChatPanel`

- `FloatingDataWorkspace` — `DataPanelId`에 `'design'` 추가, dock 버튼 「✦ 설계」, 패널 내용은 새 prop `designSlot?: ReactNode` 렌더(워크스페이스는 얇게 유지, 조립은 StoryXDesk).
- 신규 `src/components/PlanChatPanel.tsx`(순수 표현) — props `{ messages, busy, note, harnessPreview, onSend(text), onApproveProposal(messageId, index) }`. 렌더: 하네스 미리보기 줄(§2.4) → 버블 목록(user/partner) → partner 버블 밑 제안 카드(kind 한글 라벨+대상 라벨+after+근거+「설계안으로」 버튼, `approved`면 ✓ 「설계안 (미반영)」 비활성) → 실패 note → 입력+보내기(busy 중 비활성, "응답에 수십 초 걸릴 수 있어요" 안내).
- **StoryXDesk 배선** — `planChatMessages` state(loadPlanChatMessages 초기화, effect로 save) · `sendPlanChat(text)`: user 메시지 append→`requestPlanChat`(digest·catalog=overlayProject, dialogue=transcript, activeSection)→성공 시 partner 메시지+proposals append, 실패 시 note 강등 · `approvePlanProposal(messageId, index)`: kind 스위치로 **기존 stage\* 핸들러 호출**(character→`stageCharacterMemory(targetId, field, after)` · world→`stageWorldMemory(targetId, after)` · canon→`stageCanonMemory(targetId, after)` · story-core→`stageStoryCore(field, after)`) 후 해당 proposal `approved: true`로 버퍼 갱신. before는 핸들러가 본편에서 읽음 — upsert 불변식(최초 before 유지·원복 소멸)·D6(logCanonChange 없음) 자동 상속.
- **CSS** — 새 `.fc-pd-design`·`.pcp-*` 클래스, 중립은 `--st-*` 토큰·악센트는 PLAN 모드색 `--st-mode-plan`. 새 transition/animation을 달면 `--st-dur-*`/`--st-ease`만 + reduced-motion 블록 등록(styles.studio.test).

### 2.4 하네스 점수 미리보기 (접근안 2)

- StoryXDesk의 기존 `harnessReport` useMemo(committed 기준)와 동일한 입력 매핑으로 `overlayHarnessReport` useMemo(overlayProject 기준) 추가 — `runStoryHarness`는 순수 함수라 재채점 저비용. 입력 중 `qualityGatesReport`는 **committed 것을 재사용**(게이트 입력은 latestProse 기반이라 패치 가능 필드의 영향이 사실상 없음 — 재유도 비용 회피, 명시 결정).
- `harnessPreview = planPatches.length > 0 ? { before: harnessReport.qualityScore, after: overlayHarnessReport.qualityScore, count: planPatches.length } : null` — 패널 상단 "하네스 {before} → {after} · 설계안 {count}건 반영 시" 한 줄(전후 동점이어도 표시 — 변화 없음도 정보). LLM 무관.

### 2.5 회귀 테스트 동봉 — PR #20 잔여 MEDIUM

- **clear+remount 불변식**(버리기/반영 후 옛 StoryXDesk 인스턴스가 스테일 패치를 재저장하지 않는다)의 자동 회귀 테스트를 이 슬라이스에 포함한다 — PLAN staged를 다시 만지는 조각이 바로 이것.
- 방법은 계획 단계에서 확정 — 1순위: react-dom 클라이언트 마운트로 "패치 저장 effect를 가진 컴포넌트 mount→stage→unmount→clearPlanPatches→fresh mount" 시나리오를 재현해 localStorage `plan-stage`가 빈 상태로 유지됨을 단언(App 전체 마운트가 무거우면 동일 effect 배선의 축소 하네스). 함께 — plan-chat 버퍼의 remount 생존(save→unmount→load 왕복) 단언.

## 3. 불변식

- **PLAN staged 계승** — App key=`syncVersion`만(새 key 축 금지) · 반영/버리기·충돌 게이트(기본 keep·충돌 0 즉시)는 무접촉 · staged 편집 logCanonChange 없음(D6) · WRITE 즉시 저장 무접촉.
- **승인 경로는 stage\* 핸들러 재사용** — 채널이 upsertPlanPatch를 직접 부르지 않는다(불변식 이중 구현 금지).
- **제안 경계** — 기존 엔티티 필드 수정만. 인물 CRUD·헌장·제목·creative-weight 제안 불가(정규화가 드랍).
- **LLM 호출은 사용자 발화 시에만** — 자동 호출·폴링 0. 실패는 note 강등, throw 없음.
- **프롬프트 미러 byte-identical** — promptBuilders ↔ storyx.mjs, 핀이 JSON 계약+지시문 전문을 문다.
- **PLAY·WRITE 무접촉** — dive 계열·FloatingEditor·에디터 저장 경로 변경 없음.

## 4. 테스트 계획 (TDD)

1. `planChat.test` — normalize: ⓐ 유효 4kind 보존 ⓑ 없는 targetId·kind 외 값·빈 after 드랍 ⓒ field 화이트리스트(character에 logline 불가 등) — **story-core `'title'` 드랍 케이스 필수 핀**(`stageStoryCore('title')`은 staged가 아니라 본편 직행이라, 이 화이트리스트가 승인→즉시 쓰기 우회를 막는 유일한 문) ⓓ 중복 (kind,targetId,field) 첫 것만 ⓔ 상한 3 ⓕ rationale 120자 캡 · catalog: 캐논 40 상한·80자 절단·id 집합 반환 · transcript: 최근 8·역할 라벨.
2. `storage.test` — plan-chat load/save/clear·스키마 가드·40메시지 cap.
3. `promptBuilders.test` — 지시문(제안 0~3·실존 id·헌장 불가침) 포함 + JSON 계약 핀 + [plan-mirror] storyx.mjs 계약·지시문 전문 동기화.
4. `planChatPanel.test`(renderToStaticMarkup) — 버블 렌더·제안 카드(라벨·근거·버튼)·approved ✓ 비활성·harnessPreview 줄·빈 메시지면 안내.
5. `floatingDataWorkspace` 관련 테스트 — dock 「✦ 설계」 버튼·designSlot 렌더(기존 패널 테스트 관례 따름).
6. 회귀(§2.5) — clear+remount 시나리오 + plan-chat remount 생존.
7. StoryXDesk 배선은 tsc+라이브(대형 파일 마운트 비용 — editorFocusLayout 소스 단언 관례 필요 시 추가).

## 5. 비목표

- 섹션별 페르소나 스위칭(전문 시선은 후속 — 제안 카드 관점 라벨로 흡수 가능) · 결정론 신호 주입(접근안 3 — 미회수 약속·충돌·조기 소진) · 인물 추가/헌장/무게중심 제안 · 제안 자동 staged(승인 없이) · 대화 요약/압축 고도화(cap 절단만) · 하네스 스테이지별 상세 미리보기(총점 한 줄만) · PLAY/WRITE 채널 확장.

## 6. 검증 (DoD)

- `npm test`·`npm run build`·`bash init.sh` 녹색.
- 라이브(preview, ch23 백업) — ① PLAN 진입→dock 「✦ 설계」→패널 렌더 ② 실 codex 대화 왕복(reply 도착) ③ 제안 카드 도착→「설계안으로」→워크벤치 필드에 「설계안 (미반영)」 태그+SyncConsole 「✦ PLAN +N」 증가 ④ 하네스 미리보기 줄 표시 ⑤ 반영(remount) 후 대화 버퍼 생존 ⑥ 콘솔 에러 0.
- 제안 정규화 강등 확인 — 무효 제안(mock 또는 관찰)에서 카드 미렌더·대화 정상.
