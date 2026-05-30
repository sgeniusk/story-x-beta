export type EvidenceType = 'data' | 'prior-work' | 'logic' | 'anecdote';

export interface Claim {
  id: string;
  text: string;
  paragraph: string;
  evidenceType: EvidenceType | null;
  hasEvidence: boolean;
}

export interface ClaimLedger {
  claims: Claim[];
  unsupportedClaims: Claim[];
}

interface ParsedParagraph {
  id: string;
  text: string;
  sentences: string[];
}

const CLAIM_MARKERS: RegExp[] = [
  /\bwe\s+(?:argue|claim|contend|find|found|show|demonstrate|conclude)\s+(?:that\s+)?/i,
  /\b(?:this|that)\s+(?:suggests|indicates|demonstrates|shows|reveals|means)\s+(?:that\s+)?/i,
  /\b(?:these|the)\s+(?:findings|results)\s+(?:suggest|indicate|demonstrate|show|reveal)\s+(?:that\s+)?/i,
  /\b(?:this|the)\s+(?:paper|article|study|analysis)\s+(?:argues|claims|contends|finds|shows|demonstrates)\s+(?:that\s+)?/i,
  /\b(?:the\s+)?(?:intervention|evidence|model|analysis)\s+demonstrates?\b/i,
  /\btherefore\b/i,
  /\bthus\b/i,
  /\bhence\b/i,
  /\bconsequently\b/i,
  /라고\s+주장한다/,
  /(?:을|를)\s+시사한다/,
  /따라서/
];

const PRIOR_WORK_MARKERS: RegExp[] = [
  /\([A-Z][A-Za-z-]+(?:\s+et\s+al\.)?,\s*(?:19|20)\d{2}[a-z]?(?:;\s*[A-Z][A-Za-z-]+(?:\s+et\s+al\.)?,\s*(?:19|20)\d{2}[a-z]?)*\)/,
  /\b[A-Z][A-Za-z-]+(?:\s+et\s+al\.)?\s+\((?:19|20)\d{2}[a-z]?\)/,
  /\b(?:prior|previous|earlier)\s+(?:research|studies|work|literature)\b/i,
  /\b(?:the|existing)\s+literature\b/i,
  /선행\s*연구/,
  /연구에\s+따르면/
];

const DATA_MARKERS: RegExp[] = [
  /\bn\s*=\s*\d+\b/i,
  /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage points?)\b/i,
  /\b\d+(?:\.\d+)?\s+(?:respondents|participants|interviews|cases|observations|districts|households)\b/i,
  /\b(?:survey|dataset|data set|regression|model|table|figure)\s+\d*\b/i,
  /\b(?:measured|coded|sampled|estimated)\b/i,
  /자료|데이터|표\s*\d+/
];

const LOGIC_MARKERS: RegExp[] = [
  /\bbecause\b/i,
  /\bsince\b/i,
  /\bdue\s+to\b/i,
  /\bas\s+a\s+result\s+of\b/i,
  /\bif\b.+\bthen\b/i,
  /\bmechanism\b/i,
  /\bcausal\s+(?:pathway|logic|mechanism)\b/i,
  /왜냐하면/,
  /때문에/
];

const ANECDOTE_MARKERS: RegExp[] = [
  /\bfor\s+example\b/i,
  /\bfor\s+instance\b/i,
  /\bcase\s+study\b/i,
  /\bparticipant\s+(?:said|described|reported)\b/i,
  /\binterviewee\s+(?:said|described|reported)\b/i,
  /\banecdote\b/i,
  /예를\s+들어/,
  /사례/
];

export function extractClaims(text: string): Claim[] {
  return parseParagraphs(text).flatMap((paragraph) =>
    paragraph.sentences.flatMap((sentence, sentenceIndex) => {
      if (!isClaimSentence(sentence)) {
        return [];
      }

      return [
        {
          id: `claim-${paragraph.id}-s${sentenceIndex + 1}`,
          text: sentence,
          paragraph: paragraph.id,
          evidenceType: null,
          hasEvidence: false
        }
      ];
    })
  );
}

export function mapClaimsToEvidence(claims: Claim[], text: string): ClaimLedger {
  const paragraphs = parseParagraphs(text);
  const paragraphIndex = new Map(paragraphs.map((paragraph, index) => [paragraph.id, index]));

  const mappedClaims = claims.map((claim) => {
    const index = paragraphIndex.get(claim.paragraph);
    const evidenceType = index === undefined ? null : findNearbyEvidenceType(paragraphs, index);

    return {
      ...claim,
      evidenceType,
      hasEvidence: evidenceType !== null
    };
  });

  return {
    claims: mappedClaims,
    unsupportedClaims: mappedClaims.filter((claim) => !claim.hasEvidence)
  };
}

export function findUnsupportedClaims(ledger: ClaimLedger): Claim[] {
  return ledger.claims.filter((claim) => !claim.hasEvidence);
}

function findNearbyEvidenceType(paragraphs: ParsedParagraph[], claimParagraphIndex: number): EvidenceType | null {
  const scanOrder = [claimParagraphIndex, claimParagraphIndex - 1, claimParagraphIndex + 1];

  for (const index of scanOrder) {
    const paragraph = paragraphs[index];
    if (!paragraph) {
      continue;
    }

    const evidenceType = classifyEvidenceType(paragraph.text);
    if (evidenceType) {
      return evidenceType;
    }
  }

  return null;
}

function classifyEvidenceType(text: string): EvidenceType | null {
  if (matchesAny(PRIOR_WORK_MARKERS, text)) return 'prior-work';
  if (matchesAny(DATA_MARKERS, text)) return 'data';
  if (matchesAny(LOGIC_MARKERS, text)) return 'logic';
  if (matchesAny(ANECDOTE_MARKERS, text)) return 'anecdote';
  return null;
}

function parseParagraphs(text: string): ParsedParagraph[] {
  const parts = text
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const normalized = parts.length > 0 ? parts : [''];

  return normalized.map((paragraph, index) => ({
    id: `p${index + 1}`,
    text: paragraph,
    sentences: splitSentences(paragraph)
  }));
}

function splitSentences(paragraph: string): string[] {
  const matches = paragraph.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
  return matches.map(cleanSentence).filter(Boolean);
}

function cleanSentence(sentence: string): string {
  return sentence.trim().replace(/\s+/g, ' ');
}

function isClaimSentence(sentence: string): boolean {
  return matchesAny(CLAIM_MARKERS, sentence);
}

function matchesAny(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}
