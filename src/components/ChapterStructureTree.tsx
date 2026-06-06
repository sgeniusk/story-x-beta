// 회차/원고 구조 트리 — 평탄한 beat 목록을 기승전결(또는 학술 스킴) 4~5막으로 묶어 좌레일에 보여준다
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Chapter, ChapterBeat } from '../lib/storyEngine';
import type { CreativeMedium } from '../lib/projectBlueprint';

// 회차 구조 — 평탄한 beat 목록을 위치 기준 기·승·전·결 4막으로 묶어 트리로 보여준다.
// beats는 순서가 있는 평탄한 리스트이므로 act 묶음은 순번으로 유도한다(에이전트가 고른 스킴).
type StructureAct = { id: string; glyph: string; label: string };

const STRUCTURE_ACTS: StructureAct[] = [
  { id: 'gi', glyph: '기', label: '기 — 도입' },
  { id: 'seung', glyph: '승', label: '승 — 전개' },
  { id: 'jeon', glyph: '전', label: '전 — 전환' },
  { id: 'gyeol', glyph: '결', label: '결 — 결말' }
];

const ACADEMIC_STRUCTURE_ACTS: StructureAct[] = [
  { id: 'introduction', glyph: 'I', label: 'Introduction' },
  { id: 'literature', glyph: 'L', label: 'Literature' },
  { id: 'method', glyph: 'M', label: 'Method' },
  { id: 'discussion', glyph: 'D', label: 'Discussion' },
  { id: 'conclusion', glyph: 'C', label: 'Conclusion' }
];

const ACADEMIC_STRUCTURE_SCHEME = 'Introduction-Literature-Method-Discussion-Conclusion';

function getStructureActs(medium: CreativeMedium): StructureAct[] {
  return medium === 'academic' ? ACADEMIC_STRUCTURE_ACTS : STRUCTURE_ACTS;
}

// 평탄한 beat 목록을 구조 스킴에 균등 분배한다. beat 수가 막 수보다 적으면 앞 막부터 채운다.
function groupBeatsIntoActs(beats: ChapterBeat[], acts: StructureAct[] = STRUCTURE_ACTS): Array<{
  act: StructureAct;
  title: string;
  beats: ChapterBeat[];
}> {
  const total = beats.length;
  const result = acts.map((act) => ({ act, title: act.label, beats: [] as ChapterBeat[] }));
  if (total === 0) {
    return result;
  }
  beats.forEach((beat, index) => {
    const actIndex = Math.min(acts.length - 1, Math.floor((index * acts.length) / total));
    result[actIndex].beats.push(beat);
  });
  return result.map((group) => ({
    ...group,
    title: resolveActTitle(group.beats, group.act.label)
  }));
}

function resolveActTitle(beats: ChapterBeat[], fallback: string): string {
  const titledBeat = beats.find((beat) => beat.label.trim().length > 0);
  if (titledBeat) return titledBeat.label.trim();
  const summarizedBeat = beats.find((beat) => beat.summary.trim().length > 0);
  if (!summarizedBeat) return fallback;
  const firstSentence = summarizedBeat.summary.split(/(?<=[.!?。！？])\s+|\n/)[0]?.trim();
  return firstSentence || fallback;
}

export function ChapterStructureTree({
  chapter,
  medium,
  isSerial,
  activeBeatId,
  onSelectBeat
}: {
  chapter: Chapter | null;
  medium: CreativeMedium;
  isSerial: boolean;
  activeBeatId: string | null;
  onSelectBeat: (beat: ChapterBeat) => void;
}) {
  const beats = chapter?.beats ?? [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const structureActs = useMemo(() => getStructureActs(medium), [medium]);
  const grouped = useMemo(() => groupBeatsIntoActs(beats, structureActs), [beats, structureActs]);
  const activeActId = useMemo(() => {
    const found = grouped.find((group) => group.beats.some((beat) => beat.id === activeBeatId));
    return found?.act.id ?? null;
  }, [grouped, activeBeatId]);
  const isAcademic = medium === 'academic';
  const structureLabel = isAcademic ? '학술 원고 구조' : isSerial ? '회차 구조' : '원고 구조';
  const unitWord = isSerial ? '회차' : '원고';
  const schemeLabel = isAcademic ? ACADEMIC_STRUCTURE_SCHEME : '기승전결';

  return (
    <section className="sx-panel ex-structure-card" aria-label={structureLabel}>
      <div className="ex-rail-section-head">
        <span className="ex-rail-label">{structureLabel}</span>
        <span className="ex-structure-scheme">
          {schemeLabel}<span className="ex-structure-scheme-by"> · 에이전트 선택</span>
        </span>
      </div>
      {!chapter ? (
        <p className="ex-beats-empty">첫 초안을 생성하면 {unitWord} 구조가 여기에 채워집니다.</p>
      ) : beats.length === 0 ? (
        <p className="ex-beats-empty">이 {unitWord}에는 아직 구성이 없습니다. 다음 초안 생성부터 구조가 함께 만들어집니다.</p>
      ) : (
        <div className="ex-structure-tree">
          {grouped.map((group) => {
            const isCollapsed = !!collapsed[group.act.id];
            const isActiveAct = activeActId === group.act.id;

            return (
              <div className="ex-act" key={group.act.id}>
                <button
                  type="button"
                  className={`ex-act-head ${isCollapsed ? 'is-collapsed' : ''} ${isActiveAct ? 'is-active' : ''}`}
                  aria-expanded={!isCollapsed}
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [group.act.id]: !current[group.act.id] }))
                  }
                >
                  <ChevronDown size={13} className="ex-act-caret" aria-hidden="true" />
                  <span className="ex-act-glyph" aria-hidden="true">
                    {group.act.glyph}
                  </span>
                  <span className="ex-act-copy">
                    <span className="ex-act-kicker">{group.act.label}</span>
                    <span className="ex-act-title">{group.title}</span>
                  </span>
                  <span className="ex-act-count">{group.beats.length}</span>
                </button>
                {!isCollapsed && group.beats.length > 0 && (
                  <div className="ex-act-body">
                    {group.beats.map((beat) => {
                      const isActive = beat.id === activeBeatId;

                      return (
                        <button
                          key={beat.id}
                          type="button"
                          className={`ex-scene ${isActive ? 'is-active' : ''}`}
                          aria-current={isActive ? 'true' : undefined}
                          aria-label={`구성 ${beat.no} — ${beat.label}`}
                          onClick={() => onSelectBeat(beat)}
                        >
                          <span className="ex-scene-no">{String(beat.no).padStart(2, '0')}</span>
                          <span className="ex-scene-title">{beat.label}</span>
                          <span className="ex-scene-marker" title={`긴장 강도 ${beat.tension}`}>
                            긴장 {beat.tension}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
