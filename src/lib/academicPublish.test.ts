import { auditCounterArgument, auditResearchEthics } from './academicIntegrity';
import { buildAcademicPublishSummary } from './academicPublish';
import { extractClaims, mapClaimsToEvidence } from './claimLedger';
import { auditCitations, extractReferences } from './citationGate';

const academicText = [
  'We argue that transit access improves civic participation.',
  'This section defines the policy background without giving evidence.',
  'The findings suggest that turnout rises after new bus routes. Survey data show 62 percent of respondents voted after the route opened.',
  'However, an alternative explanation is that campaign spending increased. This study is limited to one city.',
  '"Trust rose after the program" (Adams, 2020). Survey participants gave informed consent and responses were anonymized. Funding disclosure: no conflicts of interest.',
  'References',
  'Brown (2021). Peripheral cases in urban participation. Journal of Civic Life.',
  'Adams (2020). Transit and trust. Journal of Urban Studies.'
].join('\n\n');

describe('academicPublish', () => {
  it('summarizes A2-A4 academic integrity outputs without diverging from source modules', () => {
    const summary = buildAcademicPublishSummary(academicText);
    const claimLedger = mapClaimsToEvidence(extractClaims(academicText), academicText);
    const citationAudit = auditCitations(academicText);
    const counterArgument = auditCounterArgument(academicText);
    const researchEthics = auditResearchEthics(academicText);

    expect(summary.claimLedger).toEqual(claimLedger);
    expect(summary.citationAudit).toEqual(citationAudit);
    expect(summary.integrity.counterArgument).toEqual(counterArgument);
    expect(summary.integrity.researchEthics).toEqual(researchEthics);
    expect(summary.claimSummary).toEqual({
      totalClaims: 2,
      mappedClaims: 1,
      unsupportedClaims: 1
    });
    expect(summary.citationSummary).toEqual({
      totalCitations: 1,
      orphanCitations: 0,
      pageMissingQuotes: 1,
      uncitedReferences: 1,
      missingReferenceSection: false
    });
  });

  it('sorts the APA reference list by lead author', () => {
    const summary = buildAcademicPublishSummary(academicText);
    const directReferences = extractReferences(academicText);

    expect(directReferences.map((reference) => reference.raw)).toEqual([
      'Brown (2021). Peripheral cases in urban participation. Journal of Civic Life.',
      'Adams (2020). Transit and trust. Journal of Urban Studies.'
    ]);
    expect(summary.references).toEqual([
      'Adams (2020). Transit and trust. Journal of Urban Studies.',
      'Brown (2021). Peripheral cases in urban participation. Journal of Civic Life.'
    ]);
  });

  it('reports the four academic gates from qualityGates as advisory publish statuses', () => {
    const summary = buildAcademicPublishSummary(academicText);

    expect(summary.gateStatus.map((status) => status.gate)).toEqual([
      'claim_evidence_mapping',
      'citation_integrity',
      'counter_argument_present',
      'research_ethics_disclosure'
    ]);
    expect(summary.gateStatus.every((status) => status.requirement === 'advisory')).toBe(true);
    expect(summary.gateStatus.map((status) => status.passed)).toEqual([false, false, true, true]);
  });

  it('is deterministic for the same academic draft', () => {
    expect(buildAcademicPublishSummary(academicText)).toEqual(buildAcademicPublishSummary(academicText));
  });
});
