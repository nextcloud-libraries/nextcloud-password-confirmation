/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { po as poParser } from 'gettext-parser'
import { readdirSync, readFileSync } from 'node:fs'

export const translations = readdirSync('./l10n')
	.filter((name) => name !== 'messages.pot' && name.endsWith('.pot'))
	.map((file) => {
		const path = `./l10n/${file}`
		const locale = file.slice(0, -'.pot'.length)

		const po = readFileSync(path)
		const json = poParser.parse(po)

		// Compress translations by removing everything not needed
		const translations = Object.values(json.translations[''])
			.filter((value) => value.msgid !== '')
			.map((value) => ({
				msgid: value.msgid,
				msgid_plural: value.msgid_plural,
				msgstr: value.msgstr,
			}))

		return { locale, translations }
	})
