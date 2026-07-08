// 공정성 검증 — 앱의 *주* 연속성 메커니즘(character.forbiddenContradictions 명시 규칙)이 실제로 발화하는지.
import { createSeedProject, validateContinuity } from '../../../src/lib/storyEngine';

const project = createSeedProject();
const c0 = project.characters[0];
console.log('seed 주인공:', c0?.name);

// 명시 규칙 주입 — 이 인물은 "형사가 아니다"류 주장과 모순.
if (c0) {
  c0.forbiddenContradictions = [
    { claim: '형사가 아니', reason: '이 인물은 강력계 형사로 확정됨' },
  ];
}

const withRule = validateContinuity(project, ['이 인물은 형사가 아니라 민간인이다.']);
const noRule = validateContinuity(createSeedProject(), ['이 인물은 형사가 아니라 민간인이다.']);

console.log('\n[명시 규칙 있음] validateContinuity issues:', withRule.filter((i) => i.severity === 'error').length, 'error');
withRule.filter((i) => i.severity === 'error').forEach((i) => console.log('  →', i.source, '|', i.message));
console.log('\n[명시 규칙 없음] error issues:', noRule.filter((i) => i.severity === 'error').length);
console.log('\n판정: 명시 규칙 경로 =', withRule.some((i) => i.severity === 'error') ? '발화 O(주 메커니즘 작동)' : '발화 X');
