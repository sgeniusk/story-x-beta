# 규명 — 온톨로지 0 (구조적 배선 갭, 버그 아님)

발견 2026-06-07 · 파일럿 #1(웹소설 장편) 중 · **새 제작 계획 P0 후보**

## 증상
1화 생성 후 지표 패널 — 하니스 2/8(22/100), 온톨로지 0(인물·관계·세계·갈등·플롯·캐논 전부 0), 매체 투사 0%. 반면 검토 5명은 본문을 정확히 읽고 수렴된 의견을 냄.

## 라이브 사실 (localStorage `serial-story-studio/project`)
```
logline: ""   deepQuestion: ""   audiencePromise: ""   characters: 0   worldRules: 0
canonFacts: 5   chapters: 1   ch1_newCanonFacts: 5
```

## 원인 체인 (코드 확인)
1. **`DraftChapterPayload`(storyEngine:374)** = title·hook·outline·beats·prose·newCanonFacts 만. **logline·characters·worldRules·deepQuestion 필드 없음.** LLM 초안 응답은 회차 본문 데이터만 싣는다.
2. **`chapterFromDraftPayload`(storyEngine:1172)** = payload로 chapter만 만들어 `commitChapter`로 추가. 바이블 메타(logline·characters·worldRules·deepQuestion)는 **건드리지 않음**. (단 chapter.newCanonFacts → project.canonFacts 누적은 됨 = 5개)
3. **`buildStoryOntology`(StoryXDesk:787)** 입력 = `project.logline · deepQuestion · audiencePromise · characters[0]`. 이 메타가 전부 빈 문자열/빈 배열 → 보수적 휴리스틱이 **온톨로지 전부 0** 반환.
4. **온보딩(App goToBuilding:743)** = freewrite+인터뷰 답변을 `enrichedFreewrite` **프롬프트로만** 합쳐 초안 생성 → `onOpenEditor(payload)`. 인터뷰 결과가 **구조화 project 메타로 안 들어감.**

## 두 개의 갭
- **갭 A — 온보딩→project 메타 미배선.** 인터뷰를 거쳐도 logline·characters·worldRules·deepQuestion이 빈 채. 온톨로지 입력원이 영영 0.
- **갭 B — 회차 캐논(`canonFacts`) ↔ 온톨로지(`canonSeeds`·`characters`) 미연결.** 회차에 캐논이 5개 쌓여도 온톨로지 트랙으로 승격 안 됨. 지표의 "캐논 0"은 `ontology.canonSeeds.length` 기준이라 실제 `project.canonFacts` 5개를 반영 못 함.

## 함의 (장편 완권 연속성 테스트의 전제)
- 회차 캐논(`canonFacts`)은 누적되므로, 검토는 `buildProjectContextDigest`(본문·캐논 기반)로 어느 정도 연속성 작동 → 검토 5명이 1화를 정확히 읽고 "백도현 미래지식 과잉확정"을 수렴 포착한 근거.
- 그러나 **온톨로지(캐릭터 바이블·세계 규칙·관계)는 0**이라, 사용자가 #3·#4에서 원한 "**캐릭터 일관성 민감 추적**"의 구조화 기반이 부재. 시스템이 캐릭터 추적표를 자동으로 못 만든다(characters 0).
- 즉 회차를 20~25화 쌓아도 온톨로지·캐릭터 바이블은 계속 0 → 구조화 연속성 검증 불가. **장편 완권 테스트가 텍스트 검토에만 의존하게 됨.**

## 해결 방향 (새 계획용, 택1 또는 조합)
- **A. DraftChapterPayload 확장** — LLM이 초안과 함께 바이블 메타(logline·characters·worldRules·dramaticQuestion)도 추출·반환하고, `chapterFromDraftPayload`(특히 1화)가 project 메타에 반영. 가장 직접적.
- **B. 본문→온톨로지 추출 단계** — `extractOntologyFromProse(chapters)` 신설, 회차 누적 본문·canonFacts에서 characters·worldRules·canonSeeds 추출 → 승인 큐 경유 project 반영. 회차가 쌓일수록 풍부.
- **C. 인터뷰 답변 구조화** — 온보딩 인터뷰 답을 freewrite 프롬프트 외에 project 메타(audiencePromise·deepQuestion·logline)로도 매핑.
- 권장 — C(즉시·저비용, 메타 시드)+B(회차 누적 반영)의 조합. A는 LLM 응답 스키마 변경이라 무겁다.

## 검증 방법 (수정 후)
- `storyEngine.test.ts` — chapterFromDraftPayload/extractOntology가 logline·characters·worldRules를 채우는지 RED→GREEN.
- 라이브 — 신규 작품 1화 생성 후 지표 패널 온톨로지 >0, 하니스 점수 상승, localStorage characters/worldRules >0.
