import { describe, expect, it } from 'vitest';

import { createSeedProject, produceNextChapter } from './storyEngine';
import {
  buildMemoryBankWorkbench,
  buildMemoryBankContextPacket,
  buildStoryMemoryBank,
  memoryBankTemplate
} from './memoryBank';

describe('Story X memory bank', () => {
  it('exports a project into separated memory-bank files', () => {
    const project = createSeedProject();
    const bank = buildStoryMemoryBank(project);
    const paths = bank.files.map((file) => file.path);

    expect(bank.root).toBe('memory-bank/storyx/sample-project');
    expect(paths).toContain('memory-bank/storyx/sample-project/manifest.json');
    expect(paths).toContain('memory-bank/storyx/sample-project/story-core.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/context/canon.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/context/timeline.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/context/continuity-ledger.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/context/unresolved-questions.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/characters/seo-yoon.json');
    expect(paths).toContain('memory-bank/storyx/sample-project/world/rules.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/voice/author-voice-bible.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/visual/style-bible.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/audio/narration-bible.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/reviews/failure-log.md');
    expect(paths).toContain('memory-bank/storyx/sample-project/private/raw-sources/.gitkeep');
  });

  it('keeps raw/private files out of syncable memory', () => {
    const bank = buildStoryMemoryBank(createSeedProject());
    const privateFile = bank.files.find((file) => file.path.endsWith('private/raw-sources/.gitkeep'));
    const syncablePaths = bank.files.filter((file) => file.syncPolicy === 'sync').map((file) => file.path);

    expect(privateFile?.syncPolicy).toBe('private-never-sync');
    expect(syncablePaths.some((path) => path.includes('/private/'))).toBe(false);
    expect(bank.syncableFiles.every((file) => file.syncPolicy === 'sync')).toBe(true);
  });

  it('builds a small context packet instead of loading the whole manuscript', () => {
    const seed = createSeedProject();
    const result = produceNextChapter(seed, {
      genre: seed.genre,
      intent: '주인공이 금지된 탑에서 첫 단서를 발견한다',
      pressure: '마지막에는 이안이 숨긴 대가가 드러난다'
    });

    const packet = buildMemoryBankContextPacket(result.updatedProject, 'showrunner');

    expect(packet.agentId).toBe('showrunner');
    expect(packet.includesRawManuscript).toBe(false);
    expect(packet.sections).toEqual(['story-core', 'canon', 'open-threads', 'recent-chapters']);
    expect(packet.memoryAnchors.length).toBeGreaterThan(0);
    expect(packet.content).toContain('Audience Promise');
    expect(packet.content).toContain('Open Threads');
  });

  it('builds an editable memory workbench with records and role packets', () => {
    const project = produceNextChapter(createSeedProject(), {
      genre: 'romance-fantasy',
      intent: '서윤이 탑의 하층 기록실에서 새 표식을 발견한다',
      pressure: '이안이 숨긴 대가가 관계를 흔들기 시작한다'
    }).updatedProject;

    const workbench = buildMemoryBankWorkbench(project);

    expect(workbench.editableRecords.some((record) => record.kind === 'character' && record.title === '한서윤')).toBe(true);
    expect(workbench.editableRecords.some((record) => record.kind === 'world' && record.sourcePath.endsWith('world/rules.md'))).toBe(true);
    expect(workbench.editableRecords.some((record) => record.kind === 'canon' && record.title.includes('EP 1'))).toBe(true);
    expect(workbench.packetSummaries.map((packet) => packet.agentId)).toEqual(
      expect.arrayContaining(['showrunner', 'character-custodian', 'world-keeper', 'voice-curator', 'da-vinci'])
    );
    expect(workbench.packetSummaries.every((packet) => packet.includesRawManuscript === false)).toBe(true);
    expect(workbench.safetyRules).toContain('private/raw-sources는 에이전트 기본 패킷에 넣지 않습니다.');
  });

  it('documents the target folder template', () => {
    expect(memoryBankTemplate).toContain('memory-bank/storyx/{project_id}/');
    expect(memoryBankTemplate).toContain('context/continuity-ledger.md');
    expect(memoryBankTemplate).toContain('private/raw-sources/');
    expect(memoryBankTemplate).toContain('sync 금지');
  });
});
