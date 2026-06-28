import { describe, expect, it, vi, afterEach } from 'vitest';
import { requestDiveChat, requestDiveCondense, requestDiveShowrunner } from './diveClient';

afterEach(() => vi.restoreAllMocks());

describe('diveClient', () => {
  it('requestDiveChat는 /api/dive-chat에 POST하고 reply를 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '왔어?' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveChat({ character: 'c', scene: '', context: '', dialogue: '', query: '안녕' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-chat', expect.objectContaining({ method: 'POST' }));
    expect(res.reply).toBe('왔어?');
  });

  it('requestDiveChat는 choices를 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '...', choices: ['문 연다', '기다린다'] })
    }));
    const res = await requestDiveChat({ character: 'c', scene: '', context: '', dialogue: '', query: '응' });
    expect(res.choices).toEqual(['문 연다', '기다린다']);
  });

  it('requestDiveChat는 arc를 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '...', arc: { dramaticQuestion: 'Q', tension: 40, nextBeat: 'B' } })
    }));
    const res = await requestDiveChat({ character: 'c', scene: '', context: '', dialogue: '', query: '응' });
    expect(res.arc).toEqual({ dramaticQuestion: 'Q', tension: 40, nextBeat: 'B' });
  });

  it('requestDiveCondense는 회차 페이로드를 반환', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', title: '1화', prose: '본문', newCanonFacts: [] })
    }));
    const res = await requestDiveCondense({ character: 'c', scene: '', context: '', transcript: '나: 안녕', episode: 1 });
    expect(res.title).toBe('1화');
    expect(res.prose).toBe('본문');
  });

  it('requestDiveShowrunner는 /api/dive-showrunner에 POST하고 reply·sceneUpdate를 반환', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'complete', reply: '뜻대로.', sceneUpdate: '비 오는 도윤네 집 앞' })
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await requestDiveShowrunner({ scene: '도윤네 집 앞', context: '', directive: '비를 내려줘' });
    expect(fetchMock).toHaveBeenCalledWith('/api/dive-showrunner', expect.objectContaining({ method: 'POST' }));
    expect(res.sceneUpdate).toBe('비 오는 도윤네 집 앞');
  });
});
