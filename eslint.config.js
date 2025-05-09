/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { recommendedLibrary } from '@nextcloud/eslint-config'

export default [
	...recommendedLibrary,

	{
		rules: {
			// TODO: migrate to nextcloud-logger to respect defined logging level
			'no-console': 'warn',
		},
	},
]
