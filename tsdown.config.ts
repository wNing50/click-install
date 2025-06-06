import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  shims: false,
  dts: false,
  clean: true,
  external: ['vscode'],
  sourcemap: true,
  watch: './src',
  env: {
    NODE_ENV: 'dev',
  },
})
