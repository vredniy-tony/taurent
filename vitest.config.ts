import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/shared/vitest.config.ts',
      'packages/bridge/vitest.config.ts',
      'packages/web-core/vitest.config.ts',
      'apps/desktop/vitest.config.ts',
    ],
  },
});
