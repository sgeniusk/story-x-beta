# Story X 20인 확장 전문가 재테스트 보고서

작성일: 2026-05-15

## 0. 범위와 전제

이 문서는 Story X의 현재 방향을 20명 확장 전문가 패널로 다시 검토한 재테스트 보고서다.

중요한 전제:

- 실제 유명 작가나 전문가가 직접 평가했다는 뜻이 아니다.
- 20명은 세계적으로 검증된 창작자, 제작자, 편집자, UX/법무/플랫폼 전문가 유형을 모델링한 합성 페르소나다.
- 지난 2026-05-14의 12인 패널은 그대로 재참여한 것으로 설정했다.
- 새로 8명의 전문가를 추가해 총 20명으로 확대했다.
- 이번 테스트의 핵심 질문은 "Story X의 방향이 맞는가"와 "이 방향이 실제 제작 완료까지 이어질 수 있는가"다.

검토 입력:

- `docs/story-x-12-creator-tester-report.md`
- `docs/story-x-prd.md`
- `docs/storyx-evaluator-development-update.md`
- `docs/storyx-release-roadmap.md`
- `docs/codex-agent-manifest.md`
- `src/lib/evaluationSynthesis.ts`
- `src/lib/creativeDevelopment.ts`
- 2026-05-15 기준 공식 문서 중심 벤치마크 스캔

## 1. 재테스트 결론

20인 패널의 결론은 지난 12인 패널보다 더 선명하다.

Story X의 방향은 맞다. 특히 "하나의 이야기 중심이 여러 매체로 변해도 무너지지 않게 돕는다"는 북극성은 강하다. 다만 이제 위험은 반대로 바뀌었다.

지난번 위험:

- 창작 워크플로우가 충분히 보이지 않는다.
- AI가 무엇을 망가뜨리는지 드러나지 않는다.
- 소설, 인스타툰, 오디오북이 같은 story core로 묶이는 느낌이 약하다.

이번 위험:

- 방향은 좋아졌지만 개념이 많아졌다.
- `Workflow Board`, `Story Contract`, `Quality Gate`, `Output Autopsy`가 실제 산출물을 끝까지 만드는 경험으로 이어져야 한다.
- 제품이 "좋은 원칙을 설명하는 앱"이 아니라 "한 작품을 완성하게 하는 앱"임을 증명해야 한다.

평가담당 에이전트의 한 줄 판정:

> Story X는 방향 전환에 성공했다. 다음 검증은 기능 추가가 아니라, 한 작품을 끝까지 만들고 기억하고 내보내는 vertical slice다.

## 2. 이번 벤치마크에서 새로 확인한 점

| 분야 | 벤치마크 | 2026-05-15 확인 포인트 | Story X의 해석 |
| --- | --- | --- | --- |
| 소설 기획 | [Plottr](https://plottr.com/features/) | 비주얼 타임라인, 장면 카드, 장면 속성, 스토리 바이블, 시리즈 플래닝, Scrivener 내보내기 | Story X도 사용자가 한 작품을 여러 관점으로 보는 UI가 필요하다. 보드는 설명서가 아니라 작업 도구여야 한다. |
| AI 글쓰기 | [Sudowrite](https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS) | Write, Rewrite, Describe, Brainstorm, First Draft, Story Bible, Chapter Continuity, Saliency Engine 등 기능이 분화됨 | Story X는 생성 액션을 더 잘게 나누되, 각 액션이 memory bank와 canon에 어떤 영향을 주는지 보여야 한다. |
| 스토리 기억 | [Novelcrafter](https://www.novelcrafter.com/help/categories/snippets) | Codex와 스토리 바이블/월드빌더를 중심으로 캐릭터, 장소, 진행을 관리 | Story X의 Codex는 글쓰기만이 아니라 이미지, 오디오, 패키징까지 먹여야 한다. |
| 만화/인스타툰 | [GenToon](https://www.gentoon.ai/en/features) | 캐릭터 일관성, 1:1/4:5 비율, 스마트 말풍선, 자동 말풍선 크기, 해시태그, export 제공 | Story X는 이미지 생성 이전에 컷 기능, 말풍선 책임, 저장 포인트를 계획해야 한다. |
| 캐릭터 이미지 | [Midjourney Character Reference](https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference) | character reference와 character weight로 얼굴/의상/특징 반영 강도를 조절 | Story X는 참조 이미지를 canon으로 바로 넣지 말고, 승인된 visual DNA와 실패 로그를 분리해야 한다. |
| 영상/모션 | [Runway Gen-4](https://runwayml.com/research/introducing-runway-gen-4) | 캐릭터, 장소, 오브젝트, 스타일을 장면 간 일관되게 유지하는 세계 일관성 강조 | Story X가 영상으로 가기 전, story/world/visual reference packet을 먼저 만들어야 한다. |
| 이미지/영상 제작 | [Krea](https://docs.krea.ai/get-started/what-is-krea), [Krea Video](https://docs.krea.ai/features/video) | 여러 모델, 이미지/영상 생성, realtime, enhancer, edit, training, start/end frame | Story X의 차별점은 모델 자체가 아니라 "어떤 모델에 어떤 제약과 참조를 보낼지"를 관리하는 것이다. |
| 오디오북 | [ElevenLabs Studio](https://elevenlabs.io/docs/product/projects/overview), [Audiobooks](https://elevenlabs.io/docs/eleven-creative/products/audiobooks) | 타임라인, narration/music/SFX 트랙, 문장 단위 타이밍, 챕터, 발음 사전, generation history, manuscript upload | Story X 오디오북은 export가 아니라 문단, 화자, 발음, 호흡, 음악 큐, 재생 샘플이 묶인 제작실이어야 한다. |
| 오디오 편집 | [Descript](https://help.descript.com/hc/en-us/articles/10601764003341-Record-edit-and-export-your-audio-podcast) | 텍스트 기반 편집과 타임라인 중심 오디오/비디오 제작 | Story X는 "문장을 고치면 오디오가 stale 된다"는 상태를 명확히 보여야 한다. |
| 음악 | [Udio](https://help.udio.com/en/articles/10754328-create-music-with-your-own-audio), [Suno](https://suno.com/l/ai-music-app) | 업로드 오디오 기반 확장/리믹스와 프롬프트 기반 음악 생성 | Story X는 음악을 무드 배경이 아니라 반복 모티프, 장면 큐, 권리/출처 경고로 다뤄야 한다. |

## 3. 20명 패널 구성

지난번 12명은 재참여했고, 새 전문가 8명을 추가했다. 성별 균형은 10명/10명으로 맞췄다.

### 3.1 재참여 12명

| ID | 성별 | 페르소나 | 분야 | 이번 재평가 초점 |
| --- | --- | --- | --- | --- |
| M1 | 남성 | 세계적 진행형 웹소설가 | 웹소설 | P0 구조가 다음 화 클릭과 보상 루프까지 책임지는가 |
| M2 | 남성 | 세계적 문학소설가 | 문학소설 | 보드가 문학적 모호함을 죽이지 않는가 |
| M3 | 남성 | 세계적 SF/판타지 소설가 | 장르소설 | 세계 규칙과 비용이 memory bank로 실제 보존되는가 |
| M4 | 남성 | 세계적 만화가 | 만화/웹툰 | 컷, 말풍선, 시선 흐름이 생성보다 먼저 설계되는가 |
| M5 | 남성 | 세계적 동화작가 | 동화 | 낭독성, 반복, 안전한 경이가 품질 게이트에 들어갔는가 |
| M6 | 남성 | 오디오드라마 작가/연출가 | 오디오 | 오디오북이 export가 아니라 제작실이 되었는가 |
| F1 | 여성 | 로맨스판타지 웹소설가 | 웹소설 | 관계 변경이 refactor로 처리되는가 |
| F2 | 여성 | 심리문학 소설가 | 문체/심리 | AI의 과도한 정리를 막을 수 있는가 |
| F3 | 여성 | 그래픽 노블 작가 | 만화/에세이툰 | 이미지와 텍스트 책임이 분리되는가 |
| F4 | 여성 | 아동 판타지 작가 | 아동문학 | 시각 안전성과 연령별 긴장이 관리되는가 |
| F5 | 여성 | YA/시리즈 소설가 | 시리즈 | 팬덤 기억과 작은 디테일이 살아남는가 |
| F6 | 여성 | 플랫폼 네이티브 창작 편집자 | 플랫폼 | 첫 300자, 첫 3컷, 첫 30초가 검증되는가 |

### 3.2 신규 전문가 8명

| ID | 성별 | 페르소나 | 분야 | 평가 렌즈 |
| --- | --- | --- | --- | --- |
| M7 | 남성 | 글로벌 시리즈 쇼러너 | 드라마/영상 | 시즌 아크, 장면 기능, 작가실 운영 |
| M8 | 남성 | 게임 내러티브 디자이너 | 게임/인터랙티브 | 선택지, 상태, 세계 규칙, 플레이어 agency |
| M9 | 남성 | 한국어 로컬라이제이션 편집자 | 번역/문체 | 한국어 자연스러움, 장르 어투, 문화 맥락 |
| M10 | 남성 | 음향감독/작곡 프로듀서 | 음악/사운드 | 모티프, 믹싱, 청취 피로, 권리 리스크 |
| F7 | 여성 | IP 출판 에이전트 | 출판/계약 | IP 확장성, 피치, 판권, 시리즈 패키징 |
| F8 | 여성 | UX 리서처/접근성 전문가 | UX/접근성 | 초보자 onboarding, cognitive load, accessibility |
| F9 | 여성 | AI 저작권/윤리 자문가 | 법무/정책 | 레퍼런스 사용, 출처, consent, provenance |
| F10 | 여성 | 크리에이터 이코노미/성장 전략가 | 수익화/성장 | activation, retention, pricing, creator habit |

## 4. 지난 12명 참가자 비교

| ID | 지난번 핵심 의견 | 이번 비교 평가 | 방향에 대한 판정 |
| --- | --- | --- | --- |
| M1 | 보상 루프와 다음 화 클릭 게이트 필요 | `Story Contract`와 `Workflow Board`가 생긴 방향은 맞다. 다만 보상 루프가 실제 회차 카드와 연결되어야 한다. | 조건부 긍정 |
| M2 | 모호함과 내면 압력을 보존해야 함 | `Quality Gate`가 너무 체크리스트화되면 문학성이 줄어든다. `Ambiguity Lock`이 필요하다. | 방향 긍정, 톤 경계 |
| M3 | 세계 규칙과 비용 ledger 필요 | `Continuity Gate`와 memory bank 방향은 정확하다. 이제 실제 장편 10화 이상 회귀 테스트가 필요하다. | 강한 긍정 |
| M4 | 만화를 삽화 붙은 글로 다루면 안 됨 | Speech Bubble Agent, Keyframe Art Director, Frame Assembly Agent가 추가된 점은 큰 진전이다. | 강한 긍정 |
| M5 | 낭독성, 반복, 어린이 안전 필요 | 오디오/동요 읽기까지 확장한 방향은 좋다. 다만 아동 안전 게이트는 별도 이름으로 보여야 한다. | 긍정 |
| M6 | 오디오북은 제작실이어야 함 | ElevenLabs식 타임라인과 generation history를 참고한 방향은 맞다. 실제 라인 편집 UI가 필요하다. | 긍정, 구현 요구 |
| F1 | 관계 변경은 이름 교체가 아니라 refactor | `Refactor Impact Preview`는 정확히 맞다. 관계 상태 머신이 P0.5로 올라와야 한다. | 강한 긍정 |
| F2 | AI가 글을 너무 깨끗하게 만드는 문제 | Voice Gate가 들어간 것은 좋다. "너무 정돈됨" 경고가 실제 문장 비교로 보여야 한다. | 긍정 |
| F3 | 이미지와 텍스트의 책임 분리 | 새 만화 에이전트 분리는 좋다. 컷별 목적이 UI에 먼저 보여야 한다. | 긍정 |
| F4 | 아동용 정서 명료함과 시각 안전성 | 현재 P0에는 포함되지만 이름이 약하다. "Child Safety and Wonder Gate"로 분리 필요. | 조건부 긍정 |
| F5 | 팬덤 기억과 반복 디테일 | Memory bank 방향은 좋다. 반복 사물 추적은 Later가 아니라 베타 품질에 중요하다. | 우선순위 상향 요청 |
| F6 | 빈 편집창 대신 작업 보드 | 핵심 의견이 PRD와 코드에 반영되어 만족. 이제 첫 프로젝트가 실제로 완성되어야 한다. | 강한 긍정 |

### 비교 요약

지난 12명 중 9명은 방향이 더 좋아졌다고 평가했다. 3명은 방향은 맞지만 위험이 새로 생겼다고 봤다.

새 위험:

- 보드가 너무 많아져 초보자가 압도될 수 있다.
- 품질 게이트가 창작을 보호하지 않고 검열처럼 느껴질 수 있다.
- Reference DNA가 커질수록 표면 모방 위험과 법적 오해가 커진다.
- 실제 산출물 없이 원칙만 쌓이면 "기획이 좋은 앱"으로 멈출 수 있다.

## 5. 신규 전문가 8명 평가

### M7. 글로벌 시리즈 쇼러너

작품활동이란 한 명의 천재가 모든 장면을 쓰는 일이 아니라, 여러 역할이 같은 약속을 향해 충돌을 정리하는 일이다.

평가:

- Story X의 에이전트 구조는 작가실 모델과 잘 맞는다.
- 다만 쇼러너에게 최종 결정권이 있어야 한다. 여러 에이전트 의견이 병렬로 쌓이면 사용자는 지친다.
- 각 장면은 "정보 전달", "관계 변화", "위험 상승", "반전 준비" 중 하나 이상의 기능을 가져야 한다.

개선 요청:

- `Scene Function` 필드 추가.
- 에이전트 충돌 시 Showrunner가 최종 verdict를 내리는 `Writers Room Verdict`.
- 시즌/권/회차 단위 promise ladder.

### M8. 게임 내러티브 디자이너

작품활동이란 상태 변화를 설계하는 일이다. 독자나 플레이어가 선택하지 않더라도, 세계는 상태를 가지고 움직여야 한다.

평가:

- Story X는 캐릭터, 세계, 관계를 state machine처럼 다룰 가능성이 크다.
- 특히 refactor impact는 게임 퀘스트/상태 의존성 분석과 닮았다.
- 향후 인터랙티브 스토리나 게임 시나리오로 확장하기 쉽다.

개선 요청:

- `State Dependency Map`: 관계, 세계 규칙, 소품, 위치, 지식 상태를 연결.
- "이 사실을 누가 알고 있는가" ledger.
- 선택지형 스토리/게임 시나리오를 Later 후보로 추가.

### M9. 한국어 로컬라이제이션 편집자

작품활동이란 장르의 말맛을 살리면서도 번역투와 AI투를 제거하는 일이다.

평가:

- 한국어 자연스러움은 Story X의 핵심 품질 게이트가 되어야 한다.
- 웹소설, 동화, 에세이, 오디오북은 한국어 리듬이 전혀 다르다.
- "자연스럽다"를 하나의 기준으로 보면 실패한다.

개선 요청:

- 장르별 한국어 voice profile.
- AI투 탐지: 과도한 접속사, 설명적 감정어, 뻔한 마무리, 영문식 문장 구조.
- 낭독용 한국어와 독서용 한국어를 분리.

### M10. 음향감독/작곡 프로듀서

작품활동이란 반복되는 소리의 기억을 만드는 일이다. 음악은 분위기 장식이 아니라 이야기의 귀다.

평가:

- Sound Music Agent가 있는 것은 좋다.
- 하지만 음악은 생성 버튼보다 motif bible이 먼저다.
- 어린이 콘텐츠, 오디오드라마, 북트레일러는 음악 권리와 반복 후렴이 중요하다.

개선 요청:

- `Motif Bible`: 인물, 장소, 감정, 위험별 소리 모티프.
- loudness/피로도 gate.
- 음악 생성물 provenance와 재사용 가능 범위 표시.

### F7. IP 출판 에이전트

작품활동이란 작품을 팔리는 패키지로 줄이되, 작품의 중심을 잃지 않는 일이다.

평가:

- Story X의 cross-format 방향은 IP 피치에 매우 유리하다.
- 하지만 너무 많은 산출물을 만들기보다, 각 매체별 proof가 필요하다.
- 출판사/플랫폼에 보여줄 "이 IP는 확장 가능하다" 패키지가 있어야 한다.

개선 요청:

- `IP Pitch Pack`: logline, 비교 레퍼런스, 독자층, 1화/첫 3컷/첫 30초, 세계관 한 장.
- 권리/출처/AI 사용 disclose sheet.
- Series bible export.

### F8. UX 리서처/접근성 전문가

작품활동이란 오래 집중할 수 있는 환경을 만드는 일이다. 창작자는 기능이 많아서가 아니라 다음 행동이 선명해서 계속한다.

평가:

- Story X의 개념은 좋지만 cognitive load가 매우 높아질 수 있다.
- 초보자에게 `Story Contract`, `Reference DNA`, `Quality Gate`, `Autopsy`라는 용어가 한꺼번에 보이면 어렵다.
- 접근성 측면에서 에디터의 3열 구조는 밀도가 높으므로 키보드 탐색, 스크린리더 레이블, 작은 화면 fallback이 필요하다.

개선 요청:

- Beginner Mode와 Pro Mode 분리.
- 첫 프로젝트는 5분짜리 guided path.
- 품질 게이트 이름은 사용자가 이해하는 말로 번역: "이야기 약속", "문체 흔들림", "설정 충돌", "컷 가독성", "소리 피로".

### F9. AI 저작권/윤리 자문가

작품활동이란 영감과 모방의 경계를 인식하는 일이다. AI 시대의 창작툴은 사용자가 무심코 위험한 참조를 쓰지 않도록 도와야 한다.

평가:

- Reference DNA의 "표면 모방 금지" 원칙은 매우 중요하다.
- 하지만 문서 원칙만으로는 부족하다. UI에서 위험한 요청을 완곡하게 바꿔주는 안전장치가 필요하다.
- 유명 작품/작가 이름을 입력받을 수는 있지만, 결과는 구조 분석과 변환 가능한 설계어로 제한해야 한다.

개선 요청:

- `Reference Safety Rewrite`: "A 작가처럼 써줘"를 "지연된 결단과 감시 구조를 쓰자"로 변환.
- provenance log: 어떤 참조를 어떤 구조로 변환했는지 기록.
- IP/음성/음악/이미지 권리 경고.

### F10. 크리에이터 이코노미/성장 전략가

작품활동이란 습관이 되어야 한다. 사용자가 한 번 멋진 결과를 보는 것보다, 매주 돌아와 작품을 키우는 구조가 더 중요하다.

평가:

- Story X는 단발 생성보다 retention이 강한 제품이 될 수 있다.
- 프로젝트, 회차, memory bank, autopsy, 승인 큐가 사용자 습관을 만들 수 있다.
- 수익화는 생성량보다 검토 깊이, 매체 전환, export package, 전문가 리뷰에서 나와야 한다.

개선 요청:

- Creator Habit Loop: 오늘 할 일, 마지막 미해결 게이트, 다음 proof.
- 가격 구조: 무료는 작은 프로젝트와 mock review, 유료는 deep review/매체 변환/export package.
- "AI 비용이 어디에 쓰였는지" credit transparency.

## 6. 방향에 대한 평가

### 6.1 방향 점수

| 항목 | 12인 보고서 점수 | 20인 재테스트 점수 | 변화 |
| --- | ---: | ---: | --- |
| 전략적 차별성 | 4.6 | 4.8 | 더 강해짐 |
| 홈페이지/브랜드 방향 | 4.0 | 4.1 | 유지, 제품 구체성 보강 필요 |
| 첫 진입 명료성 | 3.0 | 3.5 | 좋아졌지만 용어 부담 있음 |
| 글쓰기 워크플로우 | 3.4 | 3.7 | Story Contract 반영으로 개선 |
| 만화/인스타툰 워크플로우 | 3.0 | 3.8 | 만화 에이전트 세분화로 개선 |
| 오디오북 워크플로우 | 3.1 | 3.7 | Studio/Audiobook 벤치마크 반영으로 개선 |
| Reference DNA | 4.2 | 4.4 | 강력하지만 안전장치 요구 증가 |
| 일관성/리팩터 안전성 | 4.4 | 4.6 | 핵심 차별점으로 확정 |
| AI 품질 안전장치 | 2.7 | 3.4 | 구조는 생겼고, 실제 평가 데이터 필요 |
| 창작자 통제감 | 3.0 | 3.6 | 승인 큐/Autopsy 방향으로 개선 |
| 제품 범위 통제 | 신규 | 2.8 | 가장 큰 새 위험 |
| 베타 실행 현실성 | 신규 | 4.0 | CLI/로컬 베타 우선 방향은 합리적 |

### 6.2 방향 판정

20인 패널은 Story X의 방향을 `강한 긍정, 단 범위 통제가 필요`로 판정했다.

좋은 방향:

- 단순 AI 생성기가 아니라 창작 운영체제로 포지셔닝한다.
- Story first, medium second 원칙이 뚜렷하다.
- refactor impact와 memory bank가 경쟁력이다.
- 생성 이후 autopsy와 승인 큐가 작가의 통제감을 살린다.
- 로컬 CLI 베타에서 품질을 먼저 증명하는 전략이 현실적이다.

위험한 방향:

- 너무 많은 매체를 동시에 구현하려 하면 모든 매체가 얕아진다.
- Reference DNA DB를 크게 만들기 전에 안전한 구조화 방식이 필요하다.
- UI가 "기능이 많은 전문가 도구"처럼 보이면 첫 사용자가 떨어져 나간다.
- 품질 게이트가 실제 작품 개선을 못 하면 체크리스트 피로만 생긴다.
- 법적/윤리적 provenance가 없으면 레퍼런스 기능이 가장 큰 리스크가 된다.

## 7. 평가담당 에이전트 취합

### 7.1 이번 테스트에서 확정된 제품 명제

Story X는 다음 한 문장으로 설명되어야 한다.

> 이야기를 생성하는 앱이 아니라, 이야기가 형태를 바꿔도 무너지지 않게 관리하고 제작하는 앱.

이 명제는 20명 중 18명이 긍정했다.

반대나 우려를 낸 2명의 요지는 "이 명제가 맞더라도 실제로 완성물을 만들게 해야 한다"였다. 즉 방향 반대가 아니라 실행 리스크다.

### 7.2 새 P0 제안

기존 P0 여섯 개는 유지한다.

기존 P0:

1. `Workflow Board`
2. `Story Contract`
3. `Refactor Impact Preview`
4. `Quality Gate System`
5. `Reference DNA Cards`
6. `AI Output Autopsy`

이번 재테스트에서 추가해야 할 P0.5:

1. `One Project Vertical Slice`

- 하나의 샘플 프로젝트를 끝까지 만든다.
- 최소 경로: 짧은 이야기 -> 웹소설 1화 -> 인스타툰 4컷 -> 오디오북 30초 샘플.
- 같은 story contract와 memory bank를 공유해야 한다.

2. `Evidence-Based Workflow`

- 각 보드 단계는 설명이 아니라 증거 산출물을 남긴다.
- 예: Story Contract 승인됨, 컷 4개 목적 정의됨, 첫 30초 청취 피로 통과, canon delta 승인됨.

3. `Reference Safety Rewrite`

- 위험한 레퍼런스 요청을 구조 분석 요청으로 바꾼다.
- "OO 작가처럼"이 아니라 "지연된 결단, 감시, 도덕적 압력"처럼 변환한다.

4. `Beginner/Pro Mode`

- 초보자에게는 "작품 약속, 다음 장면, 설정 충돌" 같은 쉬운 말로 보여준다.
- 고급 사용자는 Reference DNA, canon delta, context packet, output autopsy까지 볼 수 있다.

5. `Production Provenance`

- 이미지, 음악, 음성, 레퍼런스, AI 생성 결과가 어디서 왔고 어떤 용도로 승인되었는지 기록한다.

### 7.3 다음 스프린트 권장 순서

1. 새 기능을 더 늘리기 전에 `One Project Vertical Slice`를 만든다.
2. 인스타툰과 오디오북은 각각 하나의 실제 결과물을 대상으로 검증한다.
3. memory sync와 review-ledger를 실제 파일로 연결한다.
4. Reference DNA는 20개 대형 DB보다 8개 안전 카드로 시작한다.
5. Quality Gate는 자동 점수보다 "수정 가능한 지적"을 먼저 만든다.
6. Beginner Mode 카피를 먼저 정리한다.
7. 비용/credit transparency는 베타 전에 최소 표시한다.

## 8. 제품 우선순위 재정렬

### 지금 올려야 할 것

| 우선순위 | 항목 | 이유 |
| --- | --- | --- |
| P0 | One Project Vertical Slice | 방향을 말로 증명하지 말고 한 작품으로 증명해야 한다. |
| P0 | Memory Sync | Story X의 핵심 신뢰는 기억이 실제로 저장되고 승인되는 데서 나온다. |
| P0 | Refactor Impact Preview | 사용자가 말한 "남주를 여주로 바꾸면 전체가 차곡차곡 바뀌어야 한다"를 직접 해결한다. |
| P0 | Panel/Audio Line Alignment | 만화와 오디오북의 차별성을 실제 제작 UI로 보여준다. |
| P0.5 | Reference Safety Rewrite | 레퍼런스 기능이 커질수록 법적/윤리적 안전장치가 필요하다. |
| P0.5 | Beginner/Pro Mode | 개념이 많아진 Story X를 초보자도 견딜 수 있게 한다. |

### 내려도 되는 것

| 항목 | 내려도 되는 이유 |
| --- | --- |
| 대규모 Reference DNA DB | 안전한 카드 구조와 UI가 먼저다. |
| 완전 자동 영상 생성 | Runway/Krea 같은 툴과 직접 경쟁하기보다 패킷 준비가 먼저다. |
| 팀 협업/마켓플레이스 | 로컬 베타의 품질 증명 뒤로 미룬다. |
| 자동 퍼블리싱 | export package와 proof가 먼저다. |
| 복잡한 수익화 | deep review, 매체 변환, export package부터 검증한다. |

## 9. 개선사항 요약

### UX/UI

- 첫 프로젝트는 5분 guided path로 제한한다.
- 작업 보드는 "설명"보다 "오늘 해야 할 행동"을 보여준다.
- 고급 용어는 Pro Mode에 숨긴다.
- 3열 에디터는 작은 화면 fallback과 키보드 탐색을 갖춘다.
- 품질 게이트는 사용자 언어로 보인다: 이야기 약속, 문체 흔들림, 설정 충돌, 컷 가독성, 소리 피로.

### 품질

- Story Gate는 장면 기능을 본다.
- Voice Gate는 장르별 한국어 리듬을 본다.
- Visual Gate는 캐릭터 일관성뿐 아니라 컷 목적과 말풍선 가림을 본다.
- Audio Gate는 발음, pause, loudness, 피로도를 본다.
- Platform Gate는 첫 300자, 첫 3컷, 첫 30초를 본다.

### 일관성/안전

- 캐릭터 변경은 refactor다.
- 이미지/음악/음성/레퍼런스는 provenance를 가져야 한다.
- 승인되지 않은 생성 결과는 canon이 아니다.
- rejected keyframe이나 실패한 참조는 canon으로 새지 않는다.
- Reference DNA는 구조와 감정 엔진만 번역한다.

### 수익화/운영

- 무료: 작은 프로젝트, mock review, basic workflow.
- 유료: deep review, 장편 memory sync, 매체 변환, export package.
- 전문가 검토: 웹소설 훅, 한국어 문체, 오디오북 샘플, 인스타툰 컷 검토.
- 비용 표시: 생성, 재생성, 리뷰, 이미지, 오디오 비용을 분리해 보여준다.

## 10. 성장 메모리 업데이트 제안

이번 20인 재테스트에서 memory bank나 review-ledger에 저장할 교훈:

1. 12인 패널의 P0 방향은 유지한다.
2. 이제 핵심 리스크는 "방향 부재"가 아니라 "범위 과다"다.
3. Story X는 다음 기능보다 다음 완성물을 우선해야 한다.
4. 한 작품이 소설, 인스타툰, 오디오북으로 변하는 vertical slice가 제품의 진실 테스트다.
5. Reference DNA는 구조 분석으로만 작동해야 하며, 위험한 표면 모방 요청은 rewrite해야 한다.
6. 초보자에게는 전문 용어보다 다음 행동이 먼저다.
7. 에이전트 의견은 많을수록 좋은 것이 아니다. 최종 verdict와 수정 가능한 제안이 필요하다.
8. 법무/권리/provenance는 나중 문제가 아니다. 이미지, 음악, 음성, 레퍼런스가 들어오는 순간부터 제품 신뢰의 일부다.
9. 오디오와 만화는 별도 제작실이 아니라면 Story X의 확장 약속이 약해진다.
10. 베타는 로컬 CLI와 memory sync로 신뢰를 증명한 뒤 웹 서비스로 확장해야 한다.

## 11. 최종 권고

20인 확장 패널은 Story X의 방향을 계속 밀어도 된다고 본다.

다만 다음 한 달의 목표는 "더 많은 기능"이 아니다.

다음 한 달의 목표:

> 하나의 짧은 원작을 만들고, 같은 story core와 memory bank를 써서 웹소설 1화, 인스타툰 4컷, 오디오북 30초 샘플까지 완성한다.

그 과정에서 반드시 검증할 것:

- Story Contract가 실제로 각 매체에 전달되는가.
- 캐릭터/세계/문체/시각/오디오 기억이 승인 후에만 갱신되는가.
- Refactor Impact Preview가 이름/성별/관계 변경을 안전하게 처리하는가.
- Quality Gate가 추상 점수가 아니라 실제 수정으로 이어지는가.
- Reference DNA가 표면 모방 없이 구조적 도움을 주는가.
- 사용자가 "AI가 내 작품을 빼앗았다"가 아니라 "내 작품의 복잡한 기억을 대신 붙잡아준다"고 느끼는가.

최종 한 줄:

> Story X의 방향은 맞다. 이제 이 방향을 한 작품의 완성 경험으로 증명해야 한다.
