import { describe, expect, it, vi } from 'vitest';
import {
  LOCAL_RUNTIME_REQUIRED_CODE,
  createStoryXApiFetch,
  defaultStoryXAiRuntime,
  resolveStoryXAiRuntime,
  storyXRuntimeCapabilities
} from './runtimeCapabilities';

describe('Story X AI runtime capability', () => {
  it('명시한 runtime만 허용하고 알 수 없는 값은 disabled로 닫는다', () => {
    expect(resolveStoryXAiRuntime('local-codex', 'remote-api')).toBe('local-codex');
    expect(resolveStoryXAiRuntime('remote-api', 'local-codex')).toBe('remote-api');
    expect(resolveStoryXAiRuntime('disabled', 'local-codex')).toBe('disabled');
    expect(resolveStoryXAiRuntime(undefined, 'local-codex')).toBe('local-codex');
    expect(resolveStoryXAiRuntime('surprise-runtime', 'local-codex')).toBe('disabled');
  });

  it('dev만 local-codex로 열고 API 보장이 없는 production build는 disabled로 닫는다', () => {
    expect(defaultStoryXAiRuntime(true)).toBe('local-codex');
    expect(defaultStoryXAiRuntime(false)).toBe('disabled');
  });

  it('Sites disabled는 core·PLAY·응결 잡을 모두 끈다', () => {
    expect(storyXRuntimeCapabilities('disabled')).toEqual({
      coreAi: false,
      playAi: false,
      condenseJobs: false
    });
  });

  it('local-codex는 세 capability를 모두 열고 remote-api는 서버가 있는 core만 연다', () => {
    expect(storyXRuntimeCapabilities('local-codex')).toEqual({
      coreAi: true,
      playAi: true,
      condenseJobs: true
    });
    expect(storyXRuntimeCapabilities('remote-api')).toEqual({
      coreAi: true,
      playAi: false,
      condenseJobs: false
    });
  });
});

describe('createStoryXApiFetch', () => {
  it('disabled의 same-origin /api 요청은 body를 전송하지 않고 구조화 503을 반환한다', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const guardedFetch = createStoryXApiFetch('disabled', fetcher, 'https://story-x.example');

    const response = await guardedFetch('/api/draft', {
      method: 'POST',
      body: JSON.stringify({ prose: '외부로 나가면 안 되는 원고' })
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: 'failed',
      code: LOCAL_RUNTIME_REQUIRED_CODE
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('local-codex는 기존 fetch에 URL과 init을 그대로 위임한다', async () => {
    const expected = new Response('{"status":"ok"}', { status: 200 });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(expected);
    const localFetch = createStoryXApiFetch('local-codex', fetcher, 'http://127.0.0.1:5175');
    const init: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' } };

    const response = await localFetch('/api/dive-chat', init);

    expect(fetcher).toHaveBeenCalledWith('/api/dive-chat', init);
    expect(response).toBe(expected);
  });

  it('disabled여도 정적 자산과 다른 origin 요청은 fetch에 위임한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok'));
    const guardedFetch = createStoryXApiFetch('disabled', fetcher, 'https://story-x.example');

    await guardedFetch('/assets/index.js');
    await guardedFetch('https://example.com/api/reference');

    expect(fetcher).toHaveBeenNthCalledWith(1, '/assets/index.js', undefined);
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://example.com/api/reference', undefined);
  });
});
