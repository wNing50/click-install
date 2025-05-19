import { defineExtension, useActiveTextEditor, useDocumentText, watchEffect } from 'reactive-vscode'
import { modules, useModules } from './utils/modules'
import { createProvider } from './utils/provider'
import { getPkgManager, registerCommand } from './utils/terminal'

export const { activate, deactivate } = defineExtension(async () => {
  await getPkgManager()
  const editor = useActiveTextEditor()
  const code = useDocumentText(() => editor.value?.document)
  registerCommand()

  watchEffect(() => {
    useModules(code)
  })

  const w = watchEffect(() => {
    if (modules.value.length) {
      createProvider()
      w.stop()
    }
  })
})
