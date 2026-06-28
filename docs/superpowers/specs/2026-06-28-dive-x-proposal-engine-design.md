# Dive X 제안 엔진 설계 (소재 → 장면 전제 추천)

> Dive X 진입을 "고정 시드 캐릭터 선택"에서 "사용자가 소재 한 줄을 던지면 시스템이 서로 뚜렷이 다른 장면 전제 후보를 추천하고, 고르면 그게 scene-showrunner로 시딩되는 추천 흐름"으로 바꾼다. dogfooding 중 사용자 비전 확장에서 출발.

- 작성 2026-06-28
- 상태 draft (브레인스토밍 합의 완료 → 구현 계획 대기)
- 선행 — Dive X 라이트 프로토타입(`2026-06-27-dive-x-light-prototype-design.md`, 작동 중)·scene-showrunner(`2026-06-27-dive-x-scene-showrunner-design.md`, **코드상 구현 완료** — `scene`·`parseSceneSegments`·`/api/dive-showrunner`·arc 엔진). 본 스펙은 그 위에 진입 단계를 얹는다.
- 시장 근거 — `docs/research/2026-06-28-dive-x-market-direction.md`(전형성 편향과 싸우는 것이 제안 엔진의 진짜 일).
- 브랜치 — 신규(예: `feat/dive-x-proposal-engine`).

---

## 1. 동기

사용자 비전 — "추천 시스템처럼, 내가 간단히 말한 소재로 어떻게 진행하면 좋을지 제안하는 것이 중요하다. 준비되는 유형은 경우의 수가 셀 수 없이 많아야 하고, 그 많은 경우를 자연스럽게 이끄는 알고리즘이 Dive X·Story X에 있어야 한다."

전체 비전은 4개 하위 시스템으로 분해됐다 — ① 취향 프로필(명시+누적) · ② **제안 엔진** · ③ 방향 스티어링(내 취향대로/일부러 다르게/인기) · ④ 전개 알고리즘(기존 엔진·scene-showrunner·응결). **본 스펙은 ②만** 다룬다(첫 조각). 나머지는 그 위에 끼우는 다음 조각.

north-star(별도, 본 스펙 범위 밖) — Dive X와 Story X는 데이터 모델이 같아(연대기=`SeriesProject`, 회차=`Chapter`, 캐논=`canonFacts`/`characters`) 결국 융합된다. "Dive식으로 진입 → Story식으로 에디팅"이 같은 프로젝트의 두 표면이 된다. 그래서 제안 후보를 처음부터 공유 모델로 떨어뜨려 융합 토대를 깐다.

## 2. 합의된 결정

| 갈림길 | 결정 |
|---|---|
| 첫 조각 범위 | 제안 엔진 ②만. 취향·스티어링·누적·인기·소셜은 비목표. |
| 다양성 전략 | **각도 분산 생성(접근 A)** — 단일 LLM 호출이 N개 후보를 뱉되, 각 후보를 *서로 다른 비틈 벡터*에서 강제 생성. (생성 후 심사 패널은 v2.) |
| 신기성 통제 | 사용자는 **신기성 다이얼**(safe/tilt/bold)만 조절, 비틈 벡터 배정은 시스템이 강제. |
| 후보 모양 | 공유 모델 직결 — `scene`→`session.scene`, `cast`→`project.characters`(승인형 승격과 동형). |
| 진입 자리 | 고정 시드 자동 선택(App.tsx) 대신 "소재 → 제안 → 선택" 화면. 고정 시드는 "빈 소재 기본 제안"으로 흡수. |
| 소비 | 선택 후 기존 scene-showrunner·arc·응결 루프는 **무변경**. |

## 3. 후보 데이터 모양

```ts
type NoveltyLevel = 'safe' | 'tilt' | 'bold';

interface CastSeed {
  // CharacterProfile 의 시드 부분집합 — promoteCharacters 와 동형
  name: string;
  role: string;
  desire: string;
  wound: string;
  voiceRules: string[];
}

interface DiveProposal {
  hook: string;        // 한 문장 훅
  scene: string;       // → session.scene 직결 (scene-showrunner 가 이미 소비)
  cast: CastSeed[];    // 2~3명 → project.characters 로 승격
  myRole: string;      // 내 진입점 (주인공이 누구로 들어가나)
  twist: string;       // 어느 비틈 벡터에서 나왔나 (라벨, UI 태그)
  novelty: NoveltyLevel;
}
```

`cast`·`scene`은 Story X의 `SeriesProject`/`CharacterProfile`과 같은 타입 계열 — 그래서 융합이 공짜.

## 4. 다양성의 심장 — 비틈 벡터 × 신기성 다이얼

**비틈 벡터 카탈로그**(상수, `diveProposal.ts`). 한 소재에서 후보를 뽑을 때 각 후보에 다른 벡터를 배정해 구조적 분산을 강제한다.

| 벡터 | 같은 소재를 이렇게 비튼다 |
|---|---|
| 정체 전복 | 인물의 진짜 정체/목적이 표면과 다름 |
| 시간 구조 | 반복·역행·이미 일어난 일 등 시간축 비틈 |
| 관계 역전 | 기억·권력·앎의 비대칭으로 관계가 뒤집힘 |
| 장르 전환 | 일상이 사실 다른 장르(재난·미스터리·SF)의 입구 |
| 톤 반전 | 기대한 정서와 반대(재회→작별, 위로→위협) |

(카탈로그는 확장 가능. v1은 5개로 시작.)

**신기성 다이얼** — 사용자가 "얼마나 비틀까"를 통제.
- `safe` — 비틈 약하게, 친숙·정통. (벡터를 옅게 적용)
- `tilt` — 한 겹 비틈 (기본값).
- `bold` — 과감한 고-콘셉트. (벡터를 강하게, 조합 허용)

다이얼이 프롬프트의 비틈 강도와 벡터 적용 폭을 조절한다.

## 5. 시스템 설계 — 단위와 경계

### 5.1 신설/수정 단위

- **`src/lib/diveProposal.ts`** (순수·신설)
  - 타입 `DiveProposal`·`CastSeed`·`NoveltyLevel`.
  - `TWIST_VECTORS` 상수(라벨 + 프롬프트 지시 조각).
  - `seedFromProposal(p: DiveProposal): { scene: string; characters: CharacterProfile[]; primaryCharacterId: string }` — 후보를 공유 모델 시드로 변환(순수). `cast`를 `CharacterProfile`(canonAnchors:[]·relations:[] 등 백필)로, 첫 인물을 primary로.
  - TDD `diveProposal.test.ts` 먼저.
- **`tools/storyx.mjs`** — `dive-propose` 커맨드 신설. 입력 = 소재 + novelty. 프롬프트가 비틈 벡터를 후보별로 배정해 JSON 배열 생성. claude 분기 고급 모델 의도, mock 폴백(빈 소재 또는 키 없음 → 기본 제안 3종, 현 고정 시드를 제안 형태로 환산).
- **`vite.config.ts`** — `/api/dive-propose` 브리지 라우트 1개(기존 dive 라우트와 동형).
- **`src/lib/diveClient.ts`** — `requestDiveProposals(req: { topic: string; novelty: NoveltyLevel }): Promise<DiveProposalResponse>`. `DiveProposalResponse = { status; proposals: DiveProposal[]; warning? }`. 견고 파서(잘린 JSON·누락 필드 → 안전 폴백).
- **`src/components/DiveStart.tsx`** (신설·얇은 표면) — 소재 textarea + 신기성 다이얼(3단 토글) + "제안 받기" 버튼 → 후보 카드 3~5(hook·scene 미리보기·cast·twist 태그) → "이걸로 시작". 로딩·빈결과·에러 상태 처리.
- **`src/App.tsx`** — `stage==='dive'` + 복원 세션 없음 → 자동 시딩(현 `DIVE_SEED_CHARACTERS[0]`) 대신 `DiveStart` 표시. 후보 선택 시 `seedFromProposal`로 새 `SeriesProject`(characters에 cast 승격) + `createDiveSession(primaryId, project.id)` 생성, `session.scene = proposal.scene` 세팅, `saveDiveState` → `DiveStage` 진입.
- **`src/styles.css`** — `.dx-start`·`.dx-proposal-card`·`.dx-novelty-dial`·`.dx-twist-tag`. Linear 다크 토큰(`--lc-*`/`--nx-*`/`--sx-*`).

### 5.2 재사용 (무변경)

scene-showrunner·arc·응결·캐논 승격·digest·품질 게이트·영속(`saveDiveState`/`loadDiveState`)은 그대로. 제안 엔진은 진입 한 단계만 추가한다.

### 5.3 데이터 흐름 한 바퀴

1. `stage=dive`, 저장 세션 없음 → `DiveStart`.
2. 소재 입력 + 신기성 선택 → `requestDiveProposals` → `/api/dive-propose` → 후보 3~5.
3. 후보 선택 → `seedFromProposal` → `SeriesProject`(cast 승격) + `DiveSession`(primary, scene 세팅) → 영속 → `DiveStage`.
4. 이후 scene-showrunner·arc·응결 루프 무변경.

## 6. 출력 형식 예시 (의도 고정)

`dive-propose` 응답(소재 = "소꿉친구", novelty = tilt) —
```json
{
  "status": "complete",
  "proposals": [
    {
      "hook": "10년을 산 가족이 외계인일지 모른다는 쪽지를 받았다",
      "scene": "도윤네 집 앞. 도윤은 학원에 갔고 집엔 도윤 母만 있다. 가족이 외계인인지 몰래 확인하러 왔다.",
      "cast": [{ "name": "도윤 母", "role": "정체 모를 어머니", "desire": "...", "wound": "...", "voiceRules": ["..."] }],
      "myRole": "몰래 확인하러 온 사람",
      "twist": "정체 전복",
      "novelty": "tilt"
    }
    // …서로 다른 벡터의 후보 2~4개 더
  ]
}
```

## 7. 비목표 (YAGNI)

취향 프로필(#1)·방향 스티어링 3-way(#3)·누적 학습·인기/소셜 추천·실결제·후보 즉석 재생성·생성 후 심사 패널(v2)·이미지/초상화·후보 수동 편집. 전부 다음 조각.

## 8. 리스크

- **다양성 붕괴** — 단일 호출이라 모델이 벡터 지시를 무시하고 비슷한 후보를 뱉을 수 있다. 완화 — 벡터를 후보별로 명시 배정·라벨 회수 강제, 부족하면 v2 심사 패널. 검증은 dogfooding 손맛.
- **견고 파서** — LLM JSON이 잘리거나 필드 누락. `diveClient` 파서가 안전 폴백(부분 후보 버림, 최소 1개 보장 또는 경고).
- **품질 평탄** — 후보 hook/scene 질감은 Story X 품질 로드맵과 같은 벽. 막히면 그쪽 분기(메모리 ★ 명제).
- **빈 소재 UX** — 소재 없이도 "그냥 추천"이 동작해야(기본 제안). mock·실모델 양쪽 폴백 보장.

## 9. 검증 (Definition of Done — 프로토타입)

- `npm test` 녹색 — `diveProposal.test.ts`(비틈 벡터 분산·`seedFromProposal` 매핑[scene→session.scene·cast→characters·primary id]·novelty 반영·견고 파서) + storyx.mjs `dive-propose` mock shape 핀 + 기존 회귀.
- `npm run build`·`tsc --noEmit` 통과.
- 라이브 한 바퀴 — 소재 입력 → 제안 3~5 → 선택 → DiveDesk 진입(scene·cast 시딩 확인), 콘솔 0.
- 새 생성 동작 TDD 먼저. Linear 다크 토큰 유지. 한국어 UI 간결.
- 판정 기준(사용자 만족)은 코드 DoD 밖 — 제안이 "셀 수 없이 많지만 서로 다르고 끌리느냐"를 dogfooding으로 반복.
