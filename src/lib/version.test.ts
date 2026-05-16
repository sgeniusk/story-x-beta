import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { STORYX_VERSION, storyxVersionLog } from './version';

const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
const docs = readFileSync(resolve(__dirname, '../../docs/storyx-version-log.md'), 'utf8');

describe('Story X version log', () => {
  it('publishes the current alpha version as a reusable product constant', () => {
    expect(STORYX_VERSION.label).toBe('Alpha v0.8.0');
    expect(STORYX_VERSION.version).toBe('0.8.0');
    expect(STORYX_VERSION.channel).toBe('alpha');
    expect(STORYX_VERSION.codename).toBe('Real LLM Writing Loop');
    expect(STORYX_VERSION.summary).toContain('Claude');
  });

  it('keeps a compact milestone log for every major alpha improvement', () => {
    expect(storyxVersionLog.map((entry) => entry.version)).toEqual([
      '0.8.0',
      '0.7.1',
      '0.7.0',
      '0.6.0',
      '0.5.0',
      '0.4.0',
      '0.3.0',
      '0.2.0',
      '0.1.0'
    ]);
    expect(storyxVersionLog[0].title).toContain('LLM');
    expect(storyxVersionLog[0].changes.join(' ')).toContain('Claude');
    expect(storyxVersionLog[1].title).toContain('레이아웃 핫픽스');
    expect(storyxVersionLog[2].title).toContain('명령 팔레트');
    expect(storyxVersionLog[2].changes.join(' ')).toContain('⌘K');
  });

  it('exposes the version and changelog in the app shell', () => {
    expect(desk).toContain("import { STORYX_VERSION, storyxVersionLog } from './lib/version'");
    expect(desk).toContain('const [isVersionLogOpen, setIsVersionLogOpen]');
    expect(desk).toContain('function VersionLogDialog');
    expect(desk).toContain('변경 로그 보기');
    expect(desk).toContain('version={STORYX_VERSION}');
    expect(desk).toContain('entries={storyxVersionLog}');
  });

  it('documents the current roadmap baseline for future releases', () => {
    expect(docs).toContain('# Story X Version Log');
    expect(docs).toContain('현재 기준 버전: `Alpha v0.8.0`');
    expect(docs).toContain('Real LLM Writing Loop');
    expect(docs).toContain('v1.0.0-alpha');
  });
});
