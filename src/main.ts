import Vue from 'vue'
import PasswordDialogVue from './components/PasswordDialog.vue'
import { DIALOG_ID, MODAL_CLASS } from './globals'

import type { ComponentInstance } from 'vue'

const PAGE_LOAD_TIME = Date.now()

/**
 * Check if password confirmation is required according to the last confirmation time.
 * Use as a replacement of deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`.
 * Not needed if `confirmPassword()` can be used, because it checks requirements itself.
 *
 * @return {boolean} Whether password confirmation is required or was confirmed recently
 */
export const isPasswordConfirmationRequired = (): boolean => {
	const serverTimeDiff = PAGE_LOAD_TIME - (window.nc_pageLoad * 1000)
	const timeSinceLogin = Date.now() - (serverTimeDiff + (window.nc_lastLogin * 1000))

	// If timeSinceLogin > 30 minutes and user backend allows password confirmation
	return (window.backendAllowsPasswordConfirmation && timeSinceLogin > 30 * 60 * 1000)
}

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`
 *
 * @return {Promise<void>} Promise that resolves when password is confirmed or not needded.
 *                         Rejects if password confirmation was cancelled
 *                         or confirmation is already in process.
 */
export const confirmPassword = (): Promise<void> => {
	const isDialogMounted = Boolean(document.getElementById(DIALOG_ID))
	if (isDialogMounted) {
		return Promise.reject(new Error('Password confirmation dialog already mounted'))
	}

	if (!isPasswordConfirmationRequired()) {
		return Promise.resolve()
	}

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

	const DialogClass = Vue.extend(PasswordDialogVue)
	// Mount point element is replaced by the component
	const dialog = (new DialogClass() as ComponentInstance).$mount(mountPoint)

	return new Promise((resolve, reject) => {
		dialog.$on('confirmed', () => {
			dialog.$destroy()
			resolve()
		})
		dialog.$on('close', () => {
			dialog.$destroy()
			reject(new Error('Dialog closed'))
		})
	})
}
