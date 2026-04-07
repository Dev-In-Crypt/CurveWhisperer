import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    env: {
      BITQUERY_API_KEY: 'test-key',
      LLM_API_KEY: 'test-key',
      LLM_BASE_URL: 'https://localhost',
      LLM_MODEL: 'test',
      TELEGRAM_BOT_TOKEN: 'test:token',
    },
  },
});
