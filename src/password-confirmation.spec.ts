/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PasswordConfirmationCancelledError } from './errors.ts'

const spawnDialogMock = vi.hoisted(() => vi.fn())
const axiosMock = vi.hoisted(() => createAxiosMock())

vi.mock('@nextcloud/vue/functions/dialog', () => ({ spawnDialog: spawnDialogMock }))
vi.mock('@nextcloud/axios', () => ({
	default: axiosMock,
	isAxiosError: (error: { isAxiosError?: boolean }) => error?.isAxiosError === true,
}))
vi.mock('@nextcloud/auth', () => ({ getCurrentUser: () => ({ uid: 'admin' }) }))
vi.mock('@nextcloud/router', () => ({ generateUrl: (url: string) => `/index.php${url}` }))
vi.mock('./components/PasswordDialog.vue', () => ({ default: {} }))

const { confirmPassword } = await import('./password-confirmation.ts')

/**
 * Create a callable mock of an axios instance
 */
function createAxiosMock() {
	return Object.assign(vi.fn(), {
		defaults: { baseURL: '/base' },
		request: vi.fn(),
		get: vi.fn(),
		delete: vi.fn(),
		head: vi.fn(),
		options: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		patch: vi.fn(),
		postForm: vi.fn(),
		putForm: vi.fn(),
		patchForm: vi.fn(),
		interceptors: {
			request: { use: vi.fn() },
			response: { use: vi.fn() },
		},
	})
}

let dialogResult: Promise<boolean> | undefined

/**
 * Let the mocked dialog "enter" the given passwords one after the other,
 * until one is accepted by the validate callback.
 *
 * @param passwords - The passwords to enter
 */
function mockDialogInput(...passwords: string[]) {
	spawnDialogMock.mockImplementation((_component, { validate }) => {
		dialogResult = runDialog(validate, passwords)
		return dialogResult
	})
}

/**
 * Simulate the user entering the passwords in the dialog.
 *
 * @param validate - The validate callback of the dialog
 * @param passwords - The passwords to enter
 * @return Whether a password was accepted
 */
async function runDialog(validate: (password: string) => Promise<void>, passwords: string[]): Promise<boolean> {
	for (const password of passwords) {
		try {
			await validate(password)
			return true
		} catch {
			// wrong password - try the next one
		}
	}
	return false
}

beforeEach(() => {
	vi.clearAllMocks()
	window.backendAllowsPasswordConfirmation = true
	window.nc_pageLoad = Date.now() / 1000
	window.nc_lastLogin = 0
	axiosMock.post.mockResolvedValue({ data: { lastLogin: 1234 } })
})

describe('confirmPassword', () => {
	test('does nothing if no confirmation is required', async () => {
		window.backendAllowsPasswordConfirmation = false

		await confirmPassword()
		expect(spawnDialogMock).not.toHaveBeenCalled()
	})

	test('confirms the password', async () => {
		mockDialogInput('secret')

		await confirmPassword()
		expect(spawnDialogMock).toHaveBeenCalledOnce()
		expect(spawnDialogMock.mock.calls[0]![1].customText).toBeUndefined()
		expect(axiosMock.post).toHaveBeenCalledWith('/index.php/login/confirm', { password: 'secret' })
		expect(window.nc_lastLogin).toBe(1234)
	})

	test('passes the custom text to the dialog', async () => {
		mockDialogInput('secret')

		await confirmPassword({ text: 'Custom text' })
		expect(spawnDialogMock.mock.calls[0]![1].customText).toBe('Custom text')
	})

	test('rejects with PasswordConfirmationCancelledError if cancelled', async () => {
		spawnDialogMock.mockResolvedValue(false)

		await expect(confirmPassword()).rejects.toThrow(PasswordConfirmationCancelledError)
	})
})
