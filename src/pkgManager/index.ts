import type { PkgManagers } from './constant'
import { workspace } from 'vscode'
import { disposablesTerminal } from '../install'
import { pkgManagers } from './constant'

const PKG: { pkgManager: PkgManagers } = {
  pkgManager: 'npm',
}

function* pkgManagersGenerator() {
  yield* pkgManagers
}

export function getPkgManager() {
  const config = workspace.getConfiguration('click-install')
  const userPkgManager = config.get<string>('pkgManager') as PkgManagers
  if (userPkgManager) {
    PKG.pkgManager = userPkgManager
    return
  }
  const pkgManagers = pkgManagersGenerator()
  let pkg = pkgManagers.next()
  return disposablesTerminal({
    command: () => `${pkg.value} -v`,
    afterExecuted(controlledTerminal, onDidEvent) {
      const { sendText } = controlledTerminal
      const { exitCode } = onDidEvent
      if (pkg.done) {
        return
      }
      if (exitCode === 0) {
        PKG.pkgManager = pkg.value
        return
      }
      pkg = pkgManagers.next()
      sendText(`${pkg.value} -v`)
    },
    dispose: true,
  })
}

export default PKG
