/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * Lax: Confirm password if needed.
 * Strict: Confirm in the request.
 */
export enum PwdConfirmationMode {
	Lax = 'lax',
	Strict = 'strict',
}
