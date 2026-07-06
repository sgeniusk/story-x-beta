# Serial Story Studio

이 프로젝트는 한국어 장편 연재 스튜디오다. 연속성(continuity)을 편집 마무리가 아니라 제품 요건으로 다룬다.

## Startup (코딩 에이전트 진입 순서)

새 세션 시작 시 다음 순서로 컨텍스트를 잡는다.

1. `progress.md` — 현재 활성 작업·다음 한 단계·차단 사항·직전 검증 결과.
2. `feature_list.json` — 모든 마일스톤(M1~M7)의 상태·의존성·완료 기준. 활성 작업의 `id`는 progress.md와 일치한다.
3. `session-handoff.md` — 가장 최근 인계 노트(맨 위). 손대지 말 것·다음 세션이 해야 할 한 가지가 들어 있다.
4. `bash init.sh` — 환경·타입·빌드·테스트가 통과하는 상태에서 시작하는지 확인. **변경 전에 한 번, 완료 주장 전에 한 번.**
5. 이 파일과 `AGENTS.md` — 도메인·디자인·운영 규칙.

상위 로드맵은 `~/.claude/plans/x-zippy-graham.md`에 있다.

## Definition of Done

다음 모두를 만족해야 작업을 완료라고 부른다.

- `npm test` — 전체 통과(녹색). 절대 테스트 수치는 박제하지 말고 `progress.md` '최근 검증' 한 곳에서만 관리한다.
- `npm run build` — `tsc --noEmit && vite build` 성공.
- 활성 feature 의 `progress.md` 항목이 증거(커밋 SHA·파일 경로·캡처 경로)와 함께 `done`으로 갱신됨.
- 새 생성 동작은 `src/lib/storyEngine.test.ts` 테스트를 먼저 수정해 TDD 순서를 따른다.
- 디자인 토큰 규율 — 랜딩 `--lc-*`(Linear 다크)·브리지 `--nx-*`(라이트)는 유지, 스튜디오(셸·PLAY·WRITE·PLAN)는 전역 `--st-*` warm 토큰이 값 원천이며 `--sx-*`는 여기에 매핑한다(2026-07-07 핀 완화, 사용자 결정). 새 transition/animation 은 `--st-dur-*`/`--st-ease` 만 쓴다.
- 세션 종료 시 `session-handoff.md` 맨 위에 새 인계 노트를 한 묶음 추가한다.

## State Artifacts

| 파일 | 역할 |
|---|---|
| `progress.md` | 현재 활성 작업·다음 단계·증거 |
| `feature_list.json` | 마일스톤 그래프·상태·완료 기준 |
| `session-handoff.md` | 세션 인계 노트(최신이 맨 위) |
| `init.sh` | fail-fast 검증 진입점 (tsc·vitest·vite build) |
| `docs/storyx-harness-architecture.md` | **스토리 하네스** 정본 설계 — 코드 하네스(이 파일들)와 별개 |
| `AGENTS.md` | 스토리 craft 에이전트 운영 모델·Codex 호환 가이드 |
| `~/.claude/plans/x-zippy-graham.md` | 0.2→1.0 마스터 플랜 |

## Operating Rules

- `docs/agent-system.md` 를 먼저 읽고 스토리 워크플로를 바꾼다.
- `src/lib/storyEngine.ts` 의 스토리 바이블 형태(characters, world rules, canon facts, open threads, chapters)를 보존한다.
- 새 생성 동작은 `src/lib/storyEngine.test.ts` 의 테스트를 먼저 갱신한다.
- Claude Code 사용 시 `.claude/agents/` 의 프로젝트 서브에이전트를 장편 작업에 우선 사용한다.
- 한국어 UI 카피는 간결·실용 위주. 첫 화면은 일하는 스튜디오로 유지한다.
- 연속성 검사를 약화시켜 생성을 깔끔해 보이게 만들지 않는다 — 충돌은 드러낸다.

## Recommended Agent Chain

1. `serial-showrunner`
2. `character-custodian`
3. `world-keeper`
4. `genre-stylist`
5. `continuity-editor`

최종 산출에는 회차 초안, 사용된 메모리 앵커, 새 캐논 사실, 연속성 위험이 포함되어야 한다.

## 두 종류의 "하네스"

이 프로젝트에는 이름이 같은 두 시스템이 있다 — 혼동 금지.

- **코드 하네스** — 이 파일 + `progress.md` + `feature_list.json` + `init.sh` + `session-handoff.md`. AI 코딩 에이전트가 작업을 시작·검증·재개하기 위한 구조.
- **스토리 하네스** — `docs/storyx-harness-architecture.md`. LLM이 좋은 이야기를 만들도록 강제·검증하는 도메인 시스템(`storyOntology`·`continuityContract` 등).
