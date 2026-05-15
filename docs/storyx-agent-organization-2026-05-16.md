# Story X 에이전트 조직도 — 2026-05-16

23개 `.claude/agents/*.md` 중 *사용자가 카드로 보는 에이전트* vs *백엔드 운영* 분류. 매체별 노출 차이도 명시.

## Frontend — UI 카드로 직접 보이는 에이전트

### 편집 트랙 작가진 (우측 사이드바, 5명 + 매체 챔피언 1명)

| 카드 | agentId | 역할 | 노출 매체 |
|------|---------|------|-----------|
| 쇼러너 | `serial-showrunner` | 회차 약속, 클리프행어, escalation | 모든 매체 |
| 캐릭터 큐레이터 | `character-custodian` | 욕망, 상처, 말투, 관계 | 모든 매체 |
| 배경 설계자 | `world-keeper` | 세계 규칙, 비용, 시간표 | 모든 매체 |
| 장르 스타일리스트 | `genre-stylist` | 장르 리듬, 문체 질감 | 모든 매체 |
| 연속성 감수자 | `continuity-editor` | 캐논 충돌 차단, 새 사실 승인 | 모든 매체 |
| **매체 챔피언** | — | 매체 전담 | (아래 참고) |

매체 챔피언 (`getMediumChampionRun` 헬퍼가 결정).

- **소설**: 없음 (위 5명으로 충분)
- **에세이**: `essay-interviewer` (자유 서술 기반 인터뷰 + 사실 보호)
- **오디오북**: `audio-narration-director` (낭독 톤 + 쉼 + 청취 피로)
- **만화**: `storyboard-agent` (컷 리듬 + 말풍선 + 시각 연속성)

### 바이블 트랙 조수진 (우측 사이드바, 5명)

`buildBibleAssistantRuns` 함수가 정의. 편집 트랙 작가진 5명 중 일부의 *바이블 모드*.

| 카드 | agentId | 책임 |
|------|---------|------|
| 캐논 리팩터 | `continuity-editor` | 캐논 충돌 추적 |
| 캐릭터 편집 조수 | `character-custodian` | 캐릭터 카드 편집 |
| 세계관 편집 조수 | `world-keeper` | 세계 규칙 편집 |
| 문체 조수 | `voice-curator` | 문체 / 시각 / 오디오 앵커 |
| 승인 대기 조수 | `essay-interviewer` | 메모리 후보 승인 큐 |

### 만화 visual studio (만화 매체에서 추가 노출, 5명)

`visualStoryAgentRuns` 배열로 추가.

| 카드 | agentId | 책임 |
|------|---------|------|
| 웹툰 연출 | `storyboard-agent` | 컷·스크롤·페이지 리듬 |
| 말풍선 | `speech-bubble-agent` | 위치·밀도 |
| 원화 | `keyframe-art-director` | Midjourney 후보 |
| 다빈치 | `da-vinci` | FLUX.2 컷별 프롬프트 |
| 프레임 | `frame-assembly-agent` | 비율·export |

## Backend — UI 카드에 안 보이지만 운영

### Service Operations 8명 (`serviceOperationsAgents`)

UI 동작과 메시지를 형성하는 *내부 운영*. 사용자에게 *카드*로 보이지 않음.

| 에이전트 | 책임 |
|----------|------|
| `editor-ux-director` | Workflow Board P0, visible quality gates |
| `creative-coach` | 막힘 해소, 질문 카드 |
| `onboarding-architect` | 첫 5분, 매체/포맷 선택 흐름 |
| `work-library-manager` | 프로젝트·시리즈·버전·바이블·exports |
| `brand-homepage-director` | 홈페이지 카피·포지셔닝 |
| `monetization-strategist` | 가격·크레딧·유료 리뷰 |
| `publishing-distribution-manager` | Export 패키지·플랫폼 핸드오프 |
| `insights-analyst` | 사용 패턴, AI Output Autopsy, 실패 로그 |

### 보조 매체 전문가 (`.claude/agents`에 정의됐지만 카드 노출 제한)

매체 챔피언으로 *일부만* 노출되고 나머지는 *백엔드*.

- `essay-interviewer` — 에세이 매체일 때만 카드
- `voice-curator` — 바이블 트랙 조수로만 노출
- `audio-narration-director` — 오디오북 매체일 때만 카드
- `education-video-director` 또는 `education-video-architect` — 카드 노출 없음 (백엔드)
- `sound-music-agent` — 카드 노출 없음 (백엔드)

### Skills (`.claude/skills`, 에이전트보다 상위 워크플로우 단위)

| 스킬 | 용도 |
|------|------|
| `storyx-persona-review` | Quick/Standard/Deep 검토 루프. 모든 에이전트가 사용 |
| `longform-series-continuity` | 장기 시리즈 연속성 |
| `genre-webnovel-production` | 한국 웹소설 회차 제작 |
| `visual-storyboard-continuity` | 만화·웹툰 컷 일관성 |

## 합계

- **`.claude/agents/*.md`**: 23개
- **사용자가 카드로 보는 에이전트 (매체 의존)**:
	- 소설: 5명 (편집) + 5명 (바이블) = 10명
	- 에세이: 6명 + 5명 = 11명
	- 오디오북: 6명 + 5명 = 11명
	- 만화: 6명 + 5명 + 5명 (visual studio) = 16명
- **백엔드 운영(카드 없음)**: 8명 (service operations) + 보조 매체 일부
- **Skills**: 4개

## 매체별 사용자 경험 매트릭스

| 매체 | 카드 총 노출 | 1급 시민 정도 | 향후 보강 우선 |
|------|-------------|---------------|----------------|
| 소설 | 10명 | 매우 강 | (없음, 이미 완성) |
| 에세이 | 11명 | 강 (사실 보호 모드 추가) | AI 발명 권한 실제 차단 로직 |
| 오디오북 | 11명 | 중 (낭독 시간 미터 추가) | 플레이 버튼·낭독 톤 미리듣기 |
| 만화 | 16명 | 약 (visual studio 있지만 컷 박스 없음) | 컷 박스 에디터 |

## 변경 이력

- 2026-05-16 작성. 5인 페르소나 테스트 직후, Phase 3-(바) 매체 챔피언 추가 후 시점 기준.
- 다음 보강 시 이 문서 갱신 권장.
