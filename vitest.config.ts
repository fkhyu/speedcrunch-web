import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/utils/__tests__/**/*.test.ts',
      'src/utils/units/__tests__/**/*.test.ts',
    ],
    environment: 'node',
  },
});


