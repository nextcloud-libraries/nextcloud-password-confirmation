/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from '@nextcloud/axios'

import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { spawnDialog } from '@nextcloud/vue/functions/dialog'
import PasswordDialogVue from './components/PasswordDialog.vue'
import { isConfirmationError } from './apiError.ts'
import { PwdConfirmationMode } from './globals.ts'
import { isPasswordConfirmationRequired } from './is-required.ts'
import { logger } from './utils/logger.ts'

declare module '@nextcloud/axios' {
	export interface AxiosRequestConfig {
		/** To use this property you need to use the addPasswordConfirmationInterceptors function. */
		confirmPassword?: PwdConfirmationMode
	}
}

/**
 * Track interceptor registration per axios instance.
 */
const INITIALIZED_INSTANCES = new WeakSet<AxiosInstance>()

type PromiseResolver<T> = {
	promise: Promise<T>
	resolve: (value: T | PromiseLike<T>) => void
	reject: (reason?: unknown) => void
}

const createPromiseResolver = <T>(): PromiseResolver<T> => Promise.withResolvers<T>()

/**
 * Use string properties rather than Symbols because Axios may clone/merge
 * configs internally. Regular config properties survive that process.
 */
const STRICT_VALIDATION_PROMISE = '__passwordConfirmationStrictValidation'
const STRICT_CONFIRMATION_RETRY = '__passwordConfirmationStrictRetry'

type StrictValidationRequestConfig = InternalAxiosRequestConfig & {
	[STRICT_VALIDATION_PROMISE]?: PromiseResolver<void>
	[STRICT_CONFIRMATION_RETRY]?: boolean
}

type PromptRequest = {
	mode: PwdConfirmationMode
	validate: (password: string) => Promise<void>
	resolver: PromiseResolver<void>
	settled: boolean
	validating: boolean
	strictRetry: boolean
}

type ActivePromptRequestWaiter = {
	resolve: (request: PromptRequest) => void
	reject: (reason?: unknown) => void
}

/**
 * A dialog represents one request session:
 *
 * - successful validation closes the dialog;
 * - the next queued request gets a fresh dialog;
 * - a Strict wrong-password response is the exception: the dialog remains
 *   open while the redispatched request replaces the failed active request.
 */
let _passwordDialog: Promise<boolean> | undefined
let _promptQueue: PromptRequest[] = []
let _activePromptRequest: PromptRequest | undefined
let _activePromptRequestWaiters: ActivePromptRequestWaiter[] = []
let _waitingForStrictRetry = false

function _asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error))
}

function _resolveIfUnsettled(request: PromptRequest) {
	if (request.settled) {
		return
	}

	request.settled = true
	request.resolver.resolve()
}

function _rejectIfUnsettled(request: PromptRequest, reason: Error) {
	if (request.settled) {
		return
	}

	request.settled = true
	request.resolver.reject(reason)
}

/**
 * Make a queued request active.
 *
 * While a Strict retry is pending, only its replacement request may become
 * active. Ordinary concurrent callers remain queued until the dialog closes.
 */
function _activateNextPromptRequest(onlyStrictRetry = false) {
	if (_activePromptRequest || _promptQueue.length === 0) {
		return
	}

	const index = onlyStrictRetry
		? _promptQueue.findIndex((request) => request.strictRetry)
		: 0

	if (index === -1) {
		return
	}

	const [next] = _promptQueue.splice(index, 1)
	if (!next) {
		return
	}

	_activePromptRequest = next

	const waiters = _activePromptRequestWaiters
	_activePromptRequestWaiters = []

	for (const waiter of waiters) {
		waiter.resolve(next)
	}
}

function _getActivePromptRequest(): Promise<PromptRequest> {
	if (_activePromptRequest) {
		return Promise.resolve(_activePromptRequest)
	}

	if (!_passwordDialog) {
		return Promise.reject(new Error('Dialog closed'))
	}

	return new Promise<PromptRequest>((resolve, reject) => {
		_activePromptRequestWaiters.push({ resolve, reject })
	})
}

function _rejectQueuedPromptRequests(reason: Error) {
	for (const request of _promptQueue) {
		_rejectIfUnsettled(request, reason)
	}

	_promptQueue = []
}

function _finishPasswordDialog(confirmed: boolean) {
	const current = _activePromptRequest

	_passwordDialog = undefined
	_activePromptRequest = undefined
	_waitingForStrictRetry = false

	if (!confirmed) {
		const closedError = new Error('Dialog closed')

		if (current) {
			_rejectIfUnsettled(current, closedError)
		}

		_rejectQueuedPromptRequests(closedError)

		for (const waiter of _activePromptRequestWaiters) {
			waiter.reject(closedError)
		}
		_activePromptRequestWaiters = []

		return
	}

	/**
	 * On success, the active request was already resolved by the dialog
	 * validation callback. The next request must receive a new dialog because
	 * PasswordDialog.vue emits close(true) after validation succeeds.
	 */
	_startNextPasswordDialog()
}

function _startNextPasswordDialog() {
	if (_passwordDialog || _activePromptRequest || _waitingForStrictRetry) {
		return
	}

	_activateNextPromptRequest()

	if (!_activePromptRequest) {
		return
	}

	const dialog = spawnDialog(PasswordDialogVue, {
		async validate(password: string) {
			const current = await _getActivePromptRequest()

			if (current.validating) {
				throw new Error('Password confirmation is already in progress')
			}

			current.validating = true

			try {
				await current.validate(password)

				/**
				 * PasswordDialog.vue closes with close(true) when this callback
				 * resolves. Do not promote another request here: it must receive
				 * its own dialog session after this one closes.
				 */
				_resolveIfUnsettled(current)
			} catch (error) {
				if (current.mode === PwdConfirmationMode.Strict) {
					/**
					 * The originating Strict request has already been dispatched.
					 * Its prompt request must not remain pending after response
					 * validation fails.
					 */
					_rejectIfUnsettled(current, _asError(error))

					if (isConfirmationError(error)) {
						/**
						 * The response interceptor redispatches the request. Keep
						 * PasswordDialog.vue open by rethrowing the confirmation
						 * error, but make room for the replacement request.
						 */
						if (_activePromptRequest === current) {
							_activePromptRequest = undefined
						}

						_waitingForStrictRetry = true

						/**
						 * The retry might already have entered the queue before
						 * this catch continuation runs.
						 */
						_activateNextPromptRequest(true)

						if (_activePromptRequest) {
							_waitingForStrictRetry = false
						}
					}
				}

				// PasswordDialog.vue keeps the dialog open for confirmation errors
				// and closes it as unsuccessful (i.e. emits close(false)) for all
				// other errors.
				throw error
			} finally {
				current.validating = false
			}
		},
	})

	_passwordDialog = dialog

	void dialog.then(
		(confirmed) => _finishPasswordDialog(confirmed),
		() => _finishPasswordDialog(false),
	)
}

/**
 * Queue password confirmation for one logical request.
 *
 * @param mode The password-confirmation strategy for this request.
 * @param validate Called with the password entered by the user.
 * @param strictRetry Whether this is the replacement for a failed Strict
 * confirmation attempt.
 */
function promptPassword(
	mode: PwdConfirmationMode,
	validate: (password: string) => Promise<void>,
	strictRetry = false,
): Promise<void> {
	const resolver = createPromiseResolver<void>()

	const request: PromptRequest = {
		mode,
		validate,
		resolver,
		settled: false,
		validating: false,
		strictRetry,
	}

	/**
	 * A Strict retry must be processed before normal concurrent requests,
	 * because it belongs to the dialog that remains open after a wrong
	 * password attempt.
	 */
	if (strictRetry) {
		_promptQueue.unshift(request)
	} else {
		_promptQueue.push(request)
	}

	if (strictRetry && _waitingForStrictRetry && !_activePromptRequest) {
		_activateNextPromptRequest(true)

		if (_activePromptRequest) {
			_waitingForStrictRetry = false
		}
	}

	_startNextPasswordDialog()

	return resolver.promise
}

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`.
 *
 * @return Promise that resolves when password is confirmed or not needed.
 * Rejects if password confirmation was cancelled.
 */
export async function confirmPassword(): Promise<void> {
	if (!isPasswordConfirmationRequired(PwdConfirmationMode.Lax)) {
		return
	}

	await promptPassword(PwdConfirmationMode.Lax, _confirmPassword)
}

/**
 * @param password - Password to be confirmed
 */
async function _confirmPassword(password: string) {
	logger.debug('Confirming password')

	const url = generateUrl('/login/confirm')
	const { data } = await axios.post(url, { password })
	window.nc_lastLogin = data.lastLogin

	logger.debug('Password confirmed')
}

/**
 * Add axios interceptors to an axios instance that ask for password
 * confirmation and attach it as Basic Auth for strict requests.
 *
 * @param instance The axios instance to add interceptors to.
 */
export function addPasswordConfirmationInterceptors(instance: AxiosInstance): void {
	if (INITIALIZED_INSTANCES.has(instance)) {
		return
	}

	INITIALIZED_INSTANCES.add(instance)

	instance.interceptors.request.use(async (config: StrictValidationRequestConfig) => {
		if (config.confirmPassword === undefined) {
			return config
		}

		const strictRetry = config[STRICT_CONFIRMATION_RETRY] === true
		delete config[STRICT_CONFIRMATION_RETRY]

		if (
			!strictRetry
			&& !isPasswordConfirmationRequired(config.confirmPassword)
		) {
			return config
		}

		const { promise, resolve, reject } = createPromiseResolver<InternalAxiosRequestConfig>()

		promptPassword(
			config.confirmPassword,
			async (password: string) => {
				switch (config.confirmPassword) {
					case PwdConfirmationMode.Lax:
						await _confirmPassword(password)
						resolve(config)
						return

					case PwdConfirmationMode.Strict: {
						const strictValidation = createPromiseResolver<void>()

						config[STRICT_VALIDATION_PROMISE] = strictValidation
						config.auth = {
							username: getCurrentUser()?.uid ?? '',
							password,
						}

						logger.debug('Adding password-confirmation auth to request', {
							url: config.url,
							method: config.method,
						})

						/**
						 * Dispatch the request now, but keep the dialog validation
						 * pending until the response interceptor settles this gate.
						 */
						resolve(config)
						return strictValidation.promise
					}
				}
			},
			strictRetry,
		).catch(reject)

		return promise
	})

	instance.interceptors.response.use(
		(response) => {
			if (response.config.confirmPassword !== PwdConfirmationMode.Strict) {
				return response
			}

			const config = response.config as StrictValidationRequestConfig
			const strictValidation = config[STRICT_VALIDATION_PROMISE]

			if (!strictValidation) {
				return response
			}

			logger.debug('Password confirmation succeeded', {
				url: config.url,
				method: config.method,
				status: response.status,
			})

			window.nc_lastLogin = Date.now() / 1000
			strictValidation.resolve()
			delete config[STRICT_VALIDATION_PROMISE]

			return response
		},
		(error) => {
			const config = error.config as StrictValidationRequestConfig | undefined

			if (!config || config.confirmPassword !== PwdConfirmationMode.Strict) {
				throw error
			}

			const strictValidation = config[STRICT_VALIDATION_PROMISE]

			if (!strictValidation) {
				logger.debug('Password confirmation was not required', {
					url: config.url,
					method: config.method,
					status: error.response?.status,
				})
				throw error
			}

			logger.debug('Password confirmation failed', {
				url: config.url,
				method: config.method,
				status: error.response?.status,
			})

			strictValidation.reject(error)
			delete config[STRICT_VALIDATION_PROMISE]

			if (isConfirmationError(error)) {
				/**
				 * Re-enter the request interceptor for a fresh Strict prompt
				 * attempt. The retry is marked so it replaces the failed request
				 * in the still-open password dialog.
				 */
				config.auth = undefined
				config[STRICT_CONFIRMATION_RETRY] = true

				logger.debug('Retrying request after failed password confirmation', {
					url: config.url,
					method: config.method,
					status: error.response?.status,
				})

				return instance.request(config)
			}

			throw error
		},
	)
}
