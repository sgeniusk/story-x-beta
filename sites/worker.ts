import { createLocalRuntimeRequiredResponse } from '../src/lib/runtimeCapabilities';

export interface SitesAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface StoryXSitesEnv {
  ASSETS: SitesAssetsBinding;
}

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function isHtmlNavigation(request: Request): boolean {
  return (
    (request.method === 'GET' || request.method === 'HEAD') &&
    (request.headers.get('Accept') ?? '').toLowerCase().includes('text/html')
  );
}

export async function handleSitesRequest(
  request: Request,
  env: StoryXSitesEnv
): Promise<Response> {
  const url = new URL(request.url);
  if (isApiPath(url.pathname)) return createLocalRuntimeRequiredResponse();

  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404 || !isHtmlNavigation(request)) return assetResponse;

  const indexUrl = new URL('/index.html', request.url);
  return env.ASSETS.fetch(
    new Request(indexUrl, {
      method: request.method,
      headers: request.headers
    })
  );
}

export default {
  fetch: handleSitesRequest
};
