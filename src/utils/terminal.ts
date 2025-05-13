import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import { COMMAND } from './constant'

const terminalMap = new Map()
const prefix = 'click install~'
let pkgManager = ''

export function registerCommand() {
  useCommand(COMMAND, (pkgName) => {
    const terminalName = `${prefix}${pkgName}`
    if (terminalMap.has(terminalName)) {
      return
    }
    const { sendText, terminal } = useControlledTerminal({ name: terminalName })
    sendText(`${pkgManager} view ${pkgName}`)
    terminalMap.set(pkgName, terminal)
  })

  window.onDidEndTerminalShellExecution((t) => {
    const { terminal } = t
    const { name } = terminal
    if (name.startsWith(prefix)) {
      const pkgName = name.split(prefix).at(-1)
      if (terminalMap.has(pkgName)) {
        terminal.dispose()
        terminalMap.delete(pkgName)
      }
    }
  })
}

export function getPkgManager() {
  const { sendText } = useControlledTerminal({ name: 'pkgManager' })
  const pkgManagers = pkgManagersGenerator()
  let pkg = pkgManagers.next()
  sendText(`${pkg.value} -v`)

  window.onDidEndTerminalShellExecution(async (t) => {
    const { terminal, exitCode } = t
    if (terminal.name !== 'pkgManager') {
      return
    }
    if (exitCode === 0) {
      terminal.dispose()
      pkgManager = pkg.value as string
      return
    }
    pkg = pkgManagers.next()
    if (pkg.done) {
      terminal.dispose()
      throw new Error('Can not find pkg manager')
    }
    sendText(`${pkg.value} -v`)
  })
}

function* pkgManagersGenerator() {
  yield* ['npm', 'pnpm', 'yarn']
}
