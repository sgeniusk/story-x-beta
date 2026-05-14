export type ServiceOperationsGroupId = 'product' | 'growth';

export interface ServiceOperationsGroup {
  id: ServiceOperationsGroupId;
  label: string;
  mission: string;
}

export interface ServiceOperationsAgent {
  id: string;
  group: ServiceOperationsGroupId;
  title: string;
  mission: string;
  priority: string;
  signals: string[];
  deliverables: string[];
}

export const serviceOperationsGroups: ServiceOperationsGroup[] = [
  {
    id: 'product',
    label: '제품 운영실',
    mission: '창작자가 막히지 않고 에디터 안에서 좋은 작품을 완성하도록 작업 환경을 설계합니다.'
  },
  {
    id: 'growth',
    label: '성장 운영실',
    mission: 'Story X의 메시지, 수익화, 배포, 서비스 개선 루프를 관리합니다.'
  }
];

export const serviceOperationsAgents: ServiceOperationsAgent[] = [
  {
    id: 'editor-ux-director',
    group: 'product',
    title: '에디터 UX 디렉터',
    mission: '원고, 캔버스, 스토리보드가 화면 중앙에서 창작의 70% 이상을 차지하고, 프로젝트 직후 Workflow Board가 보이도록 에디터 경험을 설계합니다.',
    priority: '창작자가 UI를 관리하는 시간이 아니라 작품을 만들고 품질 게이트를 통과하는 시간에 머무는가',
    signals: ['중앙 창작 영역 집중도', '사이드바 정보 과밀도', '모바일/데스크톱 작업 안정성', '품질 게이트 노출 여부'],
    deliverables: ['에디터 레이아웃 제안', '집중 모드 기준', '매체별 작업면 체크리스트', 'Workflow Board 기준']
  },
  {
    id: 'creative-coach',
    group: 'product',
    title: '창작 코치',
    mission: '사용자가 막혔을 때 정답을 대신 쓰기보다 다음에 답할 수 있는 좋은 질문과 작은 행동을 제안합니다.',
    priority: '사용자의 창작 주도권을 빼앗지 않고 다음 문장이나 다음 컷으로 움직이게 하는가',
    signals: ['막힘 지점', '사용자 피드백의 감정 온도', '다음 행동의 구체성'],
    deliverables: ['질문 카드', '다음 행동 제안', '작업 재개 프롬프트']
  },
  {
    id: 'onboarding-architect',
    group: 'product',
    title: '온보딩 설계자',
    mission: '처음 들어온 사용자가 소설, 만화, 에세이, 오디오북 중 무엇을 만들지 부담 없이 선택하게 만듭니다.',
    priority: '첫 5분 안에 사용자가 자기 이야기의 형태를 고르고 제작실에 들어가는가',
    signals: ['첫 선택 이탈', '매체/포맷 혼란', '첫 프로젝트 생성률'],
    deliverables: ['선택 흐름 개선안', '첫 작품 템플릿', '초기 질문 세트']
  },
  {
    id: 'work-library-manager',
    group: 'product',
    title: '작품 관리인',
    mission: '프로젝트, 시리즈, 회차, 버전, 산출물, canon과 voice bible이 흩어지지 않게 관리합니다.',
    priority: '긴 시리즈와 매체 변환에서도 사용자가 언제든 이전 결정을 찾을 수 있는가',
    signals: ['버전 혼란', 'canon 누락', '다운로드/게시 산출물 상태'],
    deliverables: ['작품 라이브러리 구조', '버전 관리 기준', '산출물 패키징 규칙']
  },
  {
    id: 'brand-homepage-director',
    group: 'growth',
    title: '브랜드/홈페이지 디렉터',
    mission: 'Story X의 철학, 차별점, 홈페이지 메시지를 창작자에게 선명하게 전달합니다.',
    priority: '방문자가 Story X를 단순 생성기가 아니라 이야기 운영체제로 이해하는가',
    signals: ['첫 화면 메시지 명료도', 'CTA 설득력', '창작자 언어와의 거리'],
    deliverables: ['홈페이지 카피 개선안', '브랜드 메시지', '소개 페이지 구조']
  },
  {
    id: 'monetization-strategist',
    group: 'growth',
    title: '수익화 설계자',
    mission: '무료 경험을 해치지 않으면서 Standard/Deep 검토, 장편 관리, 매체 변환의 유료 가치를 설계합니다.',
    priority: '돈을 내는 이유가 더 많은 생성이 아니라 더 완성도 높은 작품 관리로 보이는가',
    signals: ['유료 전환 지점', '토큰 사용 규모', '고급 검토/변환 수요'],
    deliverables: ['요금제 가설', '크레딧 사용 기준', '업셀 제안 문구']
  },
  {
    id: 'publishing-distribution-manager',
    group: 'growth',
    title: '출판/배포 매니저',
    mission: '완성된 작품을 게시, 다운로드, 오디오북, 웹툰 콘티, 영상 스토리보드와 플랫폼별 샘플 검증으로 자연스럽게 확장합니다.',
    priority: '작품 완료 순간에 첫 300자, 첫 3컷, 첫 30초처럼 플랫폼이 요구하는 증거가 준비되는가',
    signals: ['완성 산출물 상태', '다운로드 포맷', '매체 변환 적합도', '플랫폼 샘플 준비율'],
    deliverables: ['출력 패키지', '게시 체크리스트', '매체 변환 제안', '플랫폼 패키징 랩 기준']
  },
  {
    id: 'insights-analyst',
    group: 'growth',
    title: '인사이트 분석가',
    mission: '사용자가 어디서 막히고 어떤 검토가 실제 품질을 올렸는지 관찰해 평가 보고서, 제품 백로그, 에이전트 개선으로 연결합니다.',
    priority: '반복되는 실패와 성공 패턴이 다음 버전의 기능 개선으로 이어지는가',
    signals: ['검토 후 수정률', '중단 지점', '사용자가 승인한 성장 메모리', 'AI Output Autopsy 승인률'],
    deliverables: ['서비스 개선 리포트', '에이전트 성능 가설', '실패 로그 요약', '테스터 보고서 반영 로그']
  }
];

export function getServiceAgentsByGroup(group: ServiceOperationsGroupId): ServiceOperationsAgent[] {
  return serviceOperationsAgents.filter((agent) => agent.group === group);
}
