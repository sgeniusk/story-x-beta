import { describe, expect, it } from 'vitest';
import { evaluateKoreanProse, describeKoreanStyleLevel } from './koreanStyle';

describe('koreanStyle', () => {
  it('treats natural Korean prose as clean', () => {
    const report = evaluateKoreanProse(
      '유하는 문을 밀었다. 종이 한 번 울렸다. 안은 약국처럼 어두웠고 단내가 났다.'
    );
    expect(report.level).toBe('clean');
    expect(report.score).toBe(100);
    expect(report.issues).toHaveLength(0);
    expect(report.sentenceCount).toBe(3);
  });

  it('flags translation-ese and passive overuse', () => {
    const report = evaluateKoreanProse(
      '이 사건은 그에 의해 해결되어진다. 진실은 오랫동안 잊혀진 채로 있었다. 그것은 큰 의미를 가지고 있다.'
    );
    const kinds = report.issues.map((issue) => issue.kind);
    expect(kinds).toContain('passive');
    expect(kinds).toContain('translationese');
    expect(report.score).toBeLessThan(100);
    expect(report.level).not.toBe('clean');
  });

  it('flags AI 상투어 and comma-heavy sentences', () => {
    const report = evaluateKoreanProse(
      '결론적으로, 이것은, 흥미롭고, 다채로우며, 중요한 의미가 있다고 할 수 있다.'
    );
    const kinds = report.issues.map((issue) => issue.kind);
    expect(kinds).toContain('ai-ese');
    expect(kinds).toContain('comma-heavy');
  });

  it('flags abstract emotion words and over-explanation', () => {
    const report = evaluateKoreanProse(
      '그는 너무 슬펐다. 외로웠다. 그제서야 모든 것이 끝났다는 것을 깨달았다. 그것은 그가 떠났기 때문이었다.'
    );
    const kinds = report.issues.map((issue) => issue.kind);
    expect(kinds).toContain('abstract-emotion');
    expect(kinds).toContain('over-explanation');
    expect(report.score).toBeLessThan(100);
  });

  it('returns a perfect score for empty text', () => {
    const report = evaluateKoreanProse('');
    expect(report.score).toBe(100);
    expect(report.level).toBe('clean');
    expect(report.sentenceCount).toBe(0);
    expect(report.issues).toHaveLength(0);
  });

  it('exposes a human label for each style level', () => {
    expect(describeKoreanStyleLevel('clean')).toContain('양호');
    expect(describeKoreanStyleLevel('review')).toContain('점검');
    expect(describeKoreanStyleLevel('rework')).toContain('손질');
  });
});
