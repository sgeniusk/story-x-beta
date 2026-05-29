import { useCallback, useRef, useState } from 'react';
import { findPersona, CORE_PERSONAS } from '../lib/extendedPersonas';
import type {
  InlineDiff,
  MarginReview,
  Paragraph,
  PersonaCard,
  SummonHandler,
} from '../lib/marginReview';
import {
  replacePendingMarginReview,
  seedPendingMarginReviews,
} from '../lib/marginReview';

interface Options {
  paragraphs: Paragraph[];
  corePersonaIds: string[];
  /**
   * 진짜 검토를 돌리는 함수. agentReviewProcess 응답을 MarginReview[] 로
   * 변환해 돌려준다. mock 폴백 시엔 정적 데이터를 resolve 하면 된다.
   *
   * - runAll(): 5 코어 전체 검토. 한 명씩 순차 도착하도록 onPartial 콜백 사용.
   * - summonOne(personaId, ctx): 한 명만 호출. 단일 MarginReview resolve.
   */
  runAll: (onPartial: (review: MarginReview) => void) => Promise<void>;
  summonOne: (
    personaId: string,
    ctx: { selectedText?: string; anchor?: string }
  ) => Promise<MarginReview>;
}

/**
 * Margin 검토 상태 전부를 들고 있는 훅.
 * StoryXDesk 에서 이 훅을 부르고, 반환된 값을 MarginColumn / MentionBar /
 * CoreStrip / Spotlight 에 흘려보내면 된다.
 *
 * 도메인 로직(storyEngine 등)은 건드리지 않는다 — runAll / summonOne 두
 * 콜백을 통해서만 결과를 받는다.
 */
export function useMarginReview({ paragraphs, corePersonaIds, runAll, summonOne }: Options) {
  const [reviews, setReviews] = useState<MarginReview[]>([]);
  const [applied, setApplied] = useState<InlineDiff[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterPersona, setFilterPersona] = useState<string | null>(null);
  const [summonedExtended, setSummonedExtended] = useState<PersonaCard[]>([]);
  const [toast, setToast] = useState<{ personaId: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const runAllSeq = useRef(0);

  const showToast = useCallback((personaId: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ personaId });
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const onAcceptDiff = useCallback((diff: InlineDiff) => {
    setApplied((arr) => [
      ...arr.filter(
        (d) => !(d.paragraph === diff.paragraph && d.from === diff.from)
      ),
      diff,
    ]);
  }, []);

  const onRejectReview = useCallback((review: MarginReview) => {
    setReviews((arr) =>
      arr.filter(
        (r) => !(r.persona === review.persona && r.anchor === review.anchor)
      )
    );
  }, []);

  const onRunAll = useCallback(() => {
    const seq = runAllSeq.current + 1;
    runAllSeq.current = seq;
    setOpenId(null);
    setReviews(seedPendingMarginReviews(corePersonaIds, paragraphs));
    void runAll((review) => {
      if (runAllSeq.current !== seq) {
        return;
      }
      setReviews((arr) => replacePendingMarginReview(arr, review));
    }).catch(() => {
      if (runAllSeq.current === seq) {
        setReviews((arr) => arr.filter((review) => !review.pending));
      }
    });
  }, [corePersonaIds, paragraphs, runAll]);

  const onSummon: SummonHandler = useCallback(
    (personaId, ctx = {}) => {
      const anchor = ctx.anchor ?? paragraphs[0]?.id ?? '';
      const persona = findPersona(personaId);
      const isExtended = !CORE_PERSONAS.some((c) => c.id === personaId);

      if (isExtended) {
        setSummonedExtended((arr) =>
          arr.some((p) => p.id === personaId) ? arr : [...arr, persona]
        );
      }

      // pending 카드 — 마진에 슬라이드인
      const pendingCard: MarginReview = {
        persona: personaId,
        anchor,
        severity: 'note',
        head: `${persona.name} — 단락을 읽는 중`,
        body: '',
        diffs: [],
        pending: true,
      };
      setReviews((arr) => [...arr, pendingCard]);
      showToast(personaId);

      summonOne(personaId, ctx).then((resolved) => {
        setReviews((arr) => replacePendingMarginReview(arr, resolved));
      });
    },
    [paragraphs, showToast, summonOne]
  );

  return {
    reviews,
    applied,
    openId,
    setOpenId,
    filterPersona,
    setFilterPersona,
    summonedExtended,
    toast,
    onAcceptDiff,
    onRejectReview,
    onRunAll,
    onSummon,
  };
}
