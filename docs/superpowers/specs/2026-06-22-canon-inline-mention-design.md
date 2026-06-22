<!-- 캐논 인라인 멘션 + AI주입 토글(B3) 설계 — 본문 등장 캐논 칩 + canonFact 단위 digest 주입 통제 -->

# 캐논 인라인 멘션 + AI주입 토글 (B3) 설계

> 2026-06-22 · feature `B3-canon-inline-mention` · 브랜치 `feat/canon-inline-mention`
> **근거** — UX 벤치마킹 P4 (`docs/research/2026-06-21-storytelling-service-ux-benchmark.md`). 본문에 추적 이름이 나오면 밑줄+카드, 각 엔트리에 'Always Include' 토글로 LLM 주입을 작가가 엔트리 단위 통제. 캐논/바이블이 단순 저장소가 아니라 'AI 입력 통제판'이 된다. 현재 Story X 캐논은 별도 패널(CanonCanvas)이라 집필면 인라인 참조가 없다.
> **brainstorming 결정** — ① 둘 다((A) 인라인 멘션 + (B) AI주입 토글) ② (A) 표시 = 본문 하단 '등장 캐논' 칩 바(contentEditable 충돌 회피) ③ (B) 의미 = always-include opt-in(digest 절단 면제) ④ (A)·(B) 대상 = `canonFacts` 통일(칩 이름 → popover 안 그 이름의 canonFacts + 토글).

## 목표
- 본문 집필면에서 등장 캐논을 칩으로 보여주고(발견성), `canonFact` 단위로 LLM digest 주입을 작가가 통제한다(통제판).
- always-include 토글로 digest 절단(40개 제한) 시 중요 캐논이 소실되지 않게 한다 — A-6(중반 캐논 소실)의 작가 통제 해법.
- contentEditable 편집 충돌 0 — 본문 텍스트는 읽기만, 칩 바는 별도 영역.

## 비목표 (YAGNI / 이번 범위 밖)
- contentEditable 인라인 밑줄 — 커서·IME·React 충돌 위험이라 본문 하단 칩 바로 대체.
- 양방향 포함/제외 토글 — always-include(opt-in)만. digest 문제는 소실이지 과잉이 아니다.
- 인물/세계/장소 엔트리 토글 — `canonFacts`만(digest 절단 대상). 인물·세계는 이미 contextPack로 전량 주입돼 토글이 무의미.
- 별칭(alias) 탐지 — 추출 이름 정확 매칭만. 별칭·띄어쓰기 변형은 후속.
- 인물 외 엔티티(장소·사물·세계) 멘션 — `extractEntityName`이 `isPlausiblePersonName` 가드로 인물 이름만 추출하므로, 이번엔 인물 캐논 멘션만 칩에 뜬다. 장소/사물 멘션은 후속(별도 추출기 필요).

## 아키텍처

### 신규 — `src/lib/canonMentions.ts` (순수 모듈)
```ts
interface CanonMention {
  name: string;        // extractEntityName 으로 뽑은 엔티티 이름
  factIds: string[];   // 그 이름이 주어인 canonFact id 목록
}
function detectCanonMentions(prose: string, canonFacts: CanonFact[]): CanonMention[];
```
- 각 canonFact → `extractEntityName(statement)`(storyOntology 재사용) → name.
- name 이 prose 에 포함(substring)되면 멘션. name 별로 그룹화(factIds 배열). name 추출 실패(null)면 제외.
- 결정론·순수. prose 등장 위치(첫 indexOf) 오름차순 정렬 — 작가가 읽는 순서.

### 데이터 모델 — `CanonFact.alwaysInclude`
- `CanonFact`에 `alwaysInclude?: boolean` 추가.
- `normalizeProject` 백필 — canonFacts.map 에서 `alwaysInclude: typeof fact.alwaysInclude === 'boolean' ? fact.alwaysInclude : false` (구버전 호환).

### digest 절단 면제 — `buildProjectContextDigest`
- canonFacts 절단부(현 `storyEngine.ts:1595-1608`) 수정: `alwaysInclude=true` facts 는 **항상 우선 포함**(절단 면제), 나머지만 기존 head6/tail 절단.
- always 수가 LIMIT 를 넘으면 always 전부(작가 의도 존중) + 나머지 최소(또는 0). edge 명시.
- LIMIT/HEAD 상수·다른 절(작품 계약·헌장·contextPack)은 불변.

### UI (A) — FloatingEditor 본문 하단 '등장 캐논' 칩 바
- 시트(`.sheet`) 하단에 칩 바. `mentions` props(CanonMention + fact 요약). 칩 = 멘션 이름.
- 칩 클릭 → popover(그 이름의 canonFacts statement 리스트 + 각 'AI 항상 포함' 토글).
- contentEditable 무관(별도 영역, 본문 텍스트는 읽기만).

### UI (B) — popover 안 토글
- popover 각 fact 에 'AI 항상 포함' 토글(opt-in, 기본 꺼짐). `onToggleCanonInclude(factId)`.

### 배선 — `src/StoryXDesk.tsx`
- `canonMentions = useMemo(detectCanonMentions(editorText, project.canonFacts), [editorText, project.canonFacts])` → FloatingEditor props(편집 중에도 갱신).
- `onToggleCanonInclude(factId)` → setProject(canonFacts.map 에서 factId 의 alwaysInclude 반전) + saveProject.

## 데이터 흐름
```
편집(editorText) → detectCanonMentions(prose, canonFacts) → 칩 바 (useMemo)
칩 클릭 → popover → 토글 → canonFact.alwaysInclude → buildProjectContextDigest 면제 → 다음 생성 digest 우선 포함
```

## 에러·엣지
- 빈 prose / canonFacts 0 → 멘션 0, 칩 바 미렌더.
- extractEntityName 실패(null) → 그 fact 멘션 제외.
- 같은 이름 여러 fact → 한 칩, popover 에 facts 여럿.
- alwaysInclude 미설정 → false(기존 자동 절단).
- always 캐논이 LIMIT 초과 → always 전부 포함(절단 면제 우선), 나머지 0.

## 테스트 (TDD)
- `canonMentions.test` — 이름 추출·본문 매칭·이름별 그룹화·미등장 제외·빈 prose·이름 없는 fact·등장 순서 정렬.
- `storyEngine.test` — digest 면제(41+ 캐논에서 alwaysInclude fact 가 절단돼도 포함).
- `storage.test` — alwaysInclude 백필·보존.
- `floatingEditor.test` — 칩 바 렌더·popover 열림·토글 콜백·멘션 0 미렌더.

## 손대지 말 것
- contentEditable 본문 — 읽기만(편집 충돌 0).
- `extractEntityName`(storyOntology) — 재사용, 무변경.
- digest 다른 절(작품 계약·헌장·contextPack·openThreads) — 불변.
- digest 절단 `CONTEXT_CANON_LIMIT`/`CONTEXT_CANON_HEAD` 상수 — 유지(면제 로직만 추가).
