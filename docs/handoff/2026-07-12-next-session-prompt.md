# 다음 세션 시작 프롬프트 (2026-07-12 작성 · PLAY-first 슬라이스 세션 종료 시점)

아래를 새 세션에 붙여넣으면 컨텍스트 없이 바로 시작한다. 진입 순서는 `CLAUDE.md` Startup(progress.md → feature_list.json → session-handoff.md → `bash init.sh`) 그대로. **이번 세션 주제 = 온보딩 재설계(소재발굴+적응형 인터뷰) brainstorm→spec→구현.** 사용자가 이미 방향을 확정했으니 brainstorm 은 세부 결정용이다.

---

## 상태 (직전 세션 = 2026-07-12, PR #33 main 머지 `c5a6dfa`, init.sh 녹색)

- **PLAY-first 패러다임 확정**([[play-first-paradigm]] 메모리·스펙 `docs/superpowers/specs/2026-07-12-play-first-onboarding-design.md` 방향 섹션) — 대화가 기본 창작 진입, 초안-먼저는 재미를 죽인다(사용자 실측).
- **1차 구현은 파킹 상태로 머지** — 자유 서술 옆 「플레이로 시작」 CTA 를 만들었다가 사용자 dogfooding(CTA 잘림·상대 선택 부재·재설계 결정)으로 같은 날 파킹(`9f013ac`). 현재 자유 서술 CTA 는 「인터뷰로 계속」 단일.
- **휴면 보존된 부품(재사용 대상)** — `buildPlayFirstProject`·`presetToDiveSetup`(src/lib/playEntry.ts, 테스트 有) · `PlaySeedPanel`(src/components/, 테스트 有) · HomeFlowStep 'playseed'+영속(OnboardingDraft.playSetup·isHomeFlowStep) · App 의 goToPlaySeed/handleStartPlay 배선(도달 불가·동작함). 라이브 통짜 검증 완료 이력 = 자유 서술→제안(<1분)→dive 2턴→응결→⟳최신화 1화 합류.

## 이번 세션 할 일 — 온보딩 재설계 (사용자 확정 방향, brainstorm 은 세부만)

**확정된 뼈대** (2026-07-12 사용자 결정, [[play-first-paradigm]] 상세)
1. 온보딩 2단계 = **소재발굴(가제)**, 3갈래(전부 가명) — ① 자유 서술(현행) ② **함께 구상**(작가진과 채팅으로 소재를 캐냄) ③ **인기 프리셋**(루프 회귀물·부자 되는 이야기 등 인기 구성 즉시 시작).
2. **적응형 인터뷰** — 질문 개수 고정 금지, AI 가 됐다 싶으면 종료. 인터뷰어가 먼저 입력 유형(흐름/구성/소재만)을 분석해 물을 것을 정한다.
3. **프리셋은 인터뷰 안으로** — 사용자가 정하지 않은 것을 묻고, 보유 프리셋 중 **유사하되 더 재밌는 방향**을 비교 제안. 동떨어진 제안 금지(지하철 사투→조선 노비 X) — 유사도 앵커.
4. 플레이 채팅 전 **대화 상대 선택** · 플레이→이전 단계 **복귀 동선**.
5. 설정 깊이 원칙 유지 — 인물 진하게(desire·wound·voiceRules)·세계/플롯 얕게, 헌장·결말 선결정 금지.

**설계 힌트(직전 세션 제안, 사용자 미확정)** — "함께 구상"과 적응형 인터뷰는 같은 대화 엔진의 두 진입점 → 통합 가능. 인터뷰 종료 산출 = 플레이 시드(상대 선택이 인터뷰의 마지막 질문). 파킹된 playseed 부품을 인터뷰 경유로 재배선.

**brainstorm 에서 정할 세부** — 3갈래 UI 형태 · "함께 구상" 대화의 종료 조건과 산출 스키마 · 적응형 인터뷰가 기존 `requestLlmInterview`(고정 질문 생성)와 어떻게 다른 콜 구조가 되는지(멀티턴?) · 프리셋 카탈로그 데이터 형태(현 DIVE_SEED_CHARACTERS 3종 → 구성 단위 프리셋) · 슬라이스 분할(한 번에 다 하지 말 것 — 3갈래 UI 먼저? 적응형 인터뷰 먼저?).

## 경미 백로그 (재설계에 흡수되거나 별도 조각)
- dive-setup 프롬프트 정련 — codex 가 myRole(사용자 역)을 cast 에 중복 포함, cast[0]이 세션 상대역이 되는 구조와 충돌.
- goToPlaySeed 캐시 비대칭(재진입마다 재호출) · playSetup blind-cast shape 가드(parseOnboardingDraft) · 실패 시 stale 카드+에러 동시 렌더 · 제목 파생 문장 중간 절단.
- prod dive 엔드포인트 패리티(기존 갭 — PLAY 전체가 dev 브리지 전용) · BYOK 보류(사용자 결정 대기) · 2순위 게이트0(프로덕션 URL 실호출).

## 손대지 말 것 (불변식)
- 연속성 게이트 정밀도(재진술 FP 0)·주어 일치·계사 정체성 가드·결정론 — 2026-07-09 핸드오프 그대로.
- PLAY committed 읽기 전용 · `normalizeProject` 백필 관문 · 스토리 바이블 형태 · 디자인 토큰(`--st-*` 원천).
- `isHomeFlowStep`(storage.ts)에 새 스텝 추가 시 반드시 포함(빼먹으면 복원이 medium 롤백) · playseed 류 조건부 스텝은 homeFlowSteps 인디케이터 배열에 넣지 않는다(슬라이드 인덱스).
- 소스 핀 — appExperience.test.ts 가 "인터뷰 단일 CTA(파킹)"를 핀하고 있다. 재설계로 CTA 가 바뀌면 핀을 의도적으로 갱신(약화 아님).

## 검증 팁
- 서버 — preview MCP `preview_start(name="story-x")` 포트 5175(launch.json). React 클릭 dispatchEvent(bubbles:true)·textarea 는 native setter+input 이벤트 · 같은 tick DOM 읽기는 stale(별도 호출로 재확인).
- codex 는 `~/.codex/config.toml` 의 `gpt-5.6-sol`+ultra 를 따른다(앱 호출에 --model 플래그 없음). dive-setup 실측 <1분 · dive-chat ~30-50초 · 응결 ~60-75초.
- 라이브 통짜 재현 절차는 progress.md "PLAY-first 온보딩" 절 라이브 게이트 참조.
