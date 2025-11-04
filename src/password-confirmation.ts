/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from '@nextcloud/axios'

import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { spawnDialog } from '@nextcloud/vue/functions/dialog'
import PasswordDialogVue from './components/PasswordDialog.vue'
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
 * @return Promise that resolves when password is confirmed or not needed.
 *                         Rejects if password confirmation was cancelled
 *                         or confirmation is already in process.
 */
export async function confirmPassword(): Promise<void> {
	if (!isPasswordConfirmationRequired(PwdConfirmationMode.Lax)) {
		return Promise.resolve()
	}

	await promptPassword(async (password: string) => {
		await _confirmPassword(password)
	})
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
 */
async function promptPassword(validate: (password: string) => Promise<void>) {
	_dialogCallback = validate
	if (!_passwordDialog) {
		_passwordDialog = spawnDialog(PasswordDialogVue, {
			validate(password: string) {
				return _dialogCallback(password)
			},
		})
	}

	const result = await _passwordDialog
	_passwordDialog = undefined
	if (!result) {
		throw new Error('Dialog closed')
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

		const { promise, resolve } = Promise.withResolvers<InternalAxiosRequestConfig>()
		promptPassword(async (password: string) => {
			switch (config.confirmPassword) {
				case PwdConfirmationMode.Lax:
					await _confirmPassword(password)
					resolve(config)
					break
				case PwdConfirmationMode.Strict:
					validatePromise = Promise.withResolvers<void>()
					config.auth = {
						username: getCurrentUser()?.uid ?? '',
						password,
					}
					logger.debug('Adding auth info to the request', { config })
					resolve(config)
					return validatePromise.promise
			}
		})

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

			// If the password confirmation failed, we trigger another request.
			// that will go through the password confirmation flow again.
			logger.debug('Triggering new request', { error })
			return axios.request(error.config)
		},
	)
}
