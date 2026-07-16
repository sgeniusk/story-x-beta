# P0-c 작품 관리 시스템 — 임시작에서 연재 작품으로 (2026-07-15)

## 문제

현재 Story X는 `serial-story-studio/project`와 `serial-story-studio/dive`에 작품 하나만 저장한다. 새 작품을 만들면 이전 작품을 다시 선택할 목록이 없고, 생성 보관함의 `projectId`도 실제 작품 전환으로 이어지지 않는다. 사용자가 원한 흐름은 **임시작을 만들고 저장해 두었다가, 충분히 마음에 들면 확정하고 계속 관리하는 전역 작품 보관함**이다.

## Brainstorm 결정 기록

사용자가 확정한 방향:

- 전역 생성 보관함과 별도로 작품을 관리하는 전역 작품 보관함이 필요하다.
- 임시작을 만들고 저장한 뒤 확정하며, 나중에 다시 열어 이어서 작업할 수 있어야 한다.
- 로컬 구동 모드를 우선한다.

남은 쟁점에 적용하는 최소 안전안:

- `<AI>기존 단일 저장 작품은 데이터 유실을 막기 위해 최초 로드 때 확정작으로 이관한다.</AI>`
- `<AI>새 온보딩에서 만들어진 작품은 임시작으로 시작한다. 임시작도 PLAY·WRITE·PLAN을 모두 사용할 수 있고, 확정은 정리/승격 표시이지 기능 잠금이 아니다.</AI>`
- `<AI>확정은 ProjectHub의 명시 버튼으로만 일어난다. 자동 확정, 자동 캐논 변경, 즉시 삭제는 두지 않는다.</AI>`
- `<AI>작품 전환 시 committed project, PLAY working copy, PLAN staged patch, snapshot cache를 작품별로 복원한다. 승인 대기 생성물은 기존 projectId 귀속을 유지한다.</AI>`

## 사용자 계약

1. 새 PLAY-first 작품이 만들어지는 순간 임시작으로 저장된다.
2. 임시작은 브라우저를 닫거나 다른 작품으로 이동해도 남는다.
3. 프로젝트 허브는 임시작과 확정작을 구분해 모두 보여 준다.
4. 카드의 `이어쓰기`는 해당 작품을 활성화한 뒤 그 작품의 원고와 작업 상태를 연다.
5. `작품으로 확정`은 lifecycle만 `temporary → confirmed`로 바꾸며 원고·캐논·PLAY 기록을 수정하지 않는다.
6. 기존 단일 저장본은 확정작 하나로 무손실 이관한다. 저장되지 않은 데모 seed는 작품 목록에 등록하지 않는다.
7. 생성 보관함 결과를 검토할 때 결과의 `projectId`와 일치하는 작품을 먼저 활성화한다. 작품이 없으면 잘못된 작품에 적용하지 않는다.

## 저장 모델

전역 키:

- `serial-story-studio/project-library/v1` — `ProjectLibraryEntry[]`
- `serial-story-studio/active-project-id` — 현재 활성 작품 id
- `serial-story-studio/dive-by-project/v1` — 작품별 PLAY working copy
- `serial-story-studio/plan-stage-by-project/v1` — 작품별 PLAN staged patch cache
- `serial-story-studio/plan-chat-by-project/v1` — 작품별 PLAN 대화 cache
- `serial-story-studio/snapshots-by-project/v1` — 작품별 snapshot cache

```ts
interface ProjectLibraryEntry {
  projectId: string;
  lifecycle: 'temporary' | 'confirmed';
  createdAt: string;
  updatedAt: string;
  project: SeriesProject;
}
```

기존 `project`, `dive`, `plan-stage`, `snapshots` 키는 호환 캐시로 유지한다. 선택/저장 시 활성 작품 값으로 동기화하므로 기존 에디터 호출부를 한 번에 재작성하지 않는다. 공용 헬퍼 본문을 복사하지 않고 `storage.ts`를 단일 브리지로 둔다.

## UI

ProjectHub의 현재 편집적·절제된 라이트 톤을 유지한다.

- 상단: `작품 N · 임시작 N` 요약.
- 새 프로젝트 카드 다음에 작품 카드를 최근 수정순으로 표시.
- 임시작: `임시작` 배지, `이어쓰기`, `작품으로 확정`.
- 확정작: `연재 작품` 배지, `이어쓰기`.
- 현재 활성 작품은 얇은 강조선과 `최근 작업` 표시만 사용한다.
- 생성 보관함은 기존 위치를 유지하며 프로젝트 lifecycle과 섞지 않는다.

## 비목표

- 작품 삭제·휴지통·보관 완료 상태.
- 클라우드 동기화, 계정 OAuth, 서버 DB.
- 작품 복제, 검색, 정렬 설정, 표지 생성.
- export schema v2와 전체 라이브러리 일괄 반출. 기존 export는 활성 작품 단위로 유지한다.
- evolution history의 작품별 분리. 현 단계에서 생성 컨텍스트로 주입되지 않는 운영 로그이므로 별도 후속으로 둔다.

## 수용 기준

- 기존 저장 작품이 새 목록에 확정작으로 한 번만 나타난다.
- 새 작품 2개 이상이 서로 덮어쓰지 않고 임시작으로 공존한다.
- 작품을 왕복 전환해도 각 committed project와 PLAY working copy가 복원된다.
- PLAN staged patch와 snapshot cache가 다른 작품에 노출되지 않는다.
- 임시작 확정 후 새로고침해도 확정 상태가 유지된다.
- 생성 보관함의 결과가 다른 활성 작품에 적용되지 않는다.
- 전체 `bash init.sh`와 브라우저 ProjectHub 실검증이 녹색이다.
