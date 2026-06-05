# 방향 C 플로팅 에디터 — 실데이터 배선 설계 (Spec)

> 2026-06-05 · 브레인스토밍 산출 스펙. 입력 = `docs/storyx-floating-editor-plan.md`(C방향 매핑) + Explore 데이터 shape 조사. 다음 단계 = writing-plans 구현 계획.

## 1. 배경·문제
`src/components/FloatingEditor.tsx`(739줄)는 비주얼 Phase 1 체크포인트로 머지됐으나 **내장 시안 데이터**(`SAMPLE_PERSONAS·SAMPLE_REVIEWS·SAMPLE_BODY`)로만 동작한다. 현재 `?editor=floating`은 `App.tsx`에서 **StoryXDesk를 우회**해 standalone 렌더되어, 실제 `editorText`·`useMarginReview` 훅·실 페르소나에 닿지 못한다. 즉 실 원고를 보거나 실제 작가진 검토를 돌릴 수 없다.

## 2. 목표·범위 (확정된 3 결정)
- **끝-상태 = 실데이터 프리뷰.** `?editor=floating`을 실 데이터가 도는 완전 동작 뷰로. **StoryXDesk가 여전히 기본 편집기.** Phase 2(기본 전환 스왑)는 이번 범위 밖.
- **통합 방식 = A (StoryXDesk 경유).** StoryXDesk가 플래그 시 자기 상태/콜백/페르소나를 props로 넘겨 `<FloatingEditor>`를 렌더. FloatingEditor는 순수 표현 컴포넌트로 강등.
- **편집 충실도 = 읽기 본문 + 완전 동작 검토.** 검토 호출·전체검토·반영/보류 diff·실 페르소나·좌측 패널 실데이터 모두 포함. **자유 타이핑(contentEditable)은 Phase 2.**

비목표(이번 안 함) — 자유 타이핑 편집, 의도 메모 쓰기-백, "데이터" 모드, "출간"·"초안 생성" 실동작, 기본 편집기 스왑, 공유 훅 추출(rank5 Tier3).

## 3. 접근 A — 데이터 흐름
```
App.tsx (stage==='editor')
  └─ 항상 <StoryXDesk/>           ← ?editor=floating standalone 분기 제거
       └─ 편집 트랙 렌더 지점
            ├─ 플래그 off → 기존 3컬럼 편집기 (불변)
            └─ 플래그 on  → <FloatingEditor {...floatingEditorProps}/>
                 props = 기존 editorText·useMarginReview()·CORE_PERSONAS·beats·stats
```
- 플래그 읽기는 StoryXDesk 안에서 1회 상수화(`new URLSearchParams(location.search).get('editor')==='floating'`). Phase 2에서 이 조건을 기본값으로 뒤집으면 스왑.
- **단일 원천 재사용** — editorText·useMarginReview 훅·페르소나는 StoryXDesk에 이미 인스턴스화돼 있음. FloatingEditor는 추가 인스턴스를 만들지 않는다.

## 4. Props 계약 (`FloatingEditorProps` 재설계)
시안 상수 제거, 전부 props 주입. 순수 표현 컴포넌트.
```ts
interface FloatingEditorProps {
  // 헤더 메타
  title: string; episodeLabel: string; kicker: string;
  charCount: string; chapterTitle: string; chapterSub: string;
  // 본문(읽기)
  paragraphs: Paragraph[];          // splitIntoParagraphs(editorText) — { anchor:'p1', text }
  // 검토
  reviews: MarginReview[];          // useMarginReview().reviews (pending 포함)
  personas: PersonaCard[];          // CORE_PERSONAS (id·name·role·tint) 단일 원천
  onSummon: (personaId: string, ctx: { selectedText?: string; anchor?: string }) => void;
  onRunAll: () => void;
  onAcceptDiff: (diff: InlineDiff) => void;
  onRejectReview: (review: MarginReview) => void;
  // 좌측 패널
  beats: ChapterBeat[];             // latestChapter.beats
  activeBeatId?: string;
  onSelectBeat: (id: string) => void;
  stats: { words: number; chapters: number; canon: number; characters: number };
  intentMemo: string;               // draftPrompt(쇼러너 의도) — 읽기 표시
}
```
실제 타입 출처 — `MarginReview`·`InlineDiff`·`Paragraph` = `src/lib/marginReview.ts`, `PersonaCard`·`CORE_PERSONAS` = `src/lib/extendedPersonas.ts`, `MARGIN_CORE_AGENT_IDS` = `src/lib/agentSeedData.ts`, `ChapterBeat` = `src/lib/storyEngine.ts`.

## 5. 시안 → 실데이터 매핑
| 시안(제거) | 실데이터(대체) |
|---|---|
| `PersonaKey 'show'·'char'·'world'·'style'·'cont'` | `ValidationAgentId 'showrunner'·'character-custodian'·'world-keeper'·'genre-stylist'·'continuity-editor'` (MARGIN_CORE_AGENT_IDS 순서) |
| 시안 페르소나 라벨/색 하드코딩 | `CORE_PERSONAS` — 라벨 실제로 바뀜("캐릭터 담당"→"캐릭터 큐레이터" 등). 색은 `persona.tint`를 `--p-*`로 인라인 주입 |
| `ReviewDatum { txt, was, is, reply }` | `MarginReview { head, body, severity, anchor, diffs:[{paragraph,from,to}], pending? }` |
| `present`/`stateMap` 로컬 상태 | `reviews`에서 파생(persona별 review 존재 + pending). 로컬 제거 |
| `callOne(key)` | `onSummon(personaId, { selectedText, anchor })` |
| `assignAll` 순차 타이머 애니 | `onRunAll()` — pending review 즉시 표시 후 확정 도착 교체(StoryXDesk가 partial로 채움) |
| `resolveReview(key, ok)` | ok → `onAcceptDiff(diff)` (review.diffs), no → `onRejectReview(review)` |
| `SAMPLE_BODY` 단락 | `paragraphs` — anchor(p1…)로 단락 마크/밑줄 매칭 |
| 좌측 4-li 트리·고정 곡선·고정 4셀·고정 메모 | `beats`·beats 기반 곡선·`stats`·`intentMemo` |

UI 전용 로컬 상태는 유지 — `openPanel·detailKey·isFocus·marginTops·pop`(순수 표현 로직).

곡선 명세(모호성 제거) — 시안의 고정 SVG path를 `beats` 순서 기반 단순 곡선으로 대체(균등 분포 포인트로 polyline/곡선 생성). 정밀 긴장도 점수 계산은 범위 밖이며, `beats` 비면 빈 곡선. `Paragraph`·`ChapterBeat`의 정확한 필드명은 정의 파일(`marginReview.ts`·`storyEngine.ts`)을 단일 진실원천으로 구현 시 확정.

## 6. 범위 밖(데모 유지) — 명시
- 모드탭 "데이터", "출간", "초안 생성" 버튼 = `toast` no-op 유지(라벨만 실제와 정합).
- 자유 타이핑·의도 메모 쓰기-백 = Phase 2.
- 반영 diff은 StoryXDesk `acceptMarginDiff`가 editorText를 고쳐 되돌리므로 읽기 본문에서도 정상 동작.

## 7. 빈/에러 상태
- `reviews` 빈 → 여백 비고 0, 본문만 렌더.
- `paragraphs` 빈(원고 없음) → 빈 시트 + 초안 생성 안내(toast).
- persona lookup 실패 → `findPersona` 회색 fallback.
- anchor 미매칭 review → StoryXDesk `resolveRunReviewAnchor` 분산 결과 신뢰(시안 round-robin 제거).

## 8. 테스트 전략 (TDD)
- 신설 `src/components/floatingEditor.test.ts` — 실 props mock 렌더(jsdom)로 구조 단언:
  - `reviews` → 여백 비고 개수·persona 라벨·`severity` 표시.
  - `diffs` → detail의 was/is 렌더.
  - `anchor` → 해당 단락 마크/밑줄 매칭.
  - 클릭 시뮬 → `onSummon`/`onRunAll`/`onAcceptDiff`/`onRejectReview` 올바른 인자 호출.
  - 빈 `reviews`/빈 `paragraphs` 안전.
- 기존 `src/editorFocusLayout.test.ts` = 기본 경로(플래그 off) 단언이라 불변. 가능하면 "floating 분기가 기본 경로 출력을 바꾸지 않음" 단언 1개 추가.
- 게이트 — `npx tsc --noEmit` 0 · `npm test` green · `npm run build` · `?stage=editor&editor=floating` 4해상도(360/768/1024/1440) 캡처 비교(레이아웃 보존, 데이터만 실제로).

## 9. 파일별 변경 (구현 계획 입력)
- `src/components/FloatingEditor.tsx` — `SAMPLE_*` 제거, `FloatingEditorProps` 재설계, 시안 상태→props/콜백 배선, 페르소나 tint 인라인.
- `src/StoryXDesk.tsx` — 편집 트랙 렌더 지점에 floating 분기 + `floatingEditorProps` useMemo 조립(기존 상태/훅 재사용).
- `src/App.tsx` — `?editor=floating` standalone 분기 제거(7줄 되돌림), import 정리.
- 신설 `src/components/floatingEditor.test.ts`.
- 갱신 `docs/storyx-floating-editor-plan.md` 체크리스트(단계 1 데이터 배선 완료 표기) — 구현 완료 후.

## 10. 위험·완화
- StoryXDesk props 조립부 비대 → `floatingEditorProps` useMemo 한 객체로 묶어 분기 가독성 유지.
- 시안→실 매핑에서 persona 순서/색 드리프트 → CORE_PERSONAS 단일 원천만 사용(시안 색 하드코딩 전면 제거).
- 시각 회귀 → `.fc-*` 레이아웃 CSS 불변, 데이터만 교체. 4해상도 캡처 비교.
- StoryXDesk(3,772줄) 수정 위험 → 분기는 순수 additive, 기본 경로 미변경. tsc·기존 테스트·시각 비교로 보증.

## 11. 완료 기준
- `?editor=floating`이 실 원고·실 5 페르소나(실 라벨)·실 검토(호출·전체검토·반영/보류 diff)로 동작.
- 시안 데이터(`SAMPLE_*`) 코드에서 제거.
- `floatingEditor.test.ts` green + 기존 게이트 전부 green.
- 4해상도 레이아웃 시안 대비 보존(데이터만 실제로).
- 기본 편집기(StoryXDesk) 경로 무변경.
