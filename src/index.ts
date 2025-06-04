import { defineExtension } from 'reactive-vscode'
import { getPkgManager, registerCommand } from './install'
import { createProvider } from './provider'

export const { activate, deactivate } = defineExtension(async () => {
  await getPkgManager()
  registerCommand()
  createProvider()
})
