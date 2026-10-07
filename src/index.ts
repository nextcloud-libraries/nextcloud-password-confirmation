/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

export { PasswordConfirmationCancelledError } from './errors.ts'
export { PwdConfirmationMode } from './globals.ts'
export { isPasswordConfirmationRequired } from './is-required.ts'
export {
	addPasswordConfirmationInterceptors,
	confirmPassword,
	withStrictPasswordConfirmation,
} from './password-confirmation.ts'
