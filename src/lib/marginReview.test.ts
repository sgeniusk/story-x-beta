import { describe, expect, it } from 'vitest';
import type { AgentRun } from './storyEngine';
import {
  applyDiff,
  groupAnnotationsByParagraph,
  replacePendingMarginReview,
  resolveRunReviewAnchor,
  seedPendingMarginReviews,
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

  it('distributes unmatched review anchors across paragraphs by fallback index', () => {
    const paragraphs = splitIntoParagraphs(
      [
        '첫 단락은 주인공의 약속을 세운다.',
        '둘째 단락은 관계의 압력을 키운다.',
        '셋째 단락은 세계 규칙의 비용을 드러낸다.'
      ].join('\n\n')
    );

    const anchors = [
      'showrunner',
      'character-custodian',
      'world-keeper',
      'genre-stylist',
      'continuity-editor'
    ].map((agentId, index) =>
      resolveRunReviewAnchor(
        run({
          agentId,
          output: '요약형 검토라서 원문 첫머리를 직접 인용하지 않습니다.',
          evidence: ['요약 근거']
        }),
        paragraphs,
        index
      )
    );

    expect(anchors).toEqual(['p1', 'p2', 'p3', 'p1', 'p2']);
  });

  it('keeps a matched evidence anchor before fallback distribution', () => {
    const paragraphs = splitIntoParagraphs(
      [
        '첫 단락은 주인공의 약속을 세운다.',
        '둘째 단락은 관계의 압력을 키운다. 오래 묵은 빚이 대화 중에 드러난다.',
        '셋째 단락은 세계 규칙의 비용을 드러낸다.'
      ].join('\n\n')
    );

    const anchor = resolveRunReviewAnchor(
      run({
        output: `이 대목을 보세요: ${paragraphs[1].text.slice(0, 24)}`
      }),
      paragraphs,
      0
    );

    expect(anchor).toBe('p2');
  });

  it('seeds pending placeholders and replaces the resolved persona only', () => {
    const pending = seedPendingMarginReviews(
      ['showrunner', 'world-keeper'],
      [
        { id: 'p1', text: '첫 단락' },
        { id: 'p2', text: '둘째 단락' }
      ]
    );

    expect(pending.map((review) => [review.persona, review.anchor, review.pending])).toEqual([
      ['showrunner', 'p1', true],
      ['world-keeper', 'p2', true]
    ]);

    const merged = replacePendingMarginReview(
      pending,
      toMarginReview(
        run({
          agentId: 'showrunner',
          output: '첫 단락보다 둘째 단락의 약속이 더 선명합니다.'
        }),
        'p2'
      )
    );

    expect(merged.map((review) => [review.persona, review.anchor, review.pending ?? false])).toEqual([
      ['world-keeper', 'p2', true],
      ['showrunner', 'p2', false]
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
