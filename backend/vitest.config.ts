import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // 共用同一个测试库，串行执行避免互相清表
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
