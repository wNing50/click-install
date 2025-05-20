import type { TerminalShellExecutionEndEvent } from 'vscode'
import type { PkgManagers } from './constant'
import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import { COMMAND, pkgCommands, pkgManagers } from './constant'

let pkgManager: PkgManagers = 'npm'

function* pkgManagersGenerator() {
  yield* pkgManagers
}

interface DisposablesTerminalOptions {
  command: string | ((pkgManager: PkgManagers) => string)
  afterExecuted?: ((
    controlledTerminalt: ReturnType<typeof useControlledTerminal>,
    onDidEvent: TerminalShellExecutionEndEvent
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
    const d = window.onDidEndTerminalShellExecution((onDidEvent) => {
      const { exitCode, terminal: doneTerminal } = onDidEvent
      if (doneTerminal.processId === terminal.value?.processId && exitCode !== undefined) {
        afterExecuted && afterExecuted(controlledTerminal, onDidEvent)
        terminal.value.dispose()
        d.dispose()
        resolve(exitCode === 0)
      }
    })
  })
}

const terminalMap = new Map()
const processIdSet = new Set()
export function registerCommand() {
  const installCommand = (command: string, suffix: string = '') => {
    useCommand(command, (pkgName) => {
      if (terminalMap.has(pkgName)) {
        return
      }
      const { sendText, terminal } = useControlledTerminal({ name: pkgName, hideFromUser: true })
      sendText(`${pkgManager} ${pkgCommands[pkgManager].install} ${pkgName} ${suffix}`)
      terminalMap.set(pkgName, terminal)
      processIdSet.add(terminal.value?.processId)
    })
  }

  installCommand(COMMAND)
  installCommand(`${COMMAND}.dev`, '-D')

  const d = window.onDidEndTerminalShellExecution((t) => {
    const { terminal } = t
    const { name: pkgName, processId } = terminal
    if (terminalMap.has(pkgName) && processIdSet.has(processId)) {
      terminal.dispose()
      terminalMap.delete(pkgName)
      processIdSet.delete(processId)
      d.dispose()
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
