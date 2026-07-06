# 스튜디오 공통 토큰·셸·PLAY 모션 통일 (디자인 정비 슬라이스 1+2)

> 2026-07-07. 사용자 요청 "심플하지만 인터랙티브한 반응 + 세 모드 일체감 정비" 검토 후 승인된 권장안.
> 기준 팔레트 = WRITE `.fc-app` 의 warm oklch 다크를 스튜디오 공통 언어로 승격.

## 진단 요약 (검토 세션 실측)

- 3모드가 3개 디자인 시스템 — PLAY `.dx-*` 차가운 하드코딩 다크(#0b0c0e), WRITE `.fc-app` 격리 warm oklch, PLAN `.fc-app` 껍데기 + `.sx-desk` Linear 다크 내용물.
- 공통 셸 `.wm-*` 는 하드코딩 + 활성 토글이 모드 무관 보라 `#7c5cff` — 랜딩이 약속한 모드색(PLAY lime·WRITE blue·PLAN violet) 미사용.
- transition 61곳 / duration 16종 혼재. `@keyframes` 16개 중 PLAY 0개. hover — dx 3·fc 11·wm 1. `:active` 전체 1곳. focus-visible 은 sx 스코프에만.
- PLAY↔WRITE/PLAN 은 stage 하드 스왑(전환 모션 없음). WRITE↔PLAN 만 130ms 페이드.

## 결정

1. **전역 `--st-*` 토큰 신설** (`:root`) — fc-app warm oklch 팔레트 승격(surface·ink·rule·accent) + 모드색 3종(`--st-mode-play/write/plan` = 랜딩 다크 `--flow-*` 값과 동일) + 모션 스케일(`--st-dur-fast 120ms`·`--st-dur-base 160ms`·`--st-dur-slow 320ms`·`--st-ease` 단일 easing).
2. **`.fc-app` 로컬 토큰을 `--st-*` alias 로 전환** — 값 원천을 :root 한 곳으로(미러 드리프트 방지). fc 내부 사용처(수백 곳)는 무변경.
3. **`.wm-*` 셸 토큰화 + 인터랙션** — warm 배경, hover/active/focus-visible/transition, 활성 pill 을 `data-mode` 별 모드색으로. `aria-pressed` 추가.
4. **PLAY `.dx-*` 접속** — 중성 표면(#0b0c0e·#16171a·#1c1d21·#34363d 계열)만 `--st-*` 로 스왑. 의미색(쇼러너 보라·VS 라임·retcon 로즈·유저 버블 청록)은 보존. 버블·패널 등장 모션(`st-rise`)과 버튼 hover/transition 추가.
5. **stage 전환 연속감** — `.dx-desk`·`.fc-app` 마운트 진입 페이드(`st-fade-in`, `--st-dur-slow`). App 상태 기계 없이 CSS 만. `prefers-reduced-motion` 존중.

## 불변식 (지키는 것)

- **몬태주·Linear 토큰 핀 무접촉** — `styles.montage.test.ts` 가 물고 있는 `--wds-*`·`.sx-desk` Linear 다크 값은 그대로. `--st-*` 는 순수 추가.
- **PLAN 내용물(.sx-desk) 이번 범위 밖** — 슬라이스 3에서 별도(몬태주 핀·CLAUDE.md Linear 유지 조항과 얽혀 사용자 결정 필요).
- **의미색 보존** — dx 의 상태·의미 색상(승인 라임·경고 앰버·충돌 로즈)은 리팩토링하지 않는다.
- **확률 비노출·VS opt-in 등 기존 기능 불변식 무접촉** — 이번 조각은 표현 계층만.

## 검증 게이트

- `npm test`·`npm run build`·`init.sh` 녹색. 신규 토큰 계약 테스트(`styles.studio.test.ts`)와 `aria-pressed` 테스트가 물게 한다.
- 라이브 — 세 모드에서 wm-bar 활성 pill 이 모드색, hover/focus 반응, PLAY 버블 등장 모션, PLAY↔WRITE 전환 페이드, 콘솔 에러 0.
