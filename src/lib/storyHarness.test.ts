// M4 청크 B · storyHarness TDD 케이스.
// Chunk 2 정본(docs/superpowers/plans/2026-05-12-story-ontology-harness.md) 의 6단계 + 약한 스토리 점수 케이스.
import { describe, expect, it } from 'vitest';
import { runStoryHarness } from './storyHarness';
import { evaluateQualityGates, type GateInput } from './qualityGates';

describe('storyHarness', () => {
  // Chunk 2 / Task 3 — 6 단계 모두 실행, 풍부한 입력은 readyForProduction.
  it('runs diagnosis, premise, ontology, pressure, Korean voice, and projection stages', () => {
    const result = runStoryHarness({
      medium: 'novel',
      formatLabel: '장편',
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '감정 미스터리를 좋아하는 독자',
      constraints: '장기 연재'
    });

    expect(result.stages.map((stage) => stage.id)).toEqual([
      'story-sense',
      'premise-forge',
      'ontology-builder',
      'pressure-test',
      'korean-voice-gate',
      'media-projection'
    ]);
    expect(result.qualityScore).toBeGreaterThanOrEqual(70);
    expect(result.readyForProduction).toBe(true);
    expect(result.ontology.premise.dramaticQuestion).toContain('찾');
  });

  // Chunk 2 / Task 4 — 약한 스토리는 readyForProduction=false, qualityScore < 70.
  it('weak story (no cost, no contradiction) does not reach readyForProduction', () => {
    const result = runStoryHarness({
      medium: 'novel',
      formatLabel: '장편',
      material: '주인공이 카페에 간다',
      storySeed: '',
      characterSeed: '',
      audience: '',
      constraints: ''
    });

    expect(result.readyForProduction).toBe(false);
    expect(result.qualityScore).toBeLessThan(70);
    // 약한 스토리는 repair 가 한 개 이상 누적된다 — 작가에게 다음 행동을 명시.
    const allRepairs = result.stages.flatMap((stage) => stage.requiredRepairs);
    expect(allRepairs.length).toBeGreaterThan(0);
  });

  // Chunk 2 / Task 4 — 모든 입력이 비면 premise-forge 가 block, readyForProduction=false.
  it('completely empty input blocks premise-forge and is not ready', () => {
    const result = runStoryHarness({
      medium: '',
      formatLabel: '',
      material: '',
      storySeed: '',
      characterSeed: '',
      audience: '',
      constraints: ''
    });

    expect(result.readyForProduction).toBe(false);
    const premiseForge = result.stages.find((s) => s.id === 'premise-forge');
    expect(premiseForge?.status).toBe('block');
    expect(premiseForge?.score).toBe(0);
  });

  // 매체 미지정 시 한국어 문체·매체 투영이 warning 으로 떨어지고 점수 일부 감점.
  it('missing medium downgrades korean-voice-gate and media-projection to warning', () => {
    const result = runStoryHarness({
      medium: '',
      formatLabel: '',
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '감정 미스터리',
      constraints: '장편'
    });

    const koreanVoice = result.stages.find((s) => s.id === 'korean-voice-gate');
    const mediaProjection = result.stages.find((s) => s.id === 'media-projection');
    expect(koreanVoice?.status).toBe('warning');
    expect(mediaProjection?.status).toBe('warning');
    expect(koreanVoice?.score).toBeLessThan(koreanVoice?.maxScore ?? 0);
    expect(mediaProjection?.score).toBeLessThan(mediaProjection?.maxScore ?? 0);
  });

  it('weak prose fails blocking gates and readyForProduction=false', () => {
    const weakGateInput: GateInput = {
      text: '이 이야기는 핵심적으로 중요한 인물의 효과적인 성장과 지속가능한 서사 구조를 제공합니다.',
      medium: 'novel',
      isSerial: false,
      voiceMatchScore: 55,
      pressureTriangleActive: true,
      sceneSequelRatio: 0.95,
      ethicalCostPresent: false,
      historicalDensity: 0
    };
    const qualityGatesReport = evaluateQualityGates(weakGateInput, {
      commercialWeight: 0,
      literaryWeight: 0
    });
    const strongHarnessInput = {
      medium: 'novel',
      formatLabel: '장편',
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '감정 미스터리를 좋아하는 독자',
      constraints: '장기 연재'
    };
    const result = runStoryHarness({
      ...strongHarnessInput,
      qualityGatesReport
    });
    const sameStoryWithPassingGates = runStoryHarness({
      ...strongHarnessInput,
      qualityGatesReport: { blockingPassed: true }
    });

    expect(result.qualityScore).toBeGreaterThanOrEqual(70);
    expect(qualityGatesReport.blockingPassed).toBe(false);
    expect(result.readyForProduction).toBe(false);
    expect(sameStoryWithPassingGates.qualityScore).toBe(result.qualityScore);
    expect(sameStoryWithPassingGates.readyForProduction).toBe(true);
  });

  it('requires both additive score and blocking quality gates for production readiness', () => {
    const passingGateInput: GateInput = {
      text: '문이 갑자기 열렸다. 그는 다음 선택 앞에서 멈췄다.',
      medium: 'novel',
      isSerial: false,
      voiceMatchScore: 90,
      pressureTriangleActive: true,
      sceneSequelRatio: 0.5
    };
    const qualityGatesReport = evaluateQualityGates(passingGateInput, {
      commercialWeight: 0,
      literaryWeight: 0
    });
    const result = runStoryHarness({
      medium: 'novel',
      formatLabel: '장편',
      material: '기억을 고치는 필사관이 사라진 오빠를 찾는다',
      storySeed: '탑에 들어갈수록 자신의 이름이 사라진다',
      characterSeed: '서윤: 죄책감 때문에 진실을 확인해야 하는 필사관',
      audience: '감정 미스터리를 좋아하는 독자',
      constraints: '장기 연재',
      qualityGatesReport
    });

    expect(qualityGatesReport.blockingPassed).toBe(true);
    expect(result.readyForProduction).toBe(true);
  });
});
