# Story X Evaluator Development Update

Date: 2026-05-15

Sources:

- `docs/story-x-12-creator-tester-report.md`
- `docs/story-x-20-expert-retest-report.md`

## 요약

12인 창작자 테스터 패널의 의견은 기능 목록으로 흩뜨리지 않고, Story X의 서비스 지향점에 맞춰 여섯 개의 P0 운영 구조로 압축했다.

북극성:

> 창작자가 만든 하나의 이야기가 형태를 바꿔도 영혼을 잃지 않게 돕는다.

이번 반영의 원칙은 간결함이다. 각 테스터의 느낀점은 최대한 받아들이되, 에이전트가 서로 충돌하지 않도록 책임을 분리했다.

## 반영된 P0 구조

| 구조 | 반영 방식 | 담당 에이전트 |
| --- | --- | --- |
| Workflow Board | 선택한 매체/포맷별 다음 행동, 품질 게이트, 플랫폼 증거를 보여준다. | Editor UX Director, Onboarding Architect |
| Story Contract | 독자/청자 약속, 주인공 욕망, 상처/비용, 금지 클리셰, 형식 약속을 첫 canon 후보로 만든다. | Showrunner, Character Custodian, Continuity Editor |
| Refactor Impact Preview | 이름, 성별, 관계, 화자, 시각 참조 변경 전 영향 범위를 보여준다. | Character Custodian, World Keeper, Voice Curator, DaVinci |
| Quality Gate System | Story, Voice, Continuity, Visual, Audio, Platform 게이트로 산출물을 본다. | Continuity Editor, Voice Curator, Storyboard Agent, Audio Narration Director |
| Reference DNA Cards | 레퍼런스의 표면이 아니라 구조 엔진과 감정 엔진만 번역한다. | Showrunner, Genre Stylist, Brand Homepage Director |
| AI Output Autopsy | 생성 뒤 새 canon 후보, 손상 위험, memory update, 승인 필요 항목을 분리한다. | Insights Analyst, Continuity Editor, Work Library Manager |

## 테스터 의견 흡수

- 웹소설/연재 테스터 의견: 회차 보상, 다음 화 클릭, 작은 반복 디테일을 `Story Gate`와 `Workflow Board`에 반영.
- 문학/에세이 테스터 의견: 너무 깨끗한 AI 문장, 모호함의 소거, 사용자 기억 발명을 `Voice Gate`, `Story Contract`, 에세이 인터뷰 규칙에 반영.
- SF/판타지 테스터 의견: 세계 규칙과 비용을 `Continuity Gate`와 memory bank의 world bible로 연결.
- 만화/웹툰 테스터 의견: 산문에 삽화 붙이기가 아니라 컷, 말풍선, 시선 흐름을 `Visual Gate`와 `컷/스와이프 보드`로 반영.
- 동화/오디오 테스터 의견: 낭독성, 반복, 발음, 청취 피로를 `Audio Gate`와 첫 30초 platform proof에 반영.
- 플랫폼 편집자 의견: 첫 300자, 첫 3컷, 첫 30초, 썸네일/비율, export readiness를 `Platform Gate`와 Publishing Distribution Manager 책임으로 반영.

## 코드 반영

- `src/lib/evaluationSynthesis.ts`: 평가 보고서를 제품 원칙, P0 구조, 매체별 workflow board, Reference DNA 카드, 개발 로드맵으로 정규화.
- `src/lib/creativeDevelopment.ts`: 모든 개발 패키지에 `storyContract`, `workflowBoard`, `qualityGates`, `refactorImpactPreview`, `referenceDnaCards`, `outputAutopsy` 추가.
- `src/App.tsx`: 홈페이지에 평가 반영 섹션 추가. 작품 개발 결과에 계약서, 보드, 게이트, 해부 결과를 노출.
- `src/lib/serviceOperationsAgents.ts`: Editor UX Director, Publishing Distribution Manager, Insights Analyst의 책임을 평가 보고서 기준으로 업데이트.

## 홈페이지/온보딩 개편 반영

이번 업데이트는 Story X가 단순 생성기가 아니라 `이야기 -> 매체 -> 배포`를 연결하는 창작 운영체제라는 점을 홈에서 먼저 드러내도록 조정한다.

- 내비게이션은 Product/Trust 같은 일반 SaaS 표현 대신 `제작 OS`, `워크플로우`, `매체 전환`, `프론트엔드 제작팀`으로 재정의한다.
- 매체 전환 브릿지는 `소설 -> 웹툰/동화책/오디오북` 같은 경로를 Story Contract, Character Bible, Visual Bible, Voice Bible 패킷으로 연결한다.
- 프론트엔드 제작팀은 에디터 UX 디렉터, 창작 코치, 온보딩 설계자, 작품 관리인, 브랜드/홈페이지 디렉터, 출판/배포 매니저, 인사이트 분석가로 구성한다.
- 홈의 워크플로우 설명은 포맷 목록이 아니라 소설, 만화, 에세이, 오디오북/영상별 제작 흐름과 platform proof를 보여준다.
- UI/UX 개선은 창작실 에이전트와 충돌하지 않고, 사용자가 첫 프로젝트에서 첫 workflow board까지 끊기지 않게 이동하는 데 집중한다.

## 20인 확장 전문가 재테스트 반영

2026-05-15의 20인 확장 전문가 재테스트는 기존 P0 여섯 개를 유지하되, 다음 위험을 새로 확인했다.

- 방향은 맞지만 개념이 많아졌다.
- Story X는 더 많은 기능보다 한 작품의 완성 경험으로 증명해야 한다.
- 보드는 설명이 아니라 증거 산출물을 남기는 작업 도구여야 한다.
- Reference DNA는 커질수록 표면 모방, 권리, provenance 위험이 커진다.
- 초보자에게는 전문 용어보다 다음 행동이 먼저다.

따라서 P0를 늘리지 않고 P0.5 실행 원칙으로 압축한다.

| P0.5 | 반영 방식 | 주의점 |
| --- | --- | --- |
| One Project Vertical Slice | 짧은 원작을 웹소설 1화, 인스타툰 4컷, 오디오북 30초 샘플로 끝까지 만든다. | 새 기능 추가보다 같은 story core와 memory bank가 버티는지 증명한다. |
| Evidence-Based Workflow | 각 단계가 Story Contract 승인, 컷 목적, 첫 30초 proof, canon delta 같은 증거를 남긴다. | 보드는 설명 카드가 아니라 작업 결과를 만든다. |
| Reference Safety Rewrite | 위험한 레퍼런스 요청을 구조, 압력, 감정 엔진 분석으로 바꾼다. | 특정 작가/작품/캐릭터의 표면 복제는 차단한다. |
| Beginner/Pro Mode | 초보자에게는 이야기 약속, 문체 흔들림, 설정 충돌처럼 쉬운 말로 보여준다. | canon delta, context packet, output autopsy는 고급 모드에 둔다. |
| Production Provenance | 이미지, 음악, 음성, 레퍼런스, AI 생성 결과의 출처와 승인 용도를 기록한다. | 승인되지 않은 생성물과 rejected keyframe은 canon으로 새지 않는다. |

## 향후 개발 진행

### Now

- One Project Vertical Slice: 하나의 짧은 원작을 웹소설 1화, 인스타툰 4컷, 오디오북 30초 샘플까지 같은 Story Contract와 Memory Bank로 제작한다.
- Memory Sync: 승인 큐와 `memory-bank/` 파일을 실제로 연결해 Story X의 신뢰를 증명한다.
- Refactor Impact Preview: 이름, 성별, 관계, 화자, visual/audio 참조 변경의 영향 범위를 먼저 보여준다.
- P0 최소 구조는 유지하되 기능 설명보다 산출 증거를 우선한다.
- 홈/온보딩에서 매체 전환 브릿지, 프론트엔드 제작팀, 워크플로우 라이브러리의 의미를 먼저 보여준다.
- Creator Memory Bank UI를 작품 바이블 트랙으로 확장하고, story/character/world/canon/voice/visual/audio 기억을 편집 가능한 작업대로 노출한다.
- AI CLI 하네스가 mock/Claude/Codex provider 계약, raw output 정규화, pending review 저장 모델을 공유한다.
- AI review memoryCandidates와 회차 canon 후보를 메모리 승인 큐로 합쳐 사용자가 편집/승인/수정 요청/보류할 수 있게 했다.

### Next

- `storyx init`, `storyx serve`, `storyx memory sync`를 구현해 현재 UI의 승인 큐가 실제 `memory-bank/` 파일과 연결되게 한다.
- CLI가 만든 `reviews/pending` 파일을 웹 에디터가 읽어 승인 큐에 반영한다.
- 직접 편집 diff를 변경 블록 단위로 만들고, 검토 에이전트가 diff와 필요한 기억 패킷만 읽게 한다.
- Reference Safety Rewrite: 위험한 레퍼런스 요청을 표면 모방 대신 구조 분석 요청으로 바꾼다.
- Beginner/Pro Mode: 첫 프로젝트는 쉬운 말과 5분 guided path로 열고, 고급 용어는 사용자가 확장할 때 보인다.
- Panel/Audio Line Alignment: 만화는 beat -> panel -> bubble -> crop/export, 오디오는 paragraph -> speaker -> pronunciation -> pause -> music/SFX cue.
- Platform Packaging Lab: 웹소설 첫 문장, 웹툰 첫 3컷, 인스타툰 저장 포인트, 오디오북 첫 30초.
- Creative Coach Mode: 막힌 사용자에게 바로 대신 쓰기보다 2-3개의 선택 질문을 제공.
- 매체 전환 브릿지: 소설 -> 웹툰/동화책/오디오북, 에세이 -> 오디오북, 만화 -> 컷별 영상 전환 패킷을 생성 결과와 에디터 UI에 연결.
- 워크플로우 라이브러리 고도화: 각 제작 분야가 Story Contract, Memory Bank, Quality Gates, platform proof를 공유하도록 단계별 담당 에이전트를 고정.

### Later

- Fandom Memory Simulator.
- Market Signal Layer.
- Multimodal Staleness Engine.
- Reader/Listener Test Clips.
- Production Provenance: 이미지, 음악, 음성, 레퍼런스, AI 생성 결과의 출처와 승인 용도를 export package에 포함한다.
- 유료 검토/패키징: Standard/Deep 검토, 매체 변환 제안, 게시/다운로드 패키지, 크레딧 사용량 안내를 수익화 흐름으로 설계.

## 운영 규칙

- 캐논 충돌은 다수결로 통과시키지 않는다.
- Reference DNA는 표면 모방 금지 원칙을 항상 포함한다.
- 주요 설정 변경은 refactor로 취급한다.
- AI Output Autopsy에서 승인되지 않은 새 사실은 memory bank에 반영하지 않는다.
- Story X는 사무적 마찰은 줄이고, 예술적 마찰은 더 잘 보이게 만든다.
