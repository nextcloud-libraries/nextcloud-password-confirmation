/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

const isAxiosErrorMock = vi.fn()
const loggerDebugMock = vi.fn()

vi.mock('@nextcloud/axios', () => ({
	isAxiosError: isAxiosErrorMock,
}))

vi.mock('./utils/logger.ts', () => ({
	logger: {
		debug: loggerDebugMock,
	},
}))

describe('isConfirmationError', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.clearAllMocks()
		window._oc_config = undefined
	})

	async function importSubject(version?: string) {
		window._oc_config = version ? { version } : undefined
		return import('./apiError.ts')
	}

	test('returns false for non axios errors', async () => {
		const { isConfirmationError } = await importSubject('33.0.0')
		isAxiosErrorMock.mockReturnValue(false)

		expect(isConfirmationError(new Error('nope'))).toBe(false)
		expect(loggerDebugMock).not.toBeCalled()
	})

	test('returns false when axios error has no response', async () => {
		const { isConfirmationError } = await importSubject('33.0.0')
		isAxiosErrorMock.mockReturnValue(true)

		expect(isConfirmationError({ response: undefined })).toBe(false)
		expect(loggerDebugMock).not.toBeCalled()
	})

	test('uses header based detection on Nextcloud 32', async () => {
		const { isConfirmationError } = await importSubject('32.0.7')
		isAxiosErrorMock.mockReturnValue(true)

		const error = {
			response: {
				headers: {
					'x-nextcloud-password-confirmation': 'true',
				},
				status: 403,
			},
		}

		expect(isConfirmationError(error)).toBe(true)
		expect(loggerDebugMock).toBeCalledWith('Handle modern confirmation error based on header', { hasConfirmationHeader: true })
	})

	test('returns false if header is not present on Nextcloud 32', async () => {
		const { isConfirmationError } = await importSubject('32.0.7')
		isAxiosErrorMock.mockReturnValue(true)

		const error = {
			response: {
				status: 403,
			},
		}

		expect(isConfirmationError(error)).toBe(false)
		expect(loggerDebugMock).toBeCalledWith('Handle modern confirmation error based on header', { hasConfirmationHeader: false })
	})

	test('uses status based detection on Nextcloud 31', async () => {
		const { isConfirmationError } = await importSubject('31.0.8')
		isAxiosErrorMock.mockReturnValue(true)

		const error = {
			response: {
				status: 403,
			},
		}

		expect(isConfirmationError(error)).toBe(true)
		expect(loggerDebugMock).toBeCalledWith('Handle legacy confirmation error based on status code', { status: 403 })
	})
})
