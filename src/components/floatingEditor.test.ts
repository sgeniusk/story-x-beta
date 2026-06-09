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
});
