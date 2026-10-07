/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, test, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

vi.mock('@nextcloud/vue/components/NcDialog', () => ({
	default: defineComponent({
		setup(_props, { slots }) {
			return () => h('div', { class: 'dialog' }, slots.default?.())
		},
	}),
}))

vi.mock('@nextcloud/vue/components/NcPasswordField', () => ({
	default: defineComponent({
		setup(_props, { expose }) {
			expose({ focus: vi.fn(), select: vi.fn() })
			return () => h('input', { type: 'password' })
		},
	}),
}))

const { default: PasswordDialog } = await import('./PasswordDialog.vue')

/**
 * Mount the dialog and return the root element
 *
 * @param customText - The custom text prop
 */
async function mountDialog(customText?: string) {
	const element = document.createElement('div')
	document.body.appendChild(element)
	const app = createApp(PasswordDialog, { customText, validate: vi.fn() })
	app.mount(element)
	await nextTick()
	return element
}

afterEach(() => {
	document.body.innerHTML = ''
})

describe('PasswordDialog', () => {
	test('shows the default text', async () => {
		const element = await mountDialog()

		expect(element.textContent).toContain('This action needs authentication, please confirm it by entering your password.')
		expect(element.textContent).not.toContain('Please confirm your password to proceed.')
	})

	test('shows the custom text', async () => {
		const element = await mountDialog('Going to update following apps')

		expect(element.textContent).toContain('Going to update following apps')
		expect(element.textContent).toContain('Please confirm your password to proceed.')
		expect(element.textContent).not.toContain('This action needs authentication')
	})
})
