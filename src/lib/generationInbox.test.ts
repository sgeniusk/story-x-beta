import { describe, expect, it, vi } from 'vitest';
import { createEmptyProject } from './storyEngine';
import {
  appendGenerationInboxItem,
  buildProjectRevision,
  canRecoverGeneration,
  findLatestGenerationAttempt,
  hasDurableRecoveryDraftReceipt,
  isActiveGeneration,
  mergeGenerationJob,
  parseGenerationInbox,
  persistGenerationInboxState,
  saveGenerationInbox,
  serializeGenerationInbox,
  type GenerationInboxItem
} from './generationInbox';
import type { PlayRecoverySnapshot } from './playRecovery';

const recovery: PlayRecoverySnapshot = {
  schema: 'storyx/play-recovery/v1',
  projectId: 'p1',
  projectTitle: '작품',
  episode: 1,
  scene: '서고',
  transcript: '나: 기록',
  capturedAt: '2026-07-15T00:00:00Z'
};

const item = (id: string, status: GenerationInboxItem['status'] = 'running'): GenerationInboxItem => ({
  id,
  kind: 'dive-condense',
  projectId: 'p1',
  projectTitle: '작품',
  baseRevision: 'rev-1',
  episode: 1,
  status,
  createdAt: `2026-07-15T00:00:${id.padStart(2, '0')}Z`,
  updatedAt: `2026-07-15T00:00:${id.padStart(2, '0')}Z`
});

describe('generation inbox', () => {
  it('round-trips valid items and drops damaged entries', () => {
    const raw = JSON.stringify([item('1'), { id: '', status: 'running' }, null]);
    expect(parseGenerationInbox(raw)).toEqual([item('1')]);
    expect(parseGenerationInbox(serializeGenerationInbox([item('1')]))).toEqual([item('1')]);
  });

  it('downgrades a persisted success receipt when its result payload is missing or malformed', () => {
    const missing = { ...item('1', 'succeeded') };
    const malformed = { ...item('2', 'succeeded'), result: { title: '제목만 있음' } };

    expect(parseGenerationInbox(JSON.stringify([missing, malformed]))).toEqual([
      expect.objectContaining({ id: '1', status: 'failed', warning: '완료 결과를 복구하지 못했습니다.' }),
      expect.objectContaining({ id: '2', status: 'failed', warning: '완료 결과를 복구하지 못했습니다.' })
    ]);
  });

  it('keeps newest items first and caps at 20', () => {
    let list: GenerationInboxItem[] = [];
    for (let index = 0; index < 25; index += 1) list = appendGenerationInboxItem(list, item(String(index)));
    expect(list).toHaveLength(20);
    expect(list[0].id).toBe('24');
  });

  it('영수증 UI 갱신으로 배열 순서가 바뀌어도 생성 시도 createdAt 기준 최신 항목을 찾는다', () => {
    const oldFailure = { ...item('1', 'failed'), createdAt: '2026-07-15T00:00:00Z' };
    const newerSuccess = { ...item('2', 'succeeded'), createdAt: '2026-07-15T00:01:00Z' };

    expect(findLatestGenerationAttempt([oldFailure, newerSuccess], 'p1', 1)?.id).toBe('2');
    expect(findLatestGenerationAttempt([newerSuccess, oldFailure], 'p1', 1)?.id).toBe('2');
    expect(findLatestGenerationAttempt([newerSuccess], 'other', 1)).toBeNull();
  });

  it('20개 cap을 넘어도 미완료 작업본이 연결된 영수증은 보존하고 오래된 일반 영수증을 정리한다', () => {
    const protectedReceipt: GenerationInboxItem = {
      ...item('protected', 'failed'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'draft-protected'
    };
    let list: GenerationInboxItem[] = [protectedReceipt];
    for (let index = 0; index < 20; index += 1) {
      list = appendGenerationInboxItem(list, item(`ordinary-${index}`, 'failed'));
    }

    expect(list).toHaveLength(20);
    expect(list.some((candidate) => candidate.id === protectedReceipt.id)).toBe(true);
    expect(parseGenerationInbox(serializeGenerationInbox(list))).toContainEqual(protectedReceipt);
  });

  it('merges polled terminal result without losing client metadata', () => {
    const merged = mergeGenerationJob({
      ...item('1'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-1',
      recoveredAt: '2026-07-16T01:00:00Z',
      recoveredChapterId: 'episode-1'
    }, {
      id: '1', projectId: 'p1', baseRevision: 'rev-1', episode: 1,
      status: 'succeeded', createdAt: 'x', updatedAt: 'y', result: { title: '1화', prose: '본문' }
    });
    expect(merged.projectTitle).toBe('작품');
    expect(merged.status).toBe('succeeded');
    expect(merged.result?.prose).toBe('본문');
    expect(merged.recovery).toEqual(recovery);
    expect(merged.recoveryDraftOpenedAt).toBe('2026-07-16T00:00:00Z');
    expect(merged.recoveryDraftId).toBe('recovery-draft-1');
    expect(merged.recoveredAt).toBe('2026-07-16T01:00:00Z');
    expect(merged.recoveredChapterId).toBe('episode-1');
  });

  it('복구 작업본과 명시적 회차 저장 메타를 구분해 직렬화하고 구버전 영수증도 읽는다', () => {
    const recoverable = {
      ...item('1', 'failed'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-1',
      recoveredAt: '2026-07-16T01:00:00Z',
      recoveredChapterId: 'episode-1'
    };
    expect(parseGenerationInbox(serializeGenerationInbox([recoverable, item('2', 'failed')]))).toEqual([
      recoverable,
      item('2', 'failed')
    ]);
  });

  it('복구 원문이 없으면 작업본·회차 저장 메타도 유효하지 않은 것으로 본다', () => {
    const [parsed] = parseGenerationInbox(JSON.stringify([{
      ...item('1', 'failed'),
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-1',
      recoveredAt: '2026-07-16T01:00:00Z',
      recoveredChapterId: 'episode-1'
    }]));

    expect(parsed).toEqual(item('1', 'failed'));
  });

  it('작업본·회차 영수증 메타는 각 쌍이 모두 있을 때만 유효하다', () => {
    const [parsed] = parseGenerationInbox(JSON.stringify([{
      ...item('1', 'failed'),
      recovery,
      recoveryDraftId: 'orphan-draft-id',
      recoveredAt: '2026-07-16T01:00:00Z'
    }]));
    expect(parsed).toEqual({ ...item('1', 'failed'), recovery });
  });

  it('작업본 이탈을 허용할 영속 영수증은 generation·draft 연결이 일치하고 저장 실패 표식이 없어야 한다', () => {
    const linked = {
      ...item('local-draft-1', 'failed'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'draft-1'
    };

    expect(hasDurableRecoveryDraftReceipt([linked], linked.id, 'draft-1')).toBe(true);
    expect(hasDurableRecoveryDraftReceipt(
      [{ ...linked, localPersistenceFailed: true }],
      linked.id,
      'draft-1'
    )).toBe(false);
    expect(hasDurableRecoveryDraftReceipt([linked], linked.id, 'other-draft')).toBe(false);
    expect(hasDurableRecoveryDraftReceipt([], linked.id, 'draft-1')).toBe(false);
  });

  it('손상 recovery만 버리고 영수증 자체는 보존한다', () => {
    const [parsed] = parseGenerationInbox(JSON.stringify([{ ...item('1', 'failed'), recovery: { ...recovery, transcript: 42 } }]));
    expect(parsed).toEqual(item('1', 'failed'));
  });

  it('recovery가 있는 실패·취소·시간초과·만료만 구제 가능하다', () => {
    for (const status of ['failed', 'cancelled', 'timed-out', 'expired'] as const) {
      expect(canRecoverGeneration({ ...item('1', status), recovery })).toBe(true);
    }
    expect(canRecoverGeneration({ ...item('1', 'running'), recovery })).toBe(false);
    expect(canRecoverGeneration({ ...item('1', 'succeeded'), recovery })).toBe(false);
    expect(canRecoverGeneration(item('1', 'failed'))).toBe(false);
  });

  it('저장 용량 초과 때 오래된 안전 영수증을 정리해 최신 미복구 원문을 재시도한다', () => {
    const newest = { ...item('1', 'failed'), recovery };
    const oldSuccess = {
      ...item('2', 'succeeded'),
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-2',
      result: { title: '완료 회차', prose: '승인 전 성공 결과' }
    };
    const writes: string[] = [];
    const storage = {
      setItem: vi.fn((_key: string, value: string) => {
        if (writes.length === 0) {
          writes.push('failed');
          throw new DOMException('quota', 'QuotaExceededError');
        }
        writes.push(value);
      })
    };

    const saved = saveGenerationInbox([newest, oldSuccess], storage);

    expect(saved.ok).toBe(true);
    expect(saved.compacted).toBe(true);
    expect(saved.items).toHaveLength(2);
    expect(saved.items[0]).toEqual(newest);
    expect(saved.items[1]).toEqual(expect.objectContaining({ id: '2', result: oldSuccess.result }));
    expect(saved.items[1]).not.toHaveProperty('recovery');
    expect(saved.items[1]).not.toHaveProperty('recoveryDraftOpenedAt');
    expect(saved.items[1]).not.toHaveProperty('recoveryDraftId');
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  it('저장 재시도까지 실패해도 예외를 전파하지 않고 메모리 유지 상태를 돌려준다', () => {
    const newest = { ...item('1', 'failed'), recovery };
    const storage = { setItem: vi.fn(() => { throw new DOMException('quota', 'QuotaExceededError'); }) };

    expect(() => saveGenerationInbox([newest], storage)).not.toThrow();
    expect(saveGenerationInbox([newest], storage)).toEqual({ ok: false, compacted: false, items: [newest] });
  });

  it('반복 영속 실패와 후속 성공 사이에 서버 warning은 누적하지 않고 로컬 flag만 해제한다', () => {
    const running = { ...item('1'), recovery, warning: '서버 지연' };
    const fail = vi.fn((items: GenerationInboxItem[]) => ({ ok: false as const, compacted: false, items }));
    const firstFailure = persistGenerationInboxState([running], fail);
    const secondFailure = persistGenerationInboxState(firstFailure, fail);

    expect(secondFailure[0].warning).toBe('서버 지연');
    expect(secondFailure[0].localPersistenceFailed).toBe(true);

    const succeed = vi.fn((items: GenerationInboxItem[]) => ({ ok: true as const, compacted: false, items }));
    const recovered = persistGenerationInboxState(secondFailure, succeed);
    expect(recovered[0].warning).toBe('서버 지연');
    expect(recovered[0]).not.toHaveProperty('localPersistenceFailed');
  });

  it('저장 불가 중 새 잡이 추가되어도 기존 미영속 영수증의 구제 표식을 유지한다', () => {
    const pendingA = { ...item('a'), recovery, localPersistenceFailed: true };
    const pendingB = { ...item('b'), recovery };
    const fail = vi.fn((items: GenerationInboxItem[]) => ({ ok: false as const, compacted: false, items }));

    const failed = persistGenerationInboxState([pendingB, pendingA], fail);
    expect(failed.map((candidate) => [candidate.id, candidate.localPersistenceFailed])).toEqual([
      ['b', true],
      ['a', true]
    ]);

    const succeed = vi.fn((items: GenerationInboxItem[]) => ({ ok: true as const, compacted: false, items }));
    const recovered = persistGenerationInboxState(failed, succeed);
    expect(recovered.every((candidate) => !candidate.localPersistenceFailed)).toBe(true);
  });

  it('recognizes only running jobs as active', () => {
    expect(isActiveGeneration(item('1', 'running'))).toBe(true);
    expect(isActiveGeneration(item('1', 'succeeded'))).toBe(false);
    expect(isActiveGeneration(item('1', 'expired'))).toBe(false);
  });

  it('builds a deterministic revision that changes with canon or chapter state', () => {
    const project = createEmptyProject({ title: '작품' });
    expect(buildProjectRevision(project)).toBe(buildProjectRevision({ ...project }));
    expect(buildProjectRevision({ ...project, currentEpisode: project.currentEpisode + 1 })).not.toBe(buildProjectRevision(project));
  });
});
