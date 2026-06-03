// M4 청크 C · continuityContract TDD 케이스.
// Chunk 2.5 정본의 4A·4B·4C·4D 스켈레톤 + 추가 검증.
import { describe, expect, it } from 'vitest';
import {
  appendGrowthEntry,
  buildContextPack,
  classifyCanonChange,
  createContinuityContract,
  proposeContinuityRepair,
  validateGrowthEntry,
  type GrowthLedger
} from './continuityContract';

describe('continuityContract', () => {
  // 4A — hard canon 차단, living state 원인·대가 통과.
  it('blocks hard canon changes but allows living state changes with cause and cost', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
      livingState: ['서윤은 이안을 아직 믿지 않는다'],
      softSignals: ['탑의 안내인은 오빠를 본 적 있다고 주장한다']
    });

    expect(classifyCanonChange(contract, '서윤은 오빠를 찾고 싶어 하지 않는다').allowed).toBe(false);
    expect(
      classifyCanonChange(contract, '서윤은 이안을 조금 신뢰하기 시작한다', {
        cause: '이안이 자신의 출입권을 포기했다',
        cost: '다음 회차에서 탑에 들어갈 방법이 사라졌다'
      }).allowed
    ).toBe(true);
  });

  it('hard canon 위반은 layer=hard-canon, severity=block, requiredApproval=true', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '서윤은 오빠를 찾고 싶어 하지 않는다');
    expect(result.layer).toBe('hard-canon');
    expect(result.severity).toBe('block');
    expect(result.requiredApproval).toBe(true);
    expect(result.matchedSource).toBe('서윤은 사라진 오빠를 찾고 있다');
  });

  it('living state 변화에 cause·cost 누락 시 차단 + missing 안내', () => {
    const contract = createContinuityContract({
      hardCanon: [],
      livingState: ['서윤은 이안을 아직 믿지 않는다'],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '서윤은 이안을 신뢰하기 시작한다');
    expect(result.allowed).toBe(false);
    expect(result.layer).toBe('living-state');
    expect(result.reason).toContain('cause');
    expect(result.reason).toContain('cost');
  });

  it('soft signal 변화는 자유 — 부정 신호가 달라도 통과', () => {
    const contract = createContinuityContract({
      hardCanon: [],
      livingState: [],
      softSignals: ['탑의 안내인은 오빠를 본 적 있다고 주장한다']
    });
    const result = classifyCanonChange(contract, '탑의 안내인은 오빠를 본 적 없다고 한다');
    expect(result.allowed).toBe(true);
    expect(result.layer).toBe('soft-signal');
  });

  it('기존 contract 와 무관한 새 주장은 layer=unrelated, allowed=true', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '도시의 첫 비는 봄에 내린다');
    expect(result.allowed).toBe(true);
    expect(result.layer).toBe('unrelated');
  });

  it('detects life/death antonym conflicts without a negation marker', () => {
    const contract = createContinuityContract({
      hardCanon: ['도현은 마지막 편지를 남긴 뒤 살아있다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '도현은 마지막 편지 이후 죽었다');

    expect(result.allowed).toBe(false);
    expect(result.layer).toBe('hard-canon');
    expect(result.matchedSource).toBe('도현은 마지막 편지를 남긴 뒤 살아있다');
  });

  it('detects numeric divergence in the same noun context', () => {
    const contract = createContinuityContract({
      hardCanon: ['달의 탑 출입 증표는 3장이다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '달의 탑 출입 증표는 4장이다');

    expect(result.allowed).toBe(false);
    expect(result.layer).toBe('hard-canon');
  });

  it('allows normal story progression without false positives', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다', '달의 탑 하층 기록실 문은 닫혀 있다'],
      livingState: ['서윤은 이안을 아직 믿지 않는다'],
      softSignals: ['안내인은 오빠를 봤다는 소문을 들었다']
    });

    expect(classifyCanonChange(contract, '서윤은 오빠의 새 단서를 발견하고 하층으로 향한다').allowed).toBe(true);
    expect(classifyCanonChange(contract, '이안은 닫힌 문 앞에서 서윤에게 초대장을 건넨다').allowed).toBe(true);
    expect(classifyCanonChange(contract, '안내인은 소문을 더 자세히 전한다').allowed).toBe(true);
  });

  it('does not flag plain-verb presence wording as conflict for unrelated progression', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라졌다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '서윤은 단서를 발견했다');

    expect(result.allowed).toBe(true);
    expect(result.layer).toBe('unrelated');
  });

  it('does not flag opposite states for different entities', () => {
    const contract = createContinuityContract({
      hardCanon: ['도현은 마지막 편지를 남긴 뒤 살아있다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '민재는 폐역 사건 이후 죽었다');

    expect(result.allowed).toBe(true);
    expect(result.layer).toBe('unrelated');
  });

  it('does not flag numeric divergence for different named entities', () => {
    const contract = createContinuityContract({
      hardCanon: ['도현의 출입 증표는 3장이다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '민재의 출입 증표는 4장이다');

    expect(result.allowed).toBe(true);
    expect(result.layer).toBe('unrelated');
  });

  it('recognizes single-syllable proper noun tokens after josa stripping', () => {
    const contract = createContinuityContract({
      hardCanon: ['린은 폐역에서 살아있다'],
      livingState: [],
      softSignals: []
    });

    const result = classifyCanonChange(contract, '린이 폐역에서 죽었다');

    expect(result.allowed).toBe(false);
    expect(result.layer).toBe('hard-canon');
  });

  // 4B — 성장 레저.
  it('validateGrowthEntry — 필수 필드 모두 채워지면 ok=true', () => {
    const result = validateGrowthEntry({
      characterId: 'char-1',
      before: '이안을 의심한다',
      after: '이안을 조금 신뢰한다',
      triggerScene: 'episode-3-beat-4',
      choice: '함께 탑에 올랐다',
      cost: '다음 출입권을 잃었다',
      futureConsequence: '다른 경로를 찾아야 한다'
    });
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('validateGrowthEntry — cost 누락은 잡아낸다', () => {
    const result = validateGrowthEntry({
      characterId: 'char-1',
      before: 'a',
      after: 'b',
      triggerScene: 's',
      choice: 'c',
      cost: '',
      futureConsequence: 'f'
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('cost');
  });

  it('appendGrowthEntry 는 기존 ledger 를 변경하지 않고 새 ledger 를 반환', () => {
    const before: GrowthLedger = { entries: [] };
    const after = appendGrowthEntry(before, {
      characterId: 'char-1',
      before: 'a',
      after: 'b',
      triggerScene: 's',
      choice: 'c',
      cost: 'd',
      futureConsequence: 'f'
    });
    expect(before.entries.length).toBe(0);
    expect(after.entries.length).toBe(1);
  });

  // 4C — 컨텍스트 팩.
  it('buildContextPack 은 lastDeltas 를 최근 3개로 압축한다', () => {
    const pack = buildContextPack({
      storyPromise: '잃은 이름을 찾는 이야기',
      contract: createContinuityContract({
        hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
        livingState: ['서윤은 이안을 아직 믿지 않는다'],
        softSignals: []
      }),
      characterContracts: ['서윤: 죄책감을 직시한다'],
      worldCosts: ['탑에 들어가면 이름이 사라진다'],
      unresolvedThreads: ['오빠의 표식'],
      recentDeltas: ['delta-1', 'delta-2', 'delta-3', 'delta-4', 'delta-5'],
      forbiddenContradictions: ['서윤은 탑을 두려워하지 않는다'],
      koreanVoiceRules: ['번역투 금지', '추상명사 과용 금지']
    });
    expect(pack.storyPromise).toContain('잃은');
    expect(pack.hardCanon.length).toBe(1);
    expect(pack.lastDeltas).toEqual(['delta-3', 'delta-4', 'delta-5']);
    expect(pack.koreanVoiceRules.length).toBe(2);
  });

  // 4D — 리페어 제안.
  it('proposeContinuityRepair — hard canon 위반에 두 가지 제안 (보존 vs 의도적 변경)', () => {
    const contract = createContinuityContract({
      hardCanon: ['서윤은 사라진 오빠를 찾고 있다'],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '서윤은 오빠를 찾고 싶어 하지 않는다');
    const proposals = proposeContinuityRepair(result);
    expect(proposals.length).toBe(2);
    expect(proposals.map((p) => p.kind)).toEqual(['preserve-canon', 'intentional-change']);
    expect(proposals[1].requiresApproval).toBe(true);
  });

  it('proposeContinuityRepair — 허용된 변화에는 제안 없음', () => {
    const contract = createContinuityContract({
      hardCanon: [],
      livingState: [],
      softSignals: []
    });
    const result = classifyCanonChange(contract, '주인공이 카페에 간다');
    expect(proposeContinuityRepair(result)).toEqual([]);
  });
});
