// #5 환율 칼럼(근거·인용 없는 논증)에 학술 게이트를 실제로 돌려 판정력이 있는지 검증.
import { readFileSync } from 'node:fs';
import { extractClaims, mapClaimsToEvidence, findUnsupportedClaims } from '../../../src/lib/claimLedger';
import { auditCitations } from '../../../src/lib/citationGate';
import { auditCounterArgument, auditResearchEthics } from '../../../src/lib/academicIntegrity';

const draft = JSON.parse(readFileSync('docs/reviews/2026-07-08-preflight-personas/drafts/05-fx-column.json', 'utf8'));
const text: string = draft.prose ?? '';

const claims = extractClaims(text);
const ledger = mapClaimsToEvidence(claims, text);
const unsupported = findUnsupportedClaims(ledger);
const citations = auditCitations(text);
const counter = auditCounterArgument(text);
const ethics = auditResearchEthics(text);

console.log('# 학술 게이트 실발화 검증 — #5 환율 칼럼\n');
console.log(`prose 길이: ${text.length}자`);
console.log(`\n[A2 주장-근거]`);
console.log(`  추출 주장: ${claims.length}개`);
console.log(`  근거 없는 주장(unsupported): ${unsupported.length}개`);
console.log(`  샘플: ${unsupported.slice(0, 3).map((c) => `"${c.text.slice(0, 40)}"`).join(' / ')}`);
console.log(`\n[A3 인용 무결성]`);
console.log(`  인용 마커: ${citations.citations?.length ?? 0}개 · 참고문헌: ${citations.references?.length ?? 0}개`);
console.log(`  환각/미매칭 인용: ${citations.hallucinated?.length ?? '?'} · audit: ${JSON.stringify(citations).slice(0, 160)}`);
console.log(`\n[A4 반론·윤리]`);
console.log(`  반론 audit: ${JSON.stringify(counter).slice(0, 200)}`);
console.log(`  윤리 audit: ${JSON.stringify(ethics).slice(0, 160)}`);
console.log(`\n판정: 근거없는주장 ${unsupported.length} / 인용 ${citations.citations?.length ?? 0} — 게이트가 결손을 ${unsupported.length > 0 || (citations.citations?.length ?? 0) === 0 ? '포착함(발화 O)' : '못 잡음(발화 X)'}`);
