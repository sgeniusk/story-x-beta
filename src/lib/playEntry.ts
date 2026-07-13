// 현재 작품에서 PLAY 세션을 이어 시딩하는 순수 로직 — 인물·최근 회차 기반
import type { Chapter, CharacterProfile, SeriesProject } from './storyEngine';
import { FALLBACK_EMPTY_LINE, createEmptyProject } from './storyEngine';
import type { DiveState } from './storage';
import { createDiveSession } from './diveSession';
import { seedFromProposal, type DiveSetup } from './diveProposal';
import type { DiveSeedCharacter } from './diveSeedCharacters';
import type { CreativeFormat, CreativeMedium } from './projectBlueprint';

const CONTINUATION_PREFIX = '직전 회차 이후 — ';
const PLAY_FIRST_FALLBACK_TITLE = '플레이로 시작한 이야기';

/** 최근 회차에서 "직전에 무슨 일이 있었나"를 잇는 시작 장면. 원고 마지막 문단 > 마지막 beat 요약 > hook. */
export function deriveContinuationScene(chapter: Chapter): string {
  const prose = chapter.prose?.trim();
  if (prose && prose !== FALLBACK_EMPTY_LINE) {
    const paragraphs = prose
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && p !== FALLBACK_EMPTY_LINE);
    const tail = paragraphs[paragraphs.length - 1];
    if (tail) return CONTINUATION_PREFIX + tail;
  }
  const lastBeat = chapter.beats?.[chapter.beats.length - 1];
  if (lastBeat?.summary?.trim()) return CONTINUATION_PREFIX + lastBeat.summary.trim();
  const hook = chapter.hook?.trim();
  if (hook) return CONTINUATION_PREFIX + hook;
  return '';
}

// 이어 플레이 주인공 감지 — characters[0] 이 항상 주인공은 아니다(ch23 로판처럼 빙의 대상이
// 배열 앞이 아닐 수 있음). ① role 이 주인공/주연이면 우선 ② "주인공"을 담은 캐논 문장에 이름이
// 들어간 인물 ③ 로그라인에 이름이 든 인물 ④ 폴백 characters[0].
function pickProtagonist(project: SeriesProject): CharacterProfile | undefined {
  const chars = project.characters;
  if (chars.length === 0) return undefined;
  const byRole = chars.find((c) => /주인공|주연|protagonist/i.test(c.role ?? ''));
  if (byRole) return byRole;
  const protagonistFact = project.canonFacts.find(
    (f) => f.statement.includes('주인공') && chars.some((c) => c.name && f.statement.includes(c.name))
  );
  if (protagonistFact) {
    const named = chars.find((c) => c.name && protagonistFact.statement.includes(c.name));
    if (named) return named;
  }
  const logline = project.logline ?? '';
  const byLogline = logline ? chars.find((c) => c.name && logline.includes(c.name)) : undefined;
  return byLogline ?? chars[0];
}

/** 현재 작품(본편)에서 이어 플레이할 DiveState 를 만든다. 인물이 없으면 null. */
export function seedPlayFromProject(project: SeriesProject): DiveState | null {
  const primary = pickProtagonist(project);
  if (!primary) return null;
  const session = createDiveSession(primary.id, project.id);
  const latest = project.chapters[project.chapters.length - 1];
  const scene = latest ? deriveContinuationScene(latest) : '';
  return {
    schema: 'storyx/dive/v1',
    session: scene ? { ...session, scene } : session,
    project
  };
}

/** 프리셋 시드 → DiveSetup. background 가 첫 장면, 인물 1, myRole 은 비워 사용자 자유. */
export function presetToDiveSetup(seed: DiveSeedCharacter): DiveSetup {
  const c = seed.character;
  return {
    scene: seed.background,
    cast: [{ name: c.name, role: c.role, desire: c.desire, wound: c.wound, voiceRules: c.voiceRules }],
    myRole: ''
  };
}

/**
 * PLAY-first 온보딩 글루 — 제안/프리셋 setup 에서 최소 프로젝트(회차 0)와
 * 첫 장면이 주입된 DiveState 를 만든다. 옛 seedAndEnter(6a95a52) 규칙 계승.
 * 설정 깊이 상한 — 헌장·결말·회차 구조는 만들지 않는다(스펙 결정 5).
 * partnerIndex — playseed 카드에서 고른 대화 상대(기본 cast[0], 범위 밖은 폴백).
 */
export function buildPlayFirstProject(
  setup: DiveSetup,
  meta: { medium?: CreativeMedium; format?: CreativeFormat },
  partnerIndex = 0
): { project: SeriesProject; diveState: DiveState } | null {
  const { scene, characters } = seedFromProposal(setup);
  const primary = characters[partnerIndex] ?? characters[0];
  if (!primary) return null;
  const title = (setup.myRole.trim() || setup.scene.trim()).slice(0, 20) || PLAY_FIRST_FALLBACK_TITLE;
  const project: SeriesProject = {
    ...createEmptyProject({ title, medium: meta.medium, format: meta.format }),
    characters
  };
  const session = createDiveSession(primary.id, project.id);
  return {
    project,
    diveState: {
      schema: 'storyx/dive/v1',
      session: scene ? { ...session, scene } : session,
      project
    }
  };
}
