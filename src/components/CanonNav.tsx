// 캐논 분야 네비게이션 컴포넌트
import type { SeriesProject } from '../lib/storyEngine';
import { canonCategories, categoryCount, categoryHasFlag, type CanonCategory } from '../lib/canonDataView';

// 데이터 모드 좌레일 캐논 nav — 분야 5종, 분야별 개수와 충돌 플래그를 보여준다.
export function CanonNav({
  project,
  activeCategory,
  onSelectCategory
}: {
  project: SeriesProject;
  activeCategory: CanonCategory | null;
  onSelectCategory: (category: CanonCategory) => void;
}) {
  return (
    <nav className="ex-canon-nav" aria-label="캐논 분야">
      {canonCategories.map((category) => {
        const isActive = activeCategory === category.id;
        const hasFlag = categoryHasFlag(project, category.id);

        return (
          <button
            key={category.id}
            type="button"
            className={`ex-canon-nav-item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelectCategory(category.id)}
          >
            <span className="ex-canon-nav-name">{category.label}</span>
            <span className="ex-canon-nav-count">{categoryCount(project, category.id)}</span>
            {hasFlag && (
              <span className="ex-canon-nav-flag" title="충돌·미확인 항목 있음" aria-label="충돌·미확인 항목 있음" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
