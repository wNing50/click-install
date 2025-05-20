import { Hover, languages, MarkdownString } from 'vscode'
import { COMMAND } from './constant'
import { filterPkg, getPkgDeps } from './modules'

export function createProvider() {
  // 只在符合 import 语句的地方显示 Hover
  languages.registerHoverProvider(['vue', 'typescript'], {
    provideHover(document, position) {
      const lineText = document.lineAt(position.line).text
      const importRegex = /^\s*import[\s\S]+from\s+['"]([\w\-/@]+)['"]\s*(?:;\s*)?$/
      const lineMatch = lineText.match(importRegex)
      if (lineMatch) {
        const pkgName = lineMatch?.[1]
        const pkgs = getPkgDeps()
        if (filterPkg(pkgName) && !pkgs.includes(pkgName)) {
          const args = encodeURIComponent(JSON.stringify([pkgName]))
          const str = new MarkdownString(`[install](command:${COMMAND}?${args}) or [install-D](command:${COMMAND}.dev?${args}): \`${pkgName}\``)
          str.isTrusted = true
          return new Hover(str)
        }
      }
    },
  })
}
