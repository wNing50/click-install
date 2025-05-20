import { defineExtension } from 'reactive-vscode'
import { createProvider } from './utils/provider'
import { getPkgManager, registerCommand } from './utils/terminal'

export const { activate, deactivate } = defineExtension(async () => {
  await getPkgManager()
  // const editor = useActiveTextEditor()
  // const code = useDocumentText(() => editor.value?.document)
  registerCommand()
  // watchEffect(() => {
  // useModules(code)
  // })

  // getPkgDeps()
  createProvider()

  // const w = watchEffect(() => {
  //   if (modules.value.length) {
  //     w.stop()
  //   }
  // })
})
