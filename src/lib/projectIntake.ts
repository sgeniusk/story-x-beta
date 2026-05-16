import type { CreativeBlueprint } from './projectBlueprint';

export type IntakeAgentId =
  | 'showrunner'
  | 'character-custodian'
  | 'world-keeper'
  | 'voice-curator'
  | 'essay-interviewer'
  | 'continuity-editor'
  | 'creative-coach'
  | 'storyboard-agent'
  | 'speech-bubble-agent';

export interface ProjectIntakeOption {
  id: string;
  label: string;
  impact: string;
}

export interface ProjectIntakeQuestion {
  id: string;
  agentId: IntakeAgentId;
  agentLabel: string;
  question: string;
  options: ProjectIntakeOption[];
  recommendedOptionId: string;
}

export interface ProjectIntakePlan {
  focusLabel: string;
  notice: string;
  summary: string;
  questions: ProjectIntakeQuestion[];
}

export interface FocusedServiceScope {
  now: string[];
  later: string[];
}

const defaultNotice =
  '지금 선택한 값은 나중에 언제든지 바꿀 수 있습니다. 다만 출간된 회차나 승인된 기억과 충돌할 수 있는 변경은 변경 로그와 캐논 리팩터가 먼저 검토합니다.';

export function getFocusedServiceScope(): FocusedServiceScope {
  return {
    now: ['소설', '에세이', '만화 스토리보드'],
    later: ['완성 이미지 생성', '오디오북/영상 생성', '클라우드 협업', '유료 심층 검토']
  };
}

// 작품 인터뷰어 페르소나 — 유명 작가를 살짝 비튼 캐릭터가 자기 전문 시선으로 묻는다
export interface IntakePersona {
  name: string;
  blurb: string;
}

const intakePersonas: Record<IntakeAgentId, IntakePersona> = {
  showrunner: { name: '아가타 크리스', blurb: '첫 장면에 수수께끼를 거는 플롯의 장인' },
  'character-custodian': { name: '도스토옙', blurb: '인물의 모순과 죄의식을 끝까지 파고드는 사람' },
  'world-keeper': { name: '르 권', blurb: '세계의 규칙과 그 대가를 묻는 설계자' },
  'voice-curator': { name: '무라카메', blurb: '문장의 호흡과 거리를 듣는 문체가' },
  'essay-interviewer': { name: '버지니아 울브', blurb: '사적 경험과 의식의 흐름을 따라가는 에세이스트' },
  'continuity-editor': { name: '맥스 퍼킨', blurb: '앞 회차와 어긋나는 곳을 끝까지 보는 편집자' },
  'storyboard-agent': { name: '데즈카 오사', blurb: '칸과 호흡으로 장면을 짜는 연출가' },
  'speech-bubble-agent': { name: '윌 아이스', blurb: '말풍선과 침묵의 위치를 보는 연출가' },
  'creative-coach': { name: '스티브 킨', blurb: '막힌 작가에게 다음 한 줄을 묻는 코치' }
};

export function getIntakePersona(agentId: IntakeAgentId): IntakePersona {
  return intakePersonas[agentId];
}

export function buildProjectIntakePlan(blueprint: CreativeBlueprint): ProjectIntakePlan {
  if (blueprint.medium === 'essay') {
    return {
      focusLabel: '에세이 인터뷰 세팅',
      notice: defaultNotice,
      summary: 'AI가 경험을 꾸며내기 전에 실제 경험, 주변 인물과의 거리, 문체 취향을 먼저 확인합니다.',
      questions: [
        {
          id: 'essay-material',
          agentId: 'essay-interviewer',
          agentLabel: '에세이 인터뷰어',
          question: '이번 글의 실제 경험은 어디에서 시작되나요?',
          recommendedOptionId: 'one-scene',
          options: [
            {
              id: 'one-scene',
              label: '한 장면',
              impact: '첫 문단을 장면 중심으로 열고, 이어지는 질문도 감각과 행동을 먼저 묻습니다.'
            },
            {
              id: 'long-period',
              label: '긴 시기',
              impact: '기억을 시간순으로 정리하고 그때의 나와 지금의 나를 나눠 묻습니다.'
            },
            {
              id: 'person-memory',
              label: '한 사람',
              impact: '실제 인물 보호와 관계 거리부터 확인하고 익명화 기준을 준비합니다.'
            }
          ]
        },
        {
          id: 'essay-voice',
          agentId: 'voice-curator',
          agentLabel: '문체 큐레이터',
          question: '글 전체의 문체는 어느 쪽에 가까워야 하나요?',
          recommendedOptionId: 'quiet-clear',
          options: [
            {
              id: 'quiet-clear',
              label: '담담하고 선명하게',
              impact: '과장된 감탄을 줄이고 짧은 문장과 여백을 문체 바이블에 저장합니다.'
            },
            {
              id: 'warm-confessional',
              label: '따뜻하고 고백적으로',
              impact: '독자에게 말을 건네는 호흡과 감정 전환을 더 적극적으로 둡니다.'
            },
            {
              id: 'sharp-observing',
              label: '관찰적이고 날카롭게',
              impact: '판단보다 디테일을 앞세우고 비유 밀도를 조금 높입니다.'
            }
          ]
        },
        {
          id: 'essay-privacy',
          agentId: 'continuity-editor',
          agentLabel: '연속성 감수자',
          question: '실제 주변 인물은 어느 정도 드러나도 괜찮나요?',
          recommendedOptionId: 'masked',
          options: [
            {
              id: 'masked',
              label: '식별 불가',
              impact: '이름, 직업, 장소 같은 식별 정보를 바꾸는 검수 항목을 출간 전 필수로 둡니다.'
            },
            {
              id: 'relationship-only',
              label: '관계만 남김',
              impact: '인물의 기능과 감정 거리만 남기고 세부 배경은 합성합니다.'
            },
            {
              id: 'nearly-real',
              label: '거의 사실대로',
              impact: '동의, 명예훼손, 사생활 위험을 별도 경고로 표시합니다.'
            }
          ]
        }
      ]
    };
  }

  if (blueprint.medium === 'comics') {
    return {
      focusLabel: '만화 스토리보드 세팅',
      notice: `${defaultNotice} 현재 만화는 스토리보드, 컷 구성, 말풍선 설계까지 집중하며 이미지 생성은 후속 단계로 둡니다.`,
      summary: '지금 단계에서는 완성 원화보다 컷의 기능, 시선 흐름, 말풍선 밀도를 먼저 잠급니다.',
      questions: [
        {
          id: 'storyboard-rhythm',
          agentId: 'storyboard-agent',
          agentLabel: '웹툰 연출가',
          question: '독자는 어떤 흐름으로 컷을 읽어야 하나요?',
          recommendedOptionId: 'scroll-hook',
          options: [
            {
              id: 'scroll-hook',
              label: '스크롤 후킹',
              impact: '각 컷 아래에 다음 행동을 부르는 질문과 멈춤 지점을 둡니다.'
            },
            {
              id: 'page-turn',
              label: '페이지 넘김',
              impact: '좌우 페이지 또는 캐러셀 기준으로 넘김 전후의 정보량을 조절합니다.'
            },
            {
              id: 'four-beat',
              label: '네 박자 반전',
              impact: '상황, 강화, 오해, 반전의 4컷 기능을 먼저 채웁니다.'
            }
          ]
        },
        {
          id: 'bubble-density',
          agentId: 'speech-bubble-agent',
          agentLabel: '말풍선 연출가',
          question: '말풍선과 대사는 어느 정도 밀도로 가야 하나요?',
          recommendedOptionId: 'short-mobile',
          options: [
            {
              id: 'short-mobile',
              label: '모바일 짧게',
              impact: '컷당 핵심 대사 1개를 기준으로 표정과 동작을 가리지 않게 배치합니다.'
            },
            {
              id: 'dialogue-driven',
              label: '대화 중심',
              impact: '말풍선 순서와 시선 이동을 별도 보드로 만들어 혼선을 줄입니다.'
            },
            {
              id: 'silent-visual',
              label: '무성 연출',
              impact: '대사 대신 표정, 소품, 배경 변화를 컷 기능으로 명시합니다.'
            }
          ]
        },
        {
          id: 'visual-continuity',
          agentId: 'continuity-editor',
          agentLabel: '연속성 감수자',
          question: '시각 일관성은 무엇부터 고정해야 하나요?',
          recommendedOptionId: 'character-first',
          options: [
            {
              id: 'character-first',
              label: '캐릭터 우선',
              impact: '외형, 의상, 표정 규칙을 visual bible 후보로 모읍니다.'
            },
            {
              id: 'place-first',
              label: '배경 우선',
              impact: '장소 구조와 재사용 배경을 먼저 정리해 컷 이동을 안정시킵니다.'
            },
            {
              id: 'mood-first',
              label: '무드 우선',
              impact: '색, 조명, 렌즈 감각을 키프레임 후보의 평가 기준으로 둡니다.'
            }
          ]
        }
      ]
    };
  }

  return {
    focusLabel: '소설 연재 세팅',
    notice: defaultNotice,
    summary: '연재가 길어져도 흔들리지 않도록 독자 약속, 인물 욕망, 세계 규칙, 문체 기준을 먼저 잡습니다.',
    questions: [
      {
        id: 'episode-promise',
        agentId: 'showrunner',
        agentLabel: '쇼러너',
        question: '이번 작품은 독자에게 어떤 회차 경험을 약속해야 하나요?',
        recommendedOptionId: 'episode-hook',
        options: [
          {
            id: 'episode-hook',
            label: '매 회차 후킹',
            impact: '회차마다 보상과 다음 화 질문을 남기는 연재형 구조로 시작합니다.'
          },
          {
            id: 'slow-immersion',
            label: '느린 몰입',
            impact: '초반 사건보다 분위기와 인물 결을 먼저 쌓는 장면 설계를 우선합니다.'
          },
          {
            id: 'single-impact',
            label: '한 방의 반전',
            impact: '분량을 줄이고 마지막 전환을 중심으로 장면 수를 제한합니다.'
          }
        ]
      },
      {
        id: 'character-axis',
        agentId: 'character-custodian',
        agentLabel: '캐릭터 큐레이터',
        question: '주인공의 캐릭터성은 무엇이 흔들리면 안 되나요?',
        recommendedOptionId: 'desire',
        options: [
          {
            id: 'desire',
            label: '욕망',
            impact: '선택과 갈등 검토에서 주인공이 원하는 것을 가장 먼저 비교합니다.'
          },
          {
            id: 'wound',
            label: '상처',
            impact: '방어 행동과 관계 거리의 일관성을 캐릭터 메모리에 저장합니다.'
          },
          {
            id: 'voice',
            label: '말투',
            impact: '호칭, 문장 길이, 반복 표현을 대사 검토 기준으로 둡니다.'
          }
        ]
      },
      {
        id: 'world-rule',
        agentId: 'world-keeper',
        agentLabel: '배경 설계자',
        question: '세계관에서 가장 먼저 비용을 부여할 규칙은 무엇인가요?',
        recommendedOptionId: 'power-cost',
        options: [
          {
            id: 'power-cost',
            label: '능력/마법',
            impact: '강한 능력일수록 대가와 금기를 함께 기록해 긴장감을 유지합니다.'
          },
          {
            id: 'social-cost',
            label: '조직/계급',
            impact: '인물이 마음대로 움직이지 못하는 사회적 압력을 장면 기능으로 둡니다.'
          },
          {
            id: 'memory-cost',
            label: '비밀/기억',
            impact: '드러나면 관계와 플롯이 어떻게 바뀌는지 변경 로그 기준을 만듭니다.'
          }
        ]
      },
      {
        id: 'prose-voice',
        agentId: 'voice-curator',
        agentLabel: '문체 큐레이터',
        question: '문체는 어느 방향으로 고정하고 싶나요?',
        recommendedOptionId: 'clear-commercial',
        options: [
          {
            id: 'clear-commercial',
            label: '선명한 연재체',
            impact: '짧은 문단, 빠른 정보 전달, 다음 장면으로 넘어가는 추진력을 우선합니다.'
          },
          {
            id: 'lyrical',
            label: '서정적 문장',
            impact: '감각 묘사와 이미지 반복을 문체 바이블에 더 많이 남깁니다.'
          },
          {
            id: 'dry-humor',
            label: '건조한 유머',
            impact: '과장 대신 타이밍과 관찰로 웃음을 만드는 문장 규칙을 둡니다.'
          }
        ]
      }
    ]
  };
}
