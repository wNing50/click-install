export const pkgManagers = ['pnpm', 'yarn', 'npm'] as const
export type PkgManagers = (typeof pkgManagers)[number]
