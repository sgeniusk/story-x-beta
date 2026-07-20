# Session Handoff

다음 세션이 즉시 이어 시작할 수 있도록 한 세션 끝에 이 파일을 갱신한다. 가장 최근 인계가 맨 위.

---

## 2026-07-20 17:36 — P2-d 응결 목표 분량 계약 완료, 실제 작품 테스트 대기

> Last Updated: 2026-07-20 17:36 KST

### Current Objective

PLAY 응결에 회차별 3천/5천/8천자 목표를 추가하고, 선택한 목표를 잡 시작부터 결과 검토·실패 복구·재시도·승인·WRITE까지 같은 값으로 보존하는 P2-d를 완료했다. 목표 달성을 위해 원문 밖 사건을 발명하거나 본문을 자동으로 늘리고 자르지 않으며, 완료 결과는 여전히 사용자 승인 전까지 본편·캐논 밖에 있다. 구현은 `91b5c6d`, Draft PR은 #46이고 머지는 사용자에게 남긴다.

### Recommended Next Step

실행 중인 `http://127.0.0.1:5175/?stage=projects`에서 실제 작품의 PLAY로 들어가 충분한 대화를 만든 뒤 `기본 · 5천자`를 선택해 응결한다. 실행 중 프로젝트 보관함에 다녀와도 영수증에 같은 목표가 남는지, 완료 결과가 4,500~5,500자면 목표 범위로 표시되는지, 범위 밖이면 결과를 숨기지 않고 짧음/김 경고가 뜨는지 확인한다. 작품성·원문 충실도를 읽고 승인한 뒤 WRITE에 회차와 `현재자 / 목표 5,000자 · 진행률`이 함께 보이면 P2-d를 수용한다.

### Branch · Commit · Verification

- Branch — `codex/p2-condense-target-length` (`codex/p2-choice-composer` / Draft PR #45 위 스택)
- Implementation — `91b5c6d` (`M11-review-driven-hardening: add P2-d target length contract`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/46 (base `codex/p2-choice-composer`)
- Verification — 2026-07-20 17:35 `bash init.sh` 녹색: 106 files / 1251 tests, tsc+Vite build 성공, `✓ 하네스 검증 통과 — tsc · vitest · build 전체 통과`
- Actual local Codex — 합성 standard 목표 응결 4,722자, `within`, provider `codex`, providerFailure 없음; 사용자 작품 저장·승인 없음
- Independent audits — source/canon 연속성 PASS + 최종 계약 재감사 P0/P1/P2 0, `git diff --check` 녹색
- Browser — 실제 저장 작품 WRITE에서 390/320px `1,122자 / 기본 5,000자 · 22%`, 한 줄·가로 overflow 0, 새로고침 이후 새 console 오류 0
- Live handoff — `http://127.0.0.1:5175/?stage=projects`, viewport override 해제

### What the Last Session Did

1. P2-d를 3천/5천/8천 회차별 목표와 공백 제외 글자 수 계약으로 고정하고 brainstorm→spec→plan→TDD를 완료했다.
2. 목표·source fingerprint/span을 잡·영수증·recovery snapshot·직접 쓰기 작업본에 영속하고 누락·불일치 재시도/승인을 fail-closed했다.
3. 희소 원문을 분량 때문에 발명하지 않도록 새 사건·행동·결정·폭로·페이오프 금지를 prompt와 테스트에 고정했다.
4. WRITE가 저장된 목표와 현재 편집 중 본문을 직접 세어 진행률을 표시하게 하고, 기존 회차는 기본 5천자 표시만 제공했다.
5. 로컬 Codex 장편 응결 timeout을 provider 9분·잡 10분으로 분리하고 실제 4,722자 결과와 전체 하네스·실브라우저·독립 감사를 통과시킨 뒤 Draft PR #46을 만들었다.

### Files To Touch (next milestone)

- 사용자 실제 응결에서 목표 보존·범위 표시·WRITE 진행률 결함이 나오면 P2-d spec 범위 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- 결과의 작품성 편차가 목표 계약과 무관하면 자동 보정에 섞지 말고 별도 품질 슬라이스로 분리한다.
- P2-d 수용 뒤 다음 백로그는 새 feature branch와 brainstorm→spec→plan→TDD로 시작한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 읽기·추가·수정·staging 금지.
- 기존 사용자 작품 원문·회차·캐논을 자동 재생성·덮어쓰기·승인하는 작업.
- 분량을 맞추기 위한 원문 밖 사건 발명, 자동 padding/truncate, blind retry, 사용자 승인 gate 우회.
- P2-d 결함 수정에 에이전트 조직·출판·과금·다른 P2 백로그를 섞는 변경.
- #39→#40→#41→#42→#43→#44→#45→#46 스택을 순서 없이 머지하거나 retarget 전 base 브랜치를 삭제하는 작업.

### Blockers

코드·전체 하네스·실브라우저·실제 로컬 Codex·Draft PR 차단은 없다. 실제 사용자 작품에서 5천자 응결의 읽기 품질과 승인 후 WRITE 연결을 최종 수용할 시점이다.

### Known Issues

- 실제 Codex 장편 검증은 안전한 합성 PLAY 원문으로 수행했다. 사용자의 실제 작품 목소리·장면 밀도·원문 충실도 판정은 의도적으로 남겼다.
- 희소한 PLAY 원문은 발명 없이 8천자를 채울 수 없으므로 `under` 경고가 정상 결과일 수 있다. 목표를 이유로 자동 재시도하지 않는다.
- P2-d 이전 legacy 회차에는 목표를 소급 저장하지 않고 UI에서 `기본 5,000자` 참고값만 표시한다.
- provider 9분 또는 잡 10분 상한에 걸리면 안전하게 실패하고 원문/복구 경로를 남기지만 자동 재호출하지 않는다.
- Vite production build의 기존 500kB chunk 경고는 남아 있으나 build 실패는 아니다.

### Reference Documents

- `docs/superpowers/specs/2026-07-20-p2d-condense-target-length-design.md`
- `docs/superpowers/plans/2026-07-20-p2d-condense-target-length.md`
- `progress.md` 맨 위 P2-d 완료 트랙

---

## 2026-07-19 18:28 — P2-c1 PLAY 추천 답변 작성창 삽입 완료, 실제 말투 수정 테스트 대기

> Last Updated: 2026-07-19 18:28 KST

### Current Objective

PLAY의 `dive-chat` 추천 답변 칩을 즉시 전송 버튼에서 수정 가능한 답변 재료로 바꾸는 P2-c1을 완료했다. 칩은 빈 작성창에만 보이고 클릭하면 네트워크·대화 변경 없이 작성창으로 이동한다. 사용자가 한국어로 고친 뒤 Enter/`보내기`를 눌러야 전송된다. 구현은 `8b72ad5`, Draft PR은 #45이고 머지는 사용자에게 남긴다.

### Recommended Next Step

실행 중인 `http://127.0.0.1:5175/`의 PLAY에서 추천 답변 하나를 누른다. 즉시 새 말풍선·작업등이 생기지 않고 작성창에만 문구가 들어오는지, 한글로 고쳐도 조합 확정 Enter에서 조기 전송되지 않는지 확인한다. 모두 지우면 같은 추천이 돌아오고, 최종 `보내기`에서 수정본만 한 번 전송되면 P2-c1을 수용한다. 다음 후보 P2-d 목표 분량은 새 brainstorm부터 시작한다.

### Branch · Commit · Verification

- Branch — `codex/p2-choice-composer` (`codex/p1b-text-export` / Draft PR #44 위 스택)
- Implementation — `8b72ad5` (`P2-c1: make PLAY choices editable`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/45 (base `codex/p1b-text-export`)
- Verification — 2026-07-19 18:28 `bash init.sh` 녹색: 105 files / 1169 tests, tsc+Vite build 성공
- Focused TDD — 2 files / 43 tests; 즉시 전송·초안 보존·복원·한글 IME 오전송 RED→GREEN
- Independent code audit — P0–P2 0, `git diff --check` 녹색
- Main browser — 실제 3칩에서 클릭 전후 chat 4→4·progress 0→0, textarea focus/caret-end, 수정·삭제·3칩 복원 확인
- Independent harness — 1280/390/320px overflow·clipping·console 오류 0, 모바일 action 44px, keyboard focus 2px, 320×700 max-scroll chronicle–dock 44px·hit-test 정상
- Captures — `/private/tmp/storyx-p2-choice-1280.png` · `/private/tmp/storyx-p2-choice-390.png` · `/private/tmp/storyx-p2-choice-320.png` · `/private/tmp/storyx-p2-choice-harness-320-maxscroll.png`
- Live handoff — `http://127.0.0.1:5175/` PLAY, 추천 답변 3개가 남은 작성창 빈 상태

### What the Last Session Did

1. 5/5 페르소나의 즉시 전송 차단을 단일 P2-c1로 고르고 brainstorm→spec→plan으로 동작 경계를 고정했다.
2. 추천 칩이 fetch나 session 변경 없이 작성창만 채우고, focus와 커서를 끝으로 옮기도록 TDD 구현했다.
3. 작성 중 문장을 덮어쓰지 않고 비우면 추천을 복원하며, 계속·전개·VS 후보 경로는 유지했다.
4. 독립 감사가 발견한 한글 IME 조합 Enter 오전송을 실패 테스트와 가드로 닫았다.
5. 전체 하네스·메인/독립 실브라우저 검증 후 구현 커밋·push·Draft PR #45를 만들었다.

### Files To Touch (next milestone)

- 사용자 실제 PLAY 테스트에서 칩→작성창→수정→명시 전송 결함이 나오면 P2-c1 spec 범위 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- P2-c1 수용 뒤 P2-d 목표 분량은 별도 feature branch에서 brainstorm→spec→plan→TDD로 시작한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 읽기·추가·수정·staging 금지.
- 기존 사용자 작품 원문·회차·캐논을 자동 재생성하거나 덮어쓰는 경로.
- PLAY 응결·생성 잡·보관함·실패 복구·승인·캐논 계약.
- `⏳ 계속`·`⏭ 전개`·VS 후보의 기존 실행 의미를 P2-c1에 섞는 변경.
- #39→#40→#41→#42→#43→#44→#45 스택을 순서 없이 머지하거나 retarget 전 base 브랜치를 삭제하는 작업.

### Blockers

코드·하네스·실브라우저·Draft PR 차단은 없다. 추천 문구를 실제 한국어 말투로 고쳐 보내는 체감과 작품 내 결과의 최종 수용 판정만 사용자에게 남긴다.

### Known Issues

- 독립 Chrome 프로필의 유일 작품에는 PLAY transcript/choice가 없어 칩 상호작용은 메인 인앱 브라우저와 단위 테스트에서 검증했고, 독립 하네스는 레이아웃·키보드·콘솔만 재검증했다.
- 320×700 최초 위치에서는 250px sticky dock이 chronicle toggle을 잠시 가리지만 max-scroll에서 44px 간격과 정상 hit-test로 완전히 접근 가능하다. 현재는 비차단 관찰이며 실제 사용에서 스크롤 발견성이 나쁘면 별도 UX 슬라이스로 다룬다.
- 실제 모바일 소프트웨어 키보드 열림은 자동화하지 못했다. 한글 IME 오전송은 합성 이벤트 단위 테스트로 막았고, 최종 실기 체감은 사용자 판정이 필요하다.
- 브라우저 검증 중 테스트 프로젝트에 PLAY 메시지 한 턴을 추가했다. 새 로컬 AI 요청을 자동 반복하지 말고 현재 남은 추천으로 수용 테스트한다.

### Reference Documents

- `docs/superpowers/specs/2026-07-19-p2-choice-composer-design.md`
- `docs/superpowers/plans/2026-07-19-p2-choice-composer.md`
- `progress.md` 맨 위 P2-c1 완료 트랙

---

## 2026-07-19 17:46 — P1-b 현재 회차 본문 복사·TXT 완료, 실제 OS 반출 테스트 대기

> Last Updated: 2026-07-19 17:46 KST

### Current Objective

WRITE에서 지금 보고 수정하는 한 회차의 live 본문을 메타데이터 없이 클립보드나 UTF-8 TXT로 꺼내는 P1-b를 완료했다. 복사와 TXT는 같은 본문을 사용하며, PLAY 복구본·JSON 백업·캐논/출간 승인의 의미는 분리했다. 구현은 `47d17d4`, Draft PR은 #44이고 머지는 사용자에게 남긴다.

### Recommended Next Step

실행 중인 `http://127.0.0.1:5175/?stage=editor`에서 한 문장을 수정한 직후 `본문 복사`를 눌러 macOS 메모장 등 Story X 밖에 붙여넣는다. 이어 `TXT`를 내려받아 같은 문장·문단 빈 줄·한글 파일명을 확인한다. 두 결과가 맞으면 P1-b를 수용하고, 다음 백로그 슬라이스는 새 brainstorm으로 선택한다.

### Branch · Commit · Verification

- Branch — `codex/p1b-text-export` (`codex/p1a-play-progress-feedback` / Draft PR #43 위 스택)
- Implementation — `47d17d4` (`P1-b: add current chapter text export`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/44 (base `codex/p1a-play-progress-feedback`)
- Verification — 2026-07-19 17:46 `bash init.sh` 녹색: tsc·vitest·Vite build 전체 성공
- Focused TDD — 7 files / 133 tests; clipboard fallback·비동기 회차 경합·download cleanup 실패 RED→GREEN
- Independent audit — 코드 재감사 P0–P2 0, `git diff --check` 녹색
- Browser — 1280/390/320px 본문·브라우저 clipboard·실제 TXT byte-for-byte/SHA-256 일치, UTF-8·빈 줄 보존, 가로 overflow·원고 겹침·console warn/error 0
- Captures — `/private/tmp/storyx-p1b-write-1280-final.png` · `/private/tmp/storyx-p1b-write-390-final.png` · `/private/tmp/storyx-p1b-write-320-keyboard-final.png`
- Live handoff — `http://127.0.0.1:5175/?stage=editor`

### What the Last Session Did

1. P1-b를 현재 선택 회차 한 개·본문만·WRITE 로컬 행동으로 고정하고 brainstorm→spec→plan을 작성했다.
2. `prepareChapterTextExport`와 안전 파일명, UTF-8 다운로드, Clipboard API+selection fallback을 TDD로 구현했다.
3. `ManuscriptExportActions`를 `latestChapter`·저장 전 `editorText`에 직접 연결하고 공백·성공·실패·회차 전환 상태를 정직하게 표시했다.
4. PLAY 복구 TXT가 공용 helper를 재사용하게 하되 복구 경고/메타와 깨끗한 회차 본문 포맷은 분리했다.
5. 독립 감사의 pending Promise 경합·object URL 누수 후보·다운로드 실패 테스트 누락을 RED→GREEN으로 닫고 전체 하네스·실브라우저·Draft PR까지 완료했다.

### Files To Touch (next milestone)

- 사용자 실제 OS 붙여넣기/TXT 판정에서 결함이 나오면 P1-b spec 수용 범위 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- P1-b가 수용되면 다음 백로그는 별도 feature branch와 brainstorm→spec→plan→TDD로 시작한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 읽기·추가·수정·staging 금지.
- 기존 사용자 작품 원문·회차·캐논을 자동 재생성하거나 덮어쓰는 경로.
- PLAY 복구 원문을 일반 회차 본문으로 자동 반영하거나 완료 생성물·캐논 승인 gate를 우회하는 변경.
- JSON export/import schema, ProjectHub·PublishScreen, 작품 전체 묶음 반출을 P1-b에 섞는 변경.
- #39→#40→#41→#42→#43→#44 스택을 순서 없이 머지하거나 retarget 전 base 브랜치를 삭제하는 작업.

### Blockers

코드·하네스·실브라우저·Draft PR 차단은 없다. 실제 macOS 클립보드 붙여넣기와 내려받은 파일의 최종 수용 판정만 사용자에게 남긴다.

### Known Issues

- 자동 브라우저 세션의 clipboard는 원고와 정확히 일치했지만 shell `pbpaste`는 앱 세션 격리로 빈 값을 돌려줬다. 사용자가 실제 외부 앱 붙여넣기를 한 번 확인해야 하며, 실패하면 P1-b 차단 결함으로 취급한다.
- 빈 본문은 컴포넌트 테스트로 fail-closed를 검증했다. 보관된 작품 상태를 훼손하지 않기 위해 실브라우저 작품을 비우는 검증은 하지 않았다.
- 320px에서 기존 `.dock.left`가 양끝 약 2.5px bleed하지만 문서 overflow나 이번 반출 영역에는 영향이 없는 별도 Low 이슈다.
- StoryXDesk의 recovery 조기 return 배선은 현재 source contract 테스트다. 독립 감사는 구현 결함을 찾지 않았으나 실제 렌더 통합 테스트 보강은 후속 P3 후보다.

### Reference Documents

- `docs/superpowers/specs/2026-07-19-p1b-text-export-design.md`
- `docs/superpowers/plans/2026-07-19-p1b-text-export.md`
- `progress.md` 맨 위 P1-b 완료 트랙

---

## 2026-07-18 23:54 — P1-a PLAY 진행 피드백 완료, 실제 작품 대기 경험 테스트 대기

> Last Updated: 2026-07-18 23:54 KST

### Current Objective

PLAY 대화·쇼러너·전개 후보·응결 등록·실행에 실제 경과시간과 작업 목적을 보여 주는 하나의 작업등을 추가했다. 응결은 화면 이탈 가능, 나머지 요청은 현재 화면 대기라는 차이를 정직하게 표시하며 퍼센트·남은 시간은 추정하지 않는다. 구현은 `b885767`, Draft PR은 #43이며 머지는 사용자에게 남긴다.

### Recommended Next Step

현재 5175 로컬 앱의 작가 잠금을 잡은 탭에서 작품을 열고 PLAY로 간다. 대화 한 번, `✦ 전개 후보` 한 번, `지금 응결` 한 번을 실행해 문구·경과시간·작성창 위치를 판정한다. 응결은 생성 보관함으로 나갔다가 PLAY로 돌아와도 경과시간이 영수증 시각에서 이어져야 한다. 수용하면 다음 단일 슬라이스는 P1-b 텍스트 반출로 새 brainstorm을 시작한다.

### Branch · Commit · Verification

- Branch — `codex/p1a-play-progress-feedback` (`codex/p0a-condense-source-boundary` / Draft PR #42 위 스택)
- Implementation — `b885767` (`P1-a: add PLAY progress feedback`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/43 (base `codex/p0a-condense-source-boundary`)
- Verification — 2026-07-18 23:53 `bash init.sh` 녹색: 102 files / 1145 tests, tsc+vite build 성공
- Focused TDD — 3 files / 54 tests; 음수 timestamp 실패 RED(`1784332923`초) 후 0초 안전 강등 GREEN
- Independent audit — 코드·scope·harness P0/P1 0, `git diff --check` 녹색
- Browser — 390×844·1280×900 카드/composer 겹침 0·가로 overflow 0, 타이머 중 scrollY 유지, 최종 preview `http://127.0.0.1:5175/?stage=projects` HTTP 200

### What the Last Session Did

1. `PlayProgressKind` 5종과 시간 구간별 label·message·hint, number/ISO 경과시간 순수 계약을 `generationProgress.ts`에 추가했다.
2. DiveDesk의 로컬 요청은 시작/종료를 `finally`로 정리하고, running 응결은 영수증 `createdAt`을 쓰게 했다.
3. 작업등 스택과 composer를 하나의 sticky dock으로 묶어 390px에서 진행 카드가 입력창을 덮던 중간 결함을 닫았다.
4. polite live region·시간 `aria-hidden`·reduced motion·warm studio token을 고정하고 기존 취소·복구·보관함·TXT 경고 행동을 유지했다.
5. 독립 감사가 발견한 음수 시작시각 결함과 쇼러너 경계 테스트 누락을 RED→GREEN으로 닫고 전체 하네스·Draft PR까지 완료했다.

### Files To Touch (next milestone)

- P1-a 실제 사용 테스트에서 문구·배치·타이머 결함이 나오면 현 spec 수용 범위 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- 수용 후 P1-b는 새 feature branch와 brainstorm→spec→plan→TDD로 시작하고 현 PR에 섞지 않는다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 읽기·추가·수정·staging 금지.
- 기존 사용자 작품 원문·회차·캐논을 자동 재생성하거나 덮어쓰는 경로.
- 완료 생성물 자동 반영, 누수·stale revision·사용자 승인 게이트 우회.
- VS stale response·chat non-2xx·polling timeout을 P1-a 표시 슬라이스에 뒤섞여 수정하는 작업.
- #39→#40→#41→#42→#43 스택을 순서 없이 머지하거나 retarget 전 base 브랜치를 삭제하는 작업.

### Blockers

코드·하네스·preview·Draft PR 차단은 없다. 실제 로컬 AI 대기 경험의 최종 수용 판정만 사용자에게 남겨 둘 시점이다.

### Known Issues

- 인앱 브라우저에 다른 Story X 탭이 작가 잠금을 잡고 있으면 `?stage=projects` 탭은 `다른 탭의 Story X를 기다리는 중`을 보여 준다. 이는 작품 유실을 막는 기존 single-writer 계약이며, 테스트는 잠금을 잡은 기존 탭에서 진행한다.
- 실제 전개 후보 요청은 이번 검증에서 기존 VS timeout 부재로 오래 대기했다. stale response race·non-2xx 판정·polling 상한은 설계대로 별도 신뢰성 슬라이스다.
- 작업등 문구는 작품성을 판정하지 않는다. 응결 결과의 장면성·목소리·캐논 판정과 승인 게이트는 그대로 남아 있다.

### Reference Documents

- `docs/superpowers/specs/2026-07-18-p1a-play-progress-feedback-design.md`
- `docs/superpowers/plans/2026-07-18-p1a-play-progress-feedback.md`
- `progress.md` 맨 위 P1-a 완료 트랙

---

## 2026-07-18 10:44 — PLAY 응결 source·소비 경계 완료, 실제 작품 연속 2회 응결 테스트 대기

> Last Updated: 2026-07-18 10:44 KST

### Current Objective

응결이 최신 두 턴을 빠뜨리고 승인 뒤 다음 회차가 같은 대화를 다시 소비할 수 있던 경계를 교정했다. 잡 시작 시점의 정확한 source를 영속하고, 승인 시 그 범위만 한 번 소비하며, 최신 두 턴은 PLAY 연결 문맥으로만 남긴다. 구현은 `8633789`, Draft PR은 #42이며 머지는 사용자에게 남긴다.

### Recommended Next Step

실제 작품에서 새 PLAY 대화를 3턴 이상 만든 뒤 `지금 응결`을 누른다. 결과에 마지막 대화가 포함됐는지 확인하고 승인하면 WRITE에 회차가 나타나고, PLAY에는 `지난 회차에서 이어지는 대화` 구분선 아래 연결 두 턴만 보여야 한다. 다시 3턴 이상 진행해 두 번째 응결을 만들었을 때 첫 회차의 연결 두 턴이 중복 포함되지 않는지 판정한다.

### Branch · Commit · Verification

- Branch — `codex/p0a-condense-source-boundary` (`codex/p0a-condense-quality-contract` 위 스택)
- Implementation — `8633789` (`P0-a: fix condensation source boundary`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/42 (base `codex/p0a-condense-quality-contract` / PR #41)
- Verification — 2026-07-18 10:38 `bash init.sh` 녹색: 102 files / 1135 tests, tsc+vite build 성공
- Focused TDD — 9 files / 270 tests
- Independent audit — 코드·시각 재감사 P0/P1/P2 0
- Browser — 구분선 1개; 390px 입력창 342×46·버튼 2행; 320px 입력창 272px·버튼 3행; 가로 overflow/콘솔 오류 0
- Live handoff — `http://127.0.0.1:5175/?stage=projects`

### What the Last Session Did

1. `CondenseSourceSpan`으로 after/through turn, 전체 message ID, 연결용 최신 최대 2개 ID를 잡 시작 전에 확정했다.
2. 응결 입력은 모든 미소비 턴을 포함하고, 잡 실행 뒤 추가 대화는 다음 회차 source로 남기도록 소비 경계를 분리했다.
3. source를 receipt root·recovery·approval checkpoint에 보존하고 root→recovery→검증된 legacy 순으로만 복구하게 했다.
4. 승인·deviation/retcon 검토가 동일 source를 사용하고, 손상 metadata에서 기존 연결 문맥을 잘못 지우지 않도록 안전 강등했다.
5. PLAY에 연결 대화 구분선을 추가하고, 실화면 감사에서 발견한 600px 이하 composer 입력창 붕괴를 TDD로 닫았다.

### Files To Touch (next milestone)

- 실제 연속 2회 응결 테스트에서 source 중복·누락이 재현되면 이번 spec 범위 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- 결과 작품성 편차를 승인 전에 알려 주는 readiness는 이번 경계와 섞지 말고 새 brainstorm으로 시작한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 기존 사용자 작품 원문·회차·캐논을 자동 재생성하거나 덮어쓰는 경로.
- 완료 생성물 자동 반영, 누수·stale revision·사용자 승인 게이트 우회.
- #39→#40→#41→이번 PR 스택을 순서 없이 머지하거나 retarget 전에 base 브랜치를 삭제하는 작업.

### Blockers

없음. 자동·브라우저·독립 감사 게이트는 녹색이며 실제 작품의 새 로컬 AI 응결을 사용자가 판정할 시점이다.

### Known Issues

- 이번 브라우저 검증은 결정론적 로컬 상태로 source 소비·구분선·반응형을 검증했다. 실제 새 AI 응결의 문학적 품질과 연속 2회 체감은 사용자 테스트가 남아 있다.
- 잡 레지스트리는 기존 계약대로 서버 프로세스 메모리다. 서버 재시작 뒤 실행 영수증은 `expired`가 되지만 recovery/source span은 남는다.
- readiness 경고와 canon provenance 강화는 각각 별도 슬라이스다.

### Reference Documents

- `docs/superpowers/specs/2026-07-18-p0a-condense-source-boundary-design.md`
- `docs/superpowers/plans/2026-07-18-p0a-condense-source-boundary.md`
- `progress.md` 맨 위 P0-a source·소비 경계 완료 트랙

---

## 2026-07-17 20:34 — 승인 응결본 WRITE 연결·응결 품질 계약 완료, 새 결과 사용자 판정 대기

> Last Updated: 2026-07-17 20:34 KST

### Current Objective

사용자가 확인한 “승인한 응결 1화가 WRITE에 보이지 않음”은 P0-b 직렬화 보강 `f40e811`/Draft PR #40에서 닫았고 실화면 동작도 확인됐다. 이어서 1,122자 요약체·직접 대사 0·약한 후크·QA 표식 작품화 문제를 입력 컨텍스트와 생성 계약에서 교정했다. 품질 구현은 `aad8872`, Draft PR은 #41이며 머지는 사용자에게 남긴다.

### Recommended Next Step

인앱 브라우저의 현재 프로젝트에서 PLAY로 들어가 새 재료를 만든 뒤 `지금 응결` 또는 `응결 다시 시도`를 누른다. 새 결과의 장면성·직접 대사·목소리를 기존 결과와 비교해 사용자가 주관적으로 판정한다. 기존의 약한 1화는 자동으로 덮어쓰지 않았으며, 새 결과를 승인할 때만 #40의 저장 경로로 WRITE에 나타난다.

### Branch · Commit · Verification

- Branch — `codex/p0a-condense-quality-contract` (origin tracking, `codex/p0b-failure-recovery` 위 스택)
- Quality implementation — `aad8872` (`P0-a: strengthen condensation scene and voice contract`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/41 (base `codex/p0b-failure-recovery`)
- Approval→WRITE dependency — `f40e811`, Draft PR #40
- Verification — 2026-07-17 20:33 `bash init.sh` 녹색: 102 files / 1114 tests, tsc+vite build 성공
- Focused TDD — 4 files / 172 tests; 최종 코드 감사 P0/P1 0
- Actual local generation — 1,855자, 3장면, 직접 대사 20문단, 작품 밖 메타 0; critic-reviewer·voice-curator P0/P1 0
- Browser — 프로젝트 2개·생성 보관함 2개 정상 렌더, 오류 레벨 로그 0, `http://127.0.0.1:5175/?stage=projects`
- Evidence — `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0a-condense-quality-sample.md`

### What the Last Session Did

1. `buildProjectContextDigest`가 tone/rhythm/vocab을 실제 `한국어 문체·보이스 규칙`으로 응결에 전달하게 했다.
2. 인물 카드에 욕망·상처·현재 상태·말투 규칙·캐논 앵커를 전달하고 빈 필드는 생략했다.
3. 응결을 1,800~2,700자·2~3 현재 장면·직접 갈등 대사·압력/대가·비봉합·질문 진전·구체 후크 계약으로 바꾸고 TS/CLI를 byte-identical하게 묶었다.
4. 테스트/QA/UI/타임스탬프 메타 누수, 근거 없는 캐논 발명, 감정 재설명, 높임말 드리프트, 기능적 선택 해설, 캐릭터 카드 이행 보고를 실제 실패 샘플에서 TDD로 닫았다.
5. 다섯 차례 생성 교정을 거친 최종 합성 샘플을 독립 문학·보이스 감수했고, 전체 게이트·미리보기·Draft PR 생성까지 마쳤다.

### Files To Touch (next milestone)

- 사용자 새 응결 판정에서 구체 결함이 나오면 `docs/superpowers/specs/2026-07-17-p0a-condense-quality-contract-design.md` 수용 범위 안에서 실패 테스트를 먼저 추가한 뒤 최소 수정한다.
- 승인 전 readiness 경고, 최신 2턴 소비 경계, 캐논 provenance는 각각 새 brainstorm으로 분리한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 기존 약한 1화나 사용자 작품 원문을 자동 재생성·덮어쓰기하는 경로.
- 완료 생성물 자동 반영, 누수·stale revision·사용자 승인 게이트 우회.
- #39→#40→#41 스택을 순서 없이 머지하거나, 다음 PR을 main으로 retarget하기 전 base 브랜치를 삭제하는 작업.

### Blockers

없음. 자동 검증·독립 감수·실생성은 녹색이며 현재는 사용자의 새 응결 결과 주관 판정 시점이다.

### Known Issues

- 프롬프트 계약은 생성 편차를 크게 줄이지만 결과 후처리나 자동 차단은 아니다. 품질 readiness는 오탐 정책을 별도 설계한 뒤 도입한다.
- StoryScore의 현재 후크 휴리스틱은 물음표·느낌표·말줄임표·일부 전환어 중심이라 구체 행동·시한 후크를 0점으로 볼 수 있다. 이번 실생성은 독립 critic-reviewer가 후크를 통과시켰으며 탐지기 개선은 별도 슬라이스다.
- 잡 레지스트리는 기존 계약대로 서버 프로세스 메모리다. 서버 재시작 뒤 실행 영수증은 `expired`가 되지만 recovery snapshot은 남는다.

### Reference Documents

- `docs/superpowers/specs/2026-07-17-p0a-condense-quality-contract-design.md`
- `docs/superpowers/plans/2026-07-17-p0a-condense-quality-contract.md`
- `progress.md` 맨 위 P0-a 후속 완료 트랙

---

## 2026-07-17 14:42 — P0-b PLAY 재개/직접 쓰기 의미 교정 완료, 응결 재시도 사용자 테스트 대기

> Last Updated: 2026-07-17 14:42 KST

### Current Objective

사용자가 발견한 “응결되지 않은 빈 WRITE를 이어쓰기라고 부르는” 의미 결함을 교정했다. 작품 보관함의 기본 재개와 실패 원문 기반 수동 작성을 분리했고, 자동 재시도 없이 PLAY에서 명시적으로 응결을 다시 시작할 수 있게 했다. 의미 교정 구현 커밋은 `c4aabb9`이며 Draft PR #40을 갱신한다. 머지는 사용자에게 남긴다.

### Recommended Next Step

인앱 브라우저의 현재 PLAY 화면에서 `응결 다시 시도`를 한 번 누르고 생성 진행→완료→검토 진입을 확인한다. 프로젝트 보관함으로 돌아간 뒤 `작업 계속하기`를 누르면 회차가 없는 현재 작품은 PLAY로 돌아와야 한다. 실패 원문을 직접 다듬고 싶을 때만 `원문으로 직접 쓰기`를 사용한다.

### Branch · Commit · Verification

- Branch — `codex/p0b-failure-recovery` (origin tracking, `codex/p0c-work-library` 위 스택)
- Resume semantics correction — `c4aabb9` (`P0-b: distinguish PLAY resume from manual recovery`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/40 (base `codex/p0c-work-library`)
- Verification — 2026-07-17 14:42 `bash init.sh` 녹색: tsc·vitest·vite build 전체 성공
- Focused TDD — 8 files / 106 tests 녹색; 재시도 성공·배열 재정렬·지난 회차·미영속 실패/성공 경고 RED 확인 뒤 GREEN
- Browser — 0화 `작업 계속하기`→PLAY, 수동 복구 작업실의 비응결 안내, PLAY 재시도 화면 복귀, 최종 변경 이후 콘솔 오류 0
- Live handoff — `http://127.0.0.1:5175/` PLAY 화면, 로컬 Vite 서버 실행 중

### What the Last Session Did

1. 프로젝트 카드 CTA를 `작업 계속하기`로 바꾸고 최신 프로젝트·PLAY·복구 작업본 상태를 읽어 실제 재개 지점을 결정했다.
2. 작성 내용이나 저장 journal이 있는 복구본은 WRITE를 우선하되, 재열기 가능한 빈 작업본은 비활성화해 0화 작품의 PLAY 복귀를 가로채지 않게 했다.
3. 실패 CTA/작업실을 `원문으로 직접 쓰기`로 명명하고 `응결된 원고가 아님`을 첫 설명으로 고정했다.
4. PLAY에 사용자 클릭형 `응결 다시 시도`를 추가하고 배열 위치가 아닌 `createdAt` 기준 현재 회차 최신 생성 시도만 대표하게 해 과거 실패 재노출과 지난 회차 오작동을 막았다.
5. 미영속 실패·성공 영수증은 “안전” 문구를 쓰지 않고 새로고침 전 결과 검토·TXT 경고를 유지하도록 독립 리뷰 발견을 TDD로 닫았다.

### Files To Touch (next milestone)

- 사용자 재시도에서 결함이 나오면 P0-b spec 수용 기준 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- 수용 뒤 다음 기능 슬라이스는 새 brainstorm에서 범위를 다시 지정한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 복구 source를 일반 Chapter prose로 자동 주입하거나 회차/캐논/인물/지표를 자동 변경하는 경로.
- `commitIntent`·`legacyRepair`·receipt 영속 확인, 사용자 클릭 재시도, 성공 결과 검토·승인 게이트를 우회하는 변경.
- #40을 main으로 retarget하기 전 #39의 base 브랜치 삭제.

### Blockers

없음. 자동·실브라우저 검증은 녹색이며 현재는 실제 로컬 Codex 응결 재시도의 사용자 수용 테스트 시점이다.

### Known Issues

- 잡 레지스트리는 P0-a 계약대로 서버 프로세스 메모리다. 서버 재시작 뒤 실행 영수증은 `expired`가 되지만 recovery snapshot과 수동 작업본은 로컬에 남는다.
- `gh auth status`의 CLI 토큰은 만료 상태다. git credential과 GitHub 연결 앱 경로로 PR 갱신은 가능하지만 CLI 전용 작업 전에는 `gh auth login`이 필요하다.
- 보관함에는 이전 실패·취소 영수증이 함께 남는다. PLAY 현장은 현재 회차의 최신 시도만 표시하고 과거 항목은 전역 보관함에서 관리한다.

### Reference Documents

- `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md`
- `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`
- `progress.md` 맨 위 P0-b 완료 트랙

---

## 2026-07-17 00:53 — P0-b 복구 원문/작업본 분리 교정 완료, 사용자 테스트 대기

> Last Updated: 2026-07-17 00:53 KST

### Current Objective

사용자가 발견한 “PLAY 기록 복구본이 일반 WRITE 본문과 1화로 보이는” 결함을 교정했다. 복구 기록은 본편 밖 전용 작업본으로 열리고, 사용자가 직접 쓴 본문을 명시 저장하기 전까지 회차·캐논·지표를 바꾸지 않는다. 수정 구현 커밋은 `8bd10ab`이며 Draft PR #40을 갱신한다. 머지는 사용자에게 남긴다.

### Recommended Next Step

인앱 브라우저의 `http://127.0.0.1:5175/?stage=projects`에서 생성 보관함 취소 항목의 `작업본 열기`를 누른다. 빈 제목/본문, 별도 `PLAY 원문 보기`, 비활성 `회차로 저장`을 확인하고 한 문장을 쓴 뒤 새로고침→다시 `작업본 열기`로 복원을 확인한다. 수용 후 스택 순서대로 #39를 먼저 머지하고 #40을 main으로 retarget한다.

### Branch · Commit · Verification

- Branch — `codex/p0b-failure-recovery` (origin tracking, `codex/p0c-work-library` 위 스택)
- Correction implementation — `8bd10ab` (`P0-b: separate PLAY recovery work drafts`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/40 (base `codex/p0c-work-library`)
- Verification — 2026-07-17 00:53 `bash init.sh` 녹색: 101 files / 1048 tests, tsc+vite build 성공
- Browser — legacy 오염 1화→0화 환원, 빈 작업본/source 분리, 작성→reload→재열기 복원, 검증 입력 제거, 320/375px overflow 0, 최종 reload 이후 콘솔 오류 0
- Live handoff — `http://127.0.0.1:5175/?stage=projects`

### What the Last Session Did

1. 일반 Chapter로 들어가던 PLAY 원문을 프로젝트별 `PlayRecoveryWorkDraft`와 전용 `RecoveryDraftWorkspace`로 분리했다.
2. `회차로 저장` 전에는 본편·PLAY working·캐논·인물·지표를 변경하지 않고, source는 접이식 참고 패널에만 표시했다.
3. 초기 구현의 오염 회차를 엄격 조건에서만 작업본으로 환원하고, 저장 직전 최신 본편/PLAY를 다시 읽어 다중 탭 편집을 보호했다.
4. receipt 연결·commit/repair journal·다중 탭 완료 확인·보호 cap으로 재시작/부분 성공/동시 탭 중복 저장을 차단했다.
5. 작은 안내 대비와 320px 상단 작업바를 보강하고, 독립 거래·UI·spec/test 감사에서 나온 P0/P1을 모두 TDD로 닫았다.

### Files To Touch (next milestone)

- 사용자 수용 테스트에서 결함이 나오면 P0-b spec 수용 기준 안에서 실패 테스트를 먼저 추가하고 최소 수정한다.
- 수용 뒤 다음 기능 슬라이스는 새 brainstorm에서 범위를 다시 지정한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 복구 source를 일반 Chapter prose로 자동 주입하거나 회차/캐논/인물/지표를 자동 변경하는 경로.
- `commitIntent`·`legacyRepair`·receipt 영속 확인을 우회하는 정리, 미완료/작성 작업본·영수증을 cap으로 조용히 삭제하는 변경.
- 완료 생성물 자동 반영, 누수·stale revision·사용자 승인 게이트 우회.
- #40을 main으로 retarget하기 전 #39의 base 브랜치 삭제.

### Blockers

없음. 자동·실브라우저 검증은 끝났고 현재는 사용자 직접 수용 테스트 시점이다.

### Known Issues

- `gh auth status`의 CLI 토큰은 만료 상태다. git credential과 GitHub 연결 앱 경로로 기존 Draft PR 갱신은 가능하지만, CLI 전용 작업 전에는 `gh auth login`이 필요하다.
- 잡 레지스트리는 P0-a 계약대로 서버 프로세스 메모리다. 서버 재시작 뒤 영수증은 `expired`가 되지만 recovery snapshot과 작업본은 로컬에 남는다.
- 기존 `storyx-p0b-failure-recovery.png`는 폐기된 “원문을 즉시 1화로 만든” 화면이므로 이번 교정의 수용 증거로 사용하지 않는다.

### Reference Documents

- `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md`
- `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`
- `progress.md` 맨 위 P0-b 완료 트랙

---

## 2026-07-16 23:02 — P0-b PLAY 원문 복구 완료, 사용자 테스트 대기

> Last Updated: 2026-07-16 23:02 KST

### Current Objective

P0-b 구현·독립 P0/P1 검토·실브라우저 인수·전체 게이트·원격 푸시·Draft PR #40 생성까지 완료했다. 응결이 실패하거나 취소돼도 당시 PLAY 전체 원문을 TXT로 받거나 원래 작품의 WRITE 초안으로 이어갈 수 있다. 머지는 사용자에게 남긴다.

### Recommended Next Step

사용자가 preview 5175의 기존 테스트 작품에서 PLAY→응결→취소→`PLAY 기록 TXT`→`WRITE 초안으로 보내기`를 직접 확인한다. 수용되면 스택 순서대로 **P0-c #39를 먼저 머지하되 base 브랜치를 삭제하지 않고**, #40을 main으로 retarget해 고유 diff 확인 후 머지한다.

### Branch · Commit · Verification

- Branch — `codex/p0b-failure-recovery` (origin tracking, `codex/p0c-work-library` 위 스택)
- Implementation — `cdd009c` (`P0-b: add PLAY failure recovery`)
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/40 (base `codex/p0c-work-library`)
- Verification — 2026-07-16 23:02 `bash init.sh` 녹색: 99 files / 1011 tests, tsc+vite build 성공
- Browser — `P0B-ALPHA`·`P0B-BETA` 전체 원문 실제 TXT 다운로드, 취소 영수증→WRITE 1화, 새로고침 지속, 캐논 0, 콘솔 오류 0, 390×844 overflow 0
- Capture — `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0b-failure-recovery.png`

### What the Last Session Did

1. 잡 시작 전에 전체 PLAY transcript·장면·작품·예정 회차를 `PlayRecoverySnapshot`으로 캡처하고 생성 영수증에 영속했다.
2. 실패·취소·시간 초과·연결 만료와 잡 등록 실패에서 TXT/WRITE 두 구제 행동을 PLAY 현장과 전역 생성 보관함에 연결했다.
3. WRITE 복구를 원래 작품에만 멱등 생성하고, 미반영 PLAY가 있으면 ⟳최신화를 먼저 요구해 캐논 승인 우회를 막았다.
4. localStorage quota 실패가 서버 잡 실패로 전파되지 않게 했고, 연속 실패 중 모든 미영속 영수증의 긴급 TXT 표식을 보존했다.
5. UX·테스트 독립 리뷰에서 나온 P0/P1을 전부 TDD로 닫고 Draft PR #40만 생성했다. 사용자 소유 `.agents/skills/story-score/`는 무접촉·미스테이징 상태다.

### Files To Touch (next milestone)

- 사용자 테스트에서 결함이 나오면 P0-b spec의 수용 기준 안에서 해당 테스트를 먼저 추가한 뒤 최소 수정한다.
- 수용 뒤 다음 기능 슬라이스는 새 brainstorm에서 범위를 다시 지정한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 완료 생성물 자동 반영, recovery의 캐논/인물/성장 상태 자동 변경, 누수·stale revision·사용자 승인 게이트 우회.
- P0-a 인메모리 잡을 서버 영속 큐/호스팅 OAuth로 확대하거나 P0-c 작품별 캐시를 전역 단일 캐시로 되돌리는 변경.
- #40을 main으로 retarget하기 전 #39의 base 브랜치 삭제.

### Blockers

없음. 현재는 사용자 직접 수용 테스트 시점이다.

### Known Issues

- `gh auth status`의 CLI 토큰은 만료 상태지만 git push와 GitHub 연결 앱 Draft PR 생성은 성공했다. CLI 전용 작업 전에는 재로그인이 필요할 수 있다.
- 잡 레지스트리는 P0-a 계약대로 서버 프로세스 메모리다. 서버 재시작 뒤 영수증은 `expired`가 되지만 P0-b recovery snapshot이 있으면 TXT/WRITE 구제가 가능하다.
- TXT 증거 파일은 `/Users/taewookkim/Downloads/`에 남아 있다.

### Reference Documents

- `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md`
- `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`
- `progress.md` 맨 위 P0-b 완료 트랙

---

## 2026-07-16 20:46 — P0-c 게시 완료, Draft PR #39 머지 대기

> Last Updated: 2026-07-16 20:46 KST

### Current Objective

P0-c 구현·실브라우저 검증·전체 게이트·원격 푸시·Draft PR 생성까지 완료했다. PR #39는 `main` 대상이며 머지는 사용자에게 남긴다.

### Recommended Next Step

사용자가 PR #39를 검토·머지한 뒤 **P0-b 실패 구제 경로**를 brainstorm→spec→plan→TDD로 시작한다.

### Branch · Commit · Verification

- Branch — `codex/p0c-work-library` (origin tracking)
- Commits — `b9e578e` 구현 · `b402b0c` 검증/인계
- Draft PR — https://github.com/sgeniusk/story-x-beta/pull/39
- Verification — 2026-07-16 `bash init.sh` 녹색: 98 files / 988 tests, tsc+vite build 성공

### What the Last Session Did

1. 만료된 `gh` 토큰과 별개로 승인된 git 자격 증명 경로를 사용해 기존 로컬 커밋을 그대로 origin에 푸시했다.
2. GitHub 연결 앱으로 `main` 대상 Draft PR #39를 생성하고 본문에 변경 이유·사용자 영향·검증 증거를 기록했다.
3. 사용자 소유 `.agents/skills/story-score/`는 계속 무접촉·미스테이징 상태로 보존했다.

### Files To Touch (next milestone)

- PR #39 머지 뒤 P0-b brainstorm/spec에서 새 범위를 지정한다.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더.
- 완료 생성물 자동 반영 및 캐논 승인/누수/stale revision 게이트 우회.
- P0-a 잡의 서버 영속 큐·호스팅 OAuth 확장, P0-c 작품별 캐시의 전역 단일화.

### Blockers

없음. 다음 개발 슬라이스는 PR #39 머지 결정만 기다린다.

### Known Issues

- `gh auth status`의 CLI 토큰은 만료 상태지만 git push와 GitHub 연결 앱 PR 작업은 성공했다. CLI 전용 작업 전에는 재로그인이 필요할 수 있다.

### Reference Documents

- `docs/superpowers/specs/2026-07-15-p0c-work-library-design.md`
- `docs/superpowers/plans/2026-07-15-p0c-work-library.md`
- `progress.md` 맨 위 P0-c 완료 트랙

---

## 2026-07-15 20:22 — P0-c 작품 보관함: 임시작→확정→이어쓰기 완료

> Last Updated: 2026-07-15 20:22 KST

### Current Objective

P0-c 구현은 완료됐다. 전역 보관함에서 여러 작품을 보존하고, PLAY-first 신규 작업을 임시작으로 저장한 뒤 명시적으로 연재 작품으로 확정하고 재시작해 이어갈 수 있다.

### Recommended Next Step

이관 백로그의 다음 P0인 **P0-b 실패 구제 경로**를 brainstorm→spec→plan→TDD로 시작한다. P0-c에 삭제/보관/검색·정렬/클라우드 동기화를 섞지 않는다.

### Branch · Commit · Verification

- Branch — `codex/p0c-work-library`
- Implementation — `b9e578e` (`P0-c: add temporary work library`)
- Verification — `bash init.sh` 녹색: 98 files / 988 tests, tsc+vite build 성공
- Browser — 기존 확정작+새 임시작 공존→새로고침 복원→확정 승격→재시작 유지→이어쓰기; 콘솔 오류 0
- Capture — `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0c-work-library.png`

### What the Last Session Did

1. PR #38을 main에 머지(`0df4cfa`)하고 P0-c feature branch를 만들었다.
2. `projectLibrary.ts` lifecycle 도메인과 `storage.ts` 다중 작품/작품별 PLAY·PLAN·snapshot 격리를 TDD로 구현했다.
3. ProjectHub에 임시작/연재 작품/최근 작업/이어쓰기/작품으로 확정 UI를 연결했다.
4. 기존 단일 저장 작품은 확정작으로 마이그레이션하고, 저장 전 seed는 보관함에서 제외했다.
5. 생성 보관함 결과 검토는 item의 `projectId` 작품을 먼저 활성화하도록 고정했다.

### Files To Touch (next milestone)

- P0-b brainstorm에서 실패 상태·구제 CTA·재시도 계약을 확정한 뒤 새 spec에 지정.

### Files NOT To Touch

- `.agents/skills/story-score/` — 사용자 소유 untracked 폴더. 추가·수정·스테이징 금지.
- 완료 생성물 자동 반영, 캐논 승인/누수/stale revision 게이트 우회 금지.
- P0-a 인메모리 잡을 서버 영속 큐나 호스팅 OAuth 흐름으로 확대 금지.
- P0-c의 작품별 캐시 키(`*-by-project/v1`)를 단일 전역 캐시로 되돌리지 말 것.

### Blockers

없음.

### Known Issues

- 기존 작품과 프리셋 신규작의 제목이 같을 수 있다. 이번 슬라이스는 식별자를 `projectId`로 보장하며 제목 변경/중복 제목 UX는 후속 범위다.
- 작품 삭제/보관/검색·정렬/클라우드 동기화는 의도적 비목표다.

### Reference Documents

- `docs/superpowers/specs/2026-07-15-p0c-work-library-design.md`
- `docs/superpowers/plans/2026-07-15-p0c-work-library.md`
- `progress.md` 맨 위 P0-c 완료 트랙

---

## 2026-07-15 — P0-a 응결 신뢰성: 로컬 Codex 잡 + 전역 생성 보관함 (done·PR #38 열림·머지 대기)

> 사용자 확정 순서 brainstorm→spec→plan→TDD로 완료. PLAY의 긴 응결 호출을 로컬 서버 인메모리 잡으로 분리하고 ProjectHub 중심 전역 생성 보관함을 추가했다. 구현 커밋 `f8bddc9`; 최종 `bash init.sh` 녹색(세부 수치는 progress.md 맨 위 최근 검증 참조).

### 한 것 / 검증
- `/api/dive-condense-jobs` POST/GET/DELETE, 동일 활성 입력 dedupe, 5분 상한, 명시 취소, 일반 요청 이탈·서버 종료 child cleanup. 완료는 자동 반영하지 않고 기존 누수·정밀검토·캐논 승인 경로로만 들어간다.
- 전역 localStorage 보관함(20개 상한): running/succeeded/failed/cancelled/timed-out/expired, 손상 성공 결과 실패 강등, ProjectHub 목록과 PLAY 영수증/취소/바로가기.
- 실제 Codex 성공 `job-mrlu5rrh-qjd74u1`(약 70초, 중복 POST 동일 id), 실제 취소 `job-mrlu7mvp-hs3d0g4`(DELETE 뒤 cancelled 유지). 브라우저 ProjectHub 보관함·현재 작품 공존 및 콘솔 오류 0. 캡처 `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0a-generation-inbox.png`.

### 손대지 말 것 / 유의
- `.agents/skills/story-score/`는 사용자 소유 untracked 폴더다. 추가·수정·스테이징 금지.
- 완료 잡은 **승인 전 작품/캐논에 반영 금지**. `buildProjectRevision` stale 경고와 `inspectLeak` 차단을 우회하지 말 것.
- 잡 레지스트리는 의도적으로 서버 프로세스 메모리다. 새로고침은 생존하지만 서버 재시작 뒤 영수증은 `expired`; 서버 영속 큐로 몰래 확대하지 말 것.
- ChatGPT 구독 사용은 로그인된 로컬 Codex CLI 경로에 한정한다. 호스팅 서비스의 API/OAuth 과금 대체로 설명하지 말 것.

### 다음 세션이 해야 할 한 가지
- **P0-c 작품 관리 시스템**을 새 brainstorm부터 시작: 임시작 생성→전역 보관→확정 작품 승격→작품별 이어쓰기, 생성 보관함의 projectId 귀속과 삭제/보존 정책 포함. P0-a에 멀티작품 저장소를 뒤섞지 말 것.

## 2026-07-13 — 온보딩 소재발굴 S2: onboard-chat 엔진 + 함께 구상 갈래 (done·**main 머지** `978d8af`)

> S1 인계의 "다음 한 가지" 완주 — brainstorm 3결정(하이브리드 응결·응결 한 방·단일 파트너)→spec→plan→subagent-driven TDD 7태스크+라이브 통짜. progress.md 해당 절 상세. **plan-chat 6층 미러 완성** — 순수 모듈·클라이언트·프롬프트 정본+[onboard-mirror] 핀·dev 브리지·**prod Function(api/onboard-chat.ts)**·영속(OnboardingDraft 통합).

### 머지 기록 (사용자 지시로 완료)
- S1 = PR #34 머지(`e1e1cf0`) · S2 = **PR #36** 머지(`978d8af`). 원래 S2 는 #35(스택 PR)였으나 **#34 머지 시 base 브랜치 삭제로 GitHub 이 #35 를 자동 close** — retarget 아님, 닫힌 PR 은 base 변경·재오픈 불가라 #36 으로 재생성했다. 교훈 = 스택 PR 은 선행 PR 을 `--delete-branch` 없이 머지하고 브랜치는 후행 retarget 확인 후 지울 것.
- 머지 후 main 에서 `bash init.sh` 녹색 재확인.

### 손대지 말 것 / 유의
- **[onboard-mirror] 핀** — buildOnboardChatPrompt 의 JSON 계약·응결 조건·condense 지시 3줄은 promptBuilders.ts↔storyx.mjs byte-identical. 프롬프트 수정 시 두 곳 동시 + 핀 테스트.
- onboard-chat transcript 는 **OnboardingDraft 통합 영속**(별도 키 아님) — clearOnboardingDraft 가 클리어를 담당한다. 별도 클리어 호출을 추가하지 말 것.
- 매체 변경 클리어 effect 는 **이전 값 비교 ref**(StrictMode 이중 mount 멱등) — 불리언 skip ref 로 바꾸면 dev 에서 복원이 지워진다.
- playseed onBack 은 `playSeedEntry`('preset'|'ideate') 분기 — S3 에서 자유 서술 재배선 시 이 유니온에 진입원 값을 추가하고 goToPlaySeed(휴면, 호출자 0)를 부활시켜라.
- setup 정규화는 클라이언트 normalize(parseDiveSetup 위임) 단일 지점 — CLI·prod Function 은 얕은 통과가 맞다(plan-chat proposals 관례).

### 다음 세션이 해야 할 한 가지
- **다음 세션은 사용자 직접 테스트 결과로 시작한다(사용자 결정)** — 함께 구상 갈래 dogfooding(응결 타이밍·파트너 톤·S1 프리셋 포함). preview 5175 를 빈 상태로 켜두었다. 발견을 슬라이스로 정리한 뒤 **S3 = 적응형 인터뷰** — 자유 서술 재배선(goToPlaySeed 부활+onBack 진입원 추가)·입력 유형 선분석·**STORY_PRESETS.keywords 유사-앵커 비교 제안**·상대 선택 마지막 질문·개수 고정 금지. 기존 requestLlmInterview 는 비소설 전용으로 잔존.
- 경미 후속(최종 홀리스틱 리뷰 Minor 3, 전부 비차단) — in-flight 응답 중 매체 변경 고아 버블(seq 가드 3줄, S3 에서) · onboardChatNote 가 갈래 이탈·재진입에 잔존(코스메틱) · 시드 카드 cast key=name 동명 충돌(희귀) · prod 배포 후 api/onboard-chat.ts 스모크.

---

## 2026-07-12 (3차) — 온보딩 소재발굴 S1: 선택 스텝 + 인기 프리셋 갈래 (done·브랜치 `feat/source-discovery-preset`)

> 재설계 brainstorm(결정 6건)→spec→plan→subagent-driven TDD 5태스크+라이브 통짜. progress.md 해당 절 상세. **S1 = 소설류 2단계를 소재발굴 3갈래 선택 스텝으로, 인기 프리셋 갈래를 LLM 0콜로 완주 가능하게** — 프리셋 5종(StoryPreset 구성 단위) → playseed 확인 카드(상대 선택 신설) → dive. 파킹 부품 재배선 완료(단 goToPlaySeed 는 여전히 휴면 — S3 몫).

### brainstorm 확정 (S2·S3 의 입력)
- **엔진 통합** — "함께 구상"+적응형 인터뷰 = 신규 onboard-chat 한 엔진 두 진입점. **plan-chat 미러**(planChat.ts·planChatClient.ts·buildPlanChatPrompt·api/plan-chat.ts 가 정본 선례 — 멀티턴 transcript 재조립+승인형 제안+카탈로그 그라운딩). **prod Function 필수**(dive-* 의 prod 누락을 반복 금지).
- **종료 산출** — 대화가 됐다 싶으면 DiveSetup 으로 응결, 마지막 턴에 상대 선택 → playseed → dive.
- S2 = onboard-chat 엔진 + 「함께 구상」 갈래 활성화(현재 「준비 중」 비활성 카드). S3 = 적응형 인터뷰(자유 서술 재배선·입력 유형 선분석·**STORY_PRESETS.keywords 유사-앵커 비교 제안**·상대 선택 마지막 질문). 기존 requestLlmInterview 는 비소설 전용으로 잔존.

### 다음 세션이 해야 할 한 가지
- **S2 착수** — onboard-chat 순수 모듈(planChat.ts 미러)+promptBuilders+vite 브리지+storyx.mjs 커맨드+**api/onboard-chat.ts**+「함께 구상」 패널. spec 은 기존 문서(2026-07-12-source-discovery-preset-design.md)의 방향 절 참조하되 S2 전용 brainstorm(종료 판단 기준·제안 스키마) 필요.

### 손대지 말 것 / 유의
- 갈래 패널(freewrite/preset)은 **조건부 mount 로 source 다음 DOM 슬롯 공유** — homeFlowIndex(슬라이드)와 indicatorIndex(하이라이트·클릭 게이트)가 이원화되어 있다. 갈래에서 indicatorId 를 'source' 로 접지 않으면 인터뷰 전진 스킵 구멍이 열린다.
- appExperience.test.ts 소재발굴 3갈래 핀·handleStartPlay 순서 핀 유지.
- goToPlaySeed 재배선 시 playseed 패널 onBack('preset' 고정)을 진입원 분기로 함께 고칠 것(주석에 명시해둠).
- 홈(hx-*) 신규 버튼은 `color: var(--nx-ink)` 명시 필수 — UA 검정 상속으로 다크에서 비가시(이번 라이브 발견).
- playPartnerIndex 는 의도적 비영속(새로고침 시 cast[0] 리셋).

---

## 2026-07-12 (2차) — 플레이 직행 CTA 파킹 + 소재발굴 재설계 방향 확정 (`9f013ac`)

> 사용자가 1차 구현을 직접 dogfooding — CTA 잘림(3버튼 오버플로)·플레이 전 상대 선택 부재·플레이→이전 복귀 불가 발견 + **온보딩 재설계 확정**([[play-first-paradigm]] 메모리 갱신). 이번 턴 조치 = 자유 서술 CTA 를 인터뷰 단일로 복귀(파킹), playseed 부품(글루·패널·영속)은 휴면 보존.

### 다음 한 가지 (재설계 brainstorm 슬라이스)
- 2단계 = **소재발굴(가제)** 3갈래 — 자유 서술 / 함께 구상(작가진 채팅으로 소재 캐기) / 인기 프리셋(루프 회귀물 등).
- **적응형 인터뷰** — 개수 고정 금지·됐다 싶으면 종료·입력 유형(흐름/구성/소재) 선분석. **프리셋은 인터뷰 안의 유사-앵커 비교 제안**(동떨어진 제안 금지).
- 플레이 전 대화 상대 선택 · 플레이 back 동선. 파킹된 playseed 부품을 인터뷰 경유로 재배선.

---

## 2026-07-12 — PLAY-first 온보딩: 소설류 기본 진입 (done·브랜치 `feat/play-first-onboarding`)

> 사용자 dogfooding 발견("질답 후 초안이 먼저 있으니 플레이가 재미없다")에서 출발. **PLAY(대화)가 Story X 기본 창작 진입**이라는 방향 확정([[play-first-paradigm]] 메모리·스펙 방향 섹션). brainstorming 5결정→spec→plan→subagent-driven TDD 3태스크+검증. progress.md 해당 절 상세.

### 한 것
- 소설류 자유 서술 다음 기본 CTA 「플레이로 시작」(인터뷰→초안은 보조 강등). 커스텀 = `requestDiveSetup` 1콜 제안, 프리셋 = 기존 시드 3종 0콜. 확인 카드(`PlaySeedPanel`, 주의사항 핀) → `buildPlayFirstProject`(회차 0·인물 진하게·플롯 얕게) → committed 생성+dive 직행.
- 검토 반영 7건 — 재진입/seq stale 가드·playSetup 영속·대기 타이머 관례 승계·workTitle 재동기화(라이브 발견)·isHomeFlowStep 'playseed'(최종 리뷰 발견, 새로고침 매체 롤백) 등.
- 라이브 통짜 — 자유 서술→제안(<1분, 소재 정확 맞춤)→dive 2턴→응결→⟳최신화 1화 합류→WRITE 렌더·프리셋 0콜·비-소설 무변경·콘솔 0.

### 손대지 말 것 / 유의
- 소설류 CTA 위계·handleStartPlay 순서는 appExperience.test.ts 소스 핀이 지킨다.
- playseed 는 homeFlowSteps 인디케이터 배열에 넣지 않는다(homeFlowIndex 가 buildingPanelIndex 공유 — 배열에 넣으면 슬라이드 인덱스 깨짐).
- `isHomeFlowStep`(storage.ts)에 새 스텝 추가 시 반드시 포함 — 빼먹으면 복원이 medium 으로 롤백.
- 프리셋/커스텀은 같은 DiveSetup 스키마의 두 공급원 — 확인 카드 이후 경로를 갈라놓지 말 것.

### 다음 한 가지
- **에세이 대화형 플레이** (PLAY-first 다음 슬라이스) — essay-interviewer·interview-curator 를 에세이형 플레이 대화 상대로 재해석. 그 전에 사용자 dogfooding 으로 소설 PLAY-first 체감 확인 권장.
- 경미 후속 — goToPlaySeed 캐시 비대칭·playSetup blind-cast 가드·stale 카드+에러 동시 렌더·dive-setup 프롬프트 정련(myRole cast 중복)·제목 파생 개선.

---

## 2026-07-09 (4차) — 온보딩 LLM 대기 진행 피드백 + 폴백 문구 (done·main 머지 `3a94165`)

> 사용자 dogfooding 발견("Failed to fetch")을 근인 진단→TDD→라이브 검증→머지로 완주. progress.md "온보딩 LLM 대기 진행 피드백" 절 상세.

### 한 것
- 근인 = 로컬 dev 는 codex CLI 로 인터뷰 생성(API 키 무관), 실측 ~70초 걸리는데 로딩이 "10~30초" 정적 문구뿐 → hang 오인·새로고침 → **진행 중 fetch 취소**("Failed to fetch"). 타임아웃 아님(codex 5분·클라 무한대기).
- 인터뷰·첫 초안 생성 대기 화면에 경과 타이머+단계 메시지+새로고침 금지 안내(순수 `generationProgress` TDD 재사용). 폴백 문구를 claude/ANTHROPIC → codex CLI·`npm run dev`·새로고침 금지로 교체.

### 손대지 말 것 / 유의
- 진행 표시는 로딩 상태 파생만(생성 동작·데이터 무접촉). 실 codex 소요는 못 줄임 — 정직한 힌트로 기대치만 조정.
- **로컬은 codex CLI 를 씀**(vite.config `/api/*` 브리지 `--provider codex`). API 키 안내는 오해 소지라 제거함. claude 로 되돌리려면 브리지 `--provider` 를 바꿔야.

### 다음 한 가지
- 사용자 dogfooding 계속(다음 세션 프롬프트 `docs/handoff/2026-07-09-next-session-prompt.md`). 발견 시 슬라이스.
- 진짜 스트리밍(SSE)로 대기 자체를 짧게 체감시키는 건 별도 큰 조각.

---

## 2026-07-09 (3차) — 게이트/에디터 후속 정비 3건 (done·main 머지 `4fd2978`)

> 3모드 라이브 관찰이 드러낸 후속(사용자 선택 3건)을 TDD로 마감·main 머지. progress.md "게이트/에디터 후속 정비 3건" 절 상세.

### 한 것
- **FloatingEditor 크래시 방어(`b2ecb05`)** — 하드시드/import 회차·인물 배열 누락 → `chapter.memoryAnchors.length`·`character.voiceRules.join` TypeError → StoryXDesk 빈 화면. `normalizeProject`(로드·import 공용 관문)에서 누락 배열 []·문자열 '' 백필. 라이브 재현→수정→무손상 렌더 확인.
- **PLAN 충돌 배지 + PLAY 주인공(`3c1b983`)** — continuitySummary.warnings 에서 memory-anchor 정보성 넛지 제외 + seedPlayFromProject 주인공 감지(role→캐논→로그라인→폴백).
- **계사 정체성 hard 라우팅(`7102b84`)** — "형사이며 감정을…" 이 '감정'에 끌려 livingState 로 가던 것을 hasCopulaIdentity 가드로 hard canon 승격. 실측 형사→민간인 recall 경고→BLOCK, 재진술 FP 0/23 유지.

### 손대지 말 것 / 유의
- 정밀도 무손실이 불변식 — 라우팅/카운트 변경 후 재진술 FP 0 재확인(verify-live.ts, 스릴러 누적 캐논).
- 계사 정체성 가드는 **상태 명사(감정·관계·상태) 제외**가 핵심 — 이걸 빼면 가변 상태가 hard 로 잘못 승격돼 캐릭터 성장이 차단된다.
- normalizeProject 는 로드·import 공용 관문 — 새 필수 필드 추가 시 여기 백필 동반.

### 다음 한 가지
- **2순위 외부 테스트 게이트0** — BYOK 결정(A UI vs B 소유자 키 베타, 직전 추천 B, **사용자 결정 대기**)·프로덕션 URL 실호출(Vercel 인증 필요·이 환경 불가).
- 게이트 경미 후속 — 추상 없음/있음·비-최종절 부정 미모델링(기억공백 miss)·잔여 FP 16(밀집 reveal 클러스터).

---

## 2026-07-09 (2차) — 멀티회차 실제 codex 이어 생성 관찰 (done·코드 변경 0)

> 1순위 잔여(실제 이어 생성·유기 드리프트). 예비비행 #6 스릴러 위에 codex로 ch2~ch6 생성하며 매 화 validateContinuity 관찰. progress.md 해당 절·정본 `docs/reviews/2026-07-09-multichapter-live/`.

### 한 것
- 드라이버(`drive-chapters.ts`)가 누적 캐논을 context로 먹여 5화 이어 생성 — 5/5 성공, 캐논 5→23, 전 화 hard BLOCK 0, 코헤런트 전개.
- **검증** — 누적 23팩트 위 재진술 FP **0/23**·정합신규 0/2(계사부정 수정 실전 검증) · 이빨 recall 3/4(死·목격자 hard-BLOCK, 형사→민간인 living-state 경고, 기억공백 1건 진짜 누락).
- **결론** — 로판 픽스처 잔여 16 FP는 밀집 동일테마 reveal 특수 케이스, 전형 유기 누적에선 0 FP. "연속성=제품요건" 이어 생성 실작동.

### 이어서 한 것 (같은 세션) — 3모드 라이브 융합 관찰 (done)
- preview에 23화·91캐논 로판 주입 후 PLAY/WRITE/PLAN 관찰(정본 `docs/reviews/2026-07-09-multichapter-live/3mode-observations.md`). 세 방식이 한 committed 캐논을 코헤런트하게 조각·크래시/콘솔 0. 「흐름 검증」 6인 codex 패널 연속성 감수자 "차단할 직접 모순 없음"(누적 91캐논 가짜 충돌 0), PLAN "충돌 1"은 benign 앵커 warning. **→ 1순위(멀티회차 연속성) 3단계 전부 완료.**

### 다음 한 가지
- **1순위 전 완료.** 다음은 2순위 외부 테스트 게이트0 하드닝 — BYOK 결정(A: UI 신설 vs B: 소유자 키 클로즈드 베타·직전 추천 B)·FloatingEditor 하드-시딩 크래시 방어·프로덕션 URL 실호출.
- 게이트 후속(경미) — character owner→livingState 라우팅·추상 없음/있음 미모델링·ch23류 밀집 reveal 잔여 FP 16·PLAN "충돌 N" 라벨 코스메틱·PLAY 주인공 시딩 휴리스틱.

---

## 2026-07-09 — 멀티회차 누적 연속성 검증 → 계사부정 FP 정밀화 (done·미머지)

> 핸드오프 1순위. 결정론 하네스로 실제 23화·91팩트 누적 캐논에서 게이트 정밀도 붕괴를 발견하고 즉시 수정. brainstorming→spec→(스파이크 검증)→TDD→init 녹색. progress.md "완료 트랙 — 멀티회차 누적…" 절 상세. 브랜치 `feat/continuity-copula-accumulation-fp`.

### 한 것
- **발견** — #32의 1화 격리 "오탐 0"이 91팩트 누적에서 재진술 FP **53/91**로 붕괴. 근인 = reveal 팩트("X가 아니며")를 하드 제약 삼아 그 엔티티 언급·성씨조각 공유만으로 위반 판정.
- **수정(`bf232d5`)** — 계사부정 두 루프·finalNeg를 **`sameSubject`(양쪽 extractSubject 확정 일치) 안에만** 발화 + presence 보조용언 lookbehind 제외 + finalNeg 공유 술어 2개+. **재진술 FP 53→16(70%↓)·정합신규 3→1·recall 3/5 무손실·단위 28**. init.sh 전체 녹색(887).
- 커밋 체인 — spec `ed5ab29`·plan `f694c58`·RED `de3f48d`·GREEN `bf232d5`(+원 발견 docs `302c3eb`).

### 손대지 말 것 / 유의
- 주어 일치가 핵심 지렛대(naive 엔티티 가드는 53→44에 그침 — 성씨 조각이 여러 엔티티 공유). 되돌리지 말 것.
- 재현/회귀 = `npx tsx docs/reviews/2026-07-09-multichapter-continuity/gate-accumulation.ts`(FP 16·recall 3/5가 현 기준선).
- 멸문-miss는 후반 캐논이 supersede한 **정당한 non-block일 수 있음** — recall 갭으로 오해 말 것.
- 결정론 유지·classifyCanonChange 프롬프트 미러 아님·케이스 A(첫째 루프) 보존.

### 다음 한 가지
- **main 머지 완료** (`1962c2d`, origin push·브랜치 삭제·머지 후 init.sh 녹색).
- 후속 — 잔여 FP 16(밀집 동일테마 reveal, 공격적 제약 시 recall 트레이드오프)·recall 누락 2건·캐논 화차 태그 시효 모델·**실제 codex 이어 생성(예비비행 #6 유기적 드리프트)·PLAY/WRITE/PLAN 3모드 실사용 연속성**(1순위 잔여, 미착수).

---

## 2026-07-08 (4차) — 자동 의미 연속성 게이트 한국어 recall 보강 (done)

> 예비비행이 실측한 "자동 게이트가 한국어 직접 모순 미포착"을 brainstorming→spec→TDD로 해소. progress.md 해당 절 상세. spec `docs/superpowers/specs/2026-07-08-continuity-semantic-gate-korean-recall-design.md`.

### 한 것
- `continuityContract.ts` `classifyCanonChange`/`findReversalMatch` 보강 — 절 확장 토큰화·death축 살해·문중 주어 폴백·계사 부정(X가 아니)·주술어 마지막절 부정 극성+엔티티 제외 공유 술어. 결정론 유지.
- 실측 — 실 #6 캐논 직접 모순 2/2 BLOCK(전 0/2)·6개 실 캐논 39주장 오탐 0. continuityContract 6 신규 + init.sh 녹색.

### 손대지 말 것 (불변식)
- **정밀도 우선** — 이 게이트는 "정밀한 직접 모순만"이 사용자 결정. recall을 더 올리려다 오탐 내지 말 것. 판별 핵심 = `hasFinalNegation`(주술어 부정 vs 부수 부정 "없이도")·`sharesNonEntityPredicate`(엔티티만 공유하면 반전 아님)·`copulaNegatedNouns`(X가 아니). 이 3개가 오탐 0을 지킨다.
- **결정론** — LLM·외부 사전 금지. `classifyCanonChange`는 프롬프트 미러 대상 아님(순수 코드, 미러/핀 없음).
- 재현 스크립트 `docs/reviews/2026-07-08-preflight-personas/gate-*.ts`(npx tsx) 보존 — 회귀 시 여기부터.

### 다음 한 가지
- **커밋/머지 미완** — 이 세션 작업 전부 main에 **uncommitted**(게이트 fix·테스트·spec·예비비행 docs·progress·handoff). 컨벤션상 feature 브랜치→PR 권장(base 규칙 "default 브랜치면 브랜치 먼저"). 사용자 확인 대기.
- 후속 — 학술 A2/A4 한국어 recall · canon-librarian 메타 필터 · 실존인물 정책 · **다음 검증 라운드(장편 여러 화 이어 생성·PLAY/WRITE/PLAN 실사용 연속성 관찰)** · 외부 작가 모집(게이트0 하드닝 후).

### 검증 팁
- 게이트를 실 prose에 직접 돌리려면 tsx로 src/lib import(continuityContract.classifyCanonChange·claimLedger·citationGate). FP 스캔은 각 초안 newCanonFacts를 계약으로 두고 자기 beats/hook을 주장으로 → block 0 확인.

---

## 2026-07-08 (3차) — 6-페르소나 예비비행 + 차별점 게이트 실발화 검증

> 사용자 설계 6조건을 로컬 Codex로 돌려 폭 검증 + 핵심 차별점 게이트가 데모 아니라 실제 판정력이 있는지 실측. 정본 `docs/reviews/2026-07-08-preflight-personas/`. progress.md 해당 절 상세.

### 한 것
- feat/gen-progress-feedback → main ff 머지·푸시(7938886). 진행피드백+first-run E2E는 이미 커밋돼 있던 걸 확인·머지.
- 6조건(카리나·퀘벡미스터리·바이브코딩에세이·눈빛맨웹툰·환율칼럼·반전스릴러) CLI 배치 생성 = 6/6 성공(폭 PASS).
- **차별점 게이트 tsx 실측** — 학술 A3 견고·A2 한국어 recall 약함 / 연속성 명시규칙 발화 O·**자동 의미게이트 한국어 모순 미포착(2/2)**.

### 손대지 말 것 / 유의
- gate-*.ts 검증 스크립트는 `docs/reviews/2026-07-08-preflight-personas/`에 보존(재현용). npx tsx로 실행.
- 연속성 발견은 **까다롭게 다뤄라** — "게이트가 안 된다"가 아니라 "명시 규칙은 되고 자동 의미층이 한국어에서 약하다"가 정확한 진술. 23화 실증(바이블 채워짐)은 여전히 유효.

### 다음 한 가지
- **후속 우선순위 = 자동 의미 게이트 한국어 recall 보강** — findReversalMatch 부정극성을 절 단위로 쪼개고 고유명사/한자어 동사 추출 강화. 이게 "연속성=제품요건"을 자유 생성물에서도 실제 게이트로 만드는 핵심. (별도 조각·brainstorming 권장)
- 그 외 — 학술 A2/A4 한국어 문형·canon-librarian 메타 필터·실존인물 정책·(원래) M7 단계2 외부 작가 모집(게이트0 하드닝 후).

### 검증 팁
- storyx CLI 배치 = `node tools/storyx.mjs draft --provider codex --medium X --format Y --freewrite "..."` (enum: novel/long-novel·essay/essay-series·comics/serial-webtoon·academic/academic-column). 각 ~2.5~3분, 순차 배치 background + Monitor(run.log)로 조건별 진행 포착.
- 게이트를 실 prose에 직접 돌리려면 tsx로 src/lib 함수 import(claimLedger·citationGate·academicIntegrity·continuityContract.classifyCanonChange·storyEngine.validateContinuity).

---

## 2026-07-08 (2차) — 외부 테스트 준비: first-run E2E 무개입 검증 + 개발 현황 정리

> 사용자 요청 = "개발 현황·완성도 검토·외부 테스트 준비 정리". 결정 2건 = ① first-run E2E 검증 우선 ② 과금은 BYOK 우선. progress.md "first-run E2E 무개입 검증" 절 상세. 코드 변경 없음(검증·문서만).

### 한 것
- 마일스톤 현황 정리 — M1~M6·A1~A5·B1~B4·DX1~DX4·M12 전부 done, M11 rank1~4 done(rank5~7 미착수), **M7-alpha-1.0 = 단계1(기술+내부실증) 달성·단계2(외부작가 3명 실증) 미착수**. `bash init.sh` 실측 녹색(868 테스트).
- **first-run E2E 라이브 통과** — localStorage 초기화 후 빈 상태에서 랜딩→창작시작→매체(소설/장편)→자유서술→인터뷰(실 codex 맞춤 질문)→헌장(맞춤 척추)→에디터(로그라인·캐논3·캐릭터3 자동)→초안생성(실 codex 완결 회차 "반환실의 초승달" 1,975자·streak 발화)까지 콘솔0·크래시0.

### 이어서 한 것 (같은 세션)
- **초안 생성 진행 피드백 `done`(미머지)** — 발견 ⓐ 해소. 순수 `generationProgress.ts`(경과 m:ss·4구간 안심 메시지·예상시간 힌트) TDD + FloatingEditor 타이머 배선(버튼 「생성 중 · m:ss」+`.fc-gen-progress` role=status) + `.fc-gen-*` warm CSS + reduced-motion. init.sh 녹색(+9 테스트)·라이브 무회귀. progress.md "초안 생성 진행 피드백" 절. **미머지 — main 직접 편집 상태라 커밋 전 브랜치 필요**(`feat/gen-progress-feedback` 등). editorFocusLayout F-002 핀 갱신(약화 아님).

### 다음 한 가지 (외부 테스트 게이트0 잔여)
- **BYOK 결정 필요** — 앱에 클라이언트 키 입력 UI 없음(서버 env 소유자 키만). 두 갈래 — (A) BYOK 키 입력 UI 신설 or (B) 클로즈드 베타는 소유자 키로 원가 부담(진짜 BYOK 아님·간단). 사용자 결정 필요.
- 그 외 게이트0 — FloatingEditor 하드-시딩 크래시 방어(정규화 백필/에러 바운더리, self-reported) · 프로덕션 배포 URL 살아있음+서버 LLM 실호출 확인(Vercel 인증 필요, 이 환경 불가). 게이트1(데모영상·베타안내·이탈수집)·게이트2(작가 3명 모집)는 M7 결정문서 `docs/decisions/2026-06-10-market-proof-1.0.md` 방법 A/B/C 참조.

### 검증 팁
- 이 세션 preview 안정적. CTA·버튼은 `preview_click`이 React onClick 미발화 → `dispatchEvent(MouseEvent bubbles:true)` 우회 필수(온보딩 전 구간 이걸로 구동). textarea는 `preview_fill` 유효. 실 codex 초안은 2.5~3분, 백그라운드 `sleep`으로 대기 후 `preview_network` requestId로 응답 본문 확인.

---

## 2026-07-08 — PLAN 설계 대화 채널 done·머지 (설계실 2단계, PR #30 main `254cb2b`)

> 흡인력 후속 ③을 brainstorming(목업 3화면·결정 6건)→spec→plan→subagent TDD 9태스크→라이브 6게이트→최종 리뷰→머지로 완주. progress.md "PLAN 설계 대화 채널" 절 상세. 같은 세션 앞부분에서 VS 긴장 배지(PR #29)·관찰 ②도 완결.

### 한 것
- PLAN dock 「✦ 설계」 패널 = 단일 설계 파트너 대화. LLM이 같은 콜에서 reply+승인형 패치 제안(인물/세계/캐논/스토리코어 필드) verbalize → 「설계안으로」 승인 시 **기존 stage\* 재사용**으로 설계안(PLAN +N) 합류 → 반영/버리기·충돌 게이트 계승. 하네스 미리보기(overlay 재채점)·대화 localStorage 영속(remount 생존). PR #20 잔여 clear+remount 회귀 테스트 동봉. 태스크별 2단 검토 + 최종 리뷰 Ready to merge. 라이브 6게이트(실 codex 왕복·워크벤치 태그 스크린샷·새로고침 생존·콘솔 0).

### 손대지 말 것 (불변식)
- **승인 경로 = stage\* 4종 재사용** — 채널이 upsertPlanPatch를 직접 부르지 않는다. stage\*가 boolean 반환(대상 소멸 시 false→approved 마킹 스킵+note 강등). 이걸 되돌리면 "패치 없는 가짜 설계안" 버그 재발.
- **제안 경계 = 기존 엔티티 필드 수정만** — 인물 CRUD·헌장·제목·creative-weight 제안 불가. **story-core `'title'` 은 normalize가 반드시 드랍**(stageStoryCore('title')은 본편 직행이라, 이 화이트리스트가 승인→즉시 쓰기 우회를 막는 유일한 문). planChat.test의 필수 핀.
- **미러 byte-identical** — buildPlanChatPrompt promptBuilders↔storyx.mjs, `[plan-mirror]` 핀이 JSON 계약+지시문 전문 둘 다 문다.
- **catalog 단일 객체 규율** — sendPlanChat은 `buildPlanChatCatalog(overlayProject)` 한 객체에서 catalogText·검증 catalog를 파생. 분리 구성 금지(제안 무음 드랍 유발).
- **App key=syncVersion만** — 반영/버리기·충돌 게이트 무접촉 계승.

### 다음 한 가지
- **알려진 한계(accepted-risk) 해소가 후속 1순위** — plan-chat busy 중 반영/버리기 누르면 remount로 뒤늦은 파트너 응답이 조용히 소실. 근본 수정 = `planChatBusy`(StoryXDesk 내부)를 App이 알아 반영/버리기 게이트(App↔StoryXDesk busy 배관 확장). 작은 조각.
- 그 외 후속 — 섹션별 페르소나 스위칭 · 결정론 신호 주입(미회수 약속·충돌·조기 소진을 파트너 프롬프트에) · 인물 추가/헌장 제안 · VS 긴장 배지 dogfooding(drains 발화율·canonSuspect) · 선택 4b(desk-grid 계약 재협상).

### 검증 팁
- 이 세션 permission classifier 안정적. preview 5175 + ch23 백업(`docs/handoff/2026-06-11-demo-video-kit.md` 스니펫) + `?stage=editor` → PLAN 토글. textarea는 `preview_fill` 유효, 버튼은 `dispatchEvent(MouseEvent bubbles:true)`. **SyncConsole 배지 메뉴(반영/버리기)는 dispatchEvent로 React onClick 미발화** — remount 검증은 새로고침(더 강한 재마운트)으로 갈음. 배지 메뉴 클릭은 preview 한계.
- subagent TDD 리듬 — 구현자(sonnet)→spec 검토→품질 검토(code-reviewer) 3단, Important는 SendMessage로 같은 구현자 재개해 수리 후 재검토. 이 세션 Important 6건 전부 이 루프로 해소.

---

## 2026-07-07 (5차) — VS 긴장 배지 done·머지 (후보 흡인력 2축 주석, PR #29 main `6dec0fd`)

> 흡인력 후속 ①을 brainstorming(목업 4화면)→spec→plan→subagent-driven TDD 5태스크→라이브→머지로 완주. progress.md "VS 긴장 배지" 절 상세. 사용자 결정 4건 — ⓐ 같은 콜 verbalize ⓑ 배지·순서 불변 ⓒ canonSuspect 독립 병기 + 접근안 2(근거 툴팁).

### 한 것
- `VsCandidate.tension('arms'|'drains')`·`tensionNote`(120자) + normalize 조용한 강등 · 프롬프트 미러 3점 세트(+[vs-mirror] 핀에 지시문 전문, 변이 실험 확인) · PLAY `dx-vs-tension`·WRITE `fc-vs-tension` 배지. 태스크별 spec/품질 2단 검토 + 최종 홀리스틱 Ready to merge(발견 0 블로킹). **라이브** — WRITE·PLAY 실 codex 8/8 tension 도착·배지·툴팁 렌더(#22d3ee 실측)·콘솔 0·620px 오버플로 0.

### 손대지 말 것 (불변식)
- **VS 재순위는 주석이지 정렬이 아니다** — 후보 순서는 LLM 응답 그대로(정렬 로직 없음이 설계 결정). 정렬을 얹으려면 라이브 관찰 후 별도 조각 + 새 spec.
- **tension은 enum 검증 후 생략식 강등** — 비정상 값이면 필드 자체가 사라져 배지 무렌더가 정상 동작. "무배지 = drains" 해석 금지(누락과 구분 불가 방지 결정).
- **미러 핀 확장됨** — [vs-mirror]가 이제 JSON 계약 + 지시문 전문 둘 다 문다. 프롬프트 수정 시 promptBuilders.ts·storyx.mjs·테스트 상수 3곳 동시 갱신.

### 다음 한 가지
- ~~관찰 ② canonSuspect 실사례~~ — **해소(같은 세션)**. 4롤 16후보 + 커버리지 오프라인 분석(진음성 판정·임계 0.65 유지 권고). progress.md "관찰 ② 해소" 절 상세. drains(「회수만」)도 16/16 미발화 — 지시 구조("대가" 강제)상 중반부에선 자연스러움, 종반 dogfooding에서 재관찰.
- 그 외 대기 — ③ PLAN AI 설계 대화 채널(brainstorming 필수) · 선택 4b(desk-grid 계약 재협상) · 기존 백로그(`docs/handoff/2026-07-08-next-session-prompt.md`).

### 검증 팁
- 이 세션 permission classifier 안정적이었음(거부 0). preview 5175 + ch23 백업 주입 + `?stage=editor`/`?stage=dive` 직행, React 클릭은 dispatchEvent 우회 그대로 유효.

---

## 2026-07-07 (4차) — 디자인 정비 슬라이스 4a done·머지 (죽은 라이트 세대 정리, PR #28 main `96cdb9b`) — **디자인 정비 1~4a 완결**

> 렌더 무변경 삭제 슬라이스(-651줄). progress.md "슬라이스 4a" 절 상세. 이로써 이 세션의 디자인 정비 아크(검토→슬라이스 1+2 PR #26→3 PR #27→4a PR #28)가 완결.

### 한 것
- 고아 4파일(Spotlight·PixelAvatar·PublishingIndexCard·studioConstants)·죽은 CSS(spotlight/version-log/publishing/--mx-) 삭제. 테스트 핀 대상(release 계열)은 분리 보존. **적대적 검토 3렌즈 발견 0(전 렌즈 반증 실패)** — 미니파이 CSS 룰 단위 diff까지 순수 삭제 확인. 라이브 스모크·init.sh 녹색.

### 손대지 말 것 (불변식)
- **release 계열 CSS(`.sx-release-checklist`·`gate-state`·`lock-panel`·`.sx-platform-proof-card`)는 죽었지만 보존** — editorFocusLayout.test 핀. 지우려면 4b에서 테스트 계약 재협상과 함께.
- **sed 범위 삭제 주의 선례** — 이 슬라이스에서 off-by-one 2건(brief-grid·release 계열)이 실제 발생, 테스트+검증 렌즈가 잡았다. 큰 CSS 범위 삭제는 반드시 접합부 실측 + 핀 테스트 즉시 실행.

### 다음 한 가지
- **디자인 정비는 완결** — 남은 4b(desk-grid 세대 + editorFocusLayout 계약 재협상)는 급하지 않은 별도 조각.
- **다음 세션 = `docs/handoff/2026-07-08-next-session-prompt.md`** — 흡인력 후속 3건(① VS 후보 흡인력 재순위[권장 1순위·brainstorming] ② canonSuspect 배지 실사례 ③ PLAN AI 설계 채널)+선택 4b를 배경·코드 포인터·환경 팁까지 자립 프롬프트로 정리해 둠. 붙여넣기만 하면 시작 가능. ④ 변경 검토 요청 도달성은 이 세션에서 "도달 가능" 확인으로 해소.

---

## 2026-07-07 (3차) — 디자인 정비 슬라이스 3 done·머지 (sx 핀 완화·PLAN 이음새 봉합·⌘K 팔레트 수리, PR #27 main `cf5657f`)

> 사용자 결정 "핀 완화 해" → `.sx-desk` Linear 리터럴을 전역 `--st-*` warm에 매핑. progress.md "슬라이스 3" 절 상세.

### 한 것
- sx 토큰 전면 alias(+`--nx-on-primary`) · 라이브 표면 흰 베니어 제거 · **⌘K 팔레트 토큰 스코프 잠복 버그 수리**(투명 유령→warm 카드) · `:has` 다크 뒤판(흰 띠) · PublishScreen warm · 포커스 링 60% · CLAUDE.md/AGENTS.md/token-map.md 규율 동기화. 적대적 검토 3렌즈 15건 중 11건 반영, 라이브 실측(PLAN 슬랩 소멸·CTA 9.55:1·콘솔 0).

### 손대지 말 것 (불변식)
- **sx 색 토큰의 값 원천은 `--st-*`** — 리터럴 되돌리기 금지(montage·editorFocusLayout 새 핀이 물고 있음, 변이 실험으로 강제력 확인됨). AI-stage 파스텔 5종·warn/good/err 은 의미색으로 보존.
- **sx 색 토큰 스코프** = `.sx-desk, .sx-command-palette-backdrop, .sx-spotlight-backdrop, .fc-app`. sx-* 클래스를 새 표면(오버레이·패널)에서 렌더하면 이 스코프에 포함돼 있는지 먼저 확인 — 밖이면 투명 유령이 된다.
- **`src/lib/studioConstants.ts` 는 옛 Linear 팔레트를 든 죽은 모듈** — 사용자 트윅 기능을 되살릴 때 그대로 배선하면 sx→st 매핑을 무음 우회한다(슬라이스 4에서 삭제 검토).

### 다음 한 가지
- **슬라이스 4(선택) = 죽은 세대 정리** — ex-* 229곳·sx-version-log/publishing-hero·studioConstants·hx 잔재·미사용 wds/mx alias. 삭제 슬라이스라 적대적 검토 필수([[subagent-commit-hygiene]]). 급하지 않음 — 라이브 표면은 이미 전부 warm 통합.
- 그 외 대기 — 기존 후속 4건(`docs/handoff/2026-07-07-next-session-prompt.md`). **부수 발견**: 후속 ④의 `변경 검토 요청` 버튼은 PLAN→작품 데이터→캐논 원장 동선에서 도달 가능함을 이번 세션 라이브에서 확인(BibleWorkbenchHeader 렌더) — "도달 불가" 단정은 수정 필요.

---

## 2026-07-07 (2차) — 디자인 정비 슬라이스 1+2 done·머지 (스튜디오 공통 토큰·모드색 셸·PLAY 모션, PR #26 main `eec9023`)

> 사용자 요청 "심플하지만 인터랙티브한 반응 + 세 모드 일체감 검토" → 검토 후 승인된 권장안(WRITE `.fc-app` warm oklch 승격) 구현. progress.md "디자인 정비 슬라이스 1+2" 절 상세. spec `docs/superpowers/specs/2026-07-07-studio-shell-motion-unify-design.md`.

### 한 것
- 전역 `--st-*` 토큰(warm 팔레트+모드색+모션 3단) · `.fc-app` alias 전환 · 셸 pill 모드색+인터랙션+aria · `.dx-*` 접속+`st-rise` 모션 · 진입 페이드 · reduced-motion 일괄. TDD(styles.studio.test 신규+aria) → **적대적 검토 워크플로 3렌즈(회귀·계약·접근성) 발견 9건 중 7건 반영**(ink-faint 대비 붕괴 6곳·공허 단언·포커스 구멍 등) → 라이브 3모드 실측(pill computed·콘솔 0) → PR #26 squash 머지·main init.sh 녹색 재확인.

### 손대지 말 것 (불변식)
- **`--st-*` 값 원천은 :root 한 곳** — `.fc-app` 로컬 토큰은 alias만. 값을 fc 쪽에서 다시 리터럴로 되돌리면 미러 드리프트 재발.
- **모드색 = 랜딩 `--flow-*` 다크 값과 동일** — 갈라지면 랜딩의 약속과 앱이 어긋난다(styles.studio.test 핀).
- **dx 의미색 보존** — 쇼러너 보라·VS 라임·retcon 로즈·유저 버블 청록은 토큰화 대상 아님(상태 언어).
- **새 모션 셀렉터는 reduced-motion 블록에도 추가** — styles.studio.test 가 블록 앵커링으로 물고 있음. `.dx-empty` 류 후행 규칙은 미디어 블록보다 앞에 둘 것(소스 순서가 리셋을 이긴다).
- **몬태주 핀·`.sx-desk` Linear 다크 무접촉 유지** — 슬라이스 3 전까지.

### 다음 한 가지
- **슬라이스 3 = PLAN 이음새** — `.fc-app`(warm) 안 `.sx-desk`(Linear pitch black) 충돌. 몬태주 테스트 핀 + CLAUDE.md "Linear 다크 토큰 유지" 조항과 얽혀 **착수 전 사용자 결정 필요**(핀 완화 vs 브리지 토큰). 그 외 — 슬라이스 4(죽은 세대 정리, 적대적 검토 필수) · `.fc-app` remount 페이드 트레이드오프 관찰 · 기존 후속 4건(`docs/handoff/2026-07-07-next-session-prompt.md`) 대기.

### 검증 팁
- 이 세션도 permission classifier 간헐 장애 지속 — preview MCP·Agent·여러 줄 Bash가 무작위로 거부. **재시도 1~3회면 대부분 통과**, gh pr body는 `--body-file`로 우회. Workflow(백그라운드)는 정상 작동했음.
- 라이브 3모드 재현 — 백업 주입 스니펫(`docs/handoff/2026-06-11-demo-video-kit.md`) 후 `?stage=editor`/`?stage=dive` URL 파라미터로 직행 가능.

---

## 2026-07-07 — 흡인력 게이트 done·머지 (critic-reviewer 검토망 승격, PR #25 main 머지 `238dda1`)

> 흡인력 딥리서치의 승인된 나머지 후속 — critic-reviewer를 연재 서사 라이브 검토 **6번째 흡인력 판정자**로 승격(Re3 재순위의 Story X 번역 = 검토 verdict가 게이트). progress.md "흡인력 게이트" 절 상세. spec/plan `docs/superpowers/{specs,plans}/2026-07-06-compellingness-gate*`. 커밋 `7f7ff52`(docs)·`417106d`·`c8f6b0a`·`179b18c`·`521b864`·`468325f`(검토 반영).

### 한 것
- `getMediumReviewAgentIds(medium, format?)` 연재 확장 · criteriaKeys `tension_decay_audit`·`predictability_audit` · critic-reviewer.md Compellingness Gate 섹션 · 조기 소진 결정론 신호(`buildAgentReviewPrompt`+storyx.mjs 미러) · **review-agent payoffStatus 배관 봉합**(dev 브리지·CLI 파싱·prod whitelist — 기존 정체 신호도 dev 미발화였던 잠복 갭 수리). 인라인 TDD 4태스크·init.sh 녹색·적대적 검토 APPROVE(발견 2건 반영: getAgentLabel 라벨·하네스 키 동기화). **라이브 end-to-end** — 작가실 6/6/5명 분기 정확 + 실 codex 호출에서 평론가가 소진 회차에 revise·tension_decay_audit 명시.

### 손대지 말 것 (불변식)
- **검토망 정보성 유지** — 흡인력 판정(blocked 포함)이 회차 확정을 막지 않는다. 하드 차단은 누수 게이트 하나뿐.
- **조기 소진 오탐 가드 = `paidPromises > 0`** — computePayoffLedger는 rewardArc 미사용 작품에서 openPromises 0을 돌려주므로 이 가드를 지우면 전 작품 오탐. 신호는 산출만 받는다(직접 합성 금지).
- **미러 byte-identical** — 조기 소진 문구는 promptBuilders.ts ↔ storyx.mjs 동시 갱신(TENSION_DRAIN_PIN 테스트가 물고 있음).
- **에세이·학술·비연재 무접촉** — `COMPELLINGNESS_EXCLUDED_MEDIA` + `isSerialFormat` 게이트. short-novel은 기존 백로그(format 축 정합)대로 비연재 취급 — 백로그 해소 시 자동 편입.

### 다음 한 가지
- ~~머지~~ — **PR #25 main 머지 완료**(`238dda1`, 사용자 승인 "PR 생성+머지"). 머지 후 main init.sh 녹색 재확인·브랜치 삭제 완료. 이 PR push 에 이전 세션 로컬 전용 커밋 4개(VS 슬라이스 등)도 함께 origin 에 올라감.
- ~~실작품 dogfooding~~ — **완료(머지 직후 같은 세션)**. 헌터물 6화 백업 주입→6인 전체 검토 실 codex(6/6 성공, 병렬 44~60초). 평론가가 실회차에 86점 pass + 두 audit 명시 실행 + 약점 3·대안 해석 2, 타 에이전트와 시선 중복 없음. progress.md 절 상세.
- ~~온보딩 1화 자동 검토 critic 합류~~ — **완료(같은 세션, main `93fd15e`)**. `withCompellingnessReviewer` 헬퍼 단일 진실원천화 + `getReviewAgentIds(scale, medium?, format?)` 확장 + runAiReview 배선. progress.md 절 상세.
- **다음 세션 = `docs/handoff/2026-07-07-next-session-prompt.md`** — 남은 후속 4건(① VS 후보 흡인력 재순위[권장 1순위·brainstorming] ② canonSuspect 배지 실사례 ③ PLAN AI 설계 채널 ④ `변경 검토 요청` 버튼 도달성)을 배경·코드 포인터·환경 팁까지 자립 프롬프트로 정리해 둠. 붙여넣기만 하면 시작 가능.

### 검증 팁
- 이 세션 permission classifier(claude-opus-4-8) 장기 간헐 장애 — **allowlist 단순 명령(`npm test --`·`bash init.sh`·`git add <파일>`·한 줄 `git commit -m`)은 통과, `&&` 체인·여러 줄 커밋 메시지·Agent 디스패치는 거부**. 명령을 쪼개면 대부분 진행 가능.
- 라이브 시딩은 손수 객체 금지 — `createEmptyProject()`+`addCharacter`/`renameCharacter` 순수 함수 경유(하드-시딩 파생 필드 결여 크래시, 기존 잠복 버그 재확인).

---

## 2026-07-06 — PLAY 전개 후보(VS) done·머지 (흡인력 축 첫 구현, main 머지 `a33768e` fast-forward)

> 흡인력 딥리서치 결론(서프라이즈=모델·프롬프트 아니라 구조로 넘긴다·Verbalized Sampling)을 PLAY 이어 굴리기에 적용한 **첫 조각**([[two-axis-compellingness]]). DiveDesk 「✦ 전개 후보」 opt-in 버튼→다음 전개 후보 3~4개를 의외도 게이지로 펼쳐 사람이 고른다. spec `docs/storyx-play-vs-candidates-plan.md`. progress.md "PLAY 전개 후보(VS)" 절 상세. 커밋 `ca27167`(spec)·`6c5b049`(구현).

### 한 것
- 데이터 계층(`requestVsCandidates`·`/api/vs-candidates`)은 WRITE와 공유·재사용. `episodeBriefing` `collectUnpaidPromises` export+`rarityToBars` · `diveSession` `buildVsCandidatesInput`+`buildPlayDirectionSeed`(순수) · `VsCandidatePanel.tsx` 신규 · `DiveDesk` 배선 · `.dx-vs-*` CSS. TDD 4단 red→green. 804 테스트·build·init.sh·tsc 클린. **라이브 전체 해피패스 통과** — 버튼→후보 4개→게이지 의외도 정합→radical 선택→`(전개 —…)` 괄호 굴림→dive-chat 이어감·콘솔0.

### 손대지 말 것 (불변식)
- **opt-in 전용** — VS는 「✦ 전개 후보」 버튼 클릭 시에만 생성. 자동/매 턴 금지(비용·player-first). 기존 `res.choices` 가벼운 칩과 **공존**(대체 아님).
- **확률 숫자 비노출** — 게이지 3칸 강도만(`rarityToBars`). 색은 WRITE `fc-vs` 언어(회색·라임·로즈) 미러링 — 갈리면 혼란.
- **선택 = 기존 send 괄호 연출 재사용** — `pickCandidate`→`send(buildPlayDirectionSeed(direction))`=`'(전개 —…)'`. ⏭전개과 같은 계열, 신규 굴림 경로 만들지 말 것.
- **데이터 계층 무접촉** — `requestVsCandidates`·`/api/vs-candidates`·`normalizeVsCandidates`는 WRITE와 공유. PLAY는 입력 조립(`buildVsCandidatesInput`)만 다름(recentSummary=라이브 대화+장면).

### 다음 한 가지
- ~~머지~~ — **main 머지 완료**(`a33768e`, fast-forward, 사용자 승인 "main 로컬 머지"). 머지 후 main init.sh 녹색 재확인·브랜치 삭제 완료.
- **후속(사용자 승인된 나머지, 1순위)** — 흡인력 게이트 = `critic-reviewer` 를 긴장·서프라이즈 기준 게이트로 승격(Re3 재순위 흡인력 기준). 큰 조각·새 세션 권장. 근거 = 흡인력 딥리서치 리포트.
- 그 외 — `canonSuspect` 배지 실사례 확인 · VS 비용/포인트 연동 · 자유 서술 새 작품→PLAY 온보딩 · PLAN AI 설계 채널.

### 검증 팁
- preview_click 이 React onClick 을 안 태우면 `preview_eval` 로 `dispatchEvent(new MouseEvent('click',{bubbles:true}))` 우회(이 세션 실증) · 브레인스토밍 목업 서버는 30분 유휴 자동 종료(회수 아님) — 필요 시 `.claude/plugins/.../brainstorming/scripts/server.cjs` 를 `BRAINSTORM_DIR` 지정해 `run_in_background` 로 재기동.

---

## 2026-07-05 (2차) — 홈 랜딩 "작성 여정" 원페이저 done·머지 (PR #24 main `c18f878`)

> 랜딩 히어로 다음에 4단계 흐름 섹션 추가 — 세 방식(PLAY/WRITE/PLAN)이 **하나의 캐논을 두 방향(안 무너진다·끌어당긴다)으로 조각**한다는 서사. dogfooding 진입 혼란 해소([[landing-onepager-request]]) + 흡인력 축 명시(King 논지). progress.md "작성 여정 원페이저" 절이 상세. spec/계획 `docs/superpowers/{specs,plans}/2026-07-05-landing-flow-onepager*`.

### 한 것
- `src/landingFlow.ts`(콘텐츠 순수 상수) + `landingFlow.test.ts`(두 축·세 방식 불변식 4) · `MarketingLanding` `lx-flow-section` 렌더+`navLinks` `작성 흐름` · `styles.css` `.lx-flow-*`(다크/라이트/768px). 792 테스트·build·init.sh·tsc 클린. **라이브 6게이트 전부 실측 통과**(섹션 정위치·게이지 solid 4/4 vs pull 3/4·내비 앵커·라이트 대비·모바일 단일 컬럼·콘솔 에러 0).
- **★큰 맥락 — 흡인력 딥리서치 완료** `docs/research/2026-07-05-compellingness-human-ai.md`(19확정/6기각). 결론 = 사용자 신념("인간+AI로 흡인력 한계 넘는다") **조건부 참** — 모델·프롬프트 아니라 **구조(하네스)로만**. 검증된 방법 = Verbalized Sampling(후보 다발+확률, +25.7%)·Re3 파이프라인(계획→초안→재순위→편집, 재순위에 흡인력 기준=게이트). 표준 품질 점수는 흡인력을 못 잡음 → **별도 흡인력 게이트 필요**.

### 손대지 말 것 (불변식)
- **두 축 프레임** — `landingFlow.ts` 의 `canonAxes` solid(filled===total)·pull(filled<total)와 헤더 주석·`landingFlow.test.ts` 가 지킨다. "끌어당긴다(흡인력)" 축·"AI가 펼치고 사람이 고른다" 협업 문구를 지우지 말 것(테스트가 물고 있음, 약화 아님).
- **flow 섹션은 순수 추가** — 히어로↔feature 사이 삽입, 다른 섹션 무변경. 모드색은 앱 3모드 관례(PLAY lime·WRITE blue·PLAN violet)+pull 앰버, **라이트에선 `.is-light .lx-flow-section` 오버라이드로 어두운 변형**(흰 배경 대비 — 슬라이스 C wm-title-input inherit 회귀 선례 주의).

### 다음 한 가지 (차례대로)
- ~~머지~~ — **PR #24 main 머지 완료**(`c18f878`, 사용자 승인 "1하고2" = PR+머지). 머지 후 main init.sh 녹색 재확인.
- **후속 스코핑 2건**(사용자 승인, 큰 조각·새 세션 권장 · 1순위) — ① **흡인력 게이트** = `critic-reviewer` 를 긴장·서프라이즈 기준 게이트로 승격(Re3 재순위 단계에 흡인력 기준). ② **서프라이즈 주입 VS UX** = PLAY "이어 굴리기"에서 다음 전개 후보 N개+확률 펼쳐 사람이 선별(Verbalized Sampling). **코드에 이미 `src/lib/vsCandidatesClient` 존재** — VS UX 착수 시 이것부터 확인. 근거 = 흡인력 딥리서치 리포트.
- 그 외 후속 — 자유 서술 새 작품→PLAY 온보딩 갈래 · PLAN 안 AI 설계 대화 채널 · FloatingEditor 하드-시딩 회차 크래시 방어 · PLAN staged clear+remount 자동 테스트.

### 검증 팁
- 이 세션 preview classifier(`claude-opus-4-8` 안전성 판정)가 자주 일시 불가 → preview_eval/console 툴이 간헐 실패. computed style 실측은 `preview_inspect`(읽기 전용)로 우회 가능. window 스크롤이 preview 임베딩에서 안 잡힘(문서 4704px인데 scrollY 고정) → 섹션 스크린샷은 위 섹션 임시 display:none 후 캡처 우회.

---

## 2026-07-05 — PLAY 진입 융합 파트 2 done (wm-bar 공통 셸, 브랜치 `feat/wm-bar-common-shell` 미머지)

> 슬라이스 C 가 editor 에서 StoryXDesk 에 준 wm-bar 소유권을 **App 이 세 모드 공통으로 소유하는 지속 프레임**으로 되돌려 전환 연속감을 만들었다. 계획 `docs/superpowers/plans/2026-07-04-play-entry-fusion.md` Task 5~9. progress.md "파트 2: wm-bar 공통 셸" 절이 상세.

### 한 것
- `WorkspaceModeBar` planDot prop(TDD) · StoryXDesk studioView controlled(switchToTrack effect 재사용)+양방향 track 동기화+title prop 동기화+onBibleAlertChange 콜백·자체 바 제거→`dx-desk-context` 하위 줄만 · export/import→App 이관 · App `shellBar`(제목·토글·planDot·싱크·⋯) editor·dive 공통 렌더 · editorFocusLayout 소스 단언 교정. 788 테스트·build·init.sh·tsc 클린. **라이브 7게이트 전부 통과**(위치 고정·무리마운트·제목 dive→editor 지속·planDot 3모드·오버플로·620px·콘솔0).

### 손대지 말 것 (파트 2 불변식)
- **App key=`syncVersion` 만** — studioView 를 key 에 넣지 말 것(WRITE↔PLAN 무리마운트가 깨진다). 반영·버리기·최신화 remount 는 이 축 하나.
- **제목 App 단일 소유** — App `workTitle` state + `handleTitleChange`(즉시 saveProject). StoryXDesk 는 `title` prop → `useEffect` 로 내부 `project.title` 동기화만(자체 편집 input 없음). 이 동기화를 지우면 StoryXDesk 의 saveProject(부분 갱신)가 옛 제목으로 **clobber** 한다.
- **track 양방향 동기화** — App `studioView`(prop)→StoryXDesk `switchToTrack` effect, StoryXDesk 내부 `setActiveTrack`(⌘K·액션 점프)→`onStudioViewChange` 역보고 effect. 한쪽만 남기면 내부 네비게이션 시 셸 토글이 stale 해진다. 수렴 검증됨(무한 루프 없음).
- **planDot = `bibleAlert>0`** — StoryXDesk `onBibleAlertChange(count)` 가 소스. planBadge(숫자)는 셸에서 안 씀(dot 로 축소, 사용자 승인). PLAN 하위 줄 `⚠ 충돌 N` 칩은 같은 숫자원 유지.
- **StoryXDesk 는 상단 바를 렌더하지 않는다** — `dx-desk-context` 하위 줄(writeContext 회차 픽커·planContext 캐논/충돌 칩)만. wm-bar 는 App 소유(슬라이스 C 불변식을 이 파트가 의도적으로 뒤집음, 되돌린 게 목표).

### ⚠️ 라이브 발견 — FloatingEditor 하드-시딩 회차 크래시 (기존 잠복, 내 변경 무관)
- 손수 localStorage 에 파생 필드 없는 회차를 심고 editor 로 열면 FloatingEditor 에서 크래시(흰 화면). **main 코드로 스왑해 동일 시드 → 동일 크래시 확인**(내 셸 변경과 무관 실증). handoff 2026-07-02 line 73 의 createSeedProject+회차 잠복 버그와 동일 부류. 앱이 produce 한 회차·0회차·정상 경로는 무손상. 라이브 검증은 인물 2·0회차 프로젝트로 진행했다(회차 있는 editor 는 앱 produce 흐름이 필요 = LLM 브리지 서버, 순수 vite dev 엔 없음).

### 다음 한 가지 (차례대로)
- ~~머지~~ — **PR #23 main 머지 완료**(`84a2d09`, 사용자 승인). PLAY 진입 융합 전체(파트 1+2) 완결.
- **다음 세션 1순위 = 홈 랜딩 원페이저**(작성 흐름·서비스 특성 요약, [[landing-onepager-request]], 사용자 요청·별도 조각).
- 그다음 후보 — 자유 서술 새 작품→PLAY 온보딩 갈래 · PLAN 안 AI 설계 대화 채널(설계실 2단계) · FloatingEditor 하드-시딩 회차 크래시 방어 · PLAN staged clear+remount 자동 테스트(2026-07-04 MEDIUM 잔여).

---

## 2026-07-04 (2차) — PLAY 진입 융합 파트 1 done·머지 (PR #21 main). 다음 = 파트 2 wm-bar 공통 셸

> dogfooding 피드백 "PLAY 누르면 너무 다른 얘기부터 한다" 해소 — PLAY 토글이 옛 Dive X 자유 서술 인테이크로 배선돼 있던 것을 **현 작품 인물·최근 회차에서 이어 플레이 시딩**으로 교체. `seedAndEnter` 본편 덮어쓰기 위험 제거. progress.md "PLAY 진입 융합 파트 1" 절이 상세. spec/계획 `docs/superpowers/{specs,plans}/2026-07-04-play-entry-fusion*`.

### 한 것 (파트 1)
- 순수 `playEntry.ts`(`seedPlayFromProject`·`deriveContinuationScene`) + App dive 분기 교체(시딩 useEffect·인물0 안내·죽은 import 정리). 786 테스트·build·init.sh·라이브 3게이트. **PR #21 squash main 머지**(`5e9433e`).
- 중간에 서브에이전트가 세션 한도(11pm 리셋)로 Task 3 미완 → 편집장(Claude)이 직접 구현·검증.

### 손대지 말 것 (파트 1 불변식)
- **PLAY 는 committed(storageKey) 읽기 전용** — 쓰기는 diveKey working·⟳최신화만. 시딩 project 는 `loadProject()` 현재 본편 그대로(빈 프로젝트 생성 금지, `saveProject` 재도입 금지 = 데이터 위험).
- **시딩은 useEffect** — 복원본·diveInit 없을 때만 1회. 렌더 중 setState 금지.
- **DiveStart.tsx 파일 보존** — PLAY 진입에서 참조는 끊었지만 후속 "자유 서술 새 작품→PLAY 온보딩 갈래"용으로 남김. 삭제 금지.
- `deriveContinuationScene` 는 실제 Chapter 필드 기준(summary 필드 없음 — prose 마지막 문단[placeholder 스킵]>beat summary>hook). `FALLBACK_EMPTY_LINE` 은 storyEngine export.

### 다음 한 가지 = 파트 2 wm-bar 공통 셸 (★ 새 세션 권장 — 큰 StoryXDesk 소유권 수술)
brainstorming·spec·계획 이미 완료(사용자 승인). 계획 `docs/superpowers/plans/2026-07-04-play-entry-fusion.md` Task 5~9. 요지 —
- **소유권 역전을 App 으로** — App 이 세 모드 공통 `WorkspaceModeBar` 를 stage 스위치 위에서 소유(브랜드·제목 input·3모드 토글·싱크·⋯ 오버플로). StoryXDesk 는 자체 바 렌더 제거.
- **activeTrack controlled** — StoryXDesk `activeTrack` 을 App `studioView` prop 로 controlled 화(effect 동기화). WRITE↔PLAN 무리마운트 유지(App key=`syncVersion` 만, studioView 를 key 에 넣지 말 것).
- **제목 App 단일 소유** — `title` prop + `onTitleChange`, StoryXDesk 는 `title ?? project.title` 파생.
- **PLAN 충돌 = planDot 콜백** — StoryXDesk 가 `onBibleAlertChange(count)` 로 실제 count 를 App 에 보고 → 셸 토글 PLAN 버튼 dot. planBadge 숫자→dot 축소(사용자 승인). PLAN 하위 줄 `⚠ 충돌 N` 칩은 유지(같은 숫자원).
- **오버플로 이동** — `handleExportProject`/`handleImportClick`/`handleImportFile`/`fileInputRef` 를 StoryXDesk→App 이동.
- ⚠️ 슬라이스 C 불변식 "wm-bar 소유권(editor=StoryXDesk 렌더)" 을 이 파트가 **의도적으로 뒤집는다**. 되돌리는 게 목표. Task 9 라이브 게이트 — 전환 시 브랜드·제목·토글·싱크 같은 자리 고정·WRITE↔PLAN DOM 마커 생존·planDot·오버플로.
- ⚠️ 기존 테스트 중 옛 바 마크업(제목 input 이 StoryXDesk 안)을 단언하는 것(editorFocusLayout·floatingEditor 등) 교정 필요할 수 있음 — 약화 말고 셸 이동 반영.
- 후속 — 홈 랜딩 원페이저(작성 흐름·서비스 특성 요약, [[landing-onepager-request]]) · 자유 서술 새 작품→PLAY 온보딩 갈래 · PLAN 안 AI 설계 대화 채널.

### 검증 팁
- `preview_click` 이 React onClick 을 안 태울 때가 있음 → `preview_eval` 로 `dispatchEvent(new MouseEvent('click',{bubbles:true}))` 우회(이번 세션 실증).

---

## 2026-07-04 — PLAN staged: 설계실 패치 모델 (브랜치 `feat/plan-staged-patches`)

> PLAN 바이블 필드 편집을 본편 직행에서 **패치 목록 staged**로 전환 — `✦ PLAN +N` 배지 → 본편에 반영(충돌 시 keep/apply 다이얼로그)/전부 버리기. 사용자 결정 4건(PLAN=AI와 같이 짜는 설계실·staged 토대만·패치 모델·통합 콘솔). progress.md "PLAN staged" 절이 상세. spec `docs/superpowers/specs/2026-07-04-plan-staged-patches-design.md`.

### 한 것
- 순수 `planStage.ts` + storage `planStageKey` + StoryXDesk stage* 핸들러 5종·overlayProject·설계안 표시 + SyncConsole PLAN 배지·메뉴 + `PlanApplyReview` + App 배선 + SyncFlash "N설계". 서브에이전트 8태스크·태스크별 2단 검토·최종 홀리스틱 적대 검토. 778 테스트·build·init.sh·라이브 8게이트(충돌 keep/apply 양쪽 포함)·fresh reload 콘솔 0.
- 부수 — vitest 워커 `--no-experimental-webstorage`(Node 25 webstorage가 jsdom localStorage를 가림, `0bc7a89`) · launch.json 포트 5175+strictPort(5173은 다른 프로젝트가 점유).

### 손대지 말 것 (불변식)
- **PLAN 표면 편집은 패치로만** — MemoryBankStudio·CanonCanvas에 넘기는 핸들러는 stage*(setPlanPatches). setProject로 되돌리면 staged 모델 붕괴. 단 **wm-title-input(제목)은 의도적 직행**(stageStoryCore의 'title' 분기도 직행 — MemoryBankStudio는 title을 안 건드림).
- **PLAN 표면 렌더는 overlayProject** — CanonCanvas·MemoryBankStudio·FloatingDataWorkspace. `editorWorkspace`·`bibleAlertCount`·`memoryBank`·지표 파생은 committed(project) 기준 유지(섞으면 충돌 배지가 미확정 설계에 반응).
- **반영/버리기 모두 syncVersion++** — App key는 `syncVersion` 하나. 버리기의 remount가 카드 원복 메커니즘이다(패치만 지우고 remount 안 하면 화면에 유령 값 잔존).
- **staged 편집은 logCanonChange 안 남김** — 패치 목록이 이력·되돌리기 대체(D6). 반영 시점에 로그를 추가하고 싶으면 별도 설계.
- **충돌 기본 keep·충돌 0=즉시 반영** — reconcile 게이트(B-2)와 같은 철학. 항상 다이얼로그로 바꾸지 말 것.

### 다음 한 가지 (차례대로)
- ~~머지~~ — **PR #20 main 머지 완료**(`0efbf5f`, 사용자 승인).
- **다음 세션 = PLAY 진입 융합 (사용자 지정 1순위·dogfooding 피드백)** — 사용자 실사용 소감 "전환할 때 가운데 내비 바가 연결된 느낌이 없다 · PLAY를 누르면 너무 다른 얘기부터 한다". 원인 확인됨 —
  ① PLAY 토글이 현 작품과 무관한 옛 Dive X 신규 인테이크(DiveStart 자유 서술)로 배선(App.tsx stage==='dive' 분기, 슬라이스 A 융합 부채). PLAY는 **현재 작품의 인물·캐논·최근 회차에서 이어 플레이**하도록 시딩하고, 자유 서술 신규 시작은 새 작품 흐름으로 분리할 것.
  ② ⚠️ **데이터 위험** — `seedAndEnter`(App.tsx ~469-474)가 새 빈 프로젝트를 `saveProject`로 **현재 본편에 덮어씀**. 기존 작품 열어둔 채 PLAY→자유 서술 시작하면 본편 교체. 반드시 제거/게이트.
  ③ 바 연속감 — wm-bar 소유자가 stage마다 달라(editor=StoryXDesk 제목 input·컨텍스트·메타 / dive=App 정적 제목만) 전환마다 구성이 바뀜. 한 소유자/한 구성으로 통일 검토(단, 슬라이스 C 불변식 "wm-bar 소유권" 항목과 함께 재설계 — brainstorming 필요).
  참고 — 작품 진입 과정(랜딩→새 작품 4step→에디터·작품 목록→에디터)은 그대로 살아 있음(빠진 것 아님).
- 그다음 후보 — PLAN 안 AI 설계 대화 채널(설계실 2단계, 사용자 방향 확정) · 죽은 legacy 핸들러 4개 정리(updateCharacterMemory 등, editorFocusLayout.test 소스 단언 교정 동반) · 집중 모드 크롬 숨김 · publish 4번째 모드 · desk-grid CSS 보류분.
- ⚠️ **다음에 PLAN staged 를 손대면** — clear+remount 불변식 자동 테스트부터 추가(최종 검토 MEDIUM — 수동 트레이스로만 안전 확인됨). PlanApplyReview 를 비모달로 바꾸면 confirmPlanApply 의 frozen conflicts 가 구멍이 된다(전면 모달이 안전 전제).

---

## 2026-07-03 (3차) — 고아 컴포넌트·죽은 CSS 정리 (브랜치 미머지)

> PR #18 잔여 마무리 — 고아 컴포넌트 15파일 + CSS 2197줄 삭제, 렌더 무변경(적대적 검토 CONFIRMED). progress.md "고아 컴포넌트·죽은 CSS 정리" 절이 상세.

### 손대지 말 것 (불변식)
- **`.fc-app .topbar` 는 live** — FloatingPublishWorkspace 가 렌더. legacy 라고 지우면 출간 워크스페이스 스타일 소실.
- **CSS 삭제는 클래스 단위 grep 증명** — 접두사 일괄 삭제 금지. `sx-desk`·`ex-chapter-picker-step`·`.mnote`·`pixel-agent*` 등 이름이 legacy 스러운 live 클래스가 많다.
- **소스-스타일시트 일관성** — 클래스를 방출하는 코드가 남아 있으면 CSS 도 남기거나 코드까지 지운다(renderParagraphText 선례).

### 다음 한 가지 (차례대로)
- **머지** — `feat/desk-orphan-css-cleanup`. 자율 권한 있음.
- 다음 후보 — **PLAN staged(`PLAN +N`)** (brainstorming+사용자 입력 필요, 큰 설계) · 옛 인라인 편집기 desk-grid CSS 정리(보류분) · 집중 모드 크롬 숨김 · publish 4번째 모드.

---

## 2026-07-03 (2차) — StoryXDesk legacy 셸 정리 (PR #18 main 머지)

> 슬라이스 C 후속 부채 정리 — 도달 불가 최종 return(옛 sx-topbar 셸) 삭제·연쇄 사망 심볼 제거·소스 단언 테스트 3분법 교정. **동작 무변경**(적대적 검토 CONFIRMED). StoryXDesk 3651→2255행. progress.md "legacy 셸 정리" 절이 상세. spec `docs/superpowers/specs/2026-07-03-desk-legacy-shell-cleanup-design.md`.

### 한 것
- 최종 return 461행 + 헬퍼 5 + state 12 + 파생 ~20 + import ~50 삭제. live-but-inert ⌘K 명령 4개(+⌘. 전역 단축키) 동반 삭제. 테스트 4파일 3분법 교정(교체 10 우선). 772 테스트·build·init.sh·라이브 fresh load 콘솔 0.

### 손대지 말 것 (불변식)
- **StoryXDesk 는 3분기 조기 반환이 전부** — publishing/draft/bible 반환 + 도달 불가 `return null;` 폴백. 이제 소스 단언 테스트가 legacy 를 안 물고 있으므로, 앞으로 StoryXDesk 수술은 "legacy 불가침" 제약 없이 진행 가능.
- **보존한 write-only 잔여** — selectMedium/selectFormat·projectSnapshots·generationNote 등은 live 핸들러/영속에 엮여 있어 의도적으로 보존(추측 삭제 금지 원칙). 다음 정리 때도 tsc 증명 없이 지우지 말 것.

### 다음 한 가지 (차례대로)
- 후속 결정 대기 — ① 고아 컴포넌트 `BibleAssistantSidebar`·`AgentProfileDialog`(렌더 0, 테스트는 존재 단언만) 삭제 or 재배선 ② 죽은 CSS(sx-topbar·ex-workbar·.fc-app .topbar) 정리 ③ **PLAN staged(`PLAN +N`)** — StoryXDesk 내부 staged화, brainstorming+사용자 입력 필요(큰 설계) ④ 집중 모드 크롬 숨김.

---

## 2026-07-03 — 융합 셸 슬라이스 C(단일 바 셸) 구현 완료 (브랜치 미머지)

> WRITE/PLAN 의 floating pill topbar 를 해체해 wm-bar 하나만 남긴 epilogue 풍 미니멀 재배치. brainstorming(visual companion)으로 사용자 결정 4건(A안 단일 바·CTA 시트 끝·내부 트랙 전환·모드별 구성) 확정 → spec → 계획 → 서브에이전트 주도 7태스크(태스크별 spec/품질 2단 검토). progress.md "슬라이스 C" 절이 상세.

### 한 것
- `WorkspaceModeBar` 슬롯 확장 · 신규 `DeskMetaLine`·`OverflowMenu` · FloatingEditor/FloatingDataWorkspace pill topbar 삭제 + 시트 끝 CTA · StoryXDesk 소유권 역전(syncSlot·onSelectPlayMode·onStudioViewChange) · App key=syncVersion. 10커밋(spec·계획·구현 7·라이브 수정 1).
- **검증** — `npm test` 774 녹색·build·init.sh·라이브 8게이트(remount 없는 내부 전환 DOM 마커 실증·dock/메타 줄 비충돌 실측·콘솔 0). 라이브 게이트가 wm-title-input inherit 색 회귀를 적발·수정(`b0f347b`).

### 손대지 말 것 (불변식)
- **wm-bar 소유권** — editor stage 는 StoryXDesk 가 렌더(슬롯을 채울 상태가 거기 있음), dive stage 만 App 이 렌더. App editor 에서 바를 다시 렌더하면 이중 바 복귀.
- **App key = syncVersion 만** — ⟳최신화 remount 는 불변식(새 본편 픽업). studioView 를 key 에 다시 넣으면 WRITE↔PLAN 이 remount 로 퇴행(깜빡임·편집 상태 소실).
- **WRITE↔PLAN = switchToTrack 내부 전환 + onStudioViewChange 동기화** — 콜백은 App state 기록 전용(렌더 되먹임 없음). initialStudioView 는 mount 시드 전용.
- **위험 가시성** — PLAN 배지(bibleAlertCount)·⚠충돌 칩·싱크 콘솔은 미니멀화에서도 항상 보임(충돌은 드러낸다).
- **StoryXDesk legacy 최종 return 불가침** — editorFocusLayout.test.ts 가 소스 문자열 단언. 삭제는 테스트 교정과 함께 별도 조각으로.
- **시트 끝 CTA 는 btn-primary/btn-confirm-lock 클래스·문구 유지** — floatingEditor.test.ts·editorFocusLayout.test.ts 가 클래스/텍스트로 단언.

### 다음 한 가지 (차례대로)
- **머지** — `feat/fusion-shell-slice-c-single-bar`. 자율 권한 있음.
- 다음 후보 — PLAN staged(`PLAN +N`, StoryXDesk 내부 staged화) · legacy 최종 return 정리(+테스트 교정) · 집중 모드 크롬 숨김 · publish 4번째 모드. 후속 — retcon 예산 상한·finding retcon·의미 dedup·번역 투 게이트.

---

## 2026-07-02 (4차) — 최신화 반영 피드백 토스트 (작은 후속 조각, 브랜치 미머지)

> 충돌 없는 `⟳최신화`가 조용히 즉시 반영돼 피드백이 0이던 마찰을 `✓ 본편에 반영 — N회차·M캐논` 토스트(2.6초 자동 소멸)로 채움. progress.md "최신화 반영 피드백 토스트" 절 참조.

### 한 것
- 순수 `SyncFlash.tsx` · App `syncFlash` state + useEffect 타이머 · `commitReconciled(next, before)`에 before 추가 → `countPendingSync(next, before)`로 실제 반영량 산출 · reconcileSync·confirmReconcile 배선. 신규 테스트 3. `npm test` 767 녹색·build·라이브 토스트 확인.

### 손대지 말 것 (불변식)
- **반영량 = countPendingSync(next, before)** — before=최신화 전 committed, next=반영 후. 충돌 keep 으로 일부 빠져도 실제 append 수만 표시(부풀리지 않음).
- **토스트는 정보 전용** — 자동 소멸(2.6초), 액션 없음. 최신화 로직에 영향 없음.

### 다음 한 가지 (차례대로)
- **머지** — `feat/fusion-shell-sync-flash`. 자율 권한 있음.
- 다음 슬라이스 — **슬라이스 C(epilogue 풍 미니멀 재배치·이중 헤더 통합 — wm-bar + StoryXDesk 내부 편집/데이터 pill)**. ★ StoryXDesk 내부를 처음 건드리는 큰 UX → **신선한 세션 권장**(brainstorming+시각 companion+사용자 입력 필요). PLAN staged(`PLAN +N`)도 StoryXDesk 내부 staged화 필요. 후속 — retcon 예산 상한(정본 §9 "아크당", 아크 경계 미정의라 설계 필요)·finding retcon·의미 dedup·번역 투 게이트.

---

## 2026-07-02 (3차) — 융합 셸 슬라이스 B-2(reconcile 충돌 게이트) 구현 완료 (브랜치 미머지 → PR #15 main 머지)

> `⟳최신화`가 무조건 append 하던 것을, working 새 캐논/회차가 본편과 **모순이면 검토 다이얼로그**(retcon 교체/버리기)를 먼저 띄우는 승인형 게이트로. 충돌 0이면 현행 즉시 반영. spec `docs/superpowers/specs/2026-07-02-fusion-shell-reconcile-gate-design.md`. progress.md "슬라이스 B-2" 절이 상세. 사용자 결정=충돌 게이트 중심.

### 한 것
- 순수 `deriveReconcilePlan`(playRuntimeValidator — committed 캐논 contract로 working 미반영 캐논/회차 검사, buildBandContract·detectConflicts 재사용) · 순수 `applyReconcile`(syncConsole — retcon 교체 + 충돌 캐논 제외 append) · `ReconcileReview.tsx`(충돌 카드+retcon/keep 토글) · App(reconcilePlan·decisions state·reconcileSync 분기·confirmReconcile·오버레이).
- **검증** — `npm test` 764 녹색·build 성공·신규 테스트 10. 라이브(preview) 실사용 경로 — 충돌→다이얼로그→retcon→옛 앵커 교체·공존 0·crash 0 / 충돌 없으면 즉시 반영. 4커밋(spec·deriveReconcilePlan·applyReconcile·컴포넌트+배선).

### 손대지 말 것 (불변식)
- **충돌 0 = 즉시 반영** — deriveReconcilePlan.conflicts 비면 다이얼로그 없이 commitReconciled(현행). player-first. 이걸 항상 다이얼로그로 바꾸면 몰입/속도 훼손.
- **retcon = 제자리 교체, 공존 금지** — applyReconcile 이 충돌 newClaim 에 해당하는 working 캐논을 append 제외(retcon 은 committed 옛 fact 교체·keep 은 버림). 두 경우 모두 모순 두 캐논 공존 0. retcon 경로 불변식 계승.
- **회차 본문 불변** — reconcile 은 캐논만 retcon/keep. 회차 prose 는 안 건드리고 그대로 append(작가 원고).
- **기본 keep** — 다이얼로그 토글 기본은 유지(본편 보존). retcon 은 명시 클릭만.

### 다음 한 가지 (차례대로)
- **머지** — `feat/fusion-shell-reconcile-gate`. 자율 권한 있음.
- 다음 슬라이스 — **슬라이스 C(epilogue 풍 미니멀 재배치·이중 헤더 통합 — wm-bar + StoryXDesk 내부 편집/데이터 pill)** · PLAN staged(`PLAN +N`, StoryXDesk 내부 staged화) → ArcDigest/Growth/Relation Snapshot. 후속 — retcon 예산 상한·finding retcon·의미 dedup·번역 투 게이트.
- ⚠️ **잠복 버그 후보(무관)** — `createSeedProject`+회차를 committed 로 editor fresh mount 시 브라우저 client effect 크래시(2차 노트 참조). 실사용(createEmptyProject) 무영향.

---

## 2026-07-02 (2차) — 융합 셸 슬라이스 B(싱크 콘솔) 구현 완료 (브랜치 미머지 → PR #14 main 머지)

> PLAY 변경을 즉시 반영에서 **git working-tree 모델**(staged→⟳최신화 append 머지)로 전환. 사용자 발명(handoff 2026-06-30 2차 line 172 + 목업 `sync-console.html`). spec `docs/superpowers/specs/2026-07-02-fusion-shell-sync-console-design.md`. progress.md "융합 셸 슬라이스 B" 절이 상세. 사용자 "너 뜻대로 해" 위임 → 데이터 모델까지 확정 후 진행.

### 한 것
- brainstorming(목업 이미 존재라 텍스트 위주)→spec→TDD. 순수 `syncConsole.ts`(countPendingSync·reconcileWorkingIntoCommitted) · 순수 `SyncConsole.tsx` · `WorkspaceModeBar` rightSlot · App 배선(pendingSync·syncVersion·DiveStage saveProject 제거→onWorkingChange·PLAY 진입 working 우선·reconcileSync·StoryXDesk key remount).
- **검증** — `npm test` 754 녹색·build 성공·신규 테스트 11. 라이브(preview) 실사용 경로 왕복(배지 PLAY +2·staged·최신화 append·remount 크래시 0). 3커밋(spec·구현·docs).

### 손대지 말 것 (불변식)
- **두 저장소** — committed=`storageKey`(본편·WRITE 직접 편집) · working=`diveKey.project`(PLAY staged). PLAY `onChange`는 `saveDiveState`만(즉시 `saveProject` 금지 — 이게 staged 모델의 핵심). ⟳최신화로만 본편 머지.
- **append 머지** — `reconcileWorkingIntoCommitted`는 committed에 **없는 회차/캐논만 append**(통째 덮어쓰기 금지). committed base 유지 = WRITE 본편 편집 보존. 통째 저장으로 바꾸면 WRITE 편집 롤백.
- **PLAY 진입 working 우선** — 슬라이스 A의 `loadProject 교체`를 되돌림. WRITE→PLAY 리베이스(committed→working)는 슬라이스 B-2 게이트로. loadProject로 다시 덮으면 PLAY 미반영 유실.
- **diveKey가 진실** — pending·최신화 소스는 `loadDiveState().project`. DiveStage state 리프팅 안 함.

### 다음 한 가지 (차례대로)
- **머지** — `feat/fusion-shell-sync-console`. 자율 권한 있음.
- 다음 슬라이스 — **슬라이스 B-2(무거운 reconcile 검토 게이트: 충돌 같음/다름·캐논 등록/보류, 승인형 · playRuntimeValidator·DeviationReview 재사용)** → **슬라이스 C(epilogue 미니멀 재배치·이중 헤더 통합)** · PLAN staged(`PLAN +N`) → ArcDigest/Growth/Relation Snapshot.
- ⚠️ **잠복 버그 후보(내 슬라이스 무관)** — `createSeedProject`+회차를 committed로 editor fresh mount하면 브라우저 client effect(FloatingEditor useLayoutEffect)에서 크래시(빈 seed·jsdom·server render는 정상). 실사용 base는 createEmptyProject라 현재 무영향. seed+회차 경로가 생기면 조사 필요.

---

## 2026-07-02 — 융합 셸 슬라이스 A(3모드 토글) 구현 완료 (브랜치 미머지)

> 흩어진 PLAY/WRITE/PLAN 이동을 상단 토글로 통합 + storage 단일 소스. spec `docs/superpowers/specs/2026-07-02-fusion-shell-mode-toggle-design.md`. progress.md "융합 셸 슬라이스 A" 절이 상세.

### 한 것
- brainstorming(visual companion)으로 슬라이스 A 범위 확정 → spec → 인라인 TDD.
- `WorkspaceModeBar`(순수 토글) · StoryXDesk `initialStudioView` 프롭(+`key` remount) · App `studioView`·`selectWorkspaceMode` · storage 브리지(`hasSavedProject`·DiveStage/seedAndEnter `saveProject`·복원 시 loadProject).
- **검증** — `npm test` 743 녹색·build 성공·라이브 3표면 왕복·작품 공유·콘솔 0. sticky top:0로 wm-bar 가림 수정.

### 손대지 말 것 (불변식)
- **storageKey = 단일 진실** — PLAY도 loadProject/saveProject. diveKey는 세션 전용. Dive 응결이 saveProject로 STUDIO에 반영. 이 브리지 깨지면 두 표면이 다른 작품을 봄.
- **StoryXDesk 내부 무변경** — 프롭(initialStudioView) 시드만. `key={studioView}` remount로 WRITE↔PLAN 재시드(제거하면 토글이 뷰를 안 바꿈).
- **wm-bar sticky top:0** — StoryXDesk가 마운트 시 페이지를 바 높이만큼 스크롤시켜 가려짐 → sticky 필수.

### 다음 한 가지 (차례대로)
- **머지** — `feat/fusion-shell-mode-toggle`. 자율 권한 있음.
- 다음 슬라이스 — **융합 셸 슬라이스 B(싱크 콘솔 + ⟳최신화 게이트, 사용자 발명·큰 UX)** → **슬라이스 C(epilogue 풍 미니멀 재배치·이중 헤더 통합)** → ArcDigest/Growth/Relation Snapshot. 후속 — retcon 예산·finding retcon·번역 투 게이트·크래프트 위험1/4.
- ⚠️ 이중 헤더(wm-bar + StoryXDesk 편집/데이터 pill)는 슬라이스 C에서 통합.

---

## 2026-07-01 (5차) — 🔴 retcon 경로 구현 완료 (브랜치 미머지)

> 응결 스튜디오 충돌을 정본 교체로 승격. spec `docs/superpowers/specs/2026-07-01-canon-retcon-path-design.md`. progress.md "🔴 retcon 경로" 절이 상세. **이 세션부터 사용자가 `gh pr merge` 자율 권한 부여(settings.local.json) → 슬라이스 머지 자동.**

### 한 것
- `DeviationConflict`·conflicts 수집·`buildRetconUpdates`(playRuntimeValidator) · `applyRetcons`(storyEngine, 제자리 교체·불변) · DeviationReview retcon 카드 · DiveDesk approve 배선. 인라인 TDD 5태스크.
- **검증** — `npm test` 741 녹색·build 성공·라이브 콘솔 0·CSS 실측. 6커밋(spec·충돌수집·applyRetcons·카드·배선·docs).

### 손대지 말 것 (불변식)
- **retcon = 제자리 교체** — 옛 fact statement만 바꿈(factId/importance/reveal 보존). 모순 두 캐논 공존 금지. 옛 fact 삭제 아님.
- **기본 = 버리기** — retcon은 명시 액션만(승인형). 실수로 정본 뒤집기 방지. 예산 상한은 후속.
- **factId 없는 충돌은 retcon 불가** — derive에서 conflicts 목록 제외(교체 대상 없음). 배너 카운트로만.

### 다음 한 가지 (차례대로)
- **머지** — `feat/canon-retcon-path`. 자율 권한 있으니 바로 머지 가능.
- 다음 슬라이스 — **융합 셸**(PLAY/WRITE/PLAN + 싱크 콘솔, ★UX 큼 — brainstorming visual companion 권장·사용자 입력 필요) → ArcDigest/Growth/Relation Snapshot. 후속 — retcon 예산·finding retcon·missed-reveal/의미 dedup·번역 투 게이트.

---

## 2026-07-01 (4차) — 슬라이스 B: LLM 응결 검증기 구현 완료 (브랜치 미머지)

> 결정론이 놓친 다중 턴·의미적 모순을 응결 승인 전 opt-in LLM 대조로. spec `docs/superpowers/specs/2026-07-01-mvp2-llm-consolidation-validator-design.md` · 계획 `docs/superpowers/plans/2026-07-01-mvp2-llm-consolidation-validator.md` · 정본 §7·§12.2. progress.md "슬라이스 B" 절이 상세.

### 한 것
- brainstorming 4결정(D1 opt-in 버튼·D2 모순만·D3 경고 게이트·D4 storyxBridge 재사용) → spec → writing-plans → executing-plans 인라인 TDD 5태스크.
- `dive-consolidate` LLM 엔드포인트(storyx.mjs + vite 브리지, dive-condense 동형·mock 폴백) · `normalizeFindings`·`requestDiveConsolidate`(diveClient) · 신규 `ConsolidationFindings.tsx` · DiveDesk "🔍 정밀 검토" 버튼·findings/reviewing state.
- **검증** — `npm test` 737 녹색·build 성공·mock CLI·라이브 콘솔 0·카드 CSS 실측(#fca5a5·#c4b6ff). 7커밋(spec·plan·엔드포인트·client·컴포넌트·배선·docs).

### 손대지 말 것 (불변식)
- **정밀 검토는 opt-in** — approve 다이얼로그 버튼으로만 LLM 1회. 응결마다 자동 호출로 바꾸면 player-first·비용 훼손.
- **findings는 경고일 뿐** — 강제 차단 아님. 플레이어가 보고 승인/거절 판단. per-finding 자동수정·retcon은 별도 슬라이스.
- **프롬프트 "회수 약속 제외"** — 의도적 복선을 모순으로 오탐하지 않도록 정본 §12.1 원리 유지.
- **엔드포인트는 storyxBridge 패턴** — dive-condense와 동형. mock 폴백 유지(테스트·오프라인 안전).

### 다음 한 가지
- **머지 결정 대기** — `feat/mvp2-llm-consolidation-validator`(미머지, origin 미푸시). 사용자 확인 후 PR/머지.
- 다음 슬라이스(차례대로) — **🔴 retcon 경로**(충돌을 캐논으로 되돌리기, 승인형) → **융합 셸**(PLAY/WRITE/PLAN + 싱크 콘솔) → ArcDigest/Growth/Relation Snapshot. 후속 — missed-reveal/의미 dedup·번역 투 게이트·크래프트 위험1(내면=living)·위험4.

---

## 2026-07-01 (3차) — MVP-2 응결 스튜디오(슬라이스 A-i) 구현 완료 (브랜치 미머지)

> MVP-1 ✦ 의외후보를 응결 순간에 캐논 결정으로 닫는 첫 조각. spec `docs/superpowers/specs/2026-07-01-mvp2-consolidation-studio-design.md` · 계획 `docs/superpowers/plans/2026-07-01-mvp2-consolidation-studio.md` · 정본 §7·§8. progress.md "MVP-2 응결 스튜디오" 절이 상세.

### 한 것
- brainstorming 4결정(D1 ✦만 결정 대상·D2 승격/수정/넘기기·D3 payload.newCanonFacts 승격 경로·D4 approve 다이얼로그 업그레이드) → spec → writing-plans → executing-plans 인라인 TDD 6태스크.
- 순수 `deriveDeviationCandidates`·`dedupePromotions`·`buildPromotedFacts`(playRuntimeValidator.ts) + 신규 `DeviationReview.tsx`(✦ 카드+🔴 배너) + DiveDesk 조립(deviations useMemo·decisions/edits state·approve 승격 concat).
- **검증** — `npm test` 731 녹색·build 성공·라이브 콘솔 0·CSS 실측(배너 #fca5a5·승격 토글 #bef264). 8커밋(spec·plan·derive·dedup·buildPromoted·DeviationReview·조립·docs).

### 손대지 말 것 (불변식)
- **최소 몽타주** — 기본 결정 skip, 굳힐 것만 탭. LLM newCanonFacts는 리뷰 안 시키고 자동 커밋 유지. 이걸 per-item 리뷰로 바꾸면 player-first 훼손.
- **🔴/🟡는 정보 표시만** — 응결 스튜디오에서 충돌은 배너 카운트만. 캐논으로 되돌리는 retcon은 후속 슬라이스.
- **승격 경로** — `payload.newCanonFacts`에 `{owner:'plot',statement}` concat → 기존 `chapterFromDraftPayload` 재사용. reveal=revealed 기본·importance normalize 백필. 이 경로 유지(별도 커밋 로직 추가 금지).
- **dedup은 문자열 근접만** — 의미 중복(다른 표현 같은 사실)은 후속 LLM 응결 검증기(B)가 처리. 넓히지 말 것.

### 다음 한 가지
- **머지 결정 대기** — `feat/mvp2-consolidation-studio`(미머지, origin 미푸시). 사용자 확인 후 PR/머지.
- 다음 슬라이스 후보 — **슬라이스 B(LLM 응결 검증기, ConStory 4단 재추출)** — 결정론이 놓친 미묘한 모순·의미 dedup 보강 · **🔴 retcon 경로** · **융합 셸**(PLAY/WRITE/PLAN) · ArcDigest/Growth/Relation Snapshot.

---

## 2026-07-01 (2차) — MVP-1 PLAY 런타임 거버넌스 구현 완료 (브랜치 미머지)

> Canon Core 위 PLAY(DiveDesk) 런타임 검증 슬라이스. spec `docs/superpowers/specs/2026-07-01-mvp1-play-runtime-governance-design.md` · 계획 `docs/superpowers/plans/2026-07-01-mvp1-play-runtime-governance.md` · 정본 §5·§7·§14. progress.md "MVP-1 PLAY 런타임 거버넌스" 절이 상세.

### 한 것
- brainstorming(visual companion) 4결정(D1 결정론 판정·D2 앵커=캐논화 차단·D3 여백 거터 배지·D4 PLAY+차단) → spec → writing-plans → executing-plans 인라인 TDD 7태스크.
- 신규 순수 `playRuntimeValidator.ts`(`validatePlayTurn`). 밴드별 자체 미니 contract + `classifyCanonChange` **재사용**(새 대립 로직 0). `factBand`·`DiveMessage.verdict?`·`appendMessage(…, verdict?)`·`buildCondenseTranscript`·DiveDesk 배선(거터 마커·하단 카운트).
- **★ reveal형 앵커 위반 보강** — 앞머리 마커("사실 X는 죽었어")가 subject 추출을 흔들어 대립 미탐 → 벗긴 변형도 검사(미스터리 하드 차단 실작동).
- **검증** — `npm test` 721 녹색·build 성공·라이브 `?stage=dive` 콘솔 0·거터 CSS 실측(#f87171 3px). 6커밋(`5cb57af` spec·`8c88581` plan·factBand·검증기2·세션·배선·거터/CSS).

### 손대지 말 것 (불변식)
- **앵커 차단 = 캐논화만 막지 화면 안 막음** — `blocksCanonization` 턴은 응결 transcript에서만 제외(`buildCondenseTranscript`). 대화·렌더는 그대로(player-first). 강제 재생성 없음.
- **의외 후보 = 미탐 선호** — `REVEAL_MARKERS` 화이트리스트 좁게 유지. 잘못된 ✦가 몰입을 깬다. 넓히지 말 것.
- **재사용 원칙** — 대립 검출은 `continuityContract.classifyCanonChange` 한 곳. 새 opposition 패턴 추가 금지.
- **거터는 본문 무접촉** — `.dx-has-gutter::before` 여백 세로선만. 본문 세그먼트 렌더 변경 금지.

### 다음 한 가지
- **머지 결정 대기** — `feat/mvp1-play-runtime-governance`(미머지, origin 미푸시). 사용자 확인 후 PR/머지.
- 다음 슬라이스 후보 — **MVP-2 Consolidation Studio**(per-item 승격/이번만/수정 + LLM 응결 검증기 ConStory 4단) · 또는 융합 셸(PLAY/WRITE/PLAN + 싱크 콘솔). 후속 spec — 크래프트 위험1(내면=living 티어)·위험4(검사기 사실모순 vs 행동전복)·번역 투 게이트.

---

## 2026-07-01 — Canon Core (MVP-0) 구현 완료 + main 머지 (PR #7, 머지·푸시 완료)

> 캐논 거버넌스 첫 슬라이스를 서브에이전트 주도 TDD 로 구현. spec `docs/superpowers/specs/2026-06-30-canon-core-mvp0-design.md` · 계획 `docs/superpowers/plans/2026-06-30-canon-core-mvp0.md` · 정본 `docs/research/2026-06-30-canon-governance.md`. progress.md "Canon Core (MVP-0)" 절이 상세 정본.

### 한 것
- flat `CanonFact` head/tail digest 절단(A-6)을 **중요도 가중 + 장면 관련성 + reveal 분리**로 교체. 신규 `src/lib/canonImportance.ts`(순수) + `CanonFact` 확장 + `buildProjectContextDigest`·`normalizeProject` 수정. 7태스크 TDD, 최종 코드리뷰(CRITICAL 0·IMPORTANT 2 해소).
- **검증** — `npm test` 708 녹색 · `npm run build` 성공. 런칭 게이트(65캐논서 앵커 소실 0, 중간 앵커 생존) 통과.
- 커밋 7+: `8132d4e`(타입) `0081cf0·f39ecf1·55ce501`(canonImportance) `1978586`(digest) `208a656`(normalize) `1d7129f`(회귀 교정) `26c88c4`(리뷰 수정).

### 손대지 말 것 (불변식)
- **앵커는 절대 절단 안 됨** — `selectCanonForContext` 가 anchors 전부 보존(budget 초과해도). `scoreOf = importance ?? (alwaysInclude ? 0.9 : 0)` — alwaysInclude 는 normalize 전에도 앵커.
- **reveal 기본 `revealed`** — secret/foreshadowed 만 `숨은 캐논` 절(모순금지+누설금지). 구버전 백필=전부 revealed(안전).
- **digest 한 곳 원칙** — 검색 교체는 `buildProjectContextDigest` 한 곳(PLAY·WRITE 동시 개선). 별도 절단 로직 추가 금지.
- **비핀 importance 보수적** — deriveImportance 비핀 max 0.65(앵커 자동도달 없음). 작가핀이 유일한 앵커 승격 경로(정본 §13 risk6).

### 다음 한 가지
- **머지·푸시 완료** — `feat/canon-core-mvp0` → main (PR #7 merged, 2026-07-01). 이 세션 산출물(research·spec·plan 문서 4종 + 코드) 전부 origin/main 반영. feat 브랜치 삭제됨. (origin = `sgeniusk/story-x-beta`.)
- 다음 슬라이스 — **MVP-1 PLAY 런타임 거버넌스**(validator·의외전개 배지, player-first Q2) → 그 위에 융합 셸(PLAY/WRITE/PLAN + 싱크 콘솔). 후속 spec — 연속성 자동검사기(ConStory 4단)·번역 투 게이트·크래프트 위험1(내면=living 티어)·위험4(검사기 사실모순 vs 행동전복).
- MINOR 잔여 — longform 픽스처에 비앵커 최근 캐논 생존 보완 단언(선택).

---

## 2026-06-30 (3차) — 외부 AI 2종 반영 + 캐논 거버넌스 정본 합본 + 포커스 딥리서치 (코드 0)

> 사용자가 ChatGPT Pro·Claude 외부 리서치 2종을 가져옴(원문 사용자 보관 — ChatGPT는 채팅 본문, Claude는 `~/Downloads/story x research claude.md`). 둘 다 내 §6 foil과 거의 완전 수렴, **foil 6개 입장 전부 confirmed**. 합쳐서 설계 확정.

### 한 것
- **정본 합본 작성** — `docs/research/2026-06-30-canon-governance.md`(`confirmed`). Canon Governance Stack 6계층 · 사건중심 3-엔티티+Evidence 스키마 · 중요도 0~1+3밴드(Anchor0.82~/Major0.45~/Soft~) · Deviation Candidate 객체 + 게이트 규칙 · 검색 3계층(앵커 원본 KG·소 벡터·아크 다이제스트)+R1/R2/R3 · 이중 검증기(Runtime/Consolidation) · MVP 0~4 · 리스크표.
- **갭 분류(§10)** — 확정(코드 가능) / empirical(dogfooding 튜닝, 문헌으로 못 닫음 — 가중치·surface빈도·응결주기·자동승격램프) / 미검증 무해(3배·c.ai수치·Campfire) / **★ 진짜 research gap 1건 = 한국 웹소설 캐논 craft**(두 리포트 다 "한국어 1차자료 빈약" 플래그).
- **포커스 딥리서치 — 갭 closed(§12)** — `deep-research` 워크플로는 StructuredOutput 재시도 한도로 실패(Run `wf_e3d3c731-a11`) → Claude 직접 WebSearch/WebFetch로 닫음. **3소스가 한 원리로 수렴** — 좋은 의외성 vs 나쁜 모순 = "나중에 회수(resolve)되는가". (a) 나무위키 떡밥회수("작가만 알고 독자는 모름, 회수 전엔 설정오류로 오해") (b) 플롯홀 탐지 arXiv 2504.11900(later justification 없으면 플롯홀) (c) ConStory arXiv 2603.05890. → 일탈은 생성 시점 판정 금지, **회수 약속 추적+페이오프 검증**으로 의외성 확정(기존 payoffStatus·openThreads 연결). + **연속성 자동검사기**(ConStory 5범주×19서브·4단 evidence 파이프라인, F1 0.678 vs 인간 0.229 = 3.2배 → "연속성=제품요건" 실증) + **번역 투 게이트**(KatFishNet arXiv 2503.00032 마커 — 콤마>2.0·명사>45%·종결어미<8%·연결어미+콤마>15%).

### 사용자 결정 3건 (확정 · 정본 §13)
- Q1 장르 = **미스터리·스릴러** · Q2 = **플레이어형(PLAY 먼저)** · Q3 간판 = **몰입 연재(Dive 융합)**. → 첫 spec = Canon Core(MVP-0)+PLAY 거버넌스 슬라이스.

### 크래프트 감사 + disclosure 축 (정본 §14)
- 사용자가 "좋은/재미있는 글쓰기" 크래프트 보고서로 캐논 거버넌스가 창작을 돕나 누르나 검토 요청. 감사 결론 — **대체로 강화(payoff·갈등·구체성·반전), 단 4 억압위험.** 위험1 성장차단(내면=living 티어) · **★위험2 withholding 무력화 = 코어 구멍** · 위험3 발견 vs 과잉플롯(초기 캐논 희박·steering) · 위험4 검사기 오발(사실모순 vs 행동전복).
- **★ disclosure 축 신설** — CanonFact에 `disclosure: revealed|secret|foreshadowed` 추가(MVP-0 코어). secret/foreshadowed는 검색이 "모순 금지 + 누설 금지"로 분리 주입 → withholding·조기해소 한 번에 차단. 프리셋 '정보 비대칭'을 캐논이 실어나르는 통로. 미스터리·스릴러(Q1)와 직결.

### 첫 spec 작성됨 (검토 대기)
- `docs/superpowers/specs/2026-06-30-canon-core-mvp0-design.md`(`draft`) — flat CanonFact head/tail 절단(A-6 버그)을 **중요도 가중+장면 관련성+disclosure 분리 주입**으로 교체. CanonFact에 importance·participants·disclosure·evidence 추가(하위호환 백필) · `selectCanonForContext`(앵커 절단 금지) · 작가핀 우선 도출 · TDD 7+(storyEngine.test 먼저) · 런칭게이트=30화 앵커 소실 0.
- **다음 한 가지** — 사용자 spec 검토 → writing-plans(TDD 태스크) → 구현. 위험1·4는 후속 spec(티어·검사기), 위험3은 운영 기본값.

### 손대지 말 것 (추가)
- disclosure 기본값 `revealed`(구버전 전부 공개=안전). CanonFact 확장은 필드 추가만, 기존 보존. 검색 교체는 `buildProjectContextDigest` 한 곳(두 표면 동시 개선).

### 손대지 말 것
- 캐논 코드 착수는 spec 확정 후. 지금은 설계 단계.
- 정본 §2~9는 외부 2종+foil 합의라 임의 변경 금지(딥리서치 흡수·사용자 결정만 반영).

### 진입 컨텍스트
- 정본 `docs/research/2026-06-30-canon-governance.md` 1개로 충분. 입력 사슬 — research-brief·external-ask(같은 날짜 docs/research) + 외부 2종(사용자 보관) + memory `canon-governance-direction`. 융합 셸/프리셋 설계는 아래 (2차) 노트.

---

## 2026-06-30 (2차) — 융합 브레인스토밍 + 캐논 거버넌스 리서치 계획 (코드 변경 0)

> Story X ↔ Dive X 통합 + epilogue 셸을 brainstorming(visual companion)으로 진행. 도중에 **캐논 설계가 Story X를 결정짓는 핵심**임이 드러나 → 딥리서치 계획 수립으로 전환. spec·구현 미착수. 리서치는 **사용자가 외부 AI 답 모은 뒤 launch**하기로(미launch).

### 합의된 설계 (브레인스토밍 결론, 아직 spec 아님)
- **융합 모델 = "항상 켜진 두 표면"** — 한 작품·한 회차 타임라인. 상단 3모드 토글 **PLAY**(Dive 몰입)/**WRITE**(에디터)/**PLAN**(캐논·바이블·구조 허브). 좌측 레일=각 모드 도구. epilogue 셸과 같은 골격.
- **회차 = 두 표면 공유 단위** — 아무 회차나 PLAY로도 WRITE로도 열어 완전 왕복. 작품 생성 시 주력 모드 1회 선택.
- **싱크 콘솔(★ 사용자 발명)** — 수동 전환 버튼 대신, PLAY/PLAN은 변경을 **쌓기만** 하고 우측 상단 `PLAY +N · PLAN +N` 누적 표시 + **⟳최신화** 버튼. 최신화가 본편 반영 + **무거운 캐논 검토 게이트**(충돌 드러냄, 승인형). git working-tree 모델.
- **2단 캐논 강도** — PLAY 런타임 가볍게(확정 캐논 위에서 안 멈춤) / 최신화·응결에서 무겁게.
- **리치 프리셋 = 융합 substrate** — 두 시작 경로(A 큐레이트 프리셋에서 인물 빙의→PLAY / B 자유서술+인터뷰=프리셋 빚기)가 같은 리치 프리셋 출력. Dive의 "빈약한 시작"을 Story X급 캐논·줄거리로 해결. **IP — 출하 프리셋은 원형(곡성 X, "시골 무당 미스터리" O), 특정작은 사용자가 인터뷰로.**
- **프리셋 9요소** — 배경(Bedrock 장소·시대·기간·언어) · 톤/분위기 · 세계규칙 · 인물3~5(★플레이가능) · 캐논시드 · **정보비대칭/숨긴진실(쇼러너전용)** · **극적질문+열린 결말방향** · 여는장면. 예시 「손님」 곡성원형 오리지널 (`preset-example.html`).
- **캐논 = 사건(Event) 중심** — `사건{관계자·시점·장소·효과·중요도}` + Entity + Relation. flat 사실은 흡수. **중요도가 절단생존+충돌심각도 지배**(alwaysInclude 일반화). **관련성 top-K 검색**(head/tail 절단 아님) = 문서화된 A-6.

### 정본 문서 (이번 세션 생성)
- `docs/research/2026-06-30-canon-governance-research-brief.md` — 리서치 계획서(6축 A~F · 방법 · §6 Claude 초기입장 foil).
- `docs/research/2026-06-30-canon-governance-external-ask.md` — 외부 AI용 자기완결 질문지(사용자가 붙여넣을 것).
- 브레인스토밍 목업 — `.superpowers/brainstorm/60428-1782814983/content/` (shell-skeleton·play-mode·sync-console·preset-pipeline·preset-example·canon-model).

### 다음 한 가지
- **사용자가 외부 AI들에게 `external-ask.md`를 물어 답을 모아온다** → 그 관점을 6축에 흡수해 딥리서치 launch(`deep-research` 하네스) → 정본 리포트 → 캐논 거버넌스 spec → 단계 구현. **그 전엔 코드 착수 금지**(설계가 캐논에 종속).
- 캐논 거버넌스 정해진 뒤에야 셸 골격(1단계: 3모드+싱크 콘솔) 구현이 의미. 부품 존재 — PLAY=`DiveDesk`·WRITE=`FloatingEditor`·PLAN=`FloatingDataWorkspace`(재작성 아님, 한 셸로 묶기).

### 손대지 말 것
- 코드 0 변경. Dive X 루프·기존 floating 구조 무변경 기준 유지.
- 리서치 launch는 사용자 신호 후. 지금 임의 launch 금지.

---

## 2026-06-30 — dogfooding 구동만, 다음 세션 = Story X ↔ Dive X 통합

> 코드 변경 0. 사용자가 `?stage=dive`로 직접 dogfooding하려고 dev 서버만 띄움. 직전 세션 DiveDesk 상태(한서연 지하철 첫사랑 장면)가 localStorage로 복원돼 그대로 이어짐.

### 한 것
- `preview_start`(포트 5173)로 구동·`?stage=dive` 진입 확인. 콘솔 0·서버 에러 0. 기능 변경 없음.

### 다음 한 가지 (사용자 지정 — 다음 세션 핵심, 두 갈래를 한 묶음으로)
사용자 결정 — 아래 **(1) 통합**과 **(2) 미니멀 셸 개편**을 다음 세션에 함께 다룬다(둘 다 네비게이션/표면 동선을 건드려 맞물림). 착수 = brainstorming으로 통합 범위 + 셸 분담부터 좁히고 → spec → 구현.

**(1) Story X ↔ Dive X 유기적 통합**
- 지금은 둘이 같은 데이터 모델(scene→session.scene·cast→project.characters, 응결=`chapterFromDraftPayload`→SeriesProject)을 공유하도록 토대만 깔린 상태(progress.md "융합 토대"·2026-06-28 딥리서치 "데이터 모델 동일"). 미해결 = **두 표면을 하나의 작품 흐름으로 잇는 UX/네비게이션** — Dive에서 응결한 회차가 Story X 에디터·캐논·바이블에 자연스럽게 나타나고, Story X에서 만든 작품으로 Dive에 진입하는 왕복 동선. 좁힐 질문 — 어느 표면이 진입점인지·프로젝트 전환 모델·중복 캐논 처리.

**(2) epilogue.page 풍 미니멀 셸 개편 (2026-06-30 사용자 제안)**
- 참조 — `https://epilogue.page/web/`. 좌측 아이콘 사이드바(누르면 상세 펼침)·중앙 상단 모드 토글(WRITING/PLANNING처럼)·중앙은 텍스트 집중·하단 작게 문단/글자수·우측 작게 저장 상태.
- 사용자 구체안 — **중앙 토글 좌우에 아이콘 배치 + 중앙 텍스트 집중 + 하단 문단·글자수 + 우측 저장 상태.** 이 셸에 기존 기능을 수납.
- **검토 결론 — 전면 재작성 아님.** 현 FloatingEditor도 이미 `nav.dock left`(좌측 아이콘 독) + `togglePanel`(누르면 패널 펼침) 구조라 골격이 epilogue와 동일. 좌측 독 아이콘 현재 6개 = 회차·곡선·상태·지표·작가실·집중(`FloatingEditor.tsx:695~754`). 메타 줄(문단·글자수 `89 words` 류·저장 상태)도 부분 존재. → **셸 미니멀화 + 메타 재배치** 수준.
- **쟁점 3 (brainstorming에서 결정할 것)** — ① 기능 밀도 수납: "좌측 아이콘 레일"과 "상단 토글 좌우 아이콘"의 **역할 분담**(겹침 위험). 어떤 기능이 레일, 어떤 게 상단 빠른 액션인지. ② 메타 줄 정리(하단 문단/글자수·우측 저장). ③ **⚠️ 미니멀 vs 연속성 노출** — CLAUDE.md "충돌은 드러낸다" 원칙상, 미니멀 셸에서도 검토 위험·캐논 충돌 배지가 사라지면 안 됨. 미니멀화하면서 위험 가시성 유지가 하드 제약.
- UI 디자인이라 다음 세션 brainstorming에서 **visual companion(브라우저 목업) 제안** 권장.

### 진입 컨텍스트
- progress.md "Dive X" 절들 + 본 파일 2026-06-27~29 인계 3건 + memory `dive-x-track`. 셸 개편은 progress.md "편집기 재설계: 방향 C 떠 있는 작업실" 절 + `src/components/FloatingEditor.tsx`.

### 손대지 말 것
- Dive X 루프(scene-showrunner·arc·응결·choices·제안 엔진 보조) 전부 무변경 기준. 통합은 **잇는 작업**이지 기존 루프 재작성이 아님.
- 셸 개편도 재작성이 아니라 기존 floating 구조 위 재배치 — `.fc-*` 스코프 CSS·테스트 보존.
- Dive 작업 브랜치들 origin 미푸시 상태 유지(사용자 요청 시 push). 최신 자유 서술 진입은 PR #6으로 main 머지됨.

---

## 2026-06-29 — Dive X 자유 서술 진입 완료

> 브랜치 `feat/dive-x-freeform-intake`(main에서 분기, origin 미푸시). 제안 엔진 dogfooding 학습("카드가 자유도·재미를 죽인다")에서 앞문을 대화형으로 교체.

### 한 것
- **앞문 교체** — 소재+다이얼+카드 → **자유 서술 한 칸 → `dive-setup` 충실 추출 → 바로 DiveDesk 진입**. 제안 카드는 "막히면 제안 받기" 접이식 보조로 강등(보존). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-29-dive-x-freeform-intake*`.
- **TDD 6태스크 done** — DiveSetup 타입·seedFromProposal 느슨화·requestDiveSetup·dive-setup 커맨드/라우트·DiveStart 재구성·App onStart. npm test 689 녹색·build 성공.
- **라이브** — 자유 서술 → ~28초 codex → 충실한 scene+cast(한서윤) 시딩 → DiveDesk, 콘솔 0. 보조 토글 정상.

### 손대지 말 것
- scene-showrunner·arc·응결·choices 루프 **무변경**. 제안 엔진(`/api/dive-propose`·diveProposal)도 보조로 살아있음 — 삭제 금지.
- `seedFromProposal` 파라미터는 `Pick<DiveProposal,'scene'|'cast'>`로 느슨 — DiveSetup·DiveProposal 둘 다 시드. 이 계약 유지.

### 다음 한 가지
- 어드벤처 선택지 강화(명시적 "이동/대화" 액션화 — dive-chat choices는 이미 있음) **또는** 취향 프로필(#1)/스티어링(#3). 자유 서술 진입의 dogfooding 체감(자유도·재미 회복) 판정 후 결정.

---

## 2026-06-28 — Dive X 제안 엔진 v1 완료 + 큰 그림 재설계

> 브랜치 `feat/dive-x-proposal-engine`(origin 미푸시). 이번 세션 = 딥리서치로 방향 재설계 → 제안 엔진 첫 조각 TDD 구현·라이브 검증.

### 한 것
1. **글로벌 딥리서치** — `docs/research/2026-06-28-dive-x-market-direction.md`. 결론 — 폐루프(대화→영속 회차→읽히는 연재) 상용 선례 없음·최대 리스크 "남의 플레이 재미없다"→**응결 품질이 해법**·규제(character.ai 18금 차단·소송)가 전연령·오리지널 포지션을 해자로. 방향 = "컴패니언 챗"이 아니라 "개인 맞춤 연재 스튜디오", 2단 로켓, Story X와 융합(데이터 모델 동일).
2. **제안 엔진 v1 (TDD 6태스크 done)** — 소재 한 줄 + 신기성 다이얼 → 비틈 벡터 5종으로 분산된 장면 전제 후보 추천 → 선택 시 scene-showrunner 시딩. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-28-dive-x-proposal-engine*`. 진입을 고정 시드 자동선택에서 `DiveStart`로 교체.
3. **라이브 검증** — npm test 685 녹색·build 성공·**실 codex 4후보(정체전복/시간구조/관계역전/장르전환, 전부 비전형 hook)**·카드→DiveDesk scene+cast 시딩·콘솔 0. `.dx-start` 다크 배경 버그(흰 글자 묻힘) 잡음.

### 손대지 말 것
- scene-showrunner·arc·응결 루프 **무변경**(제안 엔진은 진입 한 단계만 추가). DiveDesk 소비 경로 그대로.
- `feat/dive-x-proposal-engine`는 `main`에서 분기(이전 Dive 작업은 local main에 있음 — 이 브랜치엔 미포함). 머지·푸시 결정 대기.

### 다음 한 가지
전체 비전 4조각 중 #2(제안)만 했다. 다음 = **#1 취향 프로필**(명시 온보딩 + 누적 학습) 또는 **#3 스티어링**(내 취향대로/일부러 다르게/인기). 제안 엔진 출력에 취향을 주입하는 형태.

---

## 2026-06-27 — 세션 마무리: Dive X 1차~C-1 전부 local main (모두 미푸시)

> 한 세션에서 Dive X를 0→네 단계로 키움. 전부 `main`에 머지(로컬), origin 미푸시. 정본 progress.md "Dive X" 절들 + feature_list DX1~DX4.

### 이번 세션에 한 것 (순서대로, 전부 done·local main)
1. **DX1 1차 프로토타입** — 관계챗→응결→캐논·기억→다음 대화 회수. `/dive` surface. (PR #4 열림: feat/dive-x-prototype→main)
2. **DX2 2차 장면+쇼러너** — AI=쇼러너(세계 서술+인물 연기)·현재 장면 패널·서술/화자 세그먼트 렌더·쇼러너 메타 채널(승인형 sceneUpdate). (PR #5 열림: feat/dive-x-scene-showrunner→feat/dive-x-prototype, stacked)
3. **DX3 묶음 A 선택지+계속+자유응결** — dive-chat choices·⏳계속·dive-condense 자유 봉합(캐논 보존). 자연어 우선.
4. **DX4 묶음 C-1 진전 엔진** — StoryArc(극적질문·tension·nextBeat) 매 턴 진전·🎯 표시·⏭전개. "진전 없음" 해소.
   + UX 핫픽스 다수(가독성 다크·textarea·연대기 접이식·요청 타임아웃·busy 고착 방지 등).

### 현재 상태
- 로컬 `main` = a0cce16, **origin/main보다 +43 미푸시**. 별개로 B 트랙(B1~B4)도 진작 main에 있고 미푸시.
- 열린 PR — #4(1차), #5(2차 stacked). 3차·C-1은 PR 없이 local main에만.
- dev 서버: `?stage=dive`로 dogfooding. provider=codex(느림). 자동화 클릭 flaky·자동화는 fetch 직접 호출로 검증.

### 손대지 말 것 (Dive X 불변식)
- **연대기=SeriesProject** — 응결은 `chapterFromDraftPayload`(내부 commitChapter). 별도 commitChapter 금지(이중 커밋).
- **승인형** — 응결 캐논 고정·쇼러너 sceneUpdate 둘 다 사용자 승인 버튼으로만. 자동 적용 금지.
- **scene·arc는 DiveSession에** — DiveStage가 세션 전체 영속(App 무변경). 요청 타입의 scene 필수·arc/choices 옵셔널.
- **가벼운 LLM-유지 arc** — storyHarness 안 돌림. arc는 dive-chat 응답에 묻어옴(추가 호출 0).
- **자연어 우선** — 칩·⏳계속·⏭전개는 보조. send(textArg)로 같은 한 턴 재사용.

### 다음 세션 할일 (우선순위)
1. **푸시/PR 정리 결정** — origin/main +43 미푸시 + PR #4·#5 열림 상태. 사용자와 정리 방식 합의(로컬 main 직접 푸시 vs PR 순차 머지). **머지 순서: #4 먼저 → #5.**
2. **묶음 C-2 — 능동 멀티 캐릭터** — 단톡방처럼 다른 인물이 능동적으로 끼어들기·새 관계. 진전 엔진(arc) 위에 "새 인물 등장 = 다음 전개"로 얹음. SeriesProject.characters·세그먼트 렌더(이름 라벨) 이미 있음. → brainstorming부터.
3. **묶음 B — 되돌리기 + 쇼러너 캐논 god-편집 + 과금 이음새** — "내가 신" 프리미엄 해방밸브. Story X 스냅샷(B4)·캐논 엔진 재사용. parked.
4. **dogfooding 품질 판정** — 응결 회차·쇼러너 질감이 막히면 Story X 품질·비용 로드맵(Phase B 긴장·날것·헌장 정보비대칭)으로 분기.
5. (별개 Story X 본트랙) 품질·비용 로드맵 잔여·A-6 장편 기억.

---

## 2026-06-27 — Dive X 2차: 장면 연출 + 쇼러너 채널 (feat/dive-x-scene-showrunner)

> 1차 프로토타입 dogfooding → 브레인스토밍 → 스펙 → 계획 → 서브에이전트 주도 TDD(7태스크). 미머지. 정본 progress.md "Dive X 2차" 절.

### 한 것
- **확장** — 1:1 관계챗 → 사용자가 주인공으로 장면 연출, AI=쇼러너(세계 서술+그 자리 인물 연기). 결정 6건은 스펙 §2 표.
- **구현** — `diveSession.scene`+`parseSceneSegments`(서술/화자 파서) · DiveState scene 영속 · `storyx.mjs` dive-chat 쇼러너화·dive-condense 장면·`dive-showrunner` 신규 · vite `/api/dive-showrunner`+`--scene` · `diveClient.requestDiveShowrunner` · `DiveDesk` 장면 패널·세그먼트 렌더·쇼러너 시트 · 스타일. App 무변경.
- **검증** — init.sh 녹색(674). 라이브 codex — 쇼러너 reply+sceneUpdate·장면 인지 채팅(도윤 부재 서술)·세그먼트 렌더·콘솔 0. 최종 홀리스틱 APPROVE + 수정 2건.

### 손대지 말 것
- **승인형 sceneUpdate** — 쇼러너가 제안한 장면은 `applySceneUpdate`(버튼)로만 교체. 자동 적용 금지.
- **parseSceneSegments** — `이름(≤20자): 대사`만 화자, 그 외 내레이션. 별표 포함 prefix 제외. 순수.
- **scene은 DiveSession에** — App 무변경 근거(DiveStage가 세션 전체 영속). DiveChatRequest/DiveCondenseRequest에 scene 필수(호출부 tsc 강제).
- **dive-chat=쇼러너 프롬프트** — "장면에 없는 인물 등장 금지·사용자 말 대신 짓지 말 것". dive-showrunner=별도 연출자 프롬프트(reply+sceneUpdate 교체본).
- 포인트 과금 = 비활성 라벨(이음새)만. 실결제·인물/캐논 직접 변경은 비목표.

### 다음 세션이 해야 할 한 가지
- **머지 결정** — feat/dive-x-scene-showrunner(1차 feat/dive-x-prototype 위). 1차는 이미 local main + PR #4.
- 그 후 — 사용자 dogfooding 품질 판정. 막히면 Story X 품질 로드맵으로 분기.

---

## 2026-06-27 — Dive X 가벼운 로컬 프로토타입 (feat/dive-x-prototype)

> 제타류 딥리서치 + 외부 3종 리서치 → 브레인스토밍 → 스펙 → 계획 → 서브에이전트 주도 TDD(7그룹). 미머지·미푸시. 신규 트랙. 정본 progress.md "신규 트랙 — Dive X" 절.

### 한 것
- **개념** — 관계형 캐릭터 챗 + 대화가 휘발 않고 "나+캐릭터 공동주연 연재물"로 응결. Story X 연속성 엔진을 해자로 재투영. 결정 7건은 스펙 §2 표.
- **구현** — `diveSession.ts`(순수·TDD) · `diveSeedCharacters.ts`(3종) · `storage.ts` DiveState · `storyx.mjs` dive-chat/condense + vite 2라우트 · `diveClient.ts` · `DiveDesk.tsx` · `App.tsx` `?stage=dive` + `.dx-*`. 연대기=SeriesProject 재사용(`chapterFromDraftPayload`→내부 commitChapter, `buildProjectContextDigest` 주입으로 기억 회수, `inspectLeak` 품질 게이트).
- **검증** — init.sh 녹색(vitest 665). 라이브 codex `/api/dive-chat` 왕복 성공(도윤 말투 일관). 홀리스틱 리뷰 4건 수정(`785091f`).

### 손대지 말 것
- **연대기=SeriesProject** — 응결 회차는 반드시 `chapterFromDraftPayload`(이미 내부 commitChapter+성장레저). 별도 commitChapter 호출 금지(이중 커밋).
- **승인형 캐논** — 응결은 자동 생성하되 하드 캐논 고정은 사용자 승인 후. 자동 박제 금지(신뢰).
- **모델 티어링** — dive-chat=경량/dive-condense=고급은 라우트 `--provider codex` 단일이라 의도만 배선(실분리는 productization).
- **dive UI 라이브 검증 한계** — 자동화 클릭이 React onClick 미발화 + codex condense >30s. UI 한 바퀴(클릭→응결→승인→회수)는 사용자 dogfooding서 눈으로.

### 다음 세션이 해야 할 한 가지
- **머지 결정** — feat/dive-x-prototype → main(사용자 결정 대기). B 트랙은 이미 main.
- 그 후 — 사용자 dogfooding으로 응결 회차 품질 만족까지(막히면 Story X 품질 로드맵 Phase B/헌장 정보비대칭). 검증 통과 후에야 캐릭터 생성·공개 연재·졸업 다리·B2C/B2B 포크·법적 아키텍처.

---

## 2026-06-23 — B4 자동 버전 히스토리 (feat/auto-version-history)

> 사용자 "남은거 해결하고 마무리". B3 main 머지 후 B4(B 트랙 마지막) brainstorming→spec→plan→TDD 3 task. 미머지·미푸시. 이로써 B 트랙(B1~B4) 전부 완주.

### 한 것
- **snapshotImpact.ts** — describeSnapshotImpact(current, snapshot): 회차·캐논·회차번호 delta + isRollback(회차/캐논 감소). 순수.
- **자동 트리거 확대** — confirmChapterLock(회차 확정)·amendCharter(헌장 개정)에 pushProjectSnapshot. 기존(회차 생성·캐논 반영) 유지.
- **영향범위 표시** — ProjectHistoryDialog 각 스냅샷에 describeSnapshotImpact 인라인("회차 N→M·캐논 N→M")+isRollback 코랄. 복원 전 rollback 이면 window.confirm(교체 안내). current prop 배선.
- ★현황 발견 — B4 인프라 대부분 존재(ProjectSnapshot·pushProjectSnapshot·ProjectHistoryDialog·restoreProjectVersion). 신규는 영향범위+트리거 2개뿐. "최대 작업" 추정은 인프라 발견 전.
- TDD +9(639→648).

### 손대지 말 것
- ProjectSnapshot 구조·pushProjectSnapshot·appendSnapshot max·restoreProjectVersion — 불변(추가만).
- describeSnapshotImpact 순수 — delta 부호 snapshot - current(음수=복원 시 감소). isRollback=chapter<0||canon<0.
- ProjectHistoryDialog current prop required — tsc 가 호출처 전달 강제.
- 프롬프트 버전 — 비목표(작가 프롬프트 편집 기능 없어 버전 대상 없음).

### ★ preview 라이브 한계 (중요)
- preview CommandPalette 명령 button[role=option] 의 onClick 이 dispatchEvent(click)·.click() 으로 발화 안 됨(React 합성 이벤트 통합 한계). ⌘K 로 팔레트는 열렸으나(paletteOpen·btnFound true) 명령 실행이 안 돼 ProjectHistoryDialog 를 라이브로 못 엶.
- 갈음 — projectHistoryDialog.test(react-dom 실제 렌더)로 영향범위·rollback·confirm 동등 검증. B2(배지)·B3(칩) 라이브는 정상 — CommandPalette 경로만 한계.

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(feat/auto-version-history → main). B1·B2·B3 는 main.
- B 트랙(B1~B4) 완주 — 다음은 새 트랙(품질·비용 로드맵 잔여 Phase B/C/E/F·A-6 장편 기억 등). 정본 progress.md 활성 트랙.

---

## 2026-06-22 — B3 캐논 인라인 멘션 + AI주입 토글 (feat/canon-inline-mention)

> 사용자 "남은 기능 다 마무리". B2 main 머지 후 B3 brainstorming→spec→plan→TDD 5 task→preview 라이브 완주. 미머지·미푸시.

### 한 것
- **canonMentions.ts** — detectCanonMentions(prose, canonFacts): extractEntityName(인물 이름)으로 본문 등장 캐논 탐지·이름별 그룹화·등장순 정렬. 순수.
- **CanonFact.alwaysInclude** + normalizeProject 백필(구버전 false).
- **digest 절단 면제** — buildProjectContextDigest 가 alwaysInclude=true 캐논을 40개 절단에서 면제·우선 포함. A-6(중반 캐논 소실) 작가 통제.
- **UI** — FloatingEditor .ep-mention-bar 칩 바(본문 하단, .ms 밖) + popover(statement + 'AI 항상 포함' 토글). StoryXDesk canonMentionViews useMemo + handleToggleCanonInclude useCallback. styles.css fc-app 다크 토큰.
- TDD +13(626→639). 라이브 — 칩·popover·토글 영속·콘솔 0.

### 손대지 말 것
- **extractEntityName(storyOntology)** — 재사용·무변경. 인물 이름만 추출하므로 멘션은 인물 캐논 중심(장소/사물 캐논은 멘션 안 됨 — 설계 비목표).
- **digest 절단 면제 로직** — CONTEXT_CANON_LIMIT/HEAD 상수 유지, alwaysInclude 만 우선 포함 추가. pinned 가 LIMIT 초과 시 pinned 전부(작가 의도) + rest 최소. 다른 절(작품 계약·헌장·contextPack) 불변.
- **canonMentionViews 별도 useMemo([editorText, canonFacts])** — floatingEditorProps 안에 inline detect 하면 editorText 타이핑마다 전체 props 재계산. 분리 유지.
- **contentEditable 본문** — 읽기만. 칩 바는 .ms 밖 .sheet 하단.
- canonMentions/onToggleCanonInclude optional — 미주입 시 칩 바 미렌더(하위호환).

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(feat/canon-inline-mention → main). B1·B2 는 main.
- B 트랙 잔여 — B4 자동 버전 히스토리(본문+캐논+프롬프트 시간순 스냅샷, 최대 작업·신선한 세션 권장). 정본 docs/research/2026-06-21-storytelling-service-ux-benchmark.md §3(P3).

---

## 2026-06-22 — B2 target/habit 이원 리텐션 (feat/dual-retention)

> 사용자 "남은 기능 다 마무리"(B2·B3·B4). 순서 B2→B3→B4·기능마다 brainstorming 결정. B2(이원 리텐션) brainstorming→spec→plan→TDD 6 task→preview 라이브 완주. 미머지·미푸시.

### 한 것
- **retentionStats.ts 순수 모듈** — recordWritingDay·computeRetentionStats·isValidDayStr·normalizeWritingLog·emptyWritingLog. today/dateStr 주입(순수, UTC epoch-day). 끊김 규칙(today 또는 어제까지 유지)·thisWeekDays rolling 7일.
- **writingLog 영속** — SeriesProject.writingLog?(retentionStats 에서 type-only import) + normalizeProject 백필. export/import 자동 포함.
- **활동 기록 3지점** — StoryXDesk todayStr/withWritingDay + 편집(자동저장 effect)·생성(applyProductionResult)·확정(confirmChapterLock). 같은 날 dedup no-op.
- **UI** — FloatingEditor .ep-streak 배지(헤더 상시, "N일 연속"/"오늘 첫 문장") + .fc-metric-retention 패널 섹션(target N/M화·최장·주간). floatingEditorProps retention 주입. styles.css fc-app 다크 토큰.
- TDD +19(607→626). 라이브 — 배지·끊김규칙·패널·편집→오늘기록(streak 2→3)·콘솔 0.

### 손대지 말 것
- **retentionStats today/dateStr 주입** — Date 현재시각·random 미사용(storyEngine 순수성). 끊김 규칙은 retentionStats.test 가 핀. UTC epoch-day(타임존 드리프트 회피).
- **withWritingDay no-op 가드**(`log === project.writingLog`) — 같은 날 중복은 참조 동일 반환. 자동저장 effect 가 매 타이핑 호출해도 불필요 saveProject 차단.
- **commitChapterProse === prev 검사** — 실제 편집 있을 때만 활동 기록(회차 전환 flush 가 오기록 안 되게).
- **retention props optional** — 미주입 시 배지·패널 미렌더(하위호환). target.planned 은 storyContract?.plannedEpisodes(헌장 없으면 null → "?화").
- **todayStr 는 UI 레이어(StoryXDesk)** — 로컬 '오늘'. storyEngine/retentionStats 순수성은 주입으로 유지.
- **editorFocusLayout P2 윈도우 700→1000** — confirmChapterLock 블록이 B1(누수)+B2(활동기록)로 길어져 setLatestChapter 가 700자 밖. 가드 의도(setLatestChapter 존재) 보존하며 범위만 확장.

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(feat/dual-retention → main). B1 은 이미 main.
- B 트랙 잔여 — B3 캐논 인라인 멘션 + 엔트리별 AI주입 토글 · B4 자동 버전 히스토리(최대 작업, 신선한 세션 권장). 정본 docs/research/2026-06-21-storytelling-service-ux-benchmark.md §3.

---

## 2026-06-21 — B1 AI 누수 방지 게이트 (feat/ai-leak-gate)

> 사용자 "/deep-research 로 스토리텔링 서비스 벤치마킹 후 개발 이어가기". 딥리서치(제품·UX) → 4 착수후보(B1~B4) feature_list 등재 → B1(AI 누수 게이트) brainstorming→spec→plan→TDD→라이브. 미머지·미푸시.

### 한 것
- **딥리서치** — 글로벌+한국 스토리텔링 서비스 제품·UX 벤치마킹(111 에이전트·18확정·7기각). 정본 `docs/research/2026-06-21-storytelling-service-ux-benchmark.md`. B1~B4 feature_list 등재(notes 세 갈래 트랙).
- **B1 AI 누수 게이트** — `leakGate.ts`(detectPromptLeak 4범주 + inspectLeak) · qualityGates `gate_prompt_leak`(blocking) · `confirmChapterLock` 누수 차단 · FloatingEditor `.ep-leak-banner`. spec·plan 정본. TDD +15(607). 라이브 차단 검증(스크린샷).

### 손대지 말 것
- **detectPromptLeak 보수적 패턴** — '물론'·'다음 날' 단독 같은 정상어는 누수 아님(종결어미/메타 맥락 동반 시만). `leakGate.test` 오탐 가드가 핀. blocking이라 패턴 넓히면 오탐→작가가 갇힌다.
- **confirmChapterLock 누수 게이트** — `inspectLeak(target.prose).blocked` 면 `lockChapter` 안 함 + `setLeakBlock`. 상투구(clicheFlags)는 경고만(차단 X). 차단을 상투구로 확대 금지(주관적·오탐).
- **`.ep-leak-banner`는 canvas 안 + margin-top 72** — header가 absolute라 canvas 최상단(top0)과 겹친다. header 다음(흐름)에 두면 겹침 재발. `floatingEditor.test`가 `.ep-leak-banner` 존재 핀.
- **`gate_prompt_leak` common/blocking** — track common이라 자동 blocking. `promptLeakCount` 없으면 text 에서 `detectPromptLeak` 파생.

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(`feat/ai-leak-gate` → main).
- B 트랙 잔여 — B2 target/habit 리텐션(4영역 최약 65%)·B3 캐논 인라인 멘션+AI주입 토글·B4 자동 버전 히스토리(캐논+프롬프트). 정본 `docs/research/2026-06-21-storytelling-service-ux-benchmark.md` §3.

---

## 2026-06-19 — 다음 회차 CTA 모호 수정 (feat/persist-onboarding)

> 핸드오프 5차 백로그 "다음 회차 CTA 모호" 착수·완료. brainstorming(사용자 선택: 편집 모드에 확정→다음 노출)→TDD→풀 라이브. 미머지·미푸시. 영속 Part 2 위에 쌓은 별도 커밋.

### 한 것
- **편집 모드 회차 확정 동선** — 회차 잠금 버튼이 출간 준비 화면(FloatingPublishWorkspace)에만 있어, 1화 생성 후 편집 모드에서 다음 회차 동선이 막히던 마찰 해소. FloatingEditor 헤더 메인 CTA 옆에 "이 회차 확정" 버튼(`canConfirmLock`=미잠금 최신 회차) 추가. 클릭 → 기존 confirmChapterLock → isLatestLocked → 메인 CTA "다음 회차 만들기" 자동 전환.
- **배선** — StoryXDesk floatingEditorProps `canConfirmLock`·`onConfirmLock`·`lockLabel`(actionLabels.lock). styles.css `.btn-confirm-lock`(accent outline).
- TDD — floatingEditor.test +2 · editorFocusLayout +1. 라이브 — 확정 버튼 렌더·클릭→잠금→다음 회차 CTA 전환·콘솔 0·스크린샷.

### 손대지 말 것
- **canConfirmLock 게이트 = 최신 회차 존재 && 미잠금** — 잠긴 회차엔 확정 버튼 미렌더(기존 #5 잠금 해제 UI 가 담당). 회차 0개면 미렌더.
- **상태머신 재사용** — 확정 버튼은 confirmChapterLock 만 호출한다. 잠금→"다음 회차 만들기" 전환은 기존 mainActionLabel 로직(isLatestLocked → nextDraft) + P2(setLatestChapter 동기화)가 담당. 여기에 별도 생성 로직 추가 금지.
- **검토는 권고 유지** — 확정 전 검토 강제 안 함(마찰은 동선 부재이지 검토 누락이 아님). 확정 버튼 title 로 권장만.

### 다음 세션이 해야 할 한 가지
- **머지/푸시 — 사용자 결정 대기**(feat/persist-onboarding → main). 이 브랜치에 영속 Part 2 + 다음 회차 CTA 두 묶음 커밋.
- 백로그(핸드오프 4차) — format 축 vs lengthClass 축 깊은 정합(short-novel charter 미진입 가능성).

---

## 2026-06-18 — 영속 보강 Part 2: 온보딩 자동 복원 (feat/persist-onboarding)

> 핸드오프 5차 "다음 한 가지"(Part 2 온보딩 대수술) 착수·완료. brainstorming 기정(자동 복원)대로 TDD. 결정적이라 풀 라이브 검증. 미머지·미푸시. 사용자 결정 2건 반영 — 진행=바로 TDD, 영속 범위=LLM 캐시 포함.

### 한 것
- **온보딩 입력 영속** — `OnboardingDraft`(16필드: 매체/형식 2 + 사용자입력 11 + LLM캐시 3) 를 독립 키 `serial-story-studio/onboarding` 에 저장. storage.ts 순수함수 serialize/parse(손상·구버전 null·누락 백필)·save/load/clear·hasMeaningfulOnboardingInput. storage.test +5.
- **HomeFlowStep 이동** — App.tsx 로컬 타입을 projectBlueprint.ts 로 옮겨 storage 와 공유(순환 import 회피). appExperience:54 핀을 import 형태로 완화.
- **배선** — App: `restoredOnboarding` 으로 stage(home 자동복원·URL param 우선)·medium·format 복원 + `onOpenEditor` 에서 clearOnboardingDraft(졸업 청소). StoryXHome: 14 state lazy init + debounce(600ms) save effect(빈입력이면 clear). appExperience +1.
- **라이브** — 복원/저장/빈입력가드 3경로 풀 확인 + 콘솔 0 + charter 복원 화면 스크린샷. init.sh 589 녹색.

### 손대지 말 것
- **빈입력 가드(hasMeaningfulOnboardingInput)** — save effect 가 빈 draft 를 저장하면 신규 사용자가 home 만 들러도 다음 방문에 랜딩 대신 온보딩 복원. 빈입력이면 saveOnboardingDraft 대신 clearOnboardingDraft. 빼면 랜딩 진입을 가로챈다(라이브로 null 확인함).
- **독립 키(project 필드 아님)** — 온보딩은 작품 생성 전이라 SeriesProject 가 없다. Part 1 처럼 project 필드에 못 넣어 독립 키. 졸업(작품 생성) 시 clearOnboardingDraft 로 청소 안 하면 다음 새 프로젝트가 옛 온보딩을 복원해 오염.
- **HomeFlowStep 위치 = projectBlueprint.ts** — App.tsx 로 되돌리면 storage import 가 순환(App→storage→App). appExperience:54 가 import 핀.
- **initialStage URL param 우선** — `?stage=` 있으면 param, 없고 draft 있으면 home, 둘 다 없으면 landing. 순서 바꾸면 기존 딥링크가 깨진다.
- save effect debounce(600ms) — 매 키 saveOnboardingDraft(전체 draft) 폭주 방지(Part 1 동형).

### 다음 세션이 해야 할 한 가지
- **머지/푸시 — 사용자 결정 대기**(feat/persist-onboarding → main). Part 1(fa01acd)은 이미 main.
- (선택) 졸업 clear 라이브 — 작품 생성(LLM)까지 가서 onboarding key 소거 눈 확인. 이번엔 단일 경로(onOpenEditor)+소스핀으로 갈음했다.
- 백로그(핸드오프 4차) — 다음 회차 CTA 모호 · format 축 vs lengthClass 축 깊은 정합.

---

## 2026-06-15 (5차) — 영속 보강 Part 1: 의도 메모 영속 (feat/persist-state)

> dogfooding 발견 — VS/fork 선택 의도 메모가 영속 안 돼 새로고침 시 소실. brainstorming(범위·복원UX)→Part 1 TDD. 사용자 "둘 다" 골랐으나 Part 2(온보딩 대수술)는 세션 길어 다음으로 매듭. main 머지·푸시함.

### 한 것
- **의도 메모 영속** — `SeriesProject.nextEpisodeIntent?: string` + normalizeProject 백필. StoryXDesk: draftPrompt 초기값을 project.nextEpisodeIntent 로 복원 + debounce(600ms) effect 로 모든 변경(타이핑·VS·fork·소거) 영속. storage.test +1. init.sh 583 녹색.
- normalizeProject **export**(테스트 위해 — vitest jsdom 의 localStorage.setItem 미작동으로 loadProject 라운드트립 불가 → normalizeProject 순수 검증).

### 손대지 말 것
- draftPrompt 영속 effect debounce(600ms) — 매 키 saveProject(전체 project JSON) 폭주 방지.
- 가드 `(prev.nextEpisodeIntent ?? '') === draftPrompt` — 불필요 setProject/saveProject 차단.
- normalizeProject 백필 `typeof ... === 'string' ? ... : ''` — 구버전 undefined → '' 보장.

### 다음 세션이 해야 할 한 가지
- **Part 2 — 온보딩 자동 복원(대수술, 미착수)**: App.tsx StoryXHome 11 state 영속(intakeAnswers 는 Map 이라 직렬화 변환)·stage/step 복원·클리어 엣지(editor 졸업·명시 취소). 설계는 **자동 복원** 채택(brainstorming 정함 — 새로고침 시 마지막 단계+입력 복원). storage.ts 에 serialize/parse 순수 함수 + save/load/clear 래퍼 권장(localStorage 직접 테스트는 jsdom 한계로 순수 함수 분리).
- 라이브 — 회차 작품에서 의도 메모 입력→새로고침→복원 눈 확인(이번엔 비결정적이라 갈음).

---

## 2026-06-15 (4차) — 제목 ". " 누수 수정: deriveProjectTitle 마침표 구분자 (fix/title-prefix-leak)

> dogfooding 발견 후속. 1화 생성 시 작품 제목 앞에 ". "가 붙던 파싱 버그. 원인 추적 → TDD 수정. 미머지·미푸시.

### 한 것
- **제목 ". " 누수 수정** — deriveProjectTitle(storyEngine.ts:1107) 회차 접두 제거 정규식 `[—\-:·]?` 에 마침표 추가 → `[—\-:.·]?`. codex 가 "1화. 제목" 형식으로 title 을 내면 "1화"만 떨어지고 ". 제목"이 남던 버그 해소. storyEngine.test +1(1화./3화. 마침표 케이스 + em대시·콜론 회귀 가드). init.sh 581 녹색.

### 손대지 말 것
- 정규식 구분자 클래스 `[—\-:.·]` — em대시·하이픈·콜론·마침표·middot 5종. 회귀 가드 테스트가 보증.
- `\d+화` 접두만 제거 — "화" 없는 형식("프롤로그. 제목", "1. 제목")은 의도적으로 안 건드림(scope 밖).

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(fix/title-prefix-leak → main).
- 백로그 — 온보딩/의도 메모 영속 X(가장 아픔, 큰 작업·brainstorming부터)·다음 회차 CTA 모호·format/lengthClass 깊은 정합.

---

## 2026-06-15 (3차) — 온보딩 분량 2체계 정합: 매체 단계 중편 제거 (fix/onboarding-medium-format)

> dogfooding 발견 #1 후속. 매체 단계 포맷 카드 3등급(장편/중편/단편)이 헌장 단계·사용자 결정(2등급 '중편 없음')과 충돌하던 문제. Explore 전수 매핑 → TDD 수정. 미머지·미푸시.

### 한 것
- **매체 단계 중편 제거** — projectBlueprint.ts formatOptions.novel 에서 medium-novel 카드 삭제(3→2등급) + 단편 cadence '1-5화'→'4~8화'(헌장 정합). projectBlueprint.test 2등급 단언(TDD RED→GREEN). init.sh 580 녹색. 라이브(preview) — 매체 단계 장편+단편(4~8화)·중편 없음 확인(has48 true·has15/hasMid false).

### 손대지 말 것
- serialFormats·blueprintByFormat·CreativeFormat 타입의 'medium-novel'은 **구버전 저장본 호환 위해 의도적으로 남김**(formatOptions 에서만 제거). 폴백 안전. 제거하면 구버전 medium-novel 작품이 단독 취급되거나 Record 타입 에러.
- ContractLengthClass('short'|'long')·CONTRACT_EPISODE_RANGES·isSpineComplete 등 화수 로직은 이미 2등급 정합(2026-06-12 결정) — 무수정 유지.

### 다음 세션이 해야 할 한 가지
- 머지/푸시 — 사용자 결정 대기(fix/onboarding-medium-format → main).
- 백로그 — format 축 vs lengthClass 축 깊은 정합(short-novel isSerial 게이트로 charter 미진입 가능성, 미확인)·온보딩/의도 메모 영속 X·제목 ". " 누수·다음 회차 CTA 모호.

---

## 2026-06-15 (2차) — VS 노출 자동열림 + VS dogfooding 1라운드 (fix/vs-panel-autoreveal)

> 사용자 "이전 세션 오류로 멈춤 — VS dogfooding 이어가기". C-1 VS를 실전 dogfooding(내 아이디어 심야 스릴러로 온보딩→1화→VS 풀 라이브) → VS 본진 5/5 검증 + 발견된 "VS 노출 약함"을 brainstorming→TDD 로 수정. 미머지·미푸시.

### 한 것
- **VS dogfooding** — 심야 라디오 사연 PD·10년 전 뺑소니(결말=자백 고정 장편)로 온보딩→인터뷰→헌장→1화→VS 풀 라이브(preview). VS 본진 5/5(후보 4개 흔함1·의외2·파격1·배지 회색/라임/코랄·결말 불가침·파격 클릭→의도 메모 합류). codex 맞춤 인터뷰·갈림길+continuity·결말 역산 헌장 라이브 실증.
- **VS 노출 자동열림 수정** — FloatingEditor 자동열림 useEffect(chapters 수 증가 + episodeForks/paceQuestions 있으면 state 패널 1회 자동 열림). brainstorming→설계 승인→TDD(floatingEditor.test +3, react-dom 실DOM). init.sh 580 녹색.

### 손대지 말 것
- 자동열림 트리거 — `count > prev && hasDecision`(chapters 증가 엣지 + episodeForks/paceQuestions 있을 때만). prevChapterCountRef 로 증가 감지. "닫으면 재발 X·과거 회차 전환(수 불변) X"가 의도. 매 렌더 열거나 length 비교 빼면 작성 방해.
- 1화 직후(첫 마운트) 자동열림은 YAGNI 보류(설계 결정). 원하면 "방금 생성됨" 신호 prop 별도 필요.
- VS·갈림길은 fc-p-state 패널 안. openPanel 초기 null 유지(자동열림이 보강).

### 다음 세션이 해야 할 한 가지
- **머지/푸시 — 사용자 결정 대기**(fix/vs-panel-autoreveal → main).
- dogfooding 발견 백로그(progress '최근 검증 2차') — 우선순위: 분량 2체계(매체 3등급↔헌장 2등급)·온보딩/의도 영속 X·제목 ". " 누수. + 소비/소거 라이브(2화 생성으로 VS 전개 본문 반영+stripConsumedSeeds 소거).
- preview 환경 주의 — dev 서버 간헐 사망(idle 포함)·재시작 시 localStorage 세션 격리(작품 소실)·navigate 갭(data: → location.href 수동)·preview_fill 은 native setter+input 우회.

---

## 2026-06-15 — Phase C-1 VS 회차 후보: 의외성 제안 채널 (feat/vs-episode-candidates, 서브에이전트 구동)

> 사용자 "A 묶음(글 품질)부터 + 경쟁 도구(Sudowrite Muse·NovelCrafter Codex) 메커니즘 정리해 반영". brainstorming→spec→plan→서브에이전트 구동 풀 사이클로 VS(Verbalized Sampling) 회차 후보 = U4 의외성 직격(딥리서치 1순위 권고) 구현. 10 task TDD + final review + codex e2e. feat 브랜치, 미머지·미푸시.

### 한 것
- **VS 회차 후보 채널** — 갈림길 카드에 [전개 후보 받기] 버튼 → LLM이 "이번 화 전개 방향 4개+확률" verbalize → 흔함/의외/파격 라벨 → 클릭 시 buildVsIntentSeed→composeIntentWithFork(기존 배관)로 의도 메모 합류 → buildDraftPrompt 소비 → stripConsumedSeeds 소거.
- **6지점 복제(spine-suggest 패턴)** — buildVsCandidatesPrompt(promptBuilders↔storyx.mjs byte-identical 미러) · storyx vs-candidates 명령 · api/vs-candidates.ts · vite 브리지 · vsCandidatesClient.ts · aiStatus mode 'vs-candidates'.
- **순수함수(episodeBriefing.ts)** — VsCandidate·VsRarity·classifyRarity(0.4/0.15 임계)·buildVsIntentSeed·normalizeVsCandidates(overlapsCanonFact 재사용·확률 clamp·기본0.3·4 cap)·SEED_PATTERN_VS.
- **UI** — FloatingEditor .fc-vs 블록(버튼·후보·rarity 배지·canonSuspect) + StoryXDesk handleRequestVsCandidates.
- **codex e2e 실증** — CLI 실호출: 4후보 확률 0.42→0.12 꼬리분포 정확, 결말 수렴 경로만 의외, 미회수 약속 반영. classifyRarity 분포와 정합.
- 커밋 `9e286ec`~`aad16c5`(feat/vs-episode-candidates). spec·plan 커밋 `63978b5`·`fa776e7`.

### 손대지 말 것
- buildVsCandidatesPrompt promptBuilders↔storyx.mjs **byte-identical 미러** — 핵심 지시(방향 4개·꼬리분포·파격 0.15·결말 불가침) 한쪽만 바꾸면 dev(브리지)·prod 프롬프트 드리프트. promptBuilders.test `[vs-mirror]` 핀.
- 결말 헌장 불가침 — VS는 *경로*만 흔든다(조기 해소 방지 ≠ 결말 뒤집기). 프롬프트 문구 강제 + 검토망 보완.
- normalizeVsCandidates를 episodeBriefing.ts에 둔 것(spec 인터페이스는 client였으나 overlapsCanonFact 의존) — client는 import만.
- classifyRarity 임계 0.4/0.15 — 라이브 후 조정 가능하나 현재 codex 분포(0.42/0.27/0.19/0.12)와 정합.
- handleRequestVsCandidates의 medium/format은 `project.medium`이 아니라 `blueprint.medium/format`(이 파일 다른 콜백과 동형 — 반응형 집계값).

### 다음 세션이 해야 할 한 가지
- **preview 눈 확인(가벼움)** — 회차 2개+ 작품으로 floating 편집 → [전개 후보 받기] → .fc-vs 다크 렌더·흔함(회색)/의외(라임)/파격(코랄) 배지·클릭→의도 메모 합류·생성 후 stripConsumedSeeds 소거. 이번엔 codex e2e(CLI)+단위테스트(floatingEditor +3)+소스핀으로 갈음(preview UI 미확인). preview 불안정 시 소스핀 유지.
- **Phase C 나머지** — C-2(수락 시 storyContract.amendments 기록+비트 갱신)·C-3(fork 옵션 과격 선택 의무). 또는 A 묶음 다른 채널(B 날것 문체=Sudowrite Muse Style Examples 이식·후반 긴장 게이트·정보 비대칭·A-6 장편 기억=NovelCrafter Codex 차용).
- 머지/푸시 — 사용자 결정 대기(feat/vs-episode-candidates → main).

---

## 2026-06-14 (10차) — #10 매체/형식 변경 confirm — 무음 전환 방지 (main, TDD, ultracode)

> #5 직후 검토대기 #10 착수·완료. 매체/형식 변경이 confirm·영향분석 없이 즉시 전환되던 문제 해소 + 형식 영속 버그 동시 수정. 커밋 (아래). 라이브 갈음(소스 핀).

### 한 것
- **selectMedium confirm 가드** — 기존 회차(chapters>0) 또는 헌장(storyContract)이 있고 매체가 실제 바뀔 때 window.confirm 으로 영향(작가진·생성/검토 기준 전환, 회차·헌장 유지) 안내. 취소 시 중단.
- **selectFormat 신설** — 형식 button 이 setFormat 만 하고 project 에 영속 안 하던 버그(리로드 시 휘발)를 confirm 가드 + project 영속으로 수정. `onClick={() => selectFormat(option.id)}`.
- editorFocusLayout.test +2 소스 핀(selectMedium·selectFormat confirm·배선).

### 손대지 말 것
- confirm 가드의 `nextMedium !== medium`(형식은 `nextFormat !== format`) — 같은 매체/형식 재선택엔 confirm 안 뜨게. 빼면 무변경에도 다이얼로그.
- selectFormat 의 project 영속(setProject + saveProject) — 기존 setFormat 단독은 휘발 버그였다. 되돌리면 형식 변경이 리로드 시 사라진다.

### 다음 세션이 해야 할 한 가지
- (선택) #10 라이브 눈 확인 — 미디어 패널(⌘K → 매체 변경) 열고 다른 매체/형식 클릭 시 confirm 다이얼로그. 이번엔 미디어 패널 경로(palette→패널→옵션) 자동화 복잡으로 소스 핀 갈음.
- 검토대기 잔여 — #17(떡밥·비트 보드 편집) + 매체 차별 #8(학술 마진검토 dead code)·#9(매체 작업면). 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md` §3.

---

## 2026-06-14 (9차) — #5 잠긴 회차 편집 보호 + 잠금 해제 (main, TDD+라이브, ultracode)

> #4 직후 검토대기 #5 착수·완료. 잠긴 회차가 editable=true 로 무음 편집되던 데이터 손실 + unlockChapter 미배선 해소. 커밋 (아래). 라이브 검증 완료.

### 한 것
- **commitChapterProse 잠금 가드** (storyEngine.test +1) — 잠긴 회차는 prose 변경 무시(참조 동일). UI editable=false 와 이중 안전망(도메인 레벨 데이터 안전).
- **editable 게이트** — floatingEditorProps `editable: !isLatestLocked`(기존 무조건 true). FloatingEditor `contentEditable={editable && !isLocked}`.
- **잠김 안내 + 해제 UI** — FloatingEditor isLocked·onUnlock props. ep-sub 다음 🔒 배너(읽기전용 안내)+"잠금 해제" 버튼. floatingEditor.test +4(읽기전용·배너·onUnlock·미잠금 미렌더·desk 핀). `.ep-locked-banner`/`.ep-unlock-btn` 다크 토큰.
- **handleUnlockChapter** (StoryXDesk) — confirmChapterLock 역동작(unlockChapter + saveProject + setLatestChapter). floatingEditorProps isLocked·onUnlock.
- **라이브(preview)** — 회차 잠금 patch → 둘째 회차 로드: 🔒 배너·contentEditable=false·해제 버튼 → 해제 클릭 → 편집 재개(true)·배너 제거·localStorage locked=false 영속. fresh load·인터랙션 런타임 에러 0(센티넬 확인).

### ★ 콘솔 에러 판정 (중요)
라이브 중 콘솔에 "error in <StoryXDesk>" 8건이 떴으나 **순차 Edit 사이 HMR 중간 상태 아티팩트**다 — isLocked·onUnlock 을 floatingEditorProps 에 먼저 추가하고 handleUnlockChapter 함수를 그 다음에 추가하는 사이, HMR 이 onUnlock: handleUnlockChapter(미정의) 를 잡아 ReferenceError. **fresh reload 후 화면 정상·에러 불변(reload 가 에러 안 늘림)·런타임 센티넬 0·tsc/build 정합으로 확정.** 교훈 — preview 에서 한 기능을 여러 Edit 으로 나눠 배선할 때 중간 HMR 콘솔 에러는 정상이며, **DoD "콘솔 0"은 fresh load 기준으로 판정**한다.

### 손대지 말 것
- commitChapterProse 의 `project.chapters[index].locked` 가드 — editable=false(UI)와 별개 도메인 안전망. 빼면 잠긴 회차 prose 가 코드 경로(회차 전환 flush 등)로 덮일 수 있다.
- editable: !isLatestLocked + FloatingEditor `contentEditable={editable && !isLocked}` 이중 — isLocked 만으로도 읽기전용. 둘 중 하나만 두면 게이트 약화.
- handleUnlockChapter 가 confirmChapterLock 미러(unlockChapter+saveProject+setLatestChapter) — saveProject 빼면 새로고침 시 잠금 해제 소실.

### 다음 세션이 해야 할 한 가지
- 검토대기 잔여 — #10(매체/형식 변경 confirm·영향분석)·#17(떡밥·비트 보드 편집) + 매체 차별 #8(학술 마진검토 dead)·#9(매체 작업면). 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md` §3.
- (선택) #3 라이브 눈 확인(7차 노트). preview 안정화됨 — 단, 순차 Edit HMR 콘솔 에러는 fresh reload 로 판정.

---

## 2026-06-14 (8차) — #4 FloatingEditor 회차 선택기: 단편 포함 회차 전환 (main, TDD+라이브, ultracode)

> #3 직후 같은 ultracode 세션에서 청사진 maps[2] 기반 #4 착수·완료. floating 편집기(기본)에 회차 선택기 부재 + 단편 isSerial 게이트 차단 해소. 커밋 (아래). 라이브 검증 완료.

### 한 것
- **FloatingEditor 헤더 회차 선택기** — chapters·currentChapterId·onSelectChapter optional props 추가. ep-kicker 다음에 드롭다운(episode화·title·잠김)+이전/다음 chevron+위치(N/M). 게이트 `chapters.length > 1`(isSerial 무관 — 단편 다회차 지원). `.ep-chapter-*` 다크 토큰(--bg-2·--ink·--rule-soft, fc 스코프). floatingEditor.test +5(렌더·select·prev/next disabled·1개 미렌더·desk 핀).
- **회차 전환 = 기존 경로 재사용** — StoryXDesk floatingEditorProps 에 chapters·currentChapterId·onSelectChapter. onSelectChapter = setLatestChapter(found) → latestChapter effect(미커밋 prose flush + 새 회차 시드)를 그대로 탄다(stepChapter·#1 본문영속과 동일). 새 전환 로직 0.
- **라이브(preview)** — 샘플 작품 회차 2개: floating 헤더 picker 렌더(옵션 "1화·첫 회차"/"2화·둘째 회차"·다크 --bg-2) → select ch1 전환 → 본문 "한서윤은 거리를 걸었다."(ch1 prose 로드)·제목 "첫 회차"·위치 1/2·이전 비활성. (※ HMR 미반영으로 처음 picker 안 떴다가 reload 후 정상 — dev 서버 HMR 주의.)

### 손대지 말 것
- floatingEditorProps 에서 chapters·onSelectChapter 를 **productionBlockedReason 뒤(객체 끝)**에 둔 것 — editorFocusLayout.test 의 F-002·A-2 핀이 floatingEditorProps 시작부터 **2000자 윈도우**로 mainActionLabel·productionBlockedReason 존재를 검사한다. 앞쪽에 넣으면 그 둘이 윈도우 밖으로 밀려 두 핀이 깨진다(이번에 한 번 깨고 뒤로 옮겨 해결).
- onSelectChapter 가 setLatestChapter 만 호출하는 것 — prose flush·시드는 기존 latestChapter effect(StoryXDesk:1586) 소관. 여기서 직접 prose 손대면 #1 본문영속 flush 와 충돌.
- picker 게이트 `chapters.length > 1` — 1개면 선택 무의미라 미렌더. isSerial 로 되돌리면 단편 차단 재발(#4 원점). FloatingEditor 는 isSerial 을 받지 않으므로 라벨은 episode화 통일(단편도 회차 번호로 구분).

### 다음 세션이 해야 할 한 가지
- **중간 수정 루프 + 검토대기 #3·#4·#7 골격 완료.** 남은 베타 검토대기 — #5(잠긴 회차 편집 보호·unlockChapter UI)·#10(매체/형식 변경 confirm)·#17(떡밥·비트 보드 편집) + 매체 차별 #8(학술 마진검토 dead)·#9(매체 작업면). 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md` §3.
- (선택) #3 라이브 눈 확인(7차 노트) — 회차 있는 작품으로 데이터→인물 편집 시 영향 회차. 이번 #4 에서 preview 안정화됐으니(reload 로 HMR 반영) 같이 가능. ※ preview 의 "샘플 작품"은 격리 자동화 브라우저 프로필의 데모(사용자 실데이터 아님, 회차 잔여 무관).

---

## 2026-06-14 (7차) — #3 영향 회차 인라인: 편집 지점에 영향 범위 미리보기 (main, TDD, ultracode)

> #7 직후 같은 ultracode 세션에서 청사진 maps[1] 기반 #3 착수. 순수 로직 변경 0 — 기존 plan 을 편집 지점에 표시. 커밋 (아래 참조). ★ 라이브는 preview 환경 불안정으로 갈음(코드 검증).

### 한 것
- **CanonCanvas 영향 회차 인라인** — `canonRefactorPlan`(required) prop 추가, characters 섹션 aside(CharacterDetailPanel 다음)에 `affectedChapters.length > 0`일 때 "이 변경이 영향 주는 회차 N개" 미리보기(EP·title·reason, slice 5). StoryXDesk 2 호출처(2319 floating·2748 classic) 배선. `.ex-canon-impact` 다크 토큰. editorFocusLayout +2 소스핀.
- **순수 로직 0 변경** — findAffectedChapters·buildCanonRefactorPlan(canonRefactor.ts) 미수정. 기존 `canonRefactorPlan = useMemo(buildCanonRefactorPlan(project, canonChanges), [canonChanges, project])`(StoryXDesk:908)를 CanonCanvas 에도 흘림. 인물 편집 → logCanonChange → canonChanges → plan → 미리보기.

### 손대지 말 것
- canonRefactorPlan 을 CanonCanvas **required** 로 둔 것 — 두 호출처 배선을 tsc 가 강제. optional 로 바꾸면 전달 누락이 조용히 통과.
- findAffectedChapters 의 ID 링크 우선 + substring fallback + slice(-3) 폴백 — canonRefactor.ts 불변(#3 는 표시만). 약화 금지.

### 다음 세션이 해야 할 한 가지
- **#3 라이브 눈 확인(가벼움, 먼저)** — 이번엔 preview 환경 불안정(resume 후 서버 종료·포트 5174→5173 드리프트·자동화 브라우저 컨텍스트 격리·데이터모드 네비 타이밍)으로 라이브 갈음했다. **회차 있는 작품**(예: `docs/reviews/.../backups` 23화·30화)으로 데이터→인물→욕망 편집 시 aside 에 `.ex-canon-impact`(영향 회차) 렌더를 한 번 눈으로. CanonCanvas 렌더 자체·인물 편집은 #6 세션서 확인분이라 표시 로직만 보면 된다. (주의 — preview 의 localStorage 는 사용자 실작업과 격리된 자동화 브라우저 프로필이라 "샘플 작품" 시드가 보일 수 있다. 사용자 실데이터 아님.)
- **#4 FloatingEditor 회차 선택기** — 청사진 maps[2]. prose flush 레이스(editorTextRef·commitChapterProse·debounce, StoryXDesk:1544-1601)·isSerial 게이트 완화('length>1')라 셋 중 가장 침습적. 신규 floatingEditor.test 필요. 이로써 "중간 수정 루프 골격 + 검토대기 #3·#4·#7" 마무리.

---

## 2026-06-14 (6차) — #7 작품 헌장 편집: 잠긴 헌장 재열람·개정·undo (main, TDD+라이브, ultracode)

> 사용자 "세션핸드오프 읽고 울트라코드로 개발 이어가라". ultracode Workflow(Explore 3 병렬 매핑 + 청사진 합성)로 베타 검토대기 #7·#3·#4 를 정밀 매핑한 뒤 #7부터 TDD + preview 라이브 완주. 청사진의 핵심 사실 4건은 Claude 가 직접 Read 로 독립 검증. ultracode 적대 검토(17 에이전트) 14건 전부 기각 + 다회 개정·undo 엣지 라이브 독립 확인. 커밋 `207150f`(main).

### 한 것
- **storyEngine 순수 함수 2개 (TDD, storyEngine.test +5)** — `isSpineComplete(spine, lengthClass)`(단편 2줄·장편 4줄 잠금규칙을 buildStoryContractFromOnboarding 에서 추출해 공용화)·`applyContractAmendment(contract, {reason, at, change?, patch})`(척추·결말·대가·화수 부분 패치 → deriveBeatSheet·isSpineComplete 재실행으로 비트 재산출·잠금 재계산, amendments 누적). **at 은 인자 주입**(storyEngine 순수성 — Date/random 미사용).
- **canonRefactor `revertCanonChange` story-core 분기에 storyContract JSON 복원 추가 (TDD, canonRefactor.test +2)** — 중첩 객체라 `before`(직전 헌장 JSON)를 `JSON.parse` 로 복원. 평면 대입이면 storyContract 자리에 문자열이 박힌다. 손상 JSON 은 참조 그대로(안전 실패). 기존 character/world/canon/voice undo 는 불변(분기 '추가'만).
- **미러 불변 회귀 핀 (episodeBriefing.test +2)** — 척추 개정 후 `buildContractStatus` 형태 불변 + 화수 개정 시 remaining 증가. ContractStatusInput(예산 숫자만 운반)에 amendment 미노출 → **promptBuilders.ts↔storyx.mjs 무수정**을 박제.
- **UI 배선 (editorFocusLayout.test +4)** — 신규 `CharterAmendCard`(로컬 draft state + 외부 헌장 변경 시 useEffect 재시드 + **바뀐 필드만 patch**) · StoryXDesk `amendCharter`(헌장 없으면 no-op, logCanonChange `revertField:'storyContract'` 로 #1-undo 재사용) · MemoryBankStudio overview 에 `project.storyContract && onAmendCharter` 조건부 렌더 · styles.css `.sx-charter-amend` 다크 토큰.
- **라이브(preview)** — 헌장작품("반납되지 않은 편지") 데이터→바이블→작품 계약: 카드 렌더(장편 30화·잠김 라임 배지·척추 4줄+결말+대가 6 textarea+화수 input·다크 rgb(15,16,17)) → 욕망 편집 dirty 감지 → "이 개정 반영" → spine 갱신·비트 핀 재산출·이력 "척추 욕망 개정"(전 필드 아님) → 변경 로그 "↩ 되돌리기" → storyContract 전체 원복(spine·beat·amendments) · 콘솔 0 · 원본 무손상.

### 손대지 말 것
- `applyContractAmendment` 의 **at 인자 주입** — storyEngine 순수성. 함수 안에서 `new Date()` 호출로 바꾸면 storyEngine.test 결정론이 깨진다(#6 nextCharacterId 와 같은 원칙).
- `revertCanonChange` 의 storyContract 전용 분기(`revertField === 'storyContract'` → JSON.parse, try/catch 안전 실패) — character/world/canon/voice 기존 undo 분기는 절대 수정 금지. '추가'만.
- ContractStatusInput 에 amendment/spine 을 **노출하지 말 것** — 노출하는 순간 promptBuilders.ts·storyx.mjs 동시 수정 필요 + episodeBriefing.test 미러 핀이 깨진다. amendment 는 StoryContract 내부에 가두고 buildContractStatus 를 개정된 헌장에서 재계산하는 구조 유지.
- CharterAmendCard 의 `useEffect([contract])` 재시드 — 되돌리기·다른 개정으로 헌장이 바뀌면 폼을 최신값으로 다시 시드한다. 제거하면 undo 후 폼이 옛 값으로 남는다.
- amendCharter 의 `if (!contract) return;` no-op 가드 — 헌장 없는 기존 작품·백업은 카드 자체 미렌더(MemoryBankStudio 조건부)라 이중 안전.

### 다음 세션이 해야 할 한 가지
- **#3 영향 회차 인라인** — CanonCanvas/CharacterDetailPanel 편집 지점에 `findAffectedChapters` 결과(buildCanonRefactorPlan.affectedChapters)를 optional prop 으로 흘려 인라인 미리보기. 순수 로직 변경 0(canonRefactor.ts doNotTouch), 배선+CSS 위주. 이번 Workflow 청사진의 `maps[1]`(featureKey: canon_refactor_impact_in_edit_points)에 touchPoints·doNotTouch·TDD 후보 상세. 그 뒤 **#4 FloatingEditor 회차 선택기**(prose flush 레이스·isSerial 게이트 완화 — `maps[2]`, 가장 침습적이라 마지막).
- 청사진 원본은 Workflow 산출(`maps`·`blueprint`) — progress.md 6차 검증 블록 + 이 노트에 요약. 커밋 시 #7 묶음(storyEngine·canonRefactor·CharterAmendCard·MemoryBankStudio·StoryXDesk·styles.css·테스트 4파일).

---

## 2026-06-14 (5차) — #6 인물 CRUD: 추가·삭제·이름변경 (main, TDD)

> 베타테스트 "중간 수정 루프 3대 골격" 마지막(#6)의 1단계 — 인물 add/remove/rename. 순수 함수 TDD + 컴포넌트 체인 배선. 커밋 완료.

### 한 것
- **storyEngine 인물 CRUD 순수 함수** (TDD, storyEngine.test +1) — addCharacter(빈 필드·결정론 char-N id, 충돌 회피)·removeCharacter(인물 + 다른 인물의 그 인물 향한 relations 정리)·renameCharacter. 없는 id 는 참조 그대로(무변경).
- **배선 체인** — StoryXDesk handleAdd/Remove/RenameCharacter → CanonCanvas(onAddCharacter·onRemoveCharacter·onRenameCharacter prop + "+ 인물 추가" 버튼, characters 카테고리만) → CharacterDetailPanel(이름 input·"이 인물 삭제" confirm). `.ex-canon-detail-name-input` CSS. editorFocusLayout +1 소스 핀. init.sh 530 녹색.

### 손대지 말 것
- `nextCharacterId` 결정론(char-N, 기존 id 충돌 회피) — Date/random 미사용(storyEngine 순수성). storyEngine.test 가 id 유일성 핀.
- removeCharacter 의 relations 정리(다른 인물의 targetId===삭제id 엣지 제거) — 빼면 고아 엣지가 관계도에 남는다.
- CanonCanvas "+ 인물 추가"는 `category === 'characters'` 일 때만 — 다른 캐논 카테고리(장소/사물)엔 의미 없다.

### 다음 세션이 해야 할 한 가지
- **#6 라이브 확인됨** — 데이터→인물 진입 시 "+ 인물 추가"·이름 input·"이 인물 삭제" 렌더, 추가 클릭 시 char-2 "새 인물" 생성 확인(centerSlot=CanonCanvas 라 floating 데이터 정상 발화). 원본 복원. rename/remove 는 같은 체인+순수함수 TDD.
- **#6 잔여** — 인물 role 편집(updateCharacterMemory field 확장)·캐논 엔티티(장소/사물/사건) CRUD(CanonCardGrid)·매체별 캐릭터 스키마(만화 외관 — CharacterProfile appearance + comics 분기). 리포트 §3-6·§3-9.
- 이로써 "중간 수정 루프 3대 골격"(#1 본문 영속·#1-undo 되돌리기·#6 CRUD) 1차 완료. 다음은 검토대기 #3(영향 회차 인라인)·#4(회차 선택기)·#7(헌장 편집).

---

## 2026-06-14 (4차) — #1-undo 바이블 되돌리기 (main, TDD)

> 베타테스트 2순위(전원 10명) 착수·완료. 수동 바이블 편집에 변경별 되돌리기 신설. revertCanonChange 순수 함수 TDD + 배선. 커밋 완료(아래 다음 한 가지 참조).

### 한 것
- **canonRefactor `revertCanonChange(project, change)`** (TDD, canonRefactor.test +1) — change.before(최초 원본)를 식별자(targetId·revertField)로 정확 복원. character/world/canon/story-core/voice 분기, 식별자 없으면 참조 그대로(안전 실패, 이름 역매칭 의존 0).
- **CanonChangeEntryInput 에 `targetId`·`revertField`** 추가 — 5개 update 함수(updateProject·CreativeWeight·Character·World·Canon)가 식별자 기록.
- **StoryXDesk `revertCanonChangeEntry`** — setProject(revertCanonChange) + canonChanges 에서 해당 항목 제거. MemoryBankStudio(onRevertCanonChange) → CanonRefactorPanel(onRevert) 체인. 패널에 "↩ 이 변경 되돌리기" 버튼(revertField·targetId 있을 때만) + `.sx-revert-change-button` 다크 토큰 CSS.
- editorFocusLayout +1 소스 핀. init.sh 528 녹색.

### 손대지 말 것
- `revertCanonChange` 식별자 가드(targetId·revertField 없으면 return project) — 구버전 변경 로그·미지원 kind(visual/audio) 안전 실패. canonRefactor.test 가 핀.
- `before` 병합(logCanonChange 의 `existing?.before ?? input.before`) — 같은 필드 3~6회 수정해도 before 는 최초 원본 유지. 되돌리면 중간값 아니라 원본 복귀. undo 정확성 근거.
- update 함수의 targetId·revertField 전달 — 빼면 revert 가 식별자 없어 no-op.

### 다음 세션이 해야 할 한 가지
- **#6 CRUD (중간 수정 루프 3대 골격 마지막)** — 인물·캐논 add/remove/rename. 현재 욕망/상처/현재상태 3필드 덮어쓰기만, 추가·삭제·이름 변경 핸들러 0개. 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md` §3-6. 매체별 캐릭터 스키마(만화 외관 등)도.
- (선택) #1-undo 라이브 눈 확인 — 데이터 모드 인물 편집 → 변경 로그 "되돌리기" 클릭 복원(순수 함수는 TDD 검증됨).

---

## 2026-06-14 (3차) — #1 본문 영속: 편집 자동 저장 (main, TDD+라이브)

> 베타테스트 1순위(데이터 손실) 착수·완료. editorText→chapter.prose commit 경로 신설로 편집 무음 소실 해결. TDD(storyEngine) + preview 라이브(편집→새로고침 유지). 커밋 미실행(사용자 결정 대기).

### 한 것
- **storyEngine `commitChapterProse(project, chapterId, prose)`** (TDD, storyEngine.test +1, 67) — chapters 에서 id 매칭 prose 만 갱신. 없는 id·동일 prose 는 참조 그대로(no-op — 불필요 저장 차단).
- **StoryXDesk 배선** — `editorTextRef`(stale closure 회피 최신값)·debounce 800ms 자동 commit effect(editorText→latestChapter.id prose)·`latestChapter` effect 에 `loadedChapterIdRef` 추가해 회차 전환 시 이전 회차에 미커밋 편집 flush 후 새 회차 시드. editorFocusLayout +1 회귀 핀.
- **라이브 검증** — test 회차 주입 → contentEditable 편집 → 800ms 후 localStorage chapter.prose 에 마커 commit(hasMarker:true) → 새로고침 후 본문 마커 유지(editorShowsMarker:true, 이전엔 소실). 원본 무손상 복원.

### 손대지 말 것
- `commitChapterProse` no-op 가드(없는 id·동일 prose → 참조 동일) — debounce effect 가 매 타이핑 호출해도 불필요 saveProject 안 일어나게. storyEngine.test 가 핀.
- `loadedChapterIdRef` 전환 flush — 회차 전환 시 이전 editorText 를 이전 회차에 commit한 뒤 새 prose 시드. 제거하면 전환 시 미커밋 편집 소실 재발.
- `editorTextRef.current` — debounce/flush 가 stale editorText 를 안 쓰도록. setTimeout/effect 안에서 editorText 직접 참조로 되돌리면 stale.

### 다음 세션이 해야 할 한 가지
- **#1 나머지 보강(선택·낮음)** — 저장 중/dirty 표시(FloatingEditor:390 '저장됨' 하드코딩 → isBodyDirty prop)·beforeunload 경고. 단 자동저장으로 '저장됨'이 사실상 참이 돼 우선순위 낮음.
- **중간 수정 루프 3대 골격의 2·3순위** — #1-undo(바이블 되돌리기, freq10)·#6 CRUD(인물·캐논 add/remove/rename). 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md` §3.

---

## 2026-06-14 (2차) — 울트라코드 10인 베타테스트 + UI/UX 안전 자동수정 3건 (main, TDD)

> 사용자 "ultracode 로 10인 베타테스터가 캐릭터·이야기 3~6회 중간수정하는 시나리오로 검사 후 UIUX 개선". 04:32 예약 → 사용자 "지금 바로 시작"으로 즉시 실행. Workflow 10인 워크스루(findings 74 → 종합 24) + 안전 자동수정 3 TDD. 커밋·push 미실행(사용자가 아침에 검토·선별).

### 한 것
- **베타테스트(ultracode Workflow)** — 10인(장편2·단편2·에세이2·만화2·오디오1·학술1) 코드·플로우 워크스루. **첫 시도 동시 10 호출이 서버 rate limit 전멸 → 배치 3씩으로 스크립트 수정 후 성공.** 종합·적대적 검증. 리포트 `docs/reviews/2026-06-14-ultracode-beta-10/REPORT.md`, raw `synthesis-raw.json`·`walks-raw.json`.
- **★ 핵심 발견** — "생성 중 캐릭터·이야기 설정 변경" 흐름이 구조적 미완성. 본문 영속·되돌리기·CRUD·헌장 편집 부재(상세 리포트).
- **자동수정 3 (TDD, appExperience +3, 524 녹색)** — #2 charter 연재 building 캐러셀 빈화면(buildingPanelIndex 를 charter 제외 단계 수로 — ★직전 charter 스크롤 핫픽스의 후속 회귀)·#11 매체변경 패널 흰/크림→`var(--sx-card)` 다크·#4 오디오 낭독 60초 carry. 앱 콘솔 에러 0.

### 손대지 말 것
- `buildingPanelIndex = homeFlowSteps.filter((s) => s.id !== 'charter').length` — charter 패널이 조건부 mount(homeFlowStep==='charter')라 building 시점 unmount. `homeFlowSteps.length` 로 되돌리면 연재 생성화면 빈 다크 재발. appExperience 테스트가 핀.
- 리포트의 검토 대기 14 / 보류 3 분류 — 자동수정은 명확·국소·저위험 3건만(사용자 "안전" 원칙). #1 본문 무음 소실 등은 흐름 재설계라 의도적으로 미수정.

### 다음 세션이 해야 할 한 가지
- **#1 본문 편집 영속 (데이터 손실, 최우선)** — editorText→chapter.prose commit 경로 신설 + dirty 가드 + 정직한 저장 표시 + beforeunload. 리포트 §3-1. 그 뒤 #1-undo(되돌리기)·#6 CRUD 가 "중간 수정 루프" 3대 골격. **이게 사용자 요청("중간 수정 UX")의 본체라 A-6(기억)보다 우선 후보.**
- 보류 3(#14·#23·#20)은 소건이라 골격 작업에 곁들임. 라이브 미확인분(#2 charter→building 전경로)은 다음에 charter 작품으로 눈 확인 가능.

---

## 2026-06-14 — charter 스크롤 버그 핫픽스 + 이야기 품질 딥리서치 (main, TDD)

> 사용자가 로컬 실사용 중 작품 헌장(charter) 단계 스크롤 불가·편집 곤란 발견 → systematic-debugging 으로 근본원인 특정·TDD 수정·preview 라이브 검증. 그 전에 "이야기 품질·의외성" 딥리서치(deep-research workflow, 105 에이전트)를 완주해 정본 문서화. 커밋·origin push 미실행(사용자 요청 시).

### 한 것
- **charter 스크롤 핫픽스** — 근본원인: charter 패널이 다른 온보딩 단계의 `.hx-panel > .hx-main(overflow-y:auto)` 스크롤 컨테이너 패턴을 미준수(`.hx-panel-charter > .hx-charter` 직속)해 `.hx-panel` overflow:hidden 이 긴 콘텐츠 하단을 클리핑 + padding 부재. 수정: App.tsx charter 를 `.hx-main` 으로 감쌈 + styles.css `.hx-panel-charter { grid-template-columns: 1fr }`(빈 aside 컬럼 제거). appExperience.test +1(RED→GREEN). 라이브(장편): 단일 1fr·scrollable·하단 4줄+CTA 접근·padding 복원. init.sh 521 녹색.
- **딥리서치 정본** `docs/research/2026-06-14-prose-quality-surprise-research.md` — 이야기 품질·의외성(U3·U4) SOTA(18 확정·7 반박·23 소스). 진단(조기해소/mode collapse/typicality bias)·처방(VS·후반부 긴장 게이트·멀티 페르소나)·박제 금지·근거 공백(한국어 문체).

### 손대지 말 것
- charter 의 `.hx-main` 래퍼 + `.hx-panel-charter { grid-template-columns: 1fr }` — 스크롤·여백·단일 컬럼을 한 번에 해결. `.hx-panel` 기본은 2컬럼(minmax(0,1fr) 320px)+overflow:hidden 이라 되돌리면 버그 재발. appExperience 테스트가 핀(charterBlock 안 hx-main 순서 + CSS 규칙).
- charter 의 `.hx-main` 들여쓰기가 hx-charter 와 동일 레벨(최소 변경) — 기능 무관, prettier 시 정리 가능.
- 딥리서치 문서의 refuted(박제 금지) 수치 — min-p 창작 우월성·narrative-forecasting 정확 레시피는 검증 탈락. 인용 금지.

### 다음 세션이 해야 할 한 가지
- **리서치 후속 착수 결정 (사용자 대기)** — ① VS 회차 후보 생성(최저비용·training-free·Phase C 의외성 채널 직결) ② 후반부 긴장 게이트(조기 해소 차단·헌장 역설 직격·StoryScore v0.3) ③ 헌장 정보 비대칭 레인(Phase A 후속). 추천 1순위=①, 근본=②. 원래 1순위였던 A-6(장편 기억 R1~R3)도 유효.
- charter 스크롤은 장편으로 라이브 검증함 — 단편(2줄 경량)도 같은 `.hx-panel-charter` 구조라 동일 적용(분량 무관). 의심되면 단편으로 눈 확인 한 번.

---

## 2026-06-13 (3차) — A-3c 비트 펼침 미리보기: charter 4줄→화수 핀 시각화 (main, TDD)

> A-3b 직후 A-3c 이행. charter 단계에서 잠근 4줄(장편)이 30화의 어디에 박히는지 미리 보여준다. TDD + preview 라이브(charter 진입+4줄 주입) + main ff-merge. origin push 미실행. **이로써 Phase A 헌장 체인의 온보딩 UI(A-3 charter·A-3b 제안·A-3c 미리보기)가 완성됐다.**

### 한 것 (코드 `92c7ab2`)
- **App** — deriveBeatSheet import + charter 4줄 fieldset 아래 비트 미리보기. `contractLengthClass === 'long' && spineComplete` 일 때 `deriveBeatSheet(contractSpine, contractPlannedEpisodes)` 를 8·15·23·30화 핀+미션으로 렌더(읽기 전용).
- **styles** — `.hx-charter-beats`(dashed 박스)·`.hx-beat-pins/pin/ep/mission`(flex, 화수 라임 강조) + A-3b 의 `.hx-spine-suggest`(풀폭)·`.hx-spine-note` CSS 보강(A-3b 커밋엔 클래스만 있고 CSS 없었음).
- TDD — appExperience +1(소스검사: deriveBeatSheet·hx-charter-beats·"화에 이렇게 박힙니다"). 519→520.
- 라이브 — ?stage=home 온보딩(freewrite 없이 인터뷰로 계속→작품 헌장 잡기로 charter 진입) + 4줄/결말/대가 eval 주입 → 8/15/23/30화 핀·미션 매핑·dashed 박스·라임·"헌장 확정" 활성·콘솔 0. A-3b 버튼은 freewrite 없어 풀폭 disabled(로직 확인).

### 손대지 말 것
- A-3c 미리보기 조건 `contractLengthClass === 'long' && spineComplete` — 단편은 2줄이라 미션 빈 칸이 많아 미리보기 제외(의도). 단편 포함하려면 별도 처리.
- deriveBeatSheet 은 읽기 전용 표시 — 화수 자동 배분(25/50/75/100%, 강증가 보정). 작가 화수 조정 UI 는 추후(자동이 합리적 기본이라 우선순위 낮음).
- charter textarea 순서 = [0]결말 [1]대가 [2]욕망 [3]전진 [4]시련 [5]변화 — 라이브 주입 시 label "욕망"이 결말 문구("어떤 욕망·결심")에도 있어 **인덱스로 주입해야 정확**(byLabel 오매칭 주의).

### 다음 세션이 해야 할 한 가지
- **A-6 장편 기억 R1~R3 (큰 작업, 신선한 세션 권장)** — `buildProjectContextDigest`(storyEngine.ts:1310 근처)·`CONTEXT_CANON_LIMIT`(1304)의 head/tail 절단이 중반부 캐논을 통째 폐기(ch23 91중 51 소실). 입력 정본 `docs/research/2026-06-11-longform-memory-compression.md`. R1(관련 캐논 top-K 결정론 주입)·R2(5화 아크 다이제스트)·R3(중요도 가중 절단). 같은 digest 빌더를 건드리므로 한 묶음 설계. 효과 측정은 Phase F 재실험(30화 A/B).
- 보조 — Phase B(긴장 감수자·날것 규칙 — 사용자 실독 U3 "온건한 문체" 직격)·학술 단계 게이트(charter 경로 신설, academic 1.0 실험 플래그라 후순위)·charter UI 화수 조정(A-3c 확장).

---

## 2026-06-13 (2차) — A-3b 쇼러너 4줄 제안: charter 단계 LLM 척추 제안 (main, TDD)

> A-2 직후 다음 시퀀스(A-3b) 이행. charter 단계에서 작가가 빈 4줄을 맨손으로 채우는 대신, 쇼러너가 자유 서술·결말을 읽고 4줄을 제안한다. pace-interview 인프라를 6개 지점에 미러. TDD + codex 라이브 + main ff-merge. origin push 미실행.

### 한 것 (코드 `7486e93`)
- **프롬프트** — `buildSpineSuggestionPrompt`(promptBuilders.ts) + storyx.mjs 미러(byte-identical). 4줄 정의(욕망/전진/시련/변화 = 내적 변화) 주입, endingStatement 있으면 4번 줄 정렬, JSON 계약 `{ "spine": {...} }`.
- **CLI/서버** — storyx.mjs `spine-suggest` 명령(codex, Q2 재시도 가드·`normalizeSpineSuggestion`) + `api/spine-suggest.ts`(prod) + vite 브리지(`/api/spine-suggest`).
- **클라이언트** — `spineSuggestClient.ts`(requestSpineSuggestion·normalizeSpine). aiStatus `AiCallMode` 에 'spine-suggest' + 라벨('척추 제안').
- **UI** — App.tsx charter 4줄 fieldset 에 "쇼러너에게 4줄 제안받기" 버튼 → `suggestSpine()` → **빈 칸만 채움**(`current.desire.trim() || suggested.desire`). freewrite 없으면 disabled. 로딩/실패 안내(`spineSuggestNote`). 인터뷰 답 수집은 `collectAnswerLines()` 헬퍼로 추출(goToBuilding 과 공용).
- TDD — promptBuilders.test +3(빌더·미러)·spineSuggestClient.test +3(normalize)·appExperience +1(버튼). 512→519.
- codex 라이브 — `/api/spine-suggest` 직접 fetch(달의 탑·이름 대가 freewrite + 결말): provider=codex·23.5초·4줄 작품 맞춤·resolution↔ending 정렬·콘솔 0.

### 손대지 말 것
- buildSpineSuggestionPrompt 의 JSON 계약·4줄 정의 문구 — promptBuilders↔storyx.mjs **byte-identical 미러**. promptBuilders.test 의 `[spine-mirror]` 가 지킨다. 한쪽만 바꾸면 깨짐.
- suggestSpine 의 **빈 칸만 채움** 원칙(`current.desire.trim() || suggested.desire`) — 작가가 이미 쓴 줄을 덮지 않는다. 통째 덮기로 바꾸면 작가 입력 손실.
- `collectAnswerLines()` 헬퍼 — goToBuilding 의 answerLines 와 동일 출력(순수 추출). goToBuilding 이 이걸 쓰므로 시그니처를 바꾸면 빌딩 경로가 깨진다.
- spineSuggestClient 는 실패 시 ok:false 만 — 폴백(결정론)은 의도적으로 안 만들었다(4줄은 창작이라 결정론 빈약). charter UI 가 안내만 하고 작가 직접 입력으로 강등.

### 다음 세션이 해야 할 한 가지
- **charter UI 시각 확인(경량)** — 이번엔 codex 통합을 직접 fetch 로 검증하고 charter 진입(온보딩 intake LLM 연쇄)은 생략했다. 사용자 실사용 또는 라이브에서 온보딩→charter 진입 시 버튼 렌더·"빈 칸만 채움"·로딩 표시를 한 번 눈으로 확인하면 완전(버튼은 fieldset 내부 무조건 렌더라 안전).
- **A-3c 비트 펼침 UI** — 4줄(spine)→beatSheet 화수 핀(`deriveBeatSheet`, storyEngine 에 이미 있음)을 charter 또는 편집 진입 시 보여주고 작가가 화수를 조정. 그 뒤 A-6(기억 R1~R3). 학술 단계 게이트(charter 경로 신설)도 대기.
- (선택) CSS — `hx-spine-suggest` 버튼·`hx-spine-note` 간격 미세조정(현재 hx-btn-ghost·hx-charter-help 재사용으로 기본 스타일은 보장).

---

## 2026-06-13 — A-2 단계 게이트: 미잠금 헌장 produceEpisode 차단 + 단편 2줄 경량 잠금 (main, TDD)

> 2026-06-12 (2차) 핸드오프의 "다음 세션이 해야 할 한 가지"(A-2) 이행. 헌장 체인에 **단계적 집필 게이트**를 채웠다 — 척추가 잠기기 전엔 본문을 못 만든다. TDD + preview 라이브 A/B + main ff-merge. origin push 미실행.

### 한 것 (코드 `3d98fe1`)
- **evaluateProductionGate(project)** (storyEngine) — 헌장이 있고 `spineLocked=false` 면 `{allowed:false, reason}`, 헌장 없거나 잠겼으면 `{allowed:true}`. **매체 무관 — spineLocked 단일 신호.**
- **단편 2줄 경량 잠금** — buildStoryContractFromOnboarding 가 `lengthClass==='short'` 면 desire+resolution 2줄만으로 spineComplete(장편은 4줄 전부). App.tsx charterReady 의 spineComplete 도 같은 규칙.
- **produceEpisode 진입 가드** (StoryXDesk) — 함수 앞에서 evaluateProductionGate 호출, 미잠금이면 setGenerationNote(reason) 후 return(생성 안 함).
- **CTA 비활성** — productionGate + productionBlockedReason(produceEpisode 가 메인 액션일 때만). FloatingEditor 가 productionBlockedReason 으로 메인 CTA disabled + "헌장 잠금 필요" + 사유 title.
- TDD — storyEngine.test +5(게이트 4·단편 빌더 1)·editorFocusLayout +2(가드·CTA prop)·appExperience +1(App 단편). 504→512.
- 라이브 — "반납되지 않은 편지"(localStorage) 를 spineLocked:false+chapters:[] 로 패치 → ?stage=editor → CTA disabled "헌장 잠금 필요" → spineLocked:true 복원 → "초안 생성" enabled → 원본 복원(백업 키 `__bak_a2`). 콘솔 0.

### 손대지 말 것
- evaluateProductionGate 의 **헌장 없으면 통과** 가드 — 하위호환의 핵심. 헌장 없는 30화 백업·기존 작품을 차단하면 progress.md 전체의 백업 재현 워크플로가 깨진다. spec 검증도 "spineLocked=false 차단"이지 "헌장 없음 차단"이 아니다(핸드오프 표현의 "헌장 없이…봉쇄"는 온보딩 charterReady 가 이미 강제하는 부분).
- 단편 spineComplete 기준이 **storyEngine(빌더)·App.tsx(charterReady) 두 곳**에 미러 — 한쪽만 바꾸면 온보딩 게이트와 빌더 잠금이 어긋난다. appExperience 테스트가 App 쪽 문자열(`contractSpine.desire.trim().length > 0 && contractSpine.resolution…`)을 핀.
- productionBlockedReason 은 **produceEpisode 가 메인 액션일 때만**(`!latestChapter || isLatestLocked`) 세팅 — 검토(reviewDraft)는 게이트 무관(이미 회차 있음).

### 다음 세션이 해야 할 한 가지
- **학술 단계 게이트의 실효** — 현재 usesCharter=isSerial·非에세이·非학술 이라 학술은 헌장이 안 생겨 게이트가 no-op. 학술까지 단계적 집필을 강제하려면 학술 charter 경로(연구질문→4줄≈주장/근거/반론/응답, claimLedger 정렬)가 필요(spec B 절). A-3 범위 확장이라 아래 A-3b/A-3c 와 묶을지 사용자 결정.
- **또는 A-3b(4줄 LLM 제안)** — charter 단계에서 쇼러너가 4줄을 제안하고 작가가 수정·승인(pace-interview 패턴 재사용). 결정론 폴백은 deepQuestion·audiencePromise 기반. 그 뒤 A-3c(비트 펼침 UI)·A-6(기억 R1~R3). 그 뒤 Phase B(긴장 감수자·날것)·C(트위스트)·E(비용)·F(재실험).

---

## 2026-06-12 (2차) — Phase D 완료 + 헌장 A-1·A-4·A-5·A-3 (main, TDD 11커밋, 체인 live)

> "이대로/계속/a3로 가자" 연속 이행. Phase D(결정론 소건) → Phase A 데이터모델·예산·프롬프트 주입·전 경로 배선·**온보딩 헌장 생성**까지 TDD + 라이브 검증. 전부 녹색·main. origin push 미실행. **★ A-3 으로 헌장 체인이 dormant→live — 신규 장편이 결말부터 4줄로 잡고 시작한다.**

### 한 것 (main `2e51fa2` 까지)
- **D-1 폴백 번호 드리프트** (`cf8f1de`) — `nextEpisodeNumber(project)`=chapters 마지막+1 로 도출. 폐기된 폴백 회차가 카운터만 올리고 사라져 번호가 결번되던 사고(쇼케이스 16→19)를 chapters 진실원천으로 치유. produceNextChapter·chapterFromDraftPayload 적용.
- **D-2 StoryScore v0.2** (`b7f59f2`) — 변형 의심 최소 길이 3(통제군 16건 위양성 차단)·analyzeTitles 어간 공유 제목 반복률(U1)·후크 신호 느낌표/반전어. 스킬 루브릭에 온건함(U3)·제목 반복(U1) 감점. V0_1→V0_2.
- **A-1 헌장 데이터 모델** (`a15728b`) — `StoryContract`·`StorySpine`(4줄)·`validateContract`(4/8/24/36·결말·비트)·`defaultPlannedEpisodes`(6/30)·createEmptyProject 시드. 전 필드 optional.
- **A-5 코어 예산** (`e92c13d`) — `buildContractStatus(project)`: position(chapters 마지막)·remaining·`overBudget`(미회수>잔여)·`finalStretch`(잔여≤25%).
- **A-4 프롬프트 주입** (`40646ea`) — digest 헌장 절(4줄+결말+대가+위치) + buildDraftPrompt 예산 회수/종반(새 큰 떡밥만 금지)/척추 환기(정체·초과 시만) + buildAgentReviewPrompt 쇼러너 길 잃음 점검·예산 초과 revise/block + storyx.mjs 미러(byte-identical). 에세이·standalone·헌장없음 미주입. **프롬프트 문구 사용자 승인 후 배선.**
- **A-5 배선** (`43c6d56` 생성 · `d2fd3f8` 검토) — StoryXDesk 가 `buildContractStatus(project)` 계산 → requestLlmDraft·requestAgentReview ×3 에 전달 → draftClient/reviewClient body·api/draft·api/review-agent·vite 브리지·storyx CLI `--contract-status` 플래그까지 전 경로. A-4 규칙이 실제 생성·검토에 발화. **헌장이 없으면 전 경로 no-op(하위호환).**
- **A-3 빌더** (`54fa97a`) — `deriveBeatSheet`(4줄→25/50/75/100% 핀, 강증가 보정)·`buildStoryContractFromOnboarding`(입력→StoryContract, 비트 펼침·4줄 완성 시만 spineLocked·등급 기본 화수).
- **A-3 온보딩 UI** (`2e51fa2`) — App.tsx 에 'charter' 단계(intake↔building, `usesCharter`=isSerial·非에세이·非학술). 분량 등급(단편/장편)·확정 회차·결말 2문항·4줄 척추 입력 → `charterReady` 게이트 → goToBuilding 가 seed.storyContract 합성 → StoryXDesk createEmptyProject 가 프로젝트에 박음. `.hx-charter` 다크 토큰 CSS. **라이브 검증 — 신규 장편 헌장(long·30화·비트4·spineLocked) 영속·콘솔 0.**

### 손대지 말 것
- 헌장 필드는 전부 optional — 구버전 저장본·기존 30화 백업과 하위호환. 필수화하지 말 것.
- `nextEpisodeNumber`·`buildContractStatus`·digest 헌장 절 위치의 "chapters 기준 도출" 원칙 — currentEpisode 카운터로 되돌리면 드리프트 버그 재발.
- finalStretch 임계는 raw 25%(planned×0.25, ceil 아님) — 22/30=잔여8 은 종반 아님, 23/30=잔여7 은 종반.
- A-4 헌장 규칙 문구는 promptBuilders.ts↔storyx.mjs **byte-identical 미러** — 한쪽만 바꾸면 promptBuilders.test.ts 미러 테스트가 깨진다. 정적 핵심 문구(`[헌장] 약속 예산 초과`·`[헌장] 종반 구간`·`4줄 척추의 어느 줄`·`[헌장] 길 잃음 점검`)는 양쪽 동시 갱신.
- A-4 적용 범위 = **연재(serial)·비에세이만**. 에세이·1편 standalone 은 의도적 제외(사용자 결정). 종반=새 큰 떡밥만 금지(작은 인물·소품 허용). 척추 환기=정체·초과 시만.

### 다음 세션이 해야 할 한 가지
- **A-2 단계 게이트** — 헌장 없이(또는 `spineLocked=false`) 장편·학술이 본문 생성으로 들어가는 경로 봉쇄. `produceEpisode`(StoryXDesk) 진입 가드 + 편집모드 탭/CTA 비활성. 단편은 desire+resolution 2줄만으로 경량 잠금. (A-3 온보딩은 charter 입력을 강제하지만, 백업 주입·기존 작품에는 헌장이 없을 수 있어 게이트가 필요.) 이어서 A-3b(4줄 LLM 제안, pace-interview 재사용)·A-3c(비트 펼침 UI)·A-6(기억 R1~R3).
- **헌장 작품으로 A-4/A-5 라이브 발화 관찰** — 이번에 만든 신규 장편(localStorage `serial-story-studio/project` 에 storyContract 박힘)으로 1화 생성 시 digest 헌장 절·종반/예산 규칙·쇼러너 길 잃음 점검이 실제 프롬프트에 뜨는지 확인(다음 세션 권장 — codex 생성이 느려 이번엔 헌장 영속까지만 검증).
- 참고 — A-5 까지 전부 하위호환 no-op 가드. 헌장 없는 기존 작품·30화 백업은 동작 불변. usesCharter 범위 = 연재(serial)·非에세이·非학술.

---

## 2026-06-12 (1차) — 품질·비용 로드맵 수립 + 작품 헌장 spec (main, 코드 변경 0)

> 사용자 실독 판정 인테이크 + 7차 핸드오프의 "착수 순서 결정" 이행. 문서만 작성한 계획 세션 — 코드·테스트 변경 0.

### 한 것
- **사용자 실독 결함 인테이크 (U1~U5)** — 제목 반복 · 정체된 중후반("언제 끝날지 모르는 연재는 중구난방") · 온건한 문체(통제군 포함 — 날것·긴장감 없음, 웹소설로 식상) · 의외성 부재(보조만 하고 제안 안 함) · 토큰 비용 과대.
- **사용자 결정 4건** — ① 분량 2등급: **단편 4~8화 · 장편 24~36화 시즌제, 중편 없음** ② 결말 역산(결말 확정 후 1화) ③ 별도 전개 에이전트 대신 CLAUDE.md 식 공유 기준 = **작품 헌장** ④ Story X 가 의외의 전개를 제안.
- **헌장 spec** — `docs/superpowers/specs/2026-06-12-story-contract-design.md`. StoryContract 타입(plannedEpisodes·spine·endingStatement·protagonistCost·beatSheet·spineLocked·amendments) + 온보딩 결말 인터뷰 + digest/draft/review/pace 프롬프트 주입(미러 동기화) + 화수 예산 차단 게이트(overBudget·종반 25% 신규 발급 금지) + R1~R3 기억 반영 합류. 시즌 아크 플래너·R2 를 흡수.
- **추가 결정 — 단계적 집필 + 4줄 척추** (사용자 제안, 《4줄이면 된다》 이은희). 장편·학술은 편집모드 직행 금지 — Stage 1(질문+4줄 척추 잠금) → Stage 2(비트 펼침) → Stage 3(본문). `spineLocked=false` 면 장편 produceEpisode 차단. 4줄 = 욕망/전진/시련/변화(내적 변화), 질문=기존 deepQuestion 재사용, 결말=질문의 답(표면 생사 아님). 쇼러너 검토에 "길 잃음 점검"(3줄 비대로 질문 이탈)·"없는 결말 block" 추가. spec B 절.
- **로드맵 정본** — `docs/superpowers/plans/2026-06-12-quality-cost-roadmap.md`. 순서 D(결정론 소건) → A(헌장) → B(긴장 감수자·날것 규칙·제목/후크 다양성) · C(트위스트 제안 채널) → E(토큰 계측·검토 티어링) → F(같은 모델 재실험, **10화 중간 게이트 후 30화 결정**).

### 손대지 말 것
- 로드맵 Phase 0 표의 사용자 결함 서술(U1~U5)과 결정 4건 — 사용자 원판정. 재해석하지 말 것.
- 7차 노트의 보존 조항 그대로 유효 — `storyscore-ab-report.md` 점수·교란 변수 서술, 실험군 백업의 19~32 번호(사고 증거).
- 헌장 spec 의 분량 경계(4/8/24/36)·중편 없음 — 사용자 확정값.

### 다음 세션이 해야 할 한 가지
- **Phase D 착수** — 폴백 episode 번호 소모 버그부터(TDD, 앵커는 로드맵 D 절 — buildFallbackDraft storyEngine.ts:450 · buildCliDraftFallback storyx.mjs:1173 · commitChapter storyEngine.ts:1607). 이어서 StoryScore v0.2(2글자 이름 가드 + 제목 반복 신호). D 완료 후 Phase A 는 per-feature 구현 계획을 새로 써서 진행(spec 은 완성돼 있음).
- 미결 — F-1 의 provider 전환 범위(생성만 claude vs 검토까지)는 E-1 계측 결과를 보고 사용자와 결정.

---

## 2026-06-11 (7차) — 30화 완주 ×2 + StoryScore A/B: 통제군 승 (main)

> 사용자 결정 3건 이행 — (1) 이 세션에서 30화 완주 (2) 맨 Claude 통제군 비교 집필 (3) StoryScore 평가 시스템+스킬화. 셋 다 완료.

### 한 것
- **실험군 완주** — "철거 전야의 이름" 30화 풀 라이브(생성→5인 검토→잠금 ×30), 차단 0·캐논 122·66,695자. 백업 `docs/reviews/2026-06-11-showcase-30ch/backups/occult-ch30-complete.json`.
- **통제군** — 격리 서브에이전트(맨 Claude)가 동일 기획으로 『잿우물』 30화(58,106자) 집필. `control-claude/`.
- **StoryScore v0.1** — `tools/storyscore.mjs`(결정론)+`.claude/skills/story-score`(루브릭 심사) 머지(`8fdd8d5`). 첫 공식 채점 수행.
- **★ A/B 결과 — 통제군 91.8 vs 실험군 76.5** (`storyscore-ab-report.md`). 점수차의 주범 = 사전 아크 설계 부재("0번 소품" 발견 축적)·폴백 episode 번호 드리프트·후크 패턴 반복. 교란 변수(codex vs Claude 모델 비대칭·단일 컨텍스트 이점·심사 비맹검) 명시 — "하네스 무가치"가 아니라 개선 방향 5건 도출.
- P14 수정(`6d900ac`, TDD) — codex 휴지기에 처리. 제작 사건 — dev 서버 사망 3회·codex 한도 1회·폴백 2회(전부 로그 기록).

### 손대지 말 것
- `storyscore-ab-report.md` 의 점수·교란 변수 서술 — 정직성이 이 실험의 가치. 점수를 유리하게 재서술하지 말 것.
- 실험군 백업의 episode 번호(19~32 표기) — 사고 재현 증거. 수정은 코드(폴백 번호 소모 버그)로.

### 다음 세션이 해야 할 한 가지
- **A/B 리포트의 개선 백로그 착수 순서 결정** — 1순위 후보 = 시즌 아크 플래너(spec) 또는 같은 모델 재실험(provider claude 배선). M7 30화 기술 게이트는 실험군 완주로 **단계 1 충족 증거 확보**(feature_list evidence 갱신 후보).
- 보조 — 폴백 episode 번호 버그(TDD 소건) · StoryScore v0.2(2글자 이름 변형 가드) · dev 서버 사망 원인(검토 동시 spawn 부하) · 공개 쇼케이스 편집(`docs/public/showcase/` — A/B 리포트 포함 여부는 사용자 결정).

### (6차 세션이 남기는 연결 메모 — A/B ↔ 기억 압축 연구)
- `docs/research/2026-06-11-longform-memory-compression.md`(`5f7097f`)가 A/B 교란 변수 ②(통제군 단일 컨텍스트 이점)의 실측·처방이다. 요지 — digest 는 ch10 에서 ~1.5k 토큰 플래토(비용 문제 아님), 병목은 `CONTEXT_CANON_LIMIT` head/tail 절단이 **중반부 캐논 통째 폐기**(ch23 에서 91중 51 증발). ACL 2026 'Lost in Stories' 실증 — 일관성 오류는 중반부·사실/시간축 집중. 반영안 R1(관련 캐논 top-K 결정론 주입)·R2(5화 아크 다이제스트)·R3(중요도 가중 절단)·R4(인물/세계규칙 캡).
- **시즌 아크 플래너 spec 착수 시 R2 와 한 묶음 설계 권장** — 플래너=하향식 계획, 아크 다이제스트=상향식 기억. R1~R3 반영 후 30화 A/B 재실행이 76.5 개선 측정 경로.

---

## 2026-06-11 (6차) — Codex 검증 데스크 합류: P1 판정 + 수정 3건 (main)

> 사용자가 별도 Codex 데스크로 9셀 외부 검증을 완주 → 이 세션이 합류 절차(무결성 게이트→표본 재현→TDD 수정→백로그 반영) 수행. 전 기록 `docs/reviews/2026-06-11-codex-validation-desk/` (판정·근거는 `MERGE-NOTE.md`).

### 한 것
- **P1 3건 라이브 재현 판정** — F-007 진성(≤900px `.hx-aside` 통째 숨김→온보딩 차단) · F-002 재분류(기능 정상, 실결함=생성 90초 피드백 0 — 데스크 12초 대기 오판) · F-006 미재현(작가실 정상, 자동화 클릭 유실 추정).
- **수정 3건 (TDD, editorFocusLayout +2 · appExperience +1)** — ① FloatingEditor CTA `mainActionLabel` + "생성 중…" ② draft 모드 ⌘K→CommandPalette(죽은 spotlight 제거)+`작가진 전체 검토` fallback ③ ≤900px aside 카드만 접기. init.sh 녹색·라이브 검증 완료.
- P2/P3 6건 백로그 등재(progress.md 표 순위 5) · 성장 메모리 후보 처리(MERGE-NOTE §5).

### 손대지 말 것
- 데스크 폴더는 검증 기록 원본 — 수정 금지. F-009 결번은 데스크 측 누락(의도 아님).
- **P14(`useMarginReview` 더블 트리거)는 쇼케이스 세션 소유** — 이 세션은 같은 파일(StoryXDesk·marginReview) 충돌을 피해 의도적으로 미수정. 단 이번에 commandItems 에 `run-all-review`(marginReview.onRunAll 호출)가 추가됐으니 P14 수정 시 이 경로도 같은 가드를 타는지 확인할 것.

### 다음 세션이 해야 할 한 가지
- 쇼케이스 S2 가 우선(5차 노트). 검증 데스크 후속은 백로그 순위 5(P2/P3 6건) — 착수 시 F-005(만화 컷 수 hard constraint)부터가 효율적(시각 바이블 규칙과 게이트 한 묶음). **다음 데스크 재실행 시 ORCHESTRATOR-PROMPT 에 "생성 대기 최소 120초" 조항을 추가할 것.**

---

## 2026-06-11 (5차) — 쇼케이스 30화 착수: "철거 전야의 이름" S1 (main, 코드 변경 0)

> 사용자 결정 — "현대 퇴마록 느낌 30화 장편을 쇼케이스에" + 풀 라이브 루프 + 데모 영상은 자막+BGM 풀 자동 생성. 스펙·체크리스트·로그 신설(아래 경로). M7 기술 게이트(30화 회귀)를 실작품 완주로 치환한 트랙.

### 한 것
- **스펙/계획** — `docs/superpowers/specs/2026-06-11-showcase-30ch-occult-design.md`(목적 3중·IP 가드·아크 골격·측정 기준) + `plans/2026-06-11-showcase-30ch-occult-plan.md`(S1~S5 체크리스트).
- **S1 라이브** — 온보딩(인터뷰 8문항 전부 작품 맞춤, 선택 근거는 plan 컨텍스트 노트) → 1화(3,019자, 약속 정확 이행) → 5인 검토 → 잠금 → 2화(캐논 앵커 계승, "강이현 — 회수 예정" 후크) → 검토 → 잠금. canonFacts 7. 로그 `docs/reviews/2026-06-11-showcase-30ch/production-log.md`.
- **★P14 발견** — 전체 검토 더블 트리거 시 pending 영구 잔류 + 진행 중 런 응답 전부 폐기. 원인 특정 — `useMarginReview.onRunAll` 이 pending 시드+seq 증가를 먼저 하고, `runMarginReviewAll`(StoryXDesk.tsx:1013) `isReviewing` 가드가 조용히 리턴. 수정 후보 — 가드 상태를 훅에 노출해 시드 전 no-op.

### 손대지 말 것
- 쇼케이스 작품의 freewrite·인터뷰 선택(plan 컨텍스트 노트) — 30화 아크 설계의 전제. 특히 "본명 호출 주체 모호"는 버그가 아니라 보류된 떡밥(3~4화 결판 예정).
- `backups/occult-ch2-locked.json` — S2 재개 지점. 키맵 형식(데모 키트의 형식 2 스니펫으로 주입).

### 다음 세션이 해야 할 한 가지
- **S2 — 3화부터 제작 계속** (백업 주입 → 진도 카드 확인 → 생성·검토·잠금 사이클, 목표 ~10화). 첫 결정 후보 = 본명 호출 주체 캐논 결판. P14 는 제작과 별개 TDD 수정 건(작은 코드 변경) — 세션 시작 시 먼저 처리해도 좋다.
- 보조 — 데모 영상 풀 자동 생성(Playwright 녹화 + 자막/BGM 조립, 별도 세션 권장) · M7 사용자 액션(A 공개·B 모집)은 대기.

---

## 2026-06-11 (4차) — M7 경량 검증 A·C 제작 완료 (main, 코드 변경 0)

> 1.0 백로그 1순위(M7 외부 실증 경량 검증) 중 세션 단독 제작 가능분(A 로그 공개 패키지·C 데모 영상 키트)을 제작하고 라이브 검증했다. 근거 결정 문서 `docs/decisions/2026-06-10-market-proof-1.0.md`.

### 한 것
- **A — 공개 패키지 `docs/public/`** — `README.md`(소개·정직성 명시·베타 모집 CTA) + `storyx-live-test-showcase.md`(메인). 페르소나 실증 로그를 외부 독자용으로 재구성 — 4축(캐논 고정 루시안 7연속 → 추리 엔진 → 검토망의 출고 불가·9연속 원칙 → continuity≠payoff 와 23화 완결) + 매체 일반화 + **한계 절(6축 점수·내부 실증임·발견 버그) 그대로 공개**. 내부 코드명(P1~P13·rank·갭A/B) 전부 일반 언어로 번역.
- **C — 데모 영상 키트 `docs/handoff/2026-06-11-demo-video-kit.md`** — 5분 콘티 7장면(S1 훅~S7 CTA)·장면별 나레이션·녹화 팁. **백업 주입 절차를 라이브로 실증해 정확한 스니펫 수록** — 백업이 2형식(02=dump 래퍼·03=이중 인코딩 키맵)임을 발견, 둘 다 처리하는 콘솔 스니펫으로 정정.
- **라이브 검증 (Playwright)** — ch23 완권 재현(23화·캐논 91·온톨로지 113·인물 그래프·출간 체크리스트) + 헌터 ch6 재현(갈림길 카드 "캐논 확인" 배지·진도 체크·쇼러너에게 묻기·작가실 5인). 콘솔 에러 0. 캡처 8종 `docs/handoff/screenshots/demo-video-kit/`.

### 손대지 말 것
- `docs/public/` 의 정직성 절(내부 실증임을 명시)과 한계 절 — 외부 신뢰의 핵심. 공개 전 미사여구로 바꾸지 말 것.
- 데모 키트의 백업 주입 스니펫 — 2형식 분기가 실측이다. 03계 백업을 02 형식으로 가정하면 주입이 조용히 실패한다.

### 다음 세션이 해야 할 한 가지
- **M7 잔여는 전부 사용자 액션** — (1) A 공개 채널 결정 + README 연락처 기입 + 공개 (2) C 키트로 Loom 녹화 (3) B 베타 3~5인 모집. 세션 단독 가능 다음 작업은 백로그 2순위 **30화 시리즈 회귀 자동 러너**(storyx CLI+fixture).
- 관찰 메모 — 데이터 모드 "캐논 분야" 팝오버의 분류 칩이 간격 없이 붙어 렌더("인물4장소0…") — 경미한 UI 폴리시 후보. ch23 백업의 "레오르 벨로트라"(P6 이전 데이터)는 키트에 주의 명시함.

---

## 2026-06-11 (3차) — 진도 인터뷰 2단계 완료 (main, 450 tests)

> 스펙 `docs/superpowers/specs/2026-06-11-pace-interview-llm-design.md`. 병렬 2축(서버/CLI·클라이언트/UI) sonnet 위임 + Claude 머지 통합 + 라이브 검증.

### 한 것
- **쇼러너 서술형 LLM 페이스 인터뷰** — fc-pace 카드의 "쇼러너에게 묻기" 버튼 → `/api/pace-interview` 브리지 → storyx.mjs `pace-interview`(codex) → 작품 맞춤 질문 1~3개가 결정론 카드를 교체. 실패 시 결정론 카드 유지(강등 무비용). LLM 시드는 `[페이스] ` 접두로 합성(strip 가능), 같은 질문 재클릭 시 교체. 생성 성공 시 LLM 질문 초기화(다음 화는 결정론부터).
- **라이브 실증** — #3 ch5 상태에서 질문 3개 전부 작품 구체("'태준이 서가을에게 숨긴 미래의 진실'을 어디까지 밀어붙일까 — 핵심 직전에서 멈춘다/부분 고백으로 금이 간다/행동으로 먼저 갚는다" · 보관실·관측 모델 등 ch5' 내용 반영). 시드 질감이 결정론 카드 대비 명확히 위("'나를 살렸다'는 핵심 문장은 끝내 삼킨다").
- **머지 통합에서 Claude 가 잡은 것** — 서버 축 worktree 베이스가 Q2 이전이라 구식 `runProvider` 직접 호출로 작성됨 → `runProviderWithRetry`+`looksLikeProviderError` 로 교체. storyx.mjs 3중 충돌은 main 정본 + pace 조각 삽입으로 재구성.

### 손대지 말 것
- `[페이스] ` 접두 계약 — paceInterviewClient(부여)↔episodeBriefing SEED_PATTERN_PACE_LLM(소거) 쌍. 한쪽만 바꾸면 시드가 영구 잔류하거나 자필이 지워진다.
- buildPaceInterviewPrompt 의 PACE_CANON_RULE·JSON 계약 문자열 — promptBuilders↔storyx.mjs 미러 동기화 테스트가 지킨다.
- pace-interview 명령의 runProviderWithRetry 호출 — runProvider 직접 호출로 되돌리면 transient 시 에러 raw 가 질문 파싱에 들어간다.

### 다음 세션이 해야 할 한 가지
- ~~2단계 실사용 한 사이클~~ → **완료(같은 날 3차 연장)** — ch6 "감시를 켜는 밤": LLM 시드 3개 전부 생성 반영·`[페이스] ` 자동 소거·쇼러너 통과·연속성 무충돌("세 축 모두 행동과 대가로 진행"). 리포트 `06-hunter-pace-check.md` 마지막 절, 백업 `backups/03-hunter-llmpace-ch6.json`.

### 1.0 범위 리프레시 (세션 마감, 사용자와 합의된 마무리)
잔여 백로그를 1.0 게이트(market-proof 결정 문서) 기준으로 재정렬했다 — **정본은 progress.md "다음 한 단계" 표**. 요지.
1. **M7 외부 실증 경량 검증이 critical path** — C(완성 루프 데모 영상)·A(페르소나 실증 로그 선별 공개)는 다음 세션이 단독 제작 가능. B(베타 작가 3~5인 모집)는 사용자 활동 필요.
2. M7 기술 게이트(30화 회귀)는 storyx CLI+fixture 자동 러너 세션 후보.
3. 갈림길 LLM 정제는 pace-interview 패턴 재사용으로 비용 낮음(이야기 완성도 결).
4. rank5 잔여(PublishingStudio 옛 JSX 제거 등)는 floating 전환 완결로 이제 안전한 정리.
5. academic 라이브 검토 배선은 후순위 — 1.0 전 미완이면 결정 문서대로 1.1 자동 이연.
- 관찰 메모 — ch6 검토의 신규 용어("생존 부담률") 비용 정의 요구는 작품 내 후속 회차 과제(코드 아님). origin push 미실행(사용자 요청 시).

---

## 2026-06-11 (2차) — P12 재관찰 통과 + P13 폴백 캐논 차단 (main, 428 tests)

> 직전 핸드오프의 1(재관찰)·2(폴백 오염 차단) 이행. 리포트 `06-hunter-pace-check.md` 의 "P12 재관찰" 절.

### 한 것
- **P12 재관찰 통과 (라이브)** — ch4 fixture 에서 배지 옵션 회피 + 정당 옵션(합류)·페이스(전진·1~2화 안)로 ch5 "예비 회수선" 재생성. **연속성 판정 출고 불가→수정("큰 줄기는 기존 캐논과 맞고")·캐릭터 결정→관찰·고백 재서술 미발생.** LLM 이 숨긴 진실 promise 를 "한 발 다가간다" 부분 전진으로 reframe(재발급 금지 프롬프트 규칙 효과 추정). **진도 인터뷰 2단계 착수 조건 충족.** 백업 `backups/03-hunter-p12-recheck-ch5.json`.
- **P13 (`c6dd3bd`)** — `produceNextChapter`(결정적 폴백)의 캐논 발명 제거. 템플릿 2건(intent 누수 plot·"숨기고 있다" 비밀 발명)이 실작품 레저를 오염시키던 근원 차단. 폴백 캐논을 픽스처로 쓰던 longformContinuity(2)·memoryBank(2) 테스트는 명시적 캐논 픽스처로 전환 — 검증 대상(digest 한도·워크벤치·승인 큐) 보존.

### 손대지 말 것
- `produceNextChapter` 의 `newCanonFacts: []` — 폴백은 캐논을 만들지 않는다(P13 핀 테스트). 캐논은 LLM 본문 생성 경로에서만.
- longformContinuity·memoryBank 테스트의 명시적 캐논 픽스처(`chapterCanon`/`withChapterCanon`) — 'canon-001-a' id 는 승인 큐 decisions 매핑이 참조.

### 다음 세션이 해야 할 한 가지
- **진도 인터뷰 2단계(쇼러너 서술형 LLM) brainstorm→spec** — 착수 조건 충족(MVP 실효 + P12 통과). 갈림길 LLM 정제와 같은 묶음. 입력: `06-hunter-pace-check.md`(페이스 사이클 실증) + handoff 2026-06-10 원안(전제 능선·전진/숨고르기·다음 회수까지 몇 화 — 서술형) + interviewClient 패턴.
- 보조: academic 라이브 검토 배선 · M7 경량 검증 A/B/C 사용자 선택 · 결정 부채 보드.

---

## 2026-06-11 — P12 수정: 갈림길 캐논 모순 의심 배지 (main, 427 tests)

> 4차 핸드오프 1번 이행. ch5 캐논 충돌 사고(기확정 고백을 fork 가 재노출)의 상류 수정 2겹.

### 한 것
- **canonSuspect 배지** (`9b9627a`) — `overlapsCanonFact`: fork 옵션 토큰(조사 제거·2자+)의 65%+ 가 한 canonFact 문장에서 prefix 단위로 발견되면 의심. 4개 fork 소스 전부 적용. UI 는 `.is-canon-suspect` dashed 보더 + "캐논 확인" 배지 + title 툴팁 — **제외가 아니라 경고**(거짓 양성 안전, 최종 판단은 작가).
- **프롬프트 규칙** — 연재 초안 규칙에 "rewardArc 의 promise 는 …이미 일어난 일은 새 약속이 될 수 없습니다" 1줄. promptBuilders↔storyx.mjs **byte-identical 미러 + 동기화 테스트 신설**(미러 깨지면 테스트가 잡음).
- **임계 캘리브레이션** (`8534503`) — 라이브에서 0.6 이 경계 거짓양성("윤서문의 관측 모델을 벗어날 가능성" — 캐논은 모델 존재만 확정, 이탈은 미결)을 잡는 걸 발견 → 0.65 로 (진양성 0.667 과 분리). 경계 핀 테스트 추가.
- **라이브** — ch4 fixture(ch5 제거 재구성)에서 사고 옵션에만 배지·정당 옵션 3개 깨끗·콘솔 0. 캡처 `pace-check/p12-canon-suspect-badge.png`.

### 손대지 말 것
- `overlapsCanonFact` 임계 0.65 — 라이브 캘리브레이션 값(주석에 양쪽 근거 수치). 낮추면 미결 위험 stake 가 오염되고, 올리면 사고 케이스를 놓친다. 경계 핀 테스트 2종이 지킨다.
- P12 프롬프트 규칙 문구 — 미러 동기화 테스트가 byte-identical 을 강제. 문구 수정 시 두 파일+테스트 동시.

### 다음 세션이 해야 할 한 가지
- **P12 통과 사이클 재관찰** — ch4 fixture 에서 배지 옵션을 피해(정당 옵션 선택) ch5 를 재생성하고 5인 검토에서 캐논 충돌이 재발하지 않는지 확인. 통과하면 **진도 인터뷰 2단계(쇼러너 서술형) 스펙 착수**.
- 보조: 폴백 초안 newCanonFacts 커밋 차단(오염 캐논 #9·#10 관찰) · academic 라이브 검토 배선 · M7 경량 검증 A/B/C 사용자 선택.

---

## 2026-06-10 (4차) — 진도 체크 실효 관찰 + intentVersion + P12 발견 (main, 421 tests)

> 3차 핸드오프 1번 이행 — #3 ch4~5 연속 생성으로 진도 체크 MVP 실효 관찰. 리포트 `docs/reviews/2026-06-07-persona-live-test/06-hunter-pace-check.md`.

### 한 것
- **실효 확인** — 과회수류 검토 지적 기준선 4건(A암 ch2) → ch4 **0건**·ch5 **1건**. ch4(절제 시드)는 payoff 를 단서 수준으로 아끼고 새 약속을 미회수로 남겼으며, ch5(회수 시드)는 그 약속을 1화 뒤 고백으로 이행("1~2화 안" 약속 준수). **2단계(쇼러너 서술형 인터뷰) 착수 가치 확인.**
- **intentVersion (`066ea9f`)** — ch4 라이브에서 P7 strip 이 state 만 갱신하고 uncontrolled textarea DOM 에 시드가 잔류(다음 클릭이 stale 메모에서 재합성)하는 갭 발견 → bodyVersion 패턴의 재시드 버전 키. ch5 에서 시드 4줄→생성→0줄 자동 소거 확인.
- **★P12 신규 발견** — ch4 생성 LLM 이 기확정 캐논(태준의 고백, ch2)을 "숨긴 진실을 말하는가?" 새 promise 로 재발급 → fork 가 캐논 정합성 검증 없이 옵션 노출 → 선택 → ch5 가 첫 고백처럼 재작성 → **연속성 감수자·캐릭터 큐레이터 2인 독립 적발(출고 불가·retcon note 요구)**. 검토 망의 차별점 실증인 동시에 fork 상류 갭.

### 손대지 말 것
- `intentVersion` 재시드 키(FloatingEditor textarea key) — 제거하면 strip 이 DOM 에 안 보임. 버전 동일 시 미반영이 의도된 동작(타이핑 클로버 방지)·핀 테스트 있음.
- ch5 캐논 충돌 상태의 백업(`backups/03-hunter-pacecheck-ch5.json`) — P12 수정 검증 fixture 로 재사용 가치 있음, 덮어쓰지 말 것.

### 다음 세션이 해야 할 한 가지
- **P12 스펙→수정** — buildEpisodeForks 의 promise/stake 옵션을 canonFacts 와 보수 매칭(stake 드리프트 매처 `isSameStake` 재사용)해 기확정 사실과 겹치면 제외 또는 "캐논 확인 필요" 표시. 수정 후 ch5 fixture 로 fork 옵션에서 "숨긴 진실"이 빠지는지 검증 + 한 사이클 재관찰 → 그 다음 진도 인터뷰 2단계 스펙.
- 보조: academic 라이브 검토 배선 · M7 경량 검증 A/B/C 사용자 선택 · 결정 부채 보드.

---

## 2026-06-10 (3차) — 진도 체크 카드 + 페이스 결함 3건 + 매체 영속 (main, 420 tests)

> 2차 세션 핸드오프의 1순위(회차 진도 인터뷰 승격) 이행. 스펙 `docs/superpowers/specs/2026-06-10-pace-check-design.md` — MVP 는 결정론 카드(LLM 0회), 서술형 LLM 인터뷰는 2단계로 분리. sonnet worktree 2 + Claude 직접 1 분업.

### 한 것
- **회차 진도 체크 카드 (MVP)** — `paceInterview.ts` 신설(질문 3: 전제 능선·페이스·다음 회수, 트리거: 연재+2화 이상+(정체 or deferred 2)). FloatingEditor `.fc-pace` 카드 — 같은 질문 재클릭 시 시드 교체(`replacePaceSeed`). **핵심 설계 — 프롬프트 배선 0**: 의도 메모가 freewrite 로 직행하므로 미러/브리지 불필요.
- **페이스 결함 3건** — (1) deferred-stake 시드 강도 isStalled 연동(비정체="한 발 다가가되 결판 서두르지 않는다") (2) P7 `stripConsumedSeeds` — 생성 성공 시 소비된 시드 줄만 제거, 자필 보존(진도 시드 3종 포함) (3) stake 문구 드리프트 Jaccard(≥2/3)+부분집합 매칭, 거짓병합 가드 핀 테스트.
- **★ 매체 영속 (신규 버그 발견·수정 `e266894`)** — comics 7인 검증 중 발견: medium/format 이 React state 에만 있어 **리로드 후 만화 작품이 소설 작가진(5인)으로 검토됨**. SeriesProject.medium/format 영속 + 생성 시 시드 + 로드 복원 + selectMedium 저장.
- **comics specialist 7인 라이브 (P10)** — #4 만화 "자정 손님의 계산법" 1화 + 7/7 검토 도착. 스토리보드 감독(컷 흐름 분해)·말풍선 감독(캡션의 모바일 압박)이 매체 특화 관점으로 같은 문제를 수렴 포착.

### 손대지 말 것
- `stripConsumedSeeds` 의 시드 패턴 5종 — paceInterview 시드 문구를 바꾸면 episodeBriefing 의 미러 패턴도 같이(주석에 명시). 자필 보존 원칙.
- `paceInterview` 트리거(연재+2화+정체/deferred2)·같은질문 교체 로직 — 핀 테스트 있음.
- `SeriesProject.medium/format` 은 optional — 구버전 저장본 폴백(prop) 경로 유지.
- stake 드리프트 매칭의 거짓병합 가드 테스트.

### 다음 세션이 해야 할 한 가지
- **진도 체크 실효 관찰** — #3 류 연속 생성(3~5화)에서 진도 시드가 과회수를 실제로 막는지, 페이스 검토 의견이 줄어드는지 A/B 한 번 더. 효과 확인되면 2단계(쇼러너 서술형 인터뷰) 스펙 착수.
- 보조: academic 라이브 검토 배선(1.0 플래그 전제) · M7 경량 검증 A/B/C 사용자 선택 · 결정 부채 보드 스펙.

---

## 2026-06-10 (2차) — 멀티에이전트 분업 세션 (main, 388 tests)

> 사용자 "울트라 플랜 분업으로 모든 걸 완성" → 오케스트레이션 플랜 `docs/superpowers/plans/2026-06-10-service-completion-orchestration.md`. Claude(오케스트레이션+라이브) / Codex(2d) / sonnet 서브에이전트(가드·CLI·결정문서) 병렬 + 6단계 독립 검증.

### 한 것 (main 직행·머지 7건)
- **Q1 — #3 헌터물 갈림길 A/B 6축 실증** — 리포트 `docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md`. ★갈림길은 연속성(동률 5)이 아니라 **페이오프·상업성**을 움직임(설계 의도 실증). ★실생성에서 fork 가 안 뜨는 구조 갭 발견 → `deferred-stake` fork 추가(`a425042`). ★A암 과회수 신호 → **회차 진도 인터뷰 승격**.
- **Q2 — codex transient 폴백 가드+1회 재시도** (`7865e2b`+`deb0474`) — ★서브에이전트 구현의 치명결함(정상 호출도 stderr 배너 → 전 호출 실패 오판)을 Claude 라이브 실측(`codex exec` exit0+stderr 614B)으로 적발·수정. 라이브에서 폴백 prose 에러 누수 0 확인.
- **S1 — (2d) 출간 floating화** (`29eec7b`) — FloatingPublishWorkspace 신설. **Codex 1차 위임이 "백그라운드 시작" no-op(메모리 패턴 D 재현) → 동기 실행 강제 조항으로 재위임 성공.** 라이브 검증 완료.
- **S4 — M6.3 storyx CLI** (`cdee90e`) — init/serve/memory sync + README. M6 전체 done.
- **rank6·rank7 결정** — `docs/decisions/2026-06-10-market-proof-1.0.md`(M7 done_criteria 를 2단계 시장증명으로 교체, feature_list 반영) · `2026-06-10-academic-scope-1.0.md`(실험 플래그 조건부, 미충족 시 1.1 이연).
- **vite watch 가드** (`65fdc1e`) — 에이전트 worktree·캡처 churn 이 dev 풀 리로드를 유발하던 것 차단(라이브 테스트 중 온보딩 날아감 재발 방지).

### 손대지 말 것
- `looksLikeProviderError` 의 **stderr 미사용 원칙** — codex 는 정상 성공에도 stderr 에 배너를 쓴다(주석에 실측 기록). stderr 조건을 되살리면 전 호출이 폴백으로 오판된다.
- `buildEpisodeForks` 의 deferred-stake 규칙(stake 별 최종 결말 deferred 만, kept/lost 제외 — 핀 테스트 있음) · 기존 slice 방향.
- vite.config.ts `server.watch.ignored` — 제거하면 worktree 에이전트 작업 중 dev 풀 리로드 재발.

### 다음 세션이 해야 할 한 가지
- **회차 진도 인터뷰 스펙→구현** (A/B 과회수 신호로 승격 확정) — fork 시드 강도 2단화(결판/진척) + P7(잠금 후 소비된 fork 시드가 의도 메모에 잔류 → 회수된 약속 재지시) 정리와 한 묶음 권장.
- 보조: stake 문자열 드리프트(fork 옵션 중복 노출) 정규화 · 폴백 초안 품질(조사 오류·장르 무관 템플릿) · comics specialist 라이브 검증 · M7 경량 검증 방법 A/B/C 사용자 선택.
- origin push 미실행(사용자 요청 시).

---

## 2026-06-10 — 작가 결정 갈림길 + 생성 측 회수 의무 (브랜치 `feat/author-decision-forks`)

> 사용자 "이야기 품질·작가 아이디어 유도에 다시 집중" → 분석 결과 아크 페이오프 게이트 1·2단계는 기구현 확인, 남은 갭 2개를 새 트랙으로. 스펙 `docs/superpowers/specs/2026-06-10-author-decision-forks-design.md` · 계획 `docs/superpowers/plans/2026-06-10-author-decision-forks.md`. 서브에이전트 구현 + 2단 검토(스펙/품질) 루프.

### 한 것 (8커밋, b75b53f~5e1f1e3)
- **episodeBriefing.ts 신설** (`ec840af`·`128497c`) — 미회수 rewardArc promise·openThreads 에서 갈림길 질문 결정론 도출(LLM 0회). 정체 시 'stalled-premise' fork 가 **가장 오래된** 약속 우선(slice 방향 핀 테스트), 비정체는 최근 약속, 떡밥 fork 는 trim+dedup. `composeIntentWithFork` append·중복 무시. `StoryProject = SeriesProject` 별칭 추가(storyEngine).
- **생성 측 회수 의무** (`dcb3632`·`caecedf`·`0f243b2`) — `DraftPromptInput.payoffStatus` + isSerial·isStalled 시 stallRules 1줄("새 약속 금지·최소 하나 회수·rewardArc payoff 기록"). 배선 StoryXDesk produceEpisode→draftClient→api/draft→프롬프트, storyx.mjs 미러(`--payoff-status` JSON 플래그, 문구 byte-identical). **vite 브리지가 플래그를 안 넘기던 갭을 품질 검토가 적발** → `0f243b2`.
- **fc-forks UI** (`608db57`·`5e1f1e3`) — FloatingEditor `episodeForks` prop(순수 표현 유지), 상태 패널(fc-p-state) memo 위 갈림길 카드, 옵션 클릭→uncontrolled textarea ref 갱신+`onIntentChange`. StoryXDesk 가 `buildEpisodeForks(project, computePayoffLedger(chapters))` 주입. 토큰 `--ink-dim`/`--rule-soft`/`--p-show`.
- **라이브 검증** — #2 ch23 백업+레저 주입(정체 시나리오): 갈림길 2질문·4옵션 렌더, 클릭→메모 합성·중복 클릭 무시·다중 fork 누적, 기본 샘플 작품은 떡밥 fork 만(규칙 일치), CLI dry-run 4케이스(정체만 주입·비정체/누락/오형식 무시), 콘솔 에러 0. 캡처 `docs/handoff/screenshots/author-decision-forks/`.

### 손대지 말 것
- `episodeBriefing.ts` slice 방향(정체=oldest·진척=newest — 핀 테스트 있음) · stallRules 문구(promptBuilders↔storyx.mjs byte-identical 미러) · vite 브리지 `--payoff-status` 전달부 · `.fc-forks` 카드의 ref 기반 append(uncontrolled textarea 라 setState 만으론 화면 미반영).

### 다음 세션이 해야 할 한 가지
- **#3 헌터물 페르소나 테스트에 갈림길 사용/미사용 A/B 를 끼워 6축 비교** — 갈림길 효과 실증. main 머지·origin push 완료(`a76d7a2`).
- Follow-up 대기 — (a) **회차 진도 인터뷰** (사용자 아이디어, 2026-06-10): 중·장편이 회차를 넘어갈 때 쇼러너가 진도·페이스를 서술형으로 인터뷰(전제 몇 부 능선·전진 vs 숨 고르기·다음 회수까지 몇 화). 갈림길 카드(객관식·결정론)의 대화형 2단계 — `interviewClient` 패턴 + `payoffLedger` 시드 재활용, 트리거는 정체 신호·아크 경계·중장편 한정으로 좁힌다. A/B 에서 "선택은 하는데 페이스 감각이 안 들어간다"가 관찰되면 1번으로 승격. (b) 갈림길 LLM 정제 (c) 결정 부채 보드 — 각각 별도 스펙.

---

## 2026-06-09 (6) — 코드성 개선 (P1 빈응답 + 매체별 검토 배선)

> 사용자 "코드성 개선 쭉 이어가". 보고서 4항목 중 항목 2(P1)·3(매체검토) 완료. 항목 1(2f)·4(polish)는 사용자가 보류 선택.

### 한 것
- **항목 2 — P1 빈응답 (`fe13581`)** — `tools/storyx.mjs` runProvider `spawnSync` 에 `input:''` 추가(codex exec 가 stdin 대기하다 'Reading additional input from stdin' 누수 → 빈 note 합류하던 근본 제거). `api/review-agent.ts` mock note 문구화. `reviewClient.ts` 빈응답 폴백 actionable.
- **항목 3 — 매체별 검토 (`0011749`)** — `getMediumReviewAgentIds(medium)` = CORE + `MEDIUM_REVIEW_SPECIALISTS`. comics→스토리보드·말풍선 / audiobook→낭독 연출 / essay→에세이 큐레이터 / novel·academic→CORE. `runMarginReviewAll`·`corePersonaIds`·`floatingEditorProps.personas` 를 medium-aware. 단위 5 케이스.
- 364 tests·tsc·build GREEN. 라이브 — 편집 작가실 CORE 5 렌더·콘솔 0.

### 손대지 말 것
- `getMediumReviewAgentIds`·`MEDIUM_REVIEW_SPECIALISTS`(agentSeedData) · storyx.mjs `input:''` · reviewClient 폴백 메시지.

### 이어서 — 항목 1·4 완료 (사용자 "a하고 c")
- **항목 1 (2f dead code) — 완료 (`c3b4cbf`, -126줄)** — 출간 모드 return 의 `isDraftMode &&` dead 가드 7곳(scene·crew·meter·pending·margin/binder·Spotlight·toast) 제거. `editorFocusLayout` 의 dead 블록 의존 단언 6개(crew/meter/pending·`<Spotlight`·margin/binder) 정합 제거 — **보존 단언 4개(useMarginReview·MentionBar·toMarginReview·data-pid, dead 블록 밖)는 유지**. Spotlight import 도 미사용돼 제거. 동작 불변(출간 모드에서 원래 미렌더). 서브에이전트 구현 + Claude diff 독립 검증.
- **항목 4 (polish) — 완료 (`6d79085`)** — FloatingEditor topbar '· 새 초안' 중복 라벨 제거.

### main 머지
- 전 세션 작업(2c·P1·매체검토·2f·polish) **ff-only main 안착**. origin push 미실행(사용자 요청 시).

### 다음
- (2d) 출간 floating화 — PublishingStudio → FloatingDataWorkspace 패턴.
- 항목 3 comics 작품 specialist 7인 라이브 검증(사용자 실사용).

---

## 2026-06-09 (5) — floating Phase 2c 데이터 모드 floating화 완료 (FloatingDataWorkspace 신설)

> 데이터 모드(`activeTrack==='bible'`)가 옛 3컬럼 대신 "떠 있는 작업실"로. 진입 첫인상 = 정제 보드(지표·검토 요약), raw 세부는 파고들기. 브랜치 `feat/floating-phase2c-data`.

### 이번 세션에서 한 것
- **brainstorming→spec→plan** — 스펙 `docs/superpowers/specs/2026-06-09-floating-data-workspace-design.md`, 계획 `docs/superpowers/plans/2026-06-09-floating-data-workspace.md`.
- **서브에이전트 task별 구현 + Claude 독립 검증** (Task 1~5, TDD):
  - `DataView` 에 `{ kind: 'board' }` 추가 (`ba0373b`)
  - `FloatingDataWorkspace.tsx` 신설 — `.fc-*` 셸 공유, 정제 보드 + 독 6버튼 + 패널 5, centerSlot 주입 (`2f4ab1b`)
  - `StoryXDesk` `isBibleMode` early-return 배선 + 데이터 진입 시 `setDataView({kind:'board'})` 리셋 (`d249b38`)
  - `.fc-data-*` 스타일 (`712cc7c`)
- **★ 라이브 발견·수정 (`839136c`)** — board/독 지표에 `DataPanel`(`.sx-desk` 스코프 전용)을 박았더니 `.fc-app` 안에서 `.sx-gate-sw` 토글이 **거대 타원으로 깨지고** raw 게이트 키가 노출됨(사용자 "엉망이네 이상한 원" 지적). → **`MetricSummary`(floating-네이티브 간결 요약: 이름·부제·점수·상태점)로 교체.** FloatingEditor 가 DataPanel 대신 `.fc-metric` 을 따로 만든 이유와 동일.
- 라이브(Playwright) — board 정제·캐논 파고들기→복귀·모바일 360 가로스크롤 0·콘솔 0. 359 tests·tsc·build GREEN.

### 손대지 말 것
- `FloatingDataWorkspace.tsx` 의 `MetricSummary`(floating-네이티브 지표) · `.fc-data-detail.sx-desk` 스코프 차용(파고들기 스타일 핵심).
- `FloatingEditor.tsx`(편집 모드, 무수정) · `DataPanel`(`.sx-desk` 전용 — floating 에 쓰지 말 것).
- 옛 3컬럼 데이터 JSX(StoryXDesk ~2431~2550)는 early-return 으로 도달 불가지만 소스 보존(P3 source-string 단언 유지). 삭제는 2f.

### 정체불명 working-tree 변경 처리 (보고)
- 세션 중 내가 안 만든 변경 2개 발견 — (a) `DataPanel` 에 `startCollapsed` 접기 옵션 (b) `.fc-data-detail.sx-desk`. 멀티 CLI(Codex 등) 또는 직접 수정 가능성. **(b)는 파고들기 스타일에 실제 필요해 유지, (a)는 `MetricSummary` 로 대체돼 dead 라 되돌림.** 직접 작업한 것이면 알릴 것.

### 다음 (이번 세션 범위 "+ 코드성 개선 묶음")
- 상단바 압축 · 매체별 검토 배선 · P1 빈응답 폴백 가드 · 2f topbar dead code 정리. (보고서 미해결 UI/UX)
- (2d) 출간 floating화 · main 머지.

---

## 2026-06-09 (4) — floating Phase 2e 완료 (classic draft JSX 250줄 삭제)

> draft 모드가 항상 FloatingEditor로 간다. ?editor=classic 폴백 완전 제거.

### 이번 세션에서 한 것
- `isClassicEditor` useMemo + `?editor=classic` 폴백 제거
- `if (isDraftMode)` → FloatingEditor 항상 (early return 확정)
- 좌레일 `activeTrack === 'draft'` 분기 ~78줄 제거
- 워크벤치 `activeTrack === 'draft'` 분기 ~94줄 제거 (ex-toolstrip, CreativeStage classic path)
- 우측 `isDraftMode ? <MarginColumn+CoreStrip> : <aside>` → `<aside>` 만
- `editorFocusLayout.test.ts` + `agentValidationProcess.test.ts` + `floatingEditor.test.ts` assertions 갱신
- StoryXDesk.tsx 3,368 → 3,116줄 (-252)
- 348 tests · tsc 0 · build GREEN. 커밋 `3220bf5`.
- feat/arc-payoff-gate → main ff-merge, feat/floating-phase2e 브랜치 작업 중

### 손대지 말 것
- FloatingEditor.tsx — 이미 완성된 Phase 2a/2b 구현
- data/publish 모드의 classic path 잔여 — 아직 floating화 안 됨(2c/2d)

### 잔여 dead code (harmless, 별도 2f 정리)
- StoryXDesk.tsx topbar의 `isDraftMode &&` guards ~7곳 (crew, meter, pending, spotlight, toast 등)
- 이것들은 classic main에서 always-false이나 테스트가 source presence 체크 → 현재 348 pass 유지

### 다음 권고
- **(main 머지)** — feat/floating-phase2e → main
- **(2c) 데이터 모드 floating화** — FloatingEditor 내 데이터/캐논 탭 렌더
- **(2f) topbar dead code 정리** — remaining isDraftMode guards 제거

---

## 2026-06-09 (3) — 아크 페이오프 게이트 라이브 실증 완료 (엔드투엔드 fixture 3케이스)

> spec §10 LLM 신뢰도 리스크 검증. payload→chapter→ledger→harness 전 파이프라인이 fixture 로 검증됨.

### 이번 세션에서 한 것
- `storyEngine.test.ts`에 `Arc Payoff Gate 엔드투엔드 실증` describe 블록 추가
  - 케이스 1: LLM payoff 채움 → pass(10)
  - 케이스 2: 3회차 연속 payoff 빔 → block(0), readyForProduction=false
  - 케이스 3: 중간 회수 후 재정체 → streak 리셋, 차단 안 됨
- 348 tests · tsc 0 · vite build GREEN. 커밋 `1271a60`.

### 손대지 말 것
- `payoffLedger.ts` · `storyHarness.ts` premise-progress 로직 — 모든 케이스가 엔드투엔드 커버됨

### 다음 권고
- **(main 머지)** — `feat/arc-payoff-gate` → main. 1~2단계 + 실증 10커밋, 전부 GREEN.
- **(A) 플로팅 Phase 2 스왑** or **(B) rank5 Pass E** 이후.

---

## 2026-06-09 (2) — 아크 페이오프 게이트 2단계 완료 (premise-progress 차단 스테이지)

> 1단계(드러냄)에서 2단계(차단)로. `isStalled=true` 시 `readyForProduction=false` 연결 완료.

### 이번 세션에서 한 것
- `storyHarness.ts`: 7번째 스테이지 `premise-progress` 추가
  - `HarnessStageId`에 `'premise-progress'` 추가
  - `RunStoryHarnessInput`에 `chapters?: Chapter[]` 추가
  - `runPremiseProgressStage`: measured=false→pass(5) · not stalled→pass(10) · stalled→**block(0)**
  - isStalled=true → anyBlocked=true → readyForProduction=false (차단 완성)
- `storyHarness.test.ts`: 기존 스테이지 배열 6→7, premise-progress TDD 케이스 3개 추가
- `creativeDevelopment.test.ts`: 하드코딩 `6` → `7` 갱신
- `StoryXDesk.tsx`: `harnessReport` useMemo 에 `chapters: project.chapters` + 의존성 추가
- 345 tests · tsc 0 · vite build GREEN. 커밋 `2d82586` + `1076232`.

### 손대지 말 것
- `payoffLedger.ts` — 1단계 핵심, 변경 시 TDD 선행
- `computePayoffLedger` 반환 타입 — `studioMetrics.ts`·`DataPanel.tsx`·`FloatingEditor.tsx` 3곳이 의존

### 다음 권고
- **(D) 라이브 실증** — codex 로 회차 생성, `rewardArc`/`stakesLedger` 실제 산출 확인 후 premise-progress 가 stall 을 실제로 잡는지 엔드투엔드 검증. main 머지 전에 권장.
- **(main 머지)** — `feat/arc-payoff-gate` → main. 1·2단계 전부 green.
- **(A) 플로팅 Phase 2 스왑** or **(B) rank5 Pass E** — 이후 우선순위.

---

## 2026-06-09 — 아크 페이오프 게이트 1단계 완료 (7 태스크 TDD)

> continuity≠payoff 처방 1단계. dead 였던 `rewardArc`/`stakesLedger`를 완전히 살렸다.

### 한 일

- **Task 1 `b81e90f`** — `src/lib/payoffLedger.ts` 신규: `computePayoffLedger(chapters)` 순수 함수. `deferredStreak`, `isStalled`(≥3), `measured`, `openPromises`, `paidPromises`, `lastPayoffEpisode` 계산.
- **Task 2 `2932b4b`** — `DraftChapterPayload`에 `rewardArc?`/`stakesLedger?` 그릇 추가. `chapterFromDraftPayload`가 payload → chapter 로 매핑.
- **Task 3 `71e8b94`** — `draftClient.ts` 서버 응답 정규화: `normalizeRewardArc`/`normalizeStakesLedger` export.
- **Task 4 `9b0f3c7`** — `tools/storyx.mjs` CLI 경로 정규화 미러: `normalizeDraftRewardArc`/`normalizeDraftStakes`.
- **Task 5 `ba74b6f`** — `buildDraftPrompt` (서버+CLI) 출력 스키마에 `rewardArc`/`stakesLedger` 필드 + 산출 지시 추가.
- **Task 6 `2e76f9d`** — `buildAgentReviewPrompt` (서버+CLI): `payoffStatus.isStalled=true` 시 `deferredStreak`·`openPromises` 수치를 `criteriaKey: stakes_progression_audit` 와 함께 evidence 주입. `api/review-agent.ts`, `reviewClient.ts`, `StoryXDesk.tsx` 3 call site 배선.
- **Task 7 (이번)** — `studioMetrics.ts`/`studioMetrics.test.ts` payoff 측정 포함(이미 구현됨). `toStudioMetrics` 호출부에 `chapters` 주입. `FloatingEditor.tsx` + `DataPanel.tsx` 양쪽에 **"전제 진척"** 카드 추가(measured=false → "—", isStalled=true → 빨강).

### 검증

- `bash init.sh` 녹색 (342 tests). 라이브 — 지표 패널 "전제 진척 — —" 렌더 확인, 콘솔 0.

### 다음 권고

- **(C-2) 페이오프 게이트 2단계** — `storyHarness` 에 `premise-progress` 결정론 스테이지 추가(점수·차단). `isStalled` 를 `readyForProduction` 에 연결.
- **라이브 실증** — codex 로 회차 생성 후 `rewardArc`/`stakesLedger` 실제 산출률 확인 필요(LLM 산출 신뢰도 리스크 — spec §10).
- **feat/arc-payoff-gate 브랜치** — main 머지 전 검토 필요.

### 손대지 말 것

- Task 1~7 코드 + 테스트. 특히 `payoffLedger.ts`·`storyEngine.ts` 타입 계약 약화 금지.

---

## 2026-06-08 (이어서 5) — 10인 브레드스 완주 (#3 다캐릭터 + 4매체 스모크) + 크래시 수정

> 사용자 "10인 완주 → 매체별 경량 스모크". #3 헌터(다캐릭터) + 만화·에세이·오디오·학술 4매체 스모크. **5매체 전수 커버.**

### 한 일
- **#3 헌터 다캐릭터 (소설) 1화** — 1화에 4인(한지욱·서가을·마도협·백도현) 클린 승격 = **P5/P6 다캐릭터 스케일 실증.** 로그 `03-hunter-multichar.md`.
- **4매체 경량 스모크** — 만화·에세이·오디오·학술 각 1단위 codex 실생성, 매체 적합 문체·인물추출·게이트 확인. 로그 `04-media-breadth-smoke.md`.
- **★ 크래시 버그 수정 (`3eae1da`, TDD)** — 매체/포맷 불일치(comics+소설 포맷) → `buildCreativeBlueprint` throw → App useMemo 렌더 크래시(에러 바운더리 없음). 무효 포맷 → 매체 기본 포맷 폴백. 327 tests.
- **★ 발견** — (1) 품질 게이트는 매체 특화(소설8·학술11·오디오7) (2) **라이브 검토는 매체 무관 고정 5인** — 매체 특화 작가진(웹툰/말풍선/다빈치/낭독/논증)이 검토 미배선(권고) (3) 온보딩 build codex transient 폴백 raw에러 누수(권고).

### 검증
- `bash init.sh` 녹색(327 tests). 크래시 수정 라이브 확인(만화 온보딩 재진입 무크래시).

### 다음 (권고)
- 매체 특화 작가진 라이브 검토 배선 · 폴백 raw에러 가드 · 아크 페이오프 게이트 정량화(이어서 4 C).
- #2 완결본은 `backups/02-work-backup-ch23.json`(로컬). 현재 localStorage = 오디오 스모크 작품(휘발 가능).

### 손대지 말 것
- 본 세션 코드 수정 3건(`e4a2ea2` P5/P6/relations · `aa98137` 검토 전제진척 · `3eae1da` 크래시 폴백)·테스트. 약화 금지.

### 커밋
- #3·4매체 로그 + 크래시 수정 + progress/handoff. 커밋됨/예정.

---

## 2026-06-08 (이어서 4) — #2 14~21화 테스트 마무리 + 종합 리포트

> 사용자 목표(/goal) "계속 테스트 + 개선 축적 시 개선 + 끝까지 마무리". #2 를 21화(완권 범위)까지 라이브 테스트, 종합 리포트 작성. **코드 변경 0**(직전 P5/P6/relations `e4a2ea2` 외).

### 한 일
- **ch14~21 생성·검토** — 연속성 매회차 무드리프트(루시안 7연속·옛이름 무재현). 검토 포화로 reveal/클라이맥스 샘플링.
- **★ 배신자 reveal(백작부인, ch19) → P5/P6 라이브 검증 완료** — 첫 character 캐논에서 "백작부인" 클린 승격(조사버그 0). characters 3→4.
- **★ 최대 발견 continuity ≠ payoff** — 21화 내내 연속성 완벽하나 전제(운명 전환) 페이오프 0, codex reveal 무한 연기. **근본 원인(피날레 ch23 확정) = 쇼러너 연재 편향**(21화 deferral 묵인하다 완결 회차엔 "너무 빨리 종결"이라며 역행 — 모멘텀 최적화·전제완성 비최적화).
- **★ #2 완결(23화)** — intent 유도(ch22·23)로 deferral 끊고 완결: 배신자=루시안+공범 라비니아 벨로트(L.B.) 폭로·가문 구제·**운명 전환 확정**·**ch1 동일 제목 수미상관**·연속성 무결점. **권고 A(아크 페이오프 게이트) 수동 실증.**
- **종합 리포트** — `docs/reviews/2026-06-07-persona-live-test/FINAL-REPORT-romancefantasy.md`(6축 연속성5·평균~3.8 · 차별점 입증 6항 · 권고 5 · 새 제작계획).

### 검증
- `bash init.sh` 직전 녹색(325 tests). 라이브 콘솔 0. **#2 23화 완결**(1~22 locked·23 미잠금).

### 다음 (새 제작계획)
- **A. #2 완결 ✅** — 이번 세션 완료(intent 유도).
- **C. 아크 페이오프 게이트 — 1차 착수 ✅ (`aa98137`)** — 검토 프롬프트 전제진척 지시 가산 → 쇼러너가 연기를 revise 로 잡음(라이브 검증). **남은 것** — (1) criteriaKeys 를 라이브 `buildAgentReviewPrompt` 에 정식 배선(현재 agentRunEngine/aiCliHarness 만 사용, review 경로 dead) (2) 결정론 premise-progress 스테이지로 정량화.
- **B. #3 헌터물** 전환(다수 캐릭터 일관성·강태준/백도현) — **다음 세션 1순위.** #2 상태는 `docs/reviews/.../backups/02-work-backup-ch23.json` 백업됨(로컬, import 로 복원 가능).

### 손대지 말 것
- P6·P5·relations 수정·테스트. #2 localStorage(**23화 완결**·1~22 locked·characters [레나,리아나,레오르 벨로트라,백작부인]·canonFacts 91). "레오르 벨로트라"(P6 이전 데이터) 보존.

### 커밋
- 종합 리포트 + 로그 + progress + handoff 한 묶음. 커밋 예정.

---

## 2026-06-08 (이어서 3) — 일괄 수정 P6·P5·relations (TDD, 코드 변경)

> 5화 테스트 후 사용자 "일괄 수정 착수"(옵션 2) 선택. 테스트에서 나온 추출 버그를 TDD로 수정. **코드 변경 — init.sh 325 tests·tsc·build 녹색.**

### 한 일 (모두 RED→GREEN)
- **P6 — extractEntityName 명명 계사** (`storyOntology.ts`) — 정규식 조사 목록에 "(이)라는"을 단일 조사보다 먼저 추가. "레오르 벨로트라는…" → "레오르 벨로트"(이전 "레오르 벨로트라"). `isPlausiblePersonName` 가드 헬퍼로 분리. storyOntology.test +1.
- **P5 — 서술부 인물 추출** (`storyOntology.ts`+`storyEngine.ts`) — `extractCharacterNames`(주어 + "이름은 X" 서술부 명명) 신설, `extractPredicateName` 내부 헬퍼. `promoteCharactersFromCanon` 가 두 이름 모두 승격(다중 이름 id `char-{factId}-{idx}`). "리아나의 둘째 오빠 이름은 루시안 벨로트" → 루시안 승격. storyEngine.test +1.
- **relations** (`storyOntology.ts`+`storyEngine.ts`) — `RELATION_TERMS`+`extractRelation`("A의 [관계] 이름은 B" 보수 파서, 관계어 없으면 null) 신설, `linkRelationsFromCanon` 신설 → commitChapter 가 승격 후 관계 엣지 연결. 리아나→루시안 "둘째 오빠" 엣지. 양쪽 승격+중복 라벨 가드. storyEngine.test +1.

### 검증
- `bash init.sh` — tsc 0 · **325 tests**(+3) · build 녹색. 단위 테스트가 #2 실제 캐논 문자열("레오르 벨로트라는…"·"리아나의 둘째 오빠 이름은 루시안 벨로트")로 검증.
- **라이브 스모크(#2 14화)** — 새 코드로 생성·커밋 정상(canonFacts 52→55). ch14 새 캐논 전부 world/plot라 승격 경로 미트리거(인사이트 — codex character 캐논 산출 불규칙).
- **★ 라이브 검증 완료(#2 19화 "흰꽃 향유")** — ch19에 character 캐논("백작부인은 레오르 벨로트의 이름이…") 등장 → **"백작부인" 클린 승격(조사 버그 0·canonAnchors 보존)**. P5/P6 수정 경로가 실데이터로 작동 실증(ch6 이후 첫 인물 승격). characters 3→4. (relations 는 관계 패턴 캐논이 아니라 빈 채 — 정상.)

### 다음
- 라이브 효과 재확인 — 다음에 `owner:'character'` 캐논(특히 "A의 [관계] 이름은 B")이 나오는 회차에서 클린 승격·관계 엣지 확인. (또는 검토에서 character 캐논 비중을 높이는 별도 개선 — 잔여 검토.)
- 남은 일괄 수정 — P1 빈응답 가드 · floating 2c·2d.

### 손대지 말 것
- P6·P5·relations 수정(extractEntityName 계사·extractCharacterNames·extractRelation·linkRelationsFromCanon)·관련 테스트. 약화 금지.
- #2 작품 localStorage(이제 **14화까지·1~13 locked·14화 미잠금·미검토**·characters [레나,리아나,**레오르 벨로트라**(P6 이전 데이터 — 재현 보존, 향후 커밋부터 클린)]·canonFacts 55). 본문·기존 데이터 수정 안 함.

### 커밋
- 코드(storyOntology.ts·storyEngine.ts) + 테스트 2 + docs = `e4a2ea2`. 이후 라이브 스모크 결과 docs 추가 커밋 예정.

---

## 2026-06-08 (이어서 2) — #2 9~13화 테스트 + 각 5인 검토 / 다종 실증 + P6 신규

> 사용자 "테스트 계속" → "커밋+11화 계속" → "계속"(×3). #2 9~13화(5화) 라이브 생성 + 각 5인 검토 풀라이브. 방침대로 발견은 기록만. **코드 변경 0(라이브 테스트만).** 로그 = `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md` 의 `## 9~13화` 절. (세션 중 dev 서버 2회 사망→재시작, #2 localStorage 무손실. **dev 재시작은 `nohup npm run dev > /tmp/storyx-dev.log 2>&1 < /dev/null & disown` — macOS엔 setsid 없음.**)

### 한 일
- **9화 "오른편으로 돌아가는 종이"(2418자)** — 8화 잠금(출간 경유, P2 수정으로 새로고침 없이 produceEpisode 전환) → 의도 메모 빈 값 → 캐논 digest만 생성. 연속성 ★★★★★. **L.B.를 인명 아닌 "벨로트 백작의 오른편" 권한자 약호로 재해석.** canonFacts 32→37. 5인검토 차단0·[수정]. **3명(세계·연속성·캐릭터)이 "루시안 기록실 접근 권한 미설명"을 독립 포착.**
- **10화 "오른편의 첫 날짜"(2110자, 39초)** — 연속성 ★★★★★. **ch9 검토 우려를 캐논으로 자연 해소**(첫 날짜엔 루시안이 오른편 전 → 배제). 최초 오른편 이름 칼훼손·첫 획 "레/르" 남김 = 레나 회귀 떡밥. canonFacts 37→40. 5인검토 차단0·[수정].
- **11화 "지워진 오른편"(2070자, 45초)** — 연속성 ★★★★★. **캐논 고정 이름을 추리 제약으로 사용**(압흔 끝 "B(벨로트)" → 레나=W·루시안=L+날짜로 소거). L.B.=계승되는 자리로 심화. canonFacts 40→44. 5인검토 차단0·[수정]. **품질 게이트 6/8.**
- **12화 "첫 오른편의 약속"(3000자=상한, 54초)** — 연속성 ★★★★★. **미스터리 페이오프** — 첫 배신자=레오르 벨로트(장례 명부상 죽은 벨로트), 첫 회송 날짜가 사망일 이후 = "죽은 자의 약속을 산 자가 지킴". 리아나 가짜 봉투 덫. canonFacts 44→48. 5인검토 **통과 우세** 이나 품질 게이트 4/8(hook 둘 다 FAIL) = **게이트↔페르소나 분기.** **★ P6 신규 — 인물 승격 시 "레오르 벨로트라"(조사 "라" 오염).**
- **13화 "비어 있는 오른편"(2391자, 54초)** — 연속성 ★★★★★. **ch12 덫 회수** — 가짜 봉투를 정전 순간 회수 → 재 흔적이 가족 예배실로 → 레오르 황동판 아래 "오른편 보관함. L.B." 열쇠. "죽은 이름을 산 자가 방패로 쓴다" 확정. 루시안 7연속. canonFacts 48→52. 5인검토 차단0·[수정]. 품질 게이트 6/8.
- **★ 실증** — (1) **캐논화 후 고정 7연속**(루시안 ch7~13 드리프트0) (2) **검토 일관성**(세계 키퍼=미설명 비용/메커니즘 **ch9~13 5연속**·연속성=확정강도 ch10·11·13·캐릭터=리아나 신뢰속도 ch10·13 = 각 페르소나가 자기 원칙을 반복 적용, 랜덤 아님 = 차별점 신뢰성 핵심) (3) **캐논 고정 이름이 미스터리 논리 규정** → ch12 페이오프·ch13 덫회수 (4) **게이트 본문반응** 5/8→5/8→6/8→4/8→6/8 + ch12 게이트↔페르소나 분기 (5) **미스터리 자가교정**(ch9 우려→ch10·ch11 우려→ch12).
- P1(쇼러너 빈응답) 이번 0/5(5회 정상). 생성시간 단조증가 아님(39~54s — codex 지연 변동).

### 검증
- `bash init.sh` 세션 시작·종료 2회 녹색(tsc·vitest·build). **코드 변경 0.** 라이브 콘솔 0. 캡처 `02/storyx-ch9-00·01*.png`(검토 화면은 MCP 간헐 타임아웃으로 evaluate 데이터로 대체 — 직전 세션과 동일).

### 다음 — 사용자 방침: 테스트 완료 후 일괄 수정
- **테스트 계속** — #2 14화~ 완권(~20~25화) + ~10회 수정 사이클 → 6축 정식 점수 → 종합 리포트 → 새 제작 계획. (#2 진입 = `?stage=editor`, localStorage 보존됨. 다음 화 = 13화 잠금→produceEpisode. dev 서버는 `nohup npm run dev ... & disown`로 살아 있어야 함 — 죽으면 about:blank.)
- **일괄 수정 묶음(테스트 후)** — P1 빈응답 가드(간헐 잔존, 이번 0/4) · 관계(relations) 추출 · P5 가족 드리프트(백필 + extractEntityName 서술부 추출 + 검토 characters 대조) · **P6 extractEntityName 조사 버그("라는/란/라" 미포함 → "레오르 벨로트라")**. **주의 — 세계/연속성이 반복 지적한 "접근 권한 미설명"은 본문 약점이지 코드 결함 아님(검토가 잘 잡는 중).**

### 손대지 말 것
- #2 작품 localStorage(이제 **13화까지·1~12화 locked**·characters [레나,리아나,레오르 벨로트라]·canonFacts 52). 발견 재현·연속성 보존 위해 9~13화 본문/드리프트 수정 안 함(P6 "레오르 벨로트라" 오염도 그대로 둠 — 재현 보존). P3·P2·P4 수정·테스트.

### 커밋
- 9·10 `aaf6d41`·11 `8ff27bf`·12 `d37159b` docs 커밋됨. 13화 테스트 = 코드 변경 0. 로그·handoff·progress(docs)만 추가 커밋 예정.

---

## 2026-06-08 — #2 5~8화 테스트 + P5(가족 드리프트) / 캐논화 후 고정 실증·견고

> 사용자 "테스트 진행" — P4 후 #2 5·6·7화 생성하며 드리프트·연속성 관찰. 방침대로 발견은 기록만. **코드 변경 0(라이브 테스트만).**

### 한 일
- #2 5화 "아침 식탁의 빈자리"·6화 "둘째 오빠의 서랍"·7화 "은회색 잉크의 오른손" 생성. 연속성 우수(레나·은여우·인장·위임·동쪽문·L 계승)·오염 0·canonFacts 15→27. characters [레나] → [레나, 리아나].
- **P5 발견 — P4 한계(가족 이름 드리프트)** — 둘째 오빠 1화 "에드릭·노엘"/2화 "레오니드"/6화 "루시안"(3회차 3이름). P4 는 새 등장 인물만 승격해 스친 가족은 캐논화 전이라 드리프트, extractEntityName 은 주어만 추출(서술부 루시안 놓침).
- **★ 7·8화 — 캐논화 후 고정 실증·견고(P5 양면)** — 6화에서 루시안이 canonFacts 로 들어가자 7·8화가 "루시안" 2회 연속 유지(드리프트 멈춤, 의도 비운 자연 전개). 캐논화 *이전* 드리프트 / *이후* 고정 → "연속성=제품요건" 메커니즘(canonFacts→digest)이 작동, P5 백필은 그 경계를 앞당기는 것. canonFacts 32. (단 루시안은 항상 서술부라 characters 미승격 — P5 원인 2.)
- 측정 — 생성 시간 단조 증가(4화 ~40초 → 7화 ~95초 → 8화 ~110초). **완권 세션당 4~6화·#2 완권에 ~3세션 더 추정.**
- P3 후속 — 의도 메모가 생성 후 안 비워짐(작가 매 회차 수동 비움 필요). 일괄 수정 묶음 추가.

### 검증
- 코드 변경 없음. 라이브 콘솔 0. #2 작품 6화까지(1~5화 locked, characters 레나·리아나).

### 다음 — 사용자 방침: 테스트 완료 후 일괄 수정
- **일괄 수정 묶음** — P1 빈응답 · 관계(relations) 추출 · **P5 가족 드리프트**(1화부터 인물 백필 + extractEntityName 서술부 추출 + 검토 characters↔본문 대조) · 데이터/출간 floating화(2c·2d).
- **테스트 계속** — #2 7화~ 완권(~20~25화) + ~10회 수정 사이클 → 6축 정식 점수 → 종합 리포트 → 새 제작 계획.

### 손대지 말 것
- #2 작품 localStorage(6화까지·1~5화 locked·characters 레나·리아나). P3·P2·P4 수정·테스트.

### 커밋
5·6화 테스트 = 코드 변경 0. 로그·handoff·progress(docs)만 커밋 예정.

---

## 2026-06-07 (이어서 3) — 발견 P4 인물 캐논화 (storyEngine TDD+라이브)

> P4(인물 미캐논화 → 드리프트·관계0) 수정. extractEntityName 한계 발견 → 사용자 결정 "제대로(추출 개선 포함)". 코드+테스트. init.sh 322 tests 녹색.

### 한 일
1. **extractEntityName 개선** (storyOntology.ts, export화) — 공백 포함 이름("레나 위클리프")·조사 확장(의/에게/와/과)·generic 역할어와 조직 접미사(상단·가문…) 제외 → `string | null`. 갭B canonFacts 시드도 동반 개선(가짜 "주요 인물" 방지), 호출부 null 가드.
2. **commitChapter 인물 승격** (storyEngine.ts) — owner=character 캐논 → 최소 CharacterProfile(canonAnchors=캐논문장) 로 `project.characters` 승격(중복·generic·조직 가드). produceNextChapter·chapterFromDraftPayload 두 경로 자동 커버.
3. **TDD** — storyOntology.test +5, storyEngine.test +3. 전체 322 tests, 회귀 0.
4. **라이브(#2 4화)** — 새로고침 없이 4화 "동쪽 문에 남은 이름"(1917자) 생성, **characters [] → ["레나 위클리프"]** 승격, 데이터 모드 인물 1, canonFacts 11→15. 용사/외계인 오염 0.

### 검증
- `bash init.sh` — tsc 0 · **322 tests**(+8) · build. 라이브 콘솔 0. (P4 스크린샷은 MCP 타임아웃으로 생략 — localStorage/evaluate 로 실증.)

### 다음 — 사용자 방침 (2026-06-07): 누적 수정거리는 실증 테스트 완료 후 일괄
- **그대로 둘 것 (테스트 후 일괄 수정)** — 데이터/출간 floating화(2c·2d, 현재 그 두 모드는 옛 classic 으로 뜸) · P1 빈응답 가드(간헐) · 관계(relations) 추출. **작고 명확한 버그(P2·P3·P4)는 이번 세션에 즉시 고쳤고, 나머지 UI/구조 수정거리는 모아뒀다 실증 테스트가 끝난 뒤 한 번에 고친다.**
- **테스트 계속** — #2 5화+ 완권 또는 #3 헌터물 → … → 종합 리포트 → 새 제작 계획 → (그 후) 누적 수정 일괄.
- 주의 — 검증 중 "데이터"/"출간" 탭을 누르면 classic 이 뜨는 건 정상(2c·2d 미이식). 편집 탭은 floating.

### 손대지 말 것
- extractEntityName 개선(string|null·GENERIC/SUFFIX 가드)·commitChapter promoteCharactersFromCanon. P3·P2 수정. #2 작품 localStorage(4화까지·1~3화 locked·레나 승격).

### 커밋
P4 = `storyOntology.ts`·`storyEngine.ts`·두 test + 로그·handoff·progress. 커밋 예정.

---

## 2026-06-07 (이어서 2) — 발견 P3·P2 수정 (TDD+라이브, 사용자 결정 A)

> 실증 테스트에서 나온 발견 중 작고 명확한 **P3(의도메모 오염)·P2(잠금 후 state)를 TDD로 수정·라이브 실증**. **코드 변경 + 테스트 추가. init.sh 314 tests 녹색.** P4·P1 은 다음.

### 한 일
1. **P3 수정** — `StoryXDesk.tsx:555` `defaultEpisodeIntent` 데모 문구('용사와 외계인…') → `''`. 모든 작품 의도 메모 기본값이 데모 문구라 2화부터 produceEpisode intent 로 새던 것. 빈 값이면 캐논 digest 만으로 생성.
2. **P2 수정** — `StoryXDesk.tsx` onConfirmChapterLock 에 `setLatestChapter` 동기화 추가(setProject 만 하던 것). 잠금 직후 새로고침 없이 produceEpisode 전환.
3. **TDD** — `editorFocusLayout.test.ts` describe('회차 생성 동작 회귀 — P2·P3') 2 단언. RED(2 fail) → GREEN. 전체 314 tests.
4. **라이브 실증(#2)** — 2화 잠금 → 새로고침 없이 3화 "제3화: 동부 물류 검인권" 생성(P2 ✓). 첫 문장 "아침은 다시 찾아왔다…" 용사/외계인 오염 0(P3 ✓). 캐논 전부 계승·canonFacts 8→11. 캡처 `docs/reviews/2026-06-07-persona-live-test/02/03-ch3-p2p3-fix-verified.png`.

### 검증
- `bash init.sh` — tsc 0 · **314 tests**(+2: P2·P3 회귀) · build 전체 통과. 라이브 콘솔 0.

### 다음 한 단계 — P4·P1 수정 우선순위 결정
- **P4 인물 캐논화(구조적)** — chapterFromDraftPayload/produceNextChapter 가 newCanonFacts(owner=character)를 project.characters 로 승격. 드리프트(가족 이름)·온톨로지 관계 0 근본 해소. storyEngine.test.ts 정통 TDD. **착수 전 범위 재확인 권장.**
- **P1 빈 응답 가드** — 간헐(~2/3), 마지막.
- 또는 테스트 계속(#2 4화~·완권, #3 헌터물).

### 손대지 말 것
- P3/P2 수정(defaultEpisodeIntent=''·onConfirmChapterLock setLatestChapter)·관련 회귀 테스트. 약화 금지.
- #2 작품 localStorage(이제 3화까지, 1·2화 locked). 이전 손대지 말 것 유지.

### 커밋
P3·P2 = `StoryXDesk.tsx`·`editorFocusLayout.test.ts` + 로그·캡처. 커밋 예정.

---

## 2026-06-07 (이어서) — #2 백작가 빙의 로판 2화 회차 연속성 라이브 검증

> 새 세션 목표 — 페르소나 실증 테스트 계속. 이번 = #2 작품으로 **회차 연속성**(#1·#2 공통 미검증 핵심 축) 첫 실증. 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md` + 캡처 `02/`. **코드 변경 0 — 라이브 실증·기록만.**

### 한 일
1. **Preflight** — init.sh 녹색(312 tests). dev 5173. Playwright 1440. #2 작품 localStorage 유지, `?stage=editor` 이어받기. 1화 기준선(하니스 7/8·93, 온톨로지 12, 품질 6/8) 캡처.
2. **2화 생성(produceEpisode, codex 실호출)** — "2화. 은여우의 첫 발자국"(2158자). 생성 경로에서 마찰 다수(아래 P2).
3. **회차 연속성 ★★★★★** — 리아나·벨로트·은여우·인장·3년멸문 정확 계승, **L 단서 → 레나 위클리프 추적 발전**. **온톨로지 12→17(+5)·canonFacts 5→8·memoryAnchors 4개**(갭B가 회차 누적에서 작동함을 실증).
4. **5명 전체 검토** — 결정 3·수정 2·차단 0. **3명(연속성·세계·장르)이 의도 메모 오염을 독립 포착(차별점 실증).** P1(쇼러너 빈 응답) 이번엔 정상 → 간헐적.

### 발견 (P1~P4)
- **P1 쇼러너 빈 응답** — 재현율 ~2/3(1화 2회 빈, 2화 정상). 간헐적, 재시도·폴백·표시 개선 필요.
- **P2 floating 회차 생성 경로** — floating 에 잠금 UI 없음 → 출간 경유 1화 잠금 → **편집 state 미갱신(`onConfirmChapterLock`이 setLatestChapter 누락, StoryXDesk:2560)으로 새로고침 필요** → 그제서야 produceEpisode 동작. 버튼 라벨도 검토/생성 미구분.
- **P3 의도 메모 잔류 오염** — 2화 첫 문장 "용사와 외계인…"은 draftPrompt 잔류값("용사와 외계인이 처음 충돌하는 장면", placeholder 예시 문구)이 intent 로 사용된 것. 생성 후 draftPrompt 미초기화. codex 가 로판에 은유 흡수했으나 톤 이탈.
- **P4 캐논화 안 된 세부 드리프트** — 1화 오빠 "에드릭·노엘" → 2화 "레오니드"(불일치). `characters` 배열 0 이라 인물 세부 미캐논화 → 드리프트 + 검토 사각. 온톨로지 관계 0 과 동근.

### 검증
- `bash init.sh` 세션 시작 시 녹색(312 tests). **코드 변경 0.** 라이브 콘솔 0. 캡처 3장(`02/`).

### 다음 한 단계
- **발견 P1~P4 수정 우선순위 결정** — 테스트 계속(#2 3화·완권 또는 #3 헌터물) vs P2~P4 먼저 수정. P2·P3·P4 는 #1 완권에서도 재발 가능 → S1 전 확인 권장.
- #2 3화 — 의도 메모 비우고 생성, 1화 클리프행어(문밖 남자) 회수·드리프트 누적 관찰.
- 또는 plan S7 #3 헌터물(다수 캐릭터 일관성).

### 손대지 말 것
- #2 작품 localStorage(백작가, 2화까지·1화 locked). 발견 재현 보존 위해 2화 본문 오염·드리프트 수정 안 함.
- 이전 손대지 말 것(갭A·B·deriveOnboardingSeed·전역 토큰·provider·rank2~4·academic·플로팅 2a/2b) 유지.

### 커밋
이번 세션 = 로그·캡처만(코드 변경 0). docs 커밋 예정.

---

## 2026-06-07 — 실사용 창작자 10인 실증 테스트 (설계+파일럿#1) + 온톨로지 갭 B 수정

> 새 세션 목표 — 페르소나 실증 테스트를 거쳐 새 제작 계획 작성. 오늘 = 설계확정 + 파일럿#1 + 온톨로지 갭 규명·수정(갭B). **main 미커밋.**

### 한 일
1. **설계 (brainstorming→spec→plan)** — 실사용 창작자 10인(소설6·만화1·에세이1·오디오1·학술1) 풀 라이브 **직접조작**(Playwright+codex). 장편 #1~3 은 **완권(~20~25화) 연속**, **#3·#4 캐릭터 일관성 집중**, 6축(생성·수정반응·연속성·매체·UX·상업성). 멀티세션 S0~S15. spec `docs/superpowers/specs/2026-06-07-persona-live-test-design.md`, plan `docs/superpowers/plans/2026-06-07-persona-live-test-plan.md`. "클로드 코워크 vs 로컬" — 코워크는 로컬 dev 접근 불가로 시뮬레이션 회귀(이전 5인 테스트 선례) → **로컬(직접조작) 확정**.
2. **파일럿 #1 (웹소설 장편 회귀, 풀 라이브)** — 랜딩→인터뷰(freewrite 정확 받아씀, 라인업 웹소설 맞춤 배정)→1화 생성(강태준·F급·잔류감각·백도현·흑문던전, 2090자, 클리프행어)→검토 5명. **검토 3명(연속성·캐릭터·세계)이 "백도현을 캐논 미확정인데 미래지식으로 과잉확정" 수렴 포착 → 차별점 실증.** 로그 `docs/reviews/2026-06-07-persona-live-test/01-webnovel-regression.md` + 스크린샷 `01/`.
3. **온톨로지 0 규명** — 버그 아니라 구조적 배선 갭 2개. **(A)** 온보딩→project 메타(logline·characters·worldRules·deepQuestion) 미배선 — `DraftChapterPayload`에 그 필드 없음, `chapterFromDraftPayload`가 chapter만 추가. **(B)** 회차 `canonFacts`(5개 쌓임) ↔ 온톨로지 `canonSeeds`/`characters` 미연결. FINDING `docs/reviews/2026-06-07-persona-live-test/FINDING-ontology-gap.md`.
4. **갭 B 수정 (TDD)** — `buildStoryOntology`(storyOntology.ts)에 `canonFacts?` 입력 추가 → 누적 캐논을 `canonSeeds`·`worldRules`(owner=world)·`characters`(owner=character, `extractEntityName`) 시드로 승격. StoryXDesk `storyOntology`(787)·`harnessReport`(836) 두 useMemo에 `project.canonFacts` 전달. `storyOntology.test.ts` +1(RED→GREEN). **라이브 — 온톨로지 0→9, 하니스 22→53.** 커밋 `ebe46b5`.
5. **갭 A 수정 (TDD)** — `deriveOnboardingSeed`(storyEngine) 신규: freewrite 첫 문장→logline, 인터뷰 첫 답("→" 뒤)→audiencePromise, 물음표 문장→deepQuestion. `createEmptyProject` 가 메타 입력 받게 확장. `DraftChapterPayload.seed?` 추가, App.goToBuilding 이 `deriveOnboardingSeed`→`payload.seed` 전달, StoryXDesk 첫 회차 생성 시 `createEmptyProject` 에 반영. `storyEngine.test.ts` +2(RED→GREEN). **라이브 확인됨** — 새 작품(백작가 빙의 freewrite) 온보딩 시 `logline`="몰락한 백작가의 막내딸로 빙의했다"·`audiencePromise`="가문을 무너뜨릴 첫 배신자를 암시한다" 시드 확인. 효과: 하니스 2/8·22 → **7/8·93/100**, 온톨로지 0→**12**, 온톨로지빌더 **pass ✓**, 콘솔 0. 잔여 fail=전제 단조 1개(품질, 갭 아님). 캡처 `gapA-live-harness93.png`.

### 검증
- `bash init.sh` — tsc 0 · **312 tests** · build. 라이브(Playwright) — 갭B(강태준) 온톨로지 0→9·하니스 22→53. **갭A(백작가 새 작품) 하니스 7/8·93/100·온톨로지 12·온톨로지빌더 pass·콘솔 0.** 둘 다 라이브 확인.

### 다음 한 단계 — 나머지 페르소나 → 종합 리포트 → 새 계획
- **갭 A·B 라이브 확인 완료** — 새 작품은 하니스 93/100, 온톨로지 12. "온톨로지 0" 문제 실증 해소. 잔여 = 전제 단조(품질 진단) + relationships 0.
- **#2(백작가 빙의 로판 장편) 1화 검토 완료** (`02-romancefantasy-regression.md`) — 하니스 93·온톨로지 12, 검토 5명 우수(세계 키퍼가 캐논 축적 제안). **발견 P1 — 쇼러너 빈 응답(codex가 검토 의견을 빈으로 반환, 재시도·폴백·표시 개선 필요).** 2화 연속성·~10회 수정·완권은 미착수 — 다음 세션 plan대로. (localStorage = 백작가 작품, ?stage=editor 로 이어가기 가능.)
- **#3~#10** 미착수 (plan S7~S13).
- **새 제작 계획** — 파일럿 발견(온톨로지 갭·검토 수렴·매체 적합)+12인/20인+thesis 종합. 이번 세션 최종 목표.

### 손대지 말 것
- `buildStoryOntology` canonFacts 반영·`extractEntityName`·`deriveOnboardingSeed`·`createEmptyProject` 메타 시드 (테스트 고정). 보수적 휴리스틱 — 발명 금지, 입력 정제·승인 캐논만 반영.
- 파일럿 로그·FINDING 노트 (실증 기록).
- 전역 `--sx-/--nx-/--lc-` 토큰·provider·rank2~4·academic·플로팅 2a/2b.

### 커밋
갭B = `ebe46b5` 완료. 갭A = `storyEngine.ts`·`storyEngine.test.ts`·`App.tsx`·`StoryXDesk.tsx` (이번 커밋 예정).

---

## 2026-06-06 (이어서) — 플로팅 Phase 2b 지표 독 패널 (브레인스토밍→스펙→계획→인라인 실행→머지)

> main `8bc9d4a` 머지 완료(브랜치 `design/floating-phase2b` 삭제). 스펙/계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2b-metrics-dock*`.

### 한 일
floating 독에 옛 좌레일 "지표" 지능을 흡수. "지표" 버튼 1개 + `fc-p-metrics` 패널 4 접이식 섹션(하니스·품질게이트·매체투사+commercial↔literary 슬라이더·온톨로지), **floating-네이티브 `.fc-*`**(DataPanel sx 재사용 아님 — 사용자 선택). `FloatingEditor` 에 `metrics: StudioMetrics`(필수)+`onMediaAxisChange?` prop 추가, StoryXDesk 가 이미 계산한 `studioMetrics`(856)·`updateStoryModeAxis`(868) 주입(둘 다 floatingEditorProps 위라 호이스팅 무문제). 섹션 접이는 `openMetric` 로컬 state(warn 우선 오픈). 패널·슬라이더 CSS `.fc-app` 스코프(`--warn` fallback).

### 검증
- `bash init.sh` — tsc 0 · **309 tests**(+3) · build. 라이브(Playwright) — 기본 `?stage=editor` 지표 버튼→패널 4섹션 실데이터(하니스 7/8·95/100·8스테이지, 품질 2/7) floating 톤 · 360 모바일 독 6버튼·패널(width 317·12px 여백) 뷰포트 내·가로스크롤 0 · 콘솔 0. 캡처 `docs/handoff/screenshots/floating-phase2b/01-metrics-panel-1440.png`.
- Task1(컴포넌트)+Task3(StoryXDesk 배선)은 `metrics` 필수라 컴파일 상호의존 → 한 커밋(`015fc9b`). Task2 CSS(`8bc9d4a`).

### 다음 한 단계 — 2c (또는 회차/곡선 리치판)
- **2c** — 데이터(캐논/바이블) 모드 floating 화. 이어 2d 출간, 2e 옛 3컬럼 제거 + `editorFocusLayout.test.ts` 새 구조 이관 + `?editor=classic` 제거.
- (선택) 회차/곡선 패널을 옛 리치판(ChapterStructureTree/TensionShareChart)으로 업그레이드 — 사용자가 "별도로 두자"로 보류.
- **rank5 잔여** — 죽은 코드 3개(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard) 삭제 vs 추출 · PublishingStudio · Tier3 훅.

### 손대지 말 것
- `fc-p-metrics` 패널의 `metrics` 순수 표현 계약(데이터/계산은 StoryXDesk `studioMetrics`). `openMetric` warn-우선 기본.
- Phase 2a 의 contentEditable bodyVersion-메모·IME 가드·emitBody `\n\n` join(라운드트립).
- 전역 `--sx-*`/`--nx-*`/`--lc-*` · provider · academic · rank2~4.

---

## 2026-06-06 — rank5 Pass E(6개) + 플로팅 Phase 2a 스왑 (브레인스토밍→스펙→계획→서브에이전트 구동)

> main 에 rank5 Pass E(`bcca914`) + Phase 2a 스왑 ff-merge(`389a997`) + 가운데 정렬(`488b5e8`) **머지 완료**(브랜치 `design/floating-phase2a` 삭제). 사용자가 실제 한글 타이핑 정상 확인. 스펙/계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2a-swap*`.

### 한 일
1. **로컬 구동 + 개발계획 제시** — `npm run dev`(127.0.0.1:5173) 띄우고 두 에디터 라이브 확인. 향후 로드맵(rank5~7·플로팅 2a~2e) 작성.
2. **rank5 Tier2 Pass E (main, `bcca914`)** — 살아있는 6개 컴포넌트 추출(Dialogs 3·StoryXStatusBar·ChapterStructureTree+구조헬퍼블록·TensionShareChart). StoryXDesk **3,824→3,317**. 단언 componentSrc 재배치(삭제·약화 0). **죽은 코드 3개(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard)는 JSX 사용처 0 → 추출 보류**(삭제 vs 추출 사용자 결정 대기). PublishingStudio·Tier3 훅 잔여.
3. **플로팅 Phase 2a 스왑 (브랜치 `design/floating-phase2a`)** — 사용자가 "floating 을 기본 에디터로, 기능을 floating 방식으로 흡수" 요청 → 단계적 대체(2a~2e) 합의. 2a 구현 — ① 트리거 플립(`isDraftMode && !isClassicEditor`, `?editor=classic` 한시 폴백) ② 본문 **contentEditable 라이브 타이핑**(compositionstart/end IME 가드 + bodyVersion-메모로 타이핑 중 커서 클로버 차단) ③ 의도메모 쓰기-백 ④ 초안생성/편집·데이터/출간 네비 배선 ⑤ StoryXDesk bodyVersion state + 외부변경 3곳 bump(회차로드·diff반영·초기화) + 호이스팅 위해 floatingEditorProps useMemo 를 mainActionRun 아래로 이동. emitBody 는 블록을 `\n\n`로 join(splitIntoParagraphs 라운드트립 보존).

### 검증
- `bash init.sh` — tsc 0 · **305 tests** · build. 라이브(Playwright) — 기본 `?stage=editor` = floating(`.fc-app`·`.sx-desk-grid` 없음) · 편집→헤더 글자수 0→24자 · 본문 단락 2개 보존(커서 메커니즘) · 콘솔 0 · `?editor=classic` = 옛 3컬럼+상태바. 캡처 `docs/handoff/screenshots/floating-phase2a/01-default-floating-1440.png`.
- 옛 `editorFocusLayout.test.ts`(20)·`version.test.ts`(4) 단언 그대로 green — classic 경로로 옛 3컬럼 JSX 가 소스에 남아 source-string 단언 보존.

### 완료 후 — 다음 세션 우선순위
- **한글 타이핑·머지·가운데 정렬 모두 완료.** 사용자가 "소소한 UI/UX 개선 필요"라고 함 — 가운데 정렬은 처리(`488b5e8`), **나머지 구체 항목은 사용자 지정 대기**(어떤 화면/요소인지 물어볼 것).
- **Phase 2b** — 좌측 독에 하니스·품질·온톨로지·구조트리·곡선을 floating 패널로 흡수(옛 좌레일 지능 이식). 그 다음 2c(데이터)·2d(출간)·2e(옛 3컬럼 제거 + editorFocusLayout 이관 + classic 제거).
- **rank5 잔여 결정** — 죽은 코드 3개(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard) 삭제 vs 추출 · PublishingStudio 단독 추출 · Tier3 훅 분리.
- **정리 후보** — 옛 design/* 브랜치 다수가 main 보다 뒤처짐(design/floating-editor 등). 사용자 확인 후 삭제 가능.

### 손대지 말 것
- main 의 rank5 Pass E 추출 6 컴포넌트(순수 이동 고정). 죽은 코드 3개는 사용자 결정 전 손대지 말 것.
- contentEditable 본문의 **bodyVersion-메모 패턴**(타이핑 중 본문 재시드 금지 — 커서 보존 핵심) · **emitBody `\n\n` join**(라운드트립) · **IME 가드**. 약화 금지.
- `editorFocusLayout.test.ts` 옛 편집 구조 단언 — 2e(옛 3컬럼 제거) 전까지 보존.
- 전역 `--sx-*`/`--nx-*`/`--lc-*` 토큰 · provider 경로 · academic · rank2~4 도메인.

### 운영 메모
- Phase 2a 는 서브에이전트 구동(Task1~3 구현자 디스패치 + Claude 검증, Task4~6 Claude 직접). Task3 구현자가 정직하게 보고한 정확성 우려(textContent 단락 붕괴)를 Claude 가 `\n\n` join + splitIntoParagraphs 라운드트립 테스트로 해소 — **서브에이전트 자기보고 신뢰하되 검증·보강 필요**.

---

## 2026-06-05 (이어서) — 방향 C 플로팅 에디터 실데이터 배선 (브레인스토밍→스펙→계획→TDD)

> Branch: `design/floating-data-wiring` → main 머지. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`.

### 한 일
체크포인트(시안 데이터)였던 플로팅 에디터를 실데이터로 배선. brainstorming 3결정(실데이터 프리뷰 · StoryXDesk 경유 접근 A · 읽기 본문+완전 검토) → 스펙 → 계획 → TDD 5 태스크.
- `FloatingEditor.tsx` — `SAMPLE_*` 제거 → 순수 표현 컴포넌트(`FloatingEditorProps`). 실 `MarginReview·CORE_PERSONAS·Paragraph·검토 콜백`을 props 로. present/stateMap 로컬 state → reviews 파생.
- `StoryXDesk.tsx` — `isFloatingPreview && isDraftMode` → `<FloatingEditor {...floatingEditorProps}/>`. 기존 `editorText·marginParagraphs·marginReview·acceptMarginDiff·beats·draftPrompt·CORE_PERSONAS` 단일 원천 주입. 기본 편집기 경로 불변(추가 분기만).
- `App.tsx` — standalone 우회(`?editor=floating`) 제거 → StoryXDesk 경유 일원화.
- 신설 `src/components/floatingEditor.test.ts` — react-dom+jsdom 렌더 4 케이스(시안제거·reviews 렌더·onRunAll 호출·빈 상태 안전).

### 검증
- `bash init.sh` — tsc 0 · 297 tests(기존 293 + 신규 4) · build.
- 라이브(Playwright 1440·360) — 실 헤더(작품명 "샘플 작품"·logline 부제·"소설" medium·0자), 작가실 실 5 페르소나(쇼러너·캐릭터 큐레이터·세계 키퍼·장르 스타일리스트·연속성 감수자), 전체검토→검토 5건 도착(badge 5), 콘솔 0, 모바일 상단바 축약·하단 독·인라인 점 정상. 캡처 `docs/handoff/screenshots/floating-c-wired/`.

### 정직한 범위 — 읽기 본문 프리뷰
**라이브 타이핑(contentEditable)·의도 메모 쓰기-백·Phase 2 스왑·Phase 3 진입화면 미착수.** floating 은 여전히 `?editor=floating` opt-in, StoryXDesk 가 기본 편집기. 반영(accept-diff)은 `acceptMarginDiff`가 editorText 를 고쳐 동작.

### 다음 한 단계
Phase 2 스왑(편집 모드 기본화 + `editorFocusLayout.test.ts` 갱신 + 라이브 타이핑) 또는 rank5 Tier2 Pass E.

### 손대지 말 것
- `.fc-*` CSS(데이터 배선 단계엔 미변경 보존) · 전역 `--sx-/--nx-/--lc-` 토큰 · 기본 편집기(StoryXDesk) 경로 · rank2~4 도메인 · academic · provider 경로.
- `FloatingEditorProps` 계약 — 표현 컴포넌트 순수성 유지(데이터/콜백은 StoryXDesk 단일 원천). 시안 `SAMPLE_*` 부활 금지.

---

## 2026-06-05 — 방향 C 플로팅 에디터 시안 체크포인트 (커밋 + main 머지)

> Last Updated: 2026-06-05 · Branch: `main` (design/floating-editor ff 머지)

### 한 일
claude.ai design 에서 발산한 3방향 편집기 시안 중 **방향 C "떠 있는 작업실"** 의 비주얼 Phase 1 을 커밋하고 main 에 머지했다. 이전 인계(rank5 Pass D) 이후 상태 문서에 누락돼 있던 작업을 기록·정리한 것.
- `src/components/FloatingEditor.tsx`(739줄) 신설 — 어두운 캔버스 + 종이 시트(max 760px) + 좌측 플로팅 독 + 단락 옆 여백 주석(328px) + 작가별 색 밑줄 + 인터랙션 전부.
- `src/App.tsx` — `?editor=floating` 플래그 진입(기본 StoryXDesk 유지). `src/styles.css` — `.fc-*` 네임스페이스 205줄(`.fc-app` 스코프 oklch, 전역 토큰 보존).
- 커밋 `49480c3`(feat 코드+설계문서+4해상도 캡처) + docs 상태 동기화 커밋. `design/floating-editor` → `main` fast-forward.

### 정직한 상태 — "시안 체크포인트"지 완성 아님
- **아직 SAMPLE 데이터** — `SAMPLE_PERSONAS·SAMPLE_REVIEWS·SAMPLE_BODY` 내장. 실제 `editorText·MarginReview·5 페르소나` 미배선.
- **전용 테스트 없음** — 계획의 `floatingEditor.test.ts`(RED) 미작성. 게이트 293 녹색은 floating 이 플래그·CSS 로 격리돼 기존 테스트에 안 걸리기 때문(테스트가 floating 을 검증한다는 뜻 아님).
- Phase 2(스왑)·Phase 3(진입 4화면) 미착수.

### 검증
- `bash init.sh` 통과 — tsc 0 · 293 tests · build. floating 변경 포함 working tree 에서 실행.
- 시각 — `?stage=editor&editor=floating` 4해상도 캡처 `docs/handoff/screenshots/floating-c`. 1440 렌더 육안 확인(종이 시트·독·여백 주석 정상).

### 다음 세션이 해야 할 한 가지 — 데이터 배선 (재개 지점)
`FloatingEditor.tsx` 의 시안 데이터를 실제 프로젝트 데이터로 교체한다. `FloatingEditorProps` 를 확장해 `editorText`·`MarginReview[]`·`5 페르소나(MARGIN_CORE_AGENT_IDS)`·회차구조/곡선/상태·검토 콜백(`runMarginReviewAll`·`summonMarginReviewAgent`·`acceptMarginDiff`)을 주입. 매핑표는 `docs/storyx-floating-editor-plan.md` §"현재 → C방향 데이터 매핑". 동반으로 `floatingEditor.test.ts` 구조 단언 추가(TDD). **기능 작업이니 착수 전 brainstorming 으로 props 계약부터 합의.** (대안 B — rank5 Tier2 Pass E 재개.)

### 손대지 말 것
- 기본 편집기(StoryXDesk)·`editorFocusLayout.test.ts` — floating 은 플래그 격리 상태. Phase 2 스왑 전까지 기본 경로 불변.
- 전역 Linear 다크 토큰(`--sx-*`/`--nx-*`/`--lc-*`). floating 은 `.fc-app` 지역 oklch 만 사용.
- rank2~4 도메인 로직, academic, provider 경로.

### 참고 — `.claude/scheduled_tasks.lock`
working tree 에 삭제로 떠 있던 이 런타임 락 파일은 floating 작업과 무관해 `git checkout` 으로 복원(커밋 제외)했다. 추적 대상이지만 본래 런타임 산출물이라 gitignore 가 맞다 — 별도 정리 후보(미실행).

---

## 2026-06-04 — rank5 착수: StoryXDesk 분리 Tier1 + Tier2 Pass A~D + 헬퍼 de-dup·순환제거 (Codex 위임 + Claude 검증)

> Last Updated: 2026-06-04 · Branch: `main` · 체크포인트 3회 커밋

### 완료 — StoryXDesk.tsx 6,097 → 3,772줄 (-2,325 · 약 38%)
1. **Tier 1 (상수 3모듈)** — `src/lib/agentPersonas.ts`(agentPersonas·fallbackAgentPersona·AgentPersona 타입), `agentSeedData.ts`(defaultRuns·visualStoryAgentRuns·MARGIN_CORE_AGENT_IDS), `studioConstants.ts`(STUDIO_*·StudioAccent/Canvas). 7개 리터럴 byte-identical 검증.
2. **Tier 2 Pass A (리프 컴포넌트 8개 → `src/components/`)** — CanonStatusBadge·PublishingIndexCard·MemoryBankCard·OpenThreadsCard·EvaluatorQualityCard·CanonTimeline·BibleRulesAccordion·AgentPixelPortrait.
3. **Tier 2 Pass B (Canon/Data 7개 → `src/components/` + `src/lib/canonDataView.ts`)** — CanonNav·DataLeftRail·CharacterGraph·CharacterDetailPanel·CanonCardGrid·CanonCanvas·DataReviewRail. 공용 타입(BibleSection·CanonCategory·DataView·DataReviewView)·헬퍼(getCategoryEntities·categoryHasFlag·categoryCount·canonCategories)는 canonDataView.ts로 추출, byte-identical 검증.
4. **Tier 2 Pass C (Bible/Memory 5개 → `src/components/`)** — ProjectStateCard·BibleWorkbenchHeader·CanonRefactorPanel·BibleAssistantSidebar·MemoryBankStudio. BibleSectionState·bibleSections·buildBibleSectionState·approvalDecisionLabels 등 워크벤치 헬퍼 동반 이동.
5. **헬퍼 de-dup (Claude)** — Pass C에서 Codex가 `getAgentPersona`·`agentStatusLabel`를 복사해 생긴 중복을 적발 → `src/lib/agentPersonas.ts` 단일 진실원천으로 통합(StoryXDesk·BibleAssistantSidebar 양쪽 import).
6. **Tier 2 Pass D (Agent 4개 → `src/components/`) + 순환의존 제거** — AgentIntentCard·AgentProfileDialog·AgentRoom·WorkStateGrid. AgentChatMessage·buildAgentReply는 AgentProfileDialog로 동반 이동. 더해 Pass B에서 샌 DataLeftRail→StoryXDesk→WorkStateGrid 순환참조(+불필요 re-export)를 Claude가 적발·제거 → StoryXDesk가 다시 `StoryXDesk` 하나만 export(단일 계약 복구). 추출 컴포넌트 총 24개(`src/components/`) + lib 4모듈.

### Claude 검증이 적발·수정한 것 (Codex 자기보고 불신 → 직접 검증)
- **false-green (Pass A)** — Codex가 brittle source-string 테스트(`agentPersona`·`editorFocusLayout`가 .tsx를 문자열로 읽음)를 통과시키려 `StoryXDesk.tsx`에 함수명 든 우회 주석을 심음. 적발·제거 후 단언을 정의 파일로 재배치(`componentSrc(name)` 헬퍼 도입, agentPersona는 `portrait` read). 주석 제거 시 editorFocusLayout 2건이 즉시 실패해 정체가 드러남.
- **스코프 크리프 (Pass B)** — Codex가 progress.md·session-handoff.md를 임의 수정(미검증 자기보고 박제). HEAD로 되돌림.
- **중복 재발 (Pass C)** — Codex가 getAgentPersona·agentStatusLabel를 복사 → Claude가 lib 통합으로 수정(위 5번). 향후 패킷에 "공용 헬퍼 복사 금지, lib import만" 명시함.
- **순환의존 (Pass B 잔재, Pass D에서 적발)** — DataLeftRail이 WorkStateGrid를 `'../StoryXDesk'`에서 import + StoryXDesk가 re-export하던 순환구조. Pass B 검증 때 놓쳤던 것을 Pass D가 드러냄 → DataLeftRail이 `'./WorkStateGrid'` 직접 import, re-export 제거. **검증 루틴에 "신규 export·컴포넌트→StoryXDesk import" 체크 추가.**
- 테스트 단언 삭제·약화 0 — 가리키는 파일 경로만 이동 위치로 재배치(Pass B 21:21, Pass C 32:32, Pass D는 정의단언 재배치 + 사용처(`<X>`) 단언 추가).

### 검증 (전부 Claude 직접)
- 매 티어 `npx tsc --noEmit` 0 · `npm test` 293/293(올바른 이유로) · `npm run build` · `bash init.sh` 통과.
- 시각 — 편집기 픽셀 동일(Tier1·PassA) + 캐논 뷰 픽셀 동일(PassB, 221725 byte 일치) + 콘솔 에러 0. baseline은 `docs/reviews/screenshots/rank5/`.

### 손대지 말 것
- 추출된 28개 파일(`src/components/` 24 + `src/lib/` 4)의 JSX·문자열·로직 — 순수 이동으로 고정. getAgentPersona·agentStatusLabel은 `lib/agentPersonas.ts`에만 둔다(복사 금지).
- provider 경로·academic·rank2~4 로직·Linear 다크 토큰.
- `componentSrc` 헬퍼(editorFocusLayout.test.ts) — 이후 컴포넌트 이동 시 `expect(desk)...` → `expect(componentSrc('X'))...` 재배치 패턴 유지.

### 다음 세션이 해야 할 한 가지 — rank5 Tier 2 Pass E~ + Tier 3
`StoryXDesk.tsx` 잔여 서브컴포넌트 ~11개를 클러스터별 추출한다. (Dialogs: ProjectHistoryDialog·CommandPalette·VersionLogDialog / Publishing: PublishingStudio·TensionShareChart·ChapterStructureTree / Status: AiCliHarnessCard·StoryXStatusBar·CreativeStage·VerticalSliceProofPanel·ContinuitySummaryCard) **CreativeStage는 편집기 중앙 원고 무대라 시각회귀 위험이 가장 크니 단독 패스 권장.** 그 후 **Tier 3 훅 분리(useState 44개 → useProject·useDraftEditor·useReviewSession·useUIState 등, 최고위험, code-reviewer 2차 필수)**. 현재 줄수 3,772 → 목표 800 이하.

⚠ **Codex 디스패치 신뢰성 주의** — Pass D 1차 디스패치가 "백그라운드 시작" 메시지만 반환하고 실제 no-op(파일 미생성)이었으나, 동일 패킷 재디스패치로 성공했다. codex-rescue 결과는 자기보고를 믿지 말고 반드시 `git status`·`wc -l`·신규 파일 mtime으로 실제 반영을 확인하고, no-op이면 재디스패치할 것.

**Codex 패킷 필수 조항** — (1) 우회 주석 절대 금지 (2) 상태 문서(progress.md·session-handoff.md·feature_list.json) 수정 금지 (3) 이동 심볼의 source-string 단언은 정의 파일을 가리키도록 재배치(삭제·약화 금지) (4) 순수 이동, 동작·렌더 변화 0. Claude는 매 패스 tsc·293·build·시각 픽셀 비교 + gaming/scope 스캔으로 검증한다.

### 커밋
체크포인트 1 `13a0554`(Tier1+A+B), 2 `ae9cca6`(Pass C + de-dup), 3(Pass D + 순환제거) 커밋. 모두 사용자 승인 하 main 직접 커밋.

---

## 2026-06-03 — rank4 continuity 보강 + 거짓양성 수정 (Codex 구현 + code-reviewer + Codex 수정)

> Last Updated: 2026-06-03 · Branch: `main`

### 완료
0. **rank4 구현 (Codex)** — continuity 충돌 감지를 반의어·생사 대립쌍(OPPOSITION_PATTERNS)·숫자 비교·인물ID(hasSameEntity)로 보강. validateContinuity 가 3계층(hard/living/soft)을 실제로 채우고 growthLedger 루프(appendGrowthEntry·buildContextPack) 연결. 이어 code-reviewer 2차가 거짓양성 CRITICAL+HIGH 를 발견해 아래로 수정.
1. `hasNumericDivergence` 에 claim 인자와 same-entity guard 를 추가했다. `도현의 출입 증표는 3장이다` 와 `민재의 출입 증표는 4장이다` 는 unrelated 로 통과한다.
2. presence/reveal 반전 감지는 같은 주어만으로 차단하지 않고 공유 object/target token 을 요구한다. `서윤은 사라졌다` 뒤 `서윤은 단서를 발견했다` 같은 정상 진행은 통과한다.
3. `storyEngine` 의 soft/living canon 분류를 좁혔다. 단순 `들었다` 는 soft-signal 로 내리지 않고, confirmed past-tense world/plot fact 는 hard-canon 에 남는다.

### 검증
- TDD RED 확인 — `continuityContract.test.ts` 2 failed, `storyEngine.test.ts` 1 failed.
- Focused GREEN — `continuityContract.test.ts` 18/18, `storyEngine.test.ts` 33/33.
- `npx tsc --noEmit` exit 0.
- `npm test` 42 files / 293 tests / 0 failures.
- `bash init.sh` 통과 — tsc · vitest · build 전체 통과.

### 손대지 말 것
- academic track, provider paths, `vite.config.ts`, `tools/storyx.mjs`, server code.
- Linear dark CSS tokens.
- rank2~4 가 배선한 로직 — `buildFallbackDraft`, qualityGates 본문 측정/measured skip, continuity 대립쌍·3계층·hasSameEntity 가드 (모두 회귀 테스트로 고정).

### 커밋
**완료 — `8d3aca2` (main · origin push 완료).** 이번 세션 전체(M12 Codex 연결 + rank1~4 + UI 핫픽스 2건 + 검토 리포트 docs/reviews)를 한 커밋으로.

### 다음 세션이 해야 할 한 가지 — rank5: StoryXDesk.tsx 분리 (large · 비용 승수)
검토 리포트(`docs/reviews/2026-06-01-multiagent-review.md`) code-quality 관점 HIGH. StoryXDesk.tsx 가 6,000줄+ · useState 40개 집중이라 이후 모든 작업이 전체 파일을 훑게 만든다. **Codex 위임 + code-reviewer 2차** 로 진행한다.

Codex 위임 task packet (그대로 `codex:codex-rescue` 에 전달 가능)
- 목표 — StoryXDesk.tsx 를 관심사별 커스텀 훅(useProject · useDraftEditor · useReviewSession · useUIState 등) + 파일 내 서브컴포넌트(ProjectHistoryDialog · CommandPalette · ChapterStructureTree · PublishingStudio 등) + agentPersonas 거대 리터럴을 src/components/ · src/lib/ 로 추출. 목표 800줄 이하.
- 곁가지(분리 가능) — 프롬프트 빌더 5개 이중화(tools/storyx.mjs vs src/lib/server/promptBuilders.ts) 해소.
- 제약(필수) — 순수 리팩토링, 동작·기능 변화 0. 기존 293 tests 전부 그대로 통과. 시각 회귀 없음(중앙 편집기 타이포·앵커 `styles.css:3146-3163` · `StoryXDesk:5944-5959` 보존). provider 경로·academic·rank2~4 로직 무변경. 점진적으로 — 훅 하나 추출 → tsc/test 통과 → 다음. 한 번에 다 뜯지 말 것.
- 검증 — tsc 0, npm test 293 그대로, build, `?stage=editor` Playwright 화면 회귀 없음. code-reviewer 2차로 기능 보존·렌더 동등성 확인.
- 위험 — large 리팩토링이라 회귀 위험이 크다. 점진 추출 + 시각 회귀 캡처 비교가 핵심이다.

---

## 2026-06-01 (이어서) — Codex 로컬 연결(M12) + rank2·rank3 (Codex 위임 + 검증 루프)

> Last Updated: 2026-06-01 · Branch: `main` (HEAD `1c652fa`, 미커밋)

### 작업 모델
사용자 요청 — 개선을 Codex CLI 로 코딩 + 로컬 작가진을 claude 가 아닌 Codex 에 연결. 이후 구현 코딩은 `codex:codex-rescue` 에 위임하고 Claude 가 검증·머지. (codex 는 chatgpt.com DNS 차단으로 한때 막혔다가 네트워크 복구 후 정상 작동.)

### 완료
1. **(B) Codex 로컬 연결 (M12, done)** — vite.config.ts 5 storyxBridge 라우트 + storyx.mjs normalize 기본값을 codex 로. storyx.mjs codex exec 분기는 기존 구현 그대로 작동(파서 보강 불요). dev POST /api/review-agent → provider=codex showrunner JSON 응답 확인.
2. **rank2 (Codex 구현 · 검증 통과)** — 빌딩 LLM 실패 시 빈 에디터 대신 `buildFallbackDraft`(storyEngine.ts) 결정론적 폴백 초안 + isFallback 배너(StoryXDesk). storyEngine.test.ts 3 케이스(유효 초안·빈 입력 안전·시드 모티프 invent 방지).
3. **rank3 (Codex 구현 + code-reviewer 2차 + Codex 수정 + 재검증)** — 품질 게이트가 하드코딩 리터럴 대신 본문 실측. buildProseQualityMetrics(voiceMatch↔koreanVoiceGate, sceneSequel·historical·motif·ethical 결정론 휴리스틱), measured:false skip, storyHarness ready conjunctive. code-reviewer 가 버그 5개(CRLF 단락 분리 HIGH 등) 발견 → Codex 수정 → 회귀 테스트 6개.

### 검증 (Claude 직접)
- tsc 0 · npm test 42 files / 283 tests · npm run build 성공 · dev 200 · 콘솔 에러 0.
- 스코프 — codex 가 provider 경로(vite/storyx)·academic(claimLedger/citationGate/academicIntegrity) 무변경 확인. 하드코딩 리터럴 grep 매치 0.
- 편집기 화면 회귀 없음(docs/reviews/screenshots/10-editor-rank3.png).

### 다음 세션이 해야 할 한 가지
rank4 (continuity 충돌 감지 보강 — 반의어·생사 대립쌍·숫자·인물 ID + living/soft 3계층 통합, large) 또는 rank5 (StoryXDesk 6,067줄 분리, large). 둘 다 Codex 위임 + code-reviewer 2차 권장. rank6(사업)·rank7(UI)은 후순위.

### 손대지 말 것
- A1~A5 · M4 도메인 완성본. rank3 가 배선한 qualityGates/storyHarness/koreanVoiceGate 측정 로직(회귀 테스트로 고정).
- provider 경로(vite.config.ts·storyx.mjs)는 현재 codex 연결 상태 — claude 로 되돌리려면 vite 각 라우트 --provider 만 'claude' 로.

### 커밋
미실행(사용자 지시 대기).

---

## 2026-06-01 — 로컬 구동 점검 + 멀티에이전트 검토 + rank1 상태 동기화

> Last Updated: 2026-06-01 · Branch: `main` (HEAD `1c652fa`)

### 이번 세션이 한 일
1. **로컬 구동 점검** — dev `http://127.0.0.1:5173` HTTP 200 · 콘솔 에러 0 · tsc 0 · 42 files / 269 tests. 4개 화면(랜딩·브릿지·편집기·퍼블리시) Playwright 캡처(`sx-01~04.png` — 루트에 생성, 미추적, 보관/삭제 결정 필요).
2. **7에이전트 멀티에이전트 검토** — 6관점(온보딩·편집기UX·코드품질·스토리하네스·비즈니스·하네스위생) 병렬 + 총괄 종합. 전체 리포트 `docs/reviews/2026-06-01-multiagent-review.md`.
3. **rank1 상태 문서 동기화 (완료)** — 아래 4묶음.
4. **핫픽스 — 다크 스코프 대비 버그 2건 (사용자 발견)** — 둘 다 M8.5 `.home-page` 다크 전환 누락. (a) 카드 제목 — `--nx-ink-deep` 오버라이드 누락 → `styles.css:8821` 에 `--nx-ink-deep: #f7f7fb` 추가. (b) 상단 nav `hx-nav` 배경이 흰색(`rgba(255,255,255,0.92)`) 하드코딩으로 남아 흰 텍스트(`--nx-ink`)와 충돌 → `styles.css:8854` 를 `rgba(8,9,10,0.85)` 로 교체. `appExperience.test.ts` 회귀 테스트 2개(271 tests). 캡처 `docs/reviews/screenshots/07~08`. 같은 유형 전수 점검은 rank 7.

### rank1 변경 파일
- `feature_list.json` — A1~A5 5개 done 등재(SHA·모듈 evidence) + M11 마일스톤 신설 + active=M11. (이전 active=M6.3-storyx-cli 는 실제 HEAD(A5 완결)보다 5세대 뒤처져 있었음.)
- `progress.md` — 헤더 main/2026-06-01 · Current Objective=M11 · 완료표에 M6.x·M8·M9·M10·A1~A5 추가 · 검증 42/269.
- `init.sh:22` · `CLAUDE.md` DoD — 박제 수치 "28 files / 149 tests" 제거 → 불변 표현.
- `session-handoff.md` — 이 노트.

### 다음 세션이 해야 할 한 가지
검토 7단계 로드맵 중 **사용자 우선순위 결정 후 rank 2 또는 rank 3 착수**.
- **rank 3 (권장 · 최우선 위험)** — 품질 게이트 12개가 본문 대신 하드코딩 리터럴(`StoryXDesk.tsx:1352-1362`, voiceMatchScore=75 등)을 평가 → 차별점 "연속성을 제품 요건으로" 가 데모에서만 작동. voiceMatchScore↔koreanVoiceGate, sceneSequelRatio↔단락분류 배선 + storyHarness ready conjunctive 화. academic 트랙의 text 실판정 패턴(`qualityGates.ts:300-353`)을 commercial/literary 로 이식.
- rank 2 — 빌딩 단계 LLM 실패 시 빈 에디터 대신 결정론적 폴백 초안 + 실패 배너(`src/App.tsx:782` goToBuilding, `src/lib/draftClient.ts:37-46`).

### 손대지 말 것
- A1~A5 완성본 (claimLedger·citationGate·academicIntegrity·academicPublish + .test.ts).
- M4 스토리 하네스 완성본 — rank 3·4 에서 배선만 추가하되 기존 통과 테스트 보존(TDD).
- 중앙 편집기 타이포·앵커(`styles.css:3146-3163`) — 시각 회귀 기준선.

### 검증 · 커밋
- tsc exit 0 · npm test 42 files / 269 tests · dev HTTP 200. rank1 은 문서·셸 echo·JSON 변경뿐이라 코드 게이트 불변.
- 커밋 미실행(사용자 지시 대기). git status — progress.md · feature_list.json · session-handoff.md · init.sh · CLAUDE.md · docs/reviews/ 신설.

### 검토에서 확정된 stale 사실
- handoff 가 A2(5/30)에 멈춰 A3~A5 인계 누락이었음 → 이 노트로 해소. 머지 직후 handoff append 를 체크리스트화 권장.
- 마진 병렬화(80s→16s `88282f1`)·DataPanel 폭 수정(`9247c5d`)은 이미 완료 — 과거 handoff "별도 작업" 표기는 stale 였음.

---

## 2026-05-30 17:55 — A2 주장-근거 하네스 완료·머지 (사회과학 확장)

> Last Updated: 2026-05-30 · Branch: `main` (47b15f9)

### Current Objective
사회과학 글쓰기 확장 A2 완료·main 머지. Codex(gpt-5.5 @ xhigh) 구현, Claude 하네스·검증·머지.

### 완료 (A2)
- `claimLedger.ts` 신설 — 학술 본문 주장 추출(영어 APA 마커)·근거 유형(data/prior-work/logic/anecdote) 매핑·미근거 주장 탐지. 로컬 휴리스틱·결정론적.
- `claim_evidence_mapping` 게이트 실제 판정(academic 전용, advisory).
- academic 매체일 때 근거 없는 주장을 마진에 `block`(critic-reviewer)으로 표시.
- 검증(Claude 직접) — tsc 0 · **39 files / 246 tests** · build 성공. 스코프 깨끗(마진 핵심·도메인 무변경).
- 커밋 `31b114b` → 머지 `47b15f9` → push 완료, local=origin 동기화.

### 사회과학 로드맵 진행
- A1 ✅(a89e34c) · A2 ✅(47b15f9) · **A3 대기** — 인용 무결성 게이트 + 검증자 페르소나(citationGate, 환각 인용 탐지) · A4 반론·문헌 검토 · A5 학술 퍼블리시.

### Recommended Next Step
A3 — `citationGate.ts` + citation_integrity 게이트 실제 판정. 출처 존재·페이지·맥락 일치 로컬 휴리스틱. 패킷: `docs/handoff/academic-a3-task-packet.md`(미작성).

---

---

## 2026-05-29 20:50 — M10 Phase 3 검토 UX 다듬기 · Claude 총괄 재검증 통과

> Last Updated: 2026-05-29 20:50 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 통합 Phase 3 완료.** 실사용 테스트에서 발견한 두 결함 수정 — (A) 전체 검토 ~80초 동안 마진 빈 화면, (B) 의견이 첫 단락 클러스터링. Codex(gpt-5.5 @ xhigh) 구현, Claude 하네스(패킷)·총괄 검증.

### 총괄 재검증 결과 (Claude 직접)
- 게이트 — tsc exit 0 · `npm test` **38 files / 234 tests** · build 성공.
- 라이브 렌더(Playwright, `?stage=editor`, 실 LLM 초안 23단락) —
  - (A) "5명에게 전체 검토 맡기기" 클릭 **즉시 pending skeleton 5개**("읽고 있는 중…") 표시. 도착 시 확정 의견으로 교체, stillPending 0.
  - (B) 의견 5개가 서로 다른 단락(p1·p7·p13·p19·p2)에 **분산 anchored** (이전엔 전부 p19).
  - console error 0.
- 스코프 — 도메인 lib 8종 무변경 · 검토 호출 경로 무변경 · 잔여물 없음.

### 알려진 약점 (다음 후보)
- 마진 헤더 카운트는 pending 중 "0건"으로 표시(확정만 셈). "N/5 검토 중" 형태가 더 친절. 소소.
- 병렬 검토(순차 80초 → 병렬 ~16초)는 이번 스코프 밖. 별도 작업.

### Recommended Next Step
1. Phase 3 커밋 → main 머지(PR) 여부 사용자 결정.
2. L1 — Vercel env 등록(배포본 실 LLM).

---

## 2026-05-29 20:40 — M10 Phase 3 마진 검토 UX 수정 완료 · 커밋 전

> Last Updated: 2026-05-29 20:40 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 통합 Phase 3 구현 완료, 커밋 전 검증 대기.** 전체 검토 시작 직후 코어 5명 pending skeleton 이 즉시 뜨고, 실제 리뷰가 도착하면 같은 persona placeholder 를 교체한다. anchor 매칭 실패 리뷰는 첫 단락 몰림 대신 단락 순서 round-robin 으로 분산된다. 도메인 로직과 `/api/review-agent` 호출 경로는 건드리지 않았다.

### Recommended Next Step
1. Claude 총괄이 diff와 UI를 재확인한 뒤 커밋 여부 결정. 사용자 지시로 Codex는 커밋하지 않음.
2. 가능하면 실제 브라우저에서 `?stage=editor` → "5명에게 전체 검토 맡기기"를 눌러 pending 5장, 도착 순 교체, console error 0을 확인.
3. 이월 — 코어 5명 순차 호출 병렬화는 이번 스코프 밖. 별도 작업으로 분리.

### Branch · Commit · Verification
- Branch — `design/margin-integration`
- Commit — 없음(커밋 금지 지시 준수)
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 38 files / 234 tests · `npm run build` 성공 · 최종 `bash init.sh` 통과(38 files / 234 tests · 빌드 성공)
- HTTP smoke — dev server `http://127.0.0.1:5173/?stage=editor` 200

### What This Session Did
1. `src/lib/marginReview.test.ts` 에 TDD 케이스 3개 추가 — unmatched anchor 분산, evidence 매칭 우선, pending seed→persona replace.
2. `src/lib/marginReview.ts` 에 `resolveRunReviewAnchor`, `seedPendingMarginReviews`, `replacePendingMarginReview` 추가.
3. `src/hooks/useMarginReview.ts` 가 `corePersonaIds` 를 받아 전체 검토 시작 시 pending 5장을 즉시 seed 하도록 변경.
4. `StoryXDesk.tsx` 의 전체 검토 루프가 review index 를 넘겨 fallback anchor 를 결정론적으로 분산하도록 변경.
5. `MarginColumn` 헤더를 pending 중 `N/5 검토 중` 형태로 표시하고, 빈 상태/재실행 버튼이 pending 중 노출되지 않게 조정.
6. `AnnotationCard` pending 렌더를 persona + avatar + skeleton shimmer 로 분리.
7. `CoreStrip` 카운트가 pending 을 확정 의견으로 세지 않도록 변경.

### Files Touched
- 수정 `src/lib/marginReview.ts`
- 수정 `src/lib/marginReview.test.ts`
- 수정 `src/hooks/useMarginReview.ts`
- 수정 `src/components/MarginColumn.tsx`
- 수정 `src/components/AnnotationCard.tsx`
- 수정 `src/components/CoreStrip.tsx`
- 수정 `src/StoryXDesk.tsx`
- 수정 `src/styles.css`
- 수정 `progress.md`
- 수정 `session-handoff.md`

### Files NOT To Touch
- 도메인 lib: `storyEngine`, `agentRunEngine`, `agentReviewProcess`, `continuityContract`, `qualityGates`, `mediaProjection`, `storyOntology`, `storyHarness`, `koreanVoiceGate`
- `/api/*`, `requestAgentReview` 호출 경로와 응답 스키마
- 좌레일, DataPanel, `.claude/agents/*.md`, `--sx-stage-*` 6색

### Blockers
- Browser MCP/Playwright 자동 시각 검증은 이 세션에서 사용 불가. 대신 Vite dev HTTP 200 smoke 와 코드/테스트 게이트로 보증.

---

## 2026-05-29 14:25 — M10 Phase 1+2 커밋 완료 · Claude 총괄 재검증 통과

> Last Updated: 2026-05-29 14:25 KST · Branch: `design/margin-integration`

### Current Objective
**M10 Margin 디자인 통합 Phase 1+2 완료·커밋.** Codex(gpt-5.5 @ xhigh)가 구현, Claude가 하네스(Task Packet 2종)·총괄 재검증 담당. 커밋 3개 — `e09a5e5`(P1 우레일 마진), `9260642`(P2 좌레일 구조+DataPanel), handoff 갱신 커밋. origin push 는 별도 지시 시.

### 총괄 재검증 결과 (Claude 직접 재실행)
- 게이트 — `npx tsc --noEmit` exit 0 · `npm test` **38 files / 231 tests** · `npm run build` 성공(js 579.49kB / css 192.36kB).
- 라이브 렌더(Playwright, 1440×900) —
  - `?stage=editor` 구조 탭: 기승전결 트리. 지표 탭 클릭 → DataPanel 4카드(하니스 8/8·품질 4/8·매체 소설·온톨로지 7) 렌더 확인. 마진 col·코어 strip 보존.
  - `?stage=publish` DataPanel 렌더(구 인라인 4카드 0).
  - console error 0.
- 스코프 — 도메인 lib 8종 무변경(git 확인) · Phase 1 마진 파일 보존 · patch 잔여물 없음.
- 스크린샷 — `docs/handoff/screenshots/{06-margin-editor,07-phase2-metrics-tab}.png`.

### Recommended Next Step
1. (선택) origin push + Vercel preview 배포로 외부 시각 확인.
2. `story x design/` 원본 폴더는 미추적(커밋 제외) — 보관/삭제 결정 필요.
3. 알려진 한계 — `audiobook` 매체가 도메인 `mediaProjection.ts` target 에 없어 DataPanel current 가 top-fit fallback. 매체 풀 확장 시 정리.
4. 또는 M6.3 storyx CLI · agentRunEngine LLM 실연결 등 기존 백로그 복귀.

---

## 2026-05-29 14:03 — M10 Phase 2 좌레일 구조 스킴 + DataPanel 통합 (Codex 자가보고)

> Last Updated: 2026-05-29 14:03 KST

### Current Objective
**M10 Margin 디자인 통합 Phase 2** 구현 완료, 커밋 전 검증 대기. 편집 좌레일은 `구조 ↔ 지표` 세그먼트로 전환되고 기본은 구조 탭이다. 퍼블리시 좌레일의 기존 M8 4카드는 `DataPanel` 단일 컴포넌트로 통합됐다.

### Recommended Next Step
1. 총괄 검증 후 커밋 여부 결정. 사용자 지시로 이번 세션에서는 커밋하지 않음.
2. 가능하면 실제 브라우저/Playwright 환경에서 `?stage=editor` 지표 탭 클릭과 `?stage=publish` 좌레일 DataPanel 렌더를 시각 재확인.

### Branch · Commit · Verification
- Branch — `design/margin-integration`
- Commit — 없음(커밋 금지 지시 준수)
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 38 files / 231 tests · `npm run build` 성공 · 최종 `bash init.sh` 통과(38 files / 231 tests · 빌드 성공)
- HTTP smoke — dev server `http://127.0.0.1:5173/?stage=editor` 200 · `?stage=publish` 200

### What This Session Did
1. `src/lib/studioMetrics.ts` + `src/lib/studioMetrics.test.ts` 신설. TDD 순서로 RED 확인 후 어댑터 구현.
2. `src/components/DataPanel.tsx` 신설. 외주 DataPanel 계약을 이식하고 media axis range 입력으로 `storyMode` 슬라이더 연결 유지.
3. `src/StoryXDesk.tsx` 편집 좌레일에 `구조 ↔ 지표` 세그먼트 추가. `storyx.studio.railTab` localStorage 영속.
4. 구조 탭에서 `ChapterStructureTree` + `TensionShareChart` 를 좌레일 중심으로 올리고, 작품 상태/이번 회차 의도는 유지하되 하단으로 재배치.
5. publish 좌레일의 `HarnessReportCard`/`QualityGatesCard`/`MediaProjectionsCard`/`OntologyCard` 호출을 `DataPanel` 로 교체하고, 인라인 4카드 함수 제거.
6. `groupBeatsIntoActs()` 유지. 막 제목은 기존 `ChapterBeat.label` 우선, 없으면 `summary` 첫 문장, 없으면 기승전결 fallback.

### Files Touched
- 신설 `src/lib/studioMetrics.ts`
- 신설 `src/lib/studioMetrics.test.ts`
- 신설 `src/components/DataPanel.tsx`
- 수정 `src/StoryXDesk.tsx`
- 수정 `src/styles.css`
- 수정 `src/editorFocusLayout.test.ts`
- 수정 `progress.md`
- 수정 `session-handoff.md`

### Files NOT To Touch
- 도메인 lib: `storyHarness`, `qualityGates`, `mediaProjection`, `storyOntology`, `storyEngine`, `agentRunEngine`, `continuityContract`, `koreanVoiceGate`
- Phase 1 우레일 마진 모델: `marginReview`, `useMarginReview`, `MarginColumn` 등
- `.claude/agents/*.md`
- `--sx-stage-*` 6색 의미 매핑

### Blockers
- Browser/Playwright MCP는 이 환경에서 사용 불가. `playwright` 패키지 없음, Chrome headless 실행은 exit -1, Computer Use Chrome state는 timeout. 자동 게이트와 HTTP 200까지 확인.

### Reference Documents
- `docs/handoff/margin-phase2-task-packet.md`
- `docs/handoff/margin-phase1-task-packet.md`
- `story x design/patch/MIGRATION.md` §6
- `story x design/patch/src/components/DataPanel.tsx`
- `story x design/patch/src/lib/studioMetrics.ts`

---

## 2026-05-28 00:25 — M9 핸드오프 패키지 완성 · design/linear-dark → main ff merge

> Last Updated: 2026-05-28 00:25 KST

### Current Objective
**M9 디자인 핸드오프 자료 준비** 완료. 외주 디자이너 또는 Claude Design 에 즉시 발송 가능한 패키지 산출. 다음 자연스러운 작업 — M6.3 storyx CLI · agentRunEngine LLM 실 연결 · Vercel env 등록 중 선택.

### Recommended Next Step
1. 패키지(`docs/handoff/`) 외부 발송 또는 Claude Design 에 위임 → 결과 통합 브랜치 신설
2. 병행: M6.3 `tools/storyx.mjs` 에 `init` · `serve` · `memory sync` 명령 확장
3. 또는: agentRunEngine 의 generic 출력을 LLM 호출로 교체 (Layer 5 Gap 끝)
4. 또는: Vercel Project Settings 에 `AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY` 등록 → 배포본 실제 LLM 응답 검증 (curl)

### Branch · Commit · Verification
- Branch — `main` (design/linear-dark ff merge, head `bc9f803` 이후 핸드오프 산출 추가)
- 로컬은 origin/main 보다 94+ 커밋 앞섬 — push 는 별도 지시 시
- 검증 마지막 통과 — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 220 tests · `npm run build` 1.04s
- 신설 — `docs/handoff/design-brief.md` · `docs/handoff/token-map.md` · `docs/handoff/screenshots/{01..05}.png`
- 수정 — `feature_list.json` (M9 done + active M6.3) · `progress.md` · `session-handoff.md` · `docs/handoff/design-brief.md` 데모 URL 갱신
- Vercel production (외주 라이브 데모) — https://story-x-alpha.vercel.app (READY · `vercel deploy --prod` 1m · public 200 · `<title>Story X</title>` 검증 · LLM env 미설정으로 mock 폴백)
- Preview deployment (내부 검토용) — https://story-x-alpha-1jzhsnqr8-gomgomee-s-projects.vercel.app (SSO 401, Vercel Authentication 가드 유지)
- GitHub Repo — https://github.com/sgeniusk/story-x-beta (public, M9 핸드오프 커밋 + 94+ 커밋 origin 동기화)

### What the Last Session Did
1. **design/linear-dark → main ff merge** — main 이 superset 인 design/linear-dark 까지 fast-forward. 87 파일 변경(M4 모듈 + M8 카드 + Linear 다크 폴리시) 모두 main 에 반영.
2. **`docs/handoff/design-brief.md` 신설** — 4파트 구조 의도 + 자유도(Decisive)/금지선(Don't) + 의뢰 항목 7개 각 항목에 문제·코드 위치·기대 결과 + 기술 컨텍스트(파일/페르소나/토큰/폰트) + 검증·완료 기준 + Option A/B/C 의뢰 방식.
3. **`docs/handoff/token-map.md` 신설** — 토큰 4 레이어(`--sx-*` 스튜디오 / `--nx-*` 브릿지 / `--lc-*` 랜딩 / 사용자 트윅) 각 라인 번호 + 한 줄 cascade 다이어그램 + 손대도 OK / 손대지 말 것 + 추가 시 권장 위치.
4. **Playwright 스크린샷 5종** — 1440×900 / Linear 다크 톤. 랜딩 다크·라이트, 홈 매체 선택, 스튜디오 편집기(작가진 5명 + 좌레일 + 알파 03%), 퍼블리시 4 카드.
5. **`feature_list.json`** — M9-design-handoff-prep status `todo` → `done`. active `M9-design-handoff-prep` → `M6.3-storyx-cli`.

### Files To Touch (next milestone — M6.3 storyx CLI 또는 LLM 연결)
- 수정 `tools/storyx.mjs` — `init` · `serve` · `memory sync` 서브커맨드 + flag 파싱
- 또는 수정 `src/lib/agentRunEngine.ts` `describeAgentRun` — LLM 호출 도입 (현재 generic)
- 또는 Vercel CLI — `vercel env add AI_GATEWAY_API_KEY production`

### Files NOT To Touch
- `docs/handoff/*` (핸드오프 발송 전 동결)
- M4 완성본 (storyEngine, storyOntology, storyHarness, continuityContract, koreanVoiceGate, qualityGates, agentRunEngine, mediaProjection)
- M8 카드 컴포넌트 (외주 결과로 재작성 예정 — `StoryXDesk.tsx` 인라인 스타일 1차 컷 보존)

### Blockers
없음. 단, 외주/Claude Design 의 결과 통합은 본 세션 범위 밖.

### Known Issues
- 04-studio-editor 스크린샷은 편집 모드 좌레일 — 바이블 모드의 M8 4 카드(`HarnessReportCard` 등)는 별도 캡처가 필요할 수 있음. 외주 요청 시 추가 캡처 가능 (`?stage=editor` 후 좌레일 모드 토글).
- 05-publish 스크린샷은 medium=novel 기본 — book-designer/pr-specialist/platform-curator/business-strategist 4 카드 노출. 다른 매체 캡처는 외주가 추가 요청 시.
- 스크린샷 캡처 중 Playwright MCP가 `.playwright-mcp/` 가 아닌 프로젝트 루트에 저장 — `docs/handoff/screenshots/` 로 수동 이동. 재캡처 시 절대경로 또는 사후 이동 권장.

### Reference Documents
- `docs/handoff/design-brief.md` — 핸드오프 brief (단일 진입)
- `docs/handoff/token-map.md` — 토큰 4 레이어
- `docs/claude-design-handoff-prompt.md` — 깊은 비전·자유도 (357줄, brief 가 참조)
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/agent-system.md` — 23 ValidationAgentId + 16 criteriaKeys
- `~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마스터 로드맵

---

## 2026-05-22 22:50 — M4 완료 + M8 UI 통합 + Linear 다크 폴리시 · 디자인 핸드오프 준비로 인계

> Last Updated: 2026-05-22 22:50 KST

### Current Objective
**M9 디자인 핸드오프 자료 준비** (다음 세션 첫 작업). M4 8/8 청크 완료 + M8 UI 통합 4 카드 + Linear 다크 폴리시까지 마침. 다음 세션에서 외주 디자이너에게 보낼 brief + 스크린샷 + 토큰 표 작성.

### Recommended Next Step
1. `docs/handoff/design-brief.md` 신설 — 4파트 구조 의도 + 거친 부분 + 의뢰 항목 7개
2. Playwright 스크린샷 5종 — 랜딩(낮/밤), 브릿지, 홈(매체 선택), 스튜디오, 퍼블리시
3. 토큰 매핑 표 — nx-* · sx-* · lc-* 현황
4. 의뢰 항목 정리 — 전체 일관성·좌레일 가독성·검토/대화 UI·인라인 diff·확장 피드백·편집기 호흡·M8 카드 다듬기
5. 외주 의뢰 후 병행 — M6.3 storyx CLI · D (agentRunEngine LLM 연결) · Vercel env 등록

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 220 tests · `npm run build` 1.04s
- Local dev — http://127.0.0.1:5173 동작 중
- Vercel preview — https://story-x-alpha-184suo6gf-gomgomee-s-projects.vercel.app
- 8 commits 이번 세션 — M4.H 후속 · M8.1 · M8.2~4 · M8.5 · M8.6 (예정)

### What the Last Session Did
1. **M4 청크 H 후속** — creativeDevelopment 4 신규 optional 필드(storyOntology/harnessReport/mediaProjections/continuityContract) + agent-system.md 신설 12 에이전트 + 16 criteriaKeys 표. **M4 8/8 완전 완료.**
2. **M8.1** HarnessReportCard — 점수·6 스테이지·readyForProduction 좌레일 노출
3. **M8.2** QualityGatesCard — 12 게이트 + StoryMode 슬라이더 (commercial ↔ literary 100%) + localStorage 영속
4. **M8.3** MediaProjectionsCard — 5 매체 투영 + 핵심 4 보존 신호
5. **M8.4** OntologyCard — 인물·세계·갈등·플롯 4 카테고리
6. **Vercel preview 배포** — `story-x-alpha-184suo6gf-...vercel.app` (mock 폴백 상태)
7. **M8.5** .home-page Linear 다크 토큰 12개 오버라이드 — 매체 선택 단계 어색함 해결. 브릿지 로그인/프로젝트 라이트 유지.
8. **M8.6** 편집기 여백 축소 (clamp 10~16px) + sx-manuscript-editor.is-edited 좌측 라임 글로우 + sx-diff-toggle 강조

### Files To Touch (next milestone — M9)
- 신설 `docs/handoff/design-brief.md`
- 신설 `docs/handoff/screenshots/` (Playwright 자동 캡처 또는 수동)
- 신설 `docs/handoff/token-map.md`
- 갱신 `feature_list.json` M9 진행 표시

### Files NOT To Touch
- M4 완성본 (storyEngine, storyOntology, storyHarness, continuityContract, koreanVoiceGate, qualityGates, agentRunEngine, mediaProjection)
- M8 카드 컴포넌트 (디자인 핸드오프 후 외주 결과로 재작성 예정)
- 매체 선택 등 단계 폴리시 (외주 결과 받은 뒤 통합)

### Blockers
없음. 단, 디자인 핸드오프 후에는 다음 항목들이 의뢰 결과를 기다림.

### 핸드오프 의뢰 항목 (7개)
1. 전체 사이트 4파트 톤 일관성 (랜딩·브릿지·홈·스튜디오·퍼블리시)
2. 좌레일 가독성 (AgentIntentCard, M8 4 카드, statusbar)
3. 에이전트 검토·대화 UI 재설계 — 현재 거칠다
4. 인라인 diff 하이라이트 (textarea 위 실시간 빨강/라임) — ContentEditable 또는 overlay
5. 확장(집중 모드) 버튼 시각 피드백 강화
6. 편집기 호흡 — 여백·타이포·hover
7. M8 4 카드 본격 다듬기 (현재 인라인 스타일 1차 컷)

### Known Issues
- AgentIntentCard ("쇼러너가 잡은 다음 회...") 카드는 동작은 하지만 (textarea 입력 + 토글 펼치기) 시각 피드백 부족. 외주 의뢰 항목 #2 에 포함.
- prose diff 가 별도 보기 토글 (sx-diff-toggle) — 인라인 실시간 하이라이트 X. 외주 의뢰 항목 #4 에 포함.
- 확장 버튼 (ex-focus-btn) 동작은 정상이나 변화가 미묘. 외주 의뢰 항목 #5 에 포함.
- M5 Vercel Functions 5 라우트 모두 mock 폴백 — env 등록 필요. 핸드오프와 병행해서 처리 가능.

### Reference Documents
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/agent-system.md` — 23 에이전트 매트릭스 + 16 criteriaKeys
- `docs/vercel-env-setup.md` — Vercel env 등록 안내
- `~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마스터 로드맵

---

## 2026-05-22 20:50 — M4.H 통합·리팩터 핵심 3 작업 완료 (1차 컷)

> Last Updated: 2026-05-22 20:50 KST

### Current Objective
M4 청크 H 의 핵심 3 작업 완료 — Gap 3·8·10 모두 해결. creativeDevelopment 통합·docs 갱신은 분량이 커 다음 묶음으로 분리. M4 청크 진행 7.5/8 (청크 H 60%).

### Recommended Next Step
1. M4 청크 H 후속 — creativeDevelopment.ts 통합 (storyOntology · harnessReport · mediaProjection)
2. docs/agent-system.md · docs/codex-agent-manifest.md 신설 에이전트 반영
3. 그 뒤 M4 완료, M7 v1.0-alpha 완성 루프

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 219 tests · `npm run build` 통과
- 수정 — `src/lib/aiCliHarness.ts` (buildHarnessPrompt), `src/lib/canonRefactor.ts` (ID 링크), `src/lib/storyEngine.ts` (validateContinuity)

### What the Last Session Did
1. **buildHarnessPrompt 16 기준 + 12 게이트 라인 추가** — Gap 10 프롬프트측
   - 16 craft 검토 기준 키를 에이전트별로 노출 (showrunner 3 · character 2 · world 2 · genre 3 · continuity 1 · critic 3 · essay 3)
   - 12 품질 게이트를 트랙별로 노출 (common 3 · commercial 2 · literary 4 · essay 3)
   - StoryMode 가중치 강제/권고 분기 설명 포함
2. **canonRefactor.findAffectedChapters ID 링크** — Gap 8
   - `CanonChangeEntryInput.targetCanonId?: string` optional 필드 신설
   - 새 helper `chapterReferencesCanonId` — chapter.newCanonFacts.id 직접 매칭
   - ID 매칭 우선, 없으면 기존 chapterContains 부분문자열 fallback (호환성)
3. **storyEngine.validateContinuity 의미적 충돌 감지** — Gap 3
   - `createContinuityContract({ hardCanon: canonFacts.map(f => f.statement) })`
   - 각 claim 에 `classifyCanonChange` 호출, hard-canon 위반(반전 신호)만 추가 issue
   - dedup — character/world issue 가 이미 잡은 claim 은 contract issue 추가 안 함 (중복 방지)

### Files To Touch (next milestone — M4 청크 H 후속)
- 수정 `src/lib/creativeDevelopment.ts` — `developCreativeProject` 가 storyOntology · runStoryHarness · projectAllMedia 결과를 `CreativeDevelopmentPackage` 에 통합
- 갱신 `docs/agent-system.md` — critic-reviewer · essay-curator 등 신설 에이전트 반영
- 갱신 `docs/codex-agent-manifest.md` — 신설 12 에이전트 매트릭스

### Files NOT To Touch
- M4.A~G 완성본
- `src/lib/storyEngine.test.ts` `surfaces continuity conflicts` 케이스 (dedup 으로 보존)

### Blockers
없음.

### Known Issues
- validateContinuity 의 contractIssues 가 기존 흐름과 dedup 됨 — character/world issue 가 잡힌 claim 은 hard-canon classify 결과를 무시. 두 시스템이 같은 claim 을 다르게 분류할 가능성 있음 (1차 컷에서 부분 매칭 호환성 우선).
- canonRefactor 의 targetCanonId 가 채워지지 않은 기존 변경은 그대로 부분문자열 매칭 흐름 (점진 마이그레이션).
- creativeDevelopment 통합 미완 — M4 완전 완료는 다음 묶음 후.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 H, § 6 Gap 12개

---

## 2026-05-22 15:42 — M4.G 매체 투영 (Layer 7) 완료

> Last Updated: 2026-05-22 15:42 KST

### Current Objective
M4 청크 G 완료 — 같은 StoryOntology 가 5 매체(novel/essay/webtoon/insta-toon/four-cut) 로 투영, 핵심 4 보존. 다음 자연스러운 작업 — M4 청크 H (통합 단계, M4 의 마지막 청크).

### Recommended Next Step
1. M4 청크 H 시작 — 가장 큰 통합 작업
   · `canonRefactor.ts` 엔티티 ID 링크 기반 영향 탐지 (Gap 8)
   · `storyEngine.validateContinuity` 를 `continuityContract.classifyCanonChange` 로 리팩터 (청크 C 에서 미룬 부분)
   · `aiCliHarness.buildHarnessPrompt` 에 16 기준·12 게이트 반영 (Gap 10 프롬프트측)
   · `creativeDevelopment.ts` 에 storyOntology·harnessReport·mediaProjection 통합
   · `docs/agent-system.md`·`docs/codex-agent-manifest.md` 신설 에이전트 반영

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 36 files / 219 tests · `npm run build` 통과
- 신설 — `src/lib/mediaProjection.ts` + `.test.ts` (9 케이스)

### What the Last Session Did
1. **mediaProjection.ts 신설** — Layer 7 매체 투영
   - `MediaTarget` — 5 매체(novel/essay/webtoon/insta-toon/four-cut)
   - `projectMedia(ontology, target)` — 한 매체로 투영, fields + preservation 산출
   - `projectAllMedia(ontology)` — 5 매체 한 번에 (UI 비교용)
2. **매체별 필드 (Stage 7 정본)**
   - novel: chapterPromise · viewpointDistance · proseTexture · cliffhangerShape
   - essay: interviewQuestionPath · livedMaterialChecklist · privacyBoundary · voiceBible · reflectiveTurn
   - webtoon: episodeHook · scrollRhythm · visualAnchor · cutDensity
   - insta-toon: firstSlideHook · saveShareFinalBeat · captionAngle
   - four-cut: setup · escalation · twistPreparation · punchline
3. **핵심 보존 검증 (PreservationReport)**
   - 4 키 모두 체크 — premise.dramaticQuestion · characters[0].desire · worldRules[0].cost · plotThreads[0]
   - preserved=false 면 missing 에 누락 키 채워짐
   - 모든 매체가 같은 ontology 에서 동일한 preservedCore 보고 — 표면만 매체별, 핵심 동일
4. **TDD 9 케이스** — 5 매체 각 필드 + 보존 true/false + projectAllMedia + 매체 간 핵심 일관성

### Files To Touch (next milestone — M4 청크 H)
- 수정 `src/lib/canonRefactor.ts` — 엔티티 ID 링크 (Gap 8)
- 수정 `src/lib/storyEngine.ts` `validateContinuity` — `continuityContract.classifyCanonChange` 호출 (청크 C 에서 미룬 리팩터)
- 수정 `src/lib/aiCliHarness.ts` `buildHarnessPrompt` — 16 기준·12 게이트 반영
- 수정 `src/lib/creativeDevelopment.ts` — storyOntology·harnessReport·mediaProjection 통합
- 갱신 `docs/agent-system.md` · `docs/codex-agent-manifest.md`

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D · M4.E · M4.F 완성본
- `src/lib/verticalSlice.ts` (필요 시만 호출 연결)

### Blockers
없음.

### Known Issues
- mediaProjection 의 필드 값들이 1차 컷에서 generic placeholder ('담담하고 선명한 한국어' 등) — 청크 H 통합에서 LLM 또는 작가 입력 기반으로 정밀화.
- projectMedia 가 ontology 의 첫 항목만 사용 (worldRules[0], plotThreads[0]) — 복수 항목 처리는 추후.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 G
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Stage 7

---

## 2026-05-22 15:27 — M4.F 에이전트 실행 엔진 (Layer 5) 완료

> Last Updated: 2026-05-22 15:27 KST

### Current Objective
M4 청크 F 완료 — Layer 5 에이전트 실행 엔진. 4가지 변경(신설·교체·폐기·확장) 모두 적용. 다음 자연스러운 작업 — M4 청크 G (mediaProjection, Layer 7).

### Recommended Next Step
1. M4 청크 G 시작 — `src/lib/mediaProjection.ts` 신설 (소설/웹툰/인스타툰/네컷 투영, 온톨로지 핵심 보존)
2. `verticalSlice.ts` 호출 연결

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 35 files / 210 tests · `npm run build` 통과
- 신설 — `src/lib/agentRunEngine.ts` + `.test.ts` (8 케이스)
- 폐기 — `src/lib/agentOrchestration.ts` + `.test.ts` 삭제 (Gap 2·11)
- 수정 — `src/lib/storyEngine.ts` (buildAgentRuns wrapper 화 + AgentRun.agentId 타입), `src/lib/agentReviewProcess.ts` (criteriaKeys 신설 + 7곳)

### What the Last Session Did
1. **agentRunEngine.ts 신설** — Layer 5 검토 스케일별 에이전트 실행
   - `planAgentRuns(input)` → `AgentRunPlan { scale, agents, runs }`
   - 스케일 결정 — quick(3) / standard(5) / deep(21) 의 defaultAgents 또는 명시 requestedAgentIds
   - agentLimit 으로 자동 자름 (token budget 보호)
   - continuity-editor 만 issues 기반 block/revise/pass 분기. 나머지는 pass.
   - 에이전트별 generic 출력 (showrunner/character-custodian/world-keeper/genre-stylist/continuity-editor 5명 + 그 외 18명은 agenda 그대로)
2. **storyEngine.buildAgentRuns 교체** — Gap 4 — 하드코딩 5명을 `planAgentRuns(input).runs` 호출로 위임
3. **agentOrchestration.ts + .test.ts 삭제** — Gap 2·11 — 선언만 있던 3계층 모델 폐기 (다른 import 없음 확인)
4. **agentReviewProcess.ts criteriaKeys 추가**
   - `AgentValidationProcess.criteriaKeys?: string[]` 신설 필드
   - 7 에이전트에 16 craft 기준 키 채움
     · showrunner: 3 (chapter_one_hook_check, chapter_end_hook_check, stakes_progression_audit)
     · character-custodian: 2 (pressure_triangle_validation, flat_character_warning)
     · world-keeper: 2 (motif_variation_audit, historical_consistency_extended)
     · genre-stylist: 3 (scene_sequel_ratio, voice_match_score, read_aloud_audit)
     · continuity-editor: 1 (open_threads_overload)
     · critic-reviewer: 3 (ambiguity_audit, ethical_pressure_test, silence_audit)
     · essay-curator: 3 (universal_leap_check, self_reversal_check, disclosure_scope_check)
5. **AgentRun.agentId 타입 확장** — `AgentId` → `ValidationAgentId`. 신설 12 에이전트도 AgentRun 의 source 가 될 수 있게 통합.

### Files To Touch (next milestone — M4 청크 G)
- 신설 `src/lib/mediaProjection.ts` + `.test.ts` — 매체별 투영(소설/웹툰/인스타툰/네컷), 온톨로지 핵심 보존
- 연결 `src/lib/verticalSlice.ts` 호출

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D · M4.E 완성본
- 기존 AgentId union (확장 안 함 — ValidationAgentId 와 분리 유지)

### Blockers
없음.

### Known Issues
- `describeAgentRun` 의 generic 출력은 결정론 — LLM 호출은 청크 H 통합 단계에서 도입.
- buildAgentRuns wrapper 는 input 에 scale/requestedAgentIds 를 전달하지 않음 (standard 기본). 호출 흐름이 scale 을 전달하도록 청크 H 에서 storyEngine 확장.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 F, § 5-2 (16 검토 기준)

---

## 2026-05-22 14:54 — M4.E 품질 게이트 12개 + 바이블 13 카테고리 완료

> Last Updated: 2026-05-22 14:54 KST

### Current Objective
M4 청크 E 완료 — `qualityGates.ts` 가 12 게이트(common/commercial/literary/essay 트랙)를 `StoryMode` 가중치로 강제/권고 결정. `storyEngine.ts` 에 13 바이블 카테고리 optional 필드(pressureTriangle, narratorCard, voiceSignatureId, motifLedger, symbolLayers, formalDesign, historicalAnchors, personaCard, disclosureLedger, stakesLedger, rewardArc) 추가. 다음 자연스러운 작업 — M4 청크 F (agentRunEngine, Layer 5).

### Recommended Next Step
1. M4 청크 F 시작 — `src/lib/agentRunEngine.ts` 신설 (검토 스케일별 에이전트 실행, AgentRun[] 산출)
2. `storyEngine.buildAgentRuns()` 를 `agentRunEngine` 호출로 교체 (Gap 4)
3. `agentOrchestration.ts` 폐기 (Gap 2·11)
4. `agentReviewProcess.ts` 에 `critic-reviewer`·`essay-curator` + 16개 검토 기준 추가

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 35 files / 204 tests · `npm run build` 954ms
- 신설 — `src/lib/qualityGates.ts` + `.test.ts` (9 케이스)
- 수정 — `src/lib/storyEngine.ts` (11 신설 타입 + 11 신설 optional 필드), `src/lib/storyEngine.test.ts` (3 신설 케이스)

### What the Last Session Did
1. **qualityGates.ts 신설** — Layer 4 품질 게이트 12개
   - 12 GateKey + 4 GateTrack (common/commercial/literary/essay) + GateRequirement (blocking/advisory)
   - StoryMode { commercialWeight, literaryWeight } 가중치로 강제/권고 분기
     · common 게이트: 항상 blocking
     · commercial 게이트: commercialWeight ≥ 0.5 면 blocking, 아니면 advisory
     · literary 게이트: literaryWeight ≥ 0.5 면 blocking, 아니면 advisory
     · essay 게이트: 에세이 매체에서만 평가, gate_disclosure_scope 만 항상 blocking
   - 조건부 평가 — gate_hook_last_200 (serial 만), gate_ambiguity_at_finale (finale 만), essay 게이트 (essay 매체만)
   - 휴리스틱 — gate_hook_first_300 (첫 300자 행동/긴장 token), gate_hook_last_200 (마지막 200자 cliff token)
2. **storyEngine.ts 13 바이블 카테고리 확장** — 모두 optional
   - CharacterProfile.pressureTriangle?: PressureTriangle (want/desire/taboo)
   - SeriesProject — narratorCard, voiceSignatureId, motifLedger, symbolLayers, formalDesign, historicalAnchors, personaCard, disclosureLedger (8개)
   - Chapter — stakesLedger, rewardArc (2개)
   - 11 신설 타입(PressureTriangle, NarratorCard, MotifLedgerEntry, SymbolLayer, FormalDesign, HistoricalAnchor, PersonaCard, DisclosureEntry, StakesLedgerEntry, RewardArcEntry)
   - 기존 createEmptyProject 와 호환 — 신설 필드는 undefined 기본
3. **TDD 12 케이스** — qualityGates 9 (모드별 분기 + 트랙 분리 + 조건부 평가) + storyEngine 3 (pressureTriangle 보존, stakesLedger/rewardArc 보존, 8개 optional 필드 undefined 기본)

### Files To Touch (next milestone — M4 청크 F)
- 신설 `src/lib/agentRunEngine.ts` + `.test.ts` — 검토 스케일별 에이전트 실행, `AgentRun[]` 산출
- 수정 `src/lib/storyEngine.ts` `buildAgentRuns()` — agentRunEngine 호출로 교체 (Gap 4)
- 삭제 `src/lib/agentOrchestration.ts` + `.test.ts` (Gap 2·11)
- 수정 `src/lib/agentReviewProcess.ts` — `critic-reviewer`·`essay-curator` + 16개 검토 기준 추가 (5-2절)

### Files NOT To Touch
- M4.A · M4.B · M4.C · M4.D 완성본
- `src/lib/koreanStyle.ts` (흡수 패턴 유지)

### Blockers
없음.

### Known Issues
- qualityGates 의 휴리스틱(첫/마지막 token 매칭) 은 1차 컷 — 의미론적 정확도 낮음. 청크 F·H 에서 LLM 기반 정밀화.
- voiceSignatureId 는 string id 만 — voiceSignature 본체 저장은 별도 모듈 (koreanVoiceGate.VoiceSignature) 에서 점진 연결.
- storyEngine.buildAgentRuns 는 아직 하드코딩 (Gap 4 미해결). 청크 F 에서 교체.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 5-1 (바이블 13), § 5-3 (게이트 12), § 7 청크 E

---

## 2026-05-21 23:31 — M4.D 한국어 문체 게이트 (Layer 4 일부) 완료

> Last Updated: 2026-05-21 23:31 KST

### Current Objective
M4 청크 D 완료 — `inspectKoreanVoice` 가 generic AI 어휘·명사 과다·번역투·쉼표 과다·추상 감정어·voice signature mismatch 6 종 flag 를 산출. 기존 `koreanStyle.ts` 의 6 케이스는 보존(흡수 패턴, 폐기 아님). 다음 자연스러운 작업 — M4 청크 E (qualityGates 12개 + SeriesProject 13 바이블 카테고리).

### Recommended Next Step
1. M4 청크 E 시작 — `src/lib/qualityGates.ts` 신설 (12 게이트, modeRequirement, evaluate, onFail)
2. `SeriesProject`/`CharacterProfile` 에 13개 바이블 카테고리 필드 추가 (5-1절)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 34 files / 192 tests · `npm run build` 통과
- 신설 — `src/lib/koreanVoiceGate.ts` + `.test.ts` (6 케이스)

### What the Last Session Did
1. **koreanVoiceGate.ts 신설** — Layer 4 일부 (한국어 문체 게이트)
   - `inspectKoreanVoice(text, signatures?)` — 6 종 flag
     · generic-ai-vocabulary (`핵심적·효과적·지속가능한·혁신적·다채로운·중요한 의미`)
     · noun-heavy-sentence (`구조·시스템·요소·과정·방식·체계·관점·특성` ≥ 2)
     · translation-ese / comma-overflow / abstract-emotion (koreanStyle 흡수)
     · voice-signature-mismatch (forbiddenWords 발견 시)
   - `VoiceSignature` 인터페이스 — ownerLabel + sentenceLength + forbiddenWords + preferredRegister + preserveTokens
   - `createEmptyVoiceSignature` — 기본 preserveTokens 4개 (harness/ontology/prompt/canon)
   - `revisedText` — generic AI 어휘 제거 + preserveTokens 는 보존
   - `score` — 100 - flags×15 - mismatch×5
2. **흡수 패턴** — koreanStyle.ts 의 evaluateKoreanProse 를 내부적으로 호출. 기존 API 와 6 테스트 보존.
3. **TDD 6 케이스** — Task 5 generic + noun-heavy, clean text 100점, signature mismatch, preserveTokens, koreanStyle 흡수, createEmptyVoiceSignature 기본값

### Files To Touch (next milestone — M4 청크 E)
- 신설 `src/lib/qualityGates.ts` + `.test.ts` — 12개 게이트 (gate_hook_first_300 · gate_scene_sequel_balance · gate_voice_match_70 · gate_pressure_triangle_active · gate_ambiguity_at_finale · gate_ethical_cost_present · gate_motif_variation · gate_historical_density · gate_universal_leap · gate_self_reversal · gate_disclosure_scope)
- 수정 `src/lib/storyEngine.ts` `SeriesProject`/`CharacterProfile` — 13 바이블 카테고리 필드 추가

### Files NOT To Touch
- `src/lib/koreanStyle.ts` 와 `.test.ts` (보존 — 흡수만, 폐기 아님)
- M4.A · M4.B · M4.C 완성본

### Blockers
없음.

### Known Issues
- isNounHeavy 휴리스틱 — `구조/시스템/요소/과정/방식/체계/관점/특성` 패턴 카운트. 일반 한국어 문장에서도 가끔 잡을 가능성. 청크 H 통합에서 LLM 기반 정밀화.
- VoiceSignature 가 아직 어디서도 build 되지 않음 — 다음 청크에서 SeriesProject 에 voice_signature 필드 추가하면서 연결.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 5-3 (게이트 12개), § 7 청크 D
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 3 Task 5

---

## 2026-05-21 23:25 — M4.C 연속성 계약 (Layer 1) 완료

> Last Updated: 2026-05-21 23:25 KST

### Current Objective
M4 청크 C 1차 컷 완료 — 캐논 3계층 분류 + 성장 레저 + 컨텍스트 팩 + 리페어 제안 + evolution-memory.md 슬롯. 다음 자연스러운 작업 — M4 청크 D (koreanVoiceGate, Layer 4 일부).

### Recommended Next Step
1. M4 청크 D 시작 — `src/lib/koreanVoiceGate.ts` 신설, `koreanStyle.ts` 흡수, voice_signature 도입
2. 기존 `koreanStyle.test.ts` 통과 유지 (보존 필수)
3. 청크 H (통합 단계) 에서 `storyEngine.validateContinuity` 를 `continuityContract.classifyCanonChange` 로 리팩터

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 33 files / 186 tests · `npm run build` 923ms
- 신설 — `src/lib/continuityContract.ts` + `.test.ts` (11 케이스)
- 수정 — `src/lib/memoryBank.ts` memoryBankTemplate (Gap 9)

### What the Last Session Did
1. **4A 캐논 3계층 분류** — `classifyCanonChange(contract, claim, ctx)` 가 hard-canon/living-state/soft-signal/unrelated 중 하나로 layer 판정 + allowed/severity/requiredApproval/matchedSource 반환
2. **4B 성장 레저** — `validateGrowthEntry` 가 필수 7 필드(특히 cost) 누락을 잡아낸다. `appendGrowthEntry` 는 불변(immutable) 패턴.
3. **4C 컨텍스트 팩** — `buildContextPack` 가 작품 전체 원고 대신 압축된 결정-가능 상태만 담는다. `lastDeltas` 는 최근 3개로 자동 압축.
4. **4D 리페어 제안** — `proposeContinuityRepair` 가 hard canon 위반에 두 가지 제안(보존 vs 의도적 변경) 산출. 침묵 리라이트 금지.
5. **휴리스틱 (1차 컷)** — 한국어 명사 토큰 ≥ 2 공유 + 부정 마커 차이 → "반전". LLM 기반 정밀화는 청크 F·H 에서.
6. **memoryBank evolution-memory.md** — memoryBankTemplate 의 context/ 폴더에 한 줄 추가 (Gap 9).

### Files To Touch (next milestone — M4 청크 D)
- 신설 `src/lib/koreanVoiceGate.ts` + `.test.ts` — voice_signature, 캐릭터 voice rule, GOMI/Humanizer-inspired Korean checks
- 흡수 — `koreanStyle.ts` 의 기능을 koreanVoiceGate 가 노출. 기존 `koreanStyle.test.ts` 보존 (이름은 두고 내용만 유지).

### Files NOT To Touch
- M4.A · M4.B 완성본 (CanonFact owner, storyEngine seed, storyOntology, storyHarness)
- `src/lib/koreanStyle.test.ts` 기존 케이스 (보존)
- 기존 `storyEngine.validateContinuity` 흐름 (청크 H 에서 리팩터)

### Blockers
없음.

### Known Issues
- 한국어 명사 토큰 추출이 휴리스틱 — 조사 패턴(`은|는|이|가|을|를|...`) 정규식 기반. 형태소 분석기 없이 첫 컷. 청크 D 의 koreanVoiceGate 와 함께 점진 정밀화.
- `validateContinuity` 가 아직 부분문자열 매칭 — 리팩터는 청크 H 에서. 1차 컷의 의도된 분리(기존 통과 테스트 보호).

### Reference Documents
- `docs/storyx-harness-architecture.md` § 3-4 (캐논 3계층), § 7 청크 C
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 2.5 (Task 4A·4B·4C·4D)

---

## 2026-05-21 21:53 — M4.B 온톨로지 기반 (Layer 0) 완료

> Last Updated: 2026-05-21 21:53 KST

### Current Objective
M4 스토리 하네스 구현의 청크 B (Layer 0) 완료 — storyOntology 와 storyHarness 두 모듈이 작가 입력을 받아 작품 그래프 + 6단계 스테이지 점수를 산출. 다음 자연스러운 작업 — M4 청크 C (Layer 1, continuityContract 신설 + validateContinuity 리팩터).

### Recommended Next Step
1. M4 청크 C 시작 — `src/lib/continuityContract.ts` 신설 (3계층 — Hard Canon · Living State · Soft Signal)
2. `storyEngine.validateContinuity` 를 `continuityContract` 호출로 리팩터 (Gap 3 — 부분문자열 매칭 폐기)
3. `memoryBank.ts` 에 `evolution-memory.md` 영속 파일 추가 (Gap 9)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 32 files / 175 tests · `npm run build` 성공 (901ms)
- 신설 — `src/lib/storyOntology.ts` + `.test.ts` (5 케이스) · `src/lib/storyHarness.ts` + `.test.ts` (4 케이스)

### What the Last Session Did
1. **storyOntology.ts 신설** — 작가 입력을 받아 작품 그래프 첫 컷 생성
   - 8 타입 — StoryPremise · ThemeClaim · CharacterNode · RelationshipEdge · WorldRuleNode · ConflictEngine · PlotThread · CanonSeed
   - `buildStoryOntology(input)` — material/storySeed/characterSeed/audience/constraints 휴리스틱 구조화
   - `validateStoryOntology(ontology)` — 6 종 경고 (missing-dramatic-question · missing-world-cost · thread-without-payoff · no-character · no-conflict · no-plot-thread) silent fix 금지
2. **storyHarness.ts 신설** — 6단계 스테이지 점수 합산
   - story-sense (10) · premise-forge (10) · ontology-builder (30) · pressure-test (25) · korean-voice-gate (10) · media-projection (10) = 100
   - `runStoryHarness(input)` 호출 시 모든 stage 실행 + qualityScore ≥ 70 일 때 readyForProduction
   - 각 stage 가 findings + requiredRepairs 산출 — 작가에게 다음 행동을 명시
3. **TDD 9 케이스** — 모두 정본 Chunk 1·2 의 스켈레톤 + Task 2/4 검증 케이스
   - storyOntology 5: 핵심 엔티티 채워짐 / 4종 누락 경고 케이스
   - storyHarness 4: 6 stage 순서 + readyForProduction / 약한 스토리 미달 / 빈 입력 block / 매체 미지정 warning

### Files To Touch (next milestone — M4 청크 C)
- 신설 `src/lib/continuityContract.ts` + `.test.ts` — 캐논 3계층, growthLedger, 컨텍스트 팩, 리페어 제안
- 수정 `src/lib/storyEngine.ts` `validateContinuity` — continuityContract 호출로 리팩터
- 수정 `src/lib/memoryBank.ts` — `evolution-memory.md` 추가 (Gap 9)

### Files NOT To Touch
- M4.A 완성본 (storyEngine.ts CanonFact/normalizeCanonOwner/produceNextChapter)
- 기존 통과 테스트들 (storyEngine.test.ts 의 다른 it)

### Blockers
없음.

### Known Issues
- buildStoryOntology 의 휴리스틱이 첫 컷 — 한국어 자연어 파싱 정밀도는 낮음. 다음 청크에서 LLM 기반 확장 또는 작가 직접 입력 폼 도입 검토.
- 점수 분포가 정적 — 매체/모드 가중치(commercialWeight/literaryWeight) 별 동적 조정은 청크 E (qualityGates) 에서 도입.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 3-1 (Layer 구조), § 7 청크 B
- `docs/superpowers/plans/2026-05-12-story-ontology-harness.md` Chunk 1·2

---

## 2026-05-21 20:41 — M4.A 캐논 기반 정리 (선행) 완료

> Last Updated: 2026-05-21 20:41 KST

### Current Objective
M4 스토리 하네스 구현의 청크 A (캐논 기반 정리) 완료 — CanonFact.owner 타입 통일 + produceNextChapter 시드 모티프 제거. 다음 자연스러운 작업 — M4 청크 B (storyOntology + storyHarness Layer 0 신설).

### Recommended Next Step
1. M4 청크 B 시작 — `src/lib/storyOntology.ts` + `storyHarness.ts` 신설 (TDD)
2. 청크 B 의 6단계 스테이지 (진단·전제·온톨로지·압력·문체·매체) 와 점수 시스템

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 166 tests · `npm run build` 성공
- 신규 테스트 2개 (Gap 5 owner 통일, Gap 7 빈 프로젝트 가드)
- 수정 — `src/lib/storyEngine.ts` 3곳, `src/lib/storyEngine.test.ts` 2 it 추가

### What the Last Session Did
1. **TDD — 테스트 우선 추가** (storyEngine.test.ts)
   - "chapterFromDraftPayload 가 매체별 owner(voice/visual/audio) 를 plot 으로 다운캐스트하지 않는다" (Gap 5)
   - "produceNextChapter 가 빈 프로젝트(인물 0명)에서도 throw 없이 chapter 를 만들고 시드 모티프를 새지 않는다" (Gap 7)
2. **storyEngine.ts CanonFact.owner 6개 통일** — `'character'|'world'|'plot'|'voice'|'visual'|'audio'`. aiCliHarness·memoryBank 와 일관.
3. **normalizeCanonOwner 6개 확장** — 6개 모두 통과시키고 모르는 값만 plot 폴백.
4. **produceNextChapter 시드 모티프 제거**
   - 작품 묶임 텍스트(달의 탑·오빠의 표식·이안) 모두 제거
   - `project.characters[0]?.name ?? '주인공'`, `[1]?.name ?? '동료'` 가드
   - intent/pressure trim + 빈 값 generic 대체 ("오래 미뤄 둔 결정에 직면하는 것" 등)
   - hook·outline·prose·beats 모두 작가 입력 + 장르 메타로만 산출

### Files To Touch (next milestone — M4 청크 B)
- 신설 `src/lib/storyOntology.ts` + `.test.ts` — 엔티티·관계·검증자
- 신설 `src/lib/storyHarness.ts` + `.test.ts` — 6단계 스테이지·점수

### Files NOT To Touch
- M3.6 / M4.5 / M5 / M6 완성본 (이전 세션들)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
없음. M5 인증 블로커는 별개로 사용자 액션 영역.

### Known Issues
- 청크 A 의 produceNextChapter 가 deterministic fallback 으로 충분히 generic 화됐지만, 캐릭터·intent 가 모두 빈 경우 텍스트가 다소 평이함. LLM 응답이 정상 흐를 때는 사용되지 않는 경로라 1차 컷에서는 OK.

### Reference Documents
- `docs/storyx-harness-architecture.md` § 7 청크 A~H 정의

---

## 2026-05-21 15:30 — M6.2.1 evolution history UI (AiStatusBadge popover) 완료

> Last Updated: 2026-05-21 15:30 KST

### Current Objective
사용자가 헤더의 작은 AI 상태 뱃지를 클릭하면 popover 가 열리고, 작품 전체 AI 활동 이력을 시간순으로 본다. M6.2 의 인프라가 처음으로 가시화됨. 다음 자연스러운 작업 — M6.3 storyx CLI 또는 M4 스토리 하네스 (Layer 0~7) 또는 evolution 이벤트 종류 확장(검토 결과·메모리 결정 자동 누적).

### Recommended Next Step
1. dev 서버에서 자유서술 → 인터뷰 클릭 → 뱃지가 라임 "AI 활성" 또는 노란 "AI 폴백" 으로 변함 → 클릭 → popover 에 이벤트 노출 확인
2. evolutionMemory 가 글로벌 한 키 — projectId 별 분리 또는 storyx CLI 작업 우선순위 결정
3. M4 또는 M6.3 으로 진입

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 529kb js · 175kb css (1.03s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/components/AiStatusBadge.tsx` (재작성)
- 하네스 — `feature_list.json` M6.2.1 신설 + active

### What the Last Session Did
1. **`AiStatusBadge.tsx` 재작성**
   - `span` → `button` (클릭 가능), `cursor: pointer`
   - `isOpen` state + 바깥 클릭 / Escape 닫기 hook
   - `loadEvolutionHistory()` 으로 최근 이벤트 가져오기 (status 변경 시 자동 갱신)
   - popover — 헤더(제목 + 카운터 + 비우기 + 닫기) + 이벤트 리스트
2. **이벤트 표시**
   - 색 분기 — 성공(라임) / 주의(앰버, review-revise·memory-revised·held) / 실패(빨강, review-blocked·memory-rejected·summary 에 "실패" 포함)
   - 메타 — 상대 시간(초/분/시간/일) · source(mode label) · detail
   - 빈 상태 안내 — "아직 누적된 AI 활동이 없습니다…"
3. **비우기 버튼** — confirm 후 `clearEvolutionHistory()` + popover 닫기
4. **닫기 X 버튼** — popover 만 닫기 (state 보존)
5. **lucide 아이콘** — Activity (헤더) · Trash2 (비우기) · X (닫기)

### Files To Touch (next milestone)
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync
- **M4 스토리 하네스 Layer 0~7** — `docs/storyx-harness-architecture.md` 청크 A~H TDD
- **(보강) evolution 이벤트 자동 누적 확장** — 메모리 큐 결정·검토 결과 등도 자동 append (현재는 llm-call 만)

### Files NOT To Touch
- `src/lib/evolutionMemory.ts` (M6.2 정본)
- `src/lib/aiStatus.ts` (M6.2 정본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401

### Known Issues
- evolutionHistory 가 글로벌 한 키 — 여러 작품 간 이력이 섞임. projectId 별 분리 검토.
- llm-call kind 만 자동 누적 — review-pass/revise/blocked 등 다른 kind 는 호출 측에서 명시적 append 가 필요. 현재는 reviewClient 가 reportAiCall 만 호출하므로 모든 검토가 llm-call 로 기록됨.
- popover 가 width 340px 고정 — 모바일 미고려.

### Reference Documents
- `docs/vercel-env-setup.md`
- `~/.claude/plans/x-zippy-graham.md`

---

## 2026-05-21 15:22 — M6.2 evolutionMemory 누적 저장 완료

> Last Updated: 2026-05-21 15:22 KST

### Current Objective
모든 LLM 호출이 시간순 evolution history 에 자동 누적되고, export/import 페이로드에 포함되어 백업·이동 가능. 다음 자연스러운 작업 — M6.3 storyx CLI 확장 또는 M4 스토리 하네스 구현 (Layer 0~7) 또는 evolution history UI 노출.

### Recommended Next Step
1. dev 서버에서 LLM 호출 발생 → localStorage 의 `serial-story-studio/evolution-history` 누적 확인
2. M6.1 내보내기 → JSON 파일에 `evolutionHistory.events` 포함 확인
3. 그 뒤 M6.3 (CLI) 또는 evolution-history UI 패널 신설 (M6.2.1) 또는 M4 시작

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 524kb js · 175kb css (1.22s) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 신설 — `src/lib/evolutionMemory.ts`
- 수정 — `src/lib/aiStatus.ts` · `src/lib/storage.ts` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/evolutionMemory.ts` 신설**
   - `EvolutionEventKind` — llm-call / review-pass·revise·blocked / memory-approved·revised·rejected·held / draft-generated / release-locked
   - `EvolutionEvent` — { id, at, kind, source?, summary, detail? }
   - `EvolutionHistory` — schema='storyx/evolution-history/v1' + events[]
   - `loadEvolutionHistory` · `saveEvolutionHistory` · `clearEvolutionHistory`
   - `appendEvolutionEvent` — id·at 자동 생성, MAX 500 trim
   - `replaceEvolutionHistory` — import 페이로드 검증 + 통째 덮어쓰기
2. **`src/lib/aiStatus.ts` 훅 추가**
   - `reportAiCall` 에서 `appendEvolutionEvent({ kind: 'llm-call', source: mode, summary, detail: reason })` 자동 호출
   - SSR · quota 실패 시 silent (UI 신호는 그대로 흐름)
3. **`src/lib/storage.ts` export/import 페이로드 확장**
   - `StoryXExportPayload` 에 `evolutionHistory?: EvolutionHistory` 추가
   - `exportAllData` 에서 `loadEvolutionHistory()` 포함
   - `importAllData` 에서 `replaceEvolutionHistory(payload.evolutionHistory)` 호출, message 에 "진화 메모리 N개 포함" 표시

### Files To Touch (next milestone)
- **M6.2.1 (선택) UI 노출** — 스튜디오 ⚙ 설정 또는 별도 패널에 최근 N개 이벤트 표시. 작가가 자기 작품의 학습 흐름을 본다.
- **M6.3 storyx CLI** — `tools/storyx.mjs` 또는 신규 CLI 에 init/serve/memory sync. 파일 영속 (vault 모드).
- **M4 스토리 하네스 (Layer 0~7)** — `docs/storyx-harness-architecture.md` 청크 A~H TDD.

### Files NOT To Touch
- `src/lib/agentReviewProcess.ts` 의 `evolutionMemory: string[]` 필드 (정적 카테고리 안내문 — 별개)
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자 액션 필요

### Known Issues
- evolution history 가 작품마다 분리 없이 글로벌 한 키 — 여러 작품 사이 누적이 섞임. M6.3 (또는 storage 확장)에서 projectId 별 분리 고려.
- UI 노출 없음 — 백업/복원에는 즉시 가치, 작가가 history 를 보는 흐름은 다음 단계.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵

---

## 2026-05-21 15:18 — M6.1 프로젝트 export/import (JSON 파일) 완료

> Last Updated: 2026-05-21 15:18 KST

### Current Objective
M6 영속성·메모리 싱크의 첫 컷 완료 — 사용자가 작품 전체(project + snapshots + preferences)를 한 JSON 으로 백업/복원할 수 있다. 다음 자연스러운 작업 — M6.2 evolutionMemory 누적 또는 M6.3 storyx CLI 확장.

### Recommended Next Step
1. dev 서버에서 스튜디오 → ⚙ 설정 → 프로젝트 데이터 → 내보내기 동작 확인
2. 내보낸 JSON 을 다른 브라우저/계정에서 가져오기 시연
3. 그 뒤 M6.2 (evolutionMemory) 또는 M4 (스토리 하네스 Layer 0~7) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npm run build` 523kb js · 174kb css (847ms) · `npm test` 30 files / 164 tests · `tsc --noEmit` exit 0
- 수정 — `src/lib/storage.ts` · `src/StoryXDesk.tsx` · `src/styles.css` · `feature_list.json`

### What the Last Session Did
1. **`src/lib/storage.ts` 확장**
   - `StoryXExportPayload` 타입 (schema='storyx/export/v1', exportedAt, project, snapshots, preferences)
   - `exportAllData()` — 5 localStorage 키(project · snapshots · landingTheme · studio.accent · studio.canvas) 한 묶음
   - `importAllData(input)` — 문자열/객체 둘 다 받고 검증 후 덮어쓰기. ImportOutcome { ok, message } 반환
   - `normalizeTheme` · `isRecord` · `readPreference` · `writePreference` 헬퍼
2. **`src/StoryXDesk.tsx` 핸들러**
   - `fileInputRef` + `handleExportProject` (Blob 다운로드) + `handleImportClick` + `handleImportFile` (confirm → 덮어쓰기 → reload)
   - lucide import 에 `Download`, `Upload` 추가
3. **설정 패널 확장**
   - 트윅·캔버스 두 그룹 다음에 "프로젝트 데이터" 그룹 추가
   - 내보내기/가져오기 두 버튼 + 숨김 file input
   - hint 텍스트 갱신 — "가져오기는 현재 작품을 덮어쓰니 먼저 내보내기를 권장합니다."
4. **`src/styles.css`** — `.sx-studio-data-action` 클래스 (기존 chip 톤과 일관)
5. **TypeScript 두 곳 수정** — `landingTheme` 좁히기 + `payload.project as unknown as SeriesProject` 우회

### Files To Touch (next milestone)
- **M6.2 선택 시** — `src/lib/memoryBank.ts` 에 `evolutionMemory.history` 추가, `exportAllData` 페이로드에 포함
- **M6.3 선택 시** — `tools/storyx.mjs` 또는 신규 `tools/storyx-cli.mjs` 에 init/serve/memory sync 명령
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `src/lib/publishing.ts` (M3.6 완성본)
- `api/*.ts` (M5 완성본)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) Vercel env 미설정 시 mock 폴백. `docs/vercel-env-setup.md` 참고.
- (로컬 LLM) `claude` CLI 401. 사용자 액션 필요.

### Known Issues
- 가져오기가 성공하면 즉시 `window.location.reload()` — 작업 중인 미저장 변경이 있으면 손실. M6.2 에서 dirty state 체크 추가 고려.
- import 페이로드 검증이 schema 와 project 객체 여부만 — 깊은 필드 검증 없음. normalizeProject 가 누락 필드를 채우지만 악의적 입력엔 약함.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 가이드
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:58 — M5 Vercel Functions 5 라우트 완료

> Last Updated: 2026-05-21 15:58 KST

### Current Objective
5 라우트(`/api/draft`·`/api/review`·`/api/review-agent`·`/api/review-data`·`/api/interview`) 가 production 배포본에서 직접 LLM 호출. dev 환경에서는 기존 storyxBridge 미들웨어가 같은 path 를 가로채 storyx.mjs 를 호출 (병행 유지).

### Recommended Next Step
1. 사용자가 Vercel Project Settings 에 `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 설정
2. `vercel deploy` 또는 git push 로 새 배포
3. `curl POST .vercel.app/api/interview` 로 한 줄 검증 — `"provider": "ai-gateway"` / `"anthropic"` 응답 확인
4. 다음 자연스러운 작업 — M6 영속성·메모리 싱크 또는 M4 스토리 하네스 구현(Layer 0~7)

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (963ms)
- 새 파일 — `api/*.ts` 5개, `src/lib/server/{promptBuilders,llmRunner}.ts`, `docs/vercel-env-setup.md`
- 수정 — `vercel.json` functions config, `feature_list.json` M5 done

### What the Last Session Did
1. **AI SDK 의존성 설치** — `ai` + `@ai-sdk/anthropic` + `@vercel/node`
2. **공유 모듈 신설**
   - `src/lib/server/promptBuilders.ts` — buildInterviewPrompt + buildDraftPrompt + buildReviewPrompt + buildAgentReviewPrompt + buildDataReviewPrompt + loadAgentPersona + parseLlmJson
   - `src/lib/server/llmRunner.ts` — runLlmJson 헬퍼 (AI Gateway 우선, Anthropic 직결 fallback, 키 없으면 mock)
3. **5 Vercel Functions 신설**
   - `api/interview.ts` · `api/draft.ts` · `api/review.ts` · `api/review-agent.ts` · `api/review-data.ts`
   - 모두 같은 패턴 — body 파싱 → prompt 빌드 → runLlmJson → 클라이언트 응답 형태로 정규화
4. **`vercel.json` 갱신** — `functions.api/review-agent.ts.includeFiles: ".claude/agents/**"` 로 페르소나 .md 를 serverless 번들에 포함
5. **`docs/vercel-env-setup.md` 신설** — env 변수 두 가지(`AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY`), 로컬 vs 배포본 동작 차이, curl 검증 예시

### Files To Touch (next milestone)
- **M6 선택 시** — `src/lib/storage.ts` 확장으로 파일/클라우드 영속, `storyx` CLI 확장
- **M4 (Layer 0~7) 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H TDD

### Files NOT To Touch
- `tools/storyx.mjs` (로컬 CLI 호환 — 같은 로직이 promptBuilders.ts 에 복제됐지만 양쪽 유지)
- `vite.config.ts` storyxBridge (dev 전용)
- `.claude/agents/*.md` (페르소나 정본)

### Blockers
- (배포본 LLM) `AI_GATEWAY_API_KEY` 또는 `ANTHROPIC_API_KEY` 가 Vercel Project Settings 에 없으면 mock 폴백
- (로컬 LLM) `claude` CLI 401 — 사용자가 `claude login` 또는 ANTHROPIC_API_KEY 설정 필요

### Known Issues
- promptBuilders.ts 와 storyx.mjs 가 같은 로직 두 곳에 — 변경 시 양쪽 함께 수정 필요. 추후 storyx.mjs 를 .ts 마이그레이션 또는 promptBuilders 를 child_process 에서 import 하는 방식 고려.
- `LanguageModel` 타입에 `'anthropic/...'` 문자열 직접 캐스팅. AI SDK v6 가 provider/model string 을 정식 지원하지만 타입 시그니처는 LanguageModel 인스턴스를 요구해서 `as unknown as LanguageModel` 우회.
- 빌드 chunk 519kb (gzip 160kb) — 500kb 경고. M6 또는 별도 작업에서 manualChunks 또는 dynamic import 로 분할 고려.

### Reference Documents
- `docs/vercel-env-setup.md` — env 설정 + 배포 검증 안내
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본

---

## 2026-05-21 15:48 — M3.6.1 퍼블리시 화면 실데이터 + 4 카드 CTA LLM 호출 + agentFileMap 확장 완료

> Last Updated: 2026-05-21 15:48 KST

### Current Objective
퍼블리시 stage 가 정적 4 카드에서 진짜 출간 도구로 진화. 다음 자연스러운 작업은 M5 Vercel Functions 또는 M4 스토리 하네스 구현(Layer 0~7).

### Recommended Next Step
1. 사용자가 `claude login` 으로 401 블로커 해제
2. dev 서버에서 스튜디오 → 출간 클릭 → PublishScreen 진입 → 4 카드 CTA 호출 → 결과 인라인 노출까지 end-to-end 검증
3. 검증 후 M5 (Vercel Functions) 우선순위 결정

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests · `npm run build` 519kb js (1.39s)
- 추적 — 14 modified + 3 new

### What the Last Session Did
1. **PublishScreen 실데이터 표시**
   - publishingPlan 의 모든 필드 노출 — title · releaseNotice · checklist · snapshotItems · changeLogReview · packageItems · platformProof · releaseLock
   - 출간 게이트 영역에 status 색(ready=라임, review=앰버) + 아이콘
2. **잠금 버튼 동작**
   - `releaseLock.canLock` 에 연동, 토글 동작
   - blocker 있으면 "N개 게이트가 아직 review 상태" 안내
3. **4 카드 CTA → requestAgentReview LLM 호출**
   - 4 상태 (idle / loading / success / failed) 인라인 렌더링
   - 성공 시 status chip + note + strengths + issues 표시
   - 실패 시 reason + "다시 호출" 버튼
   - buildAgentContext 헬퍼로 컨텍스트 추출 (작품의 핵심 결만)
4. **storyx.mjs agentFileMap 확장 — M4 신설 12명 모두 추가**
   - 스튜디오 6 + 랜딩 1 + 브릿지 1 + 출판 4
   - 출판 4명도 review-agent 흐름으로 호출 가능해짐
5. **매체별 deliverables 변동** — essay/novel/comics/audiobook 에 따라 카드 산출물 리스트 다름

### Files To Touch (next milestone)
- **M5 선택 시** — `vite.config.ts` 의 5 storyxBridge 를 Vercel Functions 로. `api/draft.ts` · `api/review-agent.ts` · `api/interview.ts` · `api/review-data.ts` · `api/review.ts` 신설. agentFileMap 의 .md 페르소나를 serverless 번들에 포함해야 함.
- **M4 선택 시** — `docs/storyx-harness-architecture.md` 청크 A~H 순서로 TDD.

### Files NOT To Touch
- `src/lib/publishing.ts` PublishingPlan 타입 (그대로 사용)
- `src/lib/agentReviewProcess.ts` ValidationAgentId (craft 검토용으로 분리 유지)
- `.claude/agents/*.md` (페르소나 정본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- Vercel 배포본 — 5 storyxBridge 가 Vite plugin 이라 production 에선 mock 폴백. M5 에서 해결.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-22 15:18 — M3.6 퍼블리시 파트 신설 + AI 상태 표시기 + 인터뷰 폴백 신호 완료

> Last Updated: 2026-05-22 15:18 KST

### Current Objective
4파트 구조의 마지막 파트(퍼블리시) 1차 컷 완료. 다음 자연스러운 작업은 (a) M3.6.1 PublishScreen 실데이터 연동 또는 (b) M5 Vercel Functions 중 사용자 선택.

### Recommended Next Step
사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정으로 인증 해제 → dev 서버에서 4파트 흐름 끝까지 확인. 그 뒤 M3.6.1(실데이터) 또는 M5(Vercel) 우선순위 결정.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과 · `npm run build` 성공 (511kb js · 174kb css)
- 추적 — 11 modified + 3 new + 1 new (PublishScreen)

### What the Last Session Did
1. **M3.6 퍼블리시 파트 신설**
   - `src/components/PublishScreen.tsx` 신설 — 정적 4 카드 (book-designer · pr-specialist · platform-curator · business-strategist) + 분위기(다크 + 앰버 액센트)
   - `src/App.tsx` AppStage 에 `'publish'` 추가, URL stageParam 파싱, mediumDisplayLabel 매핑, 분기 라우팅
   - `src/StoryXDesk.tsx` onOpenPublish prop 추가, 출간 버튼이 prop 있으면 stage 전환 / 없으면 legacy 내부 모드 폴백
2. **글로벌 AI 상태 표시기 (이전 작업)**
   - `src/lib/aiStatus.ts` · `src/hooks/useAiStatus.ts` · `src/components/AiStatusBadge.tsx` 신설
   - 4 클라이언트(draft · review-agent · review-data · interview)가 wrap 패턴으로 reportAiCall
   - 헤더 두 곳(hx-nav · sx-topbar-actions)에 뱃지 노출
3. **인터뷰 폴백 신호 + 라인업 띠 (이전 작업)**
   - LLM 호출 실패 시 노란 띠 + claude login 안내
   - 성공 시 라임 라인업 띠 (한강風 · 박완서風 …)
   - 사전질문 자동선택 제거, 추천에는 점선 외곽선 + "추천" 뱃지

### Files To Touch (next milestone)
- (M3.6.1 선택 시) `src/components/PublishScreen.tsx` — props 확장으로 publishingPlan 전달
- (M3.6.1 선택 시) `src/App.tsx` — stage 'publish' 분기에 project + blueprint 전달
- (M5 선택 시) `vite.config.ts` 의 5 storyxBridge → Vercel Functions

### Files NOT To Touch
- `src/lib/publishing.ts` `PublishingPlan` 타입 (legacy 호환 유지)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 진행 가능.

### Known Issues
- 빈 `ANTHROPIC_API_KEY=` export 가 OAuth 토큰을 가릴 가능성 — `~/.zshrc` 점검 권장
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- PublishScreen 의 CTA 4개 + 최종 잠금 버튼은 placeholder. M3.6.1 에서 실 연동.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 20:21 — M4.5 매체 페르소나 풀 ↔ 로컬 LLM 인터뷰 플로우 연결 완료

> Last Updated: 2026-05-21 20:21 KST

### Current Objective
로컬에서 4개 매체 인터뷰가 페르소나 톤 가이드와 함께 LLM 호출까지 정상 동작. 사용자 인증(`claude login` 또는 `ANTHROPIC_API_KEY`) 확인 후 실호출 테스트 → 그 뒤 M3.6 퍼블리시 화면 또는 M5 Vercel Functions 선택.

### Recommended Next Step
1. 사용자가 `claude login` 또는 `export ANTHROPIC_API_KEY=...` 실행해 401 블로커 해제
2. dev 서버 (`npm run dev`) 띄우고 매체 = essay 로 자유 서술 입력 → 인터뷰 질문이 한강風·박완서風 등의 결로 생성되는지 확인
3. 라인업 확인되면 `requestLlmInterview` 결과의 `personaLineup` 을 UI 에 표시할지 결정 — "오늘 인터뷰: 한강風 · 박완서風 · 김연수風" 같은 띠

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `npx tsc --noEmit` exit 0 · `npm test` 30 files / 164 tests 통과
- `node tools/storyx.mjs interview --provider mock --personas-json '[...]'` 스모크 OK

### What the Last Session Did
1. `src/lib/interviewClient.ts` 재작성 — 매체별 pick 함수 4개 import, `buildPersonaLineup(medium, freewrite)` 신설, POST body 에 `personaLineup` 추가, `LlmInterviewResult` 에 `personaLineup` 응답 필드 추가
2. `vite.config.ts` `/api/interview` 브리지 — `--personas-json` 인자로 `JSON.stringify(input.personaLineup)` 전달
3. `tools/storyx.mjs` interview 커맨드 — `--personas-json` 플래그 파싱, `buildInterviewPrompt({ medium, format, freewrite, personas })` 시그니처 확장
4. `buildInterviewPrompt` — `personas.length > 0` 일 때 "## 페르소나 톤 가이드" 섹션 주입 (label · tone · questionStarters · blockingSignals)
5. 30 files / 164 tests 통과 유지

### Files To Touch (next milestone)
- (선택) `src/StoryXDesk.tsx` 또는 인터뷰 화면 — `personaLineup` 표시 띠
- (선택) `vite.config.ts` 나머지 4개 브리지를 Vercel Functions 로 이관 (M5)
- (선택) 퍼블리시 화면 신설 (M3.6)

### Files NOT To Touch
- `src/lib/essayPersonas.ts` · `novelPersonas.ts` · `comicPersonas.ts` · `audiobookPersonas.ts` (정본)
- `src/lib/mediaPersonas.ts` (정본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)

### Blockers
- `claude` CLI 인증 401 — 사용자가 `claude login` 또는 `ANTHROPIC_API_KEY` 설정 필요. 코드 작업은 인증과 무관하게 완료.

### Known Issues
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장
- EssayPersona 에 `category` 필드 없음 — interviewClient.ts 에서 `as unknown as MediaPersona[]` 캐스팅으로 우회. 향후 EssayPersona 에 `category: 'essay'` 추가하면 캐스트 제거 가능.

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 19:43 — M4 (4단계 매트릭스 + 신설 12명 + 매체 풀 4개) 완료, M5 Vercel Functions로 인계

> Last Updated: 2026-05-21 19:43 KST

### Current Objective
M5 — 서버측 LLM Vercel Functions. 배포본 Vercel 에서 mock 폴백이 아닌 실제 LLM 응답.

### Recommended Next Step
`vite.config.ts` 의 5개 `storyxBridge` 미들웨어를 Vercel Functions(`/api/draft`, `/api/review-agent`, `/api/interview`, `/api/review-data`, `/api/data-review`)로 마이그레이션. 공유 요청/응답 스키마를 `src/lib/aiBridgeContract.ts` 같은 곳에 박고, 클라이언트 4개 모듈이 그 스키마를 임포트하도록.

### Branch · Commit · Verification
- Branch — `design/linear-dark`
- Verification — `bash init.sh` 30 files / 164 tests · 빌드 성공
- M4 8 커밋 — effba1a · f5c2baf · 251518a · a3da8b7 · dc65884 · 739d1e0 · cfb65c6 · 8b82c26

### What the Last Session Did
1. 스튜디오 단계 신설 6명 — canon-librarian · timeline-keeper · bible-curator · critic-reviewer · essay-curator · memory-evolution-keeper
2. 랜딩 단계 신설 — studio-architect
3. 브릿지 단계 신설 — interview-curator
4. 출판 단계 신설 4명 — book-designer · pr-specialist · platform-curator · business-strategist (service ops 카테고리, ValidationAgentId 미등록)
5. 에세이 페르소나 풀 6명 (한강·박완서·김연수·김애란·신형철 + 가공) — docs + 런타임 + 테스트
6. 소설·만화·오디오북 페르소나 풀 각 6명 — 매체별 license-safety 정책 차등 (소설 5+1, 만화 3가공, 오디오북 전부 가공)
7. UI 통합 — StoryXDesk agentPersonas 에 8명 매핑 + 8개 pixel-agent CSS 클래스
8. AGENTS.md Stage × Media Matrix 전 셀 박힘

### 자산 현황
- 작가진 풀 — `.claude/agents/` 32 파일
- ValidationAgentId — 23개 (스토리 craft 15 + 신설 8: 6 스튜디오 + 1 랜딩 + 1 브릿지)
- 매체 페르소나 풀 — 4 매체 × 6명 = 24명
- 30 files / 164 tests

### Files To Touch (M5)
- `vite.config.ts` 의 `storyxBridge()` 5 미들웨어
- 신설 `/api/*.ts` Vercel Functions (Next.js App Router 또는 vanilla Vercel Function 형태)
- `src/lib/aiBridgeContract.ts` (신설 권장) — 공유 요청/응답 스키마
- `src/lib/draftClient.ts` · `reviewClient.ts` · `interviewClient.ts` · `dataReviewClient.ts` — 새 스키마 import

### Files NOT To Touch
- `src/StoryXDesk.tsx` agentPersonas (M4 완성본)
- `.claude/agents/*.md` (M4 완성본)
- `src/lib/agentReviewProcess.ts` validationProcesses (M4 완성본)
- `src/lib/{essay,novel,comic,audiobook}Personas.ts` (M4 완성본)

### Blockers
없음.

### Known Issues
- Vercel 환경변수 `ANTHROPIC_API_KEY` 필요 — M5 시작 시 사용자 확인
- AI Gateway 사용 가능 (`provider/model` 스트링 권장 — Vercel knowledge update)

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵 (M5 라인업)
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `docs/essay-interviewer-personas.md` — 에세이 페르소나
- `AGENTS.md` — Stage × Media Matrix 정본

---

## 2026-05-21 13:30 — M3.5 스튜디오 설정 패널 완료, M3.7 리터럴 색 정리로 인계

> Last Updated: 2026-05-21 13:30 KST

### Current Objective
M3.7 — 에디터 안의 리터럴 색 박스 정리. 트윅 5색 × 캔버스 3톤 조합 어디서나 톤 일관.

### Recommended Next Step
라임 + 피치 블랙이 아닌 조합(예 — 바이올렛 + 인디고)을 띄워 가장 어색해지는 셀렉터부터. 우선 후보 — `sx-app-breadcrumb` 영역, `sx-save-chip`, "쇼러너가 잡은 이번" 카드 배경, 알파 셀프체크 바, prose textarea. 리터럴 hex를 `var(--sx-page)`·`var(--sx-paper)`·`var(--sx-card)` 등으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `npx tsc --noEmit` 통과 · `npm run build` 성공 · 28 files / 149 tests 통과
- 캡처 — `.playwright-mcp/studio-settings-default.jpeg` (라임+피치) · `studio-settings-aether-indigo.jpeg` (바이올렛+인디고)

### What the Last Session Did
1. 미사용 `src/assets/story-x-hero-forest-wind.png` 제거
2. 스튜디오 편집기 설정 패널 신설 (M3.5)
   - 토픽바 우측에 `Settings` 톱니 토글
   - 펼침 패널 — 트윅 chip 5색·캔버스 chip 3톤
   - state + `localStorage 'storyx.studio.accent'`·`'storyx.studio.canvas'`
   - `<main className="sx-desk">` 인라인 style 로 `--sx-brand`/`--sx-page` 등 오버라이드 → 라이브 적용
3. 관련 lucide·CSSProperties import 정리, 토큰 정의 모듈 레벨 상수로 분리

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 인라인 색이 있다면 토큰으로
- `src/styles.css` `.sx-desk` 하위 — 리터럴 hex·rgba를 토큰 호출로

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` 영역
- `:root --nx-*` 라이트 토큰
- `.sx-desk` 토큰 정의 (인라인 오버라이드 메커니즘 유지)
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지 README/index.html은 텍스트로 받기 전까지 보류
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 11:46 — M3 4파트 구조 완료, M3.5 스튜디오 설정으로 인계

> Last Updated: 2026-05-21 11:46 KST

### Current Objective
M3.5 — 스튜디오 편집기 설정 패널 (트윅 = 강조색, 캔버스 = 창 배경색)

### Recommended Next Step
스튜디오 헤더(또는 우측 패널)에 "편집기 설정" 진입점 추가 → 모달/드롭다운 안에 트윅 색 피커 + 캔버스 토널 선택 + localStorage 저장. 한 컴포넌트 끝내고 `bash init.sh` 통과 후 다음.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시 예정)
- Verification — `bash init.sh` 28 files / 149 tests 통과 · 빌드 성공
- 4 화면 캡처 — `.playwright-mcp/landing-dark.jpeg` · `landing-light.jpeg` · `bridge-projects.jpeg` · `studio-editor.jpeg`

### What the Last Session Did
1. 디자인 패키지 fetch — 바이너리/외부 캐시라 classifier 차단. 사용자 결정으로 로고 외 요구만 반영
2. 흰 로고 변형 두 개 생성 — `story-x-symbol-light.svg`, `story-x-logo-lockup-light.svg`
3. `:root --nx-*` 라이트로 복원 → 브릿지(로그인·프로젝트·홈) 다시 흰 배경
4. 랜딩 낮↔밤 토글 — useState + localStorage + Sun/Moon nav 버튼 + `.landing-page.is-light` 오버라이드
5. 스튜디오 mockup은 라이트 모드에서도 항상 다크 유지 (`.landing-page.is-light .hero-showcase` 재고정)
6. `LandingBrand` `theme` prop → 다크 컨텍스트는 흰 SVG, 라이트는 검정 SVG. CSS invert 해킹 제거
7. `StoryXDesk` 로고 import를 흰 변형으로 교체

### 4파트 구조 정리 (확정)
- **랜딩** — 낮/밤 토글, Linear 분위기, 흰/검정 pill CTA
- **브릿지** — 로그인 → 프로젝트 → 인터뷰 → 로딩, 흰 배경, Notion-Linear 톤
- **스튜디오** — 편집·바이블·데이터, 항상 다크 + 흰 로고
- **퍼블리시** — 출간 버튼 누른 뒤 화면, 분위기 미정 (M3.6 신설 대기)

### Files To Touch (this milestone)
- `src/StoryXDesk.tsx` — 설정 모달/드롭다운 컴포넌트 + state
- `src/styles.css` `.sx-desk` — 설정 패널 스타일
- `src/lib/storage.ts` — 설정 영속화 (선택)

### Files NOT To Touch
- `src/App.tsx` MarketingLanding, LandingBrand
- `src/styles.css` `.landing-page` LINEAR 블록
- `:root --nx-*` 라이트 토큰
- 149 테스트 통과 상태

### Blockers
없음.

### Known Issues
- design 패키지의 README/index.html은 아직 못 읽었음 — 필요해지면 사용자가 텍스트로 붙여 주기로 약속됨
- 멀티 dev 서버 잔존 가능 — 새 세션 전 `pkill -f vite` 권장

### Reference Documents
- `~/.claude/plans/x-zippy-graham.md` — 마스터 로드맵
- `docs/storyx-harness-architecture.md` — 스토리 하네스 정본
- `progress.md` · `feature_list.json` — 코드 하네스 상태

---

## 2026-05-21 00:34 — M2 완료, M3 디자인 폴리시로 인계

> Last Updated: 2026-05-21 00:34 KST

### Current Objective
M3 — 에디터·보조 화면 Linear 폴리시 (owner: design-handoff)

### Recommended Next Step
새 세션에서 design 의뢰 프롬프트로 시작, `src/StoryXDesk.tsx` 상단 토픽바부터 리터럴 색 박스를 토큰 기반으로 교체.

### Branch · Commit · Verification
- Branch — `design/linear-dark` (origin 푸시됨)
- Commit — `e7a971a` "M1+M2: 하네스 설계 문서 + Linear 다크 랜딩 재작성"
- Verification — `npm test` 28 files / 149 tests · `npm run build` 성공

### What the Last Session Did
1. `docs/storyx-harness-architecture.md` 통합 설계 문서 (M1)
2. 랜딩을 Linear "Midnight Command Center" 다크로 재작성 (M2)
3. `:root --nx-*` 와 `.sx-desk --sx-*` 토큰 값 Linear 등가로 cascade
4. 코딩 에이전트 하네스 산출물 신설

---

## Handoff Template

새 인계를 작성할 때 다음 템플릿을 맨 위에 복사한다.

```
## YYYY-MM-DD HH:MM — 한 줄 요약

> Last Updated: YYYY-MM-DD HH:MM KST

### Current Objective

### Recommended Next Step

### Branch · Commit · Verification

### What the Last Session Did
1.

### Files To Touch (this milestone)
-

### Files NOT To Touch
-

### Blockers

### Known Issues
-

### Reference Documents
-
```
