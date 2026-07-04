import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Node 25 의 실험적 webstorage 전역이 jsdom 의 window.localStorage 를 가려
    // 실제 localStorage 를 만지는 테스트가 깨진다 — 워커에서 꺼서 jsdom 구현을 쓴다.
    poolOptions: {
      forks: { execArgv: ['--no-experimental-webstorage'] },
      threads: { execArgv: ['--no-experimental-webstorage'] }
    },
    // .claude/worktrees 안의 세션 워크트리는 같은 src/ 구조를 그대로 들고 있어
    // 테스트 탐색에 잡히면 안 된다 — 명시적으로 제외한다.
    exclude: [...configDefaults.exclude, '**/.claude/**']
  }
});
