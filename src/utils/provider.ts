import { Hover, languages, MarkdownString } from 'vscode'
import { COMMAND } from './constant'
import { filterDeps, getPkgDeps } from './modules'

export function createProvider() {
  languages.registerHoverProvider(['vue', 'typescript'], {
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
  markdownString.appendMarkdown(`<span>[install](command:${COMMAND}?${args}) or [install -D](command:${COMMAND}.dev?${args}).</span>`)
  markdownString.appendMarkdown(`<span style="color:#787878;">${'&nbsp;'.repeat(4)}click-install.</span>`)
  return markdownString
}
