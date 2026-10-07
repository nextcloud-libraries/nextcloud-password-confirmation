/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosBasicCredentials, AxiosInstance, InternalAxiosRequestConfig } from '@nextcloud/axios'

import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { spawnDialog } from '@nextcloud/vue/functions/dialog'
import PasswordDialogVue from './components/PasswordDialog.vue'
import { isConfirmationError } from './apiError.ts'
import { PasswordConfirmationCancelledError } from './errors.ts'
import { PwdConfirmationMode } from './globals.ts'
import { isPasswordConfirmationRequired } from './is-required.ts'
import { logger } from './utils/logger.ts'

declare module '@nextcloud/axios' {
	export interface AxiosRequestConfig {
		/** To use this property you need to use the addPasswordConfirmationInterceptors function. */
		confirmPassword?: PwdConfirmationMode
	}
}

let INTERCEPTOR_INITIALIZED = false

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`
 *
 * @param options - Additional options
 * @param options.text - Custom text to show in the dialog, instead of the default text
 * @return Promise that resolves when password is confirmed or not needed.
 *                         Rejects with `PasswordConfirmationCancelledError` if password confirmation was cancelled.
 */
export async function confirmPassword(options: { text?: string } = {}): Promise<void> {
	if (!isPasswordConfirmationRequired(PwdConfirmationMode.Lax)) {
		return Promise.resolve()
	}

	await promptConfirmedPassword(options.text)
}

/**
 * Prompt the user for the password and validate it using the confirmation endpoint.
 *
 * @param text - Custom text to show in the dialog, instead of the default text
 * @return The confirmed password
 */
async function promptConfirmedPassword(text?: string): Promise<string> {
	let password = ''
	await promptPassword(async (value: string) => {
		await _confirmPassword(value)
		password = value
	}, text)
	return password
}

/**
 * Get the Basic Auth credentials of the current user.
 *
 * @param password - The password of the current user
 */
function getBasicAuth(password: string): AxiosBasicCredentials {
	return {
		username: getCurrentUser()?.uid ?? '',
		password,
	}
}

/**
 * @param password - Password to be confirmed
 */
async function _confirmPassword(password: string) {
	logger.debug('Confirming password')

	const url = generateUrl('/login/confirm')
	const { data } = await axios.post(url, { password })
	window.nc_lastLogin = data.lastLogin

	logger.debug('Password confirmed')
}

// Internal state to track the dialog
let _passwordDialog: Promise<boolean> | undefined
let _dialogCallback: (s: string) => Promise<void>

/**
 * Spawn a dialog to prompt the password.
 *
 * @param validate Is called to validate the user's password
 * @param customText Optional custom text to show in the dialog, instead of the default text
 */
async function promptPassword(validate: (password: string) => Promise<void>, customText?: string): Promise<void> {
	_dialogCallback = validate
	if (!_passwordDialog) {
		_passwordDialog = spawnDialog(PasswordDialogVue, {
			customText,
			validate(password: string) {
				return _dialogCallback(password)
			},
		})
	}

	const result = await _passwordDialog
	_passwordDialog = undefined
	if (!result) {
		throw new PasswordConfirmationCancelledError()
	}
}

/**
 * Add axios interceptors to an axios instance that will ask for
 * password confirmation to add it as Basic Auth for every requests.
 *
 * @param axios - The axios instance to add intercepters to
 */
export function addPasswordConfirmationInterceptors(axios: AxiosInstance): void {
	if (INTERCEPTOR_INITIALIZED) {
		return
	}

	INTERCEPTOR_INITIALIZED = true

	let validatePromise: PromiseWithResolvers<void> | undefined

	axios.interceptors.request.use(async (config) => {
		if (config.confirmPassword === undefined) {
			return config
		}

		if (!isPasswordConfirmationRequired(config.confirmPassword)) {
			return config
		}

		if (config.confirmPassword === PwdConfirmationMode.Lax) {
			await promptConfirmedPassword()
			return config
		}

		// In strict mode the request itself validates the password,
		// so keep the dialog open until the response interceptor resolves or rejects the validation.
		const { promise, resolve, reject } = Promise.withResolvers<InternalAxiosRequestConfig>()
		promptPassword(async (password: string) => {
			validatePromise = Promise.withResolvers<void>()
			config.auth = getBasicAuth(password)
			logger.debug('Adding auth info to the request', { config })
			resolve(config)
			return validatePromise.promise
		}).catch(reject)

		return promise
	})

	axios.interceptors.response.use(
		(response) => {
			if (response.config.confirmPassword !== PwdConfirmationMode.Strict) {
				return response
			}

			if (validatePromise === undefined) {
				logger.debug('Password confirmation not required', { response })
				return response
			}

			logger.debug('Password confirmation succeeded', { response })
			window.nc_lastLogin = Date.now() / 1000
			validatePromise.resolve()

			return response
		},
		(error) => {
			if (error.config?.confirmPassword !== PwdConfirmationMode.Strict) {
				throw error
			}

			if (validatePromise === undefined) {
				logger.debug('Password confirmation not required', { error })
				throw error
			}

			logger.debug('Password confirmation failed', { error })
			validatePromise.reject(error)
			if (isConfirmationError(error)) {
				// If the password confirmation failed, we trigger another request.
				// that will go through the password confirmation flow again.
				logger.debug('Triggering new request', { error })
				return axios.request(error.config)
			}
			throw error
		},
	)
}
