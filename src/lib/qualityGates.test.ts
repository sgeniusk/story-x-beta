// M4 청크 E · qualityGates TDD 케이스.
// 12 게이트 + StoryMode 가중치(commercial/literary) 강제/권고 분기 + 에세이 트랙 + finale/serial 조건부.
import { describe, expect, it } from 'vitest';
import { evaluateQualityGates, type GateInput, type StoryMode } from './qualityGates';

const fullyPassingInput: GateInput = {
  text: '문이 갑자기 열렸다. 그는 무엇이 들어왔는지 보지 못했다. 그가 다음 한 걸음을 어떻게 놓을지 멈췄다?',
  medium: 'novel',
  isSerial: true,
  voiceMatchScore: 85,
  pressureTriangleActive: true,
  sceneSequelRatio: 0.5,
  isFinale: true,
  ambiguityScore: 75,
  ethicalCostPresent: true,
  motifVariations: 3,
  historicalDensity: 70
};

const balancedMode: StoryMode = { commercialWeight: 0.5, literaryWeight: 0.5 };

describe('qualityGates', () => {
  // 1) 모든 입력이 충실하면 blocking 게이트가 모두 통과.
  it('completely strong novel input passes all blocking gates', () => {
    const report = evaluateQualityGates(fullyPassingInput, balancedMode);
    expect(report.blockingPassed).toBe(true);
    expect(report.results.length).toBeGreaterThan(0);
  });

  // 2) commercialWeight ≥ 0.5 면 commercial 게이트가 blocking — 약한 후크는 blocking 실패.
  it('commercialWeight ≥ 0.5 makes commercial gates blocking; weak hook fails', () => {
    const weakHook: GateInput = { ...fullyPassingInput, text: '날이 흐렸다. 평범한 하루였다.' };
    const mode: StoryMode = { commercialWeight: 0.8, literaryWeight: 0.3 };
    const report = evaluateQualityGates(weakHook, mode);
    const hookResult = report.results.find((r) => r.gate === 'gate_hook_first_300');
    expect(hookResult?.requirement).toBe('blocking');
    expect(hookResult?.passed).toBe(false);
    expect(report.blockingPassed).toBe(false);
  });

  // 3) commercialWeight < 0.5 면 commercial 게이트가 advisory — 약한 후크여도 blockingPassed=true 가능.
  it('commercialWeight < 0.5 makes commercial gates advisory; weak hook does not block', () => {
    const weakHook: GateInput = { ...fullyPassingInput, text: '날이 흐렸다.' };
    const mode: StoryMode = { commercialWeight: 0.2, literaryWeight: 0.7 };
    const report = evaluateQualityGates(weakHook, mode);
    const hookResult = report.results.find((r) => r.gate === 'gate_hook_first_300');
    expect(hookResult?.requirement).toBe('advisory');
    // advisory 실패는 blockingPassed 를 흔들지 않는다.
    expect(report.advisoryFailures).toBeGreaterThan(0);
  });

  // 4) literaryWeight ≥ 0.5 면 작품성 게이트가 blocking — finale 모호함 부족 시 차단.
  it('literaryWeight ≥ 0.5 makes literary gates blocking; low finale ambiguity blocks', () => {
    const blunt: GateInput = { ...fullyPassingInput, ambiguityScore: 30 };
    const mode: StoryMode = { commercialWeight: 0.3, literaryWeight: 0.8 };
    const report = evaluateQualityGates(blunt, mode);
    const finale = report.results.find((r) => r.gate === 'gate_ambiguity_at_finale');
    expect(finale?.requirement).toBe('blocking');
    expect(finale?.passed).toBe(false);
    expect(report.blockingPassed).toBe(false);
  });

  // 5) essay 매체는 essay 게이트가 평가되고, gate_disclosure_scope 만 항상 blocking.
  it('essay medium evaluates essay gates; disclosure_scope is always blocking', () => {
    const essay: GateInput = {
      text: '문이 갑자기 열렸다. 마지막 한 줄에 ?',
      medium: 'essay',
      isSerial: false,
      voiceMatchScore: 85,
      pressureTriangleActive: true,
      sceneSequelRatio: 0.5,
      universalLeapPresent: true,
      selfReversalCount: 1,
      disclosureScopeSafe: false
    };
    const report = evaluateQualityGates(essay, balancedMode);
    const disclosure = report.results.find((r) => r.gate === 'gate_disclosure_scope');
    const leap = report.results.find((r) => r.gate === 'gate_universal_leap');
    expect(disclosure?.requirement).toBe('blocking');
    expect(disclosure?.passed).toBe(false);
    expect(leap?.requirement).toBe('advisory'); // 보편 도약은 advisory
    expect(report.blockingPassed).toBe(false);
  });

  // 6) novel 매체에서는 essay 게이트가 평가되지 않는다.
  it('novel medium skips essay-track gates entirely', () => {
    const report = evaluateQualityGates(fullyPassingInput, balancedMode);
    const essayGates = report.results.filter((r) => r.track === 'essay');
    expect(essayGates.length).toBe(0);
  });

  // 7) gate_hook_last_200 은 serial 일 때만 평가.
  it('gate_hook_last_200 is only evaluated when isSerial=true', () => {
    const standalone: GateInput = { ...fullyPassingInput, isSerial: false };
    const report = evaluateQualityGates(standalone, balancedMode);
    expect(report.results.find((r) => r.gate === 'gate_hook_last_200')).toBeUndefined();
  });

  // 8) gate_ambiguity_at_finale 는 isFinale 일 때만 평가.
  it('gate_ambiguity_at_finale is only evaluated when isFinale=true', () => {
    const midSeries: GateInput = { ...fullyPassingInput, isFinale: false };
    const mode: StoryMode = { commercialWeight: 0.3, literaryWeight: 0.8 };
    const report = evaluateQualityGates(midSeries, mode);
    expect(report.results.find((r) => r.gate === 'gate_ambiguity_at_finale')).toBeUndefined();
  });

  // 9) common 트랙은 항상 blocking — 모드와 무관.
  it('common-track gates are always blocking regardless of mode', () => {
    const mode: StoryMode = { commercialWeight: 0, literaryWeight: 0 };
    const report = evaluateQualityGates(fullyPassingInput, mode);
    const commonGates = report.results.filter((r) => r.track === 'common');
    for (const gate of commonGates) {
      expect(gate.requirement).toBe('blocking');
    }
  });

  it('academic medium exposes advisory placeholder gates without blocking empty input', () => {
    const report = evaluateQualityGates({ medium: 'academic' }, balancedMode);
    const academicGates = report.results.filter((r) => r.track === 'academic');

    expect(academicGates.map((r) => r.gate)).toEqual([
      'claim_evidence_mapping',
      'citation_integrity',
      'counter_argument_present',
      'research_ethics_disclosure'
    ]);
    expect(academicGates.every((r) => r.requirement === 'advisory')).toBe(true);
    expect(academicGates.every((r) => r.passed === true)).toBe(true);
    expect(academicGates.filter((r) => r.requirement === 'blocking' && !r.passed)).toEqual([]);
  });

  it('academic claim_evidence_mapping fails advisory when marked claims lack evidence', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: 'We argue that informal leaders determine welfare access.',
        claimEvidenceMapped: false,
        unsupportedClaimCount: 1
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const claimGate = report.results.find((r) => r.gate === 'claim_evidence_mapping');

    expect(claimGate?.requirement).toBe('advisory');
    expect(claimGate?.passed).toBe(false);
    expect(claimGate?.reason).toContain('1');
    expect(report.blockingPassed).toBe(true);
    expect(report.advisoryFailures).toBeGreaterThan(0);
  });

  it('academic claim_evidence_mapping can derive unsupported claims from text', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: 'We argue that informal leaders determine welfare access.'
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const claimGate = report.results.find((r) => r.gate === 'claim_evidence_mapping');

    expect(claimGate?.passed).toBe(false);
    expect(claimGate?.reason).toContain('1');
  });

  it('non-academic media ignore unsupported academic-style claims', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'novel',
        text: 'We argue that informal leaders determine welfare access.',
        claimEvidenceMapped: false,
        unsupportedClaimCount: 1
      },
      balancedMode
    );

    expect(report.results.find((r) => r.gate === 'claim_evidence_mapping')).toBeUndefined();
  });

  it('non-academic media skip academic-track gates entirely', () => {
    const report = evaluateQualityGates({ ...fullyPassingInput, medium: 'essay' }, balancedMode);

    expect(report.results.filter((r) => r.track === 'academic')).toEqual([]);
  });
});
