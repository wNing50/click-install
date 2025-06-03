import { useControlledTerminal } from 'reactive-vscode'
import { Hover, languages, MarkdownString, window } from 'vscode'
import { COMMAND } from './constant'
import { filterDeps, getPkgDeps } from './modules'

const pkgInfoMap = new Map<string, string | string[] | ViewTerminal>()
class ViewTerminal {
  controlledTerminal: ReturnType<typeof useControlledTerminal> = useControlledTerminal({ hideFromUser: true })
  viewPkgName!: string
  viewPromise!: Promise<Hover>
  viewResolve!: (value: Hover) => void

  view() {
    this.controlledTerminal.sendText(`npm view ${this.viewPkgName}`)
    this.viewPromise = new Promise((resolve) => {
      this.viewResolve = resolve
    })
  }

  get processId() {
    return this.controlledTerminal.terminal.value?.processId
  }

  private parsePkgInfo(msg: string): string[] {
    // eslint-disable-next-line no-control-regex
    const parsedMsg = msg.replaceAll(/\x1B\[[0-9;]*[A-Z]/gi, '')
    const regMatch = parsedMsg.match(new RegExp(`${this.viewPkgName}@\\d+.\\d+.\\d+`))
    if (regMatch) {
      const useMsg = parsedMsg.slice(parsedMsg.indexOf(regMatch[0])).split('\n').slice(0, 3)
      return useMsg
    }
    return []
  }

  constructor(pkgName: string) {
    this.viewPkgName = pkgName
    let stream: AsyncIterable<string>

    const startEvent = window.onDidStartTerminalShellExecution((onStartEvent) => {
      const { terminal: startTerminal } = onStartEvent
      if (startTerminal.processId === this.processId) {
        stream = onStartEvent.execution.read()
      }
    })

    const doneEvent = window.onDidEndTerminalShellExecution(async (onDidEvent) => {
      const { exitCode, terminal: doneTerminal } = onDidEvent
      if (doneTerminal.processId === this.processId && exitCode !== undefined) {
        for await (const data of stream) {
          const pkgInfo = this.parsePkgInfo(data)
          if (pkgInfo.length) {
            pkgInfoMap.set(this.viewPkgName, pkgInfo)
            break
          }
          pkgInfoMap.set(this.viewPkgName, 'Not found this package')
        }
        this.viewResolve(hoverText(this.viewPkgName))
        startEvent.dispose()
        doneEvent.dispose()
        doneTerminal.dispose()
      }
    })
  }
}

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
          if (position.character >= lineText.indexOf(pkgName)) {
            if (!pkgInfoMap.has(pkgName)) {
              const viewTerminal = new ViewTerminal(pkgName)
              pkgInfoMap.set(pkgName, viewTerminal)
              viewTerminal.view()
            }
            const viewContent = pkgInfoMap.get(pkgName)
            if (viewContent instanceof ViewTerminal) {
              return viewContent.viewPromise
            }
            return hoverText(pkgName)
          }
        }
      }
    },
  })
}

function hoverText(pkgName: string): Hover {
  const terminalRes = pkgInfoMap.get(pkgName)
  const args = encodeURIComponent(JSON.stringify([pkgName]))
  const markdownString = new MarkdownString()
  markdownString.isTrusted = true
  markdownString.supportHtml = true
  markdownString.supportThemeIcons = true
  markdownString.appendMarkdown(`<span style="color:#9cdcfe;">${pkgName}</span>`)

  if (Array.isArray(terminalRes)) {
    for (const index in terminalRes) {
      markdownString.appendText('\n')
      markdownString.appendMarkdown(`<span>${terminalRes[index]}</span>`)
    }
    markdownString.appendText('\n')
    markdownString.appendMarkdown(`<span>[install](command:${COMMAND}?${args}) or [install -D](command:${COMMAND}.dev?${args}).</span>`)
  }
  else if (typeof terminalRes === 'string') {
    markdownString.appendText('\n')
    markdownString.appendMarkdown(`<span>${terminalRes}</span>`)
  }
  else {
    throw new TypeError('Not correct terminal result type')
  }

  markdownString.appendMarkdown(`<span style="color:#787878;">${'&nbsp;'.repeat(4)}click-install.</span>`)
  return new Hover(markdownString)
}
