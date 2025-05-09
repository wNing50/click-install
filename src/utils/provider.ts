import { CodeLens, languages, Position, Range, window } from 'vscode'
import { modules } from './modules'

export function createProvider() {
  return languages.registerCodeLensProvider(['vue', 'typescript'], {
    provideCodeLenses(document) {
      if (document.fileName !== window.activeTextEditor?.document.fileName) {
        return []
      }
      return modules.map((m) => {
        const { name, line } = m
        const range = new Range(new Position(line, 10), new Position(line, 10))
        return new CodeLens(range, {
          command: 'click-install.install',
          title: name,
          tooltip: name,
          arguments: [range, name],
        })
      })
    },
  })
}
