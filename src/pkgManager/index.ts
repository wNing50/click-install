import type { PkgManagers } from './constant'
import { findUpSync } from 'find-up'
import { window, workspace } from 'vscode'
import { disposablesTerminal } from '../install'
import { pkgManagers } from './constant'

const PKG: { usePkgManager: PkgManagers, useMonorepo: boolean } = {
  usePkgManager: 'npm',
  useMonorepo: false,
}

function* pkgManagersGenerator() {
  yield* pkgManagers
}

function getPkgManager() {
  const config = workspace.getConfiguration('click-install')
  const customPkgManager = config.get<string>('pkgManager') as PkgManagers
  if (customPkgManager) {
    PKG.usePkgManager = customPkgManager
    return
  }
  const pkgGen = pkgManagersGenerator()
  let genNext = pkgGen.next()
  return disposablesTerminal({
    command: () => `${genNext.value} -v`,
    afterExecuted(controlledTerminal, onDidEvent) {
      const { sendText } = controlledTerminal
      const { exitCode } = onDidEvent
      if (genNext.done) {
        return
      }
      if (exitCode === 0) {
        PKG.usePkgManager = genNext.value
        return
      }
      genNext = pkgGen.next()
      sendText(`${genNext.value} -v`)
    },
    dispose: true,
  })
}

function findMonorepo() {
  const yaml = findUpSync('pnpm-workspace.yaml', {
    cwd: window.activeTextEditor?.document.fileName,
  })
  if (yaml) {
    PKG.useMonorepo = true
  }
}

export async function init() {
  await getPkgManager()
  findMonorepo()
}

export default PKG
