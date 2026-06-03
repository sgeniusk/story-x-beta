// 데이터 모드 캐논 타입과 순수 헬퍼
import type { DataReviewNote } from './dataReviewClient';
import type { CanonEntity, SeriesProject } from './storyEngine';

export type BibleSection = 'overview' | 'characters' | 'world' | 'canon' | 'voice' | 'approval';

// 데이터 모드 캐논 분야 — 좌레일 캐논 nav가 고르는 5종. 가운데 캔버스가 이 단위로 바뀐다.
export type CanonCategory = 'characters' | 'places' | 'objects' | 'events' | 'timeline';
// 데이터 모드 가운데 캔버스에 무엇을 띄울지 — 캐논 분야 5종 또는 바이블 작업장(MemoryBankStudio) 진입점.
export type DataView =
  | { kind: 'canon'; category: CanonCategory }
  | { kind: 'bible'; section: BibleSection };

export const canonCategories: Array<{ id: CanonCategory; label: string }> = [
  { id: 'characters', label: '인물' },
  { id: 'places', label: '장소' },
  { id: 'objects', label: '사물' },
  { id: 'events', label: '사건' },
  { id: 'timeline', label: '시간선' }
];

// 데이터 모드 우레일에 채워지는 분야별 검토 결과 — summary와 정합/제안 노트, 그리고 출처(브리지/기본).
export interface DataReviewView {
  summary: string;
  notes: DataReviewNote[];
  source: 'claude' | 'fallback';
}

// 한 캐논 분야의 엔티티 목록을 분야 id로 돌려준다. 시간선은 별도 형태라 여기서 제외한다.
export function getCategoryEntities(project: SeriesProject, category: CanonCategory): CanonEntity[] {
  switch (category) {
    case 'places':
      return project.places;
    case 'objects':
      return project.objects;
    case 'events':
      return project.events;
    default:
      return [];
  }
}

// 분야에 충돌·미확인 엔티티가 하나라도 있으면 좌레일 nav에 플래그를 띄운다.
export function categoryHasFlag(project: SeriesProject, category: CanonCategory): boolean {
  if (category === 'characters') {
    return false;
  }
  if (category === 'timeline') {
    return project.timeline.some((entry) => entry.status !== 'ok');
  }

  return getCategoryEntities(project, category).some((entity) => entity.status !== 'ok');
}

export function categoryCount(project: SeriesProject, category: CanonCategory): number {
  if (category === 'characters') {
    return project.characters.length;
  }
  if (category === 'timeline') {
    return project.timeline.length;
  }

  return getCategoryEntities(project, category).length;
}
