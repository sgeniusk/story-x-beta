# C7 — 순문학 작가 · literary 모드 단편

## 1. 페르소나 카드

- 이름: 문해원
- 배경: 문예지 등단 후 단편 위주로 쓰는 순문학 작가.
- 숙련도: 프로
- 이번 목표: commercial↔literary 슬라이더를 문학 쪽으로 두는 조건의 단편을 확인한다.
- 특히 깐깐하게 보는 것: 침묵과 모호함이 살아있는가, 사물 반복이 교훈으로 납작해지지 않는가.

## 2. 수행 절차 타임라인

- 19:23 — `http://127.0.0.1:5176/?editor=floating`에서 랜딩과 온보딩 진입점을 확인했다.
  - 스크린샷: `screenshots/c7-01-landing-editor-entry.png`
  - 스크린샷: `screenshots/c7-02-onboarding-before-editor.png`
- 19:24 — `에디터로` 버튼을 통해 floating editor로 진입했다. 기존 C1 작품이 열렸으나 본문은 수정하지 않았다.
  - 스크린샷: `screenshots/c7-03-floating-editor.png`
- 19:24 — `지표` 패널을 열고 `매체 투사` 카드를 펼쳤다. `commercial`/`literary` 축 range input이 실제로 노출된다. 현재 origin에는 C1 작품이 저장되어 있어 슬라이더 값을 움직이면 기존 localStorage를 바꾸므로, 값 변경은 하지 않았다.
  - 스크린샷: `screenshots/c7-04-metrics-slider.png`
  - 스크린샷: `screenshots/c7-05-media-axis-expanded.png`
  - 관찰값: `input[type="range"]` value `50`, min `0`, max `100`, rect `264x16`.
- 19:24 — 문학 가중치 조건은 CLI context로 명시해 보조 draft를 생성했다.
  - 실행: `npm run storyx -- draft --provider codex --medium novel --format short-story --title "빈 컵을 씻는 사람" ... --context "storyMode: commercialWeight=0.1, literaryWeight=0.9..." --out-dir docs/reviews/2026-06-11-codex-validation-desk/runs/c7`
  - 산출물: `runs/c7/drafts/2026-06-11T10-24-00-603Z-codex-draft.json`
- 19:25 — CLI draft 완료. 제목 `빈 컵을 씻는 사람`.
  - 원문 발췌:
    > 마지막 손님은 오후 세 시 반에 나갔다. 여탕 쪽 문이 한 번 삐걱이고, 젖은 슬리퍼 끄는 소리가 복도 끝에서 멎었다. 그 뒤로 목욕탕은 물이 빠져나간 욕조처럼 낮고 빈 소리만 품었다.
  - 원문 발췌:
    > 컵 바닥에는 동그란 물때가 얇은 달처럼 붙어 있었다. 아무리 문질러도 가장자리만 흐려질 뿐 중심은 남았다. 딸은 손톱으로 긁다가 멈추었다.
  - 원문 발췌:
    > 그는 컵을 헹구지 않았다. 대신 젖은 행주로 바깥만 한 번 닦고, 창가의 좁은 턱 위에 올려놓았다. 컵 안쪽의 갈색 고리는 그대로였다.

## 3. 축별 판정

- 축③ 문체·한국어: 통과. 물때, 타일 틈, 컵의 이 빠진 자리 같은 사물이 감정 설명을 대신한다.
- 축④ 장르·매체 적합: 수정. 문학적 산문 자체는 좋지만, 실제 UI에서 literary 쪽으로 값을 바꾸는 검증은 기존 작품 localStorage 보호 때문에 수행하지 않았다. 별도 새 origin에서 slider 변경과 품질 게이트 반영을 다시 봐야 한다.

## 4. 알려진 이슈 재발 집계

- P1 쇼러너 검토 빈응답: 해당 없음
- P7 fork 시드 의도메모 잔류: 해당 없음
- stake 문자열 드리프트: 0회
- codex transient 폴백 stderr/prose 누수: 0회
- 생성 시간 회차 누적 증가: 단편 1건만 생성

## 5. 이 셀에서 나온 finding ID

- F-008

