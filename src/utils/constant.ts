export const COMMAND = 'click-install.install'
const NODE_ENV = import.meta?.env?.NODE_ENV || 'production'
export const isPro = NODE_ENV === 'production'

declare global {
  interface ImportMeta {
    readonly env: {
      readonly NODE_ENV: string
    }
  }
}
