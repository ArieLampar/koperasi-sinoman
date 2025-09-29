import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'validation/index': 'src/validation/index.ts',
    'formatting/index': 'src/formatting/index.ts',
    currency: 'src/currency.ts',
    'date/index': 'src/date/index.ts',
    'number/index': 'src/number/index.ts',
    'string/index': 'src/string/index.ts',
    'array/index': 'src/array/index.ts',
    'object/index': 'src/object/index.ts',
    'crypto/index': 'src/crypto/index.ts',
    'file/index': 'src/file/index.ts',
    'url/index': 'src/url/index.ts',
    'error/index': 'src/error/index.ts',
    'constants/index': 'src/constants/index.ts',
    'qr/index': 'src/qr/index.ts',
    'qr-code': 'src/qr-code.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['zod'],
  splitting: false,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  target: 'node18',
  platform: 'node',
  bundle: true,
  skipNodeModulesBundle: true,
  outDir: 'dist',
  tsconfig: './tsconfig.json',
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use strict";',
    }
    options.conditions = ['node']
    options.mainFields = ['module', 'main']
  },
  onSuccess: () => {
    console.log('✅ Build completed successfully')
  },
})