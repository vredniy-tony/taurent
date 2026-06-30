import { defineProject } from 'vitest/config';
import path from 'path';

export default defineProject({
  resolve: {
    alias: {
      '@taurent/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
