import { isSerialFormat, type CreativeBlueprint } from './projectBlueprint';

export type IntakeAgentId =
  | 'showrunner'
  | 'character-custodian'
  | 'world-keeper'
  | 'voice-curator'
  | 'essay-interviewer'
  | 'essay-thesis'
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
  'essay-thesis': { name: '유발 하리', blurb: '큰 그림과 논증의 뼈대를 묻는 사상가' },
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
        },
        {
          id: 'essay-thesis-core',
          agentId: 'essay-thesis',
          agentLabel: '에세이 사상가',
          question: '이 글이 독자에게 남기려는 하나는 무엇에 가깝나요?',
          recommendedOptionId: 'one-question',
          options: [
            {
              id: 'one-question',
              label: '하나의 질문',
              impact: '교훈을 닫지 않고, 글 전체가 그 질문을 향하도록 구조를 잡습니다.'
            },
            {
              id: 'one-insight',
              label: '하나의 깨달음',
              impact: '경험에서 깨달음으로 이어지는 논증의 디딤돌을 점검합니다.'
            },
            {
              id: 'one-image',
              label: '하나의 장면·인상',
              impact: '설명을 줄이고 그 장면이 오래 남도록 묘사에 무게를 둡니다.'
            }
          ]
        },
        {
          id: 'essay-why-now',
          agentId: 'essay-interviewer',
          agentLabel: '에세이 인터뷰어',
          question: '그 경험을 지금 다시 쓰는 이유는 무엇인가요?',
          recommendedOptionId: 'still-unsettled',
          options: [
            {
              id: 'still-unsettled',
              label: '아직 정리되지 않아서',
              impact: '결론을 서두르지 않고 의식의 흐름을 따라가는 질문을 더 둡니다.'
            },
            {
              id: 'to-tell-someone',
              label: '누군가에게 전하고 싶어서',
              impact: '독자를 향한 호흡과 말 거는 거리를 문체 바이블에 적어 둡니다.'
            },
            {
              id: 'to-understand-self',
              label: '그때의 나를 이해하려고',
              impact: '그때의 나와 지금의 나를 분리해 시점 거리를 점검합니다.'
            }
          ]
        },
        {
          id: 'essay-hard-part',
          agentId: 'creative-coach',
          agentLabel: '창작 코치',
          question: '이 글에서 가장 쓰기 어려운 지점은 어디인가요?',
          recommendedOptionId: 'honesty',
          options: [
            {
              id: 'honesty',
              label: '솔직해지는 것',
              impact: '쓰기 두려운 부분을 미루지 않게 질문을 단계적으로 엽니다.'
            },
            {
              id: 'structure',
              label: '구조 잡기',
              impact: '장면과 사유의 순서를 먼저 정리하는 검토 항목을 둡니다.'
            },
            {
              id: 'polish',
              label: '문장 다듬기',
              impact: '문체 큐레이터가 군더더기와 번역투를 더 자주 점검합니다.'
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
        },
        {
          id: 'comics-pull',
          agentId: 'showrunner',
          agentLabel: '쇼러너',
          question: '독자가 다음 화를 누르게 만드는 힘은 무엇인가요?',
          recommendedOptionId: 'event-action',
          options: [
            {
              id: 'event-action',
              label: '매 화의 사건·액션',
              impact: '회차마다 시각적 사건 하나를 클라이맥스 컷으로 배치합니다.'
            },
            {
              id: 'relationship-tension',
              label: '관계의 긴장',
              impact: '인물 사이의 감정 변화를 컷의 마지막에 남기는 후킹으로 씁니다.'
            },
            {
              id: 'mystery-hook',
              label: '미스터리·떡밥',
              impact: '회차 끝마다 풀리지 않은 질문을 하나씩 남기는 보드를 만듭니다.'
            }
          ]
        },
        {
          id: 'comics-character-anchor',
          agentId: 'character-custodian',
          agentLabel: '캐릭터 큐레이터',
          question: '주인공에게서 절대 흔들리면 안 되는 것은 무엇인가요?',
          recommendedOptionId: 'design',
          options: [
            {
              id: 'design',
              label: '외형·디자인',
              impact: '실루엣, 의상, 색을 visual bible 후보로 먼저 고정합니다.'
            },
            {
              id: 'personality',
              label: '성격·말투',
              impact: '말풍선 대사와 표정 연출의 기준을 캐릭터 메모리에 저장합니다.'
            },
            {
              id: 'goal',
              label: '욕망·목표',
              impact: '컷의 선택과 행동이 주인공의 목표와 어긋나지 않는지 점검합니다.'
            }
          ]
        },
        {
          id: 'comics-world-rule',
          agentId: 'world-keeper',
          agentLabel: '배경 설계자',
          question: '이 만화 세계에서 가장 먼저 정해야 할 규칙은 무엇인가요?',
          recommendedOptionId: 'ability-cost',
          options: [
            {
              id: 'ability-cost',
              label: '능력·설정의 비용',
              impact: '강한 연출일수록 대가와 한계를 함께 적어 긴장감을 지킵니다.'
            },
            {
              id: 'space-structure',
              label: '공간·장소 구조',
              impact: '재사용 배경과 동선을 정리해 컷 이동의 혼선을 줄입니다.'
            },
            {
              id: 'social-order',
              label: '사회·관계 질서',
              impact: '인물이 마음대로 못 움직이는 압력을 컷의 갈등으로 씁니다.'
            }
          ]
        }
      ]
    };
  }

  // 연재형(장편·중편)은 회차 경험을 묻고, 단편·단독 완결형은 한 편의 완결 효과를 묻는다.
  const isSerial = isSerialFormat(blueprint.format);
  const promiseQuestion: ProjectIntakeQuestion = isSerial
    ? {
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
      }
    : {
        id: 'episode-promise',
        agentId: 'showrunner',
        agentLabel: '쇼러너',
        question: '이 한 편이 독자에게 약속하는 경험은 무엇에 가깝나요?',
        recommendedOptionId: 'single-impact',
        options: [
          {
            id: 'single-impact',
            label: '하나의 반전',
            impact: '마지막 전환 하나를 향해 장면 수를 줄이고 군더더기를 덜어냅니다.'
          },
          {
            id: 'slow-immersion',
            label: '하나의 정서',
            impact: '사건보다 분위기와 인물 결을 또렷하게 쌓는 장면 설계를 우선합니다.'
          },
          {
            id: 'single-image',
            label: '하나의 이미지',
            impact: '독자에게 오래 남을 핵심 장면 하나에 묘사의 무게를 둡니다.'
          }
        ]
      };

  return {
    focusLabel: isSerial ? '소설 연재 세팅' : '단편 소설 세팅',
    notice: defaultNotice,
    summary: isSerial
      ? '연재가 길어져도 흔들리지 않도록 독자 약속, 인물 욕망, 세계 규칙, 문체 기준을 먼저 잡습니다.'
      : '한 편으로 완결되는 작품인 만큼, 하나의 효과와 인물 욕망, 세계 규칙, 문체 기준을 먼저 잡습니다.',
    questions: [
      promiseQuestion,
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
            label: isSerial ? '선명한 연재체' : '선명한 서술체',
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
      },
      {
        id: 'central-conflict',
        agentId: 'showrunner',
        agentLabel: '쇼러너',
        question: '이야기를 끝까지 밀고 가는 핵심 갈등은 어디에 있나요?',
        recommendedOptionId: 'outer-threat',
        options: [
          {
            id: 'outer-threat',
            label: '외부의 적·위협',
            impact: isSerial
              ? '회차마다 위협의 강도를 올리는 사건 사다리를 먼저 설계합니다.'
              : '위협의 강도를 차츰 올리는 사건 사다리를 먼저 설계합니다.'
          },
          {
            id: 'relationship',
            label: '인물 사이의 관계',
            impact: isSerial
              ? '관계의 균열과 회복을 회차 보상의 축으로 삼습니다.'
              : '관계의 균열과 회복을 이야기의 감정 축으로 삼습니다.'
          },
          {
            id: 'inner-contradiction',
            label: '주인공 내면의 모순',
            impact: isSerial
              ? '주인공이 자기 욕망과 싸우는 장면을 매 회차에 한 번씩 둡니다.'
              : '주인공이 자기 욕망과 싸우는 장면을 중심 갈등으로 둡니다.'
          }
        ]
      },
      {
        id: 'story-destination',
        agentId: 'continuity-editor',
        agentLabel: '연속성 감수자',
        question: '이 이야기는 어디에 도착해야 하나요?',
        recommendedOptionId: 'goal-reached',
        options: [
          {
            id: 'goal-reached',
            label: '목표 달성·해결',
            impact: isSerial
              ? '결말에서 회수할 약속을 미리 적어 두고 회차가 엇나가지 않게 점검합니다.'
              : '결말에서 회수할 약속을 미리 적어 두고 이야기가 엇나가지 않게 점검합니다.'
          },
          {
            id: 'inner-change',
            label: '인물의 내적 변화',
            impact: '사건보다 주인공의 변화 곡선을 연속성 기준으로 추적합니다.'
          },
          {
            id: 'open-ending',
            label: '열린 결말·여운',
            impact: '닫지 않을 질문을 정해 두고 나머지 복선은 회수 대상으로 표시합니다.'
          }
        ]
      },
      {
        id: 'writer-worry',
        agentId: 'creative-coach',
        agentLabel: '창작 코치',
        question: '이 작품에서 가장 자신 없는 부분은 어디인가요?',
        recommendedOptionId: 'momentum',
        options: [
          {
            id: 'momentum',
            label: '이야기를 끌고 가는 추진력',
            impact: isSerial
              ? '쇼러너가 회차 후크와 다음 화 질문을 더 자주 점검합니다.'
              : '쇼러너가 장면 사이의 추진력과 끌고 가는 질문을 더 자주 점검합니다.'
          },
          {
            id: 'consistency',
            label: '인물·설정의 일관성',
            impact: '캐릭터 큐레이터와 연속성 감수자의 검토 빈도를 높입니다.'
          },
          {
            id: 'sentences',
            label: '문장과 묘사',
            impact: '문체 큐레이터가 한국어 문장 결을 더 촘촘히 다듬습니다.'
          }
        ]
      }
    ]
  };
}
