import { describe, expect, it } from 'vitest';
import { auditCounterArgument, auditResearchEthics } from './academicIntegrity';

describe('academicIntegrity', () => {
  it('detects explicit counter-argument markers in academic claims', () => {
    const audit = auditCounterArgument(
      'This paper argues that mutual aid networks reshape welfare access. However, critics argue that state capacity explains the same pattern.'
    );

    expect(audit.claimCount).toBe(1);
    expect(audit.hasCounterArgument).toBe(true);
    expect(audit.hasAlternativeHypothesis).toBe(false);
    expect(audit.limitationsAcknowledged).toBe(false);
    expect(audit.missingCounterArgument).toBe(false);
  });

  it('flags one-sided academic claims without a counter argument', () => {
    const audit = auditCounterArgument('We argue that informal leaders determine welfare access in every district.');

    expect(audit.claimCount).toBe(1);
    expect(audit.hasCounterArgument).toBe(false);
    expect(audit.missingCounterArgument).toBe(true);
  });

  it('counts alternative hypotheses and limitations as counter-argument coverage', () => {
    const audit = auditCounterArgument(
      'This study finds that peer networks shape turnout. An alternative explanation is that campaign spending drove the change. A limitation is that the sample covers one city.'
    );

    expect(audit.hasAlternativeHypothesis).toBe(true);
    expect(audit.limitationsAcknowledged).toBe(true);
    expect(audit.missingCounterArgument).toBe(false);
  });

  it('does not warn when no explicit academic claim is present', () => {
    const audit = auditCounterArgument('The city council met on Tuesday and published the agenda online.');

    expect(audit.claimCount).toBe(0);
    expect(audit.missingCounterArgument).toBe(false);
  });

  it('flags participant research without anonymity or consent disclosures', () => {
    const audit = auditResearchEthics('We interviewed 18 participants about school access and coded their responses.');

    expect(audit.subjectsReferenced).toBe(true);
    expect(audit.anonymityDeclared).toBe(false);
    expect(audit.consentDeclared).toBe(false);
    expect(audit.issues).toContain('Participant anonymity or de-identification is not disclosed.');
    expect(audit.issues).toContain('Consent or IRB/ethics approval is not disclosed.');
  });

  it('passes participant research when consent and anonymity are declared', () => {
    const audit = auditResearchEthics(
      'Participants gave informed consent before interviews. The dataset was de-identified and anonymized under IRB approved protocol.'
    );

    expect(audit.subjectsReferenced).toBe(true);
    expect(audit.anonymityDeclared).toBe(true);
    expect(audit.consentDeclared).toBe(true);
    expect(audit.issues).toEqual([]);
  });

  it('recognizes funding and conflict-of-interest disclosure markers', () => {
    const audit = auditResearchEthics(
      'The survey used de-identified responses with informed consent. Funding was disclosed by the authors, and the conflict of interest statement reports none.'
    );

    expect(audit.conflictDisclosed).toBe(true);
  });

  it('is deterministic for the same text', () => {
    const text = 'We find that peer networks change access. On the other hand, survey recruitment may explain part of the effect.';

    expect(auditCounterArgument(text)).toEqual(auditCounterArgument(text));
    expect(auditResearchEthics(text)).toEqual(auditResearchEthics(text));
  });
});
