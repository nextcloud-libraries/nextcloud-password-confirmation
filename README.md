# @nextcloud/password-confirmation

[![REUSE status](https://api.reuse.software/badge/github.com/nextcloud-libraries/nextcloud-password-confirmation)](https://api.reuse.software/info/github.com/nextcloud-libraries/nextcloud-password-confirmation)
[![npm](https://img.shields.io/npm/v/@nextcloud/password-confirmation?style=for-the-badge)](https://www.npmjs.com/package/@nextcloud/password-confirmation)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nextcloud-libraries/nextcloud-password-confirmation/node.yml?branch=main&label=Build&style=for-the-badge)](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/actions?query=branch%3Amain)
[![License](https://img.shields.io/github/license/nextcloud-libraries/nextcloud-password-confirmation?style=for-the-badge)](https://github.com/nextcloud-libraries/nextcloud-password-confirmation/blob/main/LICENSE)

<!--
 - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

Promise-based password confirmation for Nextcloud.

This library exports a function that displays a password confirmation dialog when called and returns a promise. This makes it easier to integrate with other asynchronous operations.

## Versions compatibility

Nextcloud   | @nextcloud/vue | @nextcloud/password-confirmation
------------|----------------|---------------------------------
28.x        | 8.x            | 5.x
25.x - 27.x | 7.x            | 2.x - 4.x
< 25.x      | -              | 1.x

## Installation
```sh
npm add @nextcloud/password-confirmation
```

## Usage
```js
import { confirmPassword } from '@nextcloud/password-confirmation'
import '@nextcloud/password-confirmation/style.css' // Required for dialog styles

const foo = async () => {
    try {
        await confirmPassword()
        // Your logic
    } catch (error) {
        // Your error handling logic
    }
}
```

## API Reference
```ts
/**
 * Check if password confirmation is required according to the last confirmation time.
 * Use as a replacement of deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`.
 * Not needed if `confirmPassword()` can be used, because it checks requirements itself.
 *
 * @return {boolean} Whether password confirmation is required or was confirmed recently
 */
declare function isPasswordConfirmationRequired(): boolean

/**
 * Confirm password if needed.
 * Replacement of deprecated `OC.PasswordConfirmation.requirePasswordConfirmation(callback)`
 *
 * @return {Promise<void>} Promise that resolves when password is confirmed or not needded.
 *                         Rejects if password confirmation was cancelled
 *                         or confirmation is already in process.
 */
declare function confirmPassword(): Promise<void>
```

## Releasing

1) Create release branch
2) Adjust version using `npm version vx.y.z --no-git-tag-version`
3) Update `CHANGELOG.md`
4) Commit and open PR
5) After merge, pull latest main
6) `git tag vx.y.z`
7) `git push origin vx.y.z`
8) `npm ci && npm run build && npm publish`
