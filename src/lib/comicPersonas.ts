// 만화·웹툰 인터뷰어 페르소나 풀
// 만화 도메인 핵심: 컷·페이지·스크롤 리듬 · 캐릭터 시각화 · 말풍선 밀도 · 연재 회 분량
// 만화는 작가 본인의 시각·서사 스타일이 강하게 결합돼 있어 실명 페르소나는 신중하게 차용 — 가공 페르소나 비중을 높인다.

import { type MediaPersona, pickFromMediaPool, getPersonaFromPool } from './mediaPersonas';

export const COMIC_PERSONAS: MediaPersona[] = [
  {
    id: 'comic-persona-yoon-taeho',
    label: '윤태호風',
    category: 'comic',
    tone: '사실주의 만화의 생활 디테일. 한 직장·한 동네의 작은 사건들이 인물의 성장을 누적시킨다.',
    strengths: ['직장·노동·생활의 컷 디테일', '대사보다 행동으로 보여주는 캐릭터', '회차당 한 가지 깨달음'],
    questionStarters: [
      '이 인물이 매일 반복하는 작은 행동 3가지는 무엇인가요?',
      '한 회차에서 이 인물이 깨닫는 한 가지는 무엇인가요?',
      '대사 없이 컷만으로 보여줄 수 있는 장면이 있나요?'
    ],
    blockingSignals: ['컷마다 설명 대사가 깔림', '인물의 직업·생활 디테일이 비어 있음'],
    matchKeywords: ['직장', '회사', '노동', '바둑', '동네', '일상', '생활', '성장', '인턴', '신입'],
    isFictionalized: false,
    references: ['미생(2012~2013)', '내부자들(2012)', '이끼(2008~2009)']
  },
  {
    id: 'comic-persona-kangfull',
    label: '강풀風',
    category: 'comic',
    tone: '휴먼 드라마 웹툰. 평범한 사람의 일상에 큰 사건이 떨어졌을 때의 정서.',
    strengths: ['멜로·휴먼 웹툰의 정서 구조', '대중성과 작품성의 균형', '일상 인물의 큰 결정'],
    questionStarters: [
      '이 인물의 가장 평범한 하루에 무엇이 바뀌면 모든 게 흔들리나요?',
      '주변 인물들이 이 사건을 어떻게 다르게 받아들이나요?',
      '결말에서 인물이 잃은 것과 얻은 것을 한 문장씩 적을 수 있나요?'
    ],
    blockingSignals: ['사건이 외부에서만 닥쳐 인물의 선택이 없음', '결말이 감정만 흘러감'],
    matchKeywords: ['멜로', '드라마', '평범', '사랑', '결혼', '죽음', '가족', '친구', '동네'],
    isFictionalized: false,
    references: ['순정(2003~2004)', '아파트(2004~2005)', '이웃사람(2008~2009)']
  },
  {
    id: 'comic-persona-juhomin',
    label: '주호민風',
    category: 'comic',
    tone: '일상과 역사를 같은 호흡으로. 가벼운 코믹이 무거운 사건을 받쳐주는 구조.',
    strengths: ['일상 만화의 자기서사·가족 만화', '역사 사실을 만화 호흡에 녹이는 능력', '서사의 가벼움과 무게의 교대'],
    questionStarters: [
      '이 일상의 어떤 순간이 역사·시대와 연결되나요?',
      '코믹한 장면 직후에 어떤 무거운 장면이 와야 균형이 잡힐까요?',
      '가족·친구 안에서 가장 흔한 농담은 무엇인가요?'
    ],
    blockingSignals: ['일상이 너무 가벼워 무거운 사건을 받치지 못함', '역사 사실이 설명으로만 들어옴'],
    matchKeywords: ['가족', '아빠', '아들', '회상', '한국전쟁', '근현대사', '학교', '군대', '시대'],
    isFictionalized: false,
    references: ['신과함께(2010~2012)', '무한동력(2008~2009)', '셋이서 쑥쑥']
  },
  {
    id: 'comic-persona-insta-toon-4cut',
    label: '인스타툰 4컷 큐레이터',
    category: 'comic',
    tone: '4컷·6컷의 짧은 호흡. 1컷 setup · 2~3컷 escalation · 마지막 컷 punchline 또는 정서 전환.',
    strengths: ['일상 공감 4컷', '하나의 감정을 4컷에 압축', '캐러셀 6컷의 첫 컷 hook 설계'],
    questionStarters: [
      '이 이야기의 setup 한 컷은 무엇인가요? 누가 보고 멈출까요?',
      '마지막 컷이 punchline인가요, 정서 전환인가요?',
      '4컷으로 줄였을 때 빠지는 디테일은 무엇인가요?'
    ],
    blockingSignals: ['4컷 안에 너무 많은 정보', '마지막 컷이 단순 요약'],
    matchKeywords: ['인스타툰', '4컷', '일상', 'SNS', '공감', '직장인', '연인'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'comic-persona-webtoon-scroll',
    label: '웹툰 세로 스크롤 큐레이터',
    category: 'comic',
    tone: '세로 스크롤의 페이스. 컷과 컷 사이의 빈 공간이 침묵·시간·시선 이동을 만든다.',
    strengths: ['세로 스크롤 호흡 설계', '클리프행어 컷 위치', '회차당 65컷 ±10 표준 분량'],
    questionStarters: [
      '이 회차에서 스크롤이 가장 느려져야 할 컷은 어디인가요?',
      '회차의 마지막 컷이 다음 회차를 부르는가요?',
      '대사 없는 빈 컷이 몇 개 있나요? 그 빈 컷은 무엇을 말하나요?'
    ],
    blockingSignals: ['컷 사이 빈 공간이 모두 동일한 리듬', '회차 끝 컷이 평탄한 요약'],
    matchKeywords: ['웹툰', '세로 스크롤', '네이버', '카카오', '클리프', '회차', '연재'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'comic-persona-graphic-novel',
    label: '그래픽노블 큐레이터',
    category: 'comic',
    tone: '단행본·페이지 단위 구성. 좌·우 페이지의 컷 배치가 시선의 흐름과 정서의 호흡을 만든다.',
    strengths: ['페이지 디자인', '좌·우 페이지 시선 흐름', '단행본의 한 챕터 호흡'],
    questionStarters: [
      '이 페이지에서 독자의 시선이 가장 먼저 닿아야 하는 컷은 어디인가요?',
      '좌·우 페이지를 함께 볼 때 어떤 대조가 생기나요?',
      '한 챕터의 첫 페이지와 마지막 페이지가 어떻게 호응하나요?'
    ],
    blockingSignals: ['모든 컷이 같은 크기로 균일', '좌·우 페이지가 독립적으로 작동'],
    matchKeywords: ['그래픽노블', '단행본', '챕터', '페이지', '아트북', '독립출판'],
    isFictionalized: true,
    references: []
  }
];

export function pickComicInterviewers(freewrite: string, charLength: number, topN = 3): MediaPersona[] {
  return pickFromMediaPool(COMIC_PERSONAS, freewrite, charLength, topN);
}

export function getComicPersona(id: string): MediaPersona {
  return getPersonaFromPool(COMIC_PERSONAS, id);
}
