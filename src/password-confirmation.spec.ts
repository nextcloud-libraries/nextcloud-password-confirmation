/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from '@nextcloud/axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PwdConfirmationMode } from './globals.ts'

const mocks = vi.hoisted(() => ({
	axiosPost: vi.fn(),
	axiosRequest: vi.fn(),
	generateUrl: vi.fn(),
	getCurrentUser: vi.fn(),
	isConfirmationError: vi.fn(),
	isPasswordConfirmationRequired: vi.fn(),
	loggerDebug: vi.fn(),
	spawnDialog: vi.fn(),
}))

vi.mock('@nextcloud/auth', () => ({
	getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@nextcloud/axios', () => ({
	default: {
		post: mocks.axiosPost,
		request: mocks.axiosRequest,
	},
}))

vi.mock('@nextcloud/router', () => ({
	generateUrl: mocks.generateUrl,
}))

vi.mock('@nextcloud/vue/functions/dialog', () => ({
	spawnDialog: mocks.spawnDialog,
}))

vi.mock('./apiError.ts', () => ({
	isConfirmationError: mocks.isConfirmationError,
}))

vi.mock('./is-required.ts', () => ({
	isPasswordConfirmationRequired: mocks.isPasswordConfirmationRequired,
}))

vi.mock('./utils/logger.ts', () => ({
	logger: {
		debug: mocks.loggerDebug,
	},
}))

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason?: unknown) => void

	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve
		reject = promiseReject
	})

	return { promise, reject, resolve }
}

function createAxiosInstance() {
	const requestUse = vi.fn()
	const responseUse = vi.fn()

	return {
		axios: {
			interceptors: {
				request: { use: requestUse },
				response: { use: responseUse },
			},
		} as unknown as AxiosInstance,
		requestUse,
		responseUse,
	}
}

describe('password confirmation', () => {
	beforeEach(() => {
		// Reload the subject so module-scoped state, including
		// INTERCEPTOR_INITIALIZED, starts fresh in every test.
		vi.resetModules()
		vi.resetAllMocks()

		window.nc_lastLogin = 0
		mocks.generateUrl.mockReturnValue('/index.php/login/confirm')
	})

	test('does not prompt or make a request when lax confirmation is unnecessary', async () => {
		mocks.isPasswordConfirmationRequired.mockReturnValue(false)

		const { confirmPassword } = await import('./password-confirmation.ts')

		await expect(confirmPassword()).resolves.toBeUndefined()

		expect(mocks.spawnDialog).not.toHaveBeenCalled()
		expect(mocks.axiosPost).not.toHaveBeenCalled()
	})

	test('confirms a required lax password and updates the last-login timestamp', async () => {
		mocks.isPasswordConfirmationRequired.mockReturnValue(true)
		mocks.axiosPost.mockResolvedValue({
			data: { lastLogin: 1_700_000_000 },
		})

		const dialog = deferred<boolean>()
		mocks.spawnDialog.mockImplementation((
			_component: unknown,
			props: { validate: (password: string) => Promise<void> },
		) => {
			void props.validate('correct horse battery staple').then(() => dialog.resolve(true))
			return dialog.promise
		})

		const { confirmPassword } = await import('./password-confirmation.ts')

		await expect(confirmPassword()).resolves.toBeUndefined()

		expect(mocks.generateUrl).toHaveBeenCalledWith('/login/confirm')
		expect(mocks.axiosPost).toHaveBeenCalledWith(
			'/index.php/login/confirm',
			{ password: 'correct horse battery staple' },
		)
		expect(window.nc_lastLogin).toBe(1_700_000_000)
	})

	test('rejects when the confirmation dialog is closed', async () => {
		mocks.isPasswordConfirmationRequired.mockReturnValue(true)
		mocks.spawnDialog.mockResolvedValue(false)

		const { confirmPassword } = await import('./password-confirmation.ts')

		await expect(confirmPassword()).rejects.toThrow('Dialog closed')
	})

	test('shares one open dialog between concurrent confirmation requests', async () => {
		mocks.isPasswordConfirmationRequired.mockReturnValue(true)

		const dialog = deferred<boolean>()
		mocks.spawnDialog.mockReturnValue(dialog.promise)

		const { confirmPassword } = await import('./password-confirmation.ts')

		const firstConfirmation = confirmPassword()
		const secondConfirmation = confirmPassword()

		expect(mocks.spawnDialog).toHaveBeenCalledTimes(1)

		dialog.resolve(true)

		await expect(firstConfirmation).resolves.toBeUndefined()
		await expect(secondConfirmation).resolves.toBeUndefined()
	})

	test('leaves requests without a confirmation mode untouched', async () => {
		const { axios, requestUse } = createAxiosInstance()
		const { addPasswordConfirmationInterceptors } = await import('./password-confirmation.ts')

		addPasswordConfirmationInterceptors(axios)

		const requestInterceptor = requestUse.mock.calls[0][0] as (
			config: InternalAxiosRequestConfig,
		) => Promise<InternalAxiosRequestConfig>

		const config = { headers: {} } as InternalAxiosRequestConfig

		await expect(requestInterceptor(config)).resolves.toBe(config)

		expect(mocks.isPasswordConfirmationRequired).not.toHaveBeenCalled()
		expect(mocks.spawnDialog).not.toHaveBeenCalled()
	})

	test('adds strict-mode Basic Auth and waits for a successful response', async () => {
		mocks.isPasswordConfirmationRequired.mockReturnValue(true)
		mocks.getCurrentUser.mockReturnValue({ uid: 'alice' })

		const dialog = deferred<boolean>()
		mocks.spawnDialog.mockReturnValue(dialog.promise)

		const { axios, requestUse, responseUse } = createAxiosInstance()
		const { addPasswordConfirmationInterceptors } = await import('./password-confirmation.ts')

		addPasswordConfirmationInterceptors(axios)

		const requestInterceptor = requestUse.mock.calls[0][0] as (
			config: InternalAxiosRequestConfig,
		) => Promise<InternalAxiosRequestConfig>
		const responseInterceptor = responseUse.mock.calls[0][0] as (
			response: { config: InternalAxiosRequestConfig },
		) => Promise<{ config: InternalAxiosRequestConfig }>

		const config = {
			confirmPassword: PwdConfirmationMode.Strict,
			headers: {},
		} as InternalAxiosRequestConfig

		const pendingConfig = requestInterceptor(config)

		const dialogProps = mocks.spawnDialog.mock.calls[0][1] as {
			validate: (password: string) => Promise<void>
		}
		const validation = dialogProps.validate('secret')

		await expect(pendingConfig).resolves.toBe(config)
		expect(config.auth).toEqual({
			username: 'alice',
			password: 'secret',
		})

		const response = { config }

		await expect(responseInterceptor(response)).resolves.toBe(response)
		await expect(validation).resolves.toBeUndefined()

		dialog.resolve(true)
	})

	test('registers interceptor handlers only once on the same instance', async () => {
		const { axios, requestUse, responseUse } = createAxiosInstance()
		const { addPasswordConfirmationInterceptors } = await import('./password-confirmation.ts')

		addPasswordConfirmationInterceptors(axios)
		addPasswordConfirmationInterceptors(axios)

		expect(requestUse).toHaveBeenCalledTimes(1)
		expect(responseUse).toHaveBeenCalledTimes(1)
	})

	test('registers interceptors globally rather than per Axios instance', async () => {
		const firstInstance = createAxiosInstance()
		const secondInstance = createAxiosInstance()
		const { addPasswordConfirmationInterceptors } = await import('./password-confirmation.ts')

		// Characterization coverage for the current boolean guard. When this is
		// refactored to WeakSet<AxiosInstance>, update this expectation so both
		// instances receive one request and one response interceptor.
		addPasswordConfirmationInterceptors(firstInstance.axios)

		expect(firstInstance.requestUse).toHaveBeenCalledTimes(1)
		expect(firstInstance.responseUse).toHaveBeenCalledTimes(1)

		addPasswordConfirmationInterceptors(secondInstance.axios)

		expect(secondInstance.requestUse).toHaveBeenCalledTimes(0)
		expect(secondInstance.responseUse).toHaveBeenCalledTimes(0)
	})
})
