import { describe, expect, it } from 'vitest';
import { auditCitations, extractCitations, extractReferences } from './citationGate';

describe('citationGate', () => {
  it('extracts four conservative APA in-text citation forms and ignores ordinary parentheses', () => {
    const text = [
      'Community brokerage matters (Smith, 2020).',
      '"Access changed sharply" (Lee & Chen, 2021, p. 12).',
      'Garcia (2019) shows that informal institutions shape welfare access.',
      'Prior work agrees with this pattern (Nguyen et al., 2022).',
      'This ordinary aside (not a citation) should not be extracted.'
    ].join('\n\n');

    const citations = extractCitations(text);

    expect(citations.map((citation) => citation.raw)).toEqual([
      '(Smith, 2020)',
      '(Lee & Chen, 2021, p. 12)',
      'Garcia (2019)',
      '(Nguyen et al., 2022)'
    ]);
    expect(citations[0]).toMatchObject({
      authors: ['Smith'],
      year: '2020',
      page: null,
      paragraph: 'p1',
      hasReference: false
    });
    expect(citations[1]).toMatchObject({
      authors: ['Lee', 'Chen'],
      year: '2021',
      page: 'p. 12',
      paragraph: 'p2'
    });
    expect(citations[3].authors).toEqual(['Nguyen et al.']);
  });

  it('extracts APA references after a References or bibliography header', () => {
    const text = [
      'Prior work shows this pattern (Smith, 2020).',
      'References',
      'Smith, J. (2020). Community brokers. Journal of Local Governance.',
      'Lee, A., & Chen, B. (2021). Access and welfare. Social Policy Review.'
    ].join('\n');

    const references = extractReferences(text);

    expect(references.map((reference) => reference.raw)).toEqual([
      'Smith, J. (2020). Community brokers. Journal of Local Governance.',
      'Lee, A., & Chen, B. (2021). Access and welfare. Social Policy Review.'
    ]);
    expect(references[0]).toMatchObject({ authors: ['Smith'], year: '2020' });
    expect(references[1]).toMatchObject({ authors: ['Lee', 'Chen'], year: '2021' });
  });

  it('audits orphan citations, uncited references, and direct quotes without page numbers', () => {
    const text = [
      'Community brokerage matters (Smith, 2020).',
      'Prior work frames the same problem (Ghost, 2022). "Access changed sharply" (Lee & Chen, 2021).',
      'References',
      'Smith, J. (2020). Community brokers. Journal of Local Governance.',
      'Lee, A., & Chen, B. (2021). Access and welfare. Social Policy Review.',
      'Unused, R. (2018). Dormant reference. Methods Quarterly.'
    ].join('\n');

    const audit = auditCitations(text);

    expect(audit.referenceSectionPresent).toBe(true);
    expect(audit.orphanCitations.map((citation) => citation.raw)).toEqual(['(Ghost, 2022)']);
    expect(audit.pageMissingQuotes.map((citation) => citation.raw)).toEqual(['(Lee & Chen, 2021)']);
    expect(audit.uncitedReferences.map((reference) => reference.raw)).toEqual([
      'Unused, R. (2018). Dormant reference. Methods Quarterly.'
    ]);
    expect(audit.citations.find((citation) => citation.raw === '(Smith, 2020)')?.hasReference).toBe(true);
    expect(audit.citations.find((citation) => citation.raw === '(Ghost, 2022)')?.hasReference).toBe(false);
  });

  it('does not mark every citation orphan when the manuscript has no References section', () => {
    const audit = auditCitations('Community brokerage matters (Smith, 2020).');

    expect(audit.referenceSectionPresent).toBe(false);
    expect(audit.missingReferenceSection).toBe(true);
    expect(audit.citations).toHaveLength(1);
    expect(audit.references).toEqual([]);
    expect(audit.orphanCitations).toEqual([]);
  });

  it('is deterministic for identical input', () => {
    const text = [
      'Community brokerage matters (Smith, 2020).',
      'References',
      'Smith, J. (2020). Community brokers. Journal of Local Governance.'
    ].join('\n');

    expect(auditCitations(text)).toEqual(auditCitations(text));
  });
});
