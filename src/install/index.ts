import type { TerminalShellExecutionEndEvent } from 'vscode'
import type { PkgManagers } from '../pkgManager/constant'
import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { window } from 'vscode'
import PKG from '../pkgManager'
import { COMMAND, isPro } from '../utils/constant'
import { pkgCommands } from './constant'

interface DisposablesTerminalOptions {
  command: string | ((pkgManager: PkgManagers) => string)
  afterExecuted?: ((
    controlledTerminalt: ReturnType<typeof useControlledTerminal>,
    onDidEvent: TerminalShellExecutionEndEvent
  ) => void)
  dispose?: boolean
}

export function disposablesTerminal({ command, afterExecuted, dispose = false }: DisposablesTerminalOptions): Promise<TerminalShellExecutionEndEvent> {
  return new Promise<TerminalShellExecutionEndEvent>((resolve) => {
    const controlledTerminal = useControlledTerminal({ hideFromUser: isPro })
    const { terminal, sendText } = controlledTerminal
    if (typeof command === 'function') {
      sendText(command(PKG.pkgManager))
    }
    else {
      sendText(command)
    }
    const d = window.onDidEndTerminalShellExecution((onDidEvent) => {
      const { exitCode, terminal: doneTerminal } = onDidEvent
      if (doneTerminal.processId === terminal.value?.processId && exitCode !== undefined) {
        afterExecuted && afterExecuted(controlledTerminal, onDidEvent)
        if (dispose) {
          terminal.value.dispose()
          d.dispose()
        }
        resolve(onDidEvent)
      }
    })
  })
}

const terminalMap = new Map()
export function registerCommand() {
  const installCommand = (command: string, suffix: string = '') => {
    useCommand(command, (pkgName) => {
      if (terminalMap.has(pkgName)) {
        return
      }
      const { sendText, terminal } = useControlledTerminal({ hideFromUser: isPro })
      sendText(`${PKG.pkgManager} ${pkgCommands[PKG.pkgManager].install} ${pkgName} ${suffix}`)
      terminalMap.set(pkgName, terminal)
    })
  }

  // todo: suit monorepo
  // todo: with @types
  installCommand(COMMAND)
  installCommand(`${COMMAND}.dev`, '-D')

  const d = window.onDidEndTerminalShellExecution((t) => {
    const { terminal } = t
    const { name: pkgName } = terminal
    if (terminalMap.has(pkgName)) {
      terminal.dispose()
      terminalMap.delete(pkgName)
      d.dispose()
    }
  })
}
