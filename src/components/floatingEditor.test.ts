// 방향 C 플로팅 에디터가 시안 상수가 아니라 props 의 실데이터로 렌더·콜백하는지 검증.
import { describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FloatingEditor, type FloatingEditorProps } from './FloatingEditor';
import { CORE_PERSONAS } from '../lib/extendedPersonas';
import type { MarginReview, Paragraph } from '../lib/marginReview';

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
});
