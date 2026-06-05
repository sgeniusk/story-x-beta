// 방향 C "떠 있는 작업실" 에디터 — 어두운 캔버스 위 종이 시트 + 좌우 플로팅 독 + 단락 옆 여백 주석.
// claude.ai design 의 direction-c.html 을 React 로 재현한다. 1차는 시안 데이터를 내장해 standalone 렌더가 되고,
// 실제 프로젝트 데이터(editorText·MarginReview·5 페르소나)는 이후 props 로 주입한다.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type PersonaKey = 'show' | 'char' | 'world' | 'style' | 'cont';
type ReviewState = 'done' | 'work' | 'wait';

interface FloatingPersona {
  key: PersonaKey;
  name: string;
  role: string;
  av: string;
  color: string;
}

interface ReviewDatum {
  txt: string;
  was: string | null;
  is: string | null;
  reply: string | null;
}

interface BodyParagraph {
  key: PersonaKey | null;
  lead?: boolean;
  before: string;
  mark?: string;
  after?: string;
}

export interface FloatingEditorProps {
  title?: string;
  episodeLabel?: string;
  kicker?: string;
  charCount?: string;
  chapterTitle?: string;
  chapterSub?: string;
}

const SAMPLE_PERSONAS: FloatingPersona[] = [
  { key: 'show', name: '쇼러너', role: '회차 프레이밍·훅', av: '쇼', color: 'var(--p-show)' },
  { key: 'char', name: '캐릭터 담당', role: '욕망·상처·목소리', av: '캐', color: 'var(--p-char)' },
  { key: 'world', name: '세계관 담당', role: '설정 규칙·지리', av: '세', color: 'var(--p-world)' },
  { key: 'style', name: '문체 담당', role: '톤·리듬·한국어', av: '문', color: 'var(--p-style)' },
  { key: 'cont', name: '연속성 담당', role: '캐논·떡밥·시간선', av: '연', color: 'var(--p-cont)' },
];

const SAMPLE_REVIEWS: Record<PersonaKey, ReviewDatum> = {
  style: {
    txt: '첫 문단의 리듬이 좋습니다. 장르 톤(잔잔한 환상)에 맞게, 두 번째 문단의 만연체 한 곳만 끊어 주면 호흡이 살겠습니다.',
    was: '한 층을 오를 때마다 사람들은 자기 이름을 한 글자씩 내려놓았고, 꼭대기에 닿은 이는…',
    is: '한 층을 오를 때마다 이름을 한 글자씩 내려놓았다. 꼭대기에 닿은 이는…',
    reply: null,
  },
  char: {
    txt: '필사관의 망설임이 행동으로 드러나서 좋습니다. 다만 오빠를 떠올리는 대목에서 감정이 너무 빨리 가라앉아요. 한 박자 더 머물게 하면 인물의 상처가 살아납니다.',
    was: '…알면서도, 고개를 끄덕였다.',
    is: '…알면서도, 펜 끝을 잉크에 담갔다. 손이 먼저 오빠를 기억하고 있었다.',
    reply: '상처 한 줄 더 — 반영',
  },
  world: {
    txt: '탑의 대가 규칙이 선명합니다. 다만 7층까지 올랐다면 오빠는 이미 일곱 글자를 잃었어야 합니다. 명부에 이름이 "적혀" 있었다는 설정과 어긋나지 않는지 점검해 주세요.',
    was: null,
    is: null,
    reply: null,
  },
  cont: {
    txt: '3화에서 "이름은 한 번만 빌릴 수 있다"고 못 박았습니다. 마지막 줄의 "한 번 더 빌리기로 한 것이다"는 그 규칙과 충돌합니다. 의도된 파격인지 확인이 필요합니다.',
    was: null,
    is: null,
    reply: '의도된 파격 — 4화에서 대가 회수',
  },
  show: {
    txt: '마지막 줄이 다음 회차 훅으로 완벽합니다. 2화는 "이름을 빌린 대가"가 즉시 닥치는 장면으로 열면 연재 동력이 강해집니다.',
    was: null,
    is: null,
    reply: null,
  },
};

const SAMPLE_BODY: BodyParagraph[] = [
  {
    key: 'style',
    lead: true,
    before: '필사관은 잉크가 마르기 전에 한 줄을 더 고쳤다. 고친 기억은 늘 그렇듯, ',
    mark: '손대기 전보다 매끄럽고 또 그만큼 거짓이었다',
    after: '.',
  },
  {
    key: 'char',
    before:
      '탑은 이름을 받고 움직였다. 한 층을 오를 때마다 사람들은 자기 이름을 한 글자씩 내려놓았고, 꼭대기에 닿은 이는 자신이 누구였는지 끝내 기억하지 못했다. 의뢰인은 죽은 어머니의 마지막 말을 듣고 싶다고 했다. 필사관은 그 말이 처음부터 존재하지 않았다는 것을 알면서도, ',
    mark: '고개를 끄덕였다',
    after: '.',
  },
  {
    key: 'world',
    before: '오빠가 사라진 건 작년 겨울, ',
    mark: '탑의 7층 명부에 그의 이름이 마지막으로 적힌 날',
    after:
      '이었다. 명부지기는 그런 이름은 없다고 했다. 필사관은 명부를 직접 펼쳐 보았고, 오빠의 자리에는 누군가 급하게 그어 지운 한 줄과, 그 위에 덧쓴 낯선 이름만 남아 있었다.',
  },
  {
    key: null,
    before:
      '그날부터 그녀는 남의 기억을 고치는 손으로 자기 기억을 지켰다. 잉크는 거짓을 만들지만, 거짓을 오래 들여다본 사람만이 진짜가 어디서 끊겼는지 안다. 탑은 그것을 가장 두려워했다.',
  },
  {
    key: 'cont',
    before:
      '의뢰인이 떠난 뒤에도 필사관은 책상을 떠나지 않았다. 창밖으로 탑의 그림자가 길어졌고, 그림자 끝이 그녀의 이름 첫 글자를 천천히 덮어 왔다. 그녀는 펜을 내려놓는 대신, 빈 종이의 맨 윗줄에 오빠의 이름을 또박또박 적었다. ',
    mark: '한 번 더 빌리기로 한 것이다',
    after: '.',
  },
];

const PHASES = ['생각 중', '읽는 중', '표시 중', '쓰는 중'];

export function FloatingEditor({
  title = '샘플 작품',
  episodeLabel = '1화',
  kicker = '장편소설 · 1화',
  charCount = '1,284자',
  chapterTitle = '이름을 빌리는 자',
  chapterSub = '기억을 고치는 필사관이 사라진 오빠의 흔적을 따라 탑에 든다.',
}: FloatingEditorProps) {
  const personaByKey = (key: PersonaKey) => SAMPLE_PERSONAS.find((p) => p.key === key)!;

  const [present, setPresent] = useState<Record<PersonaKey, boolean>>({
    style: true,
    char: true,
    world: true,
    cont: false,
    show: false,
  });
  const [stateMap, setStateMap] = useState<Record<PersonaKey, ReviewState>>({
    style: 'done',
    char: 'done',
    world: 'done',
    cont: 'wait',
    show: 'wait',
  });
  const [openPanel, setOpenPanel] = useState<'struct' | 'curve' | 'state' | 'writers' | null>(null);
  const [detailKey, setDetailKey] = useState<PersonaKey | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [pop, setPop] = useState<{ x: number; y: number } | null>(null);
  const [marginTops, setMarginTops] = useState<Record<string, number>>({});

  const appRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const marginNoteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hintTimer = useRef<number | null>(null);
  const assignTimers = useRef<number[]>([]);

  const presentCount = Object.values(present).filter(Boolean).length;

  const toast = useCallback((msg: string) => {
    setHint(msg);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2400);
  }, []);

  // 여백 주석을 해당 단락 옆에 정렬 (위 주석과 겹치지 않게) — direction-c renderMargin 포팅
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
    SAMPLE_BODY.forEach((para) => {
      if (!para.key || !present[para.key]) return;
      const anchorEl = deck.querySelector<HTMLElement>(`.ms .anchor[data-key="${para.key}"]`);
      const noteEl = marginNoteRefs.current[para.key];
      if (!anchorEl || !noteEl) return;
      let off = anchorEl.getBoundingClientRect().top - deckTop;
      if (off < prevBottom + 12) off = prevBottom + 12;
      tops[para.key] = off;
      prevBottom = off + noteEl.offsetHeight;
    });
    setMarginTops(tops);
  }, [present]);

  useLayoutEffect(() => {
    layoutMargin();
  }, [layoutMargin]);

  useEffect(() => {
    const onResize = () => {
      layoutMargin();
      setOpenPanel(null);
      setDetailKey(null);
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
          setDetailKey(null);
        }
      }
      if (
        e.key === 'Enter' &&
        detailKey &&
        (document.activeElement as HTMLElement)?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        resolveReview(detailKey, true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailKey, isFocus]);

  useEffect(() => {
    const t = window.setTimeout(
      () => toast('밑줄 친 구절에 작가진 의견이 있습니다 · 구절이나 옆 <b>주석</b>을 누르세요'),
      700
    );
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      assignTimers.current.forEach((t) => window.clearTimeout(t));
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, []);

  const openDetail = useCallback((key: PersonaKey) => {
    setOpenPanel(null);
    setDetailKey(key);
  }, []);

  const closeDetail = useCallback(() => setDetailKey(null), []);

  function resolveReview(key: PersonaKey, ok: boolean) {
    setPresent((p) => ({ ...p, [key]: false }));
    setStateMap((s) => ({ ...s, [key]: 'wait' }));
    setDetailKey(null);
    toast(ok ? '<b>반영</b> 완료' : '보류함');
  }

  const togglePanel = useCallback((id: 'struct' | 'curve' | 'state' | 'writers') => {
    setDetailKey(null);
    setOpenPanel((cur) => (cur === id ? null : id));
  }, []);

  const closeAll = useCallback(() => {
    setOpenPanel(null);
    setDetailKey(null);
    setPop(null);
  }, []);

  const callOne = useCallback(
    (key: PersonaKey) => {
      setPop(null);
      setPresent((p) => ({ ...p, [key]: true }));
      setStateMap((s) => ({ ...s, [key]: 'done' }));
      toast(`<b>${personaByKey(key).name}</b> 호출 — 이 대목을 검토했습니다`);
      window.setTimeout(() => openDetail(key), 120);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDetail, toast]
  );

  const assignAll = useCallback(() => {
    assignTimers.current.forEach((t) => window.clearTimeout(t));
    assignTimers.current = [];
    setPresent({ show: false, char: false, world: false, style: false, cont: false });
    setStateMap({ show: 'work', char: 'work', world: 'work', style: 'work', cont: 'work' });
    setOpenPanel('writers');
    toast('<b>5명에게 전체 검토</b>를 맡겼습니다');
    SAMPLE_PERSONAS.forEach((p, i) => {
      const done = window.setTimeout(() => {
        setPresent((cur) => ({ ...cur, [p.key]: true }));
        setStateMap((cur) => ({ ...cur, [p.key]: 'done' }));
      }, i * 600 + PHASES.length * 380 + 150);
      assignTimers.current.push(done);
    });
  }, [toast]);

  const onBodyMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length > 1 && sel) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const x = Math.max(12, Math.min(r.left + r.width / 2 - 115, window.innerWidth - 242));
      let y = r.bottom + 8;
      if (y > window.innerHeight - 230) y = r.top - 238;
      setPop({ x, y });
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

  const scrimShown = openPanel !== null || detailKey !== null;

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
          <button role="tab" aria-selected="true">
            편집
          </button>
          <button
            role="tab"
            aria-selected="false"
            onClick={() => toast('데이터 모드 — 인물 관계도·캐논·타임라인')}
          >
            데이터
          </button>
        </div>
        <div className="vr" />
        <button
          className="btn-publish"
          onClick={() => toast('출간 — 회차를 매체로 내보냅니다 (이번 범위 밖)')}
          title="출간"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m0-13 4 4m-4-4-4 4M5 21h14" />
          </svg>
          <span>출간</span>
        </button>
        <button
          className="btn-primary"
          onClick={() => toast('초안 생성 — 데모에서는 본문이 채워져 있습니다')}
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
            <div className="ms" onMouseUp={onBodyMouseUp}>
              {SAMPLE_BODY.map((para, i) => {
                const hasNote = !!para.key && present[para.key];
                const cls = ['anchor', para.lead ? 'lead' : '', hasNote ? 'has-note' : '']
                  .filter(Boolean)
                  .join(' ');
                const style = para.key
                  ? ({ ['--ac' as string]: `var(--p-${para.key})` } as CSSProperties)
                  : undefined;
                return (
                  <p key={i} className={cls} style={style} data-key={para.key ?? undefined}>
                    {para.before}
                    {para.mark && (
                      <span
                        className="mark"
                        data-key={para.key ?? undefined}
                        onClick={() => para.key && hasNote && openDetail(para.key)}
                      >
                        {para.mark}
                      </span>
                    )}
                    {para.after}
                  </p>
                );
              })}
            </div>
          </article>

          {/* margin notes (wide screens) */}
          <div className="margin" id="fc-margin">
            {SAMPLE_BODY.map((para) => {
              if (!para.key || !present[para.key]) return null;
              const p = personaByKey(para.key);
              const d = SAMPLE_REVIEWS[para.key];
              const top = marginTops[para.key];
              return (
                <div
                  key={para.key}
                  ref={(el) => {
                    marginNoteRefs.current[para.key as string] = el;
                  }}
                  className="mnote"
                  style={
                    {
                      ['--ac' as string]: p.color,
                      position: top != null ? 'absolute' : undefined,
                      top: top != null ? `${top}px` : undefined,
                      width: top != null ? '100%' : undefined,
                    } as CSSProperties
                  }
                  onClick={() => openDetail(para.key as PersonaKey)}
                >
                  <div className="who">
                    <span className="av" style={{ background: p.color }}>
                      {p.av}
                    </span>
                    <span className="nm">{p.name}</span>
                    <span className="st">완료</span>
                  </div>
                  <div className="txt">{d.txt}</div>
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
          <div className="tree-li on">
            <span className="n">기</span>
            <span className="label">잉크가 마르기 전 — 고친 기억의 거짓</span>
          </div>
          <div className="tree-li">
            <span className="n">승</span>
            <span className="label">탑의 두 번째 거래 — 어머니의 말</span>
          </div>
          <div className="tree-li">
            <span className="n">전</span>
            <span className="label">7층 명부에 지워진 오빠의 이름</span>
          </div>
          <div className="tree-li">
            <span className="n">결</span>
            <span className="label">한 번 더 이름을 빌리다 — 다음 층 훅</span>
          </div>
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
            <path
              d="M0 78 C40 72 50 32 92 38 S152 84 184 58 246 16 290 24 L290 104 L0 104 Z"
              fill="color-mix(in oklch,var(--accent) 16%,transparent)"
            />
            <path
              d="M0 78 C40 72 50 32 92 38 S152 84 184 58 246 16 290 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            />
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
                1,284<small>자</small>
              </div>
              <div className="k">이번 회차 분량</div>
            </div>
            <div className="cell">
              <div className="v">
                1<small>화</small>
              </div>
              <div className="k">전체 회차</div>
            </div>
            <div className="cell">
              <div className="v">
                3<small>개</small>
              </div>
              <div className="k">캐논</div>
            </div>
            <div className="cell">
              <div className="v">
                3<small>명</small>
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
              defaultValue="'거짓을 고치는 손'과 '진짜를 지키는 손'의 모순으로 1화를 연다. 오빠의 지워진 이름을 마지막 줄 훅으로."
            />
          </div>
        </div>
      </div>
      <div className={`panel${openPanel === 'writers' ? ' show' : ''}`} id="fc-p-writers">
        <div className="ph">
          <h4>작가실 · 5명</h4>
          <button className="x" onClick={closeAll}>
            ✕
          </button>
        </div>
        <div className="pb">
          <div>
            {SAMPLE_PERSONAS.map((p) => {
              const st = stateMap[p.key];
              const lbl = st === 'done' ? '완료' : st === 'work' ? '검토 중' : '대기';
              return (
                <div
                  key={p.key}
                  className="wrow"
                  data-state={st}
                  onClick={() => (present[p.key] ? openDetail(p.key) : callOne(p.key))}
                >
                  <span className="av" style={{ background: p.color }}>
                    {p.av}
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
            5명에게 전체 검토 맡기기
          </button>
        </div>
      </div>

      {/* note detail */}
      {detailKey && (() => {
        const p = personaByKey(detailKey);
        const d = SAMPLE_REVIEWS[detailKey];
        return (
          <div
            className="detail show"
            id="fc-detail"
            style={{ ['--ac' as string]: p.color } as CSSProperties}
          >
            <div className="dh">
              <span className="av" style={{ background: p.color }}>
                {p.av}
              </span>
              <div>
                <div className="nm">{p.name}</div>
                <div className="role">{p.role}</div>
              </div>
              <button className="x" onClick={closeDetail}>
                ✕
              </button>
            </div>
            <div className="db">
              <div className="txt">{d.txt}</div>
              {d.was && (
                <div className="diff">
                  <div className="row was">{d.was}</div>
                  <div className="row is">{d.is}</div>
                </div>
              )}
              <div className="reply">
                <span className="rav">나</span>
                <input defaultValue={d.reply ?? ''} placeholder="작가 응답 남기기…" />
              </div>
              <div className="acts">
                <button className="ok" onClick={() => resolveReview(detailKey, true)}>
                  반영
                </button>
                <button className="no" onClick={() => resolveReview(detailKey, false)}>
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
          {SAMPLE_PERSONAS.map((p) => (
            <button key={p.key} className="pr" onClick={() => callOne(p.key)}>
              <span className="av" style={{ background: p.color }}>
                {p.av}
              </span>
              <span className="nm">{p.name}</span>
              <span className="role">{p.role.split('·')[0]}</span>
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
            5명 모두에게 맡기기
          </button>
        </div>
      </div>

      <div className={`scrim${scrimShown ? ' show' : ''}`} onClick={closeAll} />
      {hint && <div className="hint show" dangerouslySetInnerHTML={{ __html: hint }} />}
    </div>
  );
}
