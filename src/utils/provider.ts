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
          const str = new MarkdownString(`\`${pkgName}\`
            [install](command:${COMMAND}?${args}) or [install -D](command:${COMMAND}.dev?${args})`)
          str.isTrusted = true
          // todo: hover on module name
          return new Hover(str)
        }
      }
    },
  })
}
