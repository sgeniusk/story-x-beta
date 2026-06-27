import { describe, expect, it, vi, afterEach } from 'vitest';
import { requestDiveChat, requestDiveCondense } from './diveClient';

afterEach(() => vi.restoreAllMocks());

describe('diveClient', () => {
  it('requestDiveChat는 /api/dive-chat에 POST하고 reply를 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '왔어?' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveChat({ character: 'c', context: '', dialogue: '', query: '안녕' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-chat', expect.objectContaining({ method: 'POST' }));
    expect(res.reply).toBe('왔어?');
  });

  it('requestDiveCondense는 회차 페이로드를 반환', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', title: '1화', prose: '본문', newCanonFacts: [] })
    }));
    const res = await requestDiveCondense({ character: 'c', context: '', transcript: '나: 안녕', episode: 1 });
    expect(res.title).toBe('1화');
    expect(res.prose).toBe('본문');
  });
});
