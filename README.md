# @nextcloud/password-confirmation

[![npm](https://img.shields.io/npm/v/@nextcloud/password-confirmation?style=for-the-badge)](https://www.npmjs.com/package/@nextcloud/password-confirmation)
[![Build Status](https://img.shields.io/github/workflow/status/nextcloud/nextcloud-password-confirmation/Node?label=Build&style=for-the-badge)](https://github.com/nextcloud/nextcloud-password-confirmation/actions)

Promise-based password confirmation for Nextcloud.

This library exports a function that displays a password confirmation dialog when called and returns a promise. This makes it easier to integrate with other asynchronous operations.

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
