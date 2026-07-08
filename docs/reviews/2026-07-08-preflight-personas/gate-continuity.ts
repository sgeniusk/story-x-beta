// #6 반전 스릴러 ep1 캐논으로 연속성 계약을 세우고, 여러 주장을 분류해 충돌 게이트의 판정력을 검증.
// 핵심 질문 — ① 진짜 모순을 block 하는가(teeth) ② 실제 반전(주인공=범인)이 seeded gap을 채워 오탐 없이 통과하는가.
import { readFileSync } from 'node:fs';
import { classifyCanonChange, type ContinuityContract } from '../../../src/lib/continuityContract';

const draft = JSON.parse(readFileSync('docs/reviews/2026-07-08-preflight-personas/drafts/06-twist-thriller.json', 'utf8'));
const hardCanon: string[] = (draft.newCanonFacts ?? []).map((c: { statement: string }) => c.statement);

const contract: ContinuityContract = { hardCanon, livingState: [], softSignals: [] };

console.log('# 연속성/충돌 게이트 검증 — #6 반전 스릴러 ep1 캐논\n');
console.log('hard-canon (ep1):');
hardCanon.forEach((s, i) => console.log(`  [${i}] ${s.slice(0, 60)}`));

const cases: Array<{ label: string; claim: string; expect: string }> = [
  { label: '① 진짜 모순 — 형사→민간인', claim: '윤민서는 형사가 아니라 평범한 민간인이다.', expect: 'block' },
  { label: '① 진짜 모순 — 피해자 생존', claim: '한태겸은 살해되지 않았고 지금도 살아 있다.', expect: 'block' },
  { label: '② 실제 반전 — 주인공이 범인', claim: '윤민서가 바로 한태겸을 살해한 진범이다.', expect: '통과(seeded gap — 오탐 아님)' },
  { label: '③ 정합 신규', claim: '윤민서는 백서연을 다음 피해자로부터 보호하기로 결심한다.', expect: '통과' },
];

console.log('\n분류 결과:');
for (const c of cases) {
  const r = classifyCanonChange(contract, c.claim);
  const verdict = r.allowed ? '통과' : 'BLOCK';
  console.log(`\n${c.label}`);
  console.log(`  주장: "${c.claim}"`);
  console.log(`  → ${verdict} · layer=${r.layer} · severity=${r.severity}`);
  console.log(`  기대=${c.expect} · reason=${r.reason.slice(0, 70)}`);
}
