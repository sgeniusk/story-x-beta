import { describe, expect, it } from 'vitest';

import { buildCreativeBlueprint } from './projectBlueprint';
import { buildProjectIntakePlan, getFocusedServiceScope } from './projectIntake';

describe('Story X project intake', () => {
  it('asks objective setup questions before a novel project starts', () => {
    const plan = buildProjectIntakePlan(buildCreativeBlueprint({ medium: 'novel', format: 'long-novel' }));

    expect(plan.focusLabel).toBe('소설 연재 세팅');
    expect(plan.notice).toContain('언제든지 바꿀 수 있습니다');
    expect(plan.questions.map((question) => question.agentId)).toEqual(
      expect.arrayContaining(['showrunner', 'character-custodian', 'world-keeper', 'voice-curator'])
    );
    expect(plan.questions[0].options).toHaveLength(3);
    expect(plan.questions[0].options[0].impact).toContain('회차');
  });

  it('drops serial-chapter language for a standalone short novel', () => {
    const plan = buildProjectIntakePlan(buildCreativeBlueprint({ medium: 'novel', format: 'short-novel' }));

    expect(plan.focusLabel).toBe('단편 소설 세팅');
    expect(plan.summary).not.toContain('연재');
    // 단편 인터뷰는 회차·다음 화를 가정하지 않는다
    const firstQuestion = plan.questions[0];
    expect(firstQuestion.question).not.toContain('회차');
    expect(firstQuestion.options.map((option) => `${option.label} ${option.impact}`).join(' ')).not.toContain('회차');
  });

  it('keeps essay intake centered on lived material and voice boundaries', () => {
    const plan = buildProjectIntakePlan(buildCreativeBlueprint({ medium: 'essay', format: 'personal-essay' }));

    expect(plan.focusLabel).toBe('에세이 인터뷰 세팅');
    expect(plan.questions.map((question) => question.agentId)).toContain('essay-interviewer');
    expect(plan.questions.map((question) => question.question).join(' ')).toContain('실제 경험');
    expect(plan.questions.map((question) => question.question).join(' ')).toContain('문체');
  });

  it('limits comics intake to storyboard decisions in the current service focus', () => {
    const plan = buildProjectIntakePlan(buildCreativeBlueprint({ medium: 'comics', format: 'serial-webtoon' }));
    const scope = getFocusedServiceScope();

    expect(plan.focusLabel).toBe('만화 스토리보드 세팅');
    expect(plan.questions.map((question) => question.agentId)).toEqual(
      expect.arrayContaining(['storyboard-agent', 'speech-bubble-agent'])
    );
    expect(plan.notice).toContain('이미지 생성은 후속 단계');
    expect(scope.now).toEqual(['소설', '에세이', '만화 스토리보드']);
    expect(scope.later).toContain('완성 이미지 생성');
  });
});
