import { describe, expect, it } from 'vitest';

import { buildOneProjectVerticalSlice } from './verticalSlice';

describe('One Project Vertical Slice', () => {
  it('turns one story core into web novel, four-cut insta-toon, and 30-second audiobook proofs', () => {
    const slice = buildOneProjectVerticalSlice({
      material: '비 오는 정류장에서 매일 같은 우산을 빌려주는 사람',
      storySeed: '마지막에 그 우산이 미래의 내가 남긴 물건임을 알게 된다',
      characterSeed: '하린: 겁이 많지만 사라진 약속을 끝까지 확인하는 사람',
      artDirection: '담담한 흑백선, 우산만 푸른색으로 반복'
    });

    expect(slice.storyContractId).toBe('shared-story-contract');
    expect(slice.memoryRoot).toContain('memory-bank/storyx/');
    expect(slice.artifacts.map((artifact) => artifact.id)).toEqual([
      'web-novel-episode-1',
      'insta-toon-four-cut',
      'audiobook-30s'
    ]);
    expect(slice.artifacts.every((artifact) => artifact.storyContractRef === slice.storyContractId)).toBe(true);
    expect(slice.artifacts.every((artifact) => artifact.memoryRoot === slice.memoryRoot)).toBe(true);
  });

  it('keeps platform proof concrete instead of adding another abstract board', () => {
    const slice = buildOneProjectVerticalSlice();
    const webNovel = slice.artifacts.find((artifact) => artifact.id === 'web-novel-episode-1');
    const instaToon = slice.artifacts.find((artifact) => artifact.id === 'insta-toon-four-cut');
    const audiobook = slice.artifacts.find((artifact) => artifact.id === 'audiobook-30s');

    expect(webNovel?.proof).toContain('첫 300자');
    expect(instaToon?.proof).toContain('4컷');
    expect(instaToon?.evidence).toEqual(expect.arrayContaining(['좌상', '우상', '좌하', '우하']));
    expect(audiobook?.proof).toContain('30초');
    expect(audiobook?.evidence).toEqual(expect.arrayContaining(['문단', '화자', 'pause', 'music cue']));
  });

  it('requires approval before memory sync and records provenance from every medium', () => {
    const slice = buildOneProjectVerticalSlice();

    expect(slice.approvalRequiredBeforeSync).toBe(true);
    expect(slice.evidenceLedger.map((entry) => entry.id)).toEqual([
      'story-contract-approved',
      'web-novel-first-300',
      'insta-toon-panel-purpose',
      'audiobook-first-30s',
      'canon-delta-pending'
    ]);
    expect(slice.provenanceLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'Story X deterministic vertical slice', approvedFor: 'draft-proof' }),
        expect.objectContaining({ medium: 'comics', approvedFor: 'storyboard-only' }),
        expect.objectContaining({ medium: 'audiobook', approvedFor: 'timing-proof-only' })
      ])
    );
    expect(slice.nextActions[0]).toContain('웹소설 1화');
  });

  it('turns each medium proof into pending memory approval candidates', () => {
    const slice = buildOneProjectVerticalSlice();

    expect(slice.memoryCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'vertical-slice-story-contract',
          owner: 'plot',
          status: 'pending',
          sourceAgentId: 'showrunner'
        }),
        expect.objectContaining({
          id: 'vertical-slice-insta-toon',
          owner: 'visual',
          status: 'pending',
          sourceAgentId: 'storyboard-agent'
        }),
        expect.objectContaining({
          id: 'vertical-slice-audiobook',
          owner: 'audio',
          status: 'pending',
          sourceAgentId: 'audio-narration-director'
        })
      ])
    );
    expect(slice.memoryCandidates.every((candidate) => candidate.targetPath.startsWith('reviews/'))).toBe(true);
    expect(slice.memoryCandidates.every((candidate) => candidate.rationale.includes('승인'))).toBe(true);
  });
});
