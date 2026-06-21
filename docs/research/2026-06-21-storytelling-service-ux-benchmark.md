<!-- 스토리텔링 생성형 서비스의 제품·UX·작가 워크플로우 벤치마킹 정본 — Story X 다음 개발 우선순위 근거 -->

# 스토리텔링 서비스 제품·UX 벤치마킹 (2026-06-21)

> **방법** — deep-research 하네스(111 에이전트 · 6 검색각도 · 28 소스 · 125 주장 추출 → 25 검증 → **18 확정 · 7 기각**). 글로벌(AI Dungeon · Novelcrafter · Squibler · Sudowrite · TrackBear · WritingHabit · Scribophile) + 한국(웹소설/웹툰 시장 보도). 초점 = **제품 UX/워크플로우**(이야기 품질·기억 압축은 기존 리서치라 의도적 제외).
> **자매 문서** — `2026-06-14-prose-quality-surprise-research.md`(품질·의외성), `2026-06-11-longform-memory-compression.md`(장편 기억).
> **현재 상태 스냅샷** — 같은 세션 Explore 에이전트가 Story X 코드 4영역(온보딩·공동창작·편집·리텐션)을 매핑(이 문서 §2 대조표의 'Story X 현재' 열).

## 1. 검증된 패턴 (18 confirmed 중 핵심 7)

### P1 — 온보딩은 '메뉴형 진입'이 정석 (high, 3-0)
인터뷰형 위저드가 아니다. AI Dungeon Initial Prompt 3경로(Quick-Start/Scenario/Custom), Squibler 한 줄 아이디어 즉시 생성, Novelcrafter Codex 4입력법(수동·본문선택·비-AI Extract·Quick Create 사전명명 템플릿). **메커니즘** — 인터뷰형은 선(先)결정 마찰이 크지만, 메뉴+즉시생성은 '편집할 무언가'를 먼저 만들어 빈 페이지 공포를 우회한다.

### P2 — 공동창작 = 입력유형 선택 + 다중후보 선택 (high, 3-0)
AI Dungeon Do/Say/Story/See 4모드(작가가 매 턴 기여 유형 선택) + Retry Stack(여러 대안 출력을 쌓아 비교·채택). 자유 타이핑 대신 구조화된 선택으로 작가 주도권 보존. **★ 단서** — 즉시 연속 Retry는 후보가 거의 동일하다. **다양성은 시드/리셋 강제로만** 확보된다(Story X VS 후보 다양성 설계 직결).

### P3 — 편집은 자동 버전 히스토리, 그것도 캐논+프롬프트까지 (high, 3-0) ★차용 1순위
Novelcrafter는 3분마다 자동 스냅샷(저장 버튼 없음) + 버전관리 대상 6종 명시 — 본문·Codex 설명·Codex 노트·씬 요약·씬 본문·**커스텀 프롬프트 지시문**. 즉 worldbuilding/canon 데이터와 AI 프롬프트 지시문 자체가 버전 관리된다. **판단** — 연속성=제품요건인 Story X는 본문뿐 아니라 캐논 팩트·바이블·검토 페르소나 프롬프트 변경 이력까지 되돌릴 수 있어야 한다. **단서** — git식 브랜치/diff가 아니라 자동 스냅샷(30일 보존)이라 '영향 범위 표시'는 별도 설계 필요.

### P4 — 캐논/바이블은 집필면에 인라인 통합 (high, 3-0)
본문에 추적 중인 이름/별칭이 나오면 얇은 밑줄, 클릭 시 미리보기 카드. + 각 Codex 엔트리에 'AI Settings > Always Include' 토글로 **어떤 컨텍스트가 LLM에 주입될지 작가가 엔트리 단위로 통제**. 별도 바이블 탭을 오가는 컨텍스트 스위칭 비용 제거. 캐논/바이블이 단순 저장소가 아니라 'AI 입력 통제판'이 됨.

### P5 — 리텐션은 target/habit 이원 분리 (TrackBear 3-0, WritingHabit 2-1)
target(누적 진도, progress bar) ≠ habit(규칙적 집필, streak·최장연속·달성률). 산출량(얼마나 썼나)과 일관성(얼마나 자주 쓰나)은 다른 동기 시스템이라 한 지표로 합치면 둘 다 약해진다. streak를 별도 1급 목표로 두면 '한 문장이라도 매일'이 보상돼 중도이탈을 막는다.

### P6 — 검토 피드백은 인라인 앵커 + 중앙 집계 (medium)
Scribophile은 베타리더 피드백을 본문에 직접 인라인으로 앵커 + 받은 피드백 전체를 정렬·필터하는 Critique Overview 대시보드. **메커니즘** — 피드백을 본문 위치에 앵커링하면 '어느 대목 얘기인지' 매핑 비용 소멸, 중앙 집계는 다수 리뷰어 코멘트를 한 곳에서 처리. 단일 벤더 출처 중심이라 confidence medium. AI 페르소나 검토와 1:1 대응은 아님.

### P7 — 한국 시장: AI 누수 = 별점테러 트리거 (high) ★리스크
AI 특유 문체나 프롬프트 답변(지시문)이 본문에 실수로 노출되면 독자가 별점 1점 '별점 테러' → 평점 급락·연재 중단(경향신문 named 사례: 네이버웹툰 '신과 함께 돌아온 기사왕님' 2점대 붕괴+보이콧). 웹툰은 그림체로 드러나지만 **텍스트 웹소설은 탐지가 거의 불가능 → '누수 사고'가 사실상 유일한 백래시 트리거**. 의혹 제기만으로도 트리거됨(Bloter). **단서** — 보편 반응 아님(설문상 12.5%만 AI 부정적), 과대일반화 금지.

## 2. 현재 Story X 대조 (Explore 코드 매핑 ↔ 검증 패턴)

| 검증 패턴 | Story X 현재 | 판정 |
|---|---|---|
| P1 메뉴형 온보딩 | 인터뷰형(매체→자유서술→인터뷰→헌장→빌딩) | ⚠️ 마찰 위험 — 단 결말역산 차별점이라 인터뷰 자체는 필요. 절충(인터뷰 전 '편집할 초안/예시' 선제공) |
| P2 다중후보 다양성 | VS 회차 후보 있음(episodeBriefing) | 🔶 후보는 있으나 **시드 분기 다양성 강제 미확인** |
| P3 자동 버전(캐논+프롬프트) | revertCanonChange 되돌리기 | ❌ 시간순 자동 스냅샷·프롬프트 버전관리 없음 |
| P4 인라인 멘션+AI토글 | 캐논 별도 패널(CanonCanvas) | ❌ gap — 본문 인라인 멘션·엔트리별 AI주입 토글 둘 다 없음 |
| P5 target/habit | 화수 예산(target류)만(buildContractStatus) | ❌ **habit/streak 완전 gap** (리텐션 65%, 4영역 중 최약) |
| P6 인라인+집계 검토 | MarginReview 여백 인라인 | 🔶 인라인 OK, 통합 대시보드·정렬·필터 약함 |
| P7 AI 누수 게이트 | qualityGates 있음 | ❌ 프롬프트 누수·AI 상투구 차단 게이트 없음 (한국 critical) |

**이미 강한 차별점(유지·약화 금지)** — 결말 역산 헌장(외부 거의 없음, 고유)·멀티 페르소나 검토망·연속성=제품요건(Novelcrafter Codex가 최근접이나 충돌 '드러내기'는 Story X 고유)·VS 의외성(AI Dungeon Retry Stack의 정제판).

## 3. 추천 착수 우선순위 (사용자 결정 대기)

| 트랙 | 근거 | 규모 | 추천 |
|---|---|---|---|
| **AI 누수 방지 게이트** (P7) | 한국 1차시장 critical · qualityGates 확장이라 저비용 · '연속성=제품요건' 옆에 'AI 흔적 차단=제품요건' | S~M | ★1 |
| **target/habit 이원 리텐션** (P5) | 4영역 최약(65%) · 작가 완주율 직결(M7 외부실증과 연결) · 범위 명확 | M | 2 |
| **캐논 인라인 멘션+AI주입 토글** (P4) | 집필경험 직접개선 · 차용가치 높음 · 캐논을 'AI 입력 통제판'으로 | M | 3 |
| **자동 버전 히스토리(캐논+프롬프트)** (P3) | 철학 1순위(연속성=제품요건과 정합)지만 최대 작업 | L | 4(신선한 세션 권장) |

## 4. 박제 금지 (refuted 7건 — 설계 근거로 쓰지 말 것)
- AI Dungeon 무제한 인라인 덮어쓰기로 저작권 보존 (1-2)
- Squibler가 2 dropdown + Generate로 온보딩 (0-3)
- Novela AI를 프라이버시/IP 비훈련 포지셔닝 (0-3)
- WritingHabit 리더보드=안티외로움 리텐션 기제 (0-3)
- 일일 워드카운트 목표가 '일관성'을 개선하는 능동 기제 (0-3)
- 한국 독자가 조직적 별점테러 → 작가가 AI 사용을 은폐하는 딜레마 (1-2)
- 한국 웹소설 남성향=하차 / 여성향=항의 성별 분기 (0-3)

## 5. 공백·후속 (open questions / caveats)
- **한국 플랫폼 자체 창작도구·업로드 연동·회차 연재 UX 데이터 없음** — 노벨피아·문피아·네이버 시리즈·카카오페이지·리디. #5 한국 특화 워크플로우 설계 전 별도 1차 조사 필요.
- 글로벌 도구 실제 이탈 사유·안티패턴(#6)은 한국 별점테러를 빼면 거의 비어있음(글로벌 claim 다수가 벤더 1차 문서라 마찰/만족도 독립 데이터 약함).
- 캐논+프롬프트 버전관리 ↔ 연속성 충돌 '드러내기'(영향 범위 표시) 결합 레퍼런스 미확인.
- 다중후보 다양성 강제(temperature/시드/제약 분기) 검증 기법 미확인.
- **시간 민감** — 한국 데이터 전부 2026 1~3월 기사, 제품 기능도 자주 바뀜 → 구현 직전 재확인.

## 6. 소스 (28 fetched · 핵심 primary)
- AI Dungeon — help.aidungeon.com/faq/how-to-play · what-is-the-initial-prompt · what-are-scenarios
- Novelcrafter — novelcrafter.com/help/docs/organization/revision-history · courses/.../setting-up-the-codex · help/docs/codex/codex-types
- Squibler — squibler.io/onboarding · reedsy.com Squibler review
- TrackBear — trackbear.app · help.trackbear.app/using-trackbear/goals
- WritingHabit — writinghabit.app
- Scribophile — scribophile.com/beta-readers
- 한국 — mt.co.kr(2026-03-11) · mediaus.co.kr/316497 · bloter.net/650498 · khan.co.kr(2026-06)
