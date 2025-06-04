import { defineExtension } from 'reactive-vscode'
import { registerCommand } from './install'
import { getPkgManager } from './pkgManager'
import { createProvider } from './provider'

export const { activate, deactivate } = defineExtension(async () => {
  await getPkgManager()
  registerCommand()
  createProvider()
})
