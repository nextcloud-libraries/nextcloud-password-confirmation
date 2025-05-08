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

declare module '@nextcloud/axios' {
	export interface AxiosRequestConfig {
		/** To use this property you need to use the addPasswordConfirmationInterceptors function. */
		confirmPassword?: PwdConfirmationMode
	}
}
