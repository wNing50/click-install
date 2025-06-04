export const pkgManagers = ['pnpm', 'yarn', 'npm'] as const
export type PkgManagers = (typeof pkgManagers)[number]

export const pkgCommands = {
  npm: {
    install: 'install',
  },
  pnpm: {
    install: 'add',
  },
  yarn: {
    install: 'add',
  },
}
