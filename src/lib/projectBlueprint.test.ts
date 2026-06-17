import { describe, expect, it } from 'vitest';
import {
  buildCreativeBlueprint,
  getCreativeActionLabels,
  getFormatOptions,
  getWorkUnitNoun,
  isSerialFormat
} from './projectBlueprint';

describe('projectBlueprint', () => {
  it('maps a long novel selection to serial continuity operations', () => {
    const options = getFormatOptions('novel');
    const blueprint = buildCreativeBlueprint({
      medium: 'novel',
      format: 'long-novel'
    });

    // 사용자 결정(2026-06-12 '중편 없음') — 매체 단계 포맷 카드는 장편·단편 2등급만 노출한다.
    expect(options.map((option) => option.id)).toEqual(['long-novel', 'short-novel']);
    expect(blueprint.mediumLabel).toBe('소설');
    expect(blueprint.formatLabel).toBe('장편');
    expect(blueprint.managementFocus).toContain('시리즈 바이블');
    expect(blueprint.agentStack).toContain('캐릭터 에이전트');
    expect(blueprint.skillStack).toContain('longform-series-continuity');
  });

  it('maps an essay selection to personal story interview and voice operations', () => {
    const options = getFormatOptions('essay');
    const blueprint = buildCreativeBlueprint({
      medium: 'essay',
      format: 'personal-essay'
    });

    expect(options.map((option) => option.id)).toEqual(['personal-essay', 'reflective-essay', 'essay-series']);
    expect(blueprint.mediumLabel).toBe('에세이');
    expect(blueprint.projectRoomTitle).toBe('개인 에세이 설계 보드');
    expect(blueprint.managementFocus).toContain('내 경험의 사실 관계');
    expect(blueprint.managementFocus).toContain('주변 인물 보호');
    expect(blueprint.agentStack).toContain('인터뷰 에이전트');
    expect(blueprint.agentStack).toContain('문체 큐레이터 에이전트');
    expect(blueprint.skillStack).toContain('gomi-writing');
    expect(blueprint.skillStack).toContain('humanizer');
  });

  it('maps an audiobook selection to audio and video production operations', () => {
    const options = getFormatOptions('audiobook');
    const blueprint = buildCreativeBlueprint({
      medium: 'audiobook',
      format: 'educational-video'
    });

    expect(options.map((option) => option.id)).toEqual(['music-video', 'educational-video', 'children-song-reading']);
    expect(blueprint.mediumLabel).toBe('오디오북');
    expect(blueprint.formatLabel).toBe('교육영상');
    expect(blueprint.managementFocus).toContain('학습 목표');
    expect(blueprint.managementFocus).toContain('음성 톤');
    expect(blueprint.agentStack).toContain('낭독 연출 에이전트');
    expect(blueprint.agentStack).toContain('교육 구성 에이전트');
    expect(blueprint.nextWorkspace).toBe('audio-video-studio');
  });

  it('maps a comics selection to visual continuity and episode board operations', () => {
    const options = getFormatOptions('comics');
    const blueprint = buildCreativeBlueprint({
      medium: 'comics',
      format: 'serial-webtoon'
    });

    expect(options.map((option) => option.id)).toEqual([
      'insta-toon',
      'short-comic',
      'serial-webtoon'
    ]);
    expect(blueprint.mediumLabel).toBe('만화');
    expect(blueprint.agentStack).toContain('웹툰 연출 에이전트');
    expect(blueprint.agentStack).toContain('말풍선 연출 에이전트');
    expect(blueprint.agentStack).toContain('원화/키프레임 감독');
    expect(blueprint.agentStack).toContain('다빈치 이미지 프롬프트 에이전트');
    expect(blueprint.managementFocus).toContain('컷 연출 규칙');
    expect(blueprint.managementFocus).toContain('키프레임 원화 선택');
  });

  it('maps an insta-toon selection to carousel and square-format operations', () => {
    const blueprint = buildCreativeBlueprint({
      medium: 'comics',
      format: 'insta-toon'
    });

    expect(blueprint.formatLabel).toBe('인스타툰');
    expect(blueprint.projectRoomTitle).toBe('인스타툰 설계 보드');
    expect(blueprint.managementFocus).toContain('캐러셀/네컷 선택');
    expect(blueprint.managementFocus).toContain('정사각형 화면 구성');
    expect(blueprint.agentStack).toContain('웹툰 연출 에이전트');
    expect(blueprint.agentStack).toContain('말풍선 연출 에이전트');
  });

  it('maps short comic to a broad storybook and graphic-novel bucket', () => {
    const blueprint = buildCreativeBlueprint({
      medium: 'comics',
      format: 'short-comic'
    });

    expect(blueprint.formatLabel).toBe('단편 만화');
    expect(blueprint.projectRoomSubtitle).toContain('동화책');
    expect(blueprint.projectRoomSubtitle).toContain('그래픽노블');
    expect(blueprint.managementFocus).toContain('동화책 페이지');
    expect(blueprint.managementFocus).toContain('그래픽노블 톤');
  });

  it('classifies serial formats and standalone formats apart', () => {
    // 연재형 — 회차가 누적된다
    expect(isSerialFormat('long-novel')).toBe(true);
    expect(isSerialFormat('medium-novel')).toBe(true);
    expect(isSerialFormat('essay-series')).toBe(true);
    expect(isSerialFormat('serial-webtoon')).toBe(true);
    // 단독 완결형 — 한 편으로 끝난다
    expect(isSerialFormat('short-novel')).toBe(false);
    expect(isSerialFormat('personal-essay')).toBe(false);
    expect(isSerialFormat('short-comic')).toBe(false);
  });

  it('uses 회차 for serial formats and 원고 for standalone formats', () => {
    expect(getWorkUnitNoun('long-novel')).toBe('회차');
    expect(getWorkUnitNoun('medium-novel')).toBe('회차');
    expect(getWorkUnitNoun('short-novel')).toBe('원고');
    expect(getWorkUnitNoun('personal-essay')).toBe('원고');
  });

  it('maps a four-cut insta-toon selection to fixed quadrant and speech bubble operations', () => {
    const blueprint = buildCreativeBlueprint({
      medium: 'comics',
      format: 'four-cut-insta-toon'
    });

    expect(blueprint.formatLabel).toBe('네컷 인스타툰');
    expect(blueprint.projectRoomTitle).toBe('네컷 인스타툰 설계 보드');
    expect(blueprint.managementFocus).toContain('4컷 구성표');
    expect(blueprint.managementFocus).toContain('좌상/우상/좌하/우하 배치');
    expect(blueprint.agentStack).toContain('말풍선 연출 에이전트');
    expect(blueprint.agentStack).toContain('원화/키프레임 감독');
    expect(blueprint.agentStack).toContain('다빈치 이미지 프롬프트 에이전트');
    expect(blueprint.productionPhases.map((phase) => phase.title)).toEqual([
      '원화 후보 선택',
      '4컷 구성',
      '말풍선 연출',
      '컷별 프롬프트',
      '프레임 완성'
    ]);
  });

  it('falls back to the medium default format on a mismatched selection (앱 크래시 방지)', () => {
    // 회귀 — 매체 전환 직후 이전 매체 포맷이 남으면(comics + 소설 'short-novel') buildCreativeBlueprint 가
    // throw 했고, App.tsx useMemo 가 렌더 중 호출해 에러 바운더리 없이 앱 전체가 화이트스크린으로 죽었다.
    // 무효 조합은 매체의 기본(첫) 포맷으로 폴백해 크래시를 막아야 한다.
    const blueprint = buildCreativeBlueprint({ medium: 'comics', format: 'short-novel' as never });
    expect(blueprint.mediumLabel).toBe('만화');
    expect(blueprint.formatLabel).toBe('인스타툰');
  });

  it('maps an academic selection to English APA argument operations', () => {
    const options = getFormatOptions('academic');
    const blueprint = buildCreativeBlueprint({
      medium: 'academic',
      format: 'research-paper'
    });
    const labels = getCreativeActionLabels('academic');

    expect(options.map((option) => option.id)).toEqual([
      'research-paper',
      'academic-column',
      'literature-review'
    ]);
    expect(blueprint.mediumLabel).toBe('사회과학/학술');
    expect(blueprint.formatLabel).toBe('Research Paper');
    expect(blueprint.managementFocus).toContain('주장-근거 매핑');
    expect(blueprint.managementFocus).toContain('APA 인용 무결성');
    expect(blueprint.agentStack).toContain('에세이 큐레이터 에이전트');
    expect(blueprint.agentStack).toContain('평론가 에이전트');
    expect(blueprint.agentStack).toContain('인터뷰 큐레이터 에이전트');
    expect(blueprint.agentStack).toContain('논증 구조 에이전트');
    expect(blueprint.skillStack).toContain('academic-argument-outline');
    expect(blueprint.nextWorkspace).toBe('academic-writing-studio');
    expect(labels).toEqual({
      draft: '초안 집필',
      review: '논증 점검',
      lock: '원고 확정',
      lockedChip: '원고 확정됨',
      nextDraft: '다음 절 집필'
    });
  });
});
