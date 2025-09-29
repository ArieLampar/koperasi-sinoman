import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/constants/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    benchmark: {
      include: ['src/**/*.bench.{js,ts}'],
      exclude: ['node_modules', 'dist'],
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
  esbuild: {
    target: 'node18',
  },
})