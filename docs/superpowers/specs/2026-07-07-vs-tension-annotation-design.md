# VS 후보 흡인력 2축 주석 — 긴장 기여 배지 설계

> 2026-07-07 · 근거 = 흡인력 딥리서치 `docs/research/2026-07-05-compellingness-human-ai.md` §3 "두 해법의 결합"(서프라이즈 주입으로 재료를 넓히고 → 흡인력 기준 재순위로 좁히고 → 인간이 취향으로 선별) + 흡인력 게이트 spec `2026-07-06-compellingness-gate-design.md` §5가 후속 조각으로 명시한 "VS 후보 흡인력 재순위".
> 사용자 결정 4건(brainstorming·visual companion 목업) — ⓐ 신호 산출 = **같은 VS 콜 verbalize**(별도 재순위 콜·결정론 클라이언트 판정 기각) ⓑ 표현 = **배지, 후보 순서 불변**(무언 정렬 기각 — 확률 비노출이라 순서 변경의 근거가 화면에 없음) ⓒ canonSuspect와 **독립 병기**(긴장 먼저·앰버 캐논 맨 끝, 우선순위 단독 표시 기각) + 접근안 = **enum + 근거 한 문장 툴팁**(tensionNote).

## 1. 문제

WRITE(.fc-vs)·PLAY(.dx-vs)의 전개 후보는 현재 확률 기반 의외도(rarity) 단일 축만 보여준다. 의외도는 "얼마나 뻔하지 않은가"만 답하고 "이 방향이 이야기의 긴장을 어떻게 바꾸는가"는 답하지 않는다 — 열린 질문을 닫기만 하는 소진 방향(tension_decay_audit이 회차 단위에서 잡는 바로 그 결손)과 새 긴장을 장전하는 방향이 게이지에서 구분되지 않는다. Re3 재순위의 흡인력 기준을 VS 후보 단계로 번역하되, 리서치 열린 질문 2(자동 재순위가 인간 선별보다 낫다는 정량 근거 없음)에 따라 **자동 정렬이 아니라 주석(annotation)** 으로 얹는다 — 최종 선별권은 작가.

## 2. 변경 지점

### 2.1 데이터 계약 — `src/lib/episodeBriefing.ts`

```ts
export type VsTension = 'arms' | 'drains';
export interface VsCandidate {
  direction: string;
  probability: number; // LLM verbalize 추정, 내부용(비노출)
  rarity: VsRarity;
  canonSuspect?: boolean;
  tension?: VsTension;    // LLM verbalize — arms=새 긴장 장전 · drains=열린 질문 회수만
  tensionNote?: string;   // 판정 근거 한 문장(배지 title 툴팁), tension 유효할 때만
}
```

- `normalizeVsCandidates` 확장 — `raw.tension`이 정확히 `'arms'`/`'drains'`일 때만 필드 보존(그 외 값·누락 → 필드 자체 생략). `tensionNote`는 tension 유효 + 비어있지 않을 때만 trim 후 **120자 캡(초과분 절단, slice)** 으로 보존, tension 없는 note는 버린다.
- **조용한 강등** — LLM이 필드를 빠뜨리거나 파싱이 어긋나면 배지가 안 뜰 뿐 후보는 정상 동작(canonSuspect 선례). "무배지 = 회수만" 같은 암묵 의미를 만들지 않는다 — 회수만도 명시 배지.

### 2.2 프롬프트 — `buildVsCandidatesPrompt` (미러 3점 세트)

- `src/lib/server/promptBuilders.ts` 지시 섹션에 1줄 추가.

```
- 각 방향의 "tension"을 판정합니다 — 새 질문·위험·갈등을 장전하면 "arms", 열린 질문·약속을 닫기만 하면 "drains". "tensionNote"에는 그 판정의 근거를 한 문장으로 씁니다.
```

- 출력 JSON 계약 교체.

```
  "candidates": [{ "direction": "...", "probability": 0.0, "tension": "arms", "tensionNote": "..." }]
```

- **동시 갱신 3곳** — ① promptBuilders.ts ② `tools/storyx.mjs` buildVsCandidatesPrompt(byte-identical 미러) ③ `promptBuilders.test.ts`의 `VS_JSON_CONTRACT` 핀 상수. [vs-mirror] 테스트가 storyx.mjs 전문에서 계약 문자열을 잡는다.
- **봉인 해제 선언** — PLAY VS spec(`docs/storyx-play-vs-candidates-plan.md`)의 Non-goal "프롬프트 수정(그대로 재사용)"을 이 spec이 명시적으로 해제한다. 해제 범위는 tension 2필드뿐 — 방향 4개·꼬리 분포·결말 불가침 지시는 무변경.

### 2.3 서버·입력 조립 — 무변경

dev CLI(`vs-candidates` 커맨드)·prod Function(`api/vs-candidates.ts`) 모두 candidates를 무가공 통과시키므로 코드 손대지 않는다. 입력 조립(WRITE `handleRequestVsCandidates` 인라인 · PLAY `buildVsCandidatesInput`)과 vite 브리지도 무변경 — 프롬프트에 이미 있는 헌장 digest·최근 흐름·미회수 약속이 판정 재료로 충분.

### 2.4 UI 두 표면 — 배지 렌더

- **PLAY** `src/components/VsCandidatePanel.tsx` — `dx-vs-direction` 뒤·「캐논 확인」(`dx-vs-suspect`) 앞에 긴장 알약. `tension` 있을 때만.

```tsx
{c.tension && (
  <em className={`dx-vs-tension is-${c.tension}`} title={c.tensionNote}>
    {c.tension === 'arms' ? '새 긴장' : '회수만'}
  </em>
)}
```

- **WRITE** `src/components/FloatingEditor.tsx` `.fc-vs` 블록 — `fc-vs-dir` 뒤·`fc-fork-suspect` 앞에 동일 규칙(`fc-vs-tension is-arms|is-drains`).
- **CSS** `src/styles.css` — 기존 9px 알약 언어(`.dx-vs-suspect` 미러). arms = 청록 `#22d3ee`(배경 `color-mix(in srgb, #22d3ee 20%, transparent)`) · drains = 무채(배경 `rgba(255,255,255,0.07)`·글자 `rgba(255,255,255,0.45)`). 의미색 하드코딩은 `.dx-vs` 블록의 기존 관례(라임·로즈·앰버) 계승. **새 transition/animation 없음** — reduced-motion 블록·모션 토큰 무접촉.
- 배지 순서 고정 — 게이지(또는 rarity 알약) → direction → 긴장 → 캐논 확인(맨 끝, 기존 위치 유지).

## 3. 불변식

- **VS는 opt-in 전용** — 「✦ 전개 후보」/「전개 후보 받기」 버튼으로만 생성(자동/매 턴 금지).
- **확률 숫자 비노출** — tension은 enum 라벨이지 수치가 아니다. probability 렌더 금지 유지.
- **후보 순서 보존** — normalize·렌더 어디에도 정렬 없음(LLM 응답 순서 그대로, 정렬은 라이브 관찰 후 별도 조각).
- **선택 배관 무접촉** — PLAY `pickCandidate`→`send` 괄호 연출, WRITE `pickVsCandidate`→의도 메모 시드 그대로.
- **기존 축 무변경** — rarity 게이지·라벨, canonSuspect 판정(임계 0.65)·배지 무손상.
- **프롬프트 미러 byte-identical** — promptBuilders ↔ storyx.mjs, 계약은 핀 테스트가 문다.
- **데이터 계층 WRITE/PLAY 공유** — 타입·normalize는 episodeBriefing 한 곳, 표면은 렌더만 다름.

## 4. 테스트 계획 (TDD)

1. `episodeBriefing.test` — ⓐ `tension: 'arms'`/`'drains'` 보존 ⓑ 비정상 값(`'both'`·숫자·빈 문자열)·누락 → 필드 생략 ⓒ tensionNote trim·120자 캡 ⓓ tension 없는 tensionNote 버림 ⓔ 기존 rarity·canonSuspect·절단 단언 무손상.
2. `promptBuilders.test` — ⓐ 지시문에 `"tension"` 판정 줄 포함 ⓑ 새 JSON 계약 문자열 포함 ⓒ [vs-mirror] `VS_JSON_CONTRACT` 갱신 후 storyx.mjs 동기화 확인.
3. `vsCandidatePanel.test` — ⓐ arms → 「새 긴장」+`is-arms` ⓑ drains → 「회수만」 ⓒ tension 없으면 긴장 배지 무렌더 ⓓ arms+canonSuspect 병기(긴장 먼저·캐논 뒤 — 배지 `title`=tensionNote와 버튼 자체 `title`=캐논 경고의 공존은 의도) ⓔ tensionNote가 title로 실림.
4. `floatingEditor.test` — vsCandidates에 tension 주입 시 「새 긴장」 렌더(기존 3단언 보존).

## 5. 비목표

- 후보 자동 정렬·재순위(무언 정렬은 사용자 기각 — 라이브 관찰 후 별도 조각 후보) · 결정론 교차검증(direction↔미회수 약속 토큰 매칭, 접근안 3 — 비공개 헬퍼 export 승격 수반이라 별도) · rarity·canonSuspect 임계 조정 · VS 비용/포인트 연동 · 입력 조립·서버 코드 변경 · 게이지 형태 변경(2축 게이지 등).

## 6. 검증 (DoD)

- `npm test`·`npm run build`·`bash init.sh` 녹색.
- 라이브(preview) — 백업 주입 후 ① WRITE `.fc-vs` 후보 요청 → 실 codex 응답에 tension 필드 도착·배지 렌더 ② PLAY 「✦ 전개 후보」 → 게이지+긴장 배지 병기·hover 툴팁 ③ tension 누락 응답(또는 mock)에서 무배지 정상 동작 ④ 콘솔 에러 0.
- 후보 4개 중 「새 긴장」/「회수만」 분포가 실제 방향 텍스트와 정합하는지 눈으로 판정(rarity 정합 검증 선례).
