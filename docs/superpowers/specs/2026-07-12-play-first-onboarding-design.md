# PLAY-first 온보딩 — 소설류 기본 진입 (2026-07-12)

## 방향 (비전 — 이 슬라이스보다 큰 북극성)

**PLAY(대화)가 Story X의 기본 창작 진입이다.** 2026-07-12 dogfooding에서 사용자가 실측한 문제 — first-run이 초안(1화)을 먼저 완결로 써버린 뒤 PLAY에 들어가면, 방금 읽은 텍스트를 뒤따라가는 추체험이 되어 플레이가 죽는다. 해법은 순서 반전이다. 매체 선택(형식+분량)이 플레이의 *대화 결*을 결정한다.

- 소설 → 세계 안에서 인물과 롤플레이 (이번 슬라이스)
- 에세이 → 친구·선생님·가족과 수다 떨듯, 인터뷰 받듯 대화 → 자연스럽게 글로 (후속 — `essay-interviewer`·`interview-curator` 페르소나가 이미 존재, 재해석 대상)
- 만화·학술 → 각자의 결 (후속 탐색)

어떤 매체든 대화가 먼저다. 대화가 응결되어 글이 되고, 데이터(캐논·바이블)가 되고, WRITE/PLAN 모드로 확장된다. 「인터뷰로 초안 만들기」는 별도 본선이 아니라 보조 경로로 재배치된다.

## 이번 슬라이스 목표

소설류(medium `novel`, 전 format)에서 **자유 서술 다음 기본 CTA를 「플레이로 시작」으로** 만든다. 자유 서술 → 단발 검토·제안 1콜(또는 프리셋 선택 0콜) → 확인 카드 → 최소 프로젝트 생성 → 바로 `stage='dive'` 진입. 이후 응결·⟳최신화·PLAN은 전부 기존 경로 무접촉 재사용.

사용자 결정 5건 (2026-07-12 brainstorming)
1. 배치 — 자유 서술 다음. 소설류는 **플레이가 기본**, 인터뷰→초안은 보조 강등.
2. 설정 단계 — 단발 검토·제안 1콜 (`requestDiveSetup` 재사용). 기존 인터뷰 질답은 이 경로에서 안 거친다.
3. 확인 UX — 확인만 하고 바로 플레이. 수정 UI 없음(수정은 플레이 중/이후 PLAN에서).
4. 프리셋 — 게임의 커스텀 vs 프리셋 캐릭터 구도. 이번엔 기존 `DIVE_SEED_CHARACTERS` 3종 재활용(신규 저작 0).
5. 제안 수준 — **"인물은 진하게, 세계·플롯은 얕게."** 인물은 desire·wound·voiceRules까지(엔진 하한), 세계는 씨앗 한 줄, 플롯은 첫 장면 훅 하나. 헌장·결말·회차 구조는 의도적으로 비워둔다(상한 — 이미 정해진 걸 뒤따라가는 플레이 재발 방지).

## 흐름

```
매체 선택 → 자유 서술 → [소설류 분기]
  ├─ 「플레이로 시작」 (기본 hx-btn) → HomeFlowStep 'playseed' 패널
  │    ├─ 자유 서술 있음 → requestDiveSetup 1콜 → 제안 카드 채움
  │    ├─ 프리셋 3칩 (DIVE_SEED_CHARACTERS) → 클릭 시 0콜 즉시 카드 채움
  │    └─ 「이대로 시작」 → buildPlayFirstProject → saveProject + saveDiveState
  │         → 온보딩 draft 청소 → setDiveInit → setStage('dive')
  └─ 「인터뷰로 초안 만들기」 (보조 hx-btn-ghost) → 기존 인터뷰→헌장→building 경로 무변경
비-소설 매체 → 기존 경로 그대로 (이번 슬라이스 무접촉)
```

## 확인 카드 ('playseed' 패널)

- 내용 — 인물 카드(이름·역할·욕망 한 줄)·첫 장면·내 역할.
- **주의사항 고정 문구(테스트 핀)** — "이 설정은 정확하지 않아도 됩니다 — 플레이하며 완성해나가는 초안입니다."
- 프리셋 칩 3종 상시 노출. 자유 서술이 빈약해도 프리셋으로 시작 가능.
- 커스텀 제안 실패/불충분(`setup: null`) — 기존 DiveStart 문구 재사용("조금만 더 적어주세요 — 누구와, 어디서, 무슨 상황인지 한두 줄이면 충분해요").
- 제안 대기 — 로딩 상태 문구 + 경과 표시(기존 `generationProgress` 패턴 재사용 여부는 구현 계획에서, dive-setup 콜은 draft보다 짧다).

## 프로젝트 생성 글루 (순수 함수 — TDD 핵심)

`buildPlayFirstProject(setup, { medium, format })` 신규 (`src/lib/playEntry.ts`).

- `seedFromProposal`(기존, diveProposal.ts) → cast를 CharacterProfile로 (desire·wound·voiceRules 보존).
- `createEmptyProject` + 인물 등록, **회차 0**, medium/format 반영. 제목은 myRole/scene 앞 20자 파생(옛 `seedAndEnter` 규칙, 커밋 `6a95a52` 참조).
- `createDiveSession(primaryCharacterId, project.id)` + **제안된 첫 장면을 세션 scene으로 직접 주입** — 0회차라 `deriveContinuationScene` 폴백이 빈 문자열인 것을 우회. `seedPlayFromProject`는 이 경로에서 안 쓴다.
- 반환 `{ project: SeriesProject, diveState: DiveState }`.

프리셋→setup 변환 — `DIVE_SEED_CHARACTERS[i]` → `{ scene: background, cast: [character를 CastSeed로], myRole: '' }` 형태의 순수 변환 함수 동반.

승인 시 App 순서 — ① `saveProject(project)` (committed 본편 생성 — 온보딩 졸업의 관할, PLAY 읽기 전용 불변식과 무충돌) ② `saveDiveState(diveState)` + `setDiveInit(diveState)` ③ `clearOnboardingDraft()` ④ `setStage('dive')`.

## 불변식

- 기존 인터뷰→헌장→초안 온보딩 경로 **로직 무변경** (CTA 위계만 조정).
- 비-소설 매체(에세이·만화·학술·오디오북 등) 온보딩 **무접촉**.
- PLAY committed 읽기 전용 유지 — dive 진입 후 쓰기는 diveKey working·⟳최신화만(기존 그대로).
- 응결·⟳최신화·PLAN·연속성 게이트 무접촉 재사용.
- 설정 깊이 상한 — 헌장·결말·회차 구조·세계 규칙 세부는 만들지 않는다.
- 스토리 바이블 형태 보존(`createEmptyProject` 재사용) · `normalizeProject` 관문 통과 형태.
- 프리셋 신규 저작 0.

## 테스트 (TDD 순서)

1. 순수 — `buildPlayFirstProject`: cast→characters 변환·제목 파생·scene 주입·회차 0·medium/format 반영·primaryCharacterId 일치. 프리셋→setup 변환 3종.
2. 컴포넌트 — playseed 패널: 주의사항 문구 핀·프리셋 3칩 렌더·제안 카드 렌더·「이대로 시작」 승인 콜백·setup null 안내 문구.
3. 소설류 자유 서술 단계 CTA 위계(플레이 기본·인터뷰 보조) + 비-소설 무변경 회귀.
4. 라이브 게이트 — 빈 상태에서 자유 서술→「플레이로 시작」→제안 카드→dive 진입→대화 1턴→응결→⟳최신화로 1화 본편 합류까지 통짜. 프리셋 0콜 경로 별도 확인. 콘솔 에러 0.

## 비목표 (후속)

- 에세이 대화형 플레이(친구/인터뷰어 결) — 다음 슬라이스. `essay-interviewer`·`interview-curator` 재해석.
- 플레이 중 「초안 만들기」/인터뷰 트리거 노출(DiveDesk 내) — 응결이 이미 회차화 경로라 급하지 않음.
- 장르 프리셋 팩 확장(로판·스릴러·무협 등 세계+인물+첫 장면 패키지) — dogfooding 후.
- 매체별 대화 결 분리 구조(플레이 페르소나 스위칭) — 비전 문서 영역.
- 온보딩 `?stage=` 딥링크·프로젝트 목록에서 플레이 직행.

## 검증 참고

- 인물 있는 0회차 프로젝트에서 PLAY가 도는 것은 PR #23 라이브 7게이트에서 기검증.
- 옛 Dive X 표면(프로젝트 없는 dive)은 부활시키지 않는다 — PR #21이 제거한 데이터 위험 클래스.
