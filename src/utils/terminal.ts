import type { TerminalShellExecutionEndEvent } from 'vscode'
import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import { COMMAND } from './constant'

const terminalMap = new Map()
const processIdSet = new Set()
const pkgManagers = ['npm', 'pnpm', 'yarn'] as const
type PkgManagers = (typeof pkgManagers)[number] | ''
let pkgManager: PkgManagers = ''

function* pkgManagersGenerator() {
  yield* pkgManagers
}

interface DisposablesTerminalOptions {
  command: string | ((pkgManager: PkgManagers) => string)
  afterExecuted?: ((
    controlledTerminalt: ReturnType<typeof useControlledTerminal>,
    event: TerminalShellExecutionEndEvent
  ) => void)
}

export function disposablesTerminal({ command, afterExecuted }: DisposablesTerminalOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const controlledTerminal = useControlledTerminal({ hideFromUser: true })
    const { terminal, sendText } = controlledTerminal
    if (typeof command === 'function') {
      sendText(command(pkgManager))
    }
    else {
      sendText(command)
    }
    window.onDidEndTerminalShellExecution((onDidEvent) => {
      const { exitCode, terminal: doneTerminal } = onDidEvent
      if (doneTerminal.processId === terminal.value?.processId && exitCode !== undefined) {
        afterExecuted && afterExecuted(controlledTerminal, onDidEvent)
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
        pkgManager = pkg.value
        return
      }
      pkg = pkgManagers.next()
      sendText(`${pkg.value} -v`)
    },
  })
}
