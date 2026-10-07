/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosInstance } from '@nextcloud/axios'
import type * as ErrorsModule from './errors.ts'
import type * as PasswordConfirmationModule from './password-confirmation.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PasswordConfirmationCancelledError } from './errors.ts'
import { PwdConfirmationMode } from './globals.ts'

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

const { confirmPassword, withStrictPasswordConfirmation } = await import('./password-confirmation.ts')

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

const auth = { username: 'admin', password: 'secret' }

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

describe('withStrictPasswordConfirmation', () => {
	test('runs the callback with the unmodified client if no confirmation is required', async () => {
		window.backendAllowsPasswordConfirmation = false
		const client = createAxiosMock()
		const callback = vi.fn(async () => 'result')

		await expect(withStrictPasswordConfirmation(callback, { axios: client as unknown as AxiosInstance })).resolves.toBe('result')
		expect(callback).toHaveBeenCalledWith(client)
		expect(spawnDialogMock).not.toHaveBeenCalled()
	})

	test('uses @nextcloud/axios by default', async () => {
		mockDialogInput('secret')

		await withStrictPasswordConfirmation(async (client) => {
			await client.get('/a')
		})
		expect(axiosMock.get).toHaveBeenCalledWith('/a', { auth, confirmPassword: undefined })
	})

	test('prompts once with the custom text and returns the callback value', async () => {
		mockDialogInput('secret')
		const client = createAxiosMock()

		const result = await withStrictPasswordConfirmation(async (axios) => {
			await axios.put('/a', { a: 1 })
			await axios.get('/b')
			return 'result'
		}, { text: 'Going to update apps', axios: client as unknown as AxiosInstance })

		expect(result).toBe('result')
		expect(spawnDialogMock).toHaveBeenCalledOnce()
		expect(spawnDialogMock.mock.calls[0]![1].customText).toBe('Going to update apps')
		expect(axiosMock.post).toHaveBeenCalledOnce()
		expect(axiosMock.post).toHaveBeenCalledWith('/index.php/login/confirm', { password: 'secret' })
		expect(client.put).toHaveBeenCalledWith('/a', { a: 1 }, { auth, confirmPassword: undefined })
		expect(client.get).toHaveBeenCalledWith('/b', { auth, confirmPassword: undefined })
	})

	test('only runs the callback once the password was validated', async () => {
		mockDialogInput('wrong', 'secret')
		axiosMock.post.mockImplementation(async (_url, { password }) => {
			if (password !== 'secret') {
				throw new Error('Wrong password')
			}
			return { data: { lastLogin: 1234 } }
		})
		const client = createAxiosMock()
		const callback = vi.fn(async (axios: AxiosInstance) => {
			await axios.get('/a')
		})

		await withStrictPasswordConfirmation(callback, { axios: client as unknown as AxiosInstance })
		expect(axiosMock.post).toHaveBeenCalledTimes(2)
		expect(callback).toHaveBeenCalledOnce()
		expect(client.get).toHaveBeenCalledWith('/a', { auth, confirmPassword: undefined })
	})

	test('rejects with PasswordConfirmationCancelledError and does not run the callback if cancelled', async () => {
		spawnDialogMock.mockResolvedValue(false)
		const callback = vi.fn()

		await expect(withStrictPasswordConfirmation(callback)).rejects.toThrow(PasswordConfirmationCancelledError)
		expect(callback).not.toHaveBeenCalled()
	})

	test('propagates errors of the callback', async () => {
		mockDialogInput('secret')
		const error = new Error('Request failed')

		await expect(withStrictPasswordConfirmation(async () => {
			throw error
		})).rejects.toBe(error)
	})

	describe('authenticated client', () => {
		/**
		 * Get the authenticated client passed to the callback
		 *
		 * @param client - The base client
		 */
		async function getAuthenticatedClient(client: ReturnType<typeof createAxiosMock>): Promise<AxiosInstance> {
			mockDialogInput('secret')
			return withStrictPasswordConfirmation(async (axios) => axios, { axios: client as unknown as AxiosInstance })
		}

		test.each(['get', 'delete', 'head', 'options'] as const)('adds auth to %s requests', async (method) => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			await authenticated[method]('/url', { headers: { a: 'b' }, confirmPassword: PwdConfirmationMode.Strict })
			expect(client[method]).toHaveBeenCalledWith('/url', { headers: { a: 'b' }, auth, confirmPassword: undefined })
		})

		test.each(['post', 'put', 'patch', 'postForm', 'putForm', 'patchForm'] as const)('adds auth to %s requests', async (method) => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			await authenticated[method]('/url', { a: 1 }, { headers: { a: 'b' }, confirmPassword: PwdConfirmationMode.Strict })
			expect(client[method]).toHaveBeenCalledWith('/url', { a: 1 }, { headers: { a: 'b' }, auth, confirmPassword: undefined })
		})

		test('adds auth to requests without config', async () => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			await authenticated.get('/url')
			await authenticated.post('/url', { a: 1 })
			expect(client.get).toHaveBeenCalledWith('/url', { auth, confirmPassword: undefined })
			expect(client.post).toHaveBeenCalledWith('/url', { a: 1 }, { auth, confirmPassword: undefined })
		})

		test('adds auth to generic requests', async () => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			await authenticated.request({ url: '/url', method: 'PUT' })
			expect(client.request).toHaveBeenCalledWith({ url: '/url', method: 'PUT', auth, confirmPassword: undefined })
		})

		test('adds auth when calling the client directly', async () => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			await authenticated({ url: '/url', method: 'PUT' })
			await authenticated('/url', { method: 'DELETE' })
			expect(client).toHaveBeenCalledWith({ url: '/url', method: 'PUT', auth, confirmPassword: undefined })
			expect(client).toHaveBeenCalledWith('/url', { method: 'DELETE', auth, confirmPassword: undefined })
		})

		test('passes through other properties', async () => {
			const client = createAxiosMock()
			const authenticated = await getAuthenticatedClient(client)

			expect(authenticated.defaults).toBe(client.defaults)
		})

		test('does not modify the original client', async () => {
			const client = createAxiosMock()
			const { get } = client
			await getAuthenticatedClient(client)

			expect(client.get).toBe(get)
		})
	})
})

describe('addPasswordConfirmationInterceptors', () => {
	let module: typeof PasswordConfirmationModule
	let errors: typeof ErrorsModule
	let client: ReturnType<typeof createAxiosMock>
	let onRequest: (config: object) => Promise<object>
	let onResponse: (response: object) => object
	let onResponseError: (error: object) => unknown

	beforeEach(async () => {
		// reset the module state (initialized interceptors and pending validation)
		vi.resetModules()
		module = await import('./password-confirmation.ts')
		errors = await import('./errors.ts')

		client = createAxiosMock()
		module.addPasswordConfirmationInterceptors(client as unknown as AxiosInstance)
		onRequest = client.interceptors.request.use.mock.calls[0]![0]
		;[onResponse, onResponseError] = client.interceptors.response.use.mock.calls[0]!
	})

	/**
	 * Create an axios error for a failed strict request
	 *
	 * @param config - The request config
	 * @param confirmationError - Whether the error is caused by a wrong password
	 */
	function createError(config: object, confirmationError: boolean) {
		return {
			isAxiosError: true,
			config,
			response: {
				status: 403,
				headers: confirmationError ? { 'x-nextcloud-password-confirmation': 'true' } : {},
			},
		}
	}

	test('only adds the interceptors once', () => {
		module.addPasswordConfirmationInterceptors(client as unknown as AxiosInstance)
		expect(client.interceptors.request.use).toHaveBeenCalledOnce()
		expect(client.interceptors.response.use).toHaveBeenCalledOnce()
	})

	test('ignores requests without confirmPassword', async () => {
		const config = { url: '/url' }

		await expect(onRequest(config)).resolves.toBe(config)
		expect(spawnDialogMock).not.toHaveBeenCalled()
	})

	test('ignores requests if no confirmation is required', async () => {
		window.backendAllowsPasswordConfirmation = false
		const config = { url: '/url', confirmPassword: PwdConfirmationMode.Strict }

		await expect(onRequest(config)).resolves.toBe(config)
		expect(spawnDialogMock).not.toHaveBeenCalled()
	})

	describe('lax mode', () => {
		test('confirms the password before sending the request', async () => {
			mockDialogInput('secret')
			const config = { url: '/url', confirmPassword: PwdConfirmationMode.Lax }

			await expect(onRequest(config)).resolves.toEqual({ url: '/url', confirmPassword: PwdConfirmationMode.Lax })
			expect(axiosMock.post).toHaveBeenCalledWith('/index.php/login/confirm', { password: 'secret' })
			expect(window.nc_lastLogin).toBe(1234)
		})

		test('rejects with PasswordConfirmationCancelledError if cancelled', async () => {
			spawnDialogMock.mockResolvedValue(false)

			await expect(onRequest({ confirmPassword: PwdConfirmationMode.Lax })).rejects.toThrow(errors.PasswordConfirmationCancelledError)
		})
	})

	describe('strict mode', () => {
		test('ignores responses of other requests', () => {
			const response = { config: { confirmPassword: PwdConfirmationMode.Lax } }
			expect(onResponse(response)).toBe(response)
		})

		test('ignores strict responses without pending confirmation', async () => {
			const response = { config: { confirmPassword: PwdConfirmationMode.Strict } }
			expect(onResponse(response)).toBe(response)

			const error = createError(response.config, true)
			await expect(async () => onResponseError(error)).rejects.toBe(error)
		})

		test('rethrows errors of other requests', async () => {
			const error = createError({ confirmPassword: PwdConfirmationMode.Lax }, true)
			await expect(async () => onResponseError(error)).rejects.toBe(error)
		})

		test('adds the password to the request and keeps the dialog open until the response', async () => {
			mockDialogInput('secret')
			const config = await onRequest({ url: '/url', confirmPassword: PwdConfirmationMode.Strict })

			expect(config).toEqual({ url: '/url', confirmPassword: PwdConfirmationMode.Strict, auth })
			expect(axiosMock.post).not.toHaveBeenCalled()

			let closed = false
			dialogResult!.then(() => {
				closed = true
			})
			await Promise.resolve()
			expect(closed).toBe(false)

			const now = Date.now() / 1000
			const response = { config }
			expect(onResponse(response)).toBe(response)
			await expect(dialogResult).resolves.toBe(true)
			expect(window.nc_lastLogin).toBeGreaterThanOrEqual(now)
		})

		test('retries the request if the password was wrong', async () => {
			mockDialogInput('wrong')
			const config = await onRequest({ url: '/url', confirmPassword: PwdConfirmationMode.Strict })
			client.request.mockResolvedValue('retried')

			await expect(onResponseError(createError(config, true))).resolves.toBe('retried')
			expect(client.request).toHaveBeenCalledWith(config)
			// the validation failed, so the dialog did not accept the password
			await expect(dialogResult).resolves.toBe(false)
		})

		test('rethrows other errors', async () => {
			mockDialogInput('secret')
			const config = await onRequest({ url: '/url', confirmPassword: PwdConfirmationMode.Strict })
			const error = createError(config, false)

			await expect(async () => onResponseError(error)).rejects.toBe(error)
			expect(client.request).not.toHaveBeenCalled()
		})

		test('rejects with PasswordConfirmationCancelledError if cancelled', async () => {
			spawnDialogMock.mockResolvedValue(false)

			await expect(onRequest({ confirmPassword: PwdConfirmationMode.Strict })).rejects.toThrow(errors.PasswordConfirmationCancelledError)
		})
	})
})
