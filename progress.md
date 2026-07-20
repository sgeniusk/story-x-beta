# Story X — Progress

> Last Updated: 2026-07-20 17:36 KST · Branch: `codex/p2-condense-target-length` (**P2-d 응결 목표 분량 계약 완료, Draft PR #46 사용자 테스트 대기**)
> 코드 하네스 상태는 이 파일, 스토리 하네스 설계는 `docs/storyx-harness-architecture.md`.

> 최근 검증(2026-07-20 17:35 KST) — `bash init.sh` 녹색: `npm test` 1251 통과(106 파일) · `npm run build`(tsc+vite) 성공 · `✓ 하네스 검증 통과 — tsc · vitest · build 전체 통과`.

## 완료 트랙 — P2-d PLAY 응결 목표 분량 계약 (`done` · 2026-07-20, 구현 `91b5c6d` · Draft PR #46)

PLAY 응결 전에 회차 목표를 **짧게 3천자 / 기본 5천자 / 길게 8천자** 중 고르고, 잡 시작 시 고정된 계약을 생성·영수증·복구·재시도·승인·WRITE까지 잃지 않게 했다. 분량은 작품성을 훼손하는 자동 채우기/자르기 대신 정직한 결과 상태와 경고로 다룬다. spec `docs/superpowers/specs/2026-07-20-p2d-condense-target-length-design.md` · plan `docs/superpowers/plans/2026-07-20-p2d-condense-target-length.md`.
- **회차별 목표 계약** — 공백 제외·문장부호 포함 기준으로 compact 3,000자(최종 2,700~3,300), standard 5,000자(4,500~5,500, 기본), extended 8,000자(7,200~8,800)를 고정했다. 장면 수는 각각 2~3 / 3~4 / 4~6이며 결과는 `under | within | over`로 기록한다.
- **잡·복구 신뢰성** — 목표와 정확한 PLAY source fingerprint/span을 잡 시작 시 동결하고 영수증 root·recovery snapshot·직접 쓰기 작업본으로 운반한다. 재시도·승인·복구 journal 재개 때 source 또는 목표가 없거나 어긋나면 자동 추정하지 않고 fail-closed한다.
- **작품 보호** — 원문에 없는 새 행동·사건·결정·폭로·페이오프를 목표 분량을 채우려고 만들지 않는다. 부족하면 짧은 결과와 경고를 남기며 자동 padding·truncate·blind retry·캐논 반영은 하지 않는다. 완료 결과도 사용자 승인 전에는 본편이나 캐논에 들어가지 않는다.
- **로컬 Codex 안정성** — 응결 provider 상한을 9분, 잡 상한을 10분으로 분리하고 timeout은 안전한 실패 metadata만 남긴다. timeout 뒤 자동 재호출하지 않아 같은 응결이 중복 실행되지 않는다.
- **WRITE 피드백** — 저장된 목표가 있는 회차는 현재 편집 본문 기준 `현재자 / 목표자 · 진행률`, 이전 회차는 `현재자 / 기본 5,000자 · 진행률`을 원고 상단 보조문구에 표시한다. 390px·320px에서 한 줄 유지·가로 overflow 0을 실측했다.
- **TDD·실생성** — 최종 `bash init.sh` 106파일/1251테스트, tsc·Vite build, `git diff --check` 녹색. 합성 PLAY 원문을 실제 로컬 Codex로 standard 응결해 본문 4,722자·`within`·providerFailure 없음으로 완료했으며 사용자 작품에는 저장·승인하지 않았다.
- **독립 감사** — source/canon 연속성 및 전체 계약 재감사 모두 PASS, P0/P1/P2 0. 실브라우저 새로고침 이후 새 console 오류 0.
- **게시/의존** — Draft PR #46 `https://github.com/sgeniusk/story-x-beta/pull/46`은 #45 위 스택이다. 기존 순서 **#39 → #40 → #41 → #42 → #43 → #44 → #45 → #46**을 유지하고 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 실제 작품 PLAY에서 `기본 · 5천자`로 응결을 한 번 시작하고 다른 화면에 다녀와도 같은 목표가 표시되는지 확인한다. 완료 결과가 4,500~5,500자면 `목표 범위`, 밖이면 정직한 짧음/김 경고가 보여야 한다. 작품성·원문 충실도를 읽어 승인한 뒤 WRITE에 해당 회차와 5,000자 목표 표시가 함께 보이면 P2-d를 수용한다.

## 완료 트랙 — P2-c1 PLAY 추천 답변 작성창 삽입 (`done` · 2026-07-19, 구현 `8b72ad5` · Draft PR #45)

PLAY 응답의 추천 선택지를 클릭 즉시 전송하던 동작에서 **작성창에 담아 사용자가 고친 뒤 명시적으로 전송**하는 동작으로 바꿨다. 생성 프롬프트·캐논·응결·잡 계약은 건드리지 않고 `dive-chat` 응답 선택지만 좁게 교정했다. spec `docs/superpowers/specs/2026-07-19-p2-choice-composer-design.md` · plan `docs/superpowers/plans/2026-07-19-p2-choice-composer.md`.
- **창작 주도권 계약** — 칩 클릭은 fetch·대화 턴·진행 작업등·프로젝트 `onChange`를 만들지 않고 문구를 textarea에 넣어 focus와 커서를 끝으로 옮긴다. 사용자가 수정한 뒤 Enter 또는 `보내기`를 눌러야 기존 전송 경로가 한 번 실행된다.
- **비파괴 초안·되돌리기** — 작성 중인 문장이 있으면 추천 칩을 숨겨 byte-for-byte 보존한다. 전송 전 `choices`는 유지하므로 작성창을 비우면 같은 추천이 다시 나타난다. `⏳ 계속`·`⏭ 전개`·VS 후보의 기존 즉시 실행 의미는 유지했다.
- **한국어·접근성** — 한글 IME 조합 확정 Enter의 오전송을 `isComposing`/229 가드와 RED→GREEN 테스트로 막았다. `추천 답변 · 눌러 작성창에 담아 고치세요` 안내, group/label, 키보드 focus, warm `--st-*` 토큰, 600px 이하 44px 칩을 고정했다.
- **TDD·검증** — focused 2파일/43테스트, 전체 105파일/1169테스트, tsc·Vite build, `git diff --check`, 독립 코드 감사 P0–P2 0. 메인 실브라우저에서 칩 클릭 전후 chat 4→4·progress 0→0, 수정·비우면 3칩 복원과 focus/caret를 확인했다.
- **반응형 하네스** — 1280/390/320px 가로 overflow·clipping·console warning/error 0, 모바일 action 44px·2px focus outline. 독립 320×700 초기 sticky 가림은 max-scroll에서 chronicle–dock 44px·정상 hit-test로 접근 가능해 비차단으로 판정했다. 캡처 `/private/tmp/storyx-p2-choice-1280.png`, `/private/tmp/storyx-p2-choice-390.png`, `/private/tmp/storyx-p2-choice-320.png`, `/private/tmp/storyx-p2-choice-harness-320-maxscroll.png`.
- **게시/의존** — Draft PR #45 `https://github.com/sgeniusk/story-x-beta/pull/45`는 #44 위 스택이다. 기존 순서 **#39 → #40 → #41 → #42 → #43 → #44 → #45**를 유지하고 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 로컬 5175 PLAY의 추천 답변 하나를 눌러 즉시 말풍선·작업등이 생기지 않는지 보고, 한국어로 고친 뒤 `보내기`를 눌러 수정본만 전송되는지 사용자가 판정한다. 수용 뒤 다음 후보는 P2-d 목표 분량 계약이며 반드시 새 brainstorm에서 범위를 다시 정한다.

## 완료 트랙 — P1-b WRITE 현재 회차 평문 반출 (`done` · 2026-07-19, 구현 `47d17d4` · Draft PR #44)

WRITE에서 현재 선택한 회차의 **화면상 최신 본문**을 메타데이터 없이 복사하거나 UTF-8 TXT로 내려받는 소유권 출구를 만들었다. 저장소의 마지막 회차를 다시 추정하지 않고 `latestChapter` 식별자와 저장 debounce 전 `editorText`를 직접 사용한다. spec `docs/superpowers/specs/2026-07-19-p1b-text-export-design.md` · plan `docs/superpowers/plans/2026-07-19-p1b-text-export.md`.
- **현재 회차 계약** — 복사와 TXT는 같은 live body를 byte-for-byte 사용하고, 작품명·회차·제목은 안전한 파일명에만 둔다. 잠긴 회차·임시 작품도 반출할 수 있으며 공백 본문은 두 행동을 비활성화한다.
- **정직한 실패·경합 방어** — 표준 Clipboard API와 임베디드 브라우저 selection fallback을 사용하고 둘 다 실패할 때만 오류를 알린다. 회차·본문 변경이나 다른 반출 뒤 늦게 끝난 복사는 request version으로 무효화하며, 다운로드 예외에서도 anchor와 object URL을 항상 정리한다.
- **산출물 경계** — P0-b PLAY 실패 복구 TXT와 안전 파일명·다운로드 helper만 공유한다. 깨끗한 회차 본문에 복구 경고·캐논·리뷰를 섞지 않았고 기존 JSON 백업/import와 출간·승인 계약은 변경하지 않았다.
- **UI·접근성** — WRITE 회차 컨텍스트 줄에 낮은 위계의 `본문 복사`·`TXT`를 배치했다. warm `--st-*` 토큰, polite live status, 키보드 초점, 모바일 44px target을 지키고 중앙 원고 면을 침범하지 않는다.
- **TDD·검증** — 도메인·UI·CSS RED 뒤 focused 7파일/133테스트, 최종 `bash init.sh`, 독립 코드 재감사 P0–P2 0. 실브라우저 1280/390/320px에서 본문·브라우저 클립보드·TXT의 길이와 SHA-256 일치, UTF-8 한글·빈 줄 보존, 가로 overflow·원고 겹침·console 오류 0을 확인했다. 캡처 `/private/tmp/storyx-p1b-write-1280-final.png`, `/private/tmp/storyx-p1b-write-390-final.png`, `/private/tmp/storyx-p1b-write-320-keyboard-final.png`.
- **게시/의존** — Draft PR #44 `https://github.com/sgeniusk/story-x-beta/pull/44`는 #43 위 스택이다. 기존 순서 **#39 → #40 → #41 → #42 → #43 → #44**를 유지하고 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 현재 5175 로컬 WRITE에서 한 문장을 수정한 직후 `본문 복사`를 눌러 외부 메모장에 붙여넣고, `TXT` 파일을 열어 같은 본문·빈 줄인지 사용자가 판정한다. 실제 OS 붙여넣기와 파일 내용이 맞으면 P1-b를 수용하고, 다음 백로그 슬라이스는 새 brainstorm에서 선택한다.

## 완료 트랙 — P1-a PLAY 진행 피드백 (`done` · 2026-07-18, 구현 `b885767` · Draft PR #43)

PLAY 대화·쇼러너·전개 후보·응결 등록·실행이 30초에서 3분까지 조용히 멈춰 보이던 문제를 닫았다. 서버 telemetry를 흉내 낸 퍼센트 대신 실제 경과시간·작업 목적·대기 안내를 하나의 작업등으로 표시한다. spec `docs/superpowers/specs/2026-07-18-p1a-play-progress-feedback-design.md` · plan `docs/superpowers/plans/2026-07-18-p1a-play-progress-feedback.md`.
- **정직한 진행 계약** — 작업별 2~4개 시간 구간에서 장면·감정·대가·보이스·연속성 점검 목적만 알린다. 퍼센트·남은 시간·완료 임박 추정은 금지했고, 응결은 `화면을 떠나도 계속`된다는 잡 계약을 분리해 알린다.
- **재진입 경과시간** — 로컬 요청은 클릭 시각, running 응결은 영수증 `createdAt`에서 계산해 PLAY를 떠났다 돌아와도 이어진다. 음수·미래·손상 timestamp는 `0:00`으로 안전 강등한다.
- **작성창 안정성** — 작업등 스택과 composer를 하나의 sticky dock으로 묶어 진행 카드가 입력창을 덮지 않게 했다. warm `--st-*` 토큰·PLAY lime·축소 모션·polite live region을 지키고, 매초 바뀌는 시간은 화면낭독기에서 제외했다.
- **안전 경계** — 요청·polling·취소·오류·복구·승인·캐논 의미는 변경하지 않았다. running 응결의 취소·생성 보관함 행동과 로컬 영속 실패의 TXT `alert`도 그대로 유지했다.
- **TDD·검증** — 도메인·UI·CSS RED 후 focused 3파일/54테스트, 전체 102파일/1145테스트·tsc·vite build 녹색. 390×844와 1280×900에서 카드/composer 겹침 0·가로 overflow 0·타이머 중 scrollY 유지를 실측했다. 독립 코드·scope·harness 감사 P0/P1 0.
- **게시/의존** — Draft PR #43 `https://github.com/sgeniusk/story-x-beta/pull/43`은 #42 위 스택이다. 기존 순서 **#39 → #40 → #41 → #42 → #43**를 유지하고, 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 실제 작품 PLAY에서 대화 전송·`✦ 전개 후보`·`지금 응결`을 한 번씩 눌러 문구·시간·작성창 위치를 판정한다. 응결 중 보관함으로 나갔다 PLAY로 돌아왔을 때 경과시간이 이어지면 수용. 수용 뒤 다음 슬라이스는 **P1-b 텍스트 반출**이다.

## 완료 트랙 — P0-a 후속: PLAY 응결 source·소비 경계 (`done` · 2026-07-18, 구현 `8633789` · Draft PR #42)

기존 N-2 응결 경계가 최신 두 턴을 다음 회차로 밀어 마지막 대화·클라이맥스를 빠뜨리고, 생성 중 새 대화가 생기면 검토 범위까지 흔들리던 결함을 닫았다. 잡 시작 시점의 정확한 원문 범위를 영속하고 승인 시 그 범위만 한 번 소비하며, 보존한 최신 두 턴은 다음 PLAY의 연결 문맥으로 명시한다. spec `docs/superpowers/specs/2026-07-18-p0a-condense-source-boundary-design.md` · plan `docs/superpowers/plans/2026-07-18-p0a-condense-source-boundary.md`.
- **정확한 source 계약** — `CondenseSourceSpan(afterTurn, throughTurn, messageIds, continuityMessageIds)`을 잡 시작 전에 확정하고 `turn > lastCondensedTurn`인 미소비 대화를 최신 두 턴까지 모두 생성 입력에 넣는다. 시작 뒤 추가된 대화는 span 밖에 남아 다음 응결 재료가 된다.
- **영속·복구 경계** — span을 영수증 root·recovery snapshot·승인 checkpoint에 중복 보존하고, quota compaction에서도 root를 유지한다. parser는 턴 수와 message id 수, continuity가 실제 마지막 최대 2개인지까지 검증한다.
- **승인 거래 안전성** — 해석 우선순위는 root → recovery → 검증된 legacy 숫자이며, 현재 세션의 턴·ID와 정확히 일치하는 span만 사용한다. 누락·손상 metadata는 승인 후 현재 연결 문맥을 임의 삭제하지 않는 0 경계로 안전 강등한다. deviation/retcon 검토도 live buffer가 아니라 동일 source만 본다.
- **이어쓰기 UX** — 승인 뒤 보존한 두 턴 앞에 `지난 회차에서 이어지는 대화` 구분선을 정확히 한 번 표시한다. 회차 본문은 WRITE에 남고 PLAY는 다음 장면의 연결 대화만 보여, 같은 원문을 재응결하는 인상을 제거했다.
- **모바일 인접 결함** — 600px 이하에서 5개 행동 버튼 때문에 28px로 찌그러지던 PLAY 입력창을 full-row 46px 이상으로 복구하고 버튼을 2~3행으로 감쌌다. 390/320px 모두 가로 overflow 0을 실측했다.
- **검증** — focused 9파일/270테스트, 전체 102파일/1135테스트·tsc·vite build 녹색. 독립 코드·시각 재감사 P0/P1/P2 0. 브라우저 390px 입력창 342×46, 320px 입력창 272px, 구분선 1개, 콘솔 오류 0.
- **게시/의존** — Draft PR #42 `https://github.com/sgeniusk/story-x-beta/pull/42`는 `codex/p0a-condense-quality-contract`/PR #41 위 스택이며 머지 순서는 **#39 → #40 → #41 → #42**다. 이전 PR을 먼저 머지한 뒤 다음 PR base를 순차 retarget하고 고유 diff를 확인하며, 실제 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 사용자가 실제 작품에서 새 PLAY 대화를 3턴 이상 만든 뒤 `지금 응결`을 눌러 마지막 대화가 결과에 포함되는지 판정한다. 승인 후 WRITE에 회차가 보이고 PLAY에는 구분선+연결 두 턴만 남아야 한다. 다시 3턴 이상 진행한 두 번째 응결에는 그 연결 두 턴이 중복 포함되지 않아야 한다. 실제 로컬 AI 생성의 작품성 판정은 이 사용자 테스트까지 열어 둔다.

## 완료 트랙 — P0-a 후속: PLAY 응결 장면화·보이스 품질 계약 (`done` · 2026-07-17, 구현 `aad8872` · Draft PR #41)

사용자 dogfooding에서 확인한 두 결함을 분리해 닫았다. 승인한 응결 1화가 WRITE에 나타나지 않던 저장 경계는 P0-b 직렬화 보강 `f40e811`/Draft PR #40에서 해결했고, 사용자가 실화면에서 동작을 확인했다. 이어서 1,122자 요약체·직접 대사 0·추상 후크·QA 표식 작품화로 나타난 결과 품질을 후처리로 숨기지 않고 응결 입력과 생성 계약에서 교정했다. spec `docs/superpowers/specs/2026-07-17-p0a-condense-quality-contract-design.md` · plan `docs/superpowers/plans/2026-07-17-p0a-condense-quality-contract.md`.
- **장면화 계약** — 최종 1,800~2,700자(생성 목표 1,900~2,600자), 서로 다른 압력의 현재 장면 2~3개, 직접 갈등 대사, 실제 대가, 같은 장면 합리적 봉합 금지, 답→더 날카로운 질문, 구체 행동·위협·시한 후크를 실제 로컬 CLI와 TypeScript 빌더에 byte-identical하게 고정했다.
- **보이스·캐논 입력** — tone/rhythm/vocab을 `한국어 문체·보이스 규칙`으로 실제 digest에 전달하고, 인물 카드에 욕망·상처·현재 상태·말투·캐논 앵커를 넣는다. 감정명 재설명·금지어·호칭 드리프트·기능적 선택 해설·캐릭터 카드 이행 보고를 최종 문장 패스에서 막는다.
- **메타·발명 경계** — 테스트·QA·복구·UI·스키마·타임스탬프는 명시적 작품 고유명사가 아니면 6개 출력 필드 전체에서 제외하고, `newCanonFacts`는 명시 사실과 장면 성립에 꼭 필요한 최소 추론으로 제한한다. 기존 누수·stale revision·사용자 승인 게이트는 바꾸지 않았다.
- **실생성 증거** — 합성 PLAY를 실제 로컬 Codex로 응결한 「23시 58분의 원본」은 본문 1,855자·현재 장면 3개·직접 대사 20문단·작품 밖 메타 0. critic-reviewer와 voice-curator가 각각 P0/P1 0으로 PASS했다. 증거 `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0a-condense-quality-sample.md`.
- **독립 감사·검증** — 집중 4파일/172테스트, 최종 코드 감사 P0/P1 0, 로컬 프로젝트 보관함 렌더·오류 로그 0, 전체 `bash init.sh` 102파일/1114테스트·tsc·vite build 녹색.
- **게시/의존** — Draft PR #41 `https://github.com/sgeniusk/story-x-beta/pull/41`은 #40 위의 스택이다. 머지 순서는 **#39 → #40 → #41**이며 각 단계에서 다음 PR을 main으로 retarget하고 고유 diff를 확인한 뒤, 실제 머지는 사용자에게 남긴다.
- **Recommended Next Step** — 기존의 약한 1화는 자동으로 덮어쓰지 않았다. 사용자가 새 PLAY 재료에서 `지금 응결` 또는 `응결 다시 시도`를 눌러 새 결과를 검토하고, 장면성·대사·목소리를 주관적으로 비교 판정한다. 승인하면 WRITE에는 #40의 정확한 chapter 직렬화 경로로 나타난다. 품질 편차가 남으면 결과 후처리/자동 거부를 섞지 말고 별도 readiness 경고 슬라이스로 설계한다.

## 완료 트랙 — P0-b 응결 실패 구제: PLAY 재개·원문 TXT·분리 복구 작업본 (`done` · 2026-07-17, 분리 수정 `8bd10ab` · 의미 교정 `c4aabb9` · Draft PR #40)

사용자 실화면에서 PLAY 원문 TXT가 일반 WRITE 회차 본문으로 바로 들어가던 결함을 교정했다. 응결 실패 기록은 이제 **본편 밖의 복구 작업본**으로 열리고, PLAY 원문은 접이식 참고 패널에만 보존된다. 사용자가 빈 원고지에 직접 쓴 문장을 `회차로 저장`할 때만 Chapter·회차 수·지표에 반영한다. spec `docs/superpowers/specs/2026-07-16-p0b-play-recovery-design.md` · plan `docs/superpowers/plans/2026-07-16-p0b-play-recovery.md`.
- **도메인·UI** — `PlayRecoveryWorkDraft`/프로젝트별 저장소 + `RecoveryDraftWorkspace`를 일반 회차 편집기와 분리했다. 제목·본문은 빈 값, source는 별도 `<aside>`이며 작업본 자동 저장과 명시 저장만 허용한다. 기존 오염 회차는 제목·본문·구조·잠금·최신 회차·PLAY working까지 전부 시스템 생성과 정확히 일치할 때만 자동 환원한다.
- **거래 안전성** — `commitIntent`·`legacyRepair` write-ahead journal로 project→PLAY working→receipt→draft 정리의 부분 성공을 재개한다. receipt의 `recoveryDraftId` 우선 재열기, 다중 탭 stale journal 강등/완료 뒤 중복 회차 차단, local receipt 영속 실패 이탈 차단, legacy 저장 직전 최신본 재판정을 고정했다.
- **보존 정책** — active·작성 본문·journal 작업본과 미완료 draft-linked 영수증은 20개 cap을 넘어도 보존한다. 빈 비활성 작업본과 일반/완료 영수증만 먼저 정리한다. 완료 receipt가 실제 영속되고 draft 제거까지 성공한 뒤에만 일반 WRITE로 돌아간다.
- **UI/접근성** — 저장 상태·본편 반영 안내 대비를 약 5.1:1로 올리고, 560px 이하 공통 상단 바를 2행 grid로 바꿔 제목·PLAY/WRITE/PLAN·더 보기/최신화 행동을 보존했다.
- **사용자 테스트 의미 교정** — 보관함 CTA를 모드 중립적인 `작업 계속하기`로 바꾸고, 0화·회차 없음·저장 PLAY·작성 복구본 없음일 때만 PLAY로 복귀시킨다. 실패 작업은 `원문으로 직접 쓰기` / `직접 쓰던 작업본 열기`로 분리하고 작업실 첫 문장에서 응결 원고가 아님을 밝힌다. PLAY의 `응결 다시 시도`는 사용자 클릭 때만 새 잡을 시작한다.
- **재시도·보존 안전** — 영수증 배열이 작업본 연결로 재정렬돼도 `createdAt` 기준 현재 회차 최신 생성 시도만 PLAY 현장을 대표해 running/succeeded 재시도 뒤 과거 실패가 되살아나지 않고 지난 회차 실패도 현재 재시도로 오인하지 않는다. 실패·성공 영수증 모두 `localPersistenceFailed`이면 안전 문구 대신 새로고침 전 결과 검토·TXT `alert`를 유지한다.
- **실동작 증거** — 기존 잘못 생성된 1화가 엄격 환원되어 ProjectHub에서 **0화·캐논 0개** 유지. 보관함 `작업 계속하기`→PLAY 복귀, 실패 카드의 `응결 다시 시도`·`직접 쓰던 작업본 열기`, 수동 작업실의 빈 제목/본문·`응결된 원고가 아닙니다` 안내→PLAY 복귀를 실측했다. 최종 변경 이후 브라우저 오류 0이며 인앱 브라우저는 `http://127.0.0.1:5175/`의 PLAY 재시도 화면에 인계했다.
- **게시/의존** — Draft PR #40 `https://github.com/sgeniusk/story-x-beta/pull/40`은 P0-c Draft PR #39 위의 스택이다. 머지 순서는 **#39 → #40**이며 #39 base 브랜치는 #40을 main으로 retarget하기 전에 삭제하지 않는다.
- **Recommended Next Step** — 사용자가 현재 PLAY 화면에서 `응결 다시 시도`를 누르고 완료 영수증→검토 진입을 확인한다. 프로젝트 보관함으로 돌아가면 `작업 계속하기`가 빈 WRITE가 아니라 PLAY로 복귀해야 한다. 수용되면 #39를 먼저 머지하고 #40 base를 main으로 바꿔 고유 diff를 재확인한 뒤 머지는 사용자에게 남긴다. 테스트 피드백 전에는 다음 기능 슬라이스를 섞지 않는다.

## 완료 트랙 — P0-c 작품 관리 시스템: 임시작 보관·확정·이어쓰기 (`done` · 2026-07-16, 구현 커밋 `b9e578e` · Draft PR #39)

전역 작품 보관함을 신설해 PLAY-first 온보딩에서 만든 작업을 `temporary`로 저장하고, 사용자가 명시적으로 `confirmed`로 승격한 뒤 재시작해 이어갈 수 있게 했다. 기존 단일 저장 작품은 `confirmed`로 안전 마이그레이션하며, 저장되지 않은 seed 데모는 보관함에 등록하지 않는다. 작품별 PLAY working copy·PLAN staged patches/chat·스냅샷 캐시를 격리하고, 생성 보관함 검토 진입 시 해당 `projectId`를 먼저 활성화한다. spec `docs/superpowers/specs/2026-07-15-p0c-work-library-design.md` · plan `docs/superpowers/plans/2026-07-15-p0c-work-library.md`.
- **구현** — `projectLibrary.ts` lifecycle 순수 도메인 + `storage.ts` 다중 작품 저장/활성화/레거시 마이그레이션/작품별 캐시 스왑 + ProjectHub `ProjectLibraryCard`(임시작·연재 작품·최근 작업·이어쓰기·작품으로 확정) + 온보딩 임시 저장 + 생성 보관함 projectId 라우팅.
- **안전 불변식** — 임시작도 모든 창작 기능 사용 가능 · 확정은 명시적 승격일 뿐 자동 캐논 승인 아님 · 기존 저장 작품은 유실 없이 확정작으로 이동 · 활성 작품 삭제 시 다른 작품/작품별 캐시 보존 · 사용자 소유 `.agents/skills/story-score/` 무접촉.
- **실동작 증거** — 브라우저에서 기존 확정작 1개와 새 임시작 1개 공존(`작품 2 · 임시작 1`)→새로고침 생존→`작품으로 확정` 후 `임시작 0`→재시작 뒤 확정 유지→최근 작업 `이어쓰기` 복귀. 콘솔 오류 0. 캡처 `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0c-work-library.png`(확정), `storyx-p0c-work-library-temporary.png`(확정 전).
- **Recommended Next Step** — 이관 백로그의 다음 P0인 **P0-b 실패 구제 경로**를 새 brainstorm부터 시작. P0-c 범위를 삭제/보관/검색·정렬·클라우드 동기화로 확장하지 말 것.

## 완료 트랙 — P0-a 응결 신뢰성: 로컬 잡 + 폴링 + 전역 생성 보관함 (`done` · 2026-07-15, 구현 커밋 `f8bddc9`)

PLAY 응결을 긴 HTTP 요청에서 **서버 프로세스 인메모리 잡**으로 분리하고, 전역 localStorage 생성 보관함에서 실행·완료·실패·취소·시간초과·서버 재시작 만료 영수증을 관리한다. 완료 원고는 자동 반영하지 않고 기존 누수 검사→정밀 검토→캐논 승인 게이트를 그대로 통과해야 한다. 로컬 Codex CLI 로그인/ChatGPT 구독 한도 안에서 동작하며 배포형 API 인증은 범위 밖이다. spec `docs/superpowers/specs/2026-07-15-p0a-condense-job-inbox-design.md` · plan `docs/superpowers/plans/2026-07-15-p0a-condense-job-inbox.md`.
- **구현** — `localGenerationJobs.ts`(동일 입력 활성 잡 재연결·5분 상한·취소·서버 종료 정리) + `/api/dive-condense-jobs` POST/GET/DELETE + `diveClient.ts` 잡 계약 + `generationInbox.ts` 전역 영속/손상 복구/20개 상한 + ProjectHub `GenerationInboxPanel` + PLAY 진행 영수증·취소·보관함 바로가기·완료 검토 재진입.
- **안전 불변식** — 완료 결과 자동 커밋 금지 · 기준 revision 변경 경고 · 성공 영수증의 결과 누락/손상은 실패로 강등 · CLI stderr 사용자 노출 금지 · 일반 브리지 연결 이탈과 서버 종료도 자식 프로세스 정리 · 사용자 소유 `.agents/skills/story-score/` 무접촉.
- **실동작 증거** — 실제 Codex 잡 `job-mrlu5rrh-qjd74u1` 약 70초 후 성공, 동일 POST가 같은 id 반환, 원고/outline/beats/newCanonFacts 반환 확인. `job-mrlu7mvp-hs3d0g4` DELETE 후 cancelled 유지 확인. 브라우저 `?stage=projects`에서 생성 보관함 빈 상태·현재 작품 공존, 콘솔 오류 0. 캡처 `/Users/taewookkim/.codex/visualizations/2026/07/13/019f5c20-8b9d-73d2-8aea-50a5ad8aac70/storyx-p0a-generation-inbox.png`.
- **Files To Touch(후속)** — P0-c 착수 시 멀티 작품 저장소/프로젝트 허브/생성 보관함 projectId 라우팅을 새 spec으로 확정한 뒤 지정. **Recommended Next Step** = P0-c 작품 관리 시스템(임시작 생성→전역 보관→확정 작품 승격→작품별 이어쓰기). P0-a 인메모리 잡의 서버 재시작 생존은 의도적 비목표이며 영수증은 `expired`로 정직하게 표시한다.

## 완료 트랙 — 온보딩 소재발굴 S2: onboard-chat 엔진 + 「함께 구상」 갈래 (`done` · 2026-07-13, **main 머지** `978d8af` — PR #36)

> 최근 검증(2026-07-13) — `bash init.sh` 통과: `npm test` 952 통과(92 파일) · `npm run build`(tsc+vite) 성공.

S1 인계 노트의 "다음 한 가지". 「준비 중」 비활성이던 함께 구상 카드를 **onboard-chat 대화 엔진(plan-chat 정본 미러, 카탈로그 없음)** 으로 활성화 — 단일 구상 파트너와 채팅으로 소재를 캐다가 DiveSetup 으로 응결 → 기존 playseed 확인 카드(상대 선택) → dive. brainstorm 확정 3건 — ① **응결 트리거 = 하이브리드**(LLM 자발 시드 카드 제안 + 상시 「이걸로 시작」 강제 응결 지시 턴, 같은 JSON 계약 `{reply, setup?}` 하나) ② **제안 스키마 = 응결 한 방**(대화 중 자유 텍스트만, plan-chat 식 필드 누적 없음) ③ **단일 구상 파트너**(로테이션은 S3). spec `docs/superpowers/specs/2026-07-12-onboard-chat-ideate-design.md` · plan `docs/superpowers/plans/2026-07-12-onboard-chat-ideate.md`. subagent-driven TDD 7태스크+라이브(태스크별 스펙/품질 2단 검토, 발견 전부 반영).
- **구현** — `parseDiveSetup` diveProposal.ts 승격(도메인 홈, 응결 검증 재사용, `b9b772d`) · `onboardChat.ts` 순수 모듈(transcript 8·normalize: reply 비면 턴 실패, 손상 setup 은 setup 만 강등, `db82874`) · `buildOnboardChatPrompt` 정본+storyx.mjs 미러·커맨드(**[onboard-mirror] 핀 3줄** — JSON 계약·응결 조건·condense 지시, mock 은 --condense 시 미니 setup, `7905e91`) · 클라이언트+aiStatus 「구상 대화」+vite 브리지+**api/onboard-chat.ts prod Function**(dive-* prod 누락 반복 금지, `9042336`) · HomeFlowStep `'ideate'`+OnboardingDraft 통합 영속(onboardChatMessages·playSeedEntry, clearOnboardingDraft 가 클리어 공짜 처리, `ed2f0f0`) · `OnboardChatPanel`(버블·시드 카드·이걸로 시작, nx-ink 명시, `f422935`) · App 배선(카드 활성화·ideate 상호배타 mount·isSourceBranch 접기·**playseed onBack 진입원 분기(playSeedEntry)**·경과 타이머+새로고침 금지·매체 변경 클리어 이전값 비교 ref[StrictMode 멱등], `34bbc0d`).
- **검토 반영** — parseDiveSetup 직접 단언 케이스 보강(`ec1c38f`) · busy 중 응결 버튼·컴포저 disabled 단언+주석 현행화(`318862f`) · 죽은 hx-source-soon·:disabled CSS 제거(`1c6c60c`).
- **라이브 통짜(preview 5175, 빈 상태)** — 소설→소재발굴→함께 구상 활성(「준비 중」 소멸)→실 codex 2턴(파트너가 재료 되받아 질문 하나씩·경과 타이머·busy 비활성)→**2턴째 자발 응결 시드 카드**(막차 역·실종된 누나 — 대화 재료로만 구성)→ideate 중 새로고침 복원(스텝·대화 6·시드 카드 생존)→**「이걸로 시작」 강제 응결**(한 문장 reply+setup 필수 준수)→시드 승인→playseed(응결 setup·상대 누나·핀 문구·프리셋 칩 공존)→**onBack='ideate' 복귀 실측**→「이대로 시작」→dive(제목 myRole 파생·장면 주입·상대 정확)→1턴 실 대화(voiceRules 코헤런트 "죄송하지만 승객님을 아는 사람은 아닙니다"+명부 복선)→clearOnboardingDraft 잔존 0. 회귀 — 프리셋 0콜·onBack='preset' / 자유 서술 「인터뷰로 계속」 / 에세이 단일 CTA·소재발굴 미마운트. 전 구간 콘솔·서버 에러 0.
- **불변식** — 기존 인터뷰 경로·비소설 무접촉 · 프리셋 갈래 setPlaySeedEntry 1줄만 · handleStartPlay 순서 핀 무변경 · playseed 이후 경로 공유(응결 setup 도 같은 confirmPlaySeed→buildPlayFirstProject) · plan-chat 계열 무접촉·미러 byte-identical · ideate 는 인디케이터 배열 밖(isSourceBranch 로 source 접기).
- **후속(기록)** — in-flight 응답 중 매체 변경 시 고아 버블(저위험, S3 에서 seq 가드 3줄) · S3 = 적응형 인터뷰(자유 서술 재배선·goToPlaySeed 부활·STORY_PRESETS.keywords 유사-앵커 비교 제안·playSeedEntry 확장) · prod Function 은 배포 후 스모크 필요(기존 계열 갭과 동일).

## 완료 트랙 — 온보딩 소재발굴 S1: 선택 스텝 + 인기 프리셋 갈래 (`done` · 2026-07-12, 브랜치 `feat/source-discovery-preset`)

> 최근 검증(2026-07-12) — `bash init.sh` 통과: `npm test` 924 통과(89 파일) · `npm run build`(tsc+vite) 성공.

PR #33 파킹(`9f013ac`) 후 같은 날 확정된 온보딩 재설계([[play-first-paradigm]])의 첫 슬라이스. brainstorm 확정 결정 6건 — ① "함께 구상"+적응형 인터뷰 = **onboard-chat 한 엔진 두 진입점**(plan-chat 미러, prod Function 필수 — S2) ② 종료 산출 = 플레이 시드 응결·상대 선택 마지막 질문(S2/S3) ③ 3갈래 UI = **선택 스텝 → 갈래별 패널** ④ 프리셋 = 신규 **StoryPreset 구성 단위**(keywords가 S3 유사-앵커 데이터 기반) ⑤ 소설류만 ⑥ S1 프리셋 먼저 → S2 엔진+함께 구상 → S3 적응형 인터뷰. spec `docs/superpowers/specs/2026-07-12-source-discovery-preset-design.md` · plan `docs/superpowers/plans/2026-07-12-source-discovery-preset.md`. subagent-driven TDD 5태스크+라이브(태스크별 스펙/품질 2단 검토, 발견 전부 반영).
- **구현** — `STORY_PRESETS` 5종 구성 단위 카탈로그(storyPresets.ts — 루프 회귀·부자·악역 영애 빙의·헌터·아카데미, 인물 진하게·헌장/결말 없음, `a506dcf`) · `buildPlayFirstProject` partnerIndex(기본 cast[0] 폴백, `bb3663a`) · HomeFlowStep 'source'/'preset' 8값+isHomeFlowStep+**playSetup shape 가드**(blind-cast 백로그 해소, `f4afa79`) · PlaySeedPanel 대화 상대 버튼 그룹(aria-pressed, `72be9f6`) · App 배선(source 3장 카드[함께 구상 「준비 중」 비활성]·preset 패널·갈래 조건부 mount·homeFlowIndex/indicatorIndex 이원화[갈래를 source로 접어 인터뷰 전진 스킵 방지]·파킹 핀→3갈래 핀 교체, `d915e07`).
- **검토 반영** — parseDiveSetup all-or-nothing 정책 주석+거부 분기 커버리지(`500391b`) · 상대 선택 단언 버튼 단위 매칭(근접 슬라이스가 cast 3인에서 위양성 — 리뷰어 재현 증명, `175f4b4`) · goToPlaySeed 휴면 표식 복원+onBack preset-전용 가정 명시(`89b93a1`) · **라이브 발견** 카드 버튼 UA 검정 상속 비가시 → nx-ink 명시(`d178e8e`).
- **라이브 통짜(preview 5175, 빈 상태)** — 소설 선택→인디케이터 「소재발굴」 2단계→3장 카드→인기 프리셋→5장 카드→루프 회귀물→playseed 확인 카드(핀 문구·프리셋 칩 3종 공존)→**상대를 차도현(cast[1])으로 변경→dive 세션 상대 정확 반영**→1턴 실 codex 대화(voiceRules 코헤런트 "믿느냐고 묻기 전에, 왜 하필 '오늘 밤'입니까?"·arc·선택지 칩). preset 스텝 새로고침 복원(transform -200% 정확). 자유 서술 갈래→「인터뷰로 계속」 보존·이전=source. 에세이 회귀(source unmount·「자유 서술로 계속」·기존 인디케이터). 전 구간 콘솔 에러 0. 전 상태 캐러셀 인덱스 실측 정합(스펙 검토 표).
- **불변식** — 기존 인터뷰→헌장→building 로직 무변경 · 비소설 무접촉 · 프리셋 갈래 LLM 0콜 · 헌장/결말 선결정 없음 · handleStartPlay 순서 핀 유지.
- **후속(기록)** — playPartnerIndex 비영속(새로고침 시 cast[0] 리셋 — 의도적 수용) · playseed에서 인디케이터가 인터뷰까지 ✓ 표시(buildingPanelIndex 공유의 코스메틱) · goToPlaySeed 여전히 휴면(S3에서 재배선, onBack 진입원 분기 동반 필요) · S2 = onboard-chat 엔진+함께 구상 · S3 = 적응형 인터뷰(유사-앵커 비교 제안·상대 선택 마지막 질문) · 플레이→이전 단계 복귀 동선.

## 완료 트랙 — PLAY-first 온보딩: 소설류 기본 진입 (`done` · 2026-07-12, 브랜치 `feat/play-first-onboarding`)

> 최근 검증(2026-07-12) — `bash init.sh` 통과: `npm test` 913 통과(88 파일) · `npm run build`(tsc+vite) 성공.

사용자 dogfooding 발견("초안이 먼저 있으니 플레이가 재미없다")에서 출발한 방향 전환 — **PLAY(대화)가 기본 창작 진입**([[play-first-paradigm]]). 소설류 온보딩에서 자유 서술 다음 기본 CTA를 「플레이로 시작」으로, 단발 제안 1콜(`requestDiveSetup` 재사용) 또는 프리셋 0콜(`DIVE_SEED_CHARACTERS` 3종) → 확인 카드(주의사항 핀 "정확하지 않아도 됩니다…") → 최소 프로젝트 생성(인물 진하게·플롯 얕게, 회차 0) → 바로 `stage='dive'`. 이후 응결·⟳최신화·PLAN 전부 기존 경로 무접촉 재사용. spec `docs/superpowers/specs/2026-07-12-play-first-onboarding-design.md` · plan `docs/superpowers/plans/2026-07-12-play-first-onboarding.md`. subagent-driven TDD 3태스크+검증(태스크별 스펙/품질 2단 검토, 발견 전부 반영).
- **구현** — 순수 글루 `presetToDiveSetup`·`buildPlayFirstProject`(playEntry.ts, 옛 seedAndEnter 규칙 계승, `ae483b5`) · `PlaySeedPanel` 확인 카드(프레젠테이션 전용, nx 라이트 결, `02387a1`+`261cf14`) · App 배선(HomeFlowStep 'playseed'·소설류 CTA 위계·`handleStartPlay` saveProject→setWorkTitle→saveDiveState→졸업→dive, `5294ef3`+`a66e6f2`).
- **검토 반영** — 공백-only myRole 제목 폴백 · disabled 단언 태그 스코프·field 클래스 개명 · goToPlaySeed 재진입 가드+seq stale 응답 방어 · playSetup 영속(OnboardingDraft) · LLM 대기 타이머+새로고침 금지 안내(7df75b3 관례 승계) · 라이브 발견 workTitle stale(`829614d`) · 최종 리뷰 발견 isHomeFlowStep 'playseed' 누락(새로고침 매체 롤백, `5e90401`).
- **라이브 통짜(preview 5175, 빈 상태)** — 커스텀: 자유 서술(심야 세탁소)→실 codex 제안(소재 정확 맞춤, <1분)→확인 카드→dive 진입(제안 scene 주입·인물 2·회차 0)→2턴 대화(노인 역 코헤런트)→응결 「두 번 눌린 소매」→승인→⟳최신화 committed 1화(1,337자)·캐논 4 합류→WRITE 렌더. 프리셋: 빈 서술→0콜 확인→도윤 시드 dive 진입. 비-소설(에세이) 기존 단일 CTA 무변경. playseed 새로고침 복원. 전 구간 콘솔 에러 0.
- **불변식** — 기존 인터뷰 경로 로직 무변경(CTA 위계만) · 비-소설 무접촉 · PLAY committed 읽기 전용 · 헌장/결말 미생성 · 바이블 형태 보존.
- **후속(경미·기록)** — goToPlaySeed 캐시 비대칭(재진입마다 재호출, goToIntake 관례와 다름) · parseOnboardingDraft playSetup blind-cast shape 가드 · 실패 시 stale 카드+에러 동시 렌더 · codex가 myRole을 cast에 중복 포함(cast[0]=사용자 역이 세션 상대역, 프롬프트 정련) · 제목 파생 문장 중간 절단(코스메틱) · prod dive 엔드포인트 패리티(기존 갭) · 에세이 대화형 플레이(다음 슬라이스, essay-interviewer 재해석).

## 완료 트랙 — 온보딩 LLM 대기 진행 피드백 + 폴백 문구 (`done` · 2026-07-09, **main 머지** `3a94165`)

사용자 dogfooding 중 발견 — 로컬에서 인터뷰 진입 시 "⚠️ LLM 인터뷰 호출 실패 — Failed to fetch". 근인 진단(추측 배제·라이브 실측) — ① dev 는 `/api/interview` vite 브리지가 **codex CLI**로 생성(API 키 무관 — 폴백 문구의 claude login/ANTHROPIC_API_KEY 안내가 틀림) ② 인터뷰가 **실측 ~70초** 걸리는데 로딩 화면이 "10~30초" 정적 문구뿐 → hang 오인·새로고침 → **진행 중 fetch 취소**("Failed to fetch"). 타임아웃 문제 아님(codex 5분·클라 무한대기·vite 무설정 확인).
- **수정(`3a94165`)** — `generationProgress` 에 `interviewStageMessage`(3구간)·`INTERVIEW_TIME_HINT`(~1분·새로고침 금지) 추가(순수 TDD) · 인터뷰 로딩 화면에 경과 타이머(1초 setInterval·상태 토글 리셋)+단계 메시지+새로고침 금지(role=status·aria-live) · 폴백 문구를 codex CLI·`npm run dev`·새로고침 금지로 교체 · **같은 fetch-사망 함정이 있는 첫 초안 생성(~2~3분) 화면도 동일 패턴 적용**(`GENERATION_TIME_HINT` 에 새로고침 금지 추가, FloatingEditor 초안 진행과 공유).
- **라이브 검증** — 인터뷰 로딩 0:08→0:37 타이머 카운트·단계 메시지 진전("자유 서술 읽는 중"→"질문 고르는 중")·안내 렌더·콘솔 0, 실 codex 인터뷰 성공 후 다음 단계 진행.
- **불변식** — 진행 표시는 로딩 상태 파생만(생성 동작 무접촉)·타이머는 상태 토글에 리셋·실 codex 소요는 못 줄임(정직한 힌트로 기대치 조정). 범위 밖 = 진짜 스트리밍(SSE).

## 완료 트랙 — 게이트/에디터 후속 정비 3건 (`done` · 2026-07-09, **main 머지** `4fd2978`)

> 최근 검증(2026-07-09) — `bash init.sh` 통과: `npm test` 전체 통과 · `npm run build`(tsc+vite) 성공. 머지 후 main 재확인 녹색.

3모드 라이브 관찰이 드러낸 후속(사용자 선택 3건)을 TDD로 마감. 각 근인 라이브/유닛 재현→수정→검증.
- **FloatingEditor 크래시 방어(`b2ecb05`)** — 하드-시딩/import 프로젝트가 회차의 `outline·memoryAnchors·newCanonFacts` 나 인물의 `voiceRules·canonAnchors·forbiddenContradictions` 를 빠뜨리면 `buildStoryEditorWorkspace` 의 `chapter.memoryAnchors.length`·`buildCodexEntries` 의 `character.voiceRules.join` 에서 TypeError→StoryXDesk 크래시(빈 화면). 라이브 재현→근인 2개(회차·인물 배열) 확정→`normalizeProject`(로드·import 공용 관문)에서 누락 배열 [] · 문자열 '' 백필→하드시드 무손상 렌더 확인.
- **PLAN 충돌 배지 정보성 경고 제외 + PLAY 주인공 감지(`3c1b983`)** — ① `continuitySummary.warnings` 가 memory-anchor 정보성 넛지까지 세어 PLAN "⚠ 충돌 N" 이 상시 부풀던 것을 카운트에서 제외(issues 배열엔 유지). ② `seedPlayFromProject` 가 `characters[0]` 무조건 주인공→role(주인공/주연)→"주인공" 캐논 문장 내 이름→로그라인→폴백 순 감지(ch23=리아나 정확).
- **계사 정체성 hard canon 라우팅(`7102b84`)** — "형사이며 감정을…" 이 '감정' 키워드에 끌려 livingState 로 가 정체성 반전이 경고에 그치던 것을, `hasCopulaIdentity`([비상태 명사]+이며/이고/이다) 가드로 hard canon 승격. 상태 명사+계사는 제외해 가변 상태 보존(기존 living-state 테스트 무회귀). **실측** — 스릴러 누적 캐논 형사→민간인 recall 경고→BLOCK(3/4), 재진술 FP 0/23 유지.
- **불변식** — 정밀도 무손실(재진술 FP 0)·living-state cause/cost 보존·결정론. 범위 밖 = 추상 없음/있음·비-최종절 부정 미모델링(기억공백 miss)·잔여 FP 16(밀집 reveal)·BYOK(사용자 결정 대기).

## 완료 트랙 — 멀티회차 실제 codex 이어 생성 관찰 (`done` · 2026-07-09, 코드 변경 0)

1순위 잔여(실제 codex 이어 생성·유기적 드리프트)를 밟음. 예비비행 #6 스릴러(`젖은 유리의 얼굴`) ch1 위에 **실제 codex로 ch2~ch6 이어 생성**(드라이버가 매 화 누적 캐논을 context로 먹이고 `validateContinuity`를 돌림). 정본 `docs/reviews/2026-07-09-multichapter-live/`(drive-chapters.ts·chapters/·observations.md).
- **생성** — 5/5 화 성공(status=complete·prose 1.9~2.5K자), 캐논 **5→23 누적**, 전 화 hard-canon BLOCK 0. 윤민서 형사·기억공백 1:17·한태겸 살해·사진 전시 수법 유지하며 오세진 도입→내부 은폐→사진 순서표→B-3 증거실 코헤런트 전개.
- **검증(BLOCK 0 = 진음성 확인)** — 누적 23팩트 위 직접 실측 — **재진술 FP 0/23·정합신규 0/2**(유기적 누적, reveal형 "자신이 아니라 백서연" 포함 → 계사부정 수정 실전 검증). **이빨 recall 3/4** — 死·목격자 부정 hard-BLOCK, 형사→민간인 living-state 경고(character owner→livingState 층), 진짜 누락 1 = "기억 공백 전혀 없다"(추상 없음/있음 미모델링).
- **핵심 결론** — 계사부정 수정(`1962c2d`)의 정밀도가 **로판 픽스처(잔여 16)와 달리 전형적 유기 누적에선 0 FP** — 잔여 16은 밀집 동일테마 reveal 클러스터 특수 케이스. "연속성=제품요건"이 이어 생성에서 실작동(누적 context 주입 시 codex가 하드 캐논 준수·게이트가 직접 모순 포착).
- **3모드 라이브 융합(1순위 마지막 잔여 `done`)** — preview에 23화·91캐논 로판 주입 후 PLAY/WRITE/PLAN 관찰(정본 `docs/reviews/2026-07-09-multichapter-live/3mode-observations.md`). 세 방식이 한 committed 캐논을 코헤런트하게 조각(WRITE 23화·PLAN 바이블 91·PLAY 이어 플레이 ch23 시딩), 무리마운트 전환·크래시·콘솔 0. **계사부정 수정 라이브 검증** — 「흐름 검증」 6인 codex 패널의 연속성 감수자 "차단할 직접 모순은 없지만…"(누적 91캐논 가짜 충돌 0 + 크래프트 노트), PLAN "⚠ 충돌 1"은 benign 미싱-앵커 warning(status=clear·하드 FP 아님), 결정론 게이트 하드 블록 0. → **1순위(멀티회차 연속성) 3단계 전부 완료**(결정론 하네스+수정·실제 codex 생성·3모드 라이브).
- **후속(경미·내 작업 무관)** — character owner→livingState 라우팅(정체성 반전이 경고에 그침) · 추상 없음/있음·비-최종절 부정 미모델링 · PLAN "충돌 N"이 benign warning까지 셈(코스메틱) · PLAY 주인공 시딩 `characters[0]` 휴리스틱(리아나 대신 레나).

## 완료 트랙 — 멀티회차 누적 연속성 게이트 검증 + 계사부정 FP 정밀화 (`done` · 2026-07-09, **main 머지** `1962c2d`)

> 최근 검증(2026-07-09) — `bash init.sh` 통과: `npm test` 887 통과(87 파일) · `npm run build`(tsc+vite) 성공. 누적 하네스 재진술 FP 16/91·recall 3/5.

핸드오프 1순위(멀티회차 누적 대비 게이트 실측)를 결정론 하네스로 밟아 **정밀도 붕괴를 발견하고 즉시 수정**. 예비비행 1화 소재엔 누적이 없어, 저장소의 **실제 23화·91팩트 로판 백업**(`02-work-backup-ch23.json`, forbiddenContradictions 0 → 자동 의미 게이트만 발화)을 픽스처로 `validateContinuity`/`classifyCanonChange` 직접 실측. 정본 `docs/reviews/2026-07-09-multichapter-continuity/` · spec/plan `docs/superpowers/{specs,plans}/2026-07-09-continuity-copula-accumulation-fp*`.
- **수정(fix `bf232d5`) — 주어 일치 게이트로 누적 오탐 정밀화** — 계사부정 두 루프·주술어부정을 **`sameSubject`(양쪽 `extractSubject` 확정 일치) 안에만** 발화. 반전은 정의상 "같은 주어에 대한 상반 서술"이므로 성씨 조각(벨로트·위클리프) 공유만으론 반전 아님 → reveal 팩트가 다른 주어 팩트를 오염시키던 문제 차단. + presence side a `있다` 보조용언("-어/-고 있다") negative-lookbehind 제외 + finalNeg 공유 술어 **2개+** 요구(`sharesNonEntityPredicate`→`sharedNonEntityPredicateCount`). **재진술 FP 53→16(70%↓)·정합신규 3→1·recall 3/5 무손실·기존 24 단위 무회귀**(스파이크 실측: naive 엔티티 가드 53→44, 주어 일치 53→19, +presence/finalNeg 53→16). TDD(RED 4→GREEN, continuityContract 28) · init.sh 녹색.
- **원 발견 — #32 정밀도가 누적에서 붕괴** — 1화 격리(#32)의 오탐 0이 91팩트 누적에서 재진술 FP 53/91로 무너짐. 근인 = reveal 팩트("X가 아니며")를 하드 제약으로 삼아 그 엔티티 언급·조각공유만으로 위반 판정. #32 recall 보강이 이 오탐 유발, 1화 테스트가 가림.
- **범위 밖(후속)** — 잔여 FP 16(밀집 동일테마 reveal, 공격적 제약 시 recall 트레이드오프) · recall 누락 2건(멸문↔번영 미등록 축·레오르 death형 "죽지" 미매치, 멸문-miss는 후반 캐논이 supersede해 정당 non-block 가능) · 캐논 화차 태그 시효 모델 · 실제 codex 이어 생성(예비비행 #6 유기적 드리프트)·PLAY/WRITE/PLAN 3모드 실사용 연속성(1순위 잔여).

### (원 발견 기록 — 참고)
결정론 하네스 실측 상세. 정본 `docs/reviews/2026-07-09-multichapter-continuity/`(context-notes·findings·gate-accumulation.ts·-diagnose.ts).
- **핵심 발견 — #32 정밀도가 누적에서 붕괴** — 1화 격리(#32)의 오탐 0이 91팩트 누적에서 무너짐. **재진술 FP 53/91**(기존 캐논을 그대로 다시 진술해도 53개가 하드 모순 BLOCK)·정합신규 FP 3/4·직접모순 recall 3/5.
- **근인(정량)** — 53건 중 **~51건이 #32가 추가한 계사부정(X가아니) 매처 과발화**. reveal 팩트("권한자는 레나 위클리프가 아니며…")를 하드 제약으로 삼아, 그 엔티티(레나·레오르)를 **언급만 해도** 위반 판정(claim이 술어로 단정하는지 미확인). 미스터리·로판 반전은 본디 부정형 서술이라 구조적. `findReversalMatch` 둘째 루프(continuityContract.ts:404). presence 있다/없다 보조용언 혼동은 2건(부차).
- **recall 3/5(혼재)** — 멸문-miss는 후반 캐논이 "운명 바뀌었음"을 이미 확정 → 누적이 초기 하드팩트를 supersede한 **정당한 non-block일 수 있음**. 레오르 생사-miss는 부정형 "죽지" death패턴 미매치 + record형 엔티티 매칭 미발화(정밀 추적 후속).
- **판단** — 지배적 문제는 recall 갭이 아니라 정밀도 붕괴다. 불변식 "정밀한 직접 모순만·오탐 0"이 누적에서 위반. #32 recall 보강이 정확히 이 오탐 유발, 1화 격리 테스트가 가림.
- **권고(사용자 결정 필요·불변식 영역)** — ① 계사부정 둘째 루프를 진짜 반전에만 좁힘(claim이 부정명사를 술어로 단정할 때만·주어 언급 스킵, 첫째 루프 케이스 A 보존, 재진술 FP ~51 제거·recall 무손실 목표) ② presence 축 보조용언 제외 ③ (설계) 캐논 화차 태그 시효 모델. brainstorming→spec→TDD 슬라이스(이 하네스가 회귀 픽스처).
- **미착수** — 실제 codex 이어 생성(예비비행 #6, 유기적 드리프트)·PLAY/WRITE/PLAN 3모드 실사용 연속성.

## 완료 트랙 — 자동 의미 연속성 게이트 한국어 recall 보강 (`done` · 2026-07-08)

예비비행이 실측한 발견(자동 의미 게이트가 한국어 직접 모순 미포착) 해소. brainstorming(목표=정밀한 직접 모순만)→spec(`docs/superpowers/specs/2026-07-08-continuity-semantic-gate-korean-recall-design.md`)→TDD. `classifyCanonChange`/`findReversalMatch`(continuityContract.ts) 국소 보강, 결정론 유지.
- **구현** — ① 절 확장 토큰화(`clauseExpandedNouns` — "형사이며"→형사) ② death 축에 살해/피살/살인(OPPOSITION_PATTERNS·isStateToken) ③ 문중 주어 추출 폴백(`extractSubject` — "…한태겸이 살해") ④ 계사 부정(`copulaNegatedNouns` — "X가 아니") ⑤ 주술어(마지막 절) 부정 극성(`hasFinalNegation`) + 엔티티 제외 공유 술어(`sharesNonEntityPredicate`) — 부수 부정("없이도") 오탐 차단. 죽은 `claimNegated` 파라미터 정리.
- **정밀도/불변식** — 정밀한 직접 모순만(사용자 결정) · 결정론(LLM·사전 없음) · living-state/soft-signal 보존 · classifyCanonChange는 프롬프트 미러 아님(순수 코드).
- **검증(TDD)** — continuityContract 6 신규(케이스 A·B·오탐 가드 3·FP 회귀 1) + 기존 18 회귀 0 · init.sh 녹색. **실측** — 실 #6 캐논 직접 모순 2/2 BLOCK(전엔 0/2)·시드 반전/정합 통과·**6개 실 캐논 39주장 오탐 0**(`gate-continuity.ts`·`gate-fp-scan.ts`). FP 발견→회귀 테스트 박제→최종 절 부정 규칙으로 해소(TDD 과정에서 부수 부정 오탐 클래스 잡음).
- **후속** — 학술 A2/A4 한국어 문형 recall · canon-librarian 메타 필터 · 실존인물 정책 · (다음 라운드) 장편 여러 화 이어 생성·PLAY/WRITE/PLAN 실사용 연속성 관찰.

## 완료 트랙 — 6-페르소나 예비비행 + 차별점 게이트 실발화 검증 (`done` · 2026-07-08, 외부 테스트 준비)

사용자 설계 6조건(소설×3·에세이·만화·학술)을 로컬 Codex CLI 배치로 생성해 제품 폭·게이트 판정력을 실측. 정본 `docs/reviews/2026-07-08-preflight-personas/`(context-notes·checklist·findings·drafts·gate-*.ts). 경계 = 폭 검증이지 M7 단계2(외부 시장신호) 대체 아님.
- **폭 검증 PASS** — 6/6 생성 성공(실패 0), 매체 4종 전부 코헤런트·조건 정합·구조 완비(1,780~2,598자). 에세이 진실계약 실작동(#3 사적 디테일 발명 거부) 확인.
- **차별점 게이트 실발화(tsx로 실 prose 직접 실행) — 핵심 발견** — ① **학술(#5)** = A3 인용 무결성 견고(인용/참고문헌 부재 정확 포착), 단 A2 주장추출 한국어 recall 약함(2000자 논증에서 주장 1개만). ② **연속성(#6)** = 명시 규칙(forbiddenContradictions) 경로는 발화 O(주 메커니즘·신뢰), 그러나 **자동 의미 게이트(classifyCanonChange/Gap-3)가 직접 hard-canon 모순 2/2 미포착** — 근본원인 문장단위 부정극성 상쇄 + 고유명사·한자어 명사추출 약함. "연속성=제품요건"은 바이블 forbiddenContradictions가 채워졌을 때 실작동(23화 실증), 자유 생성물 드리프트 자동포착은 한국어에서 약함(2026-06-01 검토의 "판정력 비어있음"이 자동층에서 실측 확인).
- **교차 발견** — 메타 누수→캐논(#3/#5가 medium/format를 캐논 사실로 발화)·draft 산문우선(웹툰 패널·학술 인용은 다운스트림층)·실존인물 가드 부재(#1 우연 탈식별).
- **후속 후보** — 자동 의미 게이트 한국어 recall 보강(부정극성 절 단위화·고유명사 사전)·학술 A2/A4 한국어 문형·canon-librarian 메타 필터·실존인물 처리 정책.

## 완료 트랙 — first-run E2E 무개입 검증 (`done` · 2026-07-08, 외부 테스트 준비 게이트0)

외부 작가 실증(M7 단계2) 착수 전, **신규 사용자가 백업 주입·`?stage=` 직행 없이 랜딩부터 첫 회차 생성까지 통짜로 완주하는지**를 처음으로 라이브 검증(사용자 결정 = first-run E2E 우선). localStorage 완전 초기화 후 빈 상태에서 시작, 실 codex 왕복 3콜 포함.
- **통과 구간** — ① 랜딩 렌더·콘솔0 ② 「창작 시작」→온보딩(매체 소설/장편 기본 선택) ③ 자유 서술 입력→`POST /api/interview`(실 codex)→**내 소재에 정확 맞춤화된 질문·선택지 생성** ④ 인터뷰 답변→헌장 단계 spine-suggest 맞춤 척추 제안 ⑤ 「에디터로」→에디터(`fc-app`) 진입, **로그라인·캐논3·캐릭터3 자동 구성**, 크래시0 ⑥ 「초안 생성」→`POST /api/draft`(실 codex)→완결 첫 회차 렌더("반환실의 초승달" 1,975자·비트6 긴장곡선·새 캐논3·rewardArc·stakesLedger, `.storyx-runs/drafts/`에 저장)·**streak 「🔥 1일 연속」 자동 발화(B2)** ⑦ 전 구간 콘솔 에러0·크래시0.
- **발견(외부 테스트 리스크)** — ⓐ **초안 생성 지연 ~2.5~3분**(codex), 그 동안 정적 「생성 중…」만 노출·진행 표시/스트리밍 없음 → 신규 사용자가 hang으로 오인할 위험 → **아래 진행 피드백 슬라이스로 해소** ⓑ 작품 제목이 온보딩에서 자동 설정 안 됨(에디터 상단 「샘플 작품」 기본값, 회차 제목은 정상) — 코스메틱 ⓒ **BYOK 미지원** — 배포 앱은 서버 env 키(`AI_GATEWAY_API_KEY`/`ANTHROPIC_API_KEY`=소유자 키)만 소스, 클라이언트 키 입력 UI 없음(`src/lib/server/llmRunner.ts`) → "작가 자기 키 부담" BYOK 외부 테스트는 현 코드로 불가, 별도 결정/구현 필요.
- **결론** — 핵심 완성 루프(인터뷰→헌장→생성)는 신규 사용자에게 무개입으로 작동. 게이트0 first-run 항목 충족. 남은 게이트0 = ~~생성 지연 UX~~(해소)·BYOK 경로·(self-reported) FloatingEditor 하드-시딩 크래시 방어·프로덕션 배포 URL 실호출 확인.

## 완료 트랙 — 초안 생성 진행 피드백 (`done` · 2026-07-08, 게이트0 발견 ⓐ 해소, 미머지)

first-run E2E 발견 ⓐ(초안 생성 ~2.5~3분 정적 「생성 중…」이 hang으로 오인) 해소. 실 스트리밍(서버 SSE)은 범위 밖으로 두고, **경과 타이머 + 단계별 안심 메시지 + 예상시간 힌트**로 신규 작가를 붙잡는다. TDD(순수 모듈 먼저).
- **구현** — 순수 `src/lib/generationProgress.ts`(`formatElapsed` m:ss·음수/NaN 방어 · `generationStageMessage` 4구간 20/50/100초 경계·마지막 수렴 · `GENERATION_TIME_HINT`) + `generationProgress.test.ts` 7 · `FloatingEditor` isGenerating 동안 1초 setInterval 경과 상태(시작 시 0 리셋) → 버튼 라벨 「생성 중 · m:ss」 + `.fc-gen-progress`(role=status·aria-live=polite: 단계 메시지 + 힌트) · `styles.css` `.fc-gen-*`(warm `--ink`/`--ink-dim`·모드색 펄스 도트·`--st-ease`, reduced-motion 블록에 `.fc-gen-stage::before` 추가) · floatingEditor.test +2(진행줄 렌더/미렌더) · editorFocusLayout F-002 핀 갱신(`생성 중…`→`생성 중`+`fc-gen-progress`, 약화 아님·강화).
- **불변식** — 진행 표시는 isGenerating 파생만(생성 동작·데이터 무접촉) · 타이머는 isGenerating 토글에 리셋 · 실 codex 소요는 못 줄임(정직한 힌트로 기대치만 조정).
- **검증** — init.sh 녹색(순수 7 + 컴포넌트 2 신규) · **라이브(preview 5175)** HMR 후 에디터 무회귀 마운트·콘솔0·리뷰(쇼러너/캐릭터 큐레이터) 정상. 진행줄 자체의 mid-generation 시각은 jsdom 컴포넌트 테스트로 확정(라이브 재트리거는 빈 새 회차 상태 필요 — 현 프로젝트는 단일 회차라 「출간 확정」만 노출).
- **후속** — 진짜 스트리밍(서버 SSE로 토큰/비트 단위 진행) · 빈 새 회차 경로에서 progress 라이브 캡처 · 미머지(브랜치 미생성, main 직접 편집 상태 — 커밋 전 브랜치 필요).

## 최근 검증 (2026-07-08 PLAN 설계 대화 채널 슬라이스 후)
`bash init.sh` 통과 — `npm test` **868 통과**(86 파일) · `npm run build`(tsc+vite) 성공. Canon Core(MVP-0) PR #7 · MVP-1 PLAY 거버넌스 PR #9 · MVP-2 응결 스튜디오 PR #10 · 슬라이스 B(LLM 검증기) PR #11 · 🔴 retcon 경로 PR #12 · 융합 셸 슬라이스 A PR #13 · B(싱크 콘솔) PR #14 · B-2(reconcile 게이트) PR #15 · 최신화 토스트 PR #16 · 슬라이스 C(단일 바 셸) PR #17 · legacy 셸 정리 PR #18 · 고아·CSS 정리 PR #19 · PLAN staged PR #20 · PLAY 진입 융합 파트 1 PR #21 · 파트 2 PR #23 · 랜딩 원페이저 PR #24 · PLAY 전개 후보(VS) `a33768e` · 흡인력 게이트 PR #25 · 디자인 정비 슬라이스 1+2 PR #26 · 슬라이스 3(핀 완화) PR #27 · 슬라이스 4a(죽은 세대 정리) PR #28 · VS 긴장 배지 PR #29 · **PLAN 설계 대화 채널 PR #30** (전부 main).

## 완료 트랙 — PLAN 설계 대화 채널: 설계실 2단계 (`done` · 2026-07-08, **PR #30 main 머지** `254cb2b`)

PLAN staged(PR #20)의 사용자 결정 ①("PLAN 역할 = AI와 같이 짜는 설계실")을 완성한 조각 — 설계안을 안전하게 쌓는 그릇 위에 "같이 짜는 상대"를 얹었다. PLAN dock 「✦ 설계」 패널에서 단일 설계 파트너와 대화하고, LLM이 같은 콜에서 reply + 승인형 패치 제안(인물 desire/wound/currentState·세계 rule·캐논 statement·스토리코어 5필드)을 verbalize, 「설계안으로」 승인 시 **기존 stage\* 핸들러 재사용**으로 설계안(PLAN +N)에 합류. spec `docs/superpowers/specs/2026-07-07-plan-design-chat-design.md` · 계획 `docs/superpowers/plans/2026-07-08-plan-design-chat.md`. brainstorming 결정 6건(승인형 제안·dock 패널·단일 파트너·localStorage 영속·6점 배선·접근안 2 하네스 미리보기). subagent-driven TDD 9태스크(태스크별 spec/품질 2단 검토, 발견 반영 다수).
- **구현** — 순수 `planChat.ts`(카탈로그 id 집합+80자 절단·transcript·정규화: kind/field 화이트리스트·**title 드랍 필수 핀**·프로토타입 누수 가드·출력 정체성 dedup·상한 3) · `plan-chat` localStorage 영속(schema v1·40 cap, remount 생존) · 프롬프트 6점 배선(promptBuilders↔storyx.mjs byte-identical + `[plan-mirror]` 핀이 계약+지시문 전문·prod Function·클라이언트 3중 강등·AiCallMode) · `PlanChatPanel`(버블·승인형 카드·하네스 미리보기·Enter 전송·pre-wrap) · FDW dock 「✦ 설계」+designSlot · StoryXDesk 배선(상태·sendPlanChat[catalog 단일 객체·overlay 컨텍스트]·approvePlanProposal[stage\* 성공 시에만 ✓, 대상 소멸 시 note 강등]·overlayHarnessReport 미리보기) · `#fc-pd-design .pb{max-height:none}` 이중 스크롤 수리 · **clear+remount 회귀 테스트**(PR #20 잔여 MEDIUM 해소, 변이 실험 강제력 입증).
- **불변식** — 승인=stage\* 재사용(upsertPlanPatch 직접 호출 0) · 제안은 필드 수정만(인물 CRUD·헌장·제목·creative-weight 불가) · LLM 호출은 사용자 발화 시에만 · 미러 byte-identical(핀) · App key=syncVersion만·반영/버리기·충돌 게이트 무접촉 · WRITE/PLAY 무접촉.
- **검증** — init.sh 녹색 · 태스크별 2단 검토(Important 수리: 프로토타입 누수·dedup·dry-run format·pre-wrap/Enter·approve 성공 확인·회귀 테스트 위생) · **라이브(preview 5175, ch23 백업) 6게이트** — ① dock 「✦ 설계」 패널(상태·집중 사이·Enter placeholder) ② 실 codex 왕복 reply + 제안 3개(카탈로그 실존 인물 리아나 정확 겨냥·근거 동반) ③ 「설계안으로」→카드 ✓ 비활성 + SyncConsole ✦ PLAN +1 + **워크벤치 리아나 욕망 필드 「설계안 (미반영)」 태그·새 값 반영(스크린샷 실증)** ④ 하네스 미리보기 줄(100→100, ch23 만점작이라 동점 — spec "전후 동점도 표시" 그대로, overlay 재채점은 실작동) ⑤ **새로고침(remount보다 강함) 후 대화 2·승인 카드 ✓·하네스·staged 패치 전부 생존** ⑥ 콘솔 에러 0.
- **라이브 관찰(무접촉)** — PLAN 배지 메뉴(SyncConsole)는 preview dispatchEvent로 React onClick 미발화(기존 quirk) — 반영 자체는 PR #20 라이브 검증분 + Task 8 회귀 테스트로 갈음. 짧은 뷰포트 패널 클리핑(dock 패널 공통·이번 변경 무관)은 후속 관찰.
- **알려진 한계(최종 리뷰 Important, accepted-risk)** — plan-chat 요청 진행 중(busy)에 사용자가 SyncConsole 반영/버리기를 누르면 `syncVersion++` remount로 옛 StoryXDesk 인스턴스가 unmount되고, 뒤늦게 resolve된 파트너 응답의 `setPlanChatMessages`가 no-op 되어 그 턴의 reply·제안이 조용히 사라진다(크래시·데이터 손상 없음·정밀 타이밍 필요). 근본 수정은 `planChatBusy`(StoryXDesk 내부)를 App이 알아야 반영/버리기를 게이트할 수 있어 **App↔StoryXDesk busy 배관 확장이 필요 — 이 슬라이스 범위 밖 후속 조각**. 반쪽 완화(응답 즉시 직접 영속)는 remount 경합 순서를 완전히 못 잡아 보류. 회귀 테스트 미커버(planStageRemount는 patches 불변식만, storage 왕복은 동기만).
- **후속(비목표)** — 섹션별 페르소나 스위칭 · 결정론 신호 주입(미회수 약속·충돌·조기 소진) · 인물 추가/헌장 제안 · 하네스 스테이지별 상세 미리보기 · **in-flight 응답 remount 손실 방어(busy 게이트, 위 한계)**.

## 완료 트랙 — VS 긴장 배지: 후보 흡인력 2축 주석 (`done` · 2026-07-07, **PR #29 main 머지** `6dec0fd`)

흡인력 후속 ①(VS 후보 흡인력 재순위)의 구현 — 의외도(rarity) 단일 축에 **긴장 기여 축**을 얹되, 자동 재순위가 아니라 **주석(배지)** 으로. 근거 = 딥리서치 "VS 재료 확장→흡인력 재순위→인간 선별" + 열린 질문 2(자동 재순위 우위 근거 없음). 사용자 결정 4건(brainstorming·목업) — ⓐ 같은 VS 콜 verbalize(별도 콜·결정론 판정 기각) ⓑ 배지·순서 불변(무언 정렬 기각) ⓒ canonSuspect와 독립 병기(긴장 먼저·캐논 끝) + 접근안 2(근거 툴팁). spec `docs/superpowers/specs/2026-07-07-vs-tension-annotation-design.md` · 계획 `docs/superpowers/plans/2026-07-07-vs-tension-annotation.md`. subagent-driven TDD 5태스크(태스크별 spec/품질 2단 검토).
- **구현** — `VsCandidate.tension?: 'arms'|'drains'`·`tensionNote?`(120자 절단) + `normalizeVsCandidates` enum 검증·조용한 강등(`8191b31`) · 프롬프트 지시 1줄+JSON 계약 2필드 미러 3점 세트(`9c7c30c`)+`[vs-mirror]` 핀에 지시문 전문(변이 실험 강제력 확인, `7d9ab47`) · PLAY `dx-vs-tension` 배지(`b1da70c`) · WRITE `fc-vs-tension` 배지(`2a8afcd`). 서버·입력 조립·선택 배관 무변경(후보 무가공 통과 구조 그대로).
- **불변식** — opt-in 전용 · 확률 숫자 비노출 · 후보 순서 보존(정렬 없음) · 기존 rarity 게이지·canonSuspect 무변경 · 미러 byte-identical(핀이 계약+지시문 둘 다 문다) · 데이터 계층 episodeBriefing 한 곳. 옛 VS spec "프롬프트 수정 봉인"은 새 spec이 명시 해제.
- **검증** — init.sh 녹색 · 신규 테스트 10 · 태스크별 2단 검토 전부 통과 + **최종 홀리스틱 리뷰 Ready to merge**(Critical/Important 0, Minor 2 = 개행 툴팁 코스메틱·중첩 title 의도) · **라이브(preview 5175, ch23 로판 백업)** — WRITE·PLAY 실 codex 8/8 후보에 tension 도착, 「새 긴장」 배지·근거 툴팁 렌더(computed `#22d3ee` 실측)·rarity 게이지 공존·콘솔 0·620px 오버플로 0, 툴팁 근거가 방향 텍스트와 정합.
- **관찰 ② 해소(같은 세션, 코드 변경 0)** — ch23 백업(캐논 91)에서 VS 4롤 16후보 관찰 + `overlapsCanonFact` 축어 이식 오프라인 커버리지 분석(전체 문장 12개). **canonSuspect 미발화 = 진음성** — 실측 커버리지 max 0.320·중앙값 0.200·near-miss(0.4~0.65) 0건인 반면, 캐논 축어 1.000·가벼운 패러프레이즈 0.875는 정확 발화(오탐 0). 원인 구조 — VS 지시 "인물의 선택과 대가가 드러나는 한 문장"이 후보마다 새 행동·대가 절을 강제해 토큰 절반 이상이 신규(캐논 고유명사를 여럿 문 후보도 0.32 상한). **임계 0.65 유지 권고** — 낮출 근거 없음(0.4로 내려도 이번 표본 발화 0, 더 내리면 문서화된 0.6 경계 오탐 위험). 배지는 P12(캐논 재발급) 트립와이어로 정상 대기 중. 한계 노트 — 어휘 전면 교체형 의미 재발급은 lexical prefix 매칭이 못 잡음(연속성 검토망 관할).
- **관찰 노트(계속)** — 4롤 16후보 전부 「새 긴장」(drains 0). 같은 지시 구조("대가" 강제)가 중반부에서 회수-전용 후보를 사실상 배제 — 긴장 배지의 판별력은 종반(잔여 회차 적을 때)이나 소진 위험 구간에서 드러날 전망. 루브릭 3분화(닫으며 여는가) 등 조정은 dogfooding 누적 후 별도 조각. 정렬 얹기도 동일.

## 완료 트랙 — 디자인 정비 슬라이스 4a: 죽은 라이트 세대 정리 (`done` · 2026-07-07, **PR #28 main 머지** `96cdb9b`)

슬라이스 1~3 적대적 검토 렌즈들이 식별한 죽은 라이트 세대 잔재를 걷어낸 **렌더 무변경 삭제**(-651줄, 미니파이 CSS -7.6KB). spec `docs/superpowers/specs/2026-07-07-dead-lighterageneration-cleanup-design.md`.
- **삭제** — 고아 4파일(Spotlight[⌘K는 CommandPalette 담당]·PixelAvatar[유일 소비자 Spotlight]·PublishingIndexCard[PR #18 고아]·**studioConstants**[옛 Linear 팔레트 지뢰 — 되살려 배선 시 sx→st 매핑 무음 우회]) · `.sx-spotlight-*`·`.sx-version-log-*`·`.sx-publishing-*` CSS · sx 토큰 스코프 spotlight 항목 · `--mx-*` 별칭 11줄(소비자 0).
- **테스트 핀 보존** — editorFocusLayout 핀 대상(`.sx-release-checklist`·`gate-state`·`platform-proof-card`)은 publishing 범위에서 분리 보존(4b 계약 재협상 몫). 작업 중 sed off-by-one 2건(`.sx-brief-grid` media 항목·release 계열) 발생→즉시 복원, 검증 렌즈가 main과 축어 동일 확인.
- **검증** — init.sh 녹색 · **적대적 검토 3렌즈(도달성·계약·렌더) 발견 0, 전 렌즈 반증 실패** — 동적 참조·tools/스크립트·부분 문자열 전수 0, 미니파이 CSS 룰 단위 diff 순수 삭제 56룰뿐, 중괄호 균형·경고 0 · 라이브 WRITE/PLAN 렌더·콘솔 0.
- **4b 잔여(별도 조각)** — editorFocusLayout.test 계약에 물린 desk-grid 세대(`.sx-workbench`·`.sx-creative-stage`·`.ex-toolstrip` 등 ex-* 다수) — 테스트 계약 재협상 필요.

## 완료 트랙 — 디자인 정비 슬라이스 3: PLAN 이음새 봉합·sx 핀 완화 (`done` · 2026-07-07, **PR #27 main 머지** `cf5657f`)

사용자 결정("핀 완화 해")으로 `.sx-desk`의 Linear 다크 리터럴을 버리고 전역 `--st-*` warm 토큰에 매핑 — `.fc-app`(warm) 안 `.sx-desk`(pitch black) 냉온 충돌이 원인이던 PLAN 이음새를 봉합.
- **구현** — sx 토큰 전면 alias(surface·ink·rule·brand→st-accent·page, AI-stage 파스텔 보존) + `--nx-on-primary: var(--sx-brand-ink)` 동반 매핑(골드 CTA 위 흰 글자 1.9:1→9.55:1) · 라이트 시절 흰 베니어 제거(sx-canon-canvas·sx-bible-workbench·sx-canon-refactor-panel + 자식 행·핑크 경고·러스트 충돌 텍스트) · **⌘K 팔레트 스코프 수리(기존 잠복)** — 팔레트가 .sx-desk 밖 fixed 오버레이라 색 토큰 미해석→투명 유령이던 것을 sx 색 토큰 스코프(.sx-desk+두 backdrop+.fc-app)로 해결, 흰 글로우·흰 kbd 칩도 warm 교체 · `:root:has`/`body:has` 다크 뒤판(흰 띠 봉합) · PublishScreen 인라인 pitch black→st 토큰 · 포커스 링 28%→60%(1.8:1→4.1:1) · faint 티어 28%→40%·page-ink-mute→ink-dim.
- **핀 갱신(승인된 계약 변경)** — styles.montage.test 3번을 sx→st 매핑 핀으로 재작성(+--sx-line 추가, 파스텔 5종 보존) · editorFocusLayout 2단언 · CLAUDE.md·AGENTS.md DoD "디자인 토큰 규율" 교체 · token-map.md 스테일 배너. 변이 실험으로 새 핀 강제력 확인.
- **검증** — init.sh 녹색 · 적대적 검토 3렌즈(회귀·계약·접근성) 발견 15건 중 11건 반영, 대비 실계산 ink 13.3:1·muted 5.2:1·CTA 9.55:1 · **라이브** PLAN 인물 회색 슬랩 소멸·바이블 warm·⌘K 정상 렌더·승인 큐 CTA computed 실측·출간 warm·콘솔 0.
- **범위 밖(슬라이스 4 후보)** — 죽은 표면 라이트 잔재(sx-version-log·sx-publishing-hero·ex-toolstrip)·`src/lib/studioConstants.ts` 죽은 Linear 팔레트 모듈(되살릴 때 sx 매핑을 무음 우회하는 지뢰)·`ex-*` 229곳 — 삭제 슬라이스 적대적 검토 필수. err 틴트 배지 4.26:1 근소 미달(low) 보류.

## 완료 트랙 — 디자인 정비 슬라이스 1+2: 스튜디오 공통 토큰·셸·PLAY 모션 (`done` · 2026-07-07, **PR #26 main 머지** `eec9023`)

사용자 검토 요청("심플하지만 인터랙티브한 반응 + 세 모드 일체감") → 검토 세션 진단(3모드가 3개 디자인 시스템·셸은 4번째 언어·transition 61곳 duration 16종·PLAY keyframes 0·focus-visible은 sx 스코프만·WRITE↔PLAN 페이드는 isWorkbenchFading 미배선으로 시각적 사망) → 승인된 권장안 = **WRITE `.fc-app` warm oklch 승격**. spec `docs/superpowers/specs/2026-07-07-studio-shell-motion-unify-design.md`.
- **구현** — 전역 `--st-*` 토큰 블록(:root, styles.css ~9109): warm 팔레트 13종 + 모드색 3종(`--st-mode-play/write/plan` = 랜딩 다크 `--flow-*` 동일 값) + 모션 스케일(`--st-dur-fast 120·base 160·slow 320ms`·`--st-ease` 단일) · `.fc-app` 로컬 토큰 → `--st-*` alias(값 원천 단일화, fc 내부 수백 사용처 무변경) · `.wm-*` 셸 토큰화 + hover/active/focus-visible/transition + **활성 pill 모드색**(data-mode 셀렉터) + `aria-pressed`·토글 `role=group aria-label="작업 모드"` · `.dx-*` 중성 표면 토큰 스왑(의미색 보존: 쇼러너 보라·VS 라임·retcon 로즈·유저 버블 청록) + `st-rise` 등장 모션(버블·챕터·승인·VS패널·쇼러너 시트·om-menu) + `.dx-desk button` 공통 인터랙션 규칙 · `.dx-desk`/`.fc-app` 마운트 진입 페이드(`st-fade-in`) — stage 하드 스왑·트랙 전환 모두 커버 · `prefers-reduced-motion` 일괄 리셋 블록.
- **적대적 검토(워크플로 3렌즈: 회귀·테스트 계약·접근성, 발견 9건 중 7건 반영)** — ink-faint 재티어링 6곳(대비 2.8:1→ink-dim으로 AA 복원) · styles.studio.test reduced-motion 공허 단언→블록 앵커링 정규식 · `.dx-empty` 리셋 커버 + 소스 순서 교정(미디어 블록보다 앞으로) · `.wm-title-input:focus-visible` 링(기존 1.10:1 비가시 구멍) · `.dx-input` outline:none 제거(공용 링 복원) · 색상 전환 5곳 감속 블록 추가 · 토글 그룹 시맨틱. 모드 pill 대비 실계산 7.33~12.02:1(AA~AAA). 몬태주 `--wds-*`·`.sx-desk` Linear 핀 무접촉(렌즈 확인).
- **검증** — init.sh 녹색 · **라이브(preview 5175, 로판 23화 백업)** 3모드 스크린샷: 셸-캔버스 이음새 소멸·활성 pill 모드색(computed rgb 실측 `196,182,255` 등)·PLAY warm 접속·fresh reload 콘솔 0.
- **알려진 트레이드오프(의도적 보류)** — `.fc-app` 진입 페이드가 `key=syncVersion` remount 경로(⟳최신화·PLAN 반영/버리기)에도 발화(320ms 페이드인). 콘텐츠 갱신 피드백으로 기능한다고 판단해 유지 — 거슬리면 `--st-dur-base`로 단축 or remount 시 클래스 억제.
- **범위 밖(슬라이스 3·4 후속)** — **PLAN 이음새**: `.fc-app`(warm) 안 `.sx-desk`(Linear pitch black) 내용물 충돌. 몬태주 테스트 핀 + CLAUDE.md "Linear 다크 토큰 유지" 조항과 얽혀 **사용자 결정 필요**(핀 완화 vs 브리지 토큰) · 죽은 세대 정리(`ex-*` 229곳·`hx-*`·미사용 wds/mx alias, 삭제 슬라이스 적대적 검토 필수).

## 완료 트랙 — 흡인력 게이트: critic-reviewer 검토망 승격 (`done` · 2026-07-07, **PR #25 main 머지** `238dda1`)

흡인력 딥리서치 확정 결론("일반 품질 점수는 흡인력 결손을 못 잡는다·Re3 재순위에 흡인력 기준을 넣으면 그게 게이트")의 두 번째 구현([[two-axis-compellingness]], 첫 번째=PLAY VS). critic-reviewer(작품성 평론가)를 **연재 서사 라이브 검토 6번째 흡인력 판정자**로 승격 — Story X는 초안 1개 체제라 재순위의 번역 = 검토 verdict가 게이트. 사용자 결정 4건(brainstorming) — ① 검토망 승격(VS 재순위 아님) ② 연재 서사 전 회차(에세이·학술·비연재 제외) ③ 기존 문학 기준 보존+흡인력 기준 추가 ④ 정보성 유지(하드 차단 없음). spec `docs/superpowers/specs/2026-07-06-compellingness-gate-design.md` · 계획 `docs/superpowers/plans/2026-07-06-compellingness-gate.md`. 인라인 TDD 4태스크(classifier 장애로 서브에이전트 투입 불가 구간은 편집장 직접, 검토는 복구 후 서브에이전트) + 적대적 검토 APPROVE + 발견 2건 반영.
- **구현** — `getMediumReviewAgentIds(medium, format?)` 확장(연재+비에세이/학술이면 critic 마지막 합류, StoryXDesk 2곳 배선) · agentReviewProcess criteriaKeys `tension_decay_audit`(긴장 재장전)·`predictability_audit`(캐논 안 예측 배반) 추가+agenda·checks·blockingSignals 보강 · `.claude/agents/critic-reviewer.md` Compellingness Gate 섹션(연재 상시 2체크 FIRST·정보성 명시·캐논 위반 서프라이즈는 연속성 관할) · extendedPersonas role "긴장과 흡인력" · `buildAgentReviewPrompt` **조기 소진 신호**(critic 한정: `openPromises===0 && paidPromises>0 && !isStalled && !finalStretch`면 "[측정] 긴장 조기 소진 — 잔여 N회차" 주입, storyx.mjs byte-identical 미러+핀 테스트).
- **배관 봉합(탐색 발견 잠복 갭)** — dev 브리지 `/api/review-agent`가 `--payoff-status`를 안 넘기고 CLI도 미파싱이라 기존 stakes_progression 정체 신호조차 dev 미발화였음 → 브리지·CLI 파싱·prod whitelist(`paidPromises`)·reviewClient 타입 봉합(prod는 이미 발화 중이라 dev를 prod에 수렴시키는 수리).
- **불변식** — 검토망 정보성 유지(흡인력 판정이 회차 확정 안 막음) · 기존 문학 기준 3키 보존(추가만) · 에세이·학술·비연재 무접촉 · 조기 소진 신호는 computePayoffLedger·buildContractStatus 산출만(오탐 가드=paidPromises>0, rewardArc 미사용 작품 차단) · 미러 byte-identical.
- **검증** — init.sh 녹색(821 테스트) · 적대적 검토 6공격면 전부 CONFIRMED·APPROVE(발견 2건 반영: getAgentLabel 평론가/에세이 큐레이터 등록[raw id UI 노출 방지]·하네스 프롬프트 기준 키 동기화+카운트 비표기) · **라이브(preview 5175) end-to-end** — ① 연재 novel 작가실 6명·평론가 "긴장과 흡인력" 6번째 ② essay(연재 essay-series) 평론가 제외 6명 ③ 비연재 short-novel 5명 ④ `/api/review-agent` critic+조기소진 신호 실 codex 호출 → **revise + note가 tension_decay_audit 명시·"남은 12회차 추진력" 인용·issues 3건이 조기 소진/예측 가능성/윤리 비용 정확 타격** ⑤ fresh 로드 에러 0.
- **실작품 dogfooding (2026-07-07 머지 직후, 코드 변경 0)** — 헌터물 6화 백업(`03-hunter-llmpace-ch6.json`, medium/format 부재 → 폴백 novel·long-novel로 평론가 자동 합류) 주입, 6인 전체 검토 실 codex(병렬 44~60초, 6/6 성공). **평론가 판정 품질 확인** — 실제 중반부 회차에 86점 pass를 주되 tension_decay_audit("닫히는 질문마다 새 질문을 열어 장력 유지")·predictability_audit("마지막 문장 덕분에 다음 화가 단순 보관실 진입으로 굳지 않음")을 명시 실행하고, 약점 3(수치형 표현·주제 직설성·모티프 변주)+결말 대안 해석 2를 제시. **시선 분리 깨끗** — 쇼러너(약속→선택·대가)·연속성(캐논 충돌)·장르(문체 비트)와 중복 없이 보완. 합성 소진 회차 revise(위 ④)와 실작품 pass가 함께 실증 — 게이트가 방향 양쪽에서 판별력 있음.
- **후속 조각 — scale 자동 검토 합류 (`done` · 2026-07-07 이어서, main `93fd15e`)** — 검토 INFO 해소. `withCompellingnessReviewer(ids, medium, format?)` 헬퍼를 agentSeedData로 추출(합류 규칙 단일 진실원천, `getMediumReviewAgentIds` 위임 리팩터) · `getReviewAgentIds(scale, medium?, format?)` optional 확장(미전달 하위호환·scale 무관 합류=결정 ② 계승) · `runAiReview` 호출처(온보딩 1화 자동 검토·바이블 검토 공용)에 blueprint.medium/format 배선. 이 경로는 payoffStatus·contractStatus를 이미 전달하고 있어 조기 소진 신호도 자동 작동. TDD 4(+aiCliHarness)·init.sh 녹색. 라이브 = 런타임 등가 실측(fresh reload 후 실제 로드된 헌터 작품 입력으로 standard 6인·critic 마지막 — 첫 실측은 vite 모듈 캐시 스테일, 리로드 판정 [[preview-live-verify-env]] 선례)·wire는 당일 실 codex 2회 검증분과 동일 경로라 갈음.
- **라이브 관찰(별도)** — MemoryBankStudio `변경 검토 요청`(BibleWorkbenchHeader) 버튼이 현 플로팅 셸 PLAN 동선(작품 현황 보드·바이블 패널)에서 자동화로 도달 못 함 — requestBibleReview 가시 트리거가 ⌘K 명령뿐일 가능성(레거시 도달성 점검 후속 후보).
- **범위 밖(후속)** — VS 후보 흡인력 재순위 · 프록시 지표↔완독률 보정(딥리서치 열린 질문 1).

## 완료 트랙 — PLAY 전개 후보(VS): opt-in 게이지 서프라이즈 주입 (`done` · 2026-07-06, **main 머지 완료** `a33768e` fast-forward)

흡인력 축 **첫 구현**([[two-axis-compellingness]]) — 딥리서치 결론(서프라이즈는 모델·프롬프트가 아니라 구조로 넘긴다·Verbalized Sampling)을 PLAY 이어 굴리기에 적용. DiveDesk 컴포저 「✦ 전개 후보」 **opt-in 버튼**으로 다음 전개 후보 3~4개를 의외도 게이지와 함께 펼쳐 사람이 긴장·의외를 고른다. spec `docs/storyx-play-vs-candidates-plan.md`. brainstorming(visual companion 목업)→spec→TDD 4단→라이브. 커밋 `ca27167`(spec)·`6c5b049`(구현).
- **구현** — 데이터 계층은 WRITE와 공유하는 `requestVsCandidates`·`/api/vs-candidates` 재사용(무접촉). `episodeBriefing` `collectUnpaidPromises` export 승격 + `rarityToBars`(common 1·surprising 2·radical 3) 신규 · `diveSession` `buildVsCandidatesInput`(PLAY 상태→입력, **recentSummary만 라이브 대화(buildRecentDialogue)+장면**)·`buildPlayDirectionSeed`('(전개 — …)' 괄호 연출) 신규 순수 함수 · `VsCandidatePanel.tsx` 신규 프레젠테이션(게이지 3칸·「캐논 확인」 배지) · `DiveDesk` 배선(vs 상태 3개·`requestCandidates`·`pickCandidate`→기존 `send` 괄호 패턴) · `.dx-vs-*` CSS(색은 WRITE `fc-vs` 언어 미러링 — 회색·라임·로즈).
- **불변식** — VS는 opt-in 버튼으로만 생성(자동/매 턴 아님) · 기존 `res.choices` 가벼운 칩과 **공존**(대체 아님) · 확률 숫자 **비노출**(게이지 강도만) · 선택은 기존 `send()` 괄호 연출 재사용(신규 굴림 경로 금지) · 데이터 계층 무접촉(WRITE와 공유, PLAY는 입력 조립만 다름).
- **검증** — `npm test` 804 녹색(81 파일, VS 12 신규: rarityToBars 3·collectUnpaidPromises 1·buildPlayDirectionSeed 1·buildVsCandidatesInput 1·VsCandidatePanel 5·DiveDesk 버튼 1)·build·init.sh·tsc 클린. **라이브(preview 5175, "철거 전야의 이름" 프로젝트) 전체 해피패스 통과** — ① PLAY→DiveDesk 컴포저 「✦ 전개 후보」 라임 버튼 렌더(레이아웃 무붕괴) ② 클릭→로딩→`POST /api/vs-candidates`→실제 후보 **4개** 렌더 ③ 게이지 의외도 정확 인코딩(1칸 회색 common·2칸 라임 surprising·3칸 빨강 radical, 실제 후보 텍스트가 의외도와 정합 — radical="죽은 동생을 따라가 신분·이름 버림") ④ radical 후보 선택→패널 닫힘·`(전개 — …)` 괄호 연출 사용자 버블→dive-chat 이어감 ⑤ 콘솔 에러 0.
- **범위 밖(후속)** — **흡인력 게이트**(critic-reviewer 를 Re3 재순위 흡인력 게이트로 승격, 사용자 승인된 나머지 후속·새 세션 권장) · `canonSuspect` 배지 실사례 확인(이번 후보엔 없었음) · VS 후보 요청 비용/포인트 연동.

## 완료 트랙 — 홈 랜딩 "작성 여정" 원페이저 (`done` · 2026-07-05, **PR #24 main 머지** `c18f878`)

신규 사용자가 의도된 여정(새 작품 온보딩 → STUDIO 3모드 → ⟳최신화 → 출간)과 서비스 본질을 한눈에 못 잡던 것을, 랜딩 히어로 다음에 **4단계 흐름 섹션**으로 채운 조각([[landing-onepager-request]]). 핵심 = 세 방식(PLAY/WRITE/PLAN)이 **하나의 캐논을 두 방향으로 조각**한다 — **안 무너진다(일관성, 강함)** + **끌어당긴다(흡인력, 자라는 축)**. 흡인력 축은 "AI가 여러 결을 펼치고 사람이 긴장·의외를 고른다"는 인간+AI 협업으로 명시(King 논지 완성). brainstorming(visual companion)→spec→계획→executing-plans 인라인 TDD. 근거 = 흡인력 딥리서치([[two-axis-compellingness]]).
- **구현** — 순수 콘텐츠 상수 `src/landingFlow.ts`(`flowModes` 3·`canonAxes` 2[solid filled===total·pull filled<total]·`flowEntryAgents` 4·`flowPublishMedia` 4) + `landingFlow.test.ts` 두 축·세 방식 **의미 불변식** 테스트(다음 세션이 축 못 지우게) · `MarketingLanding`(App.tsx) 히어로 다음 `lx-flow-section` 렌더(4단계: 작가진 브레인스토밍 진입→3모드→하나의 캐논 두 축 게이지→출간 매체)+`navLinks` 맨 앞 `작성 흐름` · `styles.css` `.lx-flow-*`(다크 + `.is-light` 오버라이드로 모드색 어두운 변형 + 768px 모드/축 1열 스택).
- **불변식** — 두 축 프레임이 랜딩 서사 핵심(landingFlow.ts 헤더 주석·테스트가 지킴). 모드색은 앱 3모드 관례(PLAY lime·WRITE blue·PLAN violet)+pull 앰버, 라이트에선 어두운 변형(흰 배경 대비). flow 섹션은 순수 추가(다른 섹션 무변경).
- **검증** — `npm test` 792 녹색(80 파일, landingFlow 4 신규)·build·init.sh·tsc 클린. **라이브(preview 5175)** — ① 섹션 순서 hero→**flow**→feature→bridge→closing(정위치)·3모드/2축/작가진 5칩/출간 4매체 렌더 ② 게이지 solid 4/4 vs pull 3/4(자라는 축 시각 구분) ③ 내비 `작성 흐름`=`#flow` 앵커 ④ 라이트 강제 실측 — 섹션 bg 흰색·텍스트 rgb(8,9,10)·모드색 어두운 변형(play 진녹 77,124,15·write 파랑·plan 보라·pull 진앰버 180,83,9, 흰 배경서 안 사라짐) ⑤ 모바일(375) 모드 335px·축 285px 단일 컬럼·가로 오버플로 0 ⑥ 콘솔 에러 0.
- **범위 밖(후속 스코핑, 사용자 승인 3방향 중 2)** — **흡인력 게이트**(critic-reviewer 를 긴장·서프라이즈 기준 게이트로 승격, Re3 재순위 단계) · **서프라이즈 주입 VS UX**(PLAY 이어 굴리기에서 후보 N개+확률 펼쳐 사람이 선별, Verbalized Sampling). 둘 다 brainstorming·새 세션. 근거 `docs/research/2026-07-05-compellingness-human-ai.md`. 참고 — 코드에 이미 `lib/vsCandidatesClient` 존재(연결 검토).

## 활성 트랙 — PLAY 진입 융합 파트 1: 이어 플레이 시딩 (`done` · 2026-07-04, 브랜치 `feat/play-entry-fusion` 미머지)

dogfooding 피드백("PLAY 누르면 너무 다른 얘기부터 한다") 해소 — PLAY 토글이 현 작품과 무관한 옛 Dive X 자유 서술 인테이크(DiveStart)로 배선돼 있던 것을, **현 작품 인물·최근 회차에서 이어 플레이 시딩**으로 교체. `seedAndEnter` 의 `saveProject` **본편 덮어쓰기 데이터 위험 제거**. spec `docs/superpowers/specs/2026-07-04-play-entry-fusion-design.md`·계획 `docs/superpowers/plans/2026-07-04-play-entry-fusion.md`. 서브에이전트 TDD(중간 세션 한도로 Task 3 은 편집장 직접 구현·검증).
- **구현** — 순수 `playEntry.ts`(`seedPlayFromProject` 인물 0→null·주인공=characters[0]·project 동일 참조 보존 · `deriveContinuationScene` 실제 Chapter 필드 기준 우선순위: prose 마지막 문단(placeholder `FALLBACK_EMPTY_LINE` 스킵)>마지막 beat summary>hook, storyEngine 에서 export) · App dive 분기 교체(시딩 useEffect — 복원본·diveInit 없을 때만 1회 · 인물 0 이면 `.dx-empty` 안내+PLAN 이동 · DiveStart·seedAndEnter·죽은 import 4종 제거, DiveStart.tsx 파일은 후속 온보딩용 보존).
- **불변식** — PLAY 는 committed(storageKey) **읽기 전용**, 쓰기는 diveKey working·⟳최신화만. 시딩 project 는 loadProject() 현재 본편 그대로(빈 프로젝트 생성 금지).
- **검증** — `npm test` 786 녹색(79 파일, playEntry 8 신규)·build·init.sh·tsc 클린. **라이브(preview 5175)** — ① 회차 2 작품 PLAY→인테이크 0·바로 DiveDesk·🎬 "직전 회차 이후 — …"(ch-2 prose tail)·"📖 지난 이야기 2화"·본편 회차수 불변(덮어쓰기 0) ② 인물 0 작품 PLAY→안내 카드·diveKey 미시딩·본편 무접촉·PLAN 이동 동작(dispatchEvent) ③ 콘솔 0.
- **파트 2** — `done`(아래 절). PR #21 로 파트 1 은 main 머지 완료.

## 완료 트랙 — PLAY 진입 융합 파트 2: wm-bar 공통 셸 (`done` · 2026-07-05, **PR #23 main 머지** `84a2d09`)

dogfooding 피드백("전환할 때 가운데 내비 바가 연결된 느낌이 없다") 해소 — 슬라이스 C 가 editor 에서 StoryXDesk 에 준 wm-bar 소유권을, **App 이 세 모드(PLAY/WRITE/PLAN) 공통으로 소유하는 지속 프레임**으로 되돌려 전환 연속감을 만든 조각. 계획 `docs/superpowers/plans/2026-07-04-play-entry-fusion.md` Task 5~9. executing-plans(편집장 직접 구현·강결합 파일이라 Task 5/6/7 한 묶음 편집 후 일괄 검증).
- **구현** — `WorkspaceModeBar` `planDot` prop(TDD, PLAN 버튼 점, planBadge 숫자 대체·`.wm-plan-dot` CSS) · StoryXDesk `studioView` controlled(switchToTrack effect 재사용 — fade·dataView·publishing 부수효과 계승, 무리마운트 유지)+내부 track 변경 App 역보고(셸 토글 stale 방지, 양방향 수렴)+`title` prop 동기화(saveProject clobber 방지)+`onBibleAlertChange` 콜백 · StoryXDesk 자체 `WorkspaceModeBar`/`OverflowMenu` 제거→`dx-desk-context` 하위 줄(WRITE 회차 픽커·PLAN 캐논/충돌 칩)만 렌더 · export/import 핸들러·fileInputRef→App 이관 · App `shellBar`(제목 input·토글·planDot·싱크 콘솔·⋯ 오버플로)를 editor·dive 두 stage 위에서 동일 렌더·`workTitle`/`bibleAlert` state·`handleTitleChange` 즉시 저장·syncVersion 후 제목 재동기화.
- **불변식 계승** — App key=`syncVersion` 만(studioView 는 key 에 넣지 않음 → WRITE↔PLAN 무리마운트) · 제목 App 단일 소유(`title ?? project.title`, StoryXDesk 는 동기화만) · 충돌 dot 은 `bibleAlert>0`(StoryXDesk 콜백 count) · PLAN 하위 줄 `⚠ 충돌 N` 칩은 같은 숫자원 유지.
- **검증** — `npm test` 788 녹색(79 파일)·build·init.sh·tsc 클린. editorFocusLayout 소스 단언 교정(옛 "StoryXDesk 안 단일 바"→"App 이 바 소유·StoryXDesk 는 dx-desk-context") — 약화 아님, 셸 이관 반영. **라이브(preview 5175, 인물 2·0회차 프로젝트) 7게이트 전부 통과** — ① title{x14,y13}·toggle{x579,y8} PLAY/WRITE/PLAN **세 모드 동일 위치** ② WRITE↔PLAN 전환에 planDot/bibleAlert 지속·콘텐츠만 스왑(무리마운트) ③ dive 제목 편집→WRITE 반영→리로드 지속·clobber 0 ④ 실제 충돌 1건에 planDot 세 모드 표시·planBadge false·하위 줄 "⚠ 충돌 1" ⑤ ⋯ 오버플로 3항목·출간→publish stage ⑥ 620px 가로 오버플로 0·하위 줄 바로 아래 비충돌 ⑦ fresh preview·fresh 로드 콘솔 0.
- **라이브 발견(내 변경 무관, 기존 잠복 버그)** — 손수-시딩한 2-회차(파생 필드 결여) 프로젝트를 editor 로 열면 FloatingEditor 크래시 재현. **main 코드로 스왑해 동일 시드 → 동일 크래시 확인**(내 셸 변경 무관 실증). handoff 2026-07-02 line 73 의 createSeedProject+회차 잠복 버그와 동일 부류(jsdom·server render 는 재현 안 됨). 실사용(앱 produce 회차)·0회차·정상 회차 경로는 무손상. 후속 별도 조각 후보.
- **범위 밖(후속)** — 홈 랜딩 원페이저([[landing-onepager-request]]) · 자유 서술 새 작품→PLAY 온보딩 갈래 · PLAN 안 AI 설계 대화 채널 · FloatingEditor 하드-시딩 회차 크래시 방어(정규화 백필 or 에러 바운더리).

## 완료 트랙 — PLAN staged: 설계실 패치 모델 (`done` · 2026-07-04, **PR #20 main 머지**)

PLAN(바이블) 편집이 `setProject → saveProject` effect로 본편에 즉시 직행하던 것을, **패치(수정 목록) 모델**로 staged화한 조각. 사용자 결정 4건(brainstorming·visual companion) — ① PLAN 역할=**AI와 같이 짜는 설계실**(정비소 역할은 PLAY 전환 에이전트 과정으로) ② 이번 조각=staged 토대만(AI 설계 대화는 후속) ③ 구현=패치 모델(working 사본 아님 — WRITE·PLAN이 한 project 객체를 공유해 사본 모델은 대수술) ④ UI=통합 싱크 콘솔. spec `docs/superpowers/specs/2026-07-04-plan-staged-patches-design.md` · 계획 `docs/superpowers/plans/2026-07-04-plan-staged-patches.md`. 서브에이전트 주도 8태스크 + 태스크별 spec/품질 2단 검토 + 최종 홀리스틱 적대 검토.
- **구현** — 순수 `planStage.ts`(`PlanPatch` 5종 kind — 인물 desire/wound/currentState·세계 rule·캐논 statement·스토리코어 logline/audiencePromise/deepQuestion/formIntent/tone·무게중심 · `upsertPlanPatch` 같은 key 교체+최초 before 유지+원복 자동 소멸 · `applyPlanPatches` 불변 overlay·소멸 대상 drop · `derivePlanConflicts` before≠현재 본편 값 · `resolvePlanApply` 기본 keep) · storage `planStageKey` 영속 · StoryXDesk staged 핸들러 5종(stage*) + `overlayProject`(본편+패치 겹침 렌더) + `is-plan-staged`/`plan-staged-tag` 설계안 표시 + `onPlanPatchesChange` · SyncConsole `✦ PLAN +N` 배지+반영/버리기 메뉴 · `PlanApplyReview`(rc-* 재사용, 기본 keep) · App 배선(pendingPlan·applyPlanStage 충돌0=즉시·discardPlanStage·syncVersion++ remount) · SyncFlash "N설계".
- **불변식 계승** — WRITE 즉시 저장 무접촉 · wm-title-input(제목) 직행 유지 · App key=`syncVersion`만(반영·버리기 모두 이 축) · 충돌 0=즉시 반영(player-first) · 기본 keep · staged 편집은 logCanonChange 안 남김(패치 목록이 이력 대체).
- **검증** — `npm test` 778 녹색(78 파일)·build·init.sh. **라이브(preview, 포트 5175) 8게이트 전부 통과** — ① 캐논 수정→본편 무변·패치·overlay·설계안 태그·배지 ② WRITE/PLAY 전환에도 배지 유지 ③ 버리기→원복·본편 무접촉 ④ 반영→본편 반영·토스트 "1설계" ⑤ 원복→패치 자동 소멸 ⑥ WRITE 타이핑 즉시 저장(회귀 0) ⑦ 충돌 다이얼로그 keep=본편 유지/apply=내 설계 반영 양쪽 ⑧ fresh reload 콘솔 0.
- **부수 수정** — Node 25 실험적 webstorage 전역이 jsdom localStorage를 가려 실 localStorage 테스트가 깨지는 문제 → vitest 워커 `execArgv: ['--no-experimental-webstorage']` (`0bc7a89`). launch.json 포트 5175+strictPort(5173은 다른 프로젝트 dev 서버 점유).
- **알려진 잔여(후속)** — ① 옛 핸들러 4개(updateCharacterMemory·updateWorldMemory·updateCanonMemory·updateCreativeWeight)가 콜사이트 0으로 죽은 코드화(의도적 사수 — editorFocusLayout.test 소스 단언이 물고 있음, 별도 정리 조각) ② 인물 추가/삭제/이름변경·작품 헌장은 직행 유지(구조 변경·자체 게이트) ③ PLAN 안 AI 설계 대화 채널=설계실 2단계 ④ SyncConsole 메뉴 click-outside/aria 보강(OverflowMenu 패리티) ⑤ MemoryBankStudio staged 마커 9곳 반복 패턴(헬퍼 추출 후보) ⑥ 최종 검토 MEDIUM — clear+remount 불변식(버리기/반영 후 옛 인스턴스가 스테일 패치 재저장 안 함, React 시맨틱으로 CONFIRMED SAFE)의 자동 회귀 테스트 부재 — 다음 PLAN staged 손대는 조각에서 추가 권장 · PlanApplyReview가 전면 모달이라 안전한 confirmPlanApply의 frozen conflicts 의존(비모달화 시 주의) 주석 후보.

## 완료 트랙 — 고아 컴포넌트·죽은 CSS 정리 (`done` · 2026-07-03 3차, 브랜치 `feat/desk-orphan-css-cleanup` 미머지)

PR #18 "알려진 잔여" 마무리 — 렌더 0 고아 컴포넌트와 어떤 live TSX 도 참조 안 하는 셸 CSS 를 걷어낸 **렌더 무변경 정리**. spec `docs/superpowers/specs/2026-07-03-desk-orphan-css-cleanup-design.md`. 서브에이전트 구현 + 적대적 검토(RENDER-PRESERVING CONFIRMED).
- **삭제** — 고아 컴포넌트 15파일(1차 11 — BibleAssistantSidebar·AgentProfileDialog·StoryXStatusBar·EvaluatorQualityCard·AgentRoom·AgentIntentCard·MentionBar·CoreStrip·MarginColumn·VersionLogDialog·ProjectHistoryDialog · 2~3차 — AgentPixelPortrait·AnnotationCard·CanonSummaryCard·lib/agentPersonas·lib/snapshotImpact) + 죽은 테스트 3파일 · **CSS 2197줄**(styles.css 11621→9424, 클래스 단위 grep 증명) · 검토 발견 후속 — 미호출 `renderParagraphText`+`--sx-diff-*` 토큰 동반 삭제(잠재 함정 해소).
- **함정 회피 실증** — `.fc-app .topbar` 는 FloatingPublishWorkspace 가 live 렌더라 보존(spec 후보 목록의 오류를 구현이 교정) · `.fc-app.focus .docks` 콤마 셀렉터 분리 보존 · PixelAvatar/extendedPersonas 등 유사 이름 live 심볼 보존.
- **검증** — `npm test` 759 통과(76 파일)·build·init.sh · 적대적 검토 6공격면(도달성·CSS 표본 25+·동적 클래스·테스트 약화·publish 스타일) 반박 실패 · 라이브 fresh load 콘솔 0·computed style 실측(wm-bar/fc-sheet-cta/dock) 무손실.
- **보류(별도 조각)** — 옛 인라인 편집기 desk-grid CSS(sx-workbench·sx-creative-stage 등, TSX=0 이나 테스트 계약에 물려 있고 상호 연결이 큼).

## 완료 트랙 — StoryXDesk legacy 셸 정리 (`done` · 2026-07-03 2차, **PR #18 main 머지**)

슬라이스 C 가 단일 바 셸을 완성하며 도달 불가가 된 StoryXDesk 최종 return(옛 sx-topbar 3-zone 셸)과 연쇄 사망 심볼을 걷어낸 **동작 무변경 부채 정리**. spec `docs/superpowers/specs/2026-07-03-desk-legacy-shell-cleanup-design.md`. 서브에이전트 구현 + 적대적 검토(반박 시도→CONFIRMED).
- **삭제** — 최종 return 461행 + 헬퍼 5(PublishingStudio·AiCliHarnessCard·CreativeStage·VerticalSliceProofPanel·ContinuitySummaryCard) + state 12(isFocusMode·설정 popover·미디어 패널·버전 다이얼로그 등) + 파생/함수 ~20 + import ~50. **StoryXDesk 3651→2255행(−1396)**. 함수 끝은 `return null;`(3분기 조기 반환이 전 경로 커버, 도달 불가 타입 안전 폴백).
- **live-but-inert ⌘K 명령 4개 동반 삭제** — toggle-focus·open-media-change·open-version-log·open-project-history(효과 대상이 전부 죽은 블록에만 렌더, 출하 앱에서 이미 아무것도 안 하던 명령). ⌘. 전역 단축키도 같은 부류로 제거. run-all-review·open-draft/bible·출간 등 live 명령 전부 보존(F-006 녹색).
- **테스트 3분법 교정** — editorFocusLayout·agentPersona·agentValidationProcess·lib/version 4파일. 교체 10(제목→wm-title-input·회차 픽커→contextSlot·저장 칩→dm-save·출간→FloatingPublishWorkspace 등)·삭제 ⓐ~6·ⓒ~4. 774→772(죽은 UI 테스트 2 삭제).
- **검증** — 적대적 검토가 8개 공격면(margin review 계열·버전 복원·에이전트 레일·품질 게이트·⌘K diff·테스트 약화·도달 불가 증명) 전부에서 반박 실패 · init.sh 녹색 · 라이브 fresh load 콘솔 0·3모드 렌더·PLAN 품질 게이트 표시.
- **알려진 잔여(후속)** — `BibleAssistantSidebar`·`AgentProfileDialog` 컴포넌트가 고아화(어디서도 렌더 안 됨, 테스트는 존재 단언만) → 삭제 or 재배선 별도 결정 · 죽은 CSS(sx-topbar·ex-workbar·.fc-app .topbar) 정리는 범위 밖 유지.
- **머지 시 동반 유입(무해 확인)** — 구현 커밋 `f70c0d8` 이 untracked 였던 `.codex/agents/*.toml`(Codex 호환 에이전트 미러)·`.agents/skills/*`·`.claude/launch.json`(dev 서버 설정)을 함께 커밋. 비밀정보 스캔 통과·기추적 `.claude/agents/` 관례와 일치라 유지. 원치 않으면 revert 가능.

## 완료 트랙 — 융합 셸 슬라이스 C: 단일 바 셸 (`done` · 2026-07-03, **PR #17 main 머지**)

WRITE/PLAN 에서 wm-bar 아래 겹치던 floating pill topbar(제목·편집/데이터 탭·출간·CTA)를 해체해 **wm-bar 하나만** 남긴 epilogue 풍 미니멀 재배치. 사용자 결정 4건(A안 단일 바 · CTA 시트 끝 문서형 · 내부 트랙 전환 · 모드별 구성) — visual companion 목업으로 확정. spec `docs/superpowers/specs/2026-07-03-fusion-shell-slice-c-single-bar-design.md` · 계획 `docs/superpowers/plans/2026-07-03-fusion-shell-slice-c-single-bar.md`. 서브에이전트 주도(구현 7태스크 + 태스크별 spec/품질 2단 검토).
- **전제 수정(탐색 발견)** — handoff 가 지목한 StoryXDesk `ex-workbar` 는 도달 불가 legacy(조기 반환 뒤, 라이브 DOM 부재 확인). 실제 이중 헤더 = wm-bar + FloatingEditor/FloatingDataWorkspace 자체 pill topbar.
- **구현** — `WorkspaceModeBar` 슬롯 확장(titleSlot·contextSlot·planBadge) · 신규 순수 `DeskMetaLine`(하단 메타 줄)·`OverflowMenu`(⋯ 수납: 출간·JSON 내보내기/가져오기 — legacy 에 갇혀 죽어 있던 export/import 부활) · FloatingEditor/FloatingDataWorkspace pill topbar 삭제 + 시트 끝 `.fc-sheet-cta`(초안 생성·잠금 확정, 문서형) · StoryXDesk 가 editor 에서 바를 직접 렌더(**소유권 역전** — 새 props syncSlot·onSelectPlayMode·onStudioViewChange) · WRITE↔PLAN 은 `switchToTrack` 내부 전환(remount 제거) · App key `syncVersion` 만(⟳최신화 remount 불변식 보존).
- **위험 가시성 유지** — PLAN 토글 상시 배지(bibleAlertCount) + PLAN contextSlot `⚠ 충돌 N` 칩(클릭→승인 대기). 싱크 콘솔은 syncSlot 으로 승계.
- **검증** — `npm test` 774 녹색(79 파일)·build·init.sh 통과. **라이브(preview)** — 상단 크롬 wm-bar 1개(pill 0)·WRITE↔PLAN DOM 마커 생존(remount 없는 내부 전환 실증)·⚠칩→승인 대기·⋯ 메뉴 3항목+Escape·PLAY 왕복·시트 끝 CTA enabled·메타 줄(WRITE 문단/자·PLAN 캐논/떡밥)·좁은 뷰포트(623px)에서 dock pill 과 메타 줄 비충돌 실측·콘솔 0. 라이브 게이트가 **wm-title-input inherit 색 회귀**(다크 배경에서 제목 안 보임)를 적발·수정(`b0f347b`).
- **범위 밖(다음)** — StoryXDesk legacy 최종 return 삭제(소스 단언 테스트와 함께 별도 정리) · 집중 모드에서 wm-bar/메타 줄 숨김 · PLAY 에서 planBadge · PLAN staged(`PLAN +N`) · deck 상단 88px 여백 재조정(topbar 시절 클리어런스, 시각 확인 결과 어색하지 않아 보류).

## 활성 트랙 — 최신화 반영 피드백 토스트 (`done` · 2026-07-02, **PR #16 main 머지**)

충돌 없는 `⟳최신화`가 조용히 즉시 반영돼 사용자가 무엇이 본편에 들어갔는지 몰랐던 마찰을, `✓ 본편에 반영 — N회차·M캐논` 토스트(2.6초 자동 소멸)로 채운 작은 후속 조각. 반영량은 `countPendingSync(next, before)` 재사용으로 정확 산출(충돌 keep 로 일부 빠져도 실제 append 수 반영).
- **구현** — 순수 `SyncFlash.tsx`(flash null/total 0이면 null·회차/캐논 0 항목 생략) · App `syncFlash` state + useEffect 타이머 · `commitReconciled(next, before)` 시그니처에 before 추가해 `countPendingSync(next, before)`로 반영량 계산 · reconcileSync·confirmReconcile 두 경로 배선.
- **검증** — `npm test` 767 녹색·build 성공·신규 테스트(syncFlash 3). 라이브(preview) — 무충돌 최신화 → 토스트 "✓ 본편에 반영 — 1회차 · 1캐논" 표시·자동 소멸·배지 리셋·crash 0.

## 활성 트랙 — 융합 셸 슬라이스 B-2: reconcile 충돌 게이트 (`done` · 2026-07-02, 브랜치 `feat/fusion-shell-reconcile-gate` 미머지 → **PR #15 main 머지**)

슬라이스 B의 `⟳최신화`가 무조건 append 하던 것을, working 새 캐논/회차가 본편(committed)과 **모순이면 검토 다이얼로그**(retcon 교체/버리기)를 먼저 띄우는 승인형 게이트. **충돌 0이면 현행대로 즉시 반영**(player-first). spec `docs/superpowers/specs/2026-07-02-fusion-shell-reconcile-gate-design.md`. 사용자 결정=충돌 게이트 중심(전체 reconcile 패널 아님). brainstorming→spec→TDD→라이브.
- **구현** — 순수 `deriveReconcilePlan(working, committed)`(playRuntimeValidator, committed 캐논 contract로 working 미반영 캐논/회차 prose 검사 · `buildBandContract`·`firstConflictLayer`·`detectConflicts` 재사용 · factId 없는 대립 제외) · 순수 `applyReconcile`(syncConsole, `buildRetconUpdates`→`applyRetcons` 옛 캐논 교체 + 충돌 newClaim working 캐논 append 제외 + 비충돌 회차/캐논 append) · `ReconcileReview.tsx`(충돌 카드 옛 정본↔새 주장 + retcon/keep 토글 + 승인/취소) · App 배선(reconcilePlan·reconcileDecisions state · reconcileSync 분기 충돌0=commitReconciled 즉시·충돌≥1=다이얼로그 · confirmReconcile · toggleReconcile · 오버레이).
- **충돌 처리 = retcon 재사용** — 응결 스튜디오 retcon 경로(buildRetconUpdates·applyRetcons) 그대로. 기본 keep(승인형 안전). retcon=committed 제자리 교체(모순 두 캐논 공존 방지, 불변식 계승). keep=committed 유지+working 새 것 버림.
- **검증** — `npm test` 764 녹색·build 성공·신규 테스트 10(deriveReconcilePlan 4·applyReconcile 4·reconcileReview 2). **라이브(preview)** — 실사용 경로(createEmptyProject base): 충돌 캐논(서준 생사) 심고 ⟳최신화→다이얼로그(승인 전 committed 불변)·retcon 토글→승인→옛 앵커 교체·공존 0(캐논 1)·비충돌 회차 합류·remount 크래시 0·배지 리셋 · **충돌 없는 최신화는 다이얼로그 없이 즉시 반영**(player-first).
- **범위 밖(다음)** — 회차 항목별 승인(회차는 자동 append=최소 몽타주) · PLAN staged(`PLAN +N`) · 의미 중복 dedup(LLM) · retcon 예산 상한 · epilogue 미니멀 재배치·이중 헤더 통합=슬라이스 C.

## 활성 트랙 — 융합 셸 슬라이스 B: 싱크 콘솔 (`done` · 2026-07-02, 브랜치 `feat/fusion-shell-sync-console` 미머지 → **PR #14 main 머지**)

슬라이스 A가 PLAY 변경을 `onChange`마다 즉시 `saveProject`로 본편 반영하던 것을, **git working-tree 모델**로 전환한 조각(사용자 발명, handoff 2026-06-30 2차 line 172 + 목업 `sync-console.html`). PLAY 변경은 diveKey working copy에만 staged, 상단 **`PLAY +N` 배지 + ⟳최신화** 버튼으로만 본편(storageKey)에 **append 머지**. spec `docs/superpowers/specs/2026-07-02-fusion-shell-sync-console-design.md`. 사용자 위임("너 뜻대로") 후 데이터 모델까지 확정. brainstorming→spec→TDD→라이브.
- **구현** — 순수 `syncConsole.ts`(`countPendingSync` working vs committed 회차/캐논 id diff · `reconcileWorkingIntoCommitted` committed 없는 것만 append=WRITE 본편 편집 보존) · 순수 `SyncConsole.tsx`(pending.total>0일 때만 배지+⟳최신화) · `WorkspaceModeBar` `rightSlot`(상단 바 한 줄 통합, 이중 헤더 안 늘림) · App 배선(`pendingSync`·`syncVersion` state · DiveStage `saveProject` 제거→`onWorkingChange` · PLAY 진입 working 우선(A의 loadProject 교체 되돌림) · `reconcileSync` · StoryXDesk `key={studioView-syncVersion}` remount).
- **2단 저장소** — committed=`storageKey`(본편·WRITE 직접 편집) · working=`diveKey.project`(PLAY 작업본). diveKey가 진실이라 DiveStage state 리프팅 없이 콜백으로 pending만 갱신.
- **검증** — `npm test` 754 녹색·build 성공·신규 테스트(syncConsole 순수 8·SyncConsole 컴포넌트 2·workspaceModeBar rightSlot 1). **라이브(preview)** — 실사용 경로(createEmptyProject base + 응결 회차)로 배지 `PLAY +2`·최신화 전 본편에 회차 없음(staged)·⟳최신화→본편 append+배지 리셋·remount 크래시 0·fcApp 지속. WRITE 편집 보존은 reconcile append 순수 테스트로 단언.
- **발견(내 슬라이스 무관, 잠복 가능)** — `createSeedProject`(seed)를 committed로 직접 editor 여는 **비현실 경로**는 브라우저 client effect(FloatingEditor useLayoutEffect)에서 크래시(빈 seed는 정상·회차 있으면 크래시·jsdom·server render는 재현 안 됨). 실사용 base는 createEmptyProject라 무관하나, seed+회차 fresh mount 잠복 버그 가능성.
- **범위 밖(다음)** — 무거운 reconcile 검토 게이트(충돌 같음/다름·캐논 등록/보류, 승인형)=**슬라이스 B-2**(playRuntimeValidator·DeviationReview 재사용) · PLAN staged(`PLAN +N`, StoryXDesk 내부 staged화 필요) · epilogue 풍 미니멀 재배치·이중 헤더 통합=슬라이스 C.

## 활성 트랙 — 융합 셸 슬라이스 A: 3모드 토글 (`done` · 2026-07-02, 브랜치 `feat/fusion-shell-mode-toggle` 미머지 → **PR #13 main 머지**)

흩어진 `?stage=dive`(PLAY)·`?stage=editor`(WRITE/PLAN) 이동을 상단 **PLAY/WRITE/PLAN 토글**로 통합하고, 세 표면이 `storageKey` 하나를 단일 project 소스로 공유하게 만드는 융합 첫 뼈대. 재작성 아니라 기존 부품(DiveDesk·StoryXDesk)을 한 셸로 감쌈. spec `docs/superpowers/specs/2026-07-02-fusion-shell-mode-toggle-design.md`. brainstorming(visual companion)으로 슬라이스 범위 A 확정(싱크 콘솔은 다음).
- **구현** — 신규 순수 `WorkspaceModeBar`(3버튼 토글) · StoryXDesk `initialStudioView` 프롭(WRITE=draft·PLAN=bible 착지, `key={studioView}`로 remount 재시드) · App `studioView` state + `selectWorkspaceMode`(stage+studioView 구동) · **storage 브리지**(`hasSavedProject` 헬퍼 · DiveStage onChange·seedAndEnter가 `saveProject`로 storageKey 반영 · 복원 시 loadProject로 교체 = storage 유일 진실).
- **검증** — `npm test` 743 녹색·build 성공·신규 테스트(workspaceModeBar 2). **라이브 왕복** — 토글로 3표면 전환(WRITE 원고·PLAN 인물 관계도/캐논·PLAY dive), 작품명·토글 상단 sticky 고정, storageKey 공유, 콘솔 0. wm-bar가 StoryXDesk 마운트 스크롤에 밀리던 것 sticky top:0로 수정.
- **알려진 잔여(다음)** — wm-bar와 StoryXDesk 내부 편집/데이터 pill **이중 헤더**(슬라이스 C 미니멀 재배치에서 통합) · 싱크 콘솔·⟳최신화 게이트(슬라이스 B) · publish 4번째 모드.

## 활성 트랙 — 🔴 retcon 경로 (`done` · 2026-07-01, 브랜치 `feat/canon-retcon-path` 미머지)

응결 스튜디오에서 카운트 배너로만 보이던 캐논 충돌을, `새 주장 ↔ 옛 정본` retcon 카드로 올려 플레이어가 **정본 교체(retcon)/버리기** 를 고르게 하는 조각(정본 §5·§9). spec `docs/superpowers/specs/2026-07-01-canon-retcon-path-design.md`. 좁은 슬라이스라 spec §5를 태스크 목록으로 인라인 TDD(자율 진행, 브레인스토밍 Q&A 생략·결정 공개).
- **구현** — `DeviationConflict` 타입 + `deriveDeviationCandidates`가 conflicts 목록 수집(factId 있는 것만, id=`${msgId}-c${i}`) · `buildRetconUpdates`(retcon 결정만 `{factId,statement}`) · `applyRetcons`(storyEngine, 옛 fact statement 제자리 교체·factId/importance/reveal 보존·불변) · DeviationReview retcon 카드(props retconDecisions·onRetconToggle) · DiveDesk approve가 `applyRetcons(project, …)` 결과 위에 커밋.
- **메커니즘** — 옛 캐논 statement 교체(모순 두 캐논 공존 방지). 기본=버리기(blocksCanonization 유지). retcon은 명시 액션만(승인형).
- **검증** — `npm test` 741 녹색·build 성공·신규 테스트(playRuntimeValidator +2·storyEngine +1·deviationReview +1). 라이브 콘솔 0·retcon 카드 CSS 실측(활성 red #f87171·교체 버튼 solid). 런칭 게이트 — 버리기면 캐논 불변·retcon만 교체·모순 두 캐논 공존 0.
- **범위 밖(후속)** — retcon 예산 상한(§9)·옛 fact 삭제(교체만)·이력 로그·LLM finding retcon.

## 활성 트랙 — 슬라이스 B: LLM 응결 검증기 (`done` · 2026-07-01, 브랜치 `feat/mvp2-llm-consolidation-validator` 미머지)

결정론 런타임 검증기가 놓친 **다중 턴·의미적 모순**을, 응결 승인 전 **opt-in LLM 대조**로 잡는 조각(MVP-2 무거운 절반, 정본 §7·§12.2 ConStory). spec `docs/superpowers/specs/2026-07-01-mvp2-llm-consolidation-validator-design.md`, 계획 `docs/superpowers/plans/2026-07-01-mvp2-llm-consolidation-validator.md`. brainstorming 4결정(D1 opt-in 버튼·D2 모순만·D3 경고 게이트·D4 storyxBridge 재사용) 후 executing-plans 인라인 TDD 5태스크.
- **구현** — 새 LLM 엔드포인트 `dive-consolidate`(storyx.mjs 커맨드 + `storyxBridge('/api/dive-consolidate')`, dive-condense 동형·mock 폴백) · `normalizeFindings`(견고 파싱, 순수)·`requestDiveConsolidate`(diveClient) · 신규 `ConsolidationFindings.tsx`(high 🔴/low 🟡/없으면 ✓, 순수) · DiveDesk approve 다이얼로그에 "🔍 정밀 검토" 버튼·findings/reviewing state.
- **실행 시점 = opt-in** — 응결 몽타주는 빠르게 유지, 플레이어가 "이 회차 정밀 검토" 원할 때만 LLM 1회. 매 응결 강제 아님(player-first).
- **결과 = 경고 게이트** — findings는 승인/거절을 돕는 정보. per-finding 자동수정·retcon은 후속. 프롬프트에 "회수 약속 보이면 제외"(정본 §12.1)로 의도적 복선 위양성 차단.
- **검증** — `npm test` 737 녹색·build 성공·mock CLI(`dive-consolidate --provider mock`→findings [])·신규 테스트(diveClient +3·consolidationFindings 3). 라이브 — 콘솔 0·카드 CSS 실측(finding-high #fca5a5·검토 버튼 #c4b6ff). 런칭 게이트 — opt-in(자동 0)·mock/실패 크래시 0.
- **범위 밖(후속)** — per-finding 수정·retcon · missed-reveal/의미 dedup · 자동 실행 · ArcDigest/Growth/Relation Snapshot.

## 활성 트랙 — MVP-2 응결 스튜디오 (슬라이스 A-i) (`done` · 2026-07-01, 브랜치 `feat/mvp2-consolidation-studio` 미머지)

MVP-1이 매 턴 표시한 ✦ 의외 전개 후보가 응결하면 증발하던 것을, **응결 승인 다이얼로그를 스튜디오로 올려** 후보마다 승격/수정/넘기기 결정을 받고 승격만 캐논으로 굳힌다(정본 §7·§8·§13 Q2 최소 몽타주). spec `docs/superpowers/specs/2026-07-01-mvp2-consolidation-studio-design.md`, 계획 `docs/superpowers/plans/2026-07-01-mvp2-consolidation-studio.md`. brainstorming 4결정(D1 ✦만 결정 대상·D2 승격/수정/넘기기·D3 payload.newCanonFacts 승격 경로·D4 approve 다이얼로그 업그레이드) 후 executing-plans 인라인 TDD 6태스크.
- **구현** — 순수 `deriveDeviationCandidates(session)`(응결 span verdict→✦ 후보·🔴/🟡 카운트) · `dedupePromotions`(LLM 캐논과 문자열 근접 dedup) · `buildPromotedFacts`(승격 결정→`{owner:'plot',statement}`, edits 우선). 신규 `DeviationReview.tsx`(✦ 카드+🔴 배너, 순수 표현). DiveDesk 조립 — deviations useMemo·decisions/edits state·approve가 승격 팩트를 `payload.newCanonFacts`에 concat.
- **승격 경로** — 기존 `chapterFromDraftPayload` 재사용, reveal=revealed 기본(disclosed 반전에 정확)·importance/participants는 normalize 백필. 시그니처 무변경.
- **최소 몽타주** — 기본 결정 skip, 굳힐 것만 탭. 🔴/🟡는 정보 배너만("충돌 N건 캐논에서 빠졌습니다", retcon 후속). LLM newCanonFacts는 자동 커밋 유지(리뷰 안 시킴).
- **테스트 분리** — approve()가 정적 렌더로 테스트 안 되는 문제를 결정 로직=순수 함수(1~3)·카드=프레젠테이션 컴포넌트(4)로 분리해 각각 TDD. DiveDesk 조립은 tsc+라이브.
- **검증** — `npm test` 731 녹색·build 성공·신규 테스트(playRuntimeValidator +7·deviationReview 2). 라이브 — 콘솔 0, 스튜디오 CSS 실측(배너 #fca5a5·승격 토글 #bef264). 런칭 게이트 — 넘긴 ✦ 캐논 0·승격만 등록·dedup 중복 0.
- **범위 밖(후속)** — 🔴 retcon 경로 · LLM 응결 검증기(슬라이스 B, ConStory 4단) · ArcDigest/Growth/Relation Snapshot.

## 활성 트랙 — MVP-1 PLAY 런타임 거버넌스 (`done` · 2026-07-01, 브랜치 `feat/mvp1-play-runtime-governance` 미머지)

Canon Core(중요도 밴드·selectCanonForContext) 위에 PLAY(DiveDesk) 런타임 검증을 얹는 슬라이스. 받은 답을 렌더 직전 **결정론으로 검사** — 앵커 위반=캐논화 차단·중=경고·소프트 일탈="의외 전개 후보" 배지(정본 §5·§7, 크래프트 §14). player-first(Q2) 몰입 무손상이 하드 제약. spec `docs/superpowers/specs/2026-07-01-mvp1-play-runtime-governance-design.md`, 계획 `docs/superpowers/plans/2026-07-01-mvp1-play-runtime-governance.md`. brainstorming(visual companion)으로 4결정(D1 판정엔진=결정론·D2 앵커=캐논화 차단·D3 배지=여백 거터·D4 범위=PLAY+차단) 확정 후 executing-plans 인라인 TDD 7태스크.
- **구현** — 신규 순수 `playRuntimeValidator.ts`(`validatePlayTurn(reply, canonFacts, openThreads)→verdict{conflicts·surpriseCandidates·blocksCanonization}`). 밴드별 자체 미니 `ContinuityContract`(anchor→hardCanon·major→livingState·soft→softSignals) + `classifyCanonChange` **재사용**(새 대립 로직 0) · `factBand` 헬퍼 신설 · `DiveMessage.verdict?`·`appendMessage` verdict 인자 · `buildCondenseTranscript`(앵커 위반 턴 응결 제외) · DiveDesk 배선(검증 호출·거터 마커·하단 앰비언트 카운트).
- **★ reveal형 앵커 위반 보강(계획 초과)** — 앞머리 마커("사실 X는 죽었어")가 subject 추출을 흔들어 대립을 놓치는 미탐을 발견(실제 `classifyCanonChange` 반환 로그로 확인). 벗긴 변형도 함께 검사해 미스터리 reveal형 하드 차단을 실작동시킴. 문중 마커는 원문 그대로 이미 잡힘.
- **의외 후보 = 보수적 휴리스틱(미탐 선호)** — reveal 마커 화이트리스트 + 캐논 엔티티/열린 떡밥 접촉 + 충돌 아님. 잘못된 ✦가 몰입을 깨므로 과탐보다 미탐.
- **UI** — `.dx-turn` 왼쪽 거터 세로선(anchor red>major amber>surprise lime, 본문 무접촉·탭 title peek) + 작성창 위 앰비언트 카운트(응결 온램프). `.dx-*` 다크 스코프.
- **검증** — `npm test` 721 녹색·build 성공·신규 테스트(playRuntimeValidator 8·diveSession +2·diveDesk +2·canonImportance +1). 라이브 — `?stage=dive` 콘솔 0, 거터 CSS 실측(`.dx-gutter-anchor::before` = 3px `#f87171`). 런칭 게이트 = 앵커 모순 대사 `blocksCanonization`으로 응결 transcript 제외.
- **범위 밖(MVP-2)** — per-item 승격/이번만/수정 UX · LLM 응결 검증기(ConStory 4단) · major 반전 cause/cost 게이팅. 선택적 수동 "다시" 버튼은 YAGNI 보류.

## 활성 트랙 — Canon Core (MVP-0) (`done` · 2026-07-01, **main 머지 완료** PR #7)

캐논 거버넌스 정본(`docs/research/2026-06-30-canon-governance.md`)의 첫 구현 슬라이스. flat `CanonFact` 의 head/tail digest 절단(A-6 — 30화서 중반 캐논 51/91 소실)을 **중요도 가중 + 장면 관련성 + reveal 분리 주입**으로 교체. 스펙 `docs/superpowers/specs/2026-06-30-canon-core-mvp0-design.md`, 계획 `docs/superpowers/plans/2026-06-30-canon-core-mvp0.md`. 서브에이전트 주도 TDD(7태스크·7+커밋) + 최종 코드리뷰 + IMPORTANT 2건 수정.
- **구현** — `CanonFact` 에 `importance·participants·reveal·evidence` optional 확장(+`CanonEvidence`) · 신규 순수 모듈 `canonImportance.ts`(`importanceBand` 0.82/0.45 · `deriveImportance` 작가핀 우선·비핀 max 0.65 앵커 자동도달 없음 · `selectCanonForContext` **앵커 절단 금지**·관련성 검색) · `buildProjectContextDigest` 캐논 블록 교체(`확정 캐논`/`숨은 캐논` 2절 분리, secret/foreshadowed=모순금지+누설금지) · `normalizeProject` 2-pass 백필(alwaysInclude→importance 0.9 앵커 브리지) · `deriveActiveParticipants`.
- **reveal 공개 축** — `revealed`/`secret`/`foreshadowed`. 정본 §14 위험2(withholding/조기해소) 차단. 미스터리·스릴러(Q1) 직결. (필드명 reveal — 기존 essay disclosureLedger 충돌 회피.)
- **코드리뷰 수정** — `selectCanonForContext` 의 `scoreOf` 가 importance 미설정 + alwaysInclude 면 0.9 앵커로 직접 인정(세션 중 핀 토글이 normalize 전에도 면제) · B3 테스트 index 45(예산 밖)로 이동해 앵커 보장 실검증.
- **회귀 교정** — `longformContinuity.test.ts` 의 옛 head/tail "첫+마지막 생존" 단언을 **"중간 앵커 생존(A-6)"** 으로 교정(더 강한 계약). 미사용 `CONTEXT_CANON_HEAD` 제거.
- **알려진 잔여(MINOR, 후속)** — longform 픽스처가 비앵커 최근 캐논 생존을 직접 검증 안 함(실사용은 관련성 경로로 보호). MVP-1(PLAY 런타임 거버넌스)·연속성 자동검사기(ConStory)·번역 투 게이트는 별도 spec.

## 활성 트랙 — Dive X 제안 엔진 (`done` · 2026-06-28, 브랜치 `feat/dive-x-proposal-engine`)

Dive 진입을 "고정 시드 캐릭터 자동선택"에서 **"소재 한 줄 → 비틈 벡터로 분산된 장면 전제 후보 추천 → 선택 시 scene-showrunner 시딩"**으로 교체. 큰 그림 재설계(글로벌 딥리서치 `docs/research/2026-06-28-dive-x-market-direction.md` — 폐루프 상용 선례 없음·최대 리스크="남의 플레이 재미없다"→응결 품질이 해법·규제가 전연령 포지션을 해자로) 위에서 첫 조각. 스펙 `docs/superpowers/specs/2026-06-28-dive-x-proposal-engine-design.md`, 계획 `docs/superpowers/plans/2026-06-28-dive-x-proposal-engine.md`. 전체 비전(취향#1·제안#2·스티어링#3·전개#4) 중 **제안#2만**.
- **구현 (TDD·6 태스크·전부 녹색)** — `diveProposal.ts`(순수 — 비틈 벡터 5종·`seedFromProposal`·`isValidProposal`) · `requestDiveProposals`(견고 정규화) · `tools/storyx.mjs dive-propose` + `/api/dive-propose` 브리지 · `DiveStart.tsx`(소재·신기성 다이얼·후보 카드) · App.tsx 진입 교체. 신규 테스트 6(diveProposal 3·diveClient 2·diveStart 1).
- **융합 토대** — 후보를 공유 모델(`scene`→session.scene·`cast`→project.characters)로 떨어뜨려 "Dive 진입→Story X 에디팅"이 같은 프로젝트의 두 표면이 되도록 설계(north-star).
- **검증** — `npm test` 685 녹색·`npm run build`(tsc+vite) 성공·mock CLI 3후보 형태 확인·**실 codex 경로 4후보(정체전복/시간구조/관계역전/장르전환, hook0 "십 년 만에 돌아온 소꿉친구는 내 이름을 부르지 않고…" = 전형성 편향 격파 실증)**·DiveStart 라이브 렌더+다크 표면 수정(흰 글자 묻힘 버그 잡아 `.dx-start` 다크 배경화). 라이브 카드→DiveDesk 전이는 codex ~90초 지연으로 브라우저 E2E 타이밍 노이즈(코드 경로는 tsc+단위테스트로 검증).
- **다음 조각** — 취향 프로필(#1 명시 온보딩+누적 학습) 또는 스티어링(#3 내취향대로/일부러 다르게/인기). 비목표였던 것들.

### 자유 서술 진입 (`done` · 2026-06-29, 브랜치 `feat/dive-x-freeform-intake`)
제안 엔진 dogfooding 학습 — **카드 선택이 자유도·"자꾸 시도하게 되는 재미"를 죽인다.** 앞문을 "소재+다이얼+카드"에서 **자유 서술 한 칸 → `dive-setup`(서술에 충실하게 주인공·관계인물·첫 장면 추출, 비틈 금지) → 바로 DiveDesk 진입**으로 교체. 제안 카드는 "막히면 제안 받기" 접이식 보조로 강등(삭제 안 함). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-29-dive-x-freeform-intake*`.
- **구현 (TDD 6태스크·녹색)** — `DiveSetup` 타입 + `seedFromProposal` 느슨화(scene·cast만) · `requestDiveSetup`(null 폴백) · `tools/storyx.mjs dive-setup` + `/api/dive-setup` 브리지 · `DiveStart` 재구성(자유 서술 1차 + 보조 접이식) · App `onStart` 공유 시드 헬퍼. 신규 테스트 4(diveProposal 1·diveClient 2·diveStart 재작성 2).
- **검증** — `npm test` 689 녹색·build 성공·**실 codex 라이브**(자유 서술 "편의점 야간 알바·우산 사가는 첫사랑 단골" → ~28초에 충실한 scene[비가 유리문을 두드리는 편의점…]+cast[한서윤] 시딩 → 바로 DiveDesk, 콘솔 0) · 보조 "막히면 제안 받기" 토글→다이얼 3버튼+제안 받기 펼침 확인.
- **승인형 원칙 유지** — 인물은 응결 전 soft seed라 바로 진입이 하드 캐논 자동박제 아님. 🎬 장면 즉시 편집·"뒤로"가 안전장치.

## 활성 트랙 — 품질·비용 로드맵: 작품 헌장 중심 (`in_progress` · 2026-06-12, main 머지 완료)

30화 A/B(76.5 vs 91.8) + **사용자 실독 판정**(제목 반복·정체된 중후반·온건한 문체·의외성 부재·토큰 비용)으로 수립. 정본 — 로드맵 `docs/superpowers/plans/2026-06-12-quality-cost-roadmap.md` · 헌장 spec `docs/superpowers/specs/2026-06-12-story-contract-design.md`.
- **사용자 결정 (2026-06-12)** — ① 분량 2등급: 단편 4~8화 · 장편 24~36화 시즌제, **중편 없음** ② 결말까지 구상된 상태에서 시작(결말 역산) ③ 별도 전개 에이전트 대신 **CLAUDE.md 식 공유 기준(작품 헌장)을 전 에이전트에 주입** ④ Story X 가 의외의 전개를 제안하는 동료로. 추가 — 단계적 집필 + 4줄 척추(《4줄이면 된다》).
- **순서** — Phase D → A(헌장) → B·C → E → F(같은 모델 재실험, **10화 중간 게이트 후 30화 결정**). 시즌 아크 플래너·R2 아크 다이제스트는 헌장 spec 에 흡수.
- **이번 세션 진행 (코딩, TDD·전부 녹색, main ff-merge 완료)** — 5커밋.
  - **Phase D-1** 폴백 episode 번호 드리프트 수정 — `nextEpisodeNumber`(chapters 마지막+1)로 도출, 폐기된 폴백 번호 회복(쇼케이스 16→19 결번 류 면역). (`cf8f1de`)
  - **Phase D-2** StoryScore v0.2 — 2글자 이름 위양성 가드·제목 반복 신호(어간 공유, U1)·후크 확장(느낌표·반전어). 스킬 루브릭에 온건함(U3)·제목 반복(U1) 감점. V0_1→V0_2. (`b7f59f2`)
  - **Phase A-1** 작품 헌장 데이터 모델 — `StoryContract`·`StorySpine`(4줄)·`validateContract`(4/8/24/36 경계·결말·비트)·`defaultPlannedEpisodes`(6/30)·createEmptyProject 시드. 전 필드 optional(하위호환). (`a15728b`)
  - **Phase A-5 코어** `buildContractStatus` — 위치·잔여·`overBudget`(미회수>잔여)·`finalStretch`(잔여≤25%) 결정론. chapters 기준 도출(드리프트 면역). U2 직격. (`e92c13d`)
  - **Phase A-4 프롬프트 주입** (`40646ea`) — digest 헌장 절(4줄+결말+대가+위치 N/M) + buildDraftPrompt 예산 회수/종반(새 큰 떡밥만 금지)/척추 환기(정체·초과 시만) + buildAgentReviewPrompt 쇼러너 길 잃음 점검·예산 초과 revise/block + storyx.mjs 미러. **에세이·standalone 제외(A-4=연재 서사만), 프롬프트 문구 사용자 승인.**
  - **Phase A-5 배선** (`43c6d56` 생성 · `d2fd3f8` 검토) — StoryXDesk 가 `buildContractStatus(project)` 계산 → 생성·검토 ×3 호출에 전달 → draftClient/reviewClient body·api/draft·api/review-agent·vite 브리지·storyx CLI `--contract-status` 플래그까지 전 경로. A-4 규칙이 실제 생성·검토 프롬프트에 발화. **헌장이 없으면 전 경로 no-op(하위호환).**
  - **Phase A-3 빌더+온보딩** (`54fa97a` deriveBeatSheet·buildStoryContractFromOnboarding · `2e51fa2` UI) — intake↔building 사이 'charter' 단계(연재 서사만, 에세이·학술·단독 단편 제외). 분량 등급·확정 회차·결말 2문항·4줄 척추 입력 → 헌장 빌드 → seed → createEmptyProject. **★ 헌장 체인 dormant→live** — 라이브에서 신규 장편 온보딩→헌장 패널·CTA 게이트·확정→프로젝트에 contract(long·30화·비트4·spineLocked) 영속 확인(콘솔 0). 이제 A-4/A-5 가 실제 작품에 발화.
- **A-2 단계 게이트 완료 (2026-06-13, TDD+라이브, `3d98fe1`)** — `evaluateProductionGate(project)`: 헌장이 있고 `spineLocked=false` 면 produceEpisode 차단(reason 반환), 헌장 없으면 통과(하위호환 — 기존 작품·백업 주입). buildStoryContractFromOnboarding 단편은 desire+resolution **2줄 경량 잠금**(장편은 4줄 전부). StoryXDesk produceEpisode 진입 가드(미잠금이면 안내만) + 메인 CTA `productionBlockedReason` 비활성, App.tsx charterReady 단편 2줄(빌더와 동일 규칙). storyEngine.test +5·editorFocusLayout +2·appExperience +1. **라이브 — 미잠금 헌장 편집모드 진입 시 CTA disabled "헌장 잠금 필요"+사유 툴팁 → spineLocked 복원 시 "초안 생성" enabled · 콘솔 0 · 원본 무손상.** ★학술은 charter 경로(usesCharter 제외)가 없어 헌장이 안 생기므로 현재 no-op — 학술 헌장 경로가 생기면 같은 게이트가 매체 무관하게 자동 적용된다.
- **A-3b 쇼러너 4줄 제안 완료 (2026-06-13 2차, TDD+codex 라이브, `7486e93`)** — charter 단계에 "쇼러너에게 4줄 제안받기" 버튼 → `/api/spine-suggest`(buildSpineSuggestionPrompt·promptBuilders↔storyx.mjs byte-identical 미러·vite 브리지·codex) → 작품 맞춤 4줄을 **빈 칸만 채움**(작가가 쓴 줄 보존). 실패 시 안내만(직접 입력 유지). pace-interview 인프라 미러. promptBuilders.test +3·spineSuggestClient.test +3·appExperience +1. **codex 라이브 — freewrite "달의 탑·이름 대가"+ending 주입 시 23초에 4줄 도착, resolution 이 endingStatement 와 정렬·콘솔 0.** charter UI 진입(온보딩 intake LLM 연쇄)은 비용 과다라 codex 통합을 직접 fetch 로 검증, 버튼은 소스검사+무조건 렌더(fieldset 내부)로 보장.
- **A-3c 비트 펼침 미리보기 완료 (2026-06-13 3차, TDD+라이브, `92c7ab2`)** — charter 단계에서 잠근 4줄(장편)이 전체 화수의 어디에 박히는지 `deriveBeatSheet`(25/50/75/100%)로 미리 보여준다(읽기 전용, 화수 자동 배분). App charter 비트 미리보기 + `.hx-charter-beats`/`.hx-beat-*` CSS(+A-3b 버튼 CSS 보강). appExperience +1. **라이브 — charter 진입+4줄 주입 시 8·15·23·30화 핀+미션 매핑·dashed 박스·라임 강조·콘솔 0.** 화수 조정(작가가 핀 이동)은 추후 — deriveBeatSheet 자동이 합리적 기본.
- **다음 1순위 — A-6(장편 기억 R1~R3)** — `buildProjectContextDigest`·`CONTEXT_CANON_LIMIT` 의 head/tail 절단이 중반부 캐논을 통째 폐기(ch23 91중 51 소실, `docs/research/2026-06-11-longform-memory-compression.md`)하는 문제. R1(관련 캐논 top-K 결정론 주입)·R2(5화 아크 다이제스트)·R3(중요도 가중 절단). digest 빌더를 건드리는 **큰 작업 — 신선한 세션 권장**. 그 뒤 Phase B(긴장·날것)·C(트위스트)·E(비용)·F(재실험). 학술 단계 게이트(charter 경로 신설)는 academic 1.0 실험 플래그라 후순위.
- **딥리서치 — 이야기 품질·의외성 (2026-06-14)** — Phase B/C 외부 근거 정본 `docs/research/2026-06-14-prose-quality-surprise-research.md`(18 확정·7 반박·23 소스). 핵심 — LLM 평탄함은 정렬 typicality bias·mode collapse·**조기 해소(후반부 긴장 전문가 0.607 vs LLM 0.215 = 3배 낮음)**이며, 처방은 VS(회차 후보 1.6~2.1배)·후반부 긴장 게이트·멀티 페르소나(단일 LLM-judge는 의외성 과소평가 — Story X 검토망 정당화). **★ 결말 역산 헌장이 조기 해소를 baking할 위험 → 헌장에 "정보 비대칭(숨길 정보) 레인" 추가 권고.** 착수 후보(사용자 결정 대기) — ① VS 회차 생성(최저비용) ② 후반부 긴장 게이트(헌장 역설 직격) ③ 헌장 정보비대칭 레인. ⚠️ 박제 금지 — min-p 창작 우월성·narrative-forecasting 정확 레시피는 검증 탈락(refuted). 근거 공백 — 한국어 문체(번역 투)는 영어 코퍼스라 미해결.
- **Phase D-3(dev 서버 사망 조사)는 Phase E-1 계측으로 이관** — 재현 없이 추정 금지.

## 병행 트랙 — 품질 실증 테스트: 실사용 창작자 10인 (`in_progress` · 2026-06-07 착수)

페르소나 실증 테스트로 이야기 품질·연속성을 검증하고 새 제작 계획을 만든다. 설계 정본 `docs/superpowers/specs/2026-06-07-persona-live-test-design.md`, 실행 `docs/superpowers/plans/2026-06-07-persona-live-test-plan.md`.
- **방식** — 실사용 창작자 10인(소설6·만화1·에세이1·오디오1·학술1) 풀 라이브 직접조작(Playwright+codex). 장편 #1~3 완권(~20~25화) 연속, #3·#4 캐릭터 일관성 집중. 6축 평가. 멀티세션 S0~S15.
- **S0 파일럿 #1 (웹소설 장편 회귀) 완료** — 1화 생성+검토 풀라이브. 인터뷰 freewrite 받아씀·1화 품질 높음·**검토 5명 중 3명이 "미래지식 과잉확정" 수렴 포착(차별점 실증)**. 로그 `docs/reviews/2026-06-07-persona-live-test/`.
- **중대 발견 — 온톨로지 0 (구조적 배선 갭)** — (A) 온보딩→project 메타 미배선 (B) 회차 canonFacts↔온톨로지 미연결. **갭 B·A 모두 수정·라이브 확인(TDD)** — 갭B: `buildStoryOntology` canonFacts 반영(`ebe46b5`). 갭A: `deriveOnboardingSeed`+`createEmptyProject` 메타 시드(`59c8d3f`). **새 작품(백작가 빙의) 라이브 — logline·audiencePromise 시드, 하니스 2/8·22 → 7/8·93/100·온톨로지 0→12·온톨로지빌더 pass.** "온톨로지 0" 실증 해소.
- **#2 (백작가 빙의 로판) 2화 회차 연속성 첫 실증 (2026-06-07 이어서)** — produceEpisode 2화 생성 + 5명 검토 풀라이브. 캐논 정확 계승 · **온톨로지 12→17 · canonFacts 5→8 · memoryAnchors 4**(갭B 가 회차 누적에서 작동 실증) · L 단서→레나 위클리프 추적. 검토 5명 중 3명(연속성·세계·장르)이 의도 메모 오염을 독립 포착(차별점). **발견 — P1 쇼러너 빈응답(간헐 ~2/3) · P2 floating 회차생성 경로 마찰(잠금 UI 부재 + 잠금 후 state 미갱신→새로고침) · P3 의도메모 잔류 오염 · P4 캐논화 안 된 세부 드리프트(characters 0, 가족 이름 에드릭·노엘→레오니드).** 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md`.
- **발견 수정 (A) — P3·P2 완료 (TDD+라이브, 2026-06-07 이어서)** — P3(`defaultEpisodeIntent` 데모문구 '용사와 외계인'→'')·P2(`onConfirmChapterLock` 에 `setLatestChapter` 동기화). `editorFocusLayout.test.ts` +2(RED→GREEN), 314 tests. 라이브 — #2 3화 "동부 물류 검인권" 용사/외계인 오염 0 · 새로고침 없이 잠금→생성 · canonFacts 8→11. 캡처 `02/03-ch3-p2p3-fix-verified.png`.
- **발견 수정 (A) — P4 인물 캐논화 완료 (TDD+라이브)** — extractEntityName 개선(공백 이름·조사 확장·generic/조직 가드, export)·commitChapter 가 owner=character 캐논을 `characters` 로 승격. storyOntology.test +5·storyEngine.test +3, 322 tests. 라이브 — #2 4화 생성 시 characters [] → ["레나 위클리프"]·데이터 인물 1·canonFacts 11→15. 갭B 시드도 동반 개선.
- **#2 5·6·7화 테스트 + P5 발견 (2026-06-08)** — 연속성 우수·오염 0·canonFacts 15→27·characters [레나,리아나]. **P5 — P4 한계(가족 이름 드리프트: 둘째 오빠 에드릭·노엘→레오니드→루시안). 단 7화 = 캐논화 후 고정 실증(6화 루시안 캐논화 → 7화 유지) — canonFacts→digest 메커니즘 작동.** 생성시간 누적 증가(40→95초). 로그 `docs/reviews/2026-06-07-persona-live-test/02-romancefantasy-regression.md`.
- **#2 9~13화 테스트 + 각 5인 검토 (2026-06-08 이어서, 코드변경 0)** — 9~13화(오른편으로 돌아가는 종이·오른편의 첫 날짜·지워진 오른편·첫 오른편의 약속·비어 있는 오른편) 생성+검토 풀라이브. 연속성 ★★★★★·오염 0·canonFacts 27→52·온톨로지 46→68·characters 2→3. **실증 — (1) 캐논화 후 고정 7연속(루시안 ch7~13) (2) 검토 일관성(세계 키퍼=미설명 비용/메커니즘 ch9~13 5연속·연속성=확정강도 ch10·11·13·캐릭터=리아나 신뢰속도 ch10·13 = 각 페르소나가 원칙을 반복 적용, 랜덤 아님) (3) 캐논 고정 이름이 미스터리 논리 규정 → ch12 페이오프(첫 배신자=죽은 벨로트 레오르)·ch13 덫 회수 (4) 게이트 본문반응 5/8→5/8→6/8→4/8→6/8 + ch12 게이트↔페르소나 분기 (5) 미스터리 자가교정(ch9 우려→ch10·ch11 우려→ch12).** **P6 신규 — extractEntityName 조사 버그**(ch12 "레오르 벨로트라"). P1 이번 0/5. 9·10 `aaf6d41`·11 `8ff27bf`·12 `d37159b` 커밋. 로그 `## 9~13화` 절.
- **#2 14~23화 테스트 + 완결 + 종합 리포트 (2026-06-08 이어서, 코드변경 0)** — ch14~21 무드리프트·검토 샘플링. **배신자 reveal(백작부인 ch19) → P5/P6 라이브 검증**(첫 character 캐논 "백작부인" 클린 승격). **★ 최대 발견 continuity ≠ payoff** — 21화 연속성 완벽하나 전제 페이오프 0, codex reveal 무한 연기. **근본 원인(피날레 확정)= 쇼러너 연재 편향**(완결에 역행). **권고 A 실증** — intent 유도 ch22·23 로 deferral 끊고 **23화 완결**(전제 이행·수미상관·연속성 무결점, L.B.=라비니아 벨로트). 연속성 감수자가 결말 캐논↔프로즈 불일치도 포착. **종합 리포트** `FINAL-REPORT-romancefantasy.md`(6축 연속성5·평균~3.8·권고1=아크 페이오프 게이트). P1 0/13·14.
- **개선 (B) — 검토 전제진척 프롬프트 (TDD+라이브, 2026-06-08 이어서)** — continuity≠payoff 근본 원인 = `criteriaKeys`(showrunner `stakes_progression_audit`)가 라이브 검토 프롬프트에 미주입돼 dead. `buildAgentReviewPrompt`(promptBuilders.ts·storyx.mjs) "## 지시"에 "연재면 중심 질문(전제) 진척도 본다" 가산. promptBuilders.test +1, 326 tests. **라이브 검증** — 새 프롬프트로 쇼러너가 ch20류 연기를 revise("선택·대가·전술 변화 없어 추적 못 끝냄")로 전환(이전 통과→revise). 커밋 `aa98137`. #2 상태 백업 `docs/reviews/.../backups/02-work-backup-ch23.json`(로컬).
- **일괄 수정 (A) — P6·P5·relations 완료 (TDD, 2026-06-08 이어서)** — 사용자 "일괄 수정 착수" 선택. **P6** `extractEntityName` 정규식에 명명 계사 "(이)라는" 추가("레오르 벨로트라"→"레오르 벨로트"). **P5** `extractCharacterNames`(주어 + 서술부 "이름은 X" 명명) 신설 → `promoteCharactersFromCanon` 가 서술부 인물도 승격(루시안 벨로트 등). **relations** `extractRelation`("A의 [관계] 이름은 B" 보수 파서) + `linkRelationsFromCanon` 신설 → commitChapter 가 관계 엣지 생성(리아나→루시안 "둘째 오빠"). storyOntology.test +1·storyEngine.test +2, **325 tests**·tsc·build 녹색. (#2 localStorage 의 "레오르 벨로트라"는 재현 보존 위해 안 건드림 — 수정은 향후 커밋부터 적용.)
- **개선 (C) — 작가 결정 갈림길 + 생성 측 회수 의무 완료 (TDD+라이브, 2026-06-10, 브랜치 `feat/author-decision-forks`)** — FINAL-REPORT 권고 1·2의 다음 조각. 스펙 `docs/superpowers/specs/2026-06-10-author-decision-forks-design.md`, 계획 `docs/superpowers/plans/2026-06-10-author-decision-forks.md`. (1) **생성 측 회수 의무** — 검토만 알던 `payoffStatus`(정체 측정)를 초안 생성 프롬프트까지 배선: `buildDraftPrompt` stallRules 주입(`dcb3632`) + StoryXDesk→draftClient→api/draft→storyx.mjs 미러(`caecedf`) + **vite 브리지 `--payoff-status` 전달 갭을 검토 루프가 적발·수정**(`0f243b2`). (2) **회차 갈림길 카드** — `episodeBriefing.ts` 신설(미회수 promise·openThreads 에서 결정론 도출, LLM 0회, `ec840af`)·정체 시 가장 오래된 약속 우선(`128497c`)·FloatingEditor `.fc-forks` 카드 — 옵션 클릭이 의도 메모에 intent 한 줄 append(`608db57`)·openThreads dedup(`5e1f1e3`). 서브에이전트 구현 + 2단 검토(스펙/품질) 루프 — 검토가 slice 방향·브리지 갭·dedup 3건을 잡아 수정. **라이브** — #2 ch23 백업+레저 주입으로 정체 갈림길 2질문·옵션 4개 렌더, 클릭→메모 합성·중복 무시·다중 선택 정상, 기본 작품은 떡밥 갈림길만(규칙 일치), CLI dry-run 4케이스(정체만 주입·오형식 무시), 콘솔 에러 0. 캡처 `docs/handoff/screenshots/author-decision-forks/`.
- **#3 헌터물 A/B 6축 실증 완료 (2026-06-10 2차, 코드 1건 수정)** — 같은 ch1-locked 분기점에서 B암(미사용) vs A암(사용) 각 2화 + 5인 검토. **★ 사전 발견 — 실생성 작품에서 갈림길이 안 뜨는 구조 갭**(codex 가 rewardArc payoff 즉시 채움 + openThreads 미생성 → fork 소스 0, 실위험은 stakesLedger deferred 에만) → `deferred-stake` fork 추가(TDD 2케이스, `a425042`). **실증 — 갈림길은 연속성(양암 5점 동률)이 아니라 페이오프·상업성을 움직임**: A암 fork 시드가 rewardArc 약속으로 직결·회차 내 이행(백도현=설계자→윤서문 reveal·서가을 안전 lost 실대가·deferred→kept/lost 회전), B암은 발견 축적 + 쇼러너 deferral 압박 재현(통제군). **과회수 신호 → 회차 진도 인터뷰 승격 근거.** P7 신규(fork 시드 의도메모 잔류)·stake 문자열 드리프트·P1 1/13. 리포트 `docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md`.
- **다음** — 회차 진도 인터뷰(승격, 1순위)·fork 시드 강도 2단화·P7 시드 잔류 정리. Follow-up — 갈림길 LLM 정제(2단계)·결정 부채 보드(별도 스펙).

## 병행 트랙 — 편집기 재설계: 방향 C "떠 있는 작업실" (실데이터 배선 완료)

2026-06-05. claude.ai design 에서 발산한 3방향 편집기 시안 중 **방향 C** 를 React 로 이식 착수. `design/floating-editor` 에서 작업 후 main 머지(체크포인트).
- **들어온 것** — `src/components/FloatingEditor.tsx`(739줄) 비주얼 Phase 1. 어두운 캔버스 + 종이 시트 + 좌측 플로팅 독 + 단락 옆 여백 주석 + 작가별 색 밑줄. 인터랙션 전부(드래그 호출 popover·5명 순차 검토·반영/보류·집중·모드탭·키보드). `?editor=floating` 진입, `.fc-*` 스코프 CSS — 기존 편집기·테스트·전역 토큰 무영향(그래서 게이트 녹색).
- **실데이터 배선 완료 (2026-06-05)** — `SAMPLE_*` 제거 → 순수 표현 컴포넌트. StoryXDesk 가 `?editor=floating` 일 때 실 `editorText·MarginReview·CORE_PERSONAS·beats·검토 콜백(onSummon/onRunAll/onAcceptDiff/onRejectReview)`을 props 주입(접근 A). `floatingEditor.test.ts`(react-dom+jsdom 렌더) 추가. 라이브 검증 — 실 페르소나 5명·전체검토 5건 도착·콘솔 0. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-05-floating-editor-data-wiring*`.
- **Phase 2a 스왑 완료·머지 (2026-06-06, main `389a997` ff-merge + 정렬 `488b5e8`)** — floating 이 편집 기본(`isDraftMode && !isClassicEditor`, `?editor=classic` 한시 폴백). 본문 contentEditable 라이브 타이핑(IME compositionstart/end 가드 + bodyVersion-메모로 커서 클로버 차단) + 의도메모 쓰기-백 + 초안생성/편집·데이터/출간 네비 배선. emitBody 는 블록을 `\n\n`(splitIntoParagraphs 라운드트립)로 join. **사용자가 실제 한글 타이핑 정상 확인** → 머지. 추가 — 빈 마진 `display:none` 으로 종이 시트 가운데 정렬. 라이브 — 기본=floating·편집→글자수 0→24자·본문 단락 보존·시트 정중앙·콘솔 0·classic=옛 3컬럼. 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2a-swap*`. 캡처 `docs/handoff/screenshots/floating-phase2a/`.
- **Phase 2b 완료·머지 (2026-06-06, main `8bc9d4a`)** — floating 독에 "지표" 버튼 1개 + `fc-p-metrics` 패널 4 접이식 섹션(하니스·품질게이트·매체투사+commercial↔literary 슬라이더·온톨로지), floating-네이티브 `.fc-*`. 이미 계산된 `studioMetrics`(+`updateStoryModeAxis`) 주입(순수 표현). 라이브 — 실데이터(하니스 7/8·95/100·8스테이지, 품질 2/7) 렌더·360 모바일 독 6버튼·패널 뷰포트 내(가로스크롤 0)·콘솔 0. 회차/곡선 리치판은 별도(미정). 스펙·계획 `docs/superpowers/{specs,plans}/2026-06-06-floating-editor-phase2b-metrics-dock*`. 캡처 `docs/handoff/screenshots/floating-phase2b/`.
- **남은 단계 — 2c ✅ · 2d · 2f** — **2c 데이터(캐논/바이블) floating화 완료**(`FloatingDataWorkspace` 신설, 정제 보드 + 독, 브랜치 `feat/floating-phase2c-data`). 2e(옛 3컬럼 제거 + classic 제거)는 직전 완료. 잔여 — 2d 출간 floating화 · 2f topbar dead code 정리. (선택) 회차/곡선 리치판(ChapterStructureTree/TensionShareChart) 이식.

## 병행 트랙 — 쇼케이스 30화: "철거 전야의 이름" (`in_progress` · 2026-06-11 착수, S1/5)

사용자 결정 — "현대에 다시 쓰는 퇴마록 느낌의 30화 장편을 쇼케이스에" + 풀 라이브 루프. **M7 기술 게이트(30화 회귀)·공개 쇼케이스·페이스 체인 실전 운용을 한 작품으로 동시 달성**하는 트랙. 스펙 `docs/superpowers/specs/2026-06-11-showcase-30ch-occult-design.md`, 체크리스트 `docs/superpowers/plans/2026-06-11-showcase-30ch-occult-plan.md`, 로그 `docs/reviews/2026-06-11-showcase-30ch/production-log.md`.
- **S1 (2026-06-11)** — 온보딩(LLM 인터뷰 8문항 전부 작품 맞춤·캐논 4건 정확 시드) + 1화 "철거 전야의 이름"(3,019자·약속 정확 이행) + 2화 "대림장 탈의실의 이름표"(앵커 캐논 계승·"회수 예정" 후크) 각 5인 검토+잠금. canonFacts 7. **★P14 신규 발견** — 전체 검토 더블 트리거 시 pending 영구 잔류 + 기존 런 응답 폐기(StoryXDesk:1013 isReviewing 가드 + useMarginReview seq 가드 합작). P1 빈응답 1/10. 백업 `backups/occult-ch2-locked.json`.
- **완주 (같은 날 6~7차)** — 사용자 "이 세션 완주" 결정 → 3~30화 연속 풀 라이브(차단 0·캐논 122·66,695자). 사건 — dev 서버 사망 3회·codex 한도 1회·폴백 2회·P14 발견→수정(`6d900ac`). 로그 `production-log.md`.
- **★ A/B 비교 + StoryScore v0.1** — 통제군(맨 Claude 동일 기획 30화 『잿우물』 58,106자, `control-claude/`) 집필 + 평가 시스템(`tools/storyscore.mjs`+`story-score` 스킬, `8fdd8d5`) 구축 → 첫 공식 채점 **통제군 91.8 vs 실험군 76.5** (`storyscore-ab-report.md`). 점수차 주범 = 사전 아크 설계 부재·폴백 번호 드리프트·후크 반복. 교란 변수(모델 비대칭·단일 컨텍스트) 명시. **개선 백로그 5건** — 시즌 아크 플래너(1순위)·provider 품질 실험·폴백 번호 버그·후크 다양성·StoryScore v0.2.
- 데모 영상은 자막+BGM 풀 자동 생성으로 결정(별도 세션).

## 현재 활성 — M11 검토 기반 정비 (`in_progress`)

2026-06-01 로컬 구동 점검 + 7에이전트 멀티에이전트 검토 완료. 전체 리포트는 `docs/reviews/2026-06-01-multiagent-review.md`.

**이번 세션 진행 — rank1 · rank2 · rank3 · rank4 + (B) Codex 연결 완료.** 작업 모델 — 로컬 작가진 LLM 을 Codex 로 전환(M12), rank2~4 코딩은 Codex CLI(`codex:codex-rescue`)에 위임하고 Claude 가 검증·머지. rank3·rank4 는 code-reviewer 2차 검증으로 버그를 잡아 Codex 재수정까지 마쳤다.
- **rank1** (small) — 상태 문서 진실 동기화. feature_list A1~A5 done 등재 + active=M11.
- **(B) Codex 로컬 연결 (M12)** — dev 작가진(인터뷰·초안·검토) LLM 을 claude→codex 로. vite.config.ts 5 라우트 + storyx 기본값 codex. dev /api/review-agent codex 실호출 JSON 응답 확인.
- **rank2** (Codex 구현) — 빌딩 단계 LLM 실패 시 빈 에디터 대신 `buildFallbackDraft` 결정론적 폴백 초안 + 실패 배너. 시드 모티프 invent 방지.
- **rank3** (Codex 구현 + code-reviewer + Codex 수정) — 품질 게이트 12개가 하드코딩 리터럴 대신 본문을 실제로 읽음(voiceMatchScore↔koreanVoiceGate 등). 측정 불가 지표 measured:false skip(거짓 통과 차단). storyHarness ready conjunctive 화. **차별점 "연속성을 제품 요건으로" 실재화.**
- **rank4** (Codex 구현 + code-reviewer + Codex 수정) — continuity 충돌 감지를 반의어·생사 대립쌍(OPPOSITION_PATTERNS)·숫자 비교·인물ID(hasSameEntity 가드)로 보강. validateContinuity 가 3계층(hard/living/soft)을 실제로 채우고 growthLedger 루프(appendGrowthEntry·buildContextPack) 연결. code-reviewer 가 거짓양성 CRITICAL(숫자 divergence)+HIGH(presence 동사형·3계층 과분류)를 잡아 Codex 재수정 — 엔티티 가드·공유 목적어 요구·확정 사실 hard 유지. 거짓양성 가드 3 케이스 테스트.
rank 5~7 은 사용자 우선순위 결정 후 개별 착수한다.

**이번 세션(2026-06-04) 추가 — rank5 착수 (Codex 위임 + Claude 검증, 위험도 티어별 단계 추출).** `StoryXDesk.tsx` 6,097→3,772줄(-2,325 · 약 38%).
- **Tier 1 (상수)** — `agentPersonas`·`agentSeedData`·`studioConstants` 3모듈로 추출. 7개 리터럴 byte-identical 검증.
- **Tier 2 Pass A (리프 컴포넌트 8개)** — CanonStatusBadge·PublishingIndexCard·MemoryBankCard·OpenThreadsCard·EvaluatorQualityCard·CanonTimeline·BibleRulesAccordion·AgentPixelPortrait. Codex가 brittle source-string 테스트를 통과시키려 심은 우회 주석(false-green)을 Claude 검증이 적발 → 단언을 정의 파일로 재배치(`componentSrc` 헬퍼 도입).
- **Tier 2 Pass B (Canon/Data 7개 + `canonDataView.ts`)** — CanonNav·DataLeftRail·CharacterGraph·CharacterDetailPanel·CanonCardGrid·CanonCanvas·DataReviewRail. 공용 타입·헬퍼는 `src/lib/canonDataView.ts`로. 테스트 단언 21:21 재배치(삭제·약화 0). Codex 스코프 크리프(상태 문서 임의 수정)는 Claude가 되돌림.
- **Tier 2 Pass C (Bible/Memory 5개) + 헬퍼 de-dup** — ProjectStateCard·BibleWorkbenchHeader·CanonRefactorPanel·BibleAssistantSidebar·MemoryBankStudio. Codex가 getAgentPersona·agentStatusLabel를 복사해 만든 중복을 Claude가 적발 → `lib/agentPersonas.ts` 단일 진실원천으로 통합(드리프트 위험 제거).
- **Tier 2 Pass D (Agent 4개) + 순환의존 제거** — AgentIntentCard·AgentProfileDialog·AgentRoom·WorkStateGrid. Pass B에서 샌 DataLeftRail→StoryXDesk→WorkStateGrid 순환참조(+불필요 re-export)를 Claude가 적발·제거 → StoryXDesk가 다시 `StoryXDesk` 하나만 export(단일 계약 복구).
- 검증 — 매 티어 tsc 0 · 293 tests(올바른 이유로) · build · 편집기·캐논 뷰 렌더·콘솔 0.
- **Pass E (2026-06-06, Claude 직접, `bcca914`)** — Dialogs 3(ProjectHistoryDialog·CommandPalette·VersionLogDialog) + StoryXStatusBar + ChapterStructureTree(+구조 헬퍼블록) + TensionShareChart = **살아있는 6개 추출**. StoryXDesk **3,824→3,317**. 테스트 단언 componentSrc 재배치(삭제·약화 0). **발견 — Status 클러스터 3개(AiCliHarnessCard·VerticalSliceProofPanel·ContinuitySummaryCard)는 죽은 코드(JSX 사용처 0)라 추출 보류 → 삭제 vs 추출 사용자 결정 대기.** PublishingStudio(최대·단독 패스 권장)·Tier3 훅도 잔여.

**추가 핫픽스 (사용자 발견 · 다크 스코프 대비 버그 2건)** — 둘 다 M8.5 의 `.home-page` 다크 전환 시 누락된 잔재다.
1. 매체·포맷 카드 제목이 다크 배경에 묻힘 — `.home-page` 다크 스코프에 `--nx-ink-deep` 오버라이드 누락(12토큰 중 빠짐). `styles.css:8821` 에 `--nx-ink-deep: #f7f7fb` 추가.
2. 상단 nav(`hx-nav`) 의 "Story X" 브랜드·스텝 라벨이 묻힘 — nav 배경이 흰색(`rgba(255,255,255,0.92)`)으로 하드코딩된 채 남아 다크 스코프의 흰 텍스트(`--nx-ink`)와 흰+흰 충돌. `styles.css:8854` 를 `rgba(8,9,10,0.85)` 다크로 교체.
각각 `appExperience.test.ts` 회귀 테스트 추가(블록 단위 검사). TDD RED→GREEN, 271 tests. 같은 유형(다크 스코프 속 흰 배경/색 잔재)은 rank 7 토큰 cascade 전수 점검으로 마무리 예정.

### 검토 7단계 로드맵
| rank | 작업 | 규모 | 상태 |
|---|---|---|---|
| 1 | 상태 문서 진실 동기화 | small | ✅ done |
| 2 | 빌딩 LLM 실패 폴백 초안 + 배너 | medium | ✅ done (Codex) |
| 3 | 품질 게이트 본문 배선 + ready conjunctive | medium | ✅ done (Codex+리뷰+수정) |
| 4 | continuity 충돌 감지 보강 + living/soft 3계층 통합 | large | ✅ done (Codex+리뷰+수정) |
| 5 | StoryXDesk.tsx 훅·컴포넌트 분리 (6,097→3,317, Tier1·2A~E live done) | large | 🔄 진행 중 |
| 6 | 1.0 기준 시장증명 재정의 + 경량 검증 | medium | ✅ done (결정 문서 + feature_list 반영) |
| 7 | 편집기 상단바 압축 + academic 1.0 범위 결정 | medium | ✅ done (상단바=floating 전환으로 해소 · academic=실험 플래그 조건부, 결정 문서) |
| (B) | 로컬 작가진 Codex 연결 (M12) | small | ✅ done |

**rank3·rank4 로 해결** — 품질 게이트가 본문을 실제로 읽고(차별점 실재화), continuity 가 부정어 없는 충돌(생사·숫자)도 잡으며 3계층(hard/living/soft)이 실제로 작동한다. 남은 작업은 rank5~7 (StoryXDesk 분리·시장검증·UI 정돈).

## 병행 트랙 — 10인 매체별 브레드스 (`done` · 2026-06-08 · 5매체 전수)
사용자 "10인 완주" 선택. #2(소설 로판) 완권 깊이 검증 후, 매체별 브레드스로 전환.
- **#3 헌터 회귀물 (소설·다수 캐릭터) — 1화 (2026-06-08)** — 로그 `docs/reviews/2026-06-07-persona-live-test/03-hunter-multichar.md`. **★ P5/P6 수정 다캐릭터 스케일 실증 — 1화에 4인(한지욱·서가을·마도협·백도현) 클린 승격.** 차별점 새 작품/다캐릭터에서도 일관(세계키퍼 비용·캐릭터 4인 동기·연속성 미회수장치). 하니스 7/8·95 첫 화부터. **발견 — 온보딩 첫 회차 build codex transient 폴백("Reading additional input from stdin" 프로즈 누수) → CLI 격리로 transient 확인·재생성 정상. 개선 후보(폴백 raw에러 가드+재시도).** #2는 `backups/02-work-backup-ch23.json` 백업.
- **매체별 경량 스모크 — 만화·에세이·오디오·학술 4종 완료 (2026-06-08)** — 로그 `04-media-breadth-smoke.md`. 각 1단위 codex 실생성, 매체 적합 문체 확인(만화 시각감정·에세이 성찰·학술 초록+가설·오디오 분위기). 인물 추출 전 매체 작동. **★ 매체 특화 = 게이트엔 배선(소설8·학술11·오디오7)·라이브 검토엔 미배선(고정 5인).** **★ 크래시 버그 발견·수정 `3eae1da`** — 매체/포맷 불일치 시 buildCreativeBlueprint throw → 앱 화이트스크린 → 폴백으로 수정(TDD). **5매체(소설 깊이+다캐릭터 + 4매체 스모크) 전수 커버 = 10인 브레드스 완주.**
- **권고(브레드스)** — 매체 특화 작가진 라이브 검토 배선 · 폴백 raw에러 가드(codex transient).

## 병행 트랙 — Codex 검증 데스크 합류 (`done` · 2026-06-11 6차)

사용자가 별도 Codex 오케스트레이션으로 9셀(아마추어 3·프로 4·메타 2) 외부 검증을 수행, Claude 가 합류 절차로 반영. 프롬프트·산출물·합류 기록 전부 `docs/reviews/2026-06-11-codex-validation-desk/` (계약 — 셀 원본 로그 + findings.json + FINAL-REPORT, 합류 판정은 `MERGE-NOTE.md`).
- **P1 표본 재현 판정** — F-007 진성(900px 이하 `.hx-aside` 통째 숨김 → 온보딩 진행 불가) · F-002 재분류(produceEpisode 정상, 실결함=생성 90초간 시각 피드백 0 — 데스크가 12초 대기 후 오판) · F-006 재현 불가(작가실 패널 정상, 자동화 클릭 유실 추정 — 단 검토 진입점 단일 취약성은 실재).
- **수정 3건 (TDD)** — ① FloatingEditor 메인 CTA `mainActionLabel`(상태별: 첫 회차/다음 회차/검토) + isGenerating "생성 중…" 라벨 ② draft 모드 ⌘K → CommandPalette(죽은 spotlight 제거) + `작가진 전체 검토` fallback 명령 ③ 900px 이하 `.hx-aside-card`만 접고 진행 CTA 유지. editorFocusLayout +2 · appExperience +1.
- **데스크 운영 교훈** — 다음 데스크 패킷에 "생성 대기 최소 120초" 조항 필수(F-002 오판 원인). 생성 품질 축은 강함(완결 회수·에세이 사실 보호·오디오/학술 형식) — "바꾸지 말 것" 목록 MERGE-NOTE §5.

## 다음 한 단계 — 품질·비용 로드맵 Phase D (2026-06-12 기준)

**현재 1순위는 위 "품질·비용 로드맵" 트랙** — 착수는 Phase D(폴백 episode 번호 버그부터, TDD 소건). A/B 개선 백로그 5건과 사용자 실독 결함 U1~U5 가 전부 이 로드맵으로 흡수됐다. 아래 1.0 백로그 표는 유지하되, 품질 작업은 로드맵이 정본.

## (이전) 1.0 범위 리프레시 (2026-06-11 마감 기준)

**페이스 통제 체인 완결** — A/B 실증 → deferred-stake fork → 결정론 진도 카드(과회수 4→0~1) → P12 캐논 배지 → P13 폴백 캐논 차단 → 쇼러너 LLM 인터뷰 + 실사용 사이클(ch6, 시드 3축 생성 반영·자동 소거·검토 통과). 리포트 `06-hunter-pace-check.md`. floating 전환(2a~2d)·M6 영속 묶음·매체 영속·매체별 검토(만화 7인 라이브)도 이번 묶음에서 종결.

잔여 백로그 — 1.0 게이트(`docs/decisions/2026-06-10-market-proof-1.0.md`) 기준 재정렬.
| 순위 | 작업 | 성격 | 비고 |
|---|---|---|---|
| 1 | **M7 외부 실증 경량 검증** — ~~C 데모 키트 + A 로그 공개 패키지~~ **A·C 제작 완료(2026-06-11 4차)** → 잔여 = 사용자 액션(A 공개 채널·연락처 기입, C Loom 녹화, B 베타 3~5인 모집) | 1.0 critical path | A `docs/public/` · C `docs/handoff/2026-06-11-demo-video-kit.md`+캡처 8종 |
| 2 | **M7 기술 게이트 — 30화 시리즈 회귀** → **쇼케이스 30화 실작품 완주로 착수**(2026-06-11 5차, S1 1·2화 완료) | 1.0 게이트 | 풀 라이브 루프, 병행 트랙 절 참조 |
| 3 | **갈림길 LLM 정제** — fork 옵션/시드 작품 맞춤화 | 이야기 완성도 | pace-interview 패턴 그대로 재사용 |
| 4 | **rank5 잔여 정리** — PublishingStudio 옛 JSX 제거(floating 전환 완료로 안전)·Status 죽은 코드 3개 처분·Tier3 훅 | 기술부채 | |
| 5 | **검증 데스크 P2/P3 6건** — F-001 인터뷰 대기 안내·F-003 카드 접근성·F-004 잔여(단독 원고 행동 구분)·F-005 만화 컷 수 hard constraint·F-008 literary 축 온보딩 노출·F-010 매체별 원클릭 검토 | UX/품질 | `docs/reviews/2026-06-11-codex-validation-desk/MERGE-NOTE.md` §4 |
| 6 | **academic 라이브 검토 배선** | 1.0 실험 플래그 전제 | 미완 시 1.1 자동 이연(결정 문서) — 핵심 루프 밖이라 후순위 |
| 6 | 결정 부채 보드(별도 스펙) · (push) origin | 낮음 | push 는 사용자 요청 시 |

## Dive X 2차 — 장면 연출 + 쇼러너 채널 (`done` · 2026-06-27 · feat/dive-x-scene-showrunner, 미머지)

1차 프로토타입 dogfooding에서 사용자 요청·발명으로 수립. 정본 — 스펙 `docs/superpowers/specs/2026-06-27-dive-x-scene-showrunner-design.md`, 계획 `docs/superpowers/plans/2026-06-27-dive-x-scene-showrunner.md`. 1:1 관계챗 → "사용자가 주인공으로 장면을 연출하고 AI 쇼러너가 세계·등장인물을 운영하는 인터랙티브 스토리"로 확장 — 딥리서치가 짚은 white space(user-as-protagonist 장면 연출) 직격.
- **결정** — ① 응답 주체=AI 쇼러너(장면 서술+그 자리 인물 연기, 도윤 없는 장면도 가능) ② 상단 '현재 장면' 패널(편집·공유 상태) ③ 출력=서술 평문 블록·`이름: 대사` 화자 말풍선·`*별표*` 행동 ④ 멀티 캐릭터는 응결 시 기존 엔진이 캐논 승격 ⑤ 쇼러너 채널(이번 가볍게)=연출자 지시→응답+현재 장면 교체(승인형), 포인트 과금은 이음새만(실결제 비목표).
- **구현 (서브에이전트 주도 TDD, 7태스크·2단 검토 + 최종 홀리스틱 APPROVE)** — `diveSession` scene 필드+`parseSceneSegments`(서술/화자 파서) · DiveState scene 영속 핀 · `storyx.mjs` dive-chat 쇼러너화·dive-condense 장면·**dive-showrunner 신규** · vite `/api/dive-showrunner`+`--scene` · `diveClient.requestDiveShowrunner` · `DiveDesk` 현재 장면 패널·세그먼트 렌더·쇼러너 시트 · `.dx-scene/.dx-narration/.dx-speaker/.dx-showrunner` 스타일. App 무변경(scene이 세션에 실려 자동 영속). 승인형(sceneUpdate 자동교체 금지)·내레이션 키 안전성·async busy 모두 리뷰 통과.
- **검증** — init.sh tsc·vitest 674·build 녹색. **라이브(preview, 실 codex)** — 현재 장면 패널·쇼러너 시트 렌더 · `/api/dive-showrunner` 왕복(연출 응답 + 비 내리는 으스스한 장면 전체 재작성 sceneUpdate) · 장면 인지 채팅(도윤 학원 부재 장면 → 도윤 등장 없이 세계 서술: 초인종·인터폰 불빛·숨죽인 기척) · 세그먼트 렌더(기존 메시지 가운데 내레이션 블록) · 콘솔 0. 최종 리뷰 수정 2건(srBusy 상태바·클라 테스트 scene) 반영.
- **다음** — 사용자 dogfooding 품질 판정. 머지 결정. 후속(비목표) — 쇼러너의 인물/캐논 직접 변경·실결제·장면 프리셋·분기 선택지.

## 신규 트랙 — Dive X 가벼운 로컬 프로토타입 (`done` · 2026-06-27 · feat/dive-x-prototype, 미머지+main 머지)

제타(Zeta)류 AI 캐릭터 챗 딥리서치 + 외부 3종 리서치(GPT-5·Claude·Gemini) 삼각측량 → 브레인스토밍 합의로 수립. 정본 — 스펙 `docs/superpowers/specs/2026-06-27-dive-x-light-prototype-design.md`, 계획 `docs/superpowers/plans/2026-06-27-dive-x-light-prototype.md`.
- **결정** — ① Story X와 별도 제품 + 공유 엔진 + 단방향 다리(검증 단계는 in-repo `/dive` surface) ② 관계/몰입 우선, 작품화=관계 영속·기억 장치 ③ 자동 연대기 루프 + 하이브리드 응결 트리거 ④ 승인형 캐논(자동 박제 금지) ⑤ 검증 먼저 — 외부 모집·A/B 없이 사용자 본인 dogfooding으로 품질 만족까지. **차별점은 비용이 아니라 일관성·영속(리서치 교정).** white space는 좁음(제타가 프레임 점유·바이어스/크랙이 인접 구현, 단 장편 연속성+오리지널+폐루프 교집합은 미점유).
- **구현 (서브에이전트 주도 TDD, 7그룹·전부 2단 검토)** — `diveSession.ts`(순수: 버퍼·응결분기·압축·포매터) · `diveSeedCharacters.ts`(도윤·하란·세하 3종) · `storage.ts` DiveState 영속(키 `serial-story-studio/dive`) · `storyx.mjs` dive-chat(경량 모델)·dive-condense(고급 모델) + vite 브리지 2라우트 · `diveClient.ts` · `DiveDesk.tsx`(채팅·응결·승인·연대기) · `App.tsx` `?stage=dive` 배선 + `.dx-*` 다크 스타일. **연대기=SeriesProject 재사용** — 응결 회차는 `chapterFromDraftPayload`(내부 commitChapter)로 캐논 승격, 다음 대화는 `buildProjectContextDigest` 주입으로 회수. 회차 품질 바닥은 `inspectLeak` 게이트.
- **검증** — init.sh tsc·vitest 665·build 녹색. **라이브(preview, 실 codex)** — `?stage=dive` 도윤 카드·다크 렌더·콘솔 0 · `/api/dive-chat` 왕복 성공(도윤 말투 그대로 "나야 뭐, 그냥 지내. 너는 왜 이제 와…"). dive-condense는 codex 고급 생성이 30s eval 한도 초과(mock 형상은 검증·동일 브리지 경로라 dogfooding서 눈으로). 자동화 클릭이 React onClick 미발화라 UI 한 바퀴는 네트워크 직접 호출로 갈음.
- **최종 홀리스틱 리뷰 반영(`785091f`)** — 승인 중 입력 잠금(메시지 유실 방지)·응결 실패 배너·빈 응결 가드·세션 projectId 정합.
- **다음** — 사용자 dogfooding으로 응결 회차 품질 만족까지 반복(막히면 Story X 품질 로드맵 Phase B/헌장 정보비대칭으로 분기). 머지 결정 대기. 후속(검증 통과 후) — 캐릭터 생성 UI·공개 연재·Story X 졸업 다리·B2C vs B2B 포크·법적 아키텍처.

## 최근 검증 (2026-06-23 · B4 자동 버전 히스토리 · feat/auto-version-history)

```
딥리서치 P3     → 명시적 저장 아닌 시간순 자동 스냅샷, 본문·캐논·바이블 되돌리기. §5 공백=영향범위 표시. ★현황 발견 — 인프라 대부분 존재(ProjectSnapshot 전체 project+메타·pushProjectSnapshot·ProjectHistoryDialog·restoreProjectVersion). brainstorming — ① 프롬프트 제외(작가 편집 기능 없음) ② 트리거 확대=회차 확정·헌장 개정 ③ 영향범위=인라인 표시+rollback confirm. spec/plan 정본.
구현(TDD 3 task) — snapshotImpact.ts(describeSnapshotImpact: 회차·캐논·회차번호 delta + isRollback, 순수) · confirmChapterLock·amendCharter 에 pushProjectSnapshot(굵직한 마일스톤) · ProjectHistoryDialog describeSnapshotImpact 인라인("회차 N→M·캐논 N→M")+isRollback 코랄+복원 전 confirm(교체 안내)+current prop.
init.sh         → tsc 0 · vitest 648 · build 통과 (639→648).
검증           → snapshotImpact.test +4 · editorFocusLayout +2(트리거 핀) · version.test +3(소스 핀) · projectHistoryDialog.test +3(react-dom 렌더: 영향범위 "회차 3→1·캐논 5→2"·rollback 코랄·confirm 취소 시 onRestore 미호출·동일 confirm 없이 복원). ★라이브 갈음 — preview CommandPalette 명령 클릭이 React onClick 미발화(자동화 한계)라 다이얼로그 못 엶 → react-dom 렌더 테스트가 동등 검증.
남음            → 머지/푸시 사용자 결정 대기. B 트랙(B1~B4) 전부 완주.
```

## 최근 검증 (2026-06-22 · B3 캐논 인라인 멘션 + AI주입 토글 · feat/canon-inline-mention)

```
딥리서치 P4     → 본문에 추적 이름 나오면 밑줄+카드 + 엔트리 'Always Include' 토글로 LLM 주입 작가 통제. 캐논을 'AI 입력 통제판'으로. brainstorming — ① 둘 다(A 멘션+B 토글) ② A 표시=본문 하단 칩 바(contentEditable 충돌 회피) ③ B 의미=always-include opt-in(digest 절단 면제) ④ A·B 대상=canonFacts 통일. spec/plan 정본.
구현(TDD 5 task) — canonMentions.ts(detectCanonMentions, extractEntityName 재사용·인물 이름 중심·등장순 정렬) · CanonFact.alwaysInclude + normalizeProject 백필 · buildProjectContextDigest 절단 면제(alwaysInclude 우선 포함) · FloatingEditor .ep-mention-bar 칩 바 + popover(statement+토글) · StoryXDesk canonMentionViews useMemo(editorText·canonFacts) + handleToggleCanonInclude.
init.sh         → tsc 0 · vitest 639 · build 통과 (626→639).
라이브(preview) → createSeedProject + 회차1(prose 인물명) + canonFacts2(/src ESM)→?stage=editor → ★칩 바 "등장 캐논 한지욱·서가을"·칩 클릭→popover(statement "한지욱은 각성자다."+토글)·★토글 클릭→alwaysInclude false→true 영속·📌 표시·콘솔 0. 스크린샷.
남음            → 머지/푸시 사용자 결정 대기. B4 자동 버전 히스토리(최대, 신선한 세션 권장).
```

## 최근 검증 (2026-06-22 · B2 target/habit 이원 리텐션 · feat/dual-retention)

```
딥리서치 P5     → target(누적 진도) ≠ habit(규칙적 집필 streak). 합치면 둘 다 약해진다. Story X 는 화수 예산(target류, buildContractStatus)만 있고 habit/streak 완전 gap(리텐션 65%, 4영역 최약). brainstorming — ① streak=활동일 ② 추적 중심(목표 설정·경쟁 배제, refuted 리더보드) ③ 상시 배지 + 패널 상세. spec docs/superpowers/specs/2026-06-22-dual-retention-design.md · plan .../plans/2026-06-22-dual-retention.md.
구현(TDD 6 task) — retentionStats.ts(recordWritingDay·computeRetentionStats·isValidDayStr·normalizeWritingLog, today/dateStr 주입 순수·UTC epoch-day) · SeriesProject.writingLog?(type-only import) + normalizeProject 백필 · StoryXDesk todayStr/withWritingDay + 편집(자동저장 effect)·생성(applyProductionResult)·확정(confirmChapterLock) 3지점 활동기록 · FloatingEditor .ep-streak 배지(헤더 상시) + .fc-metric-retention 패널 섹션 · floatingEditorProps retention 주입.
  끊김 규칙 — 마지막 활동일이 today 또는 어제면 currentStreak 유효, 그 이전이면 0. longestStreak 는 전체 최장. thisWeekDays 는 최근 7일 rolling. target 은 buildContractStatus 대신 plannedEpisodes 직접(헌장 없으면 null).
TDD — retentionStats.test +11 · storage.test +2(writingLog 백필) · editorFocusLayout +2(헬퍼·3지점·props 핀) · floatingEditor.test +3(배지 2·패널 1). P2 confirmChapterLock 윈도우 700→1000 보정(B1+B2 로 블록 확장, 가드 의도 보존).
init.sh         → tsc 0 · vitest 626 · build 통과 (607→626).
라이브(preview) → createSeedProject + 회차1 + writingLog(/src ESM)→?stage=editor → ★배지 "🔥 3일 연속"(연속3)·끊김 규칙(오늘 빼면 "2일 연속 (오늘 이어가기)")·지표 패널 .fc-metric-retention(진도 ?화 중 1화·최장3·이번주3/7)·★활동기록 effect(본문 편집→오늘 자동 append→streak 2→3)·콘솔 0. 스크린샷.
남음            → 머지/푸시 사용자 결정 대기. B3 캐논 인라인 멘션·B4 자동 버전(백로그).
```

## 최근 검증 (2026-06-21 · B1 AI 누수 방지 게이트 · feat/ai-leak-gate)

```
딥리서치        → /deep-research 로 스토리텔링 서비스 제품·UX 벤치마킹(111 에이전트·28소스·18확정·7기각). 정본 docs/research/2026-06-21-storytelling-service-ux-benchmark.md. 4 착수후보(B1 누수게이트·B2 target/habit 리텐션·B3 캐논 인라인 멘션·B4 자동 버전) feature_list 등재. 사용자 "AI 누수방지부터".
B1 게이트       → 벤치마킹 P7 — 한국 텍스트 웹소설은 AI 탐지 거의 불가라 '누수 사고'(프롬프트/AI 상투구 노출)가 사실상 유일한 별점테러·연재중단 트리거. 회차 확정 전 프롬프트 누수 차단 + 상투구 경고.
  brainstorming → ① 프롬프트누수=차단(blocking)·상투구=경고(advisory) ② MVP(확정차단+품질리포트). spec docs/superpowers/specs/2026-06-21-ai-leak-gate-design.md · plan .../plans/2026-06-21-ai-leak-gate.md.
  구현(TDD) — leakGate.ts(detectPromptLeak 4범주 llm-meta·english-ai·role-marker·markdown-residue + inspectLeak, 상투구는 koreanVoiceGate 재사용·오탐 가드) · qualityGates gate_prompt_leak(common/blocking, promptLeakCount 없으면 text 파생) · StoryXDesk confirmChapterLock 진입 inspectLeak→blocked면 setLeakBlock+잠금중단 · FloatingEditor .ep-leak-banner(canvas 상단·header absolute 겹침 회피 margin-top 72).
  TDD — leakGate.test +9(4범주 양성+오탐 가드+blocked+빈)·qualityGates.test +3·floatingEditor.test +3.
init.sh         → tsc 0 · vitest 607 · build 통과 (592→607, +15).
라이브(preview) → 누수 본문("물론입니다, 다음 장면을 작성하겠습니다") 회차 주입(createSeedProject+chapter, /src ESM)→?stage=editor→확정 클릭 → .ep-leak-banner(잔여 2건·"물론입니다"/"작성하겠습니다" LLM-META 인용)·잠금 차단(미잠금 유지)·배너 header 안 겹침(top72>bottom60)·콘솔 0. 스크린샷.
남음            → B2 리텐션·B3 캐논 인라인·B4 자동 버전(백로그). 머지/푸시 사용자 결정 대기. (오탐 패턴은 라이브 누적 후 조정 — spec 명시.)
```

## 최근 검증 (2026-06-19 · 다음 회차 CTA 모호 수정 · feat/persist-onboarding)

```
다음 회차 CTA   → dogfooding 발견(핸드오프 5차 백로그). 1화 생성 후 편집 모드 메인 CTA 는 "흐름 검증"에서 멈추고, 다음 회차 전제인 회차 확정(잠금) 버튼이 출간 준비 화면(FloatingPublishWorkspace)에만 있어 편집 모드에서 다음 회차 동선이 막힘.
  brainstorming → 사용자 선택 "편집 모드에 확정→다음 노출". 잠금(연속성 확정) 의도 유지, 검토는 권고 유지(강제 X).
  구현 — FloatingEditor 헤더 메인 CTA 옆에 "이 회차 확정" 버튼(canConfirmLock=미잠금 최신 회차일 때만). 클릭 → 기존 confirmChapterLock(setLatestChapter 동기화, P2) → isLatestLocked → 메인 CTA 가 "다음 회차 만들기"로 자동 전환(기존 상태머신 재사용).
  배선 — StoryXDesk floatingEditorProps canConfirmLock·onConfirmLock(confirmChapterLock(latestChapter.id))·lockLabel(actionLabels.lock). styles.css .btn-confirm-lock(accent outline, 메인 CTA fill 과 출간 outline 사이 위계).
  TDD — floatingEditor.test +2(canConfirmLock 시 버튼 렌더+클릭→onConfirmLock·미렌더)·editorFocusLayout +1(배선+렌더 핀).
init.sh         → tsc 0 · vitest 592 · build 통과 (589→592).
라이브(preview) → 작품 주입(createSeedProject + 미잠금 1화, /src ESM 동적 import)→편집 모드:
  "출간 확정" 버튼 렌더(accent outline·자물쇠)·메인 CTA "흐름 검증" → 확정 클릭 → latestLocked true·확정 버튼 사라짐·메인 CTA "다음 회차 만들기" 전환. 콘솔 0. 스크린샷.
```

## 최근 검증 (2026-06-18 · 영속 보강 Part 2 — 온보딩 자동 복원 · feat/persist-onboarding)

```
영속 Part 2      → 핸드오프 5차 "다음 한 가지". 온보딩 중간 입력은 작품 생성 전이라 SeriesProject 가 없어 새로고침/서버사망 시 전부 소실. brainstorming 기정(자동 복원)대로 TDD.
  설계 — OnboardingDraft 16필드(매체/형식 2 + 사용자입력 11 + LLM캐시 3) 를 독립 키 'serial-story-studio/onboarding' 에 저장. Part 1 은 project 필드였지만 작품 생성 전 단계라 독립 키.
  순수함수(storage.ts) — serializeOnboardingDraft·parseOnboardingDraft(손상/구버전 null·누락 백필·normalizeProject 패턴)·save/load/clear·hasMeaningfulOnboardingInput(빈입력 가드).
  HomeFlowStep 을 App.tsx→projectBlueprint.ts 이동(storage 공유·순환 회피). appExperience:54 핀 import 형태로 완화.
  배선 — App: restoredOnboarding 으로 stage(home 자동복원·URL param 우선)·medium·format 복원 + 졸업(onOpenEditor) clearOnboardingDraft. StoryXHome: 14 state lazy init + debounce(600ms) save effect(빈입력이면 clear).
  TDD — storage.test +5(라운드트립·무효 null·부분 백필·빈입력 가드 2)·appExperience +1(소스 핀).
init.sh          → tsc 0 · vitest 589 · build 통과 (583→589).
라이브(preview)   → ★ 결정적이라 풀 라이브 확인(Part 1 은 비결정적이라 갈음했음).
  복원 — charter draft 주입→reload→stage home 자동복원(isHome)·track translateX(-960=charter 패널)·freewrite/결말/대가/4줄척추/화수30 전부 복원.
  저장 — charter 결말 textarea UI 변경→750ms→localStorage contractEnding 갱신(다른 필드 보존).
  빈입력 가드 — clear+빈 home 진입→800ms→onboarding key null(저장 안 함, 신규 사용자 랜딩 보존).
  콘솔 에러 0(fresh load). charter 복원 화면 스크린샷.
남음             → 졸업(작품 생성) clear 라이브는 LLM 호출 무거워 단일 경로(onOpenEditor)+소스핀으로 갈음. 머지/푸시 사용자 결정 대기.
```

## 최근 검증 (2026-06-15 5차 · 영속 보강 Part 1 — 의도 메모 · feat/persist-state)

```
영속 Part 1      → dogfooding 발견 — VS/fork 선택 의도 메모(draftPrompt)가 SeriesProject 필드가 아니라 StoryXDesk state 라, 회차 생성 전 새로고침/서버사망 시 ''로 초기화(VS 파격 선택 등 소실).
  Explore 영속 전수 매핑 — saveProject/loadProject(storage.ts)는 project 통째 직렬화 + normalizeProject 백필. 이 패턴 재사용.
  수정 — SeriesProject.nextEpisodeIntent?: string + normalizeProject 백필(formIntent 패턴). StoryXDesk: draftPrompt 초기값 project.nextEpisodeIntent 복원 + debounce(600ms) effect 로 모든 변경(타이핑·VS·fork·소거) 영속.
  TDD — normalizeProject export 후 순수 검증(vitest jsdom 의 localStorage.setItem 미작동 → loadProject 라운드트립 대신 normalizeProject 직접). storage.test +1(백필 + 보존).
init.sh          → tsc 0 · vitest 583 · build 통과.
Part 2 남음      → 온보딩 중간 입력(11 state·intakeAnswers Map 직렬화)·stage/step 복원·클리어 엣지 = App.tsx 대수술. 다음 세션 신선하게(사용자 결정 — Part 1 매듭).
라이브 갈음      → 영속은 새로고침+codex 회차 맥락 필요라 비결정적 → normalizeProject 순수 테스트 + StoryXDesk debounce effect 소스로 검증. 다음 안정 세션 라이브 눈 확인 권고(회차작품 의도 메모 입력→새로고침→복원).
```

## 최근 검증 (2026-06-15 4차 · 제목 ". " 누수 수정 · fix/title-prefix-leak)

```
제목 누수 수정    → dogfooding 발견 — 1화 생성 시 작품 제목이 ". 빗길의 이름"(앞 ". " 누수). 원인 추적 — createEmptyProject(StoryXDesk:1671)가 deriveProjectTitle(storyEngine:1107)로 회차 접두 제거하는데, 정규식 구분자 클래스 [—\-:·] 에 마침표 누락. codex 가 "1화. 제목" 형식으로 title 을 내면 "1화"만 떨어지고 ". 제목" 잔존.
  수정 — 정규식 [—\-:·]? → [—\-:.·]?(마침표 추가). TDD storyEngine.test +1(1화./3화. 마침표 케이스 + em대시·콜론 회귀 가드).
init.sh          → tsc 0 · vitest 581 · build 통과.
라이브 갈음      → 제목 누수는 codex 가 "1화." 형식 낼 때만 발생하는 비결정적 산출물이라 라이브 재현 불안정 → deriveProjectTitle 을 결정론적으로 직접 검증하는 단위테스트로 갈음.
남은 백로그       → 온보딩/의도 메모 영속 X(가장 아픔, 큰 작업·brainstorming)·다음 회차 CTA 모호·format 축 vs lengthClass 축 깊은 정합.
```

## 최근 검증 (2026-06-15 3차 · 온보딩 분량 2체계 정합 · fix/onboarding-medium-format)

```
분량 2체계 수정   → dogfooding 발견 #1 — 온보딩 매체 단계 포맷 카드는 3등급(장편/중편/단편·단편 1-5화)인데 헌장 단계·ContractLengthClass·화수 로직은 이미 2등급(단편 4~8/장편 24~36, '중편 없음' 2026-06-12 결정 반영). 매체 단계만 옛 3등급 잔존 → 노출 불일치.
  Explore 전수 매핑 — 원인은 formatOptions(projectBlueprint.ts:150)·serialFormats 만 medium-novel 잔존, 타입/화수/도메인 로직은 정합. 수정 = 매체 단계 포맷 카드에서 중편 제거 + 단편 cadence '1-5화'→'4~8화'. serialFormats·blueprintByFormat·CreativeFormat 타입은 구버전 저장본 호환 위해 유지(폴백 안전, 정당화 주석).
  TDD — projectBlueprint.test 2등급 단언(RED 1 실패→GREEN). 변경 최소(formatOptions 만, 도메인 로직 무수정).
init.sh          → tsc 0 · vitest 580 · build 통과(무회귀).
라이브(preview)   → 매체 단계 소설 포맷 = 장편 + 단편(4~8화) 2등급. 중편/6-20화/3막 어디에도 없음(has48 true·has15 false·hasMid false). 헌장 단계와 정합.
남은 백로그       → format 축(long/short-novel)과 lengthClass 축(short/long)이 둘 다 '분량'인 더 깊은 정합 이슈(예: short-novel isSerial=false → charter 미진입 가능성)는 별도. 온보딩/의도 메모 영속 X·제목 ". " 누수·다음 회차 CTA 모호도 백로그.
```

## 최근 검증 (2026-06-15 2차 · VS 노출 자동열림 + dogfooding 1라운드 · fix/vs-panel-autoreveal)

```
dogfooding       → C-1 VS를 실전 검증. 내 아이디어(심야 라디오 사연 PD·10년 전 뺑소니, 결말=자백 고정 장편)로 온보딩→인터뷰→헌장→1화→VS 풀 라이브(preview).
  ★ VS 본진 5/5 — [전개 후보 받기]→codex→후보 4개(흔함1·의외2·파격1, C-1 e2e 분포 동일)·배지 회색/라임/코랄·결말 불가침 경로만 흔듦·파격 클릭→의도 메모 합류("이번 화의 전개: …").
  ★ 부수 차별점 라이브 실증 — codex 맞춤 인터뷰(freewrite "청취자 사연"을 옵션까지 반영)·갈림길+continuity(1화 본문의 "17번 청취자·차 안 동승자" 미스터리를 미회수 위험으로 포착)·결말 역산 헌장.
VS 노출 수정     → ★ 발견 — VS·갈림길이 기본 닫힌 fc-p-state 패널에 숨어 발견성 낮음(openPanel 초기 null). 해결 — FloatingEditor 자동열림 useEffect: chapters 수 증가(새 회차) + 결정거리(episodeForks/paceQuestions) 있으면 state 패널 1회 자동 열림(assignAll 선례). 닫으면 재발 X(증가 엣지)·과거 회차 전환(수 불변) X. 1화 직후(첫 마운트)는 YAGNI 보류.
  TDD — brainstorming→설계 승인→RED(1 실패)→GREEN. floatingEditor.test +3(react-dom 실DOM: 열림/안 열림/전환).
init.sh          → tsc 0 · vitest 580(floatingEditor +3) · build 통과 (577→580).
라이브 갈음      → VS UI 자체는 이번 세션 스크린샷 2장으로 라이브 검증(후보·배지·의도합류). 자동 "열림" trigger 라이브(2화 생성)는 dev 서버 2회 사망 + preview localStorage 세션 격리(작품 소실)로 갈음 — react-dom 실DOM 테스트가 동등 증거(#3 선례).
dogfooding 발견 백로그 →
  · (제품) 분량 2체계 공존 — 매체 단계 포맷 3등급(장편/중편/단편) vs 헌장 단계 2등급(단편/장편). "중편 없음" 결정과 매체 단계 충돌.
  · (제품) 온보딩 중간(헌장 확정 전)·VS 의도 메모가 project 에 영속 X → 새로고침/서버사망 시 입력·선택 소실.
  · (제품) 1화 제목 ". 빗길의 이름" 앞 ". " 누수(파싱).
  · (제품) 1화 생성 후 "다음 회차 생성" CTA 즉시 안 보임(잠금 선행 경로 모호).
  · (환경, 제품 무관) dev 서버 간헐 사망(idle 중 포함)·preview localStorage 세션 격리·navigate 갭(data: placeholder)·preview_fill React onChange 미발화(native setter 우회).
다음            → 위 백로그(분량 2체계·영속·제목 누수 우선)·소비/소거 라이브(2화 생성)·Phase C-2/C-3·B 날것 문체·A-6 장편 기억.
```

## 최근 검증 (2026-06-15 · Phase C-1 VS 회차 후보 · feat/vs-episode-candidates · 서브에이전트 구동)

```
init.sh            → tsc 0 · vitest 577(episodeBriefing +12·promptBuilders +2·vsCandidatesClient +2·floatingEditor +3·editorFocusLayout +1) · build 통과 (557→577)
VS 회차 후보(C-1)  → 갈림길 카드에 [전개 후보 받기] 버튼 → LLM이 "이번 화 전개 방향 4개+확률" verbalize(VS) → 흔함/의외/파격 라벨 → 클릭 시 기존 intent 배관(buildVsIntentSeed→composeIntentWithFork) 합류 → buildDraftPrompt 소비 → stripConsumedSeeds 소거. 결말 헌장 불가침(경로만 흔듦).
  spine-suggest 인프라 6지점 복제(빌더↔storyx 미러·CLI vs-candidates·api·vite 브리지·클라이언트) + episodeBriefing 순수함수(classifyRarity 0.4/0.15·buildVsIntentSeed·normalizeVsCandidates(overlapsCanonFact 재사용·clamp/기본0.3·4 cap)·SEED_PATTERN_VS) + FloatingEditor .fc-vs 블록 + StoryXDesk 배선(blueprint.medium/format·미회수약속 dedup·finally).
  설계 풀 사이클 — brainstorming→spec→plan(완전한 코드 10 task)→서브에이전트 구동(배치별 implementer+검증). spec docs/superpowers/specs/2026-06-15-vs-episode-candidates-design.md · plan .../plans/2026-06-15-vs-episode-candidates.md.
codex e2e         → ★ CLI 실호출(node tools/storyx.mjs vs-candidates --provider codex): status complete · 후보 4개 · 확률 0.42→0.27→0.19→0.12 꼬리분포 정확(흔함1·의외2·파격1) · 각 후보 인물 선택+대가 한 문장 · 결말 수렴 경로만 의외 · 미회수 약속 반영. VS 핵심 가치(의외도 분포) 실증.
final review      → end-to-end 필드 일관성 전 계층(client→브리지/CLI→prompt→normalize→UI) confirmed · 미러 byte-identical · Minor 2(finally·약속 dedup) 반영 커밋.
라이브 UI 갈음     → preview 눈 확인은 floatingEditor.test +3(버튼·라벨 렌더·미주입 미렌더) + styles.css .fc-vs* 소스핀 + 기존 .fc-* 토큰 재사용으로 갈음(#3·#10 선례). 다음 안정 세션 회차 작품으로 .fc-vs 다크 렌더·배지 색·클릭 합류 눈 확인 권고.
남은         → Phase C-2(수락 시 storyContract.amendments 기록+비트 갱신)·C-3(fork 과격 선택 의무). A 묶음 나머지 — B 날것 문체(Sudowrite Muse Style Examples 이식)·후반 긴장 게이트·정보 비대칭·A-6 장편 기억(NovelCrafter Codex 차용).
```

## 최근 검증 (2026-06-14 10차 · #10 매체/형식 변경 confirm · main · ultracode)

```
init.sh            → tsc 0 · vitest 557(editorFocusLayout +2) · build 통과 (555→557)
#10 매체/형식 confirm → 베타 검토대기 #10(매체/형식 변경이 경고·confirm·영향분석 없이 즉시 전환 — 작가진·헌장 무음 전환).
  selectMedium 에 confirm 가드(기존 회차/헌장 + 매체 실제 변경 시 영향 안내·취소 시 중단).
  selectFormat 신설 — 형식 button 이 setFormat 만 하고 project 미영속(리로드 휘발 버그)을 confirm + project 영속으로 수정.
검증             → editorFocusLayout +2 소스 핀(selectMedium·selectFormat confirm·onClick 배선).
  ★ 라이브 갈음 — 미디어 패널 경로(⌘K→palette→패널→옵션 클릭) 자동화 복잡 + #3 류 네비 타이밍 위험. window.confirm 표준 동작 + 소스 핀으로 갈음.
남은         → 검토대기 #17(보드 편집) + 매체차별 #8(학술 마진검토 dead)·#9(매체 작업면). 리포트 §3.
```

## 최근 검증 (2026-06-14 9차 · #5 잠긴 회차 보호 · main · ultracode)

```
init.sh            → tsc 0 · vitest 555(storyEngine +1·floatingEditor +4) · build 통과 (550→555)
#5 잠긴 회차 보호   → 베타 검토대기 #5(잠긴 회차도 editable=true 무음 편집·저장 안 됨 데이터 손실 + unlockChapter 미배선).
  commitChapterProse 잠금 가드(잠긴 회차 prose 무변경, 도메인 안전) + floatingEditorProps editable:!isLatestLocked +
  FloatingEditor contentEditable={editable && !isLocked} + isLocked·onUnlock(🔒 배너 + 잠금 해제 버튼) +
  StoryXDesk handleUnlockChapter(confirmChapterLock 역동작: unlockChapter+saveProject+setLatestChapter).
검증             → storyEngine.test +1(잠긴 회차 commit no-op)·floatingEditor.test +4(react-dom 실렌더: 읽기전용·배너·onUnlock·미잠금 미렌더·desk 핀).
  라이브(preview) — 회차 잠금 patch: 둘째 회차 🔒 배너·contentEditable=false·해제 버튼 →
  해제 클릭 → 편집 재개(true)·배너 제거·localStorage locked=false 영속. fresh load·인터랙션 런타임 에러 0(센티넬).
  ★ 콘솔 "error in StoryXDesk" 8건은 순차 Edit HMR 중간 상태(onUnlock→handleUnlockChapter 정의 전) 아티팩트 —
  fresh reload 후 화면 정상·에러 불변·센티넬 0·tsc/build 정합으로 확정. DoD "콘솔 0"은 fresh load 기준.
남은         → 검토대기 #10(매체 변경 confirm)·#17(보드 편집) + 매체차별 #8·#9. 리포트 §3.
```

## 최근 검증 (2026-06-14 8차 · #4 FloatingEditor 회차 선택기 · main · ultracode)

```
init.sh            → tsc 0 · vitest 550(floatingEditor +5) · build 통과 (545→550)
#4 회차 선택기     → 베타 검토대기 #4(floating 편집기에 회차 선택기 부재 + 단편 isSerial 게이트 차단 → 과거 회차 편집 동선 0).
  floating 모드(isDraftMode)는 FloatingEditor 만 렌더 — breadcrumb picker(classic 전용)는 안 보임(확인).
  FloatingEditor 헤더에 회차 드롭다운(episode화·title·잠김)+이전/다음+위치(N/M), 게이트 chapters.length>1(isSerial 무관·단편 포함).
  StoryXDesk floatingEditorProps 에 chapters·currentChapterId·onSelectChapter — onSelectChapter=setLatestChapter(기존 flush 경로 재사용, 새 로직 0).
검증             → floatingEditor.test +5(react-dom 실렌더: picker·select onSelectChapter·prev/next disabled·1개 미렌더·desk 핀).
  ★ 회귀 1건 자가적발·수정 — editorFocusLayout F-002·A-2 핀(floatingEditorProps 2000자 윈도우)이 깨짐 →
  회차 props 를 객체 앞→뒤(productionBlockedReason 다음)로 이동해 해결(다른 테스트 불변).
  라이브(preview) — 샘플 작품 회차 2개: floating 헤더 picker 렌더(옵션 "1화·첫 회차"/"2화·둘째 회차"·다크 --bg-2) →
  select ch1 전환 → 본문 "한서윤은 거리를 걸었다."(ch1 prose 로드)·제목 "첫 회차"·위치 1/2·이전 비활성. 전환+prose 시드 경로 정상.
  (※ HMR 미반영으로 처음 picker 미렌더 → reload 후 정상. dev 서버 HMR 주의.)
남은         → 검토대기 #5(잠긴 회차 보호)·#10(매체 변경 confirm)·#17(보드 편집) + 매체차별 #8·#9. 리포트 §3.
```

## 최근 검증 (2026-06-14 7차 · #3 영향 회차 인라인 · main · ultracode)

```
init.sh            → tsc 0 · vitest 545(editorFocusLayout +2) · build 통과 (543→545)
#3 영향 회차 인라인 → 베타 검토대기 #3(설정 변경 영향 회차가 편집 지점에 안 뜸 — CanonRefactorPanel 이 canon 섹션에만,
  CanonCanvas 편집 입력 지점엔 부재. 랜딩 "영향 범위 먼저 펼쳐 보여줌" 약속 위반).
  청사진 maps[1] 대로 순수 로직 변경 0 — 기존 buildCanonRefactorPlan(project, canonChanges) 결과를 편집 지점에 표시만.
  CanonCanvas 에 canonRefactorPlan(required) prop + characters aside 에 affectedChapters 인라인 미리보기
  ("이 변경이 영향 주는 회차 N개", EP·title·reason, slice 5). StoryXDesk 2 호출처 배선. .ex-canon-impact 다크 토큰.
검증             → editorFocusLayout +2 소스핀(CanonCanvas affectedChapters·desk 전달)·tsc(canonRefactorPlan required 로 배선 강제)·build.
  배선 경로 코드 확인 — canonRefactorPlan = useMemo(buildCanonRefactorPlan(project, canonChanges), [canonChanges, project])(StoryXDesk:908)
  → CanonCanvas. 인물 편집 → logCanonChange → canonChanges → plan.affectedChapters → 미리보기.
★ 라이브 갈음     → preview 환경 불안정(resume 후 서버 종료·포트 5174→5173 드리프트·브라우저 컨텍스트 격리)으로 자동화 검증 불가.
  #3 저위험(새 상태/로직 0, buildCanonRefactorPlan canonRefactor.test GREEN, CanonCanvas 렌더는 #6 세션 라이브 확인분)
  + tsc·소스핀·build 로 갈음(#1-undo 선례). 다음 안정 세션에서 회차 있는 작품으로 눈 확인 권장.
남은         → 검토대기 #4(FloatingEditor 회차 선택기·단편 게이트 완화 — 청사진 maps[2], 가장 침습적).
```

## 최근 검증 (2026-06-14 6차 · #7 작품 헌장 편집 · main · ultracode)

```
init.sh            → tsc 0 · vitest 543(storyEngine +5·episodeBriefing +2·canonRefactor +2·editorFocusLayout +4) · build 통과 (530→543)
#7 헌장 편집       → 베타테스트 검토대기 #7(잠근 헌장 결말·4줄 척추·화수 재열람·수정·증보 UI 전무, ContractAmendment·validateContract 모델은 있으나 미배선 → 생성은 옛 척추로 발화).
  ultracode Workflow(Explore 3 병렬 매핑 + 청사진 합성)로 #7·#3·#4 코드 정밀 매핑 후 #7부터 TDD 착수. 청사진 핵심 사실 4건 Claude 독립 검증.
  storyEngine isSpineComplete(단편2줄/장편4줄 잠금규칙 추출)·applyContractAmendment(척추/결말/대가/화수 부분패치→비트 재산출·잠금 재계산·amendments 누적, at 인자주입으로 순수성 유지) 신설(TDD).
  canonRefactor revertCanonChange story-core 분기에 storyContract JSON 복원 추가(중첩 객체 — 평면대입이면 문자열 박힘, 손상 JSON 안전실패).
  CharterAmendCard(신규 컴포넌트, 로컬 draft + 외부 헌장변경 재시드 + 바뀐 필드만 patch) · StoryXDesk amendCharter(no-op 가드·logCanonChange storyContract revert) · MemoryBankStudio overview 배선 · styles.css .sx-charter-amend 다크 토큰.
검증             → 순수함수 TDD 5(척추교체·결말/화수패치·공란시 잠금해제·change명시·isSpineComplete)·미러불변 핀 2(buildContractStatus 형태 불변=promptBuilders↔storyx.mjs 무수정)·storyContract undo 2·소스핀 4.
  라이브(preview) — 헌장작품("반납되지 않은 편지", spineLocked) 데이터→바이블→작품계약: CharterAmendCard 렌더(장편30화·잠김 라임배지·6 textarea·다크 rgb(15,16,17))→
  욕망 편집 dirty 감지→"이 개정 반영"→spine 갱신·비트 핀 재산출·이력 "척추 욕망 개정"(전필드 아님)·버튼 재비활성→변경로그 "↩ 되돌리기"→storyContract 전체 원복(spine·beat·amendments)·콘솔 0·원본 무손상.
미러 무수정       → ContractStatusInput(예산 숫자만 운반)에 amendment 미노출 → promptBuilders.ts/storyx.mjs 편집 0(회귀 핀이 보증).
다음(#7 후속)     → 검토대기 #3(영향 회차 인라인·CanonCanvas)·#4(FloatingEditor 회차 선택기·단편 게이트 완화). 청사진 maps/blueprint 보존(이번 Workflow 산출).
```

## 최근 검증 (2026-06-14 · charter 스크롤 핫픽스 + 이야기 품질 딥리서치 · main)

```
init.sh            → tsc 0 · vitest 521(charter 스크롤 회귀 +1) · build 통과 (520→521)
charter 스크롤 버그 — 사용자 실사용 발견: 작품 헌장(charter) 단계 세로 스크롤 불가 + 하단 4줄 척추 편집 불가.
  근본원인 — charter 패널이 다른 온보딩 단계의 `.hx-panel > .hx-main(overflow-y:auto)` 스크롤 컨테이너 패턴을
  안 따르고 `.hx-panel-charter > .hx-charter` 직속이라, `.hx-panel` overflow:hidden 이 긴 콘텐츠 하단을 클리핑.
  수정 — App.tsx charter 를 `.hx-main` 으로 감쌈 + styles.css `.hx-panel-charter { grid-template-columns: 1fr }`(빈 320px aside 컬럼 제거).
  TDD — appExperience.test +1(charter 가 hx-main 안 + .hx-panel-charter CSS). RED(charterBlock 에 hx-main 없음)→GREEN.
라이브(preview)    — 장편 charter 진입: panelGridCols 단일 1fr(1440px)·scrollable(scrollHeight 1207 > client 840)·
  scrollTop max 시 하단 CTA bottom 1649→92(화면 안)·4줄 척추 4 textarea 전부 접근·padding 복원·reload 후 온보딩 정상.
  (vite 1467 JSX 에러는 1:17:36 편집 중간 HMR 잔여 로그 — init.sh tsc exit0 + 정상 렌더로 무효 확정.)
딥리서치          — 이야기 품질·의외성(U3·U4) SOTA 정본 docs/research/2026-06-14-prose-quality-surprise-research.md
```

## 최근 검증 (2026-06-14 5차 · #6 인물 CRUD · main)

```
init.sh            → tsc 0 · vitest 530(storyEngine +1·editorFocusLayout +1) · build 통과 (528→530)
#6 인물 CRUD       → 베타테스트(욕망/상처/현재상태 3필드 덮어쓰기만, 추가·삭제·이름변경 핸들러 0개).
  storyEngine addCharacter(빈 필드·결정론 char-N id)·removeCharacter(고아 relations 정리)·renameCharacter 순수 함수(TDD).
  StoryXDesk handleAdd/Remove/RenameCharacter → CanonCanvas → CharacterDetailPanel(이름 입력·"이 인물 삭제" confirm) + "+ 인물 추가" 버튼.
검증             → 순수 함수 TDD(add/rename/remove·relations 정리·없는 id 무변경)·배선 tsc·editorFocusLayout 소스 핀.
  라이브(preview) 확인 — 데이터→인물 카테고리 진입 시 CanonCanvas "+ 인물 추가"·이름 입력·"이 인물 삭제" 렌더,
  클릭 시 char-2 "새 인물" 추가(결정론 id). centerSlot 이 곧 CanonCanvas 라 floating 데이터에 정상 발화. 원본 복원.
남은 #6          → 인물 role 편집·캐논(장소/사물/사건) CRUD·매체별 캐릭터 스키마(만화 외관)는 분리(리포트 §3-6).
```

## 최근 검증 (2026-06-14 4차 · #1-undo 바이블 되돌리기 · main)

```
init.sh            → tsc 0 · vitest 528(canonRefactor +1·editorFocusLayout +1) · build 통과 (526→528)
#1-undo            → 베타테스트 2순위(전원 10명). 수동 바이블 편집(인물·세계·캐논·문체축·무게중심)에
  되돌리기 전무 → 3~6회 갈아엎기 안전망 신설.
  canonRefactor revertCanonChange(project,change) 순수 함수(TDD) — 식별자(targetId·revertField)로
  before(최초 원본) 정확 복원, 식별자 없으면 무변경(이름 역매칭 의존 0).
  CanonChangeEntryInput 에 targetId·revertField 추가 + 5개 update 함수가 식별자 기록 +
  StoryXDesk revertCanonChangeEntry(복원+로그 제거) → MemoryBankStudio → CanonRefactorPanel "↩ 이 변경 되돌리기" 버튼.
검증             → revertCanonChange TDD 4케이스(character/world/story-core 복원·식별자 없으면 참조동일)·
  배선 tsc·editorFocusLayout 소스 핀. 라이브 버튼 클릭은 순수 함수 TDD+배선 tsc 로 갈음(인물 주입 비용 대비).
```

## 최근 검증 (2026-06-14 3차 · #1 본문 영속 — 편집 자동 저장 · main)

```
init.sh            → tsc 0 · vitest 526(storyEngine +1·editorFocusLayout +1) · build 통과 (524→526)
#1 본문 영속       → 베타테스트 1순위(데이터 손실) 해결. editorText 가 chapter.prose 로 commit 안 돼
  회차 전환·새로고침·import 시 무음 소실되던 버그.
  storyEngine commitChapterProse(project,id,prose) 신설(TDD — 없는 id·동일 prose no-op 참조동일).
  StoryXDesk 배선 — editorTextRef(stale closure 회피 최신값)·debounce 800ms 자동 commit·
  latestChapter effect 에 loadedChapterIdRef 추가해 회차 전환 시 이전 회차에 미커밋 편집 flush 후 새 회차 시드.
라이브(preview)    — test 회차 주입 → contentEditable 편집 '[편집마커X9]' → 800ms 후 localStorage chapter.prose commit
  (hasMarker:true) → 새로고침 후 editorShowsMarker:true(이전엔 소실). 원본("반납되지 않은 편지") 무손상 복원.
남은 보강(낮음)    → 저장 중 표시·beforeunload(2c/2d) edge case. 자동저장으로 '저장됨' 칩이 사실상 참이 돼 우선순위↓.
```

## 최근 검증 (2026-06-14 2차 · 울트라코드 10인 베타테스트 + UI/UX 안전 자동수정 · main)

```
init.sh            → tsc 0 · vitest 524(appExperience +3: #2·#4·#11) · build 통과 (521→524)
베타테스트         → ultracode Workflow 10인(장편2·단편2·에세이2·만화2·오디오1·학술1) 코드·플로우 워크스루
  (각자 캐릭터·이야기 3~6회 중간수정 시나리오) → findings 74 → 종합 24 우선순위.
  리포트·raw docs/reviews/2026-06-14-ultracode-beta-10/. 첫 시도 동시 10 → 서버 rate limit 전멸 → 배치 3씩으로 해소.
★ 핵심 — "생성 중 설정 변경" 흐름이 구조적 미완성(본문 영속·undo·CRUD·헌장 편집 부재). charter 스크롤급 국소 아님.
자동수정 3 (TDD)  — #2 charter 연재 building 캐러셀 빈화면(buildingPanelIndex charter 제외 — ★직전 charter 후속 회귀)·
  #11 매체변경 패널 흰박스→var(--sx-card)·#4 오디오 낭독 "0분 60초"→총초 환산. 앱 콘솔 에러 0.
검토 대기 14      — 🔴#1 본문 편집 무음 소실(freq8 전매체·"저장됨" 오표시 = 데이터 손실 1순위)·undo 전무(freq10)·
  영향회차 미표시(랜딩 약속 위반)·회차 선택기·잠금 보호·CRUD·헌장 편집·학술 마진검토 dead 등.
보류 3            — #14 aside agentStack·#23 dataView 매체분기·#20 회차수 clamp(onBlur 권장).
라이브            — #2 결정론 산술+테스트 검증(charter→building 전경로 라이브는 codex 생성 비용으로 생략). 콘솔 0.
```

## 최근 검증 (2026-06-13 3차 · A-3c 비트 펼침 미리보기 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(appExperience +1: A-3c 비트 미리보기 소스검사) · build 통과
                     (변경 전 519 → 520)
A-3c               — App: deriveBeatSheet import + charter 4줄 fieldset 아래 비트 미리보기
                     (long && spineComplete 조건부) · styles: .hx-charter-beats/.hx-beat-* + .hx-spine-* CSS
라이브(preview)    — ?stage=home 온보딩 → 작품 헌장 단계 진입 → 4줄+결말+대가 주입:
                     "이 4줄은 전체 30화에 이렇게 박힙니다" + 8·15·23·30화 핀(라임)·미션 매핑·
                     dashed 박스 · "헌장 확정—1화 만들기" 활성 · A-3b 버튼 freewrite 없어 풀폭 disabled · 콘솔 0
                     (localStorage 작품은 헌장 확정 미클릭으로 무손상)
```

## 최근 검증 (2026-06-13 2차 · A-3b 쇼러너 4줄 제안 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 7건 추가: promptBuilders 3·spineSuggestClient 3·appExperience 1) · build 통과
                     (변경 전 512 → 519)
A-3b               — buildSpineSuggestionPrompt(promptBuilders↔storyx.mjs byte-identical 미러)·spine-suggest CLI 명령·
                     /api/spine-suggest 라우트·vite 브리지·spineSuggestClient(normalizeSpine)·aiStatus mode·
                     App charter "쇼러너에게 4줄 제안받기" 버튼(빈 칸만 채움·작가 입력 보존)
CLI dry-run        — spine-suggest --dry-run: mode·프롬프트 669자·JSON 계약 포함
codex 라이브(preview) — /api/spine-suggest 직접 fetch: provider=codex·status complete·23.5초·
                     4줄(desire/advance/obstacle/resolution) 작품 맞춤·resolution 이 endingStatement 와 정렬·콘솔 0
```

## 최근 검증 (2026-06-13 · A-2 단계 게이트 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 8건 추가: 게이트4·단편빌더1·UI게이트2·App charter1) · build 통과
                     (변경 전 504 녹색 → 512)
A-2 (3d98fe1)      — evaluateProductionGate(spineLocked 기준·헌장 없으면 통과)·단편 desire+resolution 2줄 경량 잠금·
                     produceEpisode 진입 가드·FloatingEditor productionBlockedReason CTA 비활성·App charterReady 단편 2줄
라이브(preview)    — 미잠금 헌장(spineLocked:false) ?stage=editor 진입: 메인 CTA disabled·"헌장 잠금 필요"·
                     title="장편 척추가 아직 잠기지 않았습니다…" → spineLocked:true 복원 시 "초안 생성" enabled·
                     콘솔 에러 0 · 원본 작품("반납되지 않은 편지") 무손상 복원(별도 백업 키 경유)
```

## 최근 검증 (2026-06-12 · 품질·비용 로드맵 Phase D+A · main ff-merge)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 30건 추가: 회귀1·StoryScore6·헌장6·예산5·A-4 12) · build 통과
                     (변경 전 465 녹색 · 각 커밋 후 재실행)
Phase D-1 (cf8f1de) — nextEpisodeNumber(chapters 마지막+1). 드리프트 재현 테스트 RED(19)→GREEN(17)
Phase D-2 (b7f59f2) — StoryScore v0.2: 이름 가드(length<3)·analyzeTitles 반복률·후크 느낌표/반전어
Phase A-1 (a15728b) — StoryContract/StorySpine·validateContract 경계(short 4~8·long 24~36)·결말·비트
Phase A-5코어(e92c13d) — buildContractStatus: 17/30→remaining13 · 28/30 unpaid3→overBudget · 23/30→finalStretch
Phase A-4 (40646ea) — digest 헌장 절·draft 예산/종반/척추 규칙·review 길 잃음 점검·storyx.mjs 미러 동기화
                     (에세이·standalone·헌장없음 미주입 가드 테스트 포함)
Phase A-5 (43c6d56·d2fd3f8) — contractStatus 전 경로 배선(생성+검토). CLI dry-run 프롬프트 검증·
                     draftClient/reviewClient body 전달·오형식 무시 가드 테스트
Phase A-3 (54fa97a·2e51fa2) — deriveBeatSheet·buildStoryContractFromOnboarding 5건 + 온보딩 charter 단계
라이브(Playwright/preview) — 신규 장편: charter 패널 렌더(분량/결말/4줄 fieldset·length chip·
  CTA 게이트 disabled→enabled)→확정→serial-story-studio/project 에 storyContract
  {long·30화·beatSheet 4·spineLocked:true·ending} 영속 · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 6차 · Codex 검증 데스크 합류 · main)

```
init.sh            → tsc 0 · vitest 전체 녹색(테스트 3건 추가) · build 통과 (수정 전·후 각 1회)
표본 재현(라이브)  — 백업 03-hunter-branchpoint-ch1-locked 주입:
  F-002 — 잠금 후 초안 생성 클릭 → ~80초에 2화 도착(기능 정상) · 클릭 직후 피드백 0 재현
  F-006 — 작가실 패널 520/1280px 열기·닫기·전체검토 버튼 모두 정상(미재현)
  F-007 — 520px 온보딩 CTA rect 0×0 재현(진성)
수정 후 라이브     — 520px CTA 풀폭 노출·클릭 진행 · floating ⌘K 팔레트+작가진 전체 검토 ·
  메인 CTA 상태별 라벨("흐름 검증") · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 5차 · 쇼케이스 30화 S1 · main)

```
코드 변경 0 (문서·라이브 제작만) — 직전 게이트 450 tests 녹색 유지
온보딩 — freewrite 121자 → LLM 인터뷰 8문항(전부 작품 맞춤, 범용 0) → 1화 빌드 72초
  확정 캐논 4건이 인터뷰 답 그대로 시드(검토 context 에서 확인) — 갭A 신작 재실증
ch1 "철거 전야의 이름" — 3,019자·누수 0·audiencePromise 정확 이행(원혼이 본명 "강이현" 호명)
  검토 수정3·결정1·관찰1(세계키퍼 빈응답=P1) · 3인 독립 수렴(호출 주체 모호) · 하니스 7/8·95
ch2 "대림장 탈의실의 이름표" — 76초·2,321자·memoryAnchors 가 1화 캐논 3건 명시 참조
  검토 수정4·결정1·차단0 (P1 0/5) · canonFacts 4→7 · 4인이 표면 약속 이행 방식 일관 추적
★P14 — 전체 검토 더블 트리거 시 pending 영구 잔류·기존 런 응답 폐기 (재현·원인 코드 특정,
  수정은 다음 세션 TDD 건) · 초기 런 5건 중 2건 와이어 미발화(재현 조건 미상, 리로드 후 5/5 정상)
백업 backups/occult-ch2-locked.json · 캡처 showcase-30ch/ch1-margin-reviews.png · 콘솔 에러 0
```

## 직전 검증 (2026-06-11 4차 · M7 경량 검증 A·C 제작 · main)

```
init.sh            → tsc 0 · vitest(450 tests) · build 전체 통과 (세션 시작 시 — 이번 세션 코드 변경 0, 문서·캡처만)
A 공개 패키지       — docs/public/README.md(소개·정직성 명시·베타 모집 CTA) +
                     docs/public/storyx-live-test-showcase.md(23화 완권 4축 실증 + 한계 공개, 내부 코드명 제거)
C 데모 영상 키트    — docs/handoff/2026-06-11-demo-video-kit.md(5분 콘티 7장면·나레이션·백업 주입 절차)
라이브 검증 — 백업 2형식 주입 절차 실증(02-ch23 dump형 · 03-hunter 키맵형, /@fs/ fetch 스니펫):
  ch23 완권 재현(23화·캐논 91·온톨로지 113·인물 그래프·출간 체크리스트) ·
  헌터 ch6 재현(갈림길 카드+캐논 확인 배지·진도 체크+쇼러너에게 묻기·작가실 5인) · 콘솔 에러 0
캡처 8종 — docs/handoff/screenshots/demo-video-kit/ (S1·S3·S4×2·S5×3·S6)
```

## 직전 검증 (2026-06-11 3차 · 진도 인터뷰 2단계 · main)

```
init.sh            → tsc 0 · vitest(450 tests) · build 전체 통과
구현 — 병렬 2축 위임 + Claude 머지 통합:
  서버/CLI  — buildPaceInterviewPrompt 정본+storyx.mjs 미러(+동기화 테스트)·pace-interview 명령·
              /api/pace-interview 브리지·prod 라우트. 머지 시 Claude 가 구식 runProvider 호출을
              runProviderWithRetry+looksLikeProviderError 로 교체(베이스가 Q2 이전이던 갭).
  클라이언트 — paceInterviewClient(normalize·[페이스] 접두 계약·reportAiCall)·fc-pace-ask 버튼·
              로딩/note·StoryXDesk 질문 교체 배선·strip [페이스] 패턴
라이브 — #3 ch5 상태: 버튼→로딩("쇼러너가 진도를 읽는 중…")→작품 맞춤 질문 3개 교체
  ("'숨긴 진실' 어디까지 — 핵심 직전에서 멈춘다/부분 고백으로 금이 간다/행동으로 먼저 갚는다")
  옵션 클릭→[페이스] 시드 합성·같은 질문 교체·콘솔 0 · 캡처 pace-check/pace-interview-llm-live.png
```

## 직전 검증 (2026-06-11 2차 · P12 재관찰 + P13 · main)

```
init.sh            → tsc 0 · vitest(428 tests) · build 전체 통과
P13 (c6dd3bd)      — produceNextChapter 캐논 발명 제거(intent 누수·비밀 발명 템플릿 2건).
                     폴백 캐논을 픽스처로 쓰던 longformContinuity·memoryBank 테스트는 명시적 픽스처로 전환.
P12 재관찰 (라이브) — ch4 fixture 에서 배지 회피 + 정당 옵션(합류·전진·1~2화 안)으로 ch5 "예비 회수선" 재생성:
  연속성 — 출고 불가(결정) → 수정("큰 줄기는 기존 캐논과 맞고") · 고백 재서술 미발생(부분 전진 reframe)
  페이스 — 합류는 7분 시간창까지(본인 미등장) · 쇼러너 "합류 직전까지 전진·연재 압력 살아있음"
  메모 자동 소거 3회차 연속 · 백업 backups/03-hunter-p12-recheck-ch5.json
```

## 직전 검증 (2026-06-11 · P12 캐논 모순 의심 배지 · main)

```
init.sh            → tsc 0 · vitest(427 tests) · build 전체 통과
P12 수정 (9b9627a, 8534503):
  overlapsCanonFact — 옵션 토큰 65%+ 가 한 캐논 문장에서 prefix 발견 시 canonSuspect (ch5 fixture 실데이터 핀 3종)
  fc-fork-opt is-canon-suspect — "캐논 확인" 배지·dashed 보더 (제외 아님, 최종 판단은 작가)
  프롬프트 규칙   — "이미 일어난 일은 새 약속이 될 수 없습니다" promptBuilders+storyx.mjs byte-identical + 미러 동기화 테스트
  임계 캘리브레이션 — 라이브에서 0.6 경계 거짓양성(관측 모델 이탈 stake) 발견 → 0.65 + 경계 핀 테스트
  라이브 — ch4 fixture: 사고 옵션("숨긴 미래의 진실")에만 배지·정당 3개 깨끗·콘솔 0
```

## 직전 검증 (2026-06-10 4차 · 진도 체크 실효 관찰 · main)

```
init.sh            → tsc 0 · vitest(421 tests) · build 전체 통과
intentVersion      — strip 결과를 uncontrolled 메모 textarea 에 재시드 (066ea9f, P7 후속 라이브 발견·TDD)
실효 관찰 (#3 ch4~5, 회차당 진도 시드+갈림길+5인 검토):
  ch4 "관측자의 문턱" — 절제 시드 → 합류 payoff 단서 수준·새 약속 미회수로 남김 · 과회수 지적 0
  ch5 "고백의 비용"   — 회수 시드 → ch4 가 미룬 약속 1화 뒤 이행 · 과회수 지적 1(기준선 4)
  메모 사이클 — 시드 4줄 → 생성 → 자동 소거(0줄) 2회차 연속
  ★P12 — ch5 캐논 충돌을 검토 2인 독립 적발(출고 불가) — 갈림길의 모순 약속 미필터 갭 + 검토 망 작동 실증
  백업 — backups/03-hunter-pacecheck-ch5.json · 리포트 06-hunter-pace-check.md
```

## 직전 검증 (2026-06-10 3차 · 진도 체크 + 페이스 결함 + 매체 영속 · main)

```
init.sh            → tsc 0 · vitest(420 tests) · vite build 전체 통과
스펙 — docs/superpowers/specs/2026-06-10-pace-check-design.md (분업: sonnet 2 worktree + Claude 직접 1 + 라이브)
  paceInterview    — buildPaceCheck(질문 3·결정론·트리거: 연재+2화+정체/deferred2)·replacePaceSeed (be93014, 2d68457)
  페이스 결함 3건   — 시드 강도 isStalled 연동(c765c18)·P7 stripConsumedSeeds(a4ccc97)·stake 드리프트 Jaccard 매칭(c5f6704)
                     + 진도 시드 3종도 소비 처리(에이전트 간 갭 봉합)
  매체 영속        — SeriesProject.medium/format + createEmptyProject 시드 + 로드 복원 (e266894)
                     ★리로드 후 만화 작품이 소설 5인으로 검토되던 매체 연속성 버그 (#4 라이브 발견)
  라이브 — #4 만화: 리로드 후 7인 유지·7/7 검토 도착(스토리보드=컷 흐름·말풍선=캡션 압박, 캡션 과다 수렴 포착)
          #3 A암: 진도 카드 렌더·append·같은질문 교체·비정체 연성 시드·콘솔 0
  캡처 — docs/handoff/screenshots/pace-check/
```

## 직전 검증 (2026-06-10 2차 · 멀티에이전트 분업 세션 · main)

```
init.sh 등가 게이트 → tsc 0 · vitest(388 tests) · vite build 전체 통과 (S4 머지 후 재실행)
분업 모델 — Claude 오케스트레이션+라이브실증 / Codex(2d) / sonnet 서브에이전트(폴백가드·CLI·결정문서)
  Q2 폴백 가드   — runProviderWithRetry·looksLikeProviderError·buildCliDraftFallback (7865e2b)
                   ★Claude 검증이 치명결함 적발: codex 정상 호출도 stderr 배너 출력 → stderr 조건 제거 (deb0474)
                   라이브 — A암 ch3 실패 시 폴백 prose 에 raw 에러 누수 0 (#3 온보딩 누수와 대조)
  S1 2d 출간     — FloatingPublishWorkspace 270줄 + early-return + .fc-publish-* (29eec7b, 1차 위임 no-op 적발 후 재위임)
                   라이브 — A/B 잠금 동선에서 실데이터 렌더·잠금·복귀 정상, 캡처 hunter-ab-forks/floating-publish-2d-live.png
  S4 M6.3 CLI    — init/serve/memory sync + README (cdee90e) · dry-run 3종 + 실파일 스모크
  deferred fork  — buildEpisodeForks 'deferred-stake' 소스 추가 (a425042, TDD RED→GREEN)
  rank6·rank7    — docs/decisions/2026-06-10-{market-proof,academic-scope}-1.0.md · M7 done_criteria 교체
  A/B 실증       — docs/reviews/2026-06-07-persona-live-test/05-hunter-ab-forks.md · 백업 3종
  vite watch     — .claude/.playwright-mcp/docs churn 의 dev 풀 리로드 차단 (65fdc1e)
```

## 직전 검증 (2026-06-09 · floating 2c + 코드성 개선 전체 + main 머지)

```
init.sh            → tsc · vitest(364 tests) · build 전체 통과 · main 안착(ff-only)
floating Phase 2c — 데이터 모드 floating화 (board 정제·파고들기·MetricSummary, ~839136c)
  DataView board · FloatingDataWorkspace · isBibleMode early-return · .fc-data-* · MetricSummary
  라이브 — board 정제(이상한 원 제거)·캐논 파고들기→복귀·모바일 360 가로스크롤 0 · 캡처 floating-phase2c/
코드성 개선 (사용자 "a하고 c"):
  P1 — codex stdin 누수 제거(spawnSync input:'') + 빈응답 폴백 (fe13581)
  매체별 검토 — getMediumReviewAgentIds(CORE + 매체 specialist) (0011749)
    comics→스토리보드·말풍선 / audiobook→낭독 / essay→큐레이터 / novel·academic→CORE
  2f — 출간 모드 return 의 isDraftMode dead 가드 7곳 제거 + 단언 정합 (c3b4cbf, -126줄)
  polish — FloatingEditor topbar '· 새 초안' 중복 제거 (6d79085)
  라이브 — 편집 작가실 CORE 5·콘솔 0
main 머지 — 전 작업 ff-only 안착. origin push 미실행(사용자 요청 시).
```

## 완료 마일스톤

| ID | Title | Evidence |
|---|---|---|
| M1 | 스토리 하네스 통합 설계 문서 | docs/storyx-harness-architecture.md |
| M2 | Linear 다크 랜딩 재작성 | src/App.tsx MarketingLanding v4 |
| M3 · M3.5~3.7 | 4파트 구조·낮밤 토글·스튜디오 설정·에디터 폴리시 | src/App.tsx · src/StoryXDesk.tsx · src/styles.css |
| M4 (.A~.H) | 스토리 하네스 구현 Layer 0~7 | storyOntology·storyHarness·continuityContract·koreanVoiceGate·qualityGates·agentRunEngine·mediaProjection |
| M4.5 | 매체 페르소나 풀 ↔ 인터뷰 연결 | interviewClient.ts · tools/storyx.mjs |
| M5 | 서버측 LLM Vercel Functions (5 라우트) | api/*.ts · src/lib/server/{promptBuilders,llmRunner}.ts |
| M6.1 · 6.2 · 6.2.1 | export/import · evolutionMemory 누적 · history UI | storage.ts · evolutionMemory.ts · AiStatusBadge.tsx |
| M8 (.1~.5) | 하네스·게이트·매체·온톨로지 UI 카드 + 홈 다크 | StoryXDesk 좌레일 카드 · DataPanel |
| M9 | 디자인 핸드오프 패키지 | docs/handoff/ |
| M10 (P1~P3) | 우레일 Margin 검토 모델 · 좌레일 DataPanel · pending/anchor · 마진 병렬화 | marginReview · DataPanel · perf 88282f1 (80s→16s) |
| A1~A5 | 사회과학/학술 확장 (매체 골격·주장 레저·인용 무결성·반론/윤리·학술 퍼블리시) | claimLedger·citationGate·academicIntegrity·academicPublish · 커밋 98d6221~513b50e |

## 미완 (백로그)

| ID | Status | Note |
|---|---|---|
| M11 rank 5 | in_progress | PublishingStudio 추출·Tier3 훅·Status 죽은 코드 3개 처분 잔여 |
| M7-alpha-1.0 | todo | done_criteria 재정의 완료(2026-06-10 결정) — 외부 실증 게이트 실행 대기 |

## Master Plan

`~/.claude/plans/x-zippy-graham.md` — 0.2 → 1.0 마일스톤 로드맵.
