// 자동 버전 히스토리(B4) — 복원 영향범위 계산 순수 모듈 테스트
import { describe, it, expect } from 'vitest';
import { describeSnapshotImpact } from './snapshotImpact';
import type { SeriesProject } from './storyEngine';
import type { ProjectSnapshot } from './storage';

const projectWith = (chapters: number, canon: number, episode: number): SeriesProject =>
  ({ chapters: new Array(chapters).fill({}), canonFacts: new Array(canon).fill({}), currentEpisode: episode } as unknown as SeriesProject);

const snapWith = (chapterCount: number, canonCount: number, episode: number): ProjectSnapshot =>
  ({ id: 's', savedAt: '', label: '', episode, chapterCount, canonCount, project: {} as SeriesProject });

describe('describeSnapshotImpact', () => {
  it('스냅샷이 현재보다 적으면 음수 delta + isRollback true', () => {
    const impact = describeSnapshotImpact(projectWith(10, 50, 10), snapWith(8, 45, 8));
    expect(impact).toEqual({ chapterDelta: -2, canonDelta: -5, episodeDelta: -2, isRollback: true });
  });

  it('스냅샷이 현재보다 많으면 양수 delta + isRollback false', () => {
    const impact = describeSnapshotImpact(projectWith(8, 45, 8), snapWith(10, 50, 10));
    expect(impact).toEqual({ chapterDelta: 2, canonDelta: 5, episodeDelta: 2, isRollback: false });
  });

  it('동일하면 delta 0 + isRollback false', () => {
    const impact = describeSnapshotImpact(projectWith(10, 50, 10), snapWith(10, 50, 10));
    expect(impact).toEqual({ chapterDelta: 0, canonDelta: 0, episodeDelta: 0, isRollback: false });
  });

  it('회차만 줄어도(캐논 동일) isRollback true', () => {
    expect(describeSnapshotImpact(projectWith(10, 50, 10), snapWith(9, 50, 9)).isRollback).toBe(true);
  });
});
