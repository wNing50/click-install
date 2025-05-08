import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  shims: false,
  dts: false,
  clean: true,
  external: [
    'vscode',
  ],
})
