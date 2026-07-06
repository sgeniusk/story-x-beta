# 다음 세션 프롬프트 — 흡인력 게이트 후속 4건

> 2026-07-07 세션 마감 시 작성. 아래 "프롬프트" 절을 새 세션 첫 메시지로 붙여 넣으면 된다. 배경·코드 포인터·권장 방식까지 자립적으로 담았다.

---

## 프롬프트 (복사해서 새 세션에 붙여넣기)

스토리엑스 개발을 이어간다. CLAUDE.md 진입 순서(progress.md → feature_list.json → session-handoff.md → init.sh)대로 컨텍스트를 잡고 시작해.

직전까지 **흡인력 게이트가 완결**됐다 — critic-reviewer(평론가)가 연재 서사의 모든 검토 경로(마진 전체 검토 PR #25 · scale 자동 검토 `93fd15e`)에 긴장·서프라이즈 판정자로 합류했고, 실작품 dogfooding(헌터 6화)에서 판별력이 실증됐다. 근거 정본은 `docs/research/2026-07-05-compellingness-human-ai.md`, 구현 spec은 `docs/superpowers/specs/2026-07-06-compellingness-gate-design.md`.

이번 세션은 남은 후속 4건 중에서 진행한다. 권장 순서와 각 조각의 배경은 아래와 같다. **①번부터 brainstorming으로 시작하되, 내가 다른 번호를 고르면 그걸 먼저.**

### ① VS 후보 흡인력 재순위 (권장 1순위 · 큰 조각 · brainstorming 필수)
- **무엇** — WRITE(`.fc-vs`)·PLAY(`.dx-vs`)의 전개 후보는 현재 확률 기반 의외도(rarity: common/surprising/radical)만 있다. 여기에 딥리서치의 "Re3 재순위(c)에 흡인력 기준" 결합 — 후보별 **긴장 기여 신호**(이 방향이 열린 질문을 닫기만 하는가, 새 긴장을 장전하는가)를 얹어 사람이 고를 때 의외도+긴장 두 축을 보게 한다.
- **코드 포인터** — `src/lib/episodeBriefing.ts`(`normalizeVsCandidates`·`rarityToBars`·`classifyRarity`) · `src/lib/vsCandidatesClient.ts` · `src/lib/server/promptBuilders.ts`의 VS 프롬프트(+`tools/storyx.mjs` byte-identical 미러 주의) · `src/components/VsCandidatePanel.tsx`(PLAY) · FloatingEditor `.fc-vs` 블록(WRITE).
- **설계 질문 후보(brainstorming에서)** — ⓐ 신호 산출 주체: 같은 VS 콜에서 verbalize(비용 0, 프롬프트 확장) vs 별도 재순위 콜(정확하나 +1콜) ⓑ 표현: 게이지 옆 배지 vs 정렬 순서 변경(확률 숫자 비노출 불변식 유지) ⓒ 기존 `canonSuspect` 배지와의 공존 규칙.
- **불변식(계승)** — VS는 opt-in 전용 · 확률 숫자 비노출 · 선택은 기존 send/intent 배관 재사용 · 데이터 계층 WRITE/PLAY 공유.

### ② canonSuspect 배지 실사례 확인 (작은 관찰 조각 · 코드 변경 없을 수도)
- **무엇** — PLAY VS의 「캐논 확인」 배지(`overlapsCanonFact`, 임계 0.65)가 실제 후보에서 발화하는 걸 아직 못 봤다(2026-07-06 handoff 잔여). 오탐/미탐 판정이 목적.
- **방법** — 캐논 많은 백업(`docs/reviews/2026-06-07-persona-live-test/backups/03-hunter-llmpace-ch6.json` 캐논 24 · `02-work-backup-ch23.json` 캐논 91)을 preview에 주입(주입 스니펫: `docs/handoff/2026-06-11-demo-video-kit.md`)하고 VS 후보 요청을 수 회 반복해 배지 발화를 관찰. 발화 시 정당성 판정, 미발화 지속 시 임계 재검토(라이브 누적 후 조정은 spec 명시 사항).

### ③ PLAN AI 설계 대화 채널 (설계실 2단계 · 큰 조각 · brainstorming 필수 · 신선한 세션 권장)
- **무엇** — PLAN staged 패치 모델(PR #20) 위에 "AI와 같이 짜는 설계실" 대화 채널. 사용자 결정 이력 — PLAN 역할 = AI와 같이 짜는 설계실(정비소 역할은 PLAY 전환 과정으로).
- **코드 포인터** — `src/lib/planStage.ts`(PlanPatch 5종·upsert/apply/derive) · `src/components/MemoryBankStudio.tsx` · SyncConsole `✦ PLAN +N` 배지 · spec `docs/superpowers/specs/2026-07-04-plan-staged-patches-design.md`.
- **주의** — PLAN staged 불변식(App key=`syncVersion`만 · 기본 keep · staged 편집 logCanonChange 안 남김) 계승. clear+remount 자동 회귀 테스트 부재(2026-07-04 MEDIUM 잔여)를 이 조각에서 함께 추가 권장.

### ④ MemoryBankStudio '변경 검토 요청' 버튼 도달성 점검 (작은 조각)
- **무엇** — 2026-07-07 라이브 관찰: BibleWorkbenchHeader의 `변경 검토 요청` 버튼(`.sx-bible-review-request`, `requestBibleReview` 트리거)이 현 플로팅 셸 PLAN 동선(작품 현황 보드·바이블 패널)에서 자동화로 도달되지 않았다. 가시 트리거가 ⌘K 명령(`request-bible-review`)뿐일 가능성.
- **방법** — `StoryXDesk.tsx` 2203행 부근 MemoryBankStudio 렌더 조건 추적 → 실제 도달 불가면 (a) 플로팅 셸에 노출점 재배선 or (b) 죽은 UI로 판정해 정리(삭제 슬라이스면 적대적 검토 필수 — [[subagent-commit-hygiene]]). 사람 눈으로는 도달될 수도 있으니 단정 말고 먼저 재현.

### 그 외 대기 백로그(이번 세션 비목표, 참고만)
FloatingEditor 하드-시딩 회차 크래시 방어(정규화 백필 or 에러 바운더리) · 자유 서술 새 작품→PLAY 온보딩 갈래 · 프록시 지표↔완독률 보정(딥리서치 열린 질문 1) · VS 비용/포인트 연동.

### 환경 팁 (2026-07-07 세션 실증)
- permission classifier(claude-opus-4-8) 간헐 장애 시 — allowlist 단순 명령(`npm test --`·`bash init.sh`·`git add <파일>`·한 줄 `git commit -m`)은 통과, `&&` 체인·여러 줄 커밋 메시지·Agent 디스패치는 거부될 수 있다. 명령을 쪼개면 대부분 진행 가능.
- preview 라이브 시딩은 손수 객체 금지 — `createEmptyProject()`+`addCharacter`/`renameCharacter` 순수 함수 경유(하드-시딩 크래시 지뢰).
- preview에서 `import('/src/...')` 동적 import는 페이지 세션 내 모듈 캐시가 스테일할 수 있다 — 코드 수정 후엔 반드시 `window.location.reload()` 후 재실측.
- preview_eval 30초 한도 — LLM 호출은 fire-and-store(`window.__x`) + 폴링 패턴.
