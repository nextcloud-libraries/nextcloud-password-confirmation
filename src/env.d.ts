import type { GetTextTranslations } from 'gettext-parser'

export declare global {
  interface Window {
    nc_pageLoad: number
    nc_lastLogin: number
    backendAllowsPasswordConfirmation: boolean
  }

  const __TRANSLATIONS__: Array<{ locale: string, json: GetTextTranslations }>
}
