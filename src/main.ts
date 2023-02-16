import Vue from 'vue'
import DialogComponent from './components/Dialog.vue'
import { DIALOG_ID, MODAL_CLASS } from './globals'
import { t } from './utils/l10n'

import type { ComponentInstance } from 'vue'

const PAGE_LOAD_TIME = Date.now()

const isPasswordConfirmationRequired = (): boolean => {
	const serverTimeDiff = PAGE_LOAD_TIME - (window.nc_pageLoad * 1000)
	const timeSinceLogin = Date.now() - (serverTimeDiff + (window.nc_lastLogin * 1000))

	// If timeSinceLogin > 30 minutes and user backend allows password confirmation
	return (window.backendAllowsPasswordConfirmation && timeSinceLogin > 30 * 60 * 1000)
}

export const confirmPassword = (): Promise<void> => {
	const isDialogMounted = Boolean(document.getElementById(DIALOG_ID))
	if (isDialogMounted) {
		return Promise.reject(new Error(t('Password confirmation dialog already mounted')))
	}

	if (!isPasswordConfirmationRequired()) {
		return Promise.resolve()
	}

	const mountPoint = document.createElement('div')
	mountPoint.setAttribute('id', DIALOG_ID)

	const modals = document.querySelectorAll(`.${MODAL_CLASS}`)
	const isModalMounted = Boolean(modals.length)

	if (isModalMounted) {
		const previousModal = modals[modals.length - 1]
		previousModal.prepend(mountPoint)
	} else {
		document.body.prepend(mountPoint)
	}

	const DialogClass = Vue.extend(DialogComponent)
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
