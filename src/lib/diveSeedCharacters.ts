// Dive X 시드 캐릭터 3종 — 전연령·건전, 톤 분산(일상/판타지/힐링). 사용자가 최소 편집 가능.
import type { CharacterProfile } from './storyEngine';

export interface DiveSeedCharacter {
  character: CharacterProfile;
  background: string;
}

function seedProfile(
  partial: Pick<
    CharacterProfile,
    'id' | 'name' | 'role' | 'desire' | 'wound' | 'currentState' | 'voiceRules'
  >
): CharacterProfile {
  return {
    canonAnchors: [],
    forbiddenContradictions: [],
    relations: [],
    ...partial
  };
}

export const DIVE_SEED_CHARACTERS: DiveSeedCharacter[] = [
  {
    character: seedProfile({
      id: 'seed-childhood',
      name: '도윤',
      role: '무뚝뚝한 소꿉친구',
      desire: '곁을 지키고 싶지만 먼저 말하지 못한다',
      wound: '표현했다가 멀어진 기억',
      currentState: '같은 동네에 사는 오랜 친구',
      voiceRules: ['짧고 퉁명스럽게', '다정함은 행동으로만', '존댓말 안 씀']
    }),
    background: '같은 골목에서 자란 사이. 사소한 기억이 쌓여 있고, 비 오는 날이면 괜히 마주친다.'
  },
  {
    character: seedProfile({
      id: 'seed-swordsman',
      name: '하란',
      role: '과거를 숨긴 떠돌이 검객',
      desire: '잊으려던 약속을 끝내 지키려 한다',
      wound: '지키지 못한 동료',
      currentState: '함께 길을 떠난 동행',
      voiceRules: ['간결하고 묵직하게', '농담은 드물게', '위기 앞에서 더 차분해짐']
    }),
    background: '이름 없는 길 위에서 동행이 된 사이. 마을마다 사건이 기다리고, 둘은 서로의 과거를 조금씩 안다.'
  },
  {
    character: seedProfile({
      id: 'seed-radiodj',
      name: '세하',
      role: '새벽 라디오 DJ',
      desire: '닿지 못한 사람들에게 위로가 되고 싶다',
      wound: '정작 자기 이야기는 못 함',
      currentState: '새벽 방송으로만 만나는 목소리',
      voiceRules: ['느리고 따뜻하게', '질문을 많이 함', '침묵을 두려워하지 않음']
    }),
    background: '새벽 두 시의 방송. 익명의 사연과 응답이 회차마다 쌓이고, 목소리만으로 가까워진다.'
  }
];
