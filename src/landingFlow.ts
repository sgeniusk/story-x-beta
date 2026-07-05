// 랜딩 "작성 여정" 섹션 콘텐츠 — 세 작성 방식 + 캐논 두 축 + 진입 작가진 + 출간 매체
// 두 축(안 무너진다=일관성 · 끌어당긴다=흡인력) 프레임은 랜딩 서사의 핵심 — 축을 지우지 말 것.

export interface FlowMode {
  key: 'play' | 'write' | 'plan';
  tag: string;
  kr: string;
  body: string;
}

export interface CanonAxis {
  key: 'solid' | 'pull';
  icon: string;
  name: string;
  sub: string;
  body: string;
  filled: number;
  total: number;
}

export const flowEntryAgents: string[] = [
  '쇼러너',
  '캐릭터 큐레이터',
  '세계관 지킴이',
  '연속성 감수'
];

export const flowModes: FlowMode[] = [
  {
    key: 'play',
    tag: 'PLAY · 이어 굴리기',
    kr: '작품 안에서 행동한다',
    body: '작품 속으로 들어가 인물로서 말하고 선택합니다. 내가 움직이면 이야기가 반응하고 다음 장면이 열립니다.'
  },
  {
    key: 'write',
    tag: 'WRITE · 원고 다듬기',
    kr: '소설을 쓰듯 쓴다',
    body: '평소 소설을 쓰듯 문장을 직접 쓰고 고칩니다. AI가 초안을 대주고, 문체와 결은 작가가 정합니다.'
  },
  {
    key: 'plan',
    tag: 'PLAN · 설계 고정',
    kr: '구성과 큰 흐름을 짠다',
    body: '인물의 욕망·세계 규칙·사건의 뼈대를 작가진과 함께 설계하고 잠급니다. 이야기가 어디로 가는지 위에서 봅니다.'
  }
];

export const canonAxes: CanonAxis[] = [
  {
    key: 'solid',
    icon: '⛊',
    name: '안 무너진다',
    sub: '일관성',
    body: '세계·인물·사건이 30화 뒤에도 어긋나지 않습니다. 충돌은 감춰지지 않고 작가의 결정으로 정리됩니다.',
    filled: 4,
    total: 4
  },
  {
    key: 'pull',
    icon: '✦',
    name: '끌어당긴다',
    sub: '흡인력',
    body: '장면·문장·디테일이 독자를 끝까지 끕니다. AI가 여러 결을 펼치고, 긴장과 의외를 사람이 고릅니다.',
    filled: 3,
    total: 4
  }
];

export const flowPublishMedia: string[] = ['소설', '웹툰', '동화책', '오디오북'];
