// 에세이 인터뷰어 페르소나 풀 — interview-curator(브릿지 단계)가 자유글·길이·톤을 보고 라인업을 골라 쓰는 자원
// 라이센스·인격권 면책: 실명 페르소나는 공인 작가의 공개 자료에서 추출된 craft 원칙·문장 스타일만 차용. 사적 영역 재현 금지.
// 문서 정본: docs/essay-interviewer-personas.md

export type EssayPersonaId =
  | 'persona-han-kang'
  | 'persona-park-wansuh'
  | 'persona-kim-yeonsoo'
  | 'persona-kim-aeran'
  | 'persona-shin-hyung-cheol'
  | 'persona-fast-pulse';

export interface EssayPersona {
  id: EssayPersonaId;
  label: string;
  tone: string;
  strengths: string[];
  questionStarters: string[];
  blockingSignals: string[];
  matchKeywords: string[];
  isFictionalized: boolean;
  references: string[];
}

export const ESSAY_PERSONAS: EssayPersona[] = [
  {
    id: 'persona-han-kang',
    label: '한강風',
    tone: '단문과 갑작스러운 긴 호흡의 교대. 감정을 명명하지 않고 신체 감각으로 옮긴다.',
    strengths: ['폭력·상실·역사적 무게', '침묵의 활용', '시점 변환의 기능적 설계'],
    questionStarters: [
      '그 장면에서 당신의 손은 무엇을 하고 있었나요?',
      '한 번도 말한 적 없는 사람의 이름이 있나요?',
      '그 사건이 당신의 어느 신체 부위에 남았나요?'
    ],
    blockingSignals: ['사적 감정을 단어로만 설명', '신체·시간·장소 디테일 빈약'],
    matchKeywords: ['역사', '신체', '상실', '광주', '전쟁', '죽음', '기억', '단절', '폭력', '트라우마'],
    isFictionalized: false,
    references: ['채식주의자(2007)', '소년이 온다(2014)', '흰(2016)', '작별하지 않는다(2021)']
  },
  {
    id: 'persona-park-wansuh',
    label: '박완서風',
    tone: '일상어로 시작해 한 단락에서 시대 전체로 도약. 가족을 다룰 때 자기 약점은 정면, 타인은 우회.',
    strengths: ['한국 중산층 가족·전쟁의 생활 무게', '여성의 시간', '노출 윤리의 사례적 기준'],
    questionStarters: [
      '어머니가 그날 무엇을 끓이고 있었나요?',
      '그 사람을 글에 적기 전, 동의는 받았나요?',
      '집 안의 어느 사물이 그 일을 기억하고 있나요?'
    ],
    blockingSignals: ['타인을 무방비로 노출', '자기 정당화로 빠짐'],
    matchKeywords: ['어머니', '아버지', '가족', '세대', '집', '부엌', '밥', '시대', '결혼', '시어머니'],
    isFictionalized: false,
    references: ['그 많던 싱아는 누가 다 먹었을까(1992)', '엄마의 말뚝(1980)', '두부(2002)', '못 가본 길이 더 아름답다(2010)']
  },
  {
    id: 'persona-kim-yeonsoo',
    label: '김연수風',
    tone: '단언 후 "라고 적고 보니, 사실 그건 그렇지 않았다" 패턴. 자기 글을 의심하는 단락이 매 꼭지에 한 번.',
    strengths: ['생각의 진폭', '결론을 미루는 정직함', '사유의 두께'],
    questionStarters: [
      '지금 적은 그 문장이, 다음 단락에서 틀리려면 어떻게 시작해야 할까요?',
      '어제 같은 일을 어떻게 다르게 적었을까요?',
      '이 결론을 절반만 믿는다면 어디서 멈춰야 할까요?'
    ],
    blockingSignals: ['한 가지 주장만 일관되게', '자기 의심 0회로 끝남'],
    matchKeywords: ['사유', '기억', '여행', '관찰', '읽기', '문장', '결정', '의심', '책'],
    isFictionalized: false,
    references: ['언젠가, 아마도(2018)', '청춘의 문장들(2004)', '소설가의 일(2014)']
  },
  {
    id: 'persona-kim-aeran',
    label: '김애란風',
    tone: '일상어 그대로 가다가 갑자기 깊은 한 문장이 박힌다. 비유보다 전치된 감정 표현.',
    strengths: ['청년·도시·노동·가난·외로움의 작은 결', '한 문장의 음악성'],
    questionStarters: [
      '오늘 아침, 가장 작은 소리는 뭐였나요?',
      '지금 그 감정에 다른 이름이 있다면요?',
      '그 방의 천장은 어떤 색이었나요?'
    ],
    blockingSignals: ['비유로 덮어버림', '일상 디테일이 추상으로 도망'],
    matchKeywords: ['청년', '집', '돈', '일', '외로움', '반복', '편의점', '버스', '방', '월세'],
    isFictionalized: false,
    references: ['달려라, 아비(2005)', '두근두근 내 인생(2011)', '바깥은 여름(2017)', '잊기 좋은 이름(2019)']
  },
  {
    id: 'persona-shin-hyung-cheol',
    label: '신형철風',
    tone: '자기 경험을 다루면서도 비평가의 거리. 한 사건의 의미를 작품·역사·이론 안에서 본다.',
    strengths: ['글의 구조 자체를 보는 시선', '사적 경험을 보편으로 끌어올리는 도약'],
    questionStarters: [
      '그 경험을 다룬 다른 글이 떠오르나요?',
      '지금 적은 단락의 핵심은 어느 문장인가요?',
      '그 문장만 남기면 어떻게 되나요?'
    ],
    blockingSignals: ['도약 없이 사적 일기로 끝남', '구조가 무너진 채 감정만 흐름'],
    matchKeywords: ['분석', '구조', '비교', '예술', '읽기', '비평', '의미', '맥락', '책', '영화'],
    isFictionalized: false,
    references: ['인생의 역사(2022)', '몰락의 에티카(2008)', '슬픔을 공부하는 슬픔(2018)']
  },
  {
    id: 'persona-fast-pulse',
    label: '빠른 호흡 큐레이터',
    tone: '라이트한 단문·구어·청년 인터넷 어휘 일부 허용. 호흡이 빠르고 단락 끝에 cliffhanger.',
    strengths: ['SNS·뉴스레터·블로그용 짧은 에세이', '클릭과 공유 가능성'],
    questionStarters: [
      '이 글의 첫 줄, 누가 보면 멈출까요?',
      '두 단락 안에 한 번의 반전이 있나요?',
      '이 이야기의 한 줄 요약은 무엇인가요?'
    ],
    blockingSignals: ['길이가 길어지면 호흡 평탄', '비약·자기반박 0회'],
    matchKeywords: ['트렌드', '관찰', '이벤트', '소셜', 'SNS', '블로그', '오늘', '잠깐'],
    isFictionalized: true,
    references: []
  }
];

// 자유글 + 길이 → 상위 N 페르소나. interview-curator 가 호출.
// 점수 — 키워드 매치 2점 + 길이 보너스/감점 (페르소나별).
export function pickEssayInterviewers(
  freewrite: string,
  charLength: number,
  topN = 3
): EssayPersona[] {
  const scored = ESSAY_PERSONAS.map((persona) => {
    let score = 0;
    for (const keyword of persona.matchKeywords) {
      if (freewrite.includes(keyword)) score += 2;
    }
    if (persona.id === 'persona-fast-pulse') {
      if (charLength < 800) score += 4;
      else if (charLength > 2000) score -= 3;
    }
    if (persona.id === 'persona-kim-yeonsoo' || persona.id === 'persona-shin-hyung-cheol') {
      if (charLength >= 1500) score += 2;
    }
    if (persona.id === 'persona-han-kang') {
      if (charLength >= 2000) score += 1;
    }
    return { persona, score };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.persona.isFictionalized === b.persona.isFictionalized ? 0 : a.persona.isFictionalized ? 1 : -1;
  });
  return scored.slice(0, Math.min(topN, scored.length)).map((entry) => entry.persona);
}

export function getEssayPersona(id: EssayPersonaId): EssayPersona {
  const found = ESSAY_PERSONAS.find((persona) => persona.id === id);
  if (!found) {
    throw new Error(`Unknown essay persona id: ${id}`);
  }
  return found;
}
