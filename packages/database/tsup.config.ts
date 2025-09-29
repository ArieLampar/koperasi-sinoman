import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'client/index': 'src/client/index.ts',
    'utils/index': 'src/utils/index.ts',
    'schemas/index': 'src/schemas/index.ts',
    'migrations/index': 'src/migrations/index.ts',
    'cli/migrate': 'src/cli/migrate.ts',
    'cli/generate-types': 'src/cli/generate-types.ts',
    'cli/seed': 'src/cli/seed.ts',
    'cli/backup': 'src/cli/backup.ts',
    'cli/restore': 'src/cli/restore.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@supabase/supabase-js', 'zod', 'postgres', 'pg'],
  esbuildOptions(options) {
    // Make CLI files executable
    if (options.entryNames?.includes('cli/')) {
      options.banner = {
        js: '#!/usr/bin/env node',
      }
    }
  },
})