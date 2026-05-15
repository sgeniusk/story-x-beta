# Story X Version Log

현재 기준 버전: `Alpha v0.7.0`

기준 날짜: 2026-05-15  
커밋: `9691421`  
공개 URL: `https://story-x-alpha.vercel.app`

Story X는 앞으로 기능을 하나씩 더할 때마다 버전과 검증 로그를 남긴다. 커밋은 개발 기록이고, 이 문서는 사용자가 이해할 수 있는 제품 변화 기록이다.

## 버전 규칙

- `v0.x.0`: 사용자 흐름이 달라지는 알파 마일스톤.
- `v0.x.y`: 같은 마일스톤 안의 버그 수정, 카피 수정, 작은 UI 개선.
- `v1.0.0-alpha`: 소설/에세이 중심의 첫 완성 루프가 끝까지 이어지는 알파 릴리즈.
- 각 버전은 변경 내용, 검증 결과, 다음 과제를 함께 남긴다.

## 현재 버전

### Alpha v0.7.0 · Command Room

- 날짜: 2026-05-15
- 커밋: `9691421`
- 검증: `npm test` 23 files / 106 tests, `npm run build` pass

변경:

- `⌘K` 명령 팔레트로 초안 생성, 흐름 검증, 작품 바이블, 승인 대기, 출간 준비, 매체 변경을 바로 실행한다.
- `⌘.` 집중 모드 토글을 앱 셸에 연결했다.
- 사용자가 “지금 어디서 무엇을 해야 하는지” 찾는 시간을 줄이는 편의성 기준선을 세웠다.

다음:

- `v0.8.0`에서는 작품 바이블과 메모리 승인 큐를 더 실사용 가능한 편집 작업장으로 만든다.

## 알파 마일스톤

### Alpha v0.6.0 · Release Lock

- 커밋: `c6da0d3`
- 변경: 출간 전 release gate와 메모리 승인 상태가 출간 스냅샷 잠금을 제어한다.
- 검증: `npm test` 23 files / 105 tests, `npm run build` pass

### Alpha v0.5.0 · One Project Vertical Slice

- 커밋: `8cb7bd1`
- 변경: 하나의 Story Contract에서 웹소설 1화, 인스타툰 4컷, 오디오북 30초 proof를 만든다.
- 검증: `npm test` 23 files / 101 tests, `npm run build` pass

### Alpha v0.4.0 · Memory Approval Queue

- 커밋: `9470584`
- 변경: 캐릭터, 세계관, 캐논, 문체, 승인 대기를 작품 바이블 트랙으로 분리했다.
- 원칙: 새 기억 후보는 사용자 승인 전까지 canon에 반영하지 않는다.

### Alpha v0.3.0 · Focused Editor Shell

- 커밋: `77f50fe`
- 변경: 마케팅 배너를 제거하고 원고 중심 앱 셸로 정리했다.
- 구조: 왼쪽 목차, 중앙 창작물, 오른쪽 작가진/질문 레일.

### Alpha v0.2.0 · Onboarding Flow

- 커밋: `5adfc5b`
- 변경: 매체 선택과 성향 질문을 거쳐 에디터로 들어가는 흐름을 만들었다.
- 범위: 소설, 에세이, 만화 스토리보드, 오디오북 확장 방향.

### Alpha v0.1.0 · Story X Creative OS

- 커밋: `initial-alpha`
- 변경: “이야기가 먼저이고, 매체는 그 다음”이라는 제품 원칙과 writers room 모델을 시작했다.

## 다음 로드맵

### v0.8.0 · Bible Workbench Usability

- 캐릭터, 세계관, 캐논을 누르면 바로 편집 가능한 작업장으로 정리한다.
- 변경 영향, 승인 상태, 검토 순서를 더 직관적으로 보여준다.
- 메모리 승인 큐를 “파일로 쓰기 전 마지막 검수대”처럼 보이게 만든다.

### v0.9.0 · CLI Harness Integration

- Claude/Codex/provider review 결과를 `reviews/pending`으로 받고 웹 승인 큐에 반영한다.
- `storyx init`, `storyx serve`, `storyx memory sync` 기반을 구현한다.
- 승인된 후보만 실제 `memory-bank/` 파일에 반영한다.

### v1.0.0-alpha · First Complete Writing Loop

- 아이디어 입력.
- 에이전트 질문.
- 초안 생성.
- 직접 편집.
- 흐름 검증.
- 바이블 승인.
- 출간 스냅샷 잠금.

이 루프가 소설과 에세이에서 끊기지 않으면 Story X는 첫 알파 완성 기준에 도달한다.
