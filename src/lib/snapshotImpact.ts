// 자동 버전 히스토리(B4) — 복원 영향범위(회차·캐논·회차번호 증감, rollback 여부)를 계산하는 순수 모듈.
import type { SeriesProject } from './storyEngine';
import type { ProjectSnapshot } from './storage';

export interface SnapshotImpact {
  chapterDelta: number; // snapshot.chapterCount - current.chapters.length (음수 = 복원 시 감소)
  canonDelta: number;
  episodeDelta: number;
  isRollback: boolean; // 회차 또는 캐논이 줄어드는가(복원 시 손실 위험)
}

export function describeSnapshotImpact(current: SeriesProject, snapshot: ProjectSnapshot): SnapshotImpact {
  const chapterDelta = snapshot.chapterCount - current.chapters.length;
  const canonDelta = snapshot.canonCount - current.canonFacts.length;
  const episodeDelta = snapshot.episode - current.currentEpisode;
  return {
    chapterDelta,
    canonDelta,
    episodeDelta,
    isRollback: chapterDelta < 0 || canonDelta < 0,
  };
}
