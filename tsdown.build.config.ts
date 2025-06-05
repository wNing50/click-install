import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'build',
  format: ['cjs', 'esm'],
  shims: false,
  dts: false,
  clean: true,
  external: ['vscode'],
  minify: true,
})
