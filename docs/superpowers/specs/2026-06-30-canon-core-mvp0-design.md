# Canon Core (MVP-0) 설계 — 중요도+관련성 검색으로 절단 소실 차단

<!-- 캐논 거버넌스 정본의 첫 구현 슬라이스. flat CanonFact head/tail 절단을 중요도·관련성 검색으로 교체해 A-6(중반 캐논 소실)을 막는다. -->

> 작성 2026-06-30 · 상태 `draft`(사용자 검토 대기) · 근거 `docs/research/2026-06-30-canon-governance.md`(§3 데이터모델·§4 중요도·§6 검색·§13 결정) · 첫 슬라이스(MVP-0). PLAY 런타임 거버넌스(배지·validator)는 후속 spec.

## 1. 목표 · 런칭 게이트

- **목표** — 캐논을 flat 사실 목록에서 **중요도·증거를 가진 사건중심 항목**으로 진화시키고, digest 절단을 **중요도 가중 + 장면 관련성 top-K 검색**으로 교체. player-first 몰입(Q2)의 토대 — PLAY가 중반 캐논을 잊지 않게.
- **런칭 게이트(측정 가능)** — *30화 규모에서 앵커 캐논이 digest에서 절대 소실되지 않는다.* 회귀 테스트로 박제 — 60+ 캐논·앵커 포함 작품에서 buildProjectContextDigest가 앵커 전부 포함 + 현재 장면 관련 캐논 포함을 단언. (A-6 실패 재현 차단.)
- **비목표(후속)** — PLAY 런타임 validator·의외전개 배지(MVP-1) · Deviation Candidate 응결 스튜디오(MVP-2) · Surprise Engine(MVP-3) · 협업 캐논(MVP-4) · 융합 셸/싱크 콘솔 UI. 이 spec은 **데이터·검색 코어**만.

## 2. 현재 코드 (진입점)

- `CanonFact { id; episode; owner('character'|'world'|'plot'|'voice'|'visual'|'audio'); statement; alwaysInclude? }` — flat. (`storyEngine.ts:124`)
- 절단 = `buildProjectContextDigest` 의 `CONTEXT_CANON_LIMIT=40` head/tail slice, `alwaysInclude` 핀만 면제. (`storyEngine.ts:1597~1620`) **← A-6 버그 지점.**
- 이미 있는 재사용 자산 — `storyOntology.ts` 의 `CharacterNode·RelationshipEdge·WorldRuleNode`, `extractEntityName`·`extractCharacterNames`·`extractRelation`. `payoffLedger.ts`·`continuityContract.ts`. `normalizeProject`(백필).
- DiveStage/Story X 둘 다 `buildProjectContextDigest` 를 통해 캐논을 컨텍스트로 받음(condense=`chapterFromDraftPayload`). → 검색 한 곳만 고치면 두 표면이 동시에 개선.

## 3. 데이터 모델 변경 (하위호환 · normalizeProject 백필)

`CanonFact` 를 **확장**(필드 추가만, 기존 전부 보존).

```
CanonFact {
  id; episode; owner; statement; alwaysInclude?   // 기존
  importance?: number          // 0~1 연속값. 없으면 normalize가 도출(§4).
  participants?: string[]      // 관계자(엔티티 이름). 없으면 extractEntityName/extractCharacterNames 로 도출.
  reveal?: 'revealed' | 'secret' | 'foreshadowed'   // 공개 축(정본 §14 위험2). 없으면 'revealed'. (필드명 reveal — 기존 essay disclosureLedger 와 충돌 회피)
  evidence?: {                 // 증거(provenance). 없으면 episode 로 최소 구성.
    sourceType: 'chapter'|'preset'|'user'|'extracted';
    sourceId: string;          // 회차 id 등
    quote?: string;
  }
}
```

- `importanceBand`(anchor/major/soft)은 **저장 안 함** — `importance` 에서 파생(순수 함수 `importanceBand(n)`). 정본 §4 구간(anchor≥0.82·major≥0.45·soft<0.45), 미스터리·스릴러(Q1)라 초기 임계 그대로.
- **`alwaysInclude` ↔ `importance` 브리지** — `alwaysInclude===true` ⇒ importance 앵커(≥0.82)로 취급. 기존 B3 핀 의미 보존. 역으로 앵커는 절단 면제(아래).
- **`reveal` 공개 축(정본 §14 위험2 — withholding/조기해소 차단)** — `revealed`=독자가 이미 아는 캐논(평소대로 주입) · `secret`=쇼러너만 아는 정보 비대칭(프리셋 '숨긴 진실'에서 옴) · `foreshadowed`=심었지만 미회수 복선. 생성 컨텍스트 주입 규칙은 §5. 미스터리·스릴러(Q1)라 secret/foreshadowed 비중이 높은 장르 — 이 축이 1차 타깃과 직결.
- `normalizeProject` 백필 — importance 없으면 §4 도출, participants 없으면 추출, **reveal 없으면 `'revealed'`**(구버전=전부 공개로 안전), evidence 없으면 `{sourceType:'chapter', sourceId:episode}`. **구버전 작품 무손상.**

★ Event/Entity/Relation 완전 3분할 스키마(정본 §3)는 **이번 슬라이스 비목표**. CanonFact 에 participants·importance·evidence 만 얹어 "사건중심"의 최소 형태를 만든다(관계자×중요도×증거). 완전 분할은 데이터가 쌓인 뒤 마이그레이션 없이 승격.

## 4. 중요도 도출 (작가 핀 우선 · AI는 제안만)

순수 함수 `deriveImportance(fact, project): number`. 정본 §4 식의 **경량 초기판**(7항 전체는 데이터 축적 후).

- `alwaysInclude` 핀 ⇒ 0.9(작가 의도 = 앵커). **핀이 자동점수를 항상 override**(정본 §13·foil#6).
- 그 외 가중합(0~1 클램프) — `0.35·핀 + 0.25·관계자중심성(참여 엔티티가 다른 캐논·인물에 얼마나 연결) + 0.20·재등장(같은 엔티티 캐논 빈도) + 0.20·열린떡밥관련(openThreads 와 엔티티 교집합)`. 감정·인과 항은 후속(측정기 없음 → 박제 금지).
- **AI 자동추정 = 제안만.** 이 슬라이스는 도출값을 저장하되 "확정"이 아니라 정렬·면제 기준으로만. 작가 편집 UI(핀)는 기존 B3 토글 재사용.

## 5. 검색 교체 — 핵심 (A-6 직격)

`buildProjectContextDigest` 의 head/tail slice(`storyEngine.ts:1602~1619`)를 **중요도 가중 + 장면 관련성**으로 교체. 신규 순수 함수 `selectCanonForContext(facts, query, budget)`.

- **입력 query** — 현재 장면/회차의 관계자·열린 떡밥(가능하면 scene 의 participants, 없으면 최근 회차 엔티티). 정본 §6 R1 의 경량판.
- **선택 규칙(정본 §6 R3)** — ① **앵커(importance≥0.82) 전부 — 절단 금지** ② major — query 관련(관계자/떡밥 교집합) 우선, 예산 내 ③ soft — query 직결만. 예산 초과 시 soft→major(무관)→ 순으로 절단, **앵커는 절대 안 자름.**
- **★ 공개 축 분리 주입(정본 §14 위험2)** — 선택된 캐논을 reveal 별로 두 절로 나눠 출력. `revealed` ⇒ 기존 `확정 캐논 (절대 위반 금지)`. `secret`·`foreshadowed` ⇒ 별도 절 **`숨은 캐논 (모순 금지 · 아직 누설 금지)`** — AI가 모순은 피하되 본문에 직접 드러내지 않게. 이게 withholding·긴장·조기해소 방지를 한 번에. 앵커 절단 면제는 reveal 무관(secret 앵커도 보존).
- **가시화** — 생략 시 `… 중반 캐논 N개 생략(앵커 K개·관련 캐논은 항상 포함) …` 로 무엇이 왜 빠졌는지 노출(기존 메시지 강화, 정본 §6 Context Viewer 정신).
- 기존 `CONTEXT_CANON_LIMIT` 는 budget 으로 유지(값 보존). pinned-only 면제 → 앵커+관련 면제로 확장.

## 6. PLAY 와의 접점 (이 슬라이스 한정)

- 코어만 고치고 **DiveDesk UI 무변경.** condense/digest 경로가 자동으로 개선된 검색을 받음 → PLAY 가 중반 캐논을 덜 잊음(player-first 즉시 이득).
- 명시적 PLAY 런타임 validator·"의외 전개 후보" 배지·응결 게이트는 **다음 spec(MVP-1)**. 여기서 만든 importance·participants·selectCanonForContext 를 그대로 소비.

## 7. TDD (storyEngine.test 먼저 — 프로젝트 규칙)

RED→GREEN 순. 신규 테스트.
1. `importanceBand` 경계(0.82·0.45) 순수 단언.
2. `deriveImportance` — 핀 override(=0.9) · 관계자 많은 캐논 > 고립 캐논.
3. `normalizeProject` 백필 — 구버전 CanonFact(importance/participants/evidence 없음)에 도출·무손상.
4. **★ 런칭 게이트** — 65개 캐논(앵커 5 포함) + 현재 장면 관계자 query → `selectCanonForContext` 가 앵커 5 전부 + query 관련 캐논 포함 + 무관 soft 절단. budget 작아도 앵커 절대 보존(A-6 회귀).
5. `buildProjectContextDigest` 통합 — 65캐논 작품에서 출력에 앵커 statement 전부 존재(이전 head/tail 로는 소실되던 케이스).
6. `alwaysInclude` 하위호환 — 기존 B3 핀 작품이 앵커로 매핑돼 동일 보존.
7. **reveal 분리(정본 §14 위험2)** — secret/foreshadowed 캐논은 `숨은 캐논 (모순 금지 · 아직 누설 금지)` 절로, revealed 는 `확정 캐논` 절로 분리 출력. secret 앵커도 절단 면제. 백필로 구버전 캐논은 전부 revealed.

## 8. 검증

- `npm test` 전체 녹색(신규 6+ 포함) · `npm run build`(tsc+vite).
- 라이브 — 미스터리·스릴러 작품(쇼케이스 퇴마록 백업 류)으로 회차 누적 후 digest 에 초반 앵커 캐논이 살아있는지 눈 확인.
- `progress.md` '최근 검증' 1곳 갱신 · 증거(SHA·테스트 수) · `session-handoff.md` 인계.

## 9. 미해결 · 후속

- 도출식 7항 전체·감정/인과 측정기 — 데이터 후.
- Event/Entity/Relation 완전 분할 — 마이그레이션 없이 승격 시점 별도.
- 벡터 검색(정본 §6 ② 소·세부) — 이번엔 구조 질의만. 규모 더 커지면 하이브리드.
- MVP-1(PLAY 런타임 거버넌스)·연속성 자동검사기(ConStory 4단, 정본 §12.2)·번역 투 게이트(§12.3) — 각 별도 spec.
- **크래프트 정합성 후속(정본 §14)** — 위험1(내면 상태=living 티어 자동분류, continuityContract 확장) · 위험4(검사기가 사실 모순 vs 행동 전복 분리) — 각 후속 spec에 명문화. MVP-0은 reveal 축(위험2)만 코어로 선반영. 위험3(초기 캐논 희박·steering)은 운영 원칙으로 prompt/도출 기본값에 반영(앵커 자동승격 보수적).
