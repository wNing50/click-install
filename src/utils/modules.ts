import type { Ref } from 'reactive-vscode'
import type { Modules } from './types'

import { readFileSync } from 'node:fs'
import { findUpSync } from 'find-up'
import shelljs from 'shelljs'

import { window } from 'vscode'

shelljs.config.execPath = shelljs.which('node')?.toString() ?? ''
export const modules: Modules[] = []

export async function useModules(code: Ref<string | undefined>): Promise<void> {
  modules.length = 0
  if (!code.value) {
    return
  }
  const pkgs = getPkgDeps()
  const importModules = [...getImportMatcher(code.value)]
    .map(({ '1': name, index }) => ({ name, line: getLine(code.value as string, index) }))
  const syncFiltered = importModules.filter(({ name }) =>
    !pkgs.includes(name) && filterPkg(name),
  )
  const asyncFiltered = await asyncFilter(syncFiltered)
  modules.push(...asyncFiltered)
}

function getPkgDeps(): string[] {
  const pkg = findUpSync('package.json', {
    cwd: window.activeTextEditor?.document.fileName,
  })
  if (!pkg) {
    return []
  }
  const pkgFile = JSON.parse(readFileSync(pkg, 'utf-8'))
  return Object.keys({ ...pkgFile.dependencies, ...pkgFile.devDependencies })
}

function getImportMatcher(code: string | undefined) {
  if (!code) {
    return []
  }
  const importReg = /^\s*import[^'"]*from ['"]([\w\-/@]+)['"]$/gm
  return code.matchAll(importReg)
}

async function asyncFilter(pkgs: Modules[]): Promise<Modules[]> {
  const filtered = await Promise.all(pkgs.map(({ name }) => filterNpmPkg(name)))
  return pkgs.filter((_, index) => filtered[index])
}

function filterPkg(pkgName: string) {
  const filters = [/^node:/, /^vscode$/, /^@\//]
  return filters.every(r => !r.test(pkgName))
}

const npmMap = new Map<string, boolean>()
async function filterNpmPkg(pkgName: string): Promise<boolean> {
  if (npmMap.has(pkgName)) {
    return npmMap.get(pkgName) as boolean
  }
  else {
    const res = await shellProcess(pkgName)
    npmMap.set(pkgName, res)
    return res
  }
}

function shellProcess(pkgName: string): Promise<boolean> {
  return new Promise((resolve) => {
    shelljs.exec(`npm view ${pkgName}`, { silent: true }, (code) => {
      console.warn('Exit code:', code, pkgName)
      resolve(code === 0)
    })
  })
}

function getLine(code: string, index: number): number {
  return [...code.slice(0, index).matchAll(/\n/g)].length
}
