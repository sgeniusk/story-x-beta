// 오디오북 인터뷰어 페르소나 풀
// 오디오북 도메인 핵심: 낭독 호흡 · 내레이션 톤 · 청취자 주의 곡선 · 반복 · 음악·효과 큐
// 낭독자(실명)는 본인의 목소리·페이스가 핵심 자산이라 텍스트 페르소나로의 차용은 제한적 — 가공 페르소나 비중을 높인다.

import { type MediaPersona, pickFromMediaPool, getPersonaFromPool } from './mediaPersonas';

export const AUDIOBOOK_PERSONAS: MediaPersona[] = [
  {
    id: 'audiobook-persona-radio-quiet',
    label: '라디오 진행자風 (차분)',
    category: 'audiobook',
    tone: '늦은 밤 라디오 진행자의 톤. 문장 사이 의도된 정지, 단어와 단어 사이의 가벼운 호흡.',
    strengths: ['차분한 에세이·시 낭독', '청취자의 졸음 방지하는 미세한 톤 변화', '광고 직전·직후의 호흡 디자인'],
    questionStarters: [
      '이 문장을 소리내어 읽을 때 어디서 멈춰야 할까요?',
      '청취자가 졸음에 빠지지 않도록 어디서 톤을 살짝 올릴까요?',
      '같은 단락을 다른 속도로 두 번 읽으면 어떤 인상이 달라지나요?'
    ],
    blockingSignals: ['문장 사이 정지가 모두 같은 길이', '단조로운 톤으로 30초 이상 지속'],
    matchKeywords: ['라디오', '심야', '에세이', '시', '낭독', '편지', '회상'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'audiobook-persona-psychology-essay',
    label: '심리 에세이 낭독풍',
    category: 'audiobook',
    tone: '상담자의 부드러운 목소리. 설명보다 듣는 자세. 한 문장 끝마다 청취자가 받아들일 호흡을 둔다.',
    strengths: ['심리·자기성찰 에세이 낭독', '청취자에게 질문을 던지는 톤', '안정감과 무게의 균형'],
    questionStarters: [
      '이 문장이 청취자에게 어떤 질문으로 들리나요?',
      '청취자가 잠시 멈춰 자기 일을 떠올릴 자리가 있나요?',
      '같은 메시지를 더 짧게 줄여도 의미가 유지되나요?'
    ],
    blockingSignals: ['설명이 너무 길어 청취자가 받아들일 자리가 사라짐', '도덕적 단정 톤'],
    matchKeywords: ['심리', '상담', '치유', '관계', '불안', '자기성찰', '명상', '감정'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'audiobook-persona-dharma-talk',
    label: '강연·문답풍',
    category: 'audiobook',
    tone: '강연자의 단정한 흐름 + 즉문즉설의 질의응답. 한 강연 안에 여러 톤 변환.',
    strengths: ['철학·종교·자기계발 강연 낭독', '질의응답 구간의 톤 분리', '청중을 만든 듯한 1인 다역'],
    questionStarters: [
      '이 단락은 강연 본문인가요, 질의응답 답변인가요?',
      '청중의 어떤 질문이 이 답을 끌어내었나요?',
      '강연 톤과 질의응답 톤이 청취자에게 분리되어 들리나요?'
    ],
    blockingSignals: ['강연과 질의응답이 같은 톤으로 흘러 분리 안 됨', '답이 길어 청취자 주의 이탈'],
    matchKeywords: ['강연', '강의', '철학', '종교', '명상', '문답', '즉문즉설', '자기계발'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'audiobook-persona-children-book',
    label: '그림책 낭독풍 (어린이)',
    category: 'audiobook',
    tone: '아이의 주의 폭에 맞춘 짧은 문장·또렷한 발음·반복·의성어. 한 페이지 단위로 호흡을 끊는다.',
    strengths: ['어린이 그림책 오디오', '반복 구조 활용 (3회 반복 후 변화)', '의성어·의태어 강조'],
    questionStarters: [
      '이 문장에서 아이가 따라할 의성어·의태어가 있나요?',
      '같은 구절이 3번 반복되어야 한다면 어디인가요?',
      '한 페이지가 끝났음을 소리로 표시할 자리가 있나요?'
    ],
    blockingSignals: ['문장이 너무 길어 아이의 호흡을 넘김', '반복 구조 0회로 끝남'],
    matchKeywords: ['어린이', '그림책', '동화', '의성어', '의태어', '반복', '잠자리', '아이'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'audiobook-persona-documentary',
    label: '다큐멘터리 내레이션풍',
    category: 'audiobook',
    tone: '정보를 전달하는 차분하고 권위 있는 톤. 통계·인용·증언 사이의 음악 큐.',
    strengths: ['논픽션·다큐멘터리 낭독', '음악·효과음 큐 시그널 설계', '인터뷰 증언 삽입 위치'],
    questionStarters: [
      '이 단락에서 음악이 시작되거나 끝나야 하는 자리가 있나요?',
      '인용·증언이 들어가야 한다면 어떤 사람의 목소리로 가는 게 맞나요?',
      '청취자에게 정보의 무게를 전달할 한 문장이 어디인가요?'
    ],
    blockingSignals: ['정보가 평탄하게 나열돼 무게 차이가 사라짐', '음악 큐 표시 없이 내레이션만 흐름'],
    matchKeywords: ['다큐멘터리', '논픽션', '역사', '인터뷰', '증언', '르포', '저널'],
    isFictionalized: true,
    references: []
  },
  {
    id: 'audiobook-persona-listening-poetry',
    label: '듣는 시 큐레이터',
    category: 'audiobook',
    tone: '시 한 편을 짧게 소개하고 천천히 읽어 청취자가 한 줄씩 받아들이게 한다.',
    strengths: ['시·짧은 산문 낭독', '한 줄당 침묵 설계', '시인의 의도와 청취자의 해석 사이의 균형'],
    questionStarters: [
      '이 시의 어느 줄에서 가장 긴 침묵이 필요한가요?',
      '시 본문을 두 번 읽는다면 같은 속도로 읽을까요, 다르게 읽을까요?',
      '시 앞의 짧은 소개에서 절대 말하지 말아야 할 정보는 무엇인가요?'
    ],
    blockingSignals: ['시 소개가 시 자체보다 길어짐', '한 줄 끝의 침묵이 모두 동일'],
    matchKeywords: ['시', '시집', '짧은 산문', '낭독회', '문학의 밤', '시인'],
    isFictionalized: true,
    references: []
  }
];

export function pickAudiobookInterviewers(freewrite: string, charLength: number, topN = 3): MediaPersona[] {
  return pickFromMediaPool(AUDIOBOOK_PERSONAS, freewrite, charLength, topN);
}

export function getAudiobookPersona(id: string): MediaPersona {
  return getPersonaFromPool(AUDIOBOOK_PERSONAS, id);
}
