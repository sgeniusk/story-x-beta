export type UiLocale = 'ko' | 'en';
export type WorkLanguage = 'ko' | 'en' | 'ja';
export type TargetMarket = 'kr' | 'global' | 'us' | 'jp';

export interface LocalizationGlossaryTerm {
  source: string;
  target?: Partial<Record<WorkLanguage, string>>;
  note: string;
  keepOriginal: boolean;
}

export interface LocalizationPolicy {
  uiLocale: UiLocale;
  workLanguage: WorkLanguage;
  targetMarket: TargetMarket;
  honorificPolicy: string;
  namePolicy: string;
  translationPolicy: string;
  glossary: LocalizationGlossaryTerm[];
  voiceByLanguage: Partial<Record<WorkLanguage, string[]>>;
}

export type LocalizationPolicyOverride = Partial<Omit<LocalizationPolicy, 'glossary' | 'voiceByLanguage'>> & {
  glossary?: LocalizationGlossaryTerm[];
  voiceByLanguage?: Partial<Record<WorkLanguage, string[]>>;
};

export type TranslationKey =
  | 'mode.editor'
  | 'mode.bible'
  | 'mode.publishing'
  | 'action.generateDraft'
  | 'action.reviewFlow'
  | 'action.openBible'
  | 'status.synced'
  | 'status.dirty';

const koTranslations: Record<TranslationKey, string> = {
  'mode.editor': '원고',
  'mode.bible': '작품 바이블',
  'mode.publishing': '출간 준비',
  'action.generateDraft': '초안 생성',
  'action.reviewFlow': '흐름 검증',
  'action.openBible': '바이블 열기',
  'status.synced': '저장됨',
  'status.dirty': '수정 중'
};

const translations: Record<UiLocale, Record<TranslationKey, string>> = {
  ko: koTranslations,
  en: {
    'mode.editor': 'Manuscript',
    'mode.bible': 'Story Bible',
    'mode.publishing': 'Publishing',
    'action.generateDraft': 'Generate draft',
    'action.reviewFlow': 'Review flow',
    'action.openBible': 'Open bible',
    'status.synced': 'Saved',
    'status.dirty': 'Editing'
  }
};

const baseGlossary: LocalizationGlossaryTerm[] = [
  {
    source: 'Story X',
    target: {
      ko: 'Story X',
      en: 'Story X',
      ja: 'Story X'
    },
    note: '브랜드명은 UI 언어가 바뀌어도 원문을 유지합니다.',
    keepOriginal: true
  },
  {
    source: 'canon',
    target: {
      ko: '캐논',
      en: 'canon',
      ja: 'カノン'
    },
    note: '승인된 작품 사실을 뜻하는 제품 용어입니다.',
    keepOriginal: false
  }
];

const baseVoiceByLanguage: Partial<Record<WorkLanguage, string[]>> = {
  ko: [
    '번역투 연결어를 줄이고 장면의 감각, 행동, 침묵으로 감정을 전달합니다.',
    '존댓말/반말, 호칭, 문장 종결을 캐릭터별 voice rule과 함께 고정합니다.'
  ],
  en: [
    'Preserve character diction and emotional distance instead of translating Korean sentence order directly.',
    'Keep proper nouns and invented terms aligned with the glossary before drafting.'
  ],
  ja: ['敬体/常体, 呼称, 固有名詞の表記を作品ごとに固定します。']
};

export function createDefaultLocalizationPolicy(overrides: LocalizationPolicyOverride = {}): LocalizationPolicy {
  return {
    uiLocale: overrides.uiLocale ?? 'ko',
    workLanguage: overrides.workLanguage ?? 'ko',
    targetMarket: overrides.targetMarket ?? 'kr',
    honorificPolicy:
      overrides.honorificPolicy ?? '한국어 작품은 존댓말/반말, 호칭, 높임 정도를 캐릭터 voice rule과 함께 고정합니다.',
    namePolicy:
      overrides.namePolicy ?? '인명, 지명, 작품 고유명사는 glossary에 먼저 등록하고 출간 전 표기 흔들림을 검사합니다.',
    translationPolicy:
      overrides.translationPolicy ?? '직역보다 정서와 말투, 장면 기능을 유지합니다. 표면 표현 모방은 금지합니다.',
    glossary: overrides.glossary ?? baseGlossary,
    voiceByLanguage: {
      ...baseVoiceByLanguage,
      ...(overrides.voiceByLanguage ?? {})
    }
  };
}

export function getProjectLocalization(project?: { localization?: LocalizationPolicyOverride | null }): LocalizationPolicy {
  return createDefaultLocalizationPolicy(project?.localization ?? {});
}

export function t(locale: UiLocale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? koTranslations[key] ?? key;
}
