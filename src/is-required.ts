/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { PwdConfirmationMode } from './globals.ts'

const PAGE_LOAD_TIME = Date.now()

/**
 * Check if password confirmation is required according to the last confirmation time.
 * Use as a replacement of deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`.
 * Not needed if `confirmPassword()` can be used, because it checks requirements itself.
 *
 * @param mode - The confirmation mode for which to check the requirement
 * @return Whether password confirmation is required or was confirmed recently
 */
export const isPasswordConfirmationRequired = (mode: PwdConfirmationMode): boolean => {
	if (!window.backendAllowsPasswordConfirmation) {
		return false
	}

	if (mode === PwdConfirmationMode.Strict) {
		return true
	}

	const serverTimeDiff = PAGE_LOAD_TIME - (window.nc_pageLoad * 1000)
	const timeSinceLogin = Date.now() - (serverTimeDiff + (window.nc_lastLogin * 1000))

	// If timeSinceLogin > 30 minutes
	return timeSinceLogin > 30 * 60 * 1000
}
