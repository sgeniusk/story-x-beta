# 다음 세션 시작 프롬프트 (2026-07-09 저녁 작성 · 세션3 종료 시점)

아래를 새 세션에 붙여넣으면 컨텍스트 없이 바로 시작한다. 진입 순서는 `CLAUDE.md` Startup(progress.md → feature_list.json → session-handoff.md → `bash init.sh`) 그대로. **이번 세션 사용자 의도 = 사용자가 직접 앱을 dogfooding 테스트한다.** 코딩보다 "실사용 관찰"이 먼저다.

---

## 상태 (직전 세션3 = 2026-07-09, 전부 main 머지·green)

멀티회차 연속성 1순위 3단계 + 게이트/에디터 후속 3건까지 완주. main HEAD `727402f`, `bash init.sh` 전체 녹색.

- **1순위(멀티회차 누적 연속성)** — 결정론 하네스로 정밀도 붕괴 발견→수정(`1962c2d`, 재진술 FP 53→16·recall 무손실) · 실제 codex 5화 이어 생성(캐논 5→23·유기 누적 FP 0, `a5a0e2c`) · PLAY/WRITE/PLAN 3모드 라이브 융합 관찰(`94e9ce9`).
- **후속 정비 3건(`4fd2978`)** — FloatingEditor 하드시드 크래시 방어(`b2ecb05`) · PLAN 충돌 배지 정보성 경고 제외 + PLAY 주인공 감지(`3c1b983`) · 계사 정체성 hard canon 라우팅(`7102b84`, 형사→민간인 recall 경고→BLOCK).
- 정본 — `docs/reviews/2026-07-09-multichapter-continuity/`(결정론 하네스·findings) · `docs/reviews/2026-07-09-multichapter-live/`(실제 생성·3모드 관찰).

마일스톤 — M1~M6·A1~A5·B1~B4·DX1~DX4·M12 완료. **M7-alpha-1.0 = 단계1(기술+내부실증) 달성 · 단계2(외부 작가 3명 실증) 미착수.**

## 이번 세션 할 일 — 사용자 dogfooding 테스트 (우선)

앱을 실제로 써보며 관찰한다. 에이전트는 서버를 띄우고 관찰을 돕되, 사용자가 운전한다.

### 앱 실행
```
# preview MCP 있으면
preview_start(name="story-x")   # 포트 5175, launch.json 있음
# 없으면
npm run dev -- --port 5175 --strictPort
```
- 빈 상태 first-run — `http://localhost:5175/` → 「창작 시작」부터. 실 codex 왕복(인터뷰·초안 ~2.5~3분).
- 누적 작품으로 바로 보기 — 로판 23화 백업 주입: `docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json` 의 `dump.project`(문자열)를 localStorage `serial-story-studio/project` 에 넣고 `serial-story-studio/onboarding` = `{"completed":true}` 후 `/?stage=editor`. (직전 세션은 `public/inject-*.json` 을 vite 로 서빙→페이지에서 fetch→setItem 방식 사용. 3MB라 preview_eval 직접 붙이기 어려움. 쓰고 나면 `public/` 정리.)

### 관찰 포인트 (직전 세션이 확인한 것 = 재현되는지 체감)
- **생성 품질** — 인터뷰가 내 소재에 맞춤화되나 · 초안이 완결·비트 긴장곡선·새 캐논을 내나.
- **연속성 체감** — 여러 화 이어 쓸 때(PLAY 이어굴리기 or WRITE 초안 생성) 캐논이 안 무너지나 · 「흐름 검증」의 연속성 감수자가 가짜 충돌 없이 진짜만 잡나(직전 실측 = 누적 91캐논서 "차단할 직접 모순 없음").
- **3모드 융합** — PLAY/WRITE/PLAN 전환이 한 캐논을 조각하는 느낌인가 · 전환 시 끊김·크래시 없나.
- **마찰** — 초안 생성 ~3분 대기 체감(진행 피드백 있음) · 제목 자동설정 안 됨(코스메틱) · 기타 거슬리는 지점.

사용자가 발견을 말하면 → brainstorming→spec→TDD 슬라이스로 처리.

## 코딩 백로그 (사용자가 테스트 대신 개발을 원하면)

### 2순위 — 외부 테스트 게이트0 하드닝
- **BYOK — 당분간 보류(2026-07-09 사용자 결정).** 착수 금지. 외부 테스트를 열 땐 방식 B(소유자 키 클로즈드 베타·비번 게이트)가 직전 추천.
- **프로덕션 URL 실호출 확인** — Vercel `story-x-alpha` 자동배포 배선됨. 실 URL 살아있고 서버 LLM 붙는지(Vercel 인증 필요, 직전 환경에선 불가).

### 3순위 — 게이트 후속 (품질, 경미)
- **추상 없음/있음·비-최종절 부정 미모델링** — "기억 공백이 전혀 없다" 류 직접 모순을 게이트가 못 잡음(직전 실측 유일 recall miss). `continuityContract.ts` OPPOSITION_PATTERNS/부정 극성.
- **잔여 FP 16** — ch23 로판류 밀집 동일테마 reveal 클러스터 한정. 공격적 제약 시 recall 트레이드오프 → 신중. 재현 `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts`.
- **학술 A2/A4 한국어 recall** · **canon-librarian 메타 필터**(medium/format 메타가 캐논에 새어듦) · **실존인물 처리 정책**.

### 그 다음 — M7 단계2 (게이트0 통과 후)
외부 작가 3명 각 10화+ 완성 + 1명+ 유료 지속. 방법 `docs/decisions/2026-06-10-market-proof-1.0.md`.

## 손대지 말 것 (불변식)
- **연속성 게이트 정밀도 = 재진술 FP 0.** 라우팅/카운트/매처 변경 후 반드시 누적 픽스처로 재검증(`gate-accumulation.ts` + 스릴러 누적 `docs/reviews/2026-07-09-multichapter-live/`의 verify 방식). recall 올리려다 오탐 내지 말 것.
- **주어 일치가 계사부정/finalNeg 발화의 핵심** — `sameSubject`(양쪽 extractSubject 일치). 되돌리면 성씨 조각 오매칭 FP 재발.
- **계사 정체성 가드의 '상태 명사 제외'가 핵심** — 감정·관계·상태+계사는 livingState 보존. 빼면 캐릭터 성장이 hard-BLOCK 돼 living-state 설계가 깨진다.
- **결정론 유지** — LLM·외부 사전 금지. `classifyCanonChange`·`isLivingCanonStatement`는 프롬프트 미러 아님(순수 코드).
- 스토리 바이블 형태(characters·world rules·canon facts·open threads·chapters) 보존. 새 생성 동작은 `storyEngine.test.ts` 먼저(TDD).
- `normalizeProject` 는 로드·import 공용 관문 — 새 필수 필드 추가 시 여기 백필 동반(크래시 방어).
- 디자인 토큰 — 스튜디오는 `--st-*` warm 값 원천, `--sx-*` 매핑.

## 검증 팁
- 게이트를 실 prose에 직접 — `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts`(누적 정밀도) · `docs/reviews/2026-07-08-preflight-personas/gate-*.ts`(단발). 회귀 여기부터.
- 멀티회차 실제 생성 재현 — `docs/reviews/2026-07-09-multichapter-live/drive-chapters.ts`(env `STORYX_PROVIDER=mock` 로 배선 스모크 → `=codex` 실제, background + 대기).
- storyx CLI — `node tools/storyx.mjs draft --provider codex --medium X --format Y --context "..." --freewrite "..."`(enum novel/long-novel·essay/essay-series·comics/serial-webtoon·academic/academic-column). 각 ~2.5~3분.
- preview 라이브 — React 클릭은 `dispatchEvent(MouseEvent bubbles:true)` 우회, textarea는 `preview_fill`. 콘솔 에러 = 크래시면 빈 화면(루트만). 스테일 콘솔 로그 주의(누적·`?t=` 타임스탬프로 신선도 판별).
