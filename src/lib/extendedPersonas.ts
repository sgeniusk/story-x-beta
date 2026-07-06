// Story X · M9 Margin patch — UI metadata for 5 core + 31 extended personas.
// 실제 페르소나 정의(.claude/agents/*.md) 와 검토 로직(agentReviewProcess.ts) 은 그대로.
// 이 파일은 UI 표시용 — 한국어 이름·역할 한 줄·tint·그룹.
// id 는 .claude/agents/<id>.md 파일명과 1:1.

import type { ExtendedPersona, PersonaCard } from './marginReview';

/* ============================================================================
 * 코어 5명 — 작가 옆에 항상 떠 있는 페르소나.
 * 토큰: tint 는 --sx-stage-* 와 일관. UI 의 의미 매핑 보존.
 * ========================================================================== */
export const CORE_PERSONAS: PersonaCard[] = [
  {
    id: 'showrunner',
    name: '쇼러너',
    role: '회차 약속과 압력',
    tint: '#e4f222', // brand lime
    isCore: true,
  },
  {
    id: 'character-custodian',
    name: '캐릭터 큐레이터',
    role: '욕망 · 상처 · 관계',
    tint: '#dfa88f', // stage-think apricot
    isCore: true,
  },
  {
    id: 'world-keeper',
    name: '세계 키퍼',
    role: '세계 규칙과 비용',
    tint: '#9fbbe0', // stage-read sky
    isCore: true,
  },
  {
    id: 'genre-stylist',
    name: '장르 스타일리스트',
    role: '리듬과 문체 질감',
    tint: '#c0a8dd', // stage-write lilac
    isCore: true,
  },
  {
    id: 'continuity-editor',
    name: '연속성 감수자',
    role: '캐논과 미해결 실',
    tint: '#9fc9a2', // stage-mark sage
    isCore: true,
  },
];

/* ============================================================================
 * 호출 시에만 surface 되는 31명.
 * Spotlight 가 확장 / 신설 / 매체 3 그룹으로 묶어 보여준다.
 * tint 는 모두 --sx-accent (보라) — 코어와 시각 구별.
 * ========================================================================== */
export const EXTENDED_PERSONAS: ExtendedPersona[] = [
  // --- 확장 11명 — 코어와 함께 자란, 검토 보조 역할 ---
  { id: 'critic-reviewer',        name: '평론가',          role: '긴장과 흡인력',      tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'essay-curator',          name: '에세이 큐레이터',  role: '에세이 결',         tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'voice-curator',          name: '문체 큐레이터',    role: '문장 톤',           tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'audio-narration-director', name: '낭독 디렉터',    role: '듣는 호흡',         tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'sound-music-agent',      name: '음악 감독',        role: '음 · 소리 결',      tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'education-video-architect', name: '교양 영상 설계자', role: '영상 흐름',       tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'onboarding-architect',   name: '온보딩 설계자',    role: '독자 진입',         tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'creative-coach',         name: '창작 코치',        role: '작가 호흡',         tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'editor-ux-director',     name: 'UX 디렉터',        role: '편집 화면',         tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'harness-verifier',       name: '하니스 검증자',    role: '파이프라인',        tint: '#7c87e5', isCore: false, group: '확장' },
  { id: 'insights-analyst',       name: '인사이트 분석자',  role: '데이터 결',         tint: '#7c87e5', isCore: false, group: '확장' },

  // --- M4 신설 12명 — 스튜디오·바이블·퍼블리시 단계 ---
  { id: 'studio-architect',       name: '스튜디오 설계자',  role: '제작 흐름',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'interview-curator',      name: '인터뷰 큐레이터',  role: '취재 질문',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'book-designer',          name: '책 디자이너',      role: '단행본 시각',       tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'pr-specialist',          name: 'PR 담당',          role: '발신 카피',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'platform-curator',       name: '플랫폼 큐레이터',  role: '연재 채널',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'business-strategist',    name: '사업 전략가',      role: '판권 · 수익',       tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'timeline-keeper',        name: '연표 지킴이',      role: '시간선',            tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'canon-librarian',        name: '캐논 사서',        role: '사실 색인',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'bible-curator',          name: '바이블 큐레이터',  role: '설정 정본',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'memory-evolution-keeper', name: '기억 진화자',     role: '인물 누적',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'essay-interviewer',      name: '에세이 인터뷰어',  role: '자기 질문',         tint: '#7c87e5', isCore: false, group: '신설' },
  { id: 'monetization-strategist', name: '수익화 전략가',   role: '플랜 짜기',         tint: '#7c87e5', isCore: false, group: '신설' },

  // --- 매체별 풀 8명 — 매체 선택 시 surface ---
  { id: 'storyboard-agent',       name: '스토리보드 감독',  role: '장면 분해',         tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'speech-bubble-agent',    name: '말풍선 감독',      role: '대사 리듬',         tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'keyframe-art-director',  name: '키프레임 아트',    role: '핵심 그림',         tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'frame-assembly-agent',   name: '프레임 어셈블러',  role: '컷 합성',           tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'davinci-image-agent',    name: '이미지 감독',      role: '컷별 그림',         tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'brand-homepage-director', name: '홈페이지 디렉터', role: '브랜드 화면',       tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'work-library-manager',   name: '작품 라이브러리',  role: '작가실 색인',       tint: '#7c87e5', isCore: false, group: '매체' },
  { id: 'publishing-distribution-manager', name: '유통 매니저', role: '배포 채널',     tint: '#7c87e5', isCore: false, group: '매체' },
];

export const ALL_PERSONAS: PersonaCard[] = [...CORE_PERSONAS, ...EXTENDED_PERSONAS];

/** id 로 PersonaCard 를 찾는다. 모르는 id 면 grey fallback 을 돌려준다. */
export function findPersona(id: string): PersonaCard {
  return (
    ALL_PERSONAS.find((p) => p.id === id) ?? {
      id,
      name: id,
      role: '',
      tint: '#62666d',
      isCore: false,
    }
  );
}
