import { defineExtension } from 'reactive-vscode'
import { createProvider } from './utils/provider'
import { getPkgManager, registerCommand } from './utils/terminal'

export const { activate, deactivate } = defineExtension(async () => {
  await getPkgManager()
  registerCommand()
  createProvider()
})
