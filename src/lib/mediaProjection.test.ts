// M4 청크 G · mediaProjection TDD 케이스.
// 5 매체 투영 + 온톨로지 핵심 보존 검증.
import { describe, expect, it } from 'vitest';
import { buildStoryOntology } from './storyOntology';
import { projectAllMedia, projectMedia, type MediaTarget } from './mediaProjection';

const richOntology = buildStoryOntology({
  material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
  storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
  characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
  audience: '연재 미스터리 독자',
  constraints: '장기 연재'
});

describe('mediaProjection', () => {
  it('novel 투영은 chapterPromise/viewpointDistance/proseTexture/cliffhangerShape 4 필드를 산출', () => {
    const result = projectMedia(richOntology, 'novel');
    expect(result.target).toBe('novel');
    expect(result.fields.chapterPromise).toBeTruthy();
    expect(result.fields.viewpointDistance).toBeTruthy();
    expect(result.fields.proseTexture).toBeTruthy();
    expect(result.fields.cliffhangerShape).toBeTruthy();
  });

  it('essay 투영은 interviewQuestionPath/livedMaterialChecklist/privacyBoundary/voiceBible/reflectiveTurn 5 필드', () => {
    const result = projectMedia(richOntology, 'essay');
    expect(result.fields.interviewQuestionPath).toBeTruthy();
    expect(result.fields.livedMaterialChecklist).toBeTruthy();
    expect(result.fields.privacyBoundary).toContain('식별');
    expect(result.fields.voiceBible).toBeTruthy();
    expect(result.fields.reflectiveTurn).toContain('시선');
  });

  it('webtoon 투영은 episodeHook/scrollRhythm/visualAnchor/cutDensity 4 필드', () => {
    const result = projectMedia(richOntology, 'webtoon');
    expect(result.fields.episodeHook).toBeTruthy();
    expect(result.fields.scrollRhythm).toContain('스크롤');
    expect(result.fields.visualAnchor).toBeTruthy();
    expect(result.fields.cutDensity).toContain('65');
  });

  it('insta-toon 투영은 firstSlideHook/saveShareFinalBeat/captionAngle 3 필드', () => {
    const result = projectMedia(richOntology, 'insta-toon');
    expect(result.fields.firstSlideHook).toBeTruthy();
    expect(result.fields.saveShareFinalBeat).toBeTruthy();
    expect(result.fields.captionAngle).toContain('해시태그');
  });

  it('four-cut 투영은 setup/escalation/twistPreparation/punchline 4 필드', () => {
    const result = projectMedia(richOntology, 'four-cut');
    expect(result.fields.setup).toBeTruthy();
    expect(result.fields.escalation).toBeTruthy();
    expect(result.fields.twistPreparation).toBeTruthy();
    expect(result.fields.punchline).toBeTruthy();
  });

  // 핵심 보존 — 4 키 모두 채워진 ontology 에서 preservation.preserved=true.
  it('충실한 ontology 에서 preservation.preserved=true, missing 빈 배열', () => {
    const result = projectMedia(richOntology, 'novel');
    expect(result.preservation.preserved).toBe(true);
    expect(result.preservation.missing).toEqual([]);
    expect(result.preservation.preservedCore).toContain('premise.dramaticQuestion');
    expect(result.preservation.preservedCore).toContain('characters[0].desire');
    expect(result.preservation.preservedCore).toContain('worldRules[0].cost');
    expect(result.preservation.preservedCore).toContain('plotThreads[0]');
  });

  // 핵심 누락 — 빈 ontology 에서 preserved=false, missing 에 누락 키 채워짐.
  it('빈 ontology 는 preserved=false, missing 4개 모두 채워짐', () => {
    const emptyOntology = buildStoryOntology({
      material: '',
      storySeed: '',
      characterSeed: '',
      audience: '',
      constraints: ''
    });
    const result = projectMedia(emptyOntology, 'novel');
    expect(result.preservation.preserved).toBe(false);
    expect(result.preservation.missing.length).toBe(4);
  });

  // 5 매체 모두 한 번에 투영 — UI 에서 같은 작품을 비교할 때.
  it('projectAllMedia 는 5 매체 모두 산출', () => {
    const results = projectAllMedia(richOntology);
    expect(results.map((r) => r.target)).toEqual([
      'novel',
      'essay',
      'webtoon',
      'insta-toon',
      'four-cut'
    ]);
    // 모든 매체에서 preservation 동일 (같은 ontology 라서)
    expect(results.every((r) => r.preservation.preserved === true)).toBe(true);
  });

  // 모든 5 매체가 같은 ontology 의 핵심을 변형 없이 가져와야 한다 (표면만 매체별).
  it('모든 매체 투영의 핵심 키는 동일한 preservedCore 를 보고한다', () => {
    const targets: MediaTarget[] = ['novel', 'essay', 'webtoon', 'insta-toon', 'four-cut'];
    const reports = targets.map((t) => projectMedia(richOntology, t).preservation.preservedCore);
    const first = reports[0].slice().sort();
    for (const other of reports.slice(1)) {
      expect(other.slice().sort()).toEqual(first);
    }
  });
});
