// 방향 C 플로팅 에디터가 시안 상수가 아니라 props 의 실데이터로 렌더·콜백하는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FloatingEditor, type FloatingEditorProps } from './FloatingEditor';
import { CORE_PERSONAS } from '../lib/extendedPersonas';
import type { MarginReview, Paragraph } from '../lib/marginReview';
import { splitIntoParagraphs } from '../lib/marginReview';
import type { StudioMetrics } from '../lib/studioMetrics';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const paragraphs: Paragraph[] = [
  { id: 'p1', text: '필사관은 잉크가 마르기 전에 한 줄을 더 고쳤다. 고친 기억은 늘 그렇듯 매끄러웠다.' },
  { id: 'p2', text: '탑은 이름을 받고 움직였다. 한 층을 오를 때마다 사람들은 이름을 한 글자씩 내려놓았다.' },
];

const reviews: MarginReview[] = [
  { persona: 'showrunner', anchor: 'p1', severity: 'note', head: '훅', body: '마지막 줄이 다음 회차 훅으로 좋습니다.', diffs: [] },
  {
    persona: 'genre-stylist', anchor: 'p2', severity: 'suggest', head: '리듬',
    body: '만연체 한 곳만 끊어 주세요.',
    diffs: [{ paragraph: 'p2', from: '한 글자씩 내려놓았다', to: '한 글자씩 잃었다' }],
  },
];

function baseProps(over: Partial<FloatingEditorProps> = {}): FloatingEditorProps {
  return {
    title: '샘플 작품', episodeLabel: '1화', kicker: '장편소설 · 1화',
    charCount: '1,284자', chapterTitle: '이름을 빌리는 자', chapterSub: '필사관 이야기.',
    paragraphs, reviews, personas: CORE_PERSONAS,
    onSummon: vi.fn(), onRunAll: vi.fn(), onAcceptDiff: vi.fn(), onRejectReview: vi.fn(),
    beats: [], onSelectBeat: vi.fn(),
    stats: { chars: 1284, chapters: 1, canon: 3, characters: 3 },
    intentMemo: '모순으로 1화를 연다.',
    editable: true,
    bodyVersion: 0,
    onBodyChange: vi.fn(),
    onIntentChange: vi.fn(),
    onGenerateDraft: vi.fn(),
    onSwitchTrack: vi.fn(),
    onOpenPublish: vi.fn(),
    isGenerating: false,
    metrics: {
      harness: { lead: '95/100', tone: 'warn', sub: '보강 필요', layers: [
        { name: '진단', pass: true }, { name: '제작', pass: false },
      ]},
      quality: { lead: '2/7 통과', tone: 'warn', sub: '강제 실패 5', gates: [
        { key: 'hook_first_300', pass: false, note: '첫 300자 평이' },
        { key: 'voice_match_70', pass: true },
      ]},
      media: { lead: '소설 · 핵심 100%', tone: 'good', sub: '6개 매체', axis: 0.5, projections: [
        { medium: '소설', fit: 100, current: true },
      ]},
      ontology: { lead: '중심 질문 있음', tone: 'good', sub: '1개 미해결', entities: [
        { kind: '인물', count: 1 }, { kind: '세계', count: 1 },
      ]},
    } as StudioMetrics,
    onMediaAxisChange: vi.fn(),
    ...over,
  };
}

function mount(props: FloatingEditorProps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(createElement(FloatingEditor, props)); });
  return {
    host,
    rerender: (next: FloatingEditorProps) => act(() => { root.render(createElement(FloatingEditor, next)); }),
    unmount: () => { act(() => root.unmount()); host.remove(); },
    click: (el: Element | null) => act(() => {
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }),
  };
}

describe('FloatingEditor 실데이터 배선', () => {
  it('시안 상수를 코드에서 제거한다', () => {
    const src = readFileSync(resolve(__dirname, 'FloatingEditor.tsx'), 'utf8');
    expect(src).not.toContain('SAMPLE_PERSONAS');
    expect(src).not.toContain('SAMPLE_REVIEWS');
    expect(src).not.toContain('SAMPLE_BODY');
  });

  it('props.reviews 만큼 여백 주석을 렌더하고 persona 이름은 props 에서 온다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelectorAll('.mnote').length).toBe(2);
    expect(host.textContent).toContain('쇼러너');          // CORE_PERSONAS 라벨
    expect(host.textContent).toContain('장르 스타일리스트'); // 시안 '문체 담당' 아님
    unmount();
  });

  it('전체 검토 버튼이 onRunAll 을 호출한다', () => {
    const onRunAll = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onRunAll }));
    click(host.querySelector('.assignAll'));
    expect(onRunAll).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('빈 reviews·빈 paragraphs 에서도 안전하다', () => {
    const { host, unmount } = mount(baseProps({ reviews: [], paragraphs: [] }));
    expect(host.querySelectorAll('.mnote').length).toBe(0);
    unmount();
  });

  it('초안 생성 버튼이 onGenerateDraft 를 호출한다', () => {
    const onGenerateDraft = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onGenerateDraft }));
    click(host.querySelector('.btn-primary'));
    expect(onGenerateDraft).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('출간 버튼이 onOpenPublish 를 호출한다 (우상단 단일 버튼)', () => {
    const onOpenPublish = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onOpenPublish }));
    const publishButtons = host.querySelectorAll('.btn-publish');
    expect(publishButtons.length).toBe(1);
    click(publishButtons[0]);
    expect(onOpenPublish).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('데이터 탭이 onSwitchTrack(bible) 를 호출한다', () => {
    const onSwitchTrack = vi.fn();
    const { host, click, unmount } = mount(baseProps({ onSwitchTrack }));
    const dataTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (t) => t.textContent?.includes('데이터')
    );
    click(dataTab ?? null);
    expect(onSwitchTrack).toHaveBeenCalledWith('bible');
    unmount();
  });

  it('editable 일 때 본문 .ms 가 contentEditable 이다', () => {
    const { host, unmount } = mount(baseProps({ editable: true }));
    expect(host.querySelector('.ms')?.getAttribute('contenteditable')).toBe('true');
    unmount();
  });

  it('editable 본문에 input 이 일어나면 onBodyChange 가 텍스트로 호출된다', () => {
    const onBodyChange = vi.fn();
    const { host, unmount } = mount(baseProps({ editable: true, onBodyChange }));
    const ms = host.querySelector('.ms') as HTMLElement;
    ms.textContent = '필사관은 한 줄을 더 고쳤다.\n탑은 이름을 받고 움직였다.';
    act(() => { ms.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onBodyChange).toHaveBeenCalled();
    expect(onBodyChange.mock.calls.at(-1)?.[0]).toContain('한 줄을 더 고쳤다');
    unmount();
  });

  it('한글 조합 중에는 onBodyChange 를 보류하고 compositionend 에서 1회 커밋한다', () => {
    const onBodyChange = vi.fn();
    const { host, unmount } = mount(baseProps({ editable: true, onBodyChange }));
    const ms = host.querySelector('.ms') as HTMLElement;
    act(() => { ms.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); });
    ms.textContent = '조합중ㅎ';
    act(() => { ms.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onBodyChange).not.toHaveBeenCalled();
    act(() => { ms.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })); });
    expect(onBodyChange).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('렌더된 <p> 블록을 빈 줄로 구분해 라운드트립 단락을 보존한다', () => {
    const onBodyChange = vi.fn();
    const { host, unmount } = mount(baseProps({ editable: true, onBodyChange }));
    const ms = host.querySelector('.ms') as HTMLElement;
    act(() => { ms.dispatchEvent(new Event('input', { bubbles: true })); });
    const text = (onBodyChange.mock.calls.at(-1)?.[0] as string) ?? '';
    // 실제 라운드트립 — editorText 로 들어가 splitIntoParagraphs 로 도로 2단락이 되어야 한다.
    expect(splitIntoParagraphs(text).length).toBe(2);
    expect(text).toContain('필사관');
    expect(text).toContain('탑은 이름을');
    unmount();
  });

  it('의도 메모 편집이 onIntentChange 를 호출한다', () => {
    const onIntentChange = vi.fn();
    const { host, unmount } = mount(baseProps({ onIntentChange }));
    const memo = host.querySelector('.memo textarea') as HTMLTextAreaElement;
    // 실제 타이핑은 네이티브 value setter 를 거쳐 React 의 value tracker 가 변경을 감지한다.
    // 테스트에서 memo.value 직접 대입은 tracker 를 함께 갱신해 onChange 가 안 뜨므로 네이티브 setter 사용.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )!.set!;
    nativeSetter.call(memo, '모순으로 1화를 연다 — 수정.');
    act(() => { memo.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onIntentChange).toHaveBeenCalledWith('모순으로 1화를 연다 — 수정.');
    unmount();
  });

  it('StoryXDesk 가 isDraftMode 이면 FloatingEditor 를 early-return 으로 렌더한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    // Phase 2e — isClassicEditor/?editor=classic 폴백 제거. 편집은 항상 FloatingEditor.
    expect(desk).toContain('<FloatingEditor {...floatingEditorProps} />');
    expect(desk).toContain('if (isDraftMode)');
  });

  it('지표 버튼을 누르면 지표 패널이 열린다', () => {
    const { host, unmount } = mount(baseProps());
    const btn = Array.from(host.querySelectorAll('.tool')).find((b) => b.textContent?.includes('지표'));
    act(() => { btn?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(host.querySelector('#fc-p-metrics')?.classList.contains('show')).toBe(true);
    unmount();
  });

  it('지표 패널이 4섹션과 값을 렌더한다', () => {
    const { host, unmount } = mount(baseProps());
    const panel = host.querySelector('#fc-p-metrics') as HTMLElement;
    expect(panel.textContent).toContain('하니스');
    expect(panel.textContent).toContain('95/100');
    expect(panel.textContent).toContain('품질 게이트');
    expect(panel.textContent).toContain('hook_first_300');
    expect(panel.textContent).toContain('매체 투사');
    expect(panel.textContent).toContain('온톨로지');
    expect(panel.textContent).toContain('인물');
    unmount();
  });

  it('episodeForks 가 있으면 갈림길 카드를 렌더하고, 클릭 시 onIntentChange 로 시드가 합쳐진다', async () => {
    const seen: string[] = [];
    const { host, click, unmount } = mount(baseProps({
      intentMemo: '기존 의도',
      onIntentChange: (text: string) => seen.push(text),
      episodeForks: [{
        id: 'fork-open-thread', source: 'open-thread',
        question: '열린 떡밥 중 이번 화의 중심에 둘 것은 무엇인가요?',
        options: [{ label: '떡밥A', intentSeed: '이번 화의 중심 사건은 "떡밥A"다.' }]
      }]
    }));
    const button = host.querySelector('.fc-fork-opt') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(host.textContent).toContain('열린 떡밥');
    await click(button);
    expect(seen.at(-1)).toBe('기존 의도\n이번 화의 중심 사건은 "떡밥A"다.');
    unmount();
  });

  it('episodeForks 가 없으면 갈림길 카드를 렌더하지 않는다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.fc-forks')).toBeNull();
    unmount();
  });

  // VS dogfooding 발견 — VS·갈림길이 기본 닫힌 fc-p-state 패널에 숨어 발견성이 낮다.
  // 회차가 새로 생성되면(chapters 수 증가) 결정 거리가 있을 때 상태 패널을 자동으로 1회 연다(assignAll 선례).
  const forkSample = () => [{
    id: 'fork-open-promise',
    source: 'open-promise' as const,
    question: '이번 화에서 진척시킬 약속은 무엇인가요?',
    options: [{ label: 'A', intentSeed: '이번 화 중심은 A.' }],
  }];
  const ch1 = () => [{ id: 'c1', episode: 1, title: '1화' }];
  const ch2 = () => [{ id: 'c1', episode: 1, title: '1화' }, { id: 'c2', episode: 2, title: '2화' }];

  it('새 회차 생성(chapters 증가) + 갈림길이 있으면 상태 패널을 자동으로 연다', () => {
    const { host, rerender, unmount } = mount(baseProps({ chapters: ch1(), episodeForks: forkSample() }));
    expect(host.querySelector('#fc-p-state')?.className ?? '').not.toContain('show');
    rerender(baseProps({ chapters: ch2(), episodeForks: forkSample() }));
    expect(host.querySelector('#fc-p-state')?.className ?? '').toContain('show');
    unmount();
  });

  it('회차가 늘어도 갈림길/VS 거리가 없으면 자동으로 열지 않는다', () => {
    const { host, rerender, unmount } = mount(baseProps({ chapters: ch1() }));
    rerender(baseProps({ chapters: ch2() }));
    expect(host.querySelector('#fc-p-state')?.className ?? '').not.toContain('show');
    unmount();
  });

  it('회차 수가 그대로면(과거 회차 전환) 갈림길이 있어도 자동으로 열지 않는다', () => {
    const { host, rerender, unmount } = mount(
      baseProps({ chapters: ch2(), currentChapterId: 'c2', episodeForks: forkSample() })
    );
    rerender(baseProps({ chapters: ch2(), currentChapterId: 'c1', episodeForks: forkSample() }));
    expect(host.querySelector('#fc-p-state')?.className ?? '').not.toContain('show');
    unmount();
  });

  it('매체 슬라이더가 onMediaAxisChange 를 호출한다', () => {
    const onMediaAxisChange = vi.fn();
    const { host, unmount } = mount(baseProps({ onMediaAxisChange }));
    const slider = host.querySelector('#fc-p-metrics .fc-axis-input') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '80');
    act(() => { slider.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(onMediaAxisChange).toHaveBeenCalledWith(0.8);
    unmount();
  });

  it('paceQuestions 가 있으면 fc-pace 카드를 렌더한다', () => {
    const { host, unmount } = mount(baseProps({
      paceQuestions: [
        {
          id: 'premise-ridge',
          question: '전제(중심 질문)가 어디까지 왔나요?',
          options: [
            { label: '초입', intentSeed: '전제는 아직 초입이다 — 이번 화는 토대를 쌓고 큰 reveal 은 아낀다.' },
            { label: '중턱', intentSeed: '전제는 중턱이다 — 이번 화는 한 단계 전진하되 마지막 답은 남겨 둔다.' },
            { label: '정상 직전', intentSeed: '전제가 정상 직전이다 — 이번 화는 결정적 전환을 향해 조여 간다.' },
          ],
        },
      ],
    }));
    expect(host.querySelector('.fc-pace')).not.toBeNull();
    expect(host.textContent).toContain('전제(중심 질문)가 어디까지 왔나요?');
    expect(host.querySelectorAll('.fc-pace-opt').length).toBe(3);
    unmount();
  });

  it('paceQuestions 가 없으면 fc-pace 카드를 렌더하지 않는다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.fc-pace')).toBeNull();
    unmount();
  });

  it('fc-pace 옵션 클릭 시 onIntentChange 가 시드를 포함해 호출된다', async () => {
    const seed1 = '전제는 아직 초입이다 — 이번 화는 토대를 쌓고 큰 reveal 은 아낀다.';
    const seed2 = '전제는 중턱이다 — 이번 화는 한 단계 전진하되 마지막 답은 남겨 둔다.';
    const seen: string[] = [];
    const { host, click, unmount } = mount(baseProps({
      intentMemo: '기존 의도',
      onIntentChange: (text: string) => seen.push(text),
      paceQuestions: [
        {
          id: 'premise-ridge',
          question: '전제(중심 질문)가 어디까지 왔나요?',
          options: [
            { label: '초입', intentSeed: seed1 },
            { label: '중턱', intentSeed: seed2 },
          ],
        },
      ],
    }));
    const buttons = host.querySelectorAll('.fc-pace-opt');
    await click(buttons[0]);
    expect(seen.at(-1)).toBe(`기존 의도\n${seed1}`);
    unmount();
  });

  // P12 — canonSuspect 옵션은 "캐논 확인" 배지를 보여 작가가 기확정 사실과의 모순을 인지하게 한다.
  it('canonSuspect 갈림길 옵션에 캐논 확인 배지를 렌더한다', () => {
    const { host, unmount } = mount(baseProps({
      episodeForks: [
        {
          id: 'fork-open-promise', source: 'open-promise',
          question: '열린 약속 중 이번 화에서 진척시킬 것은 무엇인가요?',
          options: [
            { label: '숨긴 진실을 말하는가?', intentSeed: '시드A', canonSuspect: true },
            { label: '합류 시점', intentSeed: '시드B' },
          ],
        },
      ],
    }));
    const opts = host.querySelectorAll('.fc-fork-opt');
    expect(opts.length).toBe(2);
    expect(opts[0].classList.contains('is-canon-suspect')).toBe(true);
    expect(opts[0].textContent).toContain('캐논 확인');
    expect(opts[1].classList.contains('is-canon-suspect')).toBe(false);
    expect(opts[1].textContent).not.toContain('캐논 확인');
    unmount();
  });

  // 쇼러너에게 묻기 버튼 — paceQuestions + onAskShowrunnerPace 가 있을 때만 렌더.
  it('onAskShowrunnerPace 가 있으면 fc-pace-ask 버튼을 렌더하고 클릭 시 콜백을 호출한다', async () => {
    const onAskShowrunnerPace = vi.fn();
    const { host, click, unmount } = mount(baseProps({
      onAskShowrunnerPace,
      paceQuestions: [
        { id: 'q1', question: '전제는?', options: [{ label: '중턱', intentSeed: '전제는 중턱' }] },
      ],
    }));
    const btn = host.querySelector('.fc-pace-ask') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('쇼러너에게 묻기');
    await click(btn);
    expect(onAskShowrunnerPace).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('onAskShowrunnerPace 가 없으면 fc-pace-ask 버튼을 렌더하지 않는다', () => {
    const { host, unmount } = mount(baseProps({
      paceQuestions: [
        { id: 'q1', question: '전제는?', options: [{ label: '중턱', intentSeed: '전제는 중턱' }] },
      ],
    }));
    expect(host.querySelector('.fc-pace-ask')).toBeNull();
    unmount();
  });

  it('isPaceInterviewLoading 이면 fc-pace-ask 버튼이 disabled 이고 라벨이 바뀐다', () => {
    const { host, unmount } = mount(baseProps({
      onAskShowrunnerPace: vi.fn(),
      isPaceInterviewLoading: true,
      paceQuestions: [
        { id: 'q1', question: '전제는?', options: [{ label: '중턱', intentSeed: '전제는 중턱' }] },
      ],
    }));
    const btn = host.querySelector('.fc-pace-ask') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('쇼러너가 진도를 읽는 중');
    unmount();
  });

  it('paceInterviewNote 가 있으면 fc-pace-note 를 렌더한다', () => {
    const { host, unmount } = mount(baseProps({
      paceInterviewNote: '페이스 인터뷰에 실패했습니다.',
      paceQuestions: [
        { id: 'q1', question: '전제는?', options: [{ label: '중턱', intentSeed: '전제는 중턱' }] },
      ],
    }));
    const note = host.querySelector('.fc-pace-note');
    expect(note).not.toBeNull();
    expect(note?.textContent).toBe('페이스 인터뷰에 실패했습니다.');
    unmount();
  });

  // P7 후속(2026-06-10 3차 라이브) — strip 이 state 에만 반영되고 uncontrolled textarea DOM 에는
  // 남아, 다음 클릭이 stale 메모에서 재합성되던 갭. bodyVersion 과 같은 버전 키로 재시드한다.
  it('intentVersion 이 증가하면 의도 메모 textarea 가 새 intentMemo 로 재시드된다', () => {
    const memoTextarea = (host: HTMLElement) => host.querySelector('textarea') as HTMLTextAreaElement;
    const { host, rerender, unmount } = mount(
      baseProps({ intentMemo: '시드 줄\n자필 줄', intentVersion: 0 })
    );
    expect(memoTextarea(host).value).toBe('시드 줄\n자필 줄');
    // 버전 동일 — uncontrolled 라 prop 변경만으로는 미반영 (기존 동작 보존)
    rerender(baseProps({ intentMemo: '자필 줄', intentVersion: 0 }));
    expect(memoTextarea(host).value).toBe('시드 줄\n자필 줄');
    // 버전 증가 — strip 결과로 재시드
    rerender(baseProps({ intentMemo: '자필 줄', intentVersion: 1 }));
    expect(memoTextarea(host).value).toBe('자필 줄');
    unmount();
  });
});

describe('FloatingEditor 회차 선택기 (#4)', () => {
  const threeChapters = [
    { id: 'c1', episode: 1, title: '첫 회차' },
    { id: 'c2', episode: 2, title: '둘째 회차' },
    { id: 'c3', episode: 3, title: '셋째 회차' },
  ];

  it('회차 2개 이상 + onSelectChapter 면 회차 선택기를 렌더한다', () => {
    const { host, unmount } = mount(
      baseProps({ chapters: threeChapters, currentChapterId: 'c2', onSelectChapter: vi.fn() })
    );
    expect(host.querySelector('.ep-chapter-nav')).not.toBeNull();
    expect(host.querySelectorAll('.ep-chapter-select option').length).toBe(3);
    unmount();
  });

  it('select 변경 시 onSelectChapter 를 그 회차 id 로 호출한다', () => {
    const onSelectChapter = vi.fn();
    const { host, unmount } = mount(
      baseProps({ chapters: threeChapters, currentChapterId: 'c2', onSelectChapter })
    );
    const select = host.querySelector('.ep-chapter-select') as HTMLSelectElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
    nativeSetter.call(select, 'c3');
    act(() => { select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(onSelectChapter).toHaveBeenCalledWith('c3');
    unmount();
  });

  it('prev/next 는 첫·마지막 회차에서 비활성이고 인접 회차로 이동한다', () => {
    const onSelectChapter = vi.fn();
    const { host, click, unmount } = mount(
      baseProps({ chapters: threeChapters, currentChapterId: 'c1', onSelectChapter })
    );
    const steps = host.querySelectorAll('.ep-chapter-step');
    expect((steps[0] as HTMLButtonElement).disabled).toBe(true);  // 첫 회차 — 이전 비활성
    expect((steps[1] as HTMLButtonElement).disabled).toBe(false); // 다음 활성
    click(steps[1]);
    expect(onSelectChapter).toHaveBeenCalledWith('c2');
    unmount();
  });

  it('단편 등 isSerial 무관 — 회차 1개 이하면 회차 선택기를 렌더하지 않는다', () => {
    const { host, unmount } = mount(
      baseProps({ chapters: [threeChapters[0]], currentChapterId: 'c1', onSelectChapter: vi.fn() })
    );
    expect(host.querySelector('.ep-chapter-nav')).toBeNull();
    unmount();
  });

  it('StoryXDesk 가 floatingEditorProps 에 회차 선택기 데이터를 전달한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    expect(desk).toContain('onSelectChapter:');
    expect(desk).toContain('currentChapterId: latestChapter?.id');
  });
});

describe('FloatingEditor 잠긴 회차 보호 (#5)', () => {
  it('isLocked 면 본문이 읽기 전용(contentEditable=false)이고 잠김 안내를 렌더한다', () => {
    const { host, unmount } = mount(baseProps({ isLocked: true }));
    expect(host.querySelector('.ms')?.getAttribute('contenteditable')).toBe('false');
    expect(host.querySelector('.ep-locked-banner')).not.toBeNull();
    unmount();
  });

  it('isLocked + onUnlock 이면 잠금 해제 버튼이 onUnlock 을 호출한다', () => {
    const onUnlock = vi.fn();
    const { host, click, unmount } = mount(baseProps({ isLocked: true, onUnlock }));
    const btn = host.querySelector('.ep-unlock-btn');
    expect(btn).not.toBeNull();
    click(btn);
    expect(onUnlock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('잠기지 않으면 잠김 안내·해제 버튼을 렌더하지 않고 본문은 편집 가능하다', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.ep-locked-banner')).toBeNull();
    expect(host.querySelector('.ep-unlock-btn')).toBeNull();
    expect(host.querySelector('.ms')?.getAttribute('contenteditable')).toBe('true');
    unmount();
  });

  it('StoryXDesk 가 잠긴 회차를 읽기전용으로 게이트하고 unlockChapter 를 배선한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    expect(desk).toContain('editable: !isLatestLocked');
    expect(desk).toContain('unlockChapter');
  });
});

describe('FloatingEditor VS 전개 후보 (C-1 Task8)', () => {
  it('[VS] onRequestVsCandidates 가 있으면 전개 후보 버튼을 렌더한다', () => {
    const { host, unmount } = mount(baseProps({ onRequestVsCandidates: () => {}, onIntentChange: () => {} }));
    expect(host.textContent).toContain('전개 후보 받기');
    unmount();
  });

  it('[VS] vsCandidates 를 rarity 라벨과 함께 렌더한다', () => {
    const { host, unmount } = mount(baseProps({
      onRequestVsCandidates: () => {},
      onIntentChange: () => {},
      vsCandidates: [{ direction: '배신한다', probability: 0.1, rarity: 'radical' }],
    }));
    expect(host.textContent).toContain('배신한다');
    expect(host.textContent).toContain('파격');
    unmount();
  });

  it('[VS] onRequestVsCandidates 미주입이면 블록 미렌더', () => {
    const { host, unmount } = mount(baseProps({ onIntentChange: () => {} }));
    expect(host.textContent).not.toContain('전개 후보 받기');
    unmount();
  });

  it('[다음회차] canConfirmLock 이면 회차 확정 버튼을 렌더하고 클릭 시 onConfirmLock 을 호출한다', () => {
    const onConfirmLock = vi.fn();
    const { host, click, unmount } = mount(
      baseProps({ canConfirmLock: true, onConfirmLock, lockLabel: '이 회차 확정' })
    );
    const btn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('이 회차 확정')
    );
    expect(btn).toBeTruthy();
    click(btn ?? null);
    expect(onConfirmLock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('[다음회차] canConfirmLock 이 아니면 회차 확정 버튼을 렌더하지 않는다', () => {
    const { host, unmount } = mount(baseProps({ canConfirmLock: false, lockLabel: '이 회차 확정' }));
    const btn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('이 회차 확정')
    );
    expect(btn).toBeFalsy();
    unmount();
  });

  it('[B1] leakBlock 이 있으면 누수 차단 배너를 evidence 와 함께 렌더한다', () => {
    const { host, unmount } = mount(
      baseProps({
        leakBlock: {
          promptLeaks: [{ kind: 'llm-meta', evidence: '물론입니다', index: 0 }],
          clicheFlags: [],
          blocked: true,
        },
      })
    );
    expect(host.querySelector('.ep-leak-banner')).toBeTruthy();
    expect(host.textContent).toContain('물론입니다');
    unmount();
  });

  it('[B1] leakBlock 이 없으면 누수 배너 미렌더', () => {
    const { host, unmount } = mount(baseProps());
    expect(host.querySelector('.ep-leak-banner')).toBeFalsy();
    unmount();
  });

  it('[B1] StoryXDesk confirmChapterLock 이 inspectLeak 으로 누수를 차단하고 leakBlock 을 배선한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    const start = desk.indexOf('function confirmChapterLock');
    expect(start).toBeGreaterThan(-1);
    const window = desk.slice(start, start + 700);
    expect(window).toContain('inspectLeak');
    expect(window).toContain('setLeakBlock');
    expect(desk).toContain('leakBlock');
  });
});

describe('B2 — streak 배지(상시 노출)', () => {
  const RETENTION_ACTIVE = {
    stats: { currentStreak: 5, longestStreak: 9, thisWeekDays: 4, totalDays: 20, lastActiveDay: '2026-06-22', activeToday: true },
    target: { current: 3, planned: 30 },
  };

  it('currentStreak>0 이면 "N일 연속" 배지', () => {
    const { host, unmount } = mount(baseProps({ retention: RETENTION_ACTIVE }));
    const badge = host.querySelector('.ep-streak');
    expect(badge?.textContent).toContain('5');
    expect(badge?.textContent).toContain('연속');
    unmount();
  });

  it('currentStreak=0 이면 시작 유도 문구', () => {
    const { host, unmount } = mount(baseProps({
      retention: {
        stats: { currentStreak: 0, longestStreak: 0, thisWeekDays: 0, totalDays: 0, lastActiveDay: null, activeToday: false },
        target: { current: 0, planned: null },
      },
    }));
    expect(host.querySelector('.ep-streak')?.textContent).toContain('오늘 첫 문장');
    unmount();
  });
});

describe('B2 — 지표 패널 리텐션 섹션', () => {
  it('target N/M화 + 최장연속을 보여준다', () => {
    const { host, unmount } = mount(baseProps({
      retention: {
        stats: { currentStreak: 5, longestStreak: 9, thisWeekDays: 4, totalDays: 20, lastActiveDay: '2026-06-22', activeToday: true },
        target: { current: 12, planned: 30 },
      },
    }));
    const card = host.querySelector('.fc-metric-retention');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('12');
    expect(card?.textContent).toContain('30');
    expect(card?.textContent).toContain('9');
    unmount();
  });
});
