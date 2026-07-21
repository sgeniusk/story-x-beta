import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleSitesRequest } from '../sites/worker';

function request(path: string, init?: RequestInit): Request {
  return new Request(`https://story-x.example${path}`, init);
}

describe('Story X Sites worker', () => {
  it('/api와 /api/**를 asset binding 전에 구조화 503으로 차단한다', async () => {
    const fetchAsset = vi.fn<(request: Request) => Promise<Response>>();

    for (const path of ['/api', '/api/draft']) {
      const response = await handleSitesRequest(
        request(path, { method: 'POST', body: 'private manuscript' }),
        { ASSETS: { fetch: fetchAsset } }
      );

      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        status: 'failed',
        code: 'local_runtime_required'
      });
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }

    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it('정상 정적 asset 응답을 그대로 반환한다', async () => {
    const assetResponse = new Response('compiled css', {
      status: 200,
      headers: { 'Content-Type': 'text/css' }
    });
    const fetchAsset = vi.fn().mockResolvedValue(assetResponse);

    const response = await handleSitesRequest(request('/assets/index.css'), {
      ASSETS: { fetch: fetchAsset }
    });

    expect(fetchAsset).toHaveBeenCalledTimes(1);
    expect(response).toBe(assetResponse);
  });

  it('GET HTML navigation의 404만 index.html로 되돌린다', async () => {
    const fetchAsset = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockResolvedValueOnce(new Response('missing', { status: 404 }))
      .mockResolvedValueOnce(
        new Response('<!doctype html><main>Story X</main>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      );

    const response = await handleSitesRequest(
      request('/?stage=projects', { headers: { Accept: 'text/html' } }),
      { ASSETS: { fetch: fetchAsset } }
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Story X');
    expect(fetchAsset).toHaveBeenCalledTimes(2);
    const fallbackRequest = fetchAsset.mock.calls[1][0];
    expect(new URL(fallbackRequest.url).pathname).toBe('/index.html');
  });

  it('HEAD HTML navigation도 index.html을 HEAD로 조회한다', async () => {
    const fetchAsset = vi
      .fn<(request: Request) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await handleSitesRequest(
      request('/write', { method: 'HEAD', headers: { Accept: 'text/html' } }),
      { ASSETS: { fetch: fetchAsset } }
    );

    expect(response.status).toBe(200);
    expect(fetchAsset.mock.calls[1][0].method).toBe('HEAD');
    expect(new URL(fetchAsset.mock.calls[1][0].url).pathname).toBe('/index.html');
  });

  it('이미지·JS 등 non-HTML 404는 SPA HTML로 바꾸지 않는다', async () => {
    const missing = new Response('missing asset', { status: 404 });
    const fetchAsset = vi.fn().mockResolvedValue(missing);

    const response = await handleSitesRequest(
      request('/assets/missing.png', { headers: { Accept: 'image/avif,image/webp,*/*' } }),
      { ASSETS: { fetch: fetchAsset } }
    );

    expect(response).toBe(missing);
    expect(fetchAsset).toHaveBeenCalledTimes(1);
  });

  it('POST HTML 404도 navigation fallback으로 바꾸지 않는다', async () => {
    const missing = new Response('missing route', { status: 404 });
    const fetchAsset = vi.fn().mockResolvedValue(missing);

    const response = await handleSitesRequest(
      request('/write', { method: 'POST', headers: { Accept: 'text/html' } }),
      { ASSETS: { fetch: fetchAsset } }
    );

    expect(response).toBe(missing);
    expect(fetchAsset).toHaveBeenCalledTimes(1);
  });
});

describe('Story X Sites build isolation', () => {
  it('client build가 dist 전체의 stale 일반 빌드를 먼저 지운다', () => {
    const config = readFileSync(resolve(__dirname, '../vite.sites.client.config.ts'), 'utf8');

    expect(config).toContain("rmSync(resolve(process.cwd(), 'dist')");
    expect(config).toContain('recursive: true');
    expect(config).toContain('force: true');
  });

  it('Vercel build는 remote API runtime을 명시해 production 기본 fail-closed와 분리한다', () => {
    const config = JSON.parse(
      readFileSync(resolve(__dirname, '../vercel.json'), 'utf8')
    ) as { buildCommand?: string };

    expect(config.buildCommand).toBe(
      'VITE_STORYX_AI_RUNTIME=remote-api npm run build'
    );
  });
});
