/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from '@nextcloud/axios'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'
import { generateUrl } from '@nextcloud/router'
import { spawnDialog } from '@nextcloud/vue/functions/dialog'

import PasswordDialogVue from './components/PasswordDialog.vue'
import { PwdConfirmationMode } from './globals'
export { PwdConfirmationMode } from './globals'

const PAGE_LOAD_TIME = Date.now()
let INTERCEPTOR_INITIALIZED = false

/**
 * Check if password confirmation is required according to the last confirmation time.
 * Use as a replacement of deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`.
 * Not needed if `confirmPassword()` can be used, because it checks requirements itself.
 *
 * @param mode
 * @return {boolean} Whether password confirmation is required or was confirmed recently
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

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`
 *
 * @return {Promise<void>} Promise that resolves when password is confirmed or not needed.
 *                         Rejects if password confirmation was cancelled
 *                         or confirmation is already in process.
 */
export const confirmPassword = async (): Promise<void> => {
	if (!isPasswordConfirmationRequired(PwdConfirmationMode.Lax)) {
		return Promise.resolve()
	}

	await promptPassword(async (password: string) => {
		await _confirmPassword(password)
	})
}

/**
 *
 * @param password
 */
async function _confirmPassword(password: string) {
	console.debug('Confirming password')

	const url = generateUrl('/login/confirm')
	const { data } = await axios.post(url, { password })
	window.nc_lastLogin = data.lastLogin

	console.debug('Password confirmed')
}

/**
 * Spawn a dialog to prompt the password.
 *
 * @param validate Is called to validate the user's password
 */
async function promptPassword(validate: (password: string) => Promise<void>) {
	const result = await spawnDialog(PasswordDialogVue, { validate })
	if (!result) {
		throw new Error('Dialog closed')
	}
}

/**
 * Add axios interceptors to an axios instance that will ask for
 * password confirmation to add it as Basic Auth for every requests.
 * @param axios
 */
export function addPasswordConfirmationInterceptors(axios: AxiosInstance): void {
	if (INTERCEPTOR_INITIALIZED) {
		return
	}

	INTERCEPTOR_INITIALIZED = true

	let validatePromise: PromiseWithResolvers<void>

	axios.interceptors.request.use(
		async (config) => {
			if (config.confirmPassword === undefined) {
				return config
			}

			if (!isPasswordConfirmationRequired(config.confirmPassword)) {
				return config
			}

			const { promise, resolve } = Promise.withResolvers<InternalAxiosRequestConfig>()
			await promptPassword(
				async (password: string) => {
					switch (config.confirmPassword) {
					case PwdConfirmationMode.Lax: {
						await _confirmPassword(password)
						resolve(config)
						return Promise.resolve()
					}
					case PwdConfirmationMode.Strict:
						console.debug('Adding auth info to the request', { config })
						config.auth = {
							username: getCurrentUser()?.uid ?? '',
							password,
						}
						resolve(config)

						validatePromise = Promise.withResolvers<void>()
						return validatePromise.promise
					}
				}
			)

			return promise
		},
	)

	axios.interceptors.response.use(
		(response) => {
			if (response.config.confirmPassword !== PwdConfirmationMode.Strict) {
				return response
			}

			console.debug('Password confirmation succeeded', { response })
			window.nc_lastLogin = Date.now() / 1000
			validatePromise.resolve()

			return response
		},
		(error) => {
			if (error.config?.confirmPassword !== PwdConfirmationMode.Strict) {
				throw error
			}

			console.debug('Password confirmation failed', { error })
			validatePromise.reject(error)

			if (!(error.response?.status === 403 && error.response.data.message === 'Password confirmation is required')) {
				throw error
			}

			// If the password confirmation failed, we trigger another request.
			// that will go through the password confirmation flow again.
			console.debug('Triggering new request', { error })
			return axios.request(error.config)
		},
	)
}
