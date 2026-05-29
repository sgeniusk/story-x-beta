import { PixelAvatar } from './PixelAvatar';
import { CORE_PERSONAS } from '../lib/extendedPersonas';
import type { MarginReview, PersonaCard } from '../lib/marginReview';

interface Props {
  reviews: MarginReview[];
  /** 호출되어 임시로 strip 에 추가된 확장 페르소나 목록 */
  summonedExtended: PersonaCard[];
  /** 어떤 페르소나로 의견을 필터링하고 있는가. null 이면 전체. */
  filterPersona: string | null;
  setFilterPersona: (id: string | null) => void;
  /** + 버튼 누르면 Spotlight 열기 */
  openSpotlight: () => void;
}

/**
 * 우측 끝의 narrow 슬리버 strip.
 * - 코어 5명 항상 표시.
 * - 호출된 확장은 divider 아래에 보라 액센트로 추가.
 * - 가장 아래 + 버튼 = Spotlight (⌘K).
 */
export function CoreStrip({
  reviews,
  summonedExtended,
  filterPersona,
  setFilterPersona,
  openSpotlight,
}: Props) {
  const confirmedCounts = reviews.reduce<Record<string, number>>((counts, review) => {
    if (!review.pending) {
      counts[String(review.persona)] = (counts[String(review.persona)] ?? 0) + 1;
    }
    return counts;
  }, {});

  return (
    <aside className="sx-core-strip" aria-label="작가실 코어">
      <span className="sx-core-strip__label">CORE 5</span>

      {CORE_PERSONAS.map((p) => {
        const count = confirmedCounts[p.id] ?? 0;
        const isActive = filterPersona === p.id;
        return (
          <Sliver
            key={p.id}
            persona={p}
            isActive={isActive}
            isExtended={false}
            reviewCount={count}
            onToggle={() => setFilterPersona(isActive ? null : p.id)}
          />
        );
      })}

      {summonedExtended.length > 0 && (
        <>
          <div className="sx-core-strip__divider" />
          {summonedExtended.map((p) => {
            const isActive = filterPersona === p.id;
            return (
              <Sliver
                key={p.id}
                persona={p}
                isActive={isActive}
                isExtended
                reviewCount={confirmedCounts[String(p.id)] ?? 0}
                onToggle={() => setFilterPersona(isActive ? null : p.id)}
              />
            );
          })}
        </>
      )}

      <div className="sx-core-strip__divider" />
      <button
        type="button"
        className="sx-core-strip__summon"
        onClick={openSpotlight}
        title="다른 페르소나 부르기 (⌘K)"
        aria-label="다른 페르소나 부르기"
      >
        ＋
      </button>
    </aside>
  );
}

interface SliverProps {
  persona: PersonaCard;
  isActive: boolean;
  isExtended: boolean;
  reviewCount: number;
  onToggle: () => void;
}

function Sliver({ persona, isActive, isExtended, reviewCount, onToggle }: SliverProps) {
  const hasReview = reviewCount > 0;

  return (
    <div
      className={[
        'sx-core-strip__sliver',
        isActive ? 'is-active' : '',
        isExtended ? 'is-extended' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--sliver-tint' as string]: persona.tint }}
      onClick={onToggle}
      title={`${persona.name} · ${persona.role}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <PixelAvatar tint={persona.tint} className="sx-core-strip__avatar" />
      <span className="sx-core-strip__name">{persona.name.slice(0, 4)}</span>
      <span className={`sx-core-strip__badge ${hasReview ? 'has' : ''}`}>
        {reviewCount}
      </span>
    </div>
  );
}
