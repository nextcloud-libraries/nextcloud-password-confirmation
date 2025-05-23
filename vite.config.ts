/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { createLibConfig } from '@nextcloud/vite-config'
import { po as poParser } from 'gettext-parser'
import * as fs from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const translations = fs
	.readdirSync('./l10n')
	.filter((name) => name !== 'messages.pot' && name.endsWith('.pot'))
	.map((file) => {
		const path = `./l10n/${file}`
		const locale = file.slice(0, -'.pot'.length)

		const po = fs.readFileSync(path)
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

export default createLibConfig({
	index: resolve(__dirname, 'src/index.ts'),
}, {
	// Rename CSS chunk
	assetFileNames: (chunkInfo) => chunkInfo.name?.endsWith('.css') ? 'style.css' : undefined,
	replace: {
		__TRANSLATIONS__: `;${JSON.stringify(translations)}`,
	},
	DTSPluginOptions: {
		rollupTypes: true,
	},
	config: defineConfig({
		test: {
			environment: 'happy-dom',
		},
	}),
})
