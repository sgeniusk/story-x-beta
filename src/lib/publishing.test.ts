import { describe, expect, it } from 'vitest';

import { buildMemoryApprovalQueue } from './memoryBank';
import { buildCreativeBlueprint } from './projectBlueprint';
import { buildPublishingPlan } from './publishing';
import { createSeedProject, produceNextChapter } from './storyEngine';
import { buildOneProjectVerticalSlice } from './verticalSlice';

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

  it('turns pending memory approvals into a publishing release gate', () => {
    const project = projectWithChapter();
    const verticalSlice = buildOneProjectVerticalSlice();
    const approvalQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: verticalSlice.memoryCandidates
    });
    const plan = buildPublishingPlan(
      project,
      buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' }),
      { approvalQueue }
    );
    const memoryGate = plan.checklist.find((item) => item.id === 'memory-approval');

    expect(memoryGate?.status).toBe('review');
    expect(memoryGate?.detail).toContain('승인 대기');
    expect(plan.changeLogReview.join(' ')).toContain('승인 대기');
  });

  it('marks the publishing memory gate ready when every memory candidate can sync', () => {
    const project = projectWithChapter();
    const verticalSlice = buildOneProjectVerticalSlice();
    const pendingQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: verticalSlice.memoryCandidates
    });
    const approvalQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: verticalSlice.memoryCandidates,
      decisions: Object.fromEntries(pendingQueue.items.map((item) => [item.id, 'approved']))
    });
    const plan = buildPublishingPlan(
      project,
      buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' }),
      { approvalQueue }
    );
    const memoryGate = plan.checklist.find((item) => item.id === 'memory-approval');

    expect(memoryGate?.status).toBe('ready');
    expect(memoryGate?.detail).toContain('동기화 가능');
    expect(plan.snapshotItems).toContain('승인된 메모리 후보');
  });

  it('blocks the release snapshot lock while any release gate needs review', () => {
    const plan = buildPublishingPlan(
      projectWithChapter(),
      buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' })
    );

    expect(plan.releaseLock.canLock).toBe(false);
    expect(plan.releaseLock.blockerIds).toContain('canon');
    expect(plan.releaseLock.notice).toContain('검토');
  });

  it('opens the release snapshot lock when every release gate is ready', () => {
    const project = projectWithChapter();
    const verticalSlice = buildOneProjectVerticalSlice();
    const pendingQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: verticalSlice.memoryCandidates
    });
    const approvalQueue = buildMemoryApprovalQueue({
      project,
      reviewCandidates: verticalSlice.memoryCandidates,
      decisions: Object.fromEntries(pendingQueue.items.map((item) => [item.id, 'approved']))
    });
    const plan = buildPublishingPlan(
      project,
      buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' }),
      { approvalQueue }
    );

    expect(plan.releaseLock.canLock).toBe(true);
    expect(plan.releaseLock.blockerIds).toEqual([]);
    expect(plan.releaseLock.notice).toContain('잠글 수 있습니다');
  });
});
