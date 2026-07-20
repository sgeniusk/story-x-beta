import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(`${process.cwd()}/vite.config.ts`, 'utf8');

describe('P0-a local condense job bridge wiring', () => {
  it('registers the POST/GET/DELETE job route with a provider-grace registry deadline', () => {
    expect(source).toContain("localGenerationJobBridge('/api/dive-condense-jobs', buildDiveCondenseArgs, validateDiveCondenseInput)");
    expect(source).toContain('timeoutMs: 600_000');
    expect(source).toContain("req.method === 'DELETE'");
    expect(source).toContain("req.method === 'GET'");
  });

  it('propagates abandoned normal HTTP responses and server shutdown to child cancellation', () => {
    expect(source).toContain("res.on('close', cancelIfAbandoned)");
    expect(source).toContain("server.httpServer?.once('close', dispose)");
  });

  it('새 응결 요청은 정확한 v1 분량 계약을 필수 검증하고 CLI JSON 인자로 전달한다', () => {
    expect(source).toContain('parseEpisodeLengthContract(input.episodeLength)');
    expect(source).toContain("'유효한 episodeLength v1 계약이 필요합니다.'");
    expect(source).toContain("'--length-contract', JSON.stringify(episodeLength)");
    expect(source.match(/const validationWarning = validateInput\?\.\(input\)/g)).toHaveLength(2);
    expect(source).toContain("storyxBridge('/api/dive-condense', buildDiveCondenseArgs, validateDiveCondenseInput)");
  });

  it('직접 API와 잡 등록은 비문자·빈 응결 원문을 400으로 fail-closed한다', () => {
    expect(source).toContain("if (typeof input.transcript !== 'string' || !input.transcript.trim())");
    expect(source).not.toContain("String(input.transcript ?? '').trim()");
    expect(source).toContain("'응결할 PLAY 원문이 필요합니다.'");
    expect(source).toContain("localGenerationJobBridge('/api/dive-condense-jobs', buildDiveCondenseArgs, validateDiveCondenseInput)");
    expect(source).toContain("storyxBridge('/api/dive-condense', buildDiveCondenseArgs, validateDiveCondenseInput)");
  });

  it('두 bridge는 null·배열 JSON body를 Record로 cast하지 않고 빈 요청으로 강등한다', () => {
    expect(source).toContain('function parseJsonRecordBody(body: string): Record<string, unknown>');
    expect(source.match(/parseJsonRecordBody\(body\)/g)).toHaveLength(2);
    expect(source).toContain("typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)");
    expect(source).not.toContain('JSON.parse(body) as Record<string, unknown>');
  });

  it('source가 같아도 다른 회차 목표는 서로 다른 dedupe 입력이다', () => {
    expect(source).toContain('export function createDiveCondenseDedupeKey');
    expect(source).toContain('const dedupeKey = createDiveCondenseDedupeKey(input)');
    expect(source).toContain('projectId: String(input.projectId ?? \'\').trim()');
    expect(source).toContain('episodeLength');
    expect(source).not.toContain('JSON.stringify({ ...input, episodeLength })');
  });
});
