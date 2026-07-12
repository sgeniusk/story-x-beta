export type CreativeMedium = 'novel' | 'essay' | 'audiobook' | 'comics' | 'academic';

export interface CreativeActionLabels {
  draft: string;
  review: string;
  lock: string;
  lockedChip: string;
  nextDraft: string;
}

export function getCreativeActionLabels(medium: CreativeMedium): CreativeActionLabels {
  switch (medium) {
    case 'essay':
      return {
        draft: '초안 쓰기',
        review: '결 점검',
        lock: '원고 잠금',
        lockedChip: '원고 잠금됨',
        nextDraft: '다음 편 쓰기'
      };
    case 'audiobook':
      return {
        draft: '낭독 초안',
        review: '낭독 흐름 점검',
        lock: '마스터링 잠금',
        lockedChip: '마스터링 잠금됨',
        nextDraft: '다음 회차 낭독'
      };
    case 'comics':
      return {
        draft: '콘티 시작',
        review: '컷 리듬 검토',
        lock: '발행 확정',
        lockedChip: '발행 확정됨',
        nextDraft: '다음 컷 콘티'
      };
    case 'academic':
      return {
        draft: '초안 집필',
        review: '논증 점검',
        lock: '원고 확정',
        lockedChip: '원고 확정됨',
        nextDraft: '다음 절 집필'
      };
    case 'novel':
    default:
      return {
        draft: '초안 생성',
        review: '흐름 검증',
        lock: '출간 확정',
        lockedChip: '출간 확정됨',
        nextDraft: '다음 회차 만들기'
      };
  }
}

export type CreativeFormat =
  | 'long-novel'
  | 'medium-novel'
  | 'short-novel'
  | 'personal-essay'
  | 'reflective-essay'
  | 'essay-series'
  | 'music-video'
  | 'educational-video'
  | 'children-song-reading'
  | 'serial-webtoon'
  | 'insta-toon'
  | 'four-cut-insta-toon'
  | 'short-comic'
  | 'graphic-novel'
  | 'research-paper'
  | 'academic-column'
  | 'literature-review';

// 온보딩 홈 플로우 단계 — 매체 선택→자유 서술→인터뷰→작품 헌장→빌딩. App.tsx·storage.ts 가 공유한다.
export type HomeFlowStep = 'medium' | 'freewrite' | 'playseed' | 'intake' | 'charter' | 'building';

export interface MediumOption {
  id: CreativeMedium;
  label: string;
  description: string;
  signal: string;
}

export interface FormatOption {
  id: CreativeFormat;
  label: string;
  description: string;
  cadence: string;
}

export interface CreativeSelection {
  medium: CreativeMedium;
  format: CreativeFormat;
}

export interface CreativeBlueprint {
  medium: CreativeMedium;
  mediumLabel: string;
  format: CreativeFormat;
  formatLabel: string;
  projectRoomTitle: string;
  projectRoomSubtitle: string;
  managementFocus: string[];
  agentStack: string[];
  skillStack: string[];
  productionPhases: Array<{
    title: string;
    outcome: string;
  }>;
  nextWorkspace:
    | 'serial-writing-studio'
    | 'essay-writing-studio'
    | 'audio-video-studio'
    | 'visual-storyboard-studio'
    | 'academic-writing-studio';
}

const mediumOptions: MediumOption[] = [
  {
    id: 'novel',
    label: '소설',
    description: '웹소설, 장르소설, 순문학, 시나리오형 장편까지 텍스트 중심으로 관리합니다.',
    signal: '인물, 세계관, 플롯, 문체, 회차 캐논'
  },
  {
    id: 'essay',
    label: '에세이',
    description: '내 경험과 주변 인물을 질문으로 끌어내고, 문체를 일관되게 다듬어 글로 만듭니다.',
    signal: '내 이야기, 실제 인물, 질문, 문체 취향'
  },
  {
    id: 'audiobook',
    label: '오디오북',
    description: '낭독, 음악, 자막, 영상 리듬까지 함께 설계해 들리는 이야기와 보이는 장면을 만듭니다.',
    signal: '음성 톤, 음악 큐, 자막, 영상 흐름'
  },
  {
    id: 'comics',
    label: '만화',
    description: '웹툰, 단편 만화, 그래픽노블처럼 컷과 장면 연속성이 중요한 작업을 관리합니다.',
    signal: '캐릭터 시트, 컷 연출, 배경, 에피소드 보드'
  },
  {
    id: 'academic',
    label: '사회과학/학술',
    description: '영어 APA 관행을 우선해 논제, 근거 구조, 반론, 인용 무결성을 한 원고 안에서 관리합니다.',
    signal: '논증, 근거, APA 인용, 연구 윤리'
  }
];

const formatOptions: Record<CreativeMedium, FormatOption[]> = {
  novel: [
    {
      id: 'long-novel',
      label: '장편',
      description: '수십 회차 이상 이어지는 시리즈. 캐논 레저와 떡밥 관리가 중심입니다.',
      cadence: '시즌 / 권 / 장기 연재'
    },
    // 중편(medium-novel)은 사용자 결정(2026-06-12 '중편 없음')으로 신규 포맷 선택지에서 제외한다.
    // CreativeFormat 타입·serialFormats·blueprintByFormat 에는 구버전 저장본 호환을 위해 남긴다.
    {
      id: 'short-novel',
      label: '단편',
      description: '하나의 질문과 하나의 정서적 반전을 또렷하게 완결합니다.',
      cadence: '4~8화 / 단일 효과'
    }
  ],
  essay: [
    {
      id: 'personal-essay',
      label: '개인 에세이',
      description: '하나의 경험을 묻고 파고들어, 나만의 해석과 문장 톤으로 완성합니다.',
      cadence: '1편 / 경험 중심'
    },
    {
      id: 'reflective-essay',
      label: '회고 에세이',
      description: '시간이 지난 사건을 다시 보며 변화, 후회, 배운 것을 정리합니다.',
      cadence: '기억 / 회고 / 전환'
    },
    {
      id: 'essay-series',
      label: '에세이 연재',
      description: '반복되는 주제와 문체를 유지하며 여러 편의 산문형 시리즈로 확장합니다.',
      cadence: '시리즈 / 테마 묶음'
    }
  ],
  audiobook: [
    {
      id: 'music-video',
      label: '뮤직비디오',
      description: '가사, 내레이션, 장면 전환, 음악 후킹을 함께 설계합니다.',
      cadence: '곡 / 장면 / 후렴'
    },
    {
      id: 'educational-video',
      label: '교육영상',
      description: '학습 목표, 설명 순서, 예시, 자막, 내레이션 톤을 관리합니다.',
      cadence: '러닝 목표 / 챕터'
    },
    {
      id: 'children-song-reading',
      label: '동요읽기',
      description: '아이들이 따라 말하고 부를 수 있도록 반복 문장, 리듬, 음성 톤을 설계합니다.',
      cadence: '반복 후렴 / 낭독'
    }
  ],
  comics: [
    {
      id: 'insta-toon',
      label: '인스타툰',
      description: '정사각형 캐러셀 컷, 네컷 여부, 짧은 공감 서사, 저장/공유 포인트를 다음 단계에서 관리합니다.',
      cadence: '캐러셀 / 네컷 선택'
    },
    {
      id: 'short-comic',
      label: '단편 만화',
      description: '단편 만화, 동화책, 그래픽노블처럼 페이지 단위 완결성이 중요한 작업을 관리합니다.',
      cadence: '단편 / 동화책 / 그래픽노블'
    },
    {
      id: 'serial-webtoon',
      label: '웹툰 연재',
      description: '회차별 스크롤 리듬, 컷 후킹, 캐릭터 비주얼 연속성을 관리합니다.',
      cadence: '주간 연재 / 컷 보드'
    }
  ],
  academic: [
    {
      id: 'research-paper',
      label: 'Research Paper',
      description: 'Introduction, Literature, Method, Discussion, Conclusion 흐름으로 영어 APA 논문 초안을 설계합니다.',
      cadence: 'APA / IMRaD 변형'
    },
    {
      id: 'academic-column',
      label: 'Academic Column',
      description: '사회과학 논점을 독자가 따라갈 수 있는 칼럼형 논증으로 압축합니다.',
      cadence: 'thesis / evidence / implications'
    },
    {
      id: 'literature-review',
      label: 'Literature Review',
      description: '선행연구의 쟁점, 공백, 반론을 정리하고 다음 연구 질문으로 연결합니다.',
      cadence: 'sources / debate / gap'
    }
  ]
};

const hiddenFormatOptions: Partial<Record<CreativeMedium, FormatOption[]>> = {
  comics: [
    {
      id: 'four-cut-insta-toon',
      label: '네컷 인스타툰',
      description: '좌상·우상·좌하·우하 4컷 고정 구성으로 짧은 상황과 반전을 만듭니다.',
      cadence: '4컷 / 1:1 정사각형'
    },
    {
      id: 'graphic-novel',
      label: '그래픽노블',
      description: '챕터 단위의 문학적 호흡과 반복 이미지, 페이지 구성을 함께 관리합니다.',
      cadence: '챕터 / 페이지 시퀀스'
    }
  ]
};

const blueprintByFormat: Record<CreativeFormat, Omit<CreativeBlueprint, 'medium' | 'mediumLabel' | 'format' | 'formatLabel'>> = {
  'long-novel': {
    projectRoomTitle: '장편 소설 설계 보드',
    projectRoomSubtitle: '시리즈 바이블을 먼저 잠그고, 회차가 늘어나도 캐릭터와 세계관이 버티는 구조를 만듭니다.',
    managementFocus: ['시리즈 바이블', '캐릭터 변화표', '세계관 규칙', '장기 떡밥 레저', '회차별 캐논'],
    agentStack: [
      '쇼러너 에이전트',
      '캐릭터 에이전트',
      '배경 에이전트',
      '장르별 글쓰기 에이전트',
      '문체 큐레이터 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['longform-series-continuity', 'genre-webnovel-production', 'humanizer'],
    productionPhases: [
      { title: '바이블 잠금', outcome: '주인공 욕망, 금기, 세계관 비용을 확정' },
      { title: '시즌 아크', outcome: '10-30화 단위의 질문과 반전을 배치' },
      { title: '회차 제작', outcome: '에이전트 협업으로 원고와 새 캐논을 생성' }
    ],
    nextWorkspace: 'serial-writing-studio'
  },
  'medium-novel': {
    projectRoomTitle: '중편 소설 설계 보드',
    projectRoomSubtitle: '분량이 제한된 만큼, 사건 수를 줄이고 감정 변화의 완성도를 관리합니다.',
    managementFocus: ['3막 구조', '핵심 인물 변화', '장면 목록', '복선 회수표'],
    agentStack: ['쇼러너 에이전트', '캐릭터 에이전트', '장르별 글쓰기 에이전트', '문체 큐레이터 에이전트', '연속성 감수 에이전트'],
    skillStack: ['longform-series-continuity', 'genre-webnovel-production', 'humanizer'],
    productionPhases: [
      { title: '중심 질문', outcome: '작품이 끝날 때 답할 질문을 하나로 압축' },
      { title: '장면 아크', outcome: '각 장면의 기능과 감정 전환을 정렬' },
      { title: '초고 제작', outcome: '챕터별 원고와 회수해야 할 단서를 관리' }
    ],
    nextWorkspace: 'serial-writing-studio'
  },
  'short-novel': {
    projectRoomTitle: '단편 소설 설계 보드',
    projectRoomSubtitle: '하나의 정서, 하나의 이미지, 하나의 반전을 중심으로 빠르게 완결합니다.',
    managementFocus: ['단일 효과', '화자 거리', '핵심 이미지', '마지막 문장'],
    agentStack: ['캐릭터 에이전트', '장르별 글쓰기 에이전트', '문체 큐레이터 에이전트', '연속성 감수 에이전트'],
    skillStack: ['genre-webnovel-production', 'humanizer'],
    productionPhases: [
      { title: '효과 정의', outcome: '독자가 마지막에 느낄 감정을 결정' },
      { title: '압축 설계', outcome: '불필요한 배경과 인물을 제거' },
      { title: '초고 제작', outcome: '짧은 원고와 문장 리듬을 점검' }
    ],
    nextWorkspace: 'serial-writing-studio'
  },
  'personal-essay': {
    projectRoomTitle: '개인 에세이 설계 보드',
    projectRoomSubtitle: '내 경험을 계속 질문으로 끌어내고, 실제 주변 인물을 보호하면서 나만의 문체로 정리합니다.',
    managementFocus: ['내 경험의 사실 관계', '주변 인물 보호', '핵심 질문', '문체 취향', '감정의 거리'],
    agentStack: [
      '인터뷰 에이전트',
      '주변 인물 에이전트',
      '문체 큐레이터 에이전트',
      '고미 라이터 에이전트',
      '휴머나이저 에이전트'
    ],
    skillStack: ['gomi-writing', 'humanizer', 'story-coach'],
    productionPhases: [
      { title: '질문 인터뷰', outcome: '경험의 표면 아래 있는 진짜 질문을 찾음' },
      { title: '인물 보호', outcome: '실제 주변 인물의 식별 정보와 감정 거리를 조정' },
      { title: '문체 샘플', outcome: '작성자 취향에 맞는 문장 리듬과 금지 표현을 고정' },
      { title: '초고 제작', outcome: '내 목소리를 유지한 에세이 초고로 연결' }
    ],
    nextWorkspace: 'essay-writing-studio'
  },
  'reflective-essay': {
    projectRoomTitle: '회고 에세이 설계 보드',
    projectRoomSubtitle: '지난 사건을 지금의 시선으로 다시 묻고, 변화의 의미를 자연스러운 한국어로 정리합니다.',
    managementFocus: ['기억의 순서', '그때의 나/지금의 나', '후회와 배움', '문체 일관성', '마지막 여운'],
    agentStack: [
      '인터뷰 에이전트',
      '주변 인물 에이전트',
      '문체 큐레이터 에이전트',
      '고미 라이터 에이전트',
      '휴머나이저 에이전트'
    ],
    skillStack: ['gomi-writing', 'humanizer', 'story-coach'],
    productionPhases: [
      { title: '기억 정렬', outcome: '사건, 감정, 깨달음의 시간을 분리' },
      { title: '거리 조정', outcome: '감정을 과장하지 않고 독자에게 닿는 거리로 조정' },
      { title: '문체 고정', outcome: '회고의 목소리와 문장 리듬을 저장' }
    ],
    nextWorkspace: 'essay-writing-studio'
  },
  'essay-series': {
    projectRoomTitle: '에세이 연재 설계 보드',
    projectRoomSubtitle: '여러 편으로 이어져도 같은 사람의 목소리처럼 읽히도록 질문, 소재, 문체를 관리합니다.',
    managementFocus: ['시리즈 테마', '반복 질문', '주변 인물 경계', '문체 바이블', '편별 여운'],
    agentStack: [
      '쇼러너 에이전트',
      '인터뷰 에이전트',
      '주변 인물 에이전트',
      '문체 큐레이터 에이전트',
      '고미 라이터 에이전트',
      '휴머나이저 에이전트'
    ],
    skillStack: ['gomi-writing', 'humanizer', 'story-coach', 'longform-series-continuity'],
    productionPhases: [
      { title: '시리즈 질문', outcome: '여러 편이 공유할 중심 질문과 독자 약속을 고정' },
      { title: '편별 소재', outcome: '각 편의 경험, 주변 인물, 감정 전환을 배치' },
      { title: '문체 바이블', outcome: '시리즈 전체의 문장 취향과 금지 표현을 저장' }
    ],
    nextWorkspace: 'essay-writing-studio'
  },
  'research-paper': {
    projectRoomTitle: '사회과학 논문 설계 보드',
    projectRoomSubtitle:
      '영어 APA 원고를 기준으로 논제, 선행연구, 방법, 논의, 결론의 뼈대를 먼저 잠급니다.',
    managementFocus: ['연구 질문', '주장-근거 매핑', 'APA 인용 무결성', '반론 처리', '연구 윤리 공개'],
    agentStack: [
      '에세이 큐레이터 에이전트',
      '평론가 에이전트',
      '인터뷰 큐레이터 에이전트',
      '논증 구조 에이전트'
    ],
    skillStack: ['academic-argument-outline', 'gomi-writing', 'story-coach'],
    productionPhases: [
      { title: '논제 설정', outcome: '연구 질문과 중심 주장을 한 문장으로 고정' },
      { title: '근거 구조', outcome: '각 주장에 필요한 데이터, 선행연구, 논리 근거를 배치' },
      { title: 'APA 원고 초안', outcome: 'Introduction-Literature-Method-Discussion-Conclusion 골격으로 초안화' }
    ],
    nextWorkspace: 'academic-writing-studio'
  },
  'academic-column': {
    projectRoomTitle: '학술 칼럼 설계 보드',
    projectRoomSubtitle:
      '사회과학 논점을 대중 독자가 따라갈 수 있게 압축하되, 근거와 인용의 출처 감각을 유지합니다.',
    managementFocus: ['핵심 논제', '주장-근거 매핑', 'APA 인용 무결성', '반론 처리', '사회적 함의'],
    agentStack: [
      '에세이 큐레이터 에이전트',
      '평론가 에이전트',
      '인터뷰 큐레이터 에이전트',
      '논증 구조 에이전트'
    ],
    skillStack: ['academic-argument-outline', 'story-coach'],
    productionPhases: [
      { title: '논점 압축', outcome: '칼럼이 답할 사회과학 질문을 하나로 압축' },
      { title: '근거 선별', outcome: '독자에게 보여줄 핵심 근거와 반론을 분리' },
      { title: '칼럼 초안', outcome: '학술 정확성과 읽히는 흐름을 함께 점검' }
    ],
    nextWorkspace: 'academic-writing-studio'
  },
  'literature-review': {
    projectRoomTitle: '문헌 리뷰 설계 보드',
    projectRoomSubtitle:
      '선행연구의 흐름, 대립 주장, 빈칸을 정리하고 다음 연구 질문으로 이어지는 리뷰를 만듭니다.',
    managementFocus: ['문헌 범위', '쟁점 지도', '주장-근거 매핑', 'APA 인용 무결성', '연구 공백'],
    agentStack: [
      '에세이 큐레이터 에이전트',
      '평론가 에이전트',
      '인터뷰 큐레이터 에이전트',
      '논증 구조 에이전트'
    ],
    skillStack: ['academic-argument-outline', 'story-coach'],
    productionPhases: [
      { title: '문헌 범위', outcome: '포함할 분야, 기간, 핵심 키워드를 정함' },
      { title: '논쟁 구조', outcome: '동의, 반론, 방법 차이를 축으로 선행연구를 배열' },
      { title: '리뷰 초안', outcome: '연구 공백과 다음 질문이 보이는 문헌 리뷰 골격 작성' }
    ],
    nextWorkspace: 'academic-writing-studio'
  },
  'music-video': {
    projectRoomTitle: '뮤직비디오 설계 보드',
    projectRoomSubtitle: '이야기, 가사, 음악 후킹, 장면 전환을 하나의 리듬으로 맞춥니다.',
    managementFocus: ['곡 구조', '후렴 후킹', '장면 전환', '자막 리듬', '비주얼 모티프'],
    agentStack: ['쇼러너 에이전트', '낭독 연출 에이전트', '사운드/음악 에이전트', '영상 콘티 에이전트', '연속성 감수 에이전트'],
    skillStack: ['remotion-video-production', 'visual-storyboard-continuity', 'humanizer'],
    productionPhases: [
      { title: '곡/이야기 약속', outcome: '후렴에서 반복될 감정과 핵심 문장을 확정' },
      { title: '오디오 큐', outcome: '보컬, 내레이션, 악기 진입, 쉬는 구간을 배치' },
      { title: '영상 리듬', outcome: '장면 전환, 자막, 반복 이미지 모티프를 정렬' }
    ],
    nextWorkspace: 'audio-video-studio'
  },
  'educational-video': {
    projectRoomTitle: '교육영상 설계 보드',
    projectRoomSubtitle: '학습 목표를 먼저 잠그고, 설명 순서와 예시, 자막, 내레이션을 함께 설계합니다.',
    managementFocus: ['학습 목표', '설명 순서', '예시/비유', '음성 톤', '자막 구조'],
    agentStack: ['교육 구성 에이전트', '낭독 연출 에이전트', '문체 큐레이터 에이전트', '영상 콘티 에이전트', '연속성 감수 에이전트'],
    skillStack: ['educational-video-creator', 'remotion-video-production', 'humanizer'],
    productionPhases: [
      { title: '학습 목표', outcome: '시청자가 끝나고 설명할 수 있어야 할 내용을 하나로 압축' },
      { title: '설명 설계', outcome: '개념, 예시, 질문, 요약의 순서를 배치' },
      { title: '낭독/자막', outcome: '듣기 쉬운 문장과 화면 자막 밀도를 조정' }
    ],
    nextWorkspace: 'audio-video-studio'
  },
  'children-song-reading': {
    projectRoomTitle: '동요읽기 설계 보드',
    projectRoomSubtitle: '아이들이 따라 말할 수 있는 반복 문장, 안전한 정서, 느린 리듬을 중심으로 만듭니다.',
    managementFocus: ['반복 후렴', '아이 눈높이', '음성 톤', '안전한 정서', '따라 말하기'],
    agentStack: ['아동 언어 에이전트', '낭독 연출 에이전트', '사운드/음악 에이전트', '문체 큐레이터 에이전트', '연속성 감수 에이전트'],
    skillStack: ['educational-video-creator', 'humanizer'],
    productionPhases: [
      { title: '정서 약속', outcome: '아이에게 남길 감정과 안전한 표현 범위를 정함' },
      { title: '반복 리듬', outcome: '따라 말할 문장, 후렴, 박자 쉬는 곳을 배치' },
      { title: '낭독 제작', outcome: '목소리 톤, 음악 큐, 짧은 화면 지시를 준비' }
    ],
    nextWorkspace: 'audio-video-studio'
  },
  'serial-webtoon': {
    projectRoomTitle: '웹툰 연재 설계 보드',
    projectRoomSubtitle: '스크롤 리듬, 컷 후킹, 캐릭터 비주얼 연속성을 에피소드 단위로 관리합니다.',
    managementFocus: ['캐릭터 시트', '컷 연출 규칙', '말풍선 밀도', '키프레임 원화 선택', '배경 재사용', '회차 후킹', '콘티 레저'],
    agentStack: [
      '쇼러너 에이전트',
      '캐릭터 에이전트',
      '배경 에이전트',
      '웹툰 연출 에이전트',
      '말풍선 연출 에이전트',
      '원화/키프레임 감독',
      '다빈치 이미지 프롬프트 에이전트',
      '프레임 조립 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['longform-series-continuity', 'visual-storyboard-continuity'],
    productionPhases: [
      { title: '비주얼 바이블', outcome: '인물 실루엣, 의상, 배경 규칙을 고정' },
      { title: '원화 후보 선택', outcome: 'Midjourney 키프레임 후보 중 작품 DNA로 삼을 컷을 사용자가 승인' },
      { title: '에피소드 보드', outcome: '스크롤 구간별 컷 목표와 후킹 배치' },
      { title: '말풍선 패스', outcome: '대사 밀도, 말풍선 위치, 표정 가림을 검수' },
      { title: '콘티 제작', outcome: '컷 설명, 대사, 연출 메모를 생성' }
    ],
    nextWorkspace: 'visual-storyboard-studio'
  },
  'insta-toon': {
    projectRoomTitle: '인스타툰 설계 보드',
    projectRoomSubtitle: '캐러셀형인지 네컷형인지 다음 단계에서 정하고, 짧은 공감 서사와 저장하고 싶은 마지막 컷을 설계합니다.',
    managementFocus: ['캐러셀/네컷 선택', '정사각형 화면 구성', '첫 장 후킹', '말풍선 밀도', '키프레임 원화 선택', '공감 포인트', '저장/공유 컷'],
    agentStack: [
      '쇼러너 에이전트',
      '캐릭터 에이전트',
      '웹툰 연출 에이전트',
      '말풍선 연출 에이전트',
      '장르별 글쓰기 에이전트',
      '원화/키프레임 감독',
      '다빈치 이미지 프롬프트 에이전트',
      '프레임 조립 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['visual-storyboard-continuity'],
    productionPhases: [
      { title: '캐러셀 약속', outcome: '첫 장에서 멈춰 보게 할 질문과 감정을 확정' },
      { title: '원화 후보 선택', outcome: '반복될 인물 얼굴과 화면 톤을 사용자가 승인' },
      { title: '컷 리듬', outcome: '1-10장의 장면 전환, 대사 밀도, 여백을 배치' },
      { title: '말풍선 패스', outcome: '모바일에서 읽히는 글자 수와 위치를 조정' },
      { title: '마지막 저장 컷', outcome: '공유하거나 저장하고 싶은 문장과 이미지를 고정' }
    ],
    nextWorkspace: 'visual-storyboard-studio'
  },
  'four-cut-insta-toon': {
    projectRoomTitle: '네컷 인스타툰 설계 보드',
    projectRoomSubtitle:
      '캐릭터 참조, 좌상/우상/좌하/우하 4컷 구성, 말풍선 위치, 컷별 이미지 프롬프트까지 한 번에 관리합니다.',
    managementFocus: ['4컷 구성표', '좌상/우상/좌하/우하 배치', '말풍선 위치', '키프레임 원화 선택', '캐릭터 참조 이미지', '프레임 완성'],
    agentStack: [
      '캐릭터 에이전트',
      '웹툰 연출 에이전트',
      '말풍선 연출 에이전트',
      '원화/키프레임 감독',
      '다빈치 이미지 프롬프트 에이전트',
      '프레임 조립 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['visual-storyboard-continuity', 'aitoon-reference'],
    productionPhases: [
      { title: '원화 후보 선택', outcome: '기존 캐릭터 참조 이미지와 Midjourney 키프레임 후보 중 기준 컷을 승인' },
      { title: '4컷 구성', outcome: '좌상, 우상, 좌하, 우하에 상황 하나와 반전 하나를 배치' },
      { title: '말풍선 연출', outcome: '각 컷의 말풍선 방향, 글자 수, 표정 가림 위험을 지정' },
      { title: '컷별 프롬프트', outcome: '각 컷의 장면, 대사, 말풍선 위치, 1:1 이미지 지시를 분리' },
      { title: '프레임 완성', outcome: '4장 이미지를 하나의 정사각형 프레임으로 조립할 준비 완료' }
    ],
    nextWorkspace: 'visual-storyboard-studio'
  },
  'short-comic': {
    projectRoomTitle: '단편 만화 설계 보드',
    projectRoomSubtitle: '단편 만화, 동화책, 그래픽노블을 한 바구니로 두고 페이지 수, 컷 밀도, 문학적 호흡을 관리합니다.',
    managementFocus: ['페이지 플랜', '컷 밀도', '동화책 페이지', '그래픽노블 톤', '대사 절제', '키프레임 원화 선택'],
    agentStack: [
      '캐릭터 에이전트',
      '웹툰 연출 에이전트',
      '말풍선 연출 에이전트',
      '장르별 글쓰기 에이전트',
      '원화/키프레임 감독',
      '다빈치 이미지 프롬프트 에이전트',
      '프레임 조립 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['visual-storyboard-continuity'],
    productionPhases: [
      { title: '페이지 목표', outcome: '각 페이지가 넘길 이유를 정의' },
      { title: '컷 압축', outcome: '장면 정보를 최소 컷으로 전달' },
      { title: '콘티 제작', outcome: '대사와 그림 지시를 분리' }
    ],
    nextWorkspace: 'visual-storyboard-studio'
  },
  'graphic-novel': {
    projectRoomTitle: '그래픽노블 설계 보드',
    projectRoomSubtitle: '문학적 구조와 페이지 리듬을 함께 설계합니다.',
    managementFocus: ['챕터 리듬', '반복 이미지', '페이지 시퀀스', '톤 팔레트'],
    agentStack: [
      '쇼러너 에이전트',
      '캐릭터 에이전트',
      '배경 에이전트',
      '웹툰 연출 에이전트',
      '말풍선 연출 에이전트',
      '원화/키프레임 감독',
      '다빈치 이미지 프롬프트 에이전트',
      '프레임 조립 에이전트',
      '연속성 감수 에이전트'
    ],
    skillStack: ['longform-series-continuity', 'visual-storyboard-continuity'],
    productionPhases: [
      { title: '이미지 모티프', outcome: '반복될 시각 언어와 상징을 정의' },
      { title: '챕터 설계', outcome: '페이지 단위의 정서 흐름을 배치' },
      { title: '콘티 제작', outcome: '장면, 대사, 페이지 전환을 관리' }
    ],
    nextWorkspace: 'visual-storyboard-studio'
  }
};

// 연재형 포맷 — 회차(N화)가 누적되는 형식. 나머지는 단독 완결형(원고 하나).
const serialFormats: ReadonlySet<CreativeFormat> = new Set<CreativeFormat>([
  'long-novel',
  'medium-novel',
  'essay-series',
  'serial-webtoon',
  'insta-toon'
]);

// 포맷이 회차가 쌓이는 연재형인지 — 단편·단독 완결형이면 false.
export function isSerialFormat(format: CreativeFormat): boolean {
  return serialFormats.has(format);
}

// 작업 단위 명사 — 연재형은 "회차", 단독 완결형은 "원고". UI 라벨 분기에 쓴다.
export function getWorkUnitNoun(format: CreativeFormat): string {
  return isSerialFormat(format) ? '회차' : '원고';
}

export function getMediumOptions(): MediumOption[] {
  return mediumOptions;
}

export function getFormatOptions(medium: CreativeMedium): FormatOption[] {
  return formatOptions[medium];
}

export function buildCreativeBlueprint(selection: CreativeSelection): CreativeBlueprint {
  const medium = mediumOptions.find((option) => option.id === selection.medium);
  const availableFormats = medium ? [...formatOptions[selection.medium], ...(hiddenFormatOptions[selection.medium] ?? [])] : [];
  // 매체 전환 직후 이전 매체의 포맷이 남아 조합이 어긋나면(comics + 소설 포맷 등) throw 대신
  // 매체의 기본(첫) 포맷으로 폴백한다 — App.tsx useMemo 가 렌더 중 호출하므로 throw 는 앱 전체 크래시였다.
  const format = availableFormats.find((option) => option.id === selection.format) ?? availableFormats[0];

  if (!medium || !format) {
    throw new Error('Invalid creative selection');
  }

  return {
    medium: selection.medium,
    mediumLabel: medium.label,
    format: format.id,
    formatLabel: format.label,
    ...blueprintByFormat[format.id]
  };
}
