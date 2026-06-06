import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { STORYX_VERSION, storyxVersionLog } from './version';

const desk = readFileSync(resolve(__dirname, '../StoryXDesk.tsx'), 'utf8');
// rank5 — VersionLogDialog는 components로 추출됨. 정의 단언은 해당 파일에서 검사한다.
const versionLogDialog = readFileSync(resolve(__dirname, '../components/VersionLogDialog.tsx'), 'utf8');
const docs = readFileSync(resolve(__dirname, '../../docs/storyx-version-log.md'), 'utf8');

describe('Story X version log', () => {
  it('publishes the current alpha version as a reusable product constant', () => {
    expect(STORYX_VERSION.label).toBe('Alpha v0.10.0');
    expect(STORYX_VERSION.version).toBe('0.10.0');
    expect(STORYX_VERSION.channel).toBe('alpha');
    expect(STORYX_VERSION.codename).toBe('Quiet Studio');
    expect(STORYX_VERSION.summary).toContain('디자인');
  });

  it('keeps a compact milestone log for every major alpha improvement', () => {
    expect(storyxVersionLog.map((entry) => entry.version)).toEqual([
      '0.10.0',
      '0.9.0',
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
    expect(storyxVersionLog[0].title).toContain('디자인');
    expect(storyxVersionLog[1].title).toContain('루프');
    expect(storyxVersionLog[1].changes.join(' ')).toContain('craft');
    expect(storyxVersionLog[2].title).toContain('LLM');
    expect(storyxVersionLog[3].title).toContain('레이아웃 핫픽스');
  });

  it('exposes the version and changelog in the app shell', () => {
    expect(desk).toContain("import { STORYX_VERSION, storyxVersionLog } from './lib/version'");
    expect(desk).toContain('const [isVersionLogOpen, setIsVersionLogOpen]');
    expect(versionLogDialog).toContain('function VersionLogDialog');
    expect(desk).toContain('변경 로그 보기');
    expect(desk).toContain('version={STORYX_VERSION}');
    expect(desk).toContain('entries={storyxVersionLog}');
  });

  it('documents the current roadmap baseline for future releases', () => {
    expect(docs).toContain('# Story X Version Log');
    expect(docs).toContain('현재 기준 버전: `Alpha v0.10.0`');
    expect(docs).toContain('Quiet Studio');
    expect(docs).toContain('v1.0.0-alpha');
  });
});
