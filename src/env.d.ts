declare global {
	interface Window {
		nc_pageLoad: number
		nc_lastLogin: number
		backendAllowsPasswordConfirmation: boolean
	}

	const __TRANSLATIONS__: Array<{ locale: string, translations: { msgid: string, msgid_plural?: string, msgstr: string }[] }>
}

export {}
