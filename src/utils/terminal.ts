import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import { COMMAND } from './constant'

const terminalMap = new Map()
const processIdSet = new Set()
let pkgManager = ''

export function disposablesTerminal(command: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const { terminal, sendText } = useControlledTerminal({ hideFromUser: true })
    sendText(command)
    window.onDidEndTerminalShellExecution((t) => {
      const { exitCode, terminal: doneTerminal } = t
      if (doneTerminal.processId === terminal.value?.processId && exitCode !== undefined) {
        terminal.value.dispose()
        resolve(exitCode === 0)
      }
    })
  })
}

export function registerCommand() {
  useCommand(COMMAND, (pkgName) => {
    if (terminalMap.has(pkgName)) {
      return
    }
    const { sendText, terminal } = useControlledTerminal({ name: pkgName, hideFromUser: true })
    sendText(`${pkgManager} view ${pkgName}`) // todo: install
    terminalMap.set(pkgName, terminal)
    processIdSet.add(terminal.value?.processId)
  })

  window.onDidEndTerminalShellExecution((t) => {
    const { terminal } = t
    const { name: pkgName, processId } = terminal
    if (terminalMap.has(pkgName) && processIdSet.has(processId)) {
      terminal.dispose()
      terminalMap.delete(pkgName)
      processIdSet.delete(processId)
    }
  })
}

export function getPkgManager() {
  const { sendText } = useControlledTerminal({ name: 'pkgManager', hideFromUser: true })
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
