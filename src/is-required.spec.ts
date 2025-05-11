/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { PwdConfirmationMode } from './globals.ts'

const NOW = new Date(2025, 0, 1).getTime()

function mockWindow(backend: boolean) {
	window.backendAllowsPasswordConfirmation = backend
	window.nc_lastLogin = Date.now() / 1000
	window.nc_pageLoad = Date.now() / 1000
}

beforeAll(() => {
	vi.useFakeTimers({ now: NOW })
})

describe('is password confirmation required', () => {
	beforeEach(() => vi.resetModules())

	test('strict mode', async () => {
		const { isPasswordConfirmationRequired } = await import('./is-required.ts')
		mockWindow(true)

		expect(isPasswordConfirmationRequired(PwdConfirmationMode.Strict)).toBe(true)
	})

	test('strict mode - no backend support', async () => {
		const { isPasswordConfirmationRequired } = await import('./is-required.ts')
		mockWindow(false)

		expect(isPasswordConfirmationRequired(PwdConfirmationMode.Strict)).toBe(false)
	})

	test('lax mode - recently logged in', async () => {
		const { isPasswordConfirmationRequired } = await import('./is-required.ts')
		mockWindow(true)

		expect(isPasswordConfirmationRequired(PwdConfirmationMode.Lax)).toBe(false)
	})

	test('lax mode - login long ago', async () => {
		const { isPasswordConfirmationRequired } = await import('./is-required.ts')
		mockWindow(true)

		// 35 minutes since login
		vi.setSystemTime(NOW + 35 * 60 * 1000)

		expect(isPasswordConfirmationRequired(PwdConfirmationMode.Lax)).toBe(true)
	})

	test('lax mode - no backend support', async () => {
		const { isPasswordConfirmationRequired } = await import('./is-required.ts')
		mockWindow(false)

		// 35 minutes since login
		vi.setSystemTime(NOW + 35 * 60 * 1000)

		expect(isPasswordConfirmationRequired(PwdConfirmationMode.Lax)).toBe(false)
	})
})
