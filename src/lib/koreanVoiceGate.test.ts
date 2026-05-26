// M4 청크 D · koreanVoiceGate TDD 케이스.
// ontology-harness plan Chunk 3 Task 5 스켈레톤 + voice signature 검증 + 기존 koreanStyle 결과 흡수 확인.
import { describe, expect, it } from 'vitest';
import { createEmptyVoiceSignature, inspectKoreanVoice } from './koreanVoiceGate';

describe('koreanVoiceGate', () => {
  // Task 5 — generic AI 어휘 + 명사 과다 잡아내기, '인물' 같은 의미 있는 명사 보존, score < 80.
  it('flags stiff AI-like Korean and suggests natural story planning prose', () => {
    const report = inspectKoreanVoice(
      '이 이야기는 핵심적으로 중요한 인물의 효과적인 성장과 지속가능한 서사 구조를 제공합니다. 핵심적 요소와 효과적 과정이 작품의 체계를 만든다.'
    );

    expect(report.flags).toContain('generic-ai-vocabulary');
    expect(report.flags).toContain('noun-heavy-sentence');
    expect(report.revisedText).toContain('인물');
    expect(report.score).toBeLessThan(80);
  });

  it('clean Korean prose 는 flags 가 비어 있고 score=100', () => {
    const report = inspectKoreanVoice('유하는 문을 밀었다. 종이 한 번 울렸다. 안은 약국처럼 어두웠다.');
    expect(report.flags).toEqual([]);
    expect(report.signatureMismatches).toEqual([]);
    expect(report.score).toBe(100);
  });

  it('voice signature 의 forbiddenWords 가 텍스트에 보이면 mismatch + flag', () => {
    const signature = createEmptyVoiceSignature('sig-1', '주인공');
    signature.forbiddenWords = ['솔직히', '결국'];
    const report = inspectKoreanVoice('솔직히 그날은 비가 왔다.', [signature]);

    expect(report.flags).toContain('voice-signature-mismatch');
    expect(report.signatureMismatches.length).toBeGreaterThan(0);
    expect(report.signatureMismatches[0].evidence).toBe('솔직히');
    expect(report.score).toBeLessThan(100);
  });

  it('preserveTokens 는 revisedText 에서 제거되지 않는다 (영어 혼합어 보존)', () => {
    const signature = createEmptyVoiceSignature('sig-1', '저자');
    // 일부러 preserve 목록에 generic AI 단어를 넣어 — 보존이 실제 동작하는지 검증.
    signature.preserveTokens = ['혁신적'];
    const report = inspectKoreanVoice('이 작품은 혁신적 시도다.', [signature]);

    expect(report.revisedText).toContain('혁신적');
  });

  it('translation-ese / comma-overflow / abstract-emotion 은 koreanStyle 결과를 흡수해 flag 로 노출', () => {
    const passive = inspectKoreanVoice('이 사건은 그에 의해 해결되어진다. 진실은 오랫동안 잊혀진 채로 있었다.');
    expect(passive.flags).toContain('translation-ese');

    const commaHeavy = inspectKoreanVoice('결론적으로, 이것은, 흥미롭고, 다채로우며, 중요한 의미가 있다.');
    expect(commaHeavy.flags).toContain('comma-overflow');

    const abstract = inspectKoreanVoice('그는 너무 슬펐다. 외로웠다. 그제서야 모든 것이 끝났다는 것을 깨달았다. 그것은 그가 떠났기 때문이었다.');
    expect(abstract.flags).toContain('abstract-emotion');
  });

  it('createEmptyVoiceSignature 는 기본 preserveTokens(harness/ontology/prompt/canon) 를 포함', () => {
    const sig = createEmptyVoiceSignature('sig-x', '저자');
    expect(sig.preserveTokens).toContain('harness');
    expect(sig.preserveTokens).toContain('ontology');
    expect(sig.preserveTokens).toContain('prompt');
    expect(sig.preserveTokens).toContain('canon');
  });
});
