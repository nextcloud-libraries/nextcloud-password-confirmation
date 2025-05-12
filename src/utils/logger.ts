/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { getLoggerBuilder } from '@nextcloud/logger'

export const logger = getLoggerBuilder()
	.setApp('@nextcloud/password-confirmation')
	.detectLogLevel()
	.build()
