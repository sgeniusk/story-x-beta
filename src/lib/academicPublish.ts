import {
  extractClaims,
  mapClaimsToEvidence,
  type ClaimLedger
} from './claimLedger';
import {
  auditCitations,
  extractReferences,
  type CitationAudit
} from './citationGate';
import {
  auditCounterArgument,
  auditResearchEthics,
  type CounterArgumentAudit,
  type ResearchEthicsAudit
} from './academicIntegrity';
import {
  evaluateQualityGates,
  type GateResult
} from './qualityGates';

export interface AcademicClaimSummary {
  totalClaims: number;
  mappedClaims: number;
  unsupportedClaims: number;
}

export interface AcademicCitationSummary {
  totalCitations: number;
  orphanCitations: number;
  pageMissingQuotes: number;
  uncitedReferences: number;
  missingReferenceSection: boolean;
}

export interface AcademicIntegritySummary {
  counterArgument: CounterArgumentAudit;
  researchEthics: ResearchEthicsAudit;
}

export interface AcademicPublishSummary {
  claimLedger: ClaimLedger;
  claimSummary: AcademicClaimSummary;
  citationAudit: CitationAudit;
  citationSummary: AcademicCitationSummary;
  integrity: AcademicIntegritySummary;
  references: string[];
  gateStatus: GateResult[];
}

const ACADEMIC_PUBLISH_MODE = {
  commercialWeight: 0,
  literaryWeight: 0
};

export function buildAcademicPublishSummary(text: string): AcademicPublishSummary {
  const claimLedger = mapClaimsToEvidence(extractClaims(text), text);
  const citationAudit = auditCitations(text);
  const counterArgument = auditCounterArgument(text);
  const researchEthics = auditResearchEthics(text);
  const citationIssueCount = citationAudit.orphanCitations.length + citationAudit.pageMissingQuotes.length;
  const gateReport = evaluateQualityGates(
    {
      text,
      medium: 'academic',
      unsupportedClaimCount: claimLedger.unsupportedClaims.length,
      citationIssueCount,
      counterArgumentPresent: !counterArgument.missingCounterArgument,
      researchEthicsIssueCount: researchEthics.issues.length
    },
    ACADEMIC_PUBLISH_MODE
  );

  return {
    claimLedger,
    claimSummary: {
      totalClaims: claimLedger.claims.length,
      mappedClaims: claimLedger.claims.filter((claim) => claim.hasEvidence).length,
      unsupportedClaims: claimLedger.unsupportedClaims.length
    },
    citationAudit,
    citationSummary: {
      totalCitations: citationAudit.citations.length,
      orphanCitations: citationAudit.orphanCitations.length,
      pageMissingQuotes: citationAudit.pageMissingQuotes.length,
      uncitedReferences: citationAudit.uncitedReferences.length,
      missingReferenceSection: citationAudit.missingReferenceSection
    },
    integrity: {
      counterArgument,
      researchEthics
    },
    references: extractReferences(text)
      .sort((a, b) => compareReferences(a.authors[0] ?? '', a.year, a.raw, b.authors[0] ?? '', b.year, b.raw))
      .map((reference) => reference.raw),
    gateStatus: gateReport.results.filter((result) => result.track === 'academic')
  };
}

function compareReferences(
  leftAuthor: string,
  leftYear: string,
  leftRaw: string,
  rightAuthor: string,
  rightYear: string,
  rightRaw: string
): number {
  const byAuthor = normalizeAuthor(leftAuthor).localeCompare(normalizeAuthor(rightAuthor));
  if (byAuthor !== 0) return byAuthor;
  const byYear = leftYear.localeCompare(rightYear);
  if (byYear !== 0) return byYear;
  return leftRaw.localeCompare(rightRaw);
}

function normalizeAuthor(author: string): string {
  return author.replace(/[^A-Za-z]/g, '').toLowerCase();
}
