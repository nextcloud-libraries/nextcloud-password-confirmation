/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { translations } from './build/translations.ts'

export default defineConfig({
	plugins: [vue()],
	define: {
		__TRANSLATIONS__: JSON.stringify(translations),
	},
	test: {
		environment: 'happy-dom',
	},
})
