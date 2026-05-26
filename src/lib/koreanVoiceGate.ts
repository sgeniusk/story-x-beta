// M4 청크 D · Layer 4 일부 — 한국어 문체 게이트.
// 정본 — docs/storyx-harness-architecture.md § 7 청크 D, ontology-harness plan Chunk 3 Task 5.
//
// 책임:
//   1) inspectKoreanVoice(text, signatures?) — 한국어 문장의 AI투·번역투·명사 과다·쉼표 과다·추상 감정어 감지
//   2) VoiceSignature — 작가/캐릭터별 톤 기준 (sentenceLength, forbiddenWords, preferredRegister, preserveTokens)
//   3) 기존 koreanStyle.evaluateKoreanProse 결과를 흡수 — translation-ese / comma-overflow / abstract-emotion 매핑
//
// 1차 컷 휴리스틱 — 정규식 + 토큰 카운트. LLM 기반 정밀화는 청크 F·H 에서.
import { evaluateKoreanProse, type KoreanStyleIssueKind } from './koreanStyle';

export type KoreanVoiceFlag =
  | 'generic-ai-vocabulary'
  | 'noun-heavy-sentence'
  | 'comma-overflow'
  | 'translation-ese'
  | 'abstract-emotion'
  | 'voice-signature-mismatch';

export interface VoiceSignature {
  id: string;
  /** 작가/캐릭터 식별. */
  ownerLabel: string;
  /** 선호 문장 길이. */
  sentenceLength: 'short' | 'medium' | 'long';
  /** 금지 표현 — 작품 안에서 절대 쓰지 않을 단어. */
  forbiddenWords: string[];
  /** 선호 어휘 결 — 1~2 단어 키워드. */
  preferredRegister: string[];
  /** 보존 — 영어 혼합어 등 그대로 둘 토큰. revisedText 에서 제거되지 않는다. */
  preserveTokens: string[];
}

export interface VoiceSignatureMismatch {
  signatureId: string;
  reason: string;
  evidence: string;
}

export interface KoreanVoiceReport {
  flags: KoreanVoiceFlag[];
  signatureMismatches: VoiceSignatureMismatch[];
  /** 1차 컷 정제 — generic AI 어휘를 제거한 텍스트. 진짜 paraphrase 는 LLM 단계에서. */
  revisedText: string;
  /** 0~100 — 100 = 깨끗. flags 1개당 -15, signature mismatch 추가 -5. */
  score: number;
}

// 한국어 톤·구조 점검. 기존 koreanStyle 의 결과를 흡수하고 새 flag(generic-ai-vocabulary, noun-heavy-sentence) 를 추가한다.
export function inspectKoreanVoice(text: string, signatures: VoiceSignature[] = []): KoreanVoiceReport {
  const flags: KoreanVoiceFlag[] = [];

  // 1) koreanStyle 의 결과 흡수.
  const styleReport = evaluateKoreanProse(text);
  for (const issue of styleReport.issues) {
    const mapped = STYLE_TO_FLAG[issue.kind];
    if (mapped && !flags.includes(mapped)) flags.push(mapped);
  }

  // 2) generic AI 어휘.
  if (matchesGenericAiVocab(text)) flags.push('generic-ai-vocabulary');

  // 3) 명사 과다 — '구조'·'시스템'·'요소' 등 추상 명사 후미가 2개 이상.
  if (isNounHeavy(text)) flags.push('noun-heavy-sentence');

  // 4) voice signature 검증.
  const signatureMismatches: VoiceSignatureMismatch[] = [];
  for (const sig of signatures) {
    signatureMismatches.push(...checkVoiceSignature(text, sig));
  }
  if (signatureMismatches.length > 0) flags.push('voice-signature-mismatch');

  // 5) revisedText — generic AI 어휘 제거. preserveTokens 는 살린다.
  const preserved = new Set<string>(signatures.flatMap((sig) => sig.preserveTokens));
  const revisedText = stripGenericAiVocab(text, preserved);

  // 6) score.
  const penalty = flags.length * 15 + signatureMismatches.length * 5;
  const score = Math.max(0, 100 - penalty);

  return { flags, signatureMismatches, revisedText, score };
}

// --- helpers ---

const STYLE_TO_FLAG: Partial<Record<KoreanStyleIssueKind, KoreanVoiceFlag>> = {
  translationese: 'translation-ese',
  'comma-heavy': 'comma-overflow',
  'abstract-emotion': 'abstract-emotion'
};

// AI 가 흔히 쏟는 추상 형용사·과장 어휘. 보수적으로 — 정상 한국어에서도 가끔 쓰이는 표현은 제외.
const GENERIC_AI_WORDS = ['핵심적', '효과적', '지속가능한', '혁신적', '다채로운', '다양한 측면', '중요한 의미'];

function matchesGenericAiVocab(text: string): boolean {
  return GENERIC_AI_WORDS.some((word) => text.includes(word));
}

// 한 텍스트에 추상 명사 후미(구조·시스템·요소·과정·방식·체계·성격·특성·의미·관점) 가 2 이상이면 noun-heavy.
const NOUN_HEAVY_ENDINGS = ['구조', '시스템', '요소', '과정', '방식', '체계', '관점', '특성'];

function isNounHeavy(text: string): boolean {
  let count = 0;
  for (const ending of NOUN_HEAVY_ENDINGS) {
    const matches = text.match(new RegExp(ending, 'g'));
    if (matches) count += matches.length;
  }
  return count >= 2;
}

// generic AI 어휘를 텍스트에서 제거. preserveTokens 는 손대지 않는다.
function stripGenericAiVocab(text: string, preserved: Set<string>): string {
  let result = text;
  for (const word of GENERIC_AI_WORDS) {
    if (preserved.has(word)) continue;
    // 어휘 뒤의 조사·연결어 일부도 함께 제거: "핵심적으로", "효과적인", "지속가능한"
    result = result.replace(new RegExp(`${word}(?:으로|인|한|이고|적|적인)?`, 'g'), '');
  }
  return result.replace(/\s+/g, ' ').trim();
}

// voice signature 검증. forbiddenWords 가 텍스트에 보이면 mismatch.
function checkVoiceSignature(text: string, signature: VoiceSignature): VoiceSignatureMismatch[] {
  const mismatches: VoiceSignatureMismatch[] = [];
  for (const forbidden of signature.forbiddenWords) {
    if (forbidden && text.includes(forbidden)) {
      mismatches.push({
        signatureId: signature.id,
        reason: `금지 표현 발견: "${forbidden}"`,
        evidence: forbidden
      });
    }
  }
  return mismatches;
}

// 기본 작가용 빈 signature — 다른 모듈이 점진적으로 채울 수 있게.
export function createEmptyVoiceSignature(id: string, ownerLabel: string): VoiceSignature {
  return {
    id,
    ownerLabel,
    sentenceLength: 'medium',
    forbiddenWords: [],
    preferredRegister: [],
    preserveTokens: ['harness', 'ontology', 'prompt', 'canon']
  };
}
