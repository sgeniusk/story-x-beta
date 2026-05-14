import { describe, expect, it } from 'vitest';

import { createDefaultLocalizationPolicy, getProjectLocalization, t } from './localization';
import { createSeedProject } from './storyEngine';

describe('Story X localization foundation', () => {
  it('separates app UI locale from the language of the creative work', () => {
    const policy = createDefaultLocalizationPolicy({
      uiLocale: 'en',
      workLanguage: 'ko',
      targetMarket: 'global'
    });

    expect(policy.uiLocale).toBe('en');
    expect(policy.workLanguage).toBe('ko');
    expect(policy.targetMarket).toBe('global');
    expect(policy.honorificPolicy).toContain('존댓말');
    expect(policy.translationPolicy).toContain('정서와 말투');
  });

  it('ships a tiny UI dictionary with safe Korean fallback', () => {
    expect(t('ko', 'mode.editor')).toBe('원고');
    expect(t('en', 'mode.editor')).toBe('Manuscript');
    expect(t('en', 'action.generateDraft')).toBe('Generate draft');
    expect(t('ko', 'status.synced')).toBe('저장됨');
  });

  it('keeps seed projects ready for localization-aware agents', () => {
    const project = createSeedProject();
    const localization = getProjectLocalization(project);

    expect(localization.uiLocale).toBe('ko');
    expect(localization.workLanguage).toBe('ko');
    expect(localization.targetMarket).toBe('kr');
    expect(localization.glossary.some((term) => term.source === 'Story X')).toBe(true);
    expect(localization.voiceByLanguage.ko?.length).toBeGreaterThan(0);
  });
});
