import type { ComputedRef, Ref } from 'reactive-vscode'
import { computed, ref, useControlledTerminal } from 'reactive-vscode'
import { Hover, languages, MarkdownString, window } from 'vscode'
import { COMMAND } from './constant'
import { filterDeps, getPkgDeps } from './modules'

class ViewTerminal {
  controlledTerminal: ReturnType<typeof useControlledTerminal> = useControlledTerminal({ hideFromUser: true })
  viewPkgName: Ref<string> = ref('')
  isRunning: ComputedRef<boolean> = computed(() => this.viewPkgName.value !== '')
  stream: any
  pkgInfoMap = new Map<string, string[]>()

  view(pkgName: string) {
    this.viewPkgName.value = pkgName
    this.controlledTerminal.sendText(`npm view ${pkgName}`)
  }

  get processId() {
    return this.controlledTerminal.terminal.value?.processId
  }

  private parsePkgInfo(msg: string): string[] {
    // eslint-disable-next-line no-control-regex
    const parsedMsg = msg.replaceAll(/\x1B\[[0-9;]*[A-Z]/gi, '')
    const regMatch = parsedMsg.match(new RegExp(`${this.viewPkgName.value}@\\d+.\\d+.\\d+`))
    if (regMatch) {
      // todo: LSP cache
      const useMsg = parsedMsg.slice(parsedMsg.indexOf(regMatch[0])).split('\n').slice(0, 3)
      return useMsg
    }
    return []
  }

  constructor() {
    window.onDidStartTerminalShellExecution((onStartEvent) => {
      const { terminal: startTerminal } = onStartEvent
      if (startTerminal.processId === this.processId) {
        this.stream = onStartEvent.execution.read()
      }
    })

    window.onDidEndTerminalShellExecution(async (onDidEvent) => {
      const { exitCode, terminal: doneTerminal } = onDidEvent
      if (doneTerminal.processId === this.processId && exitCode !== undefined) {
        for await (const data of this.stream) {
          const pkgInfo = this.parsePkgInfo(data)
          if (pkgInfo.length) {
            this.pkgInfoMap.set(this.viewPkgName.value, pkgInfo)
            // console.warn(pkgInfo)
            break
          }
        }
        this.viewPkgName.value = ''
      }
    })
  }
}

export const viewTerminal = new ViewTerminal()

export async function createProvider() {
  languages.registerHoverProvider(['vue', 'typescript', 'javascript'], {
    provideHover(document, position) {
      const lineText = document.lineAt(position.line).text
      const importRegex = /^\s*import[\s\S]+?from\s+['"]([\w\-/@]+)['"]\s*(?:;\s*)?$/
      const lineMatch = lineText.match(importRegex)
      if (lineMatch) {
        const pkgName = lineMatch[1]
        const pkgs = getPkgDeps()
        if (filterDeps(pkgName) && !pkgs.includes(pkgName)) {
          const args = encodeURIComponent(JSON.stringify([pkgName]))
          // todo: show module info
          const str = hoverText(pkgName, args)
          if (position.character >= lineText.indexOf(pkgName)) {
            if (viewTerminal.isRunning.value) {
              return new Hover(str)
            }
            if (!viewTerminal.pkgInfoMap.has(pkgName)) {
              viewTerminal.view(pkgName)
            }
            return new Hover(str)
          }
        }
      }
    },
  })
}

function hoverText(pkgName: string, args: string) {
  const markdownString = new MarkdownString()
  markdownString.isTrusted = true
  markdownString.supportHtml = true
  markdownString.supportThemeIcons = true
  markdownString.appendMarkdown(`<span style="color:#9cdcfe;">${pkgName}</span>`)
  markdownString.appendText('\n')
  if (viewTerminal.pkgInfoMap.has(pkgName)) {
    for (const text of viewTerminal.pkgInfoMap.get(pkgName)!) {
      markdownString.appendMarkdown(`<span>${text}</span>`)
      markdownString.appendText('\n')
    }
  }
  if (viewTerminal.isRunning.value) {
    markdownString.appendMarkdown('<span>Please Waiting...</span>')
  }
  else {
    markdownString.appendMarkdown(`<span>[install](command:${COMMAND}?${args}) or [install -D](command:${COMMAND}.dev?${args}).</span>`)
  }
  markdownString.appendMarkdown(`<span style="color:#787878;">${'&nbsp;'.repeat(4)}click-install.</span>`)
  return markdownString
}
