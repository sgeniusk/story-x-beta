# Dive X 시장·방향 딥리서치 (2026-06-28)

> 글로벌 우선 + 한국 2차. Dive X(자유 대화 → 영속·연속성 고정된 "나+캐릭터 공동주연 연재물") 의 시장성·경쟁·품질·공유 경로를 외부 소스로 재조사하고 큰 그림을 다시 그린다. 직전 6/27 외부 3종(GPT-5·Claude·Gemini) 삼각측량의 갱신판이며, 이번엔 Claude Code 가 WebSearch/WebFetch 로 직접 수행했다(deep-research 하네스는 scope 단계 구조화출력 재시도 한도로 실패 → 수동 대체).

## 0. 한 줄 답

시장은 크고 빠르게 자라지만(컴패니언 ~수백억\$, 웹소설 글로벌 \$7.8B·한국 1.2조원), **"대화가 영속·연속성 고정된 3인칭 회차로 응결되고 그게 남에게도 읽히는 연재물이 되는 폐루프"의 상용 선례는 이번에도 확인되지 않았다.** 조각은 다 흩어져 있고(메모리=character.ai 약점, 공유=AI Dungeon 시나리오, 작품화 프레임=제타, 웹소설 경제=네이버/카카오) 아무도 잇지 않았다. 기회는 진짜로 비어 있으나, **가장 큰 미검증 리스크는 "남의 플레이는 재미없다" 문제**이고 그걸 푸는 단 하나의 장치가 곧 응결 품질이다.

---

## 1. 경쟁·유사 서비스 지도

조각별로 "있다". 폐루프로 "잇는 곳"은 없다.

| 축 | 대표 | 무엇을 하나 | 한계(= 우리 창) |
|---|---|---|---|
| 캐릭터 챗 + 규모 | character.ai (20M MAU, 피크 28M '24년 중반) | 최대 캐릭터 풀, 몰입 대화 | **장기 기억 약함** — 리셋 후 망각, 세션 간 영속 불안정. 회차 응결·캐논 없음. |
| 작가형 스토리 생성 | NovelAI · AI Dungeon (Latitude) · DreamGen | Lorebook/Memory/Author's Note, 무한 텍스트 어드벤처 | 작가가 직접 모는 도구. **대화→3인칭 회차 자동 응결 아님.** AI Dungeon 은 최근 수천 토큰만 추적 → 장편 드리프트. |
| 작품화 프레임 | 제타(스캐터랩, 1년 만에 회원 200만) · 크랙(뤼튼 스핀오프, 웹 MAU 192만) | "대화의 작품화"를 정체성으로 점유, 한국 Z세대 주류 | 대화 그 자체를 작품으로 보는 프레임. **3인칭 응결·승인형 캐논·연속성 계약은 미구현**(직전 리서치와 일치). |
| 공유/UGC | AI Dungeon "Worlds"(2020~)·시나리오 퍼블리시·멀티플레이 | 시나리오(=세계관 셋업)를 공개·코멘트·협업 | 공유 단위가 **"플레이 가능한 셋업"이지 "읽히는 완성 회차"가 아님.** |
| 메모리 R&D | Jenova · DreamGen · 신생들 | 벡터스토어·지식그래프·"뇌 파일"·시간감쇠 메모리 | 2026년 업계가 장기기억을 "3대 미해결 문제"로 공식 지목 → **연속성 엔진의 기술 정당성**, 동시에 추격자도 같은 곳을 판다. |

**미점유 교집합(white space) = ① 장편 연속성 품질 + ② 오리지널 + ③ 대화→3인칭 회차→승인형 캐논→기억 주입 폐루프 + ④ 그 회차가 남에게도 읽히는 연재물.** 네 개를 동시에 잇는 상용 리더는 없다. 단 ①은 모두가 파는 레드오션 R&D, "작품화" 프레임은 제타가 점유 — **방어선은 "잇는 방식"과 응결 품질이지 어느 한 조각이 아니다.**

## 2. 시장성·수요 근거

- **규모는 진짜다.** AI 컴패니언 시장 추정 \$28~37B('24~'25) → '32~'35 \$200~550B, CAGR ~30%(분석기관별 편차 큼 — projection 신뢰도 낮음, 박제 주의). AI 롤플레이 챗봇 ~\$1.2B → '33 \$8.92B. 웹소설 글로벌 \$7.8B('25)→\$22.4B('34), APAC 54%. **한국 웹소설 1.2조원(\~\$890M, '24 KOCCA), KakaoPage·Naver Series 과점, 회차당 결제가 최고 ARPU.** Wattpad 90M+ 가입, 네이버가 \$600M 인수.
- **그러나 컴패니언의 수익화는 약하다.** character.ai 는 월 2시간 체류·일 75분·월 20억 챗분의 압도적 인게이지먼트에도 매출 \$32.2M('24)→\~\$50M('25), 밸류 \$2.5B('24)→\$1B('25)로 **하락**. "인게이지먼트는 폭발, 매출은 미미"가 이 카테고리의 구조적 병. 무료·몰입·NSFW 로 싸우면 진다(직전 리서치 결론 재확인).
- **NovelAI** 는 VC 없이 구독만으로 독립 운영(월 ~811만 방문, '25.11) — **검열 사태로 이탈한 AI Dungeon 파워유저가 모태.** 시사점 — 이 시장은 **신뢰·통제·검열정책이 곧 이주 트리거.** 승인형 캐논·전연령·오리지널이 신뢰 자산이 된다.
- **법적 지각변동(= 카테고리 재편 + 우리에게 유리).** character.ai 18세 미만 오픈챗 차단('25.11), Garcia 소송(14세 Sewell Setzer 자살), 구글+CAI 합의('26.1), GUARD Act, 캘리포니아 SB243, FTC 조사, 주 검찰총장 44인 공동서한. **컴패니언 전체가 안전·연령 규제로 몰리는 중** → "전연령·오리지널·작품" 포지션이 리스크가 아니라 **차별적 해자**. 단 영속 저장은 한국 아청법 표현물 리스크를 키우므로(직전 스펙 §9) 외부 공개 전 day-1 아키텍처로 재소환 필수.
- **핵심 가설 판정** — "내가 진짜 주인공인 공동저작 영속 연재"는 이번에도 **검증된 수요가 아니다(미검증, dead end 도 아님).** 선두도 미구현이라 측면 진입 창은 열려 있다. → 외부 PMF 가 아니라 **사용자 dogfooding 으로 먼저 깬다**(기존 판정 기준 유지).

## 3. 품질·독특한 시작 (가장 실행 가능한 레버)

**LLM 평탄함은 프롬프트로 못 고치는 구조적 문제다.** arXiv 2603.13545 "AI's Modern Fiction Dependency" — 세 가지 아키텍처 불일치.
1. **서사 인과 역설** — 사건은 "그 순간 놀랍고 돌아보면 필연"이어야 하나, transformer 순방향 생성은 통계적 가능도를 최적화(시간 비대칭 실패). NoCha 벤치 전역추론 41.6%.
2. **정보 재평가** — 픽션은 "통계적 빈도 ≠ 중요도"(플로베르의 바로미터). 어텐션은 후행 폭로로 과거 정보를 소급 재가중 못 함.
3. **다중 스케일 감정** — 단어·문장·장면·아크의 감정 동시 조율이 안 됨. Rettberg 의 AI 스토리 11,800편이 **단일 플롯 구조로 수렴**, 인구통계별 동일 스테레오타입.

→ **시사점 — 평탄함의 해법은 Dive 코드도 더 센 모델도 아니라 ①연속성 계약(캐논=소급 재가중을 외부 상태로 강제)·②핀(정보 재평가를 alwaysInclude 앵커로 강제)·③Story X 품질 로드맵(긴장·날것·정보비대칭).** 메모리 §★ 와 일치 — Dive 응결 품질 ≡ Story X 품질, 한 몸.

**독특한 시작 — 현재 시드는 전형적 트롭이다.** 무뚝뚝한 소꿉친구·떠돌이 검객·라디오 DJ 는 arXiv 가 지적한 "모델이 기본값으로 떨어지는 스테레오타입" 그 자체. 픽션 craft 가 말하는 좋은 시작의 공통분모.
- **하이콘셉트 훅** — 한 문장으로 요약되고 "아직 안 해본" 전제, 손에 닿을 듯한 비현실.
- **즉각적 딜레마** — 오프닝이 곧 선택/분기. "왜 여기 있는가"는 명확, "누구인가"는 미스터리(몰딩 여지).
- **상황 주도 > 아키타입 주도** — 캐릭터 박스가 아니라 **전제 박스**(상황+딜레마+훅)로 시드를 재설계.

## 4. 공유·웹소설화 경로 (최대 리스크)

- **"남의 플레이는 재미없다"는 실재한다.** 검색 일관 신호 — 남의 RP/플레이 관전은 보통 재미없고(let's-play 는 매력적 스트리머가 있어야 성립), 완벽한 AI RP 는 "열정이 없어 지루"하다는 반응. **개인 맞춤이 강할수록 타인 공유가는 떨어지는 역설.**
- **그래서 공유 단위는 "원시 대화"가 아니라 "응결된 3인칭 회차"여야 한다.** AI Dungeon 이 공유하는 건 셋업(시나리오)이지 읽히는 회차가 아니다 — 정확히 그 빈자리. **거친 RP 를 실제로 읽히는 웹소설급 회차로 다듬는 응결이 곧 공유 가능성을 만드는 장치.** 이게 베팅의 본체.
- **웹소설 경제는 검증됨**(회차당 결제 최고 ARPU, 모바일 전환율 높음) — 단 전부 인간 저작. AI 응결 회차가 그 바를 넘느냐가 미검증.
- **text→image→video 로드맵** — 회차 데이터 모델(Chapter/canon)이 이미 매체 불가지론적. 텍스트 우선, 이미지·영상은 응결 품질이 사용자 바를 넘은 뒤(YAGNI). 토탈리콜 Rekall 비유의 종착은 영상이지만 진입은 텍스트.

---

## 5. 큰 그림 재설계 — 추천 방향

**포지션 전환 — "AI 컴패니언 챗"이 아니라 "개인 맞춤 연재 스튜디오".** 챗은 입력 방식, **산출물은 읽히는 회차**다. 근거 — (a) 컴패니언은 매출 구조가 깨졌고 무료·NSFW 로 못 이긴다, (b) 규제가 컴패니언을 안전·연령으로 몰아 전연령·오리지널·작품 포지션이 해자가 된다, (c) 웹소설 경제는 회차당 결제로 검증됐다.

다섯 기둥.
1. **해자는 폐루프 + 연속성**이지 챗이 아니다. 응결·캐논·기억 주입을 계속 깊게.
2. **응결 품질에 올인** — §3 의 구조적 처방(연속성 계약·핀·Story X 품질 레인). 모델 교체로 미루지 않는다.
3. **시작을 하이콘셉트 전제 시드로 교체** — 전형성 편향과 정면으로 싸우는 첫 수.
4. **공유 단위 = 응결 회차** — "남의 회차가 읽히는가"를 일찍 검증. 웹소설화의 생사.
5. **매체 확장은 텍스트 품질 통과 후** — 데이터 모델은 이미 준비, 실행은 보류.

### 다음 한 단계 (권장)
**하이콘셉트 전제 시드 3종 재설계(§3) + 그걸로 응결 회차 1바퀴 dogfooding.** 가장 싸고 레버리지 큰 수이고, 사용자의 "독특한 시작" 요구에 직접 답하며, 응결 품질(=최대 미검증 리스크)을 즉시 손맛으로 때린다. TDD — `diveSeedCharacters.test.ts` 먼저.

## 6. 한계·주의

- 시장 규모 projection 은 기관별 편차 크고 신뢰도 낮음 — 추세 신호로만, 수치 박제 금지.
- character.ai "45M active Sep 2025" vs "피크 28M MAU '24" 는 출처 간 active 정의 불일치 — MAU 와 방문자 혼용 의심.
- 제타 namuwiki 직접 fetch 실패(403) — 제타 수치·작품화 프레임은 2차 매체(AI타임스·검색 요약) 기반, 1차 확인 아님.
- "남의 플레이 재미없다"는 포럼·블로그 정성 신호이지 정량 연구 아님 — 강한 가설로 다루되 단정 금지.

## 출처
- [9 Best AI Roleplay Chatbot Generators (2026) — nerdbot](https://nerdbot.com/2026/03/11/9-best-ai-roleplay-chatbot-generators-for-immersive-story-adventures-2026/)
- [Best AI Roleplay Platforms 2026 — wilds.ai](https://wilds.ai/blog/best-ai-roleplay-platforms-2026)
- [AI Long-Term Memory for Novels — epos-ai](https://epos-ai.ch/en/blog/ai-long-term-memory-novel-writing.html)
- [Character AI Statistics 2026 — Business of Apps](https://www.businessofapps.com/data/character-ai-statistics/)
- [Character AI Statistics — DemandSage](https://www.demandsage.com/character-ai-statistics/)
- [Character.AI revenue & news — Sacra](https://sacra.com/c/character-ai/)
- [Character AI 2025 by the Numbers — completeaitraining](https://completeaitraining.com/news/character-ai-2025-by-the-numbers-20m-maus-322m-revenue-1b/)
- [AI Companion Market — Grand View Research](https://www.grandviewresearch.com/industry-analysis/ai-companion-market-report)
- [NovelAI Raises Funds — Medium/Leo Wang](https://medium.com/@preangelleo/novelai-raises-funds-revolutionizes-ai-assisted-storytelling-5bfd626cfda)
- [NovelAI built by disgruntled AI Dungeon fans — Hacker News](https://news.ycombinator.com/item?id=29830792)
- [AI Dungeon — Wikipedia](https://en.wikipedia.org/wiki/AI_Dungeon)
- [why AI content falls flat — Prose](https://www.prosemedia.com/blog/why-ai-generated-content-falls-flat-without-human-storytelling-to-bring-it-to-life)
- [AI's Modern Fiction Dependency Problem — arXiv 2603.13545](https://arxiv.org/html/2603.13545v1)
- [Postmortem: How to Write Compelling Interactive Fiction — Medium](https://medium.com/@alex.kubodera/postmortem-how-to-write-compelling-interactive-fiction-55168fc43ece)
- [High-Concept Fiction — The Novelry](https://www.thenovelry.com/blog/high-concept-fiction)
- [zeta(애플리케이션) — 나무위키](https://namu.wiki/w/zeta(%EC%95%A0%ED%94%8C%EB%A6%AC%EC%BC%80%EC%9D%B4%EC%85%98))
- [AI 캐릭터 채팅 '크랙' 웹 MAU 192만 — AI타임스](https://www.aitimes.com/news/articleView.html?idxno=171402)
- [젠Z 캐릭터 챗봇 주류 — AI타임스](https://www.aitimes.com/news/articleView.html?idxno=166330)
- [Web Novel Platforms Market — Dataintelo](https://dataintelo.com/report/web-novel-platforms-market)
- [Korean Webnovels Global 2026 — Seoulz](https://www.seoulz.com/korean-webnovels-global-2026/)
- [Web novels in South Korea — Wikipedia](https://en.wikipedia.org/wiki/Web_novels_in_South_Korea)
- [Character.AI bans teen chats — Fortune](https://fortune.com/2025/10/29/character-ai-ban-children-teens-chatbots-regulatory-pressure-age-verification-online-harms/)
- [Google and Character.AI settle teen suicide lawsuits — Fortune](https://fortune.com/2026/01/08/google-character-ai-settle-lawsuits-teenage-child-suicides-chatbots/)
- [Regulatory Focus on AI Companion Chatbots — California Lawyers Association](https://calawyers.org/privacy-law/regulatory-focus-on-ai-companion-character-chatbots/)
