import { describe, expect, it } from 'vitest';
import type { AgentRun } from './storyEngine';
import {
  applyDiff,
  groupAnnotationsByParagraph,
  splitIntoParagraphs,
  toMarginReview,
  type InlineDiff,
  type MarginReview
} from './marginReview';

function run(overrides: Partial<AgentRun>): AgentRun {
  return {
    agentId: 'showrunner',
    title: '쇼러너',
    status: 'pass',
    output: '독자 약속은 선명합니다.',
    evidence: [],
    ...overrides
  };
}

describe('marginReview pure logic', () => {
  it('splits manuscript text into stable paragraph anchors', () => {
    expect(splitIntoParagraphs('첫 문단\n계속\n\n  둘째 문단  \n\n\n셋째')).toEqual([
      { id: 'p1', text: '첫 문단\n계속' },
      { id: 'p2', text: '둘째 문단' },
      { id: 'p3', text: '셋째' }
    ]);
  });

  it('applies inline diff replacements to paragraph text', () => {
    const diff: InlineDiff = { paragraph: 'p1', from: '붉은 달', to: '푸른 달' };

    expect(applyDiff('붉은 달 아래에서 붉은 달을 보았다.', diff)).toBe(
      '푸른 달 아래에서 붉은 달을 보았다.'
    );
  });

  it('groups annotations by paragraph order and marks continuations', () => {
    const reviews: MarginReview[] = [
      {
        persona: 'continuity-editor',
        anchor: 'p2',
        severity: 'block',
        head: '캐논 충돌',
        body: '이전 회차와 모순됩니다.',
        diffs: []
      },
      {
        persona: 'showrunner',
        anchor: 'p1',
        severity: 'note',
        head: '후크 유지',
        body: '첫 문단의 약속은 선명합니다.',
        diffs: []
      },
      {
        persona: 'world-keeper',
        anchor: 'p2',
        severity: 'note',
        head: '비용 확인',
        body: '세계 규칙의 비용이 보입니다.',
        diffs: []
      }
    ];

    expect(
      groupAnnotationsByParagraph(
        [
          { id: 'p1', text: '첫 문단' },
          { id: 'p2', text: '둘째 문단' }
        ],
        reviews
      ).map((item) => [item.anchor, item.persona, item.groupStart, item.groupCont])
    ).toEqual([
      ['p1', 'showrunner', true, false],
      ['p2', 'continuity-editor', true, false],
      ['p2', 'world-keeper', false, true]
    ]);
  });

  it('maps conflicts, canon gaps, and decision requests to block severity', () => {
    const review = toMarginReview(
      run({
        agentId: 'continuity-editor',
        status: 'pass',
        output: '캐논 누락 때문에 결정 요구가 필요합니다.',
        issues: ['이전 회차와 충돌']
      }),
      'p2'
    );

    expect(review).toMatchObject({
      persona: 'continuity-editor',
      anchor: 'p2',
      severity: 'block',
      head: '이전 회차와 충돌',
      body: '캐논 누락 때문에 결정 요구가 필요합니다.'
    });
  });

  it('maps was/is revision suggestions to suggest severity with diffs', () => {
    const review = toMarginReview(
      run({
        status: 'revise',
        output: '문장 수정 제안: was: 붉은 달 / is: 푸른 달'
      }),
      'p1'
    );

    expect(review.severity).toBe('suggest');
    expect(review.diffs).toEqual([{ paragraph: 'p1', from: '붉은 달', to: '푸른 달' }]);
  });

  it('maps ordinary agent observations to note severity', () => {
    const review = toMarginReview(
      run({
        agentId: 'genre-stylist',
        output: '장르 리듬이 안정적이고 후반부 보상이 살아 있습니다.'
      })
    );

    expect(review).toMatchObject({
      persona: 'genre-stylist',
      anchor: 'p1',
      severity: 'note',
      head: '장르 리듬이 안정적이고 후반부 보상이 살아 있습니다.',
      diffs: []
    });
  });
});
