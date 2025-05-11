/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { expect, test } from 'vitest'

// too many regressions with L10n on libraries so lets be save
test('l10n', async () => {
	document.documentElement.lang = 'de'
	const { t } = await import('./l10n.ts')
	expect(t('Authentication required')).toMatchInlineSnapshot('"Authentifizierung erforderlich"')
})
