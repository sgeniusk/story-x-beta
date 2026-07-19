# P1-b 회차 본문 반출 설계

> 날짜: 2026-07-19
> 상태: brainstorm 결정 완료
> 브랜치: `codex/p1b-text-export`
> 기준: Draft PR #43 (`codex/p1a-play-progress-feedback`) 위 단일 슬라이스

## 문제

Story X의 WRITE에는 사람이 읽고 수정할 수 있는 회차 본문이 있지만, 현재 외부로 가져가는 경로는 개발자용 JSON 백업뿐이다. 2026-07-13 실플레이의 웹소설 작가는 연재 플랫폼에 붙여넣을 본문 복사와 TXT를 찾지 못했고, 반출 부재를 결제 차단 사유로 판정했다. 사용자가 화면에서 막 고친 문장은 800ms 뒤에 저장되므로, 저장소의 마지막 회차를 추정해 내보내면 선택한 과거 회차나 마지막 입력이 누락될 수도 있다.

이번 슬라이스는 현재 WRITE 화면의 선택 회차를 사용자가 소유한 평문 산출물로 꺼내는 최소 폐루프를 만든다. 작품 백업 JSON, 응결 실패용 PLAY 복구 TXT, 출간 패키지는 서로 다른 산출물로 계속 분리한다.

## Brainstorm 결정

### 질문 1 — 무엇을 반출하는가?

**결정:** WRITE에서 현재 선택한 한 회차의 최신 본문만 반출한다. 대상은 `latestChapter`의 식별 정보와 저장 debounce 전 `editorText`다. `loadProject().chapters.at(-1)` 같은 최근 회차 추정은 금지한다. 잠긴 회차와 임시 작품도 읽기·소유권 행위인 반출은 허용한다.

### 질문 2 — 클립보드와 TXT의 내용은 같은가?

**결정:** 둘 다 화면의 본문을 글자와 줄바꿈 그대로 담는다. 작품명·회차·제목·캐논·리뷰 등 메타데이터를 본문 앞에 삽입하지 않는다. 연재 플랫폼에 바로 붙여넣을 수 있고, 복사 결과와 TXT 내용이 동일하다는 단순한 계약을 우선한다. 식별 정보는 안전한 파일명에만 담는다.

### 질문 3 — 어디에 배치하는가?

**결정:** WRITE의 회차 이동 컨텍스트 줄에 `본문 복사`와 `TXT`를 낮은 위계의 인라인 행동으로 둔다. 공통 상단 `⋯`는 App이 소유해 현재 선택 회차와 live 본문을 알지 못하므로 이번에는 사용하지 않는다. 별도 상태 리프트와 중복 메뉴를 만들지 않고, 액션은 일반 회차 WRITE에서만 렌더한다. PLAY 복구 작업실에는 노출하지 않는다.

### 질문 4 — 빈 본문과 실패는 어떻게 보이는가?

**결정:** 공백뿐인 본문은 두 행동을 비활성화하고 `내보낼 본문 없음`을 설명한다. 클립보드 권한 거부나 브라우저 다운로드 실패를 성공으로 표시하지 않는다. 성공·실패는 같은 줄의 `aria-live=polite` 상태로 알리고, 클립보드 실패 뒤에도 TXT 대안은 남긴다.

### 질문 5 — 기존 반출과 무엇을 공유하는가?

**결정:** UTF-8 `text/plain` Blob 다운로드와 안전 파일명 조각 규칙을 공용 helper로 승격한다. P0-b PLAY 복구 다운로드가 이 helper를 같이 쓰되, 복구 포맷의 경고·메타데이터와 P1-b의 깨끗한 본문 포맷은 합치지 않는다. 기존 JSON 내보내기·가져오기 schema와 동작은 변경하지 않는다.

### 질문 6 — 파일명은 어떻게 정하는가?

**결정:** `storyx-{작품명}-{회차}화-{회차제목}.txt`로 만든다. 각 조각은 NFKC 정규화 뒤 경로·제어 문자를 제거하고 공백을 하이픈으로 바꾸며 길이를 제한한다. 제목이 비면 `제목-없음`, 작품명이 비면 `untitled`로 안전 강등한다. 파일 내용은 UTF-8 한국어와 줄바꿈을 그대로 보존한다.

## 도메인 계약

`src/lib/manuscriptExport.ts`가 다음 순수 계약을 소유한다.

- `prepareChapterTextExport(body)`: 본문 존재 여부를 검사하고 복사·TXT가 함께 쓸 live body를 그대로 반환한다.
- `buildChapterTextFilename(projectTitle, chapter)`: 작품·회차 식별이 가능한 안전한 `.txt` 파일명.
- 빈 본문은 성공 값 대신 명시적인 empty 결과로 닫는다.

`src/lib/textFileExport.ts`는 안전 파일명 조각, 실제 평문 다운로드, 클립보드 호환 경계만 담당한다. PLAY 복구 TXT와 회차 TXT가 다운로드 helper를 공유한다.

## UI 계약

- `StoryXDesk`는 선택 회차와 `editorText`를 `ManuscriptExportActions`에 직접 전달한다.
- `ManuscriptExportActions`는 표준 Clipboard API와 임베디드 브라우저용 selection fallback 중 하나가 실제 성공한 뒤에만 성공을 알린다.
- TXT 행동은 동일한 live body와 순수 파일명을 공용 다운로드 helper에 전달한다.
- 회차 전환 직후, 800ms 저장 전 입력 직후에도 화면과 반출 결과가 일치한다.
- 잠김 여부와 작품의 temporary/confirmed lifecycle은 반출 가능 여부를 바꾸지 않는다.
- recovery work draft에서는 일반 회차 액션을 렌더하지 않는다.

## 수용 기준

- 현재 선택한 과거 회차를 반출해도 마지막 회차가 섞이지 않는다.
- 저장 debounce 전에 입력한 한국어·빈 줄·문장부호가 복사와 TXT에 그대로 들어간다.
- 클립보드와 TXT payload가 byte-for-byte 동일하고, PLAY 복구 경고·캐논·리뷰·스냅샷은 포함되지 않는다.
- 위험한 작품명·회차 제목도 경로 문자가 없는 `.txt` 파일명으로 내려받힌다.
- 빈 본문은 다운로드/복사를 실행하지 않고 이유가 보인다.
- 클립보드 resolve/reject와 다운로드 성공/예외가 각각 올바른 live status를 만든다.
- locked·temporary 회차도 반출되며 recovery work draft에는 액션이 없다.
- 390px·1280px에서 회차 이동과 반출 행동이 겹치거나 가로 overflow를 만들지 않고 키보드로 실행할 수 있다.
- 실제 브라우저에서 복사 결과와 다운로드 실파일을 확인한다.
- focused 테스트, `bash init.sh`, 독립 코드/시각 감사 모두 녹색이다.

## 비범위

- 작품 전체·다수 회차 묶음 TXT
- EPUB·DOCX·PDF·플랫폼 직접 게시
- 텍스트 가져오기, JSON export schema/import 변경
- ProjectHub·PublishScreen 반출 UI
- PLAY 원문·복구 작업본 포맷 변경
- 회차 잠금·캐논 승인·출간 gate 의미 변경
