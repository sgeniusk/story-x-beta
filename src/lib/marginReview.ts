import type { AgentRun } from './storyEngine';
import type { ValidationAgentId } from './agentReviewProcess';

export type ReviewSeverity = 'block' | 'suggest' | 'note';
export type ParagraphAnchor = string;

export interface Paragraph {
  id: ParagraphAnchor;
  text: string;
}

export interface InlineDiff {
  paragraph: ParagraphAnchor;
  from: string;
  to: string;
}

export interface MarginReview {
  persona: ValidationAgentId | string;
  anchor: ParagraphAnchor;
  severity: ReviewSeverity;
  head: string;
  body: string;
  diffs: InlineDiff[];
  pending?: boolean;
}

export interface AnnotationGrouping {
  groupStart: boolean;
  groupCont: boolean;
}

export type AnnotationItem = MarginReview & AnnotationGrouping;

export interface CanonDelta {
  kind: 'added' | 'pending';
  label: string;
  source: string;
}

export interface PersonaCard {
  id: ValidationAgentId | string;
  name: string;
  role: string;
  tint: string;
  isCore: boolean;
}

export type ExtendedGroup = '확장' | '신설' | '매체';

export interface ExtendedPersona extends PersonaCard {
  group: ExtendedGroup;
}

export type SummonHandler = (
  personaId: ValidationAgentId | string,
  context?: {
    selectedText?: string;
    anchor?: ParagraphAnchor;
  }
) => void;

export const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  block: '결정',
  suggest: '수정',
  note: '관찰'
};

const BLOCK_PATTERNS = [
  /충돌/,
  /모순/,
  /캐논\s*누락/,
  /결정\s*요구/,
  /결정이\s*필요/,
  /차단/,
  /forbidden/i,
  /contradiction/i,
  /conflict/i
];

const WAS_IS_PATTERNS = [
  /was\s*[:=]\s*["'“”‘’]?(.+?)["'“”‘’]?\s*(?:\/|->|→|,|\n)\s*is\s*[:=]\s*["'“”‘’]?(.+?)["'“”‘’]?(?:$|\n|[.)])/i,
  /기존\s*[:=]\s*["'“”‘’]?(.+?)["'“”‘’]?\s*(?:\/|->|→|,|\n)\s*(?:수정|제안|변경)\s*[:=]\s*["'“”‘’]?(.+?)["'“”‘’]?(?:$|\n|[.)])/i
];

export function splitIntoParagraphs(text: string): Paragraph[] {
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [{ id: 'p1', text: '' }];
  }

  return paragraphs.map((paragraph, index) => ({
    id: `p${index + 1}`,
    text: paragraph
  }));
}

export function resolveRunReviewAnchor(
  run: AgentRun,
  paragraphs: Paragraph[],
  fallbackIndex = 0,
  fallback: ParagraphAnchor = 'p1'
): ParagraphAnchor {
  const haystack = [run.output, ...(run.issues ?? []), ...run.evidence]
    .join('\n')
    .toLocaleLowerCase();
  const matched = paragraphs.find((paragraph) => {
    const text = paragraph.text.toLocaleLowerCase();
    return text.length > 12 && haystack.includes(text.slice(0, 24));
  });

  if (matched) {
    return matched.id;
  }

  return resolveFallbackAnchor(paragraphs, fallbackIndex, fallback);
}

export function seedPendingMarginReviews(
  personaIds: Array<ValidationAgentId | string>,
  paragraphs: Paragraph[]
): MarginReview[] {
  const anchors = paragraphs.length > 0 ? paragraphs : [{ id: 'p1', text: '' }];

  return personaIds.map((persona, index) => ({
    persona,
    anchor: anchors[index % anchors.length]?.id ?? 'p1',
    severity: 'note',
    head: '읽고 있어요...',
    body: '',
    diffs: [],
    pending: true
  }));
}

export function replacePendingMarginReview(
  reviews: MarginReview[],
  resolved: MarginReview
): MarginReview[] {
  return [
    ...reviews.filter((review) => {
      if (review.pending && review.persona === resolved.persona) {
        return false;
      }
      return !(review.persona === resolved.persona && review.anchor === resolved.anchor);
    }),
    { ...resolved, pending: false }
  ];
}

export function applyDiff(text: string, diff: InlineDiff | InlineDiff[]): string {
  const diffs = Array.isArray(diff) ? diff : [diff];

  return diffs.reduce((current, item) => {
    if (!item.from || !current.includes(item.from)) {
      return current;
    }
    return current.replace(item.from, item.to);
  }, text);
}

export function groupAnnotationsByParagraph(
  paragraphs: Paragraph[],
  reviews: MarginReview[]
): AnnotationItem[] {
  const out: AnnotationItem[] = [];

  for (const paragraph of paragraphs) {
    const here = reviews.filter((review) => review.anchor === paragraph.id);
    here.forEach((review, index) => {
      out.push({
        ...review,
        groupStart: index === 0,
        groupCont: index > 0
      });
    });
  }

  return out;
}

export function toMarginReview(run: AgentRun, anchor: ParagraphAnchor = 'p1'): MarginReview {
  const body = run.output.trim();
  const diffs = extractInlineDiffs(run, anchor);
  const severity = resolveSeverity(run, diffs);

  return {
    persona: run.agentId,
    anchor,
    severity,
    head: summarizeRun(run),
    body,
    diffs
  };
}

function resolveSeverity(run: AgentRun, diffs: InlineDiff[]): ReviewSeverity {
  const searchable = [run.status, run.output, ...(run.issues ?? []), ...run.evidence].join('\n');
  if (run.status === 'block' || BLOCK_PATTERNS.some((pattern) => pattern.test(searchable))) {
    return 'block';
  }
  if (diffs.length > 0 || run.status === 'revise') {
    return 'suggest';
  }
  return 'note';
}

function summarizeRun(run: AgentRun): string {
  const preferred = firstNonEmpty([...(run.issues ?? []), ...(run.strengths ?? []), run.output, run.title]);
  const firstSentence = preferred.split(/(?<=[.!?。！？])\s+|\n/)[0]?.trim() || preferred;
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}...` : firstSentence;
}

function firstNonEmpty(values: string[]): string {
  return values.find((value) => value.trim().length > 0)?.trim() ?? '검토 의견';
}

function extractInlineDiffs(run: AgentRun, anchor: ParagraphAnchor): InlineDiff[] {
  const source = [run.output, ...(run.issues ?? [])].join('\n');
  const diffs: InlineDiff[] = [];

  for (const pattern of WAS_IS_PATTERNS) {
    let match: RegExpExecArray | null;
    const globalPattern = new RegExp(pattern.source, `${pattern.flags.includes('i') ? 'i' : ''}g`);
    while ((match = globalPattern.exec(source)) !== null) {
      const from = cleanDiffSide(match[1]);
      const to = cleanDiffSide(match[2]);
      if (from && to && from !== to) {
        diffs.push({ paragraph: anchor, from, to });
      }
    }
  }

  return dedupeDiffs(diffs);
}

function cleanDiffSide(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ');
}

function dedupeDiffs(diffs: InlineDiff[]): InlineDiff[] {
  const seen = new Set<string>();
  return diffs.filter((diff) => {
    const key = `${diff.paragraph}\0${diff.from}\0${diff.to}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function resolveFallbackAnchor(
  paragraphs: Paragraph[],
  fallbackIndex: number,
  fallback: ParagraphAnchor
): ParagraphAnchor {
  if (paragraphs.length === 0) {
    return fallback;
  }

  const index = ((fallbackIndex % paragraphs.length) + paragraphs.length) % paragraphs.length;
  return paragraphs[index]?.id ?? fallback;
}
