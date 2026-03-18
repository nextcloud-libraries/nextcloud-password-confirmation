/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { isAxiosError } from '@nextcloud/axios'
import { logger } from './utils/logger.ts'

const [NC_MAJOR_VERSION] = window._oc_config?.version.split('.').map(Number) ?? []

/**
 * Check if the given error is a confirmation error,
 * which means that the password was incorrect.
 *
 * @param error - The error to check
 */
export function isConfirmationError(error: unknown): boolean {
	if (!isAxiosError(error) || !error.response) {
		return false
	}

	const hasConfirmationHeader = error.response.headers?.['x-nextcloud-password-confirmation'] === 'true'
	if (NC_MAJOR_VERSION < 32) {
		logger.debug('Handle legacy confirmation error based on status code', { status: error.response.status })
		return error.response.status === 403
	}

	logger.debug('Handle modern confirmation error based on header', { hasConfirmationHeader })
	return hasConfirmationHeader
}
