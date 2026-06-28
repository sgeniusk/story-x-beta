// Dive X 제안 엔진 순수 도메인 — 후보 타입·비틈 벡터 카탈로그·후보→공유 모델 시드 변환
import type { CharacterProfile } from './storyEngine';

export type NoveltyLevel = 'safe' | 'tilt' | 'bold';

export interface CastSeed {
  name: string;
  role: string;
  desire: string;
  wound: string;
  voiceRules: string[];
}

export interface DiveProposal {
  hook: string;
  scene: string;
  cast: CastSeed[];
  myRole: string;
  twist: string;
  novelty: NoveltyLevel;
}

export interface DiveSetup {
  scene: string;
  cast: CastSeed[];
  myRole: string;
}

// 한 소재에서 후보를 뽑을 때 각 후보에 서로 다른 축을 배정해 전형성 편향과 싸운다.
export const TWIST_VECTORS: Array<{ label: string; instruction: string }> = [
  { label: '정체 전복', instruction: '인물의 진짜 정체나 목적이 표면과 다르게.' },
  { label: '시간 구조', instruction: '반복·역행·이미 일어난 일 등 시간축을 비튼다.' },
  { label: '관계 역전', instruction: '기억·권력·앎의 비대칭으로 관계를 뒤집는다.' },
  { label: '장르 전환', instruction: '평범한 일상이 사실 다른 장르(재난·미스터리·SF)의 입구.' },
  { label: '톤 반전', instruction: '기대한 정서와 반대로(재회→작별, 위로→위협).' }
];

function slug(_name: string, i: number): string {
  return `cast-${i}`;
}

export function seedFromProposal(p: Pick<DiveProposal, 'scene' | 'cast'>): {
  scene: string;
  characters: CharacterProfile[];
  primaryCharacterId: string;
} {
  const characters: CharacterProfile[] = p.cast.map((c, i) => ({
    id: slug(c.name, i),
    name: c.name,
    role: c.role,
    desire: c.desire,
    wound: c.wound,
    currentState: '',
    voiceRules: Array.isArray(c.voiceRules) ? c.voiceRules : [],
    canonAnchors: [],
    forbiddenContradictions: [],
    relations: []
  }));
  return {
    scene: p.scene,
    characters,
    primaryCharacterId: characters[0]?.id ?? ''
  };
}

export function isValidProposal(x: unknown): x is DiveProposal {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.hook === 'string' && p.hook.trim() !== '' &&
    typeof p.scene === 'string' && p.scene.trim() !== '' &&
    Array.isArray(p.cast) && p.cast.length > 0
  );
}
