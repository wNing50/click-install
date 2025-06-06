import type { TerminalShellExecutionEndEvent } from 'vscode'
import type { PkgManagers } from '../pkgManager/constant'
import { useCommand, useControlledTerminal } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
import PKG from '../pkgManager'
import { COMMAND_INSTALL, IS_PRO } from '../utils/constant'
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
    const controlledTerminal = useControlledTerminal({ hideFromUser: IS_PRO })
    const { terminal, sendText } = controlledTerminal
    if (typeof command === 'function') {
      sendText(command(PKG.usePkgManager))
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

      window.withProgress({
        location: ProgressLocation.Notification,
        title: `installing ${pkgName} ...`,
        cancellable: true,
      }, (_, t) => {
        t.onCancellationRequested(() => {
          const terminal = terminalMap.get(pkgName)
          terminal.value?.dispose()
          terminalMap.delete(pkgName)
          window.showWarningMessage(`Installation of ${pkgName} cancelled`)
        })

        return new Promise<void>((resolve) => {
          const { sendText, terminal } = useControlledTerminal({ hideFromUser: IS_PRO })
          sendText(`${PKG.usePkgManager} ${pkgCommands[PKG.usePkgManager].install} ${pkgName} ${suffix}`)
          terminalMap.set(pkgName, terminal)
          const d = window.onDidEndTerminalShellExecution((onDidEvent) => {
            if (onDidEvent.terminal.processId === terminal.value?.processId && onDidEvent.exitCode === 0) {
              terminal.value.dispose()
              terminalMap.delete(pkgName)
              d.dispose()
              window.showInformationMessage(`${pkgName} installed`)
              resolve()
            }
          })
        })
      })
    })
  }

  // todo: with @types
  installCommand(COMMAND_INSTALL)
  installCommand(`${COMMAND_INSTALL}.dev`, '-D')
  if (PKG.usePkgManager === 'pnpm' && PKG.useMonorepo) {
    installCommand(`${COMMAND_INSTALL}.workspace`, '-w')
    installCommand(`${COMMAND_INSTALL}.workspace.dev`, '-w -D')
  }
}
