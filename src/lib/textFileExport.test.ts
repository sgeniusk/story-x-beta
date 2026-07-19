import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadTextFile,
  safeTextFilenamePart,
  writeTextToClipboard
} from './textFileExport';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('공용 평문 파일 helper', () => {
  it('NFKC 정규화와 기존 PLAY 안전 파일명 규칙을 보존한다', () => {
    expect(safeTextFilenamePart(' 달/문서고:  최종? ')).toBe('달-문서고-최종');
    expect(safeTextFilenamePart('   ')).toBe('untitled');
    expect(safeTextFilenamePart('   ', '제목-없음')).toBe('제목-없음');
  });

  it('표준 Clipboard API가 성공하면 동일 본문을 전달한다', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await expect(writeTextToClipboard('한글\n본문')).resolves.toBeUndefined();

    expect(writeText).toHaveBeenCalledWith('한글\n본문');
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBeNull();
  });

  it('표준 Clipboard API 거부 시 selection 복사로 구제하고 임시 DOM을 정리한다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => { throw new Error('permission denied'); }) }
    });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });

    await expect(writeTextToClipboard('구제 본문')).resolves.toBeUndefined();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBeNull();
  });

  it('표준·selection 복사가 모두 실패하면 성공으로 가장하지 않는다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => { throw new Error('permission denied'); }) }
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) });

    await expect(writeTextToClipboard('실패 본문')).rejects.toThrow('clipboard unavailable');
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBeNull();
  });

  it('UTF-8 text Blob을 클릭하고 anchor·object URL을 항상 정리한다', () => {
    const createObjectURL = vi.fn(() => 'blob:storyx-text');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadTextFile('한글\n본문', 'storyx-원고.txt');

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyx-text');
    expect(document.querySelector('a[download="storyx-원고.txt"]')).toBeNull();
  });

  it('클릭이 실패해도 anchor와 object URL을 정리한 뒤 실패를 전달한다', () => {
    const createObjectURL = vi.fn(() => 'blob:storyx-failed');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('download blocked');
    });

    expect(() => downloadTextFile('본문', 'storyx-failed.txt')).toThrow('download blocked');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyx-failed');
    expect(document.querySelector('a[download="storyx-failed.txt"]')).toBeNull();
  });

  it('anchor 준비가 실패해도 먼저 만든 object URL을 정리한다', () => {
    const createObjectURL = vi.fn(() => 'blob:storyx-prepare-failed');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
      throw new Error('DOM unavailable');
    });

    expect(() => downloadTextFile('본문', 'storyx-failed.txt')).toThrow('DOM unavailable');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyx-prepare-failed');
  });
});
