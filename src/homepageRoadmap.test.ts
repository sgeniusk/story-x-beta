import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const roadmap = readFileSync(resolve(__dirname, '../docs/storyx-evaluator-development-update.md'), 'utf8');

describe('Story X homepage roadmap update', () => {
  it('updates the roadmap around cross-media continuity and frontend agent execution', () => {
    expect(roadmap).toContain('홈페이지/온보딩 개편 반영');
    expect(roadmap).toContain('매체 전환 브릿지');
    expect(roadmap).toContain('소설 -> 웹툰/동화책/오디오북');
    expect(roadmap).toContain('프론트엔드 제작팀');
    expect(roadmap).toContain('워크플로우 라이브러리 고도화');
    expect(roadmap).toContain('유료 검토/패키징');
  });
});
