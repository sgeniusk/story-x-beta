// gate-accumulation.ts 가 드러낸 누적 FP 의 detector 별 원인을 정량화한다.
// FP 를 (A) presence 축 있다/없다 보조용언 혼동 (B) 계사부정 X가아니 과발화 (C) 기타로 분류.
import { readFileSync } from 'node:fs';
import { buildContinuityContractFromProject, type SeriesProject } from '../../../src/lib/storyEngine';
import { classifyCanonChange } from '../../../src/lib/continuityContract';

const raw = JSON.parse(readFileSync('docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json', 'utf8'));
const project = JSON.parse(raw.dump.project) as SeriesProject;
const contract = buildContinuityContractFromProject(project);

const PRESENCE_A = /있다|있었|나타났|나타나|발견|존재/;
const PRESENCE_B = /없다|없었|없는|사라졌|사라지|실종/;
const COPULA_NEG = /(?:이|가|은|는)\s*아니/;

let A = 0, B = 0, C = 0;
const samples: Record<string, string[]> = { A: [], B: [], C: [] };

for (const fact of project.canonFacts) {
  const r = classifyCanonChange(contract, fact.statement);
  if (r.allowed || r.layer !== 'hard-canon') continue;
  const src = r.matchedSource ?? '';
  const claim = fact.statement;
  // 계사부정: 매칭된 source 가 "X가 아니" 를 담고, claim 은 안 담으면 B 성향.
  const copulaSrc = COPULA_NEG.test(src) && !COPULA_NEG.test(claim);
  // presence: claim/ source 한쪽이 있다계, 다른쪽이 없다계.
  const presence =
    (PRESENCE_A.test(claim) && PRESENCE_B.test(src)) || (PRESENCE_B.test(claim) && PRESENCE_A.test(src));
  let tag: 'A' | 'B' | 'C';
  if (presence && !copulaSrc) tag = 'A';
  else if (copulaSrc) tag = 'B';
  else tag = 'C';
  if (tag === 'A') A++; else if (tag === 'B') B++; else C++;
  if (samples[tag].length < 4) samples[tag].push(`${claim.slice(0, 40)}  ⟂  ${src.slice(0, 40)}`);
}

console.log('# 누적 FP detector 별 원인 분류 (재진술 91팩트)\n');
console.log(`A. presence 축(있다/없다 보조용언 혼동): ${A}`);
samples.A.forEach((s) => console.log(`     ${s}`));
console.log(`B. 계사부정(X가아니 과발화, source=reveal 팩트): ${B}`);
samples.B.forEach((s) => console.log(`     ${s}`));
console.log(`C. 기타: ${C}`);
samples.C.forEach((s) => console.log(`     ${s}`));
console.log(`\n합계 FP = ${A + B + C}/${project.canonFacts.length}`);
