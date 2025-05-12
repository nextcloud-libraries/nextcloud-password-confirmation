/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { expect, test, vi } from 'vitest'
import { logger } from './logger.ts'

// we only need to test the app is correct - the rest is part of the logger library
test('logger', () => {
	const spy = vi.spyOn(console, 'warn')
	spy.mockImplementation(() => {})

	logger.warn('test')
	expect(spy).toBeCalled()
	expect(spy.mock.calls[0][1]).toHaveProperty('app', '@nextcloud/password-confirmation')
})
