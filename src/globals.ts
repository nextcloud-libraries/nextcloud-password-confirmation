/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

export const DIALOG_ID = 'password-confirmation-dialog'
export const MODAL_CLASS = 'modal-mask' // NcModal component root class https://github.com/nextcloud/nextcloud-vue/blob/v7.0.0-beta.2/src/components/NcModal/NcModal.vue

export enum PwdConfirmationMode {
	Lax = 'lax',
	Strict = 'strict',
}

declare module '@nextcloud/axios' {
	export interface AxiosRequestConfig {
		/** To use this property you need to use the addPasswordConfirmationInterceptors function. */
		confirmPassword?: PwdConfirmationMode;
	}
}

declare global {
	interface Window {
		_nc_password_confirmation_dialog?: Vue
	}
}
