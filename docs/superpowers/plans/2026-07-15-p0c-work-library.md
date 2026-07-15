# P0-c 작품 관리 시스템 Implementation Plan

## 목표

기존 단일 작품 저장을 무손실 호환하는 전역 작품 라이브러리를 만들고, 새 작품을 임시작으로 저장·재개·확정할 수 있게 한다. 한 슬라이스에서 삭제/클라우드까지 확장하지 않는다.

## 허용 파일

- `src/lib/projectLibrary.ts`
- `src/lib/projectLibrary.test.ts`
- `src/lib/storage.ts`
- `src/lib/storage.test.ts`
- `src/components/ProjectLibraryCard.tsx`
- `src/components/projectLibraryCard.test.ts`
- `src/App.tsx`
- `src/appExperience.test.ts`
- `src/StoryXDesk.tsx`
- `src/styles.css`
- `docs/superpowers/specs/2026-07-15-p0c-work-library-design.md`
- `docs/superpowers/plans/2026-07-15-p0c-work-library.md`
- 세션 종료 시 `progress.md`, `session-handoff.md`

## Task 1 — 순수 라이브러리 모델 RED→GREEN

먼저 `projectLibrary.test.ts`에 다음 실패 테스트를 쓴다.

- legacy project → confirmed entry.
- 새 project upsert → temporary, 기존 entry 공존.
- 같은 id 재저장 → lifecycle/createdAt 보존, updatedAt/project 갱신.
- confirm → project 데이터 무변경.
- 손상 entry 제거와 최근 수정순 정렬.

그 뒤 `projectLibrary.ts`를 최소 구현한다.

## Task 2 — storage 호환/격리 RED→GREEN

먼저 `storage.test.ts`에 다음 통합 테스트를 추가한다.

- 기존 `project` 키 최초 로드 시 확정작 이관 및 활성화.
- 저장되지 않은 seed는 라이브러리에 등록하지 않음.
- `saveTemporaryProject` 뒤 `loadProject`가 새 active를 반환.
- 작품 전환 왕복 시 dive state가 projectId별 복원.
- PLAN patch와 snapshot legacy cache가 전환 시 작품별 교체.
- confirm lifecycle 새로고침 유지.

그 뒤 storage 브리지와 캐시 스왑을 구현한다. 기존 함수 시그니처는 가능한 한 유지한다.

## Task 3 — ProjectHub UI RED→GREEN

먼저 카드 컴포넌트 테스트에 임시/확정/활성 상태와 버튼 동작을 단언한다. 그 뒤 `ProjectLibraryCard`와 ProjectHub 목록을 구현한다. 기존 `--nx-*` 토큰, 한국어 결과 중심 동사, 키보드 접근성을 유지한다.

## Task 4 — 온보딩·작품 전환·생성 보관함 배선 RED→GREEN

먼저 `appExperience.test.ts`에 다음 소스 계약을 추가한다.

- PLAY-first 생성은 `saveTemporaryProject`를 사용.
- draft boot는 temporary lifecycle을 전달.
- 프로젝트 카드 선택은 `activateProject` 후 editor 진입.
- generation result 검토는 item.projectId 활성화 성공 후 dive 진입.

그 뒤 App/StoryXDesk를 배선한다. 존재하지 않는 projectId 결과는 검토를 열지 않는다.

## Task 5 — 검증·인계·PR

1. 관련 테스트와 build.
2. `bash init.sh` 전체 녹색.
3. 로컬 브라우저에서 기존 작품 이관, 새 임시작 표시, 확정, 두 작품 전환, 콘솔 오류 0 확인.
4. `progress.md` 최근 검증/증거 갱신.
5. `session-handoff.md` 맨 위 인계 노트.
6. `codex/p0c-work-library` 커밋·push·PR 생성. 머지는 사용자에게 남긴다.
