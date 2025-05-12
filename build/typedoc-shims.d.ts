/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module '*/PasswordDialog.vue' {
	import type { ComponentOptionsMixin, ComponentProvideOptions, DefineComponent, PublicProps } from 'vue'

	type DialogProps = {
		validate: (value: string) => Promise<void> | void
	}

	const component: DefineComponent<DialogProps, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {
		close: (a: boolean) => void
	}, string, PublicProps, Readonly<DialogProps> & Readonly<{
		onClose?: ((a: boolean) => void) | undefined
	}>, {}, {}, {}, {}, string, ComponentProvideOptions, false>
	export default component
}
