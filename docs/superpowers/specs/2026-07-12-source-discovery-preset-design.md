# 온보딩 소재발굴 재설계 — S1 프리셋 갈래 (2026-07-12)

## 방향 (재설계 전체 — 이 슬라이스보다 큰 그림)

PR #33(PLAY-first 1차)을 사용자가 직접 써본 뒤 같은 날 심화 확정한 재설계([[play-first-paradigm]]). 온보딩 2단계를 **소재발굴**로 개편하고 3갈래로 연다.

1. **자유 서술** (현행) — 이후 S3에서 적응형 인터뷰로 연결.
2. **함께 구상** — 작가진과 채팅으로 소재를 캐냄 (S2).
3. **인기 프리셋** — 루프 회귀물·부자 되는 이야기 등 인기 구성으로 즉시 시작 (**이 슬라이스 S1**).

브레인스토밍 확정 결정 6건 (2026-07-12)
1. **엔진 통합** — "함께 구상"과 적응형 인터뷰는 하나의 온보딩 대화 엔진(onboard-chat)의 두 진입점. plan-chat 패턴 미러(순수 모듈+클라이언트+dev 브리지+**prod Function 필수** — dive-*의 prod 누락 반복 금지). S2 관할.
2. **종료 산출** — 온보딩 대화가 "됐다"고 판단하면 플레이 시드(DiveSetup)로 응결, 마지막 턴에 대화 상대 선택 → playseed 확인 카드 → dive. S2/S3 관할.
3. **3갈래 UI** — 선택 스텝 → 갈래별 패널. 소재발굴 진입 시 3장 카드 선택 화면 먼저, 선택 후 각 갈래 전용 패널.
4. **프리셋 스키마** — 신규 StoryPreset 구성 단위(캐릭터 단위 DIVE_SEED_CHARACTERS와 별개). keywords 필드가 S3 유사-앵커 비교 제안의 데이터 기반.
5. **매체 범위** — 소설류(novel)만. 비소설은 기존 경로 무접촉.
6. **슬라이스** — S1 프리셋 먼저 → S2 엔진+함께 구상 → S3 적응형 인터뷰.

## S1 목표

소설류 온보딩에서 매체 선택 다음을 **소재발굴 선택 스텝**으로 바꾸고, **인기 프리셋 갈래**를 LLM 0콜로 완주 가능하게 만든다 — 프리셋 선택 → playseed 확인 카드(휴면 부활, 상대 선택 추가) → dive 진입. 자유 서술 갈래는 기존 freewrite 패널로 연결(현행 인터뷰 경로 유지), 함께 구상 갈래는 「준비 중」 비활성 노출.

## 흐름

```
매체 선택 → [소설류 분기]
  ├─ 소재발굴 선택 스텝 'source' (3장 카드)
  │    ├─ 「자유 서술」 → 기존 freewrite 패널 (CTA 「인터뷰로 계속」 무변경)
  │    ├─ 「함께 구상」 → 비활성 「준비 중」 (S2)
  │    └─ 「인기 프리셋」 → 'preset' 패널 (StoryPreset 카드 목록: 제목+훅)
  │         └─ 프리셋 클릭 → setPlaySetup(preset.setup) 0콜 → 'playseed' 확인 카드
  │              └─ 상대 선택(기본 cast[0]) → 「이대로 시작」 → buildPlayFirstProject
  │                   → handleStartPlay (saveProject→setWorkTitle→saveDiveState
  │                      →clearOnboardingDraft→setStage('dive'))
비-소설 매체 → 기존 medium→freewrite 직행 무변경
```

## StoryPreset 데이터 모듈 (신규 `src/lib/storyPresets.ts`)

```ts
export interface StoryPreset {
  id: string;
  title: string;        // 구성 이름 — 예: '루프 회귀물'
  hook: string;         // 한 줄 훅 — 카드에 노출
  keywords: string[];   // 유사도 앵커 (S3 비교 제안용 — novelPersonas matchKeywords 결)
  setup: DiveSetup;     // scene·cast(2~3인, desire·wound·voiceRules 진하게)·myRole
}
export const STORY_PRESETS: StoryPreset[];
```

- **5~6종 수작업 저작** — 루프 회귀물·재벌/부자 되기·로맨스 판타지·헌터/게이트물 등 인기 구성. 각 프리셋의 cast는 상대역 포함 2~3인, myRole은 사용자가 연기할 주인공 입장 한 줄.
- **설정 깊이 원칙** — 인물 진하게(desire·wound·voiceRules 필수), 세계/플롯 얕게(scene은 첫 장면 훅 하나). 헌장·결말·회차 구조 선결정 금지.
- **cast에 myRole 미포함** — dive-setup 백로그(cast[0]=상대역 구조와 충돌)를 수작업 데이터에선 원천 차단.
- 기존 `DIVE_SEED_CHARACTERS` 3종(캐릭터 단위)은 무접촉 잔존 — PlaySeedPanel 칩 배선 그대로.

## HomeFlowStep·영속

- `HomeFlowStep`에 `'source'`·`'preset'` 추가 (projectBlueprint.ts, 8값 유니온).
- **불변식** — `isHomeFlowStep`(storage.ts)에 두 값 반드시 추가(누락 시 복원이 medium 롤백).
- OnboardingDraft 확장 불요 — 갈래 선택은 homeFlowStep 값 자체가 표현(source/freewrite/preset). 단 `playSetup` blind-cast(storage.ts:421)에 **shape 가드 동반 수리**(scene/cast/myRole 형태 검증, 백로그 흡수).

## playseed 확인 카드 — 상대 선택 추가

- `PlaySeedPanel`에 cast 목록 중 **대화 상대 선택** UI 추가(기본 cast[0] 선택 상태). 프레젠테이션 전용 유지 — 선택 상태는 props로.
- `buildPlayFirstProject(setup, meta, partnerIndex?)` — 선택 인덱스를 primaryCharacterId에 반영(`seedFromProposal`의 characters[0] 고정 완화). 미지정 시 0 (기존 동작·기존 테스트 보존).
- 기존 핀 유지 — 주의사항 고정 문구("이 설정은 정확하지 않아도 됩니다…")·`handleStartPlay` 순서 핀.

## 인디케이터·슬라이드 인덱스

- 소설류 `homeFlowSteps`는 freewrite 항목 자리를 `source`(라벨 「소재발굴」)로 교체. 갈래 패널(freewrite/preset)은 source와 같은 슬라이드 인덱스 공유(playseed→buildingPanelIndex 공유 방식 준용).
- 비소설 `homeFlowSteps`는 기존 그대로(freewrite 항목 유지).
- `homeFlowIndex` 계산에 preset/freewrite(소설류) 특례 반영. `playseed`는 기존대로 buildingPanelIndex 공유.

## 테스트 핀 갱신 (의도적 — 약화 아님)

- `appExperience.test.ts` "인터뷰 단일 CTA(파킹)" 핀 → 소재발굴 3갈래 구조 핀으로 교체 — source 스텝 존재·3장 카드(자유 서술/함께 구상/인기 프리셋)·함께 구상 비활성·프리셋 갈래 배선.
- playseed 핀('playseed' 존재·PlaySeedPanel 배선)은 도달 가능 상태 핀으로 승격. `handleStartPlay` 순서 핀 유지.

## 테스트 (TDD 순서)

1. 순수 — `STORY_PRESETS`: 5~6종·id 고유·각 setup 유효(scene 비지 않음·cast≥1·각 cast 인물에 desire/wound/voiceRules·myRole 비지 않음·cast 이름에 myRole 표현 미중복)·keywords 비지 않음.
2. 순수 — `buildPlayFirstProject` partnerIndex: 지정 시 해당 인물이 primaryCharacterId·미지정 시 기존 동작 무회귀.
3. storage — playSetup shape 가드: 정상 라운드트립 유지·손상 shape({}·cast 비배열 등)는 null 강등.
4. 컴포넌트 — PlaySeedPanel 상대 선택: cast 2인 이상일 때 선택 UI 렌더·기본 cast[0]·선택 콜백.
5. 소스 핀 — source 스텝·3장 카드·비소설 무변경·isHomeFlowStep 포함.
6. 라이브 게이트 — 빈 상태에서 소설 선택→소재발굴 3장 카드→프리셋 갈래→프리셋 선택→확인 카드(상대 선택)→dive 진입→대화 1턴. 비소설(에세이) 기존 경로 회귀. 새로고침 시 source/preset 복원. 콘솔 에러 0.

## 불변식

- 기존 인터뷰→헌장→building 경로 **로직 무변경**(소설류 진입 동선만 변경).
- 비-소설 매체 온보딩 무접촉.
- PLAY committed 읽기 전용·`normalizeProject` 관문·스토리 바이블 형태·디자인 토큰(`--st-*` 원천) 무접촉.
- 프리셋에 헌장·결말·회차 구조 선결정 금지.
- 프리셋 갈래는 LLM 0콜(requestDiveSetup 미호출).

## 비목표 (후속 슬라이스)

- S2 — onboard-chat 엔진(planChat 미러) + 함께 구상 갈래 활성화.
- S3 — 적응형 인터뷰(자유 서술 재배선·입력 유형 선분석·프리셋 유사-앵커 비교 제안·상대 선택 마지막 질문).
- 플레이→이전 단계 복귀 동선(프로젝트 생성 후라 별도 설계).
- dive-setup 프롬프트 정련(myRole/cast 중복 — LLM 경로, S3에서 코드 방어 검토).
- 에세이 대화형(essay-interviewer 재해석)·비소설 소재발굴 확장.
