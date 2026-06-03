// 인물 관계도 컴포넌트
import { useMemo } from 'react';
import type { CharacterProfile } from '../lib/storyEngine';

// 인물 관계도 — 캐논 인물 노드와 character.relations 엣지를 SVG로 배치한다.
export function CharacterGraph({
  characters,
  pickedId,
  onPick
}: {
  characters: CharacterProfile[];
  pickedId: string;
  onPick: (id: string) => void;
}) {
  const W = 640;
  const H = 380;
  // 노드를 원형으로 균등 배치한다 — 인물 수와 무관하게 안정적으로 펼쳐진다.
  const layout = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;
    const radius = characters.length <= 1 ? 0 : Math.min(W, H) * 0.32;
    const map = new Map<string, { x: number; y: number }>();
    characters.forEach((character, index) => {
      if (characters.length === 1) {
        map.set(character.id, { x: cx, y: cy });
        return;
      }
      const angle = (index / characters.length) * Math.PI * 2 - Math.PI / 2;
      map.set(character.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      });
    });
    return map;
  }, [characters]);

  // relations는 방향이 있지만 시각적으로는 한 쌍을 한 선으로 그린다 — 중복 엣지를 제거한다.
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ a: string; b: string; label: string; strong: boolean; dashed: boolean }> = [];
    characters.forEach((character) => {
      character.relations.forEach((relation) => {
        if (!layout.has(relation.targetId)) {
          return;
        }
        const key = [character.id, relation.targetId].sort().join('::');
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        list.push({
          a: character.id,
          b: relation.targetId,
          label: relation.label,
          strong: relation.strong === true,
          dashed: relation.dashed === true
        });
      });
    });
    return list;
  }, [characters, layout]);

  if (characters.length === 0) {
    return <p className="ex-beats-empty">아직 등록된 인물이 없습니다.</p>;
  }

  return (
    <div className="ex-char-graph">
      <svg viewBox={`0 0 ${W} ${H}`} className="ex-char-graph-svg" role="img" aria-label="인물 관계도">
        {edges.map((edge, index) => {
          const a = layout.get(edge.a)!;
          const b = layout.get(edge.b)!;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;

          return (
            <g key={index} className={`ex-char-edge ${edge.strong ? 'is-strong' : ''}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`ex-char-edge-line ${edge.strong ? 'is-strong' : ''} ${edge.dashed ? 'is-dashed' : ''}`}
              />
              {edge.label && (
                <text x={mx} y={my - 6} className="ex-char-edge-label" textAnchor="middle">
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        {characters.map((character) => {
          const pos = layout.get(character.id)!;
          const isPicked = character.id === pickedId;

          return (
            <g
              key={character.id}
              className={`ex-char-node ${isPicked ? 'is-picked' : ''}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${character.name} — ${character.role}`}
              aria-pressed={isPicked}
              onClick={() => onPick(character.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onPick(character.id);
                }
              }}
            >
              <circle r={34} className="ex-char-node-circle" />
              <text y={5} textAnchor="middle" className="ex-char-node-name">
                {character.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="ex-char-graph-legend">
        <span>
          <i className="ex-char-legend-line is-strong" /> 핵심 관계
        </span>
        <span>
          <i className="ex-char-legend-line is-dashed" /> 잠정·미확정
        </span>
        <span className="ex-char-graph-hint">노드를 누르면 옆에서 인물 상세를 봅니다.</span>
      </div>
    </div>
  );
}
