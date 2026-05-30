import { describe, expect, it } from 'vitest';
import { extractClaims, findUnsupportedClaims, mapClaimsToEvidence } from './claimLedger';

describe('claimLedger', () => {
  it('extracts only clearly marked academic claims and preserves paragraph anchors', () => {
    const text = [
      'The article begins with a descriptive account of the field site. We argue that neighborhood councils changed access to city services.',
      'Residents described long meetings and ordinary paperwork. This sentence is background rather than a claim.',
      'This suggests that local legitimacy depends on visible procedural fairness.'
    ].join('\n\n');

    const claims = extractClaims(text);

    expect(claims.map((claim) => claim.text)).toEqual([
      'We argue that neighborhood councils changed access to city services.',
      'This suggests that local legitimacy depends on visible procedural fairness.'
    ]);
    expect(claims.map((claim) => claim.paragraph)).toEqual(['p1', 'p3']);
    expect(claims.map((claim) => claim.evidenceType)).toEqual([null, null]);
    expect(claims.map((claim) => claim.hasEvidence)).toEqual([false, false]);
  });

  it('classifies nearby evidence as data, prior work, logic, or anecdote', () => {
    const text = [
      'We find that turnout increased after the reform. The survey included n = 312 respondents and 42% reported new participation.',
      'This suggests that informal contact can raise institutional trust. Prior studies report similar effects (Smith, 2020).',
      'Therefore, the reform changed participation through repeated public contact because residents could observe decisions.',
      'The intervention demonstrates a shift in perceived access. For example, one participant described learning how to file a request.'
    ].join('\n\n');

    const ledger = mapClaimsToEvidence(extractClaims(text), text);

    expect(ledger.claims.map((claim) => claim.evidenceType)).toEqual([
      'data',
      'prior-work',
      'logic',
      'anecdote'
    ]);
    expect(ledger.claims.every((claim) => claim.hasEvidence)).toBe(true);
  });

  it('finds only claims without same or adjacent paragraph evidence', () => {
    const text = [
      'Prior studies link trust and participation (Rivera, 2019). We argue that local hearings can change compliance.',
      'The section then describes the setting without evidence markers.',
      'This suggests that legitimacy always travels through informal leaders.'
    ].join('\n\n');

    const unsupported = findUnsupportedClaims(mapClaimsToEvidence(extractClaims(text), text));

    expect(unsupported).toHaveLength(1);
    expect(unsupported[0]?.text).toBe('This suggests that legitimacy always travels through informal leaders.');
    expect(unsupported[0]?.paragraph).toBe('p3');
  });

  it('returns deterministic ledgers for the same input', () => {
    const text = [
      'We argue that participatory budgeting changes agenda setting.',
      'Table 1 reports 18 districts and a 27% increase in resident proposals.'
    ].join('\n\n');

    const first = mapClaimsToEvidence(extractClaims(text), text);
    const second = mapClaimsToEvidence(extractClaims(text), text);

    expect(second).toEqual(first);
  });
});
