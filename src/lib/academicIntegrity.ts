import { extractClaims } from './claimLedger';

export interface CounterArgumentAudit {
  hasCounterArgument: boolean;
  hasAlternativeHypothesis: boolean;
  limitationsAcknowledged: boolean;
  claimCount: number;
  claimParagraphs: string[];
  missingCounterArgument: boolean;
}

export interface ResearchEthicsAudit {
  subjectsReferenced: boolean;
  anonymityDeclared: boolean;
  consentDeclared: boolean;
  conflictDisclosed: boolean;
  subjectParagraphs: string[];
  issues: string[];
}

interface ParsedParagraph {
  id: string;
  text: string;
}

const COUNTER_ARGUMENT_MARKERS: RegExp[] = [
  /\bhowever\b/i,
  /\bcritics?\s+(?:argue|claim|contend|object)\b/i,
  /\bone\s+might\s+object\b/i,
  /\bcontrary\s+to\b/i,
  /\bon\s+the\s+other\s+hand\b/i,
  /\bnevertheless\b/i,
  /\balthough\b/i
];

const ALTERNATIVE_HYPOTHESIS_MARKERS: RegExp[] = [
  /\ban\s+alternative\s+(?:explanation|hypothesis|account)\b/i,
  /\balternative\s+(?:explanations|hypotheses|accounts)\b/i,
  /\bcould\s+also\s+(?:explain|reflect|indicate)\b/i,
  /\bmay\s+instead\s+(?:reflect|suggest|indicate)\b/i,
  /\bother\s+explanations?\b/i
];

const LIMITATION_MARKERS: RegExp[] = [
  /\blimitations?\b/i,
  /\bcaveats?\b/i,
  /\bthis\s+study\s+is\s+limited\b/i,
  /\bthe\s+sample\s+is\s+limited\b/i,
  /\bwe\s+cannot\s+rule\s+out\b/i
];

const SUBJECT_MARKERS: RegExp[] = [
  /\bparticipants?\b/i,
  /\bsubjects?\b/i,
  /\brespondents?\b/i,
  /\binterview(?:s|ed|ees?)?\b/i,
  /\bsurvey(?:s|ed)?\b/i,
  /\bdatasets?\b/i,
  /\bdata\s+sets?\b/i
];

const ANONYMITY_MARKERS: RegExp[] = [
  /\banonymi[sz]ed\b/i,
  /\bde-?identified\b/i,
  /\bconfidential(?:ity)?\b/i,
  /\bpseudonymi[sz]ed\b/i,
  /\bwithout\s+identifying\s+information\b/i
];

const CONSENT_MARKERS: RegExp[] = [
  /\binformed\s+consent\b/i,
  /\bconsent(?:ed)?\b/i,
  /\bIRB\b/,
  /\bethics\s+(?:approval|approved|review)\b/i,
  /\bapproved\s+protocol\b/i
];

const CONFLICT_MARKERS: RegExp[] = [
  /\bconflicts?\s+of\s+interest\b/i,
  /\bCOI\b/,
  /\bfunding\b/i,
  /\bfunded\b/i,
  /\bdisclosure\b/i,
  /\bno\s+conflicts?\b/i
];

const ANONYMITY_ISSUE = 'Participant anonymity or de-identification is not disclosed.';
const CONSENT_ISSUE = 'Consent or IRB/ethics approval is not disclosed.';

export function auditCounterArgument(text: string): CounterArgumentAudit {
  const claims = extractClaims(text);
  const hasCounterArgument = matchesAny(COUNTER_ARGUMENT_MARKERS, text);
  const hasAlternativeHypothesis = matchesAny(ALTERNATIVE_HYPOTHESIS_MARKERS, text);
  const limitationsAcknowledged = matchesAny(LIMITATION_MARKERS, text);
  const hasAnyCoverage = hasCounterArgument || hasAlternativeHypothesis || limitationsAcknowledged;

  return {
    hasCounterArgument,
    hasAlternativeHypothesis,
    limitationsAcknowledged,
    claimCount: claims.length,
    claimParagraphs: Array.from(new Set(claims.map((claim) => claim.paragraph))),
    missingCounterArgument: claims.length > 0 && !hasAnyCoverage
  };
}

export function auditResearchEthics(text: string): ResearchEthicsAudit {
  const paragraphs = parseParagraphs(text);
  const subjectParagraphs = paragraphs
    .filter((paragraph) => matchesAny(SUBJECT_MARKERS, paragraph.text))
    .map((paragraph) => paragraph.id);
  const subjectsReferenced = subjectParagraphs.length > 0;
  const anonymityDeclared = matchesAny(ANONYMITY_MARKERS, text);
  const consentDeclared = matchesAny(CONSENT_MARKERS, text);
  const conflictDisclosed = matchesAny(CONFLICT_MARKERS, text);
  const issues: string[] = [];

  if (subjectsReferenced && !anonymityDeclared) {
    issues.push(ANONYMITY_ISSUE);
  }
  if (subjectsReferenced && !consentDeclared) {
    issues.push(CONSENT_ISSUE);
  }

  return {
    subjectsReferenced,
    anonymityDeclared,
    consentDeclared,
    conflictDisclosed,
    subjectParagraphs,
    issues
  };
}

function parseParagraphs(text: string): ParsedParagraph[] {
  const parts = text
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [{ id: 'p1', text: '' }];
  }

  return parts.map((paragraph, index) => ({
    id: `p${index + 1}`,
    text: paragraph
  }));
}

function matchesAny(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}
