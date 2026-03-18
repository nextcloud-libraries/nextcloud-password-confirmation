/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

declare global {
	interface Window {
		nc_pageLoad: number
		nc_lastLogin: number
		backendAllowsPasswordConfirmation: boolean

		_oc_config?: {
			version: string
		}
	}

	const __TRANSLATIONS__: Array<{ locale: string, translations: { msgid: string, msgid_plural?: string, msgstr: string[] }[] }>
}

export {}
