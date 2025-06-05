import type { TaskFunction } from 'gulp'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { series } from 'gulp'
import { rootDir } from '../utils/constant'
import { run, withTaskName } from '../utils/task'

const pkgFileDir = resolve(rootDir, 'package.json')

let cache: string

const beforeBuild: TaskFunction = series(
  withTaskName('cache package.json', cacheFile),
  withTaskName('rewrite package.json', rewirteFile),
)

async function cacheFile() {
  cache = await readFile(pkgFileDir, 'utf-8')
}

async function rewirteFile() {
  writeFile(pkgFileDir, cache.replaceAll('dist', 'build'))
}

const afterBuild: TaskFunction = series(
  withTaskName('restore package.json', restoreFile),
)

async function restoreFile() {
  writeFile(pkgFileDir, cache)
}

export function createBuildSeries(...args: any[]) {
  return series(
    withTaskName('before-build', beforeBuild),
    withTaskName('build', () => run('pnpm run build')),
    ...args,
    withTaskName('after-build', afterBuild),
  )
}
