import { Hover, MarkdownString } from 'vscode'
import { COMMAND } from '../utils/constant'

export function hoverText(pkgName: string, terminalRes: string | string[]): Hover {
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
