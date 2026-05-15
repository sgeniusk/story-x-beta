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
  version: '0.7.1',
  channel: 'alpha',
  label: 'Alpha v0.7.1',
  codename: 'Editor Rail Fix',
  releasedAt: '2026-05-15',
  latestCommit: '43b60ac',
  testProof: '111 tests passing',
  buildProof: 'Vite production build passing',
  summary: '회차 탭이 원고 행으로 늘어나는 에디터 레이아웃 문제를 고친 알파 핫픽스입니다.'
};

export const storyxVersionLog: StoryXVersionLogEntry[] = [
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
