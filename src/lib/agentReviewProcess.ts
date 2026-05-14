export type PersonaReviewScaleId = 'quick' | 'standard' | 'deep';

export type ValidationAgentId =
  | 'showrunner'
  | 'character-custodian'
  | 'world-keeper'
  | 'genre-stylist'
  | 'continuity-editor'
  | 'essay-interviewer'
  | 'voice-curator'
  | 'audio-narration-director'
  | 'education-video-architect'
  | 'sound-music-agent'
  | 'storyboard-agent'
  | 'speech-bubble-agent'
  | 'keyframe-art-director'
  | 'da-vinci'
  | 'frame-assembly-agent';

export interface PersonaReviewScale {
  id: PersonaReviewScaleId;
  label: string;
  tokenProfile: '낮음' | '보통' | '높음';
  agentLimit: number;
  rounds: number;
  askBeforeRun: boolean;
  bestFor: string;
  defaultAgents: ValidationAgentId[];
}

export interface AgentValidationProcess {
  agentId: ValidationAgentId;
  label: string;
  agenda: string;
  independentChecks: string[];
  evidenceTargets: string[];
  outputFormat: string[];
  evolutionMemory: string[];
  blockingSignals: string[];
}

export interface PersonaReviewProtocol {
  scale: PersonaReviewScale;
  openingQuestion: string;
  agents: AgentValidationProcess[];
  orderedSteps: string[];
  finalReportSections: ['검토의견', '변경사항', '성장 메모리 업데이트'];
}

export const reviewScales: Record<PersonaReviewScaleId, PersonaReviewScale> = {
  quick: {
    id: 'quick',
    label: 'Quick',
    tokenProfile: '낮음',
    agentLimit: 3,
    rounds: 1,
    askBeforeRun: true,
    bestFor: '짧은 초안, 아이디어 검토, 회차 후크만 빠르게 확인할 때',
    defaultAgents: ['showrunner', 'continuity-editor', 'voice-curator']
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    tokenProfile: '보통',
    agentLimit: 5,
    rounds: 2,
    askBeforeRun: true,
    bestFor: '회차 원고, 에세이 초안, 컷 구성처럼 실제 수정이 필요한 산출물',
    defaultAgents: ['showrunner', 'character-custodian', 'world-keeper', 'genre-stylist', 'continuity-editor']
  },
  deep: {
    id: 'deep',
    label: 'Deep',
    tokenProfile: '높음',
    agentLimit: 15,
    rounds: 3,
    askBeforeRun: true,
    bestFor: '장편 설계, 시즌 전환, 매체 변환, 유료 산출물 직전의 정밀 검토',
    defaultAgents: [
      'showrunner',
      'character-custodian',
      'world-keeper',
      'genre-stylist',
      'continuity-editor',
      'essay-interviewer',
      'voice-curator',
      'audio-narration-director',
      'education-video-architect',
      'sound-music-agent',
      'storyboard-agent',
      'speech-bubble-agent',
      'keyframe-art-director',
      'da-vinci',
      'frame-assembly-agent'
    ]
  }
};

export const validationProcesses: AgentValidationProcess[] = [
  {
    agentId: 'showrunner',
    label: '쇼러너',
    agenda: '작품 약속, 회차 압력, 마지막 질문이 한 방향으로 독자를 끌고 가는지 검토합니다.',
    independentChecks: ['이번 산출물의 독자 약속이 한 문장으로 선명한가', '클리프행어가 다음 행동을 부르는가', '장기 떡밥과 단기 사건이 서로를 약하게 만들지 않는가'],
    evidenceTargets: ['로그라인', '독자 약속', '회차 후크', '마지막 장면'],
    outputFormat: ['통과', '수정', '차단', '가장 약한 독자 약속', '후크 강화안'],
    evolutionMemory: ['반응이 좋았던 후크 유형', '약했던 회차 약속 패턴', '사용자가 선호한 긴장 상승 방식'],
    blockingSignals: ['마지막 질문이 다음 회차를 부르지 않음', '장기 약속과 현재 사건의 연결이 끊김']
  },
  {
    agentId: 'character-custodian',
    label: '캐릭터 큐레이터',
    agenda: '인물의 욕망, 상처, 방어 방식, 말투, 관계 온도가 누적 상태와 맞는지 검토합니다.',
    independentChecks: ['인물이 욕망, 상처, 방어 방식과 어긋나는 행동을 하지 않았는가', '말투와 호칭 거리가 이전 상태와 이어지는가', '관계 변화가 장면 안에서 벌어졌는가'],
    evidenceTargets: ['캐릭터 프로필', 'voiceRules', '이전 회차 관계 상태', '대사'],
    outputFormat: ['통과', '수정', '차단', '붕괴 위험 인물', '대체 행동 또는 대사'],
    evolutionMemory: ['반복해서 흔들린 말투와 행동 패턴', '사용자가 좋다고 한 인물 반응', '관계 변화의 승인된 새 기준'],
    blockingSignals: ['핵심 욕망과 반대로 움직이는데 이유가 없음', '이전 회차 감정값을 무시함']
  },
  {
    agentId: 'world-keeper',
    label: '배경 설계자',
    agenda: '세계 규칙, 비용, 시간표, 장소 이동, 조직 논리가 장면마다 같은 방식으로 작동하는지 검토합니다.',
    independentChecks: ['세계 규칙의 비용이 사라지지 않았는가', '시간순서와 장소 이동이 가능한가', '새 설정이 기존 규칙을 싸게 만들지 않는가'],
    evidenceTargets: ['worldRules', 'canonFacts', '시간표', '장소와 조직 설정'],
    outputFormat: ['통과', '수정', '차단', '충돌 규칙', '새 설정의 저장 위치'],
    evolutionMemory: ['자주 생긴 세계관 예외', '새로 승인된 비용 규칙', '사용자가 선호한 설정 밀도'],
    blockingSignals: ['기존 세계 규칙을 무효화함', '비용 없이 문제를 해결함']
  },
  {
    agentId: 'genre-stylist',
    label: '장르 스타일리스트',
    agenda: '장르 독자가 기대하는 쾌감, 리듬, 문체 질감이 살아 있는지 검토합니다.',
    independentChecks: ['장르 기대감이 장면 안에 실제 보상으로 남아 있는가', '문체 질감이 장면 목적을 방해하지 않는가', '반전이나 감정 보상이 너무 늦지 않은가'],
    evidenceTargets: ['genreProfile', '장면 비트', '문장 질감', '독자 보상'],
    outputFormat: ['통과', '수정', '차단', '살릴 장르 쾌감', '뻔함을 비트는 방법'],
    evolutionMemory: ['잘 먹힌 장르 비틀기', '사용자가 싫어한 클리셰', '작품 고유의 장르 리듬'],
    blockingSignals: ['장르 약속이 사라짐', '멋진 문체가 사건 진행을 막음']
  },
  {
    agentId: 'continuity-editor',
    label: '연속성 감수자',
    agenda: '캐논 충돌을 숨기지 않고 판정하며, 승인된 사실만 다음 작업 기준으로 저장합니다.',
    independentChecks: ['새 사실이 기존 캐논과 충돌하지 않는가', '충돌을 재미로 쓸지 수정할지 구분했는가', '다음 작업에 저장할 사실이 명확한가'],
    evidenceTargets: ['canonFacts', 'forbiddenContradictions', 'newCanonFacts', 'memoryAnchors'],
    outputFormat: ['통과', '수정', '차단', '충돌 근거', '저장할 canon 후보'],
    evolutionMemory: ['반복되는 충돌 유형', '차단된 설정 변경', '승인된 canon 업데이트'],
    blockingSignals: ['forbiddenContradictions를 직접 위반함', '새 설정의 출처가 없음']
  },
  {
    agentId: 'essay-interviewer',
    label: '에세이 인터뷰어',
    agenda: '사용자의 실제 경험을 임의로 발명하지 않고, 더 물어봐야 할 빈칸을 분리합니다.',
    independentChecks: ['개인 경험을 AI가 마음대로 만들지 않았는가', '주변 인물의 익명성과 거리가 지켜졌는가', '질문이 다음 문단의 재료로 이어지는가'],
    evidenceTargets: ['사용자 진술', '확인된 기억', '익명화 필요 인물', '미확인 공백'],
    outputFormat: ['통과', '수정', '차단', '추가 질문', '쓸 수 있는 장면과 보류 장면'],
    evolutionMemory: ['사용자가 답하기 쉬웠던 질문 방식', '민감해서 보류한 소재', '선호한 고백의 깊이'],
    blockingSignals: ['사용자가 말하지 않은 사적 기억을 발명함', '실존 인물을 과도하게 특정함']
  },
  {
    agentId: 'voice-curator',
    label: '문체 큐레이터',
    agenda: '한국어 자연스러움, 작가 문체, 문장 리듬, 금지 표현이 전체 원고에서 유지되는지 검토합니다.',
    independentChecks: ['문체가 중간에 바뀌지 않았는가', '한국어 문장이 번역투로 굳지 않았는가', '반복되는 AI식 표현이 남아 있지 않은가'],
    evidenceTargets: ['voice bible', '사용자 선호 문장', '금지 표현', '문장 길이 분포'],
    outputFormat: ['통과', '수정', '차단', '문체 흔들림 지점', '수정 예문'],
    evolutionMemory: ['사용자가 좋아한 문장 리듬', '반복 제거할 표현', '작품별 금지 어휘'],
    blockingSignals: ['전체 문체가 다른 작가처럼 변함', '한국어 어색함이 몰입을 깸']
  },
  {
    agentId: 'audio-narration-director',
    label: '오디오 연출가',
    agenda: '소리로 들었을 때의 속도, 쉼, 강조, 감정 온도, 청취 피로도를 검토합니다.',
    independentChecks: ['한 번 들어도 이해되는 문장인가', '쉼과 강조가 감정선을 살리는가', '음악과 효과음이 이야기를 덮지 않는가'],
    evidenceTargets: ['낭독 대본', 'pause marks', 'voice direction', 'sound cue'],
    outputFormat: ['통과', '수정', '차단', '호흡 표시', '낭독 톤 지시'],
    evolutionMemory: ['잘 맞은 낭독 톤', '청취 피로가 생긴 문장 길이', '발음 주의 단어'],
    blockingSignals: ['낭독하면 의미가 흐려짐', '소리 연출이 감정을 과잉 설명함']
  },
  {
    agentId: 'education-video-architect',
    label: '교육영상 설계자',
    agenda: '학습 목표, 설명 순서, 예시, 자막 밀도, 이해 확인 지점이 맞는지 검토합니다.',
    independentChecks: ['학습 목표가 하나로 선명한가', '설명 순서가 쉬운 것에서 어려운 것으로 흐르는가', '자막 밀도가 청취 리듬을 방해하지 않는가'],
    evidenceTargets: ['learning objective', 'teaching sequence', 'caption plan', 'example'],
    outputFormat: ['통과', '수정', '차단', '누락된 설명 단계', '자막/예시 수정안'],
    evolutionMemory: ['사용자가 선호한 설명 방식', '헷갈렸던 개념', '반복해서 필요한 예시 유형'],
    blockingSignals: ['목표가 둘 이상 섞임', '시청자가 모르는 개념을 전제함']
  },
  {
    agentId: 'sound-music-agent',
    label: '사운드 뮤직 에이전트',
    agenda: '후크, 반복구, 음악 큐, 효과음, 모티프가 이야기 감정을 돕는지 검토합니다.',
    independentChecks: ['반복 후크가 기억에 남는가', '음악 큐가 장면 전환을 돕는가', '효과음이 의미 없이 과하지 않은가'],
    evidenceTargets: ['hook line', 'music cue', 'sound effect', 'motif'],
    outputFormat: ['통과', '수정', '차단', '소리 후크', '큐 시트 수정안'],
    evolutionMemory: ['잘 맞은 반복구', '작품 고유의 음악 모티프', '줄일 효과음 패턴'],
    blockingSignals: ['음악이 서사를 덮음', '반복구가 의미 없이 늘어짐']
  },
  {
    agentId: 'storyboard-agent',
    label: '스토리보드 에이전트',
    agenda: '장면 비트를 컷, 페이지, 스와이프, 스크롤 리듬으로 바꿨을 때 읽히는지 검토합니다.',
    independentChecks: ['각 컷의 정보량이 과하지 않은가', '시선 이동과 컷 전환이 자연스러운가', '마지막 컷이 저장/다음 컷 행동을 부르는가'],
    evidenceTargets: ['panel plan', 'cut rhythm', 'speech bubble density', 'page turn'],
    outputFormat: ['통과', '수정', '차단', '컷별 문제', '재배치 제안'],
    evolutionMemory: ['잘 먹힌 컷 리듬', '과밀했던 말풍선 패턴', '플랫폼별 저장/공유 포인트'],
    blockingSignals: ['컷만 봐서는 사건이 이해되지 않음', '말풍선이 그림을 압도함']
  },
  {
    agentId: 'speech-bubble-agent',
    label: '말풍선 연출가',
    agenda: '말풍선 위치, 대사 밀도, 시선 흐름, 표정과 핵심 동작을 가리지 않는지 검토합니다.',
    independentChecks: ['말풍선이 표정과 손동작을 가리지 않는가', '모바일 화면에서 한 번에 읽히는 글자 수인가', '말풍선 순서가 시선 이동과 맞는가'],
    evidenceTargets: ['speech bubble map', 'dialogue length', 'panel composition', 'reading order'],
    outputFormat: ['통과', '수정', '차단', '과밀 컷', '말풍선 재배치안'],
    evolutionMemory: ['과밀했던 대사 패턴', '사용자가 승인한 말풍선 위치', '플랫폼별 읽기 좋은 글자 수'],
    blockingSignals: ['말풍선이 주인공 표정을 가림', '읽는 순서가 컷 순서와 충돌함']
  },
  {
    agentId: 'keyframe-art-director',
    label: '원화/키프레임 감독',
    agenda: 'Midjourney 원화 후보 중 어떤 컷을 작품의 visual DNA로 승인할지 선택 기준을 만듭니다.',
    independentChecks: ['선택된 원화가 캐릭터 실루엣을 명확히 잠그는가', '의상, 팔레트, 조명, 렌즈가 반복 가능한가', '미선택 후보가 canon처럼 섞이지 않았는가'],
    evidenceTargets: ['keyframe candidates', 'approved reference', 'visual bible', 'character appearance sheet'],
    outputFormat: ['통과', '수정', '차단', '선택 기준', '재생성 프롬프트'],
    evolutionMemory: ['승인된 원화 토큰', '탈락한 원화 이유', '작품별 Midjourney 스타일 기준'],
    blockingSignals: ['기준 원화가 두 개 이상 충돌함', '캐릭터 얼굴과 의상이 재현 불가능함']
  },
  {
    agentId: 'da-vinci',
    label: '다빈치',
    agenda: '컷별 이미지 프롬프트가 인물 외형, 렌즈, 조명, 구도, 시각 언어를 일관되게 유지하는지 검토합니다.',
    independentChecks: ['캐릭터 외형과 의상이 컷마다 유지되는가', '카메라와 조명이 이야기 감정을 돕는가', '프롬프트가 구체적이고 검수 가능하게 쓰였는가'],
    evidenceTargets: ['character sheet', 'visual bible', 'cut prompt', 'negative prompt'],
    outputFormat: ['통과', '수정', '차단', '시각 일관성 위험', 'FLUX.2 프롬프트 수정안'],
    evolutionMemory: ['승인된 캐릭터 외형 토큰', '실패한 프롬프트 패턴', '작품 고유의 렌즈/조명 규칙'],
    blockingSignals: ['같은 인물이 다른 사람처럼 보임', '이미지 프롬프트가 추상적이라 재현이 어려움']
  },
  {
    agentId: 'frame-assembly-agent',
    label: '프레임 조립가',
    agenda: '컷 순서, 여백, 내보내기 비율, 파일명, 플랫폼 패키징을 검토합니다.',
    independentChecks: ['컷 순서가 장면 이해를 돕는가', '정사각형/세로 스크롤/페이지 비율이 맞는가', '파일명과 export 묶음이 후속 제작에 재사용 가능한가'],
    evidenceTargets: ['frame order', 'platform ratio', 'export package', 'panel filenames'],
    outputFormat: ['통과', '수정', '차단', '조립 문제', 'export 수정안'],
    evolutionMemory: ['플랫폼별 좋은 여백 기준', '재사용한 파일명 규칙', '실패한 조립 패턴'],
    blockingSignals: ['게시 비율이 맞지 않음', '컷 순서가 이야기 순서를 깨뜨림']
  }
];

const fallbackProcess: AgentValidationProcess = {
  agentId: 'showrunner',
  label: 'Story X 검토자',
  agenda: '현재 산출물이 작품 약속에 도움이 되는지 검토합니다.',
  independentChecks: ['목표가 선명한가', '수정할 기준이 있는가', '다음 메모리에 남길 변화가 있는가'],
  evidenceTargets: ['현재 초안', '사용자 피드백'],
  outputFormat: ['통과', '수정', '차단', '수정 제안', '저장할 배움'],
  evolutionMemory: ['반복되는 실패', '사용자 선호', '승인된 수정'],
  blockingSignals: ['검토 기준이 없음']
};

export function getAgentValidationProcess(agentId: string): AgentValidationProcess {
  return validationProcesses.find((process) => process.agentId === agentId) ?? fallbackProcess;
}

export function buildPersonaReviewProtocol(
  scaleId: PersonaReviewScaleId,
  requestedAgentIds?: ValidationAgentId[]
): PersonaReviewProtocol {
  const scale = reviewScales[scaleId];
  const agentIds = (requestedAgentIds ?? scale.defaultAgents).slice(0, scale.agentLimit);

  return {
    scale,
    openingQuestion: `검토 규모를 먼저 선택해 주세요. ${scale.label}은 토큰 소모가 ${scale.tokenProfile}이고 ${scale.rounds}회 검토합니다.`,
    agents: agentIds.map(getAgentValidationProcess),
    orderedSteps: [
      '검토 규모를 먼저 묻는다',
      '각 페르소나가 서로의 의견을 보지 않고 독립 검토한다',
      '차단 신호와 수정 신호를 분리한다',
      '수정안을 만든 뒤 연속성 감수자가 다시 확인한다',
      '검토의견, 변경사항, 성장 메모리 업데이트를 보고한다'
    ],
    finalReportSections: ['검토의견', '변경사항', '성장 메모리 업데이트']
  };
}
