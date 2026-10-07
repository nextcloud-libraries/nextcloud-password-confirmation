/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * Error thrown when the user cancelled the password confirmation,
 * e.g. by closing the password dialog.
 */
export class PasswordConfirmationCancelledError extends Error {
	constructor() {
		super('Password confirmation was cancelled')
		this.name = 'PasswordConfirmationCancelledError'
	}
}
