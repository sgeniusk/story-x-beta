import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { downloadTextFileMock } = vi.hoisted(() => ({ downloadTextFileMock: vi.fn() }));

vi.mock('../lib/textFileExport', async () => {
  const actual = await vi.importActual<typeof import('../lib/textFileExport')>('../lib/textFileExport');
  return { ...actual, downloadTextFile: downloadTextFileMock };
});

import { ManuscriptExportActions, type ManuscriptExportActionsProps } from './ManuscriptExportActions';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const baseProps: ManuscriptExportActionsProps = {
  projectTitle: '달의 문서고',
  chapter: { id: 'chapter-2', episode: 2, title: '젖은 문' },
  body: '첫 문장\n\n마지막 문장'
};

function mount(props: ManuscriptExportActionsProps = baseProps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(createElement(ManuscriptExportActions, props)));
  return {
    host,
    render: (next: ManuscriptExportActionsProps) => act(() => root.render(createElement(ManuscriptExportActions, next))),
    click: async (selector: string) => {
      await act(async () => {
        host.querySelector<HTMLButtonElement>(selector)?.click();
        await Promise.resolve();
      });
    },
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    }
  };
}

afterEach(() => {
  downloadTextFileMock.mockReset();
  vi.restoreAllMocks();
});

describe('ManuscriptExportActions', () => {
  it('현재 화면 본문만 클립보드에 복사하고 resolve 뒤 성공을 알린다', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const view = mount();

    await view.click('[data-action="copy-manuscript"]');

    expect(writeText).toHaveBeenCalledWith(baseProps.body);
    expect(view.host.querySelector('[role="status"]')?.textContent).toContain('본문을 복사했습니다');
    view.unmount();
  });

  it('클립보드 거부를 성공으로 가장하지 않고 TXT 대안을 남긴다', async () => {
    const writeText = vi.fn(async () => { throw new Error('permission denied'); });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const view = mount();

    await view.click('[data-action="copy-manuscript"]');

    expect(view.host.querySelector('[role="status"]')?.textContent).toContain('복사하지 못했습니다');
    expect(view.host.textContent).not.toContain('본문을 복사했습니다');
    expect(view.host.querySelector<HTMLButtonElement>('[data-action="download-manuscript"]')?.disabled).toBe(false);
    view.unmount();
  });

  it('복사와 동일한 live 본문·안전 파일명으로 TXT를 내려받는다', async () => {
    const view = mount();

    await view.click('[data-action="download-manuscript"]');

    expect(downloadTextFileMock).toHaveBeenCalledWith(
      baseProps.body,
      'storyx-달의-문서고-2화-젖은-문.txt'
    );
    expect(view.host.querySelector('[role="status"]')?.textContent).toContain('TXT 다운로드를 시작했습니다');
    view.unmount();
  });

  it('TXT 생성이 실패하면 성공으로 가장하지 않는다', async () => {
    downloadTextFileMock.mockImplementationOnce(() => {
      throw new Error('download blocked');
    });
    const view = mount();

    await view.click('[data-action="download-manuscript"]');

    expect(view.host.querySelector('[role="status"]')?.textContent).toContain('TXT를 내려받지 못했습니다');
    expect(view.host.textContent).not.toContain('TXT 다운로드를 시작했습니다');
    view.unmount();
  });

  it('공백 본문은 두 행동을 막고 이유를 설명한다', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const view = mount({ ...baseProps, body: ' \n ' });

    const buttons = [...view.host.querySelectorAll<HTMLButtonElement>('button')];
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(view.host.textContent).toContain('내보낼 본문 없음');
    await view.click('[data-action="copy-manuscript"]');
    expect(writeText).not.toHaveBeenCalled();
    expect(downloadTextFileMock).not.toHaveBeenCalled();
    view.unmount();
  });

  it('회차가 바뀌면 이전 회차의 성공 상태를 지운다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) }
    });
    const view = mount();
    await view.click('[data-action="copy-manuscript"]');
    expect(view.host.querySelector('[role="status"]')).not.toBeNull();

    view.render({ ...baseProps, chapter: { id: 'chapter-1', episode: 1, title: '첫 문' }, body: '다른 본문' });

    expect(view.host.querySelector('[role="status"]')).toBeNull();
    view.unmount();
  });

  it('대기 중인 이전 회차 복사가 끝나도 새 회차에 옛 상태를 표시하지 않는다', async () => {
    let resolveClipboard: (() => void) | undefined;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(() => new Promise<void>((resolve) => {
          resolveClipboard = resolve;
        }))
      }
    });
    const view = mount();

    await view.click('[data-action="copy-manuscript"]');
    view.render({
      ...baseProps,
      chapter: { id: 'chapter-1', episode: 1, title: '첫 문' },
      body: '새 회차 본문'
    });

    await act(async () => {
      resolveClipboard?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(view.host.querySelector('[role="status"]')).toBeNull();
    view.unmount();
  });
});
