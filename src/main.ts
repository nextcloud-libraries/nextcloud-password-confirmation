/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */
import Vue from 'vue'
import type { ComponentInstance } from 'vue'

import type { AxiosInstance } from '@nextcloud/axios'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'
import { generateUrl } from '@nextcloud/router'

import PasswordDialogVue from './components/PasswordDialog.vue'
import { DIALOG_ID, MODAL_CLASS, PwdConfirmationMode } from './globals'
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
	if (mode === PwdConfirmationMode.Strict) {
		return true
	}

	const serverTimeDiff = PAGE_LOAD_TIME - (window.nc_pageLoad * 1000)
	const timeSinceLogin = Date.now() - (serverTimeDiff + (window.nc_lastLogin * 1000))

	// If timeSinceLogin > 30 minutes and user backend allows password confirmation
	return (window.backendAllowsPasswordConfirmation && timeSinceLogin > 30 * 60 * 1000)
}

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`
 *
 * @return {Promise<void>} Promise that resolves when password is confirmed or not needed.
 *                         Rejects if password confirmation was cancelled
 *                         or confirmation is already in process.
 */
export const confirmPassword = (): Promise<void> => {
	if (!isPasswordConfirmationRequired(PwdConfirmationMode.Lax)) {
		return Promise.resolve()
	}

	return new Promise((resolve, reject) => {
		promptPassword(
			async (password: string) => {
				await _confirmPassword(password)
				resolve()
			},
			() => reject(new Error('Dialog closed')),
		)
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
 *
 */
function getDialog(): Vue {
	if (window._nc_password_confirmation_dialog === undefined) {
		console.debug('Prompting password form')

		const mountPoint = document.createElement('div')
		mountPoint.setAttribute('id', DIALOG_ID)

		const modals = Array.from(document.querySelectorAll(`.${MODAL_CLASS}`) as NodeListOf<HTMLElement>)
			// Filter out hidden modals
			.filter((modal) => modal.style.display !== 'none')

		const isModalMounted = Boolean(modals.length)

		if (isModalMounted) {
			const previousModal = modals[modals.length - 1]
			previousModal.prepend(mountPoint)
		} else {
			document.body.appendChild(mountPoint)
		}

		const DialogClass = Vue.extend(PasswordDialogVue as never)
		// Mount point element is replaced by the component
		window._nc_password_confirmation_dialog = (new DialogClass() as ComponentInstance).$mount(mountPoint)
	}

	return window._nc_password_confirmation_dialog
}

/**
 *
 * @param validate
 * @param close
 */
function promptPassword(
	validate: (password: string) => Promise<void>,
	close: () => void,
) {
	const dialog = getDialog()

	dialog.$props.validate = validate

	dialog.$on('confirmed', () => {
		dialog.$destroy()
		delete window._nc_password_confirmation_dialog
	})
	dialog.$on('close', () => {
		dialog.$destroy()
		close()
		delete window._nc_password_confirmation_dialog
	})
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

			return new Promise((resolve, reject) => {
				promptPassword(
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
					},
					() => {
						reject(new Error('Dialog closed'))
					},
				)
			})
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
