# 다음 세션 프롬프트 — 흡인력 후속 3건 (+선택: 디자인 4b)

> 2026-07-07 디자인 정비 세션 마감 시 작성. 아래 "프롬프트" 절을 새 세션 첫 메시지로 붙여 넣으면 된다. 이전 자립 프롬프트(`2026-07-07-next-session-prompt.md`)의 후속 4건 중 ④는 이번 세션에서 해소됐고, 나머지 3건이 그대로 유효하다.

---

## 프롬프트 (복사해서 새 세션에 붙여넣기)

스토리엑스 개발을 이어간다. CLAUDE.md 진입 순서(progress.md → feature_list.json → session-handoff.md → init.sh)대로 컨텍스트를 잡고 시작해.

직전 세션(2026-07-07)에서 **디자인 정비 아크가 완결**됐다 — 검토 → 슬라이스 1+2(PR #26, 스튜디오 공통 `--st-*` warm 토큰·모드색 셸 pill·PLAY 모션) → 슬라이스 3(PR #27, sx 핀 완화·PLAN 이음새 봉합·⌘K 팔레트 잠복 버그 수리) → 슬라이스 4a(PR #28, 죽은 라이트 세대 삭제). 전부 main. 디자인 토큰 규율은 CLAUDE.md DoD에 정본으로 있다 — **스튜디오 값 원천은 전역 `--st-*`, `--sx-*`는 매핑, 새 모션은 `--st-dur-*`/`--st-ease`만**.

이번 세션은 흡인력 후속 3건 중에서 진행한다. **①번부터 brainstorming으로 시작하되, 내가 다른 번호를 고르면 그걸 먼저.**

### ① VS 후보 흡인력 재순위 (권장 1순위 · 큰 조각 · brainstorming 필수)
- **무엇** — WRITE(`.fc-vs`)·PLAY(`.dx-vs`)의 전개 후보는 현재 확률 기반 의외도(rarity: common/surprising/radical)만 있다. 딥리서치의 "Re3 재순위에 흡인력 기준" 결합 — 후보별 **긴장 기여 신호**(이 방향이 열린 질문을 닫기만 하는가, 새 긴장을 장전하는가)를 얹어 사람이 고를 때 의외도+긴장 두 축을 보게 한다.
- **코드 포인터** — `src/lib/episodeBriefing.ts`(`normalizeVsCandidates`·`rarityToBars`·`classifyRarity`) · `src/lib/vsCandidatesClient.ts` · `src/lib/server/promptBuilders.ts`의 VS 프롬프트(+`tools/storyx.mjs` byte-identical 미러 주의) · `src/components/VsCandidatePanel.tsx`(PLAY) · FloatingEditor `.fc-vs` 블록(WRITE).
- **설계 질문 후보(brainstorming에서)** — ⓐ 신호 산출 주체: 같은 VS 콜에서 verbalize(비용 0) vs 별도 재순위 콜(+1콜) ⓑ 표현: 게이지 옆 배지 vs 정렬 순서 변경(확률 숫자 비노출 불변식 유지) ⓒ 기존 `canonSuspect` 배지와의 공존 규칙.
- **불변식(계승)** — VS는 opt-in 전용 · 확률 숫자 비노출 · 선택은 기존 send/intent 배관 재사용 · 데이터 계층 WRITE/PLAY 공유. **UI를 만지면 `--st-*` 토큰·모션 스케일만 사용**(하드코딩 색 금지 — styles.studio.test가 문다).
- 근거 정본 = `docs/research/2026-07-05-compellingness-human-ai.md` · 게이트 spec `docs/superpowers/specs/2026-07-06-compellingness-gate-design.md`.

### ② canonSuspect 배지 실사례 확인 (작은 관찰 조각 · 코드 변경 없을 수도)
- **무엇** — PLAY VS의 「캐논 확인」 배지(`overlapsCanonFact`, 임계 0.65)가 실제 후보에서 발화하는 걸 아직 못 봤다. 오탐/미탐 판정이 목적.
- **방법** — 캐논 많은 백업(`docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json` 캐논 91)을 preview에 주입(스니펫 `docs/handoff/2026-06-11-demo-video-kit.md`, `?stage=dive` URL 직행 가능)하고 VS 후보 요청을 수 회 반복해 배지 발화를 관찰. 미발화 지속 시 임계 재검토(라이브 누적 후 조정은 spec 명시 사항).

### ③ PLAN AI 설계 대화 채널 (설계실 2단계 · 큰 조각 · brainstorming 필수)
- **무엇** — PLAN staged 패치 모델(PR #20) 위에 "AI와 같이 짜는 설계실" 대화 채널.
- **코드 포인터** — `src/lib/planStage.ts`(PlanPatch 5종·upsert/apply/derive) · `src/components/MemoryBankStudio.tsx` · SyncConsole `✦ PLAN +N` 배지 · spec `docs/superpowers/specs/2026-07-04-plan-staged-patches-design.md`.
- **주의** — PLAN staged 불변식(App key=`syncVersion`만 · 기본 keep · staged 편집 logCanonChange 안 남김) 계승. clear+remount 자동 회귀 테스트 부재(2026-07-04 MEDIUM 잔여)를 이 조각에서 함께 추가 권장.

### (선택) 디자인 4b — desk-grid 세대 정리 (급하지 않음)
- editorFocusLayout.test 계약에 물린 죽은 CSS(`.sx-workbench`·`.sx-creative-stage`·`.sx-writing-surface`·`.ex-toolstrip`·release 계열 등 ex-* 다수). **테스트 계약 재협상**이 본질이라 삭제 전에 어느 단언을 왜 푸는지 사용자 승인 필요. 삭제 슬라이스 = 적대적 검토 필수.

### 해소·참고
- ~~④ `변경 검토 요청` 버튼 도달성~~ — **해소**(2026-07-07 4차 세션 라이브에서 PLAN→작품 데이터→캐논 원장 동선으로 도달 확인, BibleWorkbenchHeader 렌더).
- 대기 백로그 — FloatingEditor 하드-시딩 회차 크래시 방어 · 자유 서술 새 작품→PLAY 온보딩 갈래 · 프록시 지표↔완독률 보정 · VS 비용/포인트 연동 · `.fc-app` remount 페이드(⟳최신화·PLAN 반영 시 320ms 페이드인) 체감 관찰 — 거슬리면 `--st-dur-base`로 단축.

### 환경 팁 (2026-07-07 디자인 세션 실증)
- permission classifier(claude-opus-4-8) 간헐 장애 지속 — preview MCP·Agent·여러 줄 Bash가 무작위 거부되나 **재시도 1~3회면 대부분 통과**. gh pr body는 `--body-file`로 우회. **백그라운드 Workflow(3 에이전트 병렬)는 장애 중에도 정상 작동**했다 — 적대적 검증에 활용 권장(배치 3 이하, rate limit 선례).
- 라이브 재현 — 백업 주입 후 `?stage=editor`/`?stage=dive`/`?stage=publish` URL 파라미터로 stage 직행. preview_click이 React onClick을 안 태우면 `dispatchEvent(new MouseEvent('click',{bubbles:true}))` 우회.
- **큰 CSS 범위 삭제는 sed 대신 접합부 실측 + 핀 테스트 즉시 실행** — 4a에서 off-by-one 2건 실제 발생·회수 선례.
- sx-* 클래스를 새 표면(오버레이·패널)에서 렌더하면 sx 색 토큰 스코프(`.sx-desk, .sx-command-palette-backdrop, .fc-app`)에 포함돼 있는지 먼저 확인 — 밖이면 투명 유령이 된다(⌘K 팔레트 선례).
