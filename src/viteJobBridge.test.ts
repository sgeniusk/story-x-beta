import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(`${process.cwd()}/vite.config.ts`, 'utf8');

describe('P0-a local condense job bridge wiring', () => {
  it('registers the POST/GET/DELETE job route and five minute registry', () => {
    expect(source).toContain("localGenerationJobBridge('/api/dive-condense-jobs'");
    expect(source).toContain('timeoutMs: 300_000');
    expect(source).toContain("req.method === 'DELETE'");
    expect(source).toContain("req.method === 'GET'");
  });

  it('propagates abandoned normal HTTP responses and server shutdown to child cancellation', () => {
    expect(source).toContain("res.on('close', cancelIfAbandoned)");
    expect(source).toContain("server.httpServer?.once('close', dispose)");
  });
});
