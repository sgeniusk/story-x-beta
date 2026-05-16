// 생성·편집된 한국어 산문에서 번역투·AI투 패턴을 찾아 문체 점검 결과를 만든다
// 한 번 검사하고 끝나는 게 아니라, 글이 바뀔 때마다 다시 돌려 문체를 지키는 평가 루프의 핵심이다.

export type KoreanStyleIssueKind =
  | 'passive'
  | 'translationese'
  | 'ai-ese'
  | 'comma-heavy'
  | 'abstract-emotion'
  | 'over-explanation';
export type KoreanStyleLevel = 'clean' | 'review' | 'rework';

export interface KoreanStyleIssue {
  kind: KoreanStyleIssueKind;
  label: string;
  count: number;
  hint: string;
  samples: string[];
}

export interface KoreanStyleReport {
  score: number; // 0~100, 높을수록 자연스러운 한국어
  level: KoreanStyleLevel;
  sentenceCount: number;
  issues: KoreanStyleIssue[];
}

interface PatternGroup {
  kind: KoreanStyleIssueKind;
  label: string;
  hint: string;
  weight: number;
  patterns: RegExp[];
}

// 번역투·AI투는 확신이 높아 weight 4. 과잉 설명·추상 감정어는 craft 신호라 weight 3.
const patternGroups: PatternGroup[] = [
  {
    kind: 'passive',
    label: '과잉 피동',
    hint: '"되어지다·보여지다·잊혀지다" 같은 이중 피동을 능동이나 단일 피동으로 바꿉니다.',
    weight: 4,
    patterns: [/되어[진졌지]/g, /보여[진졌]/g, /[쓰읽불]여[진졌]/g, /잊혀[진졌]/g, /지게 된다/g]
  },
  {
    kind: 'translationese',
    label: '번역투',
    hint: '"~에 의해·~을 통해·~에 대한"이 잦으면 한국어다운 주어·동사 구문으로 풉니다.',
    weight: 4,
    patterns: [/에 의해/g, /[을를] 통해/g, /에 대한/g, /에 다름\s?없/g, /가지고 있/g]
  },
  {
    kind: 'ai-ese',
    label: 'AI 상투어',
    hint: '"~라고 할 수 있다·결론적으로·뿐만 아니라" 같은 정리투를 줄이고 장면으로 보여줍니다.',
    weight: 4,
    patterns: [/고 할 수 있다/g, /결론적으로/g, /뿐만 아니라/g, /무엇보다도/g, /중요한 것은/g, /인 것이다/g]
  },
  {
    kind: 'abstract-emotion',
    label: '추상 감정어',
    hint: '"슬펐다·외로웠다"처럼 감정을 직접 말하기보다 사물·동작·감각으로 보여줍니다.',
    weight: 3,
    patterns: [
      /슬펐|슬픔/g,
      /기뻤|기쁨/g,
      /행복(했|하다)/g,
      /외로웠|외로움/g,
      /무서웠|무서움/g,
      /두려웠|두려움/g,
      /그리웠|그리움/g,
      /화가 났|화났/g,
      /불안했/g,
      /쓸쓸했/g,
      /우울했/g,
      /절망(했|적)/g
    ]
  },
  {
    kind: 'over-explanation',
    label: '과잉 설명',
    hint: '"느꼈다·깨달았다·때문이었다"로 의미를 풀어 말하기보다 장면이 스스로 말하게 둡니다.',
    weight: 3,
    patterns: [/느꼈다|느낀다/g, /깨달았|깨닫는/g, /때문이었다/g, /의미했다|뜻이었다/g, /라는 것을 알 수 있었/g]
  }
];

const COMMA_PENALTY = 6;
const COMMA_THRESHOLD = 4;

export function evaluateKoreanProse(text: string): KoreanStyleReport {
  const normalized = typeof text === 'string' ? text : '';
  const sentences = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  const issues: KoreanStyleIssue[] = [];
  let penalty = 0;

  for (const group of patternGroups) {
    const samples: string[] = [];
    let count = 0;
    for (const pattern of group.patterns) {
      const matches = normalized.match(pattern);
      if (matches) {
        count += matches.length;
        for (const match of matches) {
          if (samples.length < 3 && !samples.includes(match)) {
            samples.push(match);
          }
        }
      }
    }
    if (count > 0) {
      penalty += count * group.weight;
      issues.push({ kind: group.kind, label: group.label, count, hint: group.hint, samples });
    }
  }

  const commaHeavySentences = sentences.filter(
    (sentence) => (sentence.match(/,|，/g) ?? []).length >= COMMA_THRESHOLD
  );
  if (commaHeavySentences.length > 0) {
    penalty += commaHeavySentences.length * COMMA_PENALTY;
    issues.push({
      kind: 'comma-heavy',
      label: '쉼표 과다 문장',
      count: commaHeavySentences.length,
      hint: `쉼표가 ${COMMA_THRESHOLD}개 이상인 문장은 끊어 읽기 어렵습니다. 문장을 나눕니다.`,
      samples: commaHeavySentences.slice(0, 2).map((sentence) => sentence.slice(0, 40))
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const level: KoreanStyleLevel = score >= 85 ? 'clean' : score >= 65 ? 'review' : 'rework';

  return { score, level, sentenceCount: sentences.length, issues };
}

export function describeKoreanStyleLevel(level: KoreanStyleLevel): string {
  switch (level) {
    case 'clean':
      return '문체 양호';
    case 'review':
      return '문체 점검 권장';
    default:
      return '문체 손질 필요';
  }
}
