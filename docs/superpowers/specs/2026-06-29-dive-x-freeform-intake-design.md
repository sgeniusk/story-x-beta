# Dive X 자유 서술 진입 설계 (앞문을 카드 선택에서 대화로)

> Dive 앞문을 "소재 + 신기성 다이얼 + 후보 카드 4장 중 선택"에서 **"자유 서술 한 칸에 인물·상황을 주관식으로 쓰면 시스템이 주인공·관계인물·첫 장면을 뽑아 바로 대화로 진입"**으로 바꾼다. dogfooding 학습에서 출발.

- 작성 2026-06-29
- 상태 draft (브레인스토밍 합의 완료 → 구현 계획 대기)
- 선행 — 제안 엔진 v1(`2026-06-28-dive-x-proposal-engine-design.md`, **main 머지 완료**). 본 스펙은 그 앞문을 교체하고, 제안 카드를 보조로 강등한다.
- 브랜치 — 신규(예: `feat/dive-x-freeform-intake`).

---

## 1. 동기

제안 엔진 v1 dogfooding 학습 — **카드에서 고르는 순간 자유도와 "특이성 때문에 자꾸 시도하게 되는 재미"가 죽는다.** 메뉴 선택은 emergent한 맛을 없앤다. 사용자 원안 — "대화로 시작하되, 상대·배경을 자유롭게 주관식으로 답하면 알아서 주인공·관계인물을 설정하고, 어드벤처 게임처럼 어디 간다·누구와 대화 같은 선택으로 이야기를 계속 만든다."

이 학습은 제안 엔진 스펙이 예고한 판정 루프(사용자 만족이 판정 기준·반복 대상)가 작동한 결과다. 카드는 버리지 않고 **보조(영감용)**로 내린다.

이미 있는 것 — scene-showrunner(자유 장면 서술 + 멀티 인물 연기)·dive-chat `choices`(어드벤처식 선택지)·arc ⏭전개·응결 시 인물 자동 추출. **빠진 것은 앞문 하나** — *진입 시점*에 자유 서술에서 주인공·관계인물·첫 장면을 세팅하는 단계.

## 2. 합의된 결정

| 갈림길 | 결정 |
|---|---|
| 앞문 모양 | **자유 서술 한 칸**(주관식 textarea) + 시작하기. (A안) |
| 추출 | 자유 서술 → **단일 세팅** `{scene, cast, myRole}`(후보 모양에서 twist·novelty 제거). |
| 진입 | **바로 진입** — 승인 다이얼로그 없이 곧장 DiveDesk. 인물은 응결 전 soft seed라 하드 캐논 아님(승인형 원칙 안 깸). |
| 안전장치 | 🎬 현재 장면 즉시 편집 가능 + "다시 쓸게요"로 앞문 복귀. |
| 제안 카드 | 삭제 안 함 — **"막히면 제안 받기" 보조**로 강등(자유 서술 아래 패널). |
| 어드벤처 선택지 | 이미 있음(dive-chat choices·arc). **이 슬라이스 범위 밖** — 명시적 이동/대화 액션화는 다음 조각. |

## 3. 시스템 설계 — 단위와 경계

### 3.1 신설/수정 단위

- **`src/lib/diveProposal.ts`** (수정·소) — `DiveSetup` 타입 신설 `{ scene: string; cast: CastSeed[]; myRole: string }`. `seedFromProposal`의 파라미터 타입을 `Pick<DiveProposal, 'scene' | 'cast'>`(구조적 부분집합)으로 느슨하게 — 이미 `p.scene`·`p.cast`만 읽으므로 본문 무변경, `DiveSetup`·`DiveProposal` 둘 다 받게 됨. TDD로 `DiveSetup` 시딩 케이스 추가.
- **`tools/storyx.mjs`** — `dive-setup` 커맨드 신설. 입력 = 자유 서술 텍스트. 프롬프트 = "사용자가 쓴 서술에 **충실하게** 주인공(myRole)·관계인물 2~3(cast)·첫 현재 장면(scene)을 뽑아라. 비틈 추가 금지 — 서술을 존중." 출력 JSON `{ scene, cast, myRole }`. claude 분기 고급 모델·mock 폴백(빈 서술 → 일반 시작 1종).
- **`vite.config.ts`** — `/api/dive-setup` 브리지 라우트 1개(기존 dive 라우트 동형). `--story` 플래그로 자유 서술 전달.
- **`src/lib/diveClient.ts`** — `requestDiveSetup(req: { story: string }): Promise<DiveSetupResponse>`. `DiveSetupResponse = { status; setup: DiveSetup | null; warning? }`. 견고 파서(누락·잘림 → setup null + 경고).
- **`src/components/DiveStart.tsx`** (재구성) — 1차 표면 = 자유 서술 textarea("어떤 인물과, 어떤 상황에서 시작하고 싶어요?") + **시작하기**. 제출 → `requestDiveSetup` → 성공 시 `onStart(setup)`. 그 아래 접이식 **"막히면 제안 받기"** — 펼치면 기존 신기성 다이얼 + 제안 카드 흐름(자유 서술을 topic으로 `requestDiveProposals`). 카드 선택은 기존대로 `onPick(proposal)`.
- **`src/App.tsx`** — `onStart(setup)`·`onPick(proposal)` 둘 다 `seedFromProposal`로 시드(같은 경로). 빈 추출(setup null)이면 앞문 유지 + 안내.
- **`src/styles.css`** — `.dx-start-story`(큰 textarea)·`.dx-inspire-toggle`(보조 접이식). 기존 `.dx-*` 다크 hex 팔레트.

### 3.2 데이터 흐름 한 바퀴

1. `stage=dive`, 저장 세션 없음 → `DiveStart`(자유 서술 1차).
2. 사용자가 인물·상황을 주관식으로 씀 → 시작하기 → `requestDiveSetup` → `/api/dive-setup` → `{scene, cast, myRole}`.
3. `seedFromProposal(setup)` → `SeriesProject`(cast 승격) + `DiveSession`(primary, scene 세팅) → 영속 → 바로 `DiveStage`.
4. DiveDesk에서 scene-showrunner·choices·응결 루프 무변경. 잘못 뽑혔으면 🎬 장면 편집 or 뒤로.
5. (보조) 막막하면 "제안 받기" 펼쳐 카드 → 선택 시 동일 시드 경로.

## 4. 비목표 (YAGNI)

명시적 이동/대화 액션 UI(선택지 강화)·취향 프로필·스티어링·승인 다이얼로그·실결제·세팅 수동 편집 폼·다회차 재추출. 전부 다음 조각.

## 5. 리스크

- **추출 품질** — 자유 서술이 빈약하면 빈/얕은 세팅. 완화 — 견고 파서(null 폴백 + "조금 더 적어주세요" 안내)·🎬 장면 즉시 편집·"다시 쓸게요". 질감 평탄은 Story X 품질 로드맵과 같은 벽.
- **충실성 vs 밋밋함** — "비틈 금지·서술 존중"이 너무 충실해 밋밋할 수 있음. 그건 의도 — 특이성은 사용자 서술과 이후 대화·선택에서 emergent하게. 영감이 필요하면 보조 카드.
- **앞문 회귀 테스트** — DiveStart 재구성이 제안 카드 경로(기존 테스트)를 깨지 않게. 카드 흐름은 보조로 보존.

## 6. 검증 (Definition of Done — 프로토타입)

- `npm test` 녹색 — `diveProposal.test.ts`(`DiveSetup` 시딩 케이스) + `diveClient.test.ts`(`requestDiveSetup` mock·null 폴백) + `diveStart.test.ts`(자유 서술 textarea·시작하기·보조 토글 렌더) + 기존 회귀(제안 카드 경로 유지).
- `npm run build`·`tsc --noEmit` 통과.
- 라이브 한 바퀴 — 자유 서술 입력 → 시작하기 → 바로 DiveDesk(서술 반영된 scene·cast 시딩) → 대화 한 턴, 콘솔 0. 보조 "제안 받기"도 동작.
- 새 생성 동작 TDD 먼저. Linear 다크 토큰 유지. 한국어 UI 간결.
- 판정 기준(사용자 만족) — 자유 서술 진입이 "자유도·자꾸 시도하게 되는 재미"를 되살리는지 dogfooding 반복.
