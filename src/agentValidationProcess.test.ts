import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildPersonaReviewProtocol,
  getAgentValidationProcess,
  reviewScales,
  validationProcesses
} from './lib/agentReviewProcess';

const desk = readFileSync(resolve(__dirname, 'StoryXDesk.tsx'), 'utf8');
const skill = readFileSync(resolve(__dirname, '../.claude/skills/storyx-persona-review/SKILL.md'), 'utf8');
const componentSrc = (name: string) =>
  readFileSync(resolve(__dirname, `components/${name}.tsx`), 'utf8');

describe('persona validation process', () => {
  it('defines scale-aware review runs before spending tokens', () => {
    expect(Object.keys(reviewScales)).toEqual(['quick', 'standard', 'deep']);

    const protocol = buildPersonaReviewProtocol('quick');

    expect(protocol.scale.askBeforeRun).toBe(true);
    expect(protocol.scale.agentLimit).toBeLessThanOrEqual(3);
    expect(protocol.openingQuestion).toContain('검토 규모');
    expect(protocol.finalReportSections).toEqual(['검토의견', '변경사항', '성장 메모리 업데이트']);
  });

  it('gives every specialist an independent validation and evolution memory rule', () => {
    expect(validationProcesses.map((process) => process.agentId)).toEqual([
      'showrunner',
      'character-custodian',
      'world-keeper',
      'genre-stylist',
      'continuity-editor',
      'essay-interviewer',
      'voice-curator',
      'audio-narration-director',
      'education-video-architect',
      'sound-music-agent',
      'storyboard-agent',
      'speech-bubble-agent',
      'keyframe-art-director',
      'da-vinci',
      'frame-assembly-agent',
      // M4-essay-studio-agents 1차 신설 — 스튜디오 단계 코어 6명
      'canon-librarian',
      'timeline-keeper',
      'bible-curator',
      'critic-reviewer',
      'essay-curator',
      'memory-evolution-keeper',
      // M4-stage-agents 3차 — 브릿지 1명
      'interview-curator',
      // M4-stage-agents 2차 — 랜딩 1명
      'studio-architect'
    ]);

    const characterProcess = getAgentValidationProcess('character-custodian');

    expect(characterProcess.independentChecks).toContain('인물이 욕망, 상처, 방어 방식과 어긋나는 행동을 하지 않았는가');
    expect(characterProcess.evolutionMemory).toContain('반복해서 흔들린 말투와 행동 패턴');
    expect(characterProcess.outputFormat).toContain('차단');
  });

  it('surfaces the protocol in the editor and project skill', () => {
    expect(desk).toContain('<AgentProfileDialog');
    expect(componentSrc('AgentProfileDialog')).toContain('검증 프로세스');
    expect(componentSrc('AgentProfileDialog')).toContain('성장 메모리');
    // 검토 규모 상태는 StoryXDesk 에서 관리되고 floatingEditorProps 로 전달된다
    expect(desk).toContain('reviewScale');
    expect(skill).toContain('검토 규모를 먼저 묻는다');
    expect(skill).toContain('검토의견');
    expect(skill).toContain('성장 메모리 업데이트');
  });
});
