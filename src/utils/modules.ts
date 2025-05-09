import type { Ref } from 'reactive-vscode'
import { readFileSync } from 'node:fs'

import { findUpSync } from 'find-up'
import shelljs from 'shelljs'
import { window } from 'vscode'

shelljs.config.execPath = shelljs.which('node')?.toString() ?? ''

interface Modules {
  name: string
  col: number
}

export function useModules(code: Ref<string | undefined>): Modules[] {
  if (!code.value) {
    return []
  }
  const modules = getToImportModules(code.value)
  return modules
}

function getToImportModules(code: string | undefined): Modules[] {
  if (!code) {
    return []
  }
  const pkgs = getPkgDeps()
  const modules
  = [...getImportMatcher(code)]
    .filter(({ '1': name }) =>
      !pkgs.includes(name) && filterPkg(name) && filterNpmPkg(name),
    )
    .map(({ '1': name, index }) => ({ name, col: getCol(code, index) }))
  return modules
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
  const importReg = /^\s*import.*from ['"]([\w\-/@]+)['"]$/gm
  return code.matchAll(importReg)
}

function filterPkg(pkgName: string) {
  const filters = [/^node:/]
  return filters.every(r => !r.test(pkgName))
}

const npmMap = new Map()
function filterNpmPkg(pkgName: string): boolean {
  if (npmMap.has(pkgName)) {
    return npmMap.get(pkgName)
  }
  else {
    const { code } = shelljs.exec(`npm view ${pkgName}`, { silent: true })
    npmMap.set(pkgName, code !== 0)
    return code !== 0
  }
}

function getCol(code: string, index: number): number {
  return [...code.slice(0, index).matchAll(/\n/g)].length
}
