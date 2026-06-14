# Session Handoff

다음 세션이 즉시 이어 시작할 수 있도록 한 세션 끝에 이 파일을 갱신한다. 가장 최근 인계가 맨 위.

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
