# 합류 기록 — Claude 검증·반영 (2026-06-11)

Codex 검증 데스크 산출물을 ORCHESTRATOR-PROMPT §8 절차대로 합류했다. 결론 — **계약 충족, P1 3건 중 1건 진성·1건 재분류·1건 재현 불가. 수정 3건 TDD 반영, 게이트 녹색.**

## 1. 무결성 게이트

- 변경 경로 — 데스크 폴더 하위만. 추적 파일 수정 0·커밋 0. (`showcase-30ch`·`.codex/` 등 동시간대 파일은 별도 트랙/설정으로 확인, 데스크 오염 아님.)
- 산출물 — 셀 로그 9/9 · findings.json 스키마 유효 · FINAL-REPORT 3섹션 · 캡처 60+. 경미한 계약 이탈 — finding ID `F-009` 결번(F-008→F-010).
- 기존 작품·백업 무손상.

## 2. P1 표본 재현 판정 (라이브, 백업 `03-hunter-branchpoint-ch1-locked.json` 주입)

| ID | 데스크 판정 | Claude 재현 결과 | 최종 판정 |
|---|---|---|---|
| F-002 잠금 후 다음 회차 생성 불가 | P1 bug | **기능 정상** — 클릭 후 ~80초에 2화 "숨을 남긴 증인" 도착. 단 생성 90초 내내 시각 피드백 0(버튼 disabled 뿐, 라벨 불변). 데스크는 12초 대기 후 차단 오판 | **P1→P2 재분류(UX)** · 수정함 |
| F-006 작가실 5인 검토 CTA 미노출 | P1 bug | **재현 불가** — 520·1280 뷰포트에서 열기/닫기/재열기·전체 검토 버튼 모두 정상. 캡처의 버튼 하이라이트는 focus 링 추정(클릭 사이 리렌더로 click 유실 — 자동화 아티팩트). 단 검토 진입점이 dock 버튼 단일이라는 취약성은 실재 | **미재현** · fallback 보강함 |
| F-007 좁은 뷰포트 온보딩 CTA 숨김 | P1 bug | **진성** — `@media (max-width:900px)`가 `.hx-aside`를 통째로 숨기는데 진행 CTA 3개가 전부 그 안. 520px에서 rect 0×0 재현 | **P1 확정** · 수정함 |

## 3. 반영한 수정 (TDD, RED→GREEN)

1. **F-002/F-004 일부** — `FloatingEditor` 메인 CTA에 `mainActionLabel` prop(첫 회차/다음 회차/검토 상태별 라벨, 매체별 라벨 포함) + `isGenerating` 시 "생성 중…" 라벨·aria-busy. `StoryXDesk` floatingEditorProps 배선.
2. **F-006 보강** — draft(floating) 모드 ⌘K가 죽은 spotlight state 대신 CommandPalette를 연다(미렌더 죽은 코드 제거). 팔레트에 `작가진 전체 검토`(run-all-review) 명령 추가 — 작가실 dock 버튼이 막혀도 검토 루프 제2 진입점.
3. **F-007** — 900px 이하에서 `.hx-aside-card`만 접고 aside(진행 버튼)는 유지, border-top 전환.

테스트 — `editorFocusLayout.test.ts` +2 · `appExperience.test.ts` +1. 라이브 — 520px 온보딩 CTA 풀폭 노출·클릭 진행 확인, floating ⌘K 팔레트에 전체 검토 노출, 메인 CTA "흐름 검증" 상태별 라벨, 콘솔 에러 0. `init.sh` 전체 녹색.

## 4. P2/P3 백로그 등재 (progress.md 백로그 참조)

F-001(인터뷰 대기 안내 현실화·진행 노출) · F-003(매체 카드 aria-label) · F-004 잔여(단독 원고 매체의 검토/수정 행동 구분) · F-005(만화 컷 수 hard constraint — 시각 바이블 규칙 채택) · F-008(literary 축 온보딩 노출 + project scope 저장 명시) · F-010(매체별 원클릭 스모크 검토).

## 5. 성장 메모리 후보 처리

- **canon 3건** — 데스크 테스트 일회용 작품(산장 스릴러·SF 단편·오디오 713번 막차) 한정이라 공용 바이블 반영 안 함. 셀 로그가 보존.
- **style/visualAudio** — 채택: "완결 지시는 rewardArc/stakesLedger 기록으로 회수 검증"(이미 제품 동작과 일치, 유지 원칙으로 확인) · "만화/인스타툰 컷 수 hard constraint"(F-005 백로그로 실행) · "에세이 [근거 필요]·사실 보호 모드 유지"(바꾸지 말 것 목록 확인).
- **failureLog** — F-002 오판 교훈을 데스크 운영 규칙으로 역반영 필요: **다음 데스크 실행 시 "생성 대기는 최소 120초" 조항 추가**. C8 stderr Codex 배너 혼입은 알려진 이슈 재발(기록만).

## 6. 미처리 / 주의

- P14(전체 검토 더블 트리거 pending 잔류, `useMarginReview`)는 쇼케이스 30화 세션이 특정한 별건 — 그 세션과 파일 충돌을 피해 여기서 손대지 않음.
- 데스크 권고 "F-002/F-006/F-007 수정 뒤 C4 8~12화 재실행"은 쇼케이스 30화 트랙이 사실상 상위 호환으로 수행 중.
