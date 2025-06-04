export const COMMAND = 'click-install.install'

declare global {
  interface ImportMeta {
    readonly env: {
      readonly NODE_ENV: string
    }
  }
}
