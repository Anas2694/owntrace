import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 120_000,
    include: ['tests/**/*.test.js'],
    maxWorkers: 1,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30_000,
  },
})
