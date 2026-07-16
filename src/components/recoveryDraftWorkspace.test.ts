import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { PlayRecoveryWorkDraft } from '../lib/playRecovery';
import { RecoveryDraftWorkspace, type RecoveryDraftWorkspaceProps } from './RecoveryDraftWorkspace';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makeDraft = (over: Partial<PlayRecoveryWorkDraft> = {}): PlayRecoveryWorkDraft => ({
  schema: 'storyx/play-recovery-work-draft/v1',
  id: 'recovery-draft-job-1',
  projectId: 'project-1',
  generationId: 'job-1',
  episodeHint: 2,
  title: '',
  body: '',
  source: {
    schema: 'storyx/play-recovery/v1',
    projectId: 'project-1',
    projectTitle: '달의 문서고',
    episode: 2,
    scene: '비 오는 서고',
    transcript: '나: 오늘은 문을 열어 볼게.\n문지기: 아직 이름을 말하지 않았군.',
    capturedAt: '2026-07-16T09:30:00.000Z'
  },
  createdAt: '2026-07-16T09:30:00.000Z',
  updatedAt: '2026-07-16T09:30:00.000Z',
  ...over
});

function mount(over: Partial<RecoveryDraftWorkspaceProps> = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const props: RecoveryDraftWorkspaceProps = {
    draft: makeDraft(),
    onTitleChange: vi.fn(),
    onBodyChange: vi.fn(),
    onCommit: vi.fn(),
    onBack: vi.fn(),
    ...over
  };
  act(() => root.render(createElement(RecoveryDraftWorkspace, props)));
  return {
    host,
    props,
    rerender(next: Partial<RecoveryDraftWorkspaceProps>) {
      Object.assign(props, next);
      act(() => root.render(createElement(RecoveryDraftWorkspace, props)));
    },
    unmount() {
      act(() => root.unmount());
      host.remove();
    }
  };
}

describe('RecoveryDraftWorkspace', () => {
  it('본편 원고지 밖에 복구 작업본 배너를 표시한다', () => {
    const view = mount();
    const banner = view.host.querySelector('[data-recovery-banner]');
    expect(banner?.textContent).toBe('복구 작업본 · 아직 본편 아님');
    expect(banner?.closest('.sheet')).toBeNull();
    expect(view.host.querySelector('.fc-app.fc-recovery')).not.toBeNull();
    view.unmount();
  });

  it('StoryXDesk는 복구 모드에서 일반 회차 선택과 800ms prose 자동 저장을 우회한다', () => {
    const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
    expect(desk).toContain('recoveryWorkDraft?: PlayRecoveryWorkDraft | null');
    expect(desk).toContain('recoveryWorkDraft ? null :');
    expect(desk).toContain('if (recoveryWorkDraft || !latestChapter) return;');
    expect(desk).toContain('if (isDraftMode && recoveryWorkDraft)');
    expect(desk).toContain('<RecoveryDraftWorkspace');
    expect(desk).toContain('flushLatestChapterOnUnmount');
  });

  it('빈 제목과 본문을 controlled 입력으로 열고 PLAY 원문은 별도 참고 패널에만 둔다', () => {
    const onTitleChange = vi.fn();
    const onBodyChange = vi.fn();
    const view = mount({ onTitleChange, onBodyChange });
    const title = view.host.querySelector('[aria-label="복구 작업본 제목"]') as HTMLInputElement;
    const body = view.host.querySelector('[aria-label="복구 작업 본문"]') as HTMLTextAreaElement;
    const source = view.host.querySelector('aside details');

    expect(title.value).toBe('');
    expect(body.value).toBe('');
    expect(body.placeholder).toBe('PLAY 원문을 참고해 첫 문장을 써보세요');
    expect(source?.querySelector('summary')?.textContent).toContain('PLAY 원문 보기');
    expect(source?.textContent).toContain('나: 오늘은 문을 열어 볼게.');
    expect(body.value).not.toContain('나: 오늘은 문을 열어 볼게.');
    expect(Array.from(view.host.querySelectorAll('textarea')).every((field) => !field.value.includes('문지기:'))).toBe(true);

    const titleSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    const bodySetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      titleSetter.call(title, '두 번째 문');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      bodySetter.call(body, '비에 젖은 문고리가 손안에서 천천히 돌아갔다.');
      body.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onTitleChange).toHaveBeenCalledWith('두 번째 문');
    expect(onBodyChange).toHaveBeenCalledWith('비에 젖은 문고리가 손안에서 천천히 돌아갔다.');
    view.unmount();
  });

  it('본문이 비면 회차 저장을 막고 작성 뒤 한 번만 저장을 요청한다', async () => {
    const onCommit = vi.fn();
    const view = mount({ onCommit });
    const emptyCommit = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent === '회차로 저장');
    expect(emptyCommit?.disabled).toBe(true);

    view.rerender({ draft: makeDraft({ body: '문이 열렸다.' }) });
    const commit = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent === '회차로 저장');
    expect(commit?.disabled).toBe(false);
    await act(async () => {
      commit?.click();
      commit?.click();
      await Promise.resolve();
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('본편 반영 영향과 작업본 저장 상태를 설명하고 삭제 없이 본편으로 돌아간다', () => {
    const onBack = vi.fn();
    const view = mount({ saveStatus: 'saving', onBack });
    expect(view.host.textContent).toContain('회차로 저장할 때만 본편 회차와 작품 지표에 반영됩니다.');
    expect(view.host.querySelector('[role="status"]')?.textContent).toContain('작업본 저장 중');

    const back = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent === '본편으로 돌아가기');
    act(() => back?.click());
    expect(onBack).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('작업본 저장 실패를 경고하고 상위 차단 사유가 있으면 회차 저장도 막는다', () => {
    const view = mount({
      draft: makeDraft({ body: '문이 열렸다.' }),
      saveStatus: 'error',
      saveError: '로컬 저장공간을 확인해 주세요.',
      commitDisabled: true
    });
    expect(view.host.querySelector('[role="alert"]')?.textContent).toContain('로컬 저장공간을 확인해 주세요.');
    const commit = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent === '회차로 저장');
    expect(commit?.disabled).toBe(true);
    view.unmount();
  });

  it('제목의 Enter·한글 조합 확정으로 회차를 저장하지 않고 커밋 저널 중에는 입력을 잠근다', () => {
    const onCommit = vi.fn();
    const view = mount({
      draft: makeDraft({
        body: '문이 열렸다.',
        commitIntent: {
          chapterId: 'episode-2', chapterTitle: '두 번째 문', requestedAt: '2026-07-16T10:00:00.000Z'
        }
      }),
      onCommit
    });
    const title = view.host.querySelector('[aria-label="복구 작업본 제목"]') as HTMLInputElement;
    const body = view.host.querySelector('[aria-label="복구 작업 본문"]') as HTMLTextAreaElement;
    expect(title.readOnly).toBe(true);
    expect(body.readOnly).toBe(true);
    expect(view.host.textContent).toContain('저장 마무리');

    act(() => title.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, isComposing: true
    })));
    expect(onCommit).not.toHaveBeenCalled();
    view.unmount();
  });
});
