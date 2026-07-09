// 누적 캐논(23화·91팩트) 위에서 자동 의미 연속성 게이트의 recall/정밀도를 실측하는 결정론 하네스.
// 핵심 질문 — 1화 격리가 아니라 91개 팩트가 쌓인 상태에서도 ① 초기 화 팩트에 대한 직접 모순을 여전히 BLOCK 하는가(누적 recall)
// ② 정합 신규·기존 팩트 재진술이 오탐 없이 통과하는가(누적 정밀도). 프로덕션 경로 validateContinuity 를 그대로 호출한다.
import { readFileSync } from 'node:fs';
import { validateContinuity, type SeriesProject } from '../../../src/lib/storyEngine';

const BACKUP = 'docs/reviews/2026-06-07-persona-live-test/backups/02-work-backup-ch23.json';
const raw = JSON.parse(readFileSync(BACKUP, 'utf8'));
const project = JSON.parse(raw.dump.project) as SeriesProject;

// hard-canon error(severity=error·source=continuity-editor)만 게이트 발화로 센다.
// missing-anchor warning·living-state warning 은 차단이 아니므로 제외.
function hardBlocks(claim: string) {
  return validateContinuity(project, [claim]).filter(
    (i) => i.severity === 'error' && i.source === 'continuity-editor'
  );
}

console.log(`# 누적 연속성 게이트 검증 — ${project.title} (${project.currentEpisode}화·캐논 ${project.canonFacts.length}팩트)\n`);

// ── ① 누적 정밀도: 91개 실제 캐논 팩트를 각각 claim 으로 재진술 → 하나도 BLOCK 되면 오탐.
let fp = 0;
const fpSamples: string[] = [];
for (const fact of project.canonFacts) {
  const blocks = hardBlocks(fact.statement);
  if (blocks.length > 0) {
    fp++;
    if (fpSamples.length < 8) fpSamples.push(`${fact.statement.slice(0, 55)} → ${blocks[0].message.slice(0, 50)}`);
  }
}
console.log('## ① 누적 정밀도 — 기존 91팩트 재진술 FP 스캔');
console.log(`  재진술 오탐(FP): ${fp}/${project.canonFacts.length}`);
fpSamples.forEach((s) => console.log(`    ⚠ ${s}`));

// 정합 신규(ch24 가정) — 기존 캐논과 모순 없는 새 전개. 모두 통과해야 정밀.
const consistentNew = [
  '리아나는 레나 위클리프의 서류함에서 나온 봉투 조각을 은여우 상단 추적의 첫 단서로 삼기로 한다.',
  '루시안 벨로트는 동부 물류 계약의 실제 승인 경로를 리아나에게 숨기려 한다.',
  '백작부인은 레오르 벨로트의 이름이 왜 장례 명부에 올랐는지 끝내 말하지 않는다.',
  '리아나는 처형을 피하기 위해 인장 사용권의 위임 기록을 역추적하기 시작한다.',
];
let fpNew = 0;
for (const claim of consistentNew) {
  const blocks = hardBlocks(claim);
  if (blocks.length > 0) { fpNew++; console.log(`    ⚠ 정합신규 오탐: ${claim.slice(0, 50)} → ${blocks[0].message.slice(0, 50)}`); }
}
console.log(`  정합 신규 오탐(FP): ${fpNew}/${consistentNew.length}\n`);

// ── ② 누적 recall: 초기 화에서 확정된 하드 팩트에 대한 직접 모순 → 91팩트 아래 묻혀도 BLOCK 해야 한다.
const contradictions: Array<{ label: string; target: string; claim: string }> = [
  { label: '주인공 정체 반전 (fact[0] 빙의 대상)', target: '주인공은 리아나 벨로트로 빙의했다', claim: '주인공은 리아나 벨로트가 아니라 레나 위클리프로 빙의했다.' },
  { label: '멸문 예정 부정 (fact[1] 플롯 대전제)', target: '3년 뒤 멸문·처형 예정', claim: '벨로트 백작가는 멸문하지 않고 3년 뒤 황실에서 번영한다.' },
  { label: '레나 신분 반전 (fact[7] 하급 회계 보좌)', target: '레나 위클리프는 하급 회계 보좌', claim: '레나 위클리프는 회계 보좌가 아니라 은여우 상단을 이끄는 두목이다.' },
  { label: '동생/오빠 관계 반전 (canonAnchor 루시안)', target: '리아나의 둘째 오빠 = 루시안 벨로트', claim: '리아나의 둘째 오빠는 루시안이 아니라 레오르다.' },
  { label: '레오르 생사 반전 (canonAnchor 장례 명부 사망 기록)', target: '레오르 = 장례 명부에 죽은 사람', claim: '레오르 벨로트라는 죽지 않았고 지금도 살아 저택에 머문다.' },
];

console.log('## ② 누적 recall — 초기 화 하드 팩트 직접 모순 (91팩트 누적 상태)');
let caught = 0;
for (const c of contradictions) {
  const blocks = hardBlocks(c.claim);
  const verdict = blocks.length > 0 ? 'BLOCK ✓' : '통과 ✗(누락)';
  if (blocks.length > 0) caught++;
  console.log(`\n  ${c.label}`);
  console.log(`    타겟 캐논: ${c.target}`);
  console.log(`    모순 주장: "${c.claim}"`);
  console.log(`    → ${verdict}${blocks.length > 0 ? ` · ${blocks[0].message.slice(0, 60)}` : ''}`);
}

console.log('\n## 요약');
console.log(`  정밀도 — 재진술 FP ${fp}/${project.canonFacts.length} · 정합신규 FP ${fpNew}/${consistentNew.length} (0이 목표)`);
console.log(`  recall — 직접 모순 차단 ${caught}/${contradictions.length} (전부 BLOCK 이 목표)`);
