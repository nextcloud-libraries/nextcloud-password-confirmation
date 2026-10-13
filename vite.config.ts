/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { createLibConfig } from '@nextcloud/vite-config'
import { resolve } from 'node:path'
import { translations } from './build/translations.ts'

export default createLibConfig({
	index: resolve(import.meta.dirname, 'src/index.ts'),
}, {
	// Rename CSS chunk
	assetFileNames: (chunkInfo) => chunkInfo.names.some((name) => name.endsWith('.css')) ? 'style.css' : undefined,
	replace: {
		__TRANSLATIONS__: `;${JSON.stringify(translations)}`,
	},
	DtsPluginOptions: {
		vue: true,
		parallel: false,
	},
})
