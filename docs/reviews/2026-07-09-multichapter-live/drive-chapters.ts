// 예비비행 #6 스릴러를 실제 codex로 여러 화 이어 생성하며, 매 화마다 누적 캐논에 대해
// validateContinuity 를 돌려 자동 의미 게이트의 유기적 드리프트 포착·누적 정밀도를 관찰한다.
// 실행 — npx tsx docs/reviews/2026-07-09-multichapter-live/drive-chapters.ts  (background 권장, ~15~20분)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { validateContinuity, type SeriesProject } from '../../../src/lib/storyEngine';

const ROOT = process.cwd();
const OUT = 'docs/reviews/2026-07-09-multichapter-live/chapters';
const TITLE = '젖은 유리의 얼굴';
const PROVIDER = process.env.STORYX_PROVIDER ?? 'codex'; // 스모크 테스트 시 STORYX_PROVIDER=mock

type Canon = { owner: string; statement: string };
type Draft = {
  title?: string; hook?: string; prose?: string; status?: string;
  beats?: Array<{ label?: string; summary?: string; tension?: number }>;
  newCanonFacts?: Canon[]; rewardArc?: unknown[]; stakesLedger?: unknown[];
};

// ch1 = 예비비행 #6 초안.
const ch1 = JSON.parse(readFileSync('docs/reviews/2026-07-08-preflight-personas/drafts/06-twist-thriller.json', 'utf8')) as Draft;
const accumulated: Canon[] = [...(ch1.newCanonFacts ?? [])];
let prev: Draft = ch1;

// 각 화 전개 의도(가벼운 방향만 — 나머지는 codex 자율, 유기적 드리프트 관찰). 스릴러 압박을 점증.
const intents = [
  '자백문에 적힌 다음 피해자를 민서가 찾아 나서고, 자신의 기억 공백과 그 인물의 연결이 드러나기 시작한다.',
  '백서연이 민서에게 접근해 전날 밤의 진실 일부를 증언하지만, 그 증언이 캐논과 어긋나는 지점에서 긴장이 솟는다.',
  '수사팀 내부에 진범을 은폐하려는 손이 있음이 암시되고, 민서는 자신이 용의자로 좁혀지는 것을 느낀다.',
  '영원사진관의 전시된 사진들이 하나의 순서를 이루고 있었음이 밝혀지며, 다음 범행의 시간과 장소가 예고된다.',
  '민서가 기억 공백의 밤에 실제로 무엇을 했는지 결정적 증거와 마주하고, 자신이 범인인지 아닌지의 경계에서 선택을 강요받는다.',
];

function buildContext(): string {
  const canonLines = accumulated.map((c, i) => `${i + 1}. (${c.owner}) ${c.statement}`).join('\n');
  const beats = (prev.beats ?? []).map((b) => `- ${b.label}: ${b.summary}`).join('\n');
  return [
    '## 확정 캐논 (반드시 일관되게 지킬 사실)',
    canonLines || '(없음)',
    '',
    `## 직전 회차 — ${prev.title ?? ''}`,
    `후크: ${prev.hook ?? ''}`,
    beats,
  ].join('\n');
}

function runDraft(intent: string): Draft {
  const args = [
    'tools/storyx.mjs', 'draft',
    '--provider', PROVIDER,
    '--medium', 'novel',
    '--format', 'long-novel',
    '--title', TITLE,
    '--context', buildContext(),
    '--freewrite', intent,
    '--out-dir', `${ROOT}/.storyx-runs-live`,
  ];
  const raw = execFileSync('node', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
  return JSON.parse(raw) as Draft;
}

const log: string[] = [`# 멀티회차 라이브 이어 생성 — ${TITLE}\n`, `ch1 캐논 ${accumulated.length}개로 시작.\n`];

for (let i = 0; i < intents.length; i++) {
  const chNum = i + 2;
  process.stderr.write(`\n[ch${chNum}] 생성 시작 (누적 캐논 ${accumulated.length})...\n`);
  let draft: Draft;
  try {
    draft = runDraft(intents[i]);
  } catch (e) {
    log.push(`\n## ch${chNum} — 생성 실패: ${(e as Error).message.slice(0, 120)}`);
    break;
  }
  writeFileSync(`${OUT}/ch${chNum}.json`, JSON.stringify(draft, null, 2));

  // 누적 캐논(직전까지) 위에서 이번 화의 주장을 검증 — 유기적 드리프트 포착.
  const project = {
    characters: [], worldRules: [], openThreads: [],
    canonFacts: accumulated.map((c) => ({ owner: c.owner, statement: c.statement })),
  } as unknown as SeriesProject;
  const newClaims = [...(draft.newCanonFacts ?? []).map((c) => c.statement), draft.hook ?? ''].filter(Boolean);
  const issues = validateContinuity(project, newClaims);
  const hardBlocks = issues.filter((x) => x.severity === 'error' && x.source === 'continuity-editor');

  log.push(
    `\n## ch${chNum} — ${draft.title ?? ''} (status=${draft.status ?? '?'})`,
    `- 누적 캐논(이전) ${accumulated.length} · 새 캐논 ${(draft.newCanonFacts ?? []).length} · prose ${(draft.prose ?? '').length}자`,
    `- 게이트: hard-canon BLOCK ${hardBlocks.length}건${hardBlocks.length ? ' — ' + hardBlocks.map((b) => b.message.slice(0, 60)).join(' / ') : ''}`,
    `- 후크: ${(draft.hook ?? '').slice(0, 80)}`,
  );
  (draft.newCanonFacts ?? []).forEach((c) => log.push(`    + (${c.owner}) ${c.statement.slice(0, 70)}`));

  accumulated.push(...(draft.newCanonFacts ?? []));
  prev = draft;
  writeFileSync('docs/reviews/2026-07-09-multichapter-live/observations.md', log.join('\n'));
}

log.push(`\n## 최종 — 누적 캐논 ${accumulated.length}개 (${intents.length + 1}화 목표)`);
writeFileSync('docs/reviews/2026-07-09-multichapter-live/observations.md', log.join('\n'));
process.stderr.write('\n완료.\n');
