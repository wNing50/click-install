import { defineConfig } from 'tsdown'
import { IS_PRO } from './src/utils/constant'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  shims: false,
  dts: false,
  clean: true,
  external: ['vscode'],
  minify: IS_PRO,
})
