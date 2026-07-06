# Story X 디자인 토큰 매핑 (M9 핸드오프용)

> ⚠️ **2026-07-07 이후 스테일** — 핀 완화(사용자 결정)로 스튜디오 값 원천이 전역 `--st-*` warm oklch 토큰(styles.css `:root`, "스튜디오 공통 토큰" 블록)으로 바뀌었고 `--sx-*` 는 여기에 매핑된다. 아래 `.sx-desk` Linear 다크 리터럴 표는 역사 기록으로만 남긴다. 최신 규율은 CLAUDE.md "디자인 토큰 규율" 항목이 정본.

> 외주 디자이너에게 전달하는 토큰 현황 — 어떤 토큰이 어디서 어떤 화면을 색칠하고, 갈아낼 때 어디를 건드리면 되는지 한 장에 정리. 모든 라인 번호는 `src/styles.css` 기준.

## 한 줄 요약

Story X 의 색·간격·라운드는 4개의 토큰 레이어로 갈라져 있다.

| 레이어 | prefix | 정의 위치 | 적용 범위 | 모드 |
|---|---|---|---|---|
| Story X 의미 토큰 | `--sx-*` | :root 435~466 / `.sx-desk` 533~568 | 스튜디오(에디터·바이블·검토) | 항상 다크 |
| Bridge UI 토큰 | `--nx-*` | :root 7927~7953 / `.home-page` 9122~9133 | 로그인·프로젝트·홈 4 step | 기본 라이트, 홈만 다크 오버라이드 |
| Linear cascade | `--lc-*` | `.landing-page` 7960~7973 / `.landing-page.is-light` 8011~8023 | 마케팅 랜딩 + 매체 브릿지 hero | 낮↔밤 토글 (`storyx.landingTheme` 영속) |
| 사용자 트윅 | `--sx-brand` 동적 / `--sx-page` 동적 | `.sx-desk` 인라인 style | 스튜디오 강조색·캔버스 톤 | 5색 × 3톤 localStorage |

이 4 레이어가 **부분적으로 cascade 되고 부분적으로 충돌**한다. 다음 절에서 정확한 매핑.

---

## 1. `--sx-*` — Story X 의미 토큰

### 1-1. :root 라이트 (styles.css:435~466)

전역에서 한 번 정의. 스튜디오 밖(랜딩·브릿지·홈)에서도 polyfill 로 살아 있지만 실제 색 결정은 다른 레이어가 함.

```css
:root {
  /* Spacing / radius / weight (모든 화면 공통 — 손대지 말 것) */
  --sx-radius-xs: 6px; --sx-radius-sm: 10px; --sx-radius-md: 15px;
  --sx-radius-lg: 22px; --sx-radius-pill: 100px;
  --sx-weight-regular: 450; --sx-weight-medium: 560;
  --sx-weight-semibold: 650; --sx-weight-bold: 760; --sx-weight-display: 820;
  --sx-space-1: 4px;  --sx-space-2: 8px;  --sx-space-3: 12px;
  --sx-space-4: 16px; --sx-space-5: 20px; --sx-space-6: 24px;
  --sx-space-8: 32px; --sx-space-12: 48px;
  --sx-space-marketing-lg: 80px; --sx-space-marketing-xl: 120px;

  /* 페이퍼·잉크 (라이트 — 토픽바·일부 카드 잔여) */
  --sx-ink-strong: #20201e;
  --sx-ink-muted:  #6f6a62;
  --sx-paper-warm: #f7f5ef;
  --sx-paper-warm-soft: #efede6;
  --sx-paper-card: #ffffff;
  --sx-line-soft: rgba(32, 32, 30, 0.09);
  --sx-line-warm: rgba(32, 32, 30, 0.14);
  --sx-accent: #4f8f9d;   /* 청록 — 라이트 컨텍스트 강조 */
}
```

**손대도 OK** — 잉크/페이퍼/액센트는 외주 자유. spacing·radius·weight 는 컴포넌트 전반에 박혀 있어 그대로 두는 게 안전.

### 1-2. `.sx-desk` 다크 (styles.css:533~568)

스튜디오 진입 시 `<div className="sx-desk">` 가 토큰을 통째 덮어쓴다. 그 안에서 `--sx-*` 는 모두 Linear 다크 값.

```css
.sx-desk {
  --sx-ink:           #f7f8f8;
  --sx-ink-2:         rgba(247, 248, 248, 0.82);
  --sx-muted:         rgba(247, 248, 248, 0.58);
  --sx-faint:         rgba(247, 248, 248, 0.28);
  --sx-line:          #23252a;
  --sx-line-2:        #23252a;
  --sx-line-strong:   #323334;
  --sx-paper:         #08090a;   /* pitch — 최외곽 */
  --sx-paper-soft:    #0f1011;   /* graphite — 카드 */
  --sx-paper-2:       #161718;   /* slate — 강조 카드 */
  --sx-surface-strong:#23252a;
  --sx-card:          #0f1011;

  /* 브랜드 — 라임 CTA */
  --sx-brand:      #e4f222;
  --sx-brand-press:#ecfa44;
  --sx-brand-tint: rgba(228, 242, 34, 0.12);
  --sx-brand-ink:  #08090a;

  /* 액센트 — 보라 (포커스·링크) */
  --sx-accent:      #5e6ad2;
  --sx-accent-soft: rgba(94, 106, 210, 0.14);

  /* 원고 페이지 — 더 짙은 slate */
  --sx-page:          #161718;
  --sx-page-soft:     #1a1b1c;
  --sx-page-line:     #23252a;
  --sx-page-ink:      #f7f8f8;
  --sx-page-ink-soft: #8a8f98;
  --sx-page-ink-mute: #62666d;

  /* AI 스테이지 파스텔 — 작가진 검토 단계 색 (의미 보존, 손대면 의미 변형됨) */
  --sx-stage-think:  #dfa88f;  /* 살구 — 1.생각 */
  --sx-stage-read:   #9fbbe0;  /* 하늘 — 2.읽기 */
  --sx-stage-mark:   #9fc9a2;  /* 연두 — 3.표시 */
  --sx-stage-write:  #c0a8dd;  /* 라일락 — 4.쓰기 */
  --sx-stage-done:   #c08532;  /* 호박 — 5.완료 */
  --sx-stage-queued: #62666d;  /* 회색 — 대기 */

  /* 상태 */
  --sx-warn: #c08532;
  --sx-good: #27a644;
  --sx-err:  #eb5757;

  /* nx-* cascade — .sx-desk 내부 어디서든 var(--nx-primary, ...) 폴백이 라임을 따라오게 */
  --nx-primary:       var(--sx-brand);
  --nx-primary-hover: var(--sx-brand-press);

  /* 폰트 */
  --font-serif: 'Source Serif Pro', 'Noto Serif KR', Georgia, serif;
  --font-mono:  'JetBrains Mono', ui-monospace, SFMono-Regular, 'Menlo', monospace;
}
```

**손대지 말 것** — `--sx-stage-*` 6색. 작가진 검토 단계 의미(생각·읽기·표시·쓰기·완료·대기)에 묶여 있어 색을 바꾸면 진행 표시가 거짓말이 된다.

**갈아내도 좋은 항목** — `--sx-brand`(라임 CTA), `--sx-accent`(포커스 보라), `--sx-paper*` 명도 ramp, `--sx-line*` 두께/색.

### 1-3. 장르 액센트 (styles.css:601~614)

`.sx-genre-*` 클래스로 캐스케이드 — 검토 단계와 무관하게 작품 장르 색.

```css
.sx-genre-romance-fantasy { --sx-accent: oklch(57% 0.15 338); }  /* 핑크 */
.sx-genre-urban-fantasy   { --sx-accent: oklch(54% 0.10 175); }  /* 청록 */
.sx-genre-noir-thriller   { --sx-accent: oklch(48% 0.08 250); }  /* 짙은 파랑 */
.sx-genre-space-opera     { --sx-accent: oklch(55% 0.12 275); }  /* 보라 */
```

OKLCH 사용 — 디자이너가 더 큰 팔레트로 확장하려면 같은 좌표계로 추가 권장.

---

## 2. `--nx-*` — Bridge UI 토큰

`.login-page` · `.pjx-page` · `.home-page` 3 화면이 쓴다. **기본은 라이트**(:root), 홈 4 step 만 다크 오버라이드.

### 2-1. :root 라이트 (styles.css:7927~7953)

```css
:root {
  --nx-primary:        #6448d3;   /* 보라 CTA — Notion 톤 */
  --nx-primary-hover:  #7458e8;
  --nx-on-primary:     #ffffff;
  --nx-canvas:         #ffffff;
  --nx-surface:        #f7f6f3;   /* 따뜻한 베이지 */
  --nx-surface-soft:   #f1f0ee;
  --nx-hairline:        rgba(55, 53, 47, 0.09);
  --nx-hairline-strong: rgba(55, 53, 47, 0.17);
  --nx-ink-deep:  #0f0f0f;
  --nx-ink:       #37352f;
  --nx-charcoal:  #3a3836;
  --nx-slate:     #6b6a67;
  --nx-steel:     #9e9c99;
  --nx-on-dark:        #ffffff;
  --nx-on-dark-muted:  rgba(255, 255, 255, 0.6);
  --nx-navy:           #0f1117;
  --nx-link-blue:      #2383e2;
  --nx-tint-peach:     #fff0eb;
  --nx-tint-mint:      #ecfaf4;
  --nx-tint-lavender:  #f0eeff;
  --nx-r-sm: 6px;  --nx-r: 8px;  --nx-r-lg: 12px;  --nx-r-full: 9999px;
  --nx-sh-subtle: rgba(15, 15, 15, 0.04) 0 1px 2px 0;
  --nx-sh-card:   rgba(15, 15, 15, 0.08) 0 4px 12px 0;
  --nx-sh-mockup: rgba(15, 15, 15, 0.2)  0 24px 48px -8px;
}
```

브릿지(로그인·프로젝트 허브)는 이 상태 그대로 — Notion 따뜻한 라이트.

### 2-2. `.home-page` 다크 오버라이드 (styles.css:9122~9133) — M8.5

홈 4 step (`medium` → `freewrite` → `intake` → `building`)이 같은 nx-* 키를 다크로 재정의해서 스튜디오 분위기에 가까워진다.

```css
.home-page {
  /* M8.5 — 매체·자유서술·인터뷰·빌딩 4 step Linear 다크 통일 */
  --nx-canvas:          #08090a;
  --nx-surface:         #0f1011;
  --nx-surface-soft:    #131416;
  --nx-ink:             #ededf3;
  --nx-slate:           rgba(237, 237, 243, 0.72);
  --nx-steel:           rgba(237, 237, 243, 0.50);
  --nx-hairline:        rgba(255, 255, 255, 0.06);
  --nx-hairline-strong: rgba(255, 255, 255, 0.14);
  --nx-primary:         #6e7adb;
  --nx-tint-lavender:   rgba(110, 122, 219, 0.12);
  --nx-sh-subtle:       0 1px 0 rgba(255, 255, 255, 0.02), 0 4px 12px rgba(0, 0, 0, 0.18);
  --nx-sh-card:         0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 24px rgba(0, 0, 0, 0.28);
}
```

**12 토큰 다크 cascade** — `--nx-on-primary`·`--nx-r*`·`--nx-tint-peach/mint` 같은 잔여는 :root 라이트 그대로 살아 있다. 어색하면 외주가 추가 오버라이드.

---

## 3. `--lc-*` — Linear cascade (랜딩 전용)

랜딩(`.landing-page`) 한 화면만 사용. 낮/밤 토글로 두 ramp 사이를 오간다.

### 3-1. 다크 (styles.css:7960~7973) — 기본값

```css
.landing-page {
  --lc-pitch:     #08090a;
  --lc-graphite:  #0f1011;
  --lc-slate:     #161718;
  --lc-charcoal:  #23252a;
  --lc-ash:       #323334;
  --lc-gunmetal:  #383b3f;
  --lc-porcelain: #f7f8f8;
  --lc-steel:     #d0d6e0;
  --lc-storm:     #8a8f98;
  --lc-fog:       #62666d;
  --lc-lime:      #e4f222;
  --lc-lime-hi:   #ecfa44;
  --lc-aether:    #5e6ad2;     /* 보라 액센트 */
  --lc-page-max:  1200px;
}
```

### 3-2. 라이트 (`.landing-page.is-light` styles.css:8011~8023)

```css
.landing-page.is-light {
  --lc-pitch:     #ffffff;
  --lc-graphite:  #fafaf8;
  --lc-slate:     #f4f3ef;
  --lc-charcoal:  rgba(8, 9, 10, 0.10);
  --lc-ash:       rgba(8, 9, 10, 0.18);
  --lc-gunmetal:  rgba(8, 9, 10, 0.06);
  --lc-porcelain: #08090a;   /* ink 반전 */
  --lc-steel:     #3a3a3a;
  --lc-storm:     #6b6a67;
  --lc-fog:       #9e9c99;
  --lc-lime:      #5266eb;   /* 라임 → 보라 (라이트에선 라임이 안 읽힘) */
  --lc-lime-hi:   #6c7cf2;
}
```

### 3-3. 라이트일 때도 mockup 은 다크 강제 (styles.css:8025~8037)

```css
.landing-page.is-light .hero-showcase {
  --lc-pitch: #08090a;  --lc-graphite: #0f1011;  --lc-slate: #161718;
  --lc-charcoal: #23252a;  --lc-ash: #323334;  --lc-gunmetal: #383b3f;
  --lc-porcelain: #f7f8f8;  --lc-steel: #d0d6e0;
  --lc-storm: #8a8f98;  --lc-fog: #62666d;
  --lc-lime: #e4f222;  --lc-lime-hi: #ecfa44;
}
```

스튜디오 mockup 자체가 항상 다크여야 제품 미리보기가 일관됨.

### 3-4. 레거시 `--mx-*` alias (styles.css:7977~7987)

이전 마케팅 변종이 쓰던 alias. 새 컴포넌트엔 쓰지 말 것. 갈아낼 때 무시.

---

## 4. 사용자 트윅 (스튜디오 강조색 · 캔버스 톤)

스튜디오 ⚙ 설정 패널에서 작가가 선택. localStorage 에 저장(`storyx.studio.accent`, `storyx.studio.canvas`). 인라인 `style` 로 `.sx-desk` 의 `--sx-brand`·`--sx-page` 를 덮어쓴다.

### 4-1. 강조색 5 종 (트윅)

| 칩 | 라벨 | hex | 의미 |
|---|---|---|---|
| 라임 (기본) | Linear lime | `#e4f222` | CTA |
| 바이올렛 | violet | `#a78bfa` 부근 | |
| 에메랄드 | emerald | `#34d399` 부근 | |
| 코랄 | coral | `#fb7185` 부근 | |
| 앰버 | amber | `#fbbf24` 부근 | |

정확한 값은 `src/StoryXDesk.tsx` 안의 chip 정의를 참고. 외주가 팔레트를 다듬을 때 5칸 모두 유지 권장(작가들이 이미 자기 작품 색을 골라 둠).

### 4-2. 캔버스 톤 3 종

| 칩 | 라벨 | `--sx-page` | 의도 |
|---|---|---|---|
| 피치 | peach | `#161718` 부근 | 기본 — Linear slate |
| 그래파이트 | graphite | 더 깊은 검정 | 야간 작업 |
| 인디고 | indigo | 푸른 슬레이트 | 차가운 분위기 |

---

## 5. 외주가 손대면 좋은 곳

우선순위 순서.

1. **`--sx-line*` 두께/색** — 좌레일 가독성 의뢰 항목 #2 와 직결. 현재 `#23252a` 가 본문 위에 약하게 깔려 있어 카드 경계가 잘 안 보임.
2. **`--sx-brand-tint`** — 라임 12% 톤이 다크 카드 위에서 너무 약함. 라임 칩 영역(예: `is-edited` 글로우, AI 활성 뱃지) 가시성 의뢰.
3. **`--sx-paper*` ramp** — pitch(`#08090a`) → graphite(`#0f1011`) → slate(`#161718`) 3 단계가 거의 같은 명도. 카드 위계가 안 보임. ramp 폭 확장 권장.
4. **AI 스테이지 6색** — 색은 의미 묶여 있지만 채도/명도는 외주 자유. 현재 다크 위에서 살구·라일락이 흐릿함.
5. **`--nx-primary` (라이트 보라 `#6448d3` ↔ 다크 `#6e7adb`)** — 브릿지/홈 다크 전환 시 두 색이 어울리지 않음. 한쪽 통일 권장.

## 6. 외주가 손대지 말 것

- `--sx-stage-*` 6색의 **의미 매핑**(생각·읽기·표시·쓰기·완료·대기) — 변경하면 진행 표시가 거짓말이 됨. 채도/명도만 손대고 hue 는 보존.
- `--sx-space-*` 8단계 — 컴포넌트 전반 spacing 에 박혀 있음.
- `--sx-radius-*` 5단계 — 동일.
- `--font-serif` 본문 폰트(`Source Serif Pro` / `Noto Serif KR`) — 원고 페이지의 정체성. 다른 serif 로 바꾸려면 한글 polish 검증 필수.

## 7. 토큰 추가 시 위치 권장

| 추가 토큰 | 권장 위치 | 이유 |
|---|---|---|
| 스튜디오 전용 새 색 | `.sx-desk` 블록 (styles.css:530~568 부근) | 다른 컨텍스트 오염 방지 |
| 브릿지 라이트 잔여 | `:root` (styles.css:7927~7953) | 본래 라인 |
| 홈 다크 추가 | `.home-page` (styles.css:9118~9147) | M8.5 묶음 위치 |
| 랜딩만 쓰는 색 | `.landing-page` (styles.css:7960~7973) | 다른 화면 침범 X |
| 모든 화면 공통 | `:root` 상단 layer (styles.css:430~466) | spacing/radius 옆 |

---

## 8. 토큰 흐름 다이어그램 (한 줄 cascade)

```
랜딩 (.landing-page)
├─ 다크: --lc-* 자체 정의
└─ 라이트(.is-light): 토큰 재정의, .hero-showcase 만 다크 강제

브릿지 라이트 (.login-page, .pjx-page)
└─ :root --nx-* 그대로

홈 4 step (.home-page)
└─ --nx-* 12개 다크 오버라이드, 나머지 :root cascade

스튜디오 (.sx-desk)
├─ --sx-* 다크 본체
├─ --nx-primary → --sx-brand cascade (572)
├─ 인라인 style 로 --sx-brand·--sx-page 사용자 트윅 (StoryXDesk.tsx)
└─ .sx-genre-* OKLCH accent 변종

퍼블리시 (PublishScreen)
└─ .sx-desk 토큰 그대로 + 앰버 액센트 변형
```

---

## 변경 이력

- 2026-05-27 — M9 핸드오프 신설. M8.5 의 `.home-page` 다크 오버라이드 12개까지 반영.
