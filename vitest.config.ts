import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'app/utils/units/__tests__/**/*.test.ts',
    ],
    environment: 'node',
  },
});


