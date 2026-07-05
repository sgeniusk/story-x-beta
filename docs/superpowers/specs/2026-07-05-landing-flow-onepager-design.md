# 홈 랜딩 원페이저 — "작성 여정" 흐름 섹션 설계

> 2026-07-05 · 상태 = 설계 승인(brainstorming·visual companion, 사용자 확정) · 다음 = writing-plans
> 근거 리서치 = [compellingness-human-ai](../../research/2026-07-05-compellingness-human-ai.md) · 요청 = memory [[landing-onepager-request]] · 방향 = memory [[two-axis-compellingness]]

## 문제

신규 사용자가 Story X 의 의도된 여정(새 작품 온보딩 → STUDIO 3모드 WRITE/PLAN/PLAY → ⟳최신화 → 출간)과 서비스의 본질을 한눈에 이해하지 못한다. dogfooding 중 진입 흐름 혼란이 반복됐다. 현재 랜딩(`MarketingLanding` in `src/App.tsx`)은 히어로(에디터 목업)·핵심 원칙 3카드·매체 전환·클로징 CTA 를 갖췄으나, **"어떻게 쓰는가"의 전체 흐름**과 **"무엇을 향해 쓰는가"(두 축)**를 설명하는 섹션이 없다.

## 목표 — 한 섹션으로 두 가지를 전달

1. **전체 흐름** — 작가진과 시작해 세 방식으로 하나의 캐논을 조각하고, ⟳최신화로 합류시켜, 출간으로 표현한다는 4단계 여정.
2. **서비스 본질(두 축)** — 세 방식이 조각하는 캐논은 두 방향으로 단단해진다. **안 무너진다(일관성)** + **끌어당긴다(흡인력)**. 후자는 "AI가 여러 결을 펼치고 사람이 긴장·의외를 고른다"는 인간+AI 협업으로 살린다(King 논지 + 리서치 결론의 랜딩 언어화).

## 비목표 (범위 밖)

- 흡인력 게이트(critic-reviewer 승격)·서프라이즈 주입(VS) UX 는 **별도 후속 제품 조각으로 스코핑**(이 스펙 아님, 세션 말 handoff 로 인계). 이 섹션은 그 방향을 **카피로 예고**만 한다.
- 매체 변환 상세는 기존 `매체 전환(media-bridge)` 섹션이 담당 — 이 섹션 ④ 출간은 한 줄로 가볍게 넘긴다.
- 랜딩 정보구조 재편·다른 섹션 수정 없음. 순수 추가.

## 배치 — 히어로 다음, 핵심 원칙 앞

페이지 순서(현행 → 변경):
1. `hero-band` (에디터 목업 — 무엇인가)
2. **★신규 `lx-flow-section` (어떻게·무엇을 향해 쓰는가)** ← 여기 삽입
3. `feature-section` #features (핵심 원칙 3약속 — 왜 안 무너지나, "안 무너진다" 축 심화)
4. `lx-bridge-section` #media-bridge (매체 전환)
5. `landing-closing` (CTA)

이유 — 히어로가 "무엇"을 보여준 직후 "어떻게"가 오는 게 자연스럽고, 뒤이은 핵심 원칙이 두 축 중 "안 무너진다"를 深化하는 계단식 전개가 된다.

## 구조 (승인된 목업 = `.superpowers/brainstorm/.../flow-v3-axis.html`)

`<section className="lx-flow-section" id="flow">` 안에 상단 헤더 + 4단계.

- **헤더** — eyebrow "어떻게 쓰나요" · h2 "작가진과 시작해, 세 가지 방식으로 하나의 캐논을 조각합니다." · lead(협업 시작 + 두 축 예고, "안 무너지고, 끝까지 끌어당기는 이야기")
- **① 새 작품 · 설계 착수** — 작가진 브레인스토밍으로 4줄 척추·첫 규칙을 잡아 "캐논의 씨앗"을 심음. 작가진 칩 4개(쇼러너·캐릭터 큐레이터·세계관 지킴이·연속성 감수) + 씨앗 칩.
- **② STUDIO · 세 가지 작성 방식** — 3 모드 카드.
  - PLAY · 이어 굴리기 — "작품 안에서 행동한다" (몰입)
  - WRITE · 원고 다듬기 — "소설을 쓰듯 쓴다" (문장)
  - PLAN · 설계 고정 — "구성과 큰 흐름을 짠다" (구조)
- **③ 하나의 캐논 · ⟳최신화** — "조각은 두 방향으로 단단해집니다". 두 축 카드.
  - ⛊ 안 무너진다(일관성) — 30화 뒤에도 안 어긋남·충돌은 작가 결정. 게이지 꽉 참.
  - ✦ 끌어당긴다(흡인력) — 장면·문장·디테일이 끝까지 끔·AI가 결을 펼치고 사람이 긴장/의외를 고름. 게이지 3/4(자라는 축).
  - 마무리 라인 "회차가 쌓일수록 — 흔들리지 않고, 더 끌어당깁니다".
- **④ 출간** — "완성된 이야기는 소설·웹툰·동화책·오디오북으로 표현됩니다" 한 줄.

- **내비 링크 추가** — 기존 `navLinks`(핵심 원칙·매체 전환)에 `{ label: '작성 흐름', target: 'flow' }` 를 맨 앞에 추가.

## 구현 설계

### 데이터 — 순수 콘텐츠 상수 + 테스트 (TDD)

기존 `mediaBridgeRoutes`(App.tsx 모듈 상수, line 133) 패턴을 따른다. 신규 모듈 `src/landingFlow.ts` 에 섹션 콘텐츠를 타입드 상수로 추출한다.

```ts
// 랜딩 "작성 여정" 섹션 콘텐츠 — 4단계 흐름 + 세 작성 방식 + 두 축
export interface FlowMode { key: 'play' | 'write' | 'plan'; tag: string; kr: string; body: string; }
export interface CanonAxis { key: 'solid' | 'pull'; icon: string; name: string; sub: string; body: string; filled: number; total: number; }
export const flowEntryAgents: string[]      // 쇼러너·캐릭터 큐레이터·세계관 지킴이·연속성 감수
export const flowModes: FlowMode[]           // 정확히 3개, key 순서 play·write·plan
export const canonAxes: CanonAxis[]          // 정확히 2개, solid(filled===total)·pull(filled<total)
export const flowPublishMedia: string[]      // 소설·웹툰·동화책·오디오북
```

**테스트 `src/landingFlow.test.ts`** (먼저 작성) —
- `flowModes` 는 정확히 3개, key 가 `['play','write','plan']` 순서, 각 항목 tag/kr/body 비어있지 않음.
- `canonAxes` 는 정확히 2개. solid 는 `filled === total`(꽉 참), pull 은 `0 < filled < total`(자라는 축). 두 축 body 비어있지 않음.
- `flowEntryAgents` 는 4개 이상, `flowPublishMedia` 는 4개.
- (선택) 흡인력 축 body 에 인간+AI 협업 신호("사람"·"AI"·"고른")가 담겼는지 약한 단언 — 두 축 프레임 회귀 방지.

이유 — 콘텐츠를 상수로 뽑으면 (a) 랜딩 JSX 가 얇아지고 (b) 두 축·세 방식이라는 **의미 불변식**을 테스트로 못 박아 다음 세션이 실수로 축을 지우는 걸 막는다.

### 렌더 — `MarketingLanding` 에 섹션 추가

`src/App.tsx` `MarketingLanding` 의 `hero-band` `</section>` 다음, `feature-section` 앞에 `lx-flow-section` 을 삽입. `flowModes`·`canonAxes` 등을 map 렌더. `navLinks` 배열에 `flow` 항목 추가. 다른 로직 무변경.

### 스타일 — `src/styles.css`, 랜딩 규칙 계승

`.landing-page` 스코프 아래 `.lx-flow-*` 클래스 신설. 기존 랜딩 토큰·패턴(`.lx-eyebrow`·`.section-h2`·`.feature-*`·`.bridge-*`)의 간격·색·라운드를 그대로 참고. 모드별 강조색은 앱 3모드 관례 유지 — PLAY lime(`#bef264` 계열)·WRITE blue(`#93c5fd`)·PLAN violet(`#c4b6ff`). 두 축 — solid 는 중립 회색, pull 은 앰버(`#f0c878`) 로 "다른 축"임을 시각적으로 분리.

- **다크/라이트 양쪽** — 랜딩은 `is-light` 토글이 있다. 신규 클래스는 다크 기본 + `.landing-page.is-light .lx-flow-*` 오버라이드로 라이트에서도 대비 확보(히어로/피처 섹션의 is-light 처리 방식 답습).
- **반응형** — 데스크톱은 3열(모드)·2열(축) 그리드. 좁은 뷰포트(≤640px)에서 모드·축 모두 1열 스택. 가로 오버플로 0.

## 검증 (Definition of Done)

- `npm test` 전체 녹색(신규 `landingFlow.test.ts` 포함) · `npm run build`(tsc+vite) 성공 · `bash init.sh` 통과.
- **라이브(preview)** 게이트 —
  1. 히어로 다음에 flow 섹션 렌더 · 4단계(① 작가진 칩 · ② 3모드 · ③ 두 축 · ④ 출간 매체) 모두 표시.
  2. 두 축 게이지 — solid 꽉 참 vs pull 3/4 시각 구분 확인(흡인력이 "자라는 축"임이 보임).
  3. 내비 "작성 흐름" 클릭 → `#flow` 앵커 스크롤.
  4. `is-light` 토글에서도 텍스트 대비 유지(흰 배경에서 안 사라짐 — 슬라이스 C wm-title-input inherit 회귀 선례 주의).
  5. 좁은 뷰포트(≤640px)에서 모드·축 1열 스택 · 가로 오버플로 0(harness-verifier 관례).
  6. fresh load 콘솔 0.
- `progress.md` 활성 트랙 갱신 · `session-handoff.md` 인계 노트 · 세션 말 흡인력 게이트·VS UX 스코핑 인계.

## 후속 스코핑 (이 스펙 밖, 세션 말 인계)

사용자 승인 3방향 중 2개는 별도 조각 —
- **흡인력 게이트** — `critic-reviewer` 를 긴장·서프라이즈 기준의 흡인력 게이트로 승격(Re3 재순위 단계에 흡인력 기준 추가). 일반 품질 점수가 흡인력을 못 잡는다는 리서치 근거. brainstorming 필요(큰 조각·새 세션).
- **서프라이즈 주입(VS) UX** — PLAY "이어 굴리기"에서 다음 전개 후보 N개를 확률과 함께 펼쳐 사람이 고르는 UX(Verbalized Sampling). brainstorming 필요(큰 조각·새 세션).
