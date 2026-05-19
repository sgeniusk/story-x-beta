import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // .claude/worktrees 안의 세션 워크트리는 같은 src/ 구조를 그대로 들고 있어
    // 테스트 탐색에 잡히면 안 된다 — 명시적으로 제외한다.
    exclude: [...configDefaults.exclude, '**/.claude/**']
  }
});
