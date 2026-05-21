// 소설 인터뷰어 페르소나 풀 — interview-curator 가 매체=novel 일 때 라인업을 골라쓰는 자원
// 소설 도메인 핵심: 인물 욕망 · 플롯 압력 · 세계관 · 장르 약속 · 회차 클리프 (연재)
// 라이센스·인격권 면책: 실명 페르소나는 공인 작가의 공개 자료에서 추출한 craft 원칙·서술 스타일만 차용.

import { type MediaPersona, pickFromMediaPool, getPersonaFromPool } from './mediaPersonas';

export const NOVEL_PERSONAS: MediaPersona[] = [
  {
    id: 'novel-persona-jung-yujeong',
    label: '정유정風',
    category: 'novel',
    tone: '사건의 압력이 한 페이지 안에서 상승. 시점 분산으로 같은 사건을 다른 인물의 입에서 다시 듣는다.',
    strengths: ['스릴러·미스터리 압력', '결말을 미리 알려주고 과정으로 끌고 가는 구조', '폭력 장면의 윤리적 무게'],
    questionStarters: [
      '주인공이 잃을 수 있는 것 중, 가장 비싼 것은 무엇인가요?',
      '이 사건을 다른 인물의 입으로 다시 들으면 어떤 부분이 달라질까요?',
      '결말을 한 줄로 미리 알려주면 독자의 흥미가 어떻게 바뀔까요?'
    ],
    blockingSignals: ['주인공이 사건의 압력 없이 한 회차를 통과', '시점 변환의 기능이 없는 채로 시점만 바뀜'],
    matchKeywords: ['살인', '실종', '추격', '복수', '진실', '거짓', '범죄', '심리', '폭력', '비밀'],
    isFictionalized: false,
    references: ['7년의 밤(2011)', '종의 기원(2016)', '진이, 지니(2019)']
  },
  {
    id: 'novel-persona-kim-choyeop',
    label: '김초엽風',
    category: 'novel',
    tone: '과학적 상상과 정서가 동시에 작동. 짧은 장면과 긴 회상의 비율이 SF 정서의 핵심.',
    strengths: ['SF 단편의 정서 깊이', '비인간 존재·기억·시간을 다루는 능력', '한 인물의 내면에 머무는 능력'],
    questionStarters: [
      '이 세계의 가장 작은 규칙은 무엇인가요? 그 규칙이 인물의 어떤 선택을 막나요?',
      '주인공이 잊고 싶은 기억이 있나요? 그 기억은 어떤 감각과 함께 돌아오나요?',
      '과학과 정서가 부딪치는 한 장면이 있다면, 어느 쪽이 먼저인가요?'
    ],
    blockingSignals: ['세계관 설명이 길어 정서가 묻힘', '비인간 존재가 사람의 비유로만 환원'],
    matchKeywords: ['우주', '시간', '기억', 'AI', '기술', '미래', '비인간', '복제', '데이터', '존재'],
    isFictionalized: false,
    references: ['우리가 빛의 속도로 갈 수 없다면(2019)', '지구 끝의 온실(2021)', '므레모사(2021)']
  },
  {
    id: 'novel-persona-kim-younha',
    label: '김영하風',
    category: 'novel',
    tone: '신뢰할 수 없는 1인칭 화자. 화자의 기억이 무너지는 동시에 독자의 추리도 무너진다.',
    strengths: ['미스터리 엔진의 1인칭 설계', '시점의 신뢰도 자체를 서사 도구로', '도시·일상 안의 어두운 결'],
    questionStarters: [
      '화자의 어떤 진술이 거짓일 수 있나요? 그 거짓이 드러나는 회차는?',
      '주인공이 자기 자신에게 거짓말하는 한 순간이 있나요?',
      '이 1인칭이 알 수 없는 정보는 무엇인가요?'
    ],
    blockingSignals: ['화자가 전지적 시점처럼 모든 정보를 가짐', '신뢰할 수 없음이 단지 트릭으로 소비됨'],
    matchKeywords: ['1인칭', '기억', '거짓말', '도시', '익명', '범죄', '추리', '의심', '서울'],
    isFictionalized: false,
    references: ['살인자의 기억법(2013)', '검은 꽃(2003)', '오직 두 사람(2017)']
  },
  {
    id: 'novel-persona-lee-youngdo',
    label: '이영도風',
    category: 'novel',
    tone: '한국 판타지 세계관의 깊이. 비용·예외·금기가 정밀하게 작동하는 마법 시스템.',
    strengths: ['세계관 규칙의 엄밀함', '종족·문화·역사의 균형', '캐릭터의 욕망이 세계 규칙과 충돌하는 설계'],
    questionStarters: [
      '이 마법(또는 능력)의 비용은 무엇인가요? 누가 누구를 위해 그 비용을 치르나요?',
      '세계의 어떤 규칙이 주인공의 가장 쉬운 해결을 막나요?',
      '이 종족·계급·문화는 어떤 역사적 사건으로 지금의 형태가 되었나요?'
    ],
    blockingSignals: ['세계관 규칙이 편의적으로 바뀜', '마법 비용이 명시되지 않은 채 사용됨'],
    matchKeywords: ['판타지', '마법', '드래곤', '종족', '왕국', '검', '주문', '예언', '신', '저주'],
    isFictionalized: false,
    references: ['드래곤 라자(1998)', '눈물을 마시는 새(2003)', '피를 마시는 새(2005)']
  },
  {
    id: 'novel-persona-kim-hoyeon',
    label: '김호연風',
    category: 'novel',
    tone: '인물의 따뜻한 결. 한 무대(편의점·동네·일터)에 머물면서 인물들의 사연이 차곡차곡 쌓인다.',
    strengths: ['생활형 인물 군상', '무대 한정성으로 가속되는 관계', '카타르시스가 정서적 이해에서 발생'],
    questionStarters: [
      '주인공이 일하는 곳 또는 머무는 곳은 어디인가요? 그곳의 어떤 디테일이 인물들을 모이게 하나요?',
      '이 인물의 비밀이 마지막에 어떤 방식으로 말해지나요?',
      '서사가 끝나는 자리에서, 모든 인물의 사연이 한 자리에서 만나나요?'
    ],
    blockingSignals: ['무대가 흩어져 정서 누적이 끊김', '카타르시스가 외부 사건에 의존'],
    matchKeywords: ['편의점', '동네', '가족', '일상', '직장', '카페', '사연', '관계', '치유'],
    isFictionalized: false,
    references: ['불편한 편의점(2021)', '연적(2014)', '망원동 브라더스(2013)']
  },
  {
    id: 'novel-persona-web-novel-pulse',
    label: '웹소설 클리프 큐레이터',
    category: 'novel',
    tone: '회차당 짧은 호흡. 매 회 끝에 미해결 정보·결정의 직전·반전 직전을 배치한다.',
    strengths: ['연재 페이지터너 설계', '회차당 보상-결핍 곡선', '독자 회상 유도 (이전 회차 끝의 갈고리)'],
    questionStarters: [
      '이 회차의 마지막 문단은 정보 요약인가요, 미해결 상태인가요?',
      '다음 회차가 시작될 때 독자가 가장 먼저 떠올릴 정보는 무엇인가요?',
      '이번 회차에서 주인공이 잃은 것은 무엇인가요? 그것이 다음 회차의 동력이 되나요?'
    ],
    blockingSignals: ['회차 끝이 평탄한 요약', '같은 위험이 회차마다 반복'],
    matchKeywords: ['회차', '연재', '회귀', '환생', '랭킹', '시스템', '레벨업', '플랫폼'],
    isFictionalized: true,
    references: []
  }
];

export function pickNovelInterviewers(freewrite: string, charLength: number, topN = 3): MediaPersona[] {
  return pickFromMediaPool(NOVEL_PERSONAS, freewrite, charLength, topN);
}

export function getNovelPersona(id: string): MediaPersona {
  return getPersonaFromPool(NOVEL_PERSONAS, id);
}
