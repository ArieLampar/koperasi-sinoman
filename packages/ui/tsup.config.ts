import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    'next',
    'tailwindcss',
    'autoprefixer',
    'postcss'
  ],
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use client"',
    }
  },
  outDir: 'dist',
  target: 'es2020',
  loader: {
    '.css': 'copy',
  },
  onSuccess: async () => {
    console.log('✅ UI package built successfully')
  },
})