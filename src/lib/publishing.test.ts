import { describe, expect, it } from 'vitest';

import { buildCreativeBlueprint } from './projectBlueprint';
import { buildPublishingPlan } from './publishing';
import { createSeedProject, produceNextChapter } from './storyEngine';

function projectWithChapter() {
  const seed = createSeedProject();

  return produceNextChapter(seed, {
    genre: seed.genre,
    intent: '용사와 외계인이 금지된 탑 앞에서 처음 싸운다',
    pressure: '오해가 풀리는 대신 더 큰 계약 조건이 드러난다'
  }).updatedProject;
}

describe('Story X publishing plan', () => {
  it('prepares serial novel releases around proof text and change-log review', () => {
    const plan = buildPublishingPlan(
      projectWithChapter(),
      buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' })
    );

    expect(plan.mode).toBe('serial-episode');
    expect(plan.title).toContain('출간 준비');
    expect(plan.platformProof).toContain('첫 300자');
    expect(plan.snapshotItems).toContain('회차 출간 스냅샷');
    expect(plan.changeLogReview).toEqual(expect.arrayContaining(['변경 로그 검토', '캐논 리팩터 영향 범위']));
  });

  it('adds privacy and voice checks for essays before publishing', () => {
    const plan = buildPublishingPlan(
      projectWithChapter(),
      buildCreativeBlueprint({ medium: 'essay', format: 'personal-essay' })
    );

    expect(plan.mode).toBe('essay-piece');
    expect(plan.checklist.map((item) => item.label).join(' ')).toContain('개인정보');
    expect(plan.checklist.map((item) => item.label).join(' ')).toContain('문체');
  });

  it('keeps comics publishing to storyboard packages in the current alpha scope', () => {
    const plan = buildPublishingPlan(
      projectWithChapter(),
      buildCreativeBlueprint({ medium: 'comics', format: 'serial-webtoon' })
    );

    expect(plan.mode).toBe('storyboard-package');
    expect(plan.releaseNotice).toContain('이미지 생성은 후속 단계');
    expect(plan.packageItems).toEqual(expect.arrayContaining(['첫 3컷 스토리보드', '말풍선 밀도표']));
  });
});
