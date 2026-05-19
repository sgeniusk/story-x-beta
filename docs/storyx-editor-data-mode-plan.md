# Story X — 편집/데이터 에디터 개편 계획

클로드 디자인 핸드오프(Rails Redesign, x3 번들)를 우리 앱에 반영하는 멀티세션 계획. **디자인의 시각 시스템·목업 데이터는 쓰지 않는다 — 구조·상호작용만 가져와 우리 Editorial DS와 실제 데이터로 만든다.**

핸드오프 원본 — `…/tool-results/d4/x3/project/` (app.jsx, edit-view.jsx, data-view.jsx, data-canon.jsx, data-reviewers.jsx, data-beats.jsx, styles.css).

## 목표 구조

에디터 상단에 **편집 / 데이터** 두 모드 탭. (출간은 별도 유지.)

- **편집 모드** — 좌(작품 상태·회차 의도·회차 구조 트리·긴장 곡선) / 중(원고, beats 오버레이) / 우(원고 검토).
- **데이터 모드** (옛 바이블) — 좌(작품 상태 + 캐논 nav 5종 + 바이블 규칙 5섹션) / 중(카테고리별 편집기 — 인물 관계도·장소/사물/사건 카드·시간선) / 우(카테고리별 데이터 검토).
- 좌레일에서 구간(편집)·분야(데이터)를 고르면 가운데가 그 단위로 바뀐다.

## 단계

### 1단계 — 데이터 모델 (양쪽의 토대)
- `storyEngine.ts` —
  - `ChapterBeat`에 `tension: number`(0~100, 긴장 강도) 추가.
  - `SeriesProject`에 `places`·`objects`·`events`·`timeline`·`bibleOutline` 추가.
  - `CharacterProfile`에 `relations`(상대 id + 라벨) 추가.
  - 엔티티 공통 형태 — `{ id, name, sub, facts[], appearedIn[], status }`. `status: 'ok'|'conflict'|'unverified'`, 충돌 시 `conflict` 문자열.
  - `timeline` — `{ id, year, season, label, note, status }[]`.
  - `bibleOutline` — `{ id, title, body }[]` 5종(톤·문장 리듬·세계관 규칙·어휘 금기·시각 모티프).
- `storyEngine.test.ts` 먼저 갱신. 시드 프로젝트에 실제 예시 데이터. `storage.ts normalizeProject` 백필.

### 2단계 — 편집 모드
- 에디터 상단바에 편집/데이터 탭. 데이터 탭은 일단 기존 바이블 트랙 유지(3단계에서 교체).
- 편집 좌레일 — 작품 상태(4셀, 마감 없음) / 회차 의도(AI 에이전트 발언으로 명시) / 회차 구조 트리(beats를 act로 묶음, 스킴은 에이전트 선택) / 긴장·분량 곡선(SVG 라인차트 — 긴장 강도 + 분량 비중, 실선=확정·점선=계획).
- 검토(우)레일 — 카드 장식 줄이고 글 중심. 2줄 클램프→펼치기. beat 링크.

### 3단계 — 데이터 모드
- 데이터 좌레일 — 작품 상태 + 캐논 nav(인물/장소/사물/사건/시간선, 충돌 플래그) + 바이블 규칙 5섹션 아코디언.
- 가운데 캔버스 — 카테고리별: 인물=관계도(SVG 노드+엣지, 노드 클릭→상세), 장소·사물·사건=카드 그리드, 시간선=타임라인.
- 데이터 우레일 — 카테고리별 검토(정합/제안).

### 4단계 — LLM 생성·검토 연결
- 초안 생성이 beats의 `tension`·act 묶음을 같이 반환. 데이터 엔티티 생성·카테고리별 검토를 브리지(storyx.mjs)에 연결.

## 원칙

- 디자인의 색·토큰·목업 데이터 복제 금지. 우리 Editorial DS(warm cream + 다크 원고 + 보라)와 실제 `storyEngine` 데이터로.
- 가짜 UI 금지 — 기능 없는 버튼 안 만든다.
- 실제 기능(LLM 생성·검토, 작가진 분리 검토, 버전 히스토리, 승인) 보존. 빌드·테스트 통과.
- 한 단계씩 빌드·검증·커밋 후 다음으로.
