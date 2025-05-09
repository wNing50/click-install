import { warn } from 'node:console'
import { defineExtension, useActiveTextEditor, useDocumentText, watchEffect } from 'reactive-vscode'
import { useModules } from './utils/modules'

export const { activate, deactivate } = defineExtension(() => {
  console.warn('start')

  const editor = useActiveTextEditor()
  const code = useDocumentText(() => editor.value?.document)

  watchEffect(() => {
    const modules = useModules(code)
    warn(modules)
  })
})
