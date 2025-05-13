import { defineExtension, useActiveTextEditor, useDocumentText, watchEffect } from 'reactive-vscode'
import { useModules } from './utils/modules'
import { createProvider } from './utils/provider'
import { getPkgManager, registerCommand } from './utils/terminal'

export const { activate, deactivate } = defineExtension(() => {
  console.warn('start')
  getPkgManager()
  const editor = useActiveTextEditor()
  const code = useDocumentText(() => editor.value?.document)
  createProvider()
  watchEffect(() => {
    useModules(code)
  })
  registerCommand()
})
