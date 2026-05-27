// M4 청크 G · Layer 7 — 매체 투영.
// 정본 — docs/storyx-harness-architecture.md § 7 청크 G, ontology-harness plan Stage 7.
//
// 핵심 — 같은 StoryOntology 가 매체별로 다른 형식으로 보여진다 (소설/에세이/웹툰/인스타툰/네컷).
// 표면 표현은 매체마다 달라지지만, 인물의 욕망·상처·세계의 비용·승인된 캐논은 변하지 않는다.
// 변하면 continuity issue 로 신호한다.
import type { StoryOntology } from './storyOntology';

export type MediaTarget = 'novel' | 'essay' | 'webtoon' | 'insta-toon' | 'four-cut';

export interface MediaProjection {
  target: MediaTarget;
  /** 매체별 출력 필드 — key 는 target 마다 다르다. */
  fields: Record<string, string>;
  /** 온톨로지 핵심 보존 검증. preserved=false 면 missing 에 누락 핵심이 채워진다. */
  preservation: PreservationReport;
}

export interface PreservationReport {
  preserved: boolean;
  /** 보존된 핵심 키 — 'premise.dramaticQuestion', 'characters[0].desire', 'worldRules[0].cost', 'plotThreads[0]' */
  preservedCore: string[];
  /** 누락된 핵심 키. preserved=true 면 빈 배열. */
  missing: string[];
}

// 같은 온톨로지를 한 매체로 투영. 산출물의 필드 키는 매체별로 다르다 (Stage 7 정의).
export function projectMedia(ontology: StoryOntology, target: MediaTarget): MediaProjection {
  const preservation = checkPreservation(ontology);
  const fields = buildFields(ontology, target);
  return { target, fields, preservation };
}

// 한 온톨로지를 5 매체 모두로 투영. UI 가 한 화면에서 같은 작품의 5 매체 가능성을 비교할 때 쓴다.
export function projectAllMedia(ontology: StoryOntology): MediaProjection[] {
  const targets: MediaTarget[] = ['novel', 'essay', 'webtoon', 'insta-toon', 'four-cut'];
  return targets.map((t) => projectMedia(ontology, t));
}

// --- 매체별 필드 빌더 ---

function buildFields(ontology: StoryOntology, target: MediaTarget): Record<string, string> {
  switch (target) {
    case 'novel':
      return {
        chapterPromise: ontology.premise.oneSentence || ontology.premise.dramaticQuestion,
        viewpointDistance: 'close',
        proseTexture: ontology.theme.statement || '담담하고 선명한 한국어, 추상보다 구체적 감각',
        cliffhangerShape: ontology.plotThreads[0]?.promise ?? '다음 회차로 이어지는 한 줄'
      };
    case 'essay':
      return {
        interviewQuestionPath: ontology.conflictEngines[0]?.detail ?? '작가에게 더 물어야 할 빈칸',
        livedMaterialChecklist: ontology.characters[0]?.desire ?? '실제 경험만, 발명 금지',
        privacyBoundary: '실제 인물의 식별 정보 흐리기, 사전 합의 안에서만 노출',
        voiceBible: ontology.theme.statement || '담담한 거리, 자기연민 없음',
        reflectiveTurn: '결말 한 줄에서 화자의 시선이 처음과 달라진다'
      };
    case 'webtoon':
      return {
        episodeHook: ontology.premise.dramaticQuestion || '독자가 다음 화를 누를 한 컷',
        scrollRhythm: 'fast (모바일 세로 스크롤, 한 호흡 4~6컷)',
        visualAnchor: ontology.worldRules[0]?.rule ?? '시각적으로 반복되는 한 사물 또는 장소',
        cutDensity: '~ 65컷 / 1화 (±10)'
      };
    case 'insta-toon':
      return {
        firstSlideHook: ontology.premise.dramaticQuestion || '첫 슬라이드의 한 줄 후크',
        saveShareFinalBeat: ontology.plotThreads[0]?.promise ?? '저장/공유를 부르는 마지막 한 컷',
        captionAngle: '한 줄 후크 + 해시태그 3개'
      };
    case 'four-cut':
      return {
        setup: ontology.premise.oneSentence || ontology.premise.dramaticQuestion,
        escalation: ontology.conflictEngines[0]?.detail ?? '두 번째 컷의 압력 상승',
        twistPreparation: ontology.worldRules[0]?.cost ?? '세 번째 컷의 비용 노출',
        punchline: ontology.plotThreads[0]?.promise ?? '네 번째 컷의 정서 전환 또는 한 줄'
      };
  }
}

// 온톨로지 핵심 4개(premise.dramaticQuestion, characters[0].desire, worldRules[0].cost, plotThreads[0]) 보존 검증.
// 매체 투영은 이 4개를 절대 바꾸지 않는다. 빠진 게 있으면 missing 에 채우고 preserved=false.
function checkPreservation(ontology: StoryOntology): PreservationReport {
  const checks: Array<[string, () => boolean]> = [
    ['premise.dramaticQuestion', () => ontology.premise.dramaticQuestion.trim().length > 0 && ontology.premise.dramaticQuestion !== '아직 정해지지 않은 중심 질문'],
    ['characters[0].desire', () => Boolean(ontology.characters[0]?.desire?.trim().length)],
    ['worldRules[0].cost', () => Boolean(ontology.worldRules[0]?.cost?.trim().length)],
    ['plotThreads[0]', () => ontology.plotThreads.length > 0]
  ];
  const preservedCore: string[] = [];
  const missing: string[] = [];
  for (const [key, fn] of checks) {
    if (fn()) preservedCore.push(key);
    else missing.push(key);
  }
  return { preserved: missing.length === 0, preservedCore, missing };
}
