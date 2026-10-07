/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from 'vitest'
import { PasswordConfirmationCancelledError } from './errors.ts'

test('PasswordConfirmationCancelledError', () => {
	const error = new PasswordConfirmationCancelledError()

	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(PasswordConfirmationCancelledError)
	expect(error.name).toBe('PasswordConfirmationCancelledError')
	expect(error.message).toBe('Password confirmation was cancelled')
})
