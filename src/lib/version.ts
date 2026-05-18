export type StoryXReleaseChannel = 'alpha' | 'beta' | 'stable';

export interface StoryXVersionInfo {
  product: 'Story X';
  version: string;
  channel: StoryXReleaseChannel;
  label: string;
  codename: string;
  releasedAt: string;
  latestCommit: string;
  testProof: string;
  buildProof: string;
  summary: string;
}

export interface StoryXVersionLogEntry {
  version: string;
  label: string;
  date: string;
  title: string;
  commit: string;
  changes: string[];
  verification: string[];
  next: string;
}

export const STORYX_VERSION: StoryXVersionInfo = {
  product: 'Story X',
  version: '0.10.0',
  channel: 'alpha',
  label: 'Alpha v0.10.0',
  codename: 'Quiet Studio',
  releasedAt: '2026-05-18',
  latestCommit: 'd05aa6a',
  testProof: '127 tests passing',
  buildProof: 'Vite production build passing',
  summary: '랜딩·프로젝트·홈·에디터·로그인을 Notion 디자인 시스템으로 다시 세우고, 에디터 작업 구조를 작가가 원고에 집중하도록 정리한 디자인 마일스톤입니다.'
};

export const storyxVersionLog: StoryXVersionLogEntry[] = [
  {
    version: '0.10.0',
    label: 'Alpha v0.10.0',
    date: '2026-05-18',
    title: 'Notion 디자인 시스템과 에디터 구조 개편',
    commit: 'd05aa6a',
    changes: [
      '랜딩·프로젝트 목록·홈 플로우·에디터·로그인을 Notion 디자인 시스템(라이트 캔버스·purple primary·사각 버튼)으로 다시 지었습니다.',
      '에디터를 원고가 주인공이 되도록 정리했습니다 — 얇은 툴스트립, 상단바 액션 축소, 트랙 전환 페이드.',
      '에디터 좌측 레일을 단일 스크롤·카드형 회차 목록·캐논 건강도 바로, 바이블 목차를 갤러리 카드 그리드로 바꿨습니다.',
      '작가진 다이얼로그를 헤더·본문 스크롤·입력 3분할로 나눠 조언이 길어도 입력창이 항상 보입니다.',
      '작가 인터뷰 질문을 매체별 6~10개로 늘리고, 자유 메모를 마지막 단계로 분리했습니다.',
      '브랜드 심볼 로고를 모든 화면 상단에 복원했습니다.'
    ],
    verification: ['npm test: 28 files / 127 tests', 'npm run build: pass'],
    next: '만화 제작실과 서버측 LLM 운영(2단계 E)을 준비한다.'
  },
  {
    version: '0.9.0',
    label: 'Alpha v0.9.0',
    date: '2026-05-17',
    title: '닫힌 창작 루프와 craft 적용',
    commit: '35fdc55',
    changes: [
      '검토에서 승인한 기억 후보가 실제 작품 캐논으로 반영되어 생성-검토-승인 루프가 닫혔습니다.',
      '작가 인터뷰가 매체별 고정 질문 대신 작가가 쓴 자유 서술을 읽고 그 작품에 맞는 질문을 만듭니다.',
      '인터뷰어가 유명 작가 오마주 페르소나(아가타 크리스·도스토옙·무라카메 등)로 묻습니다.',
      '대중성·작품성 리서치를 반영해 Story Contract(표면 약속·심층 질문·무게중심)와 검토 craft 기준, 문체 평가를 확장했습니다.',
      '장편 10화 회귀 하네스, 작품 버전 히스토리·복원, 직접 편집 diff, 매체별 생성·검토를 더했습니다.'
    ],
    verification: ['npm test: 28 files / 130 tests', 'npm run build: pass'],
    next: '외부 사용자를 위한 서버측 LLM 운영(2단계 E)을 준비한다.'
  },
  {
    version: '0.8.0',
    label: 'Alpha v0.8.0',
    date: '2026-05-16',
    title: '실제 LLM 글쓰기 루프',
    commit: '3e548b7',
    changes: [
      '편집기의 초안 생성이 로컬 브리지를 거쳐 실제 Claude 구독 호출로 회차를 만듭니다.',
      '흐름 검증·결 점검이 쇼러너·캐릭터·배경·장르·연속성 에이전트의 실제 검토를 받습니다.',
      '2화 이상 생성 시 확정 캐논·인물·세계 규칙을 함께 넘겨 회차 연속성을 지킵니다.'
    ],
    verification: ['npm test: 24 files / 113 tests', 'npm run build: pass'],
    next: '검토에서 승인한 기억 후보가 실제 작품 캐논·바이블로 반영되는 루프를 닫는다.'
  },
  {
    version: '0.7.1',
    label: 'Alpha v0.7.1',
    date: '2026-05-15',
    title: '에디터 회차 탭 레이아웃 핫픽스',
    commit: '43b60ac',
    changes: [
      '원고 화면의 작업대 행 구조를 원고 모드 전용 4행 레이아웃으로 분리했습니다.',
      '회차 탭이 620px 원고 행을 차지하며 세로 막대로 늘어나는 문제를 막았습니다.',
      '작품 바이블과 출간 준비 화면은 불필요한 빈 grid row를 만들지 않도록 별도 모드 클래스를 사용합니다.'
    ],
    verification: ['npm test: 24 files / 111 tests', 'npm run build: pass'],
    next: '에디터 상단 액션 밀도와 원고 본문 폭을 계속 다듬는다.'
  },
  {
    version: '0.7.0',
    label: 'Alpha v0.7.0',
    date: '2026-05-15',
    title: '명령 팔레트와 빠른 이동',
    commit: '9691421',
    changes: [
      '⌘K 명령 팔레트로 초안 생성, 흐름 검증, 바이블, 승인 대기, 출간 준비를 바로 실행합니다.',
      '⌘. 집중 모드 단축키를 앱 셸에 연결했습니다.',
      '편집 중인 사용자가 화면을 찾아 헤매지 않도록 주요 행동을 한곳에 모았습니다.'
    ],
    verification: ['npm test: 23 files / 106 tests', 'npm run build: pass'],
    next: '작품 바이블과 메모리 승인 큐의 편집 경험을 더 직관적으로 만든다.'
  },
  {
    version: '0.6.0',
    label: 'Alpha v0.6.0',
    date: '2026-05-15',
    title: '출간 게이트와 스냅샷 잠금',
    commit: 'c6da0d3',
    changes: [
      '출간 전 release gate가 남아 있으면 스냅샷 잠금을 차단합니다.',
      '메모리 승인 상태가 출간 가능 여부에 직접 반영됩니다.'
    ],
    verification: ['npm test: 23 files / 105 tests', 'npm run build: pass'],
    next: '출간 패키지와 변경 로그 drawer를 실제 export 흐름으로 확장한다.'
  },
  {
    version: '0.5.0',
    label: 'Alpha v0.5.0',
    date: '2026-05-15',
    title: 'One Project Vertical Slice',
    commit: '8cb7bd1',
    changes: [
      '하나의 Story Contract에서 웹소설 1화, 인스타툰 4컷, 오디오북 30초 proof를 만듭니다.',
      '각 proof가 승인 전 memory candidate로 들어가도록 연결했습니다.'
    ],
    verification: ['npm test: 23 files / 101 tests', 'npm run build: pass'],
    next: 'vertical slice proof를 실제 파일 기반 memory-bank와 연결한다.'
  },
  {
    version: '0.4.0',
    label: 'Alpha v0.4.0',
    date: '2026-05-14',
    title: '작품 바이블과 메모리 승인 큐',
    commit: '9470584',
    changes: [
      '캐릭터, 세계관, 캐논, 문체, 승인 대기를 작품 바이블 트랙으로 분리했습니다.',
      '새 기억 후보는 사용자 승인 전까지 canon에 반영하지 않습니다.'
    ],
    verification: ['npm test: pass', 'npm run build: pass'],
    next: '승인된 기억만 실제 memory-bank 파일에 sync한다.'
  },
  {
    version: '0.3.0',
    label: 'Alpha v0.3.0',
    date: '2026-05-14',
    title: '집중형 에디터 셸',
    commit: '77f50fe',
    changes: [
      '마케팅 배너를 제거하고 원고 중심 앱 셸로 정리했습니다.',
      '왼쪽 목차, 중앙 창작물, 오른쪽 작가진/질문 레일 구조를 만들었습니다.'
    ],
    verification: ['npm test: pass', 'npm run build: pass'],
    next: '직접 편집 diff와 검토 결과를 더 선명하게 연결한다.'
  },
  {
    version: '0.2.0',
    label: 'Alpha v0.2.0',
    date: '2026-05-14',
    title: '홈페이지와 온보딩 플로우',
    commit: '5adfc5b',
    changes: [
      '매체 선택과 성향 질문을 거쳐 에디터로 들어가는 흐름을 만들었습니다.',
      '소설, 에세이, 만화 스토리보드, 오디오북 확장 방향을 정리했습니다.'
    ],
    verification: ['npm test: pass', 'npm run build: pass'],
    next: '홈에서 Story X의 매체 전환 브릿지를 더 명확히 설명한다.'
  },
  {
    version: '0.1.0',
    label: 'Alpha v0.1.0',
    date: '2026-05-13',
    title: 'Story X 창작 OS 초기 기준',
    commit: 'initial-alpha',
    changes: [
      '이야기가 먼저이고 매체는 그 다음이라는 제품 원칙을 세웠습니다.',
      '쇼러너, 캐릭터, 세계관, 문체, 연속성 에이전트의 writers room 모델을 시작했습니다.'
    ],
    verification: ['prototype smoke checks'],
    next: '소설과 에세이 중심의 첫 완성 루프를 만든다.'
  }
];
