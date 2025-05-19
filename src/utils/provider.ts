import { CodeLens, languages, Position, Range, window } from 'vscode'
import { COMMAND } from './constant'
import { modules } from './modules'

export function createProvider() {
  return languages.registerCodeLensProvider(['vue', 'typescript'], {
    provideCodeLenses(document) {
      if (document.fileName !== window.activeTextEditor?.document.fileName) {
        return []
      }
      return modules.value.map((m) => {
        const { name, line } = m
        const range = new Range(new Position(line, 0), new Position(line, 0))
        return new CodeLens(range, {
          command: COMMAND,
          title: name,
          tooltip: name,
          arguments: [name],
        })
      })
    },
  })
}
