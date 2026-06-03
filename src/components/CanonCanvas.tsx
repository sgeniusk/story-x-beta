// 캐논 데이터 캔버스 컴포넌트
import { useState, type JSX } from 'react';
import { ChevronRight, GitBranch } from 'lucide-react';
import type { SeriesProject } from '../lib/storyEngine';
import { CanonTimeline } from './CanonTimeline';
import { CharacterGraph } from './CharacterGraph';
import { CharacterDetailPanel } from './CharacterDetailPanel';
import { CanonCardGrid } from './CanonCardGrid';
import { canonCategories, getCategoryEntities, type BibleSection, type CanonCategory } from '../lib/canonDataView';

// 데이터 모드 가운데 캔버스 — 고른 캐논 분야에 따라 관계도/카드/타임라인을 띄운다.
export function CanonCanvas({
  category,
  project,
  onUpdateCharacter,
  onOpenBibleSection
}: {
  category: CanonCategory;
  project: SeriesProject;
  onUpdateCharacter: (characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) => void;
  onOpenBibleSection: (section: BibleSection) => void;
}) {
  const categoryLabel = canonCategories.find((item) => item.id === category)?.label ?? '캐논';
  const [pickedCharacterId, setPickedCharacterId] = useState<string>(project.characters[0]?.id ?? '');
  const pickedCharacter =
    project.characters.find((character) => character.id === pickedCharacterId) ?? project.characters[0] ?? null;
  // canon 분야 안내 — 분야별 한 줄 설명.
  const categoryHint: Record<CanonCategory, string> = {
    characters: '인물 관계도. 노드를 눌러 욕망·상처·현재 상태를 바로 고칩니다.',
    places: '작품 속 장소 카드. 충돌 항목은 캐논 원장에서 해결합니다.',
    objects: '작품 속 사물 카드. 충돌 항목은 캐논 원장에서 해결합니다.',
    events: '작품 속 사건 카드. 충돌 항목은 캐논 원장에서 해결합니다.',
    timeline: '작품 연표. 미확인 시점은 캐논 원장에서 확정합니다.'
  };

  let body: JSX.Element;
  if (category === 'characters') {
    body = (
      <div className="ex-canon-pane ex-canon-pane--graph">
        <CharacterGraph
          characters={project.characters}
          pickedId={pickedCharacterId || (project.characters[0]?.id ?? '')}
          onPick={setPickedCharacterId}
        />
        <div className="ex-canon-pane-aside">
          {pickedCharacter ? (
            <CharacterDetailPanel character={pickedCharacter} onUpdateCharacter={onUpdateCharacter} />
          ) : (
            <p className="ex-beats-empty">인물을 먼저 등록하면 상세가 여기에 표시됩니다.</p>
          )}
        </div>
      </div>
    );
  } else if (category === 'timeline') {
    body = <CanonTimeline entries={project.timeline} />;
  } else {
    body = (
      <CanonCardGrid
        entries={getCategoryEntities(project, category)}
        typeLabel={categoryLabel}
        onResolveConflict={() => onOpenBibleSection('canon')}
      />
    );
  }

  return (
    <section className="sx-canon-canvas" aria-label={`${categoryLabel} 데이터`}>
      <header className="ex-canon-canvas-head">
        <div className="ex-canon-canvas-crumbs">
          <span>데이터</span>
          <ChevronRight size={12} aria-hidden="true" />
          <em>{categoryLabel}</em>
        </div>
        <h2 className="ex-canon-canvas-title">{categoryLabel}</h2>
        <p className="ex-canon-canvas-hint">{categoryHint[category]}</p>
        <div className="ex-canon-canvas-actions">
          <button type="button" className="sx-secondary-button" onClick={() => onOpenBibleSection('canon')}>
            <GitBranch size={14} />
            캐논 원장 열기
          </button>
        </div>
      </header>
      <div className="ex-canon-canvas-body">{body}</div>
    </section>
  );
}
