/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

export { PwdConfirmationMode } from './globals.ts'
export { isPasswordConfirmationRequired } from './is-required.ts'
export {
	addPasswordConfirmationInterceptors,
	confirmPassword,
} from './password-confirmation.ts'
