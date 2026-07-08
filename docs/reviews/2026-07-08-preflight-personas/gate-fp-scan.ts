// 오탐 스캔 — 6개 실 초안 각각의 newCanonFacts를 계약으로 두고, 같은 초안의 beats summary·hook(정합 콘텐츠)을
// 주장으로 분류. 정합 콘텐츠라 block=0이어야 한다(자동 게이트가 자기 작품을 스스로 막으면 오탐).
import { readFileSync, readdirSync } from 'node:fs';
import { classifyCanonChange, type ContinuityContract } from '../../../src/lib/continuityContract';

const dir = 'docs/reviews/2026-07-08-preflight-personas/drafts';
let totalClaims = 0;
let blocked = 0;

for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const hardCanon: string[] = (d.newCanonFacts ?? []).map((c: { statement: string }) => c.statement);
  const contract: ContinuityContract = { hardCanon, livingState: [], softSignals: [] };
  const claims: string[] = [
    d.hook,
    ...(d.beats ?? []).map((b: { summary: string }) => b.summary),
  ].filter(Boolean);
  const hits: string[] = [];
  for (const claim of claims) {
    totalClaims += 1;
    const r = classifyCanonChange(contract, claim);
    if (!r.allowed && r.layer === 'hard-canon') {
      blocked += 1;
      hits.push(claim.slice(0, 40));
    }
  }
  console.log(`${f}: 주장 ${claims.length} · 오탐 block ${hits.length}${hits.length ? ' → ' + hits.join(' | ') : ''}`);
}

console.log(`\n합계: 주장 ${totalClaims} · 오탐 block ${blocked} → ${blocked === 0 ? '정밀도 OK(오탐 0)' : '오탐 발생 — 검토 필요'}`);
