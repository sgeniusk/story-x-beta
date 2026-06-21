<!-- AI 누수 방지 게이트(B1) 구현 plan — TDD task 시퀀스 -->

# AI 누수 방지 게이트 (B1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax. spec 정본 — `docs/superpowers/specs/2026-06-21-ai-leak-gate-design.md`.

**Goal:** 회차 확정(잠금) 직전에 프롬프트/지시문 누수를 결정론으로 검출해 차단하고, AI 상투구는 경고한다.

**Architecture:** 신규 `leakGate.ts` 순수 모듈(`detectPromptLeak` 4범주 + `inspectLeak`, 상투구는 `koreanVoiceGate` 재사용) → `qualityGates` 게이트 추가 → `confirmChapterLock` 차단 배선 + FloatingEditor 배너.

**Tech Stack:** TypeScript · Vitest · React.

---

## File Structure
- Create: `src/lib/leakGate.ts` — 누수 탐지 순수 모듈(결정론)
- Create: `src/lib/leakGate.test.ts` — 단위 테스트(4범주 양성 + 오탐 가드 + blocked + 빈)
- Modify: `src/lib/qualityGates.ts` — `gate_prompt_leak`(common/blocking) + `GateInput.promptLeakCount`
- Modify: `src/lib/qualityGates.test.ts` — 게이트 케이스
- Modify: `src/StoryXDesk.tsx` — `leakBlock` state + `confirmChapterLock` 차단 + floatingEditorProps
- Modify: `src/components/FloatingEditor.tsx` — `leakBlock` prop + 차단 배너
- Modify: `src/components/floatingEditor.test.ts` — 차단 배선/배너 핀
- Modify: `src/styles.css` — `.ep-leak-banner` 다크 토큰
- Modify: `progress.md` · `feature_list.json` — B1 done

---

## Task 1: `leakGate.ts` 순수 모듈 (TDD)

**Files:** Create `src/lib/leakGate.ts`, `src/lib/leakGate.test.ts`

인터페이스:
```ts
export type PromptLeakKind = 'llm-meta' | 'english-ai' | 'role-marker' | 'markdown-residue';
export interface PromptLeakHit { kind: PromptLeakKind; evidence: string; index: number; }
export interface LeakReport { promptLeaks: PromptLeakHit[]; clicheFlags: KoreanVoiceFlag[]; blocked: boolean; }
export function detectPromptLeak(text: string): PromptLeakHit[];
export function inspectLeak(text: string): LeakReport;
```

- [ ] **Step 1: 실패 테스트** — `leakGate.test.ts`:
  - `llm-meta` 양성: `"물론입니다, 다음 장면을 작성하겠습니다.\n\n비가 내렸다."` → kind 'llm-meta' hit ≥1
  - `english-ai` 양성: `"As an AI, I cannot continue. 그는 걸었다."` → 'english-ai' hit
  - `role-marker` 양성(줄 시작): `"사용자: 다음 회차 써줘\n\n그녀는 멈췄다."` → 'role-marker' hit
  - `markdown-residue` 양성: `"## 1장\n\n- 첫째\n- 둘째\n- 셋째"` → 'markdown-residue' hit
  - **오탐 가드(음성)**: `"그는 물론 그녀를 사랑했다. 다음 날 아침이 밝았다."` → promptLeaks 0 ('물론'·'다음' 단독은 누수 아님)
  - `inspectLeak`: 누수 본문 → `blocked === true`; 깨끗한 본문 → `blocked === false`, `promptLeaks.length === 0`
  - 빈 텍스트 `""` → promptLeaks 0, blocked false
- [ ] **Step 2: RED** — `npx vitest run src/lib/leakGate.test.ts` → import 실패(모듈 없음)
- [ ] **Step 3: 구현** — `leakGate.ts`. 패턴 배열(spec §탐지 패턴):
  - `LLM_META` = `[/물론입니다/, /알겠습니다[,，]/, /다음은[^\n]{0,40}입니다/, /(작성|쓰)겠습니다/, /요청하신\s*대로/, /도움이\s*되었기를/]`
  - `ENGLISH_AI` = `[/\bas an AI\b/i, /\bas a language model\b/i, /\bI cannot\b/, /\bI can't\b/, /\bsure,\s*here\b/i, /\bcertainly,/i, /\bhere(?:'s| is) the\b/i, /\bI hope this helps\b/i, /\bI apologize, but\b/i]`
  - `ROLE_MARKER` = 줄 시작 `^\s*(사용자|어시스턴트|system|user|assistant|프롬프트)\s*[:：]` + `/\[지시/` + `/<\|/`
  - `markdown-residue`: 줄 시작 `## `/`### `/```` ``` ```` 또는 줄 시작 리스트 마커(`- `/`* `/`\d+. `)가 **연속 3줄 이상**
  - 각 매치를 `{ kind, evidence(매치 문자열 slice), index }` 로. `inspectLeak` = `detectPromptLeak` + `inspectKoreanVoice(text).flags` → `clicheFlags`, `blocked = promptLeaks.length > 0`.
- [ ] **Step 4: GREEN** — `npx vitest run src/lib/leakGate.test.ts` → PASS
- [ ] **Step 5: 커밋** `feat(quality): leakGate 순수 모듈 — 프롬프트 누수 4범주 결정론 탐지 (B1)`

## Task 2: `qualityGates` 게이트 (TDD)

**Files:** Modify `src/lib/qualityGates.ts`, `src/lib/qualityGates.test.ts`

- [ ] **Step 1: 실패 테스트** — `qualityGates.test.ts`:
  - 누수 본문(`promptLeakCount: 1` 또는 누수 text) → `gate_prompt_leak` result `passed false` · `requirement 'blocking'` · `blockingPassed false`
  - 깨끗한 본문(`promptLeakCount: 0`) → `gate_prompt_leak` `passed true`
- [ ] **Step 2: RED** — `npx vitest run src/lib/qualityGates.test.ts` → 새 케이스 FAIL
- [ ] **Step 3: 구현** — `GateKey` 에 `'gate_prompt_leak'` · `GateInput` 에 `promptLeakCount?: number` · `GATE_DEFS` 에 `{ key:'gate_prompt_leak', track:'common', evaluate: (i)=> resolvePromptLeakCount(i)===0, passReason, failReason }` · `resolvePromptLeakCount(input)`(promptLeakCount 우선, 없으면 `detectPromptLeak(text).length`). `import { detectPromptLeak } from './leakGate'`.
- [ ] **Step 4: GREEN** — PASS
- [ ] **Step 5: 커밋** `feat(quality): gate_prompt_leak — 누수 본문 회차 품질 blocking (B1)`

## Task 3: 확정 차단 배선 + 배너 (TDD)

**Files:** Modify `src/StoryXDesk.tsx`, `src/components/FloatingEditor.tsx`, `src/components/floatingEditor.test.ts`, `src/styles.css`

- [ ] **Step 1: 실패 테스트** — `floatingEditor.test.ts`:
  - `leakBlock` prop 있으면 `.ep-leak-banner` 렌더 + 누수 evidence 인용 표시
  - StoryXDesk 소스 핀: `confirmChapterLock` 이 `inspectLeak` 호출 + `blocked` 면 `lockChapter` 미호출(setLeakBlock) — `desk.indexOf('function confirmChapterLock')` 윈도우에 `inspectLeak`·`setLeakBlock` 포함
- [ ] **Step 2: RED** — `npx vitest run src/components/floatingEditor.test.ts` → FAIL
- [ ] **Step 3: 구현**
  - `StoryXDesk`: `const [leakBlock, setLeakBlock] = useState<LeakReport | null>(null);` · `confirmChapterLock` 진입에 대상 회차 prose(`project.chapters.find(c=>c.id===chapterId)?.prose ?? ''`) 로 `const report = inspectLeak(prose); if (report.blocked) { setLeakBlock(report); return; } setLeakBlock(null);` 이후 기존 lockChapter. floatingEditorProps 에 `leakBlock` 추가. `import { inspectLeak, type LeakReport } from './lib/leakGate'`.
  - `FloatingEditor`: `leakBlock?: LeakReport` prop. header 다음(canvas 전 또는 ep-kicker 위)에 `{leakBlock && <div className="ep-leak-banner">…누수 N건 + evidence 인용 + "본문에서 제거 후 다시 확정"…{clicheFlags.length>0 && 경고 보조줄}</div>}`.
  - `styles.css`: `.ep-leak-banner`(코랄 계열 경고 토큰, 기존 `.ep-locked-banner` 패턴 차용 — `--sx-*` 다크).
- [ ] **Step 4: GREEN** — PASS
- [ ] **Step 5: 커밋** `feat(quality): confirmChapterLock 누수 차단 + 차단 배너 (B1)`

## Task 4: 검증 + 상태 갱신

- [ ] **Step 1: init.sh** — `bash init.sh` → tsc 0 · vitest 전부 GREEN(신규 +N) · build 통과
- [ ] **Step 2: 라이브(preview)** — 누수 본문("물론입니다, 다음 장면…") 회차 주입 → 편집 모드 → "이 회차 확정" 클릭 → `.ep-leak-banner` 렌더·잠금 안 됨(latestLocked false 유지)·콘솔 0. 깨끗한 본문으로 고치면 확정 통과. 스크린샷.
- [ ] **Step 3: 상태 갱신** — `progress.md` 최근 검증 블록 + `feature_list.json` B1 `done`(evidence 커밋 SHA·파일). `session-handoff.md` 맨 위 인계 노트.

---

## Self-review
- **spec 커버리지** — 목표(차단·경고·품질리포트) → Task 1/2/3 매핑. 비목표(ML 탐지·인라인 미리보기·다국어) 제외 유지.
- **타입 일관성** — `PromptLeakHit`·`LeakReport`·`detectPromptLeak`·`inspectLeak` 전 task 동일. `promptLeakCount` GateInput 일관.
- **오탐 가드** — Task 1 음성 테스트가 '물론/다음' 단독 정상어 보호.
