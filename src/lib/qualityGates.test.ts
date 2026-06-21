// M4 청크 E + academic extension · qualityGates TDD 케이스.
// StoryMode 가중치(commercial/literary) 강제/권고 분기 + 에세이/학술 트랙 + finale/serial 조건부.
import { describe, expect, it } from 'vitest';
import { buildProseQualityMetrics, evaluateQualityGates, type GateInput, type StoryMode } from './qualityGates';

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

  it('academic medium exposes advisory gates without blocking empty input', () => {
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

  it('academic citation_integrity fails advisory when orphan or page-missing citation issues exist', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: [
          'Prior work frames the same problem (Ghost, 2022).',
          '"Access changed sharply" (Lee & Chen, 2021).',
          'References',
          'Lee, A., & Chen, B. (2021). Access and welfare. Social Policy Review.'
        ].join('\n')
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const citationGate = report.results.find((r) => r.gate === 'citation_integrity');

    expect(citationGate?.requirement).toBe('advisory');
    expect(citationGate?.passed).toBe(false);
    expect(citationGate?.reason).toContain('2');
    expect(report.blockingPassed).toBe(true);
  });

  it('academic citation_integrity can use an explicit citation issue count', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        citationIssueCount: 1
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const citationGate = report.results.find((r) => r.gate === 'citation_integrity');

    expect(citationGate?.passed).toBe(false);
    expect(citationGate?.reason).toContain('1');
  });

  it('academic counter_argument_present fails advisory for one-sided claims', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: 'This paper argues that neighborhood brokers determine welfare access.'
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const counterGate = report.results.find((r) => r.gate === 'counter_argument_present');

    expect(counterGate?.requirement).toBe('advisory');
    expect(counterGate?.passed).toBe(false);
    expect(counterGate?.reason).toContain('반론');
    expect(report.blockingPassed).toBe(true);
  });

  it('academic counter_argument_present passes when an alternative hypothesis is acknowledged', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: [
          'This study finds that neighborhood brokers determine welfare access.',
          'An alternative explanation is that municipal capacity explains the same pattern.'
        ].join(' ')
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const counterGate = report.results.find((r) => r.gate === 'counter_argument_present');

    expect(counterGate?.passed).toBe(true);
  });

  it('academic research_ethics_disclosure fails advisory when participant protections are missing', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: 'We interviewed 20 participants about welfare access and coded the survey responses.'
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const ethicsGate = report.results.find((r) => r.gate === 'research_ethics_disclosure');

    expect(ethicsGate?.requirement).toBe('advisory');
    expect(ethicsGate?.passed).toBe(false);
    expect(ethicsGate?.reason).toContain('연구 윤리');
    expect(report.blockingPassed).toBe(true);
  });

  it('academic research_ethics_disclosure passes when consent and anonymity are declared', () => {
    const report = evaluateQualityGates(
      {
        ...fullyPassingInput,
        medium: 'academic',
        text: [
          'We interviewed 20 participants about welfare access.',
          'Participants gave informed consent, and all responses were anonymized under IRB approved protocol.'
        ].join(' ')
      },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const ethicsGate = report.results.find((r) => r.gate === 'research_ethics_disclosure');

    expect(ethicsGate?.passed).toBe(true);
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

  it('strong prose produces different gate results than weak prose', () => {
    const strongProse = [
      '1932년 겨울, 종로의 전차가 갑자기 멈췄다. 유하는 약봉지를 품에 넣고 골목으로 뛰었다.',
      '"네가 가져갔니?" 순사가 물었다. 유하는 대답하지 않고 성문 아래로 몸을 숨겼다.',
      '그녀는 죄책감 때문에 약봉지를 폈다. 누군가를 살리려면 다른 가족의 약봉지를 희생해야 했다.',
      '그녀는 그 선택의 무게를 후회했다. 조선의 낡은 성문과 시장의 먼지가 같은 이름을 반복했다.'
    ].join('\n\n');
    const weakProse = [
      '이 이야기는 핵심적으로 중요한 인물의 효과적인 성장과 지속가능한 서사 구조를 제공합니다.',
      '인물은 여러 요소와 과정 속에서 다양한 측면을 경험하며, 결론적으로, 이것은, 중요한 의미가 있습니다.',
      '이 사건은 그에 의해 해결되어진다.',
      '작품은 좋은 의미를 가지며 앞으로도 흥미로운 방식으로 전개됩니다.'
    ].join('\n\n');

    const strong = buildProseQualityMetrics(strongProse);
    const weak = buildProseQualityMetrics(weakProse);

    expect(strong.voiceMatchScore).toBeGreaterThan(weak.voiceMatchScore);
    expect(strong.sceneSequelRatio).not.toBe(weak.sceneSequelRatio);
    expect(strong.historicalDensity).toBeGreaterThan(weak.historicalDensity);

    const strongReport = evaluateQualityGates(
      {
        text: strongProse,
        medium: 'novel',
        isSerial: false,
        pressureTriangleActive: true,
        ...strong
      },
      balancedMode
    );
    const weakReport = evaluateQualityGates(
      {
        text: weakProse,
        medium: 'novel',
        isSerial: false,
        pressureTriangleActive: true,
        ...weak
      },
      balancedMode
    );

    expect(strongReport.blockingPassed).toBe(true);
    expect(weakReport.blockingPassed).toBe(false);
    expect(weakReport.results.find((result) => result.gate === 'gate_voice_match_70')?.passed).toBe(false);
  });

  it('skips text-unmeasurable literary gates instead of passing fake defaults', () => {
    const metrics = buildProseQualityMetrics('문이 열렸다.');
    const report = evaluateQualityGates(
      {
        text: '문이 열렸다.',
        medium: 'novel',
        isSerial: false,
        isFinale: true,
        pressureTriangleActive: true,
        ...metrics
      },
      balancedMode
    );

    expect(report.results.find((result) => result.gate === 'gate_ambiguity_at_finale')).toBeUndefined();
    expect(report.results.find((result) => result.gate === 'gate_motif_variation')).toBeUndefined();
    expect(report.skipped.map((result) => result.gate)).toEqual(
      expect.arrayContaining(['gate_ambiguity_at_finale', 'gate_motif_variation'])
    );
    expect(report.skipped.every((result) => result.measured === false)).toBe(true);
  });

  it('splits CRLF double-newline bodies into exact paragraphs for scene balance', () => {
    const crlfBody = [
      '문이 갑자기 열렸다. 유하는 약봉지를 품고 골목으로 뛰었다.',
      '그녀는 마음속으로 어제의 이름을 떠올렸다.',
      '"멈춰." 순사가 물었다. 유하는 성문 아래로 몸을 숨겼다.',
      '그녀는 후회했다. 선택의 무게가 손끝에 남았다.'
    ].join('\r\n\r\n');

    const metrics = buildProseQualityMetrics(crlfBody);

    expect(metrics.sceneSequelRatio).toBe(0.5);
  });

  it('skips scene/sequel balance for an empty body instead of passing a fake default', () => {
    const metrics = buildProseQualityMetrics('   \n\n   ');
    const report = evaluateQualityGates(
      {
        text: '',
        medium: 'novel',
        isSerial: false,
        pressureTriangleActive: true,
        ...metrics
      },
      balancedMode
    );

    expect(metrics.metricMeasurements?.sceneSequelRatio).toBe(false);
    expect(report.skipped.map((result) => result.gate)).toContain('gate_scene_sequel_balance');
    expect(report.results.find((result) => result.gate === 'gate_scene_sequel_balance')).toBeUndefined();
  });

  it('scores a multi-paragraph historical body above the literary density threshold', () => {
    const historicalBody = [
      '1932년 겨울, 조선의 성문 옆 전차가 멈췄다.',
      '일제 순사는 시장 입구에서 독립 전단과 유물을 뒤졌다.',
      '대한제국의 낡은 문헌을 품은 아이는 궁궐 담장을 지나 달렸다.',
      '해방 전쟁의 소문은 서원 마당과 왕조 족보 사이에서 번졌다.',
      '근대 신문은 식민 통치의 제사 명단을 왕의 이름 아래 숨겼다.',
      '1945년 봄, 시장 사람들은 고려 왕조의 오래된 종을 다시 울렸다.'
    ].join('\n\n');

    const metrics = buildProseQualityMetrics(historicalBody);

    expect(metrics.historicalDensity).toBeGreaterThanOrEqual(50);
  });

  it('keeps a modern non-historical body below the historical density threshold', () => {
    const modernBody = [
      '오늘 회의실의 노트북 화면이 꺼졌다.',
      '팀장은 새 프로젝트 일정을 확인하고 메시지를 보냈다.',
      '주인공은 카페에서 친구와 만나 다음 선택을 이야기했다.',
      '도시는 밝았고 사람들은 버스를 기다렸다.'
    ].join('\n\n');

    const metrics = buildProseQualityMetrics(modernBody);

    expect(metrics.historicalDensity).toBeLessThan(50);
  });

  it('classifies ethical cost words with action as scene, not sequel', () => {
    const metrics = buildProseQualityMetrics('그녀는 죄책감 때문에 멈췄다.');

    expect(metrics.ethicalCostPresent).toBe(true);
    expect(metrics.sceneSequelRatio).toBe(1);
  });

  // gate_prompt_leak (B1) — 프롬프트/지시문 누수는 common 트랙 blocking.
  it('gate_prompt_leak blocks when prompt leak count is positive', () => {
    const report = evaluateQualityGates(
      { ...fullyPassingInput, promptLeakCount: 1 },
      { commercialWeight: 0, literaryWeight: 0 }
    );
    const leakGate = report.results.find((r) => r.gate === 'gate_prompt_leak');
    expect(leakGate?.requirement).toBe('blocking');
    expect(leakGate?.passed).toBe(false);
    expect(report.blockingPassed).toBe(false);
  });

  it('gate_prompt_leak passes for clean prose', () => {
    const report = evaluateQualityGates({ ...fullyPassingInput, promptLeakCount: 0 }, balancedMode);
    const leakGate = report.results.find((r) => r.gate === 'gate_prompt_leak');
    expect(leakGate?.passed).toBe(true);
  });

  it('gate_prompt_leak derives leak count from text when not provided', () => {
    const report = evaluateQualityGates(
      { ...fullyPassingInput, text: '물론입니다, 다음 장면을 작성하겠습니다. 비가 내렸다.' },
      balancedMode
    );
    const leakGate = report.results.find((r) => r.gate === 'gate_prompt_leak');
    expect(leakGate?.passed).toBe(false);
  });
});
