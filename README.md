# @nextcloud/password-confirmation

[![npm](https://img.shields.io/npm/v/@nextcloud/password-confirmation.svg)](https://www.npmjs.com/package/nextcloud-password-confirmation)
[![Build Status](https://travis-ci.org/nextcloud/nextcloud-password-confirmation.svg?branch=master)](https://travis-ci.org/nextcloud/nextcloud-password-confirmation)

Promise-based password confirmation wrapper for Nextcloud.

This tiny library wraps `OC.PasswordConfirmation.requiresPasswordConfirmation` and `OC.PasswordConfirmation.requirePasswordConfirmation` and exports it as a function that returns a promise. This makes it easier to integrate with other asynchronous operations.


## Installation
```sh
npm i --save nextcloud-password-confirmation
```

## Usage
```js
import confirmPassword from '@nextcloud/password-confirmation';

confirmPassword().then(() => {
    // your logic
});
```
