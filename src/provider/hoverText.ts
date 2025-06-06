import path from 'node:path'
import { findUpSync } from 'find-up'
import { Hover, MarkdownString, window } from 'vscode'
import PKG from '../pkgManager'
import { COMMAND_INSTALL, COMMAND_REFIND } from '../utils/constant'

export function hoverText(pkgName: string, terminalRes: string | string[]): Hover {
  const args = encodeURIComponent(JSON.stringify([pkgName]))
  const markdownString = new MarkdownString()
  markdownString.isTrusted = true
  markdownString.supportHtml = true
  markdownString.supportThemeIcons = true
  markdownString.appendMarkdown(`<span style="color:#9cdcfe;">${pkgName}</span>`)

  if (Array.isArray(terminalRes)) {
    const appendWSInstall = () => {
      markdownString.appendText('\n')
      markdownString.appendMarkdown(`<span>install at workspace: [install -w](command:${COMMAND_INSTALL}.workspace?${args}) or [install -w -D](command:${COMMAND_INSTALL}.workspace.dev?${args}).</span>`)
    }

    const appendInstall = () => {
      markdownString.appendText('\n')
      markdownString.appendMarkdown(`<span>[install](command:${COMMAND_INSTALL}?${args}) or [install -D](command:${COMMAND_INSTALL}.dev?${args}).</span>`)
    }

    for (const index in terminalRes) {
      markdownString.appendText('\n')
      markdownString.appendMarkdown(`<span>${terminalRes[index]}</span>`)
    }
    if (PKG.usePkgManager === 'pnpm' && PKG.useMonorepo) {
      if (!rootDirInMonorepo()) {
        appendInstall()
      }
      appendWSInstall()
    }
    else {
      appendInstall()
    }
  }
  else if (typeof terminalRes === 'string') {
    // means not found
    markdownString.appendText('\n')
    markdownString.appendMarkdown(`<span>${terminalRes}</span>`)
    markdownString.appendText('\n')
    markdownString.appendMarkdown(`<span>[re-find](command:${COMMAND_REFIND}?${args}).</span>`)
  }
  else {
    throw new TypeError('Not correct terminal result type')
  }

  markdownString.appendMarkdown(`<span style="color:#787878;">${'&nbsp;'.repeat(4)}click-install.</span>`)
  return new Hover(markdownString)
}

function rootDirInMonorepo(): boolean {
  const cwd = window.activeTextEditor?.document.fileName
  if (!cwd) {
    return false
  }
  return !!findUpSync('pnpm-workspace.yaml', {
    cwd,
    stopAt: path.dirname(cwd),
  })
}
