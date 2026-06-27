# Dive X 장면 연출 + 쇼러너 채널 설계

> Dive X를 "도윤과의 1:1 관계챗"에서 "사용자가 주인공으로 장면을 연출하고, AI 쇼러너가 세계와 등장인물을 운영하는 인터랙티브 스토리"로 확장한다. dogfooding 중 사용자 요청에서 출발.

- 작성 2026-06-27
- 상태 draft (브레인스토밍 합의 완료 → 구현 계획 대기)
- 선행 — Dive X 가벼운 로컬 프로토타입(`docs/superpowers/specs/2026-06-27-dive-x-light-prototype-design.md`, 작동 중·2화까지 응결 확인). 본 스펙은 그 위에 얹는다.
- 브랜치 `feat/dive-x-scene-showrunner`

---

## 1. 동기

작동 프로토타입을 사용자가 dogfooding하며 두 가지를 요청했다.
1. **장면 연출** — "현재 장면/상황/배경"을 직접 써넣으면 그에 맞춰 반응. 예 — "도윤네 집 앞. 도윤은 학원. 가족이 외계인인지 몰래 확인하러 옴."
2. **멀티 캐릭터** — 도윤이 아닌 다른 인물(가족·외계인)도 등장. 위 장면엔 도윤이 없으므로, 응답 주체가 "도윤 한 명"일 수 없다.

여기에 사용자가 한 조각을 더 발명했다 — **쇼러너 채널**. 장면 위에서 이야기의 신/연출자에게 직접 지시("비를 내려줘", "도윤 엄마를 의심하게 만들어")하는 메타 대화. "신과 대화 = 내가 신"이라는 정서적 훅이자, 제타엔 없는 메타 연출 차별점이며, 고-레버리지 행동이라 자연스러운 **포인트 과금 자리**다.

## 2. 합의된 결정

| 갈림길 | 결정 |
|---|---|
| 응답 주체 | **AI = 쇼러너/내레이터** — 장면을 깔고 세계를 서술하고 그 자리 인물을 연기. 사용자는 주인공·연출. |
| 장면 입력 | **상단 '현재 장면' 패널(상시 편집)** — 두 채널이 공유하는 세계 상태. 비우면 1:1 대화로 하위호환. |
| 출력 형식 | **서술=평문 내레이션 블록 · 인물 대사=`화자명: 대사` 말풍선 · 행동=`*별표*` 기울임.** |
| 멀티 캐릭터 | 장면 따라 등장 → 응결 시 기존 엔진이 `characters`로 승격(승인형 캐논). 시드 도윤은 시작점, 캐스트는 자란다. |
| 쇼러너 채널 | **이번에 가볍게 포함** — 응답 + 현재 장면 고쳐쓰기(승인형)까지. 인물/캐논 직접 변경·실결제는 비목표. |
| 수익화 | 쇼러너 채널 = 설계상 과금 자리(이음새만, 로컬 검증 단계는 실결제·포인트 차감 없음). |

## 3. 시스템 설계 — 한 화면, 두 채널, 한 공유 상태

공유 상태 = **현재 장면**(`DiveSession.scene`). 장면 채널은 그 안에서 플레이하고, 쇼러너 채널은 그걸 위에서 고쳐 쓴다.

### 3.1 신설/수정 단위

- **`src/lib/diveSession.ts`** (순수)
  - `DiveSession`에 `scene?: string` 추가. `createDiveSession`은 미설정(undefined). 기존 함수 불변.
  - `parseSceneSegments(text): SceneSegment[]` 신설 — 쇼러너 응답 문자열을 줄 단위로 서술/대사 세그먼트로 파싱. `SceneSegment = { kind: 'narration' | 'dialogue'; speaker?: string; text: string }`. 규칙 — 한 줄이 `이름: 대사`(이름 1~20자, `:` 또는 `：`) 패턴이면 `dialogue{speaker,text}`, 아니면 `narration{text}`. 빈 줄 무시. 순수·TDD.
- **`src/lib/storage.ts`** — `DiveState.session.scene`는 그냥 직렬화/역직렬화에 따라감(별도 백필 불필요, optional). `parseDiveState`가 session을 그대로 통과시키므로 무변경 가능 — 단 scene 누락 구버전도 그대로 동작(undefined). 테스트로 scene 라운드트립만 핀.
- **`src/lib/diveClient.ts`** — `requestDiveShowrunner(req): Promise<DiveShowrunnerResponse>` 신설. `DiveShowrunnerRequest = { scene, context, directive }`, `DiveShowrunnerResponse = { status, reply, sceneUpdate, warning? }`.
- **`tools/storyx.mjs`**
  - `dive-chat` 프롬프트 개편(쇼러너화) — 현재 장면 주입 + 출력 형식(서술 평문 줄 / `이름: 대사` 줄 / `*별표*` 행동) + "장면에 없는 인물 등장 금지 · 사용자를 대신해 말하지 말 것".
  - `dive-condense` 프롬프트에 현재 장면 절 주입(회차가 장면 맥락 반영).
  - **`dive-showrunner` 신규** — 연출자 지시에 응답 + 현재 장면 새 제안. 출력 JSON `{ "reply": "연출자에게 하는 응답", "sceneUpdate": "바뀐 현재 장면 전체(바꿀 필요 없으면 빈 문자열)" }`. claude 분기 `--model sonnet`(고급), mock 폴백.
- **`vite.config.ts`** — `/api/dive-showrunner` 브리지 라우트 1개 추가(기존 패턴). dive-chat·dive-condense 라우트는 입력에 `--scene` 플래그 추가.
- **`src/components/DiveDesk.tsx`**
  - **현재 장면 패널** — 상단에 `🎬 현재 장면` 편집 textarea(`session.scene`). 변경 시 `onChange(scene 반영 세션, project)`로 영속.
  - **세그먼트 렌더** — 캐릭터 응답 버블을 `parseSceneSegments`로 분해 → 서술은 `.dx-narration` 블록, 대사는 화자 라벨 붙은 말풍선. 각 세그먼트 텍스트의 인라인 `*행동*`은 기존 `renderDialogue` 재사용. (사용자 버블은 기존 그대로.)
  - **쇼러너 시트** — `🪄 쇼러너` 토글 버튼 → 입력칸. 제출 시 `requestDiveShowrunner({ scene, context, directive })` → 응답을 `.dx-showrunner` 블록으로 표시. `sceneUpdate`가 비어 있지 않으면 "현재 장면을 이렇게 바꿀까요?" 미리보기 + 승인 버튼 → 승인 시 `session.scene` 갱신(승인형). 포인트 표시는 비활성 라벨(이음새).
- **`src/styles.css`** — `.dx-scene`(장면 패널) · `.dx-narration`(가운데 흐린 서술) · `.dx-speaker`(말풍선 위 이름 라벨) · `.dx-showrunner`(연출자 응답, 보라/금 톤) · `.dx-showrunner-sheet`.

### 3.2 데이터 흐름

- **장면 안 한 턴** — 사용자 메시지 + `scene` + `buildProjectContextDigest(project)` → `/api/dive-chat`(쇼러너) → `{reply}`(서술+대사 혼합) → `parseSceneSegments`로 렌더.
- **쇼러너 한 턴** — 연출자 지시 + `scene` + digest → `/api/dive-showrunner` → `{reply, sceneUpdate}` → 응답 표시 + (sceneUpdate 있으면) 승인 → `session.scene` 교체.
- **응결** — 트랜스크립트(서술+다중 대사) + `scene` → 3인칭 회차 → 승인 → `chapterFromDraftPayload`(내부 commitChapter) → 새 인물 `promoteCharactersFromCanon`으로 승격.

## 4. 출력 형식 예시 (의도 고정)

dive-chat 응답(장면 = "도윤네 집 앞, 도윤 학원, 가족 외계인 의심") —
```
도윤네 집은 불이 꺼져 있다. 현관 옆 창문이 살짝 열려 있고, 안에서 달그락거리는 소리가 난다.
도윤 母: 누구세요? *문틈으로 한쪽 눈만 내민다*
```
렌더 — 1행은 `.dx-narration` 서술 블록, 2행은 화자 라벨 "도윤 母" + 말풍선, `*문틈으로…*`는 기울임.

## 5. 비목표 (YAGNI)

쇼러너의 인물/캐논 직접 변경(장면 교체만) · 실결제·포인트 차감 · 인물 초상화 · 장면 프리셋 라이브러리 · 분기 선택지 · 수동 화자 지정 · 멀티 캐릭터 동시 그룹챗 UI. 전부 검증 통과 후.

## 6. 리스크

- **파서 오인식** — `이름: 대사` 휴리스틱이 일반 문장의 콜론을 화자로 오인 가능. 이름 길이(≤20자)·금칙 가드로 완화, 오인 시 서술로 떨어져도 치명적 아님.
- **쇼러너 sceneUpdate 신뢰** — 모델이 장면을 과도하게 바꿀 수 있어 **승인형**으로 통제(자동 교체 금지).
- **UX 템포** — 장면 패널·쇼러너 시트가 채팅 흐름을 끊지 않게 접이식/사이드로. 응결과 마찬가지로 인지 부하 주의.
- **품질** — 쇼러너·내레이션 질감은 Story X 품질 로드맵과 같은 벽. 막히면 그쪽으로 분기.

## 7. 검증 (Definition of Done — 프로토타입)

- `npm test` 녹색(신설 `parseSceneSegments`·scene 영속·showrunner 클라이언트 핀 포함), `npm run build`·`tsc` 통과.
- 새 생성 동작은 `diveSession.test.ts`/`storyEngine.test.ts`를 먼저 갱신(TDD).
- 라이브 한 바퀴 — 현재 장면 설정 → 장면 안 대화에서 서술+화자 분리 렌더 · 쇼러너에게 지시 → 응답+장면 교체 승인 → 응결까지. 콘솔 0.
- 판정 기준(사용자 만족)은 코드 DoD 밖, dogfooding 루프 목표.
