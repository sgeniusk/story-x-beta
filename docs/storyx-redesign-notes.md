# Story X 리디자인 — 컨텍스트 노트

## 결정

- 사용자 지시 — 디자인 전체 반영(에디터 P1~P5 + 라이트 Notion DS). 브랜드 톤도 새 디자인으로.
- 기존 마케팅 CSS는 이미 라이트(warm cream `--framer-*`). 디자인은 순백 캔버스 + 네이비 히어로 + purple로 교체.
- 충돌 회피 — 디자인의 `.site-nav`는 기존 죽은 코드(`CreativeGateway`)와 겹쳐 `.landing-topnav`로 개명. 나머지 디자인 클래스명은 고유해 그대로 사용.
- 기존 마케팅 CSS(styles.css 8260~EOF)는 컴포넌트가 새 클래스로 옮겨가면 죽은 코드가 된다. 전 화면 이전 후 일괄 정리.

## 현재 코드 구조

- `App.tsx` — `MarketingLanding`(305~), `LoginScreen`(692~), `ProjectHub`(719~), `StoryXHome`(774~). `CreativeGateway`/`BlueprintRoom`/`DevelopmentRoom` 등 1342행 이후는 메인 플로우 미사용(죽은 코드).
- `StoryXDesk.tsx` — 에디터(3549행). P1~P5 적용 대상.
- `styles.css` — `:root` 3개(4, 2397, 8260행). 8260~EOF가 마케팅/홈/목록.

## 진행 로그

- 2026-05-17 — 핸드오프 번들 검토 완료. 단계 1(랜딩) 착수.
