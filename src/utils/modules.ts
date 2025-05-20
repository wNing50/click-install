import { readFileSync } from 'node:fs'
import { findUpSync } from 'find-up'

import { window } from 'vscode'

export function getPkgDeps() {
  const pkg = findUpSync('package.json', {
    cwd: window.activeTextEditor?.document.fileName,
  })
  if (!pkg) {
    return []
  }
  const pkgFile = JSON.parse(readFileSync(pkg, 'utf-8'))
  return Object.keys({ ...pkgFile.dependencies, ...pkgFile.devDependencies })
}

export function filterPkg(pkgName: string) {
  const filters = [/^node:/, /^vscode$/, /^@\//]
  return filters.every(r => !r.test(pkgName))
}
