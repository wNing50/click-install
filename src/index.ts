import { defineExtension } from 'reactive-vscode'
import { registerCommand } from './install'
import { init } from './pkgManager'
import { createProvider } from './provider'

export const { activate, deactivate } = defineExtension(async () => {
  await init()
  registerCommand()
  createProvider()
})
