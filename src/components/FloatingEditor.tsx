// 방향 C "떠 있는 작업실" 에디터 — 어두운 캔버스 위 종이 시트 + 좌측 플로팅 독 + 단락 옆 여백 주석.
// claude.ai design 의 direction-c.html 레이아웃을 React 로 재현한다. 데이터는 전부 props 주입(순수 표현 컴포넌트).
// 실 원고(paragraphs)·작가진 검토(reviews)·5 페르소나(personas)·검토 콜백은 StoryXDesk 가 단일 원천에서 넘긴다.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { InlineDiff, MarginReview, Paragraph, PersonaCard, SummonHandler } from '../lib/marginReview';
import { SEVERITY_LABEL } from '../lib/marginReview';

interface ChapterBeatLike {
  id: string;
  no?: string | number;
  name?: string;
  label?: string;
  summary?: string;
}

export interface FloatingEditorProps {
  title: string;
  episodeLabel: string;
  kicker: string;
  charCount: string;
  chapterTitle: string;
  chapterSub: string;
  paragraphs: Paragraph[];
  reviews: MarginReview[];
  personas: PersonaCard[];
  onSummon: SummonHandler;
  onRunAll: () => void;
  onAcceptDiff: (diff: InlineDiff) => void;
  onRejectReview: (review: MarginReview) => void;
  beats: ChapterBeatLike[];
  activeBeatId?: string | null;
  onSelectBeat: (id: string) => void;
  stats: { chars: number; chapters: number; canon: number; characters: number };
  intentMemo: string;
  // Phase 2a — 편집·네비 콜백 (StoryXDesk 단일 원천에서 주입)
  editable?: boolean;
  bodyVersion?: number;
  onBodyChange?: (text: string) => void;
  onIntentChange?: (text: string) => void;
  onGenerateDraft?: () => void;
  onSwitchTrack?: (track: 'draft' | 'bible') => void;
  onOpenPublish?: () => void;
  isGenerating?: boolean;
}

const avatarText = (p: PersonaCard) => p.name.slice(0, 1);

type PopState = { x: number; y: number; selectedText?: string; anchor?: string } | null;

export function FloatingEditor({
  title,
  episodeLabel,
  kicker,
  charCount,
  chapterTitle,
  chapterSub,
  paragraphs,
  reviews,
  personas,
  onSummon,
  onRunAll,
  onAcceptDiff,
  onRejectReview,
  beats,
  activeBeatId,
  onSelectBeat,
  stats,
  intentMemo,
  editable = true,
  bodyVersion = 0,
  onBodyChange,
  onIntentChange,
  onGenerateDraft,
  onSwitchTrack,
  onOpenPublish,
  isGenerating = false,
}: FloatingEditorProps) {
  const personaById = useCallback(
    (id: string): PersonaCard =>
      personas.find((p) => p.id === id) ?? { id, name: id, role: '', tint: '#62666d', isCore: false },
    [personas]
  );

  const liveReviews = reviews.filter((r) => !r.pending);
  const reviewForAnchor = (anchorId: string) => liveReviews.find((r) => r.anchor === anchorId) ?? null;
  const splitByMark = (text: string, review: MarginReview | null) => {
    const from = review?.diffs?.[0]?.from;
    if (!from) return { before: text, mark: undefined as string | undefined, after: undefined as string | undefined };
    const i = text.indexOf(from);
    if (i < 0) return { before: text, mark: undefined as string | undefined, after: undefined as string | undefined };
    return { before: text.slice(0, i), mark: from, after: text.slice(i + from.length) };
  };
  const personaState = (id: string): 'done' | 'work' | 'wait' => {
    if (liveReviews.some((r) => r.persona === id)) return 'done';
    if (reviews.some((r) => r.persona === id && r.pending)) return 'work';
    return 'wait';
  };
  const presentCount = liveReviews.length;

  const [openPanel, setOpenPanel] = useState<'struct' | 'curve' | 'state' | 'writers' | null>(null);
  const [openReview, setOpenReview] = useState<MarginReview | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [pop, setPop] = useState<PopState>(null);
  const [marginTops, setMarginTops] = useState<Record<string, number>>({});

  const appRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const marginNoteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hintTimer = useRef<number | null>(null);

  // contentEditable 본문 — 한글 IME 조합 중 input 은 무시하고 compositionend 에서 1회만 커밋
  const composingRef = useRef(false);
  const msElRef = useRef<HTMLDivElement>(null);

  const emitBody = useCallback(() => {
    if (composingRef.current) return;
    const el = msElRef.current;
    if (!el) return;
    // 블록(<p>/<div>) 단위로 단락을 빈 줄(\n\n)로 구분한다. splitIntoParagraphs 가
    // /\n\s*\n+/ 로 단락을 나누므로, 라운드트립(editorText→marginParagraphs)이 단락을 보존하려면
    // 블록 사이를 단일 \n 이 아니라 빈 줄로 join 해야 한다. 블록이 없으면 textContent fallback.
    const blocks = el.querySelectorAll('p, div');
    const text =
      blocks.length > 0
        ? Array.from(blocks)
            .map((b) => b.textContent ?? '')
            .join('\n\n')
        : (el.textContent ?? '');
    onBodyChange?.(text);
  }, [onBodyChange]);

  // 본문 자식은 bodyVersion 으로만 재생성한다. 타이핑 중에는 DOM 이 본문을 소유하고,
  // 외부 변경(초안 생성·diff 반영·회차 전환)으로 부모가 bodyVersion++ 할 때만 다시 시드해 커서 보존.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bodyChildren = useMemo(
    () =>
      paragraphs.map((para, i) => {
        const review = reviewForAnchor(para.id);
        const persona = review ? personaById(review.persona) : null;
        const { before, mark, after } = splitByMark(para.text, review);
        const cls = ['anchor', i === 0 ? 'lead' : '', review ? 'has-note' : '']
          .filter(Boolean)
          .join(' ');
        const style = persona ? ({ ['--ac' as string]: persona.tint } as CSSProperties) : undefined;
        return (
          <p key={para.id} className={cls} style={style} data-anchor={para.id} data-key={review?.persona}>
            {before}
            {mark && <span className="mark">{mark}</span>}
            {after}
          </p>
        );
      }),
    [bodyVersion] // 의도적으로 paragraphs 제외 — 타이핑 중 DOM 이 본문 소유, 외부 변경(bodyVersion++) 때만 재시드
  );

  const toast = useCallback((msg: string) => {
    setHint(msg);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2400);
  }, []);

  // 여백 주석을 앵커 단락 옆에 정렬 (위 주석과 겹치지 않게) — direction-c renderMargin 포팅
  const layoutMargin = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 1080) {
      setMarginTops({});
      return;
    }
    const deck = deckRef.current;
    if (!deck) return;
    const deckTop = deck.getBoundingClientRect().top;
    const tops: Record<string, number> = {};
    let prevBottom = -Infinity;
    liveReviews.forEach((review) => {
      const anchorEl = deck.querySelector<HTMLElement>(`.ms .anchor[data-anchor="${review.anchor}"]`);
      const noteEl = marginNoteRefs.current[review.persona];
      if (!anchorEl || !noteEl) return;
      let off = anchorEl.getBoundingClientRect().top - deckTop;
      if (off < prevBottom + 12) off = prevBottom + 12;
      tops[review.persona] = off;
      prevBottom = off + noteEl.offsetHeight;
    });
    setMarginTops(tops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  useLayoutEffect(() => {
    layoutMargin();
  }, [layoutMargin]);

  useEffect(() => {
    const onResize = () => {
      layoutMargin();
      setOpenPanel(null);
      setOpenReview(null);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layoutMargin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFocus) setIsFocus(false);
        else {
          setPop(null);
          setOpenPanel(null);
          setOpenReview(null);
        }
      }
      if (
        e.key === 'Enter' &&
        openReview &&
        (document.activeElement as HTMLElement)?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        resolveReview(openReview, true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openReview, isFocus]);

  useEffect(() => {
    const t = window.setTimeout(
      () => toast('밑줄 친 구절에 작가진 의견이 있습니다 · 구절이나 옆 <b>주석</b>을 누르세요'),
      700
    );
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, []);

  const closeAll = useCallback(() => {
    setOpenPanel(null);
    setOpenReview(null);
    setPop(null);
  }, []);

  const togglePanel = useCallback((id: 'struct' | 'curve' | 'state' | 'writers') => {
    setOpenReview(null);
    setOpenPanel((cur) => (cur === id ? null : id));
  }, []);

  const callOne = useCallback(
    (id: string, selectedText?: string, anchor?: string) => {
      setPop(null);
      onSummon(id, { selectedText, anchor });
      toast(`<b>${personaById(id).name}</b> 호출 — 이 대목을 검토합니다`);
    },
    [onSummon, toast, personaById]
  );

  const assignAll = useCallback(() => {
    setOpenPanel('writers');
    onRunAll();
    toast('<b>5명에게 전체 검토</b>를 맡겼습니다');
  }, [onRunAll, toast]);

  function resolveReview(review: MarginReview, ok: boolean) {
    if (ok && review.diffs[0]) onAcceptDiff(review.diffs[0]);
    else onRejectReview(review);
    setOpenReview(null);
    toast(ok ? '<b>반영</b> 완료' : '보류함');
  }

  const onBodyMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length > 1 && sel) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const x = Math.max(12, Math.min(r.left + r.width / 2 - 115, window.innerWidth - 242));
      let y = r.bottom + 8;
      if (y > window.innerHeight - 230) y = r.top - 238;
      let node: HTMLElement | null = sel.anchorNode as HTMLElement | null;
      let anchor: string | undefined;
      while (node && node !== document.body) {
        if (node instanceof HTMLElement && node.dataset?.anchor) {
          anchor = node.dataset.anchor;
          break;
        }
        node = node?.parentElement ?? null;
      }
      setPop({ x, y, selectedText: text, anchor });
    }
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = document.getElementById('fc-pop');
      if (el && !el.contains(e.target as Node)) setPop(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // 회차 긴장 곡선 — beats 순서로 균등 분포(기→결 상승, 결말 직전 최고점). 정밀 점수 계산은 범위 밖.
  const curvePath = (() => {
    const n = beats.length;
    if (n < 2) return '';
    const pts = beats.map((_, i) => {
      const t = i / (n - 1);
      const x = t * 290;
      const y = 88 - 70 * Math.sin(t * Math.PI * 0.85);
      return `${x.toFixed(0)} ${y.toFixed(0)}`;
    });
    return 'M' + pts.join(' L');
  })();
  const curveLine = curvePath || 'M0 88 L290 88';

  const scrimShown = openPanel !== null || openReview !== null;

  return (
    <div ref={appRef} className={`fc-app${isFocus ? ' focus' : ''}`} id="fc-app">
      {/* floating top chrome */}
      <header className="topbar">
        <div className="brand">X</div>
        <div className="doc-id">
          <span className="title">{title}</span>
          <span className="sep">›</span>
          <span className="ep">
            <b>{episodeLabel}</b> · 새 초안
          </span>
        </div>
        <div className="saved">
          <span className="dot" />
          <span className="word">저장됨</span>
        </div>
        <div className="vr" />
        <div className="modes" role="tablist">
          <button role="tab" aria-selected="true" onClick={() => onSwitchTrack?.('draft')}>
            편집
          </button>
          <button
            role="tab"
            aria-selected="false"
            onClick={() => (onSwitchTrack ? onSwitchTrack('bible') : toast('데이터 모드 — 인물 관계도·캐논·타임라인 (이번 범위 밖)'))}
          >
            데이터
          </button>
        </div>
        <div className="vr" />
        <button
          className="btn-publish"
          onClick={() => (onOpenPublish ? onOpenPublish() : toast('출간 — 회차를 매체로 내보냅니다 (이번 범위 밖)'))}
          title="출간"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m0-13 4 4m-4-4-4 4M5 21h14" />
          </svg>
          <span>출간</span>
        </button>
        <button
          className="btn-primary"
          onClick={() => (onGenerateDraft ? onGenerateDraft() : toast('초안 생성 — 데모에서는 본문이 채워져 있습니다'))}
          disabled={isGenerating}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5z" />
          </svg>
          <span>초안 생성</span>
        </button>
      </header>
      <button className="exitfocus" onClick={() => setIsFocus(false)}>
        집중 모드 끝내기 · Esc
      </button>

      {/* canvas */}
      <div className="canvas" id="fc-canvas" onScroll={() => layoutMargin()}>
        <div className="deck" ref={deckRef}>
          <article className="sheet" ref={sheetRef}>
            <div className="ep-kicker">
              <span>{kicker}</span>
              <span className="line" />
              <span>{charCount}</span>
            </div>
            <h1 className="ep-title">{chapterTitle}</h1>
            <p className="ep-sub">{chapterSub}</p>
            <div
              className="ms"
              ref={msElRef}
              contentEditable={editable}
              suppressContentEditableWarning
              onMouseUp={onBodyMouseUp}
              onInput={emitBody}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={() => {
                composingRef.current = false;
                emitBody();
              }}
            >
              {bodyChildren}
            </div>
          </article>

          {/* margin notes (wide screens) */}
          <div className="margin" id="fc-margin">
            {liveReviews.map((review) => {
              const p = personaById(review.persona);
              const top = marginTops[review.persona];
              return (
                <div
                  key={review.persona}
                  ref={(el) => {
                    marginNoteRefs.current[review.persona] = el;
                  }}
                  className="mnote"
                  style={
                    {
                      ['--ac' as string]: p.tint,
                      position: top != null ? 'absolute' : undefined,
                      top: top != null ? `${top}px` : undefined,
                      width: top != null ? '100%' : undefined,
                    } as CSSProperties
                  }
                  onClick={() => setOpenReview(review)}
                >
                  <div className="who">
                    <span className="av" style={{ background: p.tint }}>
                      {avatarText(p)}
                    </span>
                    <span className="nm">{p.name}</span>
                    <span className="st">{SEVERITY_LABEL[review.severity]}</span>
                  </div>
                  <div className="txt">{review.body}</div>
                  <div className="more">자세히 · 응답 →</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* floating dock — 구조 · (구분선) · 작가진을 왼쪽 거터 한 곳에 통합 */}
      <div className="docks" aria-label="도구">
        <nav className="dock left" aria-label="도구">
          <button
            className={`tool${openPanel === 'struct' ? ' on' : ''}`}
            onClick={() => togglePanel('struct')}
            title="회차 구조"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 6h18M3 12h12M3 18h7" />
            </svg>
            <span className="t">회차</span>
          </button>
          <button
            className={`tool${openPanel === 'curve' ? ' on' : ''}`}
            onClick={() => togglePanel('curve')}
            title="긴장 곡선"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 17c3-1 4-9 7-9s4 6 7 4 4-7 4-7" />
            </svg>
            <span className="t">곡선</span>
          </button>
          <button
            className={`tool${openPanel === 'state' ? ' on' : ''}`}
            onClick={() => togglePanel('state')}
            title="작품 상태"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 3v18h18M7 14l3-4 4 3 5-7" />
            </svg>
            <span className="t">상태</span>
          </button>
          <div className="sep" />
          <button
            className={`tool assign${openPanel === 'writers' ? ' on' : ''}`}
            onClick={() => togglePanel('writers')}
            title="작가실"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
            <span className="t">작가실</span>
            <span className="badge">{presentCount}</span>
          </button>
          <button className="tool" onClick={() => setIsFocus((f) => !f)} title="집중 모드">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
            </svg>
            <span className="t">집중</span>
          </button>
        </nav>
      </div>

      {/* panels */}
      <div className={`panel${openPanel === 'struct' ? ' show' : ''}`} id="fc-p-struct">
        <div className="ph">
          <h4>회차 구조 · 기승전결</h4>
          <button className="x" onClick={closeAll}>
            ✕
          </button>
        </div>
        <div className="pb">
          {beats.length === 0 ? (
            <div className="tree-li">
              <span className="label">아직 회차 구조가 없습니다 · 초안을 생성하면 채워집니다</span>
            </div>
          ) : (
            beats.map((beat) => (
              <div
                key={beat.id}
                className={`tree-li${beat.id === activeBeatId ? ' on' : ''}`}
                onClick={() => onSelectBeat(beat.id)}
              >
                <span className="n">{beat.no ?? ''}</span>
                <span className="label">{beat.name ?? beat.label ?? beat.summary ?? ''}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className={`panel${openPanel === 'curve' ? ' show' : ''}`} id="fc-p-curve">
        <div className="ph">
          <h4>긴장 · 분량 곡선</h4>
          <button className="x" onClick={closeAll}>
            ✕
          </button>
        </div>
        <div className="pb curve">
          <svg viewBox="0 0 290 104" preserveAspectRatio="none">
            <path d={`${curveLine} L290 104 L0 104 Z`} fill="color-mix(in oklch,var(--accent) 16%,transparent)" />
            <path d={curveLine} fill="none" stroke="var(--accent)" strokeWidth="2" />
          </svg>
          <div className="cap">기 → 승 → 전 → 결 · 결말 직전 긴장 최고점</div>
        </div>
      </div>
      <div className={`panel${openPanel === 'state' ? ' show' : ''}`} id="fc-p-state">
        <div className="ph">
          <h4>작품 상태</h4>
          <button className="x" onClick={closeAll}>
            ✕
          </button>
        </div>
        <div className="pb">
          <div className="stat">
            <div className="cell">
              <div className="v">
                {stats.chars.toLocaleString()}
                <small>자</small>
              </div>
              <div className="k">이번 회차 분량</div>
            </div>
            <div className="cell">
              <div className="v">
                {stats.chapters}
                <small>화</small>
              </div>
              <div className="k">전체 회차</div>
            </div>
            <div className="cell">
              <div className="v">
                {stats.canon}
                <small>개</small>
              </div>
              <div className="k">캐논</div>
            </div>
            <div className="cell">
              <div className="v">
                {stats.characters}
                <small>명</small>
              </div>
              <div className="k">캐릭터</div>
            </div>
          </div>
          <div className="memo">
            <div className="mh">
              <span
                className="av"
                style={{
                  background: 'var(--p-show)',
                  width: 15,
                  height: 15,
                  borderRadius: 4,
                  display: 'inline-grid',
                  placeItems: 'center',
                  fontSize: 8,
                  color: 'var(--bg)',
                }}
              >
                쇼
              </span>{' '}
              쇼러너가 잡은 이번 회차 프레이밍
            </div>
            <textarea
              rows={3}
              defaultValue={intentMemo}
              readOnly={!onIntentChange}
              onChange={(e) => onIntentChange?.(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className={`panel${openPanel === 'writers' ? ' show' : ''}`} id="fc-p-writers">
        <div className="ph">
          <h4>작가실 · {personas.length}명</h4>
          <button className="x" onClick={closeAll}>
            ✕
          </button>
        </div>
        <div className="pb">
          <div>
            {personas.map((p) => {
              const st = personaState(p.id);
              const lbl = st === 'done' ? '완료' : st === 'work' ? '검토 중' : '대기';
              return (
                <div
                  key={p.id}
                  className="wrow"
                  data-state={st}
                  onClick={() => {
                    const review = liveReviews.find((r) => r.persona === p.id);
                    if (review) setOpenReview(review);
                    else callOne(p.id);
                  }}
                >
                  <span className="av" style={{ background: p.tint }}>
                    {avatarText(p)}
                  </span>
                  <div className="meta">
                    <div className="nm">{p.name}</div>
                    <div className="role">{p.role}</div>
                  </div>
                  <span className="st">
                    <span className="d" />
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="assignAll" onClick={assignAll}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {personas.length}명에게 전체 검토 맡기기
          </button>
        </div>
      </div>

      {/* note detail */}
      {openReview &&
        (() => {
          const p = personaById(openReview.persona);
          const diff = openReview.diffs[0];
          return (
            <div
              className="detail show"
              id="fc-detail"
              style={{ ['--ac' as string]: p.tint } as CSSProperties}
            >
              <div className="dh">
                <span className="av" style={{ background: p.tint }}>
                  {avatarText(p)}
                </span>
                <div>
                  <div className="nm">{p.name}</div>
                  <div className="role">{p.role}</div>
                </div>
                <button className="x" onClick={() => setOpenReview(null)}>
                  ✕
                </button>
              </div>
              <div className="db">
                <div className="txt">{openReview.body}</div>
                {diff && (
                  <div className="diff">
                    <div className="row was">{diff.from}</div>
                    <div className="row is">{diff.to}</div>
                  </div>
                )}
                <div className="reply">
                  <span className="rav">나</span>
                  <input defaultValue="" placeholder="작가 응답 남기기…" />
                </div>
                <div className="acts">
                  <button className="ok" onClick={() => resolveReview(openReview, true)}>
                    반영
                  </button>
                  <button className="no" onClick={() => resolveReview(openReview, false)}>
                    보류
                  </button>
                  <span className="key">⏎ · Esc</span>
                </div>
              </div>
            </div>
          );
        })()}

      {/* selection popover */}
      <div className={`pop${pop ? ' show' : ''}`} id="fc-pop" style={pop ? { left: pop.x, top: pop.y } : undefined}>
        <div className="ph2">이 대목을 누구에게 맡길까요?</div>
        <div>
          {personas.map((p) => (
            <button key={p.id} className="pr" onClick={() => callOne(p.id, pop?.selectedText, pop?.anchor)}>
              <span className="av" style={{ background: p.tint }}>
                {avatarText(p)}
              </span>
              <span className="nm">{p.name}</span>
              <span className="role">{p.role.split('·')[0].trim()}</span>
            </button>
          ))}
        </div>
        <div className="pall">
          <button
            className="pr"
            onClick={() => {
              assignAll();
              setPop(null);
            }}
          >
            {personas.length}명 모두에게 맡기기
          </button>
        </div>
      </div>

      <div className={`scrim${scrimShown ? ' show' : ''}`} onClick={closeAll} />
      {hint && <div className="hint show" dangerouslySetInnerHTML={{ __html: hint }} />}
    </div>
  );
}
