import { describe, expect, it, vi } from 'vitest';
import { createEmptyProject } from './storyEngine';
import {
  appendGenerationInboxItem,
  buildProjectRevision,
  canRecoverGeneration,
  expireGenerationJob,
  findLatestGenerationAttempt,
  hasDurableRecoveryDraftReceipt,
  isActiveGeneration,
  mergeGenerationJob,
  parseGenerationInbox,
  persistGenerationInboxState,
  saveGenerationInbox,
  serializeGenerationInbox,
  upsertApprovedCondenseCheckpoint,
  type ApprovedCondenseCheckpoint,
  type GenerationInboxItem
} from './generationInbox';
import type { Chapter } from './storyEngine';
import type { PlayRecoverySnapshot } from './playRecovery';

const recovery: PlayRecoverySnapshot = {
  schema: 'storyx/play-recovery/v1',
  projectId: 'p1',
  projectTitle: '작품',
  episode: 1,
  scene: '서고',
  transcript: '나: 기록',
  condensedThroughTurn: 4,
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

const approvedChapter: Chapter = {
  id: 'episode-1',
  episode: 1,
  title: '옥상에 가지 않는 첫날',
  hook: '전화가 다시 울렸다.',
  outline: ['옥상 문 앞에서 멈춘다.'],
  beats: [{ id: 'episode-1-beat-1', no: 1, label: '멈춤', summary: '문을 열지 않는다.', tension: 72 }],
  prose: '나는 손잡이에서 손을 뗐다.',
  memoryAnchors: ['선배의 죽음을 혼자 기억한다.'],
  newCanonFacts: [{ id: 'canon-001-llm-01', episode: 1, owner: 'plot', statement: '주인공은 옥상 문을 열지 않았다.' }],
  rewardArc: [{ promise: '옥상 문을 열 것인가', payoff: '열지 않는다.', intensity: 70 }],
  stakesLedger: [{ stake: '선배의 죽음에 관한 진실', atRisk: '주인공', resolution: 'deferred' }]
};

const approvedCheckpoint: ApprovedCondenseCheckpoint = {
  baseProjectRevision: 'approval-rev-base',
  committedProjectRevision: 'approval-rev-committed',
  condensedThroughTurn: 4,
  chapter: approvedChapter,
  retcons: [{ factId: 'canon-old', previousStatement: '선배는 살아 있다.', statement: '선배는 죽었다.' }]
};

describe('generation inbox', () => {
  it('round-trips valid items and drops damaged entries', () => {
    const raw = JSON.stringify([item('1'), { id: '', status: 'running' }, null]);
    expect(parseGenerationInbox(raw)).toEqual([item('1')]);
    expect(parseGenerationInbox(serializeGenerationInbox([item('1')]))).toEqual([item('1')]);
  });

  it('생성 시작 때 보존한 응결 turn 경계를 recovery 영수증에서 왕복한다', () => {
    const receipt = { ...item('boundary', 'failed'), recovery };
    expect(parseGenerationInbox(serializeGenerationInbox([receipt]))[0].recovery)
      .toHaveProperty('condensedThroughTurn', 4);
  });

  it('승인된 응결 체크포인트는 유효한 Chapter·retcon만 왕복하고 손상 데이터는 해당 영수증에서 제거한다', () => {
    const valid = {
      ...item('1', 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      approvedCondenseCheckpoint: approvedCheckpoint
    };
    const malformedChapter = {
      ...item('2', 'succeeded'),
      result: { title: '2화', prose: '본문' },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        chapter: { ...approvedChapter, beats: [{ id: 'bad', no: '1', label: 'x', summary: 'y', tension: 1 }] },
      }
    };
    const malformedRetcon = {
      ...item('3', 'succeeded'),
      result: { title: '3화', prose: '본문' },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        retcons: [{ factId: 'canon-old', previousStatement: 42, statement: '선배는 죽었다.' }]
      }
    };
    const wrongEpisode = {
      ...item('4', 'succeeded'),
      result: { title: '4화', prose: '본문' },
      approvedCondenseCheckpoint: { ...approvedCheckpoint, chapter: { ...approvedChapter, episode: 2 } }
    };
    const missingRevision = {
      ...item('5', 'succeeded'),
      result: { title: '5화', prose: '본문' },
      approvedCondenseCheckpoint: {
        chapter: approvedChapter,
        retcons: []
      }
    };
    const blankRevision = {
      ...item('6', 'succeeded'),
      result: { title: '6화', prose: '본문' },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        baseProjectRevision: '   '
      }
    };
    const blankCommittedRevision = {
      ...item('7', 'succeeded'),
      result: { title: '7화', prose: '본문' },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        committedProjectRevision: ''
      }
    };
    const invalidCondenseBoundary = {
      ...item('8', 'succeeded'),
      result: { title: '8화', prose: '본문' },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        condensedThroughTurn: -1
      }
    };
    const {
      condensedThroughTurn: _legacyBoundary,
      ...legacyCheckpoint
    } = approvedCheckpoint;
    const legacyWithoutBoundary = {
      ...item('9', 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      approvedCondenseCheckpoint: legacyCheckpoint
    };

    const [roundTripped] = parseGenerationInbox(serializeGenerationInbox([valid]));
    expect(roundTripped).toEqual(expect.objectContaining({
      id: valid.id,
      approvedCondenseCheckpoint: approvedCheckpoint
    }));
    expect(parseGenerationInbox(JSON.stringify([legacyWithoutBoundary]))[0])
      .toHaveProperty('approvedCondenseCheckpoint.condensedThroughTurn', 0);
    const parsed = parseGenerationInbox(JSON.stringify([
      malformedChapter,
      malformedRetcon,
      wrongEpisode,
      missingRevision,
      blankRevision,
      blankCommittedRevision,
      invalidCondenseBoundary
    ]));
    expect(parsed).toHaveLength(7);
    expect(parsed.every((receipt) => !receipt.approvedCondenseCheckpoint)).toBe(true);
  });

  it('성공 영수증에 승인 체크포인트를 불변 upsert하고 기존 recovery 메타를 보존한다', () => {
    const receipt = {
      ...item('1', 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      recovery,
      recoveryDraftOpenedAt: '2026-07-16T00:00:00Z',
      recoveryDraftId: 'recovery-draft-1'
    };
    const original = [item('other', 'failed'), receipt];

    const updated = upsertApprovedCondenseCheckpoint(original, receipt.id, approvedCheckpoint);

    expect(updated).not.toBe(original);
    expect(updated[0]).toBe(original[0]);
    expect(updated[1]).toEqual({ ...receipt, approvedCondenseCheckpoint: approvedCheckpoint });
    expect(original[1]).not.toHaveProperty('approvedCondenseCheckpoint');
    expect(upsertApprovedCondenseCheckpoint(original, 'missing', approvedCheckpoint)).toBe(original);
    expect(upsertApprovedCondenseCheckpoint([item('1', 'failed')], '1', approvedCheckpoint)).toEqual([item('1', 'failed')]);
  });

  it('다른 탭이 먼저 남긴 checkpoint와 다른 승인 결정은 덮어쓰지 않는다', () => {
    const receipt = {
      ...item('1', 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      approvedCondenseCheckpoint: approvedCheckpoint
    };
    const original = [receipt];
    const divergent = {
      ...approvedCheckpoint,
      retcons: [{ factId: 'canon-old', previousStatement: '선배는 살아 있다.', statement: '선배는 해외에 있다.' }]
    };

    expect(upsertApprovedCondenseCheckpoint(original, receipt.id, divergent)).toBe(original);
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
    for (let index = 0; index < 25; index += 1) {
      list = appendGenerationInboxItem(list, item(String(index), 'failed'));
    }
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

  it('20개 보호 checkpoint가 cap을 채워도 새 running 생성은 버리지 않고 overflow로 함께 보존한다', () => {
    const protectedReceipts = Array.from({ length: 20 }, (_, index): GenerationInboxItem => ({
      ...item(`checkpoint-${index}`, 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      approvedCondenseCheckpoint: {
        ...approvedCheckpoint,
        baseProjectRevision: `approval-rev-base-${index}`,
        committedProjectRevision: `approval-rev-committed-${index}`
      }
    }));

    const next = appendGenerationInboxItem(protectedReceipts, item('new-running'));

    expect(next).toHaveLength(21);
    expect(next[0]).toEqual(item('new-running'));
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

  it('느린 poll 응답은 이미 terminal/checkpoint가 된 최신 영수증을 running·expired로 역행시키지 않는다', () => {
    const terminal = {
      ...item('1', 'succeeded'),
      result: { title: approvedChapter.title, prose: approvedChapter.prose },
      approvedCondenseCheckpoint: approvedCheckpoint
    };
    const staleRunning = {
      id: '1', projectId: 'p1', baseRevision: 'rev-1', episode: 1,
      status: 'running' as const, createdAt: 'x', updatedAt: 'later'
    };
    expect(mergeGenerationJob(terminal, staleRunning)).toBe(terminal);
    expect(expireGenerationJob(terminal, '느린 404', 'later')).toBe(terminal);
    expect(expireGenerationJob(item('2'), '찾지 못함', 'later')).toMatchObject({
      status: 'expired',
      warning: '찾지 못함',
      updatedAt: 'later'
    });
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
      result: { title: '완료 회차', prose: '승인 전 성공 결과' },
      approvedCondenseCheckpoint: approvedCheckpoint
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
    expect(saved.items[1]).toHaveProperty('approvedCondenseCheckpoint', approvedCheckpoint);
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
