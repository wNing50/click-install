export const COMMAND_INSTALL = 'click-install.install'
export const COMMAND_REFIND = 'click-install.review'

const NODE_ENV = import.meta?.env?.NODE_ENV || 'production'
export const IS_PRO = NODE_ENV === 'production'
declare global {
  interface ImportMeta {
    readonly env: {
      readonly NODE_ENV: string
    }
  }
}
